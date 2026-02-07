"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format, parseISO, subDays } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Sparkles,
  Wind,
  NotebookPen,
  Target,
  Trophy,
  Heart
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { QuickBreathingWidget } from "@/components/quick-breathing-widget";
import {
  useProfile,
  useCheckins,
  useThoughtRecords,
  useSkillCompletions,
  useSavedInsights
} from "@/hooks/use-user-data";
import { apiCheckinsPost, apiSavedInsightsPost } from "@/lib/api";
import {
  calculateGentleStreak,
  cn,
  formatDateLabel,
  getTodayDateISO,
  pickMostCommonEmotion
} from "@/lib/utils";
import { getUnlockedAchievements, getAchievementProgress } from "@/lib/achievements";

const MOOD_LABELS = ["Low", "", "", "", "", "Okay", "", "", "", "", "Great"];
const ENERGY_LABELS = ["Low", "", "", "", "", "Okay", "", "", "", "", "High"];

function parseNoteWithIntention(note: string): { intention: string; noteOnly: string } {
  const match = note.match(/^Intention:\s*(.+?)(?:\n\n|\n*$)/s);
  if (match) {
    return { intention: match[1].trim(), noteOnly: note.slice(match[0].length).trim() };
  }
  return { intention: "", noteOnly: note };
}

function buildNoteWithIntention(intention: string, noteOnly: string): string {
  const n = noteOnly.trim();
  const i = intention.trim();
  if (!i) return n || "";
  return n ? `Intention: ${i}\n\n${n}` : `Intention: ${i}`;
}

