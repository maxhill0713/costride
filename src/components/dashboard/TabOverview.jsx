import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  TrendingDown, ArrowUpRight, Zap, CheckCircle, Trophy,
  UserPlus, QrCode, MessageSquarePlus, Pencil, Calendar,
  Activity, Users, AlertTriangle, ChevronRight, Minus,
  TrendingUp, Clock, BarChart2, Send, Heart,
  Sun, Moon, Sunrise, Coffee,
} from "lucide-react";

// ── Date helpers ──────────────────────────────────────────────────────────────
const NOW    = new Date();
const DAY_MS = 86400000;
const diffDays = (a, b) => Math.floor((a - b) / DAY_MS);
const DAYS_S = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAYS_L = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONS_S = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONS_L = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmtFull = d => `${DAYS_L[d.getDay()]}, ${MONS_L[d.getMonth()]} ${d.getDate()}`;
const fmtDay  = d => DAYS_S[d.getDay()];
const fmtMD   = d => `${MONS_S[d.getMonth()]} ${d.getDate()}`;

function getGreeting(h) {
  if (h < 5)  return { text: "Good night",     Icon: Moon    };
  if (h < 12) return { text: "Good morning",   Icon: Sunrise };
  if (h < 17) return { text: "Good afternoon", Icon: Sun     };
  return               { text: "Good evening",  Icon: Coffee  };
}

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONT_INJECT = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  button { font-family: inherit; cursor: pointer; border: none; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
`;

// ── Tokens ────────────────────────────────────────────────────────────────────
const T = {
  bg:         "#080e18",
  surface:    "#0c1422",
  surfaceEl:  "#101929",
  border:     "rgba(255,255,255,0.07)",
  borderEl:   "rgba(255,255,255,0.12)",
  divider:    "rgba(255,255,255,0.05)",
  shadow:     "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)",
  radius:     14,
  radiusSm:   9,
  mono:       "'JetBrains Mono', monospace",
  t1: "#f1f5f9", t2: "#94a3b8", t3: "#475569", t4: "#2d3f55",
  accent:     "#3b82f6",
  accentSub:  "rgba(59,130,246,0.09)",
  accentBrd:  "rgba(59,130,246,0.25)",
  success:    "#10b981",
  successSub: "rgba(16,185,129,0.07)",
  successBrd: "rgba(16,185,129,0.2)",
  warn:       "#f59e0b",
  warnSub:    "rgba(245,158,11,0.07)",
  warnBrd:    "rgba(245,158,11,0.2)",
  danger:     "#ef4444",
  dangerSub:  "rgba(239,68,68,0.07)",
  dangerBrd:  "rgba(239,68,68,0.2)",
};

// ── Recharts axis tick ────────────────────────────────────────────────────────
const tick = { fill: T.t3, fontSize: 10, fontFamily: "inherit" };

// ── Mock data ─────────────────────────────────────────────────────────────────
const chartDays7 = Array.from({ length: 7 }, (_, i) => ({
  day:   fmtDay(new Date(NOW.getTime() - (6 - i) * DAY_MS)),
  value: [3, 1, 2, 4, 3, 5, 0][i],
}));
const chartDays30 = Array.from({ length: 30 }, (_, i) => ({
  day:   fmtMD(new Date(NOW.getTime() - (29 - i) * DAY_MS)),
  value: [0,2,1,0,3,5,4,2,0,1,3,4,5,0,2,1,0,3,2,1,4,3,2,5,4,3,2,1,0,0][i],
}));

const MOCK = {
  owner: "Max",
  gym:   "Foundry Gym",
  metrics: {
    todayCI:        0,
    yesterdayCI:    5,
    todayVsYest:   -100,
    activeThisWeek: 1,
    totalMembers:   4,
    retentionRate:  75,
    newSignUps:     2,
    cancelledEst:   0,
    atRisk:         2,
    sparkData:      [3,1,2,4,3,5,0],
    monthCiPer:     [15, 8, 3, 2, 6],
  },
  atRiskMembers: [
    { user_id:1, name:"Emily R.",  daysSinceVisit:10, plan:"Premium"  },
    { user_id:2, name:"Alex D.",   daysSinceVisit:16, plan:"Standard" },
    { user_id:3, name:"Jordan T.", daysSinceVisit:21, plan:"Premium"  },
  ],
  week1ReturnRate:    { returned:1, didnt:1, names:["Alex D."] },
  retentionBreakdown: { week1:1, week2to4:1, month2to3:0, beyond:0 },
  monthGrowthData: [
    {label:"Sep",value:1},{label:"Oct",value:2},{label:"Nov",value:1},
    {label:"Dec",value:0},{label:"Jan",value:2},{label:"Feb",value:1},{label:"Mar",value:2},
  ],
  checkIns: [
    { check_in_date: new Date(NOW.getTime() - 5*60000).toISOString(),    user_id:4 },
    { check_in_date: new Date(NOW.getTime() - 1*DAY_MS).toISOString(),   user_id:5 },
    { check_in_date: new Date(NOW.getTime() - 2*DAY_MS).toISOString(),   user_id:4 },
  ],
  allMemberships:  [{id:1},{id:2},{id:3},{id:4}],
  challenges:      [],
  posts:           [],
  newNoReturnCount: 1,
  recentActivity:  [
    { user_id:4, name:"Sam K.",   action:"checked in",         time: new Date(NOW.getTime() - 5*60000)    },
    { user_id:5, name:"Priya M.", action:"joined as a member", time: new Date(NOW.getTime() - 6*DAY_MS)   },
    { user_id:1, name:"Emily R.", action:"last seen",          time: new Date(NOW.getTime() - 10*DAY_MS)  },
    { user_id:2, name:"Alex D.",  action:"went inactive",      time: new Date(NOW.getTime() - 16*DAY_MS)  },
  ],
};

// ── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style = {}, accentLeft }) {
  return (
    <div style={{
      borderRadius: T.radius,
      background:   T.surface,
      border:       `1px solid ${T.border}`,
      borderLeft:   accentLeft ? `3px solid ${accentLeft}` : undefined,
      boxShadow:    T.shadow,
      padding:      "20px 22px",
      overflow:     "hidden",
      position:     "relative",
      animation:    "fadeIn .3s ease both",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Label — exact TabOverview spec ────────────────────────────────────────────
function Label({ children, style = {} }) {
  return (
    <div style={{
      fontSize:      10.5,
      fontWeight:    700,
      color:         T.t3,
      textTransform: "uppercase",
      letterSpacing: ".13em",
      marginBottom:  10,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Divider({ style = {} }) {
  return <div style={{ height:"1px", background:T.divider, margin:"14px 0", ...style }} />;
}

// ── Avatar — neutral container, initials from name ────────────────────────────
function Avatar({ name = "", size = 28 }) {
  const initials = name.split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
  return (
    <div style={{
      width:          size, height: size, borderRadius: "50%",
      background:     T.surfaceEl, border: `1px solid ${T.border}`,
      display:        "flex", alignItems: "center", justifyContent: "center",
      fontSize:       Math.round(size * 0.32), fontWeight: 600,
      color:          T.t3, fontFamily: T.mono, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── RingChart — inline SVG ────────────────────────────────────────────────────
function RingChart({ pct, size = 44, stroke = 3.5, color }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.divider} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size*0.22} fontWeight={700} fill={color} fontFamily="inherit">{pct}%</text>
    </svg>
  );
}

// ── Btn ───────────────────────────────────────────────────────────────────────
function Btn({ children, variant = "ghost", size = "sm", onClick, style = {}, disabled = false }) {
  const pad = size === "sm" ? "5px 11px" : "7px 15px";
  const fs  = size === "sm" ? 11 : 12;
  const V = {
    ghost:   { background: T.surfaceEl,  color: T.t2,     border: `1px solid ${T.border}` },
    danger:  { background: T.dangerSub,  color: T.danger,  border: `1px solid ${T.dangerBrd}` },
    warn:    { background: T.warnSub,    color: T.warn,    border: `1px solid ${T.warnBrd}` },
    success: { background: T.successSub, color: T.success, border: `1px solid ${T.successBrd}` },
    accent:  { background: T.accentSub,  color: T.accent,  border: `1px solid ${T.accentBrd}` },
    primary: { background: T.accent,     color: "#fff",    border: "none" },
  };
  return (
    <button disabled={disabled} onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", gap:5, padding:pad, borderRadius:T.radiusSm, fontFamily:"inherit", fontWeight:600, fontSize:fs, transition:"all .15s", outline:"none", letterSpacing:".01em", opacity:disabled?0.4:1, cursor:disabled?"default":"pointer", ...V[variant], ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.72"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = "1";    }}
    >
      {children}
    </button>
  );
}

// ── Mini Sparkline ────────────────────────────────────────────────────────────
function MiniSpark({ data = [], width = 64, height = 26 }) {
  if (!data || data.length < 2) return <div style={{ width, height }}/>;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const f = pts.split(" ")[0], l = pts.split(" ").slice(-1)[0];
  const area = `${f.split(",")[0]},${height} ${pts} ${l.split(",")[0]},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display:"block", flexShrink:0 }}>
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={T.accent} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={T.accent} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spk)"/>
      <polyline points={pts} fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Recharts tooltip ──────────────────────────────────────────────────────────
