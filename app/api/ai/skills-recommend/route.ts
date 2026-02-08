import { z } from "zod";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-server";
import { withApiHandler, parseAndValidate } from "@/lib/api-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { AI_CONFIG, isAIFeatureEnabled } from "@/lib/ai/config";
import { runWithTimeoutAndRetry } from "@/lib/ai/runner";
import { runSkillsRecommend } from "@/lib/ai/app-features";

export const runtime = "nodejs";

const BodySchema = z.object({
  goals: z.array(z.string()).default([]),
  recentMood: z.number().min(0).max(10).optional(),
  recentThemes: z.string().max(400).optional()
});

export const POST = withApiHandler(async (request: Request) => {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAIFeatureEnabled("skillsRecommend")) {
    return NextResponse.json({ error: "AI skill recommendations are not available." }, { status: 503 });
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
    () => runSkillsRecommend(body),
    { feature: "skills_recommend", userId }
  );
  return NextResponse.json(result);
});
