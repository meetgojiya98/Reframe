import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

type Bucket = {
  tokens: number;
  lastRefill: number;
  cooldownUntil?: number;
};

const buckets = new Map<string, Bucket>();

const DEFAULT_RPM = Number(process.env.RATE_LIMIT_RPM ?? 20);
const COOLDOWN_MS = 45_000;

function checkInMemory(key: string, rpm: number): RateLimitResult {
  const now = Date.now();
  const tokensPerMs = rpm / 60_000;

  const existing = buckets.get(key) ?? {
    tokens: rpm,
    lastRefill: now
  };

  const elapsed = now - existing.lastRefill;
  const refill = elapsed * tokensPerMs;

  existing.tokens = Math.min(rpm, existing.tokens + refill);
  existing.lastRefill = now;

  if (existing.cooldownUntil && now < existing.cooldownUntil) {
    buckets.set(key, existing);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: existing.cooldownUntil - now
    };
  }

  if (existing.tokens < 1) {
    existing.cooldownUntil = now + COOLDOWN_MS;
    buckets.set(key, existing);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: COOLDOWN_MS
    };
  }

  existing.tokens -= 1;
  existing.cooldownUntil = undefined;
  buckets.set(key, existing);

  return {
    allowed: true,
    remaining: Math.floor(existing.tokens),
    retryAfterMs: 0
  };
}

let upstashRatelimit: Ratelimit | null = null;

function getUpstashRatelimit(rpm: number): Ratelimit | null {
  if (upstashRatelimit) return upstashRatelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const redis = new Redis({ url, token });
  upstashRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rpm, "1 m"),
    prefix: "reframe:rl"
  });
  return upstashRatelimit;
}

/**
 * Check rate limit for the given key. Uses Upstash Redis when
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set; otherwise in-memory (per instance).
 */
export async function checkRateLimit(key: string, rpm = DEFAULT_RPM): Promise<RateLimitResult> {
  const rl = getUpstashRatelimit(rpm);
  if (rl) {
    const { success, remaining, reset } = await rl.limit(key);
    return {
      allowed: success,
      remaining: Math.max(0, remaining),
      retryAfterMs: success ? 0 : Math.max(0, reset - Date.now())
    };
  }
  return checkInMemory(key, rpm);
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "127.0.0.1";
}