function Tip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#060c18", border:`1px solid ${T.borderEl}`, borderRadius:8, padding:"7px 11px", boxShadow:"0 6px 20px rgba(0,0,0,0.5)" }}>
      <p style={{ color:T.t3, fontSize:10, fontWeight:500, margin:"0 0 2px" }}>{label}</p>
      <p style={{ color:T.t1, fontWeight:700, fontSize:14, margin:0 }}>{payload[0].value}{unit}</p>
    </div>
  );
}

// ── Signal — 3px left border is the ONLY color. Surface stays neutral. ────────
function Signal({ color, icon: Icon, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ padding:"10px 12px", borderRadius:T.radiusSm, background:hov && onAction ? T.surfaceEl : T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${color}`, marginBottom:last?0:6, cursor:onAction?"pointer":"default", transition:"background .15s" }}
      onClick={onAction}
      onMouseEnter={() => onAction && setHov(true)}
      onMouseLeave={() => onAction && setHov(false)}
    >
      <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
        {Icon && <Icon style={{ width:12, height:12, color, flexShrink:0, marginTop:2 }}/>}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.t1, lineHeight:1.3, marginBottom:2 }}>{title}</div>
          <div style={{ fontSize:11, color:T.t3, lineHeight:1.45 }}>{detail}</div>
        </div>
        {action && (
          <span style={{ fontSize:10, fontWeight:600, color, flexShrink:0, whiteSpace:"nowrap", marginTop:1, display:"flex", alignItems:"center", gap:2 }}>
            {action} <ChevronRight style={{ width:9, height:9 }}/>
          </span>
        )}
      </div>
    </div>
  );
}

// ── StatNudge — surfaceEl bg, 2px left border is only color ──────────────────
function StatNudge({ color = T.accent, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{ marginTop:12, display:"flex", alignItems:"flex-start", gap:9, padding:"9px 11px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, borderLeft:`2px solid ${color}` }}>
      {Icon && <Icon style={{ width:11, height:11, color, flexShrink:0, marginTop:1 }}/>}
      <div style={{ flex:1, minWidth:0 }}>
        <span style={{ fontSize:11, fontWeight:600, color:T.t1 }}>{stat} </span>
        <span style={{ fontSize:11, color:T.t3, lineHeight:1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={onAction} style={{ flexShrink:0, fontSize:10, fontWeight:600, color, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:2, padding:0 }}>
          {action} <ChevronRight style={{ width:9, height:9 }}/>
        </button>
      )}
    </div>
  );
}

// ── Priority Item (needs own useState) ───────────────────────────────────────
function PriorityItem({ p }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={p.onAction}
      style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", borderRadius:T.radiusSm, background:hov ? T.surfaceEl : "rgba(255,255,255,0.015)", border:`1px solid ${hov ? T.borderEl : T.border}`, borderLeft:`3px solid ${p.color}`, cursor:p.onAction ? "pointer" : "default", transition:"all .15s" }}
    >
      {/* Icon container — neutral */}
      <div style={{ width:30, height:30, borderRadius:8, background:T.surfaceEl, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {p.Icon && <p.Icon style={{ width:13, height:13, color:p.color }}/>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12.5, fontWeight:600, color:T.t1, lineHeight:1.3, marginBottom:3 }}>{p.title}</div>
        <div style={{ fontSize:11, color:T.t3, lineHeight:1.45 }}>{p.detail}</div>
        {p.impact && (
          <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:5, fontSize:10, fontWeight:600, color:p.color, background:`${p.color}10`, border:`1px solid ${p.color}22`, borderRadius:5, padding:"2px 7px" }}>
            {p.impact}
          </div>
        )}
      </div>
      {p.cta && (
        <button
          onClick={e => { e.stopPropagation(); p.onAction?.(); }}
          style={{ flexShrink:0, fontSize:10.5, fontWeight:600, color:p.color, background:`${p.color}10`, border:`1px solid ${p.color}22`, borderRadius:7, padding:"5px 12px", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}
        >
          {p.cta} <ChevronRight style={{ width:9, height:9 }}/>
        </button>
      )}
    </div>
  );
}

// ── Priority Action Panel ─────────────────────────────────────────────────────
function PriorityActionPanel({ priorities = [] }) {
  if (!priorities.length) return null;
  return (
    <Card style={{ padding:"20px 22px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
        <Zap style={{ width:13, height:13, color:T.accent }}/>
        <Label style={{ marginBottom:0 }}>Today's Priorities</Label>
        <span style={{ marginLeft:"auto", fontSize:10, fontWeight:600, color:T.t3, background:T.surfaceEl, border:`1px solid ${T.border}`, borderRadius:6, padding:"2px 8px" }}>
          {priorities.length} action{priorities.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {priorities.map((p, i) => <PriorityItem key={i} p={p}/>)}
      </div>
    </Card>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
// Value = t1 by default. Semantic color only when threshold crossed.
function KpiCard({ label, value, valueSuffix, sub, subTrend, subContext, sparkData, ring, ringColor, valueColor, cta, onCta, insight }) {
  const trendColor = subTrend === "up" ? T.success : subTrend === "down" ? T.danger : T.t3;
  const TrendIcon  = subTrend === "up" ? ArrowUpRight : subTrend === "down" ? TrendingDown : Minus;
  const showRing   = ring != null && ring > 5 && ring < 98;
  return (
    <div style={{ borderRadius:T.radius, padding:"16px 18px", background:T.surface, border:`1px solid ${T.border}`, boxShadow:T.shadow, display:"flex", flexDirection:"column" }}>
      <Label>{label}</Label>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:10 }}>
        <div>
          <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
            <span style={{ fontSize:34, fontWeight:700, color:valueColor || T.t1, lineHeight:1, letterSpacing:"-0.04em" }}>{value}</span>
            {valueSuffix && <span style={{ fontSize:13, color:T.t3 }}>{valueSuffix}</span>}
          </div>
          {sub && (
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:6 }}>
              <TrendIcon style={{ width:10, height:10, color:trendColor, flexShrink:0 }}/>
              <span style={{ fontSize:11, fontWeight:500, color:trendColor, lineHeight:1.3 }}>{sub}</span>
            </div>
          )}
          {subContext && <div style={{ fontSize:10, color:T.t3, marginTop:3, lineHeight:1.4 }}>{subContext}</div>}
        </div>
        {showRing
          ? <RingChart pct={ring} size={44} stroke={3.5} color={ringColor || T.accent}/>
          : sparkData?.some(v => v > 0) ? <MiniSpark data={sparkData}/>
          : null
        }
      </div>
      {insight && (
        <div style={{ fontSize:10, color:T.t3, lineHeight:1.45, padding:"6px 0 2px", borderTop:`1px solid ${T.divider}`, marginTop:"auto", fontStyle:"italic" }}>
          {insight}
        </div>
      )}
      {cta && onCta && (
        <button onClick={onCta} style={{ marginTop:8, width:"100%", padding:"6px 10px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.borderEl}`, color:T.t1, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
          {cta} <ChevronRight style={{ width:10, height:10 }}/>
        </button>
      )}
    </div>
  );
}

