-- mindSwipe Phase 2, build-2 — author/teacher playlist curation.
--
-- Closes the authoring loop: authored cards were standalone (approved → open
-- feed), but could not be *curated* into a playlist, which is how teachers
-- actually deliver content. This opens playlist + playlist_item writes from
-- staff-only (0004) to an OWNERSHIP model matching authoring: a playlist has a
-- created_by; the owner curates their own, staff curate any in the tenant.
--
-- Delivery stays correct because the swipe feed pins status='approved' (see
-- api.ts getFeed) and the curation UI only offers approved cards — a playlist is
-- for delivery, so pending/rejected cards never surface through it.

-- created_by defaults to the caller, so the insert WITH CHECK (created_by =
-- auth.uid()) is satisfied without the client having to send it (matches
-- comment/attempt, and now post).
alter table public.playlist alter column created_by set default auth.uid();

-- Replace the single staff-only FOR ALL write policy with granular,
-- ownership-aware policies. playlist_read (0004) is unchanged.
drop policy playlist_write on public.playlist;

create policy playlist_insert on public.playlist
    for insert to authenticated
    with check (public.can_author(tenant_id) and created_by = auth.uid());

create policy playlist_modify on public.playlist
    for update to authenticated
    using (created_by = auth.uid() or public.is_staff(tenant_id))
    with check (created_by = auth.uid() or public.is_staff(tenant_id));

create policy playlist_remove on public.playlist
    for delete to authenticated
    using (created_by = auth.uid() or public.is_staff(tenant_id));

-- playlist_item writes follow the parent playlist's curate rights: the owner of
-- the playlist, or any staff of its tenant. (playlist_item_read from 0004 stays.)
drop policy playlist_item_write on public.playlist_item;

create policy playlist_item_write on public.playlist_item
    for all to authenticated
    using (exists (
        select 1 from public.playlist p
        where p.id = playlist_id
          and (p.created_by = auth.uid() or public.is_staff(p.tenant_id))
    ))
    with check (exists (
        select 1 from public.playlist p
        where p.id = playlist_id
          and (p.created_by = auth.uid() or public.is_staff(p.tenant_id))
    ));

notify pgrst, 'reload schema';
