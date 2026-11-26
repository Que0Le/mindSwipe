-- mindSwipe Phase 2, build-2 — content analytics (the "author" axis).
--
-- Two security_invoker views so attempt RLS partitions them per context: a
-- publisher/teacher only ever aggregates attempts they may read, so one tenant's
-- usage of a playlist is invisible to another (the usage-data-ownership rule).
--
--   playlist_difficulty — per card of a playlist: % correct + median time.
--   card_distractors     — per choice of a card: how often it was picked
--                          (reveals traps / misconceptions).
-- Both read only existing data (attempt.selected / duration_ms, post.answer).

-- Per-card difficulty + time for a playlist.
create view public.playlist_difficulty with (security_invoker = true) as
select
    pi.playlist_id,
    pi.post_id,
    pi.position,
    count(*)                                        as attempts,
    count(distinct a.user_id)                       as students,
    count(*) filter (
        where public.selected_is_correct(a.selected, p.answer -> 'correct')
    )                                               as correct,
    round(
        100.0 * count(*) filter (
            where public.selected_is_correct(a.selected, p.answer -> 'correct')
        ) / nullif(count(*), 0)
    )                                               as correct_rate,
    percentile_cont(0.5) within group (
        order by a.duration_ms
    ) filter (where a.duration_ms is not null)      as median_ms
from public.playlist_item pi
join public.attempt a on a.post_id = pi.post_id
join public.post p    on p.id      = pi.post_id
group by pi.playlist_id, pi.post_id, pi.position;

-- Per-choice pick-rate for a card (why it is hard, not just that it is).
create view public.card_distractors with (security_invoker = true) as
with picks as (
    select a.post_id, c.id as choice_id, count(*) as picks
    from public.attempt a
    cross join lateral jsonb_array_elements_text(a.selected) as c(id)
    group by a.post_id, c.id
),
totals as (
    select post_id, count(*) as attempts from public.attempt group by post_id
)
select
    pk.post_id,
    pk.choice_id,
    pk.picks,
    round(100.0 * pk.picks / nullif(t.attempts, 0)) as pick_rate,
    exists (
        select 1 from public.post p
        where p.id = pk.post_id
          and pk.choice_id in (select jsonb_array_elements_text(p.answer -> 'correct'))
    ) as is_correct
from picks pk
join totals t on t.post_id = pk.post_id;

grant select on public.playlist_difficulty to authenticated;
grant select on public.card_distractors    to authenticated;

notify pgrst, 'reload schema';
