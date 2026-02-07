const BASE = "";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function apiProfileGet() {
  return fetchJson<{
    id: string;
    displayName: string;
    goals: string[];
    createdAt: string;
    aiEnabled: boolean;
    preferredCheckinTime: string;
  } | null>(`${BASE}/api/user/profile`);
}

export async function apiProfilePut(body: {
  displayName?: string;
  goals?: string[];
  aiEnabled?: boolean;
  preferredCheckinTime?: string;
}) {
  return fetchJson<{ ok: boolean }>(`${BASE}/api/user/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiCheckinsGet() {
  return fetchJson<
    Array<{
      id: string;
      dateISO: string;
      mood0to10: number;
      energy0to10: number;
      note?: string;
      createdAt: string;
    }>
  >(`${BASE}/api/user/checkins`);
}

export async function apiCheckinsPost(body: {
  id?: string;
  dateISO: string;
  mood0to10: number;
  energy0to10: number;
  note?: string;
  createdAt?: string;
}) {
  return fetchJson<{ ok: boolean }>(`${BASE}/api/user/checkins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiThoughtRecordsGet() {
  return fetchJson<
    Array<{
      id: string;
      createdAt: string;
      situation: string;
      thoughts: string;
      emotions: { name: string; intensity0to100: number }[];
      distortions: string[];
      evidenceFor: string;
      evidenceAgainst: string;
      reframe: string;
      actionStep: string;
    }>
  >(`${BASE}/api/user/thought-records`);
}

export async function apiThoughtRecordGet(id: string) {
  return fetchJson<{
    id: string;
    createdAt: string;
    situation: string;
    thoughts: string;
    emotions: { name: string; intensity0to100: number }[];
    distortions: string[];
    evidenceFor: string;
    evidenceAgainst: string;
    reframe: string;
    actionStep: string;
  }>(`${BASE}/api/user/thought-records/${id}`);
}

export async function apiThoughtRecordPost(body: {
  id?: string;
  createdAt?: string;
  situation: string;
  thoughts: string;
  emotions: { name: string; intensity0to100: number }[];
  distortions: string[];
  evidenceFor: string;
  evidenceAgainst: string;
  reframe: string;
  actionStep: string;
}) {
  return fetchJson<{ ok: boolean; id: string }>(`${BASE}/api/user/thought-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiThoughtRecordPut(id: string, body: Record<string, unknown>) {
  return fetchJson<{ ok: boolean }>(`${BASE}/api/user/thought-records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiThoughtRecordDelete(id: string) {
  return fetchJson<{ ok: boolean }>(`${BASE}/api/user/thought-records/${id}`, { method: "DELETE" });
}

export async function apiSkillCompletionsGet(skillId?: string) {
  const url = skillId
    ? `${BASE}/api/user/skill-completions?skillId=${encodeURIComponent(skillId)}`
    : `${BASE}/api/user/skill-completions`;
  return fetchJson<
    Array<{
      id: string;
      skillId: string;
      createdAt: string;
      reflection?: string;
    }>
  >(url);
}

export async function apiSkillCompletionsPost(body: {
  id?: string;
  skillId: string;
  reflection?: string;
  createdAt?: string;
}) {
  return fetchJson<{ ok: boolean; id: string }>(`${BASE}/api/user/skill-completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiSavedInsightsGet() {
  return fetchJson<
    Array<{
      id: string;
      createdAt: string;
      note: string;
    }>
  >(`${BASE}/api/user/saved-insights`);
}

export async function apiSavedInsightsPost(body: { id?: string; note: string; createdAt?: string }) {
  return fetchJson<{ ok: boolean; id: string }>(`${BASE}/api/user/saved-insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiSafetyEventsPost(body: {
  id?: string;
  category: string;
  source: string;
  createdAt?: string;
}) {
  return fetchJson<{ ok: boolean }>(`${BASE}/api/user/safety-events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export async function apiExportGet() {
  return fetchJson<{
    profile: unknown;
    dailyCheckins: unknown[];
    thoughtRecords: unknown[];
    skillCompletions: unknown[];
    safetyEvents: unknown[];
    savedInsights: unknown[];
  }>(`${BASE}/api/user/export`);
}
