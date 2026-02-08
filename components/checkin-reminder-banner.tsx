"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-user-data";
import { getTodayDateISO } from "@/lib/utils";

const STORAGE_KEY = "reframe_checkin_reminder_dismissed";
export const REMINDER_ENABLED_KEY = "reframe_checkin_reminder_enabled";
const WINDOW_MINUTES = 30;

function parseTimeHHMM(hhmm: string): { hours: number; minutes: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { hours: h ?? 9, minutes: m ?? 0 };
}

function isWithinReminderWindow(preferredHHMM: string): boolean {
  const now = new Date();
  const { hours, minutes } = parseTimeHHMM(preferredHHMM);
  const preferredMs = hours * 60 * 60 * 1000 + minutes * 60 * 1000;
  const nowMs = now.getHours() * 60 * 60 * 1000 + now.getMinutes() * 60 * 1000 + now.getSeconds() * 1000;
  const windowMs = WINDOW_MINUTES * 60 * 1000;
  return Math.abs(nowMs - preferredMs) <= windowMs;
}

function wasDismissedToday(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const date = JSON.parse(raw) as string;
    return date === getTodayDateISO();
  } catch {
    return false;
  }
}

function dismissForToday() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getTodayDateISO()));
  } catch {}
}

export function CheckinReminderBanner() {
  const { profile } = useProfile();
  const [dismissed, setDismissed] = useState(false);

  const [reminderEnabled, setReminderEnabled] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMINDER_ENABLED_KEY);
      setReminderEnabled(raw === null ? true : (JSON.parse(raw) as boolean));
    } catch {
      setReminderEnabled(true);
    }
  }, []);

  const show = useMemo(() => {
    if (!reminderEnabled || !profile?.preferredCheckinTime) return false;
    if (dismissed || wasDismissedToday()) return false;
    return isWithinReminderWindow(profile.preferredCheckinTime);
  }, [reminderEnabled, profile?.preferredCheckinTime, dismissed]);

  const handleDismiss = () => {
    dismissForToday();
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 sm:mb-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Bell className="h-4 w-4 text-primary" />
              </span>
              <p className="text-sm font-medium text-foreground">
                Time for a quick check-in? You set your reminder for around {profile?.preferredCheckinTime}.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild size="sm" className="rounded-lg">
                <Link href="/today">Check in</Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={handleDismiss}
                aria-label="Dismiss reminder"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
