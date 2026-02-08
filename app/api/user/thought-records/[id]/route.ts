import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { thoughtRecords } from "@/lib/db/schema";
import { thoughtRecordPutSchema } from "@/lib/validations";

export const GET = withApiHandler<{ id: string }>(
  async (_request, context) => {
    const userId = await getCurrentUserId();
    if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const [row] = await db
      .select()
      .from(thoughtRecords)
      .where(and(eq(thoughtRecords.id, id), eq(thoughtRecords.userId, userId)))
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
);

export const PUT = withApiHandler<{ id: string }>(
  async (request, context) => {
    const userId = await getCurrentUserId();
    if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const [body, err] = await parseAndValidate(request, thoughtRecordPutSchema);
    if (err) return err;

    const [existing] = await db
      .select()
      .from(thoughtRecords)
      .where(and(eq(thoughtRecords.id, id), eq(thoughtRecords.userId, userId)))
      .limit(1);

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db
      .update(thoughtRecords)
      .set({
        situation: body.situation ?? existing.situation,
        thoughts: body.thoughts ?? existing.thoughts,
        emotions: body.emotions ?? existing.emotions ?? [],
        distortions: body.distortions ?? existing.distortions ?? [],
        evidenceFor: body.evidenceFor ?? existing.evidenceFor,
        evidenceAgainst: body.evidenceAgainst ?? existing.evidenceAgainst,
        reframe: body.reframe ?? existing.reframe,
        actionStep: body.actionStep ?? existing.actionStep
      })
      .where(and(eq(thoughtRecords.id, id), eq(thoughtRecords.userId, userId)));

    return NextResponse.json({ ok: true });
  }
);

export const DELETE = withApiHandler<{ id: string }>(
  async (_request, context) => {
    const userId = await getCurrentUserId();
    if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db
      .delete(thoughtRecords)
      .where(and(eq(thoughtRecords.id, id), eq(thoughtRecords.userId, userId)));

    return NextResponse.json({ ok: true });
  }
);
