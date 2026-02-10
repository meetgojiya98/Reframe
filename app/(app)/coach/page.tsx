"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { LoaderCircle, Save, Send, Copy, RotateCcw, FileText, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useSavedInsights } from "@/hooks/use-user-data";
import { apiSavedInsightsPost, apiSafetyEventsPost } from "@/lib/api";
import { ChatMessage, CoachResponse } from "@/lib/types";
import { summarizeMessagesLocally } from "@/lib/utils";

const INITIAL_ASSISTANT_MESSAGE = "What's feeling most present right now?";

const QUICK_PROMPTS = [
  "I'm stuck on a thought",
  "I need to problem-solve",
  "I want to try a quick skill first",
  "I'm feeling overwhelmed",
  "Help me challenge a belief",
  "What's a small step I can take?",
  "I'm anxious about something",
  "I want to reframe this situation"
];

const FOLLOW_UP_PROMPTS = [
  "Tell me more",
  "What's one small step I could take?",
  "I'd like to try a skill first",
  "Help me look at the evidence"
];

const PATHWAY_OPTIONS = [
  {
    id: "thought_challenging",
    title: "Thought challenging",
    hint: "Examine one thought and test it with evidence.",
    toolHref: "/thought-records/new"
  },
  {
    id: "problem_solving",
    title: "Problem solving",
    hint: "Define the problem, generate options, and choose one next step.",
    toolHref: "/today"
  },
  {
    id: "emotion_regulation",
    title: "Emotion regulation",
    hint: "Use a short grounding or breathing skill now.",
    toolHref: "/skills"
  }
] as const;

type Pathway = (typeof PATHWAY_OPTIONS)[number]["id"] | null;

