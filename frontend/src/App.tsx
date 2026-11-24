import { useCallback, useEffect, useRef, useState } from "react";
import type { OfflineInfo, Post } from "./types";
import { prepareOffline, getTopics } from "./api";
import { getOfflineInfo } from "./offline";
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

  const [likes, setLikes] = useState<BoolMap>(() => loadLikes());
  const [saves, setSaves] = useState<BoolMap>(() => loadSaves());
  const [answers, setAnswers] = useState<AnswerMap>(() => loadAnswers());

  const [offlineInfo, setOfflineInfo] = useState<OfflineInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  // Post id from the URL on first load (e.g. /?id=123), for deep links / refresh.
  const initialId = useRef<number | null>(
    (() => {
      const raw = new URLSearchParams(window.location.search).get("id");
      const n = raw ? Number.parseInt(raw, 10) : NaN;
      return Number.isInteger(n) && n > 0 ? n : null;
    })()
  ).current;

  useEffect(() => {
    getTopics().then(setTopics);
    getOfflineInfo().then(setOfflineInfo);
  }, []);

  // Mirror the active feed card in the URL, silently (no history entry).
  const onActiveChange = useCallback((id: number | null) => {
    const url = id ? `${window.location.pathname}?id=${id}` : window.location.pathname;
    window.history.replaceState(window.history.state, "", url);
  }, []);

  // Opening a post pushes a history entry so Back (or the swipe-right gesture)
  // closes the detail view instead of leaving the app.
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

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  function toggleLike(id: number) {
    setLikes((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      save(KEYS.likes, next);
      return next;
    });
  }

  function toggleSave(id: number) {
    setSaves((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      save(KEYS.saves, next);
      return next;
    });
  }

  function recordAnswer(id: number, choiceId: string) {
    setAnswers((prev) => {
      if (prev[id]) return prev; // lock first answer
      const next = { ...prev, [id]: choiceId };
      save(KEYS.answers, next);
      return next;
    });
  }

  async function onPrepare() {
    setDownloading(true);
    try {
      await prepareOffline(100);
      setOfflineInfo(await getOfflineInfo());
    } catch {
      // Network failed - leave existing offline data intact.
    } finally {
      setDownloading(false);
    }
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

          <button className="offline-btn" onClick={onPrepare} disabled={downloading}>
            {downloading ? "Preparing…" : "Prepare offline"}
          </button>
        </div>
      </header>

      {(!online || offlineInfo) && (
        <div className={`offline-strip ${online ? "" : "is-offline"}`}>
          {online
            ? offlineInfo
              ? `${offlineInfo.count} cards saved for offline` +
                (offlineInfo.stubCount ? ` · ${offlineInfo.stubCount} trimmed to save space` : "") +
                (offlineInfo.hasMore ? " — tap Prepare offline for more" : " — all caught up")
              : null
            : `Offline — showing ${offlineInfo?.count ?? 0} saved cards`}
        </div>
      )}

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
      />

      {openPost && <Detail post={openPost} onClose={closeDetail} />}
    </div>
  );
}
