import { useState, useMemo, useEffect, useRef } from "react";

/* ─── CSS INJECTION ──────────────────────────────────────────────────────────── */
if (typeof document !== "undefined" && !document.getElementById("cp-v4-css")) {
  const s = document.createElement("style");
  s.id = "cp-v4-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    .cp { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; }

    /* ── Animations ── */
    @keyframes cpFadeUp   { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }
    @keyframes cpSlideR   { from { opacity:0; transform:translateX(14px) } to { opacity:1; transform:translateX(0) } }
    @keyframes cpScale    { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }
    @keyframes cpPulse    { 0%,100%{opacity:1} 50%{opacity:0.45} }
    @keyframes cpShimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    .fade-up  { animation: cpFadeUp  0.28s cubic-bezier(0.22,1,0.36,1) both; }
    .slide-r  { animation: cpSlideR  0.22s cubic-bezier(0.22,1,0.36,1) both; }
    .scale-in { animation: cpScale   0.22s cubic-bezier(0.22,1,0.36,1) both; }

    /* ── Filter tabs ── */
    .filter-tab {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 12px; border-radius: 999px; cursor: pointer;
      font-size: 12px; font-weight: 600; border: 1px solid transparent;
      color: rgba(255,255,255,0.35); transition: all 0.13s; white-space: nowrap;
      user-select: none;
    }
    .filter-tab:hover { color: rgba(255,255,255,0.65); border-color: rgba(255,255,255,0.08); }
    .filter-tab.active {
      color: #f1f3f5; background: rgba(59,130,246,0.10);
      border-color: rgba(59,130,246,0.28);
    }
    .filter-tab .ct {
      font-size: 9.5px; font-weight: 700; padding: 1px 5px; border-radius: 999px;
      background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4);
      font-family: 'DM Mono', monospace;
    }
    .filter-tab.active .ct { background: rgba(59,130,246,0.18); color: #3b82f6; }
    .filter-tab.danger  .ct { background: rgba(239,68,68,0.12); color: #ef4444; }
    .filter-tab.warning .ct { background: rgba(245,158,11,0.12); color: #f59e0b; }

    /* ── Pill badges ── */
    .pill-blue    { display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;background:rgba(59,130,246,0.11);border:1px solid rgba(59,130,246,0.24);color:#60a5fa; }
    .pill-green   { display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;background:rgba(34,197,94,0.10);border:1px solid rgba(34,197,94,0.22);color:#4ade80; }
    .pill-red     { display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;background:rgba(239,68,68,0.10);border:1px solid rgba(239,68,68,0.22);color:#f87171; }
    .pill-amber   { display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;background:rgba(245,158,11,0.10);border:1px solid rgba(245,158,11,0.22);color:#fbbf24; }
    .pill-neutral { display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;background:rgba(255,255,255,0.055);border:1px solid rgba(255,255,255,0.10);color:rgba(255,255,255,0.35); }
    .pill-gold    { display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;background:rgba(234,179,8,0.10);border:1px solid rgba(234,179,8,0.22);color:#fde047; }

    /* ── Member rows ── */
    .member-row {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 18px;
      background: #0c1422;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      cursor: pointer; transition: border-color 0.14s, background 0.14s;
      position: relative;
    }
    .member-row:hover {
      border-color: rgba(255,255,255,0.12);
      background: #0f1928;
    }
    .member-row.selected {
      border-color: rgba(59,130,246,0.38);
      background: rgba(59,130,246,0.055);
    }

    /* ── Priority rows (at-risk: red left accent on hover) ── */
    .priority-row {
      display: flex; align-items: center; gap: 12px;
      padding: 13px 18px;
      background: #0c1422;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      cursor: pointer; transition: all 0.14s;
      position: relative; overflow: hidden;
    }
    .priority-row::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0;
      width: 3px; background: transparent; border-radius: 12px 0 0 12px;
      transition: background 0.15s;
    }
    .priority-row:hover { border-color: rgba(239,68,68,0.28); background: rgba(239,68,68,0.025); }
    .priority-row:hover::before { background: #ef4444; }
    .priority-row.selected {
      border-color: rgba(239,68,68,0.40);
      background: rgba(239,68,68,0.045);
    }
    .priority-row.selected::before { background: #ef4444; }

    /* ── Group headers ── */
    .group-hdr {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 2px 6px;
      font-size: 9.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.10em;
    }
    .group-hdr::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.055); }

    /* ── Score ring colors (CORRECT psychology) ── */
    .score-healthy { color: #4ade80; }
    .score-warning { color: #fbbf24; }
    .score-danger  { color: #f87171; }

    /* ── Detail panel ── */
    .detail-panel {
      animation: cpSlideR 0.2s cubic-bezier(0.22,1,0.36,1) both;
    }

    /* ── Metric mini-cards ── */
    .mc {
      background: #101f30; border: 1px solid rgba(255,255,255,0.065);
      border-radius: 10px; padding: 11px 13px; transition: border-color 0.13s;
    }
    .mc:hover { border-color: rgba(255,255,255,0.11); }

    /* ── Insight cards ── */
    .insight-card {
      background: #0c1422; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px; padding: 12px 14px;
      border-left: 2px solid transparent; margin-bottom: 6px;
    }
    .insight-card.critical { border-left-color: #ef4444; }
    .insight-card.warning  { border-left-color: #f59e0b; }
    .insight-card.info     { border-left-color: #3b82f6; }

    /* ── Timeline ── */
    .tl-row { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.042); }
    .tl-row:last-child { border-bottom: none; }
    .tl-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }

    /* ── Scrollbar ── */
    .cp-scroll::-webkit-scrollbar { width: 3px; }
    .cp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }

    /* ── Action button ── */
    .act-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 13px; border-radius: 8px; cursor: pointer;
      font-size: 11.5px; font-weight: 700; border: none;
      transition: all 0.12s; font-family: 'DM Sans', sans-serif;
    }
    .act-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
    .act-btn:active { transform: translateY(0); }

    /* ── Search input ── */
    .search-input {
      width: 100%; padding: 7px 10px 7px 32px;
      background: #0c1422; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 9px; color: #edf2f7;
      font-family: 'DM Sans', sans-serif; font-size: 12.5px;
      outline: none; transition: border-color 0.13s;
    }
    .search-input::placeholder { color: rgba(255,255,255,0.22); }
    .search-input:focus { border-color: rgba(59,130,246,0.35); }

    /* ── Retention bar ── */
    .ret-track {
      height: 3px; border-radius: 999px; background: rgba(255,255,255,0.05); overflow: hidden;
    }
    .ret-fill { height: 100%; border-radius: 999px; transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }

    /* ── Modal overlay ── */
    @keyframes cpMod { from{opacity:0;transform:scale(0.97)translateY(6px)} to{opacity:1;transform:none} }
    .modal-ov { position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px; }
    .modal-box { background:#0c1422;border:1px solid rgba(255,255,255,0.12);border-radius:14px;width:100%;max-width:420px;animation:cpMod .18s ease;overflow:hidden; }

    /* ── Toast ── */
    @keyframes cpToast { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
    .toast {
      position: fixed; bottom: 22px; right: 22px; z-index: 300;
      background: #101f30; border: 1px solid rgba(255,255,255,0.10);
      border-left: 2px solid #22c55e;
      border-radius: 10px; padding: 10px 16px;
      font-size: 12.5px; font-weight: 500; color: #edf2f7;
      display: flex; align-items: center; gap: 8px;
      animation: cpToast 0.18s ease;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    }

    /* ── KPI cards ── */
    .kpi-card {
      background: #0c1422; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; padding: 16px 18px 14px;
      transition: border-color 0.14s;
    }
    .kpi-card.clickable { cursor: pointer; }
    .kpi-card.clickable:hover { border-color: rgba(255,255,255,0.12); }
  `;
  document.head.appendChild(s);
}

/* ─── DESIGN TOKENS ───────────────────────────────────────────────────────────── */
const D = {
  bgBase:    "#070e19",
  bgSurface: "#0c1422",
  bgCard:    "#101f30",
  t1: "#edf2f7",
  t2: "#8a9bb0",
  t3: "#4a5d72",
  t4: "#2a3a4d",
  blue:      "#3b82f6",
  blueSub:   "rgba(59,130,246,0.10)",
  blueBdr:   "rgba(59,130,246,0.28)",
  red:       "#ef4444",
  redSub:    "rgba(239,68,68,0.10)",
  redBdr:    "rgba(239,68,68,0.28)",
  amber:     "#f59e0b",
  amberSub:  "rgba(245,158,11,0.10)",
  amberBdr:  "rgba(245,158,11,0.28)",
  green:     "#22c55e",
  greenSub:  "rgba(34,197,94,0.10)",
  greenBdr:  "rgba(34,197,94,0.28)",
};

/* ─── SCORE COLOR HELPER — correct psychology ─────────────────────────────────── */
function scoreColor(score) {
  if (score >= 70) return D.green;
  if (score >= 40) return D.amber;
  return D.red;
}
function scoreLabel(score) {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "At Risk";
  return "Critical";
}
function scoreClass(score) {
  if (score >= 70) return "score-healthy";
  if (score >= 40) return "score-warning";
  return "score-danger";
}

/* ─── PRIMITIVES ──────────────────────────────────────────────────────────────── */

export function MiniAvatar({ name = "?", src, size = 32, urgency }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = name.split("").reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  const bg = urgency === "danger"
    ? "rgba(239,68,68,0.15)"
    : urgency === "risk"
    ? "rgba(245,158,11,0.12)"
    : `hsla(${hue},28%,18%,1)`;
  const bdr = urgency === "danger"
    ? "rgba(239,68,68,0.3)"
    : urgency === "risk"
    ? "rgba(245,158,11,0.25)"
    : "rgba(255,255,255,0.08)";
  const color = urgency === "danger" ? "#f87171" : urgency === "risk" ? "#fbbf24" : `hsl(${hue},55%,70%)`;

  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%",
      objectFit: "cover", border: `1.5px solid ${bdr}`, flexShrink: 0 }}/>
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: bg, border: `1.5px solid ${bdr}`,
      fontSize: Math.round(size * 0.36), fontWeight: 800, color,
      letterSpacing: "-0.01em" }}>
      {initials}
    </div>
  );
}

export function Spark({ data = [], color = D.blue, height = 30, width = 88 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 3;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - pad * 2) + pad;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const lastV = data[data.length - 1];
  const lx = width - pad;
  const ly = height - pad - ((lastV - min) / range) * (height - pad * 2);
  return (
    <svg width={width} height={height} style={{ overflow: "visible", flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round" opacity={0.85}/>
      <circle cx={lx} cy={ly} r={2.5} fill={color}/>
    </svg>
  );
}

export function DashCard({ title, icon: Icon, action, onAction, accentColor, children }) {
  const ac = accentColor || null;
  return (
    <div style={{ background: D.bgSurface, border: `1px solid ${ac ? `${ac}30` : "rgba(255,255,255,0.07)"}`,
      borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.042)",
        background: ac ? `${ac}06` : "transparent" }}>
        {ac && <div style={{ width: 3, height: 14, borderRadius: 99, background: ac, flexShrink: 0 }}/>}
        {Icon && <Icon style={{ width: 12, height: 12, color: ac || D.t3, flexShrink: 0 }}/>}
        <span style={{ flex: 1, fontSize: 11.5, fontWeight: 800, color: D.t1, letterSpacing: "-0.01em" }}>{title}</span>
        {action && (
          <button onClick={onAction} style={{ fontSize: 10.5, fontWeight: 700, color: ac || D.blue,
            background: `${ac || D.blue}12`, border: `1px solid ${ac || D.blue}28`,
            borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.12s" }}>
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── REALISTIC MOCK DATA ─────────────────────────────────────────────────────── */
const MOCK_CLIENTS = [
  {
    id: "c1", name: "Sarah Mitchell",   tier: "Premium",
    score: 88, trend: [62,68,72,75,80,85,88], status: "healthy",
    lastVisit: "Today",           vpw: 3.8, completion: 91,  streak: 7,
    totalVisits: 124, phone: "+44 7711 234567", email: "s.mitchell@email.com",
    booked: true,  missedLast3: false,
    flags: ["high-eng"],
    notes: "Responds well to progressive overload. Goals: half-marathon prep.",
    insights: [
      { lv:"info",    title:"Consistency milestone",   body:"Sarah has visited 4+ times per week for 7 consecutive weeks — her best streak yet.", cta:"Send a congratulations message" },
      { lv:"info",    title:"Programme due for review", body:"Current strength block ends in 8 days. Suggest transitioning to endurance phase.", cta:"Schedule programme review" },
    ],
    activity: [
      { type:"visit", label:"Gym session — Strength A", time:"Today, 08:14" },
      { type:"visit", label:"Gym session — HIIT",       time:"2 days ago" },
      { type:"msg",   label:"Message sent by coach",    time:"4 days ago" },
      { type:"visit", label:"Gym session — Rest day workout", time:"5 days ago" },
    ],
  },
  {
    id: "c2", name: "James Chen",       tier: "Standard",
    score: 24, trend: [72,68,61,54,42,33,24], status: "at-risk",
    lastVisit: "18 days ago",     vpw: 0.4, completion: 22,  streak: 0,
    totalVisits: 31,  phone: "+44 7822 345678", email: "j.chen@email.com",
    booked: false, missedLast3: true,
    flags: ["no-visit","declining","not-booked"],
    notes: "Joined for weight loss. Strong start but attendance dropped after work schedule change.",
    insights: [
      { lv:"critical", title:"High churn risk — 18 days inactive", body:"James's score has declined 48 points over 7 weeks. Last 3 booked sessions were missed. Immediate outreach strongly recommended.", cta:"Send re-engagement message now" },
      { lv:"warning",  title:"No upcoming session booked",          body:"James has no sessions on the calendar. Offering a complimentary check-in call can improve retention.", cta:"Book a free check-in session" },
    ],
    activity: [
      { type:"miss",  label:"Missed booked session",     time:"3 days ago" },
      { type:"miss",  label:"Missed booked session",     time:"10 days ago" },
      { type:"miss",  label:"Missed booked session",     time:"17 days ago" },
      { type:"visit", label:"Gym session — Induction",   time:"18 days ago" },
    ],
  },
  {
    id: "c3", name: "Emma Hartley",     tier: "Standard",
    score: 51, trend: [65,63,60,58,54,52,51], status: "at-risk",
    lastVisit: "9 days ago",      vpw: 1.1, completion: 48,  streak: 0,
    totalVisits: 58,  phone: "+44 7933 456789", email: "e.hartley@email.com",
    booked: true,  missedLast3: false,
    flags: ["declining","low-workout"],
    notes: "Intermediate level. Likes group classes more than solo sessions.",
    insights: [
      { lv:"warning", title:"Declining engagement trend",  body:"Visits have dropped from 3×/week to just over 1×/week in the last month. Hasn't completed a workout programme in 3 weeks.", cta:"Check in and review her goals" },
      { lv:"info",    title:"Group class suggestion",       body:"Emma's last 4 visits were all group classes. Consider recommending a new class tier to re-spark interest.", cta:"Browse available group sessions" },
    ],
    activity: [
      { type:"visit", label:"Yoga Flow class",              time:"9 days ago" },
      { type:"msg",   label:"Checked in by coach",          time:"11 days ago" },
      { type:"visit", label:"HIIT Blast class",             time:"15 days ago" },
      { type:"miss",  label:"Missed — Strength session",    time:"19 days ago" },
    ],
  },
  {
    id: "c4", name: "Marcus Thompson",  tier: "Premium",
    score: 82, trend: [74,76,78,79,80,81,82], status: "healthy",
    lastVisit: "Yesterday",       vpw: 3.2, completion: 84,  streak: 5,
    totalVisits: 201, phone: "+44 7644 567890", email: "m.thompson@email.com",
    booked: true,  missedLast3: false,
    flags: ["high-eng"],
    notes: "Long-term client (2 yrs). Competes in amateur powerlifting.",
    insights: [
      { lv:"info", title:"Approaching 200-visit milestone", body:"Marcus is at 201 total visits — a milestone worth acknowledging. A personal note will resonate well.", cta:"Send a milestone message" },
    ],
    activity: [
      { type:"visit", label:"Powerlifting session",         time:"Yesterday" },
      { type:"visit", label:"Accessory work — Upper",       time:"3 days ago" },
      { type:"visit", label:"Powerlifting session",         time:"5 days ago" },
    ],
  },
  {
    id: "c5", name: "Priya Sharma",     tier: "Standard",
    score: 31, trend: [55,50,48,44,40,35,31], status: "at-risk",
    lastVisit: "14 days ago",     vpw: 0.7, completion: 29,  streak: 0,
    totalVisits: 19,  phone: "+44 7755 678901", email: "p.sharma@email.com",
    booked: false, missedLast3: true,
    flags: ["no-visit","not-booked","declining"],
    notes: "New member (6 weeks). Has expressed uncertainty about her programme.",
    insights: [
      { lv:"critical", title:"New member disengaging early", body:"Priya is only 6 weeks in with 19 visits, but engagement is falling sharply. Early churn is most preventable with a personal touchpoint.", cta:"Call or message Priya today" },
      { lv:"warning",  title:"No session booked",            body:"No upcoming sessions. A guided booking from you can remove the friction she may be feeling.", cta:"Book her next session" },
    ],
    activity: [
      { type:"miss",  label:"Missed — Intro to Strength",  time:"4 days ago" },
      { type:"visit", label:"Gym induction session",        time:"14 days ago" },
      { type:"msg",   label:"Welcome message sent",         time:"6 weeks ago" },
    ],
  },
  {
    id: "c6", name: "Oliver Bennett",   tier: "Standard",
    score: 74, trend: [60,63,65,68,70,72,74], status: "healthy",
    lastVisit: "2 days ago",      vpw: 2.5, completion: 72,  streak: 3,
    totalVisits: 88,  phone: "+44 7866 789012", email: "o.bennett@email.com",
    booked: true,  missedLast3: false,
    flags: [],
    notes: "",
    insights: [
      { lv:"info", title:"Steady upward trend", body:"Oliver's score has risen 14 points over 7 weeks — strong indicator of building habit. Consider an upsell to a premium plan.", cta:"Discuss premium upgrade" },
    ],
    activity: [
      { type:"visit", label:"Cardio session",               time:"2 days ago" },
      { type:"visit", label:"Strength B — Lower body",      time:"5 days ago" },
      { type:"visit", label:"Cardio session",               time:"7 days ago" },
    ],
  },
  {
    id: "c7", name: "Aisha Johnson",    tier: "Premium",
    score: 38, trend: [80,75,68,59,50,43,38], status: "at-risk",
    lastVisit: "11 days ago",     vpw: 0.9, completion: 35,  streak: 0,
    totalVisits: 73,  phone: "+44 7977 890123", email: "a.johnson@email.com",
    booked: false, missedLast3: true,
    flags: ["no-visit","declining","not-booked"],
    notes: "Injury in week 3 (shoulder). Returned but confidence appears low.",
    insights: [
      { lv:"critical", title:"Post-injury engagement drop",  body:"Aisha's score has fallen 42 points since her shoulder injury. Post-injury clients have a 3× higher churn rate without coach outreach.", cta:"Book a recovery check-in session" },
      { lv:"warning",  title:"Premium plan — low utilisation", body:"Aisha is on a Premium plan but visiting less than 1×/week. She may question her subscription value.", cta:"Highlight premium benefits" },
    ],
    activity: [
      { type:"miss",  label:"Missed — Upper body session",  time:"5 days ago" },
      { type:"visit", label:"Rehabilitation session",        time:"11 days ago" },
      { type:"msg",   label:"Injury check-in by coach",     time:"13 days ago" },
    ],
  },
  {
    id: "c8", name: "Tom Rivera",       tier: "Standard",
    score: 79, trend: [71,72,74,75,77,78,79], status: "healthy",
    lastVisit: "Today",           vpw: 3.0, completion: 78,  streak: 4,
    totalVisits: 56,  phone: "+44 7588 901234", email: "t.rivera@email.com",
    booked: true,  missedLast3: false,
    flags: [],
    notes: "",
    insights: [
      { lv:"info", title:"Consistent performer", body:"Tom has maintained a healthy score for 7 consecutive weeks. Low maintenance, high reward client.", cta:"Consider as referral ambassador" },
    ],
    activity: [
      { type:"visit", label:"CrossFit Madness class",       time:"Today, 06:00" },
      { type:"visit", label:"HIIT Blast",                   time:"3 days ago" },
      { type:"visit", label:"Strength Foundation session",  time:"6 days ago" },
    ],
  },
  {
    id: "c9", name: "Lisa Park",        tier: "Standard",
    score: 55, trend: [60,58,57,56,55,55,55], status: "at-risk",
    lastVisit: "6 days ago",      vpw: 1.4, completion: 54,  streak: 1,
    totalVisits: 42,  phone: "+44 7699 012345", email: "l.park@email.com",
    booked: true,  missedLast3: false,
    flags: ["declining"],
    notes: "Prefers morning sessions only. Responds well to check-in messages.",
    insights: [
      { lv:"warning", title:"Plateau in attendance",        body:"Lisa has been at approximately the same score for 4 weeks — not declining, but not growing either. A goal-setting session could reignite momentum.", cta:"Schedule a goal review" },
    ],
    activity: [
      { type:"visit", label:"Morning yoga class",           time:"6 days ago" },
      { type:"visit", label:"Pilates Foundation",           time:"10 days ago" },
      { type:"msg",   label:"Replied to coach message",     time:"12 days ago" },
    ],
  },
  {
    id: "c10", name: "David Walsh",     tier: "Standard",
    score: 91, trend: [80,83,85,87,88,90,91], status: "healthy",
    lastVisit: "Today",           vpw: 4.2, completion: 94,  streak: 10,
    totalVisits: 168, phone: "+44 7400 123456", email: "d.walsh@email.com",
    booked: true,  missedLast3: false,
    flags: ["high-eng"],
    notes: "Coaches Olympic lifting on weekends. Extremely self-motivated.",
    insights: [
      { lv:"info", title:"Top performer — 10-week streak",  body:"David has the highest engagement score on your roster. Consider featuring him in social proof content.", cta:"Ask about testimonial or case study" },
    ],
    activity: [
      { type:"visit", label:"Olympic lifting session",      time:"Today, 07:30" },
      { type:"visit", label:"Technique refinement — Clean", time:"2 days ago" },
      { type:"visit", label:"Olympic lifting session",      time:"4 days ago" },
    ],
  },
];

const FILTER_DEFS = [
  { id: "all",          label: "All",          fn: () => true },
  { id: "at-risk",      label: "At Risk",       fn: c => c.status === "at-risk",    danger: true },
  { id: "not-booked",   label: "Not Booked",    fn: c => !c.booked,                 warning: true },
  { id: "healthy",      label: "Healthy",       fn: c => c.status === "healthy" },
  { id: "premium",      label: "Premium",       fn: c => c.tier === "Premium" },
];

/* ─── TOAST ───────────────────────────────────────────────────────────────────── */
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, [onDone]);
  return <div className="toast"><span style={{ color: D.green }}>✓</span> {msg}</div>;
}

/* ─── MODALS ──────────────────────────────────────────────────────────────────── */
function Modal({ onClose, children }) {
  return (
    <div className="modal-ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">{children}</div>
    </div>
  );
}

function MsgModal({ client, onClose, onSend }) {
  const [msg, setMsg] = useState(
    `Hi ${client.name.split(" ")[0]}, just checking in — how are you getting on with your training this week?`
  );
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: D.t1 }}>Send Message</div>
          <div style={{ fontSize: 11, color: D.t3, marginTop: 2 }}>{client.name}</div>
        </div>
        <div onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.07)", color: D.t3, cursor: "pointer",
          fontSize: 11, transition: "all 0.12s" }}>✕</div>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: D.t3, textTransform: "uppercase",
            letterSpacing: "0.07em", marginBottom: 5 }}>To</div>
          <input readOnly value={`${client.name} · ${client.email}`} style={{ width: "100%",
            padding: "7px 10px", background: "#0c1422", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, color: D.t3, fontFamily: "inherit", fontSize: 12.5, outline: "none" }}/>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: D.t3, textTransform: "uppercase",
            letterSpacing: "0.07em", marginBottom: 5 }}>Message</div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} style={{ width: "100%",
            padding: "8px 10px", background: "#0c1422", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, color: D.t1, fontFamily: "inherit", fontSize: 12.5,
            outline: "none", resize: "vertical", minHeight: 90,
            transition: "border-color 0.13s" }} className="search-input"
            onFocus={e => e.target.style.borderColor = D.blueBdr}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}/>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, padding: "12px 18px",
        borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={onClose} style={{ padding: "6px 13px", borderRadius: 7, fontSize: 12,
          fontWeight: 600, background: "transparent", border: "1px solid rgba(255,255,255,0.09)",
          color: D.t2, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        <button onClick={() => { onSend(`Message sent to ${client.name}`); onClose(); }}
          style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12.5, fontWeight: 700,
            background: D.blue, color: "#fff", border: "none", cursor: "pointer",
            fontFamily: "inherit" }}>Send Message</button>
      </div>
    </Modal>
  );
}

function BookModal({ client, onClose, onSend }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState("1-to-1 Session");
  const fieldStyle = {
    width: "100%", padding: "7px 10px",
    background: "#0c1422", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8, color: D.t1, fontFamily: "inherit", fontSize: 12.5,
    outline: "none", colorScheme: "dark",
  };
  const labelStyle = {
    display: "block", fontSize: 10, fontWeight: 700, color: D.t3,
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5,
  };
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: D.t1 }}>Book Session</div>
          <div style={{ fontSize: 11, color: D.t3, marginTop: 2 }}>{client.name}</div>
        </div>
        <div onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.07)", color: D.t3, cursor: "pointer", fontSize: 11 }}>✕</div>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ marginBottom: 13 }}>
          <label style={labelStyle}>Session Type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={{ ...fieldStyle }}>
            {["1-to-1 Session","Group Class","Online Check-in","Assessment","Recovery Session"].map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 13 }}>
          <div><label style={labelStyle}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={fieldStyle}/>
          </div>
          <div><label style={labelStyle}>Time</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={fieldStyle}/>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea placeholder="Focus areas for this session..."
            style={{ ...fieldStyle, minHeight: 72, resize: "vertical" }}/>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 7, padding: "12px 18px",
        borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button onClick={onClose} style={{ padding: "6px 13px", borderRadius: 7, fontSize: 12,
          fontWeight: 600, background: "transparent", border: "1px solid rgba(255,255,255,0.09)",
          color: D.t2, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
        <button onClick={() => {
          if (!date) { alert("Please select a date"); return; }
          onSend(`Session booked for ${client.name}`); onClose();
        }} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12.5, fontWeight: 700,
          background: D.green, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          Confirm Booking
        </button>
      </div>
    </Modal>
  );
}

/* ─── CLIENT DETAIL PANEL ──────────────────────────────────────────────────────── */
function ClientDetailPanel({ client, onClose, onMsg, onBook }) {
  if (!client) return (
    <div style={{ width: "38%", flexShrink: 0, background: "#0a1520",
      borderLeft: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 8, padding: "32px", textAlign: "center" }}>
      <div style={{ fontSize: 28, opacity: 0.12, marginBottom: 4 }}>⊡</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: D.t2 }}>No client selected</div>
      <div style={{ fontSize: 11.5, color: D.t3, lineHeight: 1.65, maxWidth: 200 }}>
        Click any client to view their profile, retention trend, and AI-generated insights.
      </div>
    </div>
  );

  const sc = scoreColor(client.score);
  const sl = scoreLabel(client.score);
  const trendDir = client.trend[client.trend.length - 1] > client.trend[0] ? "up" : "down";
  const trendDelta = client.trend[client.trend.length - 1] - client.trend[0];
  const compColor = client.completion >= 70 ? D.green : client.completion >= 40 ? D.amber : D.red;

  const tlDot = (type) => ({
    visit: D.green, msg: D.blue, miss: D.red, warn: D.amber,
  }[type] || D.t3);

  return (
    <div className="detail-panel" style={{ width: "38%", flexShrink: 0,
      background: "#09131e", borderLeft: "1px solid rgba(255,255,255,0.065)",
      display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Panel header ── */}
      <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 13 }}>
          <MiniAvatar name={client.name} size={40}
            urgency={client.status === "at-risk" ? "danger" : undefined}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: D.t1,
              letterSpacing: "-0.02em", marginBottom: 3 }}>{client.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className={client.tier === "Premium" ? "pill-gold" : "pill-neutral"}>{client.tier}</span>
              <span className={client.status === "at-risk" ? "pill-red" : "pill-green"}>{sl}</span>
            </div>
          </div>
          <div onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.07)", color: D.t3, cursor: "pointer",
            fontSize: 11, flexShrink: 0, transition: "all 0.12s" }}>✕</div>
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: "Message", color: D.blue, bg: D.blueSub, bdr: D.blueBdr, fn: () => onMsg(client) },
            { label: "Book",    color: D.green, bg: D.greenSub, bdr: D.greenBdr, fn: () => onBook(client) },
            { label: "Assign",  color: D.t2, bg: "rgba(255,255,255,0.04)", bdr: "rgba(255,255,255,0.09)", fn: () => {} },
          ].map(({ label, color, bg, bdr, fn }) => (
            <button key={label} className="act-btn" onClick={fn} style={{
              background: bg, border: `1px solid ${bdr}`, color,
              justifyContent: "center", width: "100%",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="cp-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px 24px",
        display: "flex", flexDirection: "column", gap: 18 }}>

        {/* ── RETENTION SCORE — THE KEY FIX ── */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.10em", color: D.t4, marginBottom: 10,
            display: "flex", alignItems: "center", gap: 6 }}>
            Retention Score
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.042)" }}/>
          </div>

          <div style={{ background: D.bgSurface, border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "14px 15px" }}>
            {/* Score + trend side by side */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              marginBottom: 10 }}>
              <div>
                {/* THE FIX: score in correct semantic color */}
                <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.05em",
                  lineHeight: 1, color: sc, fontFamily: "'DM Mono', monospace" }}>
                  {client.score}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: sc, marginTop: 3, opacity: 0.8 }}>
                  {sl}
                  {" · "}
                  <span style={{ color: trendDir === "up" ? D.green : D.red }}>
                    {trendDir === "up" ? "↑" : "↓"} {Math.abs(trendDelta)} pts in 7 weeks
                  </span>
                </div>
              </div>
              {/* Spark line — 7-week retention trend */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ fontSize: 8.5, color: D.t4, textTransform: "uppercase",
                  letterSpacing: "0.06em" }}>7-wk trend</div>
                <Spark data={client.trend} color={sc} height={34} width={96}/>
              </div>
            </div>
            {/* Progress bar */}
            <div className="ret-track">
              <div className="ret-fill" style={{ width: `${client.score}%`, background: sc }}/>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 9, color: D.t4 }}>Critical</span>
              <span style={{ fontSize: 9, color: D.t4 }}>Healthy</span>
            </div>
          </div>
        </div>

        {/* ── MISSED SESSIONS WARNING — DashCard w/ amber accent ── */}
        {client.missedLast3 && (
          <DashCard title="Missed 3 consecutive sessions" accentColor={D.amber}
            action="Message now" onAction={() => onMsg(client)}>
            <div style={{ padding: "11px 15px" }}>
              <div style={{ fontSize: 11.5, color: D.t2, lineHeight: 1.65, marginBottom: 10 }}>
                {client.name.split(" ")[0]} has missed their last 3 booked sessions.
                A personal message significantly reduces churn risk at this stage.
              </div>
              <button className="act-btn" onClick={() => onMsg(client)} style={{
                background: D.amberSub, border: `1px solid ${D.amberBdr}`, color: D.amber,
              }}>
                ✉ Send re-engagement message
              </button>
            </div>
          </DashCard>
        )}

        {/* ── KEY METRICS ── */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.10em", color: D.t4, marginBottom: 8,
            display: "flex", alignItems: "center", gap: 6 }}>
            Key Metrics
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.042)" }}/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { label: "Last Visit",     value: client.lastVisit,         color: null, mono: false },
              { label: "Visits / Week",  value: `${client.vpw}×`,         color: client.vpw >= 2.5 ? D.green : client.vpw >= 1 ? D.amber : D.red, mono: true },
              { label: "Completion",     value: `${client.completion}%`,  color: compColor, mono: true },
              { label: "Streak",         value: `${client.streak} wk`,    color: client.streak >= 4 ? D.green : null, mono: true },
              { label: "Total Visits",   value: client.totalVisits,       color: null, mono: true },
              { label: "Next Session",   value: client.booked ? "Booked ✓" : "Not booked",
                color: client.booked ? D.green : D.red, mono: false },
            ].map(({ label, value, color, mono }) => (
              <div key={label} className="mc">
                <div style={{ fontSize: 9, fontWeight: 700, color: D.t4, textTransform: "uppercase",
                  letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em",
                  color: color || D.t1,
                  fontFamily: mono ? "'DM Mono', monospace" : "inherit" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AT-RISK ALERT DashCard ── */}
        {client.status === "at-risk" && !client.missedLast3 && (
          <DashCard title="Retention alert" accentColor={D.red}
            action="Take action" onAction={() => onMsg(client)}>
            <div style={{ padding: "11px 15px" }}>
              <div style={{ fontSize: 11.5, color: D.t2, lineHeight: 1.65 }}>
                {client.name.split(" ")[0]}'s score has dropped {Math.abs(trendDelta)} points
                over 7 weeks. Without intervention, churn probability increases significantly.
              </div>
            </div>
          </DashCard>
        )}

        {/* ── INSIGHTS ── */}
        {client.insights?.length > 0 && (
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.10em", color: D.t4, marginBottom: 8,
              display: "flex", alignItems: "center", gap: 6 }}>
              AI Insights
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.042)" }}/>
            </div>
            {client.insights.map((ins, i) => (
              <div key={i} className={`insight-card ${ins.lv}`}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, flexShrink: 0, marginTop: 2,
                    color: ins.lv === "critical" ? D.red : ins.lv === "warning" ? D.amber : D.blue }}>
                    {ins.lv === "critical" ? "⚠" : ins.lv === "warning" ? "◉" : "ℹ"}
                  </span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{ins.title}</div>
                </div>
                <div style={{ fontSize: 11.5, color: D.t2, lineHeight: 1.6, marginBottom: 7,
                  paddingLeft: 17 }}>{ins.body}</div>
                <div style={{ paddingLeft: 17 }}>
                  <span style={{ fontSize: 11, color: D.blue, fontWeight: 600, cursor: "pointer" }}>
                    → {ins.cta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── NOTES ── */}
        {client.notes && (
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.10em", color: D.t4, marginBottom: 8,
              display: "flex", alignItems: "center", gap: 6 }}>
              Coach Notes
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.042)" }}/>
            </div>
            <div style={{ background: D.bgSurface, border: "1px solid rgba(255,255,255,0.065)",
              borderRadius: 10, padding: "11px 13px", fontSize: 11.5, color: D.t2, lineHeight: 1.7 }}>
              {client.notes}
            </div>
          </div>
        )}

        {/* ── ACTIVITY TIMELINE ── */}
        <div>
          <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.10em", color: D.t4, marginBottom: 8,
            display: "flex", alignItems: "center", gap: 6 }}>
            Recent Activity
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.042)" }}/>
          </div>
          <div style={{ background: D.bgSurface, border: "1px solid rgba(255,255,255,0.065)",
            borderRadius: 12, padding: "4px 14px" }}>
            {client.activity.map((ev, i) => (
              <div key={i} className="tl-row">
                <div className="tl-dot" style={{ background: tlDot(ev.type), marginTop: 5 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: D.t1 }}>{ev.label}</div>
                  <div style={{ fontSize: 10.5, color: D.t4, marginTop: 1 }}>{ev.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── CLIENT ROW ──────────────────────────────────────────────────────────────── */
function ClientRow({ client, selected, onClick, onMsg, onBook }) {
  const sc = scoreColor(client.score);
  const isRisk = client.status === "at-risk";

  return (
    <div className={`${isRisk ? "priority-row" : "member-row"} ${selected ? "selected" : ""} fade-up`}
      onClick={onClick} style={{ animationDelay: `${0}s` }}>

      <MiniAvatar name={client.name} size={34}
        urgency={isRisk ? "danger" : client.status === "needs-attention" ? "risk" : undefined}/>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: D.t1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</span>
          {client.tier === "Premium" && <span className="pill-gold">Premium</span>}
          {isRisk && <span className="pill-red">At Risk</span>}
          {!isRisk && client.status !== "healthy" && <span className="pill-amber">Attention</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: D.t3 }}>Last visit: {client.lastVisit}</span>
          <span style={{ fontSize: 11, color: D.t4 }}>·</span>
          <span style={{ fontSize: 11, color: D.t3 }}>{client.vpw}×/wk</span>
          {client.streak > 0 && (
            <><span style={{ fontSize: 11, color: D.t4 }}>·</span>
            <span style={{ fontSize: 11, color: D.green }}>{client.streak}wk streak 🔥</span></>
          )}
          {client.flags.includes("not-booked") && (
            <span className="pill-amber" style={{ fontSize: 9 }}>Not booked</span>
          )}
        </div>
      </div>

      {/* Spark mini-trend */}
      <Spark data={client.trend} color={sc} height={22} width={56}/>

      {/* Score badge — CORRECT COLOR PSYCHOLOGY */}
      <div style={{ minWidth: 36, height: 36, borderRadius: 9, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
        background: `${sc}12`, border: `1px solid ${sc}25`,
        fontSize: 12.5, fontWeight: 800, color: sc,
        fontFamily: "'DM Mono', monospace" }}>{client.score}</div>

      {/* Action icons */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}
        onClick={e => e.stopPropagation()}>
        <div title="Message" onClick={() => onMsg(client)} style={{ width: 28, height: 28,
          borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.07)", color: D.t3, cursor: "pointer",
          fontSize: 13, transition: "all 0.12s",
          background: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = D.blueBdr; e.currentTarget.style.color = D.blue; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = D.t3; }}>
          ✉
        </div>
        <div title="Book" onClick={() => onBook(client)} style={{ width: 28, height: 28,
          borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.07)", color: D.t3, cursor: "pointer",
          fontSize: 12, transition: "all 0.12s", background: "transparent" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = D.greenBdr; e.currentTarget.style.color = D.green; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = D.t3; }}>
          ▣
        </div>
      </div>

      <span style={{ fontSize: 14, color: D.t4, flexShrink: 0, transition: "color 0.12s" }}>›</span>
    </div>
  );
}

/* ─── KPI BAR ─────────────────────────────────────────────────────────────────── */
function KpiBar({ clients, onFilterClick }) {
  const atRisk    = clients.filter(c => c.status === "at-risk").length;
  const notBooked = clients.filter(c => !c.booked).length;
  const active    = clients.filter(c => c.lastVisit.includes("Today") || c.lastVisit.includes("day")).length;
  const avgScore  = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.score, 0) / clients.length)
    : 0;
  const avgColor  = scoreColor(avgScore);

  const kpis = [
    { label: "Total Clients",   value: clients.length, sub: "on your roster",    sc: null, clickId: null },
    { label: "Active This Month", value: active,        sub: "visited recently",  sc: null, clickId: null },
    { label: "At Risk",         value: atRisk,          sub: "need follow-up",    sc: atRisk > 0 ? D.red : D.t3,   clickId: "at-risk" },
    { label: "Not Booked",      value: notBooked,       sub: "no upcoming session", sc: notBooked > 0 ? D.amber : D.t3, clickId: "not-booked" },
    { label: "Avg Score",       value: avgScore,        sub: scoreLabel(avgScore),  sc: avgColor, clickId: null },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10,
      padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: D.bgBase }}>
      {kpis.map((k, i) => (
        <div key={i} className={`kpi-card${k.clickId ? " clickable" : ""}`}
          onClick={k.clickId ? () => onFilterClick(k.clickId) : undefined}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: D.t4, textTransform: "uppercase",
            letterSpacing: "0.09em", marginBottom: 8 }}>{k.label}</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1,
            color: k.sc || D.t1, marginBottom: 5,
            fontFamily: i === 4 ? "'DM Mono', monospace" : "inherit" }}>{k.value}</div>
          <div style={{ fontSize: 10.5, color: k.sc ? `${k.sc}90` : D.t3 }}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── MAIN CLIENTS PAGE ──────────────────────────────────────────────────────── */
export default function ClientsPage({
  allMemberships, checkIns, bookings, assignedWorkouts, openModal, now,
}) {
  // Use real data if provided, else fall back to mock
  const clients = useMemo(() => {
    if (allMemberships?.length) {
      // Wire up your real buildClientFromMembership here
      return allMemberships.map(m => ({
        id: m.user_id, name: m.user_name || "Client",
        score: 65, trend: [60,61,62,63,64,65,65],
        status: "healthy", tier: "Standard", lastVisit: "—",
        vpw: 0, completion: 0, streak: 0, totalVisits: 0,
        booked: false, missedLast3: false, flags: [], notes: "",
        email: m.user_email || "—", phone: m.phone || "—",
        insights: [], activity: [],
      }));
    }
    return MOCK_CLIENTS;
  }, [allMemberships]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [search,       setSearch]       = useState("");
  const [sortBy,       setSortBy]       = useState("priority");
  const [selId,        setSelId]        = useState("c1");
  const [modal,        setModal]        = useState(null);
  const [toast,        setToast]        = useState(null);

  const showToast = msg => setToast(msg);
  const selClient = clients.find(c => c.id === selId) || null;

  const counts = useMemo(() => Object.fromEntries(
    FILTER_DEFS.map(f => [f.id, clients.filter(f.fn).length])
  ), [clients]);

  const filtered = useMemo(() => {
    const fDef = FILTER_DEFS.find(f => f.id === activeFilter);
    let list = fDef ? clients.filter(fDef.fn) : clients;
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    const pri = { "at-risk": 0, "needs-attention": 1, "healthy": 2 };
    if (sortBy === "priority")   return [...list].sort((a,b) => pri[a.status]-pri[b.status]);
    if (sortBy === "score-asc")  return [...list].sort((a,b) => a.score-b.score);
    if (sortBy === "score-desc") return [...list].sort((a,b) => b.score-a.score);
    if (sortBy === "name")       return [...list].sort((a,b) => a.name.localeCompare(b.name));
    return list;
  }, [clients, activeFilter, search, sortBy]);

  const groups = sortBy === "priority"
    ? [
        { key: "at-risk",         label: "At Risk",        color: D.red,   rows: filtered.filter(c => c.status === "at-risk") },
        { key: "needs-attention", label: "Needs Attention", color: D.amber, rows: filtered.filter(c => c.status !== "at-risk" && c.status !== "healthy") },
        { key: "healthy",         label: "Healthy",         color: D.green, rows: filtered.filter(c => c.status === "healthy") },
      ].filter(g => g.rows.length)
    : [{ key: "all", label: null, rows: filtered }];

  const openMsg  = c => { if (openModal) openModal("post",          { memberId: c.id }); else setModal({ type:"msg",  client:c }); };
  const openBook = c => { if (openModal) openModal("bookIntoClass", { memberId: c.id, memberName: c.name }); else setModal({ type:"book", client:c }); };

  return (
    <>
      <div className="cp" style={{ display: "flex", flexDirection: "column",
        height: "100vh", background: D.bgBase, overflow: "hidden" }}>

        {/* ── KPI BAR ── */}
        <KpiBar clients={clients} onFilterClick={setActiveFilter}/>

        {/* ── TOP CONTROLS ── */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "#0a1520", flexShrink: 0, display: "flex", alignItems: "center",
          gap: 10, flexWrap: "wrap" }}>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {FILTER_DEFS.map(f => (
              <div key={f.id}
                className={`filter-tab${activeFilter === f.id ? " active" : ""}${f.danger ? " danger" : ""}${f.warning ? " warning" : ""}`}
                onClick={() => setActiveFilter(f.id)}>
                {f.label}
                <span className="ct">{counts[f.id]}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }}/>

          {/* Search */}
          <div style={{ position: "relative", width: 220 }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)",
              color: D.t4, fontSize: 13, pointerEvents: "none" }}>⊙</span>
            <input className="search-input" placeholder="Search clients…"
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: "6px 10px", background: D.bgSurface,
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8,
            color: D.t2, fontFamily: "inherit", fontSize: 12, outline: "none",
            cursor: "pointer",
          }}>
            <option value="priority">Sort: Priority</option>
            <option value="score-asc">Score: Low → High</option>
            <option value="score-desc">Score: High → Low</option>
            <option value="name">Name A–Z</option>
          </select>

          {/* Export / new */}
          <button style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            color: D.t2, cursor: "pointer", fontFamily: "inherit" }}>↓ Export</button>
          <button style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: D.blue, border: "none", color: "#fff", cursor: "pointer",
            fontFamily: "inherit" }}>+ New Client</button>
        </div>

        {/* ── BODY SPLIT ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── LEFT: Client list ── */}
          <div className="cp-scroll" style={{ flex: 1, overflowY: "auto",
            padding: "14px 20px", display: "flex", flexDirection: "column", gap: 16,
            minWidth: 0 }}>

            {groups.map(g => (
              <div key={g.key}>
                {g.label && (
                  <div className="group-hdr" style={{ color: g.color }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%",
                      background: g.color, display: "inline-block", flexShrink: 0 }}/>
                    {g.label}
                    <span style={{ fontSize: 9, fontWeight: 700, color: g.color,
                      background: `${g.color}12`, border: `1px solid ${g.color}20`,
                      borderRadius: 999, padding: "1px 7px" }}>{g.rows.length}</span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {g.rows.map((c, i) => (
                    <div key={c.id} style={{ animationDelay: `${i * 0.03}s` }}>
                      <ClientRow
                        client={c}
                        selected={selId === c.id}
                        onClick={() => setSelId(selId === c.id ? null : c.id)}
                        onMsg={openMsg}
                        onBook={openBook}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div style={{ padding: "48px 0", textAlign: "center", color: D.t4, fontSize: 12.5 }}>
                <div style={{ fontSize: 22, opacity: 0.15, marginBottom: 8 }}>⊡</div>
                No clients match the current filter.
              </div>
            )}
          </div>

          {/* ── RIGHT: Detail panel ── */}
          <ClientDetailPanel
            client={selClient}
            onClose={() => setSelId(null)}
            onMsg={openMsg}
            onBook={openBook}
          />
        </div>
      </div>

      {/* ── MODALS ── */}
      {modal?.type === "msg"  && <MsgModal  client={modal.client} onClose={() => setModal(null)} onSend={showToast}/>}
      {modal?.type === "book" && <BookModal client={modal.client} onClose={() => setModal(null)} onSend={showToast}/>}

      {/* ── TOAST ── */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)}/>}
    </>
  );
}
