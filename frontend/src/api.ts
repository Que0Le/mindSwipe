import type { Comment, FeedPage, Post } from "./types";
import * as offline from "./offline";

const BASE = "/api";

interface FeedParams {
  cursor?: number;
  limit?: number;
  topic?: string | null;
}

/** Fetch a feed batch. Falls back to the offline store if the network is down. */
export async function getFeed({ cursor = 0, limit = 8, topic = null }: FeedParams): Promise<FeedPage> {
  const qs = new URLSearchParams({ cursor: String(cursor), limit: String(limit) });
  if (topic) qs.set("topic", topic);
  try {
    const r = await fetch(`${BASE}/feed?${qs.toString()}`);
    if (!r.ok) throw new Error(`feed ${r.status}`);
    return (await r.json()) as FeedPage;
  } catch {
    return offline.getFeedOffline(cursor, limit, topic);
  }
}

export async function getComments(postId: number): Promise<Comment[]> {
  try {
    const r = await fetch(`${BASE}/posts/${postId}/comments`);
    if (!r.ok) throw new Error(`comments ${r.status}`);
    const j = (await r.json()) as { items: Comment[] };
    return j.items;
  } catch {
    return offline.getCommentsOffline(postId);
  }
}

export async function getTopics(): Promise<{ topic: string; count: number }[]> {
  try {
    const r = await fetch(`${BASE}/topics`);
    if (!r.ok) throw new Error("topics");
    const j = (await r.json()) as { items: { topic: string; count: number }[] };
    return j.items;
  } catch {
    return [];
  }
}

/** Download a study session and persist it to IndexedDB for offline use. */
export async function downloadBundle(topic?: string | null): Promise<number> {
  const qs = new URLSearchParams({ limit: "300" });
  if (topic) qs.set("topic", topic);
  const r = await fetch(`${BASE}/bundle?${qs.toString()}`);
  if (!r.ok) throw new Error(`bundle ${r.status}`);
  const bundle = (await r.json()) as Parameters<typeof offline.saveBundle>[0];
  await offline.saveBundle(bundle);
  return bundle.posts.length;
}

export type { Post };
