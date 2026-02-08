/**
 * Reframe AI layer (LangChain + LangGraph). Enterprise-grade: config, runner, audit.
 *
 * - runCoach(request) — coach/distortions/socratic/reframe (timeout, retries, audit).
 * - createChatModel(settings), isAIAvailable(), isAIFeatureEnabled(feature).
 * - App AI: runWeeklyRecap, runTodaySuggestions, runSkillsRecommend, runAffirmation (see app-features).
 * - Config: AI_CONFIG, AI feature flags. Runner: runWithTimeoutAndRetry.
 */

export { runCoach, type CoachRunResult } from "@/lib/ai/coach";
export { coachGraph, invokeCoachGraph } from "@/lib/ai/coach-graph";
export { createChatModel, isAIAvailable } from "@/lib/ai/model";
export { toLangChainMessages, buildSystemMessages } from "@/lib/ai/messages";
export { runWithTimeoutAndRetry } from "@/lib/ai/runner";
export { AI_CONFIG, isAIFeatureEnabled, type AIFeatureKey } from "@/lib/ai/config";
export { auditAICall } from "@/lib/ai/audit";
export {
  runWeeklyRecap,
  runTodaySuggestions,
  runSkillsRecommend,
  runAffirmation,
  type WeeklyRecapInput,
  type TodaySuggestionsInput,
  type SkillsRecommendInput,
  type AffirmationInput
} from "@/lib/ai/app-features";
export {
  COACH_MODE_SCHEMAS,
  CoachOutputSchema,
  DistortionsOutputSchema,
  SocraticOutputSchema,
  ReframeOutputSchema,
  VALID_SKILL_IDS,
  WeeklyRecapSchema,
  TodaySuggestionsSchema,
  SkillsRecommendSchema,
  AffirmationSchema,
  type CoachOutput,
  type DistortionsOutput,
  type SocraticOutput,
  type ReframeOutput,
  type WeeklyRecapOutput,
  type TodaySuggestionsOutput,
  type SkillsRecommendOutput,
  type AffirmationOutput
} from "@/lib/ai/schemas";
