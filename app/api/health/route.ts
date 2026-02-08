import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Health check for load balancers and orchestrators.
 * GET /api/health → 200 when app is up; optionally checks DB and schema.
 * If schema_users is "missing", the DB Vercel uses is not the one where you applied the schema.
 */
export async function GET() {
  const checks: Record<string, string> = { app: "ok" };

  if (db) {
    try {
      await db.execute(sql`SELECT 1`);
      checks.db = "ok";
      try {
        await db.execute(sql`SELECT 1 FROM users LIMIT 1`);
        checks.schema_users = "ok";
      } catch {
        checks.schema_users = "missing";
      }
    } catch (err) {
      checks.db = "error";
      const msg = err instanceof Error ? err.message : String(err);
      checks.db_error = msg.replace(/postgres(ql)?:\/\/[^\s]+/gi, "[REDACTED]").split("\n")[0].slice(0, 200);
    }
  } else {
    checks.db = "not_configured";
  }

  return NextResponse.json({ status: checks.db === "error" ? "degraded" : "ok", checks }, { status: 200 });
}
