"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Copy, CopyPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ThoughtRecordForm } from "@/components/thought-record/thought-record-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile, useThoughtRecord } from "@/hooks/use-user-data";
import { apiThoughtRecordPut, apiThoughtRecordDelete } from "@/lib/api";
import { ThoughtRecord } from "@/lib/types";
import { DISTORTION_DEFINITIONS } from "@/lib/constants";

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

  const distortionDefMap = new Map(DISTORTION_DEFINITIONS.map((d) => [d.key, { title: d.title, definition: d.definition }]));

  return (
    <div className="space-y-6 pb-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/thought-records" className="hover:text-foreground transition">Thoughts</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-foreground truncate max-w-[180px] sm:max-w-[240px]" title={record.situation}>
          {record.situation.length > 40 ? `${record.situation.slice(0, 40)}…` : (record.situation || "Thought record")}
        </span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          badge="Edit"
          subtitle="Adjust details anytime as your perspective shifts."
          title="Thought Record"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rounded-xl" asChild>
            <Link href={`/thought-records/new?duplicate=${record.id}`}>
              <CopyPlus className="mr-2 h-4 w-4" />
              Duplicate
            </Link>
          </Button>
          {record.reframe && (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                navigator.clipboard.writeText(record.reframe);
                toast.success("Reframe copied.");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy reframe
            </Button>
          )}
          <Button onClick={remove} variant="destructive" className="rounded-xl">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      {record.distortions.length > 0 && (
        <Card className="rounded-2xl border-border/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Thinking patterns in this record</CardTitle>
            <CardDescription>Hover or focus for definition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {record.distortions.map((key) => {
                const def = distortionDefMap.get(key);
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-border/80 bg-muted/30 px-3 py-2"
                    title={def?.definition}
                  >
                    <p className="font-medium text-sm">{def?.title ?? key}</p>
                    {def?.definition && <p className="mt-0.5 text-xs text-muted-foreground">{def.definition}</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      <ThoughtRecordForm initialValue={record} onSave={save} profile={profile} />
    </div>
  );
}
