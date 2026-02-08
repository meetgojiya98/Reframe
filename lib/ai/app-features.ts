/**
 * App-wide AI features: weekly recap, today suggestions, skills recommend, affirmation.
 * Each uses structured output and the shared model config.
 */

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createChatModel } from "@/lib/ai/model";
import {
  APP_AI_SYSTEM,
  WEEKLY_RECAP_PROMPT,
  TODAY_SUGGESTIONS_PROMPT,
  SKILLS_RECOMMEND_PROMPT,
  AFFIRMATION_PROMPT
} from "@/lib/ai/prompts-app";
import {
  WeeklyRecapSchema,
  TodaySuggestionsSchema,
  SkillsRecommendSchema,
  AffirmationSchema,
  VALID_SKILL_IDS
} from "@/lib/ai/schemas";
import type { WeeklyRecapOutput, TodaySuggestionsOutput, SkillsRecommendOutput, AffirmationOutput } from "@/lib/ai/schemas";

export interface WeeklyRecapInput {
  windowDays: number;
  checkinCount: number;
  avgMood: string | null;
  thoughtRecordCount: number;
  skillCount: number;
  streak?: number;
}

export async function runWeeklyRecap(input: WeeklyRecapInput): Promise<WeeklyRecapOutput> {
  const text = `Last ${input.windowDays} days: ${input.checkinCount} check-ins, average mood ${input.avgMood ?? "—"}, ${input.thoughtRecordCount} thought records, ${input.skillCount} skills completed.${input.streak ? ` Current streak: ${input.streak} days.` : ""}`;
  const model = createChatModel().withStructuredOutput(WeeklyRecapSchema, { name: "weekly_recap", strict: true });
  const result = await model.invoke([
    new SystemMessage(APP_AI_SYSTEM),
    new SystemMessage(WEEKLY_RECAP_PROMPT),
    new HumanMessage(text)
  ]);
  return result as WeeklyRecapOutput;
}

export interface TodaySuggestionsInput {
  mood: number;
  energy: number;
  goals?: string[];
  recentActions?: string;
  intention?: string;
}

export async function runTodaySuggestions(input: TodaySuggestionsInput): Promise<TodaySuggestionsOutput> {
  const parts = [
    `Mood: ${input.mood}/10, Energy: ${input.energy}/10.`,
    input.goals?.length ? `Goals: ${input.goals.join(", ")}.` : "",
    input.recentActions ? `Recent: ${input.recentActions}.` : "",
    input.intention ? `Today's intention: ${input.intention}.` : ""
  ].filter(Boolean);
  const model = createChatModel().withStructuredOutput(TodaySuggestionsSchema, {
    name: "today_suggestions",
    strict: true
  });
  const result = await model.invoke([
    new SystemMessage(APP_AI_SYSTEM),
    new SystemMessage(TODAY_SUGGESTIONS_PROMPT),
    new HumanMessage(parts.join(" ") || "No extra context.")
  ]);
  return result as TodaySuggestionsOutput;
}

export interface SkillsRecommendInput {
  goals: string[];
  recentMood?: number;
  recentThemes?: string;
}

export async function runSkillsRecommend(input: SkillsRecommendInput): Promise<SkillsRecommendOutput> {
  const parts = [
    `Goals: ${input.goals.join(", ") || "general wellness"}.`,
    input.recentMood != null ? `Recent mood: ${input.recentMood}/10.` : "",
    input.recentThemes ? `Recent themes: ${input.recentThemes}.` : ""
  ].filter(Boolean);
  const model = createChatModel().withStructuredOutput(SkillsRecommendSchema, {
    name: "skills_recommend",
    strict: true
  });
  const result = (await model.invoke([
    new SystemMessage(APP_AI_SYSTEM),
    new SystemMessage(SKILLS_RECOMMEND_PROMPT),
    new HumanMessage(parts.join(" ") || "Recommend skills.")
  ])) as SkillsRecommendOutput;
  const validSet = new Set(VALID_SKILL_IDS);
  const filtered = result.skillIds.filter((id) => validSet.has(id as (typeof VALID_SKILL_IDS)[number]));
  return { skillIds: filtered.slice(0, 4), reason: result.reason };
}

export interface AffirmationInput {
  context?: string;
}

export async function runAffirmation(input: AffirmationInput): Promise<AffirmationOutput> {
  const model = createChatModel().withStructuredOutput(AffirmationSchema, { name: "affirmation", strict: true });
  const result = await model.invoke([
    new SystemMessage(APP_AI_SYSTEM),
    new SystemMessage(AFFIRMATION_PROMPT),
    new HumanMessage(input.context ? `Context: ${input.context}` : "No specific context.")
  ]);
  return result as AffirmationOutput;
}
