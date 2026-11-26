import { useEffect, useState } from "react";
import type { CardInsight } from "../types";
import { getPlaylistInsights } from "../api";

interface Props {
  playlistId: number;
  title: string;
  onClose: () => void;
}

function fmtTime(ms: number | null): string {
  if (ms == null) return "—";
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function level(rate: number | null): string {
  if (rate == null) return "nodata";
  if (rate >= 85) return "easy";
  if (rate <= 40) return "hard";
  return "ok";
}

export default function PlaylistInsights({ playlistId, title, onClose }: Props) {
  const [cards, setCards] = useState<CardInsight[] | null>(null);

  useEffect(() => {
    let alive = true;
    getPlaylistInsights(playlistId).then((c) => alive && setCards(c));
    return () => {
      alive = false;
    };
  }, [playlistId]);

  const withData = (cards ?? []).filter((c) => c.correctRate != null);
  const easy = withData.filter((c) => (c.correctRate ?? 0) >= 85).length;
  const hard = withData.filter((c) => (c.correctRate ?? 100) <= 40).length;
  const verdict =
    withData.length === 0
      ? "No data yet"
      : hard > easy && hard >= withData.length / 3
        ? "Leaning hard"
        : easy > hard && easy >= withData.length / 3
          ? "Leaning easy"
          : "Balanced";
  const verdictClass = verdict === "Leaning hard" ? "hard" : verdict === "Leaning easy" ? "easy" : "";

  return (
    <div className="tool-scrim" onClick={onClose}>
      <div className="insights" onClick={(e) => e.stopPropagation()}>
        <header className="insights-head">
          <button className="back" onClick={onClose} aria-label="Close">
            ← Close
          </button>
          <span className="insights-title">{title} · insights</span>
        </header>

        {cards == null ? (
          <p className="tool-note">Loading…</p>
        ) : (
          <>
            <div className="insights-summary">
              <span className={`verdict ${verdictClass}`}>{verdict}</span>
              <span className="tool-note">
                {withData.length}/{cards.length} cards with attempts
              </span>
            </div>

            <div className="insight-list">
              {cards.map((c) => (
                <div className={`insight-card lvl-${level(c.correctRate)}`} key={c.postId}>
                  <div className="insight-top">
                    <span className="insight-pos">#{c.position}</span>
                    <span className="insight-prompt">{c.prompt}</span>
                  </div>

                  {c.attempts === 0 ? (
                    <p className="tool-note">No attempts yet.</p>
                  ) : (
                    <>
                      <div className="insight-metrics">
                        <span className="metric">
                          <b>{c.correctRate}%</b> correct
                        </span>
                        <span className="metric">
                          <b>{fmtTime(c.medianMs)}</b> median
                        </span>
                        <span className="metric muted">
                          {c.attempts} att · {c.students} students
                        </span>
                      </div>

                      {c.distractors.length > 0 && (
                        <div className="distractors">
                          {c.distractors.map((d) => {
                            const trap = !d.isCorrect && d.pickRate >= 40;
                            return (
                              <div
                                className={`distractor ${d.isCorrect ? "ok" : trap ? "trap" : ""}`}
                                key={d.choiceId}
                              >
                                <span className="dkey">{d.choiceId.toUpperCase()}</span>
                                <span className="dtext">{d.text}</span>
                                <span className="dbar">
                                  <span style={{ width: `${d.pickRate}%` }} />
                                </span>
                                <span className="drate">{d.pickRate}%</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
