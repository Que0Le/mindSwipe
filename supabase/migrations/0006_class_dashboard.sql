-- mindSwipe Phase 2, build-2 — teacher class dashboard.
--
-- The Paid archetype's promise is teacher monitoring. This lets a teacher read
-- their OWN students' attempts (and only theirs) and exposes a per-student
-- rollup view. Still RLS: a teacher sees a user's attempts only where they share
-- a tenant in which the teacher is staff.

-- A user the current actor may monitor: someone who belongs to a tenant where
-- the actor is a teacher/admin. SECURITY DEFINER so the attempt policy that
-- calls it doesn't recurse through membership's own RLS.
create or replace function public.staff_sees_user(target uuid)
returns boolean language sql stable security definer set search_path = '' as $$
    select exists (
        select 1
        from public.membership staff
        join public.membership member on member.tenant_id = staff.tenant_id
        where staff.user_id = auth.uid()
          and staff.role in ('teacher', 'tenant_admin')
          and member.user_id = target
    );
$$;

-- Additional SELECT policy on attempt (OR'd with attempt_read): staff may read
-- their own students' attempts.
create policy attempt_read_staff on public.attempt
    for select to authenticated
    using (public.staff_sees_user(user_id));

-- Per-student rollup for the class dashboard. security_invoker so the caller's
-- RLS applies: a teacher sees their whole roster (membership_read via is_staff)
-- plus each student's attempts (attempt_read_staff); anyone else sees only
-- themselves.
create view public.class_roster with (security_invoker = true) as
    select
        m.tenant_id,
        m.user_id,
        m.display_name,
        m.role,
        count(distinct a.post_id)                                       as answered,
        count(distinct a.post_id) filter (
            where public.selected_is_correct(a.selected, p.answer -> 'correct')
        )                                                               as correct
    from public.membership m
    left join public.attempt a on a.user_id = m.user_id
    left join public.post p    on p.id = a.post_id
    group by m.tenant_id, m.user_id, m.display_name, m.role;

grant select on public.class_roster to authenticated;

-- IMPORTANT: now that staff can read their students' attempts (attempt_read_staff),
-- the personal "my_*" views can no longer rely on RLS alone to scope to the
-- caller — they must filter by auth.uid() explicitly, or a teacher's own stats
-- would fold in the whole class. class_roster is unaffected (it groups by the
-- membership user, attributing each attempt correctly).
create or replace view public.my_post_result with (security_invoker = true) as
    select distinct on (a.post_id)
        a.post_id,
        p.topic,
        p.difficulty,
        public.selected_is_correct(a.selected, p.answer -> 'correct') as correct,
        a.created_at
    from public.attempt a
    join public.post p on p.id = a.post_id
    where a.user_id = auth.uid()
    order by a.post_id, a.session_seq desc nulls last, a.id desc;

notify pgrst, 'reload schema';
