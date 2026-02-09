"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AUTH_DB_UNAVAILABLE = "DatabaseUnavailable";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/today";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl
      });
      if (res?.error) {
        if (res.error === AUTH_DB_UNAVAILABLE) {
          setError("Database is not configured. Set POSTGRES_URL or DATABASE_URL and run npm run db:push.");
          return;
        }

        if (res.error === "Configuration") {
          setError("Auth config is incomplete. Set NEXTAUTH_URL and NEXTAUTH_SECRET.");
          return;
        }

        if (res.error === "CredentialsSignin") {
          setError("Invalid email or password.");
          return;
        }

        setError(`Sign in failed: ${res.error}`);
        return;
      }

      if (!res?.ok) {
        setError("Sign in failed. Check your auth configuration and try again.");
        return;
      }

      // Stay on same origin: NextAuth's res.url can point to NEXTAUTH_URL (e.g. production), causing 404 when on localhost
      let path = "/today";
      if (typeof callbackUrl === "string") {
        if (callbackUrl.startsWith("/")) path = callbackUrl;
        else if (callbackUrl.startsWith("http")) {
          try {
            path = new URL(callbackUrl).pathname;
          } catch {
            path = "/today";
          }
        }
      }
      router.push(path);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <Card className="w-full rounded-xl border border-border bg-card shadow-md">
        <CardHeader className="space-y-1.5 pb-5">
          <CardTitle className="font-serif text-xl font-semibold tracking-tight">Sign in to Reframe</CardTitle>
          <CardDescription>Enter your email and password to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={onSubmit}>
            {error && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary underline underline-offset-2 hover:text-primary/90">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center text-muted-foreground">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
