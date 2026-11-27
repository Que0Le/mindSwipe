-- mindSwipe Phase 2, build-2 — teacher-dashboard metric views.
--
-- Both security_invoker, so attempt RLS scopes them: a teacher aggregates their
-- own students (own + attempt_read_staff), anyone else only themselves.
--
--   student_effort      — per student: answered, accuracy, median time, recency
--                         (the effort × outcome axis; drives segmentation).
--   class_topic_mastery — per subject/topic: class-wide accuracy (where the class
--                         is strong vs struggling).

create view public.student_effort with (security_invoker = true) as
select
    m.tenant_id,
    m.user_id,
    m.display_name,
    m.role,
    count(distinct a.post_id)                       as answered,
    round(
        100.0 * count(*) filter (
            where public.selected_is_correct(a.selected, p.answer -> 'correct')
        ) / nullif(count(*), 0)
    )                                               as accuracy,
    percentile_cont(0.5) within group (
        order by a.duration_ms
    ) filter (where a.duration_ms is not null)      as median_ms,
    max(a.created_at)                               as last_at
from public.membership m
left join public.attempt a on a.user_id = m.user_id
left join public.post p    on p.id = a.post_id
group by m.tenant_id, m.user_id, m.display_name, m.role;

create view public.class_topic_mastery with (security_invoker = true) as
select
    p.subject,
    p.topic,
    count(*)                                        as attempts,
    count(distinct a.user_id)                       as students,
    round(
        100.0 * count(*) filter (
            where public.selected_is_correct(a.selected, p.answer -> 'correct')
        ) / nullif(count(*), 0)
    )                                               as accuracy
from public.attempt a
join public.post p on p.id = a.post_id
group by p.subject, p.topic;

grant select on public.student_effort      to authenticated;
grant select on public.class_topic_mastery to authenticated;

notify pgrst, 'reload schema';
