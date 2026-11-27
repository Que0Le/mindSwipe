-- mindSwipe build-2 — a realistic Lincoln class cohort so the teacher dashboard's
-- metrics and conclusions have something to say.
--
-- 25 "ghost" students (no login needed — they never authenticate; they only own
-- attempts), each on a performance tier, with timed attempts spread across
-- subjects/topics. Tiers: strong / good / average / weak / disengaged, by n % 5.
--
-- Re-runnable (guarded). Reset:
--   delete from public.attempt   where user_id::text like 'a2a2a2a2-%';
--   delete from public.membership where user_id::text like 'a2a2a2a2-%';
--   delete from auth.users       where id::text      like 'a2a2a2a2-%';

-- 25 ghost users ---------------------------------------------------------------
insert into auth.users (
    instance_id, id, aud, role, is_anonymous, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
select
    '00000000-0000-0000-0000-000000000000',
    ('a2a2a2a2-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
    'authenticated', 'authenticated', false, now(), now(),
    '', '', '', '', '', '', '', ''
from generate_series(1, 25) as n
on conflict (id) do nothing;

-- Memberships with German names ------------------------------------------------
with names(n, full_name) as (
    values
    (1,'Lena Müller'),(2,'Jonas Schmidt'),(3,'Mia Schneider'),(4,'Luca Fischer'),
    (5,'Emma Weber'),(6,'Finn Meyer'),(7,'Hannah Wagner'),(8,'Paul Becker'),
    (9,'Sophie Schulz'),(10,'Leon Hoffmann'),(11,'Marie Koch'),(12,'Ben Bauer'),
    (13,'Klara Richter'),(14,'Noah Klein'),(15,'Lea Wolf'),(16,'Elias Schröder'),
    (17,'Clara Neumann'),(18,'Felix Schwarz'),(19,'Johanna Zimmermann'),(20,'Tim Braun'),
    (21,'Nora Krüger'),(22,'David Hofmann'),(23,'Anna Hartmann'),(24,'Max Lange'),
    (25,'Julia Werner')
)
insert into public.membership (user_id, tenant_id, role, display_name)
select
    ('a2a2a2a2-0000-0000-0000-' || lpad(nm.n::text, 12, '0'))::uuid,
    (select id from public.tenant where slug = 'lincoln'),
    'student',
    nm.full_name
from names nm
on conflict (user_id, tenant_id) do nothing;

-- Tiered, timed attempts -------------------------------------------------------
-- Each student attempts `coverage_n` random cards; each is correct with prob
-- `acc`, else a real wrong choice; duration scales with tier (weak = slower).
with params as (
    select
        ('a2a2a2a2-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid as uid,
        (n % 5) as tier,
        (array[0.92, 0.80, 0.65, 0.45, 0.50])[(n % 5) + 1] as acc,
        (array[30, 26, 22, 18, 8])[(n % 5) + 1]           as coverage_n,
        (array[3000, 4000, 6000, 9000, 5000])[(n % 5) + 1] as base_ms,
        (array[5000, 8000, 12000, 20000, 10000])[(n % 5) + 1] as range_ms
    from generate_series(1, 25) as n
)
insert into public.attempt (user_id, post_id, tenant_id, selected, duration_ms)
select
    pr.uid,
    p.id,
    2,
    case when random() < pr.acc then p.answer -> 'correct'
         else to_jsonb(array[(
             select c ->> 'id'
             from jsonb_array_elements(p.choices) c
             where c ->> 'id' not in (select jsonb_array_elements_text(p.answer -> 'correct'))
             limit 1
         )])
    end,
    (pr.base_ms + random() * pr.range_ms)::int
from params pr
cross join lateral (
    select id, choices, answer
    from public.post
    where question_type = 'mcq' and locale = 'de' and visibility = 'public'
      and difficulty in (1, 2)
      and jsonb_array_length(choices) > 1
    order by random()
    limit pr.coverage_n
) p
where not exists (
    select 1 from public.attempt a where a.user_id = pr.uid and a.post_id = p.id
);

-- Summary: cohort spread ------------------------------------------------------
select m.display_name,
       count(distinct a.post_id) as answered,
       count(distinct a.post_id) filter (
           where public.selected_is_correct(a.selected, p.answer -> 'correct')
       ) as correct
from public.membership m
left join public.attempt a on a.user_id = m.user_id
left join public.post p on p.id = a.post_id
where m.user_id::text like 'a2a2a2a2-%'
group by m.display_name
order by correct desc nulls last
limit 8;
