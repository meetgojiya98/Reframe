import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { skillCompletions } from "@/lib/db/schema";
import { skillCompletionPostSchema } from "@/lib/validations";

export const GET = withApiHandler(async (request) => {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get("skillId");

  const rows = await db
    .select()
    .from(skillCompletions)
    .where(
      skillId
        ? and(eq(skillCompletions.userId, userId), eq(skillCompletions.skillId, skillId))
        : eq(skillCompletions.userId, userId)
    )
    .orderBy(desc(skillCompletions.createdAt));

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      skillId: r.skillId,
      createdAt: r.createdAt.toISOString(),
      reflection: r.reflection ?? undefined
    }))
  );
});

export const POST = withApiHandler(async (request) => {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [body, err] = await parseAndValidate(request, skillCompletionPostSchema);
  if (err) return err;

  const id = body.id ?? `skill_${crypto.randomUUID()}`;
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

  await db.insert(skillCompletions).values({
    id,
    userId,
    skillId: body.skillId,
    reflection: body.reflection ?? null,
    createdAt
  });

  return NextResponse.json({ ok: true, id });
});
