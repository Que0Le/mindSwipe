-- A small view powering the topic filter (topic + card count), exposed to the
-- PWA via PostgREST. security_invoker so it respects the reader's RLS on post.

create view public.topic_count
    with (security_invoker = true) as
select topic, count(*)::int as count
from public.post
where status = 'approved'
group by topic
order by count desc;

grant select on public.topic_count to anon, authenticated;

notify pgrst, 'reload schema';
