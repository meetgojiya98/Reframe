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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GOAL_OPTIONS, DISCLAIMER_LINES } from "@/lib/constants";
import { REMINDER_ENABLED_KEY } from "@/components/checkin-reminder-banner";
import { useProfile, useCheckins, useThoughtRecords, useSkillCompletions, useSavedInsights } from "@/hooks/use-user-data";
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
  const { checkins } = useCheckins();
  const { thoughtRecords } = useThoughtRecords();
  const { completions: skillCompletions } = useSkillCompletions();
  const { savedInsights } = useSavedInsights();
  const [modelSettings, setModelSettings] = useState<ModelSettings>(DEFAULT_MODEL_SETTINGS);
  const [localOnly, setLocalOnly] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  useEffect(() => {
    try {
      const rawLocalOnly = localStorage.getItem("reframe_local_only_mode");
      setLocalOnly(rawLocalOnly ? JSON.parse(rawLocalOnly) : false);

      const rawSettings = localStorage.getItem("reframe_model_settings");
      setModelSettings(rawSettings ? { ...DEFAULT_MODEL_SETTINGS, ...JSON.parse(rawSettings) } : DEFAULT_MODEL_SETTINGS);

      const rawReminder = localStorage.getItem(REMINDER_ENABLED_KEY);
      setReminderEnabled(rawReminder === null ? true : JSON.parse(rawReminder));
    } catch {
      setModelSettings(DEFAULT_MODEL_SETTINGS);
      setLocalOnly(false);
      setReminderEnabled(true);
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
      <div className="space-y-6">
        <PageHeader title="Settings" />
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Preferences"
        subtitle="Privacy, AI, and data."
        title="Settings"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex w-full rounded-xl border-2 sm:w-auto">
          <TabsTrigger value="profile" className="rounded-lg">Profile</TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-lg">Privacy & AI</TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg">Data</TabsTrigger>
          <TabsTrigger value="safety" className="rounded-lg">Safety</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Name, goals, and preferred check-in time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="display-name-settings">
                  Display name
                </label>
                <Input
                  id="display-name-settings"
                  className="rounded-xl border-2"
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
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition ${
                          active ? "border-primary bg-primary/10 text-foreground" : "border-border/80 hover:bg-muted/40"
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

              <div className="flex items-center justify-between rounded-2xl border-2 border-border/80 p-4 transition hover:bg-muted/20">
                <div>
                  <p className="font-semibold">Check-in reminder</p>
                  <p className="text-xs text-muted-foreground">Show a banner around your preferred time on the Today page.</p>
                </div>
                <Switch
                  checked={reminderEnabled}
                  onCheckedChange={(checked) => {
                    setReminderEnabled(checked);
                    localStorage.setItem(REMINDER_ENABLED_KEY, JSON.stringify(checked));
                  }}
                />
              </div>
              <div className="max-w-xs space-y-2">
                <label className="text-sm font-medium" htmlFor="checkin-time-settings">
                  Preferred check-in time
                </label>
                <Input
                  id="checkin-time-settings"
                  className="rounded-xl border-2"
                  onChange={(event) => updateProfile({ preferredCheckinTime: event.target.value })}
                  type="time"
                  value={profile.preferredCheckinTime}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Privacy and AI</CardTitle>
              <CardDescription>
                Local-only mode keeps journaling and tracking active while disabling OpenAI calls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border-2 border-border/80 p-4 transition hover:bg-muted/20">
                <div>
                  <p className="font-semibold">Enable AI Coach (uses OpenAI)</p>
                  <p className="text-xs text-muted-foreground">Off by default until you enable.</p>
                </div>
                <Switch
                  checked={profile.aiEnabled}
                  onCheckedChange={(checked) => updateProfile({ aiEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border-2 border-border/80 p-4 transition hover:bg-muted/20">
                <div>
                  <p className="font-semibold">Local-only mode</p>
                  <p className="text-xs text-muted-foreground">Blocks all AI requests; everything stays local.</p>
                </div>
                <Switch checked={localOnly} onCheckedChange={toggleLocalOnly} />
              </div>

              <div className="space-y-3 rounded-2xl border-2 border-border/80 bg-muted/10 p-4">
                <p className="text-sm font-semibold">Advanced model settings</p>

                <label className="space-y-1 text-sm">
                  Model
                  <Input
                    className="rounded-xl border-2"
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
                    className="rounded-xl border-2"
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
                    className="rounded-xl border-2"
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

                <Button className="rounded-xl" onClick={() => saveModelSettings(modelSettings)} size="sm" variant="secondary">
                  Save model settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card className="overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
            <CardHeader>
              <CardTitle>Your data at a glance</CardTitle>
              <CardDescription>Counts stored with your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border-2 border-border/60 bg-card p-4">
                  <p className="text-2xl font-bold tabular-nums">{checkins?.length ?? 0}</p>
                  <p className="text-xs font-medium text-muted-foreground">Check-ins</p>
                </div>
                <div className="rounded-xl border-2 border-border/60 bg-card p-4">
                  <p className="text-2xl font-bold tabular-nums">{thoughtRecords?.length ?? 0}</p>
                  <p className="text-xs font-medium text-muted-foreground">Thought records</p>
                </div>
                <div className="rounded-xl border-2 border-border/60 bg-card p-4">
                  <p className="text-2xl font-bold tabular-nums">{skillCompletions?.length ?? 0}</p>
                  <p className="text-xs font-medium text-muted-foreground">Skill completions</p>
                </div>
                <div className="rounded-xl border-2 border-border/60 bg-card p-4">
                  <p className="text-2xl font-bold tabular-nums">{savedInsights?.length ?? 0}</p>
                  <p className="text-xs font-medium text-muted-foreground">Saved insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Data controls</CardTitle>
              <CardDescription>Your entries stay on this device unless you export them.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button className="rounded-xl" onClick={handleExport} variant="secondary">
                Export JSON
              </Button>
              <Button className="rounded-xl" onClick={handleDeleteAll} variant="destructive">
                Delete all data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety">
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Safety policy and disclaimer</CardTitle>
              <CardDescription>
                Reframe is an educational tool and not a substitute for licensed professional care.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {DISCLAIMER_LINES.map((line) => (
                <p className="rounded-xl border-2 border-border/60 bg-muted/20 p-4 leading-relaxed" key={line}>
                  {line}
                </p>
              ))}
              <p className="text-muted-foreground">
                Your entries stay on this device unless you export them.
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
            <button
              type="button"
              onClick={() => setHowItWorksOpen((o) => !o)}
              className="flex w-full items-center justify-between p-5 text-left transition hover:bg-muted/30"
            >
              <CardTitle className="text-base">How Reframe works</CardTitle>
              <span className="text-muted-foreground">{howItWorksOpen ? "−" : "+"}</span>
            </button>
            {howItWorksOpen && (
              <CardContent className="border-t border-border/60 pt-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><strong className="text-foreground">CBT-inspired:</strong> Thought records and skills are based on evidence-based cognitive behavioral ideas.</li>
                  <li><strong className="text-foreground">Local-first:</strong> Your journal and check-ins stay on your device; no account required to try the app.</li>
                  <li><strong className="text-foreground">Optional AI:</strong> The Coach uses AI only when you enable it; you can use everything else offline.</li>
                  <li><strong className="text-foreground">Patterns, not scores:</strong> Insights help you notice trends without judging good or bad.</li>
                </ul>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
