-- mindSwipe Phase 2, build-2 — generic groups/roles (classes, sections, courses).
--
-- The invariant that survives different school systems: a GROUP of people, with
-- members attached in ROLES (and an optional subject on the attachment). `kind`
-- carries the country/structure variation as data, not schema:
--   class | section | course | exercise_group | homeroom | cohort | set | …
--
-- Named learning_group because `group` is a reserved word. Student↔group
-- membership is soft (attendance, not an enrollment lock), so fluid attendance
-- (university courses) works too.

create table public.learning_group (
    id         bigint generated always as identity primary key,
    tenant_id  bigint      not null references public.tenant (id) on delete cascade,
    kind       text        not null default 'class',
    name       text        not null,
    parent_id  bigint      references public.learning_group (id) on delete set null,
    created_at timestamptz not null default now()
);
create index idx_group_tenant on public.learning_group (tenant_id, kind);

create table public.group_member (
    group_id bigint not null references public.learning_group (id) on delete cascade,
    user_id  uuid   not null references auth.users (id) on delete cascade,
    role     text   not null default 'student'
             check (role in ('student', 'teacher', 'assistant', 'homeroom', 'lead')),
    subject  text,  -- set on a teacher's attachment when they teach one subject
    primary key (group_id, user_id)
);
create index idx_group_member_user on public.group_member (user_id);

alter table public.learning_group enable row level security;
alter table public.group_member   enable row level security;

-- Groups are visible to tenant members; only staff curate them.
create policy group_read on public.learning_group
    for select to authenticated using (public.is_member(tenant_id));
create policy group_write on public.learning_group
    for all to authenticated
    using (public.is_staff(tenant_id))
    with check (public.is_staff(tenant_id));

-- A member sees group rosters for groups in a tenant where they are staff, plus
-- their own memberships.
create policy group_member_read on public.group_member
    for select to authenticated
    using (
        user_id = auth.uid()
        or exists (
            select 1 from public.learning_group g
            where g.id = group_id and public.is_staff(g.tenant_id)
        )
    );
create policy group_member_write on public.group_member
    for all to authenticated
    using (exists (select 1 from public.learning_group g where g.id = group_id and public.is_staff(g.tenant_id)))
    with check (exists (select 1 from public.learning_group g where g.id = group_id and public.is_staff(g.tenant_id)));

grant select, insert, update, delete on public.learning_group to authenticated;
grant select, insert, update, delete on public.group_member   to authenticated;

notify pgrst, 'reload schema';
