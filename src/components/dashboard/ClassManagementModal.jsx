import { useState, useMemo, useEffect } from "react";
import {
  X, Search, Plus, Users, Clock, Check, Dumbbell,
  Trash2, Copy, UserPlus, ChevronDown, MoreHorizontal,
  XCircle, BarChart3, Settings2, ChevronRight,
  MessageCircle,
} from "lucide-react";

/* ─── DESIGN TOKENS — Content Hub aesthetic ──────────────────── */
const C = {
  bg:      "#000000",
  surface: "#0a0a0a",
  card:    "#111111",
  card2:   "#161616",
  card3:   "#1c1c1c",
  brd:     "#222222",
  brd2:    "#2a2a2a",
  t1:      "#ffffff",
  t2:      "#888888",
  t3:      "#444444",
  blue:    "#4d7fff",
  blueD:   "rgba(77,127,255,0.08)",
  blueB:   "rgba(77,127,255,0.20)",
  blueM:   "rgba(77,127,255,0.14)",
  red:     "#e05252",
  redD:    "rgba(224,82,82,0.08)",
  redB:    "rgba(224,82,82,0.20)",
  green:   "#3d9e6a",
  greenD:  "rgba(61,158,106,0.08)",
  greenB:  "rgba(61,158,106,0.20)",
};
const FONT   = "'DM Sans','Segoe UI',system-ui,sans-serif";
const R      = { sm: 4, md: 6, lg: 8, xl: 12 };
const GRID   = "2fr 130px 140px 110px 90px 80px";

