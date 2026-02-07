export type GoalOption =
  | "stress"
  | "confidence"
  | "focus"
  | "sleep"
  | "social_anxiety"
  | "overthinking"
  | "motivation"
  | "relationships"
  | "change"
  | "other";

export type DistortionKey =
  | "all_or_nothing"
  | "overgeneralization"
  | "mental_filter"
  | "disqualifying_positive"
  | "jumping_to_conclusions"
  | "catastrophizing"
  | "emotional_reasoning"
  | "should_statements"
  | "labeling"
  | "personalization";

export type SafetyCategory = "self_harm_risk" | "violence_risk" | "other";

export type SafetySource = "coach" | "thought_record";

export interface Profile {
  id: string;
  displayName: string;
  goals: GoalOption[];
  createdAt: string;
  aiEnabled: boolean;
  preferredCheckinTime: string;
}

export interface DailyCheckin {
  id: string;
  dateISO: string;
  mood0to10: number;
  energy0to10: number;
  note?: string;
  createdAt: string;
}

export interface EmotionIntensity {
  name: string;
  intensity0to100: number;
}

export interface ThoughtRecord {
  id: string;
  createdAt: string;
  situation: string;
  thoughts: string;
  emotions: EmotionIntensity[];
  distortions: DistortionKey[];
  evidenceFor: string;
  evidenceAgainst: string;
  reframe: string;
  actionStep: string;
}

export interface SkillCompletion {
  id: string;
  skillId: string;
  createdAt: string;
  reflection?: string;
}

export interface SafetyEvent {
  id: string;
  createdAt: string;
  category: SafetyCategory;
  source: SafetySource;
}

export interface SavedInsight {
  id: string;
  createdAt: string;
  note: string;
}

export interface SkillDefinition {
  id: string;
  title: string;
  durationMinutes: number;
  summary: string;
  benefits: string[];
  steps: string[];
  reflectionPrompt: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type CoachMode = "coach" | "distortions" | "socratic" | "reframe";

export interface CoachSettings {
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface CoachRequest {
  messages: ChatMessage[];
  mode: CoachMode;
  context?: {
    pathway?: "thought_challenging" | "problem_solving" | "emotion_regulation";
    userName?: string;
    selectedText?: string;
  };
  settings?: Partial<CoachSettings>;
}

export interface CoachToolSuggestion {
  type: "thought_record" | "skill" | "problem_step";
  label: string;
  description: string;
  skillId?: string;
}

export interface CoachResponse {
  blocked?: boolean;
  category?: SafetyCategory;
  safeResponse?: string;
  message?: string;
  toolSuggestion?: CoachToolSuggestion;
}
