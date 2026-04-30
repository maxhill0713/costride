import { useState, useMemo, useEffect } from "react";
import {
  MessageSquare, Calendar, Dumbbell, AlertTriangle,
  ChevronDown, ChevronUp, Activity, BarChart2, User,
  Phone, Mail, MapPin, Target, Check, Plus, Zap,
  ArrowRight, Brain, Flame, XCircle, TrendingDown,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Tokens — exactly matching ContentHub screenshot ─────────────────────────
const C = {
  bg:      "#000000",
  card:    "#141416",
  card2:   "#1a1a1f",
  brd:     "#222226",
  t1:      "#ffffff",
  t2:      "#8a8a94",
  t3:      "#444450",
  blue:    "#4d7fff",
  blueDim: "rgba(77,127,255,0.10)",
  blueBrd: "rgba(77,127,255,0.22)",
  // red used only for genuine critical states — sparingly
  red:     "#ff4d6d",
  redDim:  "rgba(255,77,109,0.10)",
};

const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";
const MONO = "'DM Mono', 'Courier New', monospace";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const day = 86400000;
const now = Date.now();

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

const MOCK_CHECKINS = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  check_in_date: new Date(now - (i * 3.4 + Math.random() * 1.5) * day).toISOString(),
}));

const MOCK_BOOKINGS = [
  { id: 1, session_date: new Date(now - 2 * day).toISOString(),  session_name: "Upper Body Strength",  status: "attended"  },
  { id: 2, session_date: new Date(now - 5 * day).toISOString(),  session_name: "HIIT Cardio",          status: "no_show"   },
  { id: 3, session_date: new Date(now - 9 * day).toISOString(),  session_name: "Lower Body Power",     status: "attended"  },
  { id: 4, session_date: new Date(now - 12 * day).toISOString(), session_name: "Core & Mobility",      status: "attended"  },
  { id: 5, session_date: new Date(now - 16 * day).toISOString(), session_name: "Full Body Circuit",    status: "no_show"   },
  { id: 6, session_date: new Date(now - 19 * day).toISOString(), session_name: "Push Day",             status: "attended"  },
];

const MOCK_WORKOUTS = [
  { id: 1, workout_data: { name: "12-Week Strength Program", exercises: Array(24).fill(null) }, is_activated: true,  assigned_date: new Date(now - 30 * day).toISOString() },
  { id: 2, workout_data: { name: "HIIT Conditioning Block",  exercises: Array(12).fill(null) }, is_activated: false, assigned_date: new Date(now - 10 * day).toISOString() },
];

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

