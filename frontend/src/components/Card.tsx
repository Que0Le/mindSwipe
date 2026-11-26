import { useEffect, useRef, useState } from "react";
import type { Post } from "../types";
import { sanitizeHtml } from "../sanitize";

const DIFFICULTY = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];

interface Props {
  post: Post;
  active: boolean;
  liked: boolean;
  saved: boolean;
  answer?: string[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onAnswer: (id: number, choiceIds: string[], durationMs?: number) => void;
  onOpen: (post: Post) => void;
  resetToken?: number;
}

export default function Card({
  post,
  active,
  liked,
  saved,
  answer,
  onToggleLike,
  onToggleSave,
  onAnswer,
  onOpen,
  resetToken,
}: Props) {
  const isMcq = post.questionType === "mcq" && post.choices.length > 0;
  const answered = answer !== undefined;
  const correctSet = new Set(post.answer.correct);

  // Free multi-select: the student may pick any number of choices. The client
  // never caps or enforces a count — grading alone decides correctness.
  const [selected, setSelected] = useState<string[]>([]);
  const picks = answered ? answer ?? [] : selected;
  const pickedSet = new Set(picks);

  // "Clear all" drops any pending (pre-submit) pick on every card.
  useEffect(() => {
    if (resetToken) setSelected([]);
  }, [resetToken]);

  // Time-to-answer: start the clock when this card becomes the active one, stop
  // at submit. Feeds median_ms in the content-analytics views.
  const shownAt = useRef(0);
  useEffect(() => {
    if (active && !answered && shownAt.current === 0) shownAt.current = Date.now();
  }, [active, answered]);

  function choose(choiceId: string) {
    if (answered) return;
    setSelected((prev) =>
      prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]
    );
  }

  function submit() {
    if (answered || selected.length === 0) return;
    // Cap at 10 min so a card left open (locked phone, distraction) doesn't skew.
    const durationMs = shownAt.current ? Math.min(Date.now() - shownAt.current, 600_000) : undefined;
    onAnswer(post.id, selected, durationMs);
  }

  function choiceState(choiceId: string): string {
    if (!answered) return pickedSet.has(choiceId) ? "picked" : "";
    if (correctSet.has(choiceId)) return "correct";
    if (pickedSet.has(choiceId)) return "wrong";
    return "dim";
  }

  // Correct only when the chosen set exactly matches the correct set.
  const isCorrect =
    answered && picks.length === correctSet.size && picks.every((id) => correctSet.has(id));
  const likeCount = post.likeCount + (liked ? 1 : 0);

  return (
    <article className={`card card-${post.kind}`} onClick={() => onOpen(post)}>
      <div className="card-body" onClick={(e) => e.stopPropagation()}>
        <div className="pills">
          <span className="pill pill-topic">{post.topic}</span>
          <span className={`pill pill-diff diff-${post.difficulty}`}>
            {DIFFICULTY[post.difficulty] ?? `Level ${post.difficulty}`}
          </span>
        </div>

        <h2 className="prompt">{post.prompt}</h2>

        {/* Authored content, rendered as HTML by design and run through DOMPurify
            so the render path is safe once author/UGC sources arrive. */}
        {post.bodyHtml && (
          <div className="post-html" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.bodyHtml) }} />
        )}

        {isMcq && (
          <>
            <p className="choices-hint">Choose one or more</p>
            <div className="choices multi" role="group">
              {post.choices.map((c) => (
                <button
                  key={c.id}
                  className={`choice ${choiceState(c.id)}`}
                  onClick={() => choose(c.id)}
                  disabled={answered}
                  role="checkbox"
                  aria-checked={pickedSet.has(c.id)}
                >
                  <span className="choice-key">{c.id.toUpperCase()}</span>
                  <span className="choice-text">{c.text}</span>
                  <i className="mark" aria-hidden="true">
                    {answered ? (correctSet.has(c.id) ? "✓" : pickedSet.has(c.id) ? "✗" : "") : ""}
                  </i>
                </button>
              ))}
            </div>

            {/* Submit turns into the verdict in the SAME slot, so revealing the
                result never moves anything above or below it. */}
            <button
              type="button"
              className={`submit-btn ${answered ? (isCorrect ? "is-correct" : "is-wrong") : ""}`}
              onClick={submit}
              disabled={answered || selected.length === 0}
            >
              {answered ? (isCorrect ? "Correct ✓" : "Not quite ✗") : "Submit answer"}
            </button>
          </>
        )}

        {/* Always rendered so its space is reserved up front; it only fades in
            on evaluation — no layout shift. */}
        {post.answer.explanation && (
          <p className={`explanation ${answered ? "show" : ""}`}>{post.answer.explanation}</p>
        )}

        <button className="more-link" onClick={() => onOpen(post)}>
          Details, tips &amp; related →
        </button>
      </div>

      <div className="rail" onClick={(e) => e.stopPropagation()}>
        <button
          className={`rail-btn ${liked ? "on" : ""}`}
          aria-label="Like"
          onClick={() => onToggleLike(post.id)}
        >
          <span className="rail-ico">{liked ? "♥" : "♡"}</span>
          <span className="rail-label">{formatCount(likeCount)}</span>
        </button>
        <button
          className={`rail-btn ${saved ? "on" : ""}`}
          aria-label="Save"
          onClick={() => onToggleSave(post.id)}
        >
          <span className="rail-ico">{saved ? "★" : "☆"}</span>
          <span className="rail-label">Save</span>
        </button>
        <button className="rail-btn" aria-label="Details" onClick={() => onOpen(post)}>
          <span className="rail-ico">💬</span>
          <span className="rail-label">Tips</span>
        </button>
      </div>

      <div className="scroll-hint">Swipe up for the next card</div>
    </article>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}
