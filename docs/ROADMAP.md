# mindSwipe — roadmap & todo

Status legend: `[x]` done · `[~]` partial · `[ ]` todo

See [PROJECT.md](PROJECT.md) for what each phase is and why, and [TECH.md](TECH.md)
for the stack and scaling path.

Each phase is tagged with **Tech** (architecture / data / API) and **Design**
(UX / content / interaction) details, so the "why" travels with the "what".

> **Re-triage note (2026-11-25).** Phase 1 proved the core experience (swipe,
> grade, open detail, go offline). The remaining Phase 1 list was re-triaged by
> *durability*: items that survive the Phase 2 backend swap are kept; throwaway
> work tied to the current Express/SQLite server is dropped; the rest is carried
> into Phase 2 where it belongs. Phase 2 is reframed around a concrete goal:
> **demo the multi-tenant model to three audiences — public network, paid
> version, private circle — on the minimal infrastructure that makes them
> visibly different.**

---

## Phase 1 — the scrollable feed

**Status: proved.** The core experience works. Closing out the durable polish
below, then moving on.

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
- [x] `git init` + first commit
- [x] Grow content volume: 200 backend-interview cards added for offline testing
- [x] Cap the offline DB size — keep newest full cards up to `maxFullPosts` (150)
      or `maxFullBytes` (5 MB), trim older to id-only stubs (max 1000 records);
      lazy cleanup in `enforceOfflineCap()` on "Prepare offline" only. Tunable via
      `OFFLINE_CAP` in [offline.ts](../frontend/src/offline.ts).
- [x] Reflect the current post in the URL (`/?id=123`)

### Remaining to call Phase 1 "done" (durable — survives the backend swap)

- [ ] **Deploy the frontend** (static PWA → CDN). A live URL is a prerequisite
      for demoing to schools. The PWA is durable; it outlives the backend swap.
- [ ] Loading & error states: skeleton cards, retry on failed batch, empty-filter
      message polish
- [ ] Accessibility pass: focus management on detail open/close, ARIA on the
      action rail, reduced-motion handling
- [ ] Real app icons (replace the inline SVG placeholder)
- [ ] Frontend component tests: MCQ grading + windowing (test the UI, not the
      soon-replaced API)

### Carried into Phase 2 (not Phase 1 gates)

- [→] **Sanitize `body_html` / `detail_html` (DOMPurify).** Phase 1 content is all
      authored/trusted, so this is *not* a Phase 1 blocker — but it is the **first
      Phase 2 gate**, mandatory on day one of user-generated content. Placeholder
      lives at [Card.tsx](../frontend/src/components/Card.tsx) (~line 61).
- [→] Difficulty filter in the UI (API already supports `difficulty=`) → folds
      into Phase 2 search/browse.
- [→] Resume position: remember last-seen card per topic → Phase 2.
- [→] Desktop affordances: arrow-key / wheel navigation, visible scroll cue → Phase 2.

### Dropped (throwaway — tied to the current Express/SQLite server)

- [✗] Deploy the current backend — Supabase replaces it in Phase 2.
- [✗] Backend/API route tests against the current server — low value; the server
      is about to be replaced.

### Tech details

- Stack as built: Node + Express 4 + SQLite (`better-sqlite3`), React 18 + TS +
  Vite 6, PWA. Conservative on purpose — see [TECH.md](TECH.md).
- Feed primitive is **keyset (cursor) pagination** (`id > cursor`), stable and
  O(1) at any depth — the correct choice to keep into Phase 2.
- Offline is an **IndexedDB bundle** with a lazy size cap; the api layer is
  network-first with offline fallback. This client contract does not change when
  the backend moves to Supabase.

### Design details

- One card at a time, snap feed, swipe to move — borrow short-video muscle memory.
- Smooth and battery-cheap: only a few cards mounted; payloads are small text.
- Mixed card formats (plain `text` vs HTML/CSS `card`) to break monotony.
- View-first, write-ready: layout and data model leave room for accounts,
  progress, and comments without a rewrite.

---

## Phase 2 — multi-tenant demo: public network · paid version · private circle

**Goal:** stand up the *minimal* infrastructure to demo the platform to three
audiences, where the only differences between them are **tenant config + feature
flags + RLS scoping** — same codebase, same feed.

