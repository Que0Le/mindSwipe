import { useCallback, useEffect, useMemo, useState } from "react";
import type { ClassTopic, Identity, Playlist, Segment, StudentEffort } from "../types";
import {
  getClassTopics,
  getClasses,
  getPlaylistVerdicts,
  getPlaylists,
  getStudentClasses,
  getStudentEffort,
  getStudentSubjectEffort,
  getTeacherSubjects,
} from "../api";
import { buildInsights, cohortMedianAnswered, segmentOf } from "../conclusions";
import PlaylistInsights from "./PlaylistInsights";
import StudentDetail from "./StudentDetail";

interface Props {
  identity: Identity;
  onClose: () => void;
}

type Tab = "overview" | "content" | "students";

// Each tab is a real sub-route of /teach (linkable, refreshable, back-able).
const TAB_PATH: Record<Tab, string> = {
  overview: "/teach/overview",
  content: "/teach/content",
  students: "/teach/students",
};
function tabFromPath(): Tab {
  if (window.location.pathname === "/teach/content") return "content";
  if (window.location.pathname === "/teach/students") return "students";
  return "overview";
}
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
  const [tab, setTab] = useState<Tab>(() => tabFromPath());

  const goTab = useCallback((t: Tab) => {
    setTab(t);
    if (tabFromPath() !== t) window.history.pushState({ ms: "teach" }, "", TAB_PATH[t]);
  }, []);

  useEffect(() => {
    const onPop = () => setTab(tabFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (window.location.pathname === "/teach") {
      window.history.replaceState({ ms: "teach" }, "", TAB_PATH[tab]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [students, setStudents] = useState<StudentEffort[]>([]);
  const [topics, setTopics] = useState<ClassTopic[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [verdicts, setVerdicts] = useState<Map<number, { cards: number; verdict: string }>>(new Map());
  const [openInsights, setOpenInsights] = useState<{ id: number; title: string } | null>(null);
  const [selected, setSelected] = useState<StudentEffort | null>(null);
  const [segFilter, setSegFilter] = useState<SegFilter>("all");
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [studentClasses, setStudentClasses] = useState<Record<string, { classId: number; className: string }>>({});
  const [classFilter, setClassFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [lens, setLens] = useState<string>("all"); // "all" subjects, or one subject
  const [subjectEffort, setSubjectEffort] = useState<Record<string, { answered: number; accuracy: number | null; medianMs: number | null }>>({});

  const tenantId = identity.tenantId;
  useEffect(() => {
    if (tenantId == null) return;
    getStudentEffort(tenantId).then(setStudents);
    getClassTopics().then(setTopics);
    getPlaylists().then(setPlaylists);
    getClasses(tenantId).then(setClasses);
    getStudentClasses().then(setStudentClasses);
    getTeacherSubjects().then(setSubjects);
    getPlaylistVerdicts().then((v) =>
      setVerdicts(new Map(v.map((x) => [x.playlistId, { cards: x.cards, verdict: x.verdict }])))
    );
  }, [tenantId]);

  // Subject lens: reload per-subject effort when a subject is selected.
  useEffect(() => {
    if (tenantId == null || lens === "all") return;
    getStudentSubjectEffort(tenantId, lens).then(setSubjectEffort);
  }, [tenantId, lens]);

  // Students re-scoped by the lens (a subject teacher sees subject-only numbers).
  const scopedStudents = useMemo(() => {
    if (lens === "all") return students;
    return students.map((s) =>
      s.role !== "student"
        ? s
        : {
            ...s,
            answered: subjectEffort[s.userId]?.answered ?? 0,
            accuracy: subjectEffort[s.userId]?.accuracy ?? null,
            medianMs: subjectEffort[s.userId]?.medianMs ?? null,
          }
    );
  }, [lens, students, subjectEffort]);

  const scopedTopics = useMemo(() => (lens === "all" ? topics : topics.filter((t) => t.subject === lens)), [lens, topics]);

  const pupils = useMemo(() => scopedStudents.filter((s) => s.role === "student"), [scopedStudents]);
  const medAns = useMemo(() => cohortMedianAnswered(scopedStudents), [scopedStudents]);
  const playlistVerdicts = useMemo(
    () => playlists.map((p) => ({ title: p.title, verdict: (verdicts.get(p.id)?.verdict ?? "nodata") as "easy" | "hard" | "balanced" | "nodata" })),
    [playlists, verdicts]
  );
  const insights = useMemo(
    () => buildInsights(scopedStudents, scopedTopics, lens === "all" ? playlistVerdicts : []),
    [scopedStudents, scopedTopics, playlistVerdicts, lens]
  );

  const withAcc = pupils.filter((s) => s.accuracy != null);
  const avgAcc = withAcc.length ? Math.round(withAcc.reduce((a, s) => a + (s.accuracy ?? 0), 0) / withAcc.length) : 0;
  const segCount = (seg: Segment) => pupils.filter((s) => segmentOf(s, medAns) === seg).length;

  const signalTopics = scopedTopics.filter((t) => t.attempts >= 5 && t.accuracy != null);
  const weakest = [...signalTopics].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)).slice(0, 4);
  const strongest = [...signalTopics].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0)).slice(0, 4);

  const q = search.trim().toLowerCase();
  const shownStudents = pupils
    .filter((s) => {
      const seg = segmentOf(s, medAns);
      if (segFilter === "at-risk" && !(seg === "at-risk" || seg === "inactive")) return false;
      if (segFilter === "ahead" && seg !== "ahead") return false;
      // Class filter is ignored while searching, so search spans all classes.
      if (!q && classFilter !== "all" && studentClasses[s.userId]?.classId !== classFilter) return false;
      if (q && !(s.displayName ?? "").toLowerCase().includes(q)) return false;
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
          <button key={t} className={`teach-tab ${tab === t ? "on" : ""}`} onClick={() => goTab(t)}>
            {t === "overview" ? "Overview" : t === "content" ? "Content" : "Students"}
          </button>
        ))}
      </nav>

      <div className="teach-body">
        {subjects.length > 0 && (
          <div className="lens-bar">
            <span className="lens-label">Viewing as:</span>
            <button className={`seg-chip ${lens === "all" ? "on" : ""}`} onClick={() => setLens("all")}>
              Homeroom · all subjects
            </button>
            {subjects.map((sub) => (
              <button key={sub} className={`seg-chip ${lens === sub ? "on" : ""}`} onClick={() => setLens(sub)}>
                {sub} teacher
              </button>
            ))}
          </div>
        )}

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
            <input
              className="student-search"
              type="search"
              placeholder="Search students (all classes)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search students"
            />
            {classes.length > 0 && (
              <div className="seg-filter">
                <button
                  className={`seg-chip ${classFilter === "all" ? "on" : ""}`}
                  onClick={() => setClassFilter("all")}
                >
                  All classes
                </button>
                {classes.map((c) => (
                  <button
                    key={c.id}
                    className={`seg-chip ${classFilter === c.id ? "on" : ""}`}
                    onClick={() => setClassFilter(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
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
              return (
                <button
                  key={s.userId}
                  className="roster-row student-grid student-row"
                  onClick={() => setSelected(s)}
                >
                  <span className="roster-name">
                    {s.displayName ?? "Student"}
                    {studentClasses[s.userId] && <span className="class-tag">{studentClasses[s.userId].className}</span>}
                    <span className={`seg ${seg.cls}`}>{seg.label}</span>
                  </span>
                  <span>{s.answered}</span>
                  <span>{s.accuracy ?? "—"}%</span>
                  <span>{fmtTime(s.medianMs)}</span>
                </button>
              );
            })}
            {shownStudents.length === 0 && <p className="sec-empty">No students in this filter.</p>}
          </section>
        )}
      </div>

      {openInsights && (
        <PlaylistInsights playlistId={openInsights.id} title={openInsights.title} onClose={() => setOpenInsights(null)} />
      )}
      {selected && <StudentDetail student={selected} cohortMedAns={medAns} onClose={() => setSelected(null)} />}
    </div>
  );
}
