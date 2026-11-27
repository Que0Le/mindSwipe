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
import TeachDashboard from "./components/TeachDashboard";
import AuthorDashboard from "./components/AuthorDashboard";
import Feed from "./components/Feed";
import Detail from "./components/Detail";

type View = "dashboard" | "swipe" | "teach" | "author";

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

// Each top-level view has its own real URL path, so pages are linkable,
// refreshable, and unwound one step at a time by the browser Back button.
function pathView(): View {
  const p = window.location.pathname;
  if (p.startsWith("/teach")) return "teach";
  if (p.startsWith("/author")) return "author"; // incl. /author/<tab>
  if (p.startsWith("/swipe")) return "swipe";
  return "dashboard";
}

export default function App() {
  // Deep link (YouTube-Shorts style): /swipe?id=N — or legacy /?id=N — lands
  // straight on that card in the feed. The id is the real post id; access is
  // gated by RLS, not by secrecy.
  const initialId = useRef<number | null>(parseIdParam()).current;
  const initialView = useRef<View>(
    pathView() !== "dashboard" ? pathView() : initialId ? "swipe" : "dashboard"
  ).current;

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [view, setView] = useState<View>(initialView);
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
  const synthDone = useRef(false);

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

  // On any deep load that isn't the plain dashboard, synthesise a dashboard
  // entry underneath so Back / Home returns to the dashboard, and normalise the
  // URL to a clean path for the landing view.
  useEffect(() => {
    if (synthDone.current) return;
    synthDone.current = true;
    if (initialView === "dashboard" && !initialId) {
      if (window.location.search) window.history.replaceState({ ms: "dashboard" }, "", "/");
      return;
    }
    // Preserve the exact landing URL (incl. sub-tabs like /author/playlists);
    // only the legacy /?id=N deep link is normalised to /swipe?id=N.
    const url =
      initialView === "swipe" && !window.location.pathname.startsWith("/swipe")
        ? initialId
          ? `/swipe?id=${initialId}`
          : "/swipe"
        : window.location.pathname + window.location.search;
    window.history.replaceState({ ms: "dashboard" }, "", "/");
    window.history.pushState({ ms: initialView }, "", url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // History: dashboard (base) → swipe → detail, each one level deep, so the
  // browser/OS back button unwinds exactly one step at a time.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { ms?: string; id?: number } | null;
      // Prefer the history entry's marker; fall back to the URL path (e.g. a
      // bookmarked /teach the user navigated into with no stored state).
      const ms = st?.ms ?? pathView();
      if (ms === "detail") {
        inDetailRef.current = true;
        if (st?.id) getPost(st.id).then((p) => p && setOpenPost(p));
        setView("swipe");
      } else if (ms === "swipe") {
        inDetailRef.current = false;
        setOpenPost(null);
        setView("swipe");
      } else if (ms === "teach") {
        inDetailRef.current = false;
        setOpenPost(null);
        setView("teach");
      } else if (ms === "author") {
        inDetailRef.current = false;
        setOpenPost(null);
        setView("author");
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
    window.history.pushState({ ms: "swipe" }, "", "/swipe");
  }, []);

  const openTeach = useCallback(() => {
    setView("teach");
    window.history.pushState({ ms: "teach" }, "", "/teach");
  }, []);

  const openAuthor = useCallback(() => {
    setView("author");
    window.history.pushState({ ms: "author" }, "", "/author");
  }, []);

  const exitToDashboard = useCallback(() => {
    const ms = (window.history.state as { ms?: string } | null)?.ms;
    if (ms && ms !== "dashboard") window.history.back();
    else {
      setView("dashboard");
      window.history.replaceState({ ms: "dashboard" }, "", "/");
    }
  }, []);

  const openDetail = useCallback((post: Post) => {
    inDetailRef.current = true;
    window.history.pushState({ ms: "detail", id: post.id }, "", `/swipe?id=${post.id}`);
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
      window.history.replaceState({ ms: "swipe" }, "", `/swipe?id=${id}`);
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

  if (view === "teach") {
    return (
      <div className="app">
        <TeachDashboard identity={identity} onClose={exitToDashboard} />
      </div>
    );
  }

  if (view === "author") {
    return (
      <div className="app">
        <AuthorDashboard identity={identity} onClose={exitToDashboard} />
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <div className="app">
        <Dashboard
          identity={identity}
          onStartSession={startSession}
          onSwitchPersona={switchPersona}
          onOpenTeach={openTeach}
          onOpenAuthor={openAuthor}
        />
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
