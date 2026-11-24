import type { Comment, FeedPage, OfflineInfo, Post } from "./types";

// A tiny IndexedDB layer for offline study sessions. Posts are text/JSON, so a
// few hundred cards is a small footprint. The "Prepare offline" action fills
// these stores; the api layer falls back to them when the network is gone.

const DB_NAME = "mindswipe";
const VERSION = 1;

// ---------------------------------------------------------------------------
// Offline cache cap (tune here).
//
// Prevents the offline DB from growing without bound. We keep the *newest* full
// cards — the ones you're most likely to scroll back up to — until we hit
// EITHER a count limit OR a byte budget, whichever comes first. Older cards are
// trimmed to id-only "stubs": the feed skips them while offline, but the app
// still knows they exist and re-fetches them from the network when you scroll
// back to them online. Beyond MAX_TRACKED_IDS total records, the oldest ids are
// dropped entirely. Cleanup runs lazily — only when a "Prepare offline" batch
// is saved — never on every scroll.
// ---------------------------------------------------------------------------
export const OFFLINE_CAP = {
  maxFullPosts: 150, // keep at most this many full cards...
  maxFullBytes: 5 * 1024 * 1024, // ...or this many bytes, whichever is hit first
  maxTrackedIds: 1000, // full + stub records combined; drop the oldest beyond this
};

