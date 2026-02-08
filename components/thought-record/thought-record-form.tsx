"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { COMMON_EMOTIONS, DISTORTION_DEFINITIONS } from "@/lib/constants";
import { detectHighRiskText } from "@/lib/safety";
import { apiSafetyEventsPost } from "@/lib/api";
import { ChatMessage, DistortionKey, EmotionIntensity, Profile, ThoughtRecord } from "@/lib/types";
import { hashString, makeId, nowIso } from "@/lib/utils";

type ThoughtRecordFormData = Omit<ThoughtRecord, "id" | "createdAt">;

type ThoughtRecordFormProps = {
  profile?: Profile;
  initialValue?: ThoughtRecord;
  /** When creating a new record, optionally pre-fill from a template or duplicate. */
  initialSituation?: string;
  initialThoughts?: string;
  onSave: (payload: ThoughtRecord) => Promise<void>;
};

const STEPS = [
  "Situation",
  "Automatic thoughts",
  "Emotions",
  "Distortions",
  "Evidence",
  "Balanced reframe",
  "Action step"
] as const;

const DEFAULT_DATA: ThoughtRecordFormData = {
  situation: "",
  thoughts: "",
  emotions: [],
  distortions: [],
  evidenceFor: "",
  evidenceAgainst: "",
  reframe: "",
  actionStep: ""
};

const assistCache = new Map<string, unknown>();

