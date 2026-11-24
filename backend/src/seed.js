import { db, migrate } from "./db.js";
import { BACKEND_QUESTIONS } from "./data/backend-interview.js";

migrate();

// Expand the compact [prompt, topic, difficulty, choices, correct, explanation,
// tags?, body?] rows from the question bank into full post objects.
const LETTERS = ["a", "b", "c", "d", "e", "f"];
function fromCompact(row, i) {
  const [prompt, topic, difficulty, choices, correct, explanation, tags = [], body = ""] = row;
  const correctIdx = Array.isArray(correct) ? correct : [correct];
  return {
    kind: body ? "card" : "text",
    topic,
    difficulty,
    question_type: "mcq",
    prompt,
    body_html: body,
    choices: choices.map((text, j) => ({ id: LETTERS[j], text })),
    answer: { correct: correctIdx.map((k) => LETTERS[k]), explanation },
    detail_html: "",
    tags,
    // Vary the baseline like-count deterministically so the feed looks alive.
    like_count: 150 + ((i * 97) % 1800),
    comments: [],
  };
}

/**
 * Seed data. Content here is authored/trusted (made by us + agents). `body_html`
 * and `detail_html` are small HTML fragments so the whole payload stays as JSON
 * text - no binary assets - which keeps the offline bundle tiny. `kind: "card"`
 * posts are styled with CSS so they read as an image without being one.
 */
