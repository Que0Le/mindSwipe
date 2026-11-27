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

// Card studio (unified): a playlist rail, a STABLE topic→card explorer, and the
// editor + preview. Topics are folders, cards are files. Selecting a playlist
// doesn't restructure the tree — it highlights that playlist's cards green;
// double-clicking a card's left tag-zone toggles its membership.

interface Props {
  tenantId: number;
  isStaff: boolean;
}

const DIFF = ["—", "leicht", "mittel", "schwer"];
const NO_TOPIC = "(No topic)";

// Each playlist is auto-assigned a colour from this palette; its members and
// markers use that colour (later this can become a stored, user-picked colour).
const PALETTE = ["#7c6cff", "#2bb3a3", "#e0893b", "#d9534f", "#4a9fe0", "#c56bd6", "#6cc24a", "#d4b73a"];

interface EChoice {
  id: string;
  text: string;
}
const blankChoices = (): EChoice[] => ["c1", "c2", "c3", "c4"].map((id) => ({ id, text: "" }));

// Approved cards get no dot; pending ("unconfirmed") → yellow, rejected → ✗.
function dot(s?: Draft["status"]): string {
  return s === "pending" ? "●" : s === "rejected" ? "✗" : "";
}

interface Row {
  id: number;
  topic: string;
  prompt: string;
  subject: string;
  difficulty: number;
  status?: Draft["status"];
  mine: boolean;
}
interface ViewCard {
  prompt: string;
  subject: string;
  difficulty: number;
  choices: Choice[];
  correct: string[];
  explanation: string;
}

