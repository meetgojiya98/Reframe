"use client";

import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { useCheckins, useThoughtRecords, useSkillCompletions } from "@/hooks/use-user-data";
import { BarChart3, Heart, Sparkles, Flame, TrendingUp } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { average } from "@/lib/utils";

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
  const { checkins } = useCheckins();
  const { thoughtRecords } = useThoughtRecords();
  const { completions: skillCompletions } = useSkillCompletions();

  const cutoff = useMemo(() => subDays(new Date(), windowDays - 1), [windowDays]);

  const filteredCheckins = useMemo(
    () => checkins.filter((entry) => new Date(entry.createdAt) >= cutoff),
    [checkins, cutoff]
  );

  const summary = useMemo(() => {
    const moods = filteredCheckins.map((c) => c.mood0to10);
    const energies = filteredCheckins.map((c) => c.energy0to10);
  const recordsInWindow = thoughtRecords.filter((r) => new Date(r.createdAt) >= cutoff).length;
  const skillsInWindow = skillCompletions.filter((s) => new Date(s.createdAt) >= cutoff).length;
    return {
      checkins: filteredCheckins.length,
      avgMood: moods.length ? average(moods).toFixed(1) : null,
      avgEnergy: energies.length ? average(energies).toFixed(1) : null,
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

  const weeklyRecapText = useMemo(() => {
    if (filteredCheckins.length === 0) return null;
    const moods = filteredCheckins.map((c) => c.mood0to10);
    const avgMood = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : "—";
    const recordsInWindow = thoughtRecords.filter((r) => new Date(r.createdAt) >= cutoff).length;
    const skillsInWindow = skillCompletions.filter((s) => new Date(s.createdAt) >= cutoff).length;
    return `In the last ${windowDays} days you had ${filteredCheckins.length} check-in${filteredCheckins.length === 1 ? "" : "s"} with an average mood of ${avgMood}. You completed ${recordsInWindow} thought record${recordsInWindow === 1 ? "" : "s"} and ${skillsInWindow} skill${skillsInWindow === 1 ? "" : "s"}.`;
  }, [filteredCheckins, thoughtRecords, skillCompletions, cutoff, windowDays]);

  const skillMoodCorrelation = useMemo(() => {
    const checkinByDate = new Map(filteredCheckins.map((item) => [item.dateISO, item]));
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

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <PageHeader
          subtitle="Patterns to support reflection. Signals, not scores."
          title="Insights"
        />
        <Tabs value={String(windowDays)} onValueChange={(v) => setWindowDays(Number(v) as typeof windowDays)} className="w-full sm:w-auto">
          <TabsList className="flex w-full rounded-xl sm:w-auto">
            {WINDOW_OPTIONS.map((days) => (
              <TabsTrigger key={days} value={String(days)} className="rounded-lg">
                {days} days
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Summary card + streak + weekly recap */}
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-3">
        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardContent className="p-4">
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              In the last {windowDays} days
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-2xl font-semibold text-foreground">{summary.checkins}</p>
                <p className="text-xs text-muted-foreground">Check-ins</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-2xl font-semibold text-primary">{summary.avgMood ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Avg mood</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-2xl font-semibold text-foreground">{summary.thoughtRecords}</p>
                <p className="text-xs text-muted-foreground">Thought records</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-2xl font-semibold text-foreground">{summary.skills}</p>
                <p className="text-xs text-muted-foreground">Skills completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="flex flex-col justify-center p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Current streak</span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-primary">{streak} day{streak === 1 ? "" : "s"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Check-ins in a row</p>
          </CardContent>
        </Card>
      </div>

      {weeklyRecapText && (
        <Card className="border-border/80 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">{weeklyRecapText}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Mood and energy trend</CardTitle>
          <CardDescription>{windowDays}-day view</CardDescription>
        </CardHeader>
        <CardContent className="h-72 min-h-[240px] w-full overflow-hidden">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
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
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Complete thought records to see emotion patterns." />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
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
                  <Bar dataKey="value" fill="hsl(var(--accent-foreground))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Distortion patterns appear after thought records." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            What helps
          </CardTitle>
          <CardDescription>
            On days when you did a skill, how did average mood compare?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/80 bg-primary/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Days with skill use
            </p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              {skillMoodCorrelation.daysWithSkills ? skillMoodCorrelation.withSkillsAvg.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-muted-foreground">{skillMoodCorrelation.daysWithSkills} day(s)</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Days without
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {skillMoodCorrelation.daysWithoutSkills ? skillMoodCorrelation.withoutSkillsAvg.toFixed(1) : "—"}
            </p>
            <p className="text-sm text-muted-foreground">{skillMoodCorrelation.daysWithoutSkills} day(s)</p>
          </div>
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Notice trends over time rather than judging single days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
