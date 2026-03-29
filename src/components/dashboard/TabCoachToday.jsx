import { useState } from "react";

// ─── CSS ──────────────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("td-css")) {
  const s = document.createElement("style");
  s.id = "td-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .td-root { font-family: 'DM Sans', -apple-system, sans-serif; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
    @keyframes slideDown { from { opacity:0; transform:translateY(-4px) } to { opacity:1; transform:none } }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    .fade-up { animation: fadeUp .3s ease both; }
    .live-pulse { animation: pulse 2s ease-in-out infinite; }
    .row-hover { transition: background .12s; }
    .row-hover:hover { background: rgba(255,255,255,0.025) !important; }
    .btn-base { font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; outline: none; transition: all .12s; }
    .btn-base:hover { filter: brightness(1.1); }
    .btn-base:active { filter: brightness(.95); transform: scale(.98); }
    .expand-body { animation: slideDown .18s ease both; }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }
  `;
  document.head.appendChild(s);
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:       "#080f1a",
  surface:  "#0c1520",
  card:     "#0e1a28",
  inset:    "#091320",
  border:   "rgba(255,255,255,0.07)",
  borderMd: "rgba(255,255,255,0.11)",
  t1: "#dde6f0",
  t2: "#7a8fa8",
  t3: "#3d5068",
  t4: "#1e3048",
  blue:    "#3d82f4",
  blueDim: "rgba(61,130,244,0.12)",
  blueStr: "rgba(61,130,244,0.22)",
  amber:   "#e8962a",
  amberDim:"rgba(232,150,42,0.10)",
  amberStr:"rgba(232,150,42,0.22)",
  red:     "#e05252",
  redDim:  "rgba(224,82,82,0.10)",
  green:   "#21a36f",
  greenDim:"rgba(33,163,111,0.10)",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Spark({ data = [], color = C.blue, h = 26, w = 64 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lx = w;
  const ly = h - (last / max) * (h - 4) - 2;
  return (
    <svg width={w} height={h} style={{ overflow: "visible", flexShrink: 0, opacity: .75 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.2}
        strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lx} cy={ly} r={2} fill={color}/>
    </svg>
  );
}

function StatPill({ label, value, color = C.t3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function CapBar({ pct, color = C.blue }) {
  return (
    <div style={{ height: 2, borderRadius: 99, background: "rgba(255,255,255,0.05)", overflow: "hidden", width: 72 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }}/>
    </div>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────
const SESSIONS = [
  { id: 1, name: "CrossFit Madness", time: "06:00 AM", booked: 18, cap: 20, duration: "60m", status: "done",     spark: [5,6,4,7,6,5,4] },
  { id: 2, name: "HIIT Blast",       time: "09:30 AM", booked: 12, cap: 15, duration: "45m", status: "live",     spark: [3,4,5,4,6,5,6] },
  { id: 3, name: "Yoga Flow",        time: "12:00 PM", booked:  8, cap: 12, duration: "60m", status: "upcoming", spark: [2,3,2,4,3,4,3] },
  { id: 4, name: "Strength Lab",     time: "06:00 PM", booked: 14, cap: 20, duration: "75m", status: "upcoming", spark: [4,5,4,6,5,7,6] },
];

const AT_RISK = [
  { id: 1, name: "Sarah Williams", initials: "SW", days: 18, reason: "No visit in 18 days",        level: "high" },
  { id: 2, name: "James Okafor",   initials: "JO", days: 12, reason: "Visits down 60% vs last mo", level: "med"  },
  { id: 3, name: "Priya Nair",     initials: "PN", days:  9, reason: "9 days since last visit",    level: "med"  },
];

const WEEK = { days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], vals: [12,8,15,11,17,9,14] };

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Avatar({ initials, size = 30, level }) {
  const c = level === "high" ? C.red : level === "med" ? C.amber : C.t3;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `${c}14`, border: `1px solid ${c}30`,
      fontSize: size * .33, fontWeight: 800, color: c, letterSpacing: "-.01em",
    }}>{initials}</div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function CardHeader({ title, tag, action, onAction }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: C.t1,
        textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</span>
      {tag && <span style={{ fontSize: 9, fontWeight: 800, color: C.amber,
        background: C.amberDim, border: `1px solid ${C.amberStr}`,
        borderRadius: 99, padding: "2px 8px", textTransform: "uppercase",
        letterSpacing: ".05em" }}>{tag}</span>}
      {action && (
        <button className="btn-base" onClick={onAction} style={{
          fontSize: 10, fontWeight: 700, color: C.blue,
          background: C.blueDim, border: `1px solid ${C.blueStr}`,
          borderRadius: 6, padding: "4px 10px",
        }}>{action}</button>
      )}
    </div>
  );
}

// ─── KPI STRIP ────────────────────────────────────────────────────────────────
function KpiStrip() {
  const kpis = [
    { label: "Today's Check-ins", value: "34", sub: "+5 vs yesterday", subOk: true, spark: [20,25,22,28,24,29,34] },
    { label: "Fill Rate",         value: "71%", sub: "Across 4 sessions", subOk: null, spark: [60,65,68,64,70,69,71] },
    { label: "At-Risk Members",   value: "3",   sub: "Needs attention",   subOk: false, spark: [1,2,3,2,4,3,3] },
    { label: "Sessions Today",    value: "4",   sub: "1 done · 1 live",   subOk: null, spark: [3,4,3,4,3,4,4] },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
      {kpis.map((k, i) => {
        const valColor = i === 2 ? C.red : C.t1;
        const subColor = k.subOk === true ? C.green : k.subOk === false ? C.red : C.t3;
        return (
          <div key={i} className="fade-up" style={{ animationDelay: `${i * .05}s`,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.t3,
              textTransform: "uppercase", letterSpacing: ".07em" }}>{k.label}</span>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: valColor,
                letterSpacing: "-.045em", lineHeight: 1 }}>{k.value}</span>
              <Spark data={k.spark} color={i === 2 ? C.red : C.blue} h={28} w={60}/>
            </div>
            <span style={{ fontSize: 10, color: subColor, fontWeight: 500 }}>{k.sub}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SESSION ROW ─────────────────────────────────────────────────────────────
function SessionRow({ s, expanded, onToggle }) {
  const pct = Math.round((s.booked / s.cap) * 100);
  const isLive = s.status === "live";
  const isDone = s.status === "done";

  const statusColor = isLive ? C.green : isDone ? C.t4 : C.blue;
  const statusLabel = isLive ? "Live" : isDone ? "Done" : "Upcoming";

  return (
    <div>
      {/* Main row */}
      <div className="row-hover" onClick={onToggle} style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 20px", cursor: "pointer",
        borderBottom: `1px solid ${C.border}`, background: "transparent",
        opacity: isDone ? .65 : 1,
      }}>
        {/* Status indicator */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <div className={isLive ? "live-pulse" : ""} style={{
            width: 7, height: 7, borderRadius: "50%", background: statusColor,
          }}/>
        </div>

        {/* Time */}
        <span style={{ fontSize: 11, fontWeight: 700, color: isDone ? C.t3 : C.t2,
          width: 62, flexShrink: 0, letterSpacing: "-.01em" }}>{s.time}</span>

        {/* Name block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isDone ? C.t2 : C.t1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: ".05em", textTransform: "uppercase",
              color: statusColor, background: `${statusColor}14`,
              border: `1px solid ${statusColor}28`, borderRadius: 99, padding: "1px 7px",
            }}>{statusLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CapBar pct={pct} color={isDone ? C.t4 : C.blue}/>
            <span style={{ fontSize: 10, color: C.t3 }}>
              <span style={{ color: isDone ? C.t3 : C.t2, fontWeight: 600 }}>{s.booked}</span>/{s.cap} · {s.duration}
            </span>
          </div>
        </div>

        {/* Sparkline */}
        <Spark data={s.spark} color={isDone ? C.t4 : C.blue} h={24} w={56}/>

        {/* Check-in button */}
        <button className="btn-base" onClick={e => e.stopPropagation()} style={{
          fontSize: 10, fontWeight: 700, color: isDone ? C.t3 : C.blue,
          background: isDone ? "rgba(255,255,255,0.03)" : C.blueDim,
          border: `1px solid ${isDone ? C.border : C.blueStr}`,
          borderRadius: 7, padding: "5px 12px", letterSpacing: ".01em",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><circle cx="17.5" cy="17.5" r="2"/>
          </svg>
          Check-in
        </button>

        {/* Chevron */}
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={C.t4} strokeWidth={2.5}
          style={{ flexShrink: 0, transform: expanded ? "rotate(90deg)" : "none", transition: "transform .2s" }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="expand-body" style={{
          padding: "14px 20px 16px", background: C.inset,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
            {[
              { l: "Booked",   v: s.booked,                c: C.blue  },
              { l: "Attended", v: Math.ceil(s.booked*.75),  c: C.green },
              { l: "No-shows", v: Math.floor(s.booked*.25), c: C.red   },
              { l: "Open",     v: s.cap - s.booked,         c: C.t2    },
            ].map((stat, j) => (
              <div key={j} style={{
                padding: "10px 12px", borderRadius: 8, textAlign: "center",
                background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: stat.c, letterSpacing: "-.04em" }}>{stat.v}</div>
                <div style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 3 }}>{stat.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "Send reminder", color: C.amber },
              { label: "Message group", color: C.blue },
              { label: "Mark complete", color: C.green },
            ].map(({ label, color }, k) => (
              <button key={k} className="btn-base" style={{
                fontSize: 10, fontWeight: 700, color, padding: "5px 12px",
                background: `${color}0f`, border: `1px solid ${color}28`,
                borderRadius: 7,
              }}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TodayDashboard() {
  const [expanded, setExpanded] = useState(null);
  const toggle = id => setExpanded(p => p === id ? null : id);

  const maxPulse = Math.max(...WEEK.vals);
  const liveSession = SESSIONS.find(s => s.status === "live");

  return (
    <div className="td-root" style={{
      background: C.bg, minHeight: "100vh", padding: "16px 24px 24px",
      display: "flex", flexDirection: "column", gap: 18,
    }}>

      {/* ── HEADER — date line removed; just the title + live badge ── */}
      <div className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.t1, letterSpacing: "-.03em" }}>
          Today's Overview
        </div>
        {liveSession && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px",
            background: C.greenDim, border: `1px solid rgba(33,163,111,0.22)`,
            borderRadius: 8 }}>
            <div className="live-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.green }}>{liveSession.name} is live</span>
          </div>
        )}
      </div>

      {/* ── KPI STRIP ── */}
      <KpiStrip/>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "start" }}>

        {/* ── SESSIONS (HERO) ── */}
        <Card>
          <CardHeader title="Today's Sessions" action="+ Add Session" onAction={() => {}}/>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "20px 62px 1fr auto auto auto",
            gap: 14, padding: "8px 20px",
            borderBottom: `1px solid ${C.border}` }}>
            {["", "Time", "Session", "", "Attendance", ""].map((h, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 700, color: C.t4,
                textTransform: "uppercase", letterSpacing: ".07em" }}>{h}</span>
            ))}
          </div>

          {SESSIONS.map(s => (
            <SessionRow key={s.id} s={s} expanded={expanded === s.id} onToggle={() => toggle(s.id)}/>
          ))}

          {/* Footer summary */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 24 }}>
            {[
              { label: "Total booked", value: SESSIONS.reduce((a, s) => a + s.booked, 0) },
              { label: "Total capacity", value: SESSIONS.reduce((a, s) => a + s.cap, 0) },
              { label: "Overall fill", value: `${Math.round(SESSIONS.reduce((a,s)=>a+s.booked,0)/SESSIONS.reduce((a,s)=>a+s.cap,0)*100)}%` },
            ].map((stat, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.t1, letterSpacing: "-.03em" }}>{stat.value}</span>
                <span style={{ fontSize: 10, color: C.t3 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Action Items */}
          <Card>
            <CardHeader title="Action Items" tag={`${AT_RISK.length} pending`} action="View all" onAction={() => {}}/>
            <div style={{ padding: "6px 0" }}>
              {AT_RISK.map((m, i) => (
                <div key={m.id} className="row-hover" style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px", cursor: "pointer",
                  borderLeft: `2px solid ${m.level === "high" ? C.red : C.amber}`,
                  marginLeft: 0,
                }}>
                  <Avatar initials={m.initials} size={28} level={m.level}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.t1,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontSize: 9, color: C.t3 }}>{m.reason}</div>
                  </div>
                  <button className="btn-base" style={{
                    fontSize: 9, fontWeight: 700, color: C.amber,
                    background: C.amberDim, border: `1px solid ${C.amberStr}`,
                    borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
                  }}>Message →</button>
                </div>
              ))}
            </div>
          </Card>

          {/* 7-Day Pulse */}
          <Card>
            <CardHeader title="Check-in Activity"/>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 52, marginBottom: 10 }}>
                {WEEK.vals.map((v, i) => {
                  const h = Math.max(3, (v / maxPulse) * 48);
                  const isToday = i === 6;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 5 }}>
                      <div style={{ width: "100%", height: h, borderRadius: 3,
                        background: isToday ? C.blue : "rgba(61,130,244,0.22)",
                        transition: "height .5s ease" }}/>
                      <span style={{ fontSize: 8, color: isToday ? C.blue : C.t4,
                        fontWeight: isToday ? 800 : 500 }}>{WEEK.days[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}`,
                display: "flex", justifyContent: "space-between" }}>
                <StatPill label="Today" value={WEEK.vals[6]} color={C.t1}/>
                <StatPill label="Daily avg" value={(WEEK.vals.reduce((a,b)=>a+b)/7).toFixed(1)} color={C.t2}/>
                <StatPill label="This week" value={WEEK.vals.reduce((a,b)=>a+b)} color={C.t2}/>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions"/>
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
              {[
                { label: "Scan check-in",  sub: "Open QR scanner" },
                { label: "Send message",   sub: "Broadcast or 1:1" },
                { label: "Book a client",  sub: "Schedule session" },
                { label: "New session",    sub: "Add to today" },
              ].map(({ label, sub }, i) => (
                <button key={i} className="btn-base row-hover" style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                  borderRadius: 8, background: "transparent",
                  border: `1px solid transparent`, textAlign: "left", width: "100%",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{label}</div>
                    <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>{sub}</div>
                  </div>
                  <span style={{ fontSize: 10, color: C.blue, fontWeight: 700 }}>→</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}