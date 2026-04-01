import { useState, useMemo } from "react";

// ─── UTILITY ──────────────────────────────────────────────────────────────────
const diffDays = (a, b) => Math.floor((a - b) / 86400000);

// ─── DESIGN TOKENS (Members page system) ─────────────────────────────────────
const T = {
  bg:       '#06090f',
  surface:  '#0b1121',
  surfaceH: '#0e1528',
  card:     '#0d1424',
  border:   'rgba(255,255,255,.05)',
  borderH:  'rgba(255,255,255,.09)',
  borderA:  'rgba(255,255,255,.12)',

  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#1e293b',

  emerald:    '#10b981',
  emeraldDim: 'rgba(16,185,129,.08)',
  emeraldBdr: 'rgba(16,185,129,.18)',

  indigo:    '#6366f1',
  indigoDim: 'rgba(99,102,241,.08)',
  indigoBdr: 'rgba(99,102,241,.18)',

  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,.07)',
  amberBdr: 'rgba(245,158,11,.16)',

  red:      '#ef4444',
  redDim:   'rgba(239,68,68,.07)',
  redBdr:   'rgba(239,68,68,.16)',

  sky:      '#38bdf8',
  skyDim:   'rgba(56,189,248,.07)',
  skyBdr:   'rgba(56,189,248,.16)',

  mono: "'JetBrains Mono', monospace",
};

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("tct-css")) {
  const s = document.createElement("style");
  s.id = "tct-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .tct { font-family: 'Instrument Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }

    @keyframes tctFadeUp  { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
    @keyframes tctSlideIn { from { opacity:0; transform:translateX(12px) } to { opacity:1; transform:none } }
    @keyframes tctPulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
    @keyframes tctGlow    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)} 50%{box-shadow:0 0 0 4px rgba(239,68,68,.08)} }

    .t-fadeup  { animation: tctFadeUp  .3s  cubic-bezier(.4,0,.2,1) both; }
    .t-slidein { animation: tctSlideIn .22s cubic-bezier(.4,0,.2,1) both; }
    .t-pulse   { animation: tctPulse   2s   ease-in-out infinite; }
    .t-glow    { animation: tctGlow    2.5s ease infinite; }

    .t-d1{animation-delay:.05s} .t-d2{animation-delay:.10s} .t-d3{animation-delay:.15s}
    .t-d4{animation-delay:.20s} .t-d5{animation-delay:.25s}

    .tct-btn { font-family:'Instrument Sans',sans-serif; cursor:pointer; outline:none;
               transition:all .15s cubic-bezier(.4,0,.2,1); border:none;
               display:inline-flex; align-items:center; gap:5px; }
    .tct-btn:hover  { opacity:.85; }
    .tct-btn:active { transform:scale(.96); }

    .tct-card { background:#0b1121; border:1px solid rgba(255,255,255,.05); border-radius:14px;
                overflow:hidden; transition:border-color .15s; position:relative; }
    .tct-card:hover { border-color:rgba(255,255,255,.09); }

    .tct-row { transition:background .12s; cursor:pointer; }
    .tct-row:hover { background:rgba(255,255,255,.018) !important; }

    .tct-scr::-webkit-scrollbar { width:3px; }
    .tct-scr::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); border-radius:2px; }

    .tct-tab { font-family:'Instrument Sans',sans-serif; cursor:pointer; outline:none;
               transition:all .15s; border:none; }

    .tct-pri-col { transition:background .12s; }
    .tct-pri-col:hover { background:rgba(255,255,255,.015) !important; }

    @media (max-width:1100px) {
      .tct-main-grid { grid-template-columns:1fr !important; }
      .tct-sidebar   { position:static !important; }
    }
    @media (max-width:640px) {
      .tct-stat-grid { grid-template-columns:1fr 1fr !important; }
      .tct-pri-grid  { grid-template-columns:1fr !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const NOW_MOCK = (() => { const d = new Date(); d.setHours(12, 15, 0, 0); return d; })();

const mkCI = (() => {
  let n = 1;
  return (uid, daysAgo) => {
    const d = new Date(NOW_MOCK);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(7 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60));
    return { id: `ci${n++}`, user_id: uid, check_in_date: d.toISOString() };
  };
})();

const MEMBERS = [
  { user_id: "u1",  user_name: "Sophie Allen" },
  { user_id: "u2",  user_name: "James Park" },
  { user_id: "u3",  user_name: "Rachel Kim" },
  { user_id: "u4",  user_name: "Michael Chen" },
  { user_id: "u5",  user_name: "Ella Torres" },
  { user_id: "u6",  user_name: "David Lowe" },
  { user_id: "u7",  user_name: "Maria Santos" },
  { user_id: "u8",  user_name: "Tom Bradley" },
  { user_id: "u9",  user_name: "Lisa Chen" },
  { user_id: "u10", user_name: "Alex Kumar" },
];

const CHECKINS = [
  ...[0,1,3,5,7,9,11].map(d => mkCI("u6", d)),
  ...[0,2,4,6,9,11,13].map(d => mkCI("u7", d)),
  ...[1,3,5,8,10,12].map(d => mkCI("u8", d)),
  ...[0,1,2,4,6,8,11].map(d => mkCI("u9", d)),
  ...[3,5,7,9,11].map(d => mkCI("u4", d)),
  ...[6,8,10,12,13].map(d => mkCI("u5", d)),
  ...[7,9,11,12,13].map(d => mkCI("u1", d)),
  ...[8,10,12,13].map(d => mkCI("u2", d)),
  ...[15,18,21,24].map(d => mkCI("u3", d)),
];

const CLASSES = [
  { id:"c1", name:"Morning Strength", schedule:"7:00 am",  max_capacity:15, bookings:Array.from({length:12},(_,i)=>({id:i})), duration_minutes:60, instructor:"Marcus Reid" },
  { id:"c2", name:"Yoga Flow",        schedule:"9:30 am",  max_capacity:15, bookings:Array.from({length:6}, (_,i)=>({id:i})), duration_minutes:60, instructor:"Sarah Mills" },
  { id:"c3", name:"Lunch HIIT",       schedule:"12:00 pm", max_capacity:15, bookings:Array.from({length:15},(_,i)=>({id:i})), duration_minutes:45, instructor:"Marcus Reid", notes:"Full house — consider sending a warmup tip before class." },
  { id:"c4", name:"Evening HIIT",     schedule:"6:00 pm",  max_capacity:20, bookings:Array.from({length:7}, (_,i)=>({id:i})), duration_minutes:45, instructor:"Tom Harris" },
  { id:"c5", name:"Spin Class",       schedule:"7:30 pm",  max_capacity:18, bookings:Array.from({length:14},(_,i)=>({id:i})), duration_minutes:45, instructor:"Amy Price" },
];

const CURRENT_USER = { display_name: "Marcus Reid" };

const MOCK_ACTIVITY = [
  { type:"checkin", name:"David Lowe",   detail:"Checked into Morning Strength",       time:"2m ago",    tcolor: T.emerald },
  { type:"missed",  name:"Rachel Kim",   detail:"Missed Yoga Flow — no cancellation",  time:"14m ago",   tcolor: T.red,     action:"Follow up" },
  { type:"sent",    name:"You",          detail:"Renewal message sent to Tom Bradley", time:"47m ago",   tcolor: T.indigo },
  { type:"booking", name:"Maria Santos", detail:"Booked Evening HIIT at 6pm",          time:"1h ago",    tcolor: T.emerald },
  { type:"booking", name:"3 members",    detail:"Booked Spin Class — now 14/18",       time:"2h ago",    tcolor: T.emerald },
  { type:"cancel",  name:"Michael Chen", detail:"Cancelled Thursday — 2nd this week",  time:"3h ago",    tcolor: T.amber,   action:"Check in" },
  { type:"new",     name:"Emma Wilson",  detail:"Started 7-day trial membership",      time:"Yesterday", tcolor: T.sky },
];

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Avatar({ name, size = 30, color }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const c = color || T.indigo;
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `${c}12`, border: `1px solid ${c}22`,
      fontSize: size * .33, fontWeight: 700, color: c, userSelect: "none",
    }}>{initials}</div>
  );
}

