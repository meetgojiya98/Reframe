import { ChatOpenAI } from "@langchain/openai";
import type { CoachSettings } from "@/lib/types";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_MAX_TOKENS = 520;

/**
 * Create a LangChain ChatOpenAI instance from env + optional request settings.
 * Use this anywhere in the app for a consistent, configurable model.
 */
export function createChatModel(settings?: Partial<CoachSettings>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const model = settings?.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const temperature = settings?.temperature ?? DEFAULT_TEMPERATURE;
  const maxTokens = settings?.maxTokens ?? DEFAULT_MAX_TOKENS;

  return new ChatOpenAI({
    openAIApiKey: apiKey,
    model,
    temperature,
    maxTokens: Math.min(maxTokens, 520),
    modelKwargs: {}
  });
}

/**
 * Check if AI is available (e.g. for feature flags or fallback UI).
 */
export function isAIAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