/* ─── INJECT STYLES ─────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("cmm3-css")) {
  const s = document.createElement("style");
  s.id = "cmm3-css";
  s.textContent = `
    @keyframes cmm3Fade   { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
    @keyframes cmm3Slide  { from{opacity:0;transform:translateX(14px)} to{opacity:1;transform:none} }
    .cmm3-panel  { animation: cmm3Slide .22s cubic-bezier(.16,1,.3,1) both; }
    .cmm3-row    { transition: background .1s; cursor:pointer; }
    .cmm3-row:hover { background: rgba(255,255,255,0.022) !important; }
    .cmm3-btn    { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; border:none; transition:all .15s; display:inline-flex; align-items:center; gap:6px; }
    .cmm3-btn:active { opacity:.8; transform:scale(.98); }
    .cmm3-scr::-webkit-scrollbar { width:2px; }
    .cmm3-scr::-webkit-scrollbar-thumb { background:#222; border-radius:2px; }
    .cmm3-att { transition: background .1s; }
    .cmm3-att:hover { background: rgba(255,255,255,0.018) !important; }
    .cmm3-pill { transition: all .15s; }
    .cmm3-pill:hover { border-color: rgba(77,127,255,0.3) !important; color: #fff !important; }
  `;
  document.head.appendChild(s);
}

/* ─── HELPERS ───────────────────────────────────────────────── */
function fmtTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m || 0).padStart(2, "0")} ${period}`;
}
function ini(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "—";
}
function getCapacity(booked, max) {
  if (!max) return { label: "No Limit", color: C.t3, bg: "transparent", brd: C.brd, pct: 0 };
  const pct = booked / max;
  if (pct >= 1)   return { label: "Full",  color: C.red,  bg: C.redD,  brd: C.redB,  pct: 100 };
  if (pct >= 0.8) return { label: "Near",  color: C.t2,   bg: "transparent", brd: C.brd2, pct: Math.round(pct*100) };
  if (booked > 0) return { label: "Open",  color: C.blue, bg: C.blueD, brd: C.blueB, pct: Math.round(pct*100) };
  return { label: "Empty", color: C.t3, bg: "transparent", brd: C.brd, pct: 0 };
}
const BOOKING_STATUS = {
  booked:    { label: "Booked",    color: C.blue,  bg: C.blueD,  brd: C.blueB  },
  attended:  { label: "Attended",  color: C.green, bg: C.greenD, brd: C.greenB },
  no_show:   { label: "No-show",   color: C.red,   bg: C.redD,   brd: C.redB   },
  waitlist:  { label: "Waitlist",  color: C.t2,    bg: "rgba(255,255,255,0.04)", brd: C.brd2 },
  cancelled: { label: "Cancelled", color: C.t3,    bg: "transparent",           brd: C.brd  },
};

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
  const attRate    = totalBookings > 0 ? Math.round(attended/totalBookings*100) : 0;

  const kpis = [
    { label: "Total Classes",  val: totalClasses,        sub: `${classes.filter(c=>{const b=(c.attendee_ids||[]).length,m=c.max_capacity||0;return m>0&&b>=m}).length} at capacity`, icon: Dumbbell },
    { label: "Total Bookings", val: totalBookings,       sub: "all time",                    icon: Users    },
    { label: "Attendance",     val: attended,            sub: `${attRate}% attendance rate`, icon: Check    },
    { label: "Avg Fill Rate",  val: `${avgFill}%`,       sub: avgFill >= 70 ? "On track" : "Needs attention", icon: BarChart3 },
    { label: "No-show Rate",   val: `${noShowRate}%`,    sub: noShowRate < 15 ? "On target" : "Monitor",  icon: XCircle   },
  ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(5,1fr)",
      gap: 0, background: C.brd,
      borderBottom: `1px solid ${C.brd}`, flexShrink: 0,
    }}>
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <div key={i} style={{
            padding: "18px 22px", background: C.surface,
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {k.label}
              </span>
              <Icon style={{ width: 11, height: 11, color: C.t3 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.t1, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {k.val}
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
    { label: "Class",    key: "name"     },
    { label: "Schedule", key: "time"     },
    { label: "Coach",    key: "coach"    },
    { label: "Capacity", key: "capacity" },
    { label: "Status",   key: null       },
    { label: "Actions",  key: null, right: true },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: GRID,
      padding: "0 20px", height: 34,
      borderBottom: `1px solid ${C.brd}`,
      background: C.surface, flexShrink: 0,
      fontFamily: FONT, alignItems: "center",
    }}>
      {cols.map((c, i) => (
        <div key={i} onClick={() => c.key && setSort(c.key)}
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: sort === c.key ? C.blue : C.t3,
            cursor: c.key ? "pointer" : "default",
            display: "flex", alignItems: "center", gap: 4,
            justifyContent: c.right ? "flex-end" : "flex-start",
            userSelect: "none", transition: "color .15s",
          }}>
          {c.label}
          {c.key && (
            <ChevronDown style={{
              width: 8, height: 8,
              color: sort === c.key ? C.blue : C.t3,
              transform: sort === c.key ? "rotate(180deg)" : "none",
              transition: "transform .2s, color .15s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── CLASS ROW ─────────────────────────────────────────────── */
function ClassRow({ cls, isSelected, onSelect, onDuplicate, onDelete, bookings }) {
  const booked  = (cls.attendee_ids || []).length;
  const max     = cls.max_capacity || 0;
  const status  = getCapacity(booked, max);
  const fillPct = max > 0 ? Math.min(Math.round(booked / max * 100), 100) : 0;

  const schedLabel = (() => {
    const s = cls.schedule?.[0];
    if (!s) return fmtTime(cls.time || "");
    const days = cls.schedule.map(x => x.day).filter(Boolean).slice(0, 2).join(", ");
    return `${days}${days ? " · " : ""}${fmtTime(s.time || cls.time || "")}`.trim();
  })();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="cmm3-row" onClick={() => onSelect(cls)}
      style={{
        display: "grid", gridTemplateColumns: GRID,
        padding: "0 20px", height: 60,
        alignItems: "center",
        background: isSelected ? "rgba(77,127,255,0.04)" : "transparent",
        borderBottom: `1px solid ${C.brd}`,
        borderLeft: `2px solid ${isSelected ? C.blue : "transparent"}`,
        fontFamily: FONT,
        transition: "background .1s, border-color .1s",
      }}>
      {/* Class */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, paddingRight: 16 }}>
        <div style={{
          width: 30, height: 30, borderRadius: R.md,
          background: isSelected ? C.blueD : C.card2,
          border: `1px solid ${isSelected ? C.blueB : C.brd}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all .15s",
        }}>
          <Dumbbell style={{ width: 13, height: 13, color: isSelected ? C.blue : C.t3 }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: isSelected ? C.blue : C.t1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            transition: "color .15s",
          }}>{cls.name || "Unnamed"}</div>
          {cls.class_type && (
            <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1 }}>{cls.class_type}</div>
          )}
        </div>
      </div>
      {/* Schedule */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Clock style={{ width: 10, height: 10, color: C.t3, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>{schedLabel || "—"}</span>
      </div>
      {/* Coach */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        {(cls.instructor || cls.coach_name) ? (
          <>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: C.card3, border: `1px solid ${C.brd2}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, fontWeight: 800, color: C.t2, flexShrink: 0,
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
      <div style={{ paddingRight: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{booked}</span>
          {max > 0 && <span style={{ fontSize: 10.5, color: C.t3 }}>/ {max}</span>}
        </div>
        {max > 0 && (
          <div style={{ height: 2, background: C.brd2, borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${fillPct}%`, height: "100%",
              background: status.color === C.red ? C.red : C.blue,
              borderRadius: 2, transition: "width .5s ease",
            }} />
          </div>
        )}
      </div>
      {/* Status */}
      <div>
        <span style={{
          padding: "3px 9px", borderRadius: R.sm,
          fontSize: 10, fontWeight: 600,
          background: status.bg,
          border: `1px solid ${status.brd}`,
          color: status.color,
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
        }}>
          {status.label}
        </span>
      </div>
      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ position: "relative" }}>
          <button className="cmm3-btn" onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 28, height: 28, borderRadius: R.md,
              background: menuOpen ? C.blueD : "transparent",
              border: `1px solid ${menuOpen ? C.blueB : C.brd}`,
              color: menuOpen ? C.blue : C.t3,
              justifyContent: "center", transition: "all .15s",
            }}>
            <MoreHorizontal style={{ width: 12, height: 12 }} />
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 99 }} />
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 5px)", zIndex: 100,
                background: C.card2, border: `1px solid ${C.brd2}`,
                borderRadius: R.lg, overflow: "hidden",
                minWidth: 158, boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
              }}>
                <div style={{ padding: "4px" }}>
                  {[
                    { label: "Duplicate", icon: Copy,  col: C.t2, fn: () => { onDuplicate(cls); setMenuOpen(false); } },
                    { label: "Delete",    icon: Trash2, col: C.red, fn: () => { onDelete(cls.id); setMenuOpen(false); } },
                  ].map(item => {
                    const Ic = item.icon;
                    return (
                      <button key={item.label} className="cmm3-btn" onClick={item.fn}
                        style={{
                          width: "100%", justifyContent: "flex-start",
                          padding: "9px 12px", borderRadius: R.md,
                          background: "transparent", color: item.col,
                          fontSize: 12, fontWeight: 500,
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = C.card3}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <Ic style={{ width: 11, height: 11 }} />{item.label}
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
  const st   = BOOKING_STATUS[attendee.status] || BOOKING_STATUS.booked;
  const [busy, setBusy] = useState(false);

  async function mark(newStatus) {
    setBusy(true);
    await onStatusChange(attendee.id, newStatus);
    setBusy(false);
  }

  return (
    <div className="cmm3-att" style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 16px",
      borderBottom: `1px solid ${C.brd}`,
      fontFamily: FONT,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: C.card3, border: `1px solid ${C.brd2}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, color: C.t2,
      }}>
        {ini(attendee.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5, fontWeight: 600, color: C.t1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{attendee.name || "Member"}</div>
        {attendee.email && (
          <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{attendee.email}</div>
        )}
      </div>
      <span style={{
        padding: "2px 8px", borderRadius: R.sm,
        fontSize: 9.5, fontWeight: 600,
        background: st.bg, border: `1px solid ${st.brd}`,
        color: st.color, flexShrink: 0, whiteSpace: "nowrap",
        letterSpacing: "0.02em",
      }}>{st.label}</span>
      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
        {attendee.status !== "attended" && (
          <button className="cmm3-btn" onClick={() => mark("attended")}
            disabled={busy} title="Mark Attended"
            style={{
              width: 24, height: 24, borderRadius: R.md,
              background: "transparent", border: `1px solid ${C.brd}`,
              color: C.t3, justifyContent: "center",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.greenB; e.currentTarget.style.color = C.green; e.currentTarget.style.background = C.greenD; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; e.currentTarget.style.background = "transparent"; }}>
            <Check style={{ width: 9, height: 9 }} />
          </button>
        )}
        {attendee.status !== "no_show" && (
          <button className="cmm3-btn" onClick={() => mark("no_show")}
            disabled={busy} title="Mark No-show"
            style={{
              width: 24, height: 24, borderRadius: R.md,
              background: "transparent", border: `1px solid ${C.brd}`,
              color: C.t3, justifyContent: "center",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.redB; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redD; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; e.currentTarget.style.background = "transparent"; }}>
            <XCircle style={{ width: 9, height: 9 }} />
          </button>
        )}
        <button className="cmm3-btn" onClick={() => onRemove(attendee.id)} title="Remove"
          style={{
            width: 24, height: 24, borderRadius: R.md,
            background: "transparent", border: `1px solid ${C.brd}`,
            color: C.t3, justifyContent: "center",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.redB; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; e.currentTarget.style.background = "transparent"; }}>
          <X style={{ width: 9, height: 9 }} />
        </button>
      </div>
    </div>
  );
}

/* ─── CLASS CONTROL CENTER ──────────────────────────────────── */
function ClassControlCenter({ cls, bookings, allMemberships, onClose, onUpdateClass, onDeleteClass }) {
  const booked  = (cls.attendee_ids || []).length;
  const max     = cls.max_capacity || 0;
  const status  = getCapacity(booked, max);
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
  const [showAdd,   setShowAdd]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  const attended    = attendees.filter(a => a.status === "attended").length;
  const noShows     = attendees.filter(a => a.status === "no_show").length;
  const stillBooked = attendees.filter(a => a.status === "booked").length;

  const schedLabel = (() => {
    const s = cls.schedule?.[0];
    if (!s) return fmtTime(cls.time || "");
    const days = cls.schedule.map(x => x.day).filter(Boolean).join(", ");
    return `${days}${days ? " · " : ""}${fmtTime(s.time || cls.time || "")}`.trim();
  })();

  async function handleStatusChange(id, newStatus) {
    setAttendees(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  }
  async function handleRemove(id) {
    const updated = (cls.attendee_ids || []).filter(x => x !== id);
    setSaving(true);
    await onUpdateClass(cls.id, { attendee_ids: updated });
    setAttendees(prev => prev.filter(a => a.id !== id));
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
    setShowAdd(false); setAddSearch(""); setSaving(false);
  }

  const filteredMembers = (allMemberships || []).filter(m => {
    const name = (m.user_name || "").toLowerCase();
    const q    = addSearch.toLowerCase();
    return (!q || name.includes(q)) && !(cls.attendee_ids || []).includes(m.user_id);
  }).slice(0, 8);

  const stats = [
    { label: "Booked",   val: stillBooked },
    { label: "Attended", val: attended    },
    { label: "No-shows", val: noShows     },
  ];

  return (
    <div className="cmm3-panel" style={{
      width: 320, flexShrink: 0,
      background: C.surface,
      borderLeft: `1px solid ${C.brd}`,
      display: "flex", flexDirection: "column", height: "100%",
      fontFamily: FONT,
    }}>
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: `1px solid ${C.brd}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, marginBottom: 6, letterSpacing: "-0.02em" }}>
              {cls.name}
            </div>
            {schedLabel && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <Clock style={{ width: 10, height: 10, color: C.t3 }} />
                <span style={{ fontSize: 11, color: C.t2 }}>{schedLabel}</span>
              </div>
            )}
            {(cls.instructor || cls.coach_name) && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Users style={{ width: 10, height: 10, color: C.t3 }} />
                <span style={{ fontSize: 11, color: C.t2 }}>{cls.instructor || cls.coach_name}</span>
              </div>
            )}
          </div>
          <button className="cmm3-btn" onClick={onClose}
            style={{
              width: 26, height: 26, borderRadius: R.md,
              background: "transparent", border: `1px solid ${C.brd}`,
              color: C.t3, justifyContent: "center", flexShrink: 0, marginLeft: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.color = C.t2; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}>
            <X style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* Capacity bar */}
        <div style={{
          padding: "12px 14px", borderRadius: R.lg,
          background: C.card, border: `1px solid ${C.brd}`,
          marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Capacity
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{booked}</span>
              {max > 0 && <span style={{ fontSize: 10, color: C.t3 }}>/ {max}</span>}
              <span style={{
                padding: "2px 8px", borderRadius: R.sm,
                fontSize: 9.5, fontWeight: 600, letterSpacing: "0.02em",
                background: status.bg, border: `1px solid ${status.brd}`, color: status.color,
              }}>{status.label}</span>
            </div>
          </div>
          {max > 0 && (
            <div style={{ height: 2, background: C.brd2, borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                width: `${fillPct}%`, height: "100%",
                background: status.color === C.red ? C.red : C.blue,
                borderRadius: 2, transition: "width .5s ease",
              }} />
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              padding: "10px 10px 8px",
              borderRadius: R.md,
              background: C.card,
              border: `1px solid ${C.brd}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.t1, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4, fontWeight: 600 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendees header */}
      <div style={{
        padding: "10px 16px 9px",
        borderBottom: `1px solid ${C.brd}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.t2, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Attendees
          <span style={{
            marginLeft: 8, padding: "1px 7px", borderRadius: R.sm,
            background: C.blueD, border: `1px solid ${C.blueB}`,
            color: C.blue, fontSize: 9.5, fontWeight: 700,
          }}>{attendees.length}</span>
        </span>
        <button className="cmm3-btn" onClick={() => setShowAdd(o => !o)} disabled={isFull}
          style={{
            padding: "5px 11px", borderRadius: R.md,
            background: showAdd ? C.blueD : "transparent",
            border: `1px solid ${showAdd ? C.blueB : C.brd}`,
            color: isFull ? C.t3 : showAdd ? C.blue : C.t2,
            fontSize: 11, fontWeight: 600,
            cursor: isFull ? "not-allowed" : "pointer",
          }}>
          <UserPlus style={{ width: 9, height: 9 }} />
          {isFull ? "Full" : showAdd ? "Close" : "Add"}
        </button>
      </div>

      {/* Add member search */}
      {showAdd && (
        <div style={{
          padding: "10px 12px", borderBottom: `1px solid ${C.brd}`,
          flexShrink: 0, background: C.card,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.surface, border: `1px solid ${C.brd2}`,
            borderRadius: R.md, padding: "7px 10px", marginBottom: 7,
          }}>
            <Search style={{ width: 10, height: 10, color: C.t3, flexShrink: 0 }} />
            <input value={addSearch} onChange={e => setAddSearch(e.target.value)}
              placeholder="Search members…" autoFocus
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: C.t1, fontSize: 12, fontFamily: FONT,
              }} />
          </div>
          <div style={{ maxHeight: 160, overflowY: "auto" }}>
            {filteredMembers.length === 0 ? (
              <div style={{ fontSize: 11, color: C.t3, textAlign: "center", padding: "12px 0" }}>
                No members found
              </div>
            ) : filteredMembers.map(m => (
              <div key={m.user_id} onClick={() => handleAddMember(m)}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "7px 8px", borderRadius: R.md, cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.background = C.blueD}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: C.card3, border: `1px solid ${C.brd2}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9.5, fontWeight: 700, color: C.t2, flexShrink: 0,
                }}>
                  {ini(m.user_name || "")}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>
                    {m.user_name || "Member"}
                  </div>
                  {m.user_email && (
                    <div style={{ fontSize: 10, color: C.t3 }}>{m.user_email}</div>
                  )}
                </div>
                <ChevronRight style={{ width: 10, height: 10, color: C.t3 }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendees list */}
      <div className="cmm3-scr" style={{ flex: 1, overflowY: "auto" }}>
        {attendees.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center" }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: C.card2, border: `1px solid ${C.brd}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <Users style={{ width: 16, height: 16, color: C.t3 }} />
            </div>
            <div style={{ fontSize: 13, color: C.t2, fontWeight: 600, marginBottom: 4 }}>No attendees yet</div>
            <div style={{ fontSize: 11, color: C.t3 }}>Add members using the button above</div>
          </div>
        ) : attendees.map(a => (
          <AttendeeRow key={a.id} attendee={a}
            onStatusChange={handleStatusChange}
            onRemove={handleRemove} />
        ))}
      </div>

      {/* Footer actions */}
      <div style={{
        padding: "12px 14px", borderTop: `1px solid ${C.brd}`,
        display: "flex", flexDirection: "column", gap: 6, flexShrink: 0,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button className="cmm3-btn"
            style={{
              padding: "8px 10px", borderRadius: R.md, justifyContent: "center",
              background: "transparent", border: `1px solid ${C.brd}`,
              color: C.t2, fontSize: 11.5, fontWeight: 600,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; }}>
            <MessageCircle style={{ width: 10, height: 10 }} /> Message All
          </button>
          <button className="cmm3-btn"
            style={{
              padding: "8px 10px", borderRadius: R.md, justifyContent: "center",
              background: "transparent", border: `1px solid ${C.brd}`,
              color: C.t2, fontSize: 11.5, fontWeight: 600,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.color = C.t1; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; }}>
            <Settings2 style={{ width: 10, height: 10 }} /> Adj. Capacity
          </button>
        </div>
        <button className="cmm3-btn"
          onClick={() => onDeleteClass(cls.id)}
          style={{
            width: "100%", padding: "9px 12px",
            borderRadius: R.md, justifyContent: "center",
            background: "transparent", border: `1px solid ${C.brd}`,
            color: C.t3, fontSize: 12, fontWeight: 600,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.redB; e.currentTarget.style.color = C.red; e.currentTarget.style.background = C.redD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; e.currentTarget.style.background = "transparent"; }}>
          <Trash2 style={{ width: 11, height: 11 }} /> Cancel Class
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

  useEffect(() => {
    if (!open) { setSelected(null); setSearch(""); return; }
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
    { id: "all",   label: "All"   },
    { id: "open",  label: "Open"  },
    { id: "full",  label: "Full"  },
    { id: "empty", label: "Empty" },
  ];

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      display: "flex", background: "rgba(0,0,0,0.92)",
      backdropFilter: "blur(8px)", fontFamily: FONT,
    }}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: C.bg, maxWidth: "100vw",
        animation: "cmm3Fade .2s ease both",
      }}>
        {/* Top bar */}
        <div style={{
          height: 52, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
          background: C.surface,
          borderBottom: `1px solid ${C.brd}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 30, height: 30, borderRadius: R.md,
              background: C.blueD, border: `1px solid ${C.blueB}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Dumbbell style={{ width: 13, height: 13, color: C.blue }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em" }}>
                Class Management
              </div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>
                {classes.length} classes · {bookings.length} bookings
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="cmm3-btn" onClick={() => onCreateClass?.()}
              style={{
                padding: "7px 16px", borderRadius: R.md,
                background: C.blue, border: "none",
                color: "#fff", fontSize: 12, fontWeight: 700,
              }}>
              <Plus style={{ width: 12, height: 12 }} /> New Class
            </button>
            <button className="cmm3-btn" onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: R.md,
                background: "transparent", border: `1px solid ${C.brd}`,
                color: C.t3, justifyContent: "center",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.color = C.t2; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <KpiStrip classes={classes} bookings={bookings} />

        {/* Controls */}
        <div style={{
          padding: "8px 20px",
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: `1px solid ${C.brd}`, flexShrink: 0,
          background: C.surface, flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.card, border: `1px solid ${C.brd}`,
            borderRadius: R.md, padding: "7px 12px",
            flex: 1, minWidth: 200,
          }}>
            <Search style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search classes or coaches…"
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: C.t1, fontSize: 12.5, fontFamily: FONT,
              }} />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
                <X style={{ width: 10, height: 10, color: C.t3 }} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div style={{
            display: "flex", gap: 2, padding: "3px",
            background: C.card, border: `1px solid ${C.brd}`,
            borderRadius: R.md,
          }}>
            {filterOptions.map(f => (
              <button key={f.id} className="cmm3-btn" onClick={() => setFilter(f.id)}
                style={{
                  padding: "4px 12px", borderRadius: R.sm,
                  fontSize: 11, fontWeight: filter === f.id ? 700 : 400,
                  background: filter === f.id ? C.blueD : "transparent",
                  border: `1px solid ${filter === f.id ? C.blueB : "transparent"}`,
                  color: filter === f.id ? C.blue : C.t3,
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
                padding: "7px 12px", borderRadius: R.md,
                background: C.card, border: `1px solid ${C.brd}`,
                color: C.t2, fontSize: 11.5, outline: "none",
                cursor: "pointer", fontFamily: FONT,
              }}>
              <option value="all">All Coaches</option>
              {coachNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}

          <span style={{ fontSize: 10.5, color: C.t3, marginLeft: "auto", whiteSpace: "nowrap" }}>
            {visible.length} result{visible.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Table */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <TableHead sort={sort} setSort={setSort} />
            <div className="cmm3-scr" style={{ flex: 1, overflowY: "auto" }}>
              {visible.length === 0 ? (
                <div style={{ padding: "80px 24px", textAlign: "center" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: C.card2, border: `1px solid ${C.brd}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}>
                    <Dumbbell style={{ width: 20, height: 20, color: C.t3 }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.t2, marginBottom: 6 }}>
                    {classes.length === 0 ? "No classes yet" : "No classes match"}
                  </div>
                  <div style={{ fontSize: 12, color: C.t3, marginBottom: 22 }}>
                    {classes.length === 0
                      ? "Create your first class to get started"
                      : "Try adjusting your search or filters"}
                  </div>
                  {classes.length === 0 && (
                    <button className="cmm3-btn" onClick={() => onCreateClass?.()}
                      style={{
                        padding: "9px 20px", borderRadius: R.md,
                        background: C.blue, border: "none",
                        color: "#fff", fontSize: 12.5, fontWeight: 700,
                        margin: "0 auto", display: "inline-flex",
                      }}>
                      <Plus style={{ width: 13, height: 13 }} /> Create First Class
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
              flexShrink: 0, background: C.surface,
            }}>
              <span style={{ fontSize: 10, color: C.t3 }}>
                Showing {visible.length} of {classes.length} classes
              </span>
              {selected && (
                <button className="cmm3-btn" onClick={() => setSelected(null)}
                  style={{
                    padding: "3px 10px", borderRadius: R.sm,
                    background: "transparent", border: `1px solid ${C.brd}`,
                    color: C.t3, fontSize: 10.5, fontWeight: 600,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.brd2; e.currentTarget.style.color = C.t2; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t3; }}>
                  <X style={{ width: 9, height: 9 }} /> Deselect
                </button>
              )}
            </div>
          </div>

          {/* Side panel */}
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
    </div>
  );
}