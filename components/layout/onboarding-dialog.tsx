"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GOAL_OPTIONS, DISCLAIMER_LINES } from "@/lib/constants";
import { apiProfilePut } from "@/lib/api";
import { GoalOption } from "@/lib/types";

type OnboardingDialogProps = {
  open: boolean;
  onDone: () => void;
};

export function OnboardingDialog({ open, onDone }: OnboardingDialogProps) {
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [goals, setGoals] = useState<GoalOption[]>(["stress"]);
  const [checkinTime, setCheckinTime] = useState("09:00");
  const progress = useMemo(() => (step / 3) * 100, [step]);

  const toggleGoal = (goal: GoalOption) => {
    setGoals((prev) => {
      if (prev.includes(goal)) {
        if (prev.length === 1) return prev;
        return prev.filter((g) => g !== goal);
      }
      return [...prev, goal];
    });
  };

  const finish = async () => {
    if (!consent) {
      toast.error("Please confirm consent to continue.");
      return;
    }

    await apiProfilePut({
      displayName: displayName.trim() || "Friend",
      goals,
      preferredCheckinTime: checkinTime
    });
    onDone();
    toast.success("Welcome to Reframe.");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4 backdrop-blur-md">
      <Card className="w-full max-w-2xl rounded-2xl border-border/80 shadow-lg">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Welcome to Reframe</CardTitle>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </CardHeader>
        <CardContent className="min-h-[360px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 10 }}
                key="step-1"
              >
                <h3 className="text-lg font-semibold">Step 1 of 3: Disclaimer and consent</h3>
                <div className="space-y-2 rounded-lg border bg-secondary/35 p-4 text-sm">
                  {DISCLAIMER_LINES.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                  <input
                    checked={consent}
                    className="mt-1"
                    onChange={(event) => setConsent(event.target.checked)}
                    type="checkbox"
                  />
                  <span>I understand this is an educational self-coaching tool and agree to continue.</span>
                </label>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="display-name">
                    What should we call you? (optional)
                  </label>
                  <Input
                    id="display-name"
                    maxLength={40}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your name"
                    value={displayName}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 10 }}
                key="step-2"
              >
                <h3 className="text-lg font-semibold">Step 2 of 3: Choose your goals</h3>
                <p className="text-sm text-muted-foreground">Pick one or more areas to focus on.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {GOAL_OPTIONS.map((goal) => {
                    const active = goals.includes(goal.id);
                    return (
                      <button
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                          active ? "border-primary bg-primary/10" : "hover:bg-secondary/40"
                        }`}
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        type="button"
                      >
                        {goal.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 10 }}
                key="step-3"
              >
                <h3 className="text-lg font-semibold">Step 3 of 3: Daily check-in time</h3>
                <p className="text-sm text-muted-foreground">
                  This stays on-device and helps you keep a gentle routine.
                </p>
                <div className="max-w-xs space-y-2">
                  <label className="text-sm font-medium" htmlFor="checkin-time">
                    Preferred time
                  </label>
                  <Input
                    id="checkin-time"
                    onChange={(event) => setCheckinTime(event.target.value)}
                    type="time"
                    value={checkinTime}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <Button className="rounded-xl" disabled={step === 1} onClick={() => setStep((prev) => prev - 1)} variant="ghost">
              Back
            </Button>
            {step < 3 ? (
              <Button className="rounded-xl" disabled={step === 1 && !consent} onClick={() => setStep((prev) => prev + 1)}>
                Continue
              </Button>
            ) : (
              <Button className="rounded-xl" onClick={finish}>Finish setup</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
