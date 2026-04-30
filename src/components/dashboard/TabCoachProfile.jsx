import { useState, useMemo, useEffect, useRef } from "react";
import {
  MessageSquare, Calendar, Dumbbell, AlertTriangle, TrendingDown,
  ChevronRight, ChevronDown, ChevronUp, Activity, BarChart2, User,
  Phone, Mail, MapPin, Target, Check, Plus, Clock, Zap, ArrowRight,
  Brain, Flame, XCircle, X, Pencil, Trash2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Design Tokens (matching ContentHub) ─────────────────────────────────────
const C = {
  bg:       "#000000",
  sidebar:  "#0a0a0d",
  card:     "#141416",
  card2:    "#1a1a1f",
  brd:      "#222226",
  brdHi:    "#2e2e36",
  t1:       "#ffffff",
  t2:       "#8a8a94",
  t3:       "#444450",
  t4:       "#2a2a32",
  cyan:     "#4d7fff",
  cyanDim:  "rgba(77,127,255,0.10)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.12)",
  redBrd:   "rgba(255,77,109,0.28)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.10)",
  greenBrd: "rgba(34,197,94,0.26)",
  amber:    "#f59e0b",
  amberDim: "rgba(245,158,11,0.10)",
  amberBrd: "rgba(245,158,11,0.26)",
  purple:   "#a78bfa",
  purpleDim:"rgba(167,139,250,0.10)",
  purpleBrd:"rgba(167,139,250,0.26)",
};

const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";
const MONO = "'DM Mono', 'Courier New', monospace";

const GRAD_BTN = {
  background: "#2563eb",
  border: "none",
  color: "#fff",
  boxShadow: "0 4px 16px rgba(37,99,235,0.30)",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CLIENT = {
  name: "Jordan Matthews",
  email: "jordan@example.com",
  phone: "+44 7700 900123",
  location: "London, UK",
  joined: "Jan 2024",
  goal: "Fat Loss",
  tags: ["HIIT", "Strength"],
  retention_status: "needs_attention",
  last_visit: "5d ago",
  visits_per_week: 1.5,
  completion_pct: 42,
  streak: 3,
  total_sessions: 24,
  no_show_rate: 18,
  next_session: null,
};

const now = Date.now();
const day = 86400000;

const MOCK_CHECKINS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  check_in_date: new Date(now - (i * 3.2 + Math.random()) * day).toISOString(),
}));

const MOCK_BOOKINGS = [
  { id: 1, session_date: new Date(now - 2 * day).toISOString(), session_name: "Upper Body Strength", status: "attended" },
  { id: 2, session_date: new Date(now - 5 * day).toISOString(), session_name: "HIIT Cardio", status: "no_show" },
  { id: 3, session_date: new Date(now - 9 * day).toISOString(), session_name: "Lower Body Power", status: "attended" },
  { id: 4, session_date: new Date(now - 12 * day).toISOString(), session_name: "Core & Mobility", status: "attended" },
  { id: 5, session_date: new Date(now - 16 * day).toISOString(), session_name: "Full Body Circuit", status: "no_show" },
  { id: 6, session_date: new Date(now - 19 * day).toISOString(), session_name: "Push Day", status: "attended" },
];

const MOCK_WORKOUTS = [
  { id: 1, workout_data: { name: "12-Week Strength Program", exercises: Array(24).fill(null) }, is_activated: true, assigned_date: new Date(now - 30 * day).toISOString() },
  { id: 2, workout_data: { name: "HIIT Conditioning Block", exercises: Array(12).fill(null) }, is_activated: false, assigned_date: new Date(now - 10 * day).toISOString() },
];

// ─── Global Styles ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

@keyframes fadeUp   { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
@keyframes barGrow  { from { transform:scaleY(0) } to { transform:scaleY(1) } }
@keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
@keyframes spin     { to { transform:rotate(360deg) } }

* { box-sizing: border-box; }

.ccc-root { font-family: ${FONT}; color: ${C.t1}; -webkit-font-smoothing: antialiased; }
.mono     { font-family: ${MONO}; }

.ccc-card {
  background: ${C.card};
  border: 1px solid ${C.brd};
  border-radius: 12px;
  overflow: hidden;
  transition: border-color .15s, box-shadow .15s;
  animation: fadeUp .3s ease both;
}
.ccc-card:hover { border-color: ${C.cyanBrd}; box-shadow: 0 0 0 1px rgba(77,127,255,0.06); }

.ccc-btn {
  border: none; outline: none; cursor: pointer;
  font-family: ${FONT};
  transition: all .14s;
}
.ccc-btn:hover  { opacity: .86; }
.ccc-btn:active { transform: scale(.96); }

.row-hover { transition: background .1s; border-radius: 8px; }
.row-hover:hover { background: rgba(255,255,255,0.03); }

.action-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 9px;
  font-size: 13px; font-weight: 700; font-family: ${FONT};
  cursor: pointer; border: none;
  ${Object.entries(GRAD_BTN).map(([k,v]) => `${k.replace(/([A-Z])/g,'-$1').toLowerCase()}:${v}`).join(';')};
  transition: all .14s;
}
.action-primary:hover { opacity: .88; transform: translateY(-1px); }
.action-primary:active { transform: scale(.97); }

