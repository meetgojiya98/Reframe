import { DistortionKey, GoalOption, SkillDefinition } from "@/lib/types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Reframe";
export const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE ?? "Reframe — shift your thoughts, gently.";

export const DISCLAIMER_LINES = [
  "Educational self-coaching tool inspired by CBT.",
  "Not a substitute for professional care.",
  "If you feel unsafe or in immediate danger, reach out to a trusted person or local emergency services."
] as const;

export const GOAL_OPTIONS: Array<{ id: GoalOption; label: string }> = [
  { id: "stress", label: "Stress" },
  { id: "confidence", label: "Confidence" },
  { id: "focus", label: "Focus" },
  { id: "sleep", label: "Sleep" },
  { id: "social_anxiety", label: "Social anxiety" },
  { id: "overthinking", label: "Overthinking" },
  { id: "motivation", label: "Motivation" },
  { id: "relationships", label: "Relationships" },
  { id: "change", label: "Change" },
  { id: "other", label: "Other" }
];

export const DISTORTION_DEFINITIONS: Array<{
  key: DistortionKey;
  title: string;
  definition: string;
}> = [
  {
    key: "all_or_nothing",
    title: "All-or-nothing thinking",
    definition: "Seeing things in black-and-white categories with no middle ground."
  },
  {
    key: "overgeneralization",
    title: "Overgeneralization",
    definition: "Taking one event and assuming it will always happen."
  },
  {
    key: "mental_filter",
    title: "Mental filter",
    definition: "Focusing only on negatives while filtering out positives."
  },
  {
    key: "disqualifying_positive",
    title: "Disqualifying the positive",
    definition: "Rejecting positive experiences as not counting."
  },
  {
    key: "jumping_to_conclusions",
    title: "Jumping to conclusions",
    definition: "Assuming outcomes without enough evidence (mind reading or fortune telling)."
  },
  {
    key: "catastrophizing",
    title: "Catastrophizing",
    definition: "Expecting the worst possible outcome and underestimating coping ability."
  },
  {
    key: "emotional_reasoning",
    title: "Emotional reasoning",
    definition: "Treating feelings as proof of facts."
  },
  {
    key: "should_statements",
    title: "Should statements",
    definition: "Using rigid rules for yourself or others that create pressure and guilt."
  },
  {
    key: "labeling",
    title: "Labeling",
    definition: "Assigning global negative labels to yourself or others."
  },
  {
    key: "personalization",
    title: "Personalization",
    definition: "Taking excessive responsibility for things outside your control."
  }
];

export const COMMON_EMOTIONS = [
  "Anxious",
  "Sad",
  "Angry",
  "Overwhelmed",
  "Guilty",
  "Ashamed",
  "Frustrated",
  "Lonely",
  "Hopeful",
  "Calm"
] as const;