function Pill({ children, color = T.t3, bg, border, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, color,
      background: bg || `${color}0d`,
      border: `1px solid ${border || `${color}22`}`,
      borderRadius: 6, padding: "2px 8px",
      letterSpacing: ".02em", textTransform: "uppercase",
      whiteSpace: "nowrap", lineHeight: "16px", ...style,
    }}>{children}</span>
  );
}

function Mono({ children, style }) {
  return (
    <span style={{ fontFamily: T.mono, fontWeight: 500, letterSpacing: "-.02em", ...style }}>
      {children}
    </span>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: T.t3,
      textTransform: "uppercase", letterSpacing: ".07em", ...style,
    }}>{children}</div>
  );
}

function Dot({ color, pulse }) {
  return (
    <div style={{
      width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0,
      animation: pulse ? "tctPulse 2s ease-in-out infinite" : "none",
    }} />
  );
}

function CardHead({ label, sub, right, border = true }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "14px 18px",
      ...(border ? { borderBottom: `1px solid ${T.border}` } : {}),
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, letterSpacing: "-.01em" }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// SVG icon library (unchanged — same icons, same logic)
const I = {
  arrow:  (n=10) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={5} y1={12} x2={19} y2={12}/><polyline points="12 5 19 12 12 19"/></svg>,
  warn:   (n=13) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
  info:   (n=13) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={12} cy={12} r={10}/><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12.01} y2={16}/></svg>,
  check:  (n=13) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>,
  up:     (n=10) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="18 15 12 9 6 15"/></svg>,
  down:   (n=10) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9"/></svg>,
  msg:    (n=11) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  cal:    (n=11) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>,
  qr:     (n=11) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={4} height={4}/></svg>,
  plus:   (n=11) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>,
  users:  (n=11) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  chevR:  (n=10) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>,
  chevD:  (n=10) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9"/></svg>,
  speak:  (n=11) => <svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>,
};

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (msg, color = T.indigo) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, color }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  };
  return { toasts, toast };
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 200,
      display: "flex", flexDirection: "column", gap: 8,
      pointerEvents: "none", maxWidth: 300,
    }}>
      {toasts.map(t => (
        <div key={t.id} className="t-slidein" style={{
          background: T.card, border: `1px solid ${T.borderA}`,
          borderLeft: `3px solid ${t.color}`, borderRadius: 10,
          padding: "10px 16px", fontSize: 12, color: T.t1,
          boxShadow: "0 8px 24px rgba(0,0,0,.6)", lineHeight: 1.5,
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── DERIVE SESSIONS ──────────────────────────────────────────────────────────
function deriveSessions(myClasses, now) {
  const nd = now.getHours() + now.getMinutes() / 60;
  return myClasses.map((cls, i) => {
    const sched = typeof cls.schedule === "string" ? cls.schedule : "";
    let th = null;
    const m = sched.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (m) {
      th = parseInt(m[1]);
      if (m[3]?.toLowerCase() === "pm" && th !== 12) th += 12;
      if (m[3]?.toLowerCase() === "am" && th === 12) th = 0;
      if (m[2]) th += parseInt(m[2]) / 60;
    }
    const cap = cls.max_capacity || 20, booked = (cls.bookings || []).length, dur = cls.duration_minutes || 60;
    let status = "upcoming";
    if (th !== null) {
      if (nd > th + dur / 60) status = "done";
      else if (nd >= th) status = "live";
    }
    return {
      id: cls.id || `c${i}`, name: cls.name || "Session", time: sched, th, booked, cap,
      duration: `${dur}m`, status, coach: cls.instructor || null, notes: cls.notes || null,
    };
  }).sort((a, b) => (a.th ?? 99) - (b.th ?? 99));
}

// ─── DERIVE PRIORITIES ────────────────────────────────────────────────────────
function derivePriorities({ allMemberships, checkIns, sessions, now }) {
  const out = [];
  const inactive = allMemberships.filter(m => {
    const last = checkIns.filter(c => c.user_id === m.user_id)
      .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
    return last && diffDays(now, new Date(last.check_in_date)) >= 7;
  });
  const never = allMemberships.filter(m => !checkIns.some(c => c.user_id === m.user_id));
  if (inactive.length > 0 || never.length > 0) {
    const count = inactive.length + never.length;
    const names = [...inactive, ...never].map(m => m.user_name?.split(" ")[0]).slice(0, 2).join(", ");
    out.push({
      id: "inactive", rank: 1, severity: "high",
      title: `${count} client${count > 1 ? "s haven't" : " hasn't"} attended in 7+ days`,
      context: `${names}${count > 2 ? ` + ${count - 2} more` : ""} — each extra day lowers re-engagement success by ~4%. Today is the best window to act.`,
      cta: "Send Re-engagement", color: T.red, colorDim: T.redDim, colorBrd: T.redBdr,
    });
  }
  const trialNames = ["Emma Wilson", "Josh Lee", "Priya Nair", "Sam Parker"];
  out.push({
    id: "trials", rank: 2, severity: "med",
    title: `${trialNames.length} trial members expire this week`,
    context: `Avg conversion is 68% when contacted before day 4. Today is day 4 for ${trialNames[0]} — the window is closing. Send the upsell sequence now.`,
    cta: "Start Upsell Sequence", color: T.amber, colorDim: T.amberDim, colorBrd: T.amberBdr,
  });
  const under = sessions.filter(s => s.status !== "done" && s.cap > 0 && s.booked / s.cap < 0.4);
  if (under.length > 0) {
    const s = under[0];
    out.push({
      id: "underbooked", rank: 3, severity: "med",
      title: `"${s.name}" is at ${Math.round(s.booked / s.cap * 100)}% — ${s.cap - s.booked} spots open`,
      context: `${s.booked}/${s.cap} filled. Last month this class averaged ${s.cap - 2} attendees. A quick push right now can still close the gap before ${s.time}.`,
      cta: "Promote Class", color: T.indigo, colorDim: T.indigoDim, colorBrd: T.indigoBdr,
    });
  }
  if (out.length === 0) out.push({
    id: "ok", rank: 1, severity: "ok",
    title: "You're on top of everything today",
    context: "All clients active, sessions healthy. Use this window to plan next week or review monthly performance trends.",
    cta: "View Analytics", color: T.emerald, colorDim: T.emeraldDim, colorBrd: T.emeraldBdr,
  });
  return out.slice(0, 4);
}

// ─── SECTION: COMMAND HEADER ──────────────────────────────────────────────────
function CommandHeader({ currentUser, now, sessions, priorities }) {
  const firstName = currentUser?.display_name?.split(" ")[0] || "Coach";
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const live = sessions.find(s => s.status === "live");
  const next = sessions.find(s => s.status === "upcoming");
  const urgent = priorities.filter(p => p.severity === "high").length;
  const avgFill = (() => {
    const ss = sessions.filter(s => s.cap > 0);
    return ss.length ? Math.round(ss.reduce((a, s) => a + s.booked / s.cap, 0) / ss.length * 100) : 0;
  })();

  return (
    <div className="t-fadeup" style={{
      paddingBottom: 22, marginBottom: 22,
      borderBottom: `1px solid ${T.border}`,
    }}>
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 10, color: T.t3,
            marginBottom: 8, letterSpacing: ".06em",
          }}>{dateStr}</div>
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: T.t1,
            letterSpacing: "-.04em", lineHeight: 1,
          }}>
            {greeting}, {firstName}.
          </h1>
          <div style={{ marginTop: 10, fontSize: 13, color: T.t2, lineHeight: 1.5 }}>
            {urgent > 0
              ? <><span style={{ color: T.red, fontWeight: 700 }}>{urgent} urgent item{urgent > 1 ? "s" : ""}</span> need your attention — act before the next session begins.</>
              : "Everything looks healthy. Review your sessions and risk feed below."}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {live ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "9px 15px", background: T.emeraldDim,
              border: `1px solid ${T.emeraldBdr}`, borderRadius: 10,
            }}>
              <Dot color={T.emerald} pulse />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.emerald }}>{live.name} · Live now</span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.emerald, opacity: .7 }}>
                {live.booked}/{live.cap}
              </span>
            </div>
          ) : next ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 10,
            }}>
              <Dot color={T.indigo} />
              <span style={{ fontSize: 11, color: T.t2 }}>
                Next: <strong style={{ color: T.t1 }}>{next.name}</strong> · {next.time}
              </span>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "urgent",   v: urgent,      color: T.red,     dim: T.redDim,     bdr: T.redBdr },
              { label: "avg fill", v: `${avgFill}%`, color: T.indigo, dim: T.indigoDim,  bdr: T.indigoBdr },
              { label: "mtd",      v: "£8,240",    color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr },
            ].map((p, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", background: p.dim,
                border: `1px solid ${p.bdr}`, borderRadius: 8,
              }}>
                <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: p.color }}>{p.v}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: p.color, opacity: .65,
                  textTransform: "uppercase", letterSpacing: ".06em",
                }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION: TODAY'S PRIORITIES ──────────────────────────────────────────────
