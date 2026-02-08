"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useMemo } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ThoughtRecordForm } from "@/components/thought-record/thought-record-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProfile, useThoughtRecord } from "@/hooks/use-user-data";
import { apiThoughtRecordPost } from "@/lib/api";
import { ThoughtRecord, Profile } from "@/lib/types";

const TEMPLATES: { id: string; label: string; situation: string }[] = [
  { id: "anxiety", label: "Anxiety", situation: "A moment when I felt anxious or worried (e.g. before a conversation, about the future)." },
  { id: "conflict", label: "Conflict", situation: "A disagreement or tension with someone—what was said or what happened." },
  { id: "self-criticism", label: "Self-criticism", situation: "A time I was hard on myself or compared myself to others." }
];

function NewThoughtRecordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const templateId = searchParams.get("template");
  const duplicateId = searchParams.get("duplicate");
  const { record: duplicateRecord, isLoading: duplicateLoading } = useThoughtRecord(duplicateId || null);
  const initialSituation = useMemo(() => {
    if (duplicateRecord) return duplicateRecord.situation;
    const t = TEMPLATES.find((x) => x.id === (templateId ?? ""));
    return t?.situation ?? undefined;
  }, [templateId, duplicateRecord]);
  const initialThoughts = useMemo(() => duplicateRecord?.thoughts ?? undefined, [duplicateRecord]);
  const waitForDuplicate = duplicateId && duplicateLoading;

  const save = async (payload: ThoughtRecord) => {
    const { id } = await apiThoughtRecordPost({
      id: payload.id,
      createdAt: payload.createdAt,
      situation: payload.situation,
      thoughts: payload.thoughts,
      emotions: payload.emotions,
      distortions: payload.distortions,
      evidenceFor: payload.evidenceFor,
      evidenceAgainst: payload.evidenceAgainst,
      reframe: payload.reframe,
      actionStep: payload.actionStep
    });
    router.push(`/thought-records/${id}`);
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="New"
        subtitle="Step through one moment with curiosity and clarity."
        title="New Thought Record"
      />
      <Card className="rounded-2xl border-border/80">
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick start</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <Button key={t.id} variant="outline" size="sm" className="rounded-xl" asChild>
                <Link href={`/thought-records/new?template=${t.id}`}>{t.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      {waitForDuplicate ? (
        <Card className="rounded-2xl border-border/80">
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading record to duplicate…
          </CardContent>
        </Card>
      ) : (
        <ThoughtRecordForm initialSituation={initialSituation} initialThoughts={initialThoughts} onSave={save} profile={profile as Profile | undefined} />
      )}
    </div>
  );
}

export default function NewThoughtRecordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center text-muted-foreground">Loading…</div>}>
      <NewThoughtRecordContent />
    </Suspense>
  );
}
