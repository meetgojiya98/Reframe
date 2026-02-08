import { AIMessage, type BaseMessage } from "@langchain/core/messages";
import { BASE_SYSTEM_PROMPT, modePrompt } from "@/lib/prompts";
import { createChatModel } from "@/lib/ai/model";
import { toLangChainMessages, buildSystemMessages } from "@/lib/ai/messages";
import { COACH_MODE_SCHEMAS } from "@/lib/ai/schemas";
import { runWithTimeoutAndRetry } from "@/lib/ai/runner";
import type { CoachMode, CoachRequest } from "@/lib/types";

const MESSAGE_MAX_LENGTH = 520;
const COACH_FALLBACK_MESSAGE =
  "I hear you. When you're ready, you could try putting one thought into words, or pick a pathway above to focus on thought challenging, problem solving, or a quick skill.";

const VALID_TOOL_TYPES = ["thought_record", "skill", "problem_step"] as const;

function extractModeCategory(mode: CoachMode): string {
  if (mode === "coach") return "coach";
  if (mode === "distortions") return "distortion assist";
  if (mode === "socratic") return "Socratic questions";
  return "balanced reframe";
}

function toShortText(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function truncateWords(input: string, maxWords: number): string {
  const words = input.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

/** Sanitize coach message: collapse newlines, trim, enforce min length. */
function sanitizeCoachMessage(value: string): string {
  const trimmed = value.replace(/\n{3,}/g, "\n\n").trim();
  if (trimmed.length < 10) return "";
  return trimmed;
}

/** Validate and normalize toolSuggestion from raw output. */
function normalizeToolSuggestion(raw: unknown): CoachRunResult["toolSuggestion"] {
  if (raw == null || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const type = typeof o.type === "string" && VALID_TOOL_TYPES.includes(o.type as (typeof VALID_TOOL_TYPES)[number]) ? o.type : undefined;
  const label = typeof o.label === "string" ? o.label.trim().slice(0, 80) : "";
  const description = typeof o.description === "string" ? o.description.trim().slice(0, 200) : "";
  if (!type || !label || !description) return undefined;
  const skillId = typeof o.skillId === "string" ? o.skillId.trim().slice(0, 80) : undefined;
  return { type, label, description, skillId: skillId || undefined };
}

/**
 * Fallback for coach mode when structured output fails: invoke model as plain chat and use response text as message.
 * Returns { message, toolSuggestion } or null if invocation fails.
 */
async function runCoachFallback(
  allMessages: BaseMessage[],
  settings: CoachRequest["settings"]
): Promise<{ message: string; toolSuggestion?: undefined } | null> {
  try {
    const model = createChatModel(settings);
    const response = await runWithTimeoutAndRetry(
      () => model.invoke(allMessages),
      { feature: "coach", metadata: { mode: "coach", fallback: true } }
    );
    const content = response instanceof AIMessage ? response.content : (response as { content?: string })?.content;
    const text = typeof content === "string" ? content.trim() : "";
    if (!text || text.length < 10) return null;
    return { message: text };
  } catch {
    return null;
  }
}

export interface CoachRunResult {
  message?: string;
  toolSuggestion?: { type: string; label: string; description: string; skillId?: string };
  items?: Array<{ distortion: string; reason: string }>;
  questions?: string[];
  balancedThoughts?: string[];
  actionStep?: string;
}

/**
 * Run the coach AI for the given request. Uses LangChain with structured output (Zod).
 * Wrapped with enterprise runner (timeout, retries, audit).
 */
export async function runCoach(
  request: CoachRequest,
  options?: { userId?: string | null }
): Promise<CoachRunResult> {
  const { mode, messages, context, settings } = request;
  const schema = COACH_MODE_SCHEMAS[mode];
  const systemPrompt = `${BASE_SYSTEM_PROMPT}\nTask category: ${extractModeCategory(mode)}.`;
  const modeSpecificPrompt = modePrompt(mode, request);

  const systemMessages = buildSystemMessages(systemPrompt, modeSpecificPrompt);
  const conversation = toLangChainMessages(messages);
  const allMessages = [...systemMessages, ...conversation];

  let raw: unknown;
  try {
    const model = createChatModel(settings).withStructuredOutput(schema, {
      name: mode,
      strict: true
    });
    raw = await runWithTimeoutAndRetry(
      () => model.invoke(allMessages),
      { feature: "coach", userId: options?.userId, metadata: { mode } }
    );
  } catch (structuredError) {
    if (mode === "coach") {
      raw = await runCoachFallback(allMessages, settings);
      if (raw === null) {
        return {
          message: COACH_FALLBACK_MESSAGE,
          toolSuggestion: undefined
        };
      }
    } else {
      throw structuredError;
    }
  }

  if (mode === "coach") {
    const out = raw as { message?: string; toolSuggestion?: unknown };
    let message = sanitizeCoachMessage(typeof out.message === "string" ? out.message : "");
    if (!message) message = COACH_FALLBACK_MESSAGE;
    return {
      message: message.slice(0, MESSAGE_MAX_LENGTH),
      toolSuggestion: normalizeToolSuggestion(out.toolSuggestion)
    };
  }

  if (mode === "distortions") {
    const out = raw as { items?: Array<{ distortion?: string; reason?: string }> };
    const rawItems = Array.isArray(out.items) ? out.items : [];
    const items = rawItems.slice(0, 4).map((item) => ({
      distortion: toShortText(item?.distortion, "Possible pattern", 80),
      reason: toShortText(item?.reason, "May match the thought pattern.", 160)
    }));
    return { items };
  }

  if (mode === "socratic") {
    const out = raw as { questions?: string[] };
    let questions = (Array.isArray(out.questions) ? out.questions : [])
      .map((q) => truncateWords(toShortText(q, "", 180), 16))
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
    return { questions };
  }

  // reframe
  const out = raw as { balancedThoughts?: string[]; actionStep?: string };
  const rawThoughts = Array.isArray(out.balancedThoughts) ? out.balancedThoughts : [];
  const balancedThoughts = rawThoughts
    .map((t) => toShortText(t, "", 200))
    .filter(Boolean)
    .slice(0, 3);
  return {
    balancedThoughts: balancedThoughts.length ? balancedThoughts : ["A more balanced view may be available."],
    actionStep: toShortText(out.actionStep, "Take one small step in the next 10 minutes.", 160)
  };
}
