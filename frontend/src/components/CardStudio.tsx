import { useCallback, useEffect, useMemo, useState } from "react";
import type { Choice, Draft, DraftInput, Playlist, PlaylistItem, PoolCard } from "../types";
import {
  addToPlaylist,
  createDraft,
  getApprovedCards,
  getMyDrafts,
  getPlaylistItems,
  getPlaylists,
  removeFromPlaylist,
  updateDraft,
} from "../api";

// v1 "card studio": an explorer (My cards + playlists) on the left, a compact
// editor in the middle, a live preview on the right. Deliberately low-chrome
// and dense — the point is to see and move many cards, not decoration.

interface Props {
  tenantId: number;
}

const DIFF = ["—", "leicht", "mittel", "schwer"];

interface EditChoice {
  id: string;
  text: string;
}
const blankChoices = (): EditChoice[] => ["c1", "c2", "c3", "c4"].map((id) => ({ id, text: "" }));

// ○ draft · ● published · ✗ rejected
function dot(s: Draft["status"]): string {
  return s === "approved" ? "●" : s === "rejected" ? "✗" : "○";
}

// A card we can show in the preview (owned draft or any approved pool card).
interface ViewCard {
  prompt: string;
  subject: string;
  topic: string;
  difficulty: number;
  choices: Choice[];
  correct: string[];
  explanation: string;
}

