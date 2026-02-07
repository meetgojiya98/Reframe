import type { DailyCheckin } from "./types";

export type AchievementId =
  | "first_checkin"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "first_thought_record"
  | "thought_records_5"
  | "thought_records_10"
  | "first_skill"
  | "skills_5"
  | "week_complete"
  | "gratitude";

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  icon: string; // emoji or lucide name
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  checkins: DailyCheckin[];
  thoughtRecordCount: number;
  skillCompletionCount: number;
  streak: number;
  savedInsightCount: number;
  gratitudeCount: number;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first_checkin",
    title: "First step",
    description: "Completed your first check-in",
    icon: "🌱",
    check: (ctx) => ctx.checkins.length >= 1
  },
  {
    id: "streak_3",
    title: "Building habit",
    description: "3-day check-in streak",
    icon: "🔥",
    check: (ctx) => ctx.streak >= 3
  },
  {
    id: "streak_7",
    title: "Week strong",
    description: "7-day check-in streak",
    icon: "⭐",
    check: (ctx) => ctx.streak >= 7
  },
  {
    id: "streak_14",
    title: "Two weeks",
    description: "14-day check-in streak",
    icon: "💪",
    check: (ctx) => ctx.streak >= 14
  },
  {
    id: "first_thought_record",
    title: "Thought explorer",
    description: "Completed your first thought record",
    icon: "📝",
    check: (ctx) => ctx.thoughtRecordCount >= 1
  },
  {
    id: "thought_records_5",
    title: "Pattern spotter",
    description: "5 thought records completed",
    icon: "🔍",
    check: (ctx) => ctx.thoughtRecordCount >= 5
  },
  {
    id: "thought_records_10",
    title: "Reframe regular",
    description: "10 thought records completed",
    icon: "✨",
    check: (ctx) => ctx.thoughtRecordCount >= 10
  },
  {
    id: "first_skill",
    title: "Skill starter",
    description: "Completed your first skill",
    icon: "🧘",
    check: (ctx) => ctx.skillCompletionCount >= 1
  },
  {
    id: "skills_5",
    title: "Practice makes progress",
    description: "5 skills completed",
    icon: "🌟",
    check: (ctx) => ctx.skillCompletionCount >= 5
  },
  {
    id: "week_complete",
    title: "Full week",
    description: "Check-ins on 7 days in a row",
    icon: "📅",
    check: (ctx) => ctx.streak >= 7
  },
  {
    id: "gratitude",
    title: "Grateful",
    description: "Saved a gratitude or win",
    icon: "🙏",
    check: (ctx) => ctx.gratitudeCount >= 1
  }
];

export function getUnlockedAchievements(ctx: AchievementContext): AchievementDef[] {
  return ACHIEVEMENT_DEFS.filter((def) => def.check(ctx));
}

export function getAchievementProgress(ctx: AchievementContext): { unlocked: number; total: number } {
  const unlocked = ACHIEVEMENT_DEFS.filter((def) => def.check(ctx)).length;
  return { unlocked, total: ACHIEVEMENT_DEFS.length };
}
