# mindSwipe — technical documentation

Covers the Phase 1 prototype as built, plus the Phase 2 target architecture
(multi-tenant on a managed Postgres backbone) and the forward-looking decisions
that keep later phases cheap.

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

### Phase 2 target stack (multi-tenant)

Phase 1's Express + SQLite server is replaced — not extended — by a managed
Postgres backbone. The PWA frontend stays; only the data layer moves.

| Layer | Choice | Why |
| --- | --- | --- |
| Database | **Postgres** (via Supabase) | Real multi-tenancy via row-level security; the tenant model is standard SQL and ports to any cloud later |
| Auth | **Supabase Auth** (GoTrue, JWT) | Standard JWT + email/OAuth; user data lives in our own DB |
| API (user-facing CRUD) | **PostgREST** (auto REST) behind a thin client wrapper | Tables become endpoints; RLS enforces tenant scoping on every request — no hand-written CRUD |
| Trusted backend | **Spring Boot 3 (JVM)** | The server-side tier for work RLS can't do: grading, scheduling, moderation, bulk import, admin, payments/webhooks, provider analytics |
| Tenant isolation | **Row-level security** + `tenant_id` | One set of policies, no per-query scoping code |
| Analytics (demo) | Own `attempt` / `activity` tables + a dashboard page | PostHog deferred to scale (Phase 3) |

#### Why Spring Boot for the trusted backend

Chosen for a "safe, not fancy" tier: a huge talent pool, the most complete
integrated stack of the candidates (JPA/jOOQ, first-class Stripe Java SDK, Spring
Security, Micrometer + Actuator), and the team's strongest existing skill. On raw
capability nothing disqualified it — the two known costs are **startup** (~2–8 s
vs sub-second for Go/Node) and **idle RAM** (~250–500 MB vs ~20–60 MB Go / ~80–150 MB
Node). Those bite only under serverless / scale-to-zero / aggressive autoscaling;
for the **always-on container** this service runs as, they are a deploy-time wait
and a modest cloud-cost tax, not a functional limit. (If the footprint ever
matters, CDS/AppCDS and lazy init narrow the gap short of a GraalVM-native
rewrite.) Go was the runner-up and stays the fallback if footprint becomes the
dominant constraint.

**Division of labour — this is the load-bearing rule:** Spring Boot connects to
Postgres as one privileged user, which **bypasses RLS**. That is exactly right
for a *trusted* tier (it scopes tenants in code), but it means Spring Boot must
**not** be the primary user-facing CRUD layer — leave that to PostgREST, where
RLS auto-scopes every request from the user's JWT. Spring Boot owns only what
needs server-side trust or logic RLS can't express. (No official Java Supabase
SDK exists; the trusted tier doesn't need one — it talks to Postgres over JDBC
and to GoTrue/Storage over REST.)

