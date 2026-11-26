-- mindSwipe build-2 demo seed — persona accounts + a school tenant with
-- playlists, assignments and moderated comments.
--
-- Runs as the postgres superuser (RLS bypassed), so it writes approved/rejected
-- comments and cross-user rows directly — that's the teacher-side data the UI
-- doesn't author yet.
--
-- Personas (all password: demo1234):
--   teacher@demo.mindswipe   Ms. Schmidt   teacher   (tenant: Lincoln High)
--   student@demo.mindswipe   Alex          student   (tenant: Lincoln High)
--   student2@demo.mindswipe  Sam           student   (tenant: Lincoln High)
-- The Public Network persona stays anonymous (build-1 sign-in), no account.
--
-- Re-runnable: every insert is guarded (on conflict / where not exists).
--
-- Reset:  delete from public.membership where tenant_id =
--             (select id from public.tenant where slug='lincoln');
--         delete from auth.users where email like '%@demo.mindswipe';
--         delete from public.tenant where slug='lincoln';   -- cascades playlists/assignments

-- ---------------------------------------------------------------------------
-- Persona auth accounts (email + bcrypt password, email pre-confirmed)
-- ---------------------------------------------------------------------------
create or replace function pg_temp.seed_user(uid uuid, mail text, pass text)
returns void language plpgsql as $$
begin
    -- GoTrue scans the token columns as non-null strings, so they MUST be ''
    -- (not NULL) or password sign-in fails with "Database error querying schema".
    insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_anonymous,
        confirmation_token, recovery_token, email_change_token_new, email_change,
        email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
        mail, crypt(pass, gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false,
        '', '', '', '', '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (
        provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at
    ) values (
        uid::text, uid,
        jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true),
        'email', now(), now(), now()
    ) on conflict (provider_id, provider) do nothing;
end;
$$;

select pg_temp.seed_user('a1a1a1a1-0000-0000-0000-000000000001', 'teacher@demo.mindswipe',  'demo1234');
select pg_temp.seed_user('a1a1a1a1-0000-0000-0000-000000000002', 'student@demo.mindswipe',  'demo1234');
select pg_temp.seed_user('a1a1a1a1-0000-0000-0000-000000000003', 'student2@demo.mindswipe', 'demo1234');

-- ---------------------------------------------------------------------------
-- A school tenant (paid persona) + memberships
-- ---------------------------------------------------------------------------
insert into public.tenant (kind, name, slug)
    values ('paid', 'Lincoln High', 'lincoln')
    on conflict (slug) do nothing;

insert into public.membership (user_id, tenant_id, role, display_name)
select u.id, t.id, r.role::public.app_role, r.display_name
from (values
    ('a1a1a1a1-0000-0000-0000-000000000001'::uuid, 'teacher', 'Ms. Schmidt'),
    ('a1a1a1a1-0000-0000-0000-000000000002'::uuid, 'student', 'Alex'),
    ('a1a1a1a1-0000-0000-0000-000000000003'::uuid, 'student', 'Sam')
) as r(user_id, role, display_name)
join auth.users u on u.id = r.user_id
cross join (select id from public.tenant where slug = 'lincoln') t
on conflict (user_id, tenant_id) do nothing;

-- ---------------------------------------------------------------------------
-- Playlists (teacher-curated pools over the real seeded cards)
-- ---------------------------------------------------------------------------
with t as (select id from public.tenant where slug = 'lincoln'),
     teacher as (select id from auth.users where email = 'teacher@demo.mindswipe')
insert into public.playlist (tenant_id, slug, title, description, created_by, visibility)
select t.id, p.slug, p.title, p.descr, teacher.id, 'tenant'
from t, teacher, (values
    ('basics',   'Grundlagen',       'Einstieg — leichte Karten zum Aufwärmen.'),
    ('advanced', 'Fortgeschritten',  'Mittlerer Schwierigkeitsgrad.'),
    ('hardcore', 'Hardcore',         'Die schwersten Karten.'),
    ('multi',    'Mehrfachauswahl',  'Karten mit mehreren richtigen Antworten.')
) as p(slug, title, descr)
on conflict (tenant_id, slug) do nothing;

