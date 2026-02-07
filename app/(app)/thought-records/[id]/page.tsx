"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ThoughtRecordForm } from "@/components/thought-record/thought-record-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile, useThoughtRecord } from "@/hooks/use-user-data";
import { apiThoughtRecordPut, apiThoughtRecordDelete } from "@/lib/api";
import { ThoughtRecord } from "@/lib/types";

export default function ThoughtRecordDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useProfile();
  const { record, isLoading, mutate } = useThoughtRecord(params.id);

  const save = async (payload: ThoughtRecord) => {
    await apiThoughtRecordPut(params.id, payload);
    await mutate();
  };

  const remove = async () => {
    if (!record) return;
    const ok = window.confirm("Delete this thought record?");
    if (!ok) return;
    await apiThoughtRecordDelete(record.id);
    toast.success("Thought record deleted.");
    router.push("/thought-records");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }
  if (!record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Record not found</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link href="/thought-records">Back to records</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader subtitle="Adjust details anytime as your perspective shifts." title="Thought Record Detail" />
        <Button onClick={remove} variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
      <ThoughtRecordForm initialValue={record} onSave={save} profile={profile} />
    </div>
  );
}
