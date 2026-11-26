// Per-viewer state (likes, bookmarks, answers) lives in localStorage for instant,
// offline-safe UI; Supabase is the durable store. Keys are namespaced by the
// active persona so switching identity never bleeds one user's cache into
// another's (and switching back preserves it) — no wipe needed.

export type BoolMap = Record<number, boolean>;
// The choice id(s) a student submitted for a post (one for single-answer MCQs,
// several for "select all that apply").
export type AnswerMap = Record<number, string[]>;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota - ignore; the app still works for this session.
  }
}

export const KEYS = {
  persona: "ms_persona",
  likes: "ms_likes",
  saves: "ms_saves",
  answers: "ms_answers",
} as const;

// --- active persona (the storage layer owns the selector key) --------------

export function currentPersonaKey(): string {
  try {
    return localStorage.getItem(KEYS.persona) ?? "public";
  } catch {
    return "public";
  }
}

export function rememberPersona(key: string): void {
  try {
    localStorage.setItem(KEYS.persona, key);
  } catch {
    /* private mode — session still works for this tab */
  }
}

// Per-user caches are suffixed with the active persona.
function nsKey(base: string): string {
  return `${base}_${currentPersonaKey()}`;
}

export function loadLikes(): BoolMap {
  return load<BoolMap>(nsKey(KEYS.likes), {});
}
export function loadSaves(): BoolMap {
  return load<BoolMap>(nsKey(KEYS.saves), {});
}
export function loadAnswers(): AnswerMap {
  return load<AnswerMap>(nsKey(KEYS.answers), {});
}

export function saveLikes(v: BoolMap): void {
  save(nsKey(KEYS.likes), v);
}
export function saveSaves(v: BoolMap): void {
  save(nsKey(KEYS.saves), v);
}
export function saveAnswers(v: AnswerMap): void {
  save(nsKey(KEYS.answers), v);
}