.action-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 9px;
  font-size: 13px; font-weight: 600; font-family: ${FONT};
  cursor: pointer; color: ${C.t2};
  background: rgba(255,255,255,0.04);
  border: 1px solid ${C.brd};
  transition: all .14s;
}
.action-ghost:hover { background: ${C.card2}; border-color: ${C.brdHi}; color: ${C.t1}; }
.action-ghost:active { transform: scale(.97); }

.heatmap-cell { border-radius: 3px; transition: transform .12s; cursor: default; }
.heatmap-cell:hover { transform: scale(1.35); z-index: 5; position: relative; }
`;

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Lbl({ children, style = {} }) {
  return (
    <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".12em", ...style }}>
      {children}
    </div>
  );
}

function CardHead({ label, icon: Icon, iconColor, sub, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${C.brd}` }}>
      {Icon && (
        <div style={{ width: 22, height: 22, borderRadius: 6, background: C.card2, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: 10, height: 10, color: iconColor || C.t3 }} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <Lbl>{label}</Lbl>
        {sub && <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1 }}>{sub}</div>}
      </div>
      {action && onAction && (
        <button className="ccc-btn" onClick={onAction} style={{ fontSize: 11, fontWeight: 700, color: C.cyan, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, borderRadius: 7, padding: "4px 10px", display: "flex", alignItems: "center", gap: 3, fontFamily: FONT }}>
          {action} <ChevronRight style={{ width: 8, height: 8 }} />
        </button>
      )}
    </div>
  );
}

