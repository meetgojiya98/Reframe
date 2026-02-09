const DEV_FALLBACK_SECRET = "reframe-dev-secret-change-in-production";

function originFromRequestUrl(requestUrl?: string): string | null {
  if (!requestUrl) return null;
  try {
    const parsed = new URL(requestUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

/**
 * Ensure NextAuth has a usable URL/secret in both dev and production.
 * - URL fallback order: explicit env -> Vercel URL -> current request origin -> localhost.
 * - Secret fallback is dev-only to avoid unstable local sessions when env is missing.
 */
export function ensureNextAuthEnv(requestUrl?: string) {
  if (!process.env.NEXTAUTH_URL) {
    const requestOrigin = originFromRequestUrl(requestUrl);
    if (process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    } else if (requestOrigin) {
      process.env.NEXTAUTH_URL = requestOrigin;
    } else if (process.env.PORT) {
      process.env.NEXTAUTH_URL = `http://localhost:${process.env.PORT}`;
    } else {
      process.env.NEXTAUTH_URL = "http://localhost:3000";
    }
  }

  if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV !== "production") {
    process.env.NEXTAUTH_SECRET = DEV_FALLBACK_SECRET;
  }

  return {
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET
  };
}
