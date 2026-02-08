"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format, parseISO, subDays, eachDayOfInterval, startOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useProfile, useCheckins, useThoughtRecords, useSkillCompletions } from "@/hooks/use-user-data";
import { apiAiWeeklyRecap } from "@/lib/api";
import { BarChart3, Heart, Sparkles, Flame, TrendingUp, TrendingDown, Minus, Moon, Calendar, Copy, LoaderCircle } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { calculateGentleStreak } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { average, parseSleepFromCheckinNote, parseTagsFromCheckinNote } from "@/lib/utils";

const WINDOW_OPTIONS = [7, 30, 90] as const;

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
      <BarChart3 className="mb-2 h-10 w-10 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export default function InsightsPage() {
  const [windowDays, setWindowDays] = useState<(typeof WINDOW_OPTIONS)[number]>(30);
  const [aiRecap, setAiRecap] = useState<string | null>(null);
  const [aiRecapLoading, setAiRecapLoading] = useState(false);
  const { profile } = useProfile();
  const { checkins } = useCheckins();
  const { thoughtRecords } = useThoughtRecords();
  const { completions: skillCompletions } = useSkillCompletions();
  const aiEnabled = Boolean(profile?.aiEnabled);

  const cutoff = useMemo(() => subDays(new Date(), windowDays - 1), [windowDays]);

  const filteredCheckins = useMemo(
    () => checkins.filter((entry) => new Date(entry.createdAt) >= cutoff),
    [checkins, cutoff]
  );

  const summary = useMemo(() => {
    const moods = filteredCheckins.map((c) => c.mood0to10);
    const energies = filteredCheckins.map((c) => c.energy0to10);
    const sleepValues = filteredCheckins
      .map((c) => parseSleepFromCheckinNote(c.note))
      .filter((s): s is number => s != null);
    const recordsInWindow = thoughtRecords.filter((r) => new Date(r.createdAt) >= cutoff).length;
    const skillsInWindow = skillCompletions.filter((s) => new Date(s.createdAt) >= cutoff).length;
    return {
      checkins: filteredCheckins.length,
      avgMood: moods.length ? average(moods).toFixed(1) : null,
      avgEnergy: energies.length ? average(energies).toFixed(1) : null,
      avgSleep: sleepValues.length ? average(sleepValues).toFixed(1) : null,
      sleepDays: sleepValues.length,
      thoughtRecords: recordsInWindow,
      skills: skillsInWindow
    };
  }, [filteredCheckins, thoughtRecords, skillCompletions, cutoff]);

  const trendData = useMemo(
    () =>
      filteredCheckins
        .slice()
        .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
        .map((item) => ({
          day: item.dateISO.slice(5),
          mood: item.mood0to10,
          energy: item.energy0to10
        })),
    [filteredCheckins]
  );

  const emotionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    thoughtRecords
      .filter((record) => new Date(record.createdAt) >= cutoff)
      .forEach((record) => {
        record.emotions.forEach((emotion) => {
          counts.set(emotion.name, (counts.get(emotion.name) ?? 0) + 1);
        });
      });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [thoughtRecords, cutoff]);

  const distortionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    thoughtRecords
      .filter((record) => new Date(record.createdAt) >= cutoff)
      .forEach((record) => {
        record.distortions.forEach((distortion) => {
          counts.set(distortion, (counts.get(distortion) ?? 0) + 1);
        });
      });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name: name.replaceAll("_", " "), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [thoughtRecords, cutoff]);

  const streak = useMemo(() => calculateGentleStreak(checkins), [checkins]);

  const fetchAiRecap = async () => {
    if (!aiEnabled || filteredCheckins.length === 0) return;
    setAiRecapLoading(true);
    setAiRecap(null);
    try {
      const res = await apiAiWeeklyRecap({
        windowDays,
        checkinCount: filteredCheckins.length,
        avgMood: summary.avgMood,
        thoughtRecordCount: summary.thoughtRecords,
        skillCount: summary.skills,
        streak: streak > 0 ? streak : undefined
      });
      setAiRecap(res.recap);
    } catch {
      toast.error("Could not generate AI recap. Try again.");
    } finally {
      setAiRecapLoading(false);
    }
  };

  const weeklyRecapText = useMemo(() => {
    if (filteredCheckins.length === 0) return null;
    const moods = filteredCheckins.map((c) => c.mood0to10);
    const avgMood = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : "—";
    const recordsInWindow = thoughtRecords.filter((r) => new Date(r.createdAt) >= cutoff).length;
    const skillsInWindow = skillCompletions.filter((s) => new Date(s.createdAt) >= cutoff).length;
    return `In the last ${windowDays} days you had ${filteredCheckins.length} check-in${filteredCheckins.length === 1 ? "" : "s"} with an average mood of ${avgMood}. You completed ${recordsInWindow} thought record${recordsInWindow === 1 ? "" : "s"} and ${skillsInWindow} skill${skillsInWindow === 1 ? "" : "s"}.`;
  }, [filteredCheckins, thoughtRecords, skillCompletions, cutoff, windowDays]);

  const moodByWeekday = useMemo(() => {
    const byDay = new Map<string, number[]>();
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    dayOrder.forEach((d) => byDay.set(d, []));
    filteredCheckins.forEach((entry) => {
      const dayName = format(parseISO(entry.dateISO), "EEE");
      const arr = byDay.get(dayName) ?? [];
      arr.push(entry.mood0to10);
      byDay.set(dayName, arr);
    });
    return dayOrder.map((day) => {
      const vals = byDay.get(day) ?? [];
      return { day, avg: vals.length ? average(vals) : 0, count: vals.length };
    });
  }, [filteredCheckins]);

  const skillMoodCorrelation = useMemo(() => {
    const skillDates = new Set(
      skillCompletions
        .filter((entry) => new Date(entry.createdAt) >= cutoff)
        .map((entry) => entry.createdAt.slice(0, 10))
    );
    const withSkills: number[] = [];
    const withoutSkills: number[] = [];
    filteredCheckins.forEach((entry) => {
      if (skillDates.has(entry.dateISO)) withSkills.push(entry.mood0to10);
      else withoutSkills.push(entry.mood0to10);
    });
    return {
      withSkillsAvg: average(withSkills),
      withoutSkillsAvg: average(withoutSkills),
      daysWithSkills: withSkills.length,
      daysWithoutSkills: withoutSkills.length
    };
  }, [filteredCheckins, skillCompletions, cutoff]);

  const sleepVsMood = useMemo(() => {
    const withSleep = filteredCheckins.map((c) => ({ ...c, sleep: parseSleepFromCheckinNote(c.note) })).filter((c) => c.sleep != null) as { mood0to10: number; sleep: number }[];
    const goodSleep = withSleep.filter((c) => c.sleep >= 7).map((c) => c.mood0to10);
    const poorSleep = withSleep.filter((c) => c.sleep < 7).map((c) => c.mood0to10);
    return {
      avgMoodWhenSleepGood: goodSleep.length ? average(goodSleep).toFixed(1) : null,
      avgMoodWhenSleepPoor: poorSleep.length ? average(poorSleep).toFixed(1) : null,
      daysGood: goodSleep.length,
      daysPoor: poorSleep.length
    };
  }, [filteredCheckins]);

  const moodCalendarDays = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 34);
    const days = eachDayOfInterval({ start, end });
    const byDate = new Map(checkins.map((c) => [c.dateISO, c.mood0to10]));
    const dayOfWeek = start.getDay();
    const pad = Array.from({ length: dayOfWeek }, () => null as { date: Date; dateISO: string; mood: number | undefined } | null);
    const filled = days.map((d) => {
      const dateISO = format(d, "yyyy-MM-dd");
      const mood = byDate.get(dateISO);
      return { date: d, dateISO, mood };
    });
    return [...pad, ...filled];
  }, [checkins]);

  const periodComparison = useMemo(() => {
    const sorted = [...checkins].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    if (sorted.length < 2) return null;
    const thisPeriod = sorted.filter((c) => new Date(c.createdAt) >= cutoff);
    const prevCutoff = subDays(cutoff, windowDays);
    const prevPeriod = sorted.filter((c) => {
      const d = new Date(c.createdAt);
      return d >= prevCutoff && d < cutoff;
    });
    const avgThis = thisPeriod.length ? average(thisPeriod.map((c) => c.mood0to10)) : null;
    const avgPrev = prevPeriod.length ? average(prevPeriod.map((c) => c.mood0to10)) : null;
    if (avgThis == null || avgPrev == null) return null;
    return { avgThis, avgPrev, countThis: thisPeriod.length, countPrev: prevPeriod.length };
  }, [checkins, cutoff, windowDays]);

  const moodTrend = useMemo(() => {
    const sorted = [...filteredCheckins].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    if (sorted.length < 4) return null;
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid).map((c) => c.mood0to10);
    const secondHalf = sorted.slice(mid).map((c) => c.mood0to10);
    const avgFirst = average(firstHalf);
    const avgSecond = average(secondHalf);
    const diff = avgSecond - avgFirst;
    if (diff >= 0.3) return "improving" as const;
    if (diff <= -0.3) return "declining" as const;
    return "stable" as const;
  }, [filteredCheckins]);

  const bestWeek = useMemo((): { weekStart: string; avg: number; count: number } | null => {
    const byWeek = new Map<string, number[]>();
    filteredCheckins.forEach((entry) => {
      const d = parseISO(entry.dateISO);
      const weekStart = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
      const arr = byWeek.get(weekStart) ?? [];
      arr.push(entry.mood0to10);
      byWeek.set(weekStart, arr);
    });
    let best: { weekStart: string; avg: number; count: number } | null = null;
    byWeek.forEach((moods, weekStart) => {
      const avg = average(moods);
      const count = moods.length;
      if (count >= 2 && (!best || avg > best.avg)) best = { weekStart, avg, count };
    });
    return best;
  }, [filteredCheckins]);

  const moodByTag = useMemo(() => {
    const byTag = new Map<string, number[]>();
    filteredCheckins.forEach((entry) => {
      const entryTags = parseTagsFromCheckinNote(entry.note);
      if (entryTags.length === 0) return;
      entryTags.forEach((tag) => {
        const arr = byTag.get(tag) ?? [];
        arr.push(entry.mood0to10);
        byTag.set(tag, arr);
      });
    });
    return Array.from(byTag.entries())
      .map(([tag, moods]) => ({ tag, avg: average(moods).toFixed(1), count: moods.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredCheckins]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <PageHeader
          badge="Patterns"
          subtitle="Signals to support reflection, not scores."
          title="Insights"
        />
        <Tabs value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v) as typeof windowDays)} className="w-full sm:w-auto">
          <TabsList className="flex w-full rounded-xl border-2 sm:w-auto">
            {WINDOW_OPTIONS.map((days) => (
              <TabsTrigger key={days} value={String(days)} className="rounded-lg">
                {days}d
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredCheckins.length === 0 && (
        <Card className="overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="mb-4 h-14 w-14 text-muted-foreground/60" />
            <h3 className="text-lg font-semibold">No data in this window</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Check in on the Today page to start building your insights. Patterns appear after a few days.
            </p>
            <Button asChild className="mt-4 rounded-xl" variant="secondary">
              <Link href="/today">Go to Today</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {filteredCheckins.length > 0 && (
      <>
      {/* Summary + streak */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm lg:col-span-2">
          <CardContent className="p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              In the last {windowDays} days
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              <motion.div className="rounded-2xl border-2 border-border/60 bg-muted/40 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <p className="text-2xl font-bold tabular-nums text-foreground"><AnimatedCounter value={summary.checkins} duration={0.5} /></p>
                <p className="text-xs font-medium text-muted-foreground">Check-ins</p>
              </motion.div>
              <motion.div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <p className="text-2xl font-bold tabular-nums text-primary">{summary.avgMood ?? "—"}</p>
                <p className="text-xs font-medium text-muted-foreground">Avg mood</p>
              </motion.div>
              <motion.div className="rounded-2xl border-2 border-border/60 bg-muted/40 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <p className="text-2xl font-bold tabular-nums text-foreground"><AnimatedCounter value={summary.thoughtRecords} duration={0.5} /></p>
                <p className="text-xs font-medium text-muted-foreground">Thought records</p>
              </motion.div>
              <motion.div className="rounded-2xl border-2 border-border/60 bg-muted/40 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <p className="text-2xl font-bold tabular-nums text-foreground"><AnimatedCounter value={summary.skills} duration={0.5} /></p>
                <p className="text-xs font-medium text-muted-foreground">Skills</p>
              </motion.div>
              {summary.avgSleep != null && (
                <motion.div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <p className="text-2xl font-bold tabular-nums text-primary">{summary.avgSleep}</p>
                  <p className="text-xs font-medium text-muted-foreground">Avg sleep ({summary.sleepDays} days)</p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
          <Card className="overflow-hidden rounded-2xl border-primary/25 bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm">
            <CardContent className="flex flex-col justify-center p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flame className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Current streak</span>
              </div>
              <p className="mt-2 text-4xl font-bold tabular-nums text-primary"><AnimatedCounter value={streak} duration={0.6} /> day{streak === 1 ? "" : "s"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Check-ins in a row</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {periodComparison && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-6 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compare to previous period</p>
                <p className="mt-1 text-sm">
                  Last {windowDays}d avg mood <span className="font-semibold text-primary">{periodComparison.avgThis.toFixed(1)}/10</span>
                  {periodComparison.countPrev > 0 && (
                    <> · Previous {windowDays}d <span className="font-semibold">{periodComparison.avgPrev.toFixed(1)}/10</span></>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {(weeklyRecapText || aiRecap) && (
        <>
          {aiRecap && (
            <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-r from-primary/10 to-transparent shadow-sm">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="flex items-start gap-4 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-primary/80">AI recap</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{aiRecap}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => {
                      navigator.clipboard.writeText(aiRecap);
                      toast.success("Copied.");
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {weeklyRecapText && (
            <Card className="overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-r from-primary/5 to-transparent shadow-sm">
              <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="flex items-start gap-4 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{weeklyRecapText}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {aiEnabled && filteredCheckins.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={fetchAiRecap}
                      disabled={aiRecapLoading}
                    >
                      {aiRecapLoading ? (
                        <LoaderCircle className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {aiRecapLoading ? "Generating…" : "Generate AI recap"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(weeklyRecapText);
                      toast.success("Summary copied to clipboard.");
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {moodTrend && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                {moodTrend === "improving" && <TrendingUp className="h-5 w-5 text-primary" />}
                {moodTrend === "declining" && <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                {moodTrend === "stable" && <Minus className="h-5 w-5 text-muted-foreground" />}
              </span>
              <div>
                <p className="font-semibold">
                  Mood trend in this window: {moodTrend === "improving" ? "Improving" : moodTrend === "declining" ? "Declining" : "Stable"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {moodTrend === "improving" && "First half vs second half: average mood is up."}
                  {moodTrend === "declining" && "First half vs second half: average mood is down. Be gentle with yourself."}
                  {moodTrend === "stable" && "Average mood is similar in the first and second half of the period."}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {bestWeek && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <p className="font-semibold">Best week in this window</p>
                  <p className="text-sm text-muted-foreground">
                    Week of {format(parseISO(bestWeek.weekStart), "MMM d")} — avg mood {bestWeek.avg.toFixed(1)}/10 ({bestWeek.count} check-ins)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Mood and energy trend</CardTitle>
            <CardDescription>{windowDays}-day view</CardDescription>
          </CardHeader>
          <CardContent className="h-72 min-h-[240px] w-full overflow-hidden rounded-b-2xl">
            {trendData.length ? (
            <ResponsiveContainer height="100%" width="100%" minWidth={0}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line dataKey="mood" dot={false} stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line dataKey="energy" dot={false} stroke="hsl(var(--accent-foreground))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            ) : (
              <EmptyChart message="Add a few daily check-ins to see your trend." />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </span>
              Mood by day of week
            </CardTitle>
            <CardDescription>Average mood for each weekday in the selected window</CardDescription>
          </CardHeader>
          <CardContent className="h-64 min-h-[200px] w-full overflow-hidden">
            {moodByWeekday.some((d) => d.count > 0) ? (
              <ResponsiveContainer height="100%" width="100%" minWidth={0}>
                <BarChart data={moodByWeekday.map((d) => ({ name: d.day, value: Number(d.avg.toFixed(1)), count: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} allowDecimals={false} />
                  <Tooltip formatter={(value: number, _name: string, props: { payload?: { count?: number } }) => [`${value}/10${props.payload?.count != null ? ` (${props.payload.count} days)` : ""}`, "Avg mood"]} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Add check-ins to see mood by weekday." />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Heart className="h-4 w-4 text-primary" />
              </span>
              Most common emotions
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 min-h-[200px] w-full overflow-hidden">
            {emotionCounts.length ? (
              <ResponsiveContainer height="100%" width="100%" minWidth={0}>
                <BarChart data={emotionCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Complete thought records to see emotion patterns." />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Common distortions</CardTitle>
            <CardDescription>Thinking patterns to notice</CardDescription>
          </CardHeader>
          <CardContent className="h-64 min-h-[200px] w-full overflow-hidden">
            {distortionCounts.length ? (
              <ResponsiveContainer height="100%" width="100%" minWidth={0}>
                <BarChart data={distortionCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--accent-foreground))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Distortion patterns appear after thought records." />
            )}
          </CardContent>
        </Card>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </span>
              What helps
            </CardTitle>
            <CardDescription>
              On days when you did a skill, how did average mood compare?
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Days with skill use
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-primary">
              {skillMoodCorrelation.daysWithSkills ? skillMoodCorrelation.withSkillsAvg.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-muted-foreground">{skillMoodCorrelation.daysWithSkills} day(s)</p>
          </div>
          <div className="rounded-2xl border-2 border-border/80 bg-muted/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Days without
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {skillMoodCorrelation.daysWithoutSkills ? skillMoodCorrelation.withoutSkillsAvg.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-muted-foreground">{skillMoodCorrelation.daysWithoutSkills} day(s)</p>
          </div>
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Notice trends over time rather than judging single days.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sleep vs mood */}
      {(sleepVsMood.daysGood > 0 || sleepVsMood.daysPoor > 0) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Moon className="h-4 w-4 text-primary" />
                </span>
                Sleep and mood
              </CardTitle>
              <CardDescription>Average mood when sleep was 7+ vs under 7 (in this window)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sleep 7+</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-primary">{sleepVsMood.avgMoodWhenSleepGood ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Avg mood ({sleepVsMood.daysGood} days)</p>
              </div>
              <div className="rounded-2xl border-2 border-border/80 bg-muted/30 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sleep &lt;7</p>
                <p className="mt-2 text-3xl font-bold tabular-nums">{sleepVsMood.avgMoodWhenSleepPoor ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Avg mood ({sleepVsMood.daysPoor} days)</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mood calendar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </span>
              Mood calendar
            </CardTitle>
            <CardDescription>Last 5 weeks — darker = higher mood</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-muted-foreground">{d}</div>
              ))}
              {moodCalendarDays.map((cell, idx) =>
                cell === null ? (
                  <div key={`pad-${idx}`} className="aspect-square rounded-md sm:rounded-lg bg-transparent" />
                ) : (
                  <div
                    key={cell.dateISO}
                    className="aspect-square rounded-md sm:rounded-lg transition-colors"
                    style={{
                      backgroundColor:
                        cell.mood != null
                        ? `hsl(166 48% ${Math.min(70, 25 + cell.mood * 4.5)}%)`
                        : "hsl(var(--muted))"
                  }}
                    title={cell.mood != null ? `${cell.dateISO}: ${cell.mood}/10` : cell.dateISO}
                  />
                )
              )}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Low</span>
              <div className="flex flex-1 gap-0.5">
                {[0, 3, 5, 7, 10].map((m) => (
                  <div
                    key={m}
                    className="h-3 flex-1 rounded"
                    style={{ backgroundColor: `hsl(166 48% ${Math.min(70, 25 + m * 4.5)}%)` }}
                  />
                ))}
              </div>
              <span>High</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mood by tag */}
      {moodByTag.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Mood by tag</CardTitle>
              <CardDescription>Average mood on days you used each tag</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {moodByTag.map(({ tag, avg, count }) => (
                  <div
                    key={tag}
                    className="rounded-xl border-2 border-border/60 bg-muted/30 px-4 py-2"
                  >
                    <span className="font-medium capitalize">{tag}</span>
                    <span className="ml-2 text-primary">{avg}/10</span>
                    <span className="ml-1 text-xs text-muted-foreground">({count})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </>
      )}
    </div>
  );
}
