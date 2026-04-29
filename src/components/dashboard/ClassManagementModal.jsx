import { useState, useMemo, useRef, useEffect } from "react";
import {
  X, Search, Plus, Users, Clock, CheckCircle,
  XCircle, Edit3, Trash2, Copy, UserPlus, Filter,
  ChevronDown, MoreHorizontal, Check, Dumbbell, Calendar,
  Bell, BellOff, Lock, Unlock, AlertCircle, ChevronRight,
  RefreshCw, Save, ArrowRight, Info,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

/* ─── TOKENS ─────────────────────────────────────────────────── */
const C = {
  bg: "#000000", sidebar: "#0f0f12", card: "#141416", card2: "#1a1a1f",
  brd: "#222226", brd2: "#2a2a30",
  t1: "#ffffff", t2: "#8a8a94", t3: "#444450",
  cyan: "#4d7fff", cyanD: "rgba(77,127,255,0.12)", cyanB: "rgba(77,127,255,0.28)",
  red: "#ff4d6d", redD: "rgba(255,77,109,0.12)", redB: "rgba(255,77,109,0.28)",
  green: "#22c55e", greenD: "rgba(34,197,94,0.10)", greenB: "rgba(34,197,94,0.28)",
  amber: "#f59e0b", amberD: "rgba(245,158,11,0.12)", amberB: "rgba(245,158,11,0.28)",
  violet: "#a855f7", violetD: "rgba(168,85,247,0.12)", violetB: "rgba(168,85,247,0.28)",
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";
const GRID = "1.8fr 130px 110px 100px 110px 88px";
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CLASS_TYPES = ["HIIT", "Yoga", "Pilates", "Strength", "Cardio", "Boxing", "Spin", "CrossFit", "Mobility", "Open Gym", "Other"];

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
    .cmm-input { width:100%; background:rgba(255,255,255,0.03); border:1px solid #222226; color:#fff; font-size:13px; font-family:'DM Sans','Segoe UI',sans-serif; outline:none; border-radius:8px; padding:9px 12px; transition:all .18s; box-sizing:border-box; }
    .cmm-input:focus { border-color:rgba(77,127,255,0.4); background:rgba(77,127,255,0.04); }
    .cmm-input::placeholder { color:#444450; }
    .cmm-select { background:#141416; border:1px solid #222226; color:#8a8a94; font-size:12px; font-family:'DM Sans','Segoe UI',sans-serif; outline:none; border-radius:8px; padding:8px 11px; cursor:pointer; }
    .cmm-select:focus { border-color:rgba(77,127,255,0.4); }
    .cmm-scr::-webkit-scrollbar { width:3px; }
    .cmm-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    @keyframes cmmFadeIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:none} }
    .cmm-panel { animation: cmmFadeIn .22s cubic-bezier(.16,1,.3,1) both; }
    @keyframes cmmSlideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
    .cmm-slide { animation: cmmSlideIn .2s cubic-bezier(.16,1,.3,1) both; }
    .cmm-tab-active { border-bottom: 2px solid #4d7fff !important; color: #fff !important; }
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
  if (n.includes("cross") || n.includes("mobility")) return "#ec4899";
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

function getClassStatus(cls) {
  const booked = (cls.attendee_ids || []).length;
  const max = cls.max_capacity || 0;
  if (cls.status === "cancelled") return { label: "Cancelled", color: C.t3, bg: "rgba(255,255,255,0.04)", brd: C.brd };
  if (max > 0 && booked >= max) return { label: "Full", color: C.red, bg: C.redD, brd: C.redB };
  if (cls.status === "completed") return { label: "Completed", color: C.green, bg: C.greenD, brd: C.greenB };
  if (cls.bookings_enabled === false) return { label: "Closed", color: C.amber, bg: C.amberD, brd: C.amberB };
  if (booked > 0) return { label: "Open", color: C.cyan, bg: C.cyanD, brd: C.cyanB };
  return { label: "Available", color: C.violet, bg: C.violetD, brd: C.violetB };
}

const BOOKING_STATUS = {
  booked:    { label: "Confirmed", color: C.cyan,  bg: C.cyanD,  brd: C.cyanB  },
  waitlist:  { label: "Waitlist",  color: C.amber, bg: C.amberD, brd: C.amberB },
  attended:  { label: "Attended",  color: C.green, bg: C.greenD, brd: C.greenB },
  no_show:   { label: "No-show",   color: C.red,   bg: C.redD,   brd: C.redB   },
  cancelled: { label: "Cancelled", color: C.t3,    bg: "rgba(255,255,255,0.04)", brd: C.brd },
};

/* ─── FIELD COMPONENT ────────────────────────────────────────── */
function Field({ label, children, half }) {
  return (
    <div style={{ flex: half ? "0 0 calc(50% - 6px)" : "1 1 100%" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

/* ─── STATS BAR ──────────────────────────────────────────────── */
function StatsBar({ classes, bookings }) {
  const totalClasses  = classes.length;
  const totalBookings = classes.reduce((s, c) => s + (c.attendee_ids || []).length, 0);
  const fullClasses   = classes.filter(c => { const b = (c.attendee_ids || []).length; const m = c.max_capacity || 0; return m > 0 && b >= m; }).length;
  const avgFill = (() => {
    const withCap = classes.filter(c => c.max_capacity > 0);
    if (!withCap.length) return 0;
    return Math.round(withCap.reduce((s, c) => s + (c.attendee_ids || []).length / c.max_capacity, 0) / withCap.length * 100);
  })();
  const availableSpots = classes.reduce((s, c) => {
    const m = c.max_capacity || 0; const b = (c.attendee_ids || []).length;
    return s + Math.max(0, m - b);
  }, 0);

  const stats = [
    { label: "Total Classes",    val: totalClasses,   col: C.t1   },
    { label: "Total Bookings",   val: totalBookings,  col: C.cyan  },
    { label: "Full Classes",     val: fullClasses,    col: fullClasses > 0 ? C.red : C.green },
    { label: "Avg Fill Rate",    val: `${avgFill}%`,  col: avgFill >= 80 ? C.green : avgFill >= 50 ? C.amber : C.t2 },
    { label: "Available Spots",  val: availableSpots, col: C.violet },
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
    { label: "Schedule", key: "time"     },
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
function ClassRow({ cls, isSelected, onSelect, onDuplicate, onDelete, onEdit }) {
  const color    = classTypeColor(cls.name || "");
  const booked   = (cls.attendee_ids || []).length;
  const max      = cls.max_capacity || 0;
  const capColor = capacityColor(booked, max);
  const fillPct  = max > 0 ? Math.round(booked / max * 100) : 0;
  const status   = getClassStatus(cls);
  const [menuOpen, setMenuOpen] = useState(false);

  const schedLabel = (() => {
    if (cls.schedule_type === "recurring" && cls.schedule?.length > 0) {
      const days = cls.schedule.map(s => s.day?.slice(0, 3)).join(", ");
      const t = cls.schedule[0]?.time || cls.time || "";
      return `${days} ${fmtTime(t)}`.trim();
    }
    const s = cls.schedule?.[0];
    if (s?.date) return `${s.date} ${fmtTime(s.time || "")}`.trim();
    if (s?.day) return `${s.day?.slice(0, 3)} ${fmtTime(s.time || "")}`.trim();
    if (cls.time) return fmtTime(cls.time);
    return "—";
  })();

  return (
    <div className="cmm-row" onClick={() => onSelect(cls)}
      style={{ display: "grid", gridTemplateColumns: GRID, gap: 10, padding: "11px 16px", alignItems: "center", background: isSelected ? "#1a1a1e" : "transparent", borderBottom: `1px solid ${C.brd}`, borderLeft: `2px solid ${isSelected ? C.cyan : "transparent"}`, fontFamily: FONT, position: "relative" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.cyan : C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.name || "Unnamed"}</div>
          {cls.class_type && <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{cls.class_type}</div>}
          {cls.schedule_type === "recurring" && <div style={{ fontSize: 9, color: C.violet, marginTop: 1, display: "flex", alignItems: "center", gap: 3 }}><RefreshCw style={{ width: 8, height: 8 }} /> Recurring</div>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: C.t2 }}>{schedLabel}</div>
      <div style={{ fontSize: 12, color: C.t2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.instructor || cls.coach_name || "—"}</div>

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

      <div>
        <span style={{ padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: status.bg, border: `1px solid ${status.brd}`, color: status.color, whiteSpace: "nowrap" }}>
          {status.label}
        </span>
      </div>

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
                { label: "Edit",      icon: Edit3,  color: C.cyan, fn: () => { onEdit(cls); setMenuOpen(false); } },
                { label: "Duplicate", icon: Copy,   color: C.t2,   fn: () => { onDuplicate(cls); setMenuOpen(false); } },
                { label: "Delete",    icon: Trash2, color: C.red,  fn: () => { onDelete(cls.id); setMenuOpen(false); } },
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
        {attendee.status !== "no_show" && attendee.status !== "cancelled" && (
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

/* ─── CLASS EDITOR MODAL ─────────────────────────────────────── */
function ClassEditorModal({ cls, coaches, onClose, onSave }) {
  const isEdit = !!cls?.id;
  const [form, setForm] = useState({
    name: cls?.name || "",
    class_type: cls?.class_type || "",
    description: cls?.description || "",
    instructor: cls?.instructor || cls?.coach_name || "",
    location: cls?.location || "",
    max_capacity: cls?.max_capacity || "",
    duration_minutes: cls?.duration_minutes || 60,
    schedule_type: cls?.schedule_type || "recurring",
    schedule: cls?.schedule?.length ? cls.schedule : [{ day: "Monday", time: "09:00" }],
    single_date: cls?.single_date || "",
    single_time: cls?.single_time || cls?.time || "09:00",
    bookings_enabled: cls?.bookings_enabled !== false,
    booking_deadline_hours: cls?.booking_deadline_hours || "",
    status: cls?.status || "active",
    color: cls?.color || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function addScheduleDay() {
    setForm(f => ({ ...f, schedule: [...f.schedule, { day: "Monday", time: "09:00" }] }));
  }
  function removeScheduleDay(i) {
    setForm(f => ({ ...f, schedule: f.schedule.filter((_, idx) => idx !== i) }));
  }
  function updateScheduleDay(i, k, v) {
    setForm(f => ({ ...f, schedule: f.schedule.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
      duration_minutes: Number(form.duration_minutes) || 60,
      booking_deadline_hours: form.booking_deadline_hours ? Number(form.booking_deadline_hours) : null,
      schedule: form.schedule_type === "single"
        ? [{ date: form.single_date, time: form.single_time }]
        : form.schedule,
      time: form.schedule_type === "single" ? form.single_time : (form.schedule[0]?.time || "09:00"),
    };
    await onSave(payload);
    setSaving(false);
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`,
    color: C.t1, fontSize: 13, fontFamily: FONT, outline: "none", borderRadius: 8, padding: "9px 12px",
    transition: "border-color .18s",
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT }}>
      <div className="cmm-panel" style={{ width: 580, maxWidth: "95vw", maxHeight: "90vh", background: C.card, border: `1px solid ${C.brd2}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.8)" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.violetD, border: `1px solid ${C.violetB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Dumbbell style={{ width: 13, height: 13, color: C.violet }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>{isEdit ? "Edit Class" : "Create Class"}</span>
          </div>
          <button className="cmm-btn" onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: `1px solid ${C.brd}`, color: C.t3, justifyContent: "center" }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Body */}
        <div className="cmm-scr" style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Name + Type */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Field label="Class Name *" half>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Morning HIIT" style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </Field>
            <Field label="Class Type" half>
              <select value={form.class_type} onChange={e => set("class_type", e.target.value)} className="cmm-select" style={{ width: "100%" }}>
                <option value="">Select type…</option>
                {CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              placeholder="Brief description of the class…"
              style={{ ...inputStyle, resize: "vertical" }} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
          </Field>

          {/* Instructor + Location */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Field label="Instructor" half>
              {coaches?.length > 0 ? (
                <select value={form.instructor} onChange={e => set("instructor", e.target.value)} className="cmm-select" style={{ width: "100%" }}>
                  <option value="">Select coach…</option>
                  {coaches.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              ) : (
                <input value={form.instructor} onChange={e => set("instructor", e.target.value)} placeholder="Coach name" style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
              )}
            </Field>
            <Field label="Location" half>
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Studio A, Main Floor" style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </Field>
          </div>

          {/* Capacity + Duration */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Field label="Max Capacity" half>
              <input type="number" value={form.max_capacity} onChange={e => set("max_capacity", e.target.value)} placeholder="Unlimited" min={1} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </Field>
            <Field label="Duration (minutes)" half>
              <input type="number" value={form.duration_minutes} onChange={e => set("duration_minutes", e.target.value)} min={15} step={15} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </Field>
          </div>

          {/* Schedule type */}
          <Field label="Schedule Type">
            <div style={{ display: "flex", gap: 8 }}>
              {[{ v: "recurring", label: "Recurring (Weekly)", icon: RefreshCw }, { v: "single", label: "Single Date", icon: Calendar }].map(opt => {
                const Ic = opt.icon;
                const active = form.schedule_type === opt.v;
                return (
                  <button key={opt.v} className="cmm-btn" onClick={() => set("schedule_type", opt.v)}
                    style={{ flex: 1, padding: "9px 14px", borderRadius: 9, border: `1px solid ${active ? C.cyanB : C.brd}`, background: active ? C.cyanD : "transparent", color: active ? C.cyan : C.t2, fontSize: 12, fontWeight: 600, justifyContent: "center" }}>
                    <Ic style={{ width: 12, height: 12 }} />{opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Schedule rows */}
          {form.schedule_type === "recurring" ? (
            <Field label="Days & Times">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={s.day} onChange={e => updateScheduleDay(i, "day", e.target.value)} className="cmm-select" style={{ flex: 1 }}>
                      {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="time" value={s.time} onChange={e => updateScheduleDay(i, "time", e.target.value)} style={{ ...inputStyle, width: 120, flex: "none" }} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
                    {form.schedule.length > 1 && (
                      <button className="cmm-btn" onClick={() => removeScheduleDay(i)}
                        style={{ width: 28, height: 28, borderRadius: 7, background: C.redD, border: `1px solid ${C.redB}`, color: C.red, justifyContent: "center", flexShrink: 0 }}>
                        <X style={{ width: 11, height: 11 }} />
                      </button>
                    )}
                  </div>
                ))}
                <button className="cmm-btn" onClick={addScheduleDay}
                  style={{ padding: "7px 12px", borderRadius: 7, background: "transparent", border: `1px dashed ${C.brd2}`, color: C.t3, fontSize: 12 }}>
                  <Plus style={{ width: 11, height: 11 }} /> Add another day
                </button>
              </div>
            </Field>
          ) : (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Field label="Date" half>
                <input type="date" value={form.single_date} onChange={e => set("single_date", e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
              </Field>
              <Field label="Time" half>
                <input type="time" value={form.single_time} onChange={e => set("single_time", e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
              </Field>
            </div>
          )}

          {/* Booking controls */}
          <div style={{ padding: "12px 14px", borderRadius: 10, background: C.card2, border: `1px solid ${C.brd}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t2, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Booking Controls</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t1 }}>Enable Bookings</div>
                <div style={{ fontSize: 11, color: C.t3 }}>Allow members to book this class</div>
              </div>
              <button className="cmm-btn" onClick={() => set("bookings_enabled", !form.bookings_enabled)}
                style={{ width: 44, height: 24, borderRadius: 12, background: form.bookings_enabled ? C.green : C.brd2, border: "none", padding: 2, position: "relative", justifyContent: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "transform .2s", transform: form.bookings_enabled ? "translateX(20px)" : "none" }} />
              </button>
            </div>
            <Field label="Booking Deadline (hours before class)">
              <input type="number" value={form.booking_deadline_hours} onChange={e => set("booking_deadline_hours", e.target.value)}
                placeholder="No deadline" min={0} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </Field>
          </div>

          {/* Status */}
          {isEdit && (
            <Field label="Class Status">
              <select value={form.status} onChange={e => set("status", e.target.value)} className="cmm-select" style={{ width: "100%" }}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="cmm-btn" onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: 9, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 13, fontWeight: 600 }}>
            Cancel
          </button>
          <button className="cmm-btn" onClick={handleSave} disabled={!form.name.trim() || saving}
            style={{ padding: "9px 22px", borderRadius: 9, background: form.name.trim() ? C.violet : C.brd, border: "none", color: form.name.trim() ? "#fff" : C.t3, fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            <Save style={{ width: 13, height: 13 }} />{saving ? "Saving…" : isEdit ? "Save Changes" : "Create Class"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── CLASS DETAIL PANEL ─────────────────────────────────────── */
function ClassDetailPanel({ cls, bookings, allMemberships, onClose, onUpdateClass, onDeleteClass, onEdit }) {
  const color    = classTypeColor(cls.name || "");
  const booked   = (cls.attendee_ids || []).length;
  const max      = cls.max_capacity || 0;
  const fillPct  = max > 0 ? Math.round(booked / max * 100) : 0;
  const capColor = capacityColor(booked, max);
  const isFull   = max > 0 && booked >= max;
  const status   = getClassStatus(cls);
  const [activeTab, setActiveTab] = useState("attendees");

  const [attendees, setAttendees] = useState(() => {
    const ids = cls.attendee_ids || [];
    return ids.map((id, i) => {
      const bk = bookings.find(b => b.client_id === id || b.user_id === id);
      const mb = allMemberships.find(m => m.user_id === id);
      return {
        id,
        name: bk?.client_name || mb?.user_name || `Member ${i + 1}`,
        email: bk?.client_email || mb?.user_email || "",
        status: bk?.status || "booked",
      };
    });
  });

  const waitlist = attendees.filter(a => a.status === "waitlist");
  const confirmed = attendees.filter(a => a.status === "booked" || a.status === "attended" || a.status === "no_show");

  const [addSearch, setAddSearch]   = useState("");
  const [showAdd,   setShowAdd]     = useState(false);
  const [saving,    setSaving]      = useState(false);
  const [notifMsg,  setNotifMsg]    = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);

  const attended = attendees.filter(a => a.status === "attended").length;
  const noShows  = attendees.filter(a => a.status === "no_show").length;

  async function handleStatusChange(attendeeId, newStatus) {
    setAttendees(prev => prev.map(a => a.id === attendeeId ? { ...a, status: newStatus } : a));
    // Auto-promote from waitlist when attendance freed
    if (newStatus === "cancelled" && waitlist.length > 0 && max > 0) {
      const newBooked = attendees.filter(a => a.id !== attendeeId && (a.status === "booked" || a.status === "attended")).length;
      if (newBooked < max) {
        const next = waitlist[0];
        setAttendees(prev => prev.map(a => a.id === next.id ? { ...a, status: "booked" } : a));
      }
    }
  }

  async function handleRemove(attendeeId) {
    const updated = (cls.attendee_ids || []).filter(id => id !== attendeeId);
    setSaving(true);
    await onUpdateClass(cls.id, { attendee_ids: updated });
    setAttendees(prev => prev.filter(a => a.id !== attendeeId));
    setSaving(false);
  }

  async function handleAddMember(member) {
    const id = member.user_id || member.id;
    if ((cls.attendee_ids || []).includes(id)) return;
    const updated = [...(cls.attendee_ids || []), id];
    const status = isFull ? "waitlist" : "booked";
    setSaving(true);
    await onUpdateClass(cls.id, { attendee_ids: updated });
    setAttendees(prev => [...prev, { id, name: member.user_name || member.name || "Member", email: member.user_email || "", status }]);
    setShowAdd(false);
    setAddSearch("");
    setSaving(false);
  }

  async function toggleBookings() {
    const newVal = cls.bookings_enabled === false ? true : false;
    await onUpdateClass(cls.id, { bookings_enabled: !newVal });
  }

  async function sendNotification() {
    if (!notifMsg.trim()) return;
    setSendingNotif(true);
    try {
      // Create notifications for all attendees
      for (const a of attendees) {
        if (a.id) {
          await base44.entities.Notification.create({
            user_id: a.id,
            type: "class_update",
            title: `📢 ${cls.name} Update`,
            message: notifMsg.trim(),
            icon: "🏋️",
          });
        }
      }
      setNotifMsg("");
    } finally {
      setSendingNotif(false);
    }
  }

  const schedLabel = (() => {
    if (cls.schedule_type === "single") {
      const s = cls.schedule?.[0];
      return s ? `${s.date} at ${fmtTime(s.time)}` : "—";
    }
    if (cls.schedule?.length > 0) {
      const days = cls.schedule.map(s => s.day).filter(Boolean).join(", ");
      return `${days} ${fmtTime(cls.schedule[0].time || cls.time || "")}`.trim();
    }
    return "—";
  })();

  const filteredMembers = (allMemberships || []).filter(m => {
    const name = (m.user_name || "").toLowerCase();
    const q    = addSearch.toLowerCase();
    return (!q || name.includes(q)) && !(cls.attendee_ids || []).includes(m.user_id);
  }).slice(0, 8);

  const tabs = ["attendees", "settings", "notify"];

  return (
    <div className="cmm-panel" style={{ width: 340, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cls.name}</div>
            </div>
            <div style={{ fontSize: 11, color: C.t2 }}>{schedLabel}</div>
            {(cls.instructor || cls.coach_name) && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Coach: {cls.instructor || cls.coach_name}</div>}
            {cls.location && <div style={{ fontSize: 11, color: C.t3 }}>📍 {cls.location}</div>}
          </div>
          <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 8 }}>
            <button className="cmm-btn" onClick={() => onEdit(cls)} title="Edit"
              style={{ width: 26, height: 26, borderRadius: 7, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, justifyContent: "center" }}>
              <Edit3 style={{ width: 11, height: 11 }} />
            </button>
            <button className="cmm-btn" onClick={onClose}
              style={{ width: 26, height: 26, borderRadius: 7, background: "transparent", border: `1px solid ${C.brd}`, color: C.t3, justifyContent: "center" }}>
              <X style={{ width: 11, height: 11 }} />
            </button>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: status.bg, border: `1px solid ${status.brd}`, color: status.color }}>
            {status.label}
          </span>
          {cls.schedule_type === "recurring" && (
            <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: C.violetD, border: `1px solid ${C.violetB}`, color: C.violet, display: "flex", alignItems: "center", gap: 4 }}>
              <RefreshCw style={{ width: 8, height: 8 }} />Recurring
            </span>
          )}
        </div>

        {/* Capacity bar */}
        {max > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10.5, color: C.t3 }}>Capacity</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: capColor }}>{booked}/{max}{isFull ? " · Full" : ""}</span>
            </div>
            <div style={{ height: 4, background: C.brd, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${fillPct}%`, height: "100%", background: capColor, borderRadius: 2 }} />
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: "Confirmed", val: confirmed.length, col: C.cyan  },
            { label: "Attended",  val: attended,         col: C.green },
            { label: "No-show",   val: noShows,          col: noShows > 0 ? C.red : C.t3 },
          ].map((s, i) => (
            <div key={i} style={{ padding: "7px 8px", borderRadius: 8, background: C.card, border: `1px solid ${C.brd}`, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.col }}>{s.val}</div>
              <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t} className={`cmm-btn${activeTab === t ? " cmm-tab-active" : ""}`} onClick={() => setActiveTab(t)}
            style={{ flex: 1, padding: "9px 4px", borderRadius: 0, justifyContent: "center", fontSize: 11, fontWeight: activeTab === t ? 700 : 500, color: activeTab === t ? C.t1 : C.t3, background: "transparent", borderBottom: `2px solid ${activeTab === t ? C.cyan : "transparent"}`, textTransform: "capitalize" }}>
            {t === "attendees" ? `Attendees (${attendees.length})` : t === "settings" ? "Settings" : "Notify"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="cmm-scr" style={{ flex: 1, overflowY: "auto" }}>

        {/* ATTENDEES TAB */}
        {activeTab === "attendees" && (<>
          {/* Add member */}
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showAdd ? 8 : 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>
                {isFull ? "Full — waitlist available" : `${max > 0 ? max - booked : "∞"} spot${max > 0 && max - booked !== 1 ? "s" : ""} available`}
              </span>
              <button className="cmm-btn" onClick={() => setShowAdd(o => !o)}
                style={{ padding: "5px 10px", borderRadius: 7, background: C.cyanD, border: `1px solid ${C.cyanB}`, color: C.cyan, fontSize: 11, fontWeight: 600 }}>
                <UserPlus style={{ width: 10, height: 10 }} />{isFull ? "Waitlist" : "Add"}
              </button>
            </div>
            {showAdd && (
              <div className="cmm-slide">
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "7px 10px", marginBottom: 6 }}>
                  <Search style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
                  <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="Search members…" autoFocus
                    style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.t1, fontSize: 12, fontFamily: FONT }} />
                </div>
                {isFull && <div style={{ fontSize: 10.5, color: C.amber, padding: "4px 2px", display: "flex", alignItems: "center", gap: 5 }}><Info style={{ width: 10, height: 10 }} />Class is full — member will be added to waitlist</div>}
                <div style={{ maxHeight: 150, overflowY: "auto" }}>
                  {filteredMembers.length === 0 ? (
                    <div style={{ fontSize: 11, color: C.t3, textAlign: "center", padding: "10px 0" }}>No members found</div>
                  ) : filteredMembers.map(m => (
                    <div key={m.user_id} onClick={() => handleAddMember(m)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 6px", borderRadius: 7, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.cyanD}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.card, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: C.t2, flexShrink: 0 }}>{ini(m.user_name || "")}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{m.user_name || "Member"}</div>
                        {m.user_email && <div style={{ fontSize: 10, color: C.t3 }}>{m.user_email}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Waitlist section */}
          {waitlist.length > 0 && (
            <div>
              <div style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.07em", background: C.amberD, borderBottom: `1px solid ${C.brd}` }}>
                Waitlist ({waitlist.length})
              </div>
              {waitlist.map(a => <AttendeeRow key={a.id} attendee={a} onStatusChange={handleStatusChange} onRemove={handleRemove} />)}
            </div>
          )}

          {/* Confirmed attendees */}
          {confirmed.length === 0 && waitlist.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <Users style={{ width: 24, height: 24, color: C.t3, margin: "0 auto 10px", display: "block" }} />
              <div style={{ fontSize: 12.5, color: C.t2, fontWeight: 600 }}>No attendees yet</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>Add members above</div>
            </div>
          ) : (
            <>
              {confirmed.length > 0 && <div style={{ padding: "8px 14px", fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${C.brd}` }}>Confirmed ({confirmed.length})</div>}
              {confirmed.map(a => <AttendeeRow key={a.id} attendee={a} onStatusChange={handleStatusChange} onRemove={handleRemove} />)}
            </>
          )}
        </>)}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Booking toggle */}
            <div style={{ padding: "12px 14px", borderRadius: 9, background: C.card, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, display: "flex", alignItems: "center", gap: 6 }}>
                  {cls.bookings_enabled === false ? <Lock style={{ width: 12, height: 12, color: C.amber }} /> : <Unlock style={{ width: 12, height: 12, color: C.green }} />}
                  Bookings {cls.bookings_enabled === false ? "Disabled" : "Enabled"}
                </div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{cls.bookings_enabled === false ? "Members cannot book this class" : "Members can book this class"}</div>
              </div>
              <button className="cmm-btn" onClick={toggleBookings}
                style={{ padding: "6px 12px", borderRadius: 7, background: cls.bookings_enabled === false ? C.greenD : C.amberD, border: `1px solid ${cls.bookings_enabled === false ? C.greenB : C.amberB}`, color: cls.bookings_enabled === false ? C.green : C.amber, fontSize: 11, fontWeight: 700 }}>
                {cls.bookings_enabled === false ? "Enable" : "Disable"}
              </button>
            </div>

            {/* Class info */}
            {[
              { label: "Max Capacity", val: cls.max_capacity ? `${cls.max_capacity} people` : "Unlimited" },
              { label: "Duration", val: cls.duration_minutes ? `${cls.duration_minutes} minutes` : "—" },
              { label: "Location", val: cls.location || "—" },
              { label: "Booking Deadline", val: cls.booking_deadline_hours ? `${cls.booking_deadline_hours}h before class` : "No deadline" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${C.brd}` }}>
                <span style={{ fontSize: 12, color: C.t3 }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{item.val}</span>
              </div>
            ))}

            {/* Description */}
            {cls.description && (
              <div style={{ padding: "10px 12px", borderRadius: 9, background: C.card, border: `1px solid ${C.brd}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Description</div>
                <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>{cls.description}</div>
              </div>
            )}
          </div>
        )}

        {/* NOTIFY TAB */}
        {activeTab === "notify" && (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ padding: "10px 12px", borderRadius: 9, background: C.cyanD, border: `1px solid ${C.cyanB}` }}>
              <div style={{ fontSize: 11.5, color: C.cyan, fontWeight: 600 }}>Notify {attendees.length} attendee{attendees.length !== 1 ? "s" : ""}</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 3 }}>Send a notification to everyone booked in this class</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Message</div>
              <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} rows={4}
                placeholder="e.g. Class is cancelled due to maintenance. Sorry for the inconvenience!"
                className="cmm-input" style={{ resize: "vertical" }} />
            </div>
            {/* Quick templates */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Quick Templates</div>
              {[
                `${cls.name} is cancelled today. Apologies for the inconvenience!`,
                `Reminder: ${cls.name} starts in 1 hour. See you there!`,
                `${cls.name} has been rescheduled. Please check the updated schedule.`,
                `Great news — a spot opened up in ${cls.name}!`,
              ].map((tmpl, i) => (
                <div key={i} onClick={() => setNotifMsg(tmpl)}
                  style={{ padding: "8px 10px", borderRadius: 7, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 11.5, cursor: "pointer", marginBottom: 6, lineHeight: 1.5 }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.cyanD; e.currentTarget.style.borderColor = C.cyanB; e.currentTarget.style.color = C.t1; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; }}>
                  {tmpl}
                </div>
              ))}
            </div>
            <button className="cmm-btn" onClick={sendNotification} disabled={!notifMsg.trim() || sendingNotif || attendees.length === 0}
              style={{ padding: "10px 18px", borderRadius: 9, background: notifMsg.trim() && attendees.length > 0 ? C.cyan : C.brd, border: "none", color: notifMsg.trim() && attendees.length > 0 ? "#fff" : C.t3, fontSize: 13, fontWeight: 700, justifyContent: "center", opacity: sendingNotif ? 0.7 : 1 }}>
              <Bell style={{ width: 13, height: 13 }} />{sendingNotif ? "Sending…" : `Send to ${attendees.length} member${attendees.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "11px 14px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 7, flexShrink: 0 }}>
        <button className="cmm-btn" onClick={() => onEdit(cls)}
          style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.violetD, border: `1px solid ${C.violetB}`, color: C.violet, fontSize: 12, fontWeight: 700, justifyContent: "center" }}>
          <Edit3 style={{ width: 12, height: 12 }} /> Edit
        </button>
        <button className="cmm-btn" onClick={() => onDeleteClass(cls.id)}
          style={{ flex: 1, padding: "8px", borderRadius: 8, background: C.redD, border: `1px solid ${C.redB}`, color: C.red, fontSize: 12, fontWeight: 700, justifyContent: "center" }}>
          <Trash2 style={{ width: 12, height: 12 }} /> Delete
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
  initialClassId = null,
}) {
  const [search,      setSearch]     = useState("");
  const [sort,        setSort]       = useState("name");
  const [filter,      setFilter]     = useState("all");
  const [selected,    setSelected]   = useState(null);
  const [coachFilter, setCoachFilter]= useState("all");
  const [dateFilter,  setDateFilter] = useState("all");
  const [editing,     setEditing]    = useState(null); // null | "new" | cls object

  useEffect(() => {
    if (!open) { setSelected(null); setSearch(""); setEditing(null); return; }
    if (initialClassId) {
      const found = classes.find(c => c.id === initialClassId);
      if (found) setSelected(found);
    }
  }, [open, initialClassId]);

  const visible = useMemo(() => {
    let list = [...classes];
    if (filter === "full")      list = list.filter(c => { const b=(c.attendee_ids||[]).length,m=c.max_capacity||0; return m>0&&b>=m; });
    if (filter === "open")      list = list.filter(c => { const b=(c.attendee_ids||[]).length,m=c.max_capacity||0; return m===0||b<m; });
    if (filter === "empty")     list = list.filter(c => (c.attendee_ids||[]).length===0);
    if (filter === "recurring") list = list.filter(c => c.schedule_type === "recurring");
    if (filter === "single")    list = list.filter(c => c.schedule_type === "single");
    if (coachFilter !== "all")  list = list.filter(c => (c.instructor||c.coach_name) === coachFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => (c.name||"").toLowerCase().includes(q) || (c.instructor||"").toLowerCase().includes(q) || (c.class_type||"").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "capacity") return (b.attendee_ids||[]).length - (a.attendee_ids||[]).length;
      if (sort === "coach")    return (a.instructor||"").localeCompare(b.instructor||"");
      if (sort === "time")     return (a.schedule?.[0]?.time||"").localeCompare(b.schedule?.[0]?.time||"");
      return (a.name||"").localeCompare(b.name||"");
    });
    return list;
  }, [classes, filter, coachFilter, search, sort]);

  async function handleDuplicate(cls) {
    const { id, created_date, updated_date, attendee_ids, ...rest } = cls;
    await onCreateClass?.({ ...rest, name: `${cls.name} (copy)`, attendee_ids: [] });
  }

  async function handleSaveClass(data) {
    if (editing?.id) {
      await onUpdateClass?.(editing.id, data);
    } else {
      await onCreateClass?.(data);
    }
    setEditing(null);
  }

  const coachNames = [...new Set(classes.map(c => c.instructor || c.coach_name).filter(Boolean))];

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "stretch", justifyContent: "stretch", background: "rgba(0,0,0,0.9)", backdropFilter: "blur(8px)", fontFamily: FONT }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: C.bg, maxWidth: "100vw" }}>

        {/* ── Top Bar ── */}
        <div style={{ height: 54, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", background: C.sidebar, borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.violetD, border: `1px solid ${C.violetB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Dumbbell style={{ width: 13, height: 13, color: C.violet }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>Class Management</span>
            <span style={{ fontSize: 11, color: C.t3 }}>{classes.length} class{classes.length !== 1 ? "es" : ""}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="cmm-btn" onClick={() => setEditing("new")}
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
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.brd}`, flexShrink: 0, background: C.card, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 8, padding: "7px 11px", flex: 1, minWidth: 180 }}>
            <Search style={{ width: 12, height: 12, color: C.t3, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, coach, or type…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.t1, fontSize: 12.5, fontFamily: FONT }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}><X style={{ width: 11, height: 11, color: C.t3 }} /></button>}
          </div>

          {/* Status filter */}
          <div style={{ display: "flex", gap: 2, padding: 3, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 9 }}>
            {[{id:"all",label:"All"},{id:"open",label:"Open"},{id:"full",label:"Full"},{id:"empty",label:"Empty"},{id:"recurring",label:"Recurring"},{id:"single",label:"One-off"}].map(f => (
              <button key={f.id} className="cmm-btn" onClick={() => setFilter(f.id)}
                style={{ padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: filter===f.id?700:400, background: filter===f.id?C.cyanD:"transparent", border: `1px solid ${filter===f.id?C.cyanB:"transparent"}`, color: filter===f.id?C.cyan:C.t3 }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Coach filter */}
          {coachNames.length > 0 && (
            <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)} className="cmm-select">
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
                    <button className="cmm-btn" onClick={() => setEditing("new")}
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
                  onEdit={c => setEditing(c)}
                  onDuplicate={handleDuplicate}
                  onDelete={id => { onDeleteClass?.(id); if (selected?.id === id) setSelected(null); }}
                  bookings={bookings.filter(b => b.class_id === cls.id || b.session_id === cls.id)}
                />
              ))}
            </div>
            <div style={{ padding: "8px 16px", borderTop: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 10.5, color: C.t3 }}>{visible.length} of {classes.length} classes</span>
              <button className="cmm-btn" onClick={() => setEditing("new")}
                style={{ padding: "5px 12px", borderRadius: 7, background: C.violetD, border: `1px solid ${C.violetB}`, color: C.violet, fontSize: 11, fontWeight: 700 }}>
                <Plus style={{ width: 11, height: 11 }} /> New Class
              </button>
            </div>
          </div>

          {/* Detail panel */}
          {selected && (
            <ClassDetailPanel
              cls={selected}
              bookings={bookings}
              allMemberships={allMemberships}
              onClose={() => setSelected(null)}
              onEdit={c => setEditing(c)}
              onUpdateClass={async (id, data) => { await onUpdateClass?.(id, data); }}
              onDeleteClass={id => { onDeleteClass?.(id); setSelected(null); }}
            />
          )}
        </div>
      </div>

      {/* Class editor modal (layered on top) */}
      {editing && (
        <ClassEditorModal
          cls={editing === "new" ? null : editing}
          coaches={coaches}
          onClose={() => setEditing(null)}
          onSave={handleSaveClass}
        />
      )}
    </div>
  );
}