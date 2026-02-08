"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useThoughtRecords } from "@/hooks/use-user-data";
import { motion } from "framer-motion";
import { Plus, Search, Copy, ArrowUpDown, ArrowDown, ArrowUp, NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DISTORTION_DEFINITIONS } from "@/lib/constants";
import type { DistortionKey } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const distortionMap = new Map(DISTORTION_DEFINITIONS.map((d) => [d.key, d.title]));
const distortionDefMap = new Map(DISTORTION_DEFINITIONS.map((d) => [d.key, d.definition]));

type SortOption = "newest" | "oldest" | "intensity";

function getMaxEmotionIntensity(record: { emotions: { intensity0to100?: number }[] }): number {
  if (!record.emotions.length) return 0;
  return Math.max(...record.emotions.map((e) => e.intensity0to100 ?? 0));
}

export default function ThoughtRecordsListPage() {
  const [search, setSearch] = useState("");
  const [filterDays, setFilterDays] = useState<7 | 30 | "all">(30);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const { thoughtRecords, isLoading } = useThoughtRecords();

  const emotionFilterOptions = useMemo(() => {
    const set = new Set<string>();
    thoughtRecords.forEach((r) => r.emotions.forEach((e) => set.add(e.name)));
    return Array.from(set).sort();
  }, [thoughtRecords]);

  const [filterEmotion, setFilterEmotion] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    let list = thoughtRecords;
    if (filterDays !== "all") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filterDays);
      list = list.filter((r) => new Date(r.createdAt) >= cutoff);
    }
    if (filterEmotion !== "all") {
      list = list.filter((r) => r.emotions.some((e) => e.name === filterEmotion));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.situation.toLowerCase().includes(q) ||
          r.thoughts.toLowerCase().includes(q) ||
          (r.reframe && r.reframe.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    if (sortBy === "newest") sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "oldest") sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === "intensity") sorted.sort((a, b) => getMaxEmotionIntensity(b) - getMaxEmotionIntensity(a));
    return sorted;
  }, [thoughtRecords, search, filterDays, filterEmotion, sortBy]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          badge="CBT practice"
          subtitle="Use guided records to examine thoughts and build balanced alternatives."
          title="Thought Records"
        />
        <Button asChild className="rounded-xl shadow-sm min-h-[48px] touch-manipulation">
          <Link href="/thought-records/new">
            <Plus className="mr-2 h-4 w-4" />
            New record
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <motion.div className="rounded-2xl border-2 border-border/80 bg-muted/30 p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={thoughtRecords.length} duration={0.4} /></p>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total records</p>
        </motion.div>
        <motion.div className="rounded-2xl border-2 border-border/80 bg-muted/30 p-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-2xl font-bold tabular-nums"><AnimatedCounter value={filtered.length} duration={0.4} /></p>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Showing</p>
        </motion.div>
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 sm:col-span-2">
          <p className="text-sm font-medium text-primary">Tip</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Search by situation, thoughts, or reframe. Filter by time or emotion.</p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl border-2 pl-10"
                placeholder="Search situation, thoughts, or reframe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 gap-y-2">
              <span className="w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:w-auto">Sort:</span>
              {(["newest", "oldest", "intensity"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSortBy(option)}
                  className={`flex items-center gap-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition ${
                    sortBy === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {option === "newest" && <ArrowDown className="h-3.5 w-3.5" />}
                  {option === "oldest" && <ArrowUp className="h-3.5 w-3.5" />}
                  {option === "intensity" && <ArrowUpDown className="h-3.5 w-3.5" />}
                  {option === "newest" ? "Newest" : option === "oldest" ? "Oldest" : "Intensity"}
                </button>
              ))}
              <span className="w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:ml-2 sm:w-auto">Time:</span>
              {([7, 30, "all"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilterDays(option)}
                  className={`rounded-xl border-2 px-3 py-2 text-sm font-medium transition ${
                    filterDays === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {option === "all" ? "All" : `Last ${option}d`}
                </button>
              ))}
              {emotionFilterOptions.length > 0 && (
                <>
                  <span className="w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:ml-2 sm:w-auto">Emotion:</span>
                  <select
                    value={filterEmotion}
                    onChange={(e) => setFilterEmotion(e.target.value)}
                    className="min-h-[44px] w-full flex-1 rounded-xl border-2 border-border bg-muted/40 px-3 py-2 text-base font-medium transition hover:bg-muted/60 sm:max-w-[180px] sm:text-sm"
                  >
                    <option value="all">All</option>
                    {emotionFilterOptions.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="overflow-hidden rounded-2xl border-2 border-dashed border-border/80 bg-muted/10 text-center">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <NotebookPen className="h-8 w-8" />
            </span>
            <h3 className="text-lg font-semibold">No records yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {search || filterDays !== "all"
                ? "No records match your search or filter. Try broadening the time range or clearing the search."
                : "Thought records help you pause, name what happened, and find a kinder perspective. Start with one recent moment."}
            </p>
            <Button asChild className="mt-4 rounded-xl" variant="secondary">
              <Link href="/thought-records/new">
                {search || filterDays !== "all" ? "Clear and start a record" : "Start your first record"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="rounded-2xl border-2 border-border/80 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/thought-records/${record.id}`} className="min-w-0 flex-1">
                      <CardTitle className="line-clamp-2 text-lg font-semibold">
                        {record.situation.slice(0, 100) || "Untitled situation"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{formatDateLabel(record.createdAt)}</span>
                      </CardDescription>
                    </Link>
                    {record.reframe && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          navigator.clipboard.writeText(record.reframe);
                          toast.success("Reframe copied.");
                        }}
                        title="Copy reframe"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/thought-records/${record.id}`}>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {record.reframe || record.thoughts}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {record.emotions.slice(0, 3).map((e) => (
                        <Badge key={e.name} variant="secondary" className="rounded-lg text-xs">
                          {e.name} {e.intensity0to100 != null ? `(${e.intensity0to100})` : ""}
                        </Badge>
                      ))}
                      {record.distortions.slice(0, 3).map((d) => (
                        <Badge
                          key={d}
                          variant="outline"
                          className="rounded-lg cursor-help"
                          title={distortionDefMap.get(d as DistortionKey) ?? undefined}
                        >
                          {distortionMap.get(d as DistortionKey) ?? d.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
