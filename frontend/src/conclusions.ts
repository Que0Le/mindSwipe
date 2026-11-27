import type { ClassTopic, Insight, Segment, StudentEffort } from "./types";

// The conclusions layer: turn metric rows into plain-language, actionable
// statements. Pure functions over RLS-gated data — no network, easy to tune.

const MIN_TOPIC_ATTEMPTS = 5; // ignore topics with too little signal

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Segment a student relative to their cohort. */
export function segmentOf(s: StudentEffort, cohortMedianAnswered: number): Segment {
  if (s.answered < 5) return "inactive";
  const acc = s.accuracy ?? 0;
  if (acc < 55) return "at-risk";
  if (acc >= 85 && s.answered >= cohortMedianAnswered) return "ahead";
  return "on-track";
}

export function cohortMedianAnswered(students: StudentEffort[]): number {
  return median(students.filter((s) => s.role === "student").map((s) => s.answered));
}

export function firstName(name: string | null): string {
  return (name ?? "Student").split(" ")[0];
}

/** The prioritised headline insights for the Overview tab. */
export function buildInsights(
  students: StudentEffort[],
  topics: ClassTopic[],
  playlistVerdicts: { title: string; verdict: "easy" | "hard" | "balanced" | "nodata" }[]
): Insight[] {
  const out: Insight[] = [];
  const pupils = students.filter((s) => s.role === "student");
  const medAns = cohortMedianAnswered(students);
  const seg = (s: StudentEffort) => segmentOf(s, medAns);

  // --- class-wide topic strengths / weaknesses ---
  const signalTopics = topics.filter((t) => t.attempts >= MIN_TOPIC_ATTEMPTS && t.accuracy != null);
  const weak = [...signalTopics].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)).slice(0, 2);
  for (const t of weak) {
    if ((t.accuracy ?? 100) <= 55) {
      out.push({
        kind: "warn",
        text: `Class is struggling with ${t.subject ?? "?"} · ${t.topic ?? "?"} — ${t.accuracy}% correct. Worth reteaching.`,
      });
    }
  }
  const strong = [...signalTopics].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0];
  if (strong && (strong.accuracy ?? 0) >= 85) {
    out.push({ kind: "good", text: `Strong on ${strong.topic ?? "?"} — ${strong.accuracy}% across the class.` });
  }

  // --- students needing attention ---
  const atRisk = pupils.filter((s) => seg(s) === "at-risk");
  const inactive = pupils.filter((s) => seg(s) === "inactive");
  if (atRisk.length > 0) {
    const names = atRisk
      .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
      .slice(0, 3)
      .map((s) => firstName(s.displayName))
      .join(", ");
    out.push({
      kind: "warn",
      text: `${atRisk.length} student${atRisk.length > 1 ? "s" : ""} at risk (low accuracy): ${names}${atRisk.length > 3 ? ", …" : ""}.`,
    });
  }
  if (inactive.length > 0) {
    out.push({
      kind: "warn",
      text: `${inactive.length} student${inactive.length > 1 ? "s have" : " has"} barely started — nudge them to begin.`,
    });
  }

  // --- the single worst struggler, specific + actionable ---
  const worst = pupils
    .filter((s) => s.answered >= 5 && s.accuracy != null)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0];
  if (worst && (worst.accuracy ?? 100) < 55) {
    const slow = worst.medianMs != null && worst.medianMs > 12000;
    out.push({
      kind: "warn",
      text: `${firstName(worst.displayName)} is struggling — ${worst.accuracy}% over ${worst.answered} cards${
        slow ? ", and slow (trying hard, needs help)" : " (fast misses — may be guessing)"
      }.`,
    });
  }

  // --- who is ahead ---
  const ahead = pupils.filter((s) => seg(s) === "ahead");
  if (ahead.length > 0) {
    out.push({ kind: "good", text: `${ahead.length} student${ahead.length > 1 ? "s are" : " is"} ahead — ready for stretch material.` });
  }

  // --- content calibration ---
  for (const p of playlistVerdicts) {
    if (p.verdict === "hard") out.push({ kind: "info", text: `Playlist “${p.title}” is leaning hard — consider easing it in.` });
    if (p.verdict === "easy") out.push({ kind: "info", text: `Playlist “${p.title}” is leaning easy — add tougher cards.` });
  }

  if (out.length === 0) out.push({ kind: "info", text: "Not enough activity yet to draw conclusions." });
  return out;
}
