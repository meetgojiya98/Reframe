"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format, parseISO, subDays } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Footprints,
  Sparkles,
  Wind,
  NotebookPen,
  Target,
  Trophy,
  Heart,
  Sunrise,
  Moon,
  Calendar,
  Shield,
  Bookmark
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CheckinReminderBanner } from "@/components/checkin-reminder-banner";
import { QuickGroundingWidget } from "@/components/quick-grounding-widget";
import { TodaysAnchor } from "@/components/todays-anchor";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularGauge } from "@/components/ui/circular-gauge";
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
import { apiCheckinsPost, apiSavedInsightsPost, apiAiTodaySuggestions } from "@/lib/api";
import {
  calculateGentleStreak,
  cn,
  formatDateLabel,
  getTodayDateISO,
  pickMostCommonEmotion
} from "@/lib/utils";
import { getUnlockedAchievements, getAchievementProgress, getNearlyThereAchievements } from "@/lib/achievements";
import { getRandomAffirmation, getDailyAffirmation } from "@/lib/affirmations";

const MOOD_LABELS = ["Low", "", "", "", "", "Okay", "", "", "", "", "Great"];
const ENERGY_LABELS = ["Low", "", "", "", "", "Okay", "", "", "", "", "High"];

const DAILY_TIPS = [
  "Noticing how you feel is already a skill.",
  "One small step today still counts.",
  "Thoughts are not facts—you can gently question them.",
  "Kindness to yourself is part of the practice.",
  "Check-ins build awareness over time, not perfection.",
  "It's okay to pause and breathe before responding.",
  "Your pattern of practice matters more than any single day."
];

const CHECKIN_TAG_OPTIONS = ["work", "social", "exercise", "rest", "alone", "outdoors", "creative"] as const;

function parseNoteWithIntention(note: string): { intention: string; noteOnly: string; sleep: number | null; tags: string[] } {
  let rest = note;
  let sleep: number | null = null;
  let tags: string[] = [];
  const sleepMatch = rest.match(/^Sleep:\s*(\d{1,2})(?:\s|$|\n)/);
  if (sleepMatch) {
    const val = parseInt(sleepMatch[1], 10);
    if (val >= 0 && val <= 10) sleep = val;
    rest = rest.slice(sleepMatch[0].length).trim();
  }
  const tagsMatch = rest.match(/^Tags:\s*([^\n]+?)(?:\n\n|\n*$)/);
  if (tagsMatch) {
    tags = tagsMatch[1].split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    rest = rest.slice(tagsMatch[0].length).trim();
  }
  const match = rest.match(/^Intention:\s*([\s\S]+?)(?:\n\n|\n*$)/);
  if (match) {
    return { intention: match[1].trim(), noteOnly: rest.slice(match[0].length).trim(), sleep, tags };
  }
  return { intention: "", noteOnly: rest, sleep, tags };
}

function buildNoteWithIntention(intention: string, noteOnly: string, sleep: number | null, tags: string[]): string {
  const parts: string[] = [];
  if (sleep != null && sleep >= 0 && sleep <= 10) parts.push(`Sleep: ${sleep}`);
  if (tags.length > 0) parts.push(`Tags: ${tags.join(", ")}`);
  const i = intention.trim();
  const n = noteOnly.trim();
  if (i) parts.push(`Intention: ${i}`);
  const body = n || (parts.length > 0 ? "" : "");
  if (body) parts.push(body);
  return parts.join("\n\n");
}

