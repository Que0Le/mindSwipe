import { useCallback, useEffect, useRef, useState } from "react";
import type { Draft, DraftInput, Identity } from "../types";
import {
  createDraft,
  getMyDrafts,
  getReviewQueue,
  reviewPost,
  updateDraft,
} from "../api";
import CardStudio from "./CardStudio";

interface Props {
  identity: Identity;
  onClose: () => void;
}

type Tab = "studio" | "write" | "drafts" | "queue";

// Each tab is a real sub-route of /author, so it's linkable, refreshable and
// unwound by the browser Back button.
const TAB_PATH: Record<Tab, string> = {
  studio: "/author/studio",
  write: "/author/write",
  drafts: "/author/cards",
  queue: "/author/review",
};
function tabFromPath(): Tab {
  switch (window.location.pathname) {
    case "/author/write":
      return "write";
    case "/author/cards":
      return "drafts";
    case "/author/review":
      return "queue";
    default:
      return "studio";
  }
}

// A choice in the editor carries a stable local id (c1, c2, …) so marking it
// correct survives add/remove of other rows.
interface EditChoice {
  id: string;
  text: string;
}

const DIFFS = [
  { v: 1, label: "1 · leicht" },
  { v: 2, label: "2 · mittel" },
  { v: 3, label: "3 · schwer" },
];

function freshChoices(): EditChoice[] {
  return [
    { id: "c1", text: "" },
    { id: "c2", text: "" },
    { id: "c3", text: "" },
    { id: "c4", text: "" },
  ];
}

function statusBadge(s: Draft["status"]): { label: string; cls: string } {
  if (s === "approved") return { label: "Published", cls: "ok" };
  if (s === "rejected") return { label: "Rejected", cls: "bad" };
  return { label: "In review", cls: "wait" };
}