> **build-2 status (2026-11-26).** Tenant model is now real: `membership`
> (user+tenant+role), roles (`student/teacher/author/tenant_admin`), and
> tenant-scoped RLS via `is_member/is_staff` helpers. The app is now
> **dashboard-first** — a home screen with stats, assignments, followed topics
> (+search) and playlists; the swipe feed is one *session* opened from it over a
> `FeedSource` (all/topic/random/playlist/assignment), with history-based
> dashboard→swipe→detail back navigation. Seeded personas (teacher + 2 students
> at "Lincoln High") drive a **persona switcher**. Teacher-moderated **comments**
> are live (post → pending → teacher approve/reject → visible), and **DOMPurify**
> guards every HTML render. Still deferred: `tenant_config` feature flags,
> teacher *authoring* UI, spaced-repetition / "due today", teacher dashboards.
> See `migrations/0004_tenant_model.sql` + `seed/0004_personas_demo.sql`.

### The three audiences

| Archetype | Who | Content | Flags that define it |
| --- | --- | --- | --- |
| **Public network** | Open/free tier, the provider's own platform | Provider base library, publicly browsable | ads **on**, provider-analytics **on**, open membership, UGC + comments **on** (→ moderation queue) |
| **Paid version** | School A | Provider base library | ads **off**, **provider-analytics off** (data stays with them, RLS-scoped, excluded from provider dashboards), teacher **monitoring dashboard on** |
| **Private circle** | School B | Provider base **+** their own expert-authored private content | closed/invite membership, **authoring on** (expert role, tenant-isolated), advanced features **on**, own moderation |

### Minimal infrastructure (just enough to make the three visibly different)

- [ ] **Supabase** as the backbone: one Postgres instance + Auth + RLS + auto
      REST API. Repoint the PWA's [api.ts](../frontend/src/api.ts) at it behind a
      thin client wrapper (portability — see Tech details).
- [ ] **Data model:** `tenant`, `membership(user, tenant, role)`,
      `tenant_config` (plan + feature flags); add `post.tenant_id` +
      `post.visibility (public | tenant)`; new `attempt` (grading) and `activity`
      (tracking) tables; enable the existing `comment` write path.
- [ ] **RLS policies:** public rows readable by all; tenant rows visible only to
      that tenant's members; writes scoped to author + tenant. This *is* the
      multi-tenant isolation — one set of policies, no per-query scoping code.
- [ ] **Roles:** provider-admin · tenant-admin · expert/author · teacher/monitor
      · student.
- [ ] **Feature flags per tenant:** `ads`, `provider_analytics`, `authoring`,
      `advanced`, `monitoring_dashboard` — the table above, as data.
- [ ] **DOMPurify sanitization** before any UGC renders (the carried-over gate).
- [ ] **Demo auth:** seeded accounts per persona + a **persona/tenant switcher**
      to show each archetype — *not* full signup/OAuth yet.

### Learning engine (your differentiator — no engine sells you this)

- [ ] Server-side grading → `attempt` records (client grading stays for instant
      feedback)
- [ ] Progress tracking per card / topic (mastery)
- [ ] Spaced-repetition scheduling (surface weak / due cards sooner)
- [ ] "Due today" / review session mode

### Content, authoring & moderation

- [ ] Authoring UI for experts (Private circle) and, later, students — same
      pipeline, gated by review state (`draft → pending → approved/rejected`)
- [ ] Admin tooling to curate, edit, retire cards
- [ ] Bulk import format + validation (schema checks, duplicate detection) —
      feeds the existing [build_questions.py](../build_questions.py) content work
- [ ] **Moderation queue (stubbed):** a visible queue + state machine, seeded —
      *no* spam/toxicity engine yet
- [ ] Search and browse by topic / difficulty / tag (absorbs the carried-over
      difficulty filter)

### Dashboards & tracking

- [ ] Engagement + progress dashboard **computed from own `attempt`/`activity`
      tables** — defer PostHog to scale
