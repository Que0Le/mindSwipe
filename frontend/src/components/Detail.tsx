import { useEffect, useRef, useState } from "react";
import type { Comment, Identity, Post } from "../types";
import { getComments, moderateComment, postComment } from "../api";
import { sanitizeHtml } from "../sanitize";

interface Props {
  post: Post;
  identity: Identity;
  onClose: () => void;
}

export default function Detail({ post, identity, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const startX = useRef<number | null>(null);
  const dx = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const isMember = identity.tenantId != null;
  const isStaff = identity.role === "teacher" || identity.role === "tenant_admin";

  useEffect(() => {
    let alive = true;
    getComments(post.id).then((items) => {
      if (alive) setComments(items);
    });
    return () => {
      alive = false;
    };
  }, [post.id]);

  async function submit() {
    const body = draft.trim();
    if (!body || posting || identity.tenantId == null) return;
    setPosting(true);
    const c = await postComment(post.id, identity.tenantId, body);
    setPosting(false);
    if (c) {
      setComments((prev) => [...prev, c]);
      setDraft("");
    }
  }

  async function moderate(id: number, status: "approved" | "rejected") {
    await moderateComment(id, status);
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  // Swipe-right to go back (matches the native gesture).
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

  const visible = comments.filter((c) => c.status === "approved" || c.mine || isStaff);

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
          {post.bodyHtml && (
            <div className="post-html" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.bodyHtml) }} />
          )}

          {post.answer.explanation && (
            <div className="answer-box">
              <h3>Answer</h3>
              <p>{post.answer.explanation}</p>
            </div>
          )}

          {post.detailHtml && (
            <div
              className="detail-notes post-html"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.detailHtml) }}
            />
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
            <h3>Discussion</h3>

            {!isMember && <p className="comments-note">Join a class to take part in the discussion.</p>}

            {isMember && (
              <div className="comment-compose">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Add a comment…"
                  maxLength={2000}
                  rows={2}
                />
                <button className="comment-send" onClick={submit} disabled={posting || !draft.trim()}>
                  {posting ? "Posting…" : "Post"}
                </button>
                <p className="comments-note">Comments are reviewed by a teacher before they appear.</p>
              </div>
            )}

            {visible.length === 0 && isMember && <p className="comments-note">No comments yet. Be the first.</p>}

            {visible.map((c) => (
              <div className={`comment status-${c.status}`} key={c.id}>
                <div className="comment-meta">
                  <span className="comment-who">{c.mine ? "You" : "Student"}</span>
                  {c.status !== "approved" && <span className={`cstatus ${c.status}`}>{c.status}</span>}
                </div>
                <p className="comment-body">{c.body}</p>
                {isStaff && c.status === "pending" && (
                  <div className="mod-actions">
                    <button className="mod-approve" onClick={() => moderate(c.id, "approved")}>
                      Approve
                    </button>
                    <button className="mod-reject" onClick={() => moderate(c.id, "rejected")}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
