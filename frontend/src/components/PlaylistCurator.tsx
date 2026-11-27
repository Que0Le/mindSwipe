import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import type { Playlist, PlaylistItem, PoolCard } from "../types";
import {
  addToPlaylist,
  createPlaylist,
  deletePlaylist,
  getApprovedCards,
  getPlaylistItems,
  getPlaylists,
  removeFromPlaylist,
  updatePlaylist,
} from "../api";

interface Props {
  tenantId: number;
  myId: string;
  isStaff: boolean;
}

type Filter = "all" | "selected" | "unselected";
type SortKey = "name" | "created";

const DIFF_LABEL = ["—", "leicht", "mittel", "schwer"];

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function PlaylistCurator({ tenantId, myId, isStaff }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [pool, setPool] = useState<PoolCard[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [members, setMembers] = useState<PlaylistItem[]>([]);

  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<1 | -1>(-1); // newest first by default
  const [expanded, setExpanded] = useState<number | null>(null);

  // new-playlist form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"tenant" | "public">("tenant");
  const [creating, setCreating] = useState(false);

  // per-row kebab menu + metadata edit / delete
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [editing, setEditing] = useState<Playlist | null>(null);
  const [eTitle, setETitle] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eVis, setEVis] = useState<"tenant" | "public">("tenant");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState<Playlist | null>(null);

  const curatable = useMemo(
    () => playlists.filter((p) => isStaff || p.createdBy === myId),
    [playlists, isStaff, myId]
  );

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);
  const nextPos = useMemo(
    () => members.reduce((max, m) => Math.max(max, m.position), -1) + 1,
    [members]
  );

  const reloadPlaylists = useCallback(async () => {
    setPlaylists(await getPlaylists());
  }, []);
  const reloadMembers = useCallback(async (id: number) => {
    setMembers(await getPlaylistItems(id));
  }, []);

  useEffect(() => {
    void reloadPlaylists();
    void getApprovedCards(tenantId).then(setPool);
  }, [reloadPlaylists, tenantId]);

  const openPlaylist = useCallback(
    async (id: number) => {
      setSelectedId(id);
      setFilter("all");
      setExpanded(null);
      await reloadMembers(id);
    },
    [reloadMembers]
  );

  async function create() {
    if (!title.trim()) return;
    setCreating(true);
    const pl = await createPlaylist(tenantId, title, description, visibility);
    setCreating(false);
    if (!pl) return;
    setTitle("");
    setDescription("");
    setVisibility("tenant");
    await reloadPlaylists();
    await openPlaylist(pl.id);
  }

  function startEdit(p: Playlist) {
    setMenuFor(null);
    setEditing(p);
    setETitle(p.title);
    setEDesc(p.description ?? "");
    setEVis(p.visibility);
  }

  async function saveEdit() {
    if (!editing || !eTitle.trim()) return;
    setSavingEdit(true);
    const ok = await updatePlaylist(editing.id, { title: eTitle, description: eDesc, visibility: eVis });
    setSavingEdit(false);
    if (ok) {
      setEditing(null);
      await reloadPlaylists();
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await deletePlaylist(deleting.id);
    if (ok) {
      if (selectedId === deleting.id) {
        setSelectedId(null);
        setMembers([]);
      }
      setDeleting(null);
      await reloadPlaylists();
    }
  }

  async function toggle(cardId: number) {
    if (selectedId == null) return;
    if (memberIds.has(cardId)) {
      await removeFromPlaylist(selectedId, cardId);
    } else {
      await addToPlaylist(selectedId, cardId, nextPos);
    }
    await reloadMembers(selectedId);
    await reloadPlaylists();
  }

  const visible = useMemo(() => {
    const rows = pool.filter((c) => {
      if (filter === "selected") return memberIds.has(c.id);
      if (filter === "unselected") return !memberIds.has(c.id);
      return true;
    });
    const sorted = rows.slice().sort((a, b) => {
      const cmp =
        sortKey === "name"
          ? a.prompt.localeCompare(b.prompt)
          : a.createdAt.localeCompare(b.createdAt);
      return cmp * sortDir;
    });
    return sorted;
  }, [pool, filter, memberIds, sortKey, sortDir]);

  function setSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? 1 : -1);
    }
  }
  const sortArrow = (key: SortKey) => (sortKey === key ? (sortDir === 1 ? " ▲" : " ▼") : "");

  const selected = curatable.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="curator2">
      {/* LEFT: create + playlist list */}
      <aside className="cur-left">
        <div className="np-form">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New playlist title…" />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as "tenant" | "public")}>
            <option value="tenant">My school</option>
            <option value="public">Public</option>
          </select>
          <button className="btn-primary np-create" onClick={create} disabled={creating || !title.trim()}>
            {creating ? "Creating…" : "Create"}
          </button>
        </div>

        {curatable.length === 0 ? (
          <p className="sec-empty">No playlists yet.</p>
        ) : (
          <div className="cur-pl-list">
            {curatable.map((p) => (
              <div key={p.id} className={`cur-pl ${p.id === selectedId ? "on" : ""}`}>
                <button className="cur-pl-main" onClick={() => openPlaylist(p.id)}>
                  <span className="cur-pl-title">{p.title}</span>
                  <span className="cur-pl-count">{p.count}</span>
                </button>
                <div className="cur-pl-kebab">
                  <button
                    className="kebab-btn"
                    aria-label="Playlist options"
                    aria-haspopup="menu"
                    aria-expanded={menuFor === p.id}
                    onClick={() => setMenuFor(menuFor === p.id ? null : p.id)}
                  >
                    ⋮
                  </button>
                  {menuFor === p.id && (
                    <>
                      <div className="menu-scrim" onClick={() => setMenuFor(null)} />
                      <div className="kebab-menu" role="menu">
                        <button role="menuitem" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button
                          role="menuitem"
                          className="danger"
                          onClick={() => {
                            setMenuFor(null);
                            setDeleting(p);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* RIGHT: the question pool table */}
      <section className="cur-right">
        {!selected ? (
          <p className="sec-empty cur-hint">Select a playlist on the left to curate its cards.</p>
        ) : (
          <>
            <div className="cur-toolbar">
              <div className="cur-filters">
                {(["all", "selected", "unselected"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    className={`seg-chip ${filter === f ? "on" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All" : f === "selected" ? "Selected" : "Not selected"}
                  </button>
                ))}
              </div>
              <span className="cur-count">
                {members.length} in “{selected.title}” · {pool.length} approved
              </span>
            </div>

            <div className="cur-table">
              <table className="qtable">
                <colgroup>
                  <col className="col-check" />
                  <col className="col-q" />
                  <col className="col-subj" />
                  <col className="col-topic" />
                  <col className="col-diff" />
                  <col className="col-date" />
                </colgroup>
                <thead>
                  <tr>
                    <th aria-label="Selected" />
                    <th>
                      <button className={`qh-sort ${sortKey === "name" ? "on" : ""}`} onClick={() => setSort("name")}>
                        Question{sortArrow("name")}
                      </button>
                    </th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Diff</th>
                    <th>
                      <button className={`qh-sort ${sortKey === "created" ? "on" : ""}`} onClick={() => setSort("created")}>
                        Created{sortArrow("created")}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr className="qempty">
                      <td colSpan={6}>No cards match this filter.</td>
                    </tr>
                  ) : (
                    visible.map((c) => {
                      const on = memberIds.has(c.id);
                      const open = expanded === c.id;
                      return (
                        <Fragment key={c.id}>
                          {/* Row body toggles expand; the checkbox (only) toggles selection. */}
                          <tr
                            className={`qrow ${on ? "sel" : ""} ${open ? "open" : ""}`}
                            onClick={() => setExpanded(open ? null : c.id)}
                          >
                            <td className="col-check">
                              <button
                                className={`qcheck ${on ? "on" : ""}`}
                                role="checkbox"
                                aria-checked={on}
                                aria-label={on ? "Remove from playlist" : "Add to playlist"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggle(c.id);
                                }}
                              >
                                {on ? "✓" : ""}
                              </button>
                            </td>
                            <td className="col-q">
                              <span className="qprompt">{c.prompt}</span>
                            </td>
                            <td className="qmeta">
                              <span>{c.subject || "—"}</span>
                            </td>
                            <td className="qmeta">
                              <span>{c.topic || "—"}</span>
                            </td>
                            <td className="qmeta">
                              <span>{DIFF_LABEL[c.difficulty] ?? "—"}</span>
                            </td>
                            <td className="qmeta">
                              <span>{fmtDate(c.createdAt)}</span>
                            </td>
                          </tr>
                          {open && (
                            <tr className="qdetail-row">
                              <td colSpan={6}>
                                <div className="qdetail">
                                  <ul className="qchoices">
                                    {c.choices.map((ch) => (
                                      <li key={ch.id} className={c.correct.includes(ch.id) ? "correct" : ""}>
                                        {c.correct.includes(ch.id) ? "✓ " : ""}
                                        {ch.text}
                                      </li>
                                    ))}
                                  </ul>
                                  {c.explanation && <p className="qexpl">{c.explanation}</p>}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Edit playlist metadata */}
      {editing && (
        <div className="pl-modal-scrim" onClick={() => setEditing(null)}>
          <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit playlist</h3>
            <label className="pl-field">
              <span>Title</span>
              <input value={eTitle} onChange={(e) => setETitle(e.target.value)} autoFocus />
            </label>
            <label className="pl-field">
              <span>Description</span>
              <input value={eDesc} onChange={(e) => setEDesc(e.target.value)} placeholder="Optional" />
            </label>
            <label className="pl-field">
              <span>Visibility</span>
              <select value={eVis} onChange={(e) => setEVis(e.target.value as "tenant" | "public")}>
                <option value="tenant">My school</option>
                <option value="public">Public</option>
              </select>
            </label>
            <div className="pl-modal-actions">
              <button className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={saveEdit} disabled={savingEdit || !eTitle.trim()}>
                {savingEdit ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="pl-modal-scrim" onClick={() => setDeleting(null)}>
          <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete playlist?</h3>
            <p className="pl-modal-text">
              “{deleting.title}” and its card list will be removed. The cards themselves stay — this can’t be
              undone.
            </p>
            <div className="pl-modal-actions">
              <button className="btn-ghost" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button className="btn-reject" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
