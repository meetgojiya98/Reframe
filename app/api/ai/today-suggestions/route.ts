import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AI_CONFIG, isAIFeatureEnabled } from "@/lib/ai/config";
import { runWithTimeoutAndRetry } from "@/lib/ai/runner";
import { runTodaySuggestions } from "@/lib/ai/app-features";

export const runtime = "nodejs";

const BodySchema = z.object({
  mood: z.number().min(0).max(10),
  energy: z.number().min(0).max(10),
  goals: z.array(z.string()).optional(),
  recentActions: z.string().max(500).optional(),
  intention: z.string().max(300).optional()
});

export const POST = withApiHandler(async (request: Request) => {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAIFeatureEnabled("todaySuggestions")) {
    return NextResponse.json({ error: "AI today suggestions are not available." }, { status: 503 });
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
    () => runTodaySuggestions(body),
    { feature: "today_suggestions", userId }
  );
  return NextResponse.json(result);
});
