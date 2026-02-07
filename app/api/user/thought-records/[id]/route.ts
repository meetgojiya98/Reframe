import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { thoughtRecords } from "@/lib/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .select()
    .from(thoughtRecords)
    .where(and(eq(thoughtRecords.id, params.id), eq(thoughtRecords.userId, userId)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    situation: row.situation,
    thoughts: row.thoughts,
    emotions: row.emotions ?? [],
    distortions: row.distortions ?? [],
    evidenceFor: row.evidenceFor,
    evidenceAgainst: row.evidenceAgainst,
    reframe: row.reframe,
    actionStep: row.actionStep
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await db
    .update(thoughtRecords)
    .set({
      situation: body.situation ?? "",
      thoughts: body.thoughts ?? "",
      emotions: Array.isArray(body.emotions) ? body.emotions : [],
      distortions: Array.isArray(body.distortions) ? body.distortions : [],
      evidenceFor: body.evidenceFor ?? "",
      evidenceAgainst: body.evidenceAgainst ?? "",
      reframe: body.reframe ?? "",
      actionStep: body.actionStep ?? ""
    })
    .where(and(eq(thoughtRecords.id, params.id), eq(thoughtRecords.userId, userId)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .delete(thoughtRecords)
    .where(and(eq(thoughtRecords.id, params.id), eq(thoughtRecords.userId, userId)));

  return NextResponse.json({ ok: true });
}