export default function CoachPage() {
  const { profile } = useProfile();
  const { savedInsights, mutate: mutateInsights } = useSavedInsights();
  const savedInsightsList = savedInsights.slice(0, 3);

  const [pathway, setPathway] = useState<Pathway>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_ASSISTANT_MESSAGE }
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);
  const [modelSettings, setModelSettings] = useState({
    model: "gpt-4o-mini",
    temperature: 0.5,
    maxTokens: 450
  });
  const [toolSuggestion, setToolSuggestion] = useState<CoachResponse["toolSuggestion"]>();
  const [runtimeAiIssue, setRuntimeAiIssue] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawLocalOnly = localStorage.getItem("reframe_local_only_mode");
      setLocalOnly(rawLocalOnly ? JSON.parse(rawLocalOnly) : false);

      const rawModel = localStorage.getItem("reframe_model_settings");
      if (rawModel) {
        setModelSettings((prev) => ({ ...prev, ...JSON.parse(rawModel) }));
      }
    } catch {
      setLocalOnly(false);
      setModelSettings({ model: "gpt-4o-mini", temperature: 0.5, maxTokens: 450 });
    }
  }, []);

  const aiAvailable = Boolean(profile?.aiEnabled) && !localOnly;
  const currentPathway = useMemo(() => PATHWAY_OPTIONS.find((item) => item.id === pathway), [pathway]);
  const configuredAiIssue = useMemo(() => {
    if (localOnly) {
      return "Local-only mode is enabled, so AI replies are turned off.";
    }
    if (profile && !profile.aiEnabled) {
      return "AI Coach is turned off in Settings, so guided fallback replies are being used.";
    }
    return null;
  }, [localOnly, profile]);

  const coachNotice = runtimeAiIssue ?? configuredAiIssue;

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
  };

  const saveInsight = async (note: string) => {
    const trimmed = note.trim();
    if (!trimmed) return;
    await apiSavedInsightsPost({ note: trimmed.slice(0, 280) });
    await mutateInsights();
    toast.success("Insight saved.");
  };

  const localFallbackReply = (input: string) => {
    if (!pathway) {
      return "Would thought challenging, problem solving, or emotion regulation feel most useful right now?";
    }

    if (pathway === "thought_challenging") {
      return `Let's test one thought gently. What evidence supports, and what evidence challenges: "${input.slice(0, 80)}"?`;
    }

    if (pathway === "problem_solving") {
      return "What is one version of this problem you can influence in the next 24 hours?";
    }

    return "Before we go further, would you like to try 3 minutes of box breathing or grounding first?";
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userText = text.trim();
    if (!userText || loading) return;

    setText("");
    const nextMessages = [...messages, { role: "user", content: userText } satisfies ChatMessage];
    setMessages(nextMessages);

    if (!aiAvailable) {
      setRuntimeAiIssue(null);
      addAssistantMessage(localFallbackReply(userText));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode: "coach",
          messages: summarizeMessagesLocally(nextMessages),
          context: {
            pathway
          },
          settings: modelSettings
        })
      });

      const payload = (await response.json()) as CoachResponse & { error?: string };

      if (!response.ok) {
        const errorMessage = payload.error ?? "Coach request failed.";
        setRuntimeAiIssue(
          errorMessage.includes("OpenAI is not configured")
            ? "AI service is not configured on the server right now. Showing guided fallback replies."
            : "AI service is temporarily unavailable. Showing guided fallback replies."
        );
        addAssistantMessage(
          errorMessage.includes("OpenAI is not configured")
            ? "AI coach is currently unavailable because OpenAI is not configured. You can still use the guided prompts here, or enable AI after setting OPENAI_API_KEY."
            : `I couldn't generate an AI response just now (${errorMessage}). Let's keep going: ${localFallbackReply(userText)}`
        );
        setToolSuggestion(undefined);
        toast.error(errorMessage);
        return;
      }

      if (payload.blocked) {
        await apiSafetyEventsPost({
          category: payload.category ?? "other",
          source: "coach"
        });
        addAssistantMessage(payload.safeResponse ?? "I can't continue this flow right now. Please seek immediate trusted local support.");
        setToolSuggestion(undefined);
        return;
      }

      if (payload.message) {
        addAssistantMessage(payload.message);
        setRuntimeAiIssue(null);
      } else {
        setRuntimeAiIssue("AI returned no message. Showing guided fallback replies.");
        addAssistantMessage(localFallbackReply(userText));
      }

      setToolSuggestion(payload.toolSuggestion);
    } catch (error) {
      // Keep the conversation moving even when AI/API fails.
      setRuntimeAiIssue("AI service is temporarily unavailable. Showing guided fallback replies.");
      addAssistantMessage(localFallbackReply(userText));
      toast.error(error instanceof Error ? error.message : "Could not reach coach.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Self-coaching"
        subtitle="Educational CBT-informed support. One small step at a time."
        title="Coach"
      />

      {coachNotice ? (
        <Card className="rounded-2xl border-amber-300/60 bg-amber-50/70 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
              <p className="text-sm text-amber-900 dark:text-amber-100">{coachNotice}</p>
            </div>
            {configuredAiIssue && !localOnly ? (
              <Button asChild size="sm" variant="outline" className="shrink-0 rounded-lg border-amber-400/60">
                <Link href="/settings">Open Settings</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Choose a pathway</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {PATHWAY_OPTIONS.map((option) => {
            const active = option.id === pathway;
            return (
              <button
                className={`rounded-2xl border-2 p-4 text-left transition-all ${
                  active
                    ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
                    : "border-border/80 hover:border-primary/30 hover:bg-muted/40"
                }`}
                key={option.id}
                onClick={() => {
                  setPathway(option.id);
                  setToolSuggestion({
                    type: option.id === "emotion_regulation" ? "skill" : option.id === "thought_challenging" ? "thought_record" : "problem_step",
                    label: option.title,
                    description: option.hint
                  });
                }}
                type="button"
              >
                <p className="font-semibold">{option.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{option.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                {aiAvailable
                  ? "AI Coach is enabled. Responses are suggestions, not professional advice."
                  : "AI Coach is off or Local-only mode is on. You can still use structured prompts here."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {messages.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-muted-foreground"
                  onClick={() => {
                    const summary = messages
                      .filter((m) => m.role === "user" || m.content !== INITIAL_ASSISTANT_MESSAGE)
                      .map((m) => (m.role === "user" ? `You: ${m.content.slice(0, 120)}${m.content.length > 120 ? "…" : ""}` : `Coach: ${m.content.slice(0, 120)}${m.content.length > 120 ? "…" : ""}`))
                      .join("\n");
                    navigator.clipboard.writeText(summary || "No messages yet.");
                    toast.success("Conversation summary copied.");
                  }}
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Copy summary
                </Button>
              )}
              {messages.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-muted-foreground"
                  onClick={() => {
                    setMessages([{ role: "assistant", content: INITIAL_ASSISTANT_MESSAGE }]);
                    setToolSuggestion(undefined);
                    toast.success("Conversation cleared.");
                  }}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Start over
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[420px] space-y-4 overflow-y-auto overflow-x-hidden rounded-2xl border-2 border-border/80 bg-muted/10 p-4">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => {
                const isAssistant = message.role === "assistant";
                return (
                  <motion.div
                    className={`flex gap-2 ${isAssistant ? "justify-start" : "justify-end"}`}
                    key={`${index}_${message.role}`}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    {isAssistant ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                        C
                      </span>
                    ) : null}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        isAssistant
                          ? "rounded-tl-md bg-card border border-border/80 shadow-sm"
                          : "rounded-tr-md bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {isAssistant && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
                            onClick={() => {
                              navigator.clipboard.writeText(message.content);
                              toast.success("Copied to clipboard.");
                            }}
                            type="button"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                          <button
                            className="inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
                            onClick={() => saveInsight(message.content)}
                            type="button"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save insight
                          </button>
                        </div>
                      )}
                    </div>
                    {!isAssistant ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        You
                      </span>
                    ) : null}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {loading && (
              <div className="flex justify-start gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">C</span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border/80 bg-card px-4 py-3 shadow-sm">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            {!loading && messages.length >= 2 && messages[messages.length - 1]?.role === "assistant" && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="w-full text-[11px] font-medium text-muted-foreground sm:w-auto">Follow up:</span>
                {FOLLOW_UP_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setText(prompt)}
                    className="rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick starters</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setText(prompt)}
                  className="rounded-xl border-2 border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
            <Textarea
              className="min-h-[88px] flex-1 resize-none rounded-xl border-2 sm:min-h-[48px]"
              onChange={(e) => setText(e.target.value)}
              placeholder="Share what feels most present..."
              value={text}
            />
            <Button className="min-h-[48px] shrink-0 rounded-xl sm:min-h-[48px]" disabled={loading} type="submit" size="icon">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {toolSuggestion ? (
        <Card className="overflow-hidden rounded-2xl border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle>Suggested tool</CardTitle>
            <CardDescription>{toolSuggestion.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{toolSuggestion.description}</p>
            <Button asChild className="rounded-xl" variant="secondary">
              <Link
                href={
                  toolSuggestion.type === "thought_record"
                    ? "/thought-records/new"
                    : toolSuggestion.type === "skill"
                      ? toolSuggestion.skillId
                        ? `/skills/${toolSuggestion.skillId}`
                        : "/skills"
                      : currentPathway?.toolHref ?? "/today"
                }
              >
                Open tool
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Saved insights</CardTitle>
          <CardDescription>Short notes you chose to keep locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {savedInsightsList.length ? (
            savedInsightsList.map((insight) => (
              <p className="rounded-xl border-2 border-border/60 bg-muted/20 p-4 text-sm leading-relaxed" key={insight.id}>
                {insight.note}
              </p>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-4 text-sm text-muted-foreground">No saved insights yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
