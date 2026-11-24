import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "../types";
import { getFeed } from "../api";
import Card from "./Card";

interface Props {
  topic: string | null;
  likes: Record<number, boolean>;
  saves: Record<number, boolean>;
  answers: Record<number, string>;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onAnswer: (id: number, choiceId: string) => void;
  onOpen: (post: Post) => void;
}

const BATCH = 8;
// How many cards to keep mounted around the active one. Everything outside the
// window renders as an empty, full-height slot so scroll position is preserved
// but the DOM stays tiny - this is what keeps it smooth and battery-cheap on a
// phone even with hundreds of posts.
const WINDOW_BEFORE = 1;
const WINDOW_AFTER = 2;

export default function Feed({
  topic,
  likes,
  saves,
  answers,
  onToggleLike,
  onToggleSave,
  onAnswer,
  onOpen,
}: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [, setCursor] = useState<number>(0);
  const [hasMore, setHasMore] = useState(true);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef(0);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await getFeed({ cursor: cursorRef.current, limit: BATCH, topic });
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
      });
      if (page.nextCursor != null) {
        cursorRef.current = page.nextCursor;
        setCursor(page.nextCursor);
      }
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [topic]);

  // Reset and reload when the topic filter changes.
  useEffect(() => {
    setPosts([]);
    setActive(0);
    cursorRef.current = 0;
    setCursor(0);
    hasMoreRef.current = true;
    setHasMore(true);
    scrollerRef.current?.scrollTo({ top: 0 });
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  // Track the active (snapped) card from scroll position, rAF-throttled, and
  // prefetch the next batch as we near the end.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const h = el.clientHeight || 1;
        const idx = Math.round(el.scrollTop / h);
        setActive((prev) => (prev === idx ? prev : idx));
        if (idx >= posts.length - 3) loadMore();
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [posts.length, loadMore]);

  return (
    <div className="feed" ref={scrollerRef}>
      {posts.map((post, i) => {
        const inWindow = i >= active - WINDOW_BEFORE && i <= active + WINDOW_AFTER;
        return (
          <section className="slot" key={post.id}>
            {inWindow ? (
              <Card
                post={post}
                active={i === active}
                liked={Boolean(likes[post.id])}
                saved={Boolean(saves[post.id])}
                answer={answers[post.id]}
                onToggleLike={onToggleLike}
                onToggleSave={onToggleSave}
                onAnswer={onAnswer}
                onOpen={onOpen}
              />
            ) : (
              <div className="slot-placeholder" aria-hidden="true" />
            )}
          </section>
        );
      })}

      {posts.length === 0 && (
        <section className="slot">
          <div className="empty">{loading ? "Loading cards…" : "No cards here yet."}</div>
        </section>
      )}

      {!hasMore && posts.length > 0 && (
        <section className="slot">
          <div className="empty">
            <p>You&apos;ve reached the end.</p>
            <p className="empty-sub">That&apos;s every card in this filter.</p>
          </div>
        </section>
      )}
    </div>
  );
}
