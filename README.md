# mindSwipe

Learn while you scroll. A flashcard feed that feels like a short-video app:
full-screen cards you swipe through, answer inline, and tap for the full
solution — tuned to be smooth and battery-cheap on a phone.

This is the Phase 1 prototype: a view-only feed of authored flashcards (no user
accounts, no user-written comments yet), with the data model and API already
shaped so those can be switched on later without a rewrite.

## Docs

- [docs/PROJECT.md](docs/PROJECT.md) — vision, audience, principles, and the phase plan
- [docs/TECH.md](docs/TECH.md) — architecture, data model, API, and scaling path
- [docs/ROADMAP.md](docs/ROADMAP.md) — phased todo with current status

## Stack

- **Backend** — Node + Express + SQLite (`better-sqlite3`). One file, fast reads.
- **Frontend** — Vite + React + TypeScript, as a PWA.

## Run it

```bash
npm install          # installs both workspaces + seeds the database
npm run dev          # starts API (:4000) and web (:5173) together
```

Then open http://localhost:5173. The Vite dev server proxies `/api` to the
backend, so it's a single origin in the browser.

Useful extras:

```bash
npm run seed         # re-seed the SQLite database
npm run build        # production build of the frontend
```

## How it works

### Feed rendering (the part that has to stay smooth)

The feed is a scroll-snap container where each card is one full viewport
(`scroll-snap-type: y mandatory`). Only a small **window** of cards around the
active one is mounted — the rest render as empty, full-height slots so the
scrollbar and position are preserved while the DOM stays tiny. The active index
is derived from scroll position (rAF-throttled), and the next batch is
prefetched as you near the end. See `frontend/src/components/Feed.tsx`.

### Content model

Everything a card needs to render — including the correct answer and the
authored explanation — ships in the post payload as HTML/JSON text. No binary
assets: the "image"-style cards are built with CSS. Shipping the answer is
intentional (this is learning, not an exam) and is what makes offline grading
possible.

- `post` — `kind` (`text` | `card`), `topic`, `difficulty`, `questionType`
  (`mcq` | `reading`), `prompt`, `bodyHtml`, `choices`, `answer`, `detailHtml`,
  `tags`, `likeCount`.
- `comment` — `postId`, `posterId`, `kind`, `content`. Only author notes
  (tips / related / open questions) are seeded for now; the `POST` route is
  stubbed with `501` so the write path is a visible contract, not a migration.

### API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/feed?cursor=&limit=&topic=&difficulty=` | Keyset-paginated feed batch |
| GET | `/api/bundle?topic=&limit=` | One JSON blob (posts + comments) for offline |
| GET | `/api/posts/:id` | Single post |
| GET | `/api/posts/:id/comments` | A post's notes/comments |
| GET | `/api/topics` | Topics with counts |
| POST | `/api/posts/:id/comments` | Reserved (501) — user comments, later |

Pagination is cursor-based (keyset on `id`), not offset — the correct feed
primitive, O(1) however deep you scroll.

### Offline

"Save offline" downloads a bundle into IndexedDB (`frontend/src/offline.ts`).
When the network is gone, the api layer transparently serves the feed and
comments from there. A service worker caches the app shell in production builds.
Likes, bookmarks, and answered-questions live in `localStorage`, shaped so a
real user + sync endpoint can adopt them later.

## Project layout

```
mindSwipe/
├─ backend/
│  └─ src/  db.js · seed.js · index.js
└─ frontend/
   └─ src/  App.tsx · api.ts · offline.ts · localState.ts
            components/  Feed.tsx · Card.tsx · Detail.tsx
```
