import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { profile as profileTable } from "@/lib/db/schema";
import type { GoalOption } from "@/lib/types";
import { profilePutSchema } from "@/lib/validations";

export const GET = withApiHandler(async () => {
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
});

export const PUT = withApiHandler(async (request) => {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [body, err] = await parseAndValidate(request, profilePutSchema);
  if (err) return err;

  const [existing] = await db.select().from(profileTable).where(eq(profileTable.userId, userId)).limit(1);

  const displayName = body.displayName ?? existing?.displayName ?? "Friend";
  const goals = body.goals ?? existing?.goals ?? ["stress"];
  const aiEnabled = body.aiEnabled ?? existing?.aiEnabled ?? false;
  const preferredCheckinTime = body.preferredCheckinTime ?? existing?.preferredCheckinTime ?? "09:00";

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
});