-- Fill difficulty-based playlists (up to 12 cards each, ordered by id).
insert into public.playlist_item (playlist_id, post_id, position)
select pl.id, x.id, x.rn
from public.playlist pl
join public.tenant t on t.id = pl.tenant_id and t.slug = 'lincoln'
join lateral (
    select p.id, (row_number() over (order by p.id))::int as rn
    from public.post p
    where p.difficulty = case pl.slug
                             when 'basics'   then 1
                             when 'advanced' then 2
                             when 'hardcore' then 3
                         end
      and p.locale = 'de'
    order by p.id
    limit 12
) x on pl.slug in ('basics', 'advanced', 'hardcore')
on conflict do nothing;

-- The multi-answer playlist: the two demo cards (1001/1002) if present.
insert into public.playlist_item (playlist_id, post_id, position)
select pl.id, p.id, (row_number() over (order by p.id))::int
from public.playlist pl
join public.tenant t on t.id = pl.tenant_id and t.slug = 'lincoln'
join public.post p on p.topic = 'Mehrfachauswahl (Demo)'
where pl.slug = 'multi'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Assignments
-- ---------------------------------------------------------------------------
-- 1) Tenant-wide: everyone works the Grundlagen playlist, due in a week.
insert into public.assignment (tenant_id, created_by, title, description, source_type, playlist_id, due_at)
select t.id, teacher.id,
       'Woche 1: Grundlagen üben',
       'Arbeite die Grundlagen-Playlist durch. Fällig in einer Woche.',
       'playlist', pl.id, now() + interval '7 days'
from (select id from public.tenant where slug = 'lincoln') t
join auth.users teacher on teacher.email = 'teacher@demo.mindswipe'
join public.playlist pl on pl.tenant_id = t.id and pl.slug = 'basics'
where not exists (
    select 1 from public.assignment a
    where a.tenant_id = t.id and a.title = 'Woche 1: Grundlagen üben'
);

-- 2) Individual: Alex gets a topic assignment (first topic alphabetically).
insert into public.assignment (tenant_id, created_by, title, description, source_type, topic, assignee, due_at)
select t.id, teacher.id,
       'Nachholen: ' || tp.topic,
       'Persönliche Aufgabe für Alex.',
       'topic', tp.topic, alex.id, now() + interval '3 days'
from (select id from public.tenant where slug = 'lincoln') t
join auth.users teacher on teacher.email = 'teacher@demo.mindswipe'
join auth.users alex    on alex.email    = 'student@demo.mindswipe'
cross join lateral (
    select topic from public.post
    where topic is not null and topic <> 'Mehrfachauswahl (Demo)' and locale = 'de'
    order by topic limit 1
) tp
where not exists (
    select 1 from public.assignment a where a.tenant_id = t.id and a.assignee = alex.id
);

-- ---------------------------------------------------------------------------
-- Comments (seed the moderation states: approved shows, pending waits)
-- ---------------------------------------------------------------------------
with t as (select id from public.tenant where slug = 'lincoln'),
     alex as (select id from auth.users where email = 'student@demo.mindswipe'),
     sam  as (select id from auth.users where email = 'student2@demo.mindswipe'),
     teacher as (select id from auth.users where email = 'teacher@demo.mindswipe'),
     pst as (select id from public.post order by id limit 1)
insert into public.comment (post_id, tenant_id, user_id, body, status, reviewed_by, reviewed_at)
select pst.id, t.id, c.user_id, c.body, c.status::public.moderation_status,
       case when c.status = 'approved' then (select id from teacher) end,
       case when c.status = 'approved' then now() end
from t, pst, (values
    ((select id from alex), 'Gute Frage — die Erklärung hat mir geholfen!', 'approved'),
    ((select id from sam),  'Könnte jemand das nochmal anders erklären?',   'pending'),
    ((select id from alex), 'spam spam spam',                                'pending')
) as c(user_id, body, status)
where not exists (
    select 1 from public.comment cc where cc.post_id = pst.id and cc.tenant_id = t.id
);

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
select 'users'       as what, count(*) from auth.users where email like '%@demo.mindswipe'
union all select 'memberships', count(*) from public.membership
union all select 'playlists',   count(*) from public.playlist
union all select 'playlist_items', count(*) from public.playlist_item
union all select 'assignments', count(*) from public.assignment
union all select 'comments',    count(*) from public.comment;