// ── At-Risk Preview ───────────────────────────────────────────────────────────
function AtRiskPreview({ members = [], onMessage, onViewAll }) {
  const shown = members.slice(0, 4);
  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <Label style={{ marginBottom:2 }}>At-Risk Members</Label>
          <div style={{ fontSize:11, color:T.t4 }}>No visit in 14+ days</div>
        </div>
        <button onClick={onViewAll} style={{ fontSize:11, fontWeight:500, color:T.t3, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:3, fontFamily:"inherit" }}>
          View all <ChevronRight style={{ width:11, height:11 }}/>
        </button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {shown.map((m, i) => {
          const riskColor = m.daysSinceVisit >= 21 ? T.danger : T.warn;
          const riskLabel = m.daysSinceVisit >= 21 ? "High" : "Med";
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}` }}>
              <Avatar name={m.name} size={28}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                <div style={{ fontSize:10, color:T.t3, marginTop:1, fontFamily:T.mono }}>
                  Last visit {m.daysSinceVisit}d ago · {m.plan}
                </div>
              </div>
              {/* Semantic label — no colored background chip on the container */}
              <span style={{ fontSize:9, fontWeight:700, color:riskColor, background:`${riskColor}10`, border:`1px solid ${riskColor}22`, borderRadius:5, padding:"2px 7px", flexShrink:0, textTransform:"uppercase", letterSpacing:".05em" }}>
                {riskLabel}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onMessage?.(m); }}
                style={{ flexShrink:0, padding:"4px 9px", borderRadius:6, background:"transparent", border:`1px solid ${T.borderEl}`, color:T.t2, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:3, transition:"all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.color = T.t1; e.currentTarget.style.borderColor = T.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.t2; e.currentTarget.style.borderColor = T.borderEl; }}
              >
                <Send style={{ width:9, height:9 }}/> Message
              </button>
            </div>
          );
        })}
      </div>
      <StatNudge color={T.danger} icon={Heart}
        stat="Direct outreach works."
        detail="A personal message is the most effective way to bring back lapsed members — response rates are significantly higher in the first 48h."
        action="Send messages" onAction={onMessage}
      />
    </Card>
  );
}

// ── Today Actions (sidebar signals) ──────────────────────────────────────────
function TodayActions({ atRisk, checkIns, allMemberships, posts, challenges, now, newNoReturnCount = 0, onMessage, onViewMembers }) {
  const signals = useMemo(() => {
    const items = [];
    if (newNoReturnCount > 0) {
      items.push({ priority:1, color:T.danger, Icon:UserPlus, title:`${newNoReturnCount} new member${newNoReturnCount>1?"s":""} haven't returned`, detail:"Joined 1–2 weeks ago, no second visit. Week-1 follow-up has the highest retention impact.", action:"Follow up", fn: onMessage });
    }
    if (atRisk > 0) {
      const pct = allMemberships.length > 0 ? Math.round((atRisk / allMemberships.length) * 100) : 0;
      items.push({ priority:2, color:atRisk>=5?T.danger:T.warn, Icon:AlertTriangle, title:`${atRisk} member${atRisk>1?"s":""} inactive for 14+ days`, detail:`${pct}% of your gym. Direct outreach is the most effective re-engagement method.`, action:"View & message", fn: onViewMembers });
    }
    const hasChallenge = (challenges||[]).some(c => !c.ended_at);
    if (!hasChallenge) {
      items.push({ priority:3, color:T.warn, Icon:Trophy, title:"No active challenge", detail:"Members with an active goal tend to visit more consistently.", action:"Create one", fn: () => {} });
    }
    const recentPost = (posts||[]).find(p => diffDays(now, new Date(p.created_at||now)) <= 7);
    if (!recentPost) {
      items.push({ priority:4, color:T.warn, Icon:MessageSquarePlus, title:"No community posts yet", detail:"Regular posts lift engagement scores. Try a motivational post or a poll.", action:"Post now", fn: () => {} });
    }
    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date);
      return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
    }).length;
    if (todayCount === 0 && now.getHours() >= 10) {
      items.push({ priority:5, color:T.warn, Icon:QrCode, title:"No check-ins recorded today", detail:"Check-ins usually start arriving by 9–10am. Scanner issue?", action:"Check scanner", fn: () => {} });
    }
    return items.sort((a,b) => a.priority - b.priority).slice(0,5);
  }, [atRisk, allMemberships.length, newNoReturnCount, posts?.length, challenges?.length]);

  const positives = useMemo(() => {
    const items = [];
    if (atRisk === 0) items.push("All members active");
    if ((challenges||[]).some(c => !c.ended_at)) items.push("Active challenge running");
    return items.slice(0,2);
  }, [atRisk, challenges?.length]);

  const urgentCount = signals.filter(s => s.color === T.danger).length;

  return (
    <Card style={{ padding:"20px 22px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
        <Label style={{ marginBottom:0 }}>Action Items</Label>
        {signals.length > 0 && (
          <span style={{ fontSize:10, fontWeight:700, color:urgentCount>0?T.danger:T.t3, background:urgentCount>0?T.dangerSub:"transparent", border:`1px solid ${urgentCount>0?T.dangerBrd:T.border}`, borderRadius:6, padding:"1px 7px" }}>
            {signals.length} pending
          </span>
        )}
      </div>
      <div style={{ fontSize:11, color:T.t4, marginBottom:14 }}>Sorted by urgency</div>

      {signals.length === 0 ? (
        <div style={{ padding:"11px 13px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.success}`, display:"flex", alignItems:"center", gap:8 }}>
          <CheckCircle style={{ width:12, height:12, color:T.success, flexShrink:0 }}/>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:T.t1 }}>All clear today</div>
            <div style={{ fontSize:11, color:T.t3, marginTop:1 }}>No immediate actions needed</div>
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column" }}>
          {signals.map((s, i) => (
            <Signal key={i} color={s.color} icon={s.Icon} title={s.title} detail={s.detail} action={s.action} onAction={s.fn} last={i===signals.length-1}/>
          ))}
        </div>
      )}

      {positives.length > 0 && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.divider}` }}>
          {positives.map((p,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:i<positives.length-1?4:0 }}>
              <CheckCircle style={{ width:10, height:10, color:T.success, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:T.success }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Retention Breakdown ───────────────────────────────────────────────────────
function RetentionBreakdown({ breakdown = {}, onViewAll }) {
  const rows = [
    { label:"New — went quiet", sub:"Joined <2 wks, no return", val:breakdown.week1||0,     urgentColor:T.danger },
    { label:"Early drop-off",   sub:"Weeks 2–4 inactivity",     val:breakdown.week2to4||0,  urgentColor:T.warn   },
    { label:"Month 2–3 slip",   sub:"Common churn window",      val:breakdown.month2to3||0, urgentColor:T.warn   },
    { label:"Long inactive",    sub:"21+ days absent",          val:breakdown.beyond||0,    urgentColor:T.t3     },
  ];
  const total = rows.reduce((s,r) => s+r.val, 0);
  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <Label style={{ marginBottom:2 }}>Drop-off Risk</Label>
          <div style={{ fontSize:11, color:T.t4 }}>Where members go quiet</div>
        </div>
        <button onClick={onViewAll} style={{ fontSize:11, fontWeight:500, color:T.t3, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:3, fontFamily:"inherit" }}>
          View all <ChevronRight style={{ width:11, height:11 }}/>
        </button>
      </div>

      {total === 0 ? (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.success}` }}>
          <CheckCircle style={{ width:12, height:12, color:T.success, flexShrink:0 }}/>
          <span style={{ fontSize:12, color:T.t2 }}>No drop-off risks detected</span>
        </div>
      ) : rows.map((r, i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<rows.length-1?`1px solid ${T.divider}`:"none" }}>
          <div>
            <span style={{ fontSize:12, fontWeight:500, color:r.val>0?T.t1:T.t3 }}>{r.label}</span>
            <span style={{ fontSize:10, color:T.t3, marginLeft:7 }}>{r.sub}</span>
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:r.val>0?r.urgentColor:T.t4 }}>{r.val}</span>
        </div>
      ))}

      {(breakdown.week1||0) > 0 && (
        <StatNudge color={T.danger} icon={AlertTriangle}
          stat={`${breakdown.week1} new member${breakdown.week1>1?"s":""} went quiet immediately.`}
          detail="The first 7 days are critical — members who don't return in week 1 are far less likely to become regulars."
          action="Follow up" onAction={onViewAll}/>
      )}
      {(breakdown.week1||0) === 0 && total > 0 && (
        <StatNudge color={T.success} icon={CheckCircle}
          stat="No immediate drop-offs."
          detail="Keep it up — the month 2–3 window is the next common drop-off point to watch."/>
      )}
    </Card>
  );
}

