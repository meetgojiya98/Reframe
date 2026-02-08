/**
 * AI audit helpers. Use for explicit logging of AI decisions (e.g. for compliance).
 * The runner already logs usage when AI_AUDIT_ENABLED=true; this is for extra context.
 */

import { AI_CONFIG } from "@/lib/ai/config";

export function auditAICall(params: {
  feature: string;
  userId?: string | null;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  extra?: Record<string, unknown>;
}): void {
  if (!AI_CONFIG.auditEnabled) return;
  const payload = {
    type: "ai_call",
    ts: new Date().toISOString(),
    ...params
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}
