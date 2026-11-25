# mindSwipe backend — Supabase (Phase 2, build-1)

Build-1 is **Supabase-native**: the PWA talks to PostgREST + Supabase Auth
directly; there is no app server in the request path. RLS is the access control.

The Spring app in [../backend/](../backend/) is **parked** — it becomes the
trusted tier later (grading of graded cards, moderation, dashboards, rollups),
not part of build-1.

## Running instance (build-1)

The full stack is **live** on the Ubuntu box (`ssh dev1-u26`, 192.168.178.38),
Supabase self-hosted **v0.8.5**, project dir `~/mindswipe/mindswipe-project`.
Manage it from there with `sh run.sh {start|stop|status|logs|secrets}`.

Frontend connection (client key — safe to embed in the PWA):

- `SUPABASE_URL` = `http://192.168.178.38:8000`
- `SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_rHnesNn-dlSSsTBgWd_ABe__3TvZMSL`

Studio (DB UI): `http://192.168.178.38:8000` — basic auth, user `supabase`
(password in the box `.env` `DASHBOARD_PASSWORD`). Postgres pooler:
`192.168.178.38:5432` (session) / `6543` (transaction). The **service_role /
secret keys stay on the box** (`.env`, or `sh run.sh secrets`) — never in the PWA.

Status: anonymous sign-in enabled; `migrations/0001_init.sql` applied; 1000 cards
seeded. Verified end-to-end — anon feed read, anonymous sign-in, and authenticated
`attempt`/`reaction` writes scoped by RLS.

## Seeding

`seed/gen-seed.mjs` reads `../questions_gymnasium.json`, applies the transform
(letter options → stable `c1…cN` ids, `correct` letter → choice id, difficulty →
1/2/3, `meta.language` → `locale`, extra fields → `detail`) and writes SQL:

```sh
node supabase/seed/gen-seed.mjs out.sql
ssh dev1-u26 "docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d postgres" < out.sql
```

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
