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

// Card studio v2: explorer + MULTIPLE open tabs (each its own editor state,
// with a dirty dot) + live preview. Low-chrome and dense.

interface Props {
  tenantId: number;
}

const DIFF = ["—", "leicht", "mittel", "schwer"];

interface EChoice {
  id: string;
  text: string;
}
const blank = (): EState => ({
  editId: null,
  subject: "",
  topic: "",
  difficulty: 1,
  prompt: "",
  choices: ["c1", "c2", "c3", "c4"].map((id) => ({ id, text: "" })),
  correct: [],
  explanation: "",
  visibility: "tenant",
});

// One open tab's editable contents.
interface EState {
  editId: number | null;
  subject: string;
  topic: string;
  difficulty: number;
  prompt: string;
  choices: EChoice[];
  correct: string[];
  explanation: string;
  visibility: "tenant" | "public";
}

function fromDraft(d: Draft): EState {
  return {
    editId: d.id,
    subject: d.subject,
    topic: d.topic,
    difficulty: d.difficulty || 1,
    prompt: d.prompt,
    choices: d.choices.length ? d.choices.map((c) => ({ id: c.id, text: c.text })) : blank().choices,
    correct: d.correct,
    explanation: d.explanation,
    visibility: d.visibility,
  };
}

function dot(s: Draft["status"]): string {
  return s === "approved" ? "●" : s === "rejected" ? "✗" : "○";
}

interface ViewCard {
  prompt: string;
  subject: string;
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

  // tabs: an ordered list of keys, each with current + baseline state
  const [order, setOrder] = useState<string[]>([]);
  const [state, setState] = useState<Record<string, EState>>({});
  const [base, setBase] = useState<Record<string, string>>({}); // key -> JSON baseline
  const [active, setActive] = useState<string | null>(null);
  const [viewId, setViewId] = useState<number | null>(null); // non-owned preview
  const [newSeq, setNewSeq] = useState(1);

