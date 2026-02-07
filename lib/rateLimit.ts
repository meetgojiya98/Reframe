type Bucket = {
  tokens: number;
  lastRefill: number;
  cooldownUntil?: number;
};

const buckets = new Map<string, Bucket>();

const DEFAULT_RPM = Number(process.env.RATE_LIMIT_RPM ?? 20);
const COOLDOWN_MS = 45_000;

export function checkRateLimit(key: string, rpm = DEFAULT_RPM) {
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

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return headers.get("x-real-ip") ?? "127.0.0.1";
}
