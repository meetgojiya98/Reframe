import { z } from "zod";

/** Structured output for coach mode: one message + optional tool suggestion */
export const CoachOutputSchema = z.object({
  message: z.string().describe("Short coaching reply with one question; natural and specific"),
  toolSuggestion: z
    .object({
      type: z.enum(["thought_record", "skill", "problem_step"]),
      label: z.string(),
      description: z.string(),
      skillId: z.string().optional()
    })
    .optional()
});
export type CoachOutput = z.infer<typeof CoachOutputSchema>;

/** Single distortion item */
export const DistortionItemSchema = z.object({
  distortion: z.string().describe("CBT distortion name"),
  reason: z.string().describe("One sentence tying the distortion to their words")
});

/** Structured output for distortions mode */
export const DistortionsOutputSchema = z.object({
  items: z.array(DistortionItemSchema).max(4)
});
export type DistortionsOutput = z.infer<typeof DistortionsOutputSchema>;

/** Structured output for Socratic mode */
export const SocraticOutputSchema = z.object({
  questions: z.array(z.string()).min(1).max(8).describe("Socratic questions, each 16 words or fewer")
});
export type SocraticOutput = z.infer<typeof SocraticOutputSchema>;

/** Structured output for reframe mode */
export const ReframeOutputSchema = z.object({
  balancedThoughts: z.array(z.string()).min(1).max(3).describe("Balanced alternative thoughts"),
  actionStep: z.string().describe("One tiny, concrete action for the next 10-60 minutes")
});
export type ReframeOutput = z.infer<typeof ReframeOutputSchema>;

export const COACH_MODE_SCHEMAS = {
  coach: CoachOutputSchema,
  distortions: DistortionsOutputSchema,
  socratic: SocraticOutputSchema,
  reframe: ReframeOutputSchema
} as const;

// --- App-wide AI (insights, today, skills, affirmation) ---

export const WeeklyRecapSchema = z.object({
  recap: z.string().describe("2-3 sentence encouraging recap of the period")
});
export type WeeklyRecapOutput = z.infer<typeof WeeklyRecapSchema>;

export const TodaySuggestionsSchema = z.object({
  dailyTip: z.string().describe("One short CBT-aligned daily tip"),
  suggestedActions: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        href: z.enum(["/coach", "/thought-records/new", "/skills", "/insights"])
      })
    )
    .min(1)
    .max(3)
});
export type TodaySuggestionsOutput = z.infer<typeof TodaySuggestionsSchema>;

export const VALID_SKILL_IDS = [
  "box-breathing",
  "grounding-54321",
  "name-the-feeling",
  "worry-time-container",
  "behavioral-activation",
  "values-clarification",
  "sleep-winddown",
  "self-compassion-break",
  "urge-surfing",
  "two-column-balance",
  "micro-boundary",
  "three-good-things"
] as const;

export const SkillsRecommendSchema = z.object({
  skillIds: z.array(z.string()).min(2).max(4),
  reason: z.string().optional()
});
export type SkillsRecommendOutput = z.infer<typeof SkillsRecommendSchema>;

export const AffirmationSchema = z.object({
  affirmation: z.string().describe("One short first-person affirmation")
});
export type AffirmationOutput = z.infer<typeof AffirmationSchema>;