export default function TodayPage() {
  const { profile } = useProfile();
  const { checkins, mutate: mutateCheckins } = useCheckins();
  const { thoughtRecords } = useThoughtRecords();
  const { completions: skillCompletions } = useSkillCompletions();
  const { savedInsights, mutate: mutateInsights } = useSavedInsights();

  const todayISO = getTodayDateISO();
  const existingToday = useMemo(
    () => checkins.find((c) => c.dateISO === todayISO),
    [checkins, todayISO]
  );

  const [mood, setMood] = useState(existingToday?.mood0to10 ?? 5);
  const [energy, setEnergy] = useState(existingToday?.energy0to10 ?? 5);
  const [intention, setIntention] = useState("");
  const [note, setNote] = useState("");
  const [oneGoodThing, setOneGoodThing] = useState("");
  const [gratitudeThree, setGratitudeThree] = useState(["", "", ""]);
  const [breathingOpen, setBreathingOpen] = useState(false);

  useEffect(() => {
    if (!existingToday?.note) {
      setIntention("");
      setNote("");
      return;
    }
    const { intention: i, noteOnly: n } = parseNoteWithIntention(existingToday.note);
    setIntention(i);
    setNote(n);
  }, [existingToday]);

  const streak = useMemo(() => calculateGentleStreak(checkins), [checkins]);

  const last7Days = useMemo(() => {
    const days: { dateISO: string; label: string; hasCheckin: boolean; mood?: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(parseISO(`${todayISO}T00:00:00.000Z`), i);
      const dateISO = format(d, "yyyy-MM-dd");
      const hasCheckin = checkins.some((c) => c.dateISO === dateISO);
      const checkin = checkins.find((c) => c.dateISO === dateISO);
      days.push({
        dateISO,
        label: format(d, "EEE"),
        hasCheckin,
        mood: checkin?.mood0to10
      });
    }
    return days;
  }, [todayISO, checkins]);

  const suggestedActions = useMemo(() => {
    const actions: { title: string; description: string; href: string; icon: typeof Sparkles }[] = [];
    const hasThought = thoughtRecords?.length > 0;
    const recentSkill = skillCompletions?.[0];
    const skillRecent = recentSkill && Date.now() - new Date(recentSkill.createdAt).getTime() < 1000 * 60 * 60 * 24 * 2;

    if (!hasThought) {
      actions.push({
        title: "Start a Thought Record",
        description: "Capture one moment and gently test the thought.",
        href: "/thought-records/new",
        icon: NotebookPen
      });
    }
    if (!skillRecent) {
      actions.push({
        title: "Try a short skill",
        description: "Breathing or grounding can reset the moment.",
        href: "/skills",
        icon: Wind
      });
    }
    if (hasThought && skillRecent) {
      actions.push({
        title: "Another Thought Record",
        description: "Practice reframing with a new situation.",
        href: "/thought-records/new",
        icon: Target
      });
    }
    if (actions.length === 0) {
      actions.push({
        title: "Reflect or relax",
        description: "Open Coach or pick a skill.",
        href: "/coach",
        icon: Sparkles
      });
    }
    return actions.slice(0, 3);
  }, [thoughtRecords, skillCompletions]);

  const achievementContext = useMemo(
    () => ({
      checkins,
      thoughtRecordCount: thoughtRecords?.length ?? 0,
      skillCompletionCount: skillCompletions?.length ?? 0,
      streak,
      savedInsightCount: savedInsights?.length ?? 0,
      gratitudeCount: savedInsights?.filter((s) => s.note.startsWith("Gratitude:") || s.note.startsWith("Win:")).length ?? 0
    }),
    [checkins, thoughtRecords, skillCompletions, streak, savedInsights]
  );
  const unlockedAchievements = useMemo(() => getUnlockedAchievements(achievementContext), [achievementContext]);
  const achievementProgress = useMemo(() => getAchievementProgress(achievementContext), [achievementContext]);

  const recentWinsAndGratitude = useMemo(
    () =>
      (savedInsights ?? [])
        .filter((s) => s.note.startsWith("Win:") || s.note.startsWith("Gratitude:"))
        .slice(0, 5),
    [savedInsights]
  );

  const saveCheckin = async () => {
    const fullNote = buildNoteWithIntention(intention, note);
    await apiCheckinsPost({
      id: existingToday?.id,
      dateISO: todayISO,
      mood0to10: mood,
      energy0to10: energy,
      note: fullNote.trim() || undefined,
      createdAt: existingToday?.createdAt ?? new Date().toISOString()
    });
    await mutateCheckins();
    toast.success("Check-in saved.");
  };

  const saveOneGoodThing = async () => {
    const t = oneGoodThing.trim();
    if (!t) return;
    await apiSavedInsightsPost({ note: `Win: ${t}` });
    await mutateInsights();
    setOneGoodThing("");
    toast.success("Win saved.");
  };

  const saveGratitude = async () => {
    const parts = gratitudeThree.map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    await apiSavedInsightsPost({ note: `Gratitude: ${parts.join("; ")}` });
    await mutateInsights();
    setGratitudeThree(["", "", ""]);
    toast.success("Gratitude saved.");
  };

  return (
    <motion.div
      className="space-y-6 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <QuickBreathingWidget open={breathingOpen} onOpenChange={setBreathingOpen} />

      <PageHeader
        subtitle={
          profile?.preferredCheckinTime
            ? `A short reflection helps. Reminder: ${profile.preferredCheckinTime}.`
            : "A short reflection can help you notice patterns and pick a kind next step."
        }
        title={profile?.displayName ? `Today, ${profile.displayName}` : "Today"}
      />

      {/* Quick actions */}
      <motion.div
        className="flex flex-wrap gap-2 gap-y-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
      >
        <Button
          className="rounded-xl"
          variant="outline"
          onClick={() => setBreathingOpen(true)}
        >
          <Wind className="mr-2 h-4 w-4" />
          Breathe
        </Button>
        <Button asChild className="rounded-xl" variant="outline">
          <Link href="/thought-records/new">
            <NotebookPen className="mr-2 h-4 w-4" />
            Thought record
          </Link>
        </Button>
        <Button asChild className="rounded-xl" variant="outline">
          <Link href="/skills">
            <Sparkles className="mr-2 h-4 w-4" />
            Skills
          </Link>
        </Button>
      </motion.div>

      {/* 7-day strip with mood bars */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              This week
            </p>
            <div className="flex justify-between gap-1">
              {last7Days.map((day) => (
                <div
                  className={cn(
                    "flex flex-1 flex-col items-center rounded-xl py-2 transition",
                    day.dateISO === todayISO ? "bg-primary/10" : ""
                  )}
                  key={day.dateISO}
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium",
                      day.dateISO === todayISO ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {day.label}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {format(parseISO(day.dateISO), "d")}
                  </span>
                  <div className="mt-2 flex flex-col items-center gap-0.5">
                    {day.hasCheckin && day.mood != null ? (
                      <div
                        className="w-2 rounded-full min-h-[4px]"
                        style={{
                          height: `${8 + (day.mood / 10) * 16}px`,
                          backgroundColor: `hsl(168 52% ${Math.min(70, 30 + day.mood * 4)}%)`
                        }}
                      />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full border border-border bg-muted/50" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Daily check-in</CardTitle>
              <CardDescription>{formatDateLabel(`${todayISO}T00:00:00.000Z`)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="today-intention">
                  One-word intention (optional)
                </label>
                <Input
                  id="today-intention"
                  className="rounded-xl"
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="e.g. Calm, Focus, Kindness"
                  value={intention}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mood</span>
                  <span className="text-sm text-muted-foreground">{MOOD_LABELS[mood] || mood}/10</span>
                </div>
                <Slider max={10} min={0} onValueChange={setMood} value={mood} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Energy</span>
                  <span className="text-sm text-muted-foreground">{ENERGY_LABELS[energy] || energy}/10</span>
                </div>
                <Slider max={10} min={0} onValueChange={setEnergy} value={energy} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="today-note">
                  What&apos;s on your mind? (optional)
                </label>
                <Textarea
                  id="today-note"
                  className="min-h-[80px] resize-none rounded-xl"
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="A brief note about your day"
                  value={note}
                />
              </div>
              <Button className="w-full rounded-xl sm:w-auto" onClick={saveCheckin}>
                Save check-in
              </Button>
            </CardContent>
          </Card>

          {/* One good thing + Gratitude */}
          <Card className="mt-6 border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Wins & gratitude
              </CardTitle>
              <CardDescription>One good thing or three things you&apos;re grateful for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  className="rounded-xl"
                  onChange={(e) => setOneGoodThing(e.target.value)}
                  placeholder="One thing that went well..."
                  value={oneGoodThing}
                />
                <Button
                  className="rounded-xl shrink-0 sm:self-stretch sm:max-w-[120px]"
                  variant="secondary"
                  onClick={saveOneGoodThing}
                  disabled={!oneGoodThing.trim()}
                >
                  Save
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">3 good things</p>
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    className="rounded-xl"
                    placeholder={`Thing ${i + 1}`}
                    value={gratitudeThree[i]}
                    onChange={(e) => {
                      const next = [...gratitudeThree];
                      next[i] = e.target.value;
                      setGratitudeThree(next);
                    }}
                  />
                ))}
                <Button
                  className="w-full rounded-xl"
                  variant="outline"
                  onClick={saveGratitude}
                  disabled={gratitudeThree.every((s) => !s.trim())}
                >
                  Save gratitude
                </Button>
              </div>
              {recentWinsAndGratitude.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Recent</p>
                  <ul className="space-y-1 text-sm">
                    {recentWinsAndGratitude.map((s) => (
                      <li key={s.id} className="truncate">
                        {s.note.startsWith("Win:") ? "✨ " : "🙏 "}
                        {s.note.replace(/^(Win|Gratitude):\s*/, "")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-primary" />
                  Streak
                </CardTitle>
                <CardDescription>Consistency beats perfection.</CardDescription>
              </CardHeader>
              <CardContent>
                <motion.p
                  className="text-3xl font-semibold text-primary"
                  key={streak}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  {streak} day{streak === 1 ? "" : "s"}
                </motion.p>
                {streak >= 3 && (
                  <p className="mt-2 text-sm text-primary">You&apos;re building a habit. Keep going.</p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  Every check-in is useful. Missed days are part of real life.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {suggestedActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.03 }}
              >
                <Card className="border-primary/20 bg-primary/5 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-primary" />
                      {action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    <Button asChild className="w-full rounded-xl" variant="secondary">
                      <Link href={action.href}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  {achievementProgress.unlocked} of {achievementProgress.total} unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {unlockedAchievements.slice(0, 8).map((a) => (
                    <span
                      key={a.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2 py-1 text-xs"
                      title={a.description}
                    >
                      <span>{a.icon}</span>
                      <span className="font-medium">{a.title}</span>
                    </span>
                  ))}
                </div>
                {unlockedAchievements.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Complete check-ins, thought records, and skills to unlock badges.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Highlights</CardTitle>
            <CardDescription>Patterns, not judgments.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Link href="/thought-records">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4 transition hover:bg-muted/50">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Thought records
                </p>
                <p className="mt-1 text-2xl font-semibold">{thoughtRecords.length}</p>
              </div>
            </Link>
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Most common emotion
              </p>
              <p className="mt-1 text-2xl font-semibold">{pickMostCommonEmotion(thoughtRecords)}</p>
            </div>
            <Link href="/skills">
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4 transition hover:bg-muted/50">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Skills completed
                </p>
                <p className="mt-1 flex items-center text-2xl font-semibold">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" />
                  {skillCompletions.length}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
