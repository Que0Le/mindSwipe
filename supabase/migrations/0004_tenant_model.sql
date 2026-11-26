-- mindSwipe Phase 2, build-2 — multi-tenant model, roles, RLS, dashboard views.
--
-- Build-1 proved the single-tenant Supabase-native stack (post + activity, owned
-- by auth.uid()). Build-2 makes the tenant real: memberships give users a ROLE
-- inside a TENANT, and RLS keys every new object off that membership. This is the
-- whole multi-tenant isolation — one set of policies, no per-query scoping code.
--
-- New objects:
--   membership      - (user, tenant, role): who belongs where, as what
--   topic_interest  - a user's followed topics (topics are free-text tags)
--   playlist        - a teacher/pool-curated, ordered set of posts (tenant-scoped)
--   assignment      - a teacher task over a playlist or topic, tenant-wide or 1:1
--   comment         - student discussion, teacher-moderated (pending by default)
--   helper fns      - is_member / has_role (SECURITY DEFINER, so policies that read
--                     membership don't recurse through its own RLS)
--   views           - my_post_result / my_stats / my_topic_mastery /
--                     assignment_post / my_assignment_progress (security_invoker,
--                     so the caller's RLS still scopes them to their own rows)
--
-- Identity: build-1's anonymous sign-in stays (the Public Network persona). Build-2
-- ADDS seeded email/password persona accounts (teacher + students) so roles,
-- assignments and moderation have durable, distinct identities to hang off. Those
-- accounts are created in seed/0004_personas_demo.sql, not here.

-- ---------------------------------------------------------------------------
-- Roles & membership
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('student', 'teacher', 'author', 'tenant_admin');

create table public.membership (
    id           bigint generated always as identity primary key,
    user_id      uuid        not null references auth.users (id) on delete cascade,
    tenant_id    bigint      not null references public.tenant (id),
    role         public.app_role not null default 'student',
    display_name text,
    created_at   timestamptz not null default now(),
    unique (user_id, tenant_id)
);
create index idx_membership_tenant on public.membership (tenant_id);

-- SECURITY DEFINER so a policy that calls these can read membership without
-- triggering membership's own RLS (which would recurse). search_path pinned.
create or replace function public.is_member(tid bigint)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.membership m
        where m.tenant_id = tid and m.user_id = auth.uid()
    );
$$;

create or replace function public.has_role(tid bigint, r public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.membership m
        where m.tenant_id = tid and m.user_id = auth.uid() and m.role = r
    );
$$;

-- A teacher or tenant_admin can see/curate the whole tenant.
create or replace function public.is_staff(tid bigint)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.membership m
        where m.tenant_id = tid and m.user_id = auth.uid()
          and m.role in ('teacher', 'tenant_admin')
    );
$$;

-- ---------------------------------------------------------------------------
-- Topics a user follows (topic == free-text tag on post.topic)
-- ---------------------------------------------------------------------------
create table public.topic_interest (
    user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
    topic      text        not null,
    created_at timestamptz not null default now(),
    primary key (user_id, topic)
);

-- ---------------------------------------------------------------------------
-- Playlists — curated, ordered post sets (prepared by a teacher or a pool)
-- ---------------------------------------------------------------------------
create table public.playlist (
    id          bigint generated always as identity primary key,
    tenant_id   bigint      not null references public.tenant (id),
    slug        text        not null,
    title       text        not null,
    description text,
    created_by  uuid        references auth.users (id),
    visibility  text        not null default 'tenant',   -- 'tenant' | 'public'
    created_at  timestamptz not null default now(),
    unique (tenant_id, slug)
);

create table public.playlist_item (
    playlist_id bigint not null references public.playlist (id) on delete cascade,
    post_id     bigint not null references public.post (id) on delete cascade,
    position    int    not null default 0,
    primary key (playlist_id, post_id)
);
create index idx_playlist_item_order on public.playlist_item (playlist_id, position);

