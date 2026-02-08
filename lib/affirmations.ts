/**
 * Curated gentle affirmations for daily anchor. CBT-aligned, non-cheesy.
 * Rotates by date so the same quote appears for the whole day.
 */
export const DAILY_AFFIRMATIONS = [
  "I can take one small step at a time.",
  "My feelings are valid; they are not permanent.",
  "I am allowed to rest without earning it.",
  "I can notice my thoughts without believing every one.",
  "Progress is not linear, and that's okay.",
  "I can be kind to myself even when I'm struggling.",
  "I don't have to be perfect to be enough.",
  "This moment will pass; I can ride it out.",
  "I can choose my response, even when I can't choose the situation.",
  "Small actions add up to real change.",
  "I am allowed to ask for support.",
  "I can hold both difficulty and hope at the same time.",
  "My worth is not determined by my productivity.",
  "I can pause and breathe before I react.",
  "I am learning; mistakes are part of growth.",
  "I can set a boundary and still be caring.",
  "I can feel anxious and still take the next step.",
  "Rest is part of the work, not the opposite of it.",
  "I can be gentle with myself today.",
  "I don't have to have it all figured out.",
  "One kind thought about myself counts.",
  "I can notice what's going right, even a little.",
  "I am allowed to change my mind.",
  "I can show up as I am, not as I think I should be.",
  "I can let go of what I can't control.",
  "I am enough for this moment.",
  "I can try again tomorrow.",
  "My story is still being written."
] as const;

/** Returns the affirmation for the given date (stable for the whole day). */
export function getDailyAffirmation(dateISO: string): string {
  const dayIndex = dateISO.replace(/-/g, "").slice(0, 8);
  const hash = dayIndex.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const index = Math.abs(hash) % DAILY_AFFIRMATIONS.length;
  return DAILY_AFFIRMATIONS[index];
}

/** Returns a random affirmation (optionally excluding the one for the given date). */
export function getRandomAffirmation(excludeForDate?: string): string {
  const exclude = excludeForDate ? getDailyAffirmation(excludeForDate) : undefined;
  const pool = exclude
    ? DAILY_AFFIRMATIONS.filter((a) => a !== exclude)
    : [...DAILY_AFFIRMATIONS];
  return pool[Math.floor(Math.random() * pool.length)];
}
