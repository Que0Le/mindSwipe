// Generate a SQL seed for public.post from questions_gymnasium.json.
//
// Transforms the authored bank into build-1's shape:
//   - letter options {A,B,...} -> stable choice ids [{id:"c1",text},...]
//   - `correct` letter          -> answer.correct = [choiceId]
//   - difficulty leicht/mittel/schwer -> 1/2/3
//   - meta.language             -> locale (per card)
//   - more_info/reference/example/open_question -> detail (jsonb)
//
// Usage:  node supabase/seed/gen-seed.mjs <out.sql>
import { readFileSync, writeFileSync } from "node:fs";

const src = JSON.parse(readFileSync(new URL("../../questions_gymnasium.json", import.meta.url)));
const questions = src.questions ?? src;
const locale = src.meta?.language ?? "de";
const diffMap = { leicht: 1, mittel: 2, schwer: 3 };

const q = (s) => (s === null || s === undefined ? "null" : `'${String(s).replace(/'/g, "''")}'`);
const qjson = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;

const rows = [];
for (const item of questions) {
  const opts = item.options ?? {};
  const letters = Object.keys(opts).sort();
  const choices = [];
  const letterToId = {};
  letters.forEach((L, i) => {
    const id = `c${i + 1}`;
    letterToId[L] = id;
    choices.push({ id, text: opts[L] });
  });
  const correctId = letterToId[item.correct] ?? item.correct;
  const answer = { correct: [correctId], explanation: item.explanation ?? null };
  const detail = {
    more_info: item.more_info ?? null,
    reference: item.reference ?? null,
    example: item.example ?? null,
    open_question: item.open_question ?? null,
  };
  const diff = diffMap[String(item.difficulty ?? "").toLowerCase()] ?? null;
  rows.push(
    `(1, ${q(item.subject)}, ${q(item.topic)}, ${diff === null ? "null" : diff}, ` +
      `${q(locale)}, 'mcq', ${q(item.question)}, ${qjson(choices)}, ${qjson(answer)}, ` +
      `${qjson(detail)}, 1, 'public', 'approved')`
  );
}

const sql =
  "begin;\n" +
  "insert into public.post\n" +
  "  (tenant_id, subject, topic, difficulty, locale, question_type, prompt, choices, answer, detail, content_version, visibility, status)\n" +
  "values\n" +
  rows.join(",\n") +
  ";\ncommit;\n";

const out = process.argv[2] ?? "seed.sql";
writeFileSync(out, sql);
console.log(`generated ${rows.length} rows -> ${out}`);