-- ---------------------------------------------------------------------------
-- Assignments — a teacher task over a playlist or a topic
-- ---------------------------------------------------------------------------
create table public.assignment (
    id          bigint generated always as identity primary key,
    tenant_id   bigint      not null references public.tenant (id),
    created_by  uuid        references auth.users (id),
    title       text        not null,
    description text,
    source_type text        not null check (source_type in ('playlist', 'topic')),
    playlist_id bigint      references public.playlist (id) on delete cascade,
    topic       text,
    assignee    uuid        references auth.users (id),    -- null = whole tenant
    due_at      timestamptz,
    created_at  timestamptz not null default now(),
    check (
        (source_type = 'playlist' and playlist_id is not null) or
        (source_type = 'topic'    and topic       is not null)
    )
);
create index idx_assignment_tenant on public.assignment (tenant_id);

-- ---------------------------------------------------------------------------
-- Comments — teacher-moderated student discussion (pending until approved)
-- ---------------------------------------------------------------------------
create type public.moderation_status as enum ('pending', 'approved', 'rejected');

create table public.comment (
    id          bigint generated always as identity primary key,
    post_id     bigint      not null references public.post (id) on delete cascade,
    tenant_id   bigint      not null references public.tenant (id),
    user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
    body        text        not null check (char_length(body) between 1 and 2000),
    status      public.moderation_status not null default 'pending',
    reviewed_by uuid        references auth.users (id),
    reviewed_at timestamptz,
    created_at  timestamptz not null default now()
);
create index idx_comment_post   on public.comment (post_id, status);
create index idx_comment_tenant on public.comment (tenant_id, status);

-- Stamp the reviewer whenever a comment leaves 'pending'. Keeps the moderation
-- trail server-side instead of trusting the client to set reviewed_by.
create or replace function public.stamp_comment_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    if new.status is distinct from old.status then
        new.reviewed_by := auth.uid();
        new.reviewed_at := now();
    end if;
    return new;
end;
$$;
create trigger trg_comment_review
    before update on public.comment
    for each row execute function public.stamp_comment_review();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.membership     enable row level security;
alter table public.topic_interest enable row level security;
alter table public.playlist       enable row level security;
alter table public.playlist_item  enable row level security;
alter table public.assignment     enable row level security;
alter table public.comment        enable row level security;

-- membership: a user sees their own rows; staff see the whole tenant roster.
create policy membership_read on public.membership
    for select to authenticated
    using (user_id = auth.uid() or public.is_staff(tenant_id));

-- topic_interest: fully private to the user.
create policy topic_interest_all on public.topic_interest
    for all to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- playlist: visible to tenant members (or if marked public); only staff curate.
create policy playlist_read on public.playlist
    for select to authenticated
    using (visibility = 'public' or public.is_member(tenant_id));
create policy playlist_write on public.playlist
    for all to authenticated
    using (public.is_staff(tenant_id))
    with check (public.is_staff(tenant_id));

create policy playlist_item_read on public.playlist_item
    for select to authenticated
    using (exists (
        select 1 from public.playlist p
        where p.id = playlist_id
          and (p.visibility = 'public' or public.is_member(p.tenant_id))
    ));
create policy playlist_item_write on public.playlist_item
    for all to authenticated
    using (exists (
        select 1 from public.playlist p
        where p.id = playlist_id and public.is_staff(p.tenant_id)
    ))
    with check (exists (
        select 1 from public.playlist p
        where p.id = playlist_id and public.is_staff(p.tenant_id)
    ));

-- assignment: a member sees tenant-wide ones and their own 1:1 ones; staff see
-- all and are the only ones who create/edit.
create policy assignment_read on public.assignment
    for select to authenticated
    using (
        public.is_member(tenant_id)
        and (assignee is null or assignee = auth.uid() or public.is_staff(tenant_id))
    );
create policy assignment_write on public.assignment
    for all to authenticated
    using (public.is_staff(tenant_id))
    with check (public.is_staff(tenant_id));

-- comment: approved comments are visible to the tenant; authors always see their
-- own; staff see everything (the moderation queue). Anyone may post, but only as
-- 'pending' — nothing goes public without a staff approval (an UPDATE).
create policy comment_read on public.comment
    for select to authenticated
    using (
        (status = 'approved' and public.is_member(tenant_id))
        or user_id = auth.uid()
        or public.is_staff(tenant_id)
    );