Why not adopt a forum / LMS / chat engine (Discourse, Moodle, Mattermost, Stoat,
Spacebar): none offers real in-app multi-tenancy, and all carry the wrong core
object (threads / courses / chat messages, not gradable swipe cards with
attempts, progress, and scheduling). The part worth borrowing from Discord-style
products is their *data model*, not their code — captured in
[Phase 2 additions](#phase-2-additions-multi-tenant-discord-shaped). Supabase is
chosen because it is a managed assembly of *portable* open-source Postgres parts
— see [Scaling path](#scaling-path).

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

### Phase 2 additions (multi-tenant, Discord-shaped)

The social graph follows the model proven by Discord and Mattermost rather than a
bespoke one: a **global identity** independent of any space, and **per-space
membership** that carries roles, status, and governance. The payoff is that bans,
privileges, and content access each live at exactly one layer and never bleed
across spaces.

**Identity layer — global, per user, survives everything:**

| Entity | Purpose |
| --- | --- |
| `user` (`auth.users` + `profile`) | One global account, never deleted by a ban. `profile` holds public-safe fields (display name) for showing comment authors. |
| `entitlement` | A user's personal paid/donor privilege (no ads, personal perks in the public space). Self-serve, cheap, and **independent of any organization**. Modeled on Discord's *entitlement* (an access record) kept separate from the *subscription* (the recurring payment), so access survives billing-lifecycle changes. |
| `profile.managed_by` | If set, the account was provisioned by an organization and is bound to it — no access to the public space. |

**Space layer — per tenant (an "organization" / "circle" = a Discord server):**

| Entity | Purpose |
| --- | --- |
| `tenant` (`kind`: provider · public · org) | A space. `provider` owns the base library; `public` is the open commons (normal signup auto-joins); `org` is a paid organization / closed circle. |
| `tenant_config` | The **organization's** plan + capabilities/seats (`authoring`, private content, dashboards, `ads`, `provider_analytics`, `advanced`). A whole org is paid; members inherit it. Distinct from a user's `entitlement` — different capability, different cost. |
| `membership(user, tenant, role, status)` | The join: who belongs where, as which role, in what state. `role` is **scoped to the tenant** (admin here, student there) — the consensus rule from multi-tenant RBAC practice. `status` (`invited` / `active` / `banned` / `left`) is **where a ban lives, and the only place it lives**. |

**Content & activity layer:**

| Entity | Purpose |
| --- | --- |
| `post.tenant_id` + `post.visibility` (+ `author_id`, `status`) | Owning space; `public` vs `tenant` reach; author; moderation state. |
| `comment` (+ `tenant_id`, `author_id`, `status`) | User comments, scoped and moderated. |
| `attempt` | **One row per session** — a single encounter with a post. A repeat is a new row (`session_seq` 1, 2, 3…), never a mutation. Stores only **what the user did** — `selected_json`, `duration_ms`, and a `detail` JSONB — and **never a `correct` flag**; correctness is derived on read. A *graded* attempt also snapshots the key + `content_version`, so it stays self-describing forever (see [Answer formats](#answer-formats-stable-ids--revision-safety) and [Grading](#grading-solution-delivery--offline-policy)). |
| `reaction` | **Boolean membership** — one row per `(user_id, post_id, kind)`, its presence meaning "on". Covers every checkbox reaction: `like` / `dislike` (mutually exclusive, enforced app-side) and opinion labels (`recommended`, `mean`, …). |
| `reaction_event` | **Append-only occurrences** for *counter* reactions like `fooled_by` — one row per occurrence (optionally tied to a session). The count is derived (`COUNT(*)`), never a stored integer — the same store-events-derive-counts rule as `attempt`. |
| `view_event` | High-volume append-only view log (or folded into `activity`). The first stream to sample / roll up at real scale. |
| `activity` | General engagement / tracking events feeding the dashboards. |
| `post_stat` | **Write-hot aggregates split off the cold `post`** — `view_count`, `like_count`, `dislike_count`, `attempt_count`. A *derived cache* (trigger or scheduled rollup); the event tables above are the source of truth. |

Design decisions baked into this layer:

- **PK convention: `bigint` for all app entities, `uuid` for users.** `auth.users`
  owns the uuid; every FK to a user is `uuid`, everything else is a sortable,
  debuggable `bigint`. `post.id` stays monotonic, so the keyset feed cursor is
  unchanged from Phase 1.
- **Sessions are rows; what happens *inside* a session is JSON.** The session
  grain (one encounter = one `attempt`; repeat = another) is first-class rows so
  cross-user analytics (`GROUP BY post_id` for avg time-to-solve, answer
  distribution, got-fooled-by rate) use real indexes, and so RLS and the
  retention sweep operate per session. The variable, never-aggregated
  within-encounter telemetry (reveal events, choice flips, pauses — the "how
  focused were they" noise) lives in the `attempt.detail` JSONB, which is the
  correct use of a blob: read whole, never queried across users.
- **Hot / cold split.** Counters churn on every view and like while the card
  barely changes, so they live in `post_stat`, not on `post`. Keeps the content
  table vacuum-cheap and lets counts be recomputed from events if they ever drift.
- **Deletion is scheduled, not immediate.** `status` (`retired` / soft-deleted /
  `banned`) flips instantly and RLS hides the row the moment it does; physical
  removal is a batched sweep past a retention window (`pg_cron`, or a Spring Boot
  `@Scheduled` job in the trusted tier). That sweep is also where GDPR erasure and
  retention policy are enforced.
- **The metrics inherit the privacy guarantee for free.** Every table here carries
  `tenant_id`, so `attempt`, `reaction`, `reaction_event`, and `view_event` get
  the same member-scoped, `provider_analytics`-gated RLS as the rest. The sensitive
  private-circle metrics (time-to-solve, answer history) are visible to the
  tenant's teachers but to the provider *only* if that tenant opted in — enforced
  by the database, not application code.

**The Discord mapping, for reference:**

| Discord | mindSwipe |
| --- | --- |
| Account | `user` |
| Nitro (global perk) | `entitlement` |
| Server / Guild | `tenant` (`kind='org'`) |
| Server membership + roles | `membership` (role + status) |
| Server ban | `membership.status='banned'` (that one row only) |
| Inviting an existing account | a new `membership` for a public user |
| Guest/bot bound to one server | managed user (`profile.managed_by`) |
| @everyone default server | the `public` tenant |

**How this satisfies the hard requirements:**

- **A ban is local and non-destructive.** Flipping one `membership.status` to
  `banned` stops that user everywhere in that space and nowhere else. Their
  account, their `entitlement`, and every other membership are untouched — by
  construction, not by special-case code.
- **Two independent "paid" concepts.** A user's `entitlement` (self-serve,
  public-space perks) and an org's `tenant_config.plan` (management, seats,
  authoring, private content) are orthogonal, with different capability and cost.
  A donor can be a member of three orgs, each governing them differently.
- **Governance is scoped.** A user's global entitlement is their privilege *in
  the public commons*; inside an org, the org's plan and rules govern. They do
  not bleed into each other — matching "subject to this space's rules, and only
  for this network".

**Row-level security** turns all of this into enforcement, not convention:

- Access checks are **status-aware** — membership helpers count only
  `status='active'`, so a ban takes effect immediately, everywhere, with no extra
  code.
- **Managed users are walled from the commons** — public content is readable by
  members of the `public` tenant (normal users auto-join; managed accounts do
  not), so an org-bound account has no path to public content.
- **A tenant's privacy is enforced by the database.** The paid tier's "no
  provider-side tracking" is a clause in the `activity` read policy: the provider
  can read a tenant's activity **only if** that tenant's `provider_analytics`
  flag is true. A guarantee, not a setting someone must remember to honor.
- Students / the PWA read through the API with a JWT and are auto-scoped; the
  trusted backend (admin, moderation, bulk import) uses a direct service-role
  connection that bypasses RLS — so provider-wide analytics must respect the
  privacy flag in its own query, and service-role credentials stay server-side.

A **material-set / assignment** layer (an org curating a named `collection` of
cards and assigning it to members or cohorts) sits on top of this and is the main
new surface beyond core RLS; it is stubbed for the demo (one seeded assignment)
and built out later.

#### Grading, solution delivery & offline policy

The database records **choices, not verdicts.** `attempt` stores the user's
`selected_json`; whether it was correct is computed by **Spring Boot** from the
card's answer key, never stored. The answer key is the single source of truth, so
fixing a mis-keyed card retroactively corrects every historical stat — there are
no stale `correct` flags to migrate.

Two modes, chosen per card by the owning org (`post.grading_mode`):

| Mode | Solution shipped to client? | Who grades | Record |
| --- | --- | --- | --- |
| **Exercise** (ungraded) | Yes, if the org allows | Client, for instant feedback | Choice still posted for history |
| **Graded** | No | Spring Boot, server-side | Choice stored; solution returned only after submit |

- **Online, graded:** the client submits its choice; Spring stores it and returns
  the solution + explanation in the response.
- **Offline, graded:** the client has no answer key, so it caches the *choice* and
  syncs it when back online; grading and solution come back then.
- **Offline, exercise:** only if the org permits offline download — and only then
  does the bundle carry solutions + explanations.

This is also the fix for the offline-privacy gap: **a tenant decides whether its
content may be taken offline at all, and whether offline bundles may include
solutions.** Public content stays freely cacheable; a private circle can keep its
material — and especially its answer keys — off student devices entirely, so
nothing tenant-private sits unencrypted in a browser cache.

**Stats are computed, with a deliberate cache line.** Per-user correctness ("how
many right") is derived live from that user's own `attempt` history — cheap, and
immune to answer-key edits. What is *not* recomputed from raw on every load is the
**cross-user / high-fan-out** aggregate (a teacher dashboard over hundreds of
students, tenant-wide answer distributions): those are maintained as rollups
(trigger or scheduled), because recomputing them from raw per request is
O(attempts) and will drag. The dividing line is **read frequency × fan-out, not
correct-vs-not** — and any such rollup must be invalidated when a card's answer
key changes, since correctness derives from it.

The concrete rollups, all keyed with `tenant_id` so they inherit the privacy RLS,
all rebuilt nightly from raw, all bucketed per **day** and summed for any range:

- **Activity** — `(user_id, tenant_id, subject, day) → answered, right, wrong,
  total_duration_ms`. Session-grained, sourced from `attempt` only (every row has
  an answer). This is *work done*.
- **Coverage ("nope")** — **derived, not stored as attempts.** Cards a user
  *viewed* but never *answered* = `distinct(view_event) − distinct(attempt)` per
  `(user, subject, period)`. Because it comes from two separate streams it is
  naturally **per-card** ("seen but skipped"), not per-encounter — so it is
  reported *beside* right/wrong, never summed into the same total (different
  denominators: answers vs views).
- **Mastery** — `(user_id, tenant_id, subject) → distinct cards mastered`, defined
  as `review_state.box >= threshold` (see [Learning engine](#learning-engine-leitner--additive-and-rebuildable-by-design)).
  Already maintained, so it's a cheap count, not a latest-session scan — and it
  simply reads as "no mastery signal yet" when scheduling is off. This is *how
  much they know now*, as opposed to how much they did.

One ordering constraint: because "nope" depends on `view_event` (the first stream
to be sampled / pruned at scale), the nightly rebuild must **snapshot it into the
rollup before raw views age out** — once a day's counts are materialized, the
underlying view rows can be pruned.

**Scope: we do not try to catch cheating.** Server-side grading exists to (a) keep
answer keys off the device when an org requires it and (b) keep an authoritative
record — *not* to defend against a student who fakes results or fishes for the
key. That is impossible, and out of scope; a determined bad actor only cheats
themselves. The infrastructure facilitates teaching and learning, not proctoring.

#### Answer formats, stable ids & revision safety

**Responses are stored as stable ids, never positions or text.** Every atomic
element a user touches — an MCQ choice, a cloze gap, an orderable item, a match
endpoint — carries a permanent id that is **never recycled**. The key and the
response are expressed purely in those ids (plus normalized strings for text), so
reordering, rewording, or adding/removing elements never corrupts an old attempt.
A genuinely different option gets a *new* id; an existing id is never re-pointed at
new meaning.

One `post` / one `attempt`, with `question_type` as the discriminator and a grader
per type in Spring. The JSON contracts:

| `question_type` | definition | key | response |
| --- | --- | --- | --- |
| `mcq` | `choices:[{id,text}]` | `{correct:[id]}` | `[id]` |
| `cloze` | `gaps:[{id}]` | `{id → [acceptedStrings]}` | `{id → typed}` |
| `ordering` | `items:[{id,text}]` | `{order:[id,…]}` | `[id,…]` |
| `match` | `left:[{id}], right:[{id}]` | `{pairs:[[lId,rId]]}` | `[[lId,rId]]` |

`draw-a-line` is `match` with a different UI; the data stays tiny id-pair JSON, so
the no-binary / offline model is unchanged. Grading stays **binary
(all-or-nothing)** across every type — it keeps the Leitner signal clean and
defers the partial-credit rabbit hole. Cloze normalization is deliberately minimal
(trim + case-fold + an explicit accepted-literals list; no fuzzy / regex yet),
which is also why cloze is best **server-graded** — acceptance can be tuned without
shipping a new client.

**Revision safety, by edit kind:**

| Edit kind | Example | Effect |
| --- | --- | --- |
| Cosmetic | typo in prompt / explanation | same ids, no version change; old attempts valid |
| Key correction | marked answer was wrong, options unchanged | recompute — old attempts get the corrected verdict (the retroactive fix we want) |
| Semantic | reworded into a different question, or options replaced | **new question**: bump `content_version`; older attempts segment out of the new question's stats |

Versioning is kept cheap: `post.content_version` (int) + an append-only
`post_revision` audit (who / when / kind); every `attempt` carries the
`content_version` it saw. There is **no `post_version` snapshot table yet** — that
is a later graduation, only if we ever need to *replay* a historical question
verbatim.

**Graded attempts are self-describing.** A graded `attempt` additionally
**snapshots the key and `content_version`** (tiny JSON) into the row, so the record
— *what we asked, what they picked, the key we graded against* — stays
interpretable forever, fully decoupled from any later edit, with no version join.
Exercise attempts don't snapshot: they recompute against the latest card, where
retroactive corrections are a feature.

#### Learning engine (Leitner) — additive and rebuildable by design

Scheduling is the one piece we are **explicitly allowed to get wrong at first** —
it must never be load-bearing. The core app (discovery feed, grading, the
`attempt` log) runs with `review_state` empty, stale, or disabled, because that
feed is just Phase 1's keyset-on-`id` query. The engine only changes the *order
and timing of resurfacing*; it can never stop a card from showing, an answer from
being graded, or an attempt from being recorded.

The schedule state is one mutable row per user × card:

```
review_state
  user_id uuid, post_id bigint, tenant_id bigint   -- PK (user_id, post_id)
  box        int            -- Leitner level
  due_at     timestamptz    -- when this card should resurface
  last_seen_at
  lapses     int            -- times demoted; a weakness signal
  updated_at
```

- **Algorithm: Leitner.** Right → promote a box; wrong → demote to box 1; each box
  carries a fixed interval that sets `due_at`. Binary-signal friendly (matches
  MCQ), and the box distribution is legible on a teacher dashboard. The transition
  function is isolated, so SM-2 / FSRS can replace it later without reshaping
  `review_state`.
- **Two outputs, different fragility.** `box` is robust (essentially a recent
  streak) and feeds **mastery** (`box >= threshold`). `due_at` is the fragile,
  hard-to-tune half — and it only orders the *optional* review feed. Shipping with
  a rough `due_at` is fine.
- **Maintained incrementally, but rebuildable from `attempt`.** Spring updates
  `review_state` on each submit — best-effort and *after* the attempt is committed,
  so a failed schedule update never fails the answer. Because `attempt` is the
  immutable log, the nightly job can **rebuild `review_state` from scratch**, which
  heals any incremental drift. That rebuild is the correctness backstop.
- **Ship path.** The demo can run on **nightly rebuild only** (no incremental):
  `due_at` refreshes once a day, which is plenty for a prototype. Incremental
  update is a later optimization, not a launch gate.
- **Flag-gated.** A per-tenant `scheduling_enabled` flag turns the review feed on;
  off by default, so the first ship is the plain discovery feed and scheduling
  lights up only once it's trustworthy.

The feed composes two independent queries server-side — due reviews
(`review_state`, ordered by `due_at, box`) and new cards (catalog, keyset-on-`id`)
— so if the first returns nothing (engine off, or no cards due), the session is
simply all new cards. Graceful by construction.

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
  any non-trusted source is introduced — making it the **first Phase 2 gate**,
  mandatory on day one of user-generated content.
- No auth, no secrets, no PII in Phase 1. Phase 2 introduces accounts, so a
  privacy/data policy and per-tenant analytics flags (notably the paid tier's
  "no provider-side tracking") land with it.
- Phase 2 isolation is **row-level security**; service-role credentials (which
  bypass RLS) stay server-side only, never in the PWA.
- The `POST /comments` write path is stubbed (501) rather than open.

## Scaling path

The stack carries Phase 1 — and well beyond — but three limits define the
inflection points, all addressable without a rewrite because data access is
isolated in [db.js](../backend/src/db.js) and, in Phase 2, behind a thin client
wrapper over the API.

1. **Write concurrency / multi-tenancy (Phase 2).** SQLite is single-writer and
   single-node, and has no row-level security. Phase 2 moves to **Postgres via
   Supabase**, which brings real multi-tenancy (RLS) and multi-node writes. The
   migration is a data-layer swap, not a frontend rewrite.
2. **Going international / public cloud (Phase 3).** The hard-to-redo part — the
   tenant-isolation data model — is standard Postgres + RLS and ports between
   clouds for free. Schema, data, RLS, SQL functions and mainstream extensions
   move as-is; PostgREST / Storage / Auth self-host or swap (Cognito / Keycloak);
   only Edge Functions would be a rewrite. Data residency (GDPR, the paid tier's
   "data stays with us") becomes per-region instances — or DB-per-tenant for the
   most sensitive schools — because it is plain Postgres.
3. **Video / media (Phase 3).** Media never lives in the DB. It's additive:
   object storage (S3 / Cloudflare R2) + a CDN + HLS. No conflict with the stack.

Portability hygiene to keep that cheap: put business logic in SQL (functions +
RLS) rather than Edge Functions, wrap `supabase-js` behind our own client, keep
auth standard (JWT + email/OAuth), and use the S3-compatible storage API.
