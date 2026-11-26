-- mindSwipe Phase 2, build-2 — per-tenant feature flags + visibility-scoped reads.
--
-- This is what makes the three archetypes (Public network / Paid / Private) the
-- SAME codebase behaving differently: tenant_config carries a plan + a flags
-- jsonb, and the PWA shows/hides surfaces (ads, authoring, class dashboard)
-- purely from those flags. Flags are UI toggles, not secrets, so they are
-- world-readable.
--
-- It also tightens post_read to honour post.visibility: 'public' rows stay
-- readable by everyone (the whole library is public today), but 'tenant' rows
-- become visible only to that tenant's members — so a Private circle's own
-- content is actually private. RLS is still the only access control.

-- ---------------------------------------------------------------------------
-- tenant_config
-- ---------------------------------------------------------------------------
create table public.tenant_config (
    tenant_id  bigint      primary key references public.tenant (id) on delete cascade,
    plan       text        not null default 'free',   -- free | paid | private
    flags      jsonb       not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

alter table public.tenant_config enable row level security;

-- Flags are not sensitive (they only decide which UI surfaces render), so any
-- visitor may read any tenant's config — anonymous users read the public
-- tenant's flags to know whether to show ads, etc.
create policy tenant_config_read on public.tenant_config
    for select to anon, authenticated using (true);

grant select on public.tenant_config to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Visibility-scoped post reads (public to all; tenant rows to members only)
-- ---------------------------------------------------------------------------
drop policy post_read on public.post;
create policy post_read on public.post
    for select to anon, authenticated
    using (
        status = 'approved'
        and (visibility = 'public' or public.is_member(tenant_id))
    );

notify pgrst, 'reload schema';
