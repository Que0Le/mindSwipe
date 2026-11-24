import type { Comment, FeedPage, OfflineInfo, Post } from "./types";

// A tiny IndexedDB layer for offline study sessions. Posts are text/JSON, so a
// few hundred cards is a small footprint. The "Download offline" action fills
// these stores; the api layer falls back to them when the network is gone.

const DB_NAME = "mindswipe";
const VERSION = 1;

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

interface Bundle {
  generatedAt: string;
  count: number;
  topic: string | null;
  posts: (Post & { comments?: Comment[] })[];
}

export async function saveBundle(bundle: Bundle): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["posts", "comments", "meta"], "readwrite");
  const posts = tx.objectStore("posts");
  const comments = tx.objectStore("comments");
  const meta = tx.objectStore("meta");
  for (const p of bundle.posts) {
    const { comments: cs, ...rest } = p;
    posts.put(rest);
    comments.put({ postId: p.id, items: cs ?? [] });
  }
  meta.put(
    { generatedAt: bundle.generatedAt, count: bundle.posts.length, topic: bundle.topic },
    "bundle"
  );
  await txDone(tx);
}

async function allPosts(): Promise<Post[]> {
  const db = await openDb();
  const tx = db.transaction("posts", "readonly");
  const rows = await toPromise(tx.objectStore("posts").getAll() as IDBRequest<Post[]>);
  return rows.sort((a, b) => a.id - b.id);
}

export async function getFeedOffline(
  cursor: number,
  limit: number,
  topic?: string | null
): Promise<FeedPage> {
  let posts = await allPosts();
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
