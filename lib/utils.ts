import { clsx, type ClassValue } from "clsx";
import { format, isAfter, parseISO, subDays } from "date-fns";
import { twMerge } from "tailwind-merge";
import { ChatMessage, DailyCheckin, ThoughtRecord } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

export function formatDateLabel(dateISO: string) {
  return format(parseISO(dateISO), "MMM d, yyyy");
}

export function getTodayDateISO() {
  return new Date().toISOString().slice(0, 10);
}

export function calculateGentleStreak(checkins: DailyCheckin[]) {
  if (!checkins.length) return 0;

  const dates = Array.from(new Set(checkins.map((c) => c.dateISO))).sort();
  let streak = 0;
  let cursor = getTodayDateISO();

  while (dates.includes(cursor)) {
    streak += 1;
    cursor = subDays(parseISO(`${cursor}T00:00:00.000Z`), 1).toISOString().slice(0, 10);
  }

  if (!streak) {
    const latest = dates[dates.length - 1];
    const latestDate = parseISO(`${latest}T00:00:00.000Z`);
    if (isAfter(latestDate, subDays(new Date(), 2))) {
      return 1;
    }
  }

  return streak;
}

export function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function hashString(input: string) {
  let hash = 5381;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}

export function summarizeMessagesLocally(messages: ChatMessage[], keepLast = 8): ChatMessage[] {
  if (messages.length <= keepLast) return messages;

  const older = messages.slice(0, -keepLast);
  const recent = messages.slice(-keepLast);

  const bulletSummary = older
    .filter((m) => m.role !== "system")
    .slice(-10)
    .map((m) => `- ${m.role}: ${m.content.replace(/\s+/g, " ").slice(0, 120)}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `Conversation summary for context:\n${bulletSummary}`
    },
    ...recent
  ];
}

export function pickMostCommonEmotion(thoughtRecords: ThoughtRecord[]) {
  const counts = new Map<string, number>();
  thoughtRecords.forEach((record) => {
    record.emotions.forEach((emotion) => {
      counts.set(emotion.name, (counts.get(emotion.name) ?? 0) + 1);
    });
  });
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  return top?.[0] ?? "-";
}

export function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}
