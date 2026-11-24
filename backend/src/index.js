import express from "express";
import cors from "cors";
import { db, migrate, serializePost, serializeComment } from "./db.js";

migrate();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MAX_LIMIT = 50;

function clampLimit(raw, fallback) {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, 1), MAX_LIMIT);
}

/**
 * Keyset (cursor) pagination over the feed. The cursor is the last post id the
 * client has seen; we return the next `limit` posts with a larger id. This is
 * the correct feed primitive - stable and O(1) regardless of how deep you scroll,
 * unlike OFFSET. Optional `topic` / `difficulty` filters.
 */
app.get("/api/feed", (req, res) => {
  const cursor = Number.parseInt(req.query.cursor, 10) || 0;
  const limit = clampLimit(req.query.limit, 10);
  const { topic, difficulty } = req.query;

  const where = ["id > ?"];
  const params = [cursor];
  if (topic) {
    where.push("topic = ?");
    params.push(topic);
  }
  if (difficulty) {
    where.push("difficulty = ?");
    params.push(Number.parseInt(difficulty, 10));
  }

  const rows = db
    .prepare(`SELECT * FROM post WHERE ${where.join(" AND ")} ORDER BY id ASC LIMIT ?`)
    .all(...params, limit + 1);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const items = page.map(serializePost);
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  res.json({ items, nextCursor, hasMore });
});

/**
 * Offline bundle: a single JSON blob of up to `limit` posts WITH their comments
 * embedded, so a client can stash a whole study session in IndexedDB and run
 * with no network. Pure text, so a few hundred cards is a small download.
 */
app.get("/api/bundle", (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 300, 1000);
  const { topic } = req.query;

  const where = [];
  const params = [];
  if (topic) {
    where.push("topic = ?");
    params.push(topic);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db.prepare(`SELECT * FROM post ${clause} ORDER BY id ASC LIMIT ?`).all(...params, limit);

  const commentsByPost = {};
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");
    const crows = db
      .prepare(`SELECT * FROM comment WHERE post_id IN (${placeholders}) ORDER BY id ASC`)
      .all(...ids);
    for (const c of crows) {
      (commentsByPost[c.post_id] ??= []).push(serializeComment(c));
    }
  }

  const posts = rows.map((r) => ({ ...serializePost(r), comments: commentsByPost[r.id] ?? [] }));
  res.json({ generatedAt: new Date().toISOString(), topic: topic ?? null, count: posts.length, posts });
});

app.get("/api/posts/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM post WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(serializePost(row));
});

app.get("/api/posts/:id/comments", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM comment WHERE post_id = ? ORDER BY id ASC")
    .all(req.params.id);
  res.json({ items: rows.map(serializeComment) });
});

app.get("/api/topics", (_req, res) => {
  const rows = db
    .prepare("SELECT topic, COUNT(*) AS count FROM post GROUP BY topic ORDER BY count DESC")
    .all();
  res.json({ items: rows });
});

/**
 * Placeholder for the write path we are NOT enabling yet but want the platform
 * to support: user-authored comments. Returns 501 so the contract is visible.
 */
app.post("/api/posts/:id/comments", (_req, res) => {
  res.status(501).json({ error: "User comments are not enabled in this phase." });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`mindSwipe API on http://localhost:${PORT}`);
});