const POSTS = [
  {
    kind: "card",
    topic: "OCP Java",
    difficulty: 4,
    question_type: "mcq",
    prompt: "What does this print?",
    body_html: `<pre class="code">var list = List.of(1, 2, 3);
list.stream()
  .map(n -&gt; n * 2)
  .forEach(System.out::print);</pre>`,
    choices: [
      { id: "a", text: "246" },
      { id: "b", text: "1 2 3" },
      { id: "c", text: "Compile error" },
      { id: "d", text: "123123" },
    ],
    answer: {
      correct: ["a"],
      explanation:
        "forEach prints each element with no separator, so 1x2, 2x2, 3x2 -> 2, 4, 6 are printed back-to-back as 246.",
    },
    detail_html: `<p><code>map</code> doubles each element; <code>forEach(System.out::print)</code> prints with <strong>no</strong> delimiter (unlike <code>println</code>).</p>
<p><strong>Tip:</strong> watch the difference between <code>print</code> and <code>println</code> on the exam - it is a classic trap.</p>`,
    tags: ["streams", "lambdas"],
    like_count: 1243,
    comments: [
      { poster_id: "mindswipe", kind: "tip", content: "If it were println, each number would be on its own line." },
      { poster_id: "mindswipe", kind: "related", content: "Related: Stream.of vs List.of - when do you get an immutable list?" },
    ],
  },
  {
    kind: "text",
    topic: "OCP Java",
    difficulty: 3,
    question_type: "mcq",
    prompt: "Integer a = 127, b = 127; what is a == b?",
    body_html: `<p>Given <code>Integer a = 127;</code> and <code>Integer b = 127;</code>, what does <code>a == b</code> evaluate to?</p>`,
    choices: [
      { id: "a", text: "true" },
      { id: "b", text: "false" },
      { id: "c", text: "Compile error" },
    ],
    answer: {
      correct: ["a"],
      explanation:
        "Integer caches boxed values from -128 to 127, so both references point to the same cached object -> true. At 128 it would be false.",
    },
    detail_html: `<p>Autoboxing reuses cached <code>Integer</code> objects in the range <strong>-128..127</strong>. Inside that range <code>==</code> compares the same reference; outside it you get two different objects.</p>
<p><strong>Rule of thumb:</strong> never use <code>==</code> on boxed types. Use <code>.equals()</code> or compare primitives.</p>`,
    tags: ["autoboxing", "gotcha"],
    like_count: 902,
    comments: [
      { poster_id: "mindswipe", kind: "tip", content: "Try the same with 128 - the answer flips to false." },
    ],
  },
  {
    kind: "text",
    topic: "OCP Java",
    difficulty: 2,
    question_type: "mcq",
    prompt: "Which collection forbids duplicate elements?",
    body_html: `<p>Which of these <code>java.util</code> collections does <strong>not</strong> allow duplicate elements?</p>`,
    choices: [
      { id: "a", text: "ArrayList" },
      { id: "b", text: "HashSet" },
      { id: "c", text: "LinkedList" },
      { id: "d", text: "ArrayDeque" },
    ],
    answer: {
      correct: ["b"],
      explanation: "Set implementations reject duplicates; HashSet is the Set here. The others are List/Deque types.",
    },
    detail_html: `<p>Anything implementing <code>Set</code> (HashSet, LinkedHashSet, TreeSet) stores at most one of each element, using <code>equals()</code>/<code>hashCode()</code> to detect sameness.</p>`,
    tags: ["collections"],
    like_count: 455,
    comments: [
      { poster_id: "mindswipe", kind: "related", content: "Related: why must you override hashCode when you override equals?" },
    ],
  },
  {
    kind: "card",
    topic: "Driving theory",
    difficulty: 2,
    question_type: "mcq",
    prompt: "Who has the right of way?",
    body_html: `<div class="scene">
  <div class="road-v"></div>
  <div class="road-h"></div>
  <div class="car car-you">YOU</div>
  <div class="car car-b">B</div>
</div>
<p>At an unmarked intersection, car B approaches from your right. Who goes first?</p>`,
    choices: [
      { id: "a", text: "You" },
      { id: "b", text: "Car B (from the right)" },
      { id: "c", text: "Whoever arrived first" },
    ],
    answer: {
      correct: ["b"],
      explanation: "At an unmarked (uncontrolled) intersection, yield to traffic coming from your right.",
    },
    detail_html: `<p>The default at an intersection with no signs or lights is <strong>right before left</strong>: the vehicle on your right has priority.</p>
<p><strong>Tip:</strong> this only applies when there is no sign, signal, or road marking overriding it.</p>`,
    tags: ["right-of-way", "intersections"],
    like_count: 318,
    comments: [
      { poster_id: "mindswipe", kind: "tip", content: "Signs and lights always override the right-before-left default." },
    ],
  },
  {
    kind: "text",
    topic: "Driving theory",
    difficulty: 1,
    question_type: "mcq",
    prompt: "A solid white line down the center means?",
    body_html: `<p>A <strong>solid</strong> white or yellow line running down the center of the road means:</p>`,
    choices: [
      { id: "a", text: "Overtaking is allowed with care" },
      { id: "b", text: "Do not cross to overtake" },
      { id: "c", text: "Two-way traffic ahead" },
    ],
    answer: {
      correct: ["b"],
      explanation: "A solid center line means you may not cross it to overtake. A broken line means overtaking is permitted when safe.",
    },
    detail_html: `<p><strong>Solid = stay.</strong> Broken/dashed = you may cross when it is safe. Double lines with one solid on your side: you specifically may not cross.</p>`,
    tags: ["road-markings"],
    like_count: 201,
    comments: [],
  },
  {
    kind: "card",
    topic: "Math",
    difficulty: 3,
    question_type: "mcq",
    prompt: "Differentiate f(x) = x^3",
    body_html: `<div class="formula">f(x) = x<sup>3</sup></div>
<p>What is f&apos;(x)?</p>`,
    choices: [
      { id: "a", text: "3x^2" },
      { id: "b", text: "x^2" },
      { id: "c", text: "3x" },
      { id: "d", text: "x^3 / 3" },
    ],
    answer: {
      correct: ["a"],
      explanation: "Power rule: d/dx x^n = n·x^(n-1), so d/dx x^3 = 3x^2.",
    },
    detail_html: `<p>The <strong>power rule</strong>: bring the exponent down as a coefficient and subtract one from it. <code>x^3 -> 3x^2</code>.</p>
<p>Option (d) is the <em>integral</em>, not the derivative - a common mix-up under time pressure.</p>`,
    tags: ["calculus", "derivatives"],
    like_count: 677,
    comments: [
      { poster_id: "mindswipe", kind: "related", content: "Related: integrate x^3 and see why the +C matters." },
    ],
  },
  {
    kind: "text",
    topic: "Biology",
    difficulty: 1,
    question_type: "reading",
    prompt: "The mitochondrion, in one card",
    body_html: `<p>The <strong>mitochondrion</strong> is the organelle where most ATP is produced via aerobic respiration. It has a double membrane; the inner membrane folds into <em>cristae</em> that increase surface area for the electron transport chain.</p>`,
    choices: [],
    answer: { correct: [], explanation: "" },
    detail_html: `<p><strong>Why it matters:</strong> more energy demand -> more mitochondria. Muscle and liver cells are packed with them.</p>
<p><strong>Open question:</strong> mitochondria have their own DNA. What does that suggest about their origin? (Endosymbiotic theory.)</p>`,
    tags: ["cell-biology"],
    like_count: 540,
    comments: [
      { poster_id: "mindswipe", kind: "question", content: "Can you name the stages of aerobic respiration in order?" },
    ],
  },
  {
    kind: "card",
    topic: "Chemistry",
    difficulty: 2,
    question_type: "mcq",
    prompt: "A solution has pH 3. It is:",
    body_html: `<div class="ph-strip">
  <span class="ph acid">pH 3</span>
</div>
<p>A solution measured at pH 3 is best described as:</p>`,
    choices: [
      { id: "a", text: "Strongly basic" },
      { id: "b", text: "Neutral" },
      { id: "c", text: "Acidic" },
    ],
    answer: {
      correct: ["c"],
      explanation: "pH below 7 is acidic; 7 is neutral; above 7 is basic. pH 3 is acidic.",
    },
    detail_html: `<p>The pH scale runs 0-14. Each unit is a <strong>10x</strong> change in hydrogen-ion concentration, so pH 3 is 10,000x more acidic than pH 7.</p>`,
    tags: ["acids-bases"],
    like_count: 289,
    comments: [],
  },
  {
    kind: "text",
    topic: "OCP Java",
    difficulty: 5,
    question_type: "mcq",
    prompt: "What is the output of this try-with-resources?",
    body_html: `<pre class="code">try (var r = new Res()) {
  System.out.print("T");
} catch (Exception e) {
  System.out.print("C");
}
// Res.close() prints "X"</pre>`,
    choices: [
      { id: "a", text: "TX" },
      { id: "b", text: "XT" },
      { id: "c", text: "TXC" },
      { id: "d", text: "T" },
    ],
    answer: {
      correct: ["a"],
      explanation: "The body runs first (T), then the resource is closed automatically (X). No exception, so no C.",
    },
    detail_html: `<p>In try-with-resources, <code>close()</code> is called <strong>after</strong> the body and <strong>before</strong> any catch block. With no exception thrown, the order is body then close: <code>TX</code>.</p>`,
    tags: ["exceptions", "resources"],
    like_count: 814,
    comments: [
      { poster_id: "mindswipe", kind: "tip", content: "Resources close in reverse order of declaration." },
    ],
  },
  {
    kind: "text",
    topic: "Math",
    difficulty: 2,
    question_type: "mcq",
    prompt: "Solve: 2^x = 32",
    body_html: `<p>For which value of x is <code>2^x = 32</code>?</p>`,
    choices: [
      { id: "a", text: "4" },
      { id: "b", text: "5" },
      { id: "c", text: "6" },
    ],
    answer: {
      correct: ["b"],
      explanation: "32 = 2^5, so x = 5.",
    },
    detail_html: `<p>Rewrite the right side as a power of the same base: <code>32 = 2^5</code>. Equal bases -> equal exponents, so <code>x = 5</code>. This is the idea behind logarithms: <code>x = log2(32)</code>.</p>`,
    tags: ["exponents", "logarithms"],
    like_count: 376,
    comments: [],
  },
  {
    kind: "text",
    topic: "OCP Java",
    difficulty: 4,
    question_type: "mcq",
    prompt: "What does an empty Optional.get() do?",
    body_html: `<p>Calling <code>Optional.empty().get()</code> at runtime will:</p>`,
    choices: [
      { id: "a", text: "Return null" },
      { id: "b", text: "Throw NoSuchElementException" },
      { id: "c", text: "Return Optional.empty()" },
      { id: "d", text: "Not compile" },
    ],
    answer: {
      correct: ["b"],
      explanation: "get() on an empty Optional throws NoSuchElementException. Use orElse, orElseGet, or ifPresent instead.",
    },
    detail_html: `<p><code>get()</code> assumes a value is present. On an empty Optional it throws <code>NoSuchElementException</code> - which defeats the point of using Optional.</p>
<p><strong>Prefer:</strong> <code>orElse(default)</code>, <code>orElseThrow()</code>, <code>map()</code>, or <code>ifPresent()</code>.</p>`,
    tags: ["optional", "api"],
    like_count: 611,
    comments: [
      { poster_id: "mindswipe", kind: "tip", content: "Treat Optional.get() like a code smell on the exam and in real code." },
    ],
  },
  {
    kind: "card",
    topic: "OCP Java",
    difficulty: 5,
    question_type: "mcq",
    prompt: "What does this switch expression yield?",
    body_html: `<pre class="code">int d = 3;
String s = switch (d) {
  case 1, 2 -&gt; "low";
  case 3, 4 -&gt; "mid";
  default   -&gt; "high";
};
System.out.print(s);</pre>`,
    choices: [
      { id: "a", text: "low" },
      { id: "b", text: "mid" },
      { id: "c", text: "high" },
      { id: "d", text: "Compile error - missing break" },
    ],
    answer: {
      correct: ["b"],
      explanation: "Arrow switch expressions don't fall through and need no break. d=3 matches case 3,4 -> \"mid\".",
    },
    detail_html: `<p>The arrow form (<code>-&gt;</code>) is an <em>expression</em>: no fall-through, no <code>break</code>, and it returns a value. Multiple labels per case are comma-separated.</p>
<p>For multi-line bodies you use a block with <code>yield</code>.</p>`,
    tags: ["switch", "modern-java"],
    like_count: 489,
    comments: [
      { poster_id: "mindswipe", kind: "related", content: "Related: when do you still need the old colon-style switch?" },
    ],
  },
  {
    kind: "text",
    topic: "OCP Java",
    difficulty: 3,
    question_type: "mcq",
    prompt: "Which keyword makes a variable usable in a lambda?",
    body_html: `<p>A local variable captured by a lambda must be final or:</p>`,
    choices: [
      { id: "a", text: "static" },
      { id: "b", text: "volatile" },
      { id: "c", text: "effectively final" },
      { id: "d", text: "transient" },
    ],
    answer: {
      correct: ["c"],
      explanation: "A captured local must be final or effectively final - assigned once and never reassigned afterwards.",
    },
    detail_html: `<p>"Effectively final" means you <em>could</em> add <code>final</code> without a compile error: the variable is assigned once. Reassign it anywhere and the lambda won't compile.</p>`,
    tags: ["lambdas", "scope"],
    like_count: 352,
    comments: [],
  },
  {
    kind: "text",
    topic: "Driving theory",
    difficulty: 2,
    question_type: "mcq",
    prompt: "Entering a roundabout, you give way to:",
    body_html: `<p>As you approach a roundabout, you normally give way to traffic coming from your:</p>`,
    choices: [
      { id: "a", text: "Left" },
      { id: "b", text: "Right (already on the roundabout)" },
      { id: "c", text: "Nobody - you have priority" },
    ],
    answer: {
      correct: ["b"],
      explanation: "Give way to traffic already on the roundabout, which (in right-hand-drive countries) comes from your right.",
    },
    detail_html: `<p>Traffic already circulating has priority. Signal left as you pass the exit before the one you want, and leave in the correct lane.</p>`,
    tags: ["roundabouts", "right-of-way"],
    like_count: 274,
    comments: [],
  },
  {
    kind: "text",
    topic: "Driving theory",
    difficulty: 3,
    question_type: "mcq",
    prompt: "On a wet road, stopping distance:",
    body_html: `<p>Compared with a dry road, your total stopping distance on a wet road is roughly:</p>`,
    choices: [
      { id: "a", text: "The same" },
      { id: "b", text: "Doubled" },
      { id: "c", text: "Halved" },
    ],
    answer: {
      correct: ["b"],
      explanation: "On wet roads stopping distances roughly double; on ice they can be up to ten times greater.",
    },
    detail_html: `<p>Stopping distance = thinking distance + braking distance. Rain mainly stretches the braking part as grip drops. Leave at least a <strong>4-second</strong> gap in the wet.</p>`,
    tags: ["stopping-distance", "safety"],
    like_count: 333,
    comments: [
      { poster_id: "mindswipe", kind: "tip", content: "Dry: 2-second rule. Wet: 4 seconds. Ice: 10x - just slow right down." },
    ],
  },
  {
    kind: "card",
    topic: "Math",
    difficulty: 3,
    question_type: "mcq",
    prompt: "Discriminant of x^2 - 4x + 4?",
    body_html: `<div class="formula">x<sup>2</sup> &minus; 4x + 4 = 0</div>
<p>The discriminant b&sup2; &minus; 4ac tells you the number of real roots. Here it is:</p>`,
    choices: [
      { id: "a", text: "0 - one repeated root" },
      { id: "b", text: "Positive - two roots" },
      { id: "c", text: "Negative - no real roots" },
    ],
    answer: {
      correct: ["a"],
      explanation: "b^2 - 4ac = 16 - 16 = 0, so there is exactly one (repeated) real root, x = 2.",
    },
    detail_html: `<p>The discriminant <code>b&sup2; - 4ac</code> classifies the roots: <strong>&gt;0</strong> two real, <strong>=0</strong> one repeated, <strong>&lt;0</strong> none real. This factors as <code>(x-2)&sup2;</code>.</p>`,
    tags: ["quadratics", "discriminant"],
    like_count: 418,
    comments: [
      { poster_id: "mindswipe", kind: "related", content: "Related: what does a negative discriminant mean for the graph?" },
    ],
  },
  {
    kind: "text",
    topic: "Math",
    difficulty: 2,
    question_type: "mcq",
    prompt: "Probability of rolling a 7 with two dice?",
    body_html: `<p>Rolling two fair six-sided dice, what is the probability the total is 7?</p>`,
    choices: [
      { id: "a", text: "1/6" },
      { id: "b", text: "1/12" },
      { id: "c", text: "7/36" },
    ],
    answer: {
      correct: ["a"],
      explanation: "6 of the 36 outcomes sum to 7 (1-6, 2-5, 3-4, and reverses), so 6/36 = 1/6.",
    },
    detail_html: `<p>7 is the most likely total with two dice - six ways out of 36. That is why it sits at the centre of the distribution.</p>`,
    tags: ["probability"],
    like_count: 296,
    comments: [],
  },
  {
    kind: "text",
    topic: "Biology",
    difficulty: 2,
    question_type: "mcq",
    prompt: "In DNA, adenine pairs with:",
    body_html: `<p>In the DNA double helix, the base adenine (A) always pairs with:</p>`,
    choices: [
      { id: "a", text: "Guanine" },
      { id: "b", text: "Cytosine" },
      { id: "c", text: "Thymine" },
      { id: "d", text: "Uracil" },
    ],
    answer: {
      correct: ["c"],
      explanation: "A-T and C-G are the complementary base pairs in DNA. (In RNA, uracil replaces thymine.)",
    },
    detail_html: `<p>Remember <strong>A-T</strong> and <strong>C-G</strong>. A pairs with T via two hydrogen bonds; C pairs with G via three. In RNA, uracil (U) takes thymine's place.</p>`,
    tags: ["dna", "genetics"],
    like_count: 502,
    comments: [
      { poster_id: "mindswipe", kind: "question", content: "Why is the C-G pair harder to separate than A-T?" },
    ],
  },
  {
    kind: "card",
    topic: "Chemistry",
    difficulty: 2,
    question_type: "mcq",
    prompt: "Which group are the noble gases?",
    body_html: `<div class="formula">He · Ne · Ar · Kr</div>
<p>The unreactive noble gases sit in which group of the periodic table?</p>`,
    choices: [
      { id: "a", text: "Group 1" },
      { id: "b", text: "Group 7 (halogens)" },
      { id: "c", text: "Group 0 / 18" },
    ],
    answer: {
      correct: ["c"],
      explanation: "Noble gases are Group 0 (18). Full outer electron shells make them very unreactive.",
    },
    detail_html: `<p>A full outer shell means little tendency to gain or lose electrons - hence their famous inertness. Group 1 (alkali metals) and Group 7 (halogens) are the reactive extremes.</p>`,
    tags: ["periodic-table"],
    like_count: 261,
    comments: [],
  },
  {
    kind: "text",
    topic: "Physics",
    difficulty: 2,
    question_type: "mcq",
    prompt: "Newton's second law is:",
    body_html: `<p>Which equation expresses Newton's second law of motion?</p>`,
    choices: [
      { id: "a", text: "F = m / a" },
      { id: "b", text: "F = m · a" },
      { id: "c", text: "F = a / m" },
      { id: "d", text: "F = m + a" },
    ],
    answer: {
      correct: ["b"],
      explanation: "Force equals mass times acceleration: F = ma. More force for the same mass means more acceleration.",
    },
    detail_html: `<p><code>F = ma</code>. Rearranged, <code>a = F/m</code> - the same push accelerates a lighter object more. Units: newtons = kg·m/s&sup2;.</p>`,
    tags: ["mechanics", "newton"],
    like_count: 447,
    comments: [
      { poster_id: "mindswipe", kind: "related", content: "Related: what are Newton's first and third laws?" },
    ],
  },
  {
    kind: "card",
    topic: "Physics",
    difficulty: 3,
    question_type: "mcq",
    prompt: "Ohm's law: V = ?",
    body_html: `<div class="formula">V = I &times; R</div>
<p>In Ohm's law, if current I = 2 A and resistance R = 3 &Omega;, the voltage V is:</p>`,
    choices: [
      { id: "a", text: "1.5 V" },
      { id: "b", text: "5 V" },
      { id: "c", text: "6 V" },
    ],
    answer: {
      correct: ["c"],
      explanation: "V = I x R = 2 A x 3 ohm = 6 V.",
    },
    detail_html: `<p><code>V = IR</code> links voltage, current, and resistance. Rearrange for whichever you need: <code>I = V/R</code>, <code>R = V/I</code>. Here 2 x 3 = 6 V.</p>`,
    tags: ["electricity", "ohms-law"],
    like_count: 388,
    comments: [],
  },
  {
    kind: "text",
    topic: "History",
    difficulty: 1,
    question_type: "mcq",
    prompt: "World War II began in which year?",
    body_html: `<p>In which year did World War II begin in Europe?</p>`,
    choices: [
      { id: "a", text: "1914" },
      { id: "b", text: "1939" },
      { id: "c", text: "1945" },
    ],
    answer: {
      correct: ["b"],
      explanation: "WWII began in 1939 with the invasion of Poland. 1914 was WWI; 1945 was WWII's end.",
    },
    detail_html: `<p>Germany invaded Poland on 1 September 1939; Britain and France declared war two days later. The war in Europe ended in May 1945.</p>`,
    tags: ["world-war-2", "dates"],
    like_count: 340,
    comments: [],
  },
  {
    kind: "text",
    topic: "Geography",
    difficulty: 1,
    question_type: "mcq",
    prompt: "What is the capital of Australia?",
    body_html: `<p>Which city is the capital of Australia?</p>`,
    choices: [
      { id: "a", text: "Sydney" },
      { id: "b", text: "Melbourne" },
      { id: "c", text: "Canberra" },
    ],
    answer: {
      correct: ["c"],
      explanation: "Canberra is the capital - a planned compromise between rivals Sydney and Melbourne.",
    },
    detail_html: `<p>Canberra was purpose-built as the capital precisely because Sydney and Melbourne each wanted the honour. A common trick question.</p>`,
    tags: ["capitals"],
    like_count: 229,
    comments: [
      { poster_id: "mindswipe", kind: "tip", content: "Biggest city is rarely the capital: see USA, Canada, Brazil, Turkey too." },
    ],
  },
  {
    kind: "text",
    topic: "English",
    difficulty: 2,
    question_type: "mcq",
    prompt: "Which word is a synonym for 'ephemeral'?",
    body_html: `<p>Pick the closest synonym for <strong>ephemeral</strong>:</p>`,
    choices: [
      { id: "a", text: "Permanent" },
      { id: "b", text: "Fleeting" },
      { id: "c", text: "Enormous" },
    ],
    answer: {
      correct: ["b"],
      explanation: "Ephemeral means lasting a very short time - fleeting, transient. The opposite of permanent.",
    },
    detail_html: `<p><strong>Ephemeral</strong> (from Greek for "lasting a day") describes things that pass quickly - a mood, a trend, mayflies. Opposites: permanent, enduring, lasting.</p>`,
    tags: ["vocabulary"],
    like_count: 318,
    comments: [],
  },
];

