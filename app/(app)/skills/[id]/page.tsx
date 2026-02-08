"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { MessageSquare, Copy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SkillTimer } from "@/components/skills/skill-timer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SKILLS_LIBRARY } from "@/lib/constants";
import { useSkillCompletions } from "@/hooks/use-user-data";
import { apiSkillCompletionsPost } from "@/lib/api";

export default function SkillDetailPage() {
  const params = useParams<{ id: string }>();
  const [reflection, setReflection] = useState("");
  const skill = useMemo(() => SKILLS_LIBRARY.find((item) => item.id === params.id), [params.id]);
  const { completions, mutate } = useSkillCompletions(params.id);
  const completionCount = completions.length;
  const lastCompletedAt = useMemo(() => {
    if (!completions.length) return null;
    return completions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt;
  }, [completions]);

  const saveCompletion = async () => {
    if (!skill) return;
    await apiSkillCompletionsPost({
      skillId: skill.id,
      reflection: reflection.trim() || undefined
    });
    await mutate();
    setReflection("");
    toast.success(`Nice—you completed ${skill.title}.`);
  };

  if (!skill) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skill not found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link href="/skills">Back to skills</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/skills" className="hover:text-foreground transition">Skills</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground">{skill.title}</span>
      </nav>
      <PageHeader
        badge={`${skill.durationMinutes} min`}
        subtitle={skill.summary}
        title={skill.title}
      />

      <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            {lastCompletedAt ? (
              <>Last done {formatDistanceToNow(new Date(lastCompletedAt), { addSuffix: true })} · </>
            ) : null}
            Completed {completionCount} time{completionCount === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {skill.benefits.map((benefit) => (
              <Badge key={benefit} variant="outline" className="rounded-lg">
                {benefit}
              </Badge>
            ))}
          </div>

          <div className="rounded-2xl border-2 border-border/80 bg-muted/10 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Steps</p>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => {
                  const text = skill.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
                  navigator.clipboard.writeText(text);
                  toast.success("Steps copied.");
                }}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy steps
              </Button>
            </div>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
              {skill.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          <SkillTimer
            minutes={skill.durationMinutes}
            breathingMode={skill.id.includes("breathing")}
          />

          <div className="space-y-3 rounded-2xl border-2 border-border/80 p-4">
            <p className="text-sm font-semibold">Reflection (optional)</p>
            <p className="text-sm text-muted-foreground">{skill.reflectionPrompt}</p>
            <Textarea
              className="min-h-[88px] rounded-xl border-2"
              onChange={(event) => setReflection(event.target.value)}
              placeholder="Write one short reflection"
              value={reflection}
            />
            <Button className="rounded-xl" onClick={saveCompletion}>Mark complete</Button>
          </div>

          {completions.length > 0 && (
            <div className="space-y-3 rounded-2xl border-2 border-primary/15 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MessageSquare className="h-4 w-4" />
                Your past reflections
              </p>
              <ul className="space-y-2">
                {completions
                  .slice(0, 5)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((c) => (
                    <li key={c.id} className="rounded-xl border border-border/60 bg-card p-3 text-sm">
                      {c.reflection ? (
                        <p className="text-muted-foreground">{c.reflection}</p>
                      ) : (
                        <p className="italic text-muted-foreground">Completed (no reflection)</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(c.createdAt), "MMM d, yyyy")}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
