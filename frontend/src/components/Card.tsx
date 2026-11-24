import { useState } from "react";
import type { Post } from "../types";

const DIFFICULTY = ["", "Beginner", "Easy", "Medium", "Hard", "Expert"];

interface Props {
  post: Post;
  active: boolean;
  liked: boolean;
  saved: boolean;
  answer?: string;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onAnswer: (id: number, choiceId: string) => void;
  onOpen: (post: Post) => void;
}

export default function Card({
  post,
  liked,
  saved,
  answer,
  onToggleLike,
  onToggleSave,
  onAnswer,
  onOpen,
}: Props) {
  const [revealed, setRevealed] = useState(Boolean(answer));
  const isMcq = post.questionType === "mcq" && post.choices.length > 0;
  const answered = Boolean(answer);
  const correctSet = new Set(post.answer.correct);

  function choose(choiceId: string) {
    if (answered) return;
    onAnswer(post.id, choiceId);
    setRevealed(true);
  }

  function choiceState(choiceId: string): string {
    if (!revealed && !answered) return "";
    if (correctSet.has(choiceId)) return "correct";
    if (choiceId === answer) return "wrong";
    return "dim";
  }

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

        {/* Authored/trusted content. Rendered as HTML by design (text + "card"
            styling). Sanitize here before enabling any user-generated source. */}
        <div className="post-html" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

        {isMcq && (
          <div className="choices">
            {post.choices.map((c) => (
              <button
                key={c.id}
                className={`choice ${choiceState(c.id)}`}
                onClick={() => choose(c.id)}
                disabled={answered}
              >
                <span className="choice-key">{c.id.toUpperCase()}</span>
                <span className="choice-text">{c.text}</span>
                {revealed && correctSet.has(c.id) && <i className="mark">correct</i>}
              </button>
            ))}
          </div>
        )}

        {revealed && post.answer.explanation && (
          <p className="explanation">{post.answer.explanation}</p>
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