const insertPost = db.prepare(`
  INSERT INTO post (kind, topic, difficulty, question_type, prompt, body_html, choices_json, answer_json, detail_html, tags_json, like_count)
  VALUES (@kind, @topic, @difficulty, @question_type, @prompt, @body_html, @choices_json, @answer_json, @detail_html, @tags_json, @like_count)
`);

const insertComment = db.prepare(`
  INSERT INTO comment (post_id, poster_id, kind, content)
  VALUES (@post_id, @poster_id, @kind, @content)
`);

const ALL_POSTS = [...POSTS, ...BACKEND_QUESTIONS.map(fromCompact)];

const seed = db.transaction(() => {
  db.exec("DELETE FROM comment; DELETE FROM post;");
  for (const p of ALL_POSTS) {
    const info = insertPost.run({
      kind: p.kind,
      topic: p.topic,
      difficulty: p.difficulty,
      question_type: p.question_type,
      prompt: p.prompt,
      body_html: p.body_html,
      choices_json: JSON.stringify(p.choices ?? []),
      answer_json: JSON.stringify(p.answer ?? {}),
      detail_html: p.detail_html ?? "",
      tags_json: JSON.stringify(p.tags ?? []),
      like_count: p.like_count ?? 0,
    });
    const postId = info.lastInsertRowid;
    for (const c of p.comments ?? []) {
      insertComment.run({ post_id: postId, poster_id: c.poster_id, kind: c.kind, content: c.content });
    }
  }
});

seed();

const count = db.prepare("SELECT COUNT(*) AS n FROM post").get().n;
const ccount = db.prepare("SELECT COUNT(*) AS n FROM comment").get().n;
console.log(`Seeded ${count} posts and ${ccount} comments.`);
