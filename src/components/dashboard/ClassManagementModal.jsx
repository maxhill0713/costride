import { useState, useMemo, useRef, useEffect } from "react";
import {
  X, Search, Plus, Users, Clock, Check, Dumbbell,
  Trash2, Copy, UserPlus, ChevronDown, MoreHorizontal,
  XCircle, TrendingUp, TrendingDown, MessageCircle,
  Zap, AlertCircle, BarChart3, RefreshCw, Settings2,
  ChevronRight, Minus, ArrowUpRight, ArrowDownRight, Save, Calendar,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CLASS_TYPES  = ["HIIT", "Yoga", "Pilates", "Strength", "Cardio", "Boxing", "Spin", "CrossFit", "Mobility", "Open Gym", "Other"];

/* ─── DESIGN TOKENS (matches ContentPage) ──────────────────── */
const C = {
  bg:      "#000000",
  sidebar: "#0f0f12",
  card:    "#141416",
  card2:   "#1a1a1f",
  card3:   "#1e1e24",
  brd:     "#222226",
  brd2:    "#2a2a30",
  t1:      "#ffffff",
  t2:      "#8a8a94",
  t3:      "#444450",
  cyan:    "#4d7fff",
  cyanD:   "rgba(77,127,255,0.10)",
  cyanB:   "rgba(77,127,255,0.28)",
  cyanM:   "rgba(77,127,255,0.18)",
  red:     "#ff4d6d",
  redD:    "rgba(255,77,109,0.10)",
  redB:    "rgba(255,77,109,0.28)",
  green:   "#22c55e",
  greenD:  "rgba(34,197,94,0.10)",
  greenB:  "rgba(34,197,94,0.28)",
  amber:   "#f59e0b",
  amberD:  "rgba(245,158,11,0.10)",
  amberB:  "rgba(245,158,11,0.28)",
  violet:  "#a855f7",
  violetD: "rgba(168,85,247,0.10)",
  violetB: "rgba(168,85,247,0.28)",
  teal:    "#14b8a6",
  tealD:   "rgba(20,184,166,0.10)",
  tealB:   "rgba(20,184,166,0.28)",
};
const FONT   = "'DM Sans','Segoe UI',system-ui,sans-serif";
const RADIUS = { sm: 6, md: 9, lg: 12, xl: 16 };
const GRID   = "2fr 130px 140px 120px 110px 100px";

/* ─── GLOBAL STYLES ─────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("cmm2-css")) {
  const s = document.createElement("style");
  s.id = "cmm2-css";
  s.textContent = `
    @keyframes cmm2FadeIn    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    @keyframes cmm2SlideIn   { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:none} }
    @keyframes cmm2PulseGlow { 0%,100%{opacity:0.6} 50%{opacity:1} }
    .cmm2-panel  { animation: cmm2SlideIn  .24s cubic-bezier(.16,1,.3,1) both; }
    .cmm2-row    { transition: background .12s, border-color .12s; cursor:pointer; }
    .cmm2-row:hover { background: rgba(77,127,255,0.04) !important; }
    .cmm2-btn    { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; border:none; transition:all .18s; display:inline-flex; align-items:center; gap:6px; }
    .cmm2-btn:hover  { transform:translateY(-1px); }
    .cmm2-btn:active { transform:scale(.97); opacity:.85; }
    .cmm2-scr::-webkit-scrollbar { width:3px; }
    .cmm2-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    .cmm2-kpi { transition: transform .18s, background .18s; }
    .cmm2-kpi:hover { transform: translateY(-1px); background: rgba(77,127,255,0.04) !important; }
    .cmm2-attendee { transition: background .12s; }
    .cmm2-attendee:hover { background: rgba(77,127,255,0.04) !important; }
    .cmm2-action-btn { transition: all .16s !important; }
    .cmm2-action-btn:hover { transform: translateY(-1px) !important; }
  `;
  document.head.appendChild(s);
}

/* ─── HELPERS ───────────────────────────────────────────────── */
function classTypeColor(name = "") {
  const n = name.toLowerCase();
  if (n.includes("hiit") || n.includes("boxing") || n.includes("kick")) return C.amber;
  if (n.includes("yoga") || n.includes("pilates") || n.includes("flow")) return C.teal;
  if (n.includes("strength") || n.includes("weight") || n.includes("conditioning")) return C.red;
  if (n.includes("spin") || n.includes("cycle") || n.includes("cardio")) return "#6366f1";
  return C.cyan;
}

function fmtTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m || 0).padStart(2, "0")} ${period}`;
}

function ini(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function getCapacityStatus(booked, max) {
  if (!max) return { label: "No Limit", color: C.t3, bg: "rgba(255,255,255,0.04)", brd: C.brd };
  const pct = booked / max;
  if (pct >= 1)   return { label: "Full",  color: C.red,   bg: C.redD,   brd: C.redB,   pct: 100 };
  if (pct >= 0.8) return { label: "Open",  color: C.amber, bg: C.amberD, brd: C.amberB, pct: Math.round(pct*100) };
  if (booked > 0) return { label: "Open",  color: C.green, bg: C.greenD, brd: C.greenB, pct: Math.round(pct*100) };
  return { label: "Empty", color: C.cyan, bg: C.cyanD, brd: C.cyanB, pct: 0 };
}

const BOOKING_STATUS = {
  booked:    { label: "Booked",    color: C.cyan,  bg: C.cyanD,  brd: C.cyanB  },
  attended:  { label: "Attended",  color: C.green, bg: C.greenD, brd: C.greenB },
  no_show:   { label: "No-show",   color: C.red,   bg: C.redD,   brd: C.redB   },
  waitlist:  { label: "Waitlist",  color: C.amber, bg: C.amberD, brd: C.amberB },
  cancelled: { label: "Cancelled", color: C.t3,    bg: "rgba(255,255,255,0.04)", brd: C.brd },
};

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
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`,
    color: C.t1, fontSize: 13, fontFamily: FONT, outline: "none",
    borderRadius: 9, padding: "9px 12px", transition: "border-color .18s",
  };

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

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT }}>
      <div style={{ width: 560, maxWidth: "95vw", maxHeight: "90vh", background: C.card, border: `1px solid ${C.brd2}`, borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.8)" }}>

        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: C.violetD, border: `1px solid ${C.violetB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Dumbbell style={{ width: 13, height: 13, color: C.violet }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.t1 }}>{isEdit ? "Edit Class" : "Create Class"}</span>
          </div>
          <button className="cmm2-btn" onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: `1px solid ${C.brd}`, color: C.t3, justifyContent: "center" }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        <div className="cmm2-scr" style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 13 }}>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Class Name *</div>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Morning HIIT" style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Class Type</div>
              <select value={form.class_type} onChange={e => set("class_type", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Select type…</option>
                {CLASS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Description</div>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} placeholder="Brief description…" style={{ ...inputStyle, resize: "vertical" }} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Instructor</div>
              {coaches?.length > 0 ? (
                <select value={form.instructor} onChange={e => set("instructor", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Select coach…</option>
                  {coaches.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              ) : (
                <input value={form.instructor} onChange={e => set("instructor", e.target.value)} placeholder="Coach name" style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Location</div>
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Studio A" style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Max Capacity</div>
              <input type="number" value={form.max_capacity} onChange={e => set("max_capacity", e.target.value)} placeholder="Unlimited" min={1} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Duration (minutes)</div>
              <input type="number" value={form.duration_minutes} onChange={e => set("duration_minutes", e.target.value)} min={15} step={15} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
          </div>

          {/* Schedule type */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Schedule Type</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ v: "recurring", label: "Recurring (Weekly)", icon: RefreshCw }, { v: "single", label: "Single Date", icon: Calendar }].map(opt => {
                const Ic = opt.icon;
                const active = form.schedule_type === opt.v;
                return (
                  <button key={opt.v} className="cmm2-btn" onClick={() => set("schedule_type", opt.v)}
                    style={{ flex: 1, padding: "9px 14px", borderRadius: 9, border: `1px solid ${active ? C.cyanB : C.brd}`, background: active ? C.cyanD : "transparent", color: active ? C.cyan : C.t2, fontSize: 12, fontWeight: 600, justifyContent: "center" }}>
                    <Ic style={{ width: 12, height: 12 }} />{opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {form.schedule_type === "recurring" ? (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Days & Times</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {form.schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select value={s.day} onChange={e => setForm(f => ({ ...f, schedule: f.schedule.map((x, idx) => idx === i ? { ...x, day: e.target.value } : x) }))} style={{ ...inputStyle, flex: 1 }}>
                      {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="time" value={s.time} onChange={e => setForm(f => ({ ...f, schedule: f.schedule.map((x, idx) => idx === i ? { ...x, time: e.target.value } : x) }))} style={{ ...inputStyle, width: 120, flex: "none" }} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
                    {form.schedule.length > 1 && (
                      <button className="cmm2-btn" onClick={() => setForm(f => ({ ...f, schedule: f.schedule.filter((_, idx) => idx !== i) }))} style={{ width: 28, height: 28, borderRadius: 7, background: C.redD, border: `1px solid ${C.redB}`, color: C.red, justifyContent: "center", flexShrink: 0 }}>
                        <X style={{ width: 11, height: 11 }} />
                      </button>
                    )}
                  </div>
                ))}
                <button className="cmm2-btn" onClick={() => setForm(f => ({ ...f, schedule: [...f.schedule, { day: "Monday", time: "09:00" }] }))} style={{ padding: "7px 12px", borderRadius: 7, background: "transparent", border: `1px dashed ${C.brd2}`, color: C.t3, fontSize: 12 }}>
                  <Plus style={{ width: 11, height: 11 }} /> Add another day
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Date</div>
                <input type="date" value={form.single_date} onChange={e => set("single_date", e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Time</div>
                <input type="time" value={form.single_time} onChange={e => set("single_time", e.target.value)} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
              </div>
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
              <button className="cmm2-btn" onClick={() => set("bookings_enabled", !form.bookings_enabled)}
                style={{ width: 44, height: 24, borderRadius: 12, background: form.bookings_enabled ? C.green : C.brd2, border: "none", padding: 2, justifyContent: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "transform .2s", transform: form.bookings_enabled ? "translateX(20px)" : "none" }} />
              </button>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Booking Deadline (hours before)</div>
              <input type="number" value={form.booking_deadline_hours} onChange={e => set("booking_deadline_hours", e.target.value)} placeholder="No deadline" min={0} style={inputStyle} onFocus={e => e.target.style.borderColor = C.cyanB} onBlur={e => e.target.style.borderColor = C.brd} />
            </div>
          </div>

          {isEdit && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Status</div>
              <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 8, justifyContent: "flex-end", flexShrink: 0 }}>
          <button className="cmm2-btn" onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, background: "transparent", border: `1px solid ${C.brd}`, color: C.t2, fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button className="cmm2-btn" onClick={handleSave} disabled={!form.name.trim() || saving}
            style={{ padding: "9px 22px", borderRadius: 9, background: form.name.trim() ? C.violet : C.brd, border: "none", color: form.name.trim() ? "#fff" : C.t3, fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            <Save style={{ width: 13, height: 13 }} />{saving ? "Saving…" : isEdit ? "Save Changes" : "Create Class"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI STRIP ─────────────────────────────────────────────── */
function KpiStrip({ classes, bookings }) {
  const totalClasses  = classes.length;
  const totalBookings = bookings.length;
  const attended      = bookings.filter(b => b.status === "attended").length;
  const noShows       = bookings.filter(b => b.status === "no_show").length;

  const fillRates = classes.map(cls => {
    const cap = cls.max_capacity || 0;
    const bk  = (cls.attendee_ids || []).length;
    return cap > 0 ? bk / cap : 0;
  });
  const avgFill    = fillRates.length ? Math.round(fillRates.reduce((s,v)=>s+v,0)/fillRates.length*100) : 0;
  const noShowRate = totalBookings > 0 ? Math.round(noShows/totalBookings*100) : 0;
  const fullClasses = classes.filter(c => {
    const b = (c.attendee_ids||[]).length, m = c.max_capacity||0;
    return m > 0 && b >= m;
  }).length;

  const kpis = [
    {
      label: "Total Classes",
      val: totalClasses,
      sub: `${fullClasses} full`,
      color: C.t1,
      accent: C.cyan,
      icon: Dumbbell,
      trend: null,
    },
    {
      label: "Total Bookings",
      val: totalBookings,
      sub: "all time",
      color: C.cyan,
      accent: C.cyan,
      icon: Users,
      trend: null,
    },
    {
      label: "Attendance",
      val: attended,
      sub: `of ${totalBookings} booked`,
      color: C.green,
      accent: C.green,
      icon: Check,
      trend: totalBookings > 0 ? { pct: Math.round(attended/totalBookings*100), up: attended/totalBookings > 0.6 } : null,
    },
    {
      label: "Avg Fill Rate",
      val: `${avgFill}%`,
      sub: avgFill >= 80 ? "Excellent" : avgFill >= 50 ? "Moderate" : "Low",
      color: avgFill >= 80 ? C.green : avgFill >= 50 ? C.amber : C.red,
      accent: avgFill >= 80 ? C.green : avgFill >= 50 ? C.amber : C.red,
      icon: BarChart3,
      trend: { pct: avgFill, up: avgFill >= 50 },
    },
    {
      label: "No-show Rate",
      val: `${noShowRate}%`,
      sub: noShowRate >= 30 ? "Needs attention" : noShowRate >= 15 ? "Monitor" : "On target",
      color: noShowRate >= 30 ? C.red : noShowRate >= 15 ? C.amber : C.green,
      accent: noShowRate >= 30 ? C.red : noShowRate >= 15 ? C.amber : C.green,
      icon: XCircle,
      trend: { pct: noShowRate, up: noShowRate < 15 },
    },
  ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(5,1fr)",
      gap: "1px", background: C.brd,
      borderBottom: `1px solid ${C.brd}`, flexShrink: 0,
    }}>
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <div key={i} className="cmm2-kpi" style={{
            padding: "16px 20px", background: C.sidebar,
            display: "flex", flexDirection: "column", gap: 8, position: "relative", overflow: "hidden",
          }}>
            {/* subtle accent glow in corner */}
            <div style={{
              position: "absolute", top: -20, right: -20,
              width: 60, height: 60, borderRadius: "50%",
              background: k.accent, opacity: 0.06, pointerEvents: "none",
            }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{
                fontSize: 9.5, fontWeight: 700, color: C.t3,
                textTransform: "uppercase", letterSpacing: "0.09em",
              }}>{k.label}</div>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: `${k.accent}18`, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <Icon style={{ width: 11, height: 11, color: k.accent }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 6 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: k.color, lineHeight: 1, letterSpacing: "-0.03em" }}>
                {k.val}
              </div>
              {k.trend && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "2px 7px", borderRadius: 20, marginBottom: 3,
                  background: k.trend.up ? C.greenD : C.redD,
                  border: `1px solid ${k.trend.up ? C.greenB : C.redB}`,
                }}>
                  {k.trend.up
                    ? <TrendingUp style={{ width: 9, height: 9, color: C.green }} />
                    : <TrendingDown style={{ width: 9, height: 9, color: C.red }} />
                  }
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: k.trend.up ? C.green : C.red }}>
                    {k.trend.pct}%
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 10.5, color: C.t3, fontWeight: 500 }}>{k.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── TABLE HEADER ──────────────────────────────────────────── */
function TableHead({ sort, setSort }) {
  const cols = [
    { label: "Class",    key: "name",     flex: true  },
    { label: "Schedule", key: "time",     flex: false },
    { label: "Coach",    key: "coach",    flex: false },
    { label: "Capacity", key: "capacity", flex: false },
    { label: "Status",   key: null,       flex: false },
    { label: "Actions",  key: null,       flex: false, right: true },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: GRID,
      gap: 0, padding: "0 20px",
      height: 36,
      borderBottom: `1px solid ${C.brd}`,
      background: C.card, flexShrink: 0,
      fontFamily: FONT, alignItems: "center",
    }}>
      {cols.map((c, i) => (
        <div key={i} onClick={() => c.key && setSort(c.key)}
          style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: sort === c.key ? C.cyan : C.t3,
            cursor: c.key ? "pointer" : "default",
            display: "flex", alignItems: "center", gap: 4,
            justifyContent: c.right ? "flex-end" : "flex-start",
            userSelect: "none",
          }}>
          {c.label}
          {c.key && (
            <ChevronDown style={{
              width: 9, height: 9,
              color: sort === c.key ? C.cyan : C.t3,
              transform: sort === c.key ? "rotate(180deg)" : "none",
              transition: "transform .2s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── CLASS ROW ─────────────────────────────────────────────── */
function ClassRow({ cls, isSelected, onSelect, onDuplicate, onDelete, bookings }) {
  const color  = classTypeColor(cls.name || "");
  const booked = (cls.attendee_ids || []).length;
  const max    = cls.max_capacity || 0;
  const status = getCapacityStatus(booked, max);
  const fillPct = max > 0 ? Math.min(Math.round(booked / max * 100), 100) : 0;

  const schedLabel = (() => {
    const s = cls.schedule?.[0];
    if (!s) return fmtTime(cls.time || "");
    const days = cls.schedule.map(x => x.day).filter(Boolean).slice(0, 2).join(", ");
    return `${days}${days ? " · " : ""}${fmtTime(s.time || cls.time || "")}`.trim();
  })();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="cmm2-row" onClick={() => onSelect(cls)}
      style={{
        display: "grid", gridTemplateColumns: GRID,
        gap: 0, padding: "0 20px",
        height: 64,
        alignItems: "center",
        background: isSelected ? "rgba(77,127,255,0.06)" : "transparent",
        borderBottom: `1px solid ${C.brd}`,
        borderLeft: `3px solid ${isSelected ? C.cyan : "transparent"}`,
        fontFamily: FONT, position: "relative",
        transition: "background .12s, border-color .12s",
      }}>

      {/* Class name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, paddingRight: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: RADIUS.md,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Dumbbell style={{ width: 14, height: 14, color }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 700,
            color: isSelected ? C.cyan : C.t1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color .12s",
          }}>{cls.name || "Unnamed"}</div>
          {cls.class_type && (
            <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1 }}>{cls.class_type}</div>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Clock style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>{schedLabel || "—"}</span>
      </div>

      {/* Coach */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        {(cls.instructor || cls.coach_name) ? (
          <>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: C.cyanD, border: `1px solid ${C.cyanB}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8.5, fontWeight: 800, color: C.cyan, flexShrink: 0,
            }}>
              {ini(cls.instructor || cls.coach_name || "")}
            </div>
            <span style={{
              fontSize: 12, color: C.t2, fontWeight: 500,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{cls.instructor || cls.coach_name}</span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: C.t3 }}>—</span>
        )}
      </div>

      {/* Capacity */}
      <div style={{ paddingRight: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: status.color }}>{booked}</span>
          {max > 0 && (
            <span style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>/ {max}</span>
          )}
        </div>
        {max > 0 && (
          <div style={{ height: 4, background: C.brd2, borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              width: `${fillPct}%`, height: "100%",
              background: status.color,
              borderRadius: 4, transition: "width .5s ease",
              boxShadow: `0 0 6px ${status.color}60`,
            }} />
          </div>
        )}
      </div>

      {/* Status badge */}
      <div>
        <span style={{
          padding: "4px 10px", borderRadius: 20,
          fontSize: 10.5, fontWeight: 700,
          background: status.bg, border: `1px solid ${status.brd}`,
          color: status.color, whiteSpace: "nowrap",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: status.color, display: "inline-block",
          }} />
          {status.label}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ position: "relative" }}>
          <button className="cmm2-btn" onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 30, height: 30, borderRadius: RADIUS.md,
              background: menuOpen ? C.cyanD : "transparent",
              border: `1px solid ${menuOpen ? C.cyanB : C.brd}`,
              color: menuOpen ? C.cyan : C.t3,
              justifyContent: "center",
            }}>
            <MoreHorizontal style={{ width: 13, height: 13 }} />
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 99 }} />
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 100,
                background: C.card2, border: `1px solid ${C.brd2}`,
                borderRadius: RADIUS.lg, overflow: "hidden",
                minWidth: 162, boxShadow: "0 12px 36px rgba(0,0,0,0.65)",
              }}>
                <div style={{ padding: "4px" }}>
                  {[
                    { label: "Duplicate Class", icon: Copy,   col: C.t2,  fn: () => { onDuplicate(cls); setMenuOpen(false); } },
                    { label: "Delete Class",    icon: Trash2,  col: C.red, fn: () => { onDelete(cls.id); setMenuOpen(false); } },
                  ].map(item => {
                    const Ic = item.icon;
                    return (
                      <button key={item.label} className="cmm2-btn" onClick={item.fn}
                        style={{
                          width: "100%", justifyContent: "flex-start",
                          padding: "9px 12px", borderRadius: RADIUS.md,
                          background: "transparent", color: item.col,
                          fontSize: 12.5, fontWeight: 600,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.card3}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <Ic style={{ width: 12, height: 12 }} />{item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ATTENDEE ROW ──────────────────────────────────────────── */
function AttendeeRow({ attendee, onStatusChange, onRemove }) {
  const st      = BOOKING_STATUS[attendee.status] || BOOKING_STATUS.booked;
  const [busy, setBusy] = useState(false);

  async function mark(newStatus) {
    setBusy(true);
    await onStatusChange(attendee.id, newStatus);
    setBusy(false);
  }

  const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];
  const avatarBg = palette[(attendee.name?.charCodeAt(0) || 0) % palette.length];

  return (
    <div className="cmm2-attendee" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 16px",
      borderBottom: `1px solid ${C.brd}`,
      fontFamily: FONT,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
        background: avatarBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, color: "#fff",
      }}>
        {ini(attendee.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5, fontWeight: 700, color: C.t1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{attendee.name || "Member"}</div>
        {attendee.email && (
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1 }}>{attendee.email}</div>
        )}
      </div>
      <span style={{
        padding: "2px 8px", borderRadius: 20,
        fontSize: 9.5, fontWeight: 700,
        background: st.bg, border: `1px solid ${st.brd}`,
        color: st.color, flexShrink: 0, whiteSpace: "nowrap",
      }}>{st.label}</span>
      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
        {attendee.status !== "attended" && (
          <button className="cmm2-btn" onClick={() => mark("attended")}
            disabled={busy} title="Mark Attended"
            style={{
              width: 26, height: 26, borderRadius: 7,
              background: C.greenD, border: `1px solid ${C.greenB}`,
              color: C.green, justifyContent: "center",
            }}>
            <Check style={{ width: 10, height: 10 }} />
          </button>
        )}
        {attendee.status !== "no_show" && (
          <button className="cmm2-btn" onClick={() => mark("no_show")}
            disabled={busy} title="Mark No-show"
            style={{
              width: 26, height: 26, borderRadius: 7,
              background: C.redD, border: `1px solid ${C.redB}`,
              color: C.red, justifyContent: "center",
            }}>
            <XCircle style={{ width: 10, height: 10 }} />
          </button>
        )}
        <button className="cmm2-btn" onClick={() => onRemove(attendee.id)}
          title="Remove"
          style={{
            width: 26, height: 26, borderRadius: 7,
            background: "rgba(255,255,255,0.03)", border: `1px solid ${C.brd}`,
            color: C.t3, justifyContent: "center",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.redB; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
          <X style={{ width: 10, height: 10 }} />
        </button>
      </div>
    </div>
  );
}

/* ─── SECTION LABEL ─────────────────────────────────────────── */
function SectionLabel({ children, right }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 16px 7px",
    }}>
      <span style={{
        fontSize: 9.5, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.09em", color: C.t3,
      }}>{children}</span>
      {right}
    </div>
  );
}

/* ─── CLASS CONTROL CENTER ──────────────────────────────────── */
function ClassControlCenter({ cls, bookings, allMemberships, onClose, onUpdateClass, onDeleteClass }) {
  const color   = classTypeColor(cls.name || "");
  const booked  = (cls.attendee_ids || []).length;
  const max     = cls.max_capacity || 0;
  const status  = getCapacityStatus(booked, max);
  const fillPct = max > 0 ? Math.min(Math.round(booked / max * 100), 100) : 0;
  const isFull  = max > 0 && booked >= max;

  const [attendees, setAttendees] = useState(() => {
    const ids = cls.attendee_ids || [];
    return ids.map((id, i) => {
      const bk = bookings.find(b => b.client_id === id || b.user_id === id);
      const mb = allMemberships.find(m => m.user_id === id);
      return {
        id,
        name:   bk?.client_name  || mb?.user_name  || `Member ${i + 1}`,
        email:  bk?.client_email || mb?.user_email || "",
        status: bk?.status || "booked",
      };
    });
  });

  const [addSearch, setAddSearch] = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [saving,  setSaving]      = useState(false);

  const attended = attendees.filter(a => a.status === "attended").length;
  const noShows  = attendees.filter(a => a.status === "no_show").length;
  const stillBooked = attendees.filter(a => a.status === "booked").length;

  const schedLabel = (() => {
    const s = cls.schedule?.[0];
    if (!s) return fmtTime(cls.time || "");
    const days = cls.schedule.map(x => x.day).filter(Boolean).join(", ");
    return `${days}${days ? " · " : ""}${fmtTime(s.time || cls.time || "")}`.trim();
  })();

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
    setAttendees(prev => [...prev, {
      id, name: member.user_name || member.name || "Member",
      email: member.user_email || "", status: "booked",
    }]);
    setShowAdd(false);
    setAddSearch("");
    setSaving(false);
  }

  const filteredMembers = (allMemberships || []).filter(m => {
    const name = (m.user_name || "").toLowerCase();
    const q    = addSearch.toLowerCase();
    return (!q || name.includes(q)) && !(cls.attendee_ids || []).includes(m.user_id);
  }).slice(0, 8);

  const quickStats = [
    { label: "Booked",   val: stillBooked, color: C.cyan,  bg: C.cyanD,  brd: C.cyanB  },
    { label: "Attended", val: attended,     color: C.green, bg: C.greenD, brd: C.greenB },
    { label: "No-shows", val: noShows,      color: noShows > 0 ? C.red : C.t3, bg: noShows > 0 ? C.redD : "rgba(255,255,255,0.03)", brd: noShows > 0 ? C.redB : C.brd },
  ];

  return (
    <div className="cmm2-panel" style={{
      width: 340, flexShrink: 0, background: C.sidebar,
      borderLeft: `1px solid ${C.brd}`,
      display: "flex", flexDirection: "column", height: "100%",
      fontFamily: FONT,
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${C.brd}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{
                width: 32, height: 32, borderRadius: RADIUS.md,
                background: `${color}18`, border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Dumbbell style={{ width: 13, height: 13, color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 800, color: C.t1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  letterSpacing: "-0.02em",
                }}>{cls.name}</div>
              </div>
            </div>
            {schedLabel && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 40 }}>
                <Clock style={{ width: 10, height: 10, color: C.t3 }} />
                <span style={{ fontSize: 11.5, color: C.t2 }}>{schedLabel}</span>
              </div>
            )}
            {(cls.instructor || cls.coach_name) && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5, marginTop: 4, marginLeft: 40,
              }}>
                <Users style={{ width: 10, height: 10, color: C.t3 }} />
                <span style={{ fontSize: 11.5, color: C.t2 }}>
                  {cls.instructor || cls.coach_name}
                </span>
              </div>
            )}
          </div>
          <button className="cmm2-btn" onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: RADIUS.md,
              background: "transparent", border: `1px solid ${C.brd}`,
              color: C.t3, justifyContent: "center", flexShrink: 0, marginLeft: 8,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.color = C.t2; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>

        {/* Capacity section */}
        <div style={{
          padding: "10px 12px", borderRadius: RADIUS.md,
          background: C.card, border: `1px solid ${C.brd}`, marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: C.t3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>Capacity</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: status.color }}>{booked}</span>
              {max > 0 && <span style={{ fontSize: 11, color: C.t3 }}>/ {max}</span>}
              <span style={{
                padding: "1px 8px", borderRadius: 20,
                fontSize: 9.5, fontWeight: 700,
                background: status.bg, border: `1px solid ${status.brd}`,
                color: status.color,
              }}>{status.label}</span>
            </div>
          </div>
          {max > 0 && (
            <div style={{ height: 6, background: C.brd2, borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: `${fillPct}%`, height: "100%",
                background: status.color, borderRadius: 4,
                transition: "width .5s ease",
                boxShadow: `0 0 8px ${status.color}50`,
              }} />
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {quickStats.map((s, i) => (
            <div key={i} style={{
              padding: "8px 10px", borderRadius: RADIUS.md,
              background: s.bg, border: `1px solid ${s.brd}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 3, fontWeight: 600 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Attendees Header ── */}
      <div style={{
        padding: "9px 16px 8px",
        borderBottom: `1px solid ${C.brd}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.t1, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Attendees
          <span style={{
            marginLeft: 7, padding: "1px 7px", borderRadius: 20,
            background: C.cyanD, border: `1px solid ${C.cyanB}`,
            color: C.cyan, fontSize: 10, fontWeight: 700,
          }}>{attendees.length}</span>
        </span>
        <button className="cmm2-btn" onClick={() => setShowAdd(o => !o)} disabled={isFull}
          style={{
            padding: "5px 12px", borderRadius: RADIUS.md,
            background: showAdd ? C.cyanD : isFull ? "rgba(255,255,255,0.03)" : C.cyanD,
            border: `1px solid ${showAdd ? C.cyan : isFull ? C.brd : C.cyanB}`,
            color: isFull ? C.t3 : C.cyan,
            fontSize: 11, fontWeight: 700,
            cursor: isFull ? "not-allowed" : "pointer",
          }}>
          <UserPlus style={{ width: 10, height: 10 }} />
          {isFull ? "Class Full" : showAdd ? "Close" : "Add Member"}
        </button>
      </div>

      {/* ── Add Member Search ── */}
      {showAdd && (
        <div style={{
          padding: "10px 12px", borderBottom: `1px solid ${C.brd}`,
          flexShrink: 0, background: C.card2,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.card, border: `1px solid ${C.brd}`,
            borderRadius: RADIUS.md, padding: "7px 10px", marginBottom: 7,
          }}>
            <Search style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
            <input value={addSearch} onChange={e => setAddSearch(e.target.value)}
              placeholder="Search members…" autoFocus
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: C.t1, fontSize: 12, fontFamily: FONT,
              }} />
          </div>
          <div style={{ maxHeight: 168, overflowY: "auto" }}>
            {filteredMembers.length === 0 ? (
              <div style={{ fontSize: 11, color: C.t3, textAlign: "center", padding: "12px 0" }}>
                No members found
              </div>
            ) : filteredMembers.map(m => {
              const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#4d7fff","#10b981"];
              const bg = palette[((m.user_name||"").charCodeAt(0)||0) % palette.length];
              return (
                <div key={m.user_id} onClick={() => handleAddMember(m)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "7px 8px", borderRadius: RADIUS.md,
                    cursor: "pointer", transition: "background .1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.cyanD}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: bg, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 10.5, fontWeight: 800,
                    color: "#fff", flexShrink: 0,
                  }}>
                    {ini(m.user_name || "")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>
                      {m.user_name || "Member"}
                    </div>
                    {m.user_email && (
                      <div style={{ fontSize: 10, color: C.t3 }}>{m.user_email}</div>
                    )}
                  </div>
                  <ChevronRight style={{ width: 12, height: 12, color: C.t3 }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Attendees List ── */}
      <div className="cmm2-scr" style={{ flex: 1, overflowY: "auto" }}>
        {attendees.length === 0 ? (
          <div style={{ padding: "36px 16px", textAlign: "center" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: C.cyanD, border: `1px solid ${C.cyanB}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <Users style={{ width: 18, height: 18, color: C.cyan }} />
            </div>
            <div style={{ fontSize: 13, color: C.t2, fontWeight: 700, marginBottom: 4 }}>No attendees yet</div>
            <div style={{ fontSize: 11.5, color: C.t3 }}>Add members using the button above</div>
          </div>
        ) : attendees.map(a => (
          <AttendeeRow key={a.id} attendee={a}
            onStatusChange={handleStatusChange}
            onRemove={handleRemove} />
        ))}
      </div>

      {/* ── Footer Quick Actions ── */}
      <div style={{
        padding: "12px 14px", borderTop: `1px solid ${C.brd}`,
        display: "flex", flexDirection: "column", gap: 7, flexShrink: 0,
      }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.09em" }}>
          Class Actions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          <button className="cmm2-action-btn cmm2-btn"
            style={{
              padding: "9px 10px", borderRadius: RADIUS.md, justifyContent: "center",
              background: C.cyanD, border: `1px solid ${C.cyanB}`,
              color: C.cyan, fontSize: 11.5, fontWeight: 700,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `rgba(77,127,255,0.18)`; e.currentTarget.style.borderColor = C.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.cyanD; e.currentTarget.style.borderColor = C.cyanB; }}>
            <MessageCircle style={{ width: 11, height: 11 }} /> Message All
          </button>
          <button className="cmm2-action-btn cmm2-btn"
            style={{
              padding: "9px 10px", borderRadius: RADIUS.md, justifyContent: "center",
              background: C.amberD, border: `1px solid ${C.amberB}`,
              color: C.amber, fontSize: 11.5, fontWeight: 700,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `rgba(245,158,11,0.18)`; e.currentTarget.style.borderColor = C.amber; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.amberD; e.currentTarget.style.borderColor = C.amberB; }}>
            <Settings2 style={{ width: 11, height: 11 }} /> Adj. Capacity
          </button>
        </div>
        <button className="cmm2-action-btn cmm2-btn"
          onClick={() => onDeleteClass(cls.id)}
          style={{
            width: "100%", padding: "9px 12px",
            borderRadius: RADIUS.md, justifyContent: "center",
            background: C.redD, border: `1px solid ${C.redB}`,
            color: C.red, fontSize: 12, fontWeight: 700,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `rgba(255,77,109,0.18)`; e.currentTarget.style.borderColor = C.red; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.redD; e.currentTarget.style.borderColor = C.redB; }}>
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
  initialClassId = null,
}) {
  const [search,      setSearch]      = useState("");
  const [sort,        setSort]        = useState("name");
  const [filter,      setFilter]      = useState("all");
  const [selected,    setSelected]    = useState(null);
  const [coachFilter, setCoachFilter] = useState("all");
  const [editing,     setEditing]     = useState(null); // null | "new" | cls object

  async function handleSaveClass(data) {
    if (editing?.id) {
      await onUpdateClass?.(editing.id, data);
    } else {
      await onCreateClass?.(data);
    }
    setEditing(null);
  }

  useEffect(() => {
    if (!open) { setSelected(null); setSearch(""); setEditing(null); return; }
    if (initialClassId) {
      const match = classes.find(c => c.id === initialClassId);
      if (match) setSelected(match);
    }
  }, [open, initialClassId]);

  const visible = useMemo(() => {
    let list = [...classes];
    if (filter === "full")  list = list.filter(c => { const b=(c.attendee_ids||[]).length, m=c.max_capacity||0; return m>0&&b>=m; });
    if (filter === "open")  list = list.filter(c => { const b=(c.attendee_ids||[]).length, m=c.max_capacity||0; return m===0||b<m; });
    if (filter === "empty") list = list.filter(c => (c.attendee_ids||[]).length === 0);
    if (coachFilter !== "all") list = list.filter(c => (c.instructor||c.coach_name) === coachFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => (c.name||"").toLowerCase().includes(q) || (c.instructor||"").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      if (sort === "capacity") return (b.attendee_ids||[]).length - (a.attendee_ids||[]).length;
      if (sort === "coach")    return (a.instructor||"").localeCompare(b.instructor||"");
      return (a.name||"").localeCompare(b.name||"");
    });
    return list;
  }, [classes, filter, coachFilter, search, sort]);

  async function handleDuplicate(cls) {
    const { id, created_date, updated_date, attendee_ids, ...rest } = cls;
    await onCreateClass?.({ ...rest, name: `${cls.name} (copy)`, attendee_ids: [] });
  }

  const coachNames = [...new Set(classes.map(c => c.instructor || c.coach_name).filter(Boolean))];

  const filterOptions = [
    { id: "all",   label: "All Classes"  },
    { id: "open",  label: "Open"         },
    { id: "full",  label: "Full"         },
    { id: "empty", label: "Empty"        },
  ];

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      display: "flex", background: "rgba(0,0,0,0.88)",
      backdropFilter: "blur(10px)", fontFamily: FONT,
    }}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: C.bg, maxWidth: "100vw", animation: "cmm2FadeIn .2s ease both",
      }}>

        {/* ── Top Bar ── */}
        <div style={{
          height: 56, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
          background: C.sidebar, borderBottom: `1px solid ${C.brd}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: RADIUS.md,
              background: C.violetD, border: `1px solid ${C.violetB}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Dumbbell style={{ width: 14, height: 14, color: C.violet }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.t1, letterSpacing: "-0.02em" }}>
                Class Management
              </div>
              <div style={{ fontSize: 10.5, color: C.t3 }}>
                {classes.length} classes · {bookings.length} total bookings
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="cmm2-btn" onClick={() => setEditing("new")}
              style={{
                padding: "8px 18px", borderRadius: RADIUS.md,
                background: C.violet, border: "none",
                color: "#fff", fontSize: 12.5, fontWeight: 700,
                boxShadow: `0 2px 12px ${C.violet}40`,
              }}>
              <Plus style={{ width: 13, height: 13 }} /> New Class
            </button>
            <button className="cmm2-btn" onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: RADIUS.md,
                background: "transparent", border: `1px solid ${C.brd}`,
                color: C.t3, justifyContent: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.color = C.t2; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
        </div>

        {/* ── KPI Strip ── */}
        <KpiStrip classes={classes} bookings={bookings} />

        {/* ── Controls ── */}
        <div style={{
          padding: "10px 20px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: `1px solid ${C.brd}`, flexShrink: 0,
          background: C.card, flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            background: C.card2, border: `1px solid ${C.brd}`,
            borderRadius: RADIUS.md, padding: "7px 12px",
            flex: 1, minWidth: 200, transition: "border-color .18s",
          }}
          onFocus={() => {}}
          >
            <Search style={{ width: 12, height: 12, color: C.t3, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search classes or coaches…"
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: C.t1, fontSize: 12.5, fontFamily: FONT,
              }} />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
                <X style={{ width: 11, height: 11, color: C.t3 }} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={{
            display: "flex", gap: 2, padding: "3px",
            background: C.card2, border: `1px solid ${C.brd}`,
            borderRadius: RADIUS.md,
          }}>
            {filterOptions.map(f => (
              <button key={f.id} className="cmm2-btn" onClick={() => setFilter(f.id)}
                style={{
                  padding: "5px 12px", borderRadius: 7,
                  fontSize: 11.5, fontWeight: filter === f.id ? 700 : 400,
                  background: filter === f.id ? C.cyanD : "transparent",
                  border: `1px solid ${filter === f.id ? C.cyanB : "transparent"}`,
                  color: filter === f.id ? C.cyan : C.t3,
                  transition: "all .15s",
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Coach filter */}
          {coachNames.length > 0 && (
            <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)}
              style={{
                padding: "7px 12px", borderRadius: RADIUS.md,
                background: C.card2, border: `1px solid ${C.brd}`,
                color: C.t2, fontSize: 12, outline: "none",
                cursor: "pointer", fontFamily: FONT,
              }}>
              <option value="all">All Coaches</option>
              {coachNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}

          <span style={{
            fontSize: 11, color: C.t3, marginLeft: "auto", whiteSpace: "nowrap",
          }}>
            {visible.length} result{visible.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Main Area ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Table */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <TableHead sort={sort} setSort={setSort} />

            <div className="cmm2-scr" style={{ flex: 1, overflowY: "auto" }}>
              {visible.length === 0 ? (
                <div style={{ padding: "72px 24px", textAlign: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: C.cyanD, border: `1px solid ${C.cyanB}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <Dumbbell style={{ width: 22, height: 22, color: C.cyan }} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.t2, marginBottom: 7 }}>
                    {classes.length === 0 ? "No classes yet" : "No classes match"}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.t3, marginBottom: 22 }}>
                    {classes.length === 0
                      ? "Create your first class to get started"
                      : "Try adjusting your search or filters"}
                  </div>
                  {classes.length === 0 && (
                    <button className="cmm2-btn" onClick={() => setEditing("new")}
                      style={{
                        padding: "10px 22px", borderRadius: RADIUS.md,
                        background: C.violet, border: "none",
                        color: "#fff", fontSize: 13, fontWeight: 700,
                        margin: "0 auto", display: "inline-flex",
                        boxShadow: `0 4px 16px ${C.violet}40`,
                      }}>
                      <Plus style={{ width: 14, height: 14 }} /> Create First Class
                    </button>
                  )}
                </div>
              ) : visible.map(cls => (
                <ClassRow
                  key={cls.id}
                  cls={cls}
                  isSelected={selected?.id === cls.id}
                  onSelect={c => setSelected(prev => prev?.id === c.id ? null : c)}
                  onDuplicate={handleDuplicate}
                  onDelete={id => {
                    onDeleteClass?.(id);
                    if (selected?.id === id) setSelected(null);
                  }}
                  bookings={bookings.filter(b => b.class_id === cls.id || b.session_id === cls.id)}
                />
              ))}
            </div>

            {/* Table footer */}
            <div style={{
              padding: "8px 20px", borderTop: `1px solid ${C.brd}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0, background: C.card,
            }}>
              <span style={{ fontSize: 10.5, color: C.t3 }}>
                Showing {visible.length} of {classes.length} classes
              </span>
              {selected && (
                <button className="cmm2-btn" onClick={() => setSelected(null)}
                  style={{
                    padding: "4px 10px", borderRadius: 6,
                    background: C.cyanD, border: `1px solid ${C.cyanB}`,
                    color: C.cyan, fontSize: 10.5, fontWeight: 700,
                  }}>
                  <X style={{ width: 9, height: 9 }} /> Deselect
                </button>
              )}
            </div>
          </div>

          {/* Control Center Panel */}
          {selected && (
            <ClassControlCenter
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

      {/* Class Editor */}
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