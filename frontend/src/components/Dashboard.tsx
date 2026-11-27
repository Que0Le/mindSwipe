import { useCallback, useEffect, useMemo, useState } from "react";
import type { Assignment, FeedSource, Identity, Playlist, Stats, TopicMastery } from "../types";
import {
  addTopicInterest,
  getAssignments,
  getPlaylists,
  getStats,
  getTopicInterests,
  getTopicMastery,
  getTopics,
  removeTopicInterest,
} from "../api";
import { type Persona } from "../auth";
import PersonaSwitcher from "./PersonaSwitcher";
import PlaylistInsights from "./PlaylistInsights";

interface Props {
  identity: Identity;
  onStartSession: (source: FeedSource) => void;
  onSwitchPersona: (p: Persona) => void;
  onOpenTeach: () => void;
  onOpenAuthor: () => void;
}

function dueLabel(dueAt: string | null): string {
  if (!dueAt) return "";
  const days = Math.ceil((new Date(dueAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "overdue";
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}

export default function Dashboard({
  identity,
  onStartSession,
  onSwitchPersona,
  onOpenTeach,
  onOpenAuthor,
}: Props) {
  const isMember = identity.tenantId != null;

  const [stats, setStats] = useState<Stats>({ answered: 0, correct: 0, likes: 0, viewed: 0 });
  const [interests, setInterests] = useState<string[]>([]);
  const [mastery, setMastery] = useState<TopicMastery[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ topic: string; count: number }[]>([]);
  const [insights, setInsights] = useState<{ id: number; title: string } | null>(null);

  const flags = identity.flags;
  const isStaff = identity.role === "teacher" || identity.role === "tenant_admin";
  // Authoring is open to the dedicated `author` role as well as staff.
  const canAuthor = identity.role === "author" || isStaff;

  const masteryMap = useMemo(() => {
    const m = new Map<string, TopicMastery>();
    for (const t of mastery) m.set(t.topic, t);
    return m;
  }, [mastery]);

  const reloadInterests = useCallback(async () => {
    setInterests(await getTopicInterests());
  }, []);

  useEffect(() => {
    getStats().then(setStats);
    getTopicMastery().then(setMastery);
    reloadInterests();
    if (isMember) {
      getPlaylists().then(setPlaylists);
      getAssignments().then(setAssignments);
    }
  }, [isMember, reloadInterests]);

  // Debounced topic search.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const h = setTimeout(() => {
      getTopics(query).then((r) => setResults(r.slice(0, 8)));
    }, 180);
    return () => clearTimeout(h);
  }, [query]);

  async function follow(topic: string) {
    await addTopicInterest(topic);
    setQuery("");
    setResults([]);
    reloadInterests();
  }
  async function unfollow(topic: string) {
    await removeTopicInterest(topic);
    reloadInterests();
  }

  const accuracy = stats.answered ? Math.round((stats.correct / stats.answered) * 100) : 0;
  const randomSource: FeedSource =
    interests.length > 0 ? { type: "random", topics: interests } : { type: "all" };

  return (
    <div className="dash">
      <header className="topbar">
        <div className="brand">mindSwipe</div>
        <PersonaSwitcher onSwitch={onSwitchPersona} />
      </header>

      <div className="dash-body">
        <section className="hero">
          <h1 className="hero-hi">
            {identity.displayName ? `Hi, ${identity.displayName}` : "Welcome"}
            {identity.role && <span className="role-badge">{identity.role}</span>}
          </h1>
          <div className="stat-row">
            <div className="stat">
              <b>{stats.answered}</b>
              <span>answered</span>
            </div>
            <div className="stat">
              <b>{accuracy}%</b>
              <span>correct</span>
            </div>
            <div className="stat">
              <b>{stats.likes}</b>
              <span>liked</span>
            </div>
            <div className="stat">
              <b>{stats.viewed}</b>
              <span>seen</span>
            </div>
          </div>
          <button className="start-hero" onClick={() => onStartSession(randomSource)}>
            ▶ Start {interests.length > 0 ? "from my topics" : "swiping"}
          </button>
        </section>

        {/* Public tier shows ads; paid/private tenants have the flag off. */}
        {flags.ads && (
          <aside className="ad">
            <span className="ad-tag">Sponsored</span>
            <div>
              <strong>Go ad-free with mindSwipe Pro</strong>
              <p>Unlock distraction-free study for your whole class.</p>
            </div>
          </aside>
        )}

        {/* Flag-gated tools: which appear depends on role + the tenant's plan. */}
        {((isStaff && flags.monitoring_dashboard) || (canAuthor && flags.authoring)) && (
          <section className="dash-sec">
            <h2 className="sec-title">Teaching tools</h2>
            <div className="tools">
              {isStaff && flags.monitoring_dashboard && (
                <button className="tool-card" onClick={onOpenTeach}>
                  <span className="tool-ico">📊</span>
                  <span>Class dashboard</span>
                </button>
              )}
              {canAuthor && flags.authoring && (
                <button className="tool-card" onClick={onOpenAuthor}>
                  <span className="tool-ico">✍️</span>
                  <span>Author a card</span>
                </button>
              )}
            </div>
          </section>
        )}

        {isMember && (
          <section className="dash-sec">
            <h2 className="sec-title">Assignments</h2>
            {assignments.length === 0 && <p className="sec-empty">Nothing assigned right now.</p>}
            {assignments.map((a) => {
              const pct = a.progress.total
                ? Math.round((a.progress.attempted / a.progress.total) * 100)
                : 0;
              return (
                <div className="assign" key={a.id}>
                  <div className="assign-main">
                    <div className="assign-head">
                      <strong>{a.title}</strong>
                      {a.dueAt && <span className={`due ${dueLabel(a.dueAt)}`}>{dueLabel(a.dueAt)}</span>}
                    </div>
                    {a.description && <p className="assign-desc">{a.description}</p>}
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="progress-text">
                      {a.progress.attempted}/{a.progress.total} done · {a.progress.correct} correct
                    </span>
                  </div>
                  <button
                    className="btn-go"
                    onClick={() => onStartSession({ type: "assignment", assignmentId: a.id, title: a.title })}
                  >
                    {a.progress.attempted > 0 ? "Resume" : "Do it"}
                  </button>
                </div>
              );
            })}
          </section>
        )}

        <section className="dash-sec">
          <h2 className="sec-title">Topics</h2>
          <div className="topic-search">
            <input
              type="search"
              placeholder="Search topics to follow…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search topics"
            />
            {results.length > 0 && (
              <div className="search-results">
                {results.map((r) => (
                  <button key={r.topic} className="search-row" onClick={() => follow(r.topic)}>
                    <span>{r.topic}</span>
                    <span className="search-count">{r.count} · follow +</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {interests.length === 0 ? (
            <p className="sec-empty">Follow a topic to build your own feed.</p>
          ) : (
            <div className="topic-chips">
              {interests.map((t) => {
                const m = masteryMap.get(t);
                return (
                  <div className="chip" key={t}>
                    <button className="chip-go" onClick={() => onStartSession({ type: "topic", topic: t })}>
                      ▶
                    </button>
                    <span className="chip-text">
                      {t}
                      {m && <small>{m.answered} done · {m.correct}✓</small>}
                    </span>
                    <button className="chip-x" aria-label={`Unfollow ${t}`} onClick={() => unfollow(t)}>
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {isMember && playlists.length > 0 && (
          <section className="dash-sec">
            <h2 className="sec-title">Playlists</h2>
            <div className="playlists">
              {playlists.map((p) => (
                <div className="playlist" key={p.id}>
                  <div className="playlist-main">
                    <strong>{p.title}</strong>
                    {p.description && <p>{p.description}</p>}
                    <span className="playlist-count">{p.count} cards</span>
                  </div>
                  {isStaff && (
                    <button
                      className="btn-insights"
                      aria-label="Insights"
                      onClick={() => setInsights({ id: p.id, title: p.title })}
                    >
                      📊
                    </button>
                  )}
                  <button
                    className="btn-go"
                    onClick={() => onStartSession({ type: "playlist", playlistId: p.id, title: p.title })}
                  >
                    ▶
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {insights && (
        <PlaylistInsights
          playlistId={insights.id}
          title={insights.title}
          onClose={() => setInsights(null)}
        />
      )}
    </div>
  );
}
