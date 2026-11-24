import { useEffect, useRef, useState } from "react";
import type { Comment, Post } from "../types";
import { getComments } from "../api";

interface Props {
  post: Post;
  onClose: () => void;
}

const KIND_LABEL: Record<string, string> = {
  tip: "Tip",
  related: "Related",
  question: "Open question",
  user: "Comment",
};

export default function Detail({ post, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>(post.comments ?? []);
  const startX = useRef<number | null>(null);
  const dx = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    getComments(post.id).then((items) => {
      if (alive) setComments(items);
    });
    return () => {
      alive = false;
    };
  }, [post.id]);

  // Swipe-right to go back to the feed (matches the native-app gesture).
  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    dx.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startX.current == null) return;
    dx.current = e.touches[0].clientX - startX.current;
    if (dx.current > 0 && panelRef.current) {
      panelRef.current.style.transform = `translateX(${Math.min(dx.current, 400)}px)`;
    }
  }
  function onTouchEnd() {
    if (panelRef.current) panelRef.current.style.transform = "";
    if (dx.current > 90) onClose();
    startX.current = null;
    dx.current = 0;
  }

  return (
    <div className="detail-scrim" onClick={onClose}>
      <div
        className="detail"
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <header className="detail-head">
          <button className="back" onClick={onClose} aria-label="Back to feed">
            ← Back
          </button>
          <span className="detail-topic">{post.topic}</span>
        </header>

        <div className="detail-content">
          <h2 className="prompt">{post.prompt}</h2>
          <div className="post-html" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

          {post.answer.explanation && (
            <div className="answer-box">
              <h3>Answer</h3>
              <p>{post.answer.explanation}</p>
            </div>
          )}

          {post.detailHtml && (
            <div className="detail-notes post-html" dangerouslySetInnerHTML={{ __html: post.detailHtml }} />
          )}

          {post.tags.length > 0 && (
            <div className="tags">
              {post.tags.map((t) => (
                <span className="tag" key={t}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          <section className="comments">
            <h3>{comments.length ? "Notes" : "No notes yet"}</h3>
            {comments.map((c) => (
              <div className={`comment comment-${c.kind}`} key={c.id}>
                <span className="comment-kind">{KIND_LABEL[c.kind] ?? c.kind}</span>
                <p>{c.content}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
