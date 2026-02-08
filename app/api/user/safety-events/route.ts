import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { safetyEvents } from "@/lib/db/schema";
import { safetyEventPostSchema } from "@/lib/validations";

export const POST = withApiHandler(async (request) => {
  const userId = await getCurrentUserId();
  if (!userId || !db) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [body, err] = await parseAndValidate(request, safetyEventPostSchema);
  if (err) return err;

  const id = body.id ?? `safety_${crypto.randomUUID()}`;
  const createdAt = body.createdAt ? new Date(body.createdAt) : new Date();

  await db.insert(safetyEvents).values({
    id,
    userId,
    category: body.category,
    source: body.source,
    createdAt
  });

  return NextResponse.json({ ok: true });
});