@keyframes fadeUp  { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

* { box-sizing: border-box; margin: 0; padding: 0; }

.ccc { font-family: ${FONT}; color: ${C.t1}; -webkit-font-smoothing: antialiased; }
.mono { font-family: ${MONO}; }

.card {
  background: ${C.card};
  border: 1px solid ${C.brd};
  border-radius: 10px;
  overflow: hidden;
  animation: fadeUp .25s ease both;
  transition: border-color .13s;
}
.card:hover { border-color: rgba(77,127,255,0.20); }

.btn {
  border: none; outline: none; cursor: pointer;
  font-family: ${FONT};
  transition: all .13s;
  display: inline-flex; align-items: center; gap: 6px;
}
.btn:active { transform: scale(.97); }

.btn-primary {
  padding: 8px 18px; border-radius: 9px;
  background: #2563eb; color: #fff;
  font-size: 13px; font-weight: 700;
  box-shadow: 0 4px 14px rgba(37,99,235,0.28);
}
.btn-primary:hover { opacity: .88; }

.btn-ghost {
  padding: 7px 14px; border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid ${C.brd} !important;
  color: ${C.t2}; font-size: 12px; font-weight: 600;
}
.btn-ghost:hover { background: ${C.card2}; border-color: #2e2e36 !important; color: ${C.t1}; }

.row { border-radius: 7px; transition: background .1s; }
.row:hover { background: rgba(255,255,255,0.025); }

.hcell { border-radius: 3px; transition: transform .1s; }
.hcell:hover { transform: scale(1.4); position: relative; z-index: 5; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Lbl = ({ children, style = {} }) => (
  <div style={{ fontSize: 9.5, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".12em", ...style }}>
    {children}
  </div>
);

function SectionHead({ label, icon: Icon, sub, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", borderBottom: `1px solid ${C.brd}` }}>
      {Icon && (
        <div style={{ width: 20, height: 20, borderRadius: 5, background: C.card2, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: 9, height: 9, color: C.t3 }} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <Lbl>{label}</Lbl>
        {sub && <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{sub}</div>}
      </div>
      {action && onAction && (
        <button className="btn" onClick={onAction} style={{ fontSize: 10.5, fontWeight: 700, color: C.blue, background: C.blueDim, border: `1px solid ${C.blueBrd}`, borderRadius: 6, padding: "3px 9px", gap: 3, fontFamily: FONT }}>
          {action}
        </button>
      )}
    </div>
  );
}

function Card({ label, icon, sub, action, onAction, children, style = {} }) {
  return (
    <div className="card" style={style}>
      {label && <SectionHead label={label} icon={icon} sub={sub} action={action} onAction={onAction} />}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// ─── Command Bar ──────────────────────────────────────────────────────────────
function CommandBar({ cl, onMessage, onBook, onAssign }) {
  const ini = n => (n || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.getElementById("ccc-root");
    if (!el) return;
    const fn = () => setScrolled(el.scrollTop > 6);
    el.addEventListener("scroll", fn);
    return () => el.removeEventListener("scroll", fn);
  }, []);

  const isAtRisk = cl.retention_status === "at_risk";
  const statusLabel = { healthy: "Healthy", needs_attention: "Needs Attention", at_risk: "At Risk" }[cl.retention_status] || "Healthy";

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: scrolled ? "rgba(0,0,0,0.94)" : C.bg,
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: `1px solid ${scrolled ? C.brd : "transparent"}`,
      transition: "all .15s",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 58, display: "flex", alignItems: "center", gap: 0 }}>

        {/* Avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 22, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.card2, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.t2 }}>
            {ini(cl.name)}
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.t1, letterSpacing: "-0.02em", lineHeight: 1 }}>{cl.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: isAtRisk ? C.red : C.t3 }} />
              <span style={{ fontSize: 10.5, color: isAtRisk ? C.red : C.t3, fontWeight: 600 }}>{statusLabel}</span>
              {cl.goal && <><span style={{ color: C.t3, margin: "0 2px" }}>·</span><span style={{ fontSize: 10.5, color: C.t3 }}>{cl.goal}</span></>}
            </div>
          </div>
        </div>

        {/* KPIs */}
        {[
          { label: "Last Visit",   val: cl.last_visit,           flag: isAtRisk },
          { label: "Visits / wk",  val: `${cl.visits_per_week}×` },
          { label: "Completion",   val: `${cl.completion_pct}%`  },
          { label: "Streak",       val: `${cl.streak}d`          },
        ].map(({ label, val, flag }) => (
          <div key={label} style={{ paddingLeft: 20, borderLeft: `1px solid ${C.brd}` }}>
            <Lbl style={{ marginBottom: 3 }}>{label}</Lbl>
            <div className="mono" style={{ fontSize: 14, fontWeight: 500, color: flag ? C.red : C.t1 }}>{val}</div>
          </div>
        ))}

        {/* Actions */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <button className="btn btn-ghost" onClick={onMessage}><MessageSquare style={{ width: 11, height: 11 }} />Message</button>
          <button className="btn btn-ghost" onClick={onAssign}><Dumbbell style={{ width: 11, height: 11 }} />Assign</button>
          <button className="btn btn-primary" onClick={onBook}><Calendar style={{ width: 11, height: 11 }} />Book Session</button>
        </div>
      </div>
    </div>
  );
}

// ─── Next Best Action ─────────────────────────────────────────────────────────
function NextBestAction({ cl, onAction }) {
  const nba = useMemo(() => {
    if (cl.retention_status === "at_risk") return {
      icon: Flame, label: "Urgent",
      title: `${cl.name.split(" ")[0]} is at risk of churning`,
      body: "No activity in over a week with no sessions booked. A personal message now is 3× more likely to re-engage them.",
      cta: "Send Message", key: "message", danger: true,
    };
    if (!cl.next_session) return {
      icon: Calendar, label: "Action Needed",
      title: "No upcoming session scheduled",
      body: "Clients with sessions booked in advance are 60% more consistent. Lock in the next slot now.",
      cta: "Book Session", key: "book", danger: false,
    };
    if (cl.completion_pct < 50) return {
      icon: Dumbbell, label: "Suggested",
      title: `Workout completion is low — ${cl.completion_pct}%`,
      body: "Less than half of assigned workouts are being completed. Consider adjusting the program difficulty or schedule.",
      cta: "Reassign Workout", key: "assign", danger: false,
    };
    return {
      icon: Check, label: "All Clear",
      title: `${cl.name.split(" ")[0]} is on track`,
      body: "Everything looks healthy. Keep the momentum going with a check-in or by scheduling the next milestone session.",
      cta: "Send Check-in", key: "message", danger: false,
    };
  }, [cl]);

  const Ic = nba.icon;
  const accent    = nba.danger ? C.red : C.blue;
  const accentDim = nba.danger ? C.redDim : C.blueDim;

  return (
    <div className="card" style={{ borderLeft: `2px solid ${accent}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "15px 20px" }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Ic style={{ width: 15, height: 15, color: accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: accent, textTransform: "uppercase", letterSpacing: ".12em" }}>Next Best Action</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: "uppercase", letterSpacing: ".1em", background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 99, padding: "1px 7px" }}>{nba.label}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 3, letterSpacing: "-0.01em" }}>{nba.title}</div>
          <div style={{ fontSize: 11.5, color: C.t2, lineHeight: 1.6 }}>{nba.body}</div>
        </div>
        <button className="btn btn-primary" onClick={() => onAction(nba.key)}
          style={{ flexShrink: 0, fontSize: 12, padding: "8px 16px", ...(nba.danger ? { background: C.red, boxShadow: "0 4px 14px rgba(255,77,109,0.22)" } : {}) }}>
          {nba.cta} <ArrowRight style={{ width: 11, height: 11 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────
function StatsStrip({ cl, clientCheckIns, clientBookings }) {
  const attended = clientBookings.filter(b => b.status === "attended").length;
  const noShows  = clientBookings.filter(b => b.status === "no_show").length;

  const stats = [
    { label: "Total Sessions",  val: clientBookings.length },
    { label: "Attended",        val: attended              },
    { label: "No-shows",        val: noShows,               warn: noShows >= 2 },
    { label: "Check-ins",       val: clientCheckIns.length },
    { label: "Completion",      val: `${cl.completion_pct}%`, warn: cl.completion_pct < 50 },
    { label: "Streak",          val: `${cl.streak}d`        },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "1px", background: C.brd, border: `1px solid ${C.brd}`, borderRadius: 10, overflow: "hidden" }}>
      {stats.map(({ label, val, warn }) => (
        <div key={label} style={{ background: C.card, padding: "12px 16px" }}>
          <Lbl style={{ marginBottom: 5 }}>{label}</Lbl>
          <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: warn ? C.red : C.t1, letterSpacing: "-0.04em", lineHeight: 1 }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Attendance Heatmap ───────────────────────────────────────────────────────
function AttendanceHeatmap({ clientCheckIns }) {
  const WEEKS = 16;
  const DAYS  = ["M", "T", "W", "T", "F", "S", "S"];

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
        return { date, checked: checkSet.has(key), future: date > today };
      })
    );
  }, [clientCheckIns]);

  const total = cells.flat().filter(c => c.checked).length;

  return (
    <Card label="Attendance" icon={Activity} sub={`${total} check-ins over ${WEEKS} weeks`}>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ width: 10, height: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: C.t3, fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 3.5 }}>
          {cells.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
              {week.map((cell, di) => (
                <div key={di} className="hcell"
                  title={`${cell.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${cell.checked ? " ✓" : ""}`}
                  style={{
                    width: 12, height: 12,
                    background: cell.future ? "transparent" : cell.checked ? C.blue : C.card2,
                    border: `1px solid ${cell.future ? "transparent" : cell.checked ? C.blueBrd : C.brd}`,
                    opacity: cell.future ? 0.15 : 1,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: C.t3 }}>Less</span>
        {[C.card2, `${C.blue}35`, `${C.blue}70`, C.blue].map((c, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c, border: `1px solid ${C.brd}` }} />
        ))}
        <span style={{ fontSize: 9, color: C.t3 }}>More</span>
      </div>
    </Card>
  );
}

// ─── Weekly Frequency ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card2, border: `1px solid ${C.blueBrd}`, borderRadius: 7, padding: "5px 10px", fontSize: 11, color: C.t1 }}>
      <div style={{ fontSize: 9.5, color: C.t3, marginBottom: 2 }}>{label}</div>
      <span style={{ color: C.blue, fontWeight: 700 }}>{payload[0].value} visits</span>
    </div>
  );
}

function WeeklyFrequency({ clientCheckIns }) {
  const data = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const end   = new Date(now - i * 7 * 86400000);
    const start = new Date(+end - 7 * 86400000);
    const count = clientCheckIns.filter(c => { const d = new Date(c.check_in_date); return d >= start && d < end; }).length;
    return { label: i === 0 ? "This wk" : i === 1 ? "Last wk" : `W${8 - i}`, v: count };
  }).reverse(), [clientCheckIns]);

  return (
    <Card label="Weekly Frequency" icon={BarChart2} sub="Check-ins per week — last 8 weeks">
      <ResponsiveContainer width="100%" height={88}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
          <defs>
            <linearGradient id="wf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C.blue} stopOpacity={0.28} />
              <stop offset="100%" stopColor={C.blue} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: C.t3, fontSize: 8.5, fontFamily: FONT }} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={{ fill: C.t3, fontSize: 9, fontFamily: FONT }} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="v" stroke={C.blue} strokeWidth={2} fill="url(#wf)" dot={false}
            activeDot={{ r: 3, fill: C.blue, strokeWidth: 2, stroke: C.card }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─── Session History ──────────────────────────────────────────────────────────
function SessionHistory({ clientBookings, onBook }) {
  const STATUS = {
    attended:  { dot: C.blue, label: "Done",      tag: { color: C.blue, bg: C.blueDim, brd: C.blueBrd } },
    no_show:   { dot: C.red,  label: "No-show",   tag: { color: C.red,  bg: C.redDim,  brd: "rgba(255,77,109,0.22)" } },
    cancelled: { dot: C.t3,   label: "Cancelled", tag: { color: C.t3,   bg: C.card2,   brd: C.brd } },
  };

  const sessions = useMemo(() =>
    clientBookings.slice(0, 8).map(b => ({
      name:   b.session_name || "Training Session",
      date:   b.session_date ? new Date(b.session_date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "—",
      time:   b.session_date ? new Date(b.session_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
      status: b.status || "attended",
    })), [clientBookings]);

  return (
    <Card label="Session History" icon={Calendar} action="Book" onAction={onBook}>
      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 12 }}>No sessions yet</div>
          <button className="btn btn-primary" onClick={onBook} style={{ margin: "0 auto", fontSize: 12, padding: "7px 14px" }}>
            <Plus style={{ width: 10, height: 10 }} /> Book first session
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
            {sessions.map((s, i) => (
              <div key={i} title={STATUS[s.status]?.label}
                style={{ flex: 1, height: 2.5, borderRadius: 99, background: STATUS[s.status]?.dot || C.t3, opacity: .55 }} />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sessions.map((s, i) => {
              const cfg = STATUS[s.status] || STATUS.attended;
              return (
                <div key={i} className="row" style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    <div className="mono" style={{ fontSize: 9.5, color: C.t3, marginTop: 1 }}>{s.date} · {s.time}</div>
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: cfg.tag.color, background: cfg.tag.bg, border: `1px solid ${cfg.tag.brd}`, borderRadius: 99, padding: "2px 9px", flexShrink: 0 }}>
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

// ─── Workout Plans ────────────────────────────────────────────────────────────
function WorkoutPlans({ clientWorkouts, onAssign }) {
  const [open, setOpen] = useState(null);
  const plans = useMemo(() => clientWorkouts.map(w => ({
    name:      w.workout_data?.name || "Workout Plan",
    exercises: w.workout_data?.exercises?.length || 0,
    assigned:  w.assigned_date ? new Date(w.assigned_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—",
    active:    !!w.is_activated,
    pct:       w.is_activated ? 68 : 0,
  })), [clientWorkouts]);

  return (
    <Card label="Workout Plans" icon={Dumbbell} action="Assign" onAction={onAssign}
      sub={plans.length ? `${plans.length} plan${plans.length > 1 ? "s" : ""} assigned` : undefined}>
      {plans.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: C.t2, marginBottom: 12 }}>No workouts assigned</div>
          <button className="btn btn-ghost" onClick={onAssign} style={{ margin: "0 auto", fontSize: 12 }}>
            <Plus style={{ width: 10, height: 10 }} /> Assign workout
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {plans.map((w, i) => (
            <div key={i} style={{ borderRadius: 8, background: C.card2, border: `1px solid ${C.brd}`, overflow: "hidden" }}>
              <div className="row" onClick={() => setOpen(open === i ? null : i)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.name}</div>
                  <div style={{ height: 2.5, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ height: "100%", width: `${w.pct}%`, borderRadius: 99, background: w.active ? C.blue : C.t3, transition: "width .5s" }} />
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 16, fontWeight: 500, color: w.active ? C.t1 : C.t3, letterSpacing: "-0.03em", flexShrink: 0 }}>{w.pct}%</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: w.active ? C.blue : C.t3, background: w.active ? C.blueDim : C.card, border: `1px solid ${w.active ? C.blueBrd : C.brd}`, borderRadius: 99, padding: "2px 8px", flexShrink: 0 }}>
                  {w.active ? "Active" : "Pending"}
                </span>
                {open === i
                  ? <ChevronUp style={{ width: 10, height: 10, color: C.t3, flexShrink: 0 }} />
                  : <ChevronDown style={{ width: 10, height: 10, color: C.t3, flexShrink: 0 }} />}
              </div>
              {open === i && (
                <div style={{ padding: "10px 26px 12px", borderTop: `1px solid ${C.brd}`, display: "flex", gap: 24 }}>
                  <div><Lbl style={{ marginBottom: 3 }}>Exercises</Lbl><div className="mono" style={{ fontSize: 13, color: C.t1 }}>{w.exercises}</div></div>
                  <div><Lbl style={{ marginBottom: 3 }}>Assigned</Lbl><div className="mono" style={{ fontSize: 13, color: C.t1 }}>{w.assigned}</div></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Insights ─────────────────────────────────────────────────────────────────
function Insights({ cl, clientBookings, clientCheckIns, onAction }) {
  const items = useMemo(() => {
    const out = [];
    const lastCI = [...clientCheckIns].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
    const daysAgo = lastCI ? Math.floor((now - new Date(lastCI.check_in_date)) / 86400000) : null;

    if (daysAgo !== null && daysAgo >= 7)
      out.push({ icon: AlertTriangle, title: `Inactive ${daysAgo} days`, body: "Above 7-day churn threshold.", cta: "Message", key: "message", critical: true });

    const noShows = clientBookings.filter(b => b.status === "no_show").length;
    if (noShows >= 2)
      out.push({ icon: XCircle, title: `${noShows} no-shows`, body: "May indicate scheduling mismatch.", cta: "Reschedule", key: "book", critical: true });

    if (!cl.next_session)
      out.push({ icon: Calendar, title: "No session booked", body: "No upcoming sessions scheduled.", cta: "Book", key: "book", critical: false });

    if (cl.visits_per_week < 2)
      out.push({ icon: TrendingDown, title: "Low visit frequency", body: `${cl.visits_per_week}×/week — below 2× target.`, cta: null, key: null, critical: false });

    return out;
  }, [cl, clientBookings, clientCheckIns]);

  if (!items.length) return (
    <Card label="Insights" icon={Brain}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: C.card2, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check style={{ width: 10, height: 10, color: C.blue }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>All clear</div>
          <div style={{ fontSize: 10.5, color: C.t3, marginTop: 1 }}>No issues detected</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="card" style={items.some(it => it.critical) ? { borderLeft: `2px solid ${C.red}` } : {}}>
      <SectionHead label="Insights" icon={Brain} sub={`${items.length} issue${items.length > 1 ? "s" : ""} flagged`} />
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it, i) => {
          const Ic = it.icon;
          const accent = it.critical ? C.red : C.t3;
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 10px", borderRadius: 8, borderLeft: `2px solid ${accent}`, background: i === 0 && it.critical ? C.redDim : "transparent" }}>
              <Ic style={{ width: 11, height: 11, color: accent, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.t1, marginBottom: 2 }}>{it.title}</div>
                <div style={{ fontSize: 10.5, color: C.t2, lineHeight: 1.5 }}>{it.body}</div>
              </div>
              {it.cta && (
                <button className="btn" onClick={() => onAction(it.key)} style={{ flexShrink: 0, fontSize: 9.5, fontWeight: 700, color: accent, background: `${accent}12`, border: `1px solid ${accent}22`, borderRadius: 5, padding: "3px 8px", fontFamily: FONT }}>
                  {it.cta}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Client Info ──────────────────────────────────────────────────────────────
function ClientInfo({ cl }) {
  return (
    <Card label="Client Info" icon={User}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { icon: Mail,   val: cl.email,    label: "Email"    },
          { icon: Phone,  val: cl.phone,    label: "Phone"    },
          { icon: MapPin, val: cl.location, label: "Location" },
          { icon: User,   val: cl.joined ? `Member since ${cl.joined}` : "—", label: "Joined" },
          { icon: Target, val: cl.goal,     label: "Goal"     },
        ].map(({ icon: Ic, val, label }) => (
          <div key={label} className="row" style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 6px" }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: C.card2, border: `1px solid ${C.brd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ic style={{ width: 8, height: 8, color: C.t3 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Lbl style={{ marginBottom: 1 }}>{label}</Lbl>
              <div style={{ fontSize: 11.5, color: C.t1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val || "—"}</div>
            </div>
          </div>
        ))}
        {cl.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            {cl.tags.map(t => (
              <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: C.blueDim, border: `1px solid ${C.blueBrd}`, color: C.blue }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ onMessage, onBook, onAssign }) {
  return (
    <Card label="Quick Actions" icon={Zap}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { label: "Send check-in message", icon: MessageSquare, fn: onMessage },
          { label: "Book next session",     icon: Calendar,      fn: onBook    },
          { label: "Assign workout",        icon: Dumbbell,      fn: onAssign  },
        ].map(({ label, icon: Ic, fn }) => (
          <button key={label} onClick={fn}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, background: "transparent", border: `1px solid ${C.brd}`, fontSize: 12, fontWeight: 500, color: C.t2, cursor: "pointer", fontFamily: FONT, transition: "all .12s", textAlign: "left", width: "100%" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.blueBrd; e.currentTarget.style.color = C.t1; e.currentTarget.style.background = C.blueDim; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; e.currentTarget.style.background = "transparent"; }}>
            <Ic style={{ width: 11, height: 11, flexShrink: 0 }} />
            {label}
            <ArrowRight style={{ width: 9, height: 9, marginLeft: "auto", color: C.t3 }} />
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function ClientCommandCenter({
  client         = MOCK_CLIENT,
  clientCheckIns = MOCK_CHECKINS,
  clientBookings = MOCK_BOOKINGS,
  clientWorkouts = MOCK_WORKOUTS,
  onMessage      = () => {},
  onBook         = () => {},
  onAssign       = () => {},
}) {
  const cl  = client;
  const act = key => { if (key === "message") onMessage(); else if (key === "book") onBook(); else onAssign(); };

  return (
    <div className="ccc" id="ccc-root" style={{ background: C.bg, minHeight: "100vh", overflowY: "auto" }}>
      <style>{CSS}</style>

      <CommandBar cl={cl} onMessage={onMessage} onBook={onBook} onAssign={onAssign} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px 60px" }}>

        {/* Page title — matching "Content Hub" pattern */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.t1, letterSpacing: "-0.03em" }}>
            Client <span style={{ color: C.blue }}>Profile</span>
          </h1>
          <span style={{ fontSize: 11, color: C.t3 }}>Member since {cl.joined}</span>
        </div>

        {/* NBA banner */}
        <div style={{ marginBottom: 10 }}>
          <NextBestAction cl={cl} onAction={act} />
        </div>

        {/* Stats strip */}
        <div style={{ marginBottom: 10 }}>
          <StatsStrip cl={cl} clientCheckIns={clientCheckIns} clientBookings={clientBookings} />
        </div>

        {/* Main two-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 10, alignItems: "start" }}>

          {/* Left — primary content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <AttendanceHeatmap clientCheckIns={clientCheckIns} />
            <WeeklyFrequency clientCheckIns={clientCheckIns} />
            <SessionHistory clientBookings={clientBookings} onBook={onBook} />
            <WorkoutPlans clientWorkouts={clientWorkouts} onAssign={onAssign} />
          </div>

          {/* Right — context + actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Insights cl={cl} clientBookings={clientBookings} clientCheckIns={clientCheckIns} onAction={act} />
            <ClientInfo cl={cl} />
            <QuickActions onMessage={onMessage} onBook={onBook} onAssign={onAssign} />
          </div>

        </div>
      </div>
    </div>
  );
}