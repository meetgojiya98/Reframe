/**
 * Enterprise AI runner: timeout, retries, and optional audit.
 * Use for all LLM calls to ensure consistent reliability and observability.
 */

import { AI_CONFIG } from "@/lib/ai/config";

export interface RunAIOptions {
  feature: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Run an async AI operation with timeout and retries.
 * Throws on timeout or after maxRetries exhausted.
 */
export async function runWithTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: RunAIOptions
): Promise<T> {
  const { feature, userId, metadata } = options;
  const timeoutMs = AI_CONFIG.requestTimeoutMs;
  const maxRetries = AI_CONFIG.maxRetries;

  const runOnce = (): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`AI request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const start = Date.now();
      const result = await runOnce();
      const latencyMs = Date.now() - start;
      auditLog({ feature, userId, metadata, latencyMs, success: true });
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isRetryable =
        lastError.message.includes("timeout") ||
        lastError.message.includes("ECONNRESET") ||
        lastError.message.includes("503") ||
        lastError.message.includes("502") ||
        lastError.message.includes("429") ||
        lastError.message.includes("response_format") ||
        lastError.message.includes("parsing") ||
        lastError.message.includes("structured");
      if (attempt === maxRetries || !isRetryable) {
        auditLog({ feature, userId, metadata, success: false, error: lastError.message });
        throw lastError;
      }
    }
  }
  auditLog({ feature, userId, metadata, success: false, error: lastError?.message });
  throw lastError ?? new Error("AI request failed");
}

/**
 * Audit log for AI usage. No-op when AI_AUDIT_ENABLED is not set.
 * In production, send to your logging/monitoring (e.g. structured JSON to stdout, Datadog, etc.).
 */
function auditLog(entry: {
  feature: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  latencyMs?: number;
  success: boolean;
  error?: string;
}): void {
  if (!AI_CONFIG.auditEnabled) return;
  const payload = {
    type: "ai_usage",
    ts: new Date().toISOString(),
    feature: entry.feature,
    userId: entry.userId ?? undefined,
    latencyMs: entry.latencyMs,
    success: entry.success,
    error: entry.error,
    ...entry.metadata
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}
