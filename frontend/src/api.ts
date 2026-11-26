import type {
  Assignment,
  Comment,
  FeedPage,
  FeedSource,
  ModerationStatus,
  Playlist,
  Post,
  Stats,
  TopicMastery,
} from "./types";
import type { BoolMap, AnswerMap } from "./localState";
import { supabase } from "./supabase";
import { ensureAuth } from "./auth";

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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

interface DbPlaylistRow {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  playlist_item: { count: number }[];
}

interface DbAssignmentRow {
  id: number;
  title: string;
  description: string | null;
  source_type: "playlist" | "topic";
  playlist_id: number | null;
  topic: string | null;
  assignee: string | null;
  due_at: string | null;
}

interface DbCommentRow {
  id: number;
  post_id: number;
  body: string;
  status: ModerationStatus;
  user_id: string;
  created_at: string;
}

function mapComment(r: DbCommentRow, myId: string): Comment {
  return {
    id: r.id,
    postId: r.post_id,
    body: r.body,
    status: r.status,
    mine: r.user_id === myId,
    authorName: null,
    createdAt: r.created_at,
  };
}

interface FeedParams {
  source: FeedSource;
  cursor?: number;
  limit?: number;
}

/**
 * The one feed engine. Large open-ended sources (all / topic / random) are
 * keyset-paginated (id > cursor); bounded curated sources (playlist / assignment)
 * return their whole set in one page.
 */
export async function getFeed({ source, cursor = 0, limit = 8 }: FeedParams): Promise<FeedPage> {
  if (source.type === "playlist") {
    const { data, error } = await supabase
      .from("playlist_item")
      .select(`position, post:post(${POST_COLS})`)
      .eq("playlist_id", source.playlistId)
      .order("position", { ascending: true });
    if (error) throw error;
    const items = ((data ?? []) as unknown as { post: DbPost | null }[])
      .map((r) => r.post)
      .filter((p): p is DbPost => !!p)
      .map(mapPost);
    return { items, nextCursor: null, hasMore: false };
  }

  if (source.type === "assignment") {
    // assignment_post is a view (no FK), so PostgREST can't embed the post here;
    // fetch the ids, then the cards. Both sets are small (one assignment).
    const { data: idRows, error: idErr } = await supabase
      .from("assignment_post")
      .select("post_id")
      .eq("assignment_id", source.assignmentId);
    if (idErr) throw idErr;
    const postIds = ((idRows ?? []) as { post_id: number }[]).map((r) => r.post_id);
    if (postIds.length === 0) return { items: [], nextCursor: null, hasMore: false };
    const { data, error } = await supabase
      .from("post")
      .select(POST_COLS)
      .in("id", postIds)
      .order("id", { ascending: true });
    if (error) throw error;
    return { items: ((data ?? []) as unknown as DbPost[]).map(mapPost), nextCursor: null, hasMore: false };
  }

  // Open-ended: keyset pagination over approved posts.
  let query = supabase
    .from("post")
    .select(POST_COLS)
    .gt("id", cursor)
    .order("id", { ascending: true })
    .limit(limit + 1);
  if (source.type === "topic") query = query.eq("topic", source.topic);
  if (source.type === "random") {
    if (source.topics.length === 0) return { items: [], nextCursor: null, hasMore: false };
    query = query.in("topic", source.topics);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as DbPost[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = page.length ? page[page.length - 1].id : null;
  return { items: page.map(mapPost), nextCursor, hasMore };
}

/** A single card (deep-link / refresh). */
export async function getPost(id: number): Promise<Post | null> {
  const { data, error } = await supabase.from("post").select(POST_COLS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapPost(data as unknown as DbPost);
}

/** Topics with counts (the topic_count view), optionally filtered by a query. */
export async function getTopics(q?: string): Promise<{ topic: string; count: number }[]> {
  let query = supabase.from("topic_count").select("topic,count").order("count", { ascending: false });
  if (q && q.trim()) query = query.ilike("topic", `%${q.trim()}%`);
  const { data, error } = await query.limit(200);
  if (error) return [];
  return (data ?? []) as { topic: string; count: number }[];
}

// --- dashboard -------------------------------------------------------------

export async function getStats(): Promise<Stats> {
  await ensureAuth();
  const { data } = await supabase.from("my_stats").select("*").maybeSingle();
  return (data as Stats) ?? { answered: 0, correct: 0, likes: 0, viewed: 0 };
}

export async function getTopicMastery(): Promise<TopicMastery[]> {
  await ensureAuth();
  const { data } = await supabase.from("my_topic_mastery").select("*");
  return (data ?? []) as TopicMastery[];
}

export async function getTopicInterests(): Promise<string[]> {
  await ensureAuth();
  const { data } = await supabase.from("topic_interest").select("topic");
  return ((data ?? []) as { topic: string }[]).map((r) => r.topic);
}

export async function addTopicInterest(topic: string): Promise<void> {
  await ensureAuth();
  const { error } = await supabase.from("topic_interest").insert({ topic });
  if (error && error.code !== "23505") console.warn("addTopicInterest:", error.message);
}

export async function removeTopicInterest(topic: string): Promise<void> {
  await ensureAuth();
  const { error } = await supabase.from("topic_interest").delete().eq("topic", topic);
  if (error) console.warn("removeTopicInterest:", error.message);
}

export async function getPlaylists(): Promise<Playlist[]> {
  await ensureAuth();
  const { data, error } = await supabase
    .from("playlist")
    .select("id,slug,title,description,playlist_item(count)")
    .order("id", { ascending: true });
  if (error) return [];
  return ((data ?? []) as unknown as DbPlaylistRow[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    count: r.playlist_item?.[0]?.count ?? 0,
  }));
}

export async function getAssignments(): Promise<Assignment[]> {
  await ensureAuth();
  const [{ data: rows }, { data: prog }] = await Promise.all([
    supabase
      .from("assignment")
      .select("id,title,description,source_type,playlist_id,topic,assignee,due_at")
      .order("due_at", { ascending: true }),
    supabase.from("my_assignment_progress").select("*"),
  ]);
  const progMap = new Map<number, { total: number; attempted: number; correct: number }>();
  for (const p of (prog ?? []) as { assignment_id: number; total: number; attempted: number; correct: number }[]) {
    progMap.set(p.assignment_id, { total: p.total, attempted: p.attempted, correct: p.correct });
  }
  return ((rows ?? []) as unknown as DbAssignmentRow[]).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    sourceType: r.source_type,
    playlistId: r.playlist_id,
    topic: r.topic,
    assignee: r.assignee,
    dueAt: r.due_at,
    progress: progMap.get(r.id) ?? { total: 0, attempted: 0, correct: 0 },
  }));
}

