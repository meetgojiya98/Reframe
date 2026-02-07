import { ChatMessage, SafetyCategory } from "@/lib/types";

const SELF_HARM_PATTERNS = [
  /kill myself/i,
  /end my life/i,
  /suicide/i,
  /self harm/i,
  /hurt myself/i,
  /i want to die/i,
  /no reason to live/i,
  /goodbye forever/i
];

const VIOLENCE_PATTERNS = [
  /kill (him|her|them|someone)/i,
  /hurt (him|her|them|someone)/i,
  /shoot (him|her|them|someone)/i,
  /attack (him|her|them|someone)/i,
  /imminent violence/i,
  /plan to harm/i
];

export function detectHighRiskText(text: string): SafetyCategory | null {
  const normalized = text.trim();
  if (!normalized) return null;

  if (SELF_HARM_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return "self_harm_risk";
  }

  if (VIOLENCE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return "violence_risk";
  }

  return null;
}

export function detectHighRiskFromMessages(messages: ChatMessage[]): SafetyCategory | null {
  const combined = messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content)
    .join("\n");

  return detectHighRiskText(combined);
}

export function buildSafeResponse() {
  return "I'm really glad you reached out. I can't continue this coaching flow right now. Please contact a trusted person, a local professional service, or emergency services if there is immediate danger.";
}