export default function AuthorDashboard({ identity, onClose }: Props) {
  const tenantId = identity.tenantId as number; // gated: this page only opens for members
  const isStaff = identity.role === "teacher" || identity.role === "tenant_admin";

  const [tab, setTab] = useState<Tab>(() => tabFromPath());

  // Switch tab + push its URL (so /author/playlists etc. is a real, back-able link).
  const goTab = useCallback((t: Tab) => {
    setTab(t);
    if (tabFromPath() !== t) window.history.pushState({ ms: "author" }, "", TAB_PATH[t]);
  }, []);

  // Keep the active tab in sync when the user navigates history (Back/Forward).
  useEffect(() => {
    const onPop = () => setTab(tabFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Land on a canonical tab URL so the address bar always reflects the tab.
  useEffect(() => {
    if (window.location.pathname === "/author") {
      window.history.replaceState({ ms: "author" }, "", TAB_PATH[tab]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- editor state ---------------------------------------------------------
  const [editingId, setEditingId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState<EditChoice[]>(freshChoices);
  const [correct, setCorrect] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [visibility, setVisibility] = useState<"tenant" | "public">("tenant");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const choiceSeq = useRef(5); // next id suffix after the four starters

  // --- lists ----------------------------------------------------------------
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [queue, setQueue] = useState<Draft[]>([]);
  const [rejecting, setRejecting] = useState<{ id: number; note: string } | null>(null);

  const reloadDrafts = useCallback(async () => setDrafts(await getMyDrafts()), []);
  const reloadQueue = useCallback(async () => {
    if (isStaff) setQueue(await getReviewQueue(tenantId));
  }, [isStaff, tenantId]);

  useEffect(() => {
    void reloadDrafts();
    void reloadQueue();
  }, [reloadDrafts, reloadQueue]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setSubject("");
    setTopic("");
    setDifficulty(1);
    setPrompt("");
    setChoices(freshChoices());
    setCorrect([]);
    setExplanation("");
    setVisibility("tenant");
    setFormError(null);
    choiceSeq.current = 5;
  }, []);

  const loadIntoEditor = useCallback((d: Draft) => {
    setEditingId(d.id);
    setSubject(d.subject);
    setTopic(d.topic);
    setDifficulty(d.difficulty || 1);
    setPrompt(d.prompt);
    const ec = d.choices.map((c) => ({ id: c.id, text: c.text }));
    setChoices(ec.length ? ec : freshChoices());
    setCorrect(d.correct);
    setExplanation(d.explanation);
    setVisibility(d.visibility);
    setFormError(null);
    // keep new local ids clear of existing ones
    const maxN = ec.reduce((m, c) => Math.max(m, Number.parseInt(c.id.replace(/\D/g, ""), 10) || 0), 0);
    choiceSeq.current = maxN + 1;
    goTab("write");
  }, [goTab]);

  function setChoiceText(id: string, text: string) {
    setChoices((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
  }
  function addChoice() {
    const id = `c${choiceSeq.current++}`;
    setChoices((prev) => [...prev, { id, text: "" }]);
  }
  function removeChoice(id: string) {
    setChoices((prev) => (prev.length <= 2 ? prev : prev.filter((c) => c.id !== id)));
    setCorrect((prev) => prev.filter((cid) => cid !== id));
  }
  function toggleCorrect(id: string) {
    setCorrect((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function submit() {
    setFormError(null);
    const kept = choices.map((c) => ({ id: c.id, text: c.text.trim() })).filter((c) => c.text);
    const keptIds = new Set(kept.map((c) => c.id));
    const keptCorrect = correct.filter((id) => keptIds.has(id));
    if (!prompt.trim()) return setFormError("Add a question prompt.");
    if (kept.length < 2) return setFormError("Add at least two answer choices.");
    if (keptCorrect.length < 1) return setFormError("Mark at least one choice correct.");

    const input: DraftInput = {
      subject,
      topic,
      difficulty,
      prompt,
      choices: kept,
      correct: keptCorrect,
      explanation,
      visibility,
    };
    setSaving(true);
    const saved = editingId ? await updateDraft(editingId, input) : await createDraft(tenantId, input);
    setSaving(false);
    if (!saved) return setFormError("Could not save — check your connection and try again.");
    resetForm();
    await Promise.all([reloadDrafts(), reloadQueue()]);
    goTab("drafts");
  }

  async function approve(id: number) {
    if (await reviewPost(id, "approved")) {
      await Promise.all([reloadQueue(), reloadDrafts()]);
    }
  }
  async function confirmReject() {
    if (!rejecting) return;
    if (await reviewPost(rejecting.id, "rejected", rejecting.note)) {
      setRejecting(null);
      await Promise.all([reloadQueue(), reloadDrafts()]);
    }
  }

  const pendingCount = queue.length;
  const canAuthor = identity.role === "author" || isStaff;

  return (
    <div className="author">
      <header className="topbar teach-top">
        <button className="back" onClick={onClose} aria-label="Back to dashboard">
          ← Home
        </button>
        <span className="swipe-title">Authoring</span>
        <span className="author-tenant">{identity.displayName}</span>
      </header>

      <nav className="author-tabs">
        <button className={tab === "studio" ? "on" : ""} onClick={() => goTab("studio")}>
          Studio
        </button>
        <button className={tab === "write" ? "on" : ""} onClick={() => goTab("write")}>
          {editingId ? "Edit card" : "Write"}
        </button>
        <button className={tab === "drafts" ? "on" : ""} onClick={() => goTab("drafts")}>
          My cards{drafts.length ? ` (${drafts.length})` : ""}
        </button>
        {isStaff && (
          <button className={tab === "queue" ? "on" : ""} onClick={() => goTab("queue")}>
            Review{pendingCount ? ` (${pendingCount})` : ""}
          </button>
        )}
      </nav>

      <div className="author-body">
        {!canAuthor && (
          <p className="sec-empty">Your role can't author cards. Ask a teacher for access.</p>
        )}

        {/* ---- Write / Edit ---- */}
        {tab === "write" && canAuthor && (
          <section className="author-form">
            {editingId && (
              <p className="edit-note">
                Editing a card — saving sends it back for review.
                <button className="link" onClick={resetForm}>
                  Start a new one instead
                </button>
              </p>
            )}
            <label className="fld">
              <span>Question prompt</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Welches Organell erzeugt den Großteil des ATP einer Zelle?"
                rows={2}
              />
            </label>

            <div className="fld-row">
              <label className="fld">
                <span>Subject</span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Biologie" />
              </label>
              <label className="fld">
                <span>Topic</span>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Zellbiologie" />
              </label>
              <label className="fld fld-sm">
                <span>Difficulty</span>
                <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                  {DIFFS.map((d) => (
                    <option key={d.v} value={d.v}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="fld">
              <span>Answer choices — tick the correct one(s)</span>
              <div className="choices-edit">
                {choices.map((c, i) => (
                  <div className="choice-edit" key={c.id}>
                    <input
                      type="checkbox"
                      checked={correct.includes(c.id)}
                      onChange={() => toggleCorrect(c.id)}
                      aria-label={`Mark choice ${i + 1} correct`}
                    />
                    <input
                      className="choice-text"
                      value={c.text}
                      onChange={(e) => setChoiceText(c.id, e.target.value)}
                      placeholder={`Choice ${i + 1}`}
                    />
                    <button
                      className="choice-x"
                      onClick={() => removeChoice(c.id)}
                      disabled={choices.length <= 2}
                      aria-label={`Remove choice ${i + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button className="link" onClick={addChoice}>
                + Add choice
              </button>
            </div>

            <label className="fld">
              <span>Explanation (shown after answering)</span>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Why the correct answer is correct."
                rows={2}
              />
            </label>

            <div className="fld-row">
              <label className="fld fld-sm">
                <span>Visibility</span>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as "tenant" | "public")}
                >
                  <option value="tenant">My school only</option>
                  <option value="public">Public network</option>
                </select>
              </label>
            </div>

            {formError && <p className="form-error">{formError}</p>}

            <div className="author-actions">
              <button className="btn-primary" onClick={submit} disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save & resubmit" : "Submit for review"}
              </button>
              {editingId && (
                <button className="btn-ghost" onClick={resetForm} disabled={saving}>
                  Cancel
                </button>
              )}
            </div>
          </section>
        )}

        {/* ---- My cards ---- */}
        {tab === "drafts" && (
          <section className="author-list">
            {drafts.length === 0 && <p className="sec-empty">No cards yet. Write your first one.</p>}
            {drafts.map((d) => {
              const b = statusBadge(d.status);
              return (
                <div className="draft-row" key={d.id}>
                  <div className="draft-main">
                    <div className="draft-head">
                      <span className={`mod-badge ${b.cls}`}>{b.label}</span>
                      <span className="draft-meta">
                        {d.subject || "—"} · {d.topic || "—"}
                      </span>
                    </div>
                    <p className="draft-prompt">{d.prompt}</p>
                    {d.status === "rejected" && d.reviewNote && (
                      <p className="draft-note">Reviewer: {d.reviewNote}</p>
                    )}
                  </div>
                  {d.status !== "approved" && (
                    <button className="btn-go" onClick={() => loadIntoEditor(d)}>
                      Edit
                    </button>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ---- Studio (explorer · editor · preview) ---- */}
        {tab === "studio" && canAuthor && <CardStudio tenantId={tenantId} />}


        {/* ---- Review queue (staff) ---- */}
        {tab === "queue" && isStaff && (
          <section className="author-list">
            {queue.length === 0 && <p className="sec-empty">Nothing waiting for review. 🎉</p>}
            {queue.map((d) => (
              <div className="review-card" key={d.id}>
                <div className="review-head">
                  <span className="draft-meta">
                    {d.subject || "—"} · {d.topic || "—"} · diff {d.difficulty}
                  </span>
                  <span className="review-vis">{d.visibility === "public" ? "Public" : "School"}</span>
                </div>
                <p className="review-prompt">{d.prompt}</p>
                <ul className="review-choices">
                  {d.choices.map((c) => (
                    <li key={c.id} className={d.correct.includes(c.id) ? "correct" : ""}>
                      {d.correct.includes(c.id) ? "✓ " : ""}
                      {c.text}
                    </li>
                  ))}
                </ul>
                {d.explanation && <p className="review-expl">{d.explanation}</p>}

                {rejecting?.id === d.id ? (
                  <div className="reject-box">
                    <input
                      autoFocus
                      value={rejecting.note}
                      onChange={(e) => setRejecting({ id: d.id, note: e.target.value })}
                      placeholder="Reason (sent to the author)…"
                    />
                    <button className="btn-reject" onClick={confirmReject}>
                      Confirm reject
                    </button>
                    <button className="btn-ghost" onClick={() => setRejecting(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="review-actions">
                    <button className="btn-approve" onClick={() => approve(d.id)}>
                      ✓ Approve
                    </button>
                    <button className="btn-reject" onClick={() => setRejecting({ id: d.id, note: "" })}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
