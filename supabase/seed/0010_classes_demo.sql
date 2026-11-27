-- mindSwipe build-2 — split Lincoln into classes 7A / 7B.
--
-- Assigns every Lincoln student to one class (alphabetical split), and makes
-- Ms. Schmidt the Mathematik teacher of both plus homeroom (Klassenlehrerin) of
-- 7A. Re-runnable.
--
-- Reset: delete from public.learning_group where tenant_id =
--          (select id from public.tenant where slug='lincoln');  -- cascades members

insert into public.learning_group (tenant_id, kind, name)
select t.id, 'class', c.name
from (select id from public.tenant where slug = 'lincoln') t
cross join (values ('7A'), ('7B')) as c(name)
where not exists (
    select 1 from public.learning_group g
    where g.tenant_id = t.id and g.kind = 'class' and g.name = c.name
);

-- Students → 7A (first half alphabetically) / 7B (second half).
with lincoln as (select id as tid from public.tenant where slug = 'lincoln'),
     students as (
         select m.user_id, m.display_name,
                ntile(2) over (order by m.display_name) as half
         from public.membership m, lincoln
         where m.tenant_id = lincoln.tid and m.role = 'student'
     ),
     classes as (
         select g.id, g.name,
                case g.name when '7A' then 1 else 2 end as half
         from public.learning_group g, lincoln
         where g.tenant_id = lincoln.tid and g.kind = 'class'
     )
insert into public.group_member (group_id, user_id, role)
select c.id, s.user_id, 'student'
from students s
join classes c on c.half = s.half
on conflict (group_id, user_id) do nothing;

-- Ms. Schmidt: Mathematik teacher of both classes, homeroom of 7A.
with lincoln as (select id as tid from public.tenant where slug = 'lincoln'),
     teacher as (select id from auth.users where email = 'teacher@demo.mindswipe'),
     classes as (
         select g.id, g.name from public.learning_group g, lincoln
         where g.tenant_id = lincoln.tid and g.kind = 'class'
     )
insert into public.group_member (group_id, user_id, role, subject)
select c.id, teacher.id,
       case when c.name = '7A' then 'homeroom' else 'teacher' end,
       'Mathematik'
from classes c, teacher
on conflict (group_id, user_id) do update set role = excluded.role, subject = excluded.subject;

-- Summary
select g.name as class, count(gm.user_id) filter (where gm.role = 'student') as students
from public.learning_group g
left join public.group_member gm on gm.group_id = g.id
where g.tenant_id = (select id from public.tenant where slug = 'lincoln') and g.kind = 'class'
group by g.name order by g.name;
