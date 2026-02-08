import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { savedInsights } from "@/lib/db/schema";
import { savedInsightPostSchema } from "@/lib/validations";

export const GET = withApiHandler(async () => {
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
});

export const POST = withApiHandler(async (request) => {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [body, err] = await parseAndValidate(request, savedInsightPostSchema);
  if (err) return err;

  const id = body.id ?? `insight_${crypto.randomUUID()}`;
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

  await db.insert(savedInsights).values({
    id,
    userId,
    note: body.note,
    createdAt
  });

  return NextResponse.json({ ok: true, id });
});
