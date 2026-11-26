-- mindSwipe build-2 — seed student attempts so the class dashboard shows real
-- progress. Runs as postgres (RLS bypassed), writing on behalf of the students.
--
-- Alex: 8 difficulty-1 cards, all correct.
-- Sam:  6 difficulty-1 cards, first 3 correct, last 3 wrong.
--
-- Re-runnable: guarded by a not-exists on (user, post).
-- Reset:  delete from public.attempt where user_id in
--           ('a1a1a1a1-0000-0000-0000-000000000002',
--            'a1a1a1a1-0000-0000-0000-000000000003');

-- Alex — all correct.
insert into public.attempt (user_id, post_id, tenant_id, selected)
select 'a1a1a1a1-0000-0000-0000-000000000002'::uuid, p.id, 2, p.answer -> 'correct'
from (
    select id, answer
    from public.post
    where difficulty = 1 and locale = 'de' and visibility = 'public'
    order by id
    limit 8
) p
where not exists (
    select 1 from public.attempt a
    where a.user_id = 'a1a1a1a1-0000-0000-0000-000000000002' and a.post_id = p.id
);

-- Sam — first 3 correct, last 3 wrong (a non-existent choice id is never correct).
insert into public.attempt (user_id, post_id, tenant_id, selected)
select 'a1a1a1a1-0000-0000-0000-000000000003'::uuid, p.id, 2,
       case when p.rn <= 3 then p.answer -> 'correct' else '["zz"]'::jsonb end
from (
    select id, answer, row_number() over (order by id) as rn
    from public.post
    where difficulty = 1 and locale = 'de' and visibility = 'public'
    order by id
    limit 6
) p
where not exists (
    select 1 from public.attempt a
    where a.user_id = 'a1a1a1a1-0000-0000-0000-000000000003' and a.post_id = p.id
);

-- Summary
select m.display_name, count(distinct a.post_id) as answered,
       count(distinct a.post_id) filter (
           where public.selected_is_correct(a.selected, p.answer -> 'correct')
       ) as correct
from public.membership m
left join public.attempt a on a.user_id = m.user_id
left join public.post p on p.id = a.post_id
where m.tenant_id = (select id from public.tenant where slug = 'lincoln')
group by m.display_name
order by m.display_name;
