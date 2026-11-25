# mindSwipe backend — Supabase (Phase 2, build-1)

Build-1 is **Supabase-native**: the PWA talks to PostgREST + Supabase Auth
directly; there is no app server in the request path. RLS is the access control.

The Spring app in [../backend/](../backend/) is **parked** — it becomes the
trusted tier later (grading of graded cards, moderation, dashboards, rollups),
not part of build-1.

## Where it runs

Full Supabase stack via Docker on the shared Ubuntu box (`ssh dev1-u26`,
192.168.178.38). The box is being resized to ≥4 GB first — the full stack needs
~4 GB and the box shipped with 1.6 GB.

## Pieces

- **`migrations/0001_init.sql`** — schema + RLS + grants. The reviewable "backend".
  - Content: `post` (public-readable; exercise mode ships the answer).
  - Activity: `attempt` (choice only, no verdict; `session_seq` via trigger),
    `reaction` (like/dislike), `view_event`. Each owned by `auth.uid()`, RLS so a
    user only sees/writes their own rows.
  - A single seeded `public` tenant; `tenant_id` / `content_version` carried for
    future-proofing.
- **Seed (next):** a Node script transforms `questions_gymnasium.json` (letter
  options → stable `c1…cN` ids, `correct` letter → choice id) and inserts 1000
  cards via the service-role key. Not written yet.

## Auth model — anonymous sign-in

No login screen in build-1. The PWA calls `supabase.auth.signInAnonymously()` on
first load → a real `auth.users` row + JWT, so `auth.uid()` attributes every
input and RLS protects it. Anonymous sign-ins must be **enabled** in the stack
config (GoTrue `GOTRUE_EXTERNAL_ANONYMOUS_USERS=true`). These anon accounts can
later be upgraded to email without losing history.

## Secrets

- **Frontend gets:** the Supabase URL + the **anon** key (public by design, safe
  in the PWA) — these will be baked into the frontend env for now.
- **Server-side only:** the **service_role** key + Postgres password (used by the
  seed script and, later, the trusted tier). These never go in the frontend and
  should not be committed; for now they live on the box / in local env.

## Bring-up plan (after the VM resize)

1. On the box: fetch `supabase/docker` compose, set `.env` (generate JWT secret +
   anon/service keys, DB password, enable anonymous users), bind ports for LAN.
2. `docker compose up -d`; apply `migrations/0001_init.sql`; run the seed script.
3. Hand the URL + anon key to the frontend; wire `supabase-js`.
