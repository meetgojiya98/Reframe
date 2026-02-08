"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Footprints } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { apiSkillCompletionsPost } from "@/lib/api";

const GROUNDING_STEPS = [
  { sense: "see", count: 5, label: "Name 5 things you can see.", key: "see" },
  { sense: "feel", count: 4, label: "Name 4 things you can feel (touch).", key: "feel" },
  { sense: "hear", count: 3, label: "Name 3 things you can hear.", key: "hear" },
  { sense: "smell", count: 2, label: "Name 2 things you can smell.", key: "smell" },
  { sense: "taste", count: 1, label: "Name 1 thing you can taste or appreciate right now.", key: "taste" }
] as const;

type StepIndex = 0 | 1 | 2 | 3 | 4;

export function QuickGroundingWidget({
  open,
  onOpenChange,
  onComplete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState<StepIndex>(0);
  const [inputs, setInputs] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  const config = GROUNDING_STEPS[step];
  const startIdx = GROUNDING_STEPS.slice(0, step).reduce((a, s) => a + s.count, 0);
  const endIdx = startIdx + config.count;
  const currentInputs = useMemo(() => {
    const arr: string[] = [];
    for (let i = startIdx; i < endIdx; i++) arr.push(inputs[i] ?? "");
    return arr;
  }, [inputs, startIdx, endIdx]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setInputs([]);
      setCompleted(false);
    }
  }, [open]);

  const filledCount = currentInputs.filter(Boolean).length;
  const canAdvance = step < 4 && filledCount >= config.count;
  const canFinish = step === 4 && filledCount >= 1;

  const setInputAt = (index: number, value: string) => {
    const idx = startIdx + index;
    setInputs((prev) => {
      const next = [...prev];
      while (next.length <= idx) next.push("");
      next[idx] = value.trim();
      return next;
    });
  };

  const handleNext = () => {
    if (step < 4) setStep((step + 1) as StepIndex);
    else {
      setCompleted(true);
      apiSkillCompletionsPost({
        skillId: "grounding-54321",
        reflection: "Quick grounding completed."
      }).then(() => {
        toast.success("Grounding complete. You’re more present.");
        onComplete?.();
        onOpenChange(false);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl border-border/80 bg-card shadow-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <Footprints className="h-4 w-4 text-primary" />
            </span>
            5-4-3-2-1 Grounding
          </DialogTitle>
          <DialogDescription>
            Anchor your attention in the present using your senses. Takes about a minute.
          </DialogDescription>
        </DialogHeader>
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 py-2"
            >
              <p className="text-sm font-medium text-foreground">{config.label}</p>
              <div className="space-y-2">
                {Array.from({ length: config.count }).map((_, i) => (
                  <Input
                    key={`${config.key}-${i}`}
                    className="rounded-xl border-2"
                    placeholder={`${i + 1}. ...`}
                    value={currentInputs[i] ?? ""}
                    onChange={(e) => setInputAt(i, e.target.value)}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Step {step + 1} of 5
                </span>
                <Button
                  className="rounded-xl"
                  onClick={handleNext}
                  disabled={!(canAdvance || canFinish)}
                >
                  {step === 4 ? "Done" : "Next"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-6 text-center text-sm text-muted-foreground"
            >
              Completing…
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
