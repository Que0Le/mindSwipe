-- mindSwipe Phase 2, build-2 — per-student-per-subject effort.
--
-- Powers the dashboard's subject lens: a subject teacher (e.g. Mathematik) sees
-- their students scoped to that subject; a homeroom teacher uses the all-subjects
-- view. security_invoker so attempt RLS scopes it to the caller's students.
--
-- Students with no attempts in a subject simply have no row for it; the client
-- left-merges against the full roster so every enrolled student still shows.

create view public.student_subject_effort with (security_invoker = true) as
select
    m.tenant_id,
    m.user_id,
    m.display_name,
    m.role,
    p.subject,
    count(distinct a.post_id)                       as answered,
    round(
        100.0 * count(*) filter (
            where public.selected_is_correct(a.selected, p.answer -> 'correct')
        ) / nullif(count(*), 0)
    )                                               as accuracy,
    percentile_cont(0.5) within group (
        order by a.duration_ms
    ) filter (where a.duration_ms is not null)      as median_ms
from public.membership m
join public.attempt a on a.user_id = m.user_id
join public.post p    on p.id = a.post_id and p.subject is not null
group by m.tenant_id, m.user_id, m.display_name, m.role, p.subject;

grant select on public.student_subject_effort to authenticated;

notify pgrst, 'reload schema';
