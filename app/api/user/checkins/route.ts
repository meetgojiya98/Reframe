import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate, validationErrorResponse } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { dailyCheckins } from "@/lib/db/schema";
import { checkinPostSchema } from "@/lib/validations";

export const GET = withApiHandler(async () => {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(dailyCheckins)
    .where(eq(dailyCheckins.userId, userId))
    .orderBy(desc(dailyCheckins.createdAt));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      dateISO: r.dateISO,
      mood0to10: r.mood0to10,
      energy0to10: r.energy0to10,
      note: r.note ?? undefined,
      createdAt: r.createdAt.toISOString()
    }))
  );
});

export const POST = withApiHandler(async (request) => {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [body, err] = await parseAndValidate(request, checkinPostSchema);
  if (err) return err;

  const id = body.id ?? `checkin_${crypto.randomUUID()}`;
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

  await db
    .insert(dailyCheckins)
    .values({
      id,
      userId,
      dateISO: body.dateISO,
      mood0to10: body.mood0to10,
      energy0to10: body.energy0to10,
      note: body.note ?? null,
      createdAt
    })
    .onConflictDoUpdate({
      target: dailyCheckins.id,
      set: { mood0to10: body.mood0to10, energy0to10: body.energy0to10, note: body.note ?? null }
    });

  return NextResponse.json({ ok: true });
});