function TodaysPriorities({ priorities, toast }) {
  const urgent = priorities.filter(p => p.severity === "high").length;
  const sevIcon = (sev, color) => (
    <div style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: `${color}0d`, border: `1px solid ${color}22`,
      display: "flex", alignItems: "center", justifyContent: "center", color,
    }}>
      {sev === "high" ? I.warn(13) : sev === "med" ? I.info(13) : I.check(13)}
    </div>
  );

  const cols = priorities.length === 1 ? "1fr"
    : priorities.length === 2 ? "1fr 1fr"
    : "1fr 1fr 1fr";

  return (
    <div className="tct-card t-fadeup" style={{ marginBottom: 14 }}>
      <CardHead
        label="Today's Priorities"
        sub={urgent > 0 ? `${urgent} urgent · act before sessions begin` : "Everything on track"}
        right={
          <Pill color={urgent > 0 ? T.red : T.emerald}
            bg={urgent > 0 ? T.redDim : T.emeraldDim}
            border={urgent > 0 ? T.redBdr : T.emeraldBdr}>
            {urgent > 0 ? `${urgent} urgent` : "All clear"}
          </Pill>
        }
      />

      <div className="tct-pri-grid" style={{ display: "grid", gridTemplateColumns: cols }}>
        {priorities.map((p, i) => (
          <div key={p.id} className="tct-pri-col" style={{
            padding: "16px 18px",
            borderRight: i < priorities.length - 1 ? `1px solid ${T.border}` : "none",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                {sevIcon(p.severity, p.color)}
                <span style={{
                  fontFamily: T.mono, fontSize: 9, color: T.t4, fontWeight: 600,
                }}>0{p.rank}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: T.t1,
                  lineHeight: 1.35, letterSpacing: "-.01em",
                }}>{p.title}</div>
              </div>
            </div>
            <div style={{
              fontSize: 11, color: T.t3, lineHeight: 1.65, paddingLeft: 38,
            }}>{p.context}</div>
            <div style={{ paddingLeft: 38 }}>
              <button className="tct-btn" onClick={() => toast(`Started: ${p.cta}`, p.color)} style={{
                fontSize: 11, fontWeight: 700, color: p.color,
                background: p.colorDim, border: `1px solid ${p.colorBrd}`,
                borderRadius: 8, padding: "7px 14px",
              }}>
                {p.cta} {I.arrow(10)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION: QUICK STRIP ─────────────────────────────────────────────────────
function QuickStrip({ toast }) {
  const items = [
    { label: "Scan Check-in",     color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr, icon: I.qr(12),   msg: "QR scanner opened" },
    { label: "Broadcast Message", color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr,  icon: I.msg(12),  msg: "Message composer opened" },
    { label: "Schedule Session",  color: T.sky,     dim: T.skyDim,     bdr: T.skyBdr,     icon: I.cal(12),  msg: "Session scheduler opened" },
    { label: "All Clients",       color: T.t2,      dim: "rgba(255,255,255,.04)", bdr: T.border, icon: I.users(12), msg: "Opening clients tab" },
  ];
  return (
    <div style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
      {items.map((a, i) => (
        <button key={i} className="tct-btn" onClick={() => toast(a.msg, a.color)} style={{
          fontSize: 12, fontWeight: 700, color: a.color,
          background: a.dim, border: `1px solid ${a.bdr}`,
          borderRadius: 9, padding: "9px 16px",
        }}>
          {a.icon}{a.label}
        </button>
      ))}
    </div>
  );
}

// ─── SECTION: ATTENDANCE CHART ────────────────────────────────────────────────
function AttendanceChart({ checkIns, now }) {
  const [tip, setTip] = useState(null);

  const data = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const t = new Date(now); t.setDate(t.getDate() - (13 - i));
    const count = checkIns.filter(c => {
      const d = new Date(c.check_in_date);
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    return {
      date: t, label: t.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
      v: count, isToday: i === 13, isWeekend: t.getDay() === 0 || t.getDay() === 6,
    };
  }), [checkIns, now]);

  const maxV = Math.max(...data.map(d => d.v), 1);
  const W = 100, H = 80, PAD = { t: 8, b: 30, l: 2, r: 2 };
  const pW = W - PAD.l - PAD.r, pH = H - PAD.t - PAD.b;
  const pts = data.map((d, i) => ({
    ...d,
    x: PAD.l + (i / (data.length - 1)) * pW,
    y: PAD.t + pH - (d.v / maxV) * pH,
  }));

  const anomalies = pts.filter((p, i) => {
    if (i < 1 || i > pts.length - 2) return false;
    const avg = (pts[i - 1].v + pts[i + 1].v) / 2;
    return avg > 1 && p.v < avg * 0.45;
  });

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.t + pH} L ${pts[0].x} ${PAD.t + pH} Z`;

  const thisW = data.slice(7).reduce((a, b) => a + b.v, 0);
  const lastW = data.slice(0, 7).reduce((a, b) => a + b.v, 0);
  const trend = lastW > 0 ? Math.round(((thisW - lastW) / lastW) * 100) : 0;
  const tUp = trend >= 0;
  const bestDay = data.slice(7).reduce((a, b) => b.v > a.v ? b : a, { v: -1, label: "?" });

  return (
    <div className="tct-card t-fadeup t-d1" style={{ marginBottom: 12 }}>
      <CardHead
        label="Attendance — Last 14 Days"
        sub={`${thisW} check-ins this week`}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {anomalies.length > 0 && (
              <Pill color={T.amber} bg={T.amberDim} border={T.amberBdr}>
                {anomalies.length} anomaly
              </Pill>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
              borderRadius: 7, background: tUp ? T.emeraldDim : T.redDim,
              border: `1px solid ${tUp ? T.emeraldBdr : T.redBdr}`,
            }}>
              <span style={{ color: tUp ? T.emerald : T.red }}>
                {tUp ? I.up(9) : I.down(9)}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: tUp ? T.emerald : T.red }}>
                {Math.abs(trend)}% vs last week
              </span>
            </div>
          </div>
        }
      />

      <div style={{ padding: "14px 18px 0" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 160, overflow: "visible" }}
          onMouseLeave={() => setTip(null)}>
          <defs>
            <linearGradient id="tct-ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={T.indigo} stopOpacity={.18} />
              <stop offset="100%" stopColor={T.indigo} stopOpacity={.01} />
            </linearGradient>
          </defs>

          {[.25, .5, .75].map((v, i) => (
            <line key={i} x1={PAD.l} y1={PAD.t + pH * (1 - v)} x2={W - PAD.r} y2={PAD.t + pH * (1 - v)}
              stroke="rgba(255,255,255,0.04)" strokeWidth={.5} />
          ))}
          {pts.filter(p => p.isWeekend).map((p, i) => (
            <rect key={i} x={p.x - 2} y={PAD.t} width={4} height={pH}
              fill="rgba(255,255,255,0.012)" rx={1} />
          ))}

          <path d={areaD} fill="url(#tct-ag)" />

          {anomalies.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5.5} fill={T.amberDim} stroke={T.amber} strokeWidth={1} />
              <line x1={p.x} y1={p.y + 5.5} x2={p.x} y2={PAD.t + pH}
                stroke={T.amber} strokeWidth={.6} strokeDasharray="1.5 1.5" opacity={.4} />
            </g>
          ))}

          <path d={pathD} fill="none" stroke={T.indigo} strokeWidth={1.8}
            strokeLinejoin="round" strokeLinecap="round" opacity={.9} />

          {(() => {
            const p = pts[pts.length - 1];
            return (
              <>
                <line x1={p.x} y1={PAD.t} x2={p.x} y2={PAD.t + pH}
                  stroke={T.indigo} strokeWidth={.7} strokeDasharray="2 2" opacity={.35} />
                <circle cx={p.x} cy={p.y} r={3.5} fill={T.indigo} stroke="#06090f" strokeWidth={1.5} />
              </>
            );
          })()}

          {pts.map((p, i) => (
            <rect key={i} x={p.x - 3.5} y={PAD.t} width={7} height={pH + 4}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setTip({
                x: p.x, y: p.y, label: p.label, v: p.v,
                isA: anomalies.some(a => a.date.getTime() === p.date.getTime()),
              })} />
          ))}

          {tip && (() => {
            const tx = Math.min(tip.x, W - 14);
            return (
              <g style={{ pointerEvents: "none" }}>
                <circle cx={tip.x} cy={tip.y} r={3}
                  fill={tip.isA ? T.amber : T.indigo} stroke="#06090f" strokeWidth={1.5} />
                <rect x={tx - 12} y={tip.y - 20} width={24} height={14}
                  rx={3} fill={T.card} stroke={T.borderA} strokeWidth={.5} />
                <text x={tx} y={tip.y - 10} textAnchor="middle"
                  fill={T.t1} fontSize={6} fontFamily="monospace" fontWeight={500}>
                  {tip.v}
                </text>
              </g>
            );
          })()}

          {pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1).map((p, i) => (
            <text key={i} x={p.x} y={H - 4} textAnchor="middle" fontSize={5.5}
              fill={p.isToday ? T.indigo : T.t4} fontFamily="system-ui"
              fontWeight={p.isToday ? 700 : 400}>
              {p.isToday ? "Today" : p.label}
            </text>
          ))}
        </svg>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${T.border}` }}>
        {[
          { l: "This week", v: thisW,                          s: "check-ins" },
          { l: "Daily avg", v: (thisW / 7).toFixed(1),        s: "per day" },
          { l: "Best day",  v: Math.max(...data.slice(7).map(d => d.v)), s: bestDay.label },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "12px 16px",
            borderRight: i < 2 ? `1px solid ${T.border}` : "none",
          }}>
            <SectionLabel style={{ marginBottom: 6 }}>{s.l}</SectionLabel>
            <Mono style={{ fontSize: 22, color: T.t1, lineHeight: 1, display: "block" }}>{s.v}</Mono>
            <div style={{ fontSize: 10, color: T.t3, marginTop: 3 }}>{s.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SESSION HEALTH HELPER ────────────────────────────────────────────────────
function sHealth(booked, cap) {
  const r = cap > 0 ? booked / cap : 0;
  if (r >= .85) return { label: "Full",        color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr };
  if (r >= .55) return { label: "Healthy",     color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr };
  if (r >= .28) return { label: "Underbooked", color: T.amber,   dim: T.amberDim,   bdr: T.amberBdr };
  return              { label: "Critical",    color: T.red,     dim: T.redDim,     bdr: T.redBdr };
}

// ─── SESSION TIMELINE STRIP ────────────────────────────────────────────────────
function SessionTimeline({ sessions }) {
  const S = 6, E = 22, range = E - S;
  const toX = h => `${((h - S) / range) * 100}%`;
  const toW = m => `${(m / 60 / range) * 100}%`;
  const stCol = { live: T.emerald, upcoming: T.indigo, done: T.t4 };

  return (
    <div style={{ padding: "10px 18px 20px", borderBottom: `1px solid ${T.border}` }}>
      <SectionLabel style={{ marginBottom: 10 }}>Session Timeline</SectionLabel>
      <div style={{ position: "relative", height: 26 }}>
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0,
          height: 1.5, background: T.border,
          transform: "translateY(-50%)", borderRadius: 1,
        }} />
        {sessions.filter(s => s.th !== null).map(s => {
          const c = stCol[s.status];
          const dur = parseInt(s.duration) || 60;
          return (
            <div key={s.id} style={{
              position: "absolute", top: 0, left: toX(s.th),
              width: toW(dur), height: "100%",
              background: `${c}12`, border: `1px solid ${c}30`,
              borderRadius: 5, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }} title={`${s.name} · ${s.time} · ${s.booked}/${s.cap}`}>
              <span style={{
                fontSize: 8, fontWeight: 700, color: c, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis", padding: "0 4px",
              }}>{s.time}</span>
            </div>
          );
        })}
        {[6, 9, 12, 15, 18, 21].map(h => (
          <div key={h} style={{ position: "absolute", bottom: -14, left: toX(h), transform: "translateX(-50%)" }}>
            <span style={{ fontFamily: T.mono, fontSize: 8, color: T.t4 }}>
              {String(h).padStart(2, "0")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION: TODAY'S SESSIONS ─────────────────────────────────────────────────
function TodaysSessions({ sessions, toast }) {
  const [exp, setExp] = useState(null);
  const statLabel = { live: "Live", upcoming: "Upcoming", done: "Done" };
  const statColor = { live: T.emerald, upcoming: T.indigo, done: T.t3 };
  const avgFill = Math.round(
    sessions.reduce((a, s) => a + (s.cap > 0 ? s.booked / s.cap : 0), 0) /
    Math.max(1, sessions.length) * 100
  );

  return (
    <div className="tct-card t-fadeup t-d2" style={{ marginBottom: 12 }}>
      <CardHead
        label="Today's Sessions"
        sub={`${sessions.length} scheduled · ${avgFill}% avg fill`}
        right={
          <button className="tct-btn" onClick={() => toast("Opening scheduler", T.indigo)} style={{
            fontSize: 11, fontWeight: 700, color: T.indigo,
            background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
            borderRadius: 8, padding: "6px 13px",
          }}>
            {I.plus(10)} Add Session
          </button>
        }
      />

      <SessionTimeline sessions={sessions} />

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "56px 1fr 88px 100px 60px",
        padding: "7px 18px", gap: 0, borderBottom: `1px solid ${T.border}`,
      }}>
        {["Time", "Session", "Fill", "Health", ""].map((h, i) => (
          <SectionLabel key={i} style={{ textAlign: i > 1 ? "center" : "left" }}>{h}</SectionLabel>
        ))}
      </div>

      {sessions.map((s, i) => {
        const h = sHealth(s.booked, s.cap);
        const pct = s.cap > 0 ? Math.round(s.booked / s.cap * 100) : 0;
        const isE = exp === s.id, isDone = s.status === "done";
        return (
          <div key={s.id} style={{ opacity: isDone ? .55 : 1 }}>
            <div className="tct-row" onClick={() => setExp(isE ? null : s.id)} style={{
              display: "grid", gridTemplateColumns: "56px 1fr 88px 100px 60px",
              padding: "13px 18px", gap: 0, alignItems: "center",
              borderBottom: i < sessions.length - 1 ? `1px solid ${T.border}` : "none",
              borderLeft: `2.5px solid ${isDone ? T.t4 : h.color}`,
            }}>
              <Mono style={{ fontSize: 10.5, color: isDone ? T.t4 : T.t2 }}>{s.time}</Mono>

              <div style={{ minWidth: 0, paddingRight: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  {s.status === "live" && <Dot color={T.emerald} pulse />}
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: isDone ? T.t2 : T.t1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{s.name}</span>
                  <Pill color={statColor[s.status]}
                    bg={`${statColor[s.status]}0d`}
                    border={`${statColor[s.status]}22`}>
                    {statLabel[s.status]}
                  </Pill>
                </div>
                {s.coach && (
                  <div style={{ fontSize: 10, color: T.t3 }}>{s.coach} · {s.duration}</div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "80%", height: 3, background: T.border,
                  borderRadius: 99, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: isDone ? T.t4 : h.color,
                    borderRadius: 99, transition: "width .5s",
                  }} />
                </div>
                <Mono style={{ fontSize: 9, color: T.t3 }}>{s.booked}/{s.cap}</Mono>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <Pill color={h.color} bg={h.dim} border={h.bdr}>{h.label}</Pill>
              </div>

              <div style={{
                display: "flex", justifyContent: "center", color: T.t4,
                transition: "transform .2s",
                transform: isE ? "rotate(90deg)" : "none",
              }}>
                {I.chevR(11)}
              </div>
            </div>

            {isE && (
              <div className="t-slideup" style={{
                padding: "12px 20px 14px",
                borderBottom: `1px solid ${T.border}`,
                background: "rgba(255,255,255,.012)",
              }}>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  {[
                    { label: "Message Attendees", color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr,  icon: I.msg(10),   msg: `Messaging ${s.booked} attendees` },
                    ...(!isDone && h.label !== "Full" ? [
                      { label: "Promote Class",   color: T.amber,   dim: T.amberDim,   bdr: T.amberBdr,   icon: I.speak(10), msg: `Promoting ${s.name}` },
                    ] : []),
                    { label: "Check-in Scanner",  color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr, icon: I.qr(10),    msg: "QR scanner ready" },
                  ].map((a, j) => (
                    <button key={j} className="tct-btn" onClick={() => toast(a.msg, a.color)} style={{
                      fontSize: 11, fontWeight: 700, color: a.color,
                      background: a.dim, border: `1px solid ${a.bdr}`,
                      borderRadius: 8, padding: "7px 13px",
                    }}>
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
                {s.notes && (
                  <div style={{
                    marginTop: 10, fontSize: 11, color: T.t3,
                    fontStyle: "italic", lineHeight: 1.55,
                  }}>{s.notes}</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer totals */}
      <div style={{
        padding: "10px 18px", display: "flex", gap: 24,
        borderTop: `1px solid ${T.border}`,
        background: "rgba(255,255,255,.01)",
      }}>
        {[
          { l: "Booked",   v: sessions.reduce((a, s) => a + s.booked, 0) },
          { l: "Capacity", v: sessions.reduce((a, s) => a + s.cap, 0) },
          { l: "Done",     v: `${sessions.filter(s => s.status === "done").length}/${sessions.length}` },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
            <Mono style={{ fontSize: 16, color: T.t1 }}>{s.v}</Mono>
            <SectionLabel>{s.l}</SectionLabel>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION: ACTIVITY FEED ────────────────────────────────────────────────────
function ActivityFeed({ toast }) {
  return (
    <div className="tct-card t-fadeup t-d4">
      <CardHead label="Recent Activity" sub="Today's events" />
      <div className="tct-scr" style={{ maxHeight: 290, overflowY: "auto" }}>
        {MOCK_ACTIVITY.map((ev, i) => (
          <div key={i} className="tct-row" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 16px",
            borderBottom: i < MOCK_ACTIVITY.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar name={ev.name} size={28} color={ev.tcolor} />
              <div style={{
                position: "absolute", bottom: -1, right: -1,
                width: 8, height: 8, borderRadius: "50%",
                background: ev.tcolor, border: `1.5px solid ${T.bg}`,
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{ev.name}</span>
              <span style={{ fontSize: 11, color: T.t3 }}> · {ev.detail}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {ev.action && (
                <button className="tct-btn" onClick={() => toast(`${ev.action}: ${ev.name}`, ev.tcolor)} style={{
                  fontSize: 10, fontWeight: 700, color: ev.tcolor,
                  background: `${ev.tcolor}0d`, border: `1px solid ${ev.tcolor}22`,
                  borderRadius: 6, padding: "4px 9px",
                }}>
                  {ev.action}
                </button>
              )}
              <Mono style={{ fontSize: 9.5, color: T.t4 }}>{ev.time}</Mono>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTION: WEEKLY PERFORMANCE ──────────────────────────────────────────────
function WeeklyPerformance({ checkIns, sessions, allMemberships, now }) {
  const thisStart = new Date(now); thisStart.setDate(thisStart.getDate() - 7);
  const lastStart = new Date(now); lastStart.setDate(lastStart.getDate() - 14);

  const ciThis = checkIns.filter(c => new Date(c.check_in_date) >= thisStart).length;
  const ciLast = checkIns.filter(c => {
    const d = new Date(c.check_in_date); return d >= lastStart && d < thisStart;
  }).length;
  const ciChange = ciLast > 0 ? Math.round(((ciThis - ciLast) / ciLast) * 100) : null;

  const fillRate = (() => {
    const ss = sessions.filter(s => s.cap > 0);
    return ss.length ? Math.round(ss.reduce((a, s) => a + s.booked / s.cap, 0) / ss.length * 100) : 0;
  })();

  const atRisk = allMemberships.filter(m => {
    const last = checkIns.filter(c => c.user_id === m.user_id)
      .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
    return !last || diffDays(now, new Date(last.check_in_date)) >= 14;
  }).length;

  const rows = [
    { l: "Attendance",  v: ciThis,        change: ciChange, up: (ciChange ?? 0) >= 0, sub: "check-ins this week",   vc: null },
    { l: "Fill Rate",   v: `${fillRate}%`, change: null,    up: fillRate >= 60,        sub: `${sessions.reduce((a,s)=>a+s.booked,0)}/${sessions.reduce((a,s)=>a+s.cap,0)} spots`, vc: null },
    { l: "At Risk",     v: atRisk,         change: null,    up: atRisk === 0,           sub: "inactive 14+ days",   vc: atRisk > 0 ? T.red : T.emerald },
    { l: "Revenue MTD", v: "£8,240",       change: 8,       up: true,                   sub: "vs £7,630 last month", vc: T.emerald },
  ];

  return (
    <div className="tct-card t-fadeup" style={{ marginBottom: 12 }}>
      <CardHead label="Weekly Performance" />
      {rows.map((m, i) => (
        <div key={i} style={{
          padding: "13px 16px",
          borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div>
            <SectionLabel style={{ marginBottom: 6 }}>{m.l}</SectionLabel>
            <Mono style={{ fontSize: 24, color: m.vc || T.t1, lineHeight: 1, display: "block" }}>{m.v}</Mono>
            <div style={{ fontSize: 10, color: T.t3, marginTop: 3 }}>{m.sub}</div>
          </div>
          {m.change !== null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
              borderRadius: 7, background: m.up ? T.emeraldDim : T.redDim,
              border: `1px solid ${m.up ? T.emeraldBdr : T.redBdr}`,
            }}>
              <span style={{ color: m.up ? T.emerald : T.red }}>
                {m.up ? I.up(10) : I.down(10)}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: m.up ? T.emerald : T.red }}>
                {Math.abs(m.change)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SECTION: CLIENT RISK FEED ────────────────────────────────────────────────
function ClientRiskFeed({ allMemberships, checkIns, now, toast }) {
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const clients = useMemo(() => allMemberships.map(m => {
    const mCI = checkIns.filter(c => c.user_id === m.user_id)
      .sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
    const last = mCI[0];
    const days = last ? diffDays(now, new Date(last.check_in_date)) : 999;
    const ci30 = mCI.filter(c => diffDays(now, new Date(c.check_in_date)) <= 30).length;
    let level, reason;
    if (days === 999)     { level = "critical"; reason = "Never checked in"; }
    else if (days >= 21)  { level = "critical"; reason = `${days} days inactive`; }
    else if (days >= 14)  { level = "high";     reason = `${days} days inactive`; }
    else if (days >= 7)   { level = "med";      reason = `${days} days since last visit`; }
    else return null;
    return { id: m.user_id, name: m.user_name, days, ci30, level, reason };
  }).filter(Boolean).sort((a, b) => b.days - a.days), [allMemberships, checkIns, now]);

  const lvlC = { critical: T.red, high: T.amber, med: T.indigo };
  const cnt = {
    all: clients.length,
    critical: clients.filter(c => c.level === "critical").length,
    high: clients.filter(c => c.level === "high").length,
    med: clients.filter(c => c.level === "med").length,
  };
  const filtered = filter === "all" ? clients : clients.filter(c => c.level === filter);
  const shown = showAll ? filtered : filtered.slice(0, 4);

  if (!clients.length) return (
    <div className="tct-card t-fadeup t-d1">
      <CardHead label="Client Risk Feed" />
      <div style={{ padding: "24px 16px", textAlign: "center" }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", margin: "0 auto 10px",
          background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`,
          display: "flex", alignItems: "center", justifyContent: "center", color: T.emerald,
        }}>
          {I.check(14)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 3 }}>All clients active</div>
        <div style={{ fontSize: 10, color: T.t3 }}>No one inactive for 7+ days</div>
      </div>
    </div>
  );

  return (
    <div className="tct-card t-fadeup t-d1" style={{ borderTop: `2px solid ${T.red}` }}>
      <CardHead
        label="Client Risk Feed"
        sub={`${clients.length} client${clients.length > 1 ? "s" : ""} need attention`}
        right={
          <Pill color={T.red} bg={T.redDim} border={T.redBdr}>
            {cnt.critical} critical
          </Pill>
        }
      />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 2, padding: "8px 12px", borderBottom: `1px solid ${T.border}` }}>
        {[
          { k: "all",      l: `All (${cnt.all})` },
          { k: "critical", l: `Critical (${cnt.critical})` },
          { k: "high",     l: `High (${cnt.high})` },
          { k: "med",      l: `Med (${cnt.med})` },
        ].map(f => (
          <button key={f.k} className="tct-tab" onClick={() => setFilter(f.k)} style={{
            fontSize: 11, fontWeight: filter === f.k ? 700 : 500,
            color: filter === f.k ? T.t1 : T.t3,
            background: filter === f.k ? "rgba(255,255,255,.07)" : "transparent",
            borderRadius: 7, padding: "5px 10px",
          }}>{f.l}</button>
        ))}
      </div>

      {shown.map((c, i) => (
        <div key={c.id} style={{
          borderBottom: i < shown.length - 1 ? `1px solid ${T.border}` : "none",
          borderLeft: `2.5px solid ${lvlC[c.level]}`,
          padding: "10px 14px",
          display: "flex", alignItems: "flex-start", gap: 9,
        }}>
          <Avatar name={c.name} size={30} color={lvlC[c.level]} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: T.t1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2,
            }}>{c.name}</div>
            <div style={{ fontSize: 10.5, color: lvlC[c.level], lineHeight: 1.4 }}>{c.reason}</div>
            <div style={{ fontSize: 9.5, color: T.t4, marginTop: 2 }}>
              {c.ci30} visit{c.ci30 !== 1 ? "s" : ""} in 30 days
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button className="tct-btn" onClick={() => toast(`Messaging ${c.name}`, T.amber)} style={{
              fontSize: 10, fontWeight: 700, color: T.amber,
              background: T.amberDim, border: `1px solid ${T.amberBdr}`,
              borderRadius: 6, padding: "5px 8px",
            }}>{I.msg(10)} Msg</button>
            <button className="tct-btn" onClick={() => toast(`Booking for ${c.name}`, T.indigo)} style={{
              fontSize: 10, fontWeight: 700, color: T.indigo,
              background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
              borderRadius: 6, padding: "5px 8px",
            }}>{I.cal(10)} Book</button>
          </div>
        </div>
      ))}

      {filtered.length > 4 && (
        <div style={{ padding: "9px 16px", borderTop: `1px solid ${T.border}` }}>
          <button className="tct-btn" onClick={() => setShowAll(p => !p)} style={{
            fontSize: 11, fontWeight: 700, color: T.indigo,
            background: "transparent", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            {showAll ? "Show less" : `Show ${filtered.length - 4} more at-risk clients`}
            <span style={{ transition: "transform .2s", transform: showAll ? "rotate(180deg)" : "none", display: "flex" }}>
              {I.chevD(10)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
function TabCoachToday({ allMemberships, checkIns, myClasses, currentUser, now }) {
  const { toasts, toast } = useToast();
  const sessions   = useMemo(() => deriveSessions(myClasses, now), [myClasses, now]);
  const priorities = useMemo(() => derivePriorities({ allMemberships, checkIns, sessions, now }), [allMemberships, checkIns, sessions, now]);

  return (
    <div className="tct tct-scr" style={{
      background: T.bg, minHeight: "100vh",
      padding: "24px 24px 60px",
      overflowX: "hidden", position: "relative",
    }}>
      <ToastStack toasts={toasts} />
      <CommandHeader currentUser={currentUser} now={now} sessions={sessions} priorities={priorities} />
      <TodaysPriorities priorities={priorities} toast={toast} />
      <QuickStrip toast={toast} />

      <div className="tct-main-grid" style={{
        display: "grid", gridTemplateColumns: "1fr 300px",
        gap: 14, alignItems: "start",
      }}>
        <div>
          <AttendanceChart checkIns={checkIns} now={now} />
          <TodaysSessions sessions={sessions} toast={toast} />
          <ActivityFeed toast={toast} />
        </div>
        <div className="tct-sidebar" style={{
          display: "flex", flexDirection: "column", gap: 12, position: "sticky", top: 0,
        }}>
          <WeeklyPerformance checkIns={checkIns} sessions={sessions} allMemberships={allMemberships} now={now} />
          <ClientRiskFeed allMemberships={allMemberships} checkIns={checkIns} now={now} toast={toast} />
        </div>
      </div>
    </div>
  );
}

// ─── ROOT EXPORT ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <TabCoachToday
      allMemberships={MEMBERS}
      checkIns={CHECKINS}
      myClasses={CLASSES}
      currentUser={CURRENT_USER}
      now={NOW_MOCK}
    />
  );
}
