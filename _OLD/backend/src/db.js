import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

export const DB_PATH = join(dataDir, "mindswipe.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/**
 * Schema is intentionally small but future-proof:
 *  - `post` carries everything needed to render a card offline, including the
 *    correct answer + the authored explanation (`detail_html`). Shipping the
 *    answer is fine: this is learning, not an exam, and it enables offline grading.
 *  - `comment` already exists with `poster_id` so turning on user-written
 *    comments later is a route handler, not a migration. For now we only seed a
 *    few author comments (tips / related links).
 */
export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS post (
      id            INTEGER PRIMARY KEY,
      kind          TEXT    NOT NULL DEFAULT 'text',   -- 'text' | 'card'
      topic         TEXT    NOT NULL,
      difficulty    INTEGER NOT NULL DEFAULT 1,        -- 1..5
      question_type TEXT    NOT NULL DEFAULT 'reading', -- 'mcq' | 'reading'
      prompt        TEXT    NOT NULL,
      body_html     TEXT    NOT NULL DEFAULT '',
      choices_json  TEXT    NOT NULL DEFAULT '[]',     -- [{id,text}]
      answer_json   TEXT    NOT NULL DEFAULT '{}',     -- {correct:[id], explanation}
      detail_html   TEXT    NOT NULL DEFAULT '',
      tags_json     TEXT    NOT NULL DEFAULT '[]',
      like_count    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comment (
      id         INTEGER PRIMARY KEY,
      post_id    INTEGER NOT NULL REFERENCES post(id) ON DELETE CASCADE,
      poster_id  TEXT    NOT NULL,
      kind       TEXT    NOT NULL DEFAULT 'tip',   -- 'tip' | 'related' | 'question' | 'user'
      content    TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_post_feed ON post(topic, difficulty, id);
    CREATE INDEX IF NOT EXISTS idx_comment_post ON comment(post_id, id);
  `);
}

/** Turn a DB row into the JSON shape the client consumes. */
export function serializePost(row) {
  return {
    id: row.id,
    kind: row.kind,
    topic: row.topic,
    difficulty: row.difficulty,
    questionType: row.question_type,
    prompt: row.prompt,
    bodyHtml: row.body_html,
    choices: JSON.parse(row.choices_json),
    answer: JSON.parse(row.answer_json),
    detailHtml: row.detail_html,
    tags: JSON.parse(row.tags_json),
    likeCount: row.like_count,
    createdAt: row.created_at,
  };
}

export function serializeComment(row) {
  return {
    id: row.id,
    postId: row.post_id,
    posterId: row.poster_id,
    kind: row.kind,
    content: row.content,
    createdAt: row.created_at,
  };
}
