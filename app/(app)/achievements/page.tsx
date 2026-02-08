"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCheckins,
  useThoughtRecords,
  useSkillCompletions,
  useSavedInsights
} from "@/hooks/use-user-data";
import { calculateGentleStreak } from "@/lib/utils";
import { getAllAchievementsWithProgress, getAchievementProgress } from "@/lib/achievements";

export default function AchievementsPage() {
  const { checkins } = useCheckins();
  const { thoughtRecords } = useThoughtRecords();
  const { completions: skillCompletions } = useSkillCompletions();
  const { savedInsights } = useSavedInsights();

  const streak = useMemo(() => calculateGentleStreak(checkins), [checkins]);

  const achievementContext = useMemo(
    () => ({
      checkins: checkins ?? [],
      thoughtRecordCount: thoughtRecords?.length ?? 0,
      skillCompletionCount: skillCompletions?.length ?? 0,
      streak,
      savedInsightCount: savedInsights?.length ?? 0,
      gratitudeCount: savedInsights?.filter((s) => s.note.startsWith("Gratitude:") || s.note.startsWith("Win:")).length ?? 0,
      anchorCount: savedInsights?.filter((s) => s.note.startsWith("Anchor:")).length ?? 0,
      reflectionCount: savedInsights?.filter((s) => s.note.startsWith("Reflection:")).length ?? 0,
      lookingForwardCount: savedInsights?.filter((s) => s.note.startsWith("Looking forward:")).length ?? 0
    }),
    [checkins, thoughtRecords, skillCompletions, streak, savedInsights]
  );

  const all = useMemo(() => getAllAchievementsWithProgress(achievementContext), [achievementContext]);
  const progress = useMemo(() => getAchievementProgress(achievementContext), [achievementContext]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="rounded-xl" asChild>
          <Link href="/today">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Today
          </Link>
        </Button>
      </div>
      <PageHeader
        badge="Progress"
        subtitle="Unlock badges by checking in, completing thought records, and practicing skills."
        title="Achievements"
      />

      <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                <Trophy className="h-6 w-6 text-primary" />
              </span>
              <div>
                <p className="font-semibold">{progress.unlocked} of {progress.total} unlocked</p>
                <p className="text-sm text-muted-foreground">Keep going—every small step counts.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {all.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className={`overflow-hidden rounded-2xl ${a.unlocked ? "border-primary/25 bg-primary/5" : "border-border/80"}`}>
              <CardContent className="flex flex-wrap items-center gap-4 p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl">
                  {a.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                  {!a.unlocked && a.target > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.current}/{a.target} {a.label}
                    </p>
                  )}
                </div>
                <div className="w-24 shrink-0">
                  {a.unlocked ? (
                    <span className="inline-block rounded-lg bg-primary/20 px-2 py-1 text-xs font-medium text-primary">
                      Unlocked
                    </span>
                  ) : (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/50 transition-all"
                        style={{ width: `${Math.min(100, (a.current / a.target) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
