-- mindSwipe Phase 2, build-2 — per-student topic breakdown (dashboard drill-down).
--
-- security_invoker so a teacher can read a specific student's per-topic accuracy
-- (via attempt_read_staff), while a student sees only their own.

create view public.student_topic_mastery with (security_invoker = true) as
select
    a.user_id,
    p.subject,
    p.topic,
    count(distinct a.post_id)                       as answered,
    round(
        100.0 * count(*) filter (
            where public.selected_is_correct(a.selected, p.answer -> 'correct')
        ) / nullif(count(*), 0)
    )                                               as accuracy
from public.attempt a
join public.post p on p.id = a.post_id
group by a.user_id, p.subject, p.topic;

grant select on public.student_topic_mastery to authenticated;

notify pgrst, 'reload schema';
