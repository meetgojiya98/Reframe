"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Brain,
  Home,
  LogOut,
  NotebookPen,
  Settings,
  Sparkles
} from "lucide-react";
import { OnboardingDialog } from "@/components/layout/onboarding-dialog";
import { ReframeLogo } from "@/components/reframe-logo";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/use-user-data";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/coach", label: "Coach", icon: Brain },
  { href: "/thought-records", label: "Thoughts", icon: NotebookPen },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile, mutate } = useProfile();
  const greeting = useMemo(() => getGreeting(), []);

  const showOnboarding =
    profile &&
    profile.displayName === "Friend" &&
    profile.goals.length === 1 &&
    profile.goals[0] === "stress";

  return (
    <div className="mx-auto min-h-screen max-w-6xl overflow-x-hidden px-4 pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5.5rem))] pt-4 sm:px-6 sm:pb-8 lg:pb-8">
      <header className="mb-4 flex min-h-[44px] items-center justify-between sm:mb-6 lg:mb-8">
        <div className="flex min-h-[44px] items-center gap-3">
          <Link
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-secondary/60 active:opacity-80"
            href="/today"
          >
            <ReframeLogo variant="full" size="sm" className="text-foreground" />
          </Link>
          {profile && (
            <p className="hidden text-sm text-muted-foreground sm:block">
              {greeting}{profile.displayName ? `, ${profile.displayName}` : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground active:opacity-80 sm:min-w-0"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </header>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-6rem)] flex-col lg:flex">
          <nav className="space-y-0.5 rounded-2xl border border-border/80 bg-card/80 p-2 shadow-sm backdrop-blur">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 rounded-2xl border border-border/80 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
            <Badge className="mb-2" variant="secondary">
              Your data
            </Badge>
            <p>Stored securely with your account.</p>
          </div>
        </aside>

        <motion.main
          animate={{ opacity: 1, y: 0 }}
          className="min-w-0 space-y-6 overflow-x-hidden"
          initial={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-card/95 backdrop-blur lg:hidden [padding-bottom:env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-xl items-stretch justify-between gap-0 px-1 pt-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                className={cn(
                  "flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-[11px] font-medium transition active:bg-secondary/50",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-6 w-6 shrink-0" />
                <span className="truncate px-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <OnboardingDialog onDone={() => mutate()} open={!!showOnboarding} />
    </div>
  );
}
