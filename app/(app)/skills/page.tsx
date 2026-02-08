"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { useProfile, useSkillCompletions, useCheckins } from "@/hooks/use-user-data";
import { apiAiSkillsRecommend } from "@/lib/api";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { motion } from "framer-motion";
import { Clock, Sparkles, Wind, Footprints, Heart, Target, Zap, Moon, Smile, Waves, Scale, Gift, History, Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SKILLS_LIBRARY } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

const PINNED_SKILLS_KEY = "reframe_pinned_skills";

const CATEGORY_MAP: Record<string, { label: string; icon: typeof Wind }> = {
  breathing: { label: "Breathing & body", icon: Wind },
  grounding: { label: "Grounding", icon: Footprints },
  feeling: { label: "Emotions", icon: Heart },
  worry: { label: "Focus", icon: Target },
  behavioral: { label: "Motivation", icon: Zap },
  values: { label: "Values", icon: Gift },
  sleep: { label: "Sleep", icon: Moon },
  compassion: { label: "Self-compassion", icon: Smile },
  urge: { label: "Impulse", icon: Waves },
  balance: { label: "Thinking", icon: Scale },
  boundary: { label: "Boundaries", icon: Target },
  good: { label: "Gratitude", icon: Gift }
};

function getCategory(skillId: string): { label: string; icon: typeof Wind } {
  const lower = skillId.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return value;
  }
  return { label: "Skills", icon: Sparkles };
}

