import { useState, useMemo, useRef, useEffect } from "react";
import {
  X, Search, Plus, ChevronRight, Users, Clock, CheckCircle,
  XCircle, AlertCircle, Edit3, Trash2, Copy, UserPlus, Filter,
  ChevronDown, MoreHorizontal, Check, ArrowUpRight, ArrowDownRight,
  Dumbbell, Calendar,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg:      "#000000",
  sidebar: "#0f0f12",
  card:    "#141416",
  card2:   "#1a1a1f",
  brd:     "#222226",
  brd2:    "#2a2a30",
  t1:      "#ffffff",
  t2:      "#8a8a94",
  t3:      "#444450",
  cyan:    "#4d7fff",
  cyanD:   "rgba(77,127,255,0.12)",
  cyanB:   "rgba(77,127,255,0.28)",
  red:     "#ff4d6d",
  redD:    "rgba(255,77,109,0.12)",
  redB:    "rgba(255,77,109,0.28)",
  green:   "#22c55e",
  greenD:  "rgba(34,197,94,0.10)",
  greenB:  "rgba(34,197,94,0.28)",
  amber:   "#f59e0b",
  amberD:  "rgba(245,158,11,0.12)",
  amberB:  "rgba(245,158,11,0.28)",
  violet:  "#a855f7",
  violetD: "rgba(168,85,247,0.12)",
  violetB: "rgba(168,85,247,0.28)",
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";
const GRID = "1.8fr 120px 110px 90px 100px 88px";

/* ─── CSS ─────────────────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("cmm-css")) {
  const s = document.createElement("style");
  s.id = "cmm-css";
  s.textContent = `
    .cmm-row { transition: background .12s; cursor: pointer; }
    .cmm-row:hover { background: #1a1a1e !important; }
    .cmm-btn { font-family: 'DM Sans','Segoe UI',sans-serif; cursor: pointer; outline: none; border: none; transition: all .18s; display: inline-flex; align-items: center; gap: 6px; }
    .cmm-btn:hover  { transform: translateY(-1px); }
    .cmm-btn:active { transform: scale(.97); }
    .cmm-input { width:100%; background:rgba(255,255,255,0.03); border:1px solid #222226; color:#fff; font-size:13px; font-family:'DM Sans','Segoe UI',sans-serif; outline:none; border-radius:8px; padding:9px 12px; transition:all .18s; }
    .cmm-input:focus { border-color:rgba(77,127,255,0.4); background:rgba(77,127,255,0.04); }
    .cmm-input::placeholder { color:#444450; }
    .cmm-scr::-webkit-scrollbar { width:3px; }
    .cmm-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    @keyframes cmmFadeIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:none} }
    .cmm-panel { animation: cmmFadeIn .22s cubic-bezier(.16,1,.3,1) both; }
  `;
  document.head.appendChild(s);
}

/* ─── HELPERS ────────────────────────────────────────────────── */
function classTypeColor(name = "") {
  const n = name.toLowerCase();
  if (n.includes("hiit") || n.includes("boxing") || n.includes("kick")) return "#f59e0b";
  if (n.includes("yoga") || n.includes("pilates") || n.includes("flow")) return "#14b8a6";
  if (n.includes("strength") || n.includes("weight") || n.includes("conditioning")) return "#ff4d6d";
  if (n.includes("spin") || n.includes("cycle") || n.includes("cardio")) return "#6366f1";
  return "#4d7fff";
}

function fmtTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m || 0).padStart(2, "0")} ${period}`;
}

function capacityColor(booked, max) {
  if (!max) return C.t2;
  const pct = booked / max;
  if (pct >= 1) return C.red;
  if (pct >= 0.8) return C.amber;
  return C.green;
}

function ini(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

const BOOKING_STATUS = {
  booked:    { label: "Booked",    color: C.cyan,  bg: C.cyanD,  brd: C.cyanB  },
  attended:  { label: "Attended",  color: C.green, bg: C.greenD, brd: C.greenB },
  no_show:   { label: "No-show",   color: C.red,   bg: C.redD,   brd: C.redB   },
  cancelled: { label: "Cancelled", color: C.t3,    bg: "rgba(255,255,255,0.04)", brd: C.brd },
};

/* ─── STATS BAR ──────────────────────────────────────────────── */
function StatsBar({ classes, bookings }) {
  const totalClasses  = classes.length;
  const totalBookings = bookings.length;
  const attended      = bookings.filter(b => b.status === "attended").length;
  const noShows       = bookings.filter(b => b.status === "no_show").length;
  const fillRates     = classes.map(cls => {
    const cap = cls.max_capacity || 0;
    const bk  = (cls.attendee_ids || []).length;
    return cap > 0 ? bk / cap : 0;
  });
  const avgFill = fillRates.length > 0
    ? Math.round(fillRates.reduce((s, v) => s + v, 0) / fillRates.length * 100)
    : 0;
  const noShowRate = totalBookings > 0 ? Math.round(noShows / totalBookings * 100) : 0;

  const stats = [
    { label: "Total Classes",  val: totalClasses,   col: C.t1   },
    { label: "Total Bookings", val: totalBookings,  col: C.cyan  },
    { label: "Attendance",     val: attended,        col: C.green },
    { label: "Avg Fill Rate",  val: `${avgFill}%`,  col: avgFill >= 80 ? C.green : avgFill >= 50 ? C.amber : C.red },
    { label: "No-show Rate",   val: `${noShowRate}%`, col: noShowRate >= 30 ? C.red : noShowRate >= 15 ? C.amber : C.green },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "1px", background: C.brd, borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: "12px 16px", background: C.sidebar }}>
          <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{s.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── TABLE HEAD ─────────────────────────────────────────────── */
function TableHead({ sort, setSort }) {
  const cols = [
    { label: "Class",    key: "name"     },
    { label: "Time",     key: "time"     },
    { label: "Coach",    key: "coach"    },
    { label: "Capacity", key: "capacity" },
    { label: "Status",   key: null       },
    { label: "Actions",  key: null       },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, padding: "7px 16px", borderBottom: `1px solid ${C.brd}`, background: C.card, flexShrink: 0, fontFamily: FONT }}>
      {cols.map((c, i) => (
        <div key={i} onClick={() => c.key && setSort(c.key)}
          style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: sort === c.key ? C.t2 : C.t3, cursor: c.key ? "pointer" : "default", display: "flex", alignItems: "center", gap: 3, justifyContent: i === cols.length - 1 ? "flex-end" : "flex-start" }}>
          {c.label}{c.key && <ChevronDown style={{ width: 8, height: 8 }} />}
        </div>
      ))}
    </div>
  );
}

/* ─── CLASS ROW ──────────────────────────────────────────────── */
function ClassRow({ cls, isSelected, onSelect, onDuplicate, onDelete, bookings }) {
  const color    = classTypeColor(cls.name || "");
  const booked   = (cls.attendee_ids || []).length;
  const max      = cls.max_capacity || 0;
  const capColor = capacityColor(booked, max);
  const isFull   = max > 0 && booked >= max;
  const fillPct  = max > 0 ? Math.round(booked / max * 100) : 0;

  // Derive schedule string
  const schedLabel = (() => {
    const s = cls.schedule?.[0];
    if (!s) return "—";
    return `${s.day || ""} ${fmtTime(s.time || cls.time || "")}`.trim();
  })();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="cmm-row" onClick={() => onSelect(cls)}
      style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, padding: "11px 16px", alignItems: "center", background: isSelected ? "#1a1a1e" : "transparent", borderBottom: `1px solid ${C.brd}`, borderLeft: `2px solid ${isSelected ? C.cyan : "transparent"}`, fontFamily: FONT, position: "relative" }}>

      {/* Class name */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.cyan : C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.name || "Unnamed"}</div>
          {cls.class_type && <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{cls.class_type}</div>}
        </div>
      </div>

      {/* Time */}
      <div style={{ fontSize: 12, color: C.t2 }}>{schedLabel}</div>

      {/* Coach */}
      <div style={{ fontSize: 12, color: C.t2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.instructor || cls.coach_name || "—"}</div>

      {/* Capacity */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: capColor }}>{booked}</span>
          {max > 0 && <span style={{ fontSize: 11, color: C.t3 }}>/ {max}</span>}
        </div>
        {max > 0 && (
          <div style={{ height: 3, background: C.brd, borderRadius: 2, overflow: "hidden", width: 60 }}>
            <div style={{ width: `${fillPct}%`, height: "100%", background: capColor, borderRadius: 2 }} />
          </div>
        )}
      </div>

      {/* Status */}
      <div>
        <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
          background: isFull ? C.redD : booked > 0 ? C.greenD : C.cyanD,
          border: `1px solid ${isFull ? C.redB : booked > 0 ? C.greenB : C.cyanB}`,
          color: isFull ? C.red : booked > 0 ? C.green : C.cyan,
          whiteSpace: "nowrap" }}>
          {isFull ? "Full" : booked > 0 ? "Open" : "Empty"}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
        <div style={{ position: "relative" }}>
          <button className="cmm-btn" onClick={() => setMenuOpen(o => !o)}
            style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: `1px solid ${C.brd}`, color: C.t3, justifyContent: "center" }}>
            <MoreHorizontal style={{ width: 13, height: 13 }} />
          </button>
          {menuOpen && (<>
            <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 100, background: C.card2, border: `1px solid ${C.brd2}`, borderRadius: 9, overflow: "hidden", minWidth: 150, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
              {[
                { label: "Duplicate", icon: Copy,   color: C.t2, fn: () => { onDuplicate(cls); setMenuOpen(false); } },
                { label: "Delete",    icon: Trash2,  color: C.red, fn: () => { onDelete(cls.id); setMenuOpen(false); } },
              ].map(item => {
                const Ic = item.icon;
                return (
                  <button key={item.label} className="cmm-btn" onClick={item.fn}
                    style={{ width: "100%", justifyContent: "flex-start", padding: "9px 13px", background: "transparent", color: item.color, fontSize: 12, fontWeight: 600 }}
                    onMouseEnter={e => e.currentTarget.style.background = C.card}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Ic style={{ width: 12, height: 12 }} />{item.label}
                  </button>
                );
              })}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ─── ATTENDEE ROW ───────────────────────────────────────────── */
function AttendeeRow({ attendee, onStatusChange, onRemove }) {
  const st = BOOKING_STATUS[attendee.status] || BOOKING_STATUS.booked;
  const [changing, setChanging] = useState(false);

  async function changeStatus(newStatus) {
    setChanging(true);
    await onStatusChange(attendee.id, newStatus);
    setChanging(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: `1px solid ${C.brd}`, fontFamily: FONT }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: C.cyanD, border: `1px solid ${C.cyanB}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.cyan }}>
        {ini(attendee.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attendee.name || "Member"}</div>
        {attendee.email && <div style={{ fontSize: 10.5, color: C.t3 }}>{attendee.email}</div>}
      </div>
      <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: st.bg, border: `1px solid ${st.brd}`, color: st.color, whiteSpace: "nowrap", flexShrink: 0 }}>
        {st.label}
      </span>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {attendee.status !== "attended" && (
          <button className="cmm-btn" onClick={() => changeStatus("attended")} disabled={changing} title="Mark Attended"
            style={{ width: 24, height: 24, borderRadius: 6, background: C.greenD, border: `1px solid ${C.greenB}`, color: C.green, justifyContent: "center" }}>
            <Check style={{ width: 10, height: 10 }} />
          </button>
        )}
        {attendee.status !== "no_show" && (
          <button className="cmm-btn" onClick={() => changeStatus("no_show")} disabled={changing} title="Mark No-show"
            style={{ width: 24, height: 24, borderRadius: 6, background: C.redD, border: `1px solid ${C.redB}`, color: C.red, justifyContent: "center" }}>
            <XCircle style={{ width: 10, height: 10 }} />
          </button>
        )}
        <button className="cmm-btn" onClick={() => onRemove(attendee.id)} title="Remove"
          style={{ width: 24, height: 24, borderRadius: 6, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`, color: C.t3, justifyContent: "center" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.redB; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
          <X style={{ width: 10, height: 10 }} />
        </button>
      </div>
    </div>
  );
}

/* ─── CLASS DETAIL PANEL ─────────────────────────────────────── */
function ClassDetailPanel({ cls, bookings, allMemberships, onClose, onUpdateClass, onDeleteClass }) {
  const color  = classTypeColor(cls.name || "");
  const booked = (cls.attendee_ids || []).length;
  const max    = cls.max_capacity || 0;
  const fillPct = max > 0 ? Math.round(booked / max * 100) : 0;
  const capColor = capacityColor(booked, max);
  const isFull   = max > 0 && booked >= max;

  // Build local attendees from attendee_ids + bookings
  const [attendees, setAttendees] = useState(() => {
    const ids = cls.attendee_ids || [];
    return ids.map((id, i) => {
      const bk = bookings.find(b => b.client_id === id || b.user_id === id);
      const mb = allMemberships.find(m => m.user_id === id);
      return {
        id: id,
        name: bk?.client_name || mb?.user_name || `Member ${i + 1}`,
        email: bk?.client_email || mb?.user_email || "",
        status: bk?.status || "booked",
      };
    });
  });

  const [addSearch, setAddSearch] = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [saving, setSaving]       = useState(false);

  const attended = attendees.filter(a => a.status === "attended").length;
  const noShows  = attendees.filter(a => a.status === "no_show").length;

  async function handleStatusChange(attendeeId, newStatus) {
    setAttendees(prev => prev.map(a => a.id === attendeeId ? { ...a, status: newStatus } : a));
  }

  async function handleRemove(attendeeId) {
    const updated = (cls.attendee_ids || []).filter(id => id !== attendeeId);
    setSaving(true);
    await onUpdateClass(cls.id, { attendee_ids: updated });
    setAttendees(prev => prev.filter(a => a.id !== attendeeId));
    setSaving(false);
  }

  async function handleAddMember(member) {
    if (isFull) return;
    const id = member.user_id || member.id;
    if ((cls.attendee_ids || []).includes(id)) return;
    const updated = [...(cls.attendee_ids || []), id];
    setSaving(true);
    await onUpdateClass(cls.id, { attendee_ids: updated });
    setAttendees(prev => [...prev, { id, name: member.user_name || member.name || "Member", email: member.user_email || "", status: "booked" }]);
    setShowAdd(false);
    setAddSearch("");
    setSaving(false);
  }

  const schedLabel = (() => {
    const s = cls.schedule?.[0];
    if (!s) return "—";
    const days = cls.schedule.map(s => s.day).filter(Boolean).join(", ");
    return `${days} ${fmtTime(s.time || cls.time || "")}`.trim();
  })();

  const filteredMembers = (allMemberships || []).filter(m => {
    const name = (m.user_name || "").toLowerCase();
    const q    = addSearch.toLowerCase();
    return (!q || name.includes(q)) && !(cls.attendee_ids || []).includes(m.user_id);
  }).slice(0, 8);

  return (
    <div className="cmm-panel" style={{ width: 320, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.name}</div>
            </div>
            <div style={{ fontSize: 11.5, color: C.t2 }}>{schedLabel}</div>
            {(cls.instructor || cls.coach_name) && (
              <div style={{ fontSize: 11.5, color: C.t3, marginTop: 2 }}>Coach: {cls.instructor || cls.coach_name}</div>
            )}
          </div>
          <button className="cmm-btn" onClick={onClose}
            style={{ width: 26, height: 26, borderRadius: 7, background: "transparent", border: `1px solid ${C.brd}`, color: C.t3, justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
            <X style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* Capacity bar */}
        {max > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, color: C.t3 }}>Capacity</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: capColor }}>{booked}/{max} {isFull ? "• Full" : ""}</span>
            </div>
            <div style={{ height: 4, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${fillPct}%`, height: "100%", background: capColor, borderRadius: 2, transition: "width .4s" }} />
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12 }}>
          {[
            { label: "Booked",   val: booked - attended,   col: C.cyan  },
            { label: "Attended", val: attended,             col: C.green },
            { label: "No-show",  val: noShows,              col: noShows > 0 ? C.red : C.t3 },
          ].map((s, i) => (
            <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: C.card, border: `1px solid ${C.brd}`, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.col }}>{s.val}</div>
              <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendees header */}
      <div style={{ padding: "11px 16px 9px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Attendees ({attendees.length})</span>
        <button className="cmm-btn" onClick={() => setShowAdd(o => !o)} disabled={isFull}
          style={{ padding: "5px 10px", borderRadius: 7, background: isFull ? "rgba(255,255,255,0.03)" : C.cyanD, border: `1px solid ${isFull ? C.brd : C.cyanB}`, color: isFull ? C.t3 : C.cyan, fontSize: 11, fontWeight: 600, cursor: isFull ? "not-allowed" : "pointer" }}>
          <UserPlus style={{ width: 10, height: 10 }} />{isFull ? "Full" : "Add"}
        </button>
      </div>

      {/* Add member search */}
      {showAdd && (
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.brd}`, flexShrink: 0, background: C.card2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "7px 10px", marginBottom: 8 }}>
            <Search style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
            <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="Search members…" autoFocus
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.t1, fontSize: 12, fontFamily: FONT }} />
          </div>
          <div style={{ maxHeight: 160, overflowY: "auto" }}>
            {filteredMembers.length === 0 ? (
              <div style={{ fontSize: 11, color: C.t3, textAlign: "center", padding: "10px 0" }}>No members found</div>
            ) : filteredMembers.map(m => (
              <div key={m.user_id} onClick={() => handleAddMember(m)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 6px", borderRadius: 7, cursor: "pointer", transition: "background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.cyanD}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.card, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: C.t2, flexShrink: 0 }}>
                  {ini(m.user_name || "")}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{m.user_name || "Member"}</div>
                  {m.user_email && <div style={{ fontSize: 10, color: C.t3 }}>{m.user_email}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendees list */}
      <div className="cmm-scr" style={{ flex: 1, overflowY: "auto" }}>
        {attendees.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <Users style={{ width: 24, height: 24, color: C.t3, margin: "0 auto 10px", display: "block" }} />
            <div style={{ fontSize: 12.5, color: C.t2, fontWeight: 600 }}>No attendees yet</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>Add members manually above</div>
          </div>
        ) : attendees.map(a => (
          <AttendeeRow key={a.id} attendee={a} onStatusChange={handleStatusChange} onRemove={handleRemove} />
        ))}
      </div>

      {/* Footer actions */}
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 7, flexShrink: 0 }}>
        <button className="cmm-btn" onClick={() => onDeleteClass(cls.id)}
          style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.redD, border: `1px solid ${C.redB}`, color: C.red, fontSize: 12, fontWeight: 700, justifyContent: "center" }}>
          <Trash2 style={{ width: 12, height: 12 }} /> Cancel Class
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function ClassManagementModal({
  open, onClose,
  classes = [], bookings = [], coaches = [], allMemberships = [],
  onCreateClass, onUpdateClass, onDeleteClass,
}) {
  const [search,   setSearch]   = useState("");
  const [sort,     setSort]     = useState("name");
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [coachFilter, setCoachFilter] = useState("all");

  useEffect(() => { if (!open) { setSelected(null); setSearch(""); } }, [open]);

  const visible = useMemo(() => {
    let list = [...classes];
    if (filter === "full")   list = list.filter(c => { const b = (c.attendee_ids || []).length; const m = c.max_capacity || 0; return m > 0 && b >= m; });
    if (filter === "open")   list = list.filter(c => { const b = (c.attendee_ids || []).length; const m = c.max_capacity || 0; return m === 0 || b < m; });
    if (filter === "empty")  list = list.filter(c => (c.attendee_ids || []).length === 0);
    if (coachFilter !== "all") list = list.filter(c => (c.instructor || c.coach_name) === coachFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => (c.name || "").toLowerCase().includes(q) || (c.instructor || "").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "capacity") return (b.attendee_ids || []).length - (a.attendee_ids || []).length;
      if (sort === "coach")    return (a.instructor || "").localeCompare(b.instructor || "");
      return (a.name || "").localeCompare(b.name || "");
    });
    return list;
  }, [classes, filter, coachFilter, search, sort]);

  async function handleDuplicate(cls) {
    const { id, created_date, updated_date, attendee_ids, ...rest } = cls;
    await onCreateClass?.({ ...rest, name: `${cls.name} (copy)`, attendee_ids: [] });
  }

  const coachNames = [...new Set(classes.map(c => c.instructor || c.coach_name).filter(Boolean))];

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "stretch", justifyContent: "stretch", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", fontFamily: FONT }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, maxWidth: "100vw" }}>

        {/* ── Top Bar ── */}
        <div style={{ height: 54, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: C.sidebar, borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.violetD, border: `1px solid ${C.violetB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Dumbbell style={{ width: 13, height: 13, color: C.violet }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>Class Management</span>
            <span style={{ fontSize: 11, color: C.t3 }}>{classes.length} classes</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="cmm-btn" onClick={() => onCreateClass?.()}
              style={{ padding: "7px 14px", borderRadius: 8, background: C.violet, border: "none", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              <Plus style={{ width: 12, height: 12 }} /> New Class
            </button>
            <button className="cmm-btn" onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, color: C.t3, justifyContent: "center" }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <StatsBar classes={classes} bookings={bookings} />

        {/* ── Controls ── */}
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.brd}`, flexShrink: 0, background: C.card, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "7px 11px", flex: 1, minWidth: 180 }}>
            <Search style={{ width: 12, height: 12, color: C.t3, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes or coaches…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.t1, fontSize: 12.5, fontFamily: FONT }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}><X style={{ width: 11, height: 11, color: C.t3 }} /></button>}
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: 2, padding: 3, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 9 }}>
            {[{id:"all",label:"All"},{id:"open",label:"Open"},{id:"full",label:"Full"},{id:"empty",label:"Empty"}].map(f => (
              <button key={f.id} className="cmm-btn" onClick={() => setFilter(f.id)}
                style={{ padding: "5px 11px", borderRadius: 7, fontSize: 11.5, fontWeight: filter===f.id?700:400, background: filter===f.id?C.cyanD:"transparent", border: `1px solid ${filter===f.id?C.cyanB:"transparent"}`, color: filter===f.id?C.cyan:C.t3 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Coach filter */}
          {coachNames.length > 0 && (
            <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)}
              style={{ padding: "7px 11px", borderRadius: 8, background: C.card2, border: `1px solid ${C.brd}`, color: C.t2, fontSize: 12, outline: "none", cursor: "pointer", fontFamily: FONT }}>
              <option value="all">All Coaches</option>
              {coachNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}

          <span style={{ fontSize: 11, color: C.t3, marginLeft: "auto" }}>{visible.length} result{visible.length !== 1 ? "s" : ""}</span>
        </div>

        {/* ── Main area ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Table */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <TableHead sort={sort} setSort={setSort} />
            <div className="cmm-scr" style={{ flex: 1, overflowY: "auto" }}>
              {visible.length === 0 ? (
                <div style={{ padding: "64px 24px", textAlign: "center" }}>
                  <Dumbbell style={{ width: 32, height: 32, color: C.t3, margin: "0 auto 14px", display: "block" }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.t2, marginBottom: 6 }}>
                    {classes.length === 0 ? "No classes yet" : "No classes match"}
                  </div>
                  <div style={{ fontSize: 12, color: C.t3, marginBottom: 20 }}>
                    {classes.length === 0 ? "Create your first class to get started" : "Try adjusting your filters"}
                  </div>
                  {classes.length === 0 && (
                    <button className="cmm-btn" onClick={() => onCreateClass?.()}
                      style={{ padding: "9px 20px", borderRadius: 9, background: C.violet, border: "none", color: "#fff", fontSize: 13, fontWeight: 700, margin: "0 auto" }}>
                      <Plus style={{ width: 13, height: 13 }} /> Create First Class
                    </button>
                  )}
                </div>
              ) : visible.map(cls => (
                <ClassRow
                  key={cls.id} cls={cls}
                  isSelected={selected?.id === cls.id}
                  onSelect={c => setSelected(prev => prev?.id === c.id ? null : c)}
                  onDuplicate={handleDuplicate}
                  onDelete={id => { onDeleteClass?.(id); if (selected?.id === id) setSelected(null); }}
                  bookings={bookings.filter(b => b.class_id === cls.id || b.session_id === cls.id)}
                />
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: "8px 16px", borderTop: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "flex-end", flexShrink: 0 }}>
              <span style={{ fontSize: 10.5, color: C.t3 }}>{visible.length} of {classes.length} classes</span>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <ClassDetailPanel
              cls={selected}
              bookings={bookings}
              allMemberships={allMemberships}
              onClose={() => setSelected(null)}
              onUpdateClass={async (id, data) => { await onUpdateClass?.(id, data); }}
              onDeleteClass={id => { onDeleteClass?.(id); setSelected(null); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}