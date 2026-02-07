"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, Save, Send } from "lucide-react";
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
        throw new Error(payload.error ?? "Coach request failed.");
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
      }

      setToolSuggestion(payload.toolSuggestion);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reach coach.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        subtitle="Educational CBT-informed self-coaching. One small step at a time."
        title="Coach"
      />

      <Card>
        <CardHeader>
          <CardTitle>Pathway</CardTitle>
          <CardDescription>Choose the direction that feels most useful right now.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {PATHWAY_OPTIONS.map((option) => {
            const active = option.id === pathway;
            return (
              <button
                className={`rounded-xl border p-3 text-left transition ${
                  active ? "border-primary bg-primary/10" : "hover:bg-secondary/40"
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
                <p className="font-medium">{option.title}</p>
                <p className="text-sm text-muted-foreground">{option.hint}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            {aiAvailable
              ? "AI Coach is enabled. Responses are suggestions, not professional advice."
              : "AI Coach is off or Local-only mode is on. You can still use structured prompts here."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-2xl border border-border/80 bg-muted/20 p-4">
            {messages.map((message, index) => {
              const isAssistant = message.role === "assistant";
              return (
                <div
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                  key={`${index}_${message.role}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      isAssistant
                        ? "rounded-bl-md bg-card border border-border/80 shadow-sm"
                        : "rounded-br-md bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {isAssistant && (
                      <button
                        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition hover:text-foreground"
                        onClick={() => saveInsight(message.content)}
                        type="button"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save insight
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/80 bg-card px-4 py-3 shadow-sm">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {(messages.length <= 1 || messages.length <= 3) && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick starters</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setText(prompt)}
                    className="rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
            <Textarea
              className="min-h-[88px] flex-1 resize-none rounded-xl sm:min-h-[44px]"
              onChange={(e) => setText(e.target.value)}
              placeholder="Share what feels most present..."
              value={text}
            />
            <Button className="min-h-[44px] shrink-0 rounded-xl sm:min-h-[40px]" disabled={loading} type="submit" size="icon">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      {toolSuggestion ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Suggested tool</CardTitle>
            <CardDescription>{toolSuggestion.label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{toolSuggestion.description}</p>
            <Button asChild variant="secondary">
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

      <Card>
        <CardHeader>
          <CardTitle>Saved insights</CardTitle>
          <CardDescription>Short notes you chose to keep locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {savedInsightsList.length ? (
            savedInsightsList.map((insight) => (
              <p className="rounded-lg border p-3 text-sm" key={insight.id}>
                {insight.note}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No saved insights yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