  const [menu, setMenu] = useState<{ x: number; y: number; cardId: number; plId?: number } | null>(null);
  const [addPick, setAddPick] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mine = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const viewById = useMemo(() => {
    const m = new Map<number, ViewCard>();
    for (const p of pool) m.set(p.id, p);
    for (const c of cards) m.set(c.id, c);
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

  useEffect(() => {
    const close = () => {
      setMenu(null);
      setAddPick(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const cur = active ? state[active] : null;
  const dirty = (key: string) => base[key] !== JSON.stringify(state[key]);

  function addTab(key: string, s: EState) {
    setState((m) => ({ ...m, [key]: s }));
    setBase((m) => ({ ...m, [key]: JSON.stringify(s) }));
    setOrder((o) => (o.includes(key) ? o : [...o, key]));
    setActive(key);
    setViewId(null);
    setErr(null);
  }

  function openCard(id: number) {
    const c = mine.get(id);
    if (!c) {
      setViewId(id); // not mine → preview only
      setActive(null);
      return;
    }
    const key = `card:${id}`;
    if (order.includes(key)) {
      setActive(key);
      setViewId(null);
      return;
    }
    addTab(key, fromDraft(c));
  }

  function newCard() {
    const key = `new:${newSeq}`;
    setNewSeq((n) => n + 1);
    addTab(key, blank());
  }

  function closeTab(key: string) {
    setOrder((o) => {
      const i = o.indexOf(key);
      const next = o.filter((k) => k !== key);
      if (active === key) setActive(next[i] ?? next[i - 1] ?? null);
      return next;
    });
    setState((m) => {
      const n = { ...m };
      delete n[key];
      return n;
    });
    setBase((m) => {
      const n = { ...m };
      delete n[key];
      return n;
    });
  }

  function patch(p: Partial<EState>) {
    if (!active) return;
    setState((m) => ({ ...m, [active]: { ...m[active], ...p } }));
  }

  async function save(submit: boolean) {
    if (!active || !cur) return;
    const kept = cur.choices.map((c) => ({ id: c.id, text: c.text.trim() })).filter((c) => c.text);
    const keep = new Set(kept.map((c) => c.id));
    const cor = cur.correct.filter((id) => keep.has(id));
    if (!cur.prompt.trim()) return setErr("Add a prompt.");
    if (kept.length < 2) return setErr("Add at least two choices.");
    if (cor.length < 1) return setErr("Mark a correct choice.");
    const input: DraftInput = {
      subject: cur.subject,
      topic: cur.topic,
      difficulty: cur.difficulty,
      prompt: cur.prompt,
      choices: kept,
      correct: cor,
      explanation: cur.explanation,
      visibility: cur.visibility,
    };
    setSaving(true);
    const saved = cur.editId ? await updateDraft(cur.editId, input) : await createDraft(tenantId, input);
    setSaving(false);
    if (!saved) return setErr("Could not save.");
    setErr(submit ? null : "Saved as draft.");
    await reloadCards();
    // bind the tab to the saved id and mark it clean
    const newState: EState = { ...cur, editId: saved.id };
    const newKey = `card:${saved.id}`;
    setState((m) => {
      const n = { ...m };
      delete n[active];
      n[newKey] = newState;
      return n;
    });
    setBase((m) => {
      const n = { ...m };
      delete n[active];
      n[newKey] = JSON.stringify(newState);
      return n;
    });
    setOrder((o) => o.map((k) => (k === active ? newKey : k)));
    setActive(newKey);
  }

  async function addTo(plId: number, cardId: number) {
    await addToPlaylist(plId, cardId, items[plId]?.length ?? 0);
    await reloadPlaylists();
  }
  async function removeFrom(plId: number, cardId: number) {
    await removeFromPlaylist(plId, cardId);
    await reloadPlaylists();
  }

  const preview: ViewCard | null = useMemo(() => {
    if (cur)
      return {
        prompt: cur.prompt,
        subject: cur.subject,
        difficulty: cur.difficulty,
        choices: cur.choices.filter((c) => c.text.trim()),
        correct: cur.correct,
        explanation: cur.explanation,
      };
    return viewId != null ? viewById.get(viewId) ?? null : null;
  }, [cur, viewId, viewById]);

  function rowMenu(e: React.MouseEvent, cardId: number, plId?: number) {
    e.preventDefault();
    e.stopPropagation();
    setAddPick(false);
    setMenu({ x: e.clientX, y: e.clientY, cardId, plId });
  }

  const tabTitle = (key: string) => state[key]?.prompt?.slice(0, 22) || "(untitled)";

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
              className={`st-file ${active === `card:${c.id}` || viewId === c.id ? "on" : ""}`}
              onClick={() => openCard(c.id)}
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
                    className={`st-file nested ${active === `card:${it.id}` || viewId === it.id ? "on" : ""}`}
                    onClick={() => openCard(it.id)}
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

      {/* EDITOR with tab strip */}
      <section className="st-editor">
        {order.length > 0 && (
          <div className="st-tabs">
            {order.map((key) => (
              <div key={key} className={`st-tab ${active === key ? "on" : ""}`} onClick={() => { setActive(key); setViewId(null); }}>
                <span className="st-tab-dot">{dirty(key) ? "•" : ""}</span>
                {tabTitle(key)}
                <button className="st-tab-x" onClick={(e) => { e.stopPropagation(); closeTab(key); }}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {!cur ? (
          <p className="st-note">
            {viewId != null ? "Read-only — not one of your cards." : "Pick a card, or start a new one."}
          </p>
        ) : (
          <div className="st-form">
            <textarea className="st-prompt" rows={2} value={cur.prompt} onChange={(e) => patch({ prompt: e.target.value })} placeholder="Question prompt…" />
            <div className="st-row">
              <input value={cur.subject} onChange={(e) => patch({ subject: e.target.value })} placeholder="Subject" />
              <input value={cur.topic} onChange={(e) => patch({ topic: e.target.value })} placeholder="Topic" />
              <select value={cur.difficulty} onChange={(e) => patch({ difficulty: Number(e.target.value) })}>
                <option value={1}>1·leicht</option>
                <option value={2}>2·mittel</option>
                <option value={3}>3·schwer</option>
              </select>
            </div>
            <div className="st-choices">
              {cur.choices.map((c, i) => (
                <div className="st-choice" key={c.id}>
                  <input
                    type="checkbox"
                    checked={cur.correct.includes(c.id)}
                    onChange={() =>
                      patch({ correct: cur.correct.includes(c.id) ? cur.correct.filter((x) => x !== c.id) : [...cur.correct, c.id] })
                    }
                  />
                  <input
                    value={c.text}
                    onChange={(e) => patch({ choices: cur.choices.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)) })}
                    placeholder={`Choice ${i + 1}`}
                  />
                  <button
                    onClick={() =>
                      patch({
                        choices: cur.choices.length <= 2 ? cur.choices : cur.choices.filter((x) => x.id !== c.id),
                        correct: cur.correct.filter((x) => x !== c.id),
                      })
                    }
                    disabled={cur.choices.length <= 2}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="st-link" onClick={() => patch({ choices: [...cur.choices, { id: `c${Date.now()}`, text: "" }] })}>
                + choice
              </button>
            </div>
            <textarea className="st-expl" rows={2} value={cur.explanation} onChange={(e) => patch({ explanation: e.target.value })} placeholder="Explanation (shown after answering)" />
            <div className="st-save">
              <select value={cur.visibility} onChange={(e) => patch({ visibility: e.target.value as "tenant" | "public" })}>
                <option value="tenant">My school</option>
                <option value="public">Public</option>
              </select>
              {err && <span className="st-err">{err}</span>}
              <span className="st-spacer" />
              <button onClick={() => save(false)} disabled={saving}>
                Save draft
              </button>
              <button className="st-primary" onClick={() => save(true)} disabled={saving}>
                {cur.editId ? "Save & submit" : "Submit"}
              </button>
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
          <button onClick={() => { openCard(menu.cardId); setMenu(null); }}>Open</button>
          {menu.plId != null && (
            <button onClick={() => { void removeFrom(menu.plId!, menu.cardId); setMenu(null); }}>Remove from playlist</button>
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
