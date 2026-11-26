import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "./types";
import {
  clearUserActivity,
  getTopics,
  getUserState,
  recordAttempt,
  recordView,
  setReaction,
} from "./api";
import { ensureAuth } from "./supabase";
import {
  KEYS,
  loadAnswers,
  loadLikes,
  loadSaves,
  save,
  type AnswerMap,
  type BoolMap,
} from "./localState";
import Feed from "./components/Feed";
import Detail from "./components/Detail";

export default function App() {
  const [topic, setTopic] = useState<string | null>(null);
  const [topics, setTopics] = useState<{ topic: string; count: number }[]>([]);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Bumped by "Clear all" to tell cards to drop any pending (pre-submit) pick.
  const [resetToken, setResetToken] = useState(0);

  // localStorage gives instant, offline-safe UI; Supabase is the durable store.
  const [likes, setLikes] = useState<BoolMap>(() => loadLikes());
  const [saves, setSaves] = useState<BoolMap>(() => loadSaves());
  const [answers, setAnswers] = useState<AnswerMap>(() => loadAnswers());

  // Record each card view at most once per session.
  const viewed = useRef<Set<number>>(new Set());

  // Post id from the URL on first load (e.g. /?id=123), for deep links / refresh.
  const initialId = useRef<number | null>(
    (() => {
      const raw = new URLSearchParams(window.location.search).get("id");
      const n = raw ? Number.parseInt(raw, 10) : NaN;
      return Number.isInteger(n) && n > 0 ? n : null;
    })()
  ).current;

  // Topics for the filter.
  useEffect(() => {
    getTopics().then(setTopics);
  }, []);

  // Sign in anonymously, then hydrate likes/answers from the DB (server wins).
  useEffect(() => {
    let alive = true;
    ensureAuth()
      .then(() => getUserState())
      .then(({ likes: sl, answers: sa }) => {
        if (!alive) return;
        setLikes((prev) => ({ ...prev, ...sl }));
        setAnswers((prev) => ({ ...prev, ...sa }));
      })
      .catch(() => {
        /* offline / box down — keep local state */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Mirror the active feed card in the URL (silent) and record the view.
  const onActiveChange = useCallback((id: number | null) => {
    const url = id ? `${window.location.pathname}?id=${id}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", url);
    if (id && !viewed.current.has(id)) {
      viewed.current.add(id);
      void recordView(id);
    }
  }, []);

  const openDetail = useCallback((post: Post) => {
    window.history.pushState({ detail: post.id }, "", `${window.location.pathname}?id=${post.id}`);
    setOpenPost(post);
  }, []);

  const closeDetail = useCallback(() => {
    if (window.history.state?.detail) window.history.back();
    else setOpenPost(null);
  }, []);

  useEffect(() => {
    const onPop = () => setOpenPost(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // The network writes live OUTSIDE the state updaters: updaters must be pure
  // (React 18 StrictMode double-invokes them, which would double-fire writes).
  function toggleLike(id: number) {
    const nextLiked = !likes[id];
    setLikes((prev) => {
      const next = { ...prev };
      if (nextLiked) next[id] = true;
      else delete next[id];
      save(KEYS.likes, next);
      return next;
    });
    void setReaction(id, "like", nextLiked);
  }

  // Saves/bookmarks stay local in build-1 (no server table yet).
  function toggleSave(id: number) {
    setSaves((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      save(KEYS.saves, next);
      return next;
    });
  }

  // Wipe this user's choices/results — locally and on the server — so the feed
  // resets to unanswered (and stays reset after a reload).
  async function clearAll() {
    setMenuOpen(false);
    setAnswers({});
    save(KEYS.answers, {});
    setLikes({});
    save(KEYS.likes, {});
    setSaves({});
    save(KEYS.saves, {});
    viewed.current = new Set();
    setResetToken((t) => t + 1);
    try {
      await clearUserActivity();
    } catch {
      /* best-effort — local state is already cleared */
    }
  }

  function recordAnswer(id: number, choiceIds: string[]) {
    if (answers[id]) return; // already answered (Card also disables after submit)
    setAnswers((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: choiceIds };
      save(KEYS.answers, next);
      return next;
    });
    void recordAttempt(id, choiceIds);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">mindSwipe</div>

        <div className="topbar-right">
          <select
            className="topic-select"
            value={topic ?? ""}
            onChange={(e) => setTopic(e.target.value || null)}
            aria-label="Filter by topic"
          >
            <option value="">All topics</option>
            {topics.map((t) => (
              <option key={t.topic} value={t.topic}>
                {t.topic} ({t.count})
              </option>
            ))}
          </select>

          <div className="menu">
            <button
              className="menu-btn"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              ⋮
            </button>
            {menuOpen && (
              <>
                <div className="menu-scrim" onClick={() => setMenuOpen(false)} />
                <div className="menu-pop" role="menu">
                  <button role="menuitem" className="menu-item" onClick={clearAll}>
                    Clear all
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <Feed
        topic={topic}
        likes={likes}
        saves={saves}
        answers={answers}
        onToggleLike={toggleLike}
        onToggleSave={toggleSave}
        onAnswer={recordAnswer}
        onOpen={openDetail}
        initialId={initialId}
        onActiveChange={onActiveChange}
        resetToken={resetToken}
      />

      {openPost && <Detail post={openPost} onClose={closeDetail} />}
    </div>
  );
}