function Card({ label, icon, iconColor, sub, action, onAction, children, style = {}, accentBorder }) {
  return (
    <div className="ccc-card" style={{ ...style, ...(accentBorder ? { borderLeft: `2.5px solid ${accentBorder}` } : {}) }}>
      {label && <CardHead label={label} icon={icon} iconColor={iconColor} sub={sub} action={action} onAction={onAction} />}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// ─── Command Bar ──────────────────────────────────────────────────────────────
function CommandBar({ cl, onMessage, onBook, onAssign }) {
  const retention = {
    healthy:         { label: "Healthy",         color: C.green },
    needs_attention: { label: "Needs Attention", color: C.amber },
    at_risk:         { label: "At Risk",         color: C.red   },
  }[cl.retention_status] || { label: "Healthy", color: C.green };

  const ini = (n = "") => (n || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("ccc-scroll");
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 8);
    el.addEventListener("scroll", fn);
    return () => el.removeEventListener("scroll", fn);
  }, []);

  const kpis = [
    { label: "Last Visit",   val: cl.last_visit,          warn: cl.retention_status === "at_risk" },
    { label: "Visits / Wk", val: `${cl.visits_per_week}×`, warn: cl.visits_per_week < 2 },
    { label: "Completion",  val: `${cl.completion_pct}%`,  warn: cl.completion_pct < 50 },
    { label: "Streak",      val: `${cl.streak}d`,          ok: cl.streak > 7 },
  ];

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: scrolled ? "rgba(0,0,0,0.95)" : C.bg,
      backdropFilter: scrolled ? "blur(14px)" : "none",
      borderBottom: `1px solid ${scrolled ? C.brd : "transparent"}`,
      transition: "all .18s",
    }}>
      <div style={{ maxWidth: 1340, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 0 }}>
        {/* Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, paddingRight: 20, flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.cyanDim, border: `1.5px solid ${C.cyanBrd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.cyan }}>
              {ini(cl.name)}
            </div>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: retention.color, border: `2px solid ${C.bg}`, animation: cl.retention_status === "at_risk" ? "pulseDot 2s ease-in-out infinite" : "none" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em", lineHeight: 1 }}>{cl.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: retention.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: retention.color }}>{retention.label}</span>
              {cl.goal && <><span style={{ color: C.t4, margin: "0 2px" }}>·</span><span style={{ fontSize: 11, color: C.t3 }}>{cl.goal}</span></>}
            </div>
          </div>
        </div>

        {/* KPIs */}
        {kpis.map(({ label, val, warn, ok }) => (
          <div key={label} style={{ paddingLeft: 20, borderLeft: `1px solid ${C.brd}` }}>
            <Lbl style={{ marginBottom: 3 }}>{label}</Lbl>
            <div className="mono" style={{ fontSize: 15, fontWeight: 500, color: warn ? C.red : ok ? C.green : C.t1 }}>{val}</div>
          </div>
        ))}

        {/* Actions */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <button className="action-ghost" onClick={onMessage} style={{ padding: "7px 14px", fontSize: 12 }}>
            <MessageSquare style={{ width: 12, height: 12 }} /> Message
          </button>
          <button className="action-ghost" onClick={onAssign} style={{ padding: "7px 14px", fontSize: 12 }}>
            <Dumbbell style={{ width: 12, height: 12 }} /> Assign
          </button>
          <button className="action-primary" onClick={onBook} style={{ padding: "7px 16px", fontSize: 12 }}>
            <Calendar style={{ width: 12, height: 12 }} /> Book Session
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Next Best Action ─────────────────────────────────────────────────────────
function NextBestAction({ cl, onAction }) {
  const nba = useMemo(() => {
    if (cl.retention_status === "at_risk") return {
      icon: Flame, title: `${cl.name.split(" ")[0]} is at risk of churning`,
      body: "No activity in over a week and no upcoming sessions. A personal message now is 3× more likely to re-engage them.",
      cta: "Send Re-engagement Message", ctaKey: "message",
      color: C.red, colorDim: C.redDim, colorBrd: C.redBrd, badge: "Urgent",
    };
    if (!cl.next_session) return {
      icon: Calendar, title: `No upcoming session booked`,
      body: "Clients with sessions booked in advance are 60% more consistent. Lock in their next slot now.",
      cta: "Book a Session", ctaKey: "book",
      color: C.amber, colorDim: C.amberDim, colorBrd: C.amberBrd, badge: "Action Required",
    };
    if (cl.completion_pct < 50) return {
      icon: Dumbbell, title: `Workout completion is low (${cl.completion_pct}%)`,
      body: "Less than half of assigned workouts completed. Consider simplifying the program or checking their schedule.",
      cta: "Reassign Workout", ctaKey: "assign",
      color: C.cyan, colorDim: C.cyanDim, colorBrd: C.cyanBrd, badge: "Suggested",
    };
    return {
      icon: Check, title: `${cl.name.split(" ")[0]} is on track`,
      body: "Everything looks healthy. Keep momentum going with a check-in message or scheduling their next milestone session.",
      cta: "Send Check-in", ctaKey: "message",
      color: C.green, colorDim: C.greenDim, colorBrd: C.greenBrd, badge: "All Clear",
    };
  }, [cl]);

  const Ic = nba.icon;
  return (
    <div style={{ background: C.card, border: `1px solid ${nba.colorBrd}`, borderRadius: 12, overflow: "hidden", animation: "fadeUp .3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: nba.colorDim, border: `1px solid ${nba.colorBrd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ic style={{ width: 18, height: 18, color: nba.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: nba.color, textTransform: "uppercase", letterSpacing: ".12em", background: nba.colorDim, border: `1px solid ${nba.colorBrd}`, borderRadius: 99, padding: "2px 8px" }}>
              {nba.badge}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".12em" }}>Next Best Action</span>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.t1, marginBottom: 4, letterSpacing: "-0.01em" }}>{nba.title}</div>
          <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.6 }}>{nba.body}</div>
        </div>
        <button className="ccc-btn" onClick={() => onAction(nba.ctaKey)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 9, background: nba.color, color: "#fff", fontSize: 12.5, fontWeight: 700, border: "none", fontFamily: FONT, boxShadow: `0 4px 16px ${nba.color}30` }}>
          {nba.cta} <ArrowRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Attendance Heatmap ───────────────────────────────────────────────────────
