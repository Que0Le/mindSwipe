# mindSwipe — roadmap & todo

Status legend: `[x]` done · `[~]` partial · `[ ]` todo

See [PROJECT.md](PROJECT.md) for what each phase is and why.

---

## Phase 1 — the scrollable feed

### Done

- [x] Monorepo (npm workspaces) with one-command dev (`npm run dev`)
- [x] SQLite schema: `post` + `comment`, future-proofed for users/writes
- [x] Seed content: 24 cards across 9 topics, mixed `text` / `card`, MCQ + reading
- [x] API: keyset-paginated `/feed`, `/bundle`, `/topics`, `/posts/:id`,
      `/posts/:id/comments`, `/health`
- [x] `POST /comments` stubbed (501) — write path visible, not open
- [x] Snap feed with DOM windowing (only ~4 cards mounted)
- [x] MCQ with client-side grading (locks on first answer, shows explanation)
- [x] Detail view: answer, authored notes, tags, comments, swipe-right to back
- [x] Action rail: like / save / tips
- [x] Topic filter
- [x] Offline: "Save offline" → IndexedDB bundle; api falls back when offline
- [x] Per-viewer state (likes / saves / answers) in localStorage
- [x] PWA manifest + service worker (app shell, prod only)
- [x] Configurable ports + LAN access for device testing

### Remaining (to call Phase 1 "done")

- [ ] `git init` + first commit; set up `.gitignore` already in place
- [ ] **Sanitize `body_html` / `detail_html`** (DOMPurify) before render — do this
      before any non-authored content source exists
- [ ] Difficulty filter in the UI (API already supports `difficulty=`)
- [ ] Resume position: remember last-seen card per topic and restore on return
- [ ] Desktop affordances: arrow-key / wheel navigation, visible scroll cue
- [ ] Loading & error states: skeleton cards, retry on failed batch, empty-filter
      message polish
- [ ] Accessibility pass: focus management on detail open/close, ARIA on the
      action rail, reduced-motion handling
- [ ] Basic tests: API route tests (feed pagination, bundle) + a couple of
      component tests (MCQ grading, windowing)
- [ ] Real app icons (replace the inline SVG placeholder)
- [ ] Deploy target: static frontend (CDN) + small API host; document it
- [x] Grow content volume: 200 backend-interview cards (Spring Boot / PostgreSQL
      / system design / Java) added for offline testing
- [x] **Cap the offline DB size.** Keep the newest full cards up to
      `maxFullPosts` (150) *or* `maxFullBytes` (5 MB) — whichever is hit first —
      so scroll-back-up still works. Older cards are trimmed to id-only stubs
      (max `maxTrackedIds` = 1000 records total; oldest ids dropped beyond that).
      Cleanup runs lazily in `enforceOfflineCap()`, called only when a
      "Prepare offline" batch is saved — never on scroll. The offline feed skips
      stubs; the network-first api layer re-fetches a trimmed post by id when the
      user scrolls back to it online. Limits are tunable via `OFFLINE_CAP` in
      [offline.ts](../frontend/src/offline.ts).

---

## Phase 2 — personalise & scale content

### Accounts & sync

- [ ] Auth (email/OAuth); minimal user record
- [ ] Sync likes / saves / answered-state to the server (adopt the localStorage
      maps)
- [ ] Multi-device continuity

### Learning engine

- [ ] Progress tracking per card / topic
- [ ] Spaced-repetition scheduling (surface weak or due cards sooner)
- [ ] "Due today" / review session mode

### Content operation

- [ ] Authoring + multi-agent **review pipeline**: generate → validate → human/agent
      review → ingest into backend
- [ ] Admin tooling to curate, edit, retire cards
- [ ] Bulk import format + validation (schema checks, duplicate detection)
- [ ] Search and browse by topic / difficulty / tag
- [ ] Analytics: per-card answer rates, drop-off, "cards that teach"

### Platform prep

- [ ] Wrap DB access in a repository interface (SQLite ↔ Postgres/libSQL)
- [ ] Decide and prepare the production database path
- [ ] Rate limiting + input validation on write endpoints

---

## Phase 3 — content channel / social layer

### Media

- [ ] Video + image posts as flashcards
- [ ] Media pipeline: object storage (S3 / R2) + CDN + HLS
- [ ] Revisit feed virtualization for heavy media cards (preload / unload video)

### Social

- [ ] Open user comments (with moderation + reporting)
- [ ] Channels, following, feeds-per-creator
- [ ] Notifications
- [ ] Creator tooling for external contributors

### Infrastructure

- [ ] Distributed database + read replicas
- [ ] Caching / CDN for feeds and bundles
- [ ] Observability: logging, metrics, error tracking
- [ ] Abuse / spam controls

---

## Cross-cutting backlog (any phase)

- [ ] CI (lint, typecheck, test on push)
- [ ] Error tracking (frontend + backend)
- [ ] Performance budget + measurement on low-end phones
- [ ] i18n readiness (content is already topic-scoped; UI strings are not yet
      externalized)
- [ ] Privacy / data policy once accounts exist
