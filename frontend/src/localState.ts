// Per-viewer state (likes, bookmarks, answers) lives in localStorage for now.
// It is shaped as plain maps keyed by post id so that attaching a real user +
// a sync endpoint later is additive - no reshaping required.

export type BoolMap = Record<number, boolean>;
export type AnswerMap = Record<number, string>;

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
  likes: "ms_likes",
  saves: "ms_saves",
  answers: "ms_answers",
} as const;

export function loadLikes(): BoolMap {
  return load<BoolMap>(KEYS.likes, {});
}
export function loadSaves(): BoolMap {
  return load<BoolMap>(KEYS.saves, {});
}
export function loadAnswers(): AnswerMap {
  return load<AnswerMap>(KEYS.answers, {});
}