function AttendanceHeatmap({ clientCheckIns }) {
  const WEEKS = 15;
  const DAYS  = ["M","T","W","T","F","S","S"];

  const cells = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (today.getDay() || 7) + 1 - (WEEKS - 1) * 7);

    const checkSet = new Set(clientCheckIns.map(c => {
      const d = new Date(c.check_in_date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }));

    return Array.from({ length: WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        return { date, checked: checkSet.has(key), future: date > today, key };
      })
    );
  }, [clientCheckIns]);

  const total = cells.flat().filter(c => c.checked).length;

  return (
    <Card label="Attendance" icon={Activity} sub={`${total} check-ins over the last ${WEEKS} weeks`}>
      <div style={{ display: "flex", gap: 5 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 1 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ width: 10, height: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, color: C.t3, fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 3, overflow: "hidden" }}>
          {cells.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {week.map((cell, di) => (
                <div key={di} className="heatmap-cell"
                  title={`${cell.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${cell.checked ? " ✓" : ""}`}
                  style={{
                    width: 13, height: 13,
                    background: cell.future ? "transparent" : cell.checked ? C.cyan : C.card2,
                    border: cell.future ? `1px dashed ${C.t4}` : `1px solid ${cell.checked ? C.cyanBrd : C.brd}`,
                    opacity: cell.future ? 0.2 : cell.checked ? 1 : 0.7,
                    boxShadow: cell.checked ? `0 0 5px rgba(77,127,255,0.3)` : "none",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: C.t3 }}>Less</span>
        {[C.card2, `${C.cyan}30`, `${C.cyan}60`, C.cyan].map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c, border: `1px solid ${C.brd}` }} />
        ))}
        <span style={{ fontSize: 9, color: C.t3 }}>More</span>
      </div>
    </Card>
  );
}

// ─── Weekly Frequency Chart ───────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card2, border: `1px solid ${C.cyanBrd}`, borderRadius: 7, padding: "5px 10px", fontSize: 11.5, color: C.t1 }}>
      <div style={{ fontSize: 10, color: C.t3, marginBottom: 2 }}>{label}</div>
      <span style={{ color: C.cyan, fontWeight: 700 }}>{payload[0].value} visits</span>
    </div>
  );
}

