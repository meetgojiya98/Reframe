"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
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

  const saveCompletion = async () => {
    if (!skill) return;
    await apiSkillCompletionsPost({
      skillId: skill.id,
      reflection: reflection.trim() || undefined
    });
    await mutate();
    setReflection("");
    toast.success("Skill completion logged.");
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
    <div className="space-y-4 pb-8">
      <PageHeader subtitle={skill.summary} title={skill.title} />

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            {skill.durationMinutes} minutes - Completed {completionCount} time
            {completionCount === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {skill.benefits.map((benefit) => (
              <Badge key={benefit} variant="outline">
                {benefit}
              </Badge>
            ))}
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {skill.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <SkillTimer
            minutes={skill.durationMinutes}
            breathingMode={skill.id.includes("breathing")}
          />

          <div className="space-y-2 rounded-xl border p-4">
            <p className="text-sm font-medium">Reflection (optional)</p>
            <p className="text-sm text-muted-foreground">{skill.reflectionPrompt}</p>
            <Textarea
              onChange={(event) => setReflection(event.target.value)}
              placeholder="Write one short reflection"
              value={reflection}
            />
            <Button onClick={saveCompletion}>Mark complete</Button>
          </div>

          {completions.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4 text-primary" />
                Your past reflections
              </p>
              <ul className="space-y-2">
                {completions
                  .slice(0, 5)
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((c) => (
                    <li key={c.id} className="rounded-lg border border-border/60 bg-card p-3 text-sm">
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
