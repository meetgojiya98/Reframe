import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Health check for load balancers and orchestrators.
 * GET /api/health → 200 when app is up; optionally checks DB.
 */
export async function GET() {
  const checks: Record<string, string> = { app: "ok" };

  if (db) {
    try {
      await db.execute(sql`SELECT 1`);
      checks.db = "ok";
    } catch {
      checks.db = "error";
      return NextResponse.json(
        { status: "degraded", checks },
        { status: 503 }
      );
    }
  } else {
    checks.db = "not_configured";
  }

  return NextResponse.json({ status: "ok", checks }, { status: 200 });
}
