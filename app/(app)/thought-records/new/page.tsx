"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ThoughtRecordForm } from "@/components/thought-record/thought-record-form";
import { useProfile } from "@/hooks/use-user-data";
import { apiThoughtRecordPost } from "@/lib/api";
import { ThoughtRecord } from "@/lib/types";

export default function NewThoughtRecordPage() {
  const router = useRouter();
  const { profile } = useProfile();

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
    <div className="space-y-4 pb-8">
      <PageHeader
        subtitle="Step through one moment with curiosity and clarity."
        title="New Thought Record"
      />
      <ThoughtRecordForm onSave={save} profile={profile} />
    </div>
  );
}
