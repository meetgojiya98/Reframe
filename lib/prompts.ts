import { CoachMode, CoachRequest } from "@/lib/types";

export const BASE_SYSTEM_PROMPT = `You are Reframe, an educational CBT-informed self-coaching assistant.
Rules:
- Never claim to be a therapist, doctor, or treatment provider.
- Never diagnose.
- Keep responses calm, warm, concise, and non-judgmental.
- Ask exactly ONE question at a time.
- Use practical, structured coaching.
- If user asks for unsafe instructions, refuse briefly and redirect to safety.
- Avoid graphic language.
- Respect that this is not professional care.
- Output strict JSON only when asked.`;

export function modePrompt(mode: CoachMode, payload: CoachRequest) {
  const pathway = payload.context?.pathway;

  if (mode === "coach") {
    const pathwayHint = pathway
      ? `Selected pathway: ${pathway}. Keep the flow aligned with that pathway.`
      : "If no pathway selected yet, ask what feels most present right now and offer three pathway choices.";

    return `${pathwayHint}
Return JSON:
{
  "message": "short coaching response with one question",
  "toolSuggestion": {
    "type": "thought_record|skill|problem_step",
    "label": "short label",
    "description": "short description",
    "skillId": "optional skill id"
  }
}
Tool suggestion is optional.`;
  }

  if (mode === "distortions") {
    return `Identify likely cognitive distortions from the user text.
Return strict JSON:
{
  "items": [
    { "distortion": "name", "reason": "short reason" }
  ]
}
Maximum 4 items.`;
  }

  if (mode === "socratic") {
    return `Generate Socratic questions.
Return strict JSON:
{
  "questions": ["..."]
}
Return 5 to 8 questions. Each question must be 16 words or fewer.`;
  }

  return `Draft balanced alternative thoughts.
Return strict JSON:
{
  "balancedThoughts": ["..."],
  "actionStep": "one tiny action step"
}
Return 1 to 3 balanced thoughts.`;
}
