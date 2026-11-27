-- mindSwipe Phase 2, build-2 — authoring: draft → review → publish for cards.
--
-- Build-1/2 shipped the post table read-only: every post arrived via seed and was
-- born 'approved'. Authoring makes authorship a first-class, MODERATED action,
-- reusing the exact gate already proven for comments:
--   * an author drafts a card           -> it lands 'pending' (RLS forces it)
--   * staff approve or reject it         -> an UPDATE only staff may perform
--   * only 'approved' cards reach feeds  -> post_read + an explicit feed filter
--
-- Who may author is `author` role OR staff (teacher/tenant_admin), gated in the UI
-- by flags.authoring. Authors may edit their OWN drafts while pending/rejected and
-- resubmit, but can never flip their own card to 'approved' — the DB forbids it.

-- ---------------------------------------------------------------------------
-- Authorship + moderation trail on post
-- ---------------------------------------------------------------------------
alter table public.post
    add column if not exists created_by  uuid references auth.users (id),
    add column if not exists reviewed_by uuid references auth.users (id),
    add column if not exists reviewed_at timestamptz,
    add column if not exists review_note text;

create index if not exists idx_post_author on public.post (created_by, status);

-- An author OR staff may create/edit drafts. (is_staff already covers
-- teacher/tenant_admin; this adds the dedicated `author` role.)
create or replace function public.can_author(tid bigint)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1 from public.membership m
        where m.tenant_id = tid and m.user_id = auth.uid()
          and m.role in ('author', 'teacher', 'tenant_admin')
    );
$$;

-- Stamp the reviewer whenever a post leaves 'pending', and forbid an author from
-- approving their own card: only staff of the tenant may set status='approved'.
create or replace function public.stamp_post_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    if new.status is distinct from old.status then
        if new.status = 'approved' and not public.is_staff(new.tenant_id) then
            raise exception 'only staff may approve a card';
        end if;
        new.reviewed_by := auth.uid();
        new.reviewed_at := now();
    end if;
    return new;
end;
$$;

create trigger trg_post_review
    before update on public.post
    for each row execute function public.stamp_post_review();

-- ---------------------------------------------------------------------------
-- RLS — post was select-only (0001, retightened in 0005). Open authoring.
-- ---------------------------------------------------------------------------

-- Reads: approved content as before (public rows to all, tenant rows to members),
-- PLUS an author sees their own drafts, and staff see the whole tenant queue.
-- NB: because this now returns non-approved rows to staff/authors, every FEED
-- query must filter status='approved' explicitly (see api.ts getFeed/getPost).
drop policy post_read on public.post;
create policy post_read on public.post
    for select to anon, authenticated
    using (
        (status = 'approved' and (visibility = 'public' or public.is_member(tenant_id)))
        or created_by = auth.uid()
        or public.is_staff(tenant_id)
    );

-- Inserts: an author/staff of the tenant, their own row, forced to 'pending'.
create policy post_insert on public.post
    for insert to authenticated
    with check (
        public.can_author(tenant_id)
        and created_by = auth.uid()
        and status = 'pending'
    );

-- Updates: an author may revise their OWN still-unpublished draft; staff may
-- update any tenant row (the moderation action). The trigger stops an author
-- from smuggling status='approved' past the WITH CHECK.
create policy post_update on public.post
    for update to authenticated
    using (
        (created_by = auth.uid() and status in ('pending', 'rejected'))
        or public.is_staff(tenant_id)
    )
    with check (
        (created_by = auth.uid())
        or public.is_staff(tenant_id)
    );

grant insert, update on public.post to authenticated;

notify pgrst, 'reload schema';
