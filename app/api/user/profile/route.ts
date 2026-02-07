import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { profile as profileTable } from "@/lib/db/schema";
import type { GoalOption } from "@/lib/types";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db.select().from(profileTable).where(eq(profileTable.userId, userId)).limit(1);
  if (!row) return NextResponse.json(null);

  return NextResponse.json({
    id: row.userId,
    displayName: row.displayName,
    goals: (row.goals ?? []) as GoalOption[],
    createdAt: row.createdAt.toISOString(),
    aiEnabled: row.aiEnabled,
    preferredCheckinTime: row.preferredCheckinTime
  });
}

export async function PUT(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const [existing] = await db.select().from(profileTable).where(eq(profileTable.userId, userId)).limit(1);

  const displayName = typeof body.displayName === "string" ? body.displayName : existing?.displayName ?? "Friend";
  const goals = Array.isArray(body.goals) ? body.goals : existing?.goals ?? ["stress"];
  const aiEnabled = typeof body.aiEnabled === "boolean" ? body.aiEnabled : existing?.aiEnabled ?? false;
  const preferredCheckinTime = typeof body.preferredCheckinTime === "string" ? body.preferredCheckinTime : existing?.preferredCheckinTime ?? "09:00";

  await db
    .insert(profileTable)
    .values({
      userId,
      displayName,
      goals,
      aiEnabled,
      preferredCheckinTime
    })
    .onConflictDoUpdate({
      target: profileTable.userId,
      set: { displayName, goals, aiEnabled, preferredCheckinTime }
    });

  return NextResponse.json({ ok: true });
}
