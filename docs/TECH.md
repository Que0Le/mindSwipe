# mindSwipe — technical documentation

Covers the Phase 1 prototype as built, plus the forward-looking decisions that
keep later phases cheap.

## Stack and rationale

| Layer | Choice | Why |
| --- | --- | --- |
| Backend runtime | Node.js | Ubiquitous, same language as the frontend |
| HTTP | Express 4 | Boring, mature, minimal |
| Database | SQLite via `better-sqlite3` | Single file, microsecond reads, zero ops; read-mostly workload fits it for a long runway |
| Frontend | React 18 + TypeScript | Standard, typed |
| Build / dev | Vite 6 | Fast dev server, simple proxy, PWA-friendly |
| Delivery | PWA (manifest + service worker) | Installable, offline-capable, no app store needed |

Everything is intentionally conservative. The one decision with a future
inflection point is the database — see [Scaling path](#scaling-path).

## Repository layout

```
mindSwipe/
├─ package.json            # npm workspaces + dev scripts (concurrently)
├─ backend/
│  ├─ data/                # mindswipe.db (gitignored, created by seed)
│  └─ src/
│     ├─ db.js             # connection, schema/migrate, row serializers
│     ├─ seed.js           # authored card content -> SQLite
│     └─ index.js          # Express app + routes
└─ frontend/
   ├─ public/              # manifest.webmanifest, sw.js
   └─ src/
      ├─ main.tsx          # bootstrap + SW registration (prod only)
      ├─ App.tsx           # shell: topbar, topic filter, offline, state
      ├─ api.ts            # fetch layer with offline fallback
      ├─ offline.ts        # IndexedDB bundle store
      ├─ localState.ts     # localStorage: likes / saves / answers
      ├─ types.ts          # shared types
      └─ components/
         ├─ Feed.tsx       # virtualized snap feed
         ├─ Card.tsx       # card render + MCQ grading + action rail
         └─ Detail.tsx     # full solution view
```

## Data model

Two tables. Small, but shaped so writes (comments, users) are additive later.

### `post`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | Feed cursor key |
| `kind` | TEXT | `text` \| `card` (CSS-styled "image") |
| `topic` | TEXT | e.g. "OCP Java" |
| `difficulty` | INTEGER | 1–5 |
| `question_type` | TEXT | `mcq` \| `reading` |
| `prompt` | TEXT | The question / title line |
| `body_html` | TEXT | Card body (HTML fragment) |
| `choices_json` | TEXT | `[{id,text}]` for MCQ |
| `answer_json` | TEXT | `{correct:[id], explanation}` |
| `detail_html` | TEXT | Authored solution / tips shown in the detail view |
| `tags_json` | TEXT | `["streams", …]` |
| `like_count` | INTEGER | Seed/author baseline |
| `created_at` | TEXT | ISO datetime |

Design notes:

- **Everything needed to render — including the correct answer and the
  explanation — ships in the post.** That's intentional: this is learning, not an
  exam, and it enables fully offline grading.
- **`detail_html` (the authored solution) is separate from the `comment` table.**
  The solution always ships with the card and must work offline; social comments
  are a separate collection. We deliberately did not overload "comments" to carry
  the solution.
- **No binary assets.** "Image" cards are built from HTML/CSS, so the whole
  payload stays JSON text — tiny offline bundles, no asset pipeline in Phase 1.

### `comment`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | INTEGER PK | |
| `post_id` | INTEGER FK | → `post(id)`, `ON DELETE CASCADE` |
| `poster_id` | TEXT | Author id; ready for real users later |
| `kind` | TEXT | `tip` \| `related` \| `question` \| `user` |
| `content` | TEXT | |
| `created_at` | TEXT | ISO datetime |

Only author notes are seeded today. `poster_id` already exists so user-written
comments become a route handler, not a migration.

## API

Base path `/api`. JSON in, JSON out.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/feed?cursor=&limit=&topic=&difficulty=` | A feed batch (keyset pagination) |
| GET | `/bundle?cursor=&limit=&topic=` | Keyset-paginated batch of posts **with** comments, for offline (append the next 100) |
| GET | `/posts/:id` | A single post |
| GET | `/posts/:id/comments` | A post's notes / comments |
| GET | `/topics` | Topics with counts |
| GET | `/health` | Liveness |
| POST | `/posts/:id/comments` | **Reserved — returns 501.** User comments, a later phase |

### Pagination

Keyset (cursor) on `id`: the client sends the last id it has, the server returns
the next `limit` posts with a larger id, plus `nextCursor` and `hasMore`. This is
O(1) however deep you scroll — unlike `OFFSET`, which degrades. `limit` is
clamped server-side (max 50 on the feed).

### Serialization

The DB stores JSON-ish columns as text; `serializePost` / `serializeComment` in
[db.js](../backend/src/db.js) parse them into real objects so the client never
sees `*_json` strings.

## Frontend internals

### Feed virtualization (the part that must stay smooth)

[Feed.tsx](../frontend/src/components/Feed.tsx):

- The feed is a scroll container with `scroll-snap-type: y mandatory`; each card
  is exactly one viewport (`100dvh`) with `scroll-snap-align: start`.
- Only a **window** of cards around the active one is mounted
  (`active-1 … active+2`). Off-window slots render as empty, full-height
  placeholders, so scroll height / position is preserved while the DOM stays
  tiny. Verified: scrolled to card 3 → 4 cards mounted, the rest placeholders.
- The active index is derived from `scrollTop / clientHeight`, read in a
  `requestAnimationFrame` throttle on scroll.
- When the active index nears the end of the loaded list, the next batch is
  prefetched. De-duped by id so overlapping fetches can't double-insert.
- Changing the topic filter resets the list and scroll to top.

This hand-rolled approach is enough for text/HTML cards. Heavier (video) cards in
Phase 3 may warrant revisiting it.

### Offline

[offline.ts](../frontend/src/offline.ts) + [api.ts](../frontend/src/api.ts):

- "Save offline" calls `/bundle`, which returns posts with comments embedded, and
  stores them in IndexedDB (`posts`, `comments`, `meta` stores).
- The api layer tries the network first and **falls back to IndexedDB** on
  failure, so feed and comments keep working offline.
- A service worker ([sw.js](../frontend/public/sw.js)) caches the app shell in
  production builds (network-first for navigations). It deliberately does **not**
  cache `/api` responses — the explicit offline store owns that data.

#### Size cap

The offline store is bounded so it can't grow without limit (the audience is
phones). `enforceOfflineCap()` in [offline.ts](../frontend/src/offline.ts) keeps
the **newest** full cards up to a count *or* a byte budget — whichever is hit
first — and trims the rest to **id-only stubs**:

- `OFFLINE_CAP`: `maxFullPosts` (150), `maxFullBytes` (5 MB), `maxTrackedIds`
  (1000 full + stub records; oldest ids dropped beyond that).
- A stub is just `{ id, stub: true }`. The offline feed skips stubs, so a
  trimmed card never renders empty; when the user scrolls back to it **online**,
  the network-first api layer serves the full card again (re-fetch by id — no
  special path needed).
- Cleanup is **lazy**: it runs only after a "Prepare offline" batch is saved,
  never on scroll. Re-preparing a batch overwrites a stub with the full card.
- Size is estimated by serialized length (ASCII ≈ 1 byte/char) — cheap, no
  stored metadata.

### Per-viewer state

[localState.ts](../frontend/src/localState.ts): likes, bookmarks, and answered
questions live in `localStorage` as plain maps keyed by post id. Shaped so a real
user id + a sync endpoint can adopt them later without reshaping. Answers lock on
first choice (no changing your answer after grading).

## Running

```bash
npm install     # installs both workspaces and seeds the DB
npm run dev      # API on :4000, web on :5173, together
npm run seed     # re-seed SQLite
npm run build    # production build of the frontend
```

Vite proxies `/api` → the backend, so the browser sees a single origin.

### Ports and LAN access

Configurable via env; the Vite dev server binds all interfaces (`host: true`) so
other devices on the same Wi-Fi can connect:

- `PORT` — backend port (default 4000)
- `API_PORT` — where Vite's proxy looks for the backend (keep equal to `PORT`)
- `WEB_PORT` — frontend port (default 5173)

```powershell
$env:PORT=5000; $env:API_PORT=5000; $env:WEB_PORT=3000; npm run dev
```

Then open `http://<your-lan-ip>:<WEB_PORT>` on the other device. Windows Firewall
may prompt to allow Node on the first external connection.

## Security notes

- **`dangerouslySetInnerHTML`** renders `body_html` / `detail_html`. Content is
  authored/trusted today, but this **must be sanitized** (e.g. DOMPurify) before
  any non-trusted source is introduced. Tracked in the roadmap as a Phase 1
  hardening item.
- No auth, no secrets, no PII in Phase 1.
- The `POST /comments` write path is stubbed (501) rather than open.

## Scaling path

The stack carries Phase 1 — and well beyond — but two limits define the
inflection points, both addressable without a rewrite because data access is
isolated in [db.js](../backend/src/db.js):

1. **Write concurrency / multi-node.** SQLite has a single writer and is
   single-node. Read-mostly traffic scales far on one box (WAL mode). When user
   writes grow or you need multiple API instances, migrate to **Postgres**, or to
   **libSQL / Turso** (SQLite-compatible, distributed — keep the SQL, gain
   replication).
2. **Video / media (Phase 3).** Media never lives in the DB. It's additive:
   object storage (S3 / Cloudflare R2) + a CDN + HLS. No conflict with the current
   stack.

Recommended prep before Phase 2: wrap DB access behind a small repository
interface so the SQLite → Postgres/libSQL swap is a one-file change.
