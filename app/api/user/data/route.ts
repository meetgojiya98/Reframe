import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { db } from "@/lib/db";
import {
  profile as profileTable,
  dailyCheckins,
  thoughtRecords,
  skillCompletions,
  safetyEvents,
  savedInsights
} from "@/lib/db/schema";

export async function DELETE() {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(dailyCheckins).where(eq(dailyCheckins.userId, userId));
  await db.delete(thoughtRecords).where(eq(thoughtRecords.userId, userId));
  await db.delete(skillCompletions).where(eq(skillCompletions.userId, userId));
  await db.delete(safetyEvents).where(eq(safetyEvents.userId, userId));
  await db.delete(savedInsights).where(eq(savedInsights.userId, userId));
  await db.update(profileTable).set({
    displayName: "Friend",
    goals: ["stress"],
    aiEnabled: false,
    preferredCheckinTime: "09:00"
  }).where(eq(profileTable.userId, userId));

  return NextResponse.json({ ok: true });
}
