import { useEffect, useMemo, useState } from "react";
import type { ClassTopic, Identity, Playlist, Segment, StudentEffort } from "../types";
import { getClassTopics, getPlaylistVerdicts, getPlaylists, getStudentEffort } from "../api";
import { buildInsights, cohortMedianAnswered, segmentOf } from "../conclusions";
import PlaylistInsights from "./PlaylistInsights";

interface Props {
  identity: Identity;
  onClose: () => void;
}

type Tab = "overview" | "content" | "students";
type SegFilter = "all" | "at-risk" | "ahead";

function fmtTime(ms: number | null): string {
  if (ms == null || ms === 0) return "—";
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(s < 10 ? 1 : 0)}s` : `${Math.floor(s / 60)}m`;
}

const SEG: Record<Segment, { label: string; cls: string }> = {
  inactive: { label: "inactive", cls: "seg-inactive" },
  "at-risk": { label: "at risk", cls: "seg-risk" },
  "on-track": { label: "on track", cls: "seg-ok" },
  ahead: { label: "ahead", cls: "seg-ahead" },
};

const VERDICT: Record<string, { label: string; cls: string }> = {
  easy: { label: "leaning easy", cls: "verdict easy" },
  hard: { label: "leaning hard", cls: "verdict hard" },
  balanced: { label: "balanced", cls: "verdict" },
  nodata: { label: "no data", cls: "verdict" },
};

export default function TeachDashboard({ identity, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [students, setStudents] = useState<StudentEffort[]>([]);
  const [topics, setTopics] = useState<ClassTopic[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [verdicts, setVerdicts] = useState<Map<number, { cards: number; verdict: string }>>(new Map());
  const [openInsights, setOpenInsights] = useState<{ id: number; title: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [segFilter, setSegFilter] = useState<SegFilter>("all");

  const tenantId = identity.tenantId;
  useEffect(() => {
    if (tenantId == null) return;
    getStudentEffort(tenantId).then(setStudents);
    getClassTopics().then(setTopics);
    getPlaylists().then(setPlaylists);
    getPlaylistVerdicts().then((v) =>
      setVerdicts(new Map(v.map((x) => [x.playlistId, { cards: x.cards, verdict: x.verdict }])))
    );
  }, [tenantId]);

  const pupils = useMemo(() => students.filter((s) => s.role === "student"), [students]);
  const medAns = useMemo(() => cohortMedianAnswered(students), [students]);
  const playlistVerdicts = useMemo(
    () => playlists.map((p) => ({ title: p.title, verdict: (verdicts.get(p.id)?.verdict ?? "nodata") as "easy" | "hard" | "balanced" | "nodata" })),
    [playlists, verdicts]
  );
  const insights = useMemo(() => buildInsights(students, topics, playlistVerdicts), [students, topics, playlistVerdicts]);

  const withAcc = pupils.filter((s) => s.accuracy != null);
  const avgAcc = withAcc.length ? Math.round(withAcc.reduce((a, s) => a + (s.accuracy ?? 0), 0) / withAcc.length) : 0;
  const segCount = (seg: Segment) => pupils.filter((s) => segmentOf(s, medAns) === seg).length;

  const signalTopics = topics.filter((t) => t.attempts >= 5 && t.accuracy != null);
  const weakest = [...signalTopics].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)).slice(0, 4);
  const strongest = [...signalTopics].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0)).slice(0, 4);

  const shownStudents = pupils
    .filter((s) => {
      const seg = segmentOf(s, medAns);
      if (segFilter === "at-risk") return seg === "at-risk" || seg === "inactive";
      if (segFilter === "ahead") return seg === "ahead";
      return true;
    })
    .sort((a, b) => (a.accuracy ?? 999) - (b.accuracy ?? 999));

  return (
    <div className="teach">
      <header className="topbar teach-top">
        <button className="back" onClick={onClose} aria-label="Back to dashboard">
          ← Home
        </button>
        <span className="swipe-title">Class dashboard</span>
        <span style={{ width: 54 }} />
      </header>

      <nav className="teach-tabs">
        {(["overview", "content", "students"] as Tab[]).map((t) => (
          <button key={t} className={`teach-tab ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {t === "overview" ? "Overview" : t === "content" ? "Content" : "Students"}
          </button>
        ))}
      </nav>

      <div className="teach-body">
        {tab === "overview" && (
          <>
            <section className="conclusions">
              <h2 className="sec-title">Conclusions</h2>
              {insights.map((i, k) => (
                <div className={`insight-row ${i.kind}`} key={k}>
                  <span className="insight-ico">{i.kind === "warn" ? "⚠️" : i.kind === "good" ? "✅" : "ℹ️"}</span>
                  <span>{i.text}</span>
                </div>
              ))}
            </section>

            <section className="dash-sec">
              <h2 className="sec-title">Class at a glance</h2>
              <div className="stat-row">
                <div className="stat">
                  <b>{pupils.length}</b>
                  <span>students</span>
                </div>
                <div className="stat">
                  <b>{avgAcc}%</b>
                  <span>avg correct</span>
                </div>
                <div className="stat">
                  <b>{segCount("at-risk") + segCount("inactive")}</b>
                  <span>need help</span>
                </div>
                <div className="stat">
                  <b>{segCount("ahead")}</b>
                  <span>ahead</span>
                </div>
              </div>
            </section>

            <section className="dash-sec topic-cols">
              <div>
                <h3 className="mini-title">Weakest topics</h3>
                {weakest.map((t) => (
                  <div className="topic-row" key={`${t.subject}-${t.topic}`}>
                    <span className="topic-acc bad">{t.accuracy}%</span>
                    <span className="topic-name">{t.topic}</span>
                  </div>
                ))}
                {weakest.length === 0 && <p className="sec-empty">Not enough data.</p>}
              </div>
              <div>
                <h3 className="mini-title">Strongest topics</h3>
                {strongest.map((t) => (
                  <div className="topic-row" key={`${t.subject}-${t.topic}`}>
                    <span className="topic-acc good">{t.accuracy}%</span>
                    <span className="topic-name">{t.topic}</span>
                  </div>
                ))}
                {strongest.length === 0 && <p className="sec-empty">Not enough data.</p>}
              </div>
            </section>
          </>
        )}

        {tab === "content" && (
          <section className="dash-sec">
            <h2 className="sec-title">Playlists</h2>
            {playlists.map((p) => {
              const v = verdicts.get(p.id);
              const vd = VERDICT[v?.verdict ?? "nodata"];
              return (
                <div className="assign" key={p.id}>
                  <div className="assign-main">
                    <div className="assign-head">
                      <strong>{p.title}</strong>
                      <span className={vd.cls}>{vd.label}</span>
                    </div>
                    <span className="progress-text">
                      {p.count} cards · {v?.cards ?? 0} with data
                    </span>
                  </div>
                  <button className="btn-insights" aria-label="Insights" onClick={() => setOpenInsights({ id: p.id, title: p.title })}>
                    📊
                  </button>
                </div>
              );
            })}
            {playlists.length === 0 && <p className="sec-empty">No playlists yet.</p>}
          </section>
        )}

        {tab === "students" && (
          <section className="dash-sec">
            <div className="seg-filter">
              {(["all", "at-risk", "ahead"] as SegFilter[]).map((f) => (
                <button key={f} className={`seg-chip ${segFilter === f ? "on" : ""}`} onClick={() => setSegFilter(f)}>
                  {f === "all" ? "All" : f === "at-risk" ? "Need help" : "Ahead"}
                </button>
              ))}
            </div>
            <div className="roster-head student-grid">
              <span>Student</span>
              <span>Done</span>
              <span>Correct</span>
              <span>Median</span>
            </div>
            {shownStudents.map((s) => {
              const seg = SEG[segmentOf(s, medAns)];
              const open = expanded === s.userId;
              return (
                <div key={s.userId}>
                  <button className="roster-row student-grid student-row" onClick={() => setExpanded(open ? null : s.userId)}>
                    <span className="roster-name">
                      {s.displayName ?? "Student"} <span className={`seg ${seg.cls}`}>{seg.label}</span>
                    </span>
                    <span>{s.answered}</span>
                    <span>{s.accuracy ?? "—"}%</span>
                    <span>{fmtTime(s.medianMs)}</span>
                  </button>
                  {open && (
                    <div className="student-detail">
                      <p className="tool-note">
                        {s.answered} cards answered · {s.accuracy ?? 0}% correct · {fmtTime(s.medianMs)} median
                        {s.lastAt ? ` · last active ${new Date(s.lastAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            {shownStudents.length === 0 && <p className="sec-empty">No students in this filter.</p>}
          </section>
        )}
      </div>

      {openInsights && (
        <PlaylistInsights playlistId={openInsights.id} title={openInsights.title} onClose={() => setOpenInsights(null)} />
      )}
    </div>
  );
}
