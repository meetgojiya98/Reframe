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
import { ThemeToggle } from "@/components/theme-toggle";
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
    <div className="mx-auto min-h-screen max-w-6xl overflow-x-hidden px-4 pb-[max(6rem,calc(env(safe-area-inset-bottom)+5rem))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pb-8 lg:pb-8">
      <header className="mb-4 flex min-h-[var(--header-height)] items-center justify-between gap-2 border-b border-border/60 pb-4 sm:mb-6 lg:mb-6">
        <div className="flex min-h-[44px] items-center gap-3">
          <Link
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:opacity-90"
            href="/today"
          >
            <ReframeLogo variant="full" size="sm" className="text-foreground" />
          </Link>
          {profile && (
            <p className="hidden text-sm font-medium text-foreground/90 sm:block">
              {greeting}{profile.displayName ? `, ${profile.displayName}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:opacity-90 sm:min-w-0"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-6rem)] flex-col lg:flex">
          <nav className="space-y-0.5 rounded-xl border border-border bg-card/90 p-1.5 shadow-sm backdrop-blur-sm">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Badge className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" variant="secondary">
              Your data
            </Badge>
            <p className="text-xs leading-relaxed text-muted-foreground">Stored securely with your account.</p>
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-xl items-stretch justify-between gap-0 px-1 pt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                className={cn(
                  "flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-[11px] font-medium transition-colors active:bg-primary/10",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-5 w-5 shrink-0" />
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