// --- comments (teacher-moderated) ------------------------------------------

export async function getComments(postId: number): Promise<Comment[]> {
  await ensureAuth();
  // The session is already cached locally — read the id from it rather than
  // hitting /auth/v1/user, so a Detail open is a single round trip.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const myId = session?.user?.id ?? "";
  const { data, error } = await supabase
    .from("comment")
    .select("id,post_id,body,status,user_id,created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return ((data ?? []) as DbCommentRow[]).map((r) => mapComment(r, myId));
}

/** Post a comment. It lands as 'pending' — RLS forbids any other status on insert. */
export async function postComment(postId: number, tenantId: number, body: string): Promise<Comment | null> {
  await ensureAuth();
  const { data, error } = await supabase
    .from("comment")
    .insert({ post_id: postId, tenant_id: tenantId, body })
    .select("id,post_id,body,status,user_id,created_at")
    .single();
  if (error) {
    console.warn("postComment:", error.message);
    return null;
  }
  return mapComment(data as DbCommentRow, data.user_id);
}

/** Teacher/staff moderation (RLS restricts the UPDATE to staff of the tenant). */
export async function moderateComment(id: number, status: "approved" | "rejected"): Promise<void> {
  await ensureAuth();
  const { error } = await supabase.from("comment").update({ status }).eq("id", id);
  if (error) console.warn("moderateComment:", error.message);
}

// --- writes (build-1, unchanged) -------------------------------------------

export async function recordAttempt(postId: number, selected: string[], durationMs?: number): Promise<void> {
  await ensureAuth();
  const { error } = await supabase
    .from("attempt")
    .insert({ post_id: postId, selected, duration_ms: durationMs ?? null });
  if (error) console.warn("recordAttempt failed:", error.message);
}

export async function setReaction(postId: number, kind: "like" | "dislike", on: boolean): Promise<void> {
  await ensureAuth();
  if (on) {
    const { error } = await supabase.from("reaction").insert({ post_id: postId, kind });
    if (error && error.code !== "23505") console.warn("setReaction failed:", error.message);
  } else {
    const { error } = await supabase.from("reaction").delete().eq("post_id", postId).eq("kind", kind);
    if (error) console.warn("clearReaction failed:", error.message);
  }
}

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
    if (Array.isArray(a.selected) && a.selected.length) answers[a.post_id] = a.selected;
  }
  return { likes, answers };
}

/** Delete this user's attempts + reactions (RLS scopes it to their own rows). */
export async function clearUserActivity(): Promise<void> {
  await ensureAuth();
  const att = await supabase.from("attempt").delete().gte("id", 0);
  if (att.error) console.warn("clear attempts failed:", att.error.message);
  const rea = await supabase.from("reaction").delete().gte("id", 0);
  if (rea.error) console.warn("clear reactions failed:", rea.error.message);
}

export type { Post };
