import useSWR from "swr";
import type { Profile } from "@/lib/types";
import {
  apiProfileGet,
  apiCheckinsGet,
  apiThoughtRecordsGet,
  apiThoughtRecordGet,
  apiSkillCompletionsGet,
  apiSavedInsightsGet
} from "@/lib/api";

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR("user/profile", apiProfileGet);
  return { profile: data ?? undefined, error, isLoading, mutate };
}

export function useCheckins() {
  const { data, error, isLoading, mutate } = useSWR("user/checkins", apiCheckinsGet);
  return { checkins: data ?? [], error, isLoading, mutate };
}

export function useThoughtRecords() {
  const { data, error, isLoading, mutate } = useSWR("user/thought-records", apiThoughtRecordsGet);
  return { thoughtRecords: data ?? [], error, isLoading, mutate };
}

export function useThoughtRecord(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `user/thought-records/${id}` : null,
    () => (id ? apiThoughtRecordGet(id) : null)
  );
  return { record: data ?? undefined, error, isLoading, mutate };
}

export function useSkillCompletions(skillId?: string) {
  const key = skillId ? `user/skill-completions/${skillId}` : "user/skill-completions";
  const { data, error, isLoading, mutate } = useSWR(key, () => apiSkillCompletionsGet(skillId));
  return { completions: data ?? [], error, isLoading, mutate };
}

export function useSavedInsights() {
  const { data, error, isLoading, mutate } = useSWR("user/saved-insights", apiSavedInsightsGet);
  return { savedInsights: data ?? [], error, isLoading, mutate };
}
