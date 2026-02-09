import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { users, profile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(255).optional()
});

export const POST = withApiHandler(async (request) => {
  if (!db) {
    return NextResponse.json(
      {
        error:
          "Database not configured. Set POSTGRES_URL or DATABASE_URL in .env, then run npm run db:push."
      },
      { status: 503 }
    );
  }

  const [body, validationErr] = await parseAndValidate(request, signUpSchema);
  if (validationErr) return validationErr;

  const { email, password, name } = body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      email: normalizedEmail,
      passwordHash,
      name: name ?? null,
    });

    await db.insert(profile).values({
      userId: id,
      displayName: name ?? "Friend",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database error";
    const isSchemaError =
      typeof message === "string" &&
      (message.includes("does not exist") || message.includes("Failed query") || message.includes("relation "));
    const hint = isSchemaError
      ? " The database schema may not be applied. Run: POSTGRES_URL=\"<your-production-url>\" npm run db:push"
      : "";
    return NextResponse.json(
      { error: message + hint },
      { status: 500 }
    );
  }
});