export default function TodayPage() {
  const { profile } = useProfile();
  const { checkins, mutate: mutateCheckins } = useCheckins();
  const { thoughtRecords } = useThoughtRecords();
  const { completions: skillCompletions, mutate: mutateSkillCompletions } = useSkillCompletions();
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
  const [groundingOpen, setGroundingOpen] = useState(false);
  const [sleep, setSleep] = useState<number | null>(null);
  const [lookingForward, setLookingForward] = useState("");
  const [eveningReflection, setEveningReflection] = useState("");
  const [weeklyFocus, setWeeklyFocus] = useState("");
  const [randomAffirmation, setRandomAffirmation] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [customPhrase, setCustomPhrase] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<{
    dailyTip: string;
    suggestedActions: Array<{ title: string; description: string; href: string }>;
  } | null>(null);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);

  useEffect(() => {
    if (!existingToday?.note) {
      setIntention("");
      setNote("");
      setSleep(null);
      setTags([]);
      return;
    }
    const { intention: i, noteOnly: n, sleep: s, tags: t } = parseNoteWithIntention(existingToday.note);
    setIntention(i);
    setNote(n);
    setSleep(s);
    setTags(t);
  }, [existingToday]);

  useEffect(() => {
    if (!profile?.aiEnabled) return;
    setAiSuggestionsLoading(true);
    const recent =
      thoughtRecords?.length || skillCompletions?.length
        ? `${thoughtRecords?.length ?? 0} thought records, ${skillCompletions?.length ?? 0} skills recently.`
        : undefined;
    apiAiTodaySuggestions({
      mood: existingToday?.mood0to10 ?? mood,
      energy: existingToday?.energy0to10 ?? energy,
      goals: profile?.goals,
      recentActions: recent,
      intention: intention.trim() || undefined
    })
      .then(setAiSuggestions)
      .catch(() => setAiSuggestions(null))
      .finally(() => setAiSuggestionsLoading(false));
  }, [profile?.aiEnabled, profile?.goals]);

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

  const daysSinceLastThoughtRecord = useMemo(() => {
    if (!thoughtRecords?.length) return null;
    const last = [...thoughtRecords].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const days = Math.floor((Date.now() - new Date(last.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  }, [thoughtRecords]);

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
    } else if (daysSinceLastThoughtRecord != null && daysSinceLastThoughtRecord >= 7) {
      actions.push({
        title: "Another Thought Record",
        description: `It's been ${daysSinceLastThoughtRecord} days since your last one. Practice helps.`,
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
    if (hasThought && skillRecent && (daysSinceLastThoughtRecord == null || daysSinceLastThoughtRecord < 7)) {
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
  }, [thoughtRecords, skillCompletions, daysSinceLastThoughtRecord]);

  const actionsToShow =
    aiSuggestions?.suggestedActions?.length &&
    aiSuggestions.suggestedActions.every(
      (a) => ["/coach", "/thought-records/new", "/skills", "/insights"].includes(a.href)
    )
      ? aiSuggestions.suggestedActions.map((a) => ({
          title: a.title,
          description: a.description,
          href: a.href,
          icon: Sparkles
        }))
      : suggestedActions;

  const achievementContext = useMemo(
    () => ({
      checkins,
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
  const unlockedAchievements = useMemo(() => getUnlockedAchievements(achievementContext), [achievementContext]);
  const achievementProgress = useMemo(() => getAchievementProgress(achievementContext), [achievementContext]);
  const nearlyThereAchievements = useMemo(() => getNearlyThereAchievements(achievementContext, 3), [achievementContext]);

  const recentWinsAndGratitude = useMemo(
    () =>
      (savedInsights ?? [])
        .filter((s) => s.note.startsWith("Win:") || s.note.startsWith("Gratitude:"))
        .slice(0, 5),
    [savedInsights]
  );

  const dailyTip = useMemo(
    () =>
      aiSuggestions?.dailyTip ??
      DAILY_TIPS[parseISO(todayISO).getDate() % DAILY_TIPS.length],
    [todayISO, aiSuggestions?.dailyTip]
  );

  const thisWeekFocus = useMemo(() => {
    const weekStart = format(subDays(parseISO(`${todayISO}T00:00:00.000Z`), parseISO(todayISO).getDay()), "yyyy-MM-dd");
    return (savedInsights ?? [])
      .filter((s) => s.note.startsWith("Weekly focus:"))
      .filter((s) => s.createdAt.slice(0, 10) >= weekStart)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.note.replace(/^Weekly focus:\s*/, "");
  }, [savedInsights, todayISO]);

  const saveCheckin = async () => {
    const fullNote = buildNoteWithIntention(intention, note, sleep, tags);
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

  const saveLookingForward = async () => {
    const t = lookingForward.trim();
    if (!t) return;
    await apiSavedInsightsPost({ note: `Looking forward: ${t}` });
    await mutateInsights();
    setLookingForward("");
    toast.success("Saved.");
  };

  const saveEveningReflection = async () => {
    const t = eveningReflection.trim();
    if (!t) return;
    await apiSavedInsightsPost({ note: `Reflection: ${t}` });
    await mutateInsights();
    setEveningReflection("");
    toast.success("Reflection saved.");
  };

  const saveWeeklyFocus = async () => {
    const t = weeklyFocus.trim();
    if (!t) return;
    await apiSavedInsightsPost({ note: `Weekly focus: ${t}` });
    await mutateInsights();
    setWeeklyFocus("");
    toast.success("Weekly focus saved.");
  };

  const showRandomAffirmation = () => {
    setRandomAffirmation(getRandomAffirmation(todayISO));
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const saveFavoritePhrase = async (phrase: string) => {
    const t = phrase.trim();
    if (!t) return;
    await apiSavedInsightsPost({ note: `Favorite: ${t}` });
    await mutateInsights();
    setCustomPhrase("");
    toast.success("Saved to My phrases.");
  };

  const favoritePhrases = useMemo(
    () => (savedInsights ?? []).filter((s) => s.note.startsWith("Favorite:")).map((s) => s.note.replace(/^Favorite:\s*/, "")),
    [savedInsights]
  );
  const whenHardPhrase = useMemo(
    () =>
      favoritePhrases.length > 0
        ? favoritePhrases[(todayISO.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % favoritePhrases.length)]
        : null,
    [favoritePhrases, todayISO]
  );

  useEffect(() => {
    if (streak < 3 || typeof window === "undefined") return;
    const key = "reframe_streak_celebrated";
    const last = parseInt(sessionStorage.getItem(key) ?? "0", 10);
    const milestones = [3, 7, 14];
    const hit = milestones.find((m) => streak >= m && m > last);
    if (hit) {
      sessionStorage.setItem(key, String(Math.max(hit, last)));
      if (hit === 14) toast.success("🔥 14-day streak! You're building something real.");
      else if (hit === 7) toast.success("⭐ 7 days in a row. Well done.");
      else if (hit === 3) toast.success("🌱 3-day streak. Small steps add up.");
    }
  }, [streak]);

  return (
    <motion.div
      className="space-y-8 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <QuickBreathingWidget open={breathingOpen} onOpenChange={setBreathingOpen} />
      <QuickGroundingWidget
        open={groundingOpen}
        onOpenChange={setGroundingOpen}
        onComplete={() => mutateSkillCompletions()}
      />

      <CheckinReminderBanner />

      {/* Hero */}
      <motion.section
        className="relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground sm:text-xs">
            {format(parseISO(`${todayISO}T00:00:00.000Z`), "EEEE, MMMM d")}
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {profile?.displayName ? `Hi, ${profile.displayName}` : "Today"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {!existingToday && (() => {
              const [h, m] = (profile?.preferredCheckinTime ?? "10:00").split(":").map(Number);
              const preferredMins = (h ?? 10) * 60 + (m ?? 0);
              const now = new Date();
              const currentMins = now.getHours() * 60 + now.getMinutes();
              if (currentMins >= preferredMins)
                return "You haven't checked in today—when you're ready, a quick note helps.";
              return null;
            })() ?? (profile?.preferredCheckinTime
              ? `A short reflection helps. You asked for a reminder around ${profile.preferredCheckinTime}.`
              : "A short reflection can help you notice patterns and choose a kind next step.")}
          </p>
          {thisWeekFocus && (
            <p className="mt-2 text-sm font-medium text-primary">
              This week you&apos;re focusing on: {thisWeekFocus}
            </p>
          )}
        </div>
        <div className="absolute right-4 top-4 opacity-10 sm:right-8 sm:top-8">
          <Sparkles className="h-14 w-14 text-primary" />
        </div>
      </motion.section>

      {/* Quick actions */}
      <motion.div
        className="flex flex-wrap gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <Button variant="outline" onClick={() => setBreathingOpen(true)}>
          <Wind className="mr-2 h-4 w-4" />
          Breathe
        </Button>
        <Button variant="outline" onClick={() => setGroundingOpen(true)}>
          <Footprints className="mr-2 h-4 w-4" />
          Ground
        </Button>
        <Button asChild variant="outline">
          <Link href="/thought-records/new">
            <NotebookPen className="mr-2 h-4 w-4" />
            Thought record
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/skills">
            <Sparkles className="mr-2 h-4 w-4" />
            Skills
          </Link>
        </Button>
      </motion.div>

      {/* When it's hard */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.065 }}
      >
        <Card className="overflow-hidden rounded-xl border-primary/15 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <Shield className="h-4 w-4 text-primary" />
              </span>
              When it&apos;s hard
            </CardTitle>
            <CardDescription>Quick ways to steady yourself.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => setBreathingOpen(true)}>
                <Wind className="mr-1.5 h-3.5 w-3.5" />
                Breathe
              </Button>
              <Button variant="secondary" size="sm" className="rounded-lg" onClick={() => setGroundingOpen(true)}>
                <Footprints className="mr-1.5 h-3.5 w-3.5" />
                Ground
              </Button>
              <Button asChild variant="secondary" size="sm" className="rounded-lg">
                <Link href="/coach">
                  <Target className="mr-1.5 h-3.5 w-3.5" />
                  Talk to Coach
                </Link>
              </Button>
            </div>
            {whenHardPhrase ? (
              <p className="text-sm italic text-foreground">
                &ldquo;{whenHardPhrase}&rdquo;
              </p>
            ) : null}
            <p className="text-xs italic text-muted-foreground">
              &ldquo;This moment will pass.&rdquo; &middot; &ldquo;I can take one small step.&rdquo; &middot; &ldquo;I don&apos;t have to have it all figured out.&rdquo;
            </p>
          </CardContent>
        </Card>
      </motion.section>

      {/* 7-day mood strip */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="overflow-hidden rounded-xl">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                This week
              </p>
              <p className="text-xs text-muted-foreground">
                <AnimatedCounter value={last7Days.filter((d) => d.hasCheckin).length} duration={0.4} /> of 7 days checked in
              </p>
            </div>
            <div className="flex justify-between gap-1">
              {last7Days.map((day) => (
                <div
                  className={cn(
                    "flex flex-1 flex-col items-center rounded-xl py-3 transition-colors",
                    day.dateISO === todayISO ? "bg-primary/15 ring-1 ring-primary/20" : "hover:bg-muted/50"
                  )}
                  key={day.dateISO}
                >
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      day.dateISO === todayISO ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {day.label}
                  </span>
                  <span className="mt-0.5 text-xs text-muted-foreground">
                    {format(parseISO(day.dateISO), "d")}
                  </span>
                  <div className="mt-2 flex flex-col items-center gap-0.5">
                    {day.hasCheckin && day.mood != null ? (
                      <motion.div
                        className="w-3 rounded-full min-h-[6px] origin-bottom"
                        style={{
                          height: `${10 + (day.mood / 10) * 20}px`,
                          backgroundColor: `hsl(166 48% ${Math.min(65, 28 + day.mood * 4)}%)`
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.1 + last7Days.indexOf(day) * 0.02, duration: 0.3 }}
                      />
                    ) : (
                      <div className="h-3 w-3 rounded-full border-2 border-dashed border-border bg-muted/50" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Daily check-in</CardTitle>
              <CardDescription>{formatDateLabel(`${todayISO}T00:00:00.000Z`)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="today-intention">
                  One-word intention (optional)
                </label>
                <Input
                  id="today-intention"
                  className="rounded-xl border-2"
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder="e.g. Calm, Focus, Kindness"
                  value={intention}
                />
              </div>
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div className="space-y-3 rounded-xl border-2 border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">Mood</span>
                    <CircularGauge value={mood} max={10} size={56} strokeWidth={6} className="shrink-0" valueClassName="text-primary" />
                    <span className="stat-value text-lg font-semibold text-primary min-w-[3ch]">{MOOD_LABELS[mood] || mood}/10</span>
                  </div>
                  <Slider max={10} min={0} onValueChange={setMood} value={mood} className="py-2" />
                </div>
                <div className="space-y-3 rounded-xl border-2 border-border/60 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">Energy</span>
                    <CircularGauge value={energy} max={10} size={56} strokeWidth={6} className="shrink-0" valueClassName="text-accent-foreground" />
                    <span className="stat-value text-lg font-semibold text-accent-foreground min-w-[3ch]">{ENERGY_LABELS[energy] || energy}/10</span>
                  </div>
                  <Slider max={10} min={0} onValueChange={setEnergy} value={energy} className="py-2" />
                </div>
              </div>
              <div className="space-y-3 rounded-xl border-2 border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-muted-foreground">Sleep (optional)</span>
                  <span className="stat-value text-lg font-semibold text-muted-foreground min-w-[3ch]">
                    {sleep != null ? `${sleep}/10` : "—"}
                  </span>
                </div>
                <Slider
                  max={10}
                  min={0}
                  onValueChange={(v) => setSleep(v)}
                  value={sleep ?? 5}
                  className="py-2"
                />
                <p className="text-[11px] text-muted-foreground">Slide to log sleep quality; leave in middle to skip.</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Tag your day (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {CHECKIN_TAG_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        "rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-colors",
                        tags.includes(tag)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="today-note">
                  What&apos;s on your mind? (optional)
                </label>
                <Textarea
                  id="today-note"
                  className="min-h-[88px] resize-none rounded-xl border-2"
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="A brief note about your day"
                  value={note}
                />
              </div>
              <Button className="w-full rounded-xl shadow-sm sm:w-auto min-h-[48px] touch-manipulation" onClick={saveCheckin}>
                Save check-in
              </Button>
              <p className="text-center text-xs text-muted-foreground italic">&ldquo;{dailyTip}&rdquo;</p>
            </CardContent>
          </Card>

          {/* Wins & Gratitude */}
          <Card className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
                  <Heart className="h-4 w-4 text-primary" />
                </span>
                Wins & gratitude
              </CardTitle>
              <CardDescription>One good thing or three things you&apos;re grateful for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  className="flex-1 rounded-xl border-2"
                  onChange={(e) => setOneGoodThing(e.target.value)}
                  placeholder="One thing that went well..."
                  value={oneGoodThing}
                />
                <Button
                  className="rounded-xl shrink-0 sm:max-w-[120px]"
                  variant="secondary"
                  onClick={saveOneGoodThing}
                  disabled={!oneGoodThing.trim()}
                >
                  Save win
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">3 good things</p>
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    className="rounded-xl border-2"
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
                <div className="rounded-xl border border-primary/15 bg-card/80 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
                  <ul className="space-y-2 text-sm">
                    {recentWinsAndGratitude.map((s) => (
                      <li key={s.id} className="flex items-start gap-2 truncate">
                        <span>{s.note.startsWith("Win:") ? "✨" : "🙏"}</span>
                        <span className="min-w-0 flex-1">{s.note.replace(/^(Win|Gratitude):\s*/, "")}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weekly focus, Looking forward, Evening reflection */}
          <Card className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
                  <Calendar className="h-4 w-4 text-primary" />
                </span>
                This week & today
              </CardTitle>
              <CardDescription>Set a focus for the week, one thing you&apos;re looking forward to, or a short reflection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {thisWeekFocus && (
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">This week&apos;s focus</p>
                  <p className="mt-1 font-medium text-foreground">{thisWeekFocus}</p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Set a weekly focus</p>
                <div className="flex gap-2">
                  <Input
                    className="flex-1 rounded-xl border-2"
                    placeholder="e.g. Rest, Boundaries, One small step..."
                    value={weeklyFocus}
                    onChange={(e) => setWeeklyFocus(e.target.value)}
                  />
                  <Button className="rounded-xl shrink-0" variant="secondary" onClick={saveWeeklyFocus} disabled={!weeklyFocus.trim()}>
                    Save
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sunrise className="h-3.5 w-3.5" /> One thing you&apos;re looking forward to
                </p>
                <div className="flex gap-2">
                  <Input
                    className="flex-1 rounded-xl border-2"
                    placeholder="Today or this week..."
                    value={lookingForward}
                    onChange={(e) => setLookingForward(e.target.value)}
                  />
                  <Button className="rounded-xl shrink-0" variant="secondary" onClick={saveLookingForward} disabled={!lookingForward.trim()}>
                    Save
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5" /> How was your day? (one line)
                </p>
                <div className="flex gap-2">
                  <Input
                    className="flex-1 rounded-xl border-2"
                    placeholder="A short reflection..."
                    value={eveningReflection}
                    onChange={(e) => setEveningReflection(e.target.value)}
                  />
                  <Button className="rounded-xl shrink-0" variant="secondary" onClick={saveEveningReflection} disabled={!eveningReflection.trim()}>
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-5">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="overflow-hidden rounded-xl border border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20">
                    <Flame className="h-4 w-4 text-primary" />
                  </span>
                  Streak
                </CardTitle>
                <CardDescription>Consistency beats perfection.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="stat-value text-4xl font-bold text-primary">
                  <AnimatedCounter value={streak} duration={0.6} /> day{streak === 1 ? "" : "s"}
                </p>
                {streak >= 3 && (
                  <p className="mt-2 text-sm font-medium text-primary">You&apos;re building a habit. Keep going.</p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  Every check-in counts. Missed days are part of real life.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <TodaysAnchor
            dateISO={todayISO}
            mutateInsights={mutateInsights}
            aiEnabled={profile?.aiEnabled}
            intention={intention}
          />
            {randomAffirmation && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-primary/20 bg-primary/5 p-4"
              >
                <p className="font-serif text-sm italic text-foreground">&ldquo;{randomAffirmation}&rdquo;</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={showRandomAffirmation}>
                    Another phrase
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setRandomAffirmation(null)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            )}
            {!randomAffirmation && (
              <Button variant="outline" size="sm" className="w-full rounded-xl" onClick={showRandomAffirmation}>
                <Sparkles className="mr-2 h-4 w-4" />
                Another phrase
              </Button>
            )}

            {/* My phrases */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Card className="overflow-hidden rounded-xl border border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                      <Bookmark className="h-4 w-4 text-primary" />
                    </span>
                    My phrases
                  </CardTitle>
                  <CardDescription>Save phrases that help you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => saveFavoritePhrase(getDailyAffirmation(todayISO))}
                    >
                      Save today&apos;s anchor
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1 rounded-xl border-2 text-sm"
                      placeholder="Or add your own phrase..."
                      value={customPhrase}
                      onChange={(e) => setCustomPhrase(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveFavoritePhrase(customPhrase)}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-xl shrink-0"
                      onClick={() => saveFavoritePhrase(customPhrase)}
                      disabled={!customPhrase.trim()}
                    >
                      Save
                    </Button>
                  </div>
                  {favoritePhrases.length > 0 && (
                    <ul className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                      {favoritePhrases.slice(0, 5).map((phrase, idx) => (
                        <li key={idx} className="text-xs italic text-muted-foreground">&ldquo;{phrase}&rdquo;</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>

          {actionsToShow.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.href + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.03 }}
              >
                <Card className="overflow-hidden rounded-xl border border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                        <Icon className="h-4 w-4 text-primary" />
                      </span>
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
            <Card className="overflow-hidden rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <Trophy className="h-4 w-4 text-primary" />
                    </span>
                    Achievements
                  </span>
                  <Button variant="ghost" size="sm" className="rounded-lg text-xs font-medium" asChild>
                    <Link href="/achievements">View all</Link>
                  </Button>
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
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium"
                      title={a.description}
                    >
                      <span>{a.icon}</span>
                      <span>{a.title}</span>
                    </span>
                  ))}
                </div>
                {unlockedAchievements.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Complete check-ins, thought records, and skills to unlock badges.
                  </p>
                )}
                {nearlyThereAchievements.length > 0 && (
                  <div className="mt-4 border-t border-border/60 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nearly there</p>
                    <div className="space-y-2">
                      {nearlyThereAchievements.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                          <span className="text-base">{a.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{a.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {a.current}/{a.target} {a.label}
                            </p>
                          </div>
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/60 transition-all"
                              style={{ width: `${Math.min(100, (a.current / a.target) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
      >
        <Card className="overflow-hidden rounded-xl">
          <CardHeader>
            <CardTitle>Highlights</CardTitle>
            <CardDescription>Patterns, not judgments.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Link href="/thought-records">
              <div className="rounded-xl border-2 border-border/80 bg-muted/30 p-5 transition hover:border-primary/20 hover:bg-muted/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Thought records
                </p>
                <p className="stat-value mt-2 text-3xl font-bold">{thoughtRecords.length}</p>
              </div>
            </Link>
            <div className="rounded-xl border-2 border-border/80 bg-muted/30 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Most common emotion
              </p>
              <p className="stat-value mt-2 text-3xl font-bold">{pickMostCommonEmotion(thoughtRecords)}</p>
            </div>
            <Link href="/skills">
              <div className="rounded-xl border-2 border-border/80 bg-muted/30 p-5 transition hover:border-primary/20 hover:bg-muted/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Skills completed
                </p>
                <p className="stat-value mt-2 flex items-center text-3xl font-bold">
                  <Sparkles className="mr-2 h-6 w-6 text-primary" />
                  {skillCompletions.length}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </motion.section>
    </motion.div>
  );
}
