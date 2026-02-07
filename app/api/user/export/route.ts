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

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profileRow] = await db.select().from(profileTable).where(eq(profileTable.userId, userId)).limit(1);
  const checkinRows = await db.select().from(dailyCheckins).where(eq(dailyCheckins.userId, userId));
  const thoughtRows = await db.select().from(thoughtRecords).where(eq(thoughtRecords.userId, userId));
  const skillRows = await db.select().from(skillCompletions).where(eq(skillCompletions.userId, userId));
  const safetyRows = await db.select().from(safetyEvents).where(eq(safetyEvents.userId, userId));
  const insightRows = await db.select().from(savedInsights).where(eq(savedInsights.userId, userId));

  const profile = profileRow
    ? {
        id: profileRow.userId,
        displayName: profileRow.displayName,
        goals: profileRow.goals ?? [],
        createdAt: profileRow.createdAt.toISOString(),
        aiEnabled: profileRow.aiEnabled,
        preferredCheckinTime: profileRow.preferredCheckinTime
      }
    : null;

  const data = {
    profile,
    dailyCheckins: checkinRows.map((r) => ({
      id: r.id,
      dateISO: r.dateISO,
      mood0to10: r.mood0to10,
      energy0to10: r.energy0to10,
      note: r.note ?? undefined,
      createdAt: r.createdAt.toISOString()
    })),
    thoughtRecords: thoughtRows.map((r) => ({
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
    })),
    skillCompletions: skillRows.map((r) => ({
      id: r.id,
      skillId: r.skillId,
      createdAt: r.createdAt.toISOString(),
      reflection: r.reflection ?? undefined
    })),
    safetyEvents: safetyRows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      category: r.category,
      source: r.source
    })),
    savedInsights: insightRows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      note: r.note
    }))
  };

  return NextResponse.json(data);
}