export default function SkillsPage() {
  const { profile } = useProfile();
  const { completions, isLoading } = useSkillCompletions();
  const { checkins } = useCheckins();
  const [pinnedIds, setPinnedIds] = useLocalStorage<string[]>(PINNED_SKILLS_KEY, []);
  const [aiRecommendedIds, setAiRecommendedIds] = useState<string[] | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    (completions ?? []).forEach((c) => map.set(c.skillId, (map.get(c.skillId) ?? 0) + 1));
    return map;
  }, [completions]);

  const lastCompletedAt = useMemo(() => {
    const map = new Map<string, string>();
    (completions ?? [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((c) => {
        if (!map.has(c.skillId)) map.set(c.skillId, c.createdAt);
      });
    return map;
  }, [completions]);

  const recentlyUsed = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = (completions ?? [])
      .filter((c) => new Date(c.createdAt) >= weekAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const seen = new Set<string>();
    const ids = recent.map((c) => c.skillId).filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return ids.slice(0, 5).map((id) => SKILLS_LIBRARY.find((s) => s.id === id)).filter(Boolean) as typeof SKILLS_LIBRARY;
  }, [completions]);

  const completedCount = useMemo(() => new Set((completions ?? []).map((c) => c.skillId)).size, [completions]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { label: string; icon: typeof Wind; skills: typeof SKILLS_LIBRARY }>();
    SKILLS_LIBRARY.forEach((skill) => {
      const { label, icon } = getCategory(skill.id);
      if (!map.has(label)) map.set(label, { label, icon, skills: [] });
      map.get(label)!.skills.push(skill);
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  useEffect(() => {
    if (!profile?.aiEnabled) return;
    const recentMood = checkins?.length
      ? checkins.slice(-5).reduce((a, c) => a + c.mood0to10, 0) / Math.min(5, checkins.length)
      : undefined;
    apiAiSkillsRecommend({
      goals: profile?.goals ?? [],
      recentMood: recentMood != null ? Math.round(recentMood) : undefined
    })
      .then((r) => setAiRecommendedIds(r.skillIds))
      .catch(() => setAiRecommendedIds(null));
  }, [profile?.aiEnabled, profile?.goals, checkins]);

  const recommended = useMemo(() => {
    if (aiRecommendedIds?.length) {
      const byId = new Map(SKILLS_LIBRARY.map((s) => [s.id, s]));
      return aiRecommendedIds.map((id) => byId.get(id)).filter(Boolean) as typeof SKILLS_LIBRARY;
    }
    const goals = new Set(profile?.goals ?? []);
    if (goals.has("stress") || goals.has("overthinking"))
      return SKILLS_LIBRARY.filter((s) => s.id.includes("breathing") || s.id.includes("grounding")).slice(0, 2);
    if (goals.has("sleep")) return SKILLS_LIBRARY.filter((s) => s.id.includes("sleep")).slice(0, 2);
    if (goals.has("motivation")) return SKILLS_LIBRARY.filter((s) => s.id.includes("behavioral") || s.id.includes("values")).slice(0, 2);
    return SKILLS_LIBRARY.slice(0, 3);
  }, [profile?.goals, aiRecommendedIds]);

  const progressPct = SKILLS_LIBRARY.length ? (completedCount / SKILLS_LIBRARY.length) * 100 : 0;

  const pinnedSkills = useMemo(
    () => pinnedIds.map((id) => SKILLS_LIBRARY.find((s) => s.id === id)).filter(Boolean) as typeof SKILLS_LIBRARY,
    [pinnedIds]
  );

  const togglePin = (skillId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
    toast.success(pinnedIds.includes(skillId) ? "Unpinned" : "Pinned to top");
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Evidence-based"
        subtitle="Skills you can do in a few minutes."
        title="Skills Library"
      />

      {/* Progress */}
      <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">Your progress</p>
              <p className="text-sm text-muted-foreground">
                {completions === undefined ? "—" : <><AnimatedCounter value={completedCount} duration={0.5} /> of {SKILLS_LIBRARY.length} skills tried</>}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-48">
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-1 text-right text-xs font-medium text-muted-foreground">{Math.round(progressPct)}%</p>
          </div>
        </CardContent>
        {completions !== undefined && completedCount === 0 && (
          <div className="border-t border-border/60 px-5 py-4">
            <p className="text-sm text-muted-foreground">Try your first skill—even a few minutes can help.</p>
            <Button variant="secondary" size="sm" className="mt-2 rounded-xl" asChild>
              <Link href={`/skills/${SKILLS_LIBRARY[0]?.id ?? ""}`}>Try &quot;{SKILLS_LIBRARY[0]?.title ?? "First skill"}&quot;</Link>
            </Button>
          </div>
        )}
      </Card>

      {/* Pinned */}
      {pinnedSkills.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Pin className="h-3.5 w-3.5" />
            Pinned
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedSkills.map((skill) => (
              <Link key={skill.id} href={`/skills/${skill.id}`}>
                <Card className="relative h-full rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
                    onClick={(e) => togglePin(skill.id, e)}
                    title="Unpin"
                  >
                    <Pin className="h-4 w-4 fill-current" />
                  </Button>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold pr-10">{skill.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      {skill.durationMinutes} min
                      {lastCompletedAt.has(skill.id) && (
                        <> · Last {formatDistanceToNow(new Date(lastCompletedAt.get(skill.id)!), { addSuffix: true })}</>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="rounded-lg">
                      {counts.get(skill.id) ?? 0} done
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently used */}
      {recentlyUsed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            Recently used
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyUsed.map((skill) => {
              const lastAt = lastCompletedAt.get(skill.id);
              return (
                <Link key={skill.id} href={`/skills/${skill.id}`}>
                  <Card className="h-full rounded-2xl border-2 border-primary/15 bg-gradient-to-br from-primary/5 to-transparent shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">{skill.title}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {skill.durationMinutes} min
                        </span>
                        {lastAt && (
                          <span className="text-muted-foreground">
                            Last {formatDistanceToNow(new Date(lastAt), { addSuffix: true })}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Badge variant="secondary" className="rounded-lg">
                        {counts.get(skill.id) ?? 0} done
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recommended for you */}
      {recommended.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recommended for you
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((skill) => (
              <Link key={skill.id} href={`/skills/${skill.id}`}>
                <Card className="h-full rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">{skill.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      {skill.durationMinutes} min · {skill.summary.slice(0, 50)}…
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="rounded-lg">
                      {counts.get(skill.id) ?? 0} done
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* By category */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          All skills
        </h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-8">
            {byCategory.map(({ label: category, icon: CatIcon, skills }) => (
              <div key={category}>
                <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <CatIcon className="h-4 w-4 text-primary" />
                  </span>
                  {category}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {skills.map((skill, i) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Link href={`/skills/${skill.id}`}>
                        <Card className="relative h-full rounded-2xl border-2 border-border/80 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 z-10 h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={(e) => togglePin(skill.id, e)}
                            title={pinnedIds.includes(skill.id) ? "Unpin" : "Pin to top"}
                          >
                            <Pin className={`h-4 w-4 ${pinnedIds.includes(skill.id) ? "fill-primary text-primary" : ""}`} />
                          </Button>
                          <CardHeader className="pr-12">
                            <CardTitle className="text-lg font-semibold">{skill.title}</CardTitle>
                            <CardDescription>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {skill.durationMinutes} min
                              </span>
                              — {skill.summary}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            <div className="flex flex-wrap gap-2">
                              {skill.benefits.slice(0, 2).map((b) => (
                                <Badge key={b} variant="outline" className="rounded-lg text-xs">
                                  {b}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">
                              {lastCompletedAt.has(skill.id)
                                ? `Last ${formatDistanceToNow(new Date(lastCompletedAt.get(skill.id)!), { addSuffix: true })} · `
                                : ""}
                              Completed {counts.get(skill.id) ?? 0} time{(counts.get(skill.id) ?? 0) === 1 ? "" : "s"}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
