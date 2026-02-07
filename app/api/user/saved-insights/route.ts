import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { savedInsights } from "@/lib/db/schema";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(savedInsights)
    .where(eq(savedInsights.userId, userId))
    .orderBy(desc(savedInsights.createdAt))
    .limit(50);

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      note: r.note
    }))
  );
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = body.id ?? `insight_${crypto.randomUUID()}`;
  const note = (body.note as string)?.slice(0, 280) ?? "";
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

  await db.insert(savedInsights).values({
    id,
    userId,
    note,
    createdAt
  });

  return NextResponse.json({ ok: true, id });
}
