import { z } from "zod";

const GOAL_OPTIONS = [
  "stress", "confidence", "focus", "sleep", "social_anxiety",
  "overthinking", "motivation", "relationships", "change", "other"
] as const;

const DISTORTION_KEYS = [
  "all_or_nothing", "overgeneralization", "mental_filter", "disqualifying_positive",
  "jumping_to_conclusions", "catastrophizing", "emotional_reasoning", "should_statements",
  "labeling", "personalization"
] as const;

const SAFETY_CATEGORIES = ["self_harm_risk", "violence_risk", "other"] as const;
const SAFETY_SOURCES = ["coach", "thought_record"] as const;

const dateISORegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

export const checkinPostSchema = z.object({
  id: z.string().max(64).optional(),
  dateISO: z.string().regex(dateISORegex, "dateISO must be YYYY-MM-DD"),
  mood0to10: z.coerce.number().int().min(0).max(10),
  energy0to10: z.coerce.number().int().min(0).max(10),
  note: z.string().max(2000).optional(),
  createdAt: z.string().optional(),
});

export const profilePutSchema = z.object({
  displayName: z.string().max(255).optional(),
  goals: z.array(z.enum(GOAL_OPTIONS)).optional(),
  aiEnabled: z.boolean().optional(),
  preferredCheckinTime: z.string().regex(timeRegex, "preferredCheckinTime must be HH:MM").optional(),
});

const emotionSchema = z.object({
  name: z.string().max(100),
  intensity0to100: z.number().int().min(0).max(100),
});

export const thoughtRecordPostSchema = z.object({
  id: z.string().max(64).optional(),
  createdAt: z.string().optional(),
  situation: z.string().min(1, "situation is required").max(5000),
  thoughts: z.string().min(1, "thoughts are required").max(5000),
  emotions: z.array(emotionSchema).max(20).default([]),
  distortions: z.array(z.enum(DISTORTION_KEYS)).max(20).default([]),
  evidenceFor: z.string().max(3000).default(""),
  evidenceAgainst: z.string().max(3000).default(""),
  reframe: z.string().max(3000).default(""),
  actionStep: z.string().max(1000).default(""),
});

export const thoughtRecordPutSchema = z.object({
  situation: z.string().max(5000).optional(),
  thoughts: z.string().max(5000).optional(),
  emotions: z.array(emotionSchema).max(20).optional(),
  distortions: z.array(z.enum(DISTORTION_KEYS)).max(20).optional(),
  evidenceFor: z.string().max(3000).optional(),
  evidenceAgainst: z.string().max(3000).optional(),
  reframe: z.string().max(3000).optional(),
  actionStep: z.string().max(1000).optional(),
});

export const skillCompletionPostSchema = z.object({
  id: z.string().max(64).optional(),
  skillId: z.string().min(1, "skillId is required").max(64),
  reflection: z.string().max(2000).optional(),
  createdAt: z.string().optional(),
});

export const savedInsightPostSchema = z.object({
  id: z.string().max(64).optional(),
  note: z.string().max(280),
  createdAt: z.string().optional(),
});

export const safetyEventPostSchema = z.object({
  id: z.string().max(64).optional(),
  category: z.enum(SAFETY_CATEGORIES).default("other"),
  source: z.enum(SAFETY_SOURCES).default("coach"),
  createdAt: z.string().optional(),
});

export type CheckinPostBody = z.infer<typeof checkinPostSchema>;
export type ProfilePutBody = z.infer<typeof profilePutSchema>;
export type ThoughtRecordPostBody = z.infer<typeof thoughtRecordPostSchema>;
export type ThoughtRecordPutBody = z.infer<typeof thoughtRecordPutSchema>;
export type SkillCompletionPostBody = z.infer<typeof skillCompletionPostSchema>;
export type SavedInsightPostBody = z.infer<typeof savedInsightPostSchema>;
export type SafetyEventPostBody = z.infer<typeof safetyEventPostSchema>;