export const SKILLS_LIBRARY: SkillDefinition[] = [
  {
    id: "box-breathing",
    title: "Box Breathing",
    durationMinutes: 3,
    summary: "A steady breathing pattern to settle your nervous system.",
    benefits: ["Reduce immediate stress", "Improve focus", "Create a reset moment"],
    steps: [
      "Sit comfortably and relax your shoulders.",
      "Inhale through your nose for 4 counts.",
      "Hold gently for 4 counts.",
      "Exhale slowly for 4 counts.",
      "Hold for 4 counts, then repeat for 6 rounds."
    ],
    reflectionPrompt: "What changed in your body or thoughts after 3 minutes?"
  },
  {
    id: "grounding-54321",
    title: "5-4-3-2-1 Grounding",
    durationMinutes: 4,
    summary: "Anchor attention to the present through your senses.",
    benefits: ["Interrupt spiraling", "Increase presence", "Reduce worry"],
    steps: [
      "Name 5 things you can see.",
      "Name 4 things you can feel.",
      "Name 3 things you can hear.",
      "Name 2 things you can smell.",
      "Name 1 thing you can taste or appreciate right now."
    ],
    reflectionPrompt: "How present do you feel now compared to before?"
  },
  {
    id: "name-the-feeling",
    title: "Name the Feeling",
    durationMinutes: 3,
    summary: "Label your current emotion to create cognitive distance.",
    benefits: ["Reduce emotional intensity", "Improve clarity", "Support self-compassion"],
    steps: [
      "Pause and notice your body sensations.",
      "Pick one primary emotion name.",
      "Rate the intensity from 0 to 100.",
      "Say: 'I am noticing [emotion], not becoming it.'",
      "Take one slow breath and re-rate intensity."
    ],
    reflectionPrompt: "What happened to the intensity after labeling it?"
  },
  {
    id: "worry-time-container",
    title: "Worry-Time Container",
    durationMinutes: 5,
    summary: "Contain worries to a scheduled window instead of all day.",
    benefits: ["Reduce rumination", "Protect focus", "Improve control"],
    steps: [
      "Set a 10-15 minute worry slot later today.",
      "Write current worries in a short list.",
      "Tell yourself: 'I will revisit this at worry time.'",
      "Return to your next concrete task.",
      "At worry time, review list and choose one actionable item."
    ],
    reflectionPrompt: "Did postponing worry help you regain focus?"
  },
  {
    id: "behavioral-activation",
    title: "Behavioral Activation Micro-Plan",
    durationMinutes: 7,
    summary: "Use one tiny action to rebuild momentum.",
    benefits: ["Break inertia", "Boost motivation", "Increase agency"],
    steps: [
      "Pick one meaningful area (health, work, home, relationships).",
      "Choose one task that takes under 10 minutes.",
      "Reduce friction: gather tools and start point now.",
      "Do the first 2 minutes immediately.",
      "Mark it complete and note mood shift."
    ],
    reflectionPrompt: "What made this action doable today?"
  },
  {
    id: "values-clarification",
    title: "Values Clarification Mini",
    durationMinutes: 6,
    summary: "Reconnect your next step to what matters to you.",
    benefits: ["Increase meaning", "Improve decisions", "Reduce avoidance"],
    steps: [
      "Choose one value: growth, care, honesty, courage, balance.",
      "Write why this value matters today.",
      "Pick one tiny action that reflects it.",
      "Set a when/where plan for that action.",
      "Commit to a start time."
    ],
    reflectionPrompt: "How did acting from values feel different?"
  },
  {
    id: "sleep-winddown",
    title: "Sleep Wind-Down Checklist",
    durationMinutes: 8,
    summary: "A short evening routine to support more restful sleep.",
    benefits: ["Ease mental activation", "Improve sleep consistency", "Lower bedtime stress"],
    steps: [
      "Dim lights and reduce screens for 20 minutes.",
      "Write tomorrow's top 3 tasks to clear mental load.",
      "Do 2 minutes of gentle stretching.",
      "Take 6 slow breaths with long exhales.",
      "Set out what you need for the morning."
    ],
    reflectionPrompt: "Which step had the biggest calming effect?"
  },
  {
    id: "self-compassion-break",
    title: "Self-Compassion Break",
    durationMinutes: 5,
    summary: "Respond to struggle with kindness rather than harshness.",
    benefits: ["Reduce self-criticism", "Build emotional resilience", "Support recovery"],
    steps: [
      "Acknowledge: 'This is a difficult moment.'",
      "Normalize: 'Struggle is part of being human.'",
      "Offer kindness: place a hand on your chest and breathe.",
      "Ask: 'What is one caring step I can take now?'",
      "Do that one step."
    ],
    reflectionPrompt: "What changed when you shifted to a kinder tone?"
  },
  {
    id: "urge-surfing",
    title: "Urge Surfing",
    durationMinutes: 6,
    summary: "Ride out difficult urges without reacting immediately.",
    benefits: ["Increase impulse control", "Reduce reactive behavior", "Build confidence"],
    steps: [
      "Name the urge and rate intensity 0-100.",
      "Notice where it lives in your body.",
      "Breathe and observe the urge like a wave.",
      "Track intensity every minute for 5 minutes.",
      "Choose your next action intentionally."
    ],
    reflectionPrompt: "How did the urge intensity change over time?"
  },
  {
    id: "two-column-balance",
    title: "Two-Column Balance",
    durationMinutes: 5,
    summary: "Balance a harsh thought with a fairer perspective.",
    benefits: ["Reduce cognitive distortion", "Increase mental flexibility", "Support problem-solving"],
    steps: [
      "Write the harsh thought on the left.",
      "On the right, write a balanced alternative.",
      "List one piece of evidence supporting each side.",
      "Choose the statement that is most complete.",
      "Read the balanced version aloud once."
    ],
    reflectionPrompt: "Which evidence helped you re-balance the thought?"
  },
  {
    id: "micro-boundary",
    title: "Micro Boundary Script",
    durationMinutes: 4,
    summary: "Set a clear, respectful boundary in one sentence.",
    benefits: ["Protect energy", "Reduce resentment", "Improve communication"],
    steps: [
      "Name the limit you need right now.",
      "Use this script: 'I can't do X today; I can do Y by Z.'",
      "Keep tone clear and calm.",
      "Say it once without over-explaining.",
      "Notice the relief after stating your boundary."
    ],
    reflectionPrompt: "How did setting the boundary affect your stress level?"
  },
  {
    id: "three-good-things",
    title: "Three Good Things",
    durationMinutes: 4,
    summary: "Train attention toward what is working, even in small ways.",
    benefits: ["Counter negativity bias", "Build resilience", "Improve mood"],
    steps: [
      "List 3 good things from today.",
      "For each, write why it happened.",
      "Choose one you want to repeat tomorrow.",
      "Plan one action to increase its chance.",
      "Take one grateful breath."
    ],
    reflectionPrompt: "Which good thing felt most meaningful and why?"
  }
];
