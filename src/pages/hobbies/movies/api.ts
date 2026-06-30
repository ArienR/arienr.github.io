import type { LetterboxdData } from "./types";

const WORKER_URL = "https://media-api.arien.workers.dev/letterboxd";
const CACHE_KEY = "letterboxd_data";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type CachedEntry = { data: LetterboxdData; cachedAt: number };

export function readCachedLetterboxdData(): LetterboxdData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw) as CachedEntry;
    if (Date.now() - cachedAt > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeCachedLetterboxdData(data: LetterboxdData) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data, cachedAt: Date.now() }),
    );
  } catch {
    // localStorage unavailable, so skip caching.
  }
}

export function fetchLetterboxdData(): Promise<LetterboxdData> {
  return fetch(WORKER_URL).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<LetterboxdData>;
  });
}
