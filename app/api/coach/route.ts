import OpenAI from "openai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { BASE_SYSTEM_PROMPT, modePrompt } from "@/lib/prompts";
import { buildSafeResponse, detectHighRiskFromMessages } from "@/lib/safety";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { CoachMode, SafetyCategory } from "@/lib/types";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 20 * 1024;
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH)
});

const RequestSchema = z.object({
  mode: z.enum(["coach", "distortions", "socratic", "reframe"]),
  messages: z.array(MessageSchema).min(1).max(MAX_MESSAGES),
  context: z
    .object({
      pathway: z.enum(["thought_challenging", "problem_solving", "emotion_regulation"]).optional(),
      userName: z.string().max(80).optional(),
      selectedText: z.string().max(2000).optional()
    })
    .optional(),
  settings: z
    .object({
      model: z.string().max(80).optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxTokens: z.number().int().min(64).max(450).optional()
    })
    .optional()
});

function extractModeCategory(mode: CoachMode) {
  if (mode === "coach") return "coach";
  if (mode === "distortions") return "distortion assist";
  if (mode === "socratic") return "Socratic questions";
  return "balanced reframe";
}

function parseJsonOutput(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

function toShortText(value: unknown, fallback = "", max = 220) {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function truncateWords(input: string, maxWords: number) {
  const words = input.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function moderationCategoryFromResult(result: Record<string, boolean>): SafetyCategory | null {
  if (result["self-harm"] || result["self-harm/intent"] || result["self-harm/instructions"]) {
    return "self_harm_risk";
  }
  if (result.violence || result["violence/graphic"]) {
    return "violence_risk";
  }
  return null;
}

async function optionalModerationCheck(openai: OpenAI | null, input: string) {
  if (!openai) return null;

  try {
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input
    });

    const result = moderation.results[0];
    if (!result?.flagged) return null;

    return moderationCategoryFromResult(result.categories as Record<string, boolean>) ?? "other";
  } catch {
    return null;
  }
}

function botProtectionPass(headers: Headers) {
  const enabled = process.env.BOT_PROTECTION_ENABLED === "true";
  if (!enabled) return true;

  const expected = process.env.BOT_PROTECTION_TOKEN;
  if (!expected) return false;

  const provided = headers.get("x-reframe-human");
  return provided === expected;
}

export async function POST(request: Request) {
  if (!botProtectionPass(request.headers)) {
    return NextResponse.json({ error: "Bot protection check failed." }, { status: 403 });
  }

  const clientIp = getClientIp(request.headers);
  const rate = checkRateLimit(clientIp);

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please wait a moment before trying again.",
        cooldownMs: rate.retryAfterMs
      },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil(rate.retryAfterMs / 1000))
        }
      }
    );
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request payload is too large." }, { status: 413 });
  }

  let parsedBody: z.infer<typeof RequestSchema>;
  try {
    parsedBody = RequestSchema.parse(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const highRiskByHeuristic = detectHighRiskFromMessages(parsedBody.messages);

  const openaiKey = process.env.OPENAI_API_KEY;
  const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

  const moderationCategory = await optionalModerationCheck(
    openai,
    parsedBody.messages.map((message) => message.content).join("\n")
  );

  const flaggedCategory = highRiskByHeuristic ?? moderationCategory;

  if (flaggedCategory) {
    return NextResponse.json({
      blocked: true,
      category: flaggedCategory,
      safeResponse: buildSafeResponse()
    });
  }

  if (!openai) {
    return NextResponse.json(
      { error: "OpenAI is not configured. Add OPENAI_API_KEY to enable AI Coach." },
      { status: 503 }
    );
  }

  const model = parsedBody.settings?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  const temperature = parsedBody.settings?.temperature ?? 0.5;
  const maxTokens = parsedBody.settings?.maxTokens ?? 450;

  const systemPrompt = `${BASE_SYSTEM_PROMPT}\nTask category: ${extractModeCategory(parsedBody.mode)}.`;
  const modeSpecificPrompt = modePrompt(parsedBody.mode, parsedBody);

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: Math.min(maxTokens, 450),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: modeSpecificPrompt },
        ...parsedBody.messages
      ]
    });

    const modelText = completion.choices[0]?.message?.content ?? "";

    if (!modelText) {
      return NextResponse.json({ error: "Empty response from model." }, { status: 502 });
    }

    const parsedOutput = parseJsonOutput(modelText);

    if (parsedBody.mode === "coach") {
      const message = typeof parsedOutput.message === "string" ? parsedOutput.message : modelText;
      return NextResponse.json({
        message: message.slice(0, 450),
        toolSuggestion: parsedOutput.toolSuggestion
      });
    }

    if (parsedBody.mode === "distortions") {
      const rawItems = Array.isArray(parsedOutput.items) ? parsedOutput.items : [];
      const items = rawItems.slice(0, 4).map((item) => ({
        distortion: toShortText(item?.distortion, "Possible pattern", 80),
        reason: toShortText(item?.reason, "May match the thought pattern.", 160)
      }));
      return NextResponse.json({ message: { items } });
    }

    if (parsedBody.mode === "socratic") {
      const rawQuestions = Array.isArray(parsedOutput.questions) ? parsedOutput.questions : [];
      let questions = rawQuestions
        .map((question) => truncateWords(toShortText(question, "", 180), 16))
        .filter(Boolean)
        .slice(0, 8);

      if (questions.length < 5) {
        questions = [
          "What evidence supports this thought?",
          "What evidence challenges this thought?",
          "What would I tell a close friend?",
          "Is there a more balanced way to view this?",
          "What is one helpful step right now?"
        ];
      }

      return NextResponse.json({ message: { questions } });
    }

    const rawThoughts = Array.isArray(parsedOutput.balancedThoughts) ? parsedOutput.balancedThoughts : [];
    const balancedThoughts = rawThoughts
      .map((thought) => toShortText(thought, "", 200))
      .filter(Boolean)
      .slice(0, 3);

    return NextResponse.json({
      message: {
        balancedThoughts: balancedThoughts.length ? balancedThoughts : ["A more balanced view may be available."],
        actionStep: toShortText(parsedOutput.actionStep, "Take one small step in the next 10 minutes.", 160)
      }
    });
  } catch {
    return NextResponse.json(
      { error: "AI request failed. Please try again in a moment." },
      { status: 500 }
    );
  }
}
