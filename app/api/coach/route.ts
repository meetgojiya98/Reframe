import OpenAI from "openai";
import { z } from "zod";
import { NextResponse } from "next/server";
import { buildSafeResponse, detectHighRiskFromMessages } from "@/lib/safety";
import { withApiHandler } from "@/lib/api-handler";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { SafetyCategory } from "@/lib/types";
import { runCoach, isAIAvailable } from "@/lib/ai";

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
      maxTokens: z.number().int().min(64).max(520).optional()
    })
    .optional()
});

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

    return moderationCategoryFromResult(result.categories as unknown as Record<string, boolean>) ?? "other";
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

export const POST = withApiHandler(async (request: Request) => {
  if (!botProtectionPass(request.headers)) {
    return NextResponse.json({ error: "Bot protection check failed." }, { status: 403 });
  }

  const clientIp = getClientIp(request.headers);
  const rate = await checkRateLimit(clientIp);

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

  if (!isAIAvailable()) {
    return NextResponse.json(
      { error: "OpenAI is not configured. Add OPENAI_API_KEY to enable AI Coach." },
      { status: 503 }
    );
  }

  try {
    const result = await runCoach(parsedBody);

    if (parsedBody.mode === "coach") {
      return NextResponse.json({
        message: result.message ?? "",
        toolSuggestion: result.toolSuggestion
      });
    }

    if (parsedBody.mode === "distortions") {
      return NextResponse.json({ message: { items: result.items ?? [] } });
    }

    if (parsedBody.mode === "socratic") {
      return NextResponse.json({ message: { questions: result.questions ?? [] } });
    }

    return NextResponse.json({
      message: {
        balancedThoughts: result.balancedThoughts ?? ["A more balanced view may be available."],
        actionStep: result.actionStep ?? "Take one small step in the next 10 minutes."
      }
    });
  } catch {
    return NextResponse.json(
      { error: "AI request failed. Please try again in a moment." },
      { status: 500 }
    );
  }
});
