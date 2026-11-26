-- mindSwipe build-2 feature-flags demo seed.
--
-- Adds the third archetype (Private circle = "Riverdale Academy"), wires the
-- per-tenant flags that make Public / Paid / Private render differently, adds an
-- author/teacher persona there, and gives it genuinely private content so the
-- visibility-scoped RLS is demonstrable.
--
-- Personas recap (all password: demo1234):
--   teacher@demo.mindswipe   Ms. Schmidt   teacher   Lincoln High  (Paid)
--   student@demo.mindswipe   Alex          student   Lincoln High  (Paid)
--   student2@demo.mindswipe  Sam           student   Lincoln High  (Paid)
--   author@demo.mindswipe    Prof. Rivera  teacher   Riverdale     (Private)  <- new
--   (Public visitor stays anonymous — its flags come from the public tenant.)
--
-- Re-runnable: guarded inserts.

create or replace function pg_temp.seed_user(uid uuid, mail text, pass text)
returns void language plpgsql as $$
begin
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

-- ---------------------------------------------------------------------------
-- Private tenant + its author/teacher persona
-- ---------------------------------------------------------------------------
insert into public.tenant (kind, name, slug)
    values ('private', 'Riverdale Academy', 'riverdale')
    on conflict (slug) do nothing;

select pg_temp.seed_user('a1a1a1a1-0000-0000-0000-000000000004', 'author@demo.mindswipe', 'demo1234');

insert into public.membership (user_id, tenant_id, role, display_name)
select u.id, t.id, 'teacher'::public.app_role, 'Prof. Rivera'
from auth.users u
cross join (select id from public.tenant where slug = 'riverdale') t
where u.email = 'author@demo.mindswipe'
on conflict (user_id, tenant_id) do nothing;

-- ---------------------------------------------------------------------------
-- Feature flags per tenant (the heart of "same code, three products")
-- ---------------------------------------------------------------------------
insert into public.tenant_config (tenant_id, plan, flags)
select t.id, c.plan, c.flags::jsonb
from (values
    ('public',   'free',    '{"ads":true,"provider_analytics":true,"authoring":false,"advanced":false,"monitoring_dashboard":false}'),
    ('lincoln',  'paid',    '{"ads":false,"provider_analytics":false,"authoring":false,"advanced":false,"monitoring_dashboard":true}'),
    ('riverdale','private', '{"ads":false,"provider_analytics":false,"authoring":true,"advanced":true,"monitoring_dashboard":true}')
) as c(slug, plan, flags)
join public.tenant t on t.slug = c.slug
on conflict (tenant_id) do update set plan = excluded.plan, flags = excluded.flags, updated_at = now();

-- ---------------------------------------------------------------------------
-- Private content for Riverdale (visibility = 'tenant' → members only)
-- ---------------------------------------------------------------------------
insert into public.post (tenant_id, subject, topic, difficulty, locale, question_type, prompt, choices, answer, detail, visibility, status)
select t.id, 'Riverdale Intern', 'Interne Karten (Demo)', 2, 'de', 'mcq', p.prompt, p.choices::jsonb, p.answer::jsonb, '{}'::jsonb, 'tenant', 'approved'
from (select id from public.tenant where slug = 'riverdale') t,
(values
    (
        'Riverdale-intern: Welcher Leitsatz steht in unserem Schulcurriculum an erster Stelle?',
        '[{"id":"c1","text":"Neugier vor Noten"},{"id":"c2","text":"Ruhe im Raum"},{"id":"c3","text":"Tempo vor Tiefe"},{"id":"c4","text":"Wettbewerb"}]',
        '{"correct":["c1"],"explanation":"Interne Karte — nur für Riverdale-Mitglieder sichtbar."}'
    ),
    (
        'Riverdale-intern: Welches Werkzeug nutzen wir für projektbasiertes Lernen?',
        '[{"id":"c1","text":"Frontalunterricht"},{"id":"c2","text":"Lernwerkstatt-Zirkel"},{"id":"c3","text":"Nur Hausaufgaben"},{"id":"c4","text":"Auswendiglernen"}]',
        '{"correct":["c2"],"explanation":"Interne Karte — demonstriert tenant-private Inhalte via RLS."}'
    )
) as p(prompt, choices, answer)
where not exists (
    select 1 from public.post where topic = 'Interne Karten (Demo)' and tenant_id = t.id
);

-- Put them in a private playlist for the Riverdale dashboard.
with t as (select id from public.tenant where slug = 'riverdale'),
     teacher as (select id from auth.users where email = 'author@demo.mindswipe')
insert into public.playlist (tenant_id, slug, title, description, created_by, visibility)
select t.id, 'intern', 'Interne Karten', 'Riverdale-eigene, private Inhalte.', teacher.id, 'tenant'
from t, teacher
on conflict (tenant_id, slug) do nothing;

insert into public.playlist_item (playlist_id, post_id, position)
select pl.id, p.id, (row_number() over (order by p.id))::int
from public.playlist pl
join public.tenant t on t.id = pl.tenant_id and t.slug = 'riverdale'
join public.post p on p.tenant_id = t.id and p.topic = 'Interne Karten (Demo)'
where pl.slug = 'intern'
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Summary
-- ---------------------------------------------------------------------------
select t.slug, tc.plan, tc.flags
from public.tenant_config tc join public.tenant t on t.id = tc.tenant_id
order by t.id;
