"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const PHASES = [
  { label: "Breathe in", duration: 4 },
  { label: "Hold", duration: 4 },
  { label: "Breathe out", duration: 4 },
  { label: "Hold", duration: 4 }
];

type PhaseIndex = 0 | 1 | 2 | 3;

export function QuickBreathingWidget({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [phase, setPhase] = useState<PhaseIndex>(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsInPhase, setSecondsInPhase] = useState(0);

  const phaseConfig = PHASES[phase];
  const scale = phase === 0 ? 1.15 : phase === 2 ? 0.85 : 1;

  const advance = useCallback(() => {
    setSecondsInPhase((s) => {
      const next = s + 1;
      if (next >= phaseConfig.duration) {
        if (phase === 3) {
          setCycleCount((c) => c + 1);
          setPhase(0);
        } else {
          setPhase((phase + 1) as PhaseIndex);
        }
        return 0;
      }
      return next;
    });
  }, [phase, phaseConfig.duration]);

  useEffect(() => {
    if (!open) {
      setPhase(0);
      setCycleCount(0);
      setSecondsInPhase(0);
      setIsRunning(false);
    }
  }, [open]);

  useEffect(() => {
    if (!isRunning || !open) return;
    const t = setInterval(advance, 1000);
    return () => clearInterval(t);
  }, [isRunning, open, advance]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/80 bg-card shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Box breathing</DialogTitle>
          <DialogDescription>
            4 counts in, 4 hold, 4 out, 4 hold. Calms the nervous system in a few rounds.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <motion.div
            className="relative flex h-40 w-40 items-center justify-center rounded-full bg-primary/15"
            animate={{ scale }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-4 rounded-full border-2 border-primary/40"
              animate={{ scale: 1.1 - (phase === 0 ? 0.2 : phase === 2 ? 0.2 : 0) }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={phase}
                className="text-center text-sm font-medium text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {phaseConfig.label}
                <br />
                <span className="text-muted-foreground">{phaseConfig.duration - secondsInPhase}s</span>
              </motion.span>
            </AnimatePresence>
          </motion.div>
          <p className="text-xs text-muted-foreground">Round {cycleCount + 1}</p>
          <Button
            className="rounded-xl"
            onClick={() => setIsRunning((r) => !r)}
            variant={isRunning ? "secondary" : "default"}
          >
            {isRunning ? "Pause" : "Start"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
