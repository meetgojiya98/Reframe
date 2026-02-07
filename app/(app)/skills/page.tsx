"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProfile, useSkillCompletions } from "@/hooks/use-user-data";
import { motion } from "framer-motion";
import { Clock, Sparkles, Wind, Footprints, Heart, Target, Zap, Moon, Smile, Waves, Scale, Gift } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SKILLS_LIBRARY } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

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

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    (completions ?? []).forEach((c) => map.set(c.skillId, (map.get(c.skillId) ?? 0) + 1));
    return map;
  }, [completions]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { label: string; icon: typeof Wind; skills: typeof SKILLS_LIBRARY }>();
    SKILLS_LIBRARY.forEach((skill) => {
      const { label, icon } = getCategory(skill.id);
      if (!map.has(label)) map.set(label, { label, icon, skills: [] });
      map.get(label)!.skills.push(skill);
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const completedCount = useMemo(() => new Set(completions.map((c) => c.skillId)).size, [completions]);
  const recommended = useMemo(() => {
    const goals = new Set(profile?.goals ?? []);
    if (goals.has("stress") || goals.has("overthinking"))
      return SKILLS_LIBRARY.filter((s) => s.id.includes("breathing") || s.id.includes("grounding")).slice(0, 2);
    if (goals.has("sleep")) return SKILLS_LIBRARY.filter((s) => s.id.includes("sleep")).slice(0, 2);
    if (goals.has("motivation")) return SKILLS_LIBRARY.filter((s) => s.id.includes("behavioral") || s.id.includes("values")).slice(0, 2);
    return SKILLS_LIBRARY.slice(0, 3);
  }, [profile?.goals]);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        subtitle="Evidence-based skills you can do in a few minutes."
        title="Skills Library"
      />

      {/* Progress */}
      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Your progress</p>
              <p className="text-sm text-muted-foreground">
                {completions === undefined ? "—" : `${completedCount} of ${SKILLS_LIBRARY.length} skills tried`}
              </p>
            </div>
          </div>
          {completedCount > 0 && (
            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / SKILLS_LIBRARY.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended for you */}
      {recommended.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Recommended for you
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((skill) => (
              <Link key={skill.id} href={`/skills/${skill.id}`}>
                <Card className="h-full rounded-2xl border-primary/20 bg-primary/5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">{skill.title}</CardTitle>
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
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          All skills
        </h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-8">
            {byCategory.map(({ label: category, icon: CatIcon, skills }) => (
              <div key={category}>
                <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                  <CatIcon className="h-4 w-4 text-primary" />
                  {category}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {skills.map((skill, i) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <Link href={`/skills/${skill.id}`}>
                        <Card className="h-full rounded-2xl border-border/80 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                          <CardHeader>
                            <CardTitle className="text-lg">{skill.title}</CardTitle>
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
                            <p className="text-xs text-muted-foreground">
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
