import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { thoughtRecords } from "@/lib/db/schema";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(thoughtRecords)
    .where(eq(thoughtRecords.userId, userId))
    .orderBy(desc(thoughtRecords.createdAt));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      situation: r.situation,
      thoughts: r.thoughts,
      emotions: r.emotions ?? [],
      distortions: r.distortions ?? [],
      evidenceFor: r.evidenceFor,
      evidenceAgainst: r.evidenceAgainst,
      reframe: r.reframe,
      actionStep: r.actionStep
    }))
  );
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = body.id ?? `thought_${crypto.randomUUID()}`;
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

  await db.insert(thoughtRecords).values({
    id,
    userId,
    situation: body.situation ?? "",
    thoughts: body.thoughts ?? "",
    emotions: Array.isArray(body.emotions) ? body.emotions : [],
    distortions: Array.isArray(body.distortions) ? body.distortions : [],
    evidenceFor: body.evidenceFor ?? "",
    evidenceAgainst: body.evidenceAgainst ?? "",
    reframe: body.reframe ?? "",
    actionStep: body.actionStep ?? "",
    createdAt
  });

  return NextResponse.json({ ok: true, id });
}