export default function CardStudio({ tenantId, isStaff }: Props) {
  const [cards, setCards] = useState<Draft[]>([]);
  const [pool, setPool] = useState<PoolCard[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [items, setItems] = useState<Record<number, PlaylistItem[]>>({});

  const [plId, setPlId] = useState<number | null>(null); // selected playlist (null = All cards)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set()); // topics collapsed (open by default)

  // editor (single card)
  const [sel, setSel] = useState<number | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState<EChoice[]>(blankChoices);
  const [correct, setCorrect] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");
  const [visibility, setVisibility] = useState<"tenant" | "public">("tenant");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [menu, setMenu] = useState<{ x: number; y: number; cardId: number } | null>(null);
  const [addPick, setAddPick] = useState(false);

  const mine = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const viewById = useMemo(() => {
    const m = new Map<number, ViewCard>();
    for (const p of pool) m.set(p.id, p);
    for (const c of cards) m.set(c.id, c);
    return m;
  }, [pool, cards]);

  // Merge approved pool + my drafts (mine wins), group by topic, sort.
  const groups = useMemo(() => {
    const byId = new Map<number, Row>();
    for (const p of pool)
      byId.set(p.id, { id: p.id, topic: p.topic || NO_TOPIC, prompt: p.prompt, subject: p.subject, difficulty: p.difficulty, mine: false });
    for (const c of cards)
      byId.set(c.id, { id: c.id, topic: c.topic || NO_TOPIC, prompt: c.prompt, subject: c.subject, difficulty: c.difficulty, status: c.status, mine: true });
    const g = new Map<string, Row[]>();
    for (const r of byId.values()) {
      const arr = g.get(r.topic) ?? [];
      arr.push(r);
      g.set(r.topic, arr);
    }
    return [...g.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([t, rows]) => ({ topic: t, rows: rows.sort((x, y) => x.prompt.localeCompare(y.prompt)) }));
  }, [pool, cards]);

  const memberIds = useMemo(
    () => (plId != null ? new Set((items[plId] ?? []).map((it) => it.id)) : new Set<number>()),
    [plId, items]
  );

  const colorOf = useCallback(
    (id: number) => {
      const i = playlists.findIndex((p) => p.id === id);
      return PALETTE[(i < 0 ? id : i) % PALETTE.length];
    },
    [playlists]
  );

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

  function open(id: number) {
    setSel(id);
    setErr(null);
    // Prefer my own draft; staff may also edit any approved tenant card (loaded
    // from the pool). Anything else is preview-only.
    const c = mine.get(id);
    const pc = c ? null : pool.find((p) => p.id === id);
    const src = c ?? (isStaff ? pc : null);
    if (src) {
      setEditId(id);
      setSubject(src.subject);
      setTopic(src.topic);
      setDifficulty(src.difficulty || 1);
      setPrompt(src.prompt);
      setChoices(src.choices.length ? src.choices.map((x) => ({ id: x.id, text: x.text })) : blankChoices());
      setCorrect(src.correct);
      setExplanation(src.explanation);
      setVisibility(src.visibility);
    } else {
      setEditId(null);
    }
  }

  const editable = sel === null || mine.has(sel) || (isStaff && pool.some((p) => p.id === sel));

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

  async function toggleMember(id: number) {
    if (plId == null) return;
    if (memberIds.has(id)) await removeFromPlaylist(plId, id);
    else await addToPlaylist(plId, id, items[plId]?.length ?? 0);
    await reloadPlaylists();
  }
  async function addTo(p: number, id: number) {
    await addToPlaylist(p, id, items[p]?.length ?? 0);
    await reloadPlaylists();
  }
  async function removeFrom(p: number, id: number) {
    await removeFromPlaylist(p, id);
    await reloadPlaylists();
  }

  const preview: ViewCard | null = useMemo(() => {
    if (editable && (sel !== null || prompt))
      return { prompt, subject, difficulty, choices: choices.filter((c) => c.text.trim()), correct, explanation };
    return sel !== null ? viewById.get(sel) ?? null : null;
  }, [editable, sel, prompt, subject, difficulty, choices, correct, explanation, viewById]);

  const toggleTopic = (t: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });

  // playlist rail stats
  const stats = (id: number) => {
    const its = items[id] ?? [];
    const topics = new Set(its.map((it) => it.topic || NO_TOPIC)).size;
    return `${its.length} cards · ${topics} topic${topics === 1 ? "" : "s"}`;
  };

  const picking = plId != null; // membership mode on
  const plColor = plId != null ? colorOf(plId) : null;

  return (
    <div className="studio studio4" onContextMenu={(e) => e.preventDefault()}>
      {/* RAIL */}
      <aside className="st-rail">
        <button className={`st-rail-item ${plId === null ? "on" : ""}`} onClick={() => setPlId(null)}>
          All cards
        </button>
        {playlists.map((p) => (
          <button
            key={p.id}
            className={`st-rail-item ${plId === p.id ? "on" : ""}`}
            style={plId === p.id ? { borderColor: colorOf(p.id), background: colorOf(p.id) + "22" } : undefined}
            onClick={() => setPlId(p.id)}
          >
            <span className="st-rail-title">
              <span className="st-swatch" style={{ background: colorOf(p.id) }} />
              {p.title}
            </span>
            <span className="st-rail-stats">{stats(p.id)}</span>
          </button>
        ))}
      </aside>

      {/* EXPLORER (topic folders → cards) */}
      <aside className="st-tree">
        <div className="st-toolbar">
          <button onClick={newCard}>+ New card</button>
          {picking && <span className="st-hint">tick to add / remove</span>}
        </div>
        {groups.map(({ topic: t, rows }) => {
          const memberCount = picking ? rows.filter((r) => memberIds.has(r.id)).length : 0;
          const isOpen = !collapsed.has(t);
          return (
            <div key={t}>
              <div
                className={`st-folder ${memberCount ? "has-member" : ""}`}
                style={memberCount && plColor ? { boxShadow: `inset 2px 0 0 ${plColor}` } : undefined}
                onClick={() => toggleTopic(t)}
              >
                {isOpen ? "▾" : "▸"} {t} <span className="st-count">{rows.length}</span>
                {memberCount > 0 && (
                  <span className="st-badge" style={{ background: plColor ?? undefined }}>
                    {memberCount}
                  </span>
                )}
              </div>
              {isOpen &&
                rows.map((r) => {
                  const member = memberIds.has(r.id);
                  return (
                    <div
                      key={r.id}
                      className={`st-file ${sel === r.id ? "on" : ""}`}
                      style={member && plColor ? { background: plColor + "22" } : undefined}
                      onClick={() => open(r.id)}
                      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setAddPick(false); setMenu({ x: e.clientX, y: e.clientY, cardId: r.id }); }}
                      title={r.prompt}
                    >
                      <input
                        type="checkbox"
                        className="st-cb"
                        checked={member}
                        disabled={!picking}
                        style={{ accentColor: plColor ?? undefined }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => void toggleMember(r.id)}
                      />
                      {dot(r.status) && <span className={`st-dot s-${r.status}`}>{dot(r.status)}</span>}
                      <span className="st-fname">{r.prompt || "(untitled)"}</span>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </aside>

      {/* EDITOR */}
      <section className="st-editor">
        {!editable ? (
          <p className="st-note">Read-only — not one of your cards.</p>
        ) : (
          <div className="st-form">
            <textarea className="st-prompt" rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Question prompt…" />
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
                    onChange={() => setCorrect((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                  />
                  <input value={c.text} onChange={(e) => setChoices((p) => p.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))} placeholder={`Choice ${i + 1}`} />
                  <button
                    onClick={() => { setChoices((p) => (p.length <= 2 ? p : p.filter((x) => x.id !== c.id))); setCorrect((p) => p.filter((x) => x !== c.id)); }}
                    disabled={choices.length <= 2}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="st-link" onClick={() => setChoices((p) => [...p, { id: `c${Date.now()}`, text: "" }])}>+ choice</button>
            </div>
            <textarea className="st-expl" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explanation (shown after answering)" />
            <div className="st-save">
              <select value={visibility} onChange={(e) => setVisibility(e.target.value as "tenant" | "public")}>
                <option value="tenant">My school</option>
                <option value="public">Public</option>
              </select>
              {err && <span className="st-err">{err}</span>}
              <span className="st-spacer" />
              <button onClick={() => save(false)} disabled={saving}>Save draft</button>
              <button className="st-primary" onClick={() => save(true)} disabled={saving}>{editId ? "Save & submit" : "Submit"}</button>
            </div>
          </div>
        )}
      </section>

      {/* PREVIEW */}
      <aside className="st-preview">
        <div className="st-pv-label">Preview</div>
        {!preview ? (
          <p className="st-note">Pick or start a card.</p>
        ) : (
          <div className="st-card">
            <div className="st-card-meta">{preview.subject || "—"} · {DIFF[preview.difficulty] ?? "—"}</div>
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

      {/* CONTEXT MENU (secondary add/remove to any playlist) */}
      {menu && (
        <div className="st-menu" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { open(menu.cardId); setMenu(null); }}>Open</button>
          <div className="st-sub">
            <button onClick={() => setAddPick((v) => !v)}>Add / remove ▸</button>
            {addPick && (
              <div className="st-submenu">
                {playlists.map((p) => {
                  const inIt = (items[p.id] ?? []).some((it) => it.id === menu.cardId);
                  return (
                    <button key={p.id} onClick={() => { void (inIt ? removeFrom(p.id, menu.cardId) : addTo(p.id, menu.cardId)); setMenu(null); }}>
                      {inIt ? "✓ " : "+ "}
                      {p.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
