/**
 * Enterprise AI configuration: feature flags, limits, timeouts, model defaults.
 * All AI features should read from here for consistent, auditable behavior.
 */

export const AI_CONFIG = {
  /** Default model when not overridden by request or env */
  defaultModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  /** Max tokens per completion (cap for safety and cost) */
  maxTokensDefault: 520,
  maxTokensCap: 800,

  /** Default temperature; lower = more deterministic */
  defaultTemperature: 0.4,

  /** Timeout for any single LLM call (ms). Fail fast in serverless. */
  requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 25_000),

  /** Retries for transient failures (network, 5xx) */
  maxRetries: Number(process.env.AI_MAX_RETRIES ?? 2),

  /** Per-user rate limit for general AI endpoints (requests per minute) */
  aiRpmPerUser: Number(process.env.AI_RPM_PER_USER ?? 30),

  /** Feature flags (env). When false, AI features return fallback or 503. */
  features: {
    coach: process.env.AI_FEATURE_COACH !== "false",
    weeklyRecap: process.env.AI_FEATURE_WEEKLY_RECAP !== "false",
    todaySuggestions: process.env.AI_FEATURE_TODAY_SUGGESTIONS !== "false",
    skillsRecommend: process.env.AI_FEATURE_SKILLS_RECOMMEND !== "false",
    affirmation: process.env.AI_FEATURE_AFFIRMATION !== "false"
  },

  /** Audit: when set, AI calls are logged (e.g. to stdout or external). */
  auditEnabled: process.env.AI_AUDIT_ENABLED === "true"
} as const;

export type AIFeatureKey = keyof typeof AI_CONFIG.features;

export function isAIFeatureEnabled(feature: AIFeatureKey): boolean {
  return Boolean(process.env.OPENAI_API_KEY) && AI_CONFIG.features[feature];
}
