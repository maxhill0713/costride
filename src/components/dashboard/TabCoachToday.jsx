import { useState, useMemo, useEffect, useRef } from "react";

// ─── UTILITY ──────────────────────────────────────────────────────────────────
const diffDays = (a, b) => Math.floor((a - b) / 86400000);
const lerp = (a, b, t) => a + (b - a) * t;

// ─── DESIGN TOKENS — Refined dark luxury ──────────────────────────────────────
const T = {
  // Surfaces — deeper blacks with blue undertone
  bg:        '#050810',
  bgSub:     '#080c16',
  surface:   '#0a0f1e',
  surfaceUp: '#0d1225',
  card:      '#0b1020',
  cardHover: '#0d1328',
  glass:     'rgba(12,17,35,.72)',
  glassBdr:  'rgba(255,255,255,.04)',

  // Borders — ultra subtle
  border:    'rgba(255,255,255,.04)',
  borderH:   'rgba(255,255,255,.07)',
  borderA:   'rgba(255,255,255,.10)',
  borderF:   'rgba(255,255,255,.14)',

  // Typography
  t1: '#eef2ff',
  t2: '#8b95b3',
  t3: '#4b5578',
  t4: '#252d45',
  t5: '#181e32',

  // Accents — richer, more saturated
  emerald:    '#34d399',
  emeraldMid: '#10b981',
  emeraldDim: 'rgba(52,211,153,.06)',
  emeraldBdr: 'rgba(52,211,153,.14)',
  emeraldGlo: 'rgba(52,211,153,.20)',

  indigo:    '#818cf8',
  indigoMid: '#6366f1',
  indigoDim: 'rgba(129,140,248,.06)',
  indigoBdr: 'rgba(129,140,248,.14)',
  indigoGlo: 'rgba(129,140,248,.20)',

  amber:     '#fbbf24',
  amberMid:  '#f59e0b',
  amberDim:  'rgba(251,191,36,.05)',
  amberBdr:  'rgba(251,191,36,.12)',
  amberGlo:  'rgba(251,191,36,.18)',

  red:       '#f87171',
  redMid:    '#ef4444',
  redDim:    'rgba(248,113,113,.05)',
  redBdr:    'rgba(248,113,113,.12)',
  redGlo:    'rgba(248,113,113,.18)',

  sky:       '#38bdf8',
  skyDim:    'rgba(56,189,248,.06)',
  skyBdr:    'rgba(56,189,248,.14)',

  violet:    '#a78bfa',
  violetDim: 'rgba(167,139,250,.06)',
  violetBdr: 'rgba(167,139,250,.14)',

  // Fonts
  display: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  body:    "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono:    "'IBM Plex Mono', 'SF Mono', monospace",

  // Radii
  r1: 8,
  r2: 12,
  r3: 16,
  r4: 20,

  // Shadows
  shadowSm: '0 1px 2px rgba(0,0,0,.3), 0 1px 3px rgba(0,0,0,.15)',
  shadowMd: '0 4px 12px rgba(0,0,0,.25), 0 1px 4px rgba(0,0,0,.2)',
  shadowLg: '0 8px 32px rgba(0,0,0,.35), 0 2px 8px rgba(0,0,0,.2)',
  shadowGlow: (c, a = .12) => `0 0 20px rgba(${c},${a}), 0 0 60px rgba(${c},${a * .5})`,
};

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("tct-css")) {
  const s = document.createElement("style");
  s.id = "tct-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    .tct {
      font-family: ${T.display};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    @keyframes tctFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes tctFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes tctSlideIn {
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes tctSlideDown {
      from { opacity: 0; transform: translateY(-8px); max-height: 0; }
      to   { opacity: 1; transform: translateY(0); max-height: 500px; }
    }
    @keyframes tctPulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: .35; }
    }
    @keyframes tctGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
      50%      { box-shadow: 0 0 0 6px rgba(248,113,113,.06); }
    }
    @keyframes tctShimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes tctBreath {
      0%, 100% { opacity: .5; }
      50%      { opacity: 1; }
    }
    @keyframes tctOrb {
      0%, 100% { transform: translate(0,0) scale(1); }
      33%      { transform: translate(15px,-10px) scale(1.05); }
      66%      { transform: translate(-10px,8px) scale(.97); }
    }

    .t-fu  { animation: tctFadeUp .5s cubic-bezier(.16,1,.3,1) both; }
    .t-fi  { animation: tctFadeIn .4s ease both; }
    .t-si  { animation: tctSlideIn .35s cubic-bezier(.16,1,.3,1) both; }
    .t-sd  { animation: tctSlideDown .3s cubic-bezier(.16,1,.3,1) both; }

    .t-d1{animation-delay:.06s} .t-d2{animation-delay:.12s} .t-d3{animation-delay:.18s}
    .t-d4{animation-delay:.24s} .t-d5{animation-delay:.30s} .t-d6{animation-delay:.36s}
    .t-d7{animation-delay:.42s} .t-d8{animation-delay:.48s}

    .tct-btn {
      font-family: ${T.display};
      cursor: pointer; outline: none;
      transition: all .2s cubic-bezier(.16,1,.3,1);
      border: none;
      display: inline-flex; align-items: center; gap: 6px;
      position: relative; overflow: hidden;
    }
    .tct-btn:hover { transform: translateY(-1px); }
    .tct-btn:active { transform: translateY(0) scale(.98); }
    .tct-btn::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.06) 0%, transparent 50%);
      opacity: 0; transition: opacity .2s;
    }
    .tct-btn:hover::after { opacity: 1; }

    .tct-card {
      background: ${T.surface};
      border: 1px solid ${T.border};
      border-radius: ${T.r3}px;
      overflow: hidden;
      transition: border-color .2s, box-shadow .3s;
      position: relative;
    }
    .tct-card::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,.015) 0%, transparent 40%);
      pointer-events: none; border-radius: inherit;
    }
    .tct-card:hover {
      border-color: ${T.borderH};
      box-shadow: 0 4px 24px rgba(0,0,0,.15);
    }

    .tct-row {
      transition: background .15s;
      cursor: pointer;
      position: relative;
    }
    .tct-row:hover {
      background: rgba(255,255,255,.02) !important;
    }
    .tct-row::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: 0;
      height: 1px; background: ${T.border};
    }
    .tct-row:last-child::after { display: none; }

    .tct-scr::-webkit-scrollbar { width: 3px; }
    .tct-scr::-webkit-scrollbar-track { background: transparent; }
    .tct-scr::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 3px; }
    .tct-scr::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.1); }

    .tct-tab {
      font-family: ${T.display};
      cursor: pointer; outline: none;
      transition: all .2s;
      border: none;
    }

    .tct-pri-col {
      transition: background .15s, border-color .15s;
      position: relative;
    }
    .tct-pri-col:hover {
      background: rgba(255,255,255,.012) !important;
    }

    .tct-stat:hover {
      border-color: ${T.borderH} !important;
      transform: translateY(-1px);
      box-shadow: ${T.shadowMd};
    }

    .tct-chart-dot {
      transition: r .15s ease;
    }
    .tct-chart-dot:hover {
      r: 5;
    }

    .tct-shimmer {
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.03) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: tctShimmer 3s ease infinite;
    }

    @media (max-width: 1200px) {
      .tct-main-grid { grid-template-columns: 1fr !important; }
      .tct-sidebar   { position: static !important; }
    }
    @media (max-width: 768px) {
      .tct-stat-row  { grid-template-columns: 1fr 1fr !important; }
      .tct-pri-grid  { grid-template-columns: 1fr !important; }
      .tct-root-pad  { padding: 16px 14px 60px !important; }
    }
    @media (max-width: 480px) {
      .tct-stat-row  { grid-template-columns: 1fr !important; }
      .tct-quick-strip { flex-direction: column !important; }
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
  { user_id: "u1",  user_name: "Sophie Allen",  membership: "Premium" },
  { user_id: "u2",  user_name: "James Park",    membership: "Standard" },
  { user_id: "u3",  user_name: "Rachel Kim",    membership: "Premium" },
  { user_id: "u4",  user_name: "Michael Chen",  membership: "Standard" },
  { user_id: "u5",  user_name: "Ella Torres",   membership: "Premium" },
  { user_id: "u6",  user_name: "David Lowe",    membership: "Standard" },
  { user_id: "u7",  user_name: "Maria Santos",  membership: "Premium" },
  { user_id: "u8",  user_name: "Tom Bradley",   membership: "Standard" },
  { user_id: "u9",  user_name: "Lisa Chen",     membership: "Premium" },
  { user_id: "u10", user_name: "Alex Kumar",    membership: "Standard" },
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
  { type:"checkin", name:"David Lowe",   detail:"Checked in to Morning Strength",        time:"2m ago",    tcolor: T.emerald, icon: "check" },
  { type:"missed",  name:"Rachel Kim",   detail:"Missed Yoga Flow — no cancellation",    time:"14m ago",   tcolor: T.red,     icon: "x",     action:"Follow up" },
  { type:"sent",    name:"You",          detail:"Sent renewal message to Tom Bradley",   time:"47m ago",   tcolor: T.indigo,  icon: "send" },
  { type:"booking", name:"Maria Santos", detail:"Booked Evening HIIT at 6 pm",           time:"1h ago",    tcolor: T.emerald, icon: "plus" },
  { type:"booking", name:"3 members",    detail:"Booked Spin Class — now 14/18",         time:"2h ago",    tcolor: T.emerald, icon: "plus" },
  { type:"cancel",  name:"Michael Chen", detail:"Cancelled Thursday — 2nd this week",    time:"3h ago",    tcolor: T.amber,   icon: "warn",  action:"Check in" },
  { type:"new",     name:"Emma Wilson",  detail:"Started a 7-day trial",                 time:"Yesterday", tcolor: T.sky,     icon: "star" },
];