export function ThoughtRecordForm({ profile, initialValue, initialSituation, initialThoughts, onSave }: ThoughtRecordFormProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingAssist, setLoadingAssist] = useState<string | null>(null);

  const [data, setData] = useState<ThoughtRecordFormData>(
    initialValue
      ? {
          situation: initialValue.situation,
          thoughts: initialValue.thoughts,
          emotions: initialValue.emotions,
          distortions: initialValue.distortions,
          evidenceFor: initialValue.evidenceFor,
          evidenceAgainst: initialValue.evidenceAgainst,
          reframe: initialValue.reframe,
          actionStep: initialValue.actionStep
        }
      : initialSituation != null || initialThoughts != null
        ? { ...DEFAULT_DATA, situation: initialSituation ?? "", thoughts: initialThoughts ?? "" }
        : DEFAULT_DATA
  );

  const aiEnabled = Boolean(profile?.aiEnabled);
  const localOnly = useMemo(() => {
    if (typeof window === "undefined") return true;
    try {
      return JSON.parse(localStorage.getItem("reframe_local_only_mode") ?? "false") as boolean;
    } catch {
      return true;
    }
  }, []);

  const canUseAI = aiEnabled && !localOnly;

  const updateEmotion = (emotionName: string, intensity: number) => {
    setData((prev) => {
      const existing = prev.emotions.find((emotion) => emotion.name === emotionName);
      let nextEmotions: EmotionIntensity[];

      if (existing) {
        nextEmotions = prev.emotions.map((emotion) =>
          emotion.name === emotionName ? { ...emotion, intensity0to100: intensity } : emotion
        );
      } else {
        nextEmotions = [...prev.emotions, { name: emotionName, intensity0to100: intensity }];
      }

      return { ...prev, emotions: nextEmotions };
    });
  };

  const removeEmotion = (emotionName: string) => {
    setData((prev) => ({
      ...prev,
      emotions: prev.emotions.filter((emotion) => emotion.name !== emotionName)
    }));
  };

  const toggleDistortion = (distortion: DistortionKey) => {
    setData((prev) => ({
      ...prev,
      distortions: prev.distortions.includes(distortion)
        ? prev.distortions.filter((item) => item !== distortion)
        : [...prev.distortions, distortion]
    }));
  };

  const runAssist = async (mode: "distortions" | "socratic" | "reframe") => {
    if (!canUseAI) {
      toast.info("Enable AI Coach and turn off Local-only mode in Settings to use this.");
      return;
    }

    const input =
      mode === "distortions"
        ? `${data.situation}\n${data.thoughts}`
        : mode === "socratic"
          ? data.thoughts
          : `${data.thoughts}\nEvidence for: ${data.evidenceFor}\nEvidence against: ${data.evidenceAgainst}`;

    if (!input.trim()) {
      toast.error("Add some text first so suggestions are meaningful.");
      return;
    }

    const cacheKey = `${mode}_${hashString(input)}`;
    if (assistCache.has(cacheKey)) {
      applyAssist(mode, assistCache.get(cacheKey));
      toast.success("Loaded a cached suggestion.");
      return;
    }

    setLoadingAssist(mode);
    try {
      const settingsRaw = localStorage.getItem("reframe_model_settings");
      const settings = settingsRaw ? JSON.parse(settingsRaw) : undefined;

      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: [{ role: "user", content: input } satisfies ChatMessage],
          context: { selectedText: input },
          settings
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to generate suggestion.");
      }

      if (payload.blocked) {
        await apiSafetyEventsPost({
          category: payload.category ?? "other",
          source: "thought_record"
        });
        toast.warning(payload.safeResponse ?? "Safety mode activated.");
        return;
      }

      assistCache.set(cacheKey, payload.message);
      applyAssist(mode, payload.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Suggestion failed.");
    } finally {
      setLoadingAssist(null);
    }
  };

  const applyAssist = (mode: "distortions" | "socratic" | "reframe", rawMessage: unknown) => {
    if (mode === "distortions") {
      const parsed = parseJsonSafely(rawMessage, { items: [] as Array<{ distortion: string; reason: string }> });
      const matchKeys = parsed.items
        .map((item) => item.distortion.toLowerCase())
        .flatMap((name) =>
          DISTORTION_DEFINITIONS.filter((dist) => name.includes(dist.title.toLowerCase())).map((dist) => dist.key)
        );
      if (!matchKeys.length) {
        toast.info("No clear distortion match found. Review manually.");
        return;
      }
      setData((prev) => ({ ...prev, distortions: Array.from(new Set([...prev.distortions, ...matchKeys])) }));
      toast.success("Distortion suggestions added.");
      return;
    }

    if (mode === "socratic") {
      const parsed = parseJsonSafely(rawMessage, { questions: [] as string[] });
      if (!parsed.questions.length) {
        toast.info("No Socratic questions returned.");
        return;
      }
      const block = `\n\n[AI suggestion: Socratic questions]\n${parsed.questions.map((question) => `- ${question}`).join("\n")}`;
      setData((prev) => ({ ...prev, evidenceAgainst: `${prev.evidenceAgainst}${block}`.trim() }));
      toast.success("Questions added under Evidence Against as suggestions.");
      return;
    }

    const parsed = parseJsonSafely(rawMessage, {
      balancedThoughts: [] as string[],
      actionStep: ""
    });

    setData((prev) => ({
      ...prev,
      reframe: parsed.balancedThoughts.join("\n") || prev.reframe,
      actionStep: parsed.actionStep || prev.actionStep
    }));
    toast.success("Balanced reframe suggestion added.");
  };

  const submit = useCallback(async () => {
    const combinedText = [
      data.situation,
      data.thoughts,
      data.evidenceFor,
      data.evidenceAgainst,
      data.reframe,
      data.actionStep
    ].join("\n");

    const highRisk = detectHighRiskText(combinedText);
    if (highRisk) {
      await apiSafetyEventsPost({
        category: highRisk,
        source: "thought_record"
      });
      toast.warning("Safety note saved. Please reach out to trusted local support if you feel unsafe.");
      return;
    }

    setSaving(true);
    try {
      const payload: ThoughtRecord = {
        id: initialValue?.id ?? makeId("thought"),
        createdAt: initialValue?.createdAt ?? nowIso(),
        ...data
      };
      await onSave(payload);
      toast.success("Thought record saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save thought record.");
    } finally {
      setSaving(false);
    }
  }, [data, initialValue, onSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && step === STEPS.length) {
        e.preventDefault();
        if (!saving) submit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, saving, submit]);

  const stepBody = (
    <AnimatePresence mode="wait">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
        exit={{ opacity: 0, y: -8 }}
        initial={{ opacity: 0, y: 8 }}
        key={step}
      >
        {step === 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="situation">
              What happened?
            </label>
            <Textarea
              id="situation"
              onChange={(event) => setData((prev) => ({ ...prev, situation: event.target.value }))}
              placeholder="Describe the situation briefly"
              value={data.situation}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="thoughts">
              What automatic thoughts showed up?
            </label>
            <Textarea
              id="thoughts"
              onChange={(event) => setData((prev) => ({ ...prev, thoughts: event.target.value }))}
              placeholder="Write the exact thoughts that came up"
              value={data.thoughts}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select emotions and rate each intensity (0-100).</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {COMMON_EMOTIONS.map((emotionName) => {
                const selected = data.emotions.find((emotion) => emotion.name === emotionName);
                return (
                  <div className="rounded-lg border p-3" key={emotionName}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">{emotionName}</p>
                      {selected ? (
                        <button
                          className="text-xs text-muted-foreground underline"
                          onClick={() => removeEmotion(emotionName)}
                          type="button"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <Slider
                      label="Intensity"
                      max={100}
                      min={0}
                      onValueChange={(value) => updateEmotion(emotionName, value)}
                      step={5}
                      value={selected?.intensity0to100 ?? 0}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">Select any patterns that fit.</p>
              <Button
                disabled={loadingAssist === "distortions"}
                onClick={() => runAssist("distortions")}
                size="sm"
                type="button"
                variant="secondary"
              >
                {loadingAssist === "distortions" ? "Suggesting..." : "Suggest distortions"}
              </Button>
            </div>
            <div className="grid gap-2">
              {DISTORTION_DEFINITIONS.map((distortion) => {
                const checked = data.distortions.includes(distortion.key);
                return (
                  <label className="rounded-lg border p-3" key={distortion.key}>
                    <input
                      checked={checked}
                      className="mr-2"
                      onChange={() => toggleDistortion(distortion.key)}
                      type="checkbox"
                    />
                    <span className="font-medium">{distortion.title}</span>
                    <p className="ml-6 mt-1 text-sm text-muted-foreground">{distortion.definition}</p>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <label className="space-y-2 text-sm font-medium">
              Evidence for this thought
              <Textarea
                onChange={(event) => setData((prev) => ({ ...prev, evidenceFor: event.target.value }))}
                placeholder="What supports the thought?"
                value={data.evidenceFor}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Evidence against this thought
              <Textarea
                onChange={(event) => setData((prev) => ({ ...prev, evidenceAgainst: event.target.value }))}
                placeholder="What evidence points another way?"
                value={data.evidenceAgainst}
              />
            </label>
            <Button
              disabled={loadingAssist === "socratic"}
              onClick={() => runAssist("socratic")}
              size="sm"
              type="button"
              variant="secondary"
            >
              {loadingAssist === "socratic" ? "Generating..." : "Generate Socratic questions (5-8)"}
            </Button>
            <p className="text-xs text-muted-foreground">AI outputs are suggestions. Edit before saving.</p>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <label className="space-y-2 text-sm font-medium">
              Alternative balanced thought
              <Textarea
                onChange={(event) => setData((prev) => ({ ...prev, reframe: event.target.value }))}
                placeholder="Write a kinder, more complete thought"
                value={data.reframe}
              />
            </label>
            <Button
              disabled={loadingAssist === "reframe"}
              onClick={() => runAssist("reframe")}
              size="sm"
              type="button"
              variant="secondary"
            >
              {loadingAssist === "reframe" ? "Drafting..." : "Draft a balanced reframe"}
            </Button>
            <p className="text-xs text-muted-foreground">AI outputs are suggestions. Edit before saving.</p>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="action-step">
              One tiny action step
            </label>
            <Input
              id="action-step"
              maxLength={180}
              onChange={(event) => setData((prev) => ({ ...prev, actionStep: event.target.value }))}
              placeholder="Example: Send one message, then take a 5-minute walk"
              value={data.actionStep}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{initialValue ? "Edit" : "New"} Thought Record</span>
          <Badge variant="outline">
            Step {step} of {STEPS.length}
          </Badge>
        </CardTitle>
        <CardDescription>{STEPS[step - 1]}</CardDescription>
        <Progress value={(step / STEPS.length) * 100} className="mt-3 h-2" />
      </CardHeader>
      <CardContent className="space-y-5">
        {stepBody}

        <div className="flex items-center justify-between">
          <Button disabled={step === 1} onClick={() => setStep((prev) => prev - 1)} type="button" variant="ghost">
            Back
          </Button>
          <div className="flex items-center gap-2">
            {step < STEPS.length ? (
              <Button onClick={() => setStep((prev) => prev + 1)} type="button">
                Next
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <Button disabled={saving} onClick={submit} type="button">
                  {saving ? "Saving..." : "Save thought record"}
                </Button>
                <p className="text-[11px] text-muted-foreground">Ctrl+Enter to save</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function parseJsonSafely<T>(raw: unknown, fallback: T): T {
  if (typeof raw === "object" && raw !== null) {
    return raw as T;
  }

  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
