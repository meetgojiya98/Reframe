import { z } from "zod";

/**
 * Validate required environment variables at runtime.
 * Use in middleware, health check, or at app startup to fail fast when misconfigured.
 */
const envSchema = z.object({
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional().or(z.literal("")),
  POSTGRES_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  RATE_LIMIT_RPM: z.coerce.number().int().min(1).max(1000).optional(),
});

export type Env = z.infer<typeof envSchema>;

let validated: Env | null = null;

/**
 * Returns validated env. Throws if required vars are missing.
 * Call once at startup or in a critical path (e.g. middleware).
 */
export function getEnv(): Env {
  if (validated) return validated;
  const result = envSchema.safeParse({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    RATE_LIMIT_RPM: process.env.RATE_LIMIT_RPM,
  });
  if (!result.success) {
    const first = result.error.flatten().fieldErrors;
    const msg = Object.entries(first)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
      .join("; ");
    throw new Error(`Env validation failed: ${msg}`);
  }
  validated = result.data;
  return validated;
}

/**
 * Optional: check env without throwing. Useful for health or feature flags.
 */
export function isEnvValid(): boolean {
  return envSchema.safeParse({
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    RATE_LIMIT_RPM: process.env.RATE_LIMIT_RPM,
  }).success;
}
