-- mindSwipe Phase 2, build-2 — authoring demo seed.
--
-- Give Riverdale (private, authoring on) two PENDING drafts from Prof. Rivera so
-- the review queue and "my drafts" surfaces aren't empty on first open. One is a
-- clean, ready-to-approve card; one has an intentionally shaky answer so there's
-- something worth rejecting-with-a-reason in the demo.
--
-- Idempotent: re-running deletes these two drafts (by created_by + a seed marker
-- topic) and reinserts them. Real authored cards are untouched.

-- clean up prior runs of this seed (marker: subject = 'Demo (authored)')
delete from public.post
where subject = 'Demo (authored)'
  and created_by = (
      select u.id from auth.users u where u.email = 'author@demo.mindswipe'
  );

with riv as (
    select t.id as tenant_id, u.id as author_id
    from public.tenant t
    join public.membership m on m.tenant_id = t.id
    join auth.users u on u.id = m.user_id
    where t.slug = 'riverdale' and u.email = 'author@demo.mindswipe'
)
insert into public.post
    (tenant_id, subject, topic, difficulty, locale, question_type,
     prompt, choices, answer, visibility, status, created_by)
select
    r.tenant_id,
    'Demo (authored)',
    'Zellbiologie',
    2,
    'de',
    'mcq',
    'Welches Organell erzeugt den Großteil des ATP einer Zelle?',
    '[{"id":"c1","text":"Zellkern"},{"id":"c2","text":"Mitochondrium"},{"id":"c3","text":"Ribosom"},{"id":"c4","text":"Golgi-Apparat"}]'::jsonb,
    '{"correct":["c2"],"explanation":"Die Mitochondrien sind die Kraftwerke der Zelle und erzeugen ATP über die oxidative Phosphorylierung."}'::jsonb,
    'tenant',
    'pending',
    r.author_id
from riv r
union all
select
    r.tenant_id,
    'Demo (authored)',
    'Zellbiologie',
    1,
    'de',
    'mcq',
    'Pflanzenzellen haben eine Zellwand. Tierzellen auch?',
    '[{"id":"c1","text":"Ja, genau dieselbe"},{"id":"c2","text":"Nein, Tierzellen haben keine Zellwand"}]'::jsonb,
    '{"correct":["c1"],"explanation":"(Absichtlich falsch gesetzt — zum Ablehnen im Demo.)"}'::jsonb,
    'tenant',
    'pending',
    r.author_id
from riv r;

notify pgrst, 'reload schema';