- [ ] Teacher/monitor view (Paid version); provider view that **excludes**
      provider-analytics-off tenants (honors School A's privacy requirement)

### Tech details

- **Why Supabase, not a forum/LMS engine:** Discourse/Moodle have no in-app
  multi-tenancy and the wrong core object (threads/courses, not gradable swipe
  cards). Supabase is a managed assembly of *portable* Postgres parts — the
  tenant-isolation model (RLS) is standard SQL and ports to any cloud later
  (see Phase 3 / [TECH.md](TECH.md) scaling path).
- **Dual access path:** students/PWA hit the API with their JWT → RLS auto-scopes
  them; the trusted backend/admin/moderation jobs use a direct service-role
  connection (RLS bypassed) and scope tenants in SQL. Service-role creds stay
  server-side only.
- **Portability hygiene now:** business logic in SQL (functions + RLS), not Edge
  Functions; wrap `supabase-js` behind our own client; standard JWT auth; S3-
  compatible storage API.
- **Multi-tenancy pattern:** shared-schema + `tenant_id` (RLS) for the demo —
  simplest to build and most impressive to show. Schema-/DB-per-tenant is a
  later data-residency concern (Phase 3).

### Design details

- The three archetypes must *feel* different on screen from identical code:
  Public shows ads + join/contribute affordances; Paid is clean, ad-free, with a
  teacher dashboard; Private is branded/closed with an authoring surface.
- The persona/tenant switcher is a demo affordance, front and center — it's how
  the story gets told in a live demo.
- Write surfaces (comment, author-a-card) are introduced as *additive* to the
  existing feed/detail UI, not a new app — keep the swipe experience primary.
- Dashboards favor a few legible signals (cards answered, mastery, engagement)
  over a wall of metrics.

---

## Phase 3 — scale, social, and public cloud

Deliver the original vision and prepare for going international.

### Social

- [ ] Open user-created posts (student-authored cards) through the same review
      pipeline
- [ ] Real moderation + reporting (toxicity scoring, e.g. Perspective API, into
      our own queue) + per-tenant moderators
- [ ] Channels, following, feeds-per-creator; notifications
- [ ] Creator tooling for external contributors

### Media

- [ ] Video + image posts as flashcards
- [ ] Media pipeline: object storage (S3 / R2) + CDN + HLS
- [ ] Revisit feed virtualization for heavy media cards (preload / unload video)

### Infrastructure & going international (public cloud)

- [ ] Product analytics at scale (PostHog) — graduating from own-table dashboards
- [ ] Data residency per region (GDPR; honors "data stays with us"): standard
      Postgres means per-region instances, or DB-per-tenant for sensitive schools
- [ ] Portability move if/when leaving Supabase Cloud: schema + data + RLS port
      as-is; PostgREST/Storage/GoTrue self-host or swap (Cognito/Keycloak);
      Edge Functions are the only rewrite
- [ ] Distributed database + read replicas; caching / CDN for feeds and bundles
- [ ] Observability: logging, metrics, error tracking; abuse / spam controls

### Tech details

- The expensive, hard-to-redo part — the tenant-isolation data model — is
  standard Postgres + RLS and moves between clouds for free. Supabase is chosen
  *because* it's a convenience layer over portable open-source parts.
- Migration friction, reusable → rewrite: schema/data/RLS/SQL/pgvector/pg_cron
  (as-is) → PostgREST/Storage/GoTrue/Realtime (self-host or swap) → Edge
  Functions / `pg_graphql` (rewrite).

### Design details

- Comments/UGC enter as a *social layer on top of* the learning feed, not a pivot
  to a forum — the card stays the unit.
- Trust tiers shape the UI: provider base (high trust), tenant-expert content
  (tenant-trusted), student UGC (untrusted → sanitized + moderated before feed).
- International: content is already topic-scoped; externalize UI strings (i18n)
  before the first non-English audience.

---

## Cross-cutting backlog (any phase)

- [ ] CI (lint, typecheck, test on push)
- [ ] Error tracking (frontend + backend)
- [ ] Performance budget + measurement on low-end phones
- [ ] i18n readiness (content is topic-scoped; UI strings are not yet externalized)
- [ ] Privacy / data policy once accounts exist (ties to per-tenant analytics
      flags and data residency)
- [ ] **Opaque public id for cards (deep-link URLs).** build-2 added
      YouTube-Shorts-style deep links (`/?id=N`) using the real `post.id`. That is
      safe by design — access is gated by RLS (`approved` + tenant), never by id
      secrecy — but the sequential integer PK is **enumerable**: anyone can walk
      `?id=1,2,3…` and scrape the whole public library, and the raw PK leaks row
      counts / DB internals. Low-stakes while content is deliberately public;
      becomes real once there is paywalled, tenant-private, or draft content whose
      *existence/volume* shouldn't be guessable. Fix (additive, no RLS change): a
      `post.public_id` slug/hashid (e.g. base62 or a random token) decoupled from
      the PK; route `/c/<public_id>` and look cards up by it; keep the integer PK
      internal. Do it before the first public launch with non-public content.
