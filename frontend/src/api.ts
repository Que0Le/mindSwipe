import type { Comment, FeedPage, Post } from "./types";
import type { BoolMap, AnswerMap } from "./localState";
import { supabase, ensureAuth } from "./supabase";

// Columns we read for a card. Exercise mode ships the answer for instant grading.
const POST_COLS =
  "id,subject,topic,difficulty,locale,question_type,prompt,choices,answer,detail,content_version,created_at";

interface DbPost {
  id: number;
  subject: string | null;
  topic: string | null;
  difficulty: number | null;
  locale: string | null;
  question_type: string;
  prompt: string;
  choices: { id: string; text: string }[] | null;
  answer: { correct: string[]; explanation: string } | null;
  detail: Record<string, string | null> | null;
  content_version: number | null;
  created_at: string | null;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Compose the detail view's extra notes from the authored fields (the answer's
// explanation is shown separately by the Detail component).
function composeDetailHtml(detail: DbPost["detail"]): string {
  if (!detail) return "";
  const parts: string[] = [];
  if (detail.more_info) parts.push(`<p><strong>Hintergrund.</strong> ${esc(detail.more_info)}</p>`);
  if (detail.example) parts.push(`<p><strong>Beispiel.</strong> ${esc(detail.example)}</p>`);
  if (detail.open_question)
    parts.push(`<p class="open-q"><strong>Denkanstoß.</strong> ${esc(detail.open_question)}</p>`);
  if (detail.reference) parts.push(`<p class="ref"><em>${esc(detail.reference)}</em></p>`);
  return parts.join("");
}

function mapPost(r: DbPost): Post {
  return {
    id: r.id,
    kind: "text",
    topic: r.topic ?? "",
    difficulty: r.difficulty ?? 0,
    questionType: r.question_type === "mcq" ? "mcq" : "reading",
    prompt: r.prompt ?? "",
    bodyHtml: "",
    choices: Array.isArray(r.choices) ? r.choices : [],
    answer: r.answer ?? { correct: [], explanation: "" },
    detailHtml: composeDetailHtml(r.detail),
    tags: r.subject ? [r.subject] : [],
    likeCount: 0,
    createdAt: r.created_at ?? "",
  };
}

interface FeedParams {
  cursor?: number;
  limit?: number;
  topic?: string | null;
}

/** Keyset-paginated feed via PostgREST (id > cursor). */
export async function getFeed({ cursor = 0, limit = 8, topic = null }: FeedParams): Promise<FeedPage> {
  let query = supabase
    .from("post")
    .select(POST_COLS)
    .eq("tenant_id", 1)
    .gt("id", cursor)
    .order("id", { ascending: true })
    .limit(limit + 1); // fetch one extra to compute hasMore
  if (topic) query = query.eq("topic", topic);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as DbPost[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const items = page.map(mapPost);
  const nextCursor = page.length ? page[page.length - 1].id : null;
  return { items, nextCursor, hasMore };
}

/** A single card (deep-link / refresh). */
export async function getPost(id: number): Promise<Post | null> {
  const { data, error } = await supabase.from("post").select(POST_COLS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapPost(data as unknown as DbPost);
}

/** Topics with counts, from the topic_count view. */
export async function getTopics(): Promise<{ topic: string; count: number }[]> {
  const { data, error } = await supabase.from("topic_count").select("topic,count");
  if (error) return [];
  return (data ?? []) as { topic: string; count: number }[];
}

/** Build-1 has no comments yet. */
export async function getComments(_postId: number): Promise<Comment[]> {
  return [];
}

// --- writes: every user input lands in the DB, attributed by auth.uid() -----

/** Record one answer attempt (the chosen choice id(s)). */
export async function recordAttempt(
  postId: number,
  selected: string[],
  durationMs?: number
): Promise<void> {
  await ensureAuth();
  const { error } = await supabase
    .from("attempt")
    .insert({ post_id: postId, selected, duration_ms: durationMs ?? null });
  if (error) console.warn("recordAttempt failed:", error.message);
}

/** Turn a reaction on (insert, ignore duplicate) or off (delete). */
export async function setReaction(
  postId: number,
  kind: "like" | "dislike",
  on: boolean
): Promise<void> {
  await ensureAuth();
  if (on) {
    const { error } = await supabase.from("reaction").insert({ post_id: postId, kind });
    if (error && error.code !== "23505") console.warn("setReaction failed:", error.message);
  } else {
    const { error } = await supabase
      .from("reaction")
      .delete()
      .eq("post_id", postId)
      .eq("kind", kind);
    if (error) console.warn("clearReaction failed:", error.message);
  }
}

/** Record that the user viewed a card. */
export async function recordView(postId: number): Promise<void> {
  await ensureAuth();
  const { error } = await supabase.from("view_event").insert({ post_id: postId });
  if (error) console.warn("recordView failed:", error.message);
}

/** Hydrate per-user state (likes + answered choices) from the DB on load. */
export async function getUserState(): Promise<{ likes: BoolMap; answers: AnswerMap }> {
  await ensureAuth();
  const likes: BoolMap = {};
  const answers: AnswerMap = {};
  const [reacts, atts] = await Promise.all([
    supabase.from("reaction").select("post_id,kind").eq("kind", "like"),
    supabase.from("attempt").select("post_id,selected").order("id", { ascending: true }),
  ]);
  for (const r of (reacts.data ?? []) as { post_id: number }[]) likes[r.post_id] = true;
  for (const a of (atts.data ?? []) as { post_id: number; selected: string[] }[]) {
    const first = Array.isArray(a.selected) ? a.selected[0] : undefined;
    if (first) answers[a.post_id] = first;
  }
  return { likes, answers };
}

export type { Post };
