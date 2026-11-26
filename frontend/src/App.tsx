import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedSource, Identity, Post } from "./types";
import {
  clearUserActivity,
  getPost,
  getUserState,
  recordAttempt,
  recordView,
  setReaction,
} from "./api";
import { ensureAuth, getIdentity, signInAs, type Persona } from "./auth";
import {
  loadAnswers,
  loadLikes,
  loadSaves,
  saveAnswers,
  saveLikes,
  saveSaves,
  type AnswerMap,
  type BoolMap,
} from "./localState";
import Dashboard from "./components/Dashboard";
import Feed from "./components/Feed";
import Detail from "./components/Detail";

type View = "dashboard" | "swipe";

function sourceTitle(s: FeedSource): string {
  switch (s.type) {
    case "topic":
      return s.topic;
    case "playlist":
      return s.title ?? "Playlist";
    case "assignment":
      return s.title ?? "Assignment";
    case "random":
      return "My topics";
    default:
      return "All cards";
  }
}

export default function App() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [source, setSource] = useState<FeedSource>({ type: "all" });
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  const [likes, setLikes] = useState<BoolMap>(() => loadLikes());
  const [saves, setSaves] = useState<BoolMap>(() => loadSaves());
  const [answers, setAnswers] = useState<AnswerMap>(() => loadAnswers());

  const viewed = useRef<Set<number>>(new Set());

  // Sign in (remembered persona, default Public/anon), load identity + state.
  useEffect(() => {
    let alive = true;
    ensureAuth()
      .then(() => Promise.all([getIdentity(), getUserState()]))
      .then(([id, { likes: sl, answers: sa }]) => {
        if (!alive) return;
        setIdentity(id);
        setLikes((prev) => ({ ...prev, ...sl }));
        setAnswers((prev) => ({ ...prev, ...sa }));
      })
      .catch(() => {
        if (alive) setIdentity({ userId: "", isAnonymous: true, tenantId: null, role: null, displayName: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  // History: dashboard (base) → swipe → detail, each one level deep, so the
  // browser/OS back button unwinds exactly one step at a time.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { ms?: string; id?: number } | null;
      if (st?.ms === "detail") {
        if (st.id) getPost(st.id).then((p) => p && setOpenPost(p));
        setView("swipe");
      } else if (st?.ms === "swipe") {
        setOpenPost(null);
        setView("swipe");
      } else {
        setOpenPost(null);
        setView("dashboard");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const startSession = useCallback((s: FeedSource) => {
    setSource(s);
    setView("swipe");
    viewed.current = new Set();
    window.history.pushState({ ms: "swipe" }, "", window.location.pathname);
  }, []);

  const exitToDashboard = useCallback(() => {
    if ((window.history.state as { ms?: string } | null)?.ms) window.history.back();
    else setView("dashboard");
  }, []);

  const openDetail = useCallback((post: Post) => {
    window.history.pushState({ ms: "detail", id: post.id }, "", `${window.location.pathname}?id=${post.id}`);
    setOpenPost(post);
  }, []);

  const closeDetail = useCallback(() => {
    if ((window.history.state as { ms?: string } | null)?.ms === "detail") window.history.back();
    else setOpenPost(null);
  }, []);

  const onActiveChange = useCallback((id: number | null) => {
    if (id && !viewed.current.has(id)) {
      viewed.current.add(id);
      void recordView(id);
    }
  }, []);

  async function switchPersona(p: Persona) {
    // Each persona has its own namespaced localStorage, so no wipe is needed —
    // the reload re-hydrates from the new persona's cache + the server.
    try {
      await signInAs(p);
    } catch {
      /* fall through to reload — ensureAuth will recover */
    }
    window.location.reload();
  }

  function toggleLike(id: number) {
    const nextLiked = !likes[id];
    setLikes((prev) => {
      const next = { ...prev };
      if (nextLiked) next[id] = true;
      else delete next[id];
      saveLikes(next);
      return next;
    });
    void setReaction(id, "like", nextLiked);
  }

  function toggleSave(id: number) {
    setSaves((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      saveSaves(next);
      return next;
    });
  }

  async function clearAll() {
    setMenuOpen(false);
    setAnswers({});
    saveAnswers({});
    setLikes({});
    saveLikes({});
    setSaves({});
    saveSaves({});
    viewed.current = new Set();
    setResetToken((t) => t + 1);
    try {
      await clearUserActivity();
    } catch {
      /* best-effort */
    }
  }

  function recordAnswer(id: number, choiceIds: string[]) {
    if (answers[id]) return;
    setAnswers((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: choiceIds };
      saveAnswers(next);
      return next;
    });
    void recordAttempt(id, choiceIds);
  }

  if (!identity) {
    return (
      <div className="app">
        <div className="splash">Loading…</div>
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <div className="app">
        <Dashboard identity={identity} onStartSession={startSession} onSwitchPersona={switchPersona} />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="back" onClick={exitToDashboard} aria-label="Back to dashboard">
          ← Home
        </button>
        <span className="swipe-title">{sourceTitle(source)}</span>
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
      </header>

      <Feed
        source={source}
        likes={likes}
        saves={saves}
        answers={answers}
        onToggleLike={toggleLike}
        onToggleSave={toggleSave}
        onAnswer={recordAnswer}
        onOpen={openDetail}
        onActiveChange={onActiveChange}
        resetToken={resetToken}
      />

      {openPost && <Detail post={openPost} identity={identity} onClose={closeDetail} />}
    </div>
  );
}
