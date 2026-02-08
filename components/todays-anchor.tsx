"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Anchor, Bookmark, Sparkles, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDailyAffirmation } from "@/lib/affirmations";
import { apiSavedInsightsPost, apiAiAffirmation } from "@/lib/api";

type TodaysAnchorProps = {
  dateISO: string;
  onSaved?: () => void;
  mutateInsights?: () => void;
  aiEnabled?: boolean;
  intention?: string;
};

export function TodaysAnchor({ dateISO, onSaved, mutateInsights, aiEnabled, intention }: TodaysAnchorProps) {
  const [saved, setSaved] = useState(false);
  const [affirmation, setAffirmation] = useState(() => getDailyAffirmation(dateISO));
  const [aiLoading, setAiLoading] = useState(false);

  const handleSaveAsAnchor = async () => {
    await apiSavedInsightsPost({ note: `Anchor: ${affirmation}` });
    await mutateInsights?.();
    setSaved(true);
    onSaved?.();
    toast.success("Saved as your anchor for today.");
  };

  const fetchAiAffirmation = async () => {
    if (!aiEnabled) return;
    setAiLoading(true);
    try {
      const res = await apiAiAffirmation({ context: intention?.trim() || undefined });
      setAffirmation(res.affirmation);
    } catch {
      toast.error("Could not generate affirmation. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.07 }}
    >
      <Card className="overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <Anchor className="h-4 w-4 text-primary" />
            </span>
            Today&apos;s anchor
          </CardTitle>
          <CardDescription>A gentle phrase to return to when things feel heavy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-serif text-lg leading-relaxed italic text-foreground">&ldquo;{affirmation}&rdquo;</p>
          <div className="flex flex-wrap gap-2">
            {aiEnabled && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={fetchAiAffirmation}
                disabled={aiLoading}
              >
                {aiLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {aiLoading ? "Generating…" : "Get AI affirmation"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={handleSaveAsAnchor}
              disabled={saved}
            >
              <Bookmark className={`mr-2 h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
              {saved ? "Saved" : "Save as my anchor"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
