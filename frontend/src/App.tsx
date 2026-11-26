import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_FLAGS, type FeedSource, type Identity, type Post } from "./types";
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

function parseIdParam(): number | null {
  const raw = new URLSearchParams(window.location.search).get("id");
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isInteger(n) && n > 0 ? n : null;
}

export default function App() {
  // Deep link (YouTube-Shorts style): /?id=N lands straight on that card in the
  // feed. The id is the real post id — access is gated by RLS, not by secrecy,
  // so a link only resolves to a card the viewer is allowed to see.
  const initialId = useRef<number | null>(parseIdParam()).current;

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [view, setView] = useState<View>(initialId ? "swipe" : "dashboard");
  const [source, setSource] = useState<FeedSource>({ type: "all" });
  // The card the feed should open on; only set for the initial deep link, then
  // cleared once the user starts a fresh session (which begins at the top).
  const [feedInitialId, setFeedInitialId] = useState<number | null>(initialId);
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  const [likes, setLikes] = useState<BoolMap>(() => loadLikes());
  const [saves, setSaves] = useState<BoolMap>(() => loadSaves());
  const [answers, setAnswers] = useState<AnswerMap>(() => loadAnswers());

  const viewed = useRef<Set<number>>(new Set());
  // True while the detail overlay is open, so swipe-driven URL updates don't
  // overwrite the detail history entry.
  const inDetailRef = useRef(false);

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
        if (alive)
          setIdentity({
            userId: "",
            isAnonymous: true,
            tenantId: null,
            role: null,
            displayName: null,
            plan: null,
            flags: DEFAULT_FLAGS,
          });
      });
    return () => {
      alive = false;
    };
  }, []);

  // On a deep-linked load, synthesise a dashboard entry underneath the card so
  // Back / Home returns to the dashboard instead of leaving the app.
  useEffect(() => {
    if (initialId) {
      window.history.replaceState(null, "", window.location.pathname);
      window.history.pushState({ ms: "swipe" }, "", `${window.location.pathname}?id=${initialId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // History: dashboard (base) → swipe → detail, each one level deep, so the
  // browser/OS back button unwinds exactly one step at a time.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { ms?: string; id?: number } | null;
      if (st?.ms === "detail") {
        inDetailRef.current = true;
        if (st.id) getPost(st.id).then((p) => p && setOpenPost(p));
        setView("swipe");
      } else if (st?.ms === "swipe") {
        inDetailRef.current = false;
        setOpenPost(null);
        setView("swipe");
      } else {
        inDetailRef.current = false;
        setOpenPost(null);
        setView("dashboard");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const startSession = useCallback((s: FeedSource) => {
    setSource(s);
    setFeedInitialId(null); // an explicit session starts at the top
    setView("swipe");
    viewed.current = new Set();
    inDetailRef.current = false;
    window.history.pushState({ ms: "swipe" }, "", window.location.pathname);
  }, []);

  const exitToDashboard = useCallback(() => {
    if ((window.history.state as { ms?: string } | null)?.ms) window.history.back();
    else setView("dashboard");
  }, []);

  const openDetail = useCallback((post: Post) => {
    inDetailRef.current = true;
    window.history.pushState({ ms: "detail", id: post.id }, "", `${window.location.pathname}?id=${post.id}`);
    setOpenPost(post);
  }, []);

  const closeDetail = useCallback(() => {
    inDetailRef.current = false;
    if ((window.history.state as { ms?: string } | null)?.ms === "detail") window.history.back();
    else setOpenPost(null);
  }, []);

  // Mirror the active card in the URL (Shorts-style), via replaceState so
  // swiping never floods history — Back still exits straight to the dashboard.
  const onActiveChange = useCallback((id: number | null) => {
    if (!id) return;
    if (!inDetailRef.current) {
      window.history.replaceState({ ms: "swipe" }, "", `${window.location.pathname}?id=${id}`);
    }
    if (!viewed.current.has(id)) {
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

  function recordAnswer(id: number, choiceIds: string[], durationMs?: number) {
    if (answers[id]) return;
    setAnswers((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: choiceIds };
      saveAnswers(next);
      return next;
    });
    void recordAttempt(id, choiceIds, durationMs);
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
        initialId={feedInitialId}
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