function WeeklyFrequency({ clientCheckIns }) {
  const weeks = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const end   = new Date(Date.now() - i * 7 * 86400000);
    const start = new Date(+end - 7 * 86400000);
    const count = clientCheckIns.filter(c => { const d = new Date(c.check_in_date); return d >= start && d < end; }).length;
    const label = i === 0 ? "This wk" : i === 1 ? "Last wk" : `W-${i}`;
    return { label, v: count };
  }).reverse(), [clientCheckIns]);

  return (
    <Card label="Weekly Frequency" icon={BarChart2} sub="Check-ins per week — last 8 weeks">
      <div style={{ paddingLeft: 0, paddingRight: 4 }}>
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={weeks} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
            <defs>
              <linearGradient id="wf-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.cyan} stopOpacity={0.3} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.t3, fontSize: 8.5, fontFamily: FONT }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#wf-grad)" dot={false}
              activeDot={{ r: 3, fill: C.cyan, strokeWidth: 2, stroke: C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ─── Session History ──────────────────────────────────────────────────────────
function SessionHistory({ clientBookings, onBook }) {
  const STATUS = {
    attended:  { color: C.green,  label: "Done",      bg: C.greenDim, brd: C.greenBrd },
    no_show:   { color: C.red,    label: "No-show",   bg: C.redDim,   brd: C.redBrd   },
    cancelled: { color: C.amber,  label: "Cancelled", bg: C.amberDim, brd: C.amberBrd },
  };

  const sessions = useMemo(() =>
    clientBookings.slice(0, 8).map(b => ({
      date: b.session_date ? new Date(b.session_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "—",
      time: b.session_date ? new Date(b.session_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
      name: b.session_name || "Training Session",
      status: b.status,
    })), [clientBookings]);

  return (
    <Card label="Session History" icon={Calendar} action="Book" onAction={onBook}>
      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <Calendar style={{ width: 26, height: 26, color: C.t3, margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 10 }}>No sessions yet</div>
          <button className="action-primary" onClick={onBook} style={{ margin: "0 auto", fontSize: 12, padding: "7px 14px" }}>
            <Plus style={{ width: 11, height: 11 }} /> Book first session
          </button>
        </div>
      ) : (
        <>
          {/* Status strip */}
          <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
            {sessions.map((s, i) => (
              <div key={i} title={`${s.date} — ${STATUS[s.status]?.label}`}
                style={{ flex: 1, height: 3, borderRadius: 99, background: STATUS[s.status]?.color || C.t3, opacity: .75 }} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {sessions.map((s, i) => {
              const cfg = STATUS[s.status] || STATUS.attended;
              return (
                <div key={i} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    <div className="mono" style={{ fontSize: 10, color: C.t3 }}>{s.date} · {s.time}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.brd}`, borderRadius: 99, padding: "2px 9px", flexShrink: 0 }}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Workout Engagement ───────────────────────────────────────────────────────
function WorkoutEngagement({ clientWorkouts, onAssign }) {
  const [open, setOpen] = useState(null);
  const workouts = useMemo(() =>
    clientWorkouts.map(w => ({
      name: w.workout_data?.name || "Workout Plan",
      pct: w.is_activated ? Math.round((w.workout_data?.exercises?.length || 0) / (w.workout_data?.exercises?.length || 1) * 100) : 0,
      total: w.workout_data?.exercises?.length || 0,
      assigned: w.assigned_date ? new Date(w.assigned_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—",
      active: !!w.is_activated,
    })), [clientWorkouts]);

  return (
    <Card label="Workout Plans" icon={Dumbbell} iconColor={C.purple} action="Assign" onAction={onAssign}
      sub={workouts.length ? `${workouts.length} plan${workouts.length > 1 ? "s" : ""} assigned` : undefined}>
      {workouts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <Dumbbell style={{ width: 26, height: 26, color: C.t3, margin: "0 auto 8px" }} />
          <div style={{ fontSize: 13, fontWeight: 600, color: C.t2, marginBottom: 10 }}>No workouts assigned</div>
          <button className="action-ghost" onClick={onAssign} style={{ margin: "0 auto", fontSize: 12, padding: "7px 14px" }}>
            <Plus style={{ width: 11, height: 11 }} /> Assign workout
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {workouts.map((w, i) => {
            const color = w.pct >= 80 ? C.green : w.pct >= 40 ? C.cyan : C.red;
            return (
              <div key={i} style={{ borderRadius: 9, background: C.card2, border: `1px solid ${C.brd}`, overflow: "hidden" }}>
                <div className="row-hover" onClick={() => setOpen(open === i ? null : i)}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", cursor: "pointer" }}>
                  <div style={{ width: 3, height: 30, borderRadius: 99, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6 }}>{w.name}</div>
                    <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ height: "100%", width: `${w.active ? 68 : 0}%`, borderRadius: 99, background: color, transition: "width .5s" }} />
                    </div>
                  </div>
                  <span className="mono" style={{ fontSize: 17, fontWeight: 500, color: w.active ? C.t1 : C.t3, letterSpacing: "-0.03em", flexShrink: 0 }}>{w.active ? "68%" : "0%"}</span>
                  {open === i ? <ChevronUp style={{ width: 10, height: 10, color: C.t3 }} /> : <ChevronDown style={{ width: 10, height: 10, color: C.t3 }} />}
                </div>
                {open === i && (
                  <div style={{ padding: "10px 28px 12px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 20 }}>
                    <div><Lbl style={{ marginBottom: 3 }}>Exercises</Lbl><div className="mono" style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{w.total}</div></div>
                    <div><Lbl style={{ marginBottom: 3 }}>Assigned</Lbl><div className="mono" style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>{w.assigned}</div></div>
                    <div><Lbl style={{ marginBottom: 3 }}>Status</Lbl><div style={{ fontSize: 11, fontWeight: 700, color: w.active ? C.green : C.amber }}>{w.active ? "Active" : "Not started"}</div></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Critical Insights ────────────────────────────────────────────────────────
function CriticalInsights({ cl, clientBookings, clientCheckIns, onAction }) {
  const insights = useMemo(() => {
    const items = [];
    const now = Date.now();
    const lastCI = [...clientCheckIns].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
    const daysAgo = lastCI ? Math.floor((now - new Date(lastCI.check_in_date)) / 86400000) : null;

    if (daysAgo !== null && daysAgo >= 7)
      items.push({ icon: AlertTriangle, color: C.red, title: `Inactive for ${daysAgo} days`, body: "Above the 7-day churn threshold. Personal outreach recommended.", cta: "Message", key: "message" });

    const noShows = clientBookings.filter(b => b.status === "no_show").length;
    if (noShows >= 2)
      items.push({ icon: XCircle, color: C.red, title: `${noShows} no-shows recorded`, body: "Pattern of missed sessions may indicate scheduling mismatch.", cta: "Reschedule", key: "book" });

    if (!cl.next_session)
      items.push({ icon: Calendar, color: C.amber, title: "No session booked", body: "Client has no upcoming sessions scheduled.", cta: "Book", key: "book" });

    if (cl.visits_per_week < 2 && cl.visits_per_week > 0)
      items.push({ icon: TrendingDown, color: C.amber, title: "Visit frequency dropping", body: `${cl.visits_per_week}×/week — below recommended 2× minimum.`, cta: null, key: null });

    return items;
  }, [cl, clientBookings, clientCheckIns]);

  if (!insights.length) return (
    <Card label="Insights" icon={Brain} iconColor={C.green}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: C.greenDim, border: `1px solid ${C.greenBrd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check style={{ width: 12, height: 12, color: C.green }} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>All clear</div>
          <div style={{ fontSize: 11, color: C.t3 }}>No issues detected</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="ccc-card" style={{ borderLeft: `2.5px solid ${C.red}` }}>
      <CardHead label="Critical Insights" icon={AlertTriangle} iconColor={C.red} sub={`${insights.length} issue${insights.length > 1 ? "s" : ""} need attention`} />
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 5 }}>
        {insights.map((ins, i) => {
          const Ic = ins.icon;
          return (
            <div key={i} style={{ padding: "9px 11px", borderRadius: 9, background: i === 0 ? `${ins.color}08` : "transparent", borderLeft: `2px solid ${ins.color}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <Ic style={{ width: 11, height: 11, color: ins.color, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 2 }}>{ins.title}</div>
                  <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.5 }}>{ins.body}</div>
                </div>
                {ins.cta && (
                  <button className="ccc-btn" onClick={() => onAction(ins.key)} style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: ins.color, background: `${ins.color}10`, border: `1px solid ${ins.color}25`, borderRadius: 6, padding: "3px 9px", display: "flex", alignItems: "center", gap: 3, fontFamily: FONT }}>
                    {ins.cta} <ArrowRight style={{ width: 8, height: 8 }} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Retention Risk ───────────────────────────────────────────────────────────
function RetentionRisk({ cl }) {
  const score = cl.retention_status === "at_risk" ? 78 : cl.retention_status === "needs_attention" ? 44 : 16;
  const color = score >= 65 ? C.red : score >= 35 ? C.amber : C.green;
  const label = score >= 65 ? "High Risk" : score >= 35 ? "Moderate" : "Low Risk";

  const r = 30, cx = 40, cy = 40, sw = 6;
  const toRad = deg => (deg * Math.PI) / 180;
  const arcPath = (start, end) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
    const e = { x: cx + r * Math.cos(toRad(end)),   y: cy + r * Math.sin(toRad(end)) };
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };
  const totalArc = 240;
  const dashFill = (2 * Math.PI * r) * (totalArc / 360) * (score / 100);
  const dashTotal = (2 * Math.PI * r) * (totalArc / 360);

  const factors = [
    cl.retention_status !== "healthy" && { label: "Inactivity detected", sev: "H" },
    !cl.next_session                  && { label: "No upcoming session",  sev: "H" },
    cl.completion_pct < 50            && { label: "Low completion",       sev: "M" },
    cl.visits_per_week < 2            && { label: "Low frequency",        sev: "M" },
    cl.no_show_rate > 15              && { label: "No-show pattern",      sev: "M" },
  ].filter(Boolean);

  return (
    <Card label="Retention Risk" icon={AlertTriangle} iconColor={color}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <svg width={80} height={58} viewBox="0 0 80 58" style={{ overflow: "visible", flexShrink: 0 }}>
          <path d={arcPath(-210, 30)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} strokeLinecap="round" />
          <path d={arcPath(-210, 30)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={`${dashFill} ${dashTotal - dashFill}`}
            style={{ filter: `drop-shadow(0 0 5px ${color}50)` }} />
          <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize={17} fontWeight={700} fontFamily={MONO}>{score}</text>
        </svg>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{label}</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Risk score / 100</div>
        </div>
      </div>
      {factors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {factors.map(({ label: fl, sev }) => (
            <div key={fl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.t2 }}>{fl}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: sev === "H" ? C.red : C.amber, background: sev === "H" ? C.redDim : C.amberDim, border: `1px solid ${sev === "H" ? C.redBrd : C.amberBrd}`, borderRadius: 99, padding: "1px 7px", letterSpacing: ".05em" }}>{sev}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Snapshot Stats ───────────────────────────────────────────────────────────
function SnapshotStats({ cl, clientCheckIns, clientBookings }) {
  const stats = [
    { label: "Sessions",   value: clientBookings.length },
    { label: "Check-ins",  value: clientCheckIns.length },
    { label: "No-show %",  value: `${cl.no_show_rate}%`, warn: cl.no_show_rate > 15 },
    { label: "Completion", value: `${cl.completion_pct}%`, warn: cl.completion_pct < 50 },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.brd, border: `1px solid ${C.brd}`, borderRadius: 12, overflow: "hidden" }}>
      {stats.map(({ label, value, warn }) => (
        <div key={label} style={{ padding: "12px 14px", background: C.card }}>
          <Lbl style={{ marginBottom: 5 }}>{label}</Lbl>
          <div className="mono" style={{ fontSize: 20, fontWeight: 500, color: warn ? C.red : C.t1, letterSpacing: "-0.03em" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Behavior Patterns ────────────────────────────────────────────────────────
function BehaviorPatterns({ cl, clientCheckIns, clientBookings }) {
  const patterns = useMemo(() => {
    const dayCount = { Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0,Sun:0 };
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    clientCheckIns.forEach(c => {
      const d = days[new Date(c.check_in_date).getDay()];
      if (dayCount[d] !== undefined) dayCount[d]++;
    });
    const topDay = Object.entries(dayCount).sort(([,a],[,b]) => b-a)[0];
    const items = [];
    if (topDay?.[1] > 0) items.push({ icon: "📅", text: `Most active on ${topDay[0]}s`, sub: `${topDay[1]} visits` });
    const nsCount = clientBookings.filter(b => b.status === "no_show").length;
    if (nsCount > 0) items.push({ icon: "⚠️", text: "No-show pattern detected", sub: `${nsCount} missed sessions` });
    if (cl.streak > 5) items.push({ icon: "🔥", text: `${cl.streak}-day streak`, sub: "Building momentum" });
    if (cl.visits_per_week <= 1) items.push({ icon: "📉", text: "Low engagement pattern", sub: "Below 2× weekly target" });
    if (cl.completion_pct >= 70) items.push({ icon: "✅", text: "Strong compliance", sub: `${cl.completion_pct}% workout completion` });
    return items.slice(0, 4);
  }, [cl, clientCheckIns, clientBookings]);

  return (
    <Card label="Behavior Patterns" icon={Brain} iconColor={C.purple}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {patterns.length === 0 ? (
          <div style={{ fontSize: 12, color: C.t3, textAlign: "center", padding: "10px 0" }}>Not enough data to detect patterns</div>
        ) : patterns.map((p, i) => (
          <div key={i} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: C.card2, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
              {p.icon}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{p.text}</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{p.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Client Info ──────────────────────────────────────────────────────────────
function ClientInfo({ cl }) {
  const rows = [
    { icon: Mail,   val: cl.email,    label: "Email"    },
    { icon: Phone,  val: cl.phone,    label: "Phone"    },
    { icon: MapPin, val: cl.location, label: "Location" },
    { icon: User,   val: cl.joined ? `Since ${cl.joined}` : "—", label: "Member" },
    { icon: Target, val: cl.goal,     label: "Goal"     },
  ];
  return (
    <Card label="Client Info" icon={User}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map(({ icon: Ic, val, label }) => (
          <div key={label} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 7px" }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: C.card2, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic style={{ width: 9, height: 9, color: C.t3 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 1 }}>{label}</div>
              <div style={{ fontSize: 12, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val || "—"}</div>
            </div>
          </div>
        ))}
        {cl.tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
            {cl.tags.map(t => (
              <span key={t} style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, color: C.cyan }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ onMessage, onBook, onAssign }) {
  const actions = [
    { label: "Send check-in message", icon: MessageSquare, fn: onMessage },
    { label: "Book next session",     icon: Calendar,      fn: onBook    },
    { label: "Assign workout",        icon: Dumbbell,      fn: onAssign  },
  ];
  return (
    <Card label="Quick Actions" icon={Zap} iconColor={C.amber}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {actions.map(({ label, icon: Ic, fn }) => (
          <button key={label} onClick={fn}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${C.brd}`, fontSize: 12, fontWeight: 600, color: C.t2, cursor: "pointer", fontFamily: FONT, transition: "all .12s", textAlign: "left", width: "100%" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.cyanDim; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: C.card2, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic style={{ width: 10, height: 10, color: C.t3 }} />
            </div>
            {label}
            <ChevronRight style={{ width: 9, height: 9, marginLeft: "auto", color: C.t3 }} />
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── Right Sidebar ────────────────────────────────────────────────────────────
function RightSidebar({ cl, clientCheckIns, clientBookings }) {
  const attended = clientBookings.filter(b => b.status === "attended").length;
  const total    = clientBookings.length;
  const attendPct = total > 0 ? Math.round((attended / total) * 100) : 0;

  const r = 30, cx = 40, cy = 40, sw = 6;
  const toRad = deg => (deg * Math.PI) / 180;
  const arcPath = (start, end) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
    const e = { x: cx + r * Math.cos(toRad(end)),   y: cy + r * Math.sin(toRad(end)) };
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };
  const dashFill = (2 * Math.PI * r) * (240 / 360) * (attendPct / 100);
  const dashTotal = (2 * Math.PI * r) * (240 / 360);
  const dialColor = attendPct < 40 ? C.red : attendPct < 70 ? C.amber : C.green;

  const statCards = [
    { label: "Total Sessions",  val: clientBookings.length, col: C.cyan  },
    { label: "Check-ins",       val: clientCheckIns.length, col: C.cyan  },
    { label: "No-show Rate",    val: `${cl.no_show_rate}%`, col: cl.no_show_rate > 15 ? C.red : C.t1 },
    { label: "Current Streak",  val: `${cl.streak}d`,       col: cl.streak > 5 ? C.green : C.t1 },
  ];

  return (
    <div style={{ width: 236, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: "flex", flexDirection: "column", alignSelf: "flex-start", position: "sticky", top: 60 }}>
      {/* Stats grid */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, marginBottom: 12 }}>Client Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: C.brd, borderRadius: 10, overflow: "hidden" }}>
          {statCards.map((s, i) => (
            <div key={i} style={{ padding: "11px 13px", background: C.card }}>
              <div style={{ fontSize: 9.5, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>{s.label}</div>
              <div className="mono" style={{ fontSize: 19, fontWeight: 600, color: s.col, lineHeight: 1 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance dial */}
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Attendance Rate</span>
          <span style={{ fontSize: 10, color: C.t3 }}>all time</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg width={80} height={58} viewBox="0 0 80 58" style={{ overflow: "visible" }}>
            <path d={arcPath(-210, 30)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} strokeLinecap="round" />
            <path d={arcPath(-210, 30)} fill="none" stroke={dialColor} strokeWidth={sw} strokeLinecap="round"
              strokeDasharray={`${dashFill} ${dashTotal - dashFill}`}
              style={{ filter: `drop-shadow(0 0 5px ${dialColor}40)` }} />
            <text x={cx} y={cx + 4} textAnchor="middle" fill="#fff" fontSize={17} fontWeight={700} fontFamily={MONO}>{attendPct}%</text>
            <text x={cx} y={cx + 18} textAnchor="middle" fill={dialColor} fontSize={9} fontWeight={700} fontFamily={FONT}>
              {attendPct >= 70 ? "Good" : attendPct >= 40 ? "Fair" : "Low"}
            </text>
          </svg>
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginTop: 4 }}>
            <span style={{ fontSize: 9, color: C.t3 }}>0%</span>
            <span style={{ fontSize: 9, color: C.t3 }}>100%</span>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: C.t3, marginTop: 6 }}>
            {attended} of {total} sessions attended
          </div>
        </div>
      </div>

      {/* Insights + risk stacked */}
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <CriticalInsights cl={cl} clientBookings={clientBookings} clientCheckIns={clientCheckIns} onAction={() => {}} />
        <RetentionRisk cl={cl} />
        <BehaviorPatterns cl={cl} clientCheckIns={clientCheckIns} clientBookings={clientBookings} />
        <ClientInfo cl={cl} />
        <QuickActions onMessage={() => {}} onBook={() => {}} onAssign={() => {}} />
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function ClientCommandCenter({
  client          = MOCK_CLIENT,
  clientCheckIns  = MOCK_CHECKINS,
  clientBookings  = MOCK_BOOKINGS,
  clientWorkouts  = MOCK_WORKOUTS,
  onMessage       = () => {},
  onBook          = () => {},
  onAssign        = () => {},
}) {
  const cl = client;

  return (
    <div className="ccc-root" id="ccc-scroll" style={{ background: C.bg, minHeight: "100vh", overflowY: "auto" }}>
      <style>{GLOBAL_CSS}</style>

      <CommandBar cl={cl} onMessage={onMessage} onBook={onBook} onAssign={onAssign} />

      <div style={{ display: "flex", flex: 1 }}>
        {/* Main content */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          <div style={{ padding: "20px 20px 60px 20px" }}>
            {/* Page heading */}
            <div style={{ marginBottom: 18, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: 0, letterSpacing: "-0.03em" }}>
                Client <span style={{ color: C.cyan }}>Profile</span>
              </h1>
              <span style={{ fontSize: 11, color: C.t3 }}>Member since {cl.joined}</span>
            </div>

            {/* NBA Banner */}
            <div style={{ marginBottom: 14 }}>
              <NextBestAction cl={cl} onAction={(key) => { if (key === "message") onMessage(); else if (key === "book") onBook(); else onAssign(); }} />
            </div>

            {/* Main grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SnapshotStats cl={cl} clientCheckIns={clientCheckIns} clientBookings={clientBookings} />
              <AttendanceHeatmap clientCheckIns={clientCheckIns} />
              <WeeklyFrequency clientCheckIns={clientCheckIns} />
              <SessionHistory clientBookings={clientBookings} onBook={onBook} />
              <WorkoutEngagement clientWorkouts={clientWorkouts} onAssign={onAssign} />
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <RightSidebar cl={cl} clientCheckIns={clientCheckIns} clientBookings={clientBookings} />
      </div>
    </div>
  );
}
