import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp } from "./rateLimit";

describe("getClientIp", () => {
  it("returns x-real-ip when present", () => {
    const headers = new Headers({ "x-real-ip": "192.168.1.1" });
    expect(getClientIp(headers)).toBe("192.168.1.1");
  });

  it("returns first x-forwarded-for when present", () => {
    const headers = new Headers({
      "x-forwarded-for": "10.0.0.1, 10.0.0.2",
    });
    expect(getClientIp(headers)).toBe("10.0.0.1");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4",
      "x-real-ip": "5.6.7.8",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("returns 127.0.0.1 when no ip headers", () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe("127.0.0.1");
  });
});

describe("checkRateLimit (in-memory)", () => {
  const key = "test-key-" + Math.random();

  beforeEach(() => {
    // Use a unique key per test so we don't share state
  });

  it("allows first requests up to rpm", async () => {
    const rpm = 3;
    const results = await Promise.all([
      checkRateLimit(key + "-a", rpm),
      checkRateLimit(key + "-a", rpm),
      checkRateLimit(key + "-a", rpm),
    ]);
    expect(results.every((r) => r.allowed)).toBe(true);
    expect(results[2].remaining).toBe(0);
  });

  it("denies when over limit and returns retryAfterMs", async () => {
    const uniqueKey = "limit-" + Date.now();
    const rpm = 2;
    await checkRateLimit(uniqueKey, rpm);
    await checkRateLimit(uniqueKey, rpm);
    const third = await checkRateLimit(uniqueKey, rpm);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it("returns allowed: true and remaining when under limit", async () => {
    const uniqueKey = "under-" + Date.now();
    const result = await checkRateLimit(uniqueKey, 10);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(10);
    expect(result.retryAfterMs).toBe(0);
  });
});
