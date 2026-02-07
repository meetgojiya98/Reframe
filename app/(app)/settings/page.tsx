"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Moon,
  Target,
  Trophy,
  Brain,
  Zap,
  Heart,
  Users,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GOAL_OPTIONS, DISCLAIMER_LINES } from "@/lib/constants";
import { useProfile } from "@/hooks/use-user-data";
import { apiProfilePut, apiExportGet } from "@/lib/api";
import { GoalOption } from "@/lib/types";
import { clamp, downloadJsonFile } from "@/lib/utils";

const GOAL_ICONS: Record<GoalOption, typeof Activity> = {
  stress: Activity,
  confidence: Trophy,
  focus: Target,
  sleep: Moon,
  social_anxiety: Users,
  overthinking: Brain,
  motivation: Zap,
  relationships: Heart,
  change: Sparkles,
  other: HelpCircle
};

type ModelSettings = {
  model: string;
  temperature: number;
  maxTokens: number;
};

const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  model: "gpt-4o-mini",
  temperature: 0.5,
  maxTokens: 450
};

export default function SettingsPage() {
  const { profile, mutate: mutateProfile } = useProfile();
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [localOnly, setLocalOnly] = useState(false);

  useEffect(() => {
    try {
      const rawLocalOnly = localStorage.getItem("reframe_local_only_mode");
      setLocalOnly(rawLocalOnly ? JSON.parse(rawLocalOnly) : false);

      const rawSettings = localStorage.getItem("reframe_model_settings");
      setModelSettings(rawSettings ? { ...DEFAULT_MODEL_SETTINGS, ...JSON.parse(rawSettings) } : DEFAULT_MODEL_SETTINGS);
    } catch {
      setModelSettings(DEFAULT_MODEL_SETTINGS);
      setLocalOnly(false);
    }
  }, []);

  const updateProfile = async (patch: Partial<NonNullable<typeof profile>>) => {
    if (!profile) return;
    await apiProfilePut({ ...profile, ...patch });
    await mutateProfile();
  };

  const toggleGoal = async (goal: GoalOption) => {
    if (!profile) return;
    const hasGoal = profile.goals.includes(goal);
    const nextGoals = hasGoal
      ? profile.goals.length > 1
        ? profile.goals.filter((g) => g !== goal)
        : profile.goals
      : [...profile.goals, goal];

    await updateProfile({ goals: nextGoals });
  };

  const saveModelSettings = (next: ModelSettings) => {
    const safe = {
      model: next.model || "gpt-4o-mini",
      temperature: clamp(next.temperature, 0, 1),
      maxTokens: clamp(next.maxTokens, 64, 450)
    };
    setModelSettings(safe);
    localStorage.setItem("reframe_model_settings", JSON.stringify(safe));
    toast.success("Model settings saved locally.");
  };

  const toggleLocalOnly = (next: boolean) => {
    setLocalOnly(next);
    localStorage.setItem("reframe_local_only_mode", JSON.stringify(next));
  };

  const handleExport = async () => {
    const payload = await apiExportGet();
    downloadJsonFile(`reframe-export-${new Date().toISOString().slice(0, 10)}.json`, payload);
    toast.success("Export ready.");
  };

  const handleDeleteAll = async () => {
    const confirmation = window.confirm("Delete all your app data (check-ins, thought records, skills, etc.)? This cannot be undone.");
    if (!confirmation) return;
    await fetch("/api/user/data", { method: "DELETE", credentials: "include" });
    localStorage.removeItem("reframe_model_settings");
    localStorage.removeItem("reframe_local_only_mode");
    await mutateProfile();
    toast.success("All data deleted.");
  };

  if (profile === undefined) {
    return (
      <div className="space-y-4">
        <PageHeader title="Settings" />
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <PageHeader subtitle="Adjust privacy, AI, and data preferences." title="Settings" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg">Profile</TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-lg">Privacy & AI</TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg">Data</TabsTrigger>
          <TabsTrigger value="safety" className="rounded-lg">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-border/80 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Name, goals, and preferred check-in time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="display-name-settings">
                  Display name
                </label>
                <Input
                  id="display-name-settings"
                  onChange={(event) => updateProfile({ displayName: event.target.value })}
                  value={profile.displayName}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Goals</p>
                <p className="text-xs text-muted-foreground">Select what you&apos;d like to focus on. Used for personalized suggestions.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {GOAL_OPTIONS.map((goal) => {
                    const active = profile.goals.includes(goal.id);
                    const Icon = GOAL_ICONS[goal.id];
                    return (
                      <button
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                          active ? "border-primary bg-primary/10 text-foreground" : "hover:bg-secondary/40"
                        }`}
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        type="button"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        {goal.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="max-w-xs space-y-2">
                <label className="text-sm font-medium" htmlFor="checkin-time-settings">
                  Preferred check-in time
                </label>
                <Input
                  id="checkin-time-settings"
                  onChange={(event) => updateProfile({ preferredCheckinTime: event.target.value })}
                  type="time"
                  value={profile.preferredCheckinTime}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card className="border-border/80 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Privacy and AI</CardTitle>
              <CardDescription>
                Local-only mode keeps journaling and tracking active while disabling OpenAI calls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border/80 p-4 transition hover:bg-muted/30">
                <div>
                  <p className="font-medium">Enable AI Coach (uses OpenAI)</p>
                  <p className="text-xs text-muted-foreground">Off by default until you enable.</p>
                </div>
                <input
                  checked={profile.aiEnabled}
                  onChange={(event) => updateProfile({ aiEnabled: event.target.checked })}
                  type="checkbox"
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-muted after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-card after:shadow after:transition-[left] after:content-[''] peer-checked:bg-primary peer-checked:after:left-[22px]" />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border/80 p-4 transition hover:bg-muted/30">
                <div>
                  <p className="font-medium">Local-only mode</p>
                  <p className="text-xs text-muted-foreground">Blocks all AI requests; everything stays local.</p>
                </div>
                <input checked={localOnly} onChange={(event) => toggleLocalOnly(event.target.checked)} type="checkbox" className="peer sr-only" />
                <span className={`relative h-6 w-11 shrink-0 rounded-full after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-card after:shadow after:transition-[left] after:content-[''] ${localOnly ? "bg-primary after:left-[22px]" : "bg-muted"}`} />
              </label>

              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Advanced model settings</p>

                <label className="space-y-1 text-sm">
                  Model
                  <Input
                    onChange={(event) =>
                      setModelSettings((prev) => ({
                        ...prev,
                        model: event.target.value
                      }))
                    }
                    value={modelSettings.model}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  Temperature (0-1)
                  <Input
                    max={1}
                    min={0}
                    onChange={(event) =>
                      setModelSettings((prev) => ({
                        ...prev,
                        temperature: Number(event.target.value)
                      }))
                    }
                    step="0.1"
                    type="number"
                    value={modelSettings.temperature}
                  />
                </label>

                <label className="space-y-1 text-sm">
                  Max tokens (up to 450)
                  <Input
                    max={450}
                    min={64}
                    onChange={(event) =>
                      setModelSettings((prev) => ({
                        ...prev,
                        maxTokens: Number(event.target.value)
                      }))
                    }
                    type="number"
                    value={modelSettings.maxTokens}
                  />
                </label>

                <Button onClick={() => saveModelSettings(modelSettings)} size="sm" variant="secondary">
                  Save model settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card className="border-border/80 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Data controls</CardTitle>
              <CardDescription>Your entries stay on this device unless you export them.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={handleExport} variant="secondary">
                Export JSON
              </Button>
              <Button onClick={handleDeleteAll} variant="destructive">
                Delete all data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety">
          <Card className="border-border/80 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>Safety policy and disclaimer</CardTitle>
              <CardDescription>
                Reframe is an educational tool and not a substitute for licensed professional care.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {DISCLAIMER_LINES.map((line) => (
                <p className="rounded-lg border bg-secondary/35 p-3" key={line}>
                  {line}
                </p>
              ))}
              <p className="text-muted-foreground">
                Vercel readiness note: Your entries stay on this device unless you export them.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