let dbp: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("posts")) db.createObjectStore("posts", { keyPath: "id" });
      if (!db.objectStoreNames.contains("comments")) db.createObjectStore("comments", { keyPath: "postId" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function toPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// A stored record is either a full Post or an id-only stub left behind after
// eviction. Stubs carry nothing but the id (+ the flag), per the size cap.
type Stub = { id: number; stub: true };
type Stored = Post | Stub;

function isStub(r: Stored): r is Stub {
  return (r as Stub).stub === true;
}

/** Approximate the on-disk footprint of a record (ASCII ≈ 1 byte/char). */
function estimateSize(rec: Stored): number {
  try {
    return JSON.stringify(rec).length;
  } catch {
    return 0;
  }
}

interface Bundle {
  generatedAt: string;
  topic: string | null;
  cursor: number;
  nextCursor: number;
  hasMore: boolean;
  count: number;
  posts: (Post & { comments?: Comment[] })[];
}

export interface SaveResult {
  added: number;
  count: number;
  cursor: number;
  hasMore: boolean;
}

interface CapStats {
  full: number;
  stubs: number;
  bytes: number;
}

/**
 * Enforce the offline size cap. Keeps the newest full posts within the count /
 * byte budget, demotes the rest to id-only stubs, and drops the oldest ids once
 * the total record count exceeds the cap. Runs in a single read-write
 * transaction. Lazy by design: called after a prepare-offline batch, not on
 * scroll.
 */
export async function enforceOfflineCap(): Promise<CapStats> {
  const db = await openDb();
  const tx = db.transaction(["posts", "comments"], "readwrite");
  const postsStore = tx.objectStore("posts");
  const commentsStore = tx.objectStore("comments");
  const all = await toPromise(postsStore.getAll() as IDBRequest<Stored[]>);

  const fulls = all.filter((r): r is Post => !isStub(r));
  const stubs = all.filter(isStub);

  // Keep the newest full posts (highest id = most recently prepared) until we
  // hit either the count or the byte budget. Everything older gets demoted.
  fulls.sort((a, b) => b.id - a.id); // newest first
  let bytes = 0;
  const keep: Post[] = [];
  const demote: Post[] = [];
  for (const p of fulls) {
    const size = estimateSize(p);
    if (keep.length < OFFLINE_CAP.maxFullPosts && bytes + size <= OFFLINE_CAP.maxFullBytes) {
      keep.push(p);
      bytes += size;
    } else {
      demote.push(p);
    }
  }

  // Total tracked ids = kept full + stubs. Keep the newest stub ids within what
  // the budget leaves after full posts; drop the rest entirely.
  const stubBudget = Math.max(0, OFFLINE_CAP.maxTrackedIds - keep.length);
  const stubCandidates = [...stubs.map((s) => s.id), ...demote.map((p) => p.id)].sort((a, b) => b - a);
  const stubKeep = new Set(stubCandidates.slice(0, stubBudget));

  // Existing stubs that no longer fit the budget: delete outright.
  for (const s of stubs) {
    if (!stubKeep.has(s.id)) {
      postsStore.delete(s.id);
      commentsStore.delete(s.id);
    }
  }
  // Demoted full posts: drop their comments; keep an id-only stub if it fits,
  // otherwise remove the post record too.
  for (const p of demote) {
    commentsStore.delete(p.id);
    if (stubKeep.has(p.id)) postsStore.put({ id: p.id, stub: true } satisfies Stub);
    else postsStore.delete(p.id);
  }

  await txDone(tx);
  return { full: keep.length, stubs: stubKeep.size, bytes };
}

/**
 * Append a bundle batch to the local store (does not clear existing posts),
 * advance the saved cursor so the next call continues where this one stopped,
 * then enforce the size cap.
 */
export async function saveBundle(bundle: Bundle): Promise<SaveResult> {
  const db = await openDb();
  const tx = db.transaction(["posts", "comments"], "readwrite");
  const posts = tx.objectStore("posts");
  const comments = tx.objectStore("comments");
  for (const p of bundle.posts) {
    const { comments: cs, ...rest } = p;
    posts.put(rest); // full post — overwrites any earlier stub with the same id
    comments.put({ postId: p.id, items: cs ?? [] });
  }
  await txDone(tx);

  // Lazy cleanup: enforce the cap right after this prepare-offline batch.
  const stats = await enforceOfflineCap();

  const info: OfflineInfo = {
    generatedAt: bundle.generatedAt,
    count: stats.full,
    stubCount: stats.stubs,
    bytes: stats.bytes,
    topic: bundle.topic,
    cursor: bundle.nextCursor,
    hasMore: bundle.hasMore,
  };
  const mtx = db.transaction("meta", "readwrite");
  mtx.objectStore("meta").put(info, "bundle");
  await txDone(mtx);

  return { added: bundle.posts.length, count: stats.full, cursor: bundle.nextCursor, hasMore: bundle.hasMore };
}

/** All full (non-stub) posts, sorted by id ascending. */
async function allFullPosts(): Promise<Post[]> {
  const db = await openDb();
  const tx = db.transaction("posts", "readonly");
  const rows = await toPromise(tx.objectStore("posts").getAll() as IDBRequest<Stored[]>);
  return rows.filter((r): r is Post => !isStub(r)).sort((a, b) => a.id - b.id);
}

export async function getFeedOffline(
  cursor: number,
  limit: number,
  topic?: string | null
): Promise<FeedPage> {
  // Stubs are skipped offline — their content was trimmed and is only available
  // from the network (the api layer re-fetches when online).
  let posts = await allFullPosts();
  if (topic) posts = posts.filter((p) => p.topic === topic);
  const after = posts.filter((p) => p.id > cursor);
  const page = after.slice(0, limit);
  const hasMore = after.length > limit;
  return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null, hasMore };
}

export async function getCommentsOffline(postId: number): Promise<Comment[]> {
  const db = await openDb();
  const tx = db.transaction("comments", "readonly");
  const rec = await toPromise(
    tx.objectStore("comments").get(postId) as IDBRequest<{ postId: number; items: Comment[] } | undefined>
  );
  return rec?.items ?? [];
}

export async function getOfflineInfo(): Promise<OfflineInfo | null> {
  try {
    const db = await openDb();
    const tx = db.transaction("meta", "readonly");
    const info = await toPromise(tx.objectStore("meta").get("bundle") as IDBRequest<OfflineInfo | undefined>);
    return info ?? null;
  } catch {
    return null;
  }
}

export async function clearOffline(): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["posts", "comments", "meta"], "readwrite");
  tx.objectStore("posts").clear();
  tx.objectStore("comments").clear();
  tx.objectStore("meta").clear();
  await txDone(tx);
}
