"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useThoughtRecords } from "@/hooks/use-user-data";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DISTORTION_DEFINITIONS } from "@/lib/constants";
import { formatDateLabel } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const distortionMap = new Map(DISTORTION_DEFINITIONS.map((d) => [d.key, d.title]));

export default function ThoughtRecordsListPage() {
  const [search, setSearch] = useState("");
  const [filterDays, setFilterDays] = useState<7 | 30 | "all">(30);
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
    return list;
  }, [thoughtRecords, search, filterDays, filterEmotion]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          subtitle="Use guided records to examine thoughts and build balanced alternatives."
          title="Thought Records"
        />
        <Button asChild className="rounded-xl shadow-sm">
          <Link href="/thought-records/new">
            <Plus className="mr-2 h-4 w-4" />
            New record
          </Link>
        </Button>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="rounded-xl pl-9"
                placeholder="Search situation, thoughts, or reframe..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 gap-y-2">
              <span className="w-full text-xs font-medium text-muted-foreground sm:w-auto">Time:</span>
              {([7, 30, "all"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilterDays(option)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    filterDays === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {option === "all" ? "All" : `Last ${option} days`}
                </button>
              ))}
              {emotionFilterOptions.length > 0 && (
                <>
                  <span className="w-full text-xs font-medium text-muted-foreground sm:ml-2 sm:w-auto">Emotion:</span>
                  <select
                    value={filterEmotion}
                    onChange={(e) => setFilterEmotion(e.target.value)}
                    className="min-h-[44px] w-full flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2 text-base font-medium text-muted-foreground transition hover:bg-muted/60 sm:max-w-[180px] sm:text-sm"
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
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/80 text-center shadow-sm">
          <CardHeader>
            <CardTitle>No records yet</CardTitle>
            <CardDescription>
              {search || filterDays !== "all"
                ? "No records match your search or filter. Try adjusting them."
                : "Start with one recent moment and work through the 7-step guide."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-xl" variant="secondary">
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
              <Link href={`/thought-records/${record.id}`}>
                <Card className="rounded-2xl border-border/80 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-lg font-medium">
                      {record.situation.slice(0, 100) || "Untitled situation"}
                    </CardTitle>
                    <CardDescription>{formatDateLabel(record.createdAt)}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {record.reframe || record.thoughts}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {record.emotions.slice(0, 3).map((e) => (
                        <Badge key={e.name} variant="secondary" className="rounded-lg text-xs">
                          {e.name} {e.intensity0to100 ? `(${e.intensity0to100})` : ""}
                        </Badge>
                      ))}
                      {record.distortions.slice(0, 2).map((d) => (
                        <Badge key={d} variant="outline" className="rounded-lg">
                          {distortionMap.get(d) ?? d}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
