import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AI_CONFIG, isAIFeatureEnabled } from "@/lib/ai/config";
import { runWithTimeoutAndRetry } from "@/lib/ai/runner";
import { runWeeklyRecap } from "@/lib/ai/app-features";

export const runtime = "nodejs";

const BodySchema = z.object({
  windowDays: z.number().int().min(1).max(90),
  checkinCount: z.number().int().min(0),
  avgMood: z.string().nullable(),
  thoughtRecordCount: z.number().int().min(0),
  skillCount: z.number().int().min(0),
  streak: z.number().int().min(0).optional()
});

export const POST = withApiHandler(async (request: Request) => {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAIFeatureEnabled("weeklyRecap")) {
    return NextResponse.json({ error: "AI weekly recap is not available." }, { status: 503 });
  }

  const rate = await checkRateLimit(`ai:${userId}`, AI_CONFIG.aiRpmPerUser);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a moment.", retryAfterMs: rate.retryAfterMs },
      { status: 429, headers: { "retry-after": String(Math.ceil(rate.retryAfterMs / 1000)) } }
    );
  }

  const [body, err] = await parseAndValidate(request, BodySchema);
  if (err) return err;

  const result = await runWithTimeoutAndRetry(
    () => runWeeklyRecap(body),
    { feature: "weekly_recap", userId }
  );
  return NextResponse.json(result);
});
