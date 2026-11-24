import { useEffect, useState } from "react";
import type { OfflineInfo, Post } from "./types";
import { downloadBundle, getTopics } from "./api";
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

  useEffect(() => {
    getTopics().then(setTopics);
    getOfflineInfo().then(setOfflineInfo);
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

  async function onDownload() {
    setDownloading(true);
    try {
      await downloadBundle(topic);
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

          <button className="offline-btn" onClick={onDownload} disabled={downloading}>
            {downloading ? "Saving…" : offlineInfo ? "Update offline" : "Save offline"}
          </button>
        </div>
      </header>

      {(!online || offlineInfo) && (
        <div className={`offline-strip ${online ? "" : "is-offline"}`}>
          {online
            ? offlineInfo
              ? `${offlineInfo.count} cards saved for offline`
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
        onOpen={setOpenPost}
      />

      {openPost && <Detail post={openPost} onClose={() => setOpenPost(null)} />}
    </div>
  );
}