export default function CardStudio({ tenantId }: Props) {
  const [cards, setCards] = useState<Draft[]>([]);
  const [pool, setPool] = useState<PoolCard[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [items, setItems] = useState<Record<number, PlaylistItem[]>>({});
  const [openPl, setOpenPl] = useState<Set<number>>(new Set());
  const [myOpen, setMyOpen] = useState(true);

  const [sel, setSel] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; cardId: number; plId?: number } | null>(null);
  const [addPick, setAddPick] = useState(false); // "add to playlist" submenu open

  // editor fields (only meaningful when the selected card is one of mine)
  const [editId, setEditId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState<EditChoice[]>(blankChoices);
  const [correct, setCorrect] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [visibility, setVisibility] = useState<"tenant" | "public">("tenant");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mine = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const viewById = useMemo(() => {
    const m = new Map<number, ViewCard>();
    for (const p of pool) m.set(p.id, p);
    for (const c of cards)
      m.set(c.id, {
        prompt: c.prompt,
        subject: c.subject,
        topic: c.topic,
        difficulty: c.difficulty,
        choices: c.choices,
        correct: c.correct,
        explanation: c.explanation,
      });
    return m;
  }, [pool, cards]);

  const reloadCards = useCallback(async () => setCards(await getMyDrafts()), []);
  const reloadPlaylists = useCallback(async () => {
    const pls = await getPlaylists();
    setPlaylists(pls);
    const entries = await Promise.all(pls.map((p) => getPlaylistItems(p.id).then((it) => [p.id, it] as const)));
    setItems(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    void reloadCards();
    void reloadPlaylists();
    void getApprovedCards(tenantId).then(setPool);
  }, [reloadCards, reloadPlaylists, tenantId]);

  // close any open context menu on a global click
  useEffect(() => {
    const close = () => {
      setMenu(null);
      setAddPick(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  function newCard() {
    setSel(null);
    setEditId(null);
    setSubject("");
    setTopic("");
    setDifficulty(1);
    setPrompt("");
    setChoices(blankChoices());
    setCorrect([]);
    setExplanation("");
    setVisibility("tenant");
    setErr(null);
  }

  function open(cardId: number) {
    setSel(cardId);
    setErr(null);
    const c = mine.get(cardId);
    if (c) {
      setEditId(c.id);
      setSubject(c.subject);
      setTopic(c.topic);
      setDifficulty(c.difficulty || 1);
      setPrompt(c.prompt);
      setChoices(c.choices.length ? c.choices.map((x) => ({ id: x.id, text: x.text })) : blankChoices());
      setCorrect(c.correct);
      setExplanation(c.explanation);
      setVisibility(c.visibility);
    } else {
      setEditId(null); // not mine → preview only
    }
  }

  const editable = sel === null || mine.has(sel);

  async function save(submit: boolean) {
    const kept = choices.map((c) => ({ id: c.id, text: c.text.trim() })).filter((c) => c.text);
    const keep = new Set(kept.map((c) => c.id));
    const cor = correct.filter((id) => keep.has(id));
    if (!prompt.trim()) return setErr("Add a prompt.");
    if (kept.length < 2) return setErr("Add at least two choices.");
    if (cor.length < 1) return setErr("Mark a correct choice.");
    const input: DraftInput = { subject, topic, difficulty, prompt, choices: kept, correct: cor, explanation, visibility };
    setSaving(true);
    const saved = editId ? await updateDraft(editId, input) : await createDraft(tenantId, input);
    setSaving(false);
    if (!saved) return setErr("Could not save.");
    setErr(submit ? null : "Saved as draft.");
    await reloadCards();
    setEditId(saved.id);
    setSel(saved.id);
  }

  async function addTo(plId: number, cardId: number) {
    await addToPlaylist(plId, cardId, items[plId]?.length ?? 0);
    await reloadPlaylists();
  }
  async function removeFrom(plId: number, cardId: number) {
    await removeFromPlaylist(plId, cardId);
    await reloadPlaylists();
  }

  // live preview source: the editor when editing, else the stored card
  const preview: ViewCard | null = useMemo(() => {
    if (editable && (sel !== null || prompt))
      return {
        prompt,
        subject,
        topic,
        difficulty,
        choices: choices.filter((c) => c.text.trim()),
        correct,
        explanation,
      };
    return sel !== null ? viewById.get(sel) ?? null : null;
  }, [editable, sel, prompt, subject, topic, difficulty, choices, correct, explanation, viewById]);

  function rowMenu(e: React.MouseEvent, cardId: number, plId?: number) {
    e.preventDefault();
    e.stopPropagation();
    setAddPick(false);
    setMenu({ x: e.clientX, y: e.clientY, cardId, plId });
  }

  return (
    <div className="studio" onContextMenu={(e) => e.preventDefault()}>
      {/* EXPLORER */}
      <aside className="st-tree">
        <div className="st-toolbar">
          <button onClick={newCard}>+ New card</button>
        </div>
        <div className="st-group" onClick={() => setMyOpen((o) => !o)}>
          {myOpen ? "▾" : "▸"} My cards ({cards.length})
        </div>
        {myOpen &&
          cards.map((c) => (
            <div
              key={c.id}
              className={`st-file ${sel === c.id ? "on" : ""}`}
              onClick={() => open(c.id)}
              onContextMenu={(e) => rowMenu(e, c.id)}
              title={c.prompt}
            >
              <span className={`st-dot s-${c.status}`}>{dot(c.status)}</span>
              {c.prompt || "(untitled)"}
            </div>
          ))}

        <div className="st-group">Playlists</div>
        {playlists.map((p) => {
          const isOpen = openPl.has(p.id);
          return (
            <div key={p.id}>
              <div
                className="st-folder"
                onClick={() =>
                  setOpenPl((s) => {
                    const n = new Set(s);
                    n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                    return n;
                  })
                }
              >
                {isOpen ? "▾" : "▸"} {p.title} <span className="st-count">{p.count}</span>
              </div>
              {isOpen &&
                (items[p.id] ?? []).map((it) => (
                  <div
                    key={it.id}
                    className={`st-file nested ${sel === it.id ? "on" : ""}`}
                    onClick={() => open(it.id)}
                    onContextMenu={(e) => rowMenu(e, it.id, p.id)}
                    title={it.prompt}
                  >
                    {it.prompt}
                  </div>
                ))}
            </div>
          );
        })}
      </aside>

      {/* EDITOR */}
      <section className="st-editor">
        {!editable ? (
          <p className="st-note">Read-only — this card isn't one of yours. Use ▸ to preview it.</p>
        ) : (
          <>
            <textarea
              className="st-prompt"
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Question prompt…"
            />
            <div className="st-row">
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic" />
              <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                <option value={1}>1·leicht</option>
                <option value={2}>2·mittel</option>
                <option value={3}>3·schwer</option>
              </select>
            </div>
            <div className="st-choices">
              {choices.map((c, i) => (
                <div className="st-choice" key={c.id}>
                  <input
                    type="checkbox"
                    checked={correct.includes(c.id)}
                    onChange={() =>
                      setCorrect((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))
                    }
                  />
                  <input
                    value={c.text}
                    onChange={(e) =>
                      setChoices((p) => p.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))
                    }
                    placeholder={`Choice ${i + 1}`}
                  />
                  <button
                    onClick={() => {
                      setChoices((p) => (p.length <= 2 ? p : p.filter((x) => x.id !== c.id)));
                      setCorrect((p) => p.filter((x) => x !== c.id));
                    }}
                    disabled={choices.length <= 2}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="st-link"
                onClick={() => setChoices((p) => [...p, { id: `c${Date.now()}`, text: "" }])}
              >
                + choice
              </button>
            </div>
            <textarea
              className="st-expl"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explanation (shown after answering)"
            />
            <div className="st-save">
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as "tenant" | "public")}>
                <option value="tenant">My school</option>
                <option value="public">Public</option>
              </select>
              {err && <span className="st-err">{err}</span>}
              <span className="st-spacer" />
              <button onClick={() => save(false)} disabled={saving}>
                Save draft
              </button>
              <button className="st-primary" onClick={() => save(true)} disabled={saving}>
                {editId ? "Save & submit" : "Submit"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* PREVIEW */}
      <aside className="st-preview">
        <div className="st-pv-label">Preview</div>
        {!preview ? (
          <p className="st-note">Pick or start a card.</p>
        ) : (
          <div className="st-card">
            <div className="st-card-meta">
              {preview.subject || "—"} · {DIFF[preview.difficulty] ?? "—"}
            </div>
            <p className="st-card-q">{preview.prompt || "(empty)"}</p>
            <ul className="st-card-choices">
              {preview.choices.map((ch) => (
                <li key={ch.id} className={preview.correct.includes(ch.id) ? "ok" : ""}>
                  {preview.correct.includes(ch.id) ? "✓ " : ""}
                  {ch.text}
                </li>
              ))}
            </ul>
            {preview.explanation && <p className="st-card-expl">{preview.explanation}</p>}
          </div>
        )}
      </aside>

      {/* CONTEXT MENU */}
      {menu && (
        <div className="st-menu" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { open(menu.cardId); setMenu(null); }}>Open</button>
          {menu.plId != null && (
            <button onClick={() => { void removeFrom(menu.plId!, menu.cardId); setMenu(null); }}>
              Remove from playlist
            </button>
          )}
          <div className="st-sub">
            <button onClick={() => setAddPick((v) => !v)}>Add to playlist ▸</button>
            {addPick && (
              <div className="st-submenu">
                {playlists.length === 0 && <span className="st-note">No playlists</span>}
                {playlists.map((p) => (
                  <button
                    key={p.id}
                    disabled={(items[p.id] ?? []).some((it) => it.id === menu.cardId)}
                    onClick={() => { void addTo(p.id, menu.cardId); setMenu(null); }}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
