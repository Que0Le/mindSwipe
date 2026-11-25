-- mindSwipe Phase 2, build-1 — Supabase-native schema + RLS.
--
-- Access model: the PWA talks to PostgREST directly. There is no app server in
-- the request path, so RLS IS the access control. Users are created by Supabase
-- ANONYMOUS sign-in (no login screen), so auth.uid() identifies every actor and
-- owns their activity rows. A single seeded `public` tenant for now.
--
-- Everything is a deliberate subset of docs/TECH.md: tenant_id / content_version
-- are carried for future-proofing; grading, scheduling, dashboards come later.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tenant (single public tenant in build-1)
-- ---------------------------------------------------------------------------
create table public.tenant (
    id         bigint generated always as identity primary key,
    kind       text        not null default 'public',
    name       text        not null,
    slug       text        not null unique,
    created_at timestamptz not null default now()
);
insert into public.tenant (kind, name, slug) values ('public', 'Public Network', 'public');

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.post (
    id              bigint generated always as identity primary key,
    tenant_id       bigint      not null default 1 references public.tenant (id),
    subject         text,
    topic           text,
    difficulty      smallint,                         -- 1 leicht, 2 mittel, 3 schwer
    locale          text        not null default 'en', -- BCP-47 tag; the Gymnasium bank is 'de'
    question_type   text        not null default 'mcq',
    prompt          text        not null,
    choices         jsonb       not null,             -- [{ "id":"c1", "text":"..." }, ...]
    answer          jsonb       not null,             -- { "correct":["c2"], "explanation":"..." }
    detail          jsonb,                            -- { more_info, reference, example, open_question }
    content_version int         not null default 1,
    visibility      text        not null default 'public',
    status          text        not null default 'approved',
    created_at      timestamptz not null default now()
);
create index idx_post_feed    on public.post (tenant_id, id);
create index idx_post_topic    on public.post (topic);
create index idx_post_subject  on public.post (subject);
create index idx_post_locale   on public.post (locale);

-- ---------------------------------------------------------------------------
-- Activity (every user input; owned by auth.uid())
-- ---------------------------------------------------------------------------

-- One row per session (an encounter). A repeat is a new row. Stores only the
-- choice, never a correctness verdict. session_seq is assigned by a trigger so
-- the client only sends post_id + selected.
create table public.attempt (
    id              bigint generated always as identity primary key,
    user_id         uuid        not null default auth.uid() references auth.users (id) on delete cascade,
    post_id         bigint      not null references public.post (id),
    tenant_id       bigint      not null default 1 references public.tenant (id),
    session_seq     int,
    selected        jsonb       not null,             -- ["c2", ...] chosen choice ids
    duration_ms     int,
    detail          jsonb,
    content_version int,
    created_at      timestamptz not null default now()
);
create index idx_attempt_user_post   on public.attempt (user_id, post_id, session_seq);
create index idx_attempt_tenant_post on public.attempt (tenant_id, post_id);

create or replace function public.set_attempt_session_seq()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.session_seq is null then
        select coalesce(max(session_seq), 0) + 1 into new.session_seq
        from public.attempt
        where user_id = new.user_id and post_id = new.post_id;
    end if;
    return new;
end;
$$;

create trigger trg_attempt_session_seq
    before insert on public.attempt
    for each row execute function public.set_attempt_session_seq();

-- Boolean membership reaction: like / dislike. Presence = "on".
create table public.reaction (
    id         bigint generated always as identity primary key,
    user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
    post_id    bigint      not null references public.post (id),
    tenant_id  bigint      not null default 1 references public.tenant (id),
    kind       text        not null check (kind in ('like', 'dislike')),
    created_at timestamptz not null default now(),
    unique (user_id, post_id, kind)
);

-- Append-only view log (the "viewed" signal).
create table public.view_event (
    id        bigint generated always as identity primary key,
    user_id   uuid        not null default auth.uid() references auth.users (id) on delete cascade,
    post_id   bigint      not null references public.post (id),
    tenant_id bigint      not null default 1 references public.tenant (id),
    viewed_at timestamptz not null default now()
);
create index idx_view_user_post on public.view_event (user_id, post_id);

-- ---------------------------------------------------------------------------
-- Row-level security  (PostgREST enforces these per request via the JWT)
-- ---------------------------------------------------------------------------
alter table public.post       enable row level security;
alter table public.attempt    enable row level security;
alter table public.reaction   enable row level security;
alter table public.view_event enable row level security;
alter table public.tenant     enable row level security;

-- Content is public-readable (exercise mode ships the answer for instant feedback).
create policy post_read on public.post
    for select to anon, authenticated using (status = 'approved');

create policy tenant_read on public.tenant
    for select to anon, authenticated using (true);

-- Activity: a user may only write and read their OWN rows.
create policy attempt_insert on public.attempt
    for insert to authenticated with check (user_id = auth.uid());
create policy attempt_read on public.attempt
    for select to authenticated using (user_id = auth.uid());

create policy reaction_insert on public.reaction
    for insert to authenticated with check (user_id = auth.uid());
create policy reaction_read on public.reaction
    for select to authenticated using (user_id = auth.uid());
create policy reaction_delete on public.reaction
    for delete to authenticated using (user_id = auth.uid());   -- un-like / un-dislike

create policy view_insert on public.view_event
    for insert to authenticated with check (user_id = auth.uid());
create policy view_read on public.view_event
    for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants (PostgREST connects as anon / authenticated; RLS still applies)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.post   to anon, authenticated;
grant select on public.tenant to anon, authenticated;

grant select, insert         on public.attempt    to authenticated;
grant select, insert, delete on public.reaction   to authenticated;
grant select, insert         on public.view_event to authenticated;
