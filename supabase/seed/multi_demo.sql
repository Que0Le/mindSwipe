-- Demo multi-answer ("select all that apply") questions. The seed bank is all
-- single-answer, so these exist to exercise checkbox mode. They sit under their
-- own topic so you can pick it from the filter. Remove with:
--   delete from public.post where topic = 'Mehrfachauswahl (Demo)';

insert into public.post (subject, topic, difficulty, locale, question_type, prompt, choices, answer, detail)
values
(
  'Demo', 'Mehrfachauswahl (Demo)', 1, 'de', 'mcq',
  'Welche der folgenden Zahlen sind Primzahlen?',
  '[{"id":"c1","text":"2"},{"id":"c2","text":"9"},{"id":"c3","text":"7"},{"id":"c4","text":"15"}]'::jsonb,
  '{"correct":["c1","c3"],"explanation":"2 und 7 sind nur durch 1 und sich selbst teilbar. 9 = 3·3 und 15 = 3·5 sind zusammengesetzt."}'::jsonb,
  '{"more_info":"Eine Primzahl hat genau zwei Teiler: 1 und sich selbst."}'::jsonb
),
(
  'Demo', 'Mehrfachauswahl (Demo)', 1, 'de', 'mcq',
  'Welche dieser Tiere sind Säugetiere?',
  '[{"id":"c1","text":"Delfin"},{"id":"c2","text":"Hai"},{"id":"c3","text":"Fledermaus"},{"id":"c4","text":"Krokodil"}]'::jsonb,
  '{"correct":["c1","c3"],"explanation":"Delfin und Fledermaus sind Säugetiere. Der Hai ist ein Fisch, das Krokodil ein Reptil."}'::jsonb,
  '{"more_info":"Säugetiere säugen ihre Jungen und sind gleichwarm."}'::jsonb
);