// ─── ICON SYSTEM ──────────────────────────────────────────────────────────────
const Icon = ({ name, size = 14, color = "currentColor", strokeWidth = 1.8 }) => {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  const icons = {
    arrow:    <svg {...p}><line x1={5} y1={12} x2={19} y2={12}/><polyline points="12 5 19 12 12 19"/></svg>,
    warn:     <svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
    info:     <svg {...p}><circle cx={12} cy={12} r={10}/><line x1={12} y1={16} x2={12} y2={12}/><line x1={12} y1={8} x2={12.01} y2={8}/></svg>,
    check:    <svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    up:       <svg {...p}><polyline points="18 15 12 9 6 15"/></svg>,
    down:     <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>,
    msg:      <svg {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    cal:      <svg {...p}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>,
    qr:       <svg {...p}><rect x={3} y={3} width={7} height={7} rx={1}/><rect x={14} y={3} width={7} height={7} rx={1}/><rect x={14} y={14} width={7} height={7} rx={1}/><rect x={3} y={14} width={4} height={4} rx={1}/></svg>,
    plus:     <svg {...p}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>,
    users:    <svg {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    chevR:    <svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    chevD:    <svg {...p}><polyline points="6 9 12 15 18 9"/></svg>,
    speaker:  <svg {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>,
    x:        <svg {...p}><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>,
    send:     <svg {...p}><line x1={22} y1={2} x2={11} y2={13}/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    star:     <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    zap:      <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    trend:    <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    shield:   <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    clock:    <svg {...p}><circle cx={12} cy={12} r={10}/><polyline points="12 6 12 12 16 14"/></svg>,
    target:   <svg {...p}><circle cx={12} cy={12} r={10}/><circle cx={12} cy={12} r={6}/><circle cx={12} cy={12} r={2}/></svg>,
    activity: <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  };
  return icons[name] || null;
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Avatar({ name, size = 32, color, ring }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const c = color || T.indigo;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * .32, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${c}18 0%, ${c}08 100%)`,
      border: `1px solid ${c}25`,
      boxShadow: ring ? `0 0 0 2px ${T.bg}, 0 0 0 3.5px ${c}40` : 'none',
      fontSize: size * .31, fontWeight: 700, color: c,
      letterSpacing: '-.02em', userSelect: "none",
    }}>{initials}</div>
  );
}

function Pill({ children, color = T.t3, bg, border, glow, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 600, color,
      background: bg || `${color}0a`,
      border: `1px solid ${border || `${color}18`}`,
      borderRadius: 6, padding: "2.5px 8px",
      letterSpacing: ".03em", textTransform: "uppercase",
      whiteSpace: "nowrap", lineHeight: "16px",
      boxShadow: glow ? `0 0 12px ${color}15` : 'none',
      ...style,
    }}>{children}</span>
  );
}

function Mono({ children, style }) {
  return (
    <span style={{ fontFamily: T.mono, fontWeight: 500, letterSpacing: "-.03em", ...style }}>
      {children}
    </span>
  );
}

function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: T.t3,
      textTransform: "uppercase", letterSpacing: ".08em",
      lineHeight: 1, ...style,
    }}>{children}</div>
  );
}

function Dot({ color, pulse, size = 6 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0,
      boxShadow: `0 0 8px ${color}40`,
      animation: pulse ? "tctPulse 2s ease-in-out infinite" : "none",
    }} />
  );
}

function CardHead({ label, sub, right, noBorder }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "16px 20px",
      ...(noBorder ? {} : { borderBottom: `1px solid ${T.border}` }),
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: T.t1,
          letterSpacing: "-.02em", lineHeight: 1,
        }}>{label}</div>
        {sub && <div style={{ fontSize: 10.5, color: T.t3, marginTop: 5, lineHeight: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function GlowBar({ color, position = "top" }) {
  const style = position === "top"
    ? { top: 0, left: 0, right: 0, height: 1 }
    : { top: 0, bottom: 0, left: 0, width: 2 };
  return (
    <div style={{
      position: 'absolute', ...style,
      background: `linear-gradient(${position === "top" ? '90deg' : '180deg'}, transparent 0%, ${color} 50%, transparent 100%)`,
      opacity: .6,
    }} />
  );
}

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (msg, color = T.indigo) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, color }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  };
  return { toasts, toast };
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 200,
      display: "flex", flexDirection: "column-reverse", gap: 8,
      pointerEvents: "none", maxWidth: 320,
    }}>
      {toasts.map(t => (
        <div key={t.id} className="t-si" style={{
          background: T.card, 
          border: `1px solid ${T.borderA}`,
          borderRadius: T.r2,
          padding: "12px 18px", 
          fontSize: 12.5, 
          fontWeight: 500,
          color: T.t1,
          boxShadow: T.shadowLg,
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(16px)',
        }}>
          <div style={{
            width: 4, height: 4, borderRadius: '50%', background: t.color, flexShrink: 0,
            boxShadow: `0 0 8px ${t.color}60`,
          }}/>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── DERIVE HELPERS ───────────────────────────────────────────────────────────
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
      title: `${count} client${count > 1 ? "s" : ""} inactive 7+ days`,
      context: `${names}${count > 2 ? ` + ${count - 2} more` : ""} — each extra day lowers re-engagement by ~4 %. Act now.`,
      cta: "Send Re-engagement", icon: "msg", color: T.red, colorDim: T.redDim, colorBrd: T.redBdr, colorGlo: T.redGlo,
    });
  }
  const trialNames = ["Emma Wilson", "Josh Lee", "Priya Nair", "Sam Parker"];
  out.push({
    id: "trials", rank: 2, severity: "med",
    title: `${trialNames.length} trials expiring this week`,
    context: `68 % convert when contacted before day 4. Today is day 4 for ${trialNames[0]}. Send the upsell sequence.`,
    cta: "Start Upsell", icon: "zap", color: T.amber, colorDim: T.amberDim, colorBrd: T.amberBdr, colorGlo: T.amberGlo,
  });
  const under = sessions.filter(s => s.status !== "done" && s.cap > 0 && s.booked / s.cap < 0.4);
  if (under.length > 0) {
    const s = under[0];
    out.push({
      id: "underbooked", rank: 3, severity: "med",
      title: `"${s.name}" at ${Math.round(s.booked / s.cap * 100)} % — ${s.cap - s.booked} spots`,
      context: `${s.booked}/${s.cap} booked. Last month averaged ${s.cap - 2}. Push now to fill before ${s.time}.`,
      cta: "Promote Class", icon: "speaker", color: T.indigo, colorDim: T.indigoDim, colorBrd: T.indigoBdr, colorGlo: T.indigoGlo,
    });
  }
  return out.slice(0, 3);
}

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(99,102,241,.04) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)',
        animation: 'tctOrb 20s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', bottom: '10%', left: '-8%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(52,211,153,.03) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)',
        animation: 'tctOrb 25s ease-in-out infinite reverse',
      }}/>
      <div style={{
        position: 'absolute', top: '40%', left: '50%', width: 600, height: 600,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(248,113,113,.015) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(80px)',
      }}/>
      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
        opacity: .3,
        maskImage: 'radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 100%)',
      }}/>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
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
    <div className="t-fu" style={{
      paddingBottom: 28, marginBottom: 28,
      borderBottom: `1px solid ${T.border}`,
      position: 'relative',
    }}>
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 20, flexWrap: "wrap",
      }}>
        <div>
          <div style={{
            fontFamily: T.mono, fontSize: 11, color: T.t3,
            marginBottom: 12, letterSpacing: ".04em", fontWeight: 500,
          }}>{dateStr}</div>
          <h1 style={{
            fontSize: 34, fontWeight: 800, color: T.t1,
            letterSpacing: "-.05em", lineHeight: 1, marginBottom: 0,
          }}>
            {greeting}, {firstName}
          </h1>
          <p style={{
            marginTop: 12, fontSize: 14, color: T.t2, lineHeight: 1.6,
            maxWidth: 500, fontWeight: 400,
          }}>
            {urgent > 0
              ? <><span style={{ color: T.red, fontWeight: 600 }}>{urgent} urgent item{urgent > 1 ? "s" : ""}</span>{" "}need attention before your next session.</>
              : "All systems healthy. Review sessions and client activity below."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
          {live ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 18px", 
              background: `linear-gradient(135deg, ${T.emeraldDim} 0%, transparent 100%)`,
              border: `1px solid ${T.emeraldBdr}`, borderRadius: T.r2,
              boxShadow: `0 0 24px ${T.emerald}08`,
            }}>
              <Dot color={T.emerald} pulse />
              <span style={{ fontSize: 12, fontWeight: 700, color: T.emerald }}>{live.name}</span>
              <span style={{
                fontFamily: T.mono, fontSize: 11, fontWeight: 500,
                color: T.emerald, opacity: .7,
              }}>{live.booked}/{live.cap}</span>
            </div>
          ) : next ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "10px 16px", background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: T.r2,
            }}>
              <Dot color={T.indigo} size={5} />
              <span style={{ fontSize: 12, color: T.t2, fontWeight: 400 }}>
                Next up <strong style={{ color: T.t1, fontWeight: 600 }}>{next.name}</strong> at {next.time}
              </span>
            </div>
          ) : null}

          <div className="tct-stat-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "urgent",   v: urgent,        color: T.red,     dim: T.redDim,     bdr: T.redBdr },
              { label: "avg fill", v: `${avgFill}%`, color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr },
              { label: "mtd",      v: "£8,240",      color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr },
            ].map((p, i) => (
              <div key={i} className="tct-stat" style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px",
                background: `linear-gradient(135deg, ${p.dim} 0%, transparent 100%)`,
                border: `1px solid ${p.bdr}`,
                borderRadius: T.r1,
                transition: 'all .2s',
                cursor: 'default',
              }}>
                <Mono style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.v}</Mono>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: p.color, opacity: .55,
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

// ─── PRIORITIES ───────────────────────────────────────────────────────────────
function TodaysPriorities({ priorities, toast }) {
  const urgent = priorities.filter(p => p.severity === "high").length;

  const sevIcon = (sev, color) => (
    <div style={{
      width: 32, height: 32, borderRadius: T.r1, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}14 0%, ${color}06 100%)`,
      border: `1px solid ${color}22`,
      display: "flex", alignItems: "center", justifyContent: "center", color,
    }}>
      <Icon name={sev === "high" ? "warn" : sev === "med" ? "info" : "check"} size={14} color={color} />
    </div>
  );

  return (
    <div className="tct-card t-fu t-d1" style={{
      marginBottom: 16,
      ...(urgent > 0 ? { borderTop: `1px solid ${T.redBdr}` } : {}),
    }}>
      {urgent > 0 && <GlowBar color={T.red} />}
      <CardHead
        label="Today's Priorities"
        sub={urgent > 0 ? `${urgent} urgent — act before sessions begin` : "Everything on track"}
        right={
          <Pill color={urgent > 0 ? T.red : T.emerald}
            bg={urgent > 0 ? T.redDim : T.emeraldDim}
            border={urgent > 0 ? T.redBdr : T.emeraldBdr}
            glow={urgent > 0}>
            {urgent > 0 ? `${urgent} urgent` : "All clear"}
          </Pill>
        }
      />

      <div className="tct-pri-grid" style={{
        display: "grid",
        gridTemplateColumns: priorities.map(() => "1fr").join(" "),
      }}>
        {priorities.map((p, i) => (
          <div key={p.id} className="tct-pri-col" style={{
            padding: "18px 20px 20px",
            borderRight: i < priorities.length - 1 ? `1px solid ${T.border}` : "none",
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              {sevIcon(p.severity, p.color)}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: T.t1,
                  lineHeight: 1.4, letterSpacing: "-.015em",
                }}>{p.title}</div>
              </div>
            </div>
            <div style={{
              fontSize: 11.5, color: T.t3, lineHeight: 1.65,
              paddingLeft: 44,
            }}>{p.context}</div>
            <div style={{ paddingLeft: 44, marginTop: 2 }}>
              <button className="tct-btn" onClick={() => toast(`Started: ${p.cta}`, p.color)} style={{
                fontSize: 11.5, fontWeight: 600, color: p.color,
                background: `linear-gradient(135deg, ${p.colorDim} 0%, transparent 100%)`,
                border: `1px solid ${p.colorBrd}`,
                borderRadius: T.r1, padding: "8px 16px",
              }}>
                <Icon name={p.icon} size={12} color={p.color} /> {p.cta}
                <Icon name="arrow" size={11} color={p.color} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
function QuickStrip({ toast }) {
  const items = [
    { label: "Scan Check-in",     color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr, icon: "qr",    msg: "QR scanner opened" },
    { label: "Broadcast",         color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr,  icon: "msg",   msg: "Broadcast composer opened" },
    { label: "Schedule Session",  color: T.sky,     dim: T.skyDim,     bdr: T.skyBdr,     icon: "cal",   msg: "Session scheduler opened" },
    { label: "All Clients",       color: T.t2,      dim: "rgba(255,255,255,.03)", bdr: T.border, icon: "users", msg: "Clients view opening" },
  ];
  return (
    <div className="tct-quick-strip t-fu t-d2" style={{
      display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap",
    }}>
      {items.map((a, i) => (
        <button key={i} className="tct-btn" onClick={() => toast(a.msg, a.color)} style={{
          fontSize: 12, fontWeight: 600, color: a.color,
          background: `linear-gradient(135deg, ${a.dim} 0%, transparent 100%)`,
          border: `1px solid ${a.bdr}`,
          borderRadius: T.r1, padding: "10px 18px",
        }}>
          <Icon name={a.icon} size={13} color={a.color} />{a.label}
        </button>
      ))}
    </div>
  );
}

// ─── ATTENDANCE CHART ─────────────────────────────────────────────────────────
function AttendanceChart({ checkIns, now }) {
  const [tip, setTip] = useState(null);

  const data = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const t = new Date(now); t.setDate(t.getDate() - (13 - i));
    const count = checkIns.filter(c => {
      const d = new Date(c.check_in_date);
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    return {
      date: t,
      label: t.toLocaleDateString("en-GB", { weekday: "short" }),
      dayNum: t.getDate(),
      v: count, isToday: i === 13,
      isWeekend: t.getDay() === 0 || t.getDay() === 6,
    };
  }), [checkIns, now]);

  const maxV = Math.max(...data.map(d => d.v), 1);
  const W = 100, H = 68, PAD = { t: 6, b: 22, l: 2, r: 2 };
  const pW = W - PAD.l - PAD.r, pH = H - PAD.t - PAD.b;
  const pts = data.map((d, i) => ({
    ...d,
    x: PAD.l + (i / (data.length - 1)) * pW,
    y: PAD.t + pH - (d.v / maxV) * pH,
  }));

  // Smooth curve using cubic bezier
  const smoothPath = (points) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const pathD = smoothPath(pts);
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${PAD.t + pH} L ${pts[0].x} ${PAD.t + pH} Z`;

  const thisW = data.slice(7).reduce((a, b) => a + b.v, 0);
  const lastW = data.slice(0, 7).reduce((a, b) => a + b.v, 0);
  const trend = lastW > 0 ? Math.round(((thisW - lastW) / lastW) * 100) : 0;
  const tUp = trend >= 0;
  const bestDay = data.slice(7).reduce((a, b) => b.v > a.v ? b : a, { v: -1, label: "?" });
  const dailyAvg = (thisW / 7).toFixed(1);

  return (
    <div className="tct-card t-fu t-d3" style={{ marginBottom: 14 }}>
      <CardHead
        label="Attendance"
        sub="Last 14 days"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
              borderRadius: T.r1,
              background: tUp ? T.emeraldDim : T.redDim,
              border: `1px solid ${tUp ? T.emeraldBdr : T.redBdr}`,
            }}>
              <Icon name={tUp ? "up" : "down"} size={10} color={tUp ? T.emerald : T.red} />
              <Mono style={{ fontSize: 11, color: tUp ? T.emerald : T.red }}>
                {Math.abs(trend)}%
              </Mono>
              <span style={{ fontSize: 10, color: tUp ? T.emerald : T.red, opacity: .6 }}>vs last wk</span>
            </div>
          </div>
        }
      />

      <div style={{ padding: "16px 20px 6px" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 170, overflow: "visible" }}
          onMouseLeave={() => setTip(null)}>
          <defs>
            <linearGradient id="tct-ag2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={T.indigo} stopOpacity={.15} />
              <stop offset="50%"  stopColor={T.indigo} stopOpacity={.04} />
              <stop offset="100%" stopColor={T.indigo} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="tct-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={T.indigo} stopOpacity={.4} />
              <stop offset="30%"  stopColor={T.indigo} stopOpacity={.9} />
              <stop offset="100%" stopColor={T.indigo} stopOpacity={1} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Horizontal grid lines */}
          {[.25, .5, .75].map((v, i) => (
            <g key={i}>
              <line x1={PAD.l} y1={PAD.t + pH * (1 - v)} x2={W - PAD.r} y2={PAD.t + pH * (1 - v)}
                stroke="rgba(255,255,255,0.025)" strokeWidth={.3} />
              <text x={0} y={PAD.t + pH * (1 - v) + 1.5}
                fill={T.t4} fontSize={3.5} fontFamily="system-ui" textAnchor="start">
                {Math.round(maxV * v)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#tct-ag2)" />

          {/* Main line */}
          <path d={pathD} fill="none" stroke="url(#tct-line)" strokeWidth={1.6}
            strokeLinejoin="round" strokeLinecap="round" />

          {/* Glow line */}
          <path d={pathD} fill="none" stroke={T.indigo} strokeWidth={3}
            strokeLinejoin="round" strokeLinecap="round" opacity={.08} filter="url(#glow)" />

          {/* Today marker */}
          {(() => {
            const p = pts[pts.length - 1];
            return (
              <g>
                <line x1={p.x} y1={PAD.t} x2={p.x} y2={PAD.t + pH}
                  stroke={T.indigo} strokeWidth={.5} strokeDasharray="1.5 2" opacity={.2} />
                <circle cx={p.x} cy={p.y} r={4} fill={T.indigo} opacity={.12} />
                <circle cx={p.x} cy={p.y} r={2.5} fill={T.bg} stroke={T.indigo} strokeWidth={1.2} />
              </g>
            );
          })()}

          {/* Data dots */}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 0 : 1.2}
              fill={T.indigo} opacity={.35} />
          ))}

          {/* Interactive hit areas */}
          {pts.map((p, i) => (
            <rect key={`h${i}`} x={p.x - 3.5} y={PAD.t - 2} width={7} height={pH + 8}
              fill="transparent" style={{ cursor: "crosshair" }}
              onMouseEnter={() => setTip({ x: p.x, y: p.y, label: p.label, dayNum: p.dayNum, v: p.v, isToday: p.isToday })} />
          ))}

          {/* Tooltip */}
          {tip && (
            <g style={{ pointerEvents: "none" }}>
              <line x1={tip.x} y1={PAD.t} x2={tip.x} y2={PAD.t + pH}
                stroke={T.indigo} strokeWidth={.4} opacity={.3} />
              <circle cx={tip.x} cy={tip.y} r={3}
                fill={T.bg} stroke={T.indigo} strokeWidth={1.2} />
              <rect x={Math.min(tip.x - 14, W - 30)} y={Math.max(tip.y - 24, 0)}
                width={28} height={16} rx={3}
                fill={T.card} stroke={T.borderA} strokeWidth={.4} />
              <text x={Math.min(tip.x, W - 16)} y={Math.max(tip.y - 13, 13)}
                textAnchor="middle" fill={T.t1} fontSize={6.5}
                fontFamily="monospace" fontWeight={600}>{tip.v}</text>
            </g>
          )}

          {/* X-axis labels */}
          {pts.map((p, i) => (
            <text key={`l${i}`} x={p.x} y={H - 6} textAnchor="middle" fontSize={4}
              fill={p.isToday ? T.indigo : T.t4} fontFamily="system-ui"
              fontWeight={p.isToday ? 700 : 400}>
              {p.isToday ? "Today" : i % 2 === 0 ? `${p.label} ${p.dayNum}` : ""}
            </text>
          ))}
        </svg>
      </div>

      {/* Stats footer */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        borderTop: `1px solid ${T.border}`,
      }}>
        {[
          { l: "This week", v: thisW, s: "check-ins", c: T.t1 },
          { l: "Daily avg",  v: dailyAvg, s: "per day", c: T.t1 },
          { l: "Peak day",   v: Math.max(...data.slice(7).map(d => d.v)), s: bestDay.label, c: T.indigo },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "14px 18px",
            borderRight: i < 2 ? `1px solid ${T.border}` : "none",
          }}>
            <Label style={{ marginBottom: 8 }}>{s.l}</Label>
            <Mono style={{ fontSize: 24, color: s.c, lineHeight: 1, display: "block", fontWeight: 600 }}>{s.v}</Mono>
            <div style={{ fontSize: 10.5, color: T.t3, marginTop: 4 }}>{s.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SESSION HEALTH ───────────────────────────────────────────────────────────
function sHealth(booked, cap) {
  const r = cap > 0 ? booked / cap : 0;
  if (r >= .85) return { label: "Full",        color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr };
  if (r >= .55) return { label: "Healthy",     color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr };
  if (r >= .28) return { label: "Low",         color: T.amber,   dim: T.amberDim,   bdr: T.amberBdr };
  return              { label: "Critical",    color: T.red,     dim: T.redDim,     bdr: T.redBdr };
}

// ─── SESSION TIMELINE ─────────────────────────────────────────────────────────
function SessionTimeline({ sessions, now }) {
  const S = 6, E = 22, range = E - S;
  const toX = h => ((h - S) / range) * 100;
  const toW = m => (m / 60 / range) * 100;
  const stCol = { live: T.emerald, upcoming: T.indigo, done: T.t4 };
  const nd = now.getHours() + now.getMinutes() / 60;
  const nowX = toX(nd);

  return (
    <div style={{ padding: "14px 20px 24px", borderBottom: `1px solid ${T.border}` }}>
      <Label style={{ marginBottom: 12 }}>Timeline</Label>
      <div style={{ position: "relative", height: 32 }}>
        {/* Background track */}
        <div style={{
          position: "absolute", top: "50%", left: 0, right: 0,
          height: 2, background: `linear-gradient(90deg, ${T.border} 0%, ${T.t5} 50%, ${T.border} 100%)`,
          transform: "translateY(-50%)", borderRadius: 2,
        }} />

        {/* Now marker */}
        <div style={{
          position: "absolute", top: 0, bottom: 0, left: `${nowX}%`,
          width: 1, background: T.red, opacity: .4,
          transform: "translateX(-50%)",
        }}>
          <div style={{
            position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
            fontSize: 7, fontFamily: T.mono, color: T.red, fontWeight: 600,
            whiteSpace: 'nowrap', background: T.bg, padding: '0 3px',
          }}>NOW</div>
        </div>

        {/* Session blocks */}
        {sessions.filter(s => s.th !== null).map(s => {
          const c = stCol[s.status];
          const dur = parseInt(s.duration) || 60;
          return (
            <div key={s.id} style={{
              position: "absolute", top: 4, left: `${toX(s.th)}%`,
              width: `${toW(dur)}%`, height: 24,
              background: `linear-gradient(135deg, ${c}18 0%, ${c}08 100%)`,
              border: `1px solid ${c}30`,
              borderRadius: 6, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }} title={`${s.name} · ${s.time} · ${s.booked}/${s.cap}`}>
              {s.status === "live" && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                  background: c,
                }}/>
              )}
              <span style={{
                fontSize: 8.5, fontWeight: 600, color: c, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis", padding: "0 6px",
              }}>{s.time}</span>
            </div>
          );
        })}

        {/* Time markers */}
        {[6, 9, 12, 15, 18, 21].map(h => (
          <div key={h} style={{
            position: "absolute", bottom: -14, left: `${toX(h)}%`,
            transform: "translateX(-50%)",
          }}>
            <span style={{ fontFamily: T.mono, fontSize: 8, color: T.t4, fontWeight: 500 }}>
              {String(h).padStart(2, "0")}:00
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TODAY'S SESSIONS ─────────────────────────────────────────────────────────
function TodaysSessions({ sessions, toast, now }) {
  const [exp, setExp] = useState(null);
  const statLabel = { live: "Live", upcoming: "Upcoming", done: "Done" };
  const statColor = { live: T.emerald, upcoming: T.indigo, done: T.t3 };
  const avgFill = Math.round(
    sessions.reduce((a, s) => a + (s.cap > 0 ? s.booked / s.cap : 0), 0) /
    Math.max(1, sessions.length) * 100
  );

  return (
    <div className="tct-card t-fu t-d4" style={{ marginBottom: 14 }}>
      <CardHead
        label="Today's Sessions"
        sub={`${sessions.length} scheduled · ${avgFill}% avg fill`}
        right={
          <button className="tct-btn" onClick={() => toast("Session scheduler opened", T.indigo)} style={{
            fontSize: 11, fontWeight: 600, color: T.indigo,
            background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
            borderRadius: T.r1, padding: "7px 14px",
          }}>
            <Icon name="plus" size={11} color={T.indigo} /> Add
          </button>
        }
      />

      <SessionTimeline sessions={sessions} now={now} />

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "60px 1fr 100px 90px 36px",
        padding: "8px 20px", gap: 0,
        borderBottom: `1px solid ${T.border}`,
        background: 'rgba(255,255,255,.008)',
      }}>
        {["Time", "Session", "Capacity", "Health", ""].map((h, i) => (
          <Label key={i} style={{ textAlign: i > 1 && i < 4 ? "center" : "left" }}>{h}</Label>
        ))}
      </div>

      {sessions.map((s, i) => {
        const h = sHealth(s.booked, s.cap);
        const pct = s.cap > 0 ? Math.round(s.booked / s.cap * 100) : 0;
        const isE = exp === s.id, isDone = s.status === "done";
        return (
          <div key={s.id}>
            <div className="tct-row" onClick={() => setExp(isE ? null : s.id)} style={{
              display: "grid", gridTemplateColumns: "60px 1fr 100px 90px 36px",
              padding: "14px 20px", gap: 0, alignItems: "center",
              opacity: isDone ? .5 : 1,
              borderLeft: `2px solid ${isDone ? 'transparent' : h.color}`,
              borderBottom: 'none',
            }}>
              <Mono style={{ fontSize: 11, color: isDone ? T.t4 : T.t2, fontWeight: 500 }}>{s.time}</Mono>

              <div style={{ minWidth: 0, paddingRight: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  {s.status === "live" && <Dot color={T.emerald} pulse size={5} />}
                  <span style={{
                    fontSize: 13.5, fontWeight: 600,
                    color: isDone ? T.t2 : T.t1,
                    letterSpacing: '-.01em',
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{s.name}</span>
                  <Pill color={statColor[s.status]}
                    bg={`${statColor[s.status]}0a`}
                    border={`${statColor[s.status]}18`}>
                    {statLabel[s.status]}
                  </Pill>
                </div>
                {s.coach && (
                  <div style={{ fontSize: 11, color: T.t3, fontWeight: 400 }}>{s.coach} · {s.duration}</div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: "85%", height: 3, background: T.t5,
                  borderRadius: 99, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    background: isDone ? T.t4 : `linear-gradient(90deg, ${h.color}80, ${h.color})`,
                    borderRadius: 99, transition: "width .6s cubic-bezier(.16,1,.3,1)",
                    boxShadow: !isDone ? `0 0 6px ${h.color}30` : 'none',
                  }} />
                </div>
                <Mono style={{ fontSize: 10, color: T.t3, fontWeight: 500 }}>{s.booked}/{s.cap}</Mono>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <Pill color={h.color} bg={h.dim} border={h.bdr}>{h.label}</Pill>
              </div>

              <div style={{
                display: "flex", justifyContent: "center", color: T.t4,
                transition: "transform .25s cubic-bezier(.16,1,.3,1)",
                transform: isE ? "rotate(90deg)" : "none",
              }}>
                <Icon name="chevR" size={12} color={T.t4} />
              </div>
            </div>

            {isE && (
              <div className="t-sd" style={{
                padding: "14px 22px 16px",
                borderBottom: `1px solid ${T.border}`,
                borderTop: `1px solid ${T.border}`,
                background: "rgba(255,255,255,.01)",
              }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "Message Attendees", color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr,  icon: "msg",     msg: `Messaging ${s.booked} attendees` },
                    ...(!isDone && h.label !== "Full" ? [
                      { label: "Promote Class",   color: T.amber,   dim: T.amberDim,   bdr: T.amberBdr,   icon: "speaker", msg: `Promoting ${s.name}` },
                    ] : []),
                    { label: "Check-in",          color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr, icon: "qr",      msg: "QR scanner ready" },
                  ].map((a, j) => (
                    <button key={j} className="tct-btn" onClick={() => toast(a.msg, a.color)} style={{
                      fontSize: 11, fontWeight: 600, color: a.color,
                      background: a.dim, border: `1px solid ${a.bdr}`,
                      borderRadius: T.r1, padding: "8px 14px",
                    }}>
                      <Icon name={a.icon} size={11} color={a.color} /> {a.label}
                    </button>
                  ))}
                </div>
                {s.notes && (
                  <div style={{
                    marginTop: 12, fontSize: 11.5, color: T.t3,
                    fontStyle: "italic", lineHeight: 1.6,
                    padding: '10px 14px',
                    background: T.amberDim,
                    border: `1px solid ${T.amberBdr}`,
                    borderRadius: T.r1,
                  }}>
                    <Icon name="info" size={11} color={T.amber} /> {s.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <div style={{
        padding: "12px 20px", display: "flex", gap: 28,
        borderTop: `1px solid ${T.border}`,
        background: "rgba(255,255,255,.008)",
      }}>
        {[
          { l: "Booked",   v: sessions.reduce((a, s) => a + s.booked, 0) },
          { l: "Capacity", v: sessions.reduce((a, s) => a + s.cap, 0) },
          { l: "Progress", v: `${sessions.filter(s => s.status === "done").length}/${sessions.length}` },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 7, alignItems: "baseline" }}>
            <Mono style={{ fontSize: 17, color: T.t1, fontWeight: 600 }}>{s.v}</Mono>
            <Label>{s.l}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
function ActivityFeed({ toast }) {
  const iconMap = {
    check: "check", x: "x", send: "send", plus: "plus", warn: "warn", star: "star",
  };
  return (
    <div className="tct-card t-fu t-d6">
      <CardHead label="Activity Feed" sub="Today's events" />
      <div className="tct-scr" style={{ maxHeight: 320, overflowY: "auto" }}>
        {MOCK_ACTIVITY.map((ev, i) => (
          <div key={i} className="tct-row" style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 18px",
          }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Avatar name={ev.name} size={30} color={ev.tcolor} />
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 14, height: 14, borderRadius: 5,
                background: T.bg, border: `1px solid ${ev.tcolor}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={iconMap[ev.icon] || "check"} size={8} color={ev.tcolor} strokeWidth={2.5} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: T.t1 }}>{ev.name}</span>
                <span style={{ fontSize: 11.5, color: T.t3, fontWeight: 400 }}>{ev.detail}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {ev.action && (
                <button className="tct-btn" onClick={() => toast(`${ev.action}: ${ev.name}`, ev.tcolor)} style={{
                  fontSize: 10, fontWeight: 600, color: ev.tcolor,
                  background: `${ev.tcolor}0a`, border: `1px solid ${ev.tcolor}18`,
                  borderRadius: 6, padding: "5px 10px",
                }}>
                  {ev.action}
                </button>
              )}
              <Mono style={{ fontSize: 10, color: T.t4, fontWeight: 400 }}>{ev.time}</Mono>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WEEKLY PERFORMANCE (SIDEBAR) ─────────────────────────────────────────────
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
    { l: "Attendance",  v: ciThis,         change: ciChange, up: (ciChange ?? 0) >= 0, sub: "check-ins this week",    vc: null,      icon: "activity" },
    { l: "Fill Rate",   v: `${fillRate}%`, change: null,     up: fillRate >= 60,        sub: `${sessions.reduce((a,s)=>a+s.booked,0)}/${sessions.reduce((a,s)=>a+s.cap,0)} spots`, vc: null, icon: "target" },
    { l: "At Risk",     v: atRisk,         change: null,     up: atRisk === 0,          sub: "inactive 14+ days",     vc: atRisk > 0 ? T.red : T.emerald, icon: "shield" },
    { l: "Revenue MTD", v: "£8,240",       change: 8,        up: true,                  sub: "vs £7,630 last month",  vc: T.emerald, icon: "trend" },
  ];

  return (
    <div className="tct-card t-fu t-d5" style={{ marginBottom: 14 }}>
      <CardHead label="Performance" sub="This week" />
      {rows.map((m, i) => (
        <div key={i} style={{
          padding: "14px 18px",
          borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: T.r1, flexShrink: 0,
            background: `${(m.vc || T.indigo)}08`,
            border: `1px solid ${(m.vc || T.indigo)}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={m.icon} size={14} color={m.vc || T.indigo} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Label style={{ marginBottom: 4 }}>{m.l}</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <Mono style={{ fontSize: 22, color: m.vc || T.t1, lineHeight: 1, fontWeight: 600 }}>{m.v}</Mono>
              {m.change !== null && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 3, padding: "2px 7px",
                  borderRadius: 5,
                  background: m.up ? T.emeraldDim : T.redDim,
                  border: `1px solid ${m.up ? T.emeraldBdr : T.redBdr}`,
                }}>
                  <Icon name={m.up ? "up" : "down"} size={9} color={m.up ? T.emerald : T.red} />
                  <Mono style={{ fontSize: 10, color: m.up ? T.emerald : T.red }}>{Math.abs(m.change)}%</Mono>
                </div>
              )}
            </div>
            <div style={{ fontSize: 10.5, color: T.t3, marginTop: 3 }}>{m.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CLIENT RISK FEED (SIDEBAR) ───────────────────────────────────────────────
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
    else if (days >= 21)  { level = "critical"; reason = `${days}d inactive`; }
    else if (days >= 14)  { level = "high";     reason = `${days}d inactive`; }
    else if (days >= 7)   { level = "med";      reason = `${days}d since last visit`; }
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
    <div className="tct-card t-fu t-d6">
      <CardHead label="Client Risk" />
      <div style={{ padding: "28px 18px", textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', margin: "0 auto 12px",
          background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="check" size={16} color={T.emerald} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginBottom: 4 }}>All clients active</div>
        <div style={{ fontSize: 11, color: T.t3 }}>No one inactive 7+ days</div>
      </div>
    </div>
  );

  return (
    <div className="tct-card t-fu t-d6" style={{ position: 'relative' }}>
      <GlowBar color={T.red} />
      <CardHead
        label="Client Risk"
        sub={`${clients.length} need attention`}
        right={
          <Pill color={T.red} bg={T.redDim} border={T.redBdr} glow>
            {cnt.critical} critical
          </Pill>
        }
      />

      {/* Filter tabs */}
      <div style={{
        display: "flex", gap: 2, padding: "6px 10px",
        borderBottom: `1px solid ${T.border}`,
        background: 'rgba(255,255,255,.008)',
      }}>
        {[
          { k: "all",      l: `All ${cnt.all}` },
          { k: "critical", l: `Crit ${cnt.critical}` },
          { k: "high",     l: `High ${cnt.high}` },
          { k: "med",      l: `Med ${cnt.med}` },
        ].map(f => (
          <button key={f.k} className="tct-tab" onClick={() => setFilter(f.k)} style={{
            fontSize: 10.5, fontWeight: filter === f.k ? 700 : 500,
            color: filter === f.k ? T.t1 : T.t3,
            background: filter === f.k ? "rgba(255,255,255,.06)" : "transparent",
            borderRadius: 6, padding: "5px 9px",
            flex: 1,
          }}>{f.l}</button>
        ))}
      </div>

      {shown.map((c, i) => (
        <div key={c.id} style={{
          borderBottom: i < shown.length - 1 ? `1px solid ${T.border}` : "none",
          borderLeft: `2px solid ${lvlC[c.level]}`,
          padding: "11px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Avatar name={c.name} size={28} color={lvlC[c.level]} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: T.t1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginBottom: 2,
            }}>{c.name}</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 10.5, color: lvlC[c.level], fontWeight: 500 }}>{c.reason}</span>
              <span style={{ fontSize: 9.5, color: T.t4 }}>· {c.ci30} visits / 30d</span>
            </div>
          </div>
          <button className="tct-btn" onClick={() => toast(`Reaching out to ${c.name}`, lvlC[c.level])} style={{
            fontSize: 10, fontWeight: 600, color: lvlC[c.level],
            background: `${lvlC[c.level]}0a`,
            border: `1px solid ${lvlC[c.level]}18`,
            borderRadius: 6, padding: "5px 9px",
          }}>
            <Icon name="msg" size={10} color={lvlC[c.level]} />
          </button>
        </div>
      ))}

      {filtered.length > 4 && (
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${T.border}` }}>
          <button className="tct-btn" onClick={() => setShowAll(p => !p)} style={{
            fontSize: 11, fontWeight: 600, color: T.indigo,
            background: "transparent", width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            {showAll ? "Show less" : `${filtered.length - 4} more`}
            <span style={{ transition: "transform .25s", transform: showAll ? "rotate(180deg)" : "none", display: "flex" }}>
              <Icon name="chevD" size={11} color={T.indigo} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ENGAGEMENT HEATMAP (NEW) ─────────────────────────────────────────────────
function EngagementHeatmap({ checkIns, now }) {
  const weeks = 4;
  const days = 7;

  const cells = useMemo(() => {
    const result = [];
    for (let w = weeks - 1; w >= 0; w--) {
      for (let d = 0; d < days; d++) {
        const daysAgo = w * 7 + (6 - d);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        const count = checkIns.filter(c => {
          const cd = new Date(c.check_in_date);
          return cd.getFullYear() === date.getFullYear() && cd.getMonth() === date.getMonth() && cd.getDate() === date.getDate();
        }).length;
        result.push({ date, count, daysAgo });
      }
    }
    return result;
  }, [checkIns, now]);

  const max = Math.max(...cells.map(c => c.count), 1);
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="tct-card t-fu t-d7" style={{ marginBottom: 14 }}>
      <CardHead label="Engagement Map" sub="Last 4 weeks" />
      <div style={{ padding: "14px 18px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `24px repeat(${weeks}, 1fr)`, gap: 3 }}>
          {/* Day labels */}
          {dayLabels.map((d, i) => (
            <div key={d} style={{
              gridColumn: 1, gridRow: i + 1,
              fontSize: 8.5, fontFamily: T.mono, color: T.t4, fontWeight: 500,
              display: 'flex', alignItems: 'center',
            }}>{i % 2 === 0 ? d : ''}</div>
          ))}
          {/* Cells */}
          {cells.map((cell, i) => {
            const w = Math.floor(i / 7);
            const d = i % 7;
            const intensity = cell.count / max;
            const bg = cell.count === 0
              ? T.t5
              : `rgba(99,102,241,${.1 + intensity * .55})`;
            return (
              <div key={i} title={`${cell.date.toLocaleDateString('en-GB')} — ${cell.count} check-ins`} style={{
                gridColumn: w + 2, gridRow: d + 1,
                width: '100%', aspectRatio: '1', borderRadius: 3,
                background: bg,
                border: `1px solid ${cell.count > 0 ? `rgba(99,102,241,${.08 + intensity * .15})` : 'transparent'}`,
                transition: 'transform .15s, opacity .15s',
                cursor: 'default',
              }} />
            );
          })}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 10, justifyContent: 'flex-end',
        }}>
          <span style={{ fontSize: 9, color: T.t4, fontFamily: T.mono }}>Less</span>
          {[0, .15, .3, .5, .7].map((v, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: 2,
              background: v === 0 ? T.t5 : `rgba(99,102,241,${.1 + v * .55})`,
            }} />
          ))}
          <span style={{ fontSize: 9, color: T.t4, fontFamily: T.mono }}>More</span>
        </div>
      </div>
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
      background: T.bg,
      minHeight: "100vh",
      position: "relative",
    }}>
      <BackgroundOrbs />
      <ToastStack toasts={toasts} />

      <div className="tct-root-pad" style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1360,
        margin: '0 auto',
        padding: "32px 32px 80px",
      }}>
        <CommandHeader currentUser={currentUser} now={now} sessions={sessions} priorities={priorities} />
        <TodaysPriorities priorities={priorities} toast={toast} />
        <QuickStrip toast={toast} />

        <div className="tct-main-grid" style={{
          display: "grid", gridTemplateColumns: "1fr 320px",
          gap: 16, alignItems: "start",
        }}>
          {/* Main column */}
          <div>
            <AttendanceChart checkIns={checkIns} now={now} />
            <TodaysSessions sessions={sessions} toast={toast} now={now} />
            <ActivityFeed toast={toast} />
          </div>

          {/* Sidebar */}
          <div className="tct-sidebar" style={{
            display: "flex", flexDirection: "column", gap: 0,
            position: "sticky", top: 16,
          }}>
            <WeeklyPerformance checkIns={checkIns} sessions={sessions} allMemberships={allMemberships} now={now} />
            <ClientRiskFeed allMemberships={allMemberships} checkIns={checkIns} now={now} toast={toast} />
            <EngagementHeatmap checkIns={checkIns} now={now} />
          </div>
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
