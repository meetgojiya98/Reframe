import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureNextAuthEnv } from "@/lib/auth-config";

type RouteContext = { params: { nextauth: string[] } };

async function authHandler(request: Request, context: RouteContext) {
  // Keep URL-based CSRF/callback checks aligned with the current request origin.
  ensureNextAuthEnv(request.url);
  const handler = NextAuth(authOptions);
  return handler(request, context);
}

export const GET = authHandler;
export const POST = authHandler;
