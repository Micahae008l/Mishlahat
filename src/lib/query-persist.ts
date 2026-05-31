import type { QueryClient } from "@tanstack/react-query";

export const QUERY_CACHE_STORAGE_KEY = "kk-query-cache-v1";
const STORAGE_KEY = QUERY_CACHE_STORAGE_KEY;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const PERSIST_PREFIXES = new Set(["session", "dashboard", "report-history"]);

type PersistedPayload = {
  savedAt: number;
  entries: { key: readonly unknown[]; data: unknown }[];
};

export function hydrateQueryCache(client: QueryClient) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as PersistedPayload;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    for (const { key, data } of parsed.entries) {
      if (!Array.isArray(key) || key.length === 0) continue;
      if (!PERSIST_PREFIXES.has(String(key[0]))) continue;
      client.setQueryData(key, data);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function persistQueryCache(client: QueryClient) {
  if (typeof window === "undefined") return;
  try {
    const entries: PersistedPayload["entries"] = [];
    for (const query of client.getQueryCache().getAll()) {
      const head = query.queryKey[0];
      if (typeof head !== "string" || !PERSIST_PREFIXES.has(head)) continue;
      if (query.state.data === undefined) continue;
      entries.push({ key: query.queryKey, data: query.state.data });
    }
    if (entries.length === 0) return;
    const payload: PersistedPayload = { savedAt: Date.now(), entries };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function attachQueryPersistence(client: QueryClient) {
  hydrateQueryCache(client);
  return client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated") return;
    const head = event.query.queryKey[0];
    if (typeof head !== "string" || !PERSIST_PREFIXES.has(head)) return;
    if (event.query.state.status !== "success") return;
    persistQueryCache(client);
  });
}