create policy comment_insert on public.comment
    for insert to authenticated
    with check (
        user_id = auth.uid()
        and status = 'pending'
        and public.is_member(tenant_id)
    );
create policy comment_moderate on public.comment
    for update to authenticated
    using (public.is_staff(tenant_id))
    with check (public.is_staff(tenant_id));
create policy comment_delete on public.comment
    for delete to authenticated
    using (user_id = auth.uid() or public.is_staff(tenant_id));

-- ---------------------------------------------------------------------------
-- Dashboard views (security_invoker: the caller's RLS still applies, so each
-- user only ever aggregates their own activity rows)
-- ---------------------------------------------------------------------------

-- Exact-set-match grading in SQL, mirroring the client's rule.
create or replace function public.selected_is_correct(selected jsonb, correct jsonb)
returns boolean language sql immutable as $$
    select coalesce(
        (select array(select jsonb_array_elements_text(selected) order by 1))
      = (select array(select jsonb_array_elements_text(correct)  order by 1)),
        false
    );
$$;

-- Latest attempt per post for the current user, with correctness + topic.
create view public.my_post_result with (security_invoker = true) as
    select distinct on (a.post_id)
        a.post_id,
        p.topic,
        p.difficulty,
        public.selected_is_correct(a.selected, p.answer -> 'correct') as correct,
        a.created_at
    from public.attempt a
    join public.post p on p.id = a.post_id
    order by a.post_id, a.session_seq desc nulls last, a.id desc;

-- One-row rollup for the dashboard header. answered + correct come from a single
-- pass over my_post_result (the distinct-on join), not two.
create view public.my_stats with (security_invoker = true) as
    select
        r.answered,
        r.correct,
        (select count(*) from public.reaction  where kind = 'like')     as likes,
        (select count(distinct post_id) from public.view_event)         as viewed
    from (
        select count(*) as answered, count(*) filter (where correct) as correct
        from public.my_post_result
    ) r;

-- Per-topic mastery for the "your topics" cards.
create view public.my_topic_mastery with (security_invoker = true) as
    select topic,
           count(*)                        as answered,
           count(*) filter (where correct) as correct
    from public.my_post_result
    group by topic;

-- The post set behind each assignment (playlist items, or topic match).
create view public.assignment_post with (security_invoker = true) as
    select a.id as assignment_id, pi.post_id
    from public.assignment a
    join public.playlist_item pi on pi.playlist_id = a.playlist_id
    where a.source_type = 'playlist'
    union all
    select a.id as assignment_id, p.id as post_id
    from public.assignment a
    join public.post p on p.topic = a.topic
    where a.source_type = 'topic';

-- Assignment progress for the current user: how many of its posts they've
-- attempted / got right.
create view public.my_assignment_progress with (security_invoker = true) as
    select ap.assignment_id,
           count(*)                                       as total,
           count(r.post_id)                               as attempted,
           count(*) filter (where r.correct)              as correct
    from public.assignment_post ap
    left join public.my_post_result r on r.post_id = ap.post_id
    group by ap.assignment_id;

-- ---------------------------------------------------------------------------
-- Grants (PostgREST connects as authenticated; RLS still applies)
-- ---------------------------------------------------------------------------
grant select                         on public.membership     to authenticated;
grant select, insert, delete         on public.topic_interest to authenticated;
grant select, insert, update, delete on public.playlist       to authenticated;
grant select, insert, update, delete on public.playlist_item  to authenticated;
grant select, insert, update, delete on public.assignment     to authenticated;
grant select, insert, update, delete on public.comment        to authenticated;

grant select on public.my_post_result        to authenticated;
grant select on public.my_stats              to authenticated;
grant select on public.my_topic_mastery      to authenticated;
grant select on public.assignment_post       to authenticated;
grant select on public.my_assignment_progress to authenticated;

notify pgrst, 'reload schema';
