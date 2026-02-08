"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type SkillTimerProps = {
  minutes: number;
  /** When true, show a breathing-style expand/collapse animation (4s cycle). */
  breathingMode?: boolean;
};

export function SkillTimer({ minutes, breathingMode = false }: SkillTimerProps) {
  const totalSeconds = useMemo(() => minutes * 60, [minutes]);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0); // 0-3 for in, hold, out, hold

  useEffect(() => {
    setRemaining(totalSeconds);
    setRunning(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || !breathingMode) return;
    const t = setInterval(() => {
      setBreathPhase((p) => (p + 1) % 4);
    }, 4000);
    return () => clearInterval(t);
  }, [running, breathingMode]);

  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(remaining % 60)
    .toString()
    .padStart(2, "0");

  const breathScale = breathingMode && running
    ? breathPhase === 0 ? 1.2 : breathPhase === 2 ? 0.85 : 1
    : 1;

  return (
    <div className="space-y-3 rounded-xl border bg-secondary/20 p-4">
      {breathingMode && (
        <p className="text-xs text-muted-foreground">
          Follow the circle: breathe in as it grows, out as it shrinks.
        </p>
      )}
      <p className="text-sm font-medium">{breathingMode ? "Breathing timer" : "Optional timer"}</p>
      <div className="flex items-center gap-4">
        <motion.div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20"
          animate={{ scale: breathScale }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <span className="font-mono text-lg font-semibold text-foreground">{mm}:{ss}</span>
        </motion.div>
        <div className="min-w-0 flex-1 space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex gap-2">
            <Button onClick={() => setRunning((prev) => !prev)} size="sm" type="button" variant="secondary">
              {running ? "Pause" : remaining === 0 ? "Restart" : "Start"}
            </Button>
            <Button
              onClick={() => {
                setRemaining(totalSeconds);
                setRunning(false);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
