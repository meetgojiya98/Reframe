import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { safetyEvents } from "@/lib/db/schema";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = body.id ?? `safety_${crypto.randomUUID()}`;
  const category = (body.category as string) ?? "other";
  const source = (body.source as string) ?? "coach";
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

  await db.insert(safetyEvents).values({
    id,
    userId,
    category,
    source,
    createdAt
  });

  return NextResponse.json({ ok: true });
}