// ── Week-1 Return Rate ────────────────────────────────────────────────────────
function WeekOneReturn({ week1ReturnRate = {}, onMessage }) {
  const { returned=0, didnt=0, names=[] } = week1ReturnRate;
  const total    = returned + didnt;
  const pct      = total > 0 ? Math.round((returned / total) * 100) : 0;
  const pctColor = total === 0 ? T.t3 : pct >= 60 ? T.success : pct >= 40 ? T.t1 : T.danger;
  return (
    <Card>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <Label style={{ marginBottom:2 }}>Week-1 Return Rate</Label>
          <div style={{ fontSize:11, color:T.t4 }}>New members, joined 1–3 weeks ago</div>
        </div>
        <div style={{ fontSize:28, fontWeight:700, color:pctColor, letterSpacing:"-0.04em", lineHeight:1, fontFamily:T.mono }}>
          {total === 0 ? "—" : `${pct}%`}
        </div>
      </div>

      {total === 0 ? (
        <p style={{ fontSize:12, color:T.t3, margin:0 }}>No members in the 1–3 week window yet.</p>
      ) : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
            {[
              { count:returned, label:"Came back",     color:returned>0?T.success:T.t4 },
              { count:didnt,    label:"Didn't return",  color:didnt>0?T.danger:T.t4    },
            ].map((cell,i) => (
              <div key={i} style={{ padding:"10px 12px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:700, color:cell.color, letterSpacing:"-0.03em", fontFamily:T.mono }}>{cell.count}</div>
                <div style={{ fontSize:10, color:T.t3, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{cell.label}</div>
              </div>
            ))}
          </div>
          {didnt > 0 && names.length > 0 && (
            <div style={{ marginBottom:12, padding:"9px 11px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.danger}` }}>
              <div style={{ fontSize:11, color:T.t2, marginBottom:5, lineHeight:1.5 }}>
                {names.join(", ")}{didnt > 3 ? ` +${didnt-3} more` : ""} — no return visit yet
              </div>
              <button onClick={() => onMessage?.()} style={{ fontSize:11, fontWeight:600, color:T.danger, background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:3, fontFamily:"inherit" }}>
                Send follow-up <ChevronRight style={{ width:10, height:10 }}/>
              </button>
            </div>
          )}
          <StatNudge
            color={pct >= 60 ? T.success : T.danger}
            icon={pct >= 60 ? CheckCircle : AlertTriangle}
            stat={pct >= 60 ? "Strong week-1 retention." : "Week-1 follow-ups work."}
            detail={pct >= 60
              ? "Members who return in week 1 are significantly more likely to become long-term regulars."
              : "A personal message in the first week is the single highest-impact action for week-1 retention."
            }
            action={didnt > 0 ? "Message now" : undefined}
            onAction={didnt > 0 ? onMessage : undefined}
          />
        </>
      )}
    </Card>
  );
}

// ── Engagement Breakdown ──────────────────────────────────────────────────────
function EngagementBreakdown({ monthCiPer = [], totalMembers, atRisk, onViewMembers }) {
  const rows = [
    { label:"Super active", sub:"12+ visits/mo", val:(monthCiPer).filter(v => v>=12).length,           dotColor:T.success },
    { label:"Active",       sub:"4–11 visits",   val:(monthCiPer).filter(v => v>=4 && v<12).length,    dotColor:T.accent  },
    { label:"Occasional",   sub:"1–3 visits",    val:(monthCiPer).filter(v => v>=1 && v<4).length,     dotColor:T.accent  },
    { label:"At risk",      sub:"14+ days away", val:atRisk,                                            dotColor:T.danger  },
  ];
  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <Label style={{ marginBottom:0 }}>Engagement Split</Label>
        <button onClick={onViewMembers} style={{ fontSize:11, fontWeight:500, color:T.t3, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:3, fontFamily:"inherit" }}>
          Members <ChevronRight style={{ width:11, height:11 }}/>
        </button>
      </div>
      {rows.map((r,i) => {
        const pct = totalMembers > 0 ? Math.round((r.val / totalMembers) * 100) : 0;
        return (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<rows.length-1?`1px solid ${T.divider}`:"none" }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:r.val>0?r.dotColor:T.t4, flexShrink:0 }}/>
            <span style={{ fontSize:12, fontWeight:500, color:r.val>0?T.t1:T.t3, flex:1 }}>{r.label}</span>
            <span style={{ fontSize:11, color:T.t3, marginRight:8 }}>{r.sub}</span>
            <span style={{ fontSize:13, fontWeight:700, color:r.val>0?r.dotColor:T.t4, minWidth:20, textAlign:"right", fontFamily:T.mono }}>{r.val}</span>
            <span style={{ fontSize:10, color:T.t3, minWidth:26, textAlign:"right", fontFamily:T.mono }}>{pct}%</span>
          </div>
        );
      })}
      {atRisk > 0 && (
        <StatNudge color={T.danger} icon={AlertTriangle}
          stat={`${atRisk} member${atRisk>1?"s":""} at risk.`}
          detail="Early outreach is most effective — the longer a lapsed member waits, the harder it is to re-engage."
          action="View members" onAction={onViewMembers}/>
      )}
      {atRisk === 0 && totalMembers >= 3 && (
        <StatNudge color={T.success} icon={CheckCircle}
          stat="All members active."
          detail="Active gyms maintain this by running a challenge every 6–8 weeks."/>
      )}
    </Card>
  );
}

// ── Activity Feed ─────────────────────────────────────────────────────────────
// Icon containers all neutral — no per-type color injection
function ActivityFeed({ items = [], now }) {
  if (!items.length) return (
    <Card>
      <Label>Recent Activity</Label>
      <div style={{ padding:"20px 0", textAlign:"center" }}>
        <Activity style={{ width:18, height:18, color:T.t3, margin:"0 auto 8px", display:"block", opacity:0.4 }}/>
        <p style={{ fontSize:12, color:T.t3, margin:"0 0 3px", fontWeight:500 }}>No activity yet today</p>
        <p style={{ fontSize:11, color:T.t3, margin:0, opacity:0.7 }}>Typical peak is 5–7pm</p>
      </div>
    </Card>
  );
  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
        <Label style={{ marginBottom:0 }}>Recent Activity</Label>
        <Btn variant="ghost" size="sm">All →</Btn>
      </div>
      <div style={{ marginTop:12 }}>
        {items.slice(0,6).map((a, i) => {
          const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
          const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo/60)}h ago` : `${Math.floor(minsAgo/1440)}d ago`;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:i<Math.min(items.length,6)-1?`1px solid ${T.divider}`:"none" }}>
              <Avatar name={a.name} size={26}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:T.t1, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  <span style={{ fontWeight:600 }}>{a.name}</span>
                  <span style={{ color:T.t2 }}> {a.action}</span>
                </div>
              </div>
              <span style={{ fontSize:10, color:T.t3, flexShrink:0, fontFamily:T.mono }}>{timeStr}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Member Growth Card ────────────────────────────────────────────────────────
function MemberGrowthCard({ newSignUps, cancelledEst, retentionRate, monthGrowthData }) {
  const hasData = (monthGrowthData||[]).filter(d => d.value > 0).length >= 2;
  const net      = newSignUps - cancelledEst;
  const retColor = retentionRate >= 70 ? T.success : retentionRate < 50 ? T.danger : T.t2;
  return (
    <Card>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <Label style={{ marginBottom:4 }}>Member Growth</Label>
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontSize:26, fontWeight:700, color:T.t1, letterSpacing:"-0.04em", fontFamily:T.mono }}>
              {newSignUps > 0 ? `+${newSignUps}` : newSignUps}
            </span>
            <span style={{ fontSize:12, color:T.t3 }}>this month</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <div style={{ padding:"3px 9px", borderRadius:6, background:retentionRate>=70?T.successSub:T.surfaceEl, border:`1px solid ${retentionRate>=70?T.successBrd:T.border}`, fontSize:11, fontWeight:600, color:retColor }}>
            {retentionRate}% retained
          </div>
          {cancelledEst > 0 && (
            <div style={{ padding:"3px 9px", borderRadius:6, background:T.dangerSub, border:`1px solid ${T.dangerBrd}`, fontSize:11, fontWeight:600, color:T.danger }}>
              {cancelledEst} left
            </div>
          )}
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={monthGrowthData} barSize={18} margin={{ top:4, right:4, left:-8, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false}/>
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false}/>
            <YAxis tick={tick} axisLine={false} tickLine={false} width={28} allowDecimals={false}/>
            <Tooltip content={<Tip unit=" members"/>} cursor={{ fill:"rgba(255,255,255,0.02)" }}/>
            <Bar dataKey="value" fill={T.accent} fillOpacity={0.75} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height:110, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRadius:T.radiusSm, background:T.surfaceEl, gap:5 }}>
          <div style={{ fontSize:12, color:T.t3 }}>Chart populates as data grows</div>
          <div style={{ fontSize:11, color:T.t3, opacity:0.7 }}>Check back next month for trends</div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", marginTop:12, paddingTop:12, borderTop:`1px solid ${T.divider}` }}>
        {[
          { label:"New",       value:newSignUps,                         color:newSignUps>0?T.success:T.t1 },
          { label:"Cancelled", value:cancelledEst,                       color:cancelledEst>0?T.danger:T.t4 },
          { label:"Net",       value:`${net>=0?"+":""}${net}`,            color:net<0?T.danger:T.t1 },
        ].map((s,i) => (
          <div key={i} style={{ textAlign:"center", padding:"0 8px", borderRight:i<2?`1px solid ${T.divider}`:"none" }}>
            <div style={{ fontSize:18, fontWeight:700, color:s.color, letterSpacing:"-0.03em", fontFamily:T.mono }}>{s.value}</div>
            <div style={{ fontSize:10, color:T.t3, marginTop:3, textTransform:"uppercase", letterSpacing:".05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {retentionRate < 70 ? (
        <StatNudge color={T.danger} icon={TrendingDown}
          stat={`${retentionRate}% retention — below the 70% healthy threshold.`}
          detail="70% is the healthy baseline. The highest-impact habit: personally welcoming every new member in their first week."/>
      ) : newSignUps > 0 ? (
        <StatNudge color={T.success} icon={TrendingUp}
          stat={`+${newSignUps} new member${newSignUps>1?"s":""} this month.`}
          detail="Early habit formation matters — new members who visit frequently in their first weeks are far more likely to stick."/>
      ) : null}
    </Card>
  );
}

// ── Check-in Activity Chart (recharts) ────────────────────────────────────────
function CheckInChart({ chartDays = [], chartRange, setChartRange, now }) {
  const todayLabel = chartRange <= 7 ? fmtDay(now) : fmtMD(now);

  const weeklyAvg = useMemo(() => {
    if (!chartDays.length) return 0;
    return (chartDays.reduce((a,b) => a+b.value, 0) / chartDays.length).toFixed(1);
  }, [chartDays]);

  const todayVal = chartDays.find(d => d.day === todayLabel)?.value ?? 0;
  const chartMax = Math.max(...chartDays.map(d => d.value), 1);
  const weekVals = chartDays.map(d => d.value).filter(v => v > 0);
  const isLowest  = todayVal > 0 && weekVals.length > 1 && todayVal <= Math.min(...weekVals);
  const isHighest = todayVal > 0 && weekVals.length > 1 && todayVal >= Math.max(...weekVals);
  const peakHour  = now.getHours() >= 17 && now.getHours() <= 19;

  return (
    <Card style={{ padding:"20px 20px 16px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div>
          <Label style={{ marginBottom:4 }}>Check-in Activity</Label>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <div style={{ fontSize:11, color:T.t4 }}>
              Daily avg <span style={{ fontWeight:600, color:T.t2, fontFamily:T.mono }}>{weeklyAvg}</span>
            </div>
            {todayVal > 0 && <>
              <div style={{ width:3, height:3, borderRadius:"50%", background:T.t4 }}/>
              <div style={{ fontSize:11, color:T.t4 }}>
                Today <span style={{ fontWeight:600, color:T.accent, fontFamily:T.mono }}>{todayVal}</span>
              </div>
            </>}
            {peakHour && <>
              <div style={{ width:3, height:3, borderRadius:"50%", background:T.t4 }}/>
              <div style={{ fontSize:10, color:T.warn, fontWeight:500 }}>Peak activity now</div>
            </>}
            {todayVal === 0 && now.getHours() < 10 && (
              <div style={{ fontSize:10, color:T.t4, fontStyle:"italic" }}>Peak usually 5–7pm</div>
            )}
          </div>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {[{val:7,label:"7D"},{val:30,label:"30D"}].map(r => (
            <button key={r.val} onClick={() => setChartRange(r.val)} style={{
              fontSize:11, fontWeight:chartRange===r.val?700:400, padding:"4px 12px", borderRadius:T.radiusSm, cursor:"pointer",
              background:chartRange===r.val?T.surfaceEl:"rgba(255,255,255,0.03)",
              color:chartRange===r.val?T.t1:T.t3,
              border:`1px solid ${chartRange===r.val?T.borderEl:T.border}`, transition:"all .15s",
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={184}>
        <BarChart data={chartDays} margin={{ top:4, right:4, left:-8, bottom:0 }} barSize={chartRange<=7?20:8}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false}/>
          <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} interval={chartRange<=7?0:4}/>
          <YAxis tick={tick} axisLine={false} tickLine={false} width={28} allowDecimals={false} domain={[0,Math.max(chartMax+1,5)]}/>
          <Tooltip
            cursor={{ fill:"rgba(255,255,255,0.02)" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const isToday = label === todayLabel;
              const val     = payload[0].value;
              const avg     = parseFloat(weeklyAvg);
              const vsAvg   = avg > 0 ? Math.round(((val-avg)/avg)*100) : 0;
              return (
                <div style={{ background:"#060c18", border:`1px solid ${T.borderEl}`, borderRadius:T.radiusSm, padding:"8px 12px", boxShadow:"0 8px 24px rgba(0,0,0,0.5)", minWidth:120 }}>
                  <div style={{ fontSize:10, fontWeight:600, color:isToday?T.accent:T.t3, letterSpacing:".13em", textTransform:"uppercase", marginBottom:4 }}>
                    {isToday ? "Today" : label}
                  </div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.t1, letterSpacing:"-0.03em", marginBottom:3, fontFamily:T.mono }}>
                    {val} <span style={{ fontSize:10, fontWeight:400, color:T.t3 }}>check-ins</span>
                  </div>
                  {avg > 0 && val > 0 && (
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      {vsAvg >= 0
                        ? <TrendingUp style={{ width:9, height:9, color:T.success }}/>
                        : <TrendingDown style={{ width:9, height:9, color:T.danger }}/>
                      }
                      <span style={{ fontSize:10, fontWeight:600, color:vsAvg>=0?T.success:T.danger }}>
                        {vsAvg>=0?"+":""}{vsAvg}% vs avg
                      </span>
                    </div>
                  )}
                  {val === 0 && now.getHours() < 18 && isToday && (
                    <div style={{ fontSize:10, color:T.t3 }}>Peak hours: 5–7pm</div>
                  )}
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[3,3,0,0]}>
            {chartDays.map((entry, i) => (
              <Cell key={i} fill={T.accent} fillOpacity={entry.day===todayLabel?0.85:0.3}/>
            ))}
          </Bar>
          {parseFloat(weeklyAvg) > 0 && (
            <ReferenceLine y={parseFloat(weeklyAvg)} stroke={T.t4} strokeDasharray="4 4"
              label={{ value:`avg ${weeklyAvg}`, position:"insideTopRight", fill:T.t3, fontSize:9, fontFamily:"inherit" }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:10, paddingTop:10, borderTop:`1px solid ${T.divider}` }}>
        {[{op:0.85,label:"Today"},{op:0.30,label:"Past days"}].map((l,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:T.accent, opacity:l.op }}/>
            <span style={{ fontSize:10, color:T.t3 }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:14, height:1, borderTop:`2px dashed ${T.t4}` }}/>
          <span style={{ fontSize:10, color:T.t3 }}>Daily avg</span>
        </div>
      </div>

      {isLowest && (
        <StatNudge color={T.warn} icon={TrendingDown}
          stat="Lowest day this week."
          detail="Consider sending a reminder or a motivational post to boost tomorrow's attendance."/>
      )}
      {isHighest && todayVal > 2 && (
        <StatNudge color={T.success} icon={TrendingUp}
          stat="Best day this week!"
          detail="Great momentum — consider posting to celebrate the energy and keep it going."/>
      )}
    </Card>
  );
}

// ── Quick Actions Grid ────────────────────────────────────────────────────────
function QuickActionsGrid() {
  const actions = [
    { Icon:Trophy,            label:"New Challenge" },
    { Icon:Calendar,          label:"New Event"     },
    { Icon:MessageSquarePlus, label:"Post Update"   },
    { Icon:Pencil,            label:"New Poll"      },
  ];
  return (
    <Card>
      <Label>Quick Actions</Label>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
        {actions.map(({ Icon, label }, i) => {
          const [hov, setHov] = useState(false); // eslint-disable-line react-hooks/rules-of-hooks
          return (
            <button key={i}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:T.radiusSm, background:hov?T.surfaceEl:"rgba(255,255,255,0.025)", border:`1px solid ${hov?T.borderEl:T.border}`, cursor:"pointer", transition:"all .15s" }}
            >
              <Icon style={{ width:13, height:13, color:T.accent, flexShrink:0 }}/>
              <span style={{ fontSize:11, fontWeight:600, color:hov?T.t1:T.t2, transition:"color .15s" }}>{label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Greeting Header ───────────────────────────────────────────────────────────
function GreetingHeader({ now, ownerName }) {
  const { text, Icon } = getGreeting(now.getHours());
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
        <Icon style={{ width:15, height:15, color:T.warn, opacity:0.7 }}/>
        <span style={{ fontSize:11, fontWeight:500, color:T.t3, letterSpacing:".02em" }}>{fmtFull(now)}</span>
      </div>
      <h1 style={{ fontSize:22, fontWeight:700, color:T.t1, margin:0, letterSpacing:"-0.02em", lineHeight:1.3 }}>
        {text}{ownerName ? `, ${ownerName}` : ""}{" "}
        <span style={{ fontWeight:400, color:T.t3 }}>— here's what to focus on today</span>
      </h1>
    </div>
  );
}

// ── Top Nav ───────────────────────────────────────────────────────────────────
function TopNav({ active, setActive, atRiskCount }) {
  const navItems = ["Overview","Members","Analytics","Content","Automations","Settings"];
  return (
    <header style={{ background:"rgba(8,14,24,0.96)", backdropFilter:"blur(14px)", borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:100 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px", height:54 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#fff", fontFamily:T.mono, flexShrink:0 }}>F</div>
          <div>
            <div style={{ fontSize:13.5, fontWeight:700, color:T.t1, letterSpacing:"-0.02em", lineHeight:1 }}>Foundry Gym</div>
            <div style={{ fontSize:9, color:T.t4, textTransform:"uppercase", letterSpacing:".14em", fontFamily:T.mono, lineHeight:1.3 }}>Owner Portal</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {atRiskCount > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 11px", borderRadius:T.radiusSm, background:T.dangerSub, border:`1px solid ${T.dangerBrd}` }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:T.danger, animation:"pulse 2s infinite" }}/>
              <span style={{ fontSize:10.5, fontWeight:600, color:T.danger, fontFamily:T.mono }}>{atRiskCount} at risk</span>
            </div>
          )}
          <Btn variant="ghost" size="sm">Scan QR</Btn>
          <button style={{ padding:"6px 15px", borderRadius:T.radiusSm, fontSize:12, fontWeight:600, background:T.accent, color:"#fff", border:"none", cursor:"pointer" }}>
            + New Post
          </button>
          <div style={{ width:1, height:22, background:T.border }}/>
          <div style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:T.surfaceEl, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.t2, fontFamily:T.mono }}>M</div>
            <span style={{ fontSize:12, fontWeight:600, color:T.t2 }}>Max</span>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", padding:"0 32px", borderTop:`1px solid ${T.border}` }}>
        {navItems.map(n => {
          const id = n.toLowerCase();
          const on = active === id;
          return (
            <button key={id} onClick={() => setActive(id)} style={{
              padding:"9px 16px", fontSize:12, fontWeight:on?600:400, color:on?T.t1:T.t3,
              background:"transparent", border:"none", borderBottom:`2px solid ${on?T.accent:"transparent"}`,
              cursor:"pointer", transition:"all .15s",
            }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.color = T.t2; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.color = T.t3; }}
            >
              {n}
            </button>
          );
        })}
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:10, color:T.t4, fontFamily:T.mono }}>{fmtFull(NOW)}</span>
      </div>
    </header>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [activeNav,   setActiveNav]   = useState("overview");
  const [chartRange,  setChartRange]  = useState(7);
  const M  = MOCK.metrics;
  const now = NOW;

  const inGymNow = MOCK.checkIns.filter(c => {
    const diff = (now - new Date(c.check_in_date)) / 60000;
    return diff >= 0 && diff <= 120;
  }).length;

  const ciSub = M.yesterdayCI === 0
    ? (M.todayCI > 0 ? "No data for yesterday" : "No check-ins yet today")
    : M.todayVsYest > 0 ? `+${M.todayVsYest}% vs yesterday`
    : M.todayVsYest < 0 ? `${M.todayVsYest}% vs yesterday`
    : "Same as yesterday";

  const weeklyAvgCI = useMemo(() => {
    const days = chartRange <= 7 ? MOCK.chartDays7 : MOCK.chartDays30;
    return (days.reduce((a,b) => a+b.value, 0) / days.length).toFixed(1);
  }, [chartRange]);

  const todayIsLowest  = M.todayCI > 0 && MOCK.chartDays7.filter(d=>d.value>0).length>1 && M.todayCI <= Math.min(...MOCK.chartDays7.filter(d=>d.value>0).map(d=>d.value));
  const todayAboveAvg  = M.todayCI > parseFloat(weeklyAvgCI);
  const ciTrend        = M.yesterdayCI > 0 && M.todayVsYest > 0 ? "up" : M.yesterdayCI > 0 && M.todayVsYest < 0 ? "down" : null;
  const showRing       = M.retentionRate > 5 && M.retentionRate < 98;

  const ciInsight = todayIsLowest  ? "Lowest this week — consider sending a reminder"
                  : todayAboveAvg  ? "Above average — great momentum today"
                  : M.todayCI === 0 && now.getHours() < 10 ? "Mornings are usually quiet — peak at 5–7pm"
                  : null;

  // ── Compute priority actions dynamically ──
  const computedPriorities = useMemo(() => {
    const items = [];
    if (M.atRisk > 0) {
      items.push({ color:T.danger, Icon:Heart, title:`Message ${M.atRisk} at-risk member${M.atRisk>1?"s":""}`, detail:`${M.atRisk} member${M.atRisk>1?"s haven't":" hasn't"} visited in 14+ days. Personal outreach is the most effective retention tool.`, impact:`Could retain ${M.atRisk} member${M.atRisk>1?"s":""}`, cta:"Send messages", onAction:() => {} });
    }
    if (MOCK.newNoReturnCount > 0) {
      items.push({ color:T.danger, Icon:UserPlus, title:`Follow up with ${MOCK.newNoReturnCount} new member${MOCK.newNoReturnCount>1?"s":""}`, detail:"Joined recently but haven't returned. Week-1 follow-ups have the single highest retention impact.", impact:"Highest retention impact", cta:"Follow up", onAction:() => {} });
    }
    const todayCount = MOCK.checkIns.filter(c => {
      const d = new Date(c.check_in_date);
      return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth() && d.getDate()===now.getDate();
    }).length;
    if (todayCount === 0 && now.getHours() >= 10) {
      items.push({ color:T.warn, Icon:Clock, title:"Remind today's no-shows", detail:"No check-ins recorded yet today. A quick reminder can boost this week's attendance.", impact:"Boost this week's check-ins", cta:"Send reminder", onAction:() => {} });
    }
    if (!MOCK.challenges.some(c => !c.ended_at) && M.totalMembers >= 3) {
      items.push({ color:T.warn, Icon:Trophy, title:"Launch a challenge", detail:"No active challenge running. Members with goals visit significantly more consistently.", impact:"Boost weekly visits", cta:"Create challenge", onAction:() => {} });
    }
    if (!MOCK.posts.some(p => diffDays(now, new Date(p.created_at||now)) <= 7)) {
      items.push({ color:T.accent, Icon:MessageSquarePlus, title:"Post a community update", detail:"Regular posts lift engagement scores. Try a motivational post, poll, or class promo.", impact:"Improve engagement", cta:"Post now", onAction:() => {} });
    }
    return items.slice(0,5);
  }, []);

  const chartDays = chartRange <= 7 ? MOCK.chartDays7 : MOCK.chartDays30;

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, fontFamily:"'Inter', system-ui, sans-serif" }}>
      <style>{FONT_INJECT}</style>

      <TopNav active={activeNav} setActive={setActiveNav} atRiskCount={M.atRisk}/>

      <main style={{ maxWidth:1300, margin:"0 auto", padding:"28px 32px 60px" }}>

        <GreetingHeader now={now} ownerName={MOCK.owner}/>

        {/* Priority Action Panel — full-width hero */}
        <div style={{ marginBottom:20 }}>
          <PriorityActionPanel priorities={computedPriorities}/>
        </div>

        {/* Two-column layout */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 292px", gap:20, alignItems:"start" }}>

          {/* ── Left column ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* KPI row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
              <KpiCard
                label="Today's Check-ins"
                value={M.todayCI}
                sub={ciSub}
                subTrend={ciTrend}
                subContext={weeklyAvgCI ? `Avg: ${weeklyAvgCI}/day` : undefined}
                sparkData={M.sparkData}
                insight={ciInsight}
                cta={M.todayCI===0 && now.getHours()>=10 ? "Send reminder" : undefined}
                onCta={() => {}}
              />
              <KpiCard
                label="Active This Week"
                value={M.activeThisWeek}
                valueSuffix={` of ${M.totalMembers}`}
                sub={`${M.retentionRate}% retention`}
                subTrend={M.retentionRate>=70?"up":M.retentionRate<50?"down":null}
                subContext={M.retentionRate<60?"Below 70% target":M.retentionRate>=80?"Top 20% — excellent":"Steady"}
                ring={showRing ? M.retentionRate : null}
                ringColor={M.retentionRate>=70?T.success:M.retentionRate>=50?T.warn:T.danger}
                sparkData={!showRing ? M.sparkData : null}
              />
              <KpiCard
                label="Currently in Gym"
                value={inGymNow}
                sub={inGymNow===0 ? (now.getHours()<10?"Early — peak at 5–7pm":now.getHours()<17?"Quiet midday period":"No recent check-ins") : `Member${inGymNow>1?"s":""} in last 2h`}
                subTrend={inGymNow>0?"up":null}
                sparkData={M.sparkData}
                insight={now.getHours()>=17&&now.getHours()<=19?"Peak hours right now":null}
              />
              <KpiCard
                label="At-Risk Members"
                value={M.atRisk}
                sub={M.atRisk>0 ? `${Math.round((M.atRisk/Math.max(M.totalMembers,1))*100)}% of gym inactive` : "All members active"}
                subTrend={M.atRisk>0?"down":"up"}
                subContext={M.atRisk>0?"14+ days without a visit":undefined}
                sparkData={M.sparkData}
                valueColor={M.atRisk>0?T.danger:undefined}
                cta={M.atRisk>0?"View & message":undefined}
                onCta={() => {}}
                insight={M.atRisk>0?"Direct outreach is the most effective method":null}
              />
            </div>

            {/* At-risk expanded preview */}
            {M.atRisk > 0 && (
              <AtRiskPreview
                members={MOCK.atRiskMembers}
                onMessage={() => {}}
                onViewAll={() => {}}
              />
            )}

            <CheckInChart
              chartDays={chartDays}
              chartRange={chartRange}
              setChartRange={setChartRange}
              now={now}
            />

            <MemberGrowthCard
              newSignUps={M.newSignUps}
              cancelledEst={M.cancelledEst}
              retentionRate={M.retentionRate}
              monthGrowthData={MOCK.monthGrowthData}
            />

            <EngagementBreakdown
              monthCiPer={M.monthCiPer}
              totalMembers={M.totalMembers}
              atRisk={M.atRisk}
              onViewMembers={() => {}}
            />

            <ActivityFeed items={MOCK.recentActivity} now={now}/>

          </div>

          {/* ── Right sidebar ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:14, position:"sticky", top:100 }}>

            <TodayActions
              atRisk={M.atRisk}
              checkIns={MOCK.checkIns}
              allMemberships={MOCK.allMemberships}
              posts={MOCK.posts}
              challenges={MOCK.challenges}
              now={now}
              newNoReturnCount={MOCK.newNoReturnCount}
              onMessage={() => {}}
              onViewMembers={() => {}}
            />

            <QuickActionsGrid/>

            <RetentionBreakdown
              breakdown={MOCK.retentionBreakdown}
              onViewAll={() => {}}
            />

            <WeekOneReturn
              week1ReturnRate={MOCK.week1ReturnRate}
              onMessage={() => {}}
            />

          </div>
        </div>
      </main>
    </div>
  );
}
