import { useEffect, useState } from "react";
import type { StudentEffort, StudentTopic } from "../types";
import { getStudentTopics } from "../api";
import { studentConclusion } from "../conclusions";

interface Props {
  student: StudentEffort;
  cohortMedAns: number;
  onClose: () => void;
}

function fmtTime(ms: number | null): string {
  if (ms == null || ms === 0) return "—";
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(s < 10 ? 1 : 0)}s` : `${Math.floor(s / 60)}m`;
}

function accClass(a: number | null): string {
  if (a == null) return "";
  if (a >= 80) return "good";
  if (a <= 50) return "bad";
  return "";
}

export default function StudentDetail({ student, cohortMedAns, onClose }: Props) {
  const [topics, setTopics] = useState<StudentTopic[] | null>(null);

  useEffect(() => {
    let alive = true;
    getStudentTopics(student.userId).then((t) => alive && setTopics(t));
    return () => {
      alive = false;
    };
  }, [student.userId]);

  const insights = topics ? studentConclusion(student, topics, cohortMedAns) : [];
  const sig = (topics ?? []).filter((t) => t.answered >= 2);

  return (
    <div className="tool-scrim" onClick={onClose}>
      <div className="insights" onClick={(e) => e.stopPropagation()}>
        <header className="insights-head">
          <button className="back" onClick={onClose} aria-label="Close">
            ← Close
          </button>
          <span className="insights-title">{student.displayName ?? "Student"}</span>
        </header>

        <div className="insight-list">
          <div className="stat-row">
            <div className="stat">
              <b>{student.answered}</b>
              <span>answered</span>
            </div>
            <div className="stat">
              <b>{student.accuracy ?? "—"}%</b>
              <span>correct</span>
            </div>
            <div className="stat">
              <b>{fmtTime(student.medianMs)}</b>
              <span>median</span>
            </div>
          </div>

          <section className="conclusions">
            {insights.map((i, k) => (
              <div className={`insight-row ${i.kind}`} key={k}>
                <span className="insight-ico">{i.kind === "warn" ? "⚠️" : i.kind === "good" ? "✅" : "ℹ️"}</span>
                <span>{i.text}</span>
              </div>
            ))}
          </section>

          <h3 className="mini-title">By topic</h3>
          {topics == null ? (
            <p className="tool-note">Loading…</p>
          ) : sig.length === 0 ? (
            <p className="tool-note">No topic has enough attempts yet.</p>
          ) : (
            sig.map((t) => (
              <div className="topic-row" key={`${t.subject}-${t.topic}`}>
                <span className={`topic-acc ${accClass(t.accuracy)}`}>{t.accuracy}%</span>
                <span className="topic-name">{t.topic}</span>
                <span className="tool-note" style={{ marginLeft: "auto" }}>
                  {t.answered}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
