-- mindSwipe Phase 2, build-1 schema.
--
-- A deliberate SUBSET of the full multi-tenant model in docs/TECH.md: enough to
-- serve the feed and capture user inputs (choice / like / view). tenant_id and
-- content_version columns are present for future-proofing, but RLS is NOT
-- enabled yet and there is no real auth — a seeded demo user stands in.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Space + identity (stubs for build-1)
-- ---------------------------------------------------------------------------
create table tenant (
    id         bigint generated always as identity primary key,
    kind       text        not null default 'public',   -- provider | public | org
    name       text        not null,
    slug       text        not null unique,
    created_at timestamptz not null default now()
);

create table app_user (
    id           bigint generated always as identity primary key,
    external_id  uuid        not null default gen_random_uuid(), -- maps to auth.users later
    display_name text        not null,
    created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table post (
    id              bigint generated always as identity primary key,
    tenant_id       bigint      not null references tenant (id),
    subject         text,
    topic           text,
    difficulty      smallint,                         -- 1 leicht, 2 mittel, 3 schwer
    question_type   text        not null default 'mcq',
    prompt          text        not null,
    choices         jsonb       not null,             -- [{ "id": "c1", "text": "..." }, ...]
    answer          jsonb       not null,             -- { "correct": ["c2"], "explanation": "..." }
    detail          jsonb,                            -- { more_info, reference, example, open_question }
    content_version int         not null default 1,
    visibility      text        not null default 'public',  -- public | tenant
    status          text        not null default 'approved',
    created_at      timestamptz not null default now()
);
-- id is the keyset feed cursor; (tenant_id, id) keeps it scoped and ordered.
create index idx_post_feed    on post (tenant_id, id);
create index idx_post_topic   on post (topic);
create index idx_post_subject on post (subject);

-- ---------------------------------------------------------------------------
-- Activity (every user input lands here)
-- ---------------------------------------------------------------------------

-- One row per session (an encounter with a post). A repeat is a new row.
-- Stores only WHAT THE USER DID — never a correctness verdict; correctness is
-- derived later from the post's answer key.
create table attempt (
    id              bigint generated always as identity primary key,
    user_id         bigint      not null references app_user (id),
    post_id         bigint      not null references post (id),
    tenant_id       bigint      not null references tenant (id),
    session_seq     int         not null default 1,
    selected        jsonb       not null,             -- ["c2", ...] chosen choice ids
    duration_ms     int,
    detail          jsonb,                            -- within-session telemetry
    content_version int,                              -- version of the post seen
    created_at      timestamptz not null default now()
);
create index idx_attempt_user_post   on attempt (user_id, post_id, session_seq);
create index idx_attempt_tenant_post on attempt (tenant_id, post_id);

-- Boolean membership reaction: like / dislike. Presence = "on".
create table reaction (
    id         bigint generated always as identity primary key,
    user_id    bigint      not null references app_user (id),
    post_id    bigint      not null references post (id),
    tenant_id  bigint      not null references tenant (id),
    kind       text        not null,                  -- like | dislike
    created_at timestamptz not null default now(),
    unique (user_id, post_id, kind)
);

-- Append-only view log (the "viewed" signal). Coverage/"nope" is derived from
-- this minus attempts.
create table view_event (
    id        bigint generated always as identity primary key,
    user_id   bigint      not null references app_user (id),
    post_id   bigint      not null references post (id),
    tenant_id bigint      not null references tenant (id),
    viewed_at timestamptz not null default now()
);
create index idx_view_user_post on view_event (user_id, post_id);

-- ---------------------------------------------------------------------------
-- Seed the single public tenant + a demo user (build-1 stand-ins)
-- ---------------------------------------------------------------------------
insert into tenant (kind, name, slug) values ('public', 'Public Network', 'public');
insert into app_user (display_name) values ('Demo Student');
