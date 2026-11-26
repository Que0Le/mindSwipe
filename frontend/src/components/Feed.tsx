import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedSource, Post } from "../types";
import { getFeed } from "../api";
import Card from "./Card";

interface Props {
  source: FeedSource;
  // Deep link: start an open-ended feed just before this card so it loads first.
  initialId?: number | null;
  likes: Record<number, boolean>;
  saves: Record<number, boolean>;
  answers: Record<number, string[]>;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onAnswer: (id: number, choiceIds: string[]) => void;
  onOpen: (post: Post) => void;
  onActiveChange?: (id: number | null) => void;
  resetToken?: number;
}

const BATCH = 8;
const WINDOW_BEFORE = 1;
const WINDOW_AFTER = 2;

export default function Feed({
  source,
  initialId,
  likes,
  saves,
  answers,
  onToggleLike,
  onToggleSave,
  onAnswer,
  onOpen,
  onActiveChange,
  resetToken,
}: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef(0);
  const hasMoreRef = useRef(true);

  // A stable key so the reset effect fires only when the source really changes.
  const sourceKey = JSON.stringify(source);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const page = await getFeed({ source, cursor: cursorRef.current, limit: BATCH });
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
      });
      if (page.nextCursor != null) cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  // Reset and reload whenever the source changes. On an open-ended source a
  // deep-linked initialId starts the keyset cursor just before that card so it
  // loads first (bounded sources — playlist/assignment — ignore it).
  useEffect(() => {
    const openEnded = source.type === "all" || source.type === "topic" || source.type === "random";
    setPosts([]);
    setActive(0);
    cursorRef.current = openEnded && initialId && initialId > 0 ? initialId - 1 : 0;
    hasMoreRef.current = true;
    setHasMore(true);
    scrollerRef.current?.scrollTo({ top: 0 });
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  useEffect(() => {
    if (posts.length === 0) return;
    onActiveChange?.(posts[active]?.id ?? null);
  }, [active, posts, onActiveChange]);

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
                resetToken={resetToken}
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
            <p className="empty-sub">That&apos;s every card in this set.</p>
          </div>
        </section>
      )}
    </div>
  );
}
