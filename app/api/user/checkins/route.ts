import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { dailyCheckins } from "@/lib/db/schema";

export async function GET() {
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
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = body.id ?? `checkin_${crypto.randomUUID()}`;
  const dateISO = body.dateISO as string;
  const mood0to10 = Number(body.mood0to10);
  const energy0to10 = Number(body.energy0to10);
  const note = body.note as string | undefined;
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

  await db
    .insert(dailyCheckins)
    .values({
      id,
      userId,
      dateISO,
      mood0to10,
      energy0to10,
      note: note ?? null,
      createdAt
    })
    .onConflictDoUpdate({
      target: dailyCheckins.id,
      set: { mood0to10, energy0to10, note: note ?? null }
    });

  return NextResponse.json({ ok: true });
}
