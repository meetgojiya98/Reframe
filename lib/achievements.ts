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
  | "gratitude"
  | "anchor_saved"
  | "reflection_saved"
  | "looking_forward_saved";

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
  anchorCount: number;
  reflectionCount: number;
  lookingForwardCount: number;
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
  },
  {
    id: "anchor_saved",
    title: "Anchored",
    description: "Saved today's anchor phrase",
    icon: "⚓",
    check: (ctx) => ctx.anchorCount >= 1
  },
  {
    id: "reflection_saved",
    title: "Reflector",
    description: "Saved an evening reflection",
    icon: "🌙",
    check: (ctx) => ctx.reflectionCount >= 1
  },
  {
    id: "looking_forward_saved",
    title: "Looking ahead",
    description: "Saved something you're looking forward to",
    icon: "🌅",
    check: (ctx) => ctx.lookingForwardCount >= 1
  }
];

export function getUnlockedAchievements(ctx: AchievementContext): AchievementDef[] {
  return ACHIEVEMENT_DEFS.filter((def) => def.check(ctx));
}

export function getAchievementProgress(ctx: AchievementContext): { unlocked: number; total: number } {
  const unlocked = ACHIEVEMENT_DEFS.filter((def) => def.check(ctx)).length;
  return { unlocked, total: ACHIEVEMENT_DEFS.length };
}

/** Progress toward an achievement: current value and target. Used for "nearly there" UI. */
export function getAchievementProgressDetail(
  def: AchievementDef,
  ctx: AchievementContext
): { current: number; target: number; label: string } | null {
  const targets: Record<AchievementId, { getCurrent: (c: AchievementContext) => number; target: number; label: string }> = {
    first_checkin: { getCurrent: (c) => c.checkins.length, target: 1, label: "check-ins" },
    streak_3: { getCurrent: (c) => c.streak, target: 3, label: "day streak" },
    streak_7: { getCurrent: (c) => c.streak, target: 7, label: "day streak" },
    streak_14: { getCurrent: (c) => c.streak, target: 14, label: "day streak" },
    first_thought_record: { getCurrent: (c) => c.thoughtRecordCount, target: 1, label: "thought records" },
    thought_records_5: { getCurrent: (c) => c.thoughtRecordCount, target: 5, label: "thought records" },
    thought_records_10: { getCurrent: (c) => c.thoughtRecordCount, target: 10, label: "thought records" },
    first_skill: { getCurrent: (c) => c.skillCompletionCount, target: 1, label: "skills" },
    skills_5: { getCurrent: (c) => c.skillCompletionCount, target: 5, label: "skills" },
    week_complete: { getCurrent: (c) => c.streak, target: 7, label: "day streak" },
    gratitude: { getCurrent: (c) => c.gratitudeCount, target: 1, label: "gratitude or win" },
    anchor_saved: { getCurrent: (c) => c.anchorCount, target: 1, label: "anchor saved" },
    reflection_saved: { getCurrent: (c) => c.reflectionCount, target: 1, label: "reflection" },
    looking_forward_saved: { getCurrent: (c) => c.lookingForwardCount, target: 1, label: "looking forward" }
  };
  const t = targets[def.id];
  if (!t) return null;
  const current = Math.min(t.getCurrent(ctx), t.target);
  return { current, target: t.target, label: t.label };
}

/** Unlocked achievements are excluded. Sorted by progress (closest to target first). */
export function getNearlyThereAchievements(ctx: AchievementContext, limit = 3): Array<AchievementDef & { current: number; target: number; label: string }> {
  const unlockedIds = new Set(getUnlockedAchievements(ctx).map((a) => a.id));
  const withProgress = ACHIEVEMENT_DEFS.filter((d) => !unlockedIds.has(d.id))
    .map((def) => {
      const p = getAchievementProgressDetail(def, ctx);
      if (!p) return null;
      return { ...def, ...p };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((a, b) => b.current / b.target - a.current / a.target);
  return withProgress.slice(0, limit);
}

/** All achievements with unlocked flag and progress (for full achievements page). */
export function getAllAchievementsWithProgress(
  ctx: AchievementContext
): Array<AchievementDef & { unlocked: boolean; current: number; target: number; label: string }> {
  const unlockedIds = new Set(getUnlockedAchievements(ctx).map((a) => a.id));
  return ACHIEVEMENT_DEFS.map((def) => {
    const p = getAchievementProgressDetail(def, ctx);
    const unlocked = unlockedIds.has(def.id);
    return {
      ...def,
      unlocked,
      current: p?.current ?? 0,
      target: p?.target ?? 1,
      label: p?.label ?? ""
    };
  });
}
