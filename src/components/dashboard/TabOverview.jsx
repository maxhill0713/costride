import { useState } from "react";

// ─── FONTS ────────────────────────────────────────────────────────────────────
const FONT_INJECT = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  button { font-family: inherit; cursor: pointer; border: none; }
  input, select, textarea { font-family: inherit; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{ opacity:1; } 50%{ opacity:0.4; } }
`;

// ─── TOKENS — aligned with TabOverview ───────────────────────────────────────
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
  t1: "#f1f5f9",
  t2: "#94a3b8",
  t3: "#475569",
  t4: "#2d3f55",
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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK = {
  owner: "Max",
  date:  "Friday, 3 April 2026",
  metrics: {
    checkInsToday:  0,
    checkInsWeek:   [3, 1, 2, 4, 3, 5, 0],
    activeThisWeek: 1,
    totalMembers:   4,
    currentlyInGym: 0,
    peakHour:       "5–7 pm",
    atRisk:         2,
    mrr:            3560,
    newRevenue:     420,
    lostRevenue:    0,
    memberGrowth:   2,
    retentionRate:  75,
    weekOneReturn:  60,
    avgVisits:      4.2,
  },
  atRiskMembers: [
    { id:1, name:"Emily R.",  lastVisit:"10 days ago", daysSince:10, avatar:"ER", plan:"Premium"  },
    { id:2, name:"Alex D.",   lastVisit:"16 days ago", daysSince:16, avatar:"AD", plan:"Standard" },
    { id:3, name:"Jordan T.", lastVisit:"21 days ago", daysSince:21, avatar:"JT", plan:"Premium"  },
  ],
  newMembers: [
    { id:4, name:"Sam K.",   joinedDays:3, avatar:"SK", plan:"Trial"    },
    { id:5, name:"Priya M.", joinedDays:6, avatar:"PM", plan:"Standard" },
  ],
  checkInData: {
    daily:   [0,2,1,0,3,5,4,2,0,1,3,4,5,0],
    weekly:  [8,12,6,14,9,11,7],
    monthly: [42,38,55,61,48,52,44],
  },
  chartLabels: {
    daily:   ["M","T","W","T","F","S","S","M","T","W","T","F","S","T"],
    weekly:  ["Wk1","Wk2","Wk3","Wk4","Wk5","Wk6","Wk7"],
    monthly: ["Sep","Oct","Nov","Dec","Jan","Feb","Mar"],
  },
  actionItems: [
    { id:1, priority:"red",    title:"Message at-risk members",            desc:"Emily R. and Alex D. haven't visited in 10+ days. Direct outreach now is your highest-leverage move.", cta:"Send messages", members:["ER","AD"] },
    { id:2, priority:"yellow", title:"Remind today's no-shows",            desc:"A push notification to members who haven't checked in yet could boost today's attendance.",            cta:"Send reminder" },
    { id:3, priority:"green",  title:"Community post to boost engagement", desc:"Sharing a motivation post drives 30% higher mid-week check-ins based on your history.",              cta:"Create post"   },
    { id:4, priority:"blue",   title:"5 trial sign-ups expire soon",       desc:"Connect these members to an ongoing plan before the trial window closes.",                           cta:"View trials"   },
  ],
  priorityTasks: [
    { title:"Message 2 at-risk members",   desc:"Could retain 2 members",         impact:"High impact", cta:"Message now",   color:T.danger  },
    { title:"Remind today's no-shows",     desc:"Boost this week's check-ins",    impact:"Med impact",  cta:"Send reminder", color:T.warn    },
    { title:"Check your current revenue",  desc:"Healthy — on target this month", impact:"On track",    cta:"View revenue",  color:T.success },
  ],
  recentActivity: [
    { id:1, text:"Sam K. checked in",           time:"Just now",   type:"checkin" },
    { id:2, text:"Priya M. joined as a member", time:"6 days ago", type:"new"     },
    { id:3, text:"Emily R. last seen",           time:"10 days ago",type:"risk"    },
    { id:4, text:"Alex D. went inactive",        time:"16 days ago",type:"risk"    },
    { id:5, text:"Revenue payment received",     time:"Yesterday",  type:"revenue" },
  ],
  checkInHeatmap: [
    [0,1,2,3,2,1,0,1,2,3,4,5,4,3,2,1],
    [0,0,1,2,3,2,1,0,1,2,3,4,5,4,3,1],
    [0,1,1,2,2,1,0,0,2,3,3,5,4,3,2,1],
    [0,0,0,1,1,1,0,0,1,2,2,4,3,2,1,0],
    [0,1,2,3,3,2,1,1,2,3,4,5,5,4,3,2],
    [0,2,3,4,3,2,1,1,2,3,4,5,5,4,3,2],
    [0,0,1,1,1,0,0,0,1,1,2,3,3,2,1,0],
  ],
  memberSegments: [
    { label:"Super Active", value:1, color:T.success, sub:"15+ visits / mo" },
    { label:"Active",       value:2, color:T.accent,  sub:"4–14 visits / mo" },
    { label:"Casual",       value:1, color:T.warn,    sub:"1–3 visits / mo" },
    { label:"At Risk",      value:2, color:T.danger,  sub:"14+ days out"    },
    { label:"New",          value:2, color:T.t3,      sub:"Last 30 days"    },
  ],
};

// ─── CARD SHELL ───────────────────────────────────────────────────────────────
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

// ─── SECTION LABEL — exact TabOverview spec ───────────────────────────────────
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

// ─── AVATAR — neutral, no color ───────────────────────────────────────────────
function Avatar({ initials, size = 28 }) {
  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   "50%",
      background:     T.surfaceEl,
      border:         `1px solid ${T.border}`,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       Math.round(size * 0.32),
      fontWeight:     600,
      color:          T.t3,
      fontFamily:     T.mono,
      flexShrink:     0,
    }}>
      {initials}
    </div>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────────────────────
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
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = "1"; }}
    >
      {children}
    </button>
  );
}

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
function MiniSpark({ data = [], width = 64, height = 26 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
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

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function BarChart({ data, labels, target = 10 }) {
  const max  = Math.max(...data, target, 1);
  const avg  = data.reduce((a, b) => a + b, 0) / data.length;
  const tPct = (target / max) * 100;
  const aPct = (avg / max) * 100;
  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:22, width:22, display:"flex", flexDirection:"column", justifyContent:"space-between", pointerEvents:"none" }}>
        {[max, Math.round(max / 2), 0].map((v, i) => (
          <span key={i} style={{ fontSize:9, color:T.t4, fontFamily:T.mono }}>{v}</span>
        ))}
      </div>
      <div style={{ marginLeft:28, position:"relative" }}>
        <div style={{ position:"absolute", inset:"0 0 22px 0", pointerEvents:"none" }}>
          {[25, 50, 75].map(p => (
            <div key={p} style={{ position:"absolute", left:0, right:0, bottom:`${p}%`, borderTop:`1px solid ${T.divider}` }}/>
          ))}
        </div>
        <div style={{ position:"absolute", left:0, right:0, bottom:`calc(${tPct}% + 22px)`, zIndex:2, pointerEvents:"none" }}>
          <div style={{ borderTop:`1px dashed ${T.t4}`, position:"relative" }}>
            <span style={{ position:"absolute", right:0, top:-10, fontSize:9, color:T.t4, background:T.surface, padding:"0 5px", fontFamily:T.mono }}>Target {target}</span>
          </div>
        </div>
        <div style={{ position:"absolute", left:0, right:0, bottom:`calc(${aPct}% + 22px)`, zIndex:2, pointerEvents:"none" }}>
          <div style={{ borderTop:`1px dashed ${T.t4}`, opacity:0.4 }}/>
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:148 }}>
          {data.map((v, i) => {
            const isLast = i === data.length - 1;
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end" }}>
                <div title={`${labels?.[i]}: ${v}`} style={{
                  width:"100%",
                  height:`${Math.max((v/max)*100, 2)}%`,
                  background: isLast ? T.accent : v === 0 ? "rgba(255,255,255,0.03)" : "rgba(59,130,246,0.28)",
                  borderRadius:"3px 3px 0 0",
                  transition:"height .5s cubic-bezier(0.34,1.56,0.64,1)",
                  opacity: isLast ? 0.9 : 1,
                }}/>
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:3, marginTop:5 }}>
          {data.map((_, i) => (
            <div key={i} style={{ flex:1, textAlign:"center", fontSize:9, color:i===data.length-1?T.accent:T.t4, fontFamily:T.mono }}>{labels?.[i]}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HEATMAP ──────────────────────────────────────────────────────────────────
function CheckInHeatmap({ data }) {
  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = ["6am","7","8","9","10","11","12","1pm","2","3","4","5","6","7","8","9pm"];
  const max   = Math.max(...data.flat(), 1);
  const col   = v => {
    if (!v) return "rgba(255,255,255,0.03)";
    const p = v / max;
    if (p < .25) return "rgba(59,130,246,0.18)";
    if (p < .5)  return "rgba(59,130,246,0.38)";
    if (p < .75) return "rgba(59,130,246,0.62)";
    return T.accent;
  };
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"flex", gap:3, minWidth:"fit-content" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:3, paddingTop:20, paddingRight:6 }}>
          {days.map((d, i) => (
            <div key={i} style={{ height:16, display:"flex", alignItems:"center", fontSize:9, color:T.t4, fontFamily:T.mono }}>{d}</div>
          ))}
        </div>
        <div>
          <div style={{ display:"flex", gap:3, marginBottom:3 }}>
            {hours.map((h, i) => (
              <div key={i} style={{ width:26, fontSize:8, color:T.t4, textAlign:"center", fontFamily:T.mono }}>{h}</div>
            ))}
          </div>
          {data.map((row, ri) => (
            <div key={ri} style={{ display:"flex", gap:3, marginBottom:3 }}>
              {row.map((v, ci) => (
                <div key={ci} title={`${days[ri]} ${hours[ci]}: ${v}`}
                  style={{ width:26, height:16, borderRadius:3, background:col(v) }}/>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:10 }}>
        <span style={{ fontSize:9, color:T.t4, fontFamily:T.mono }}>Less</span>
        {[0.03, 0.18, 0.38, 0.62, 1].map((o, i) => (
          <div key={i} style={{ width:11, height:11, borderRadius:2, background:`rgba(59,130,246,${o})` }}/>
        ))}
        <span style={{ fontSize:9, color:T.t4, fontFamily:T.mono }}>More</span>
      </div>
    </div>
  );
}

// ─── MINI BAR ─────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  return (
    <div style={{ flex:1, height:2, background:T.divider, borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${max>0?(value/max)*100:0}%`, background:color, borderRadius:99 }}/>
    </div>
  );
}

// ─── RANGE TOGGLE — neutral active tab matching TabOverview ───────────────────
function RangeToggle({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:4 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          fontSize:     11,
          fontWeight:   value === o.id ? 700 : 400,
          padding:      "4px 12px",
          borderRadius: T.radiusSm,
          cursor:       "pointer",
          background:   value === o.id ? T.surfaceEl : "rgba(255,255,255,0.03)",
          color:        value === o.id ? T.t1 : T.t3,
          border:       `1px solid ${value === o.id ? T.borderEl : T.border}`,
          transition:   "all .15s",
        }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
// Value is t1 unless threshold crossed. Trend text only gets semantic color.
function KpiCard({ label, value, valueSuffix, sub, subTrend, sparkData, cta, onCta, valueColor }) {
  const tColor = subTrend === "up" ? T.success : subTrend === "down" ? T.danger : T.t3;
  const arrow  = subTrend === "up" ? "↑" : subTrend === "down" ? "↓" : "–";
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
              <span style={{ fontSize:10, color:tColor }}>{arrow}</span>
              <span style={{ fontSize:11, fontWeight:500, color:tColor, lineHeight:1.3 }}>{sub}</span>
            </div>
          )}
        </div>
        {sparkData?.some(v => v > 0) && <MiniSpark data={sparkData}/>}
      </div>
      {cta && onCta && (
        <button onClick={onCta} style={{ marginTop:8, width:"100%", padding:"6px 10px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.borderEl}`, color:T.t1, fontSize:11, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
          {cta} →
        </button>
      )}
    </div>
  );
}

// ─── SIGNAL — 3px left border is the only color on the surface ───────────────
function Signal({ color, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{ padding:"10px 12px", borderRadius:T.radiusSm, background:hov && onAction ? T.surfaceEl : T.surface, border:`1px solid ${T.border}`, borderLeft:`3px solid ${color}`, marginBottom:last?0:6, cursor:onAction?"pointer":"default", transition:"background .15s" }}
      onClick={onAction}
      onMouseEnter={() => onAction && setHov(true)}
      onMouseLeave={() => onAction && setHov(false)}
    >
      <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.t1, lineHeight:1.3, marginBottom:2 }}>{title}</div>
          <div style={{ fontSize:11, color:T.t3, lineHeight:1.45 }}>{detail}</div>
        </div>
        {action && (
          <span style={{ fontSize:10, fontWeight:600, color, flexShrink:0, whiteSpace:"nowrap", marginTop:1 }}>
            {action} →
          </span>
        )}
      </div>
    </div>
  );
}

// ─── STAT NUDGE — surfaceEl bg, 2px left border only ─────────────────────────
function StatNudge({ color, stat, detail, action, onAction }) {
  return (
    <div style={{ marginTop:12, padding:"9px 11px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, borderLeft:`2px solid ${color}`, display:"flex", alignItems:"flex-start", gap:9 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <span style={{ fontSize:11, fontWeight:600, color:T.t1 }}>{stat} </span>
        <span style={{ fontSize:11, color:T.t3, lineHeight:1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={onAction} style={{ flexShrink:0, fontSize:10, fontWeight:600, color, background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:2, padding:0 }}>
          {action} →
        </button>
      )}
    </div>
  );
}

// ─── MEMBER ROWS ──────────────────────────────────────────────────────────────
// Left border = only color signal. Surface stays neutral.
function AtRiskRow({ member }) {
  const c = member.daysSince >= 21 ? T.danger : member.daysSince >= 14 ? T.warn : T.t3;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, borderLeft:`3px solid ${c}`, transition:"background .15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = T.surfaceEl}
    >
      <Avatar initials={member.avatar}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.t1, marginBottom:1 }}>{member.name}</div>
        <div style={{ fontSize:10, color:T.t3, fontFamily:T.mono }}>{member.lastVisit} · {member.plan}</div>
      </div>
      {/* Semantic text label only — no colored chip */}
      <span style={{ fontSize:10, fontWeight:600, color:c, fontFamily:T.mono, flexShrink:0 }}>
        {member.daysSince}d inactive
      </span>
      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
        <Btn variant="danger" size="sm">Message</Btn>
        <Btn variant="ghost"  size="sm">View</Btn>
      </div>
    </div>
  );
}

function NewMemberRow({ member }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, transition:"background .15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = T.surfaceEl}
    >
      <Avatar initials={member.avatar}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.t1, marginBottom:1 }}>{member.name}</div>
        <div style={{ fontSize:10, color:T.t3, fontFamily:T.mono }}>Joined {member.joinedDays}d ago · {member.plan}</div>
      </div>
      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
        <Btn variant="ghost" size="sm">Welcome</Btn>
        <Btn variant="ghost" size="sm">View</Btn>
      </div>
    </div>
  );
}

// ─── FOCUS ROW ────────────────────────────────────────────────────────────────
function FocusRow({ task }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, borderLeft:`3px solid ${task.color}`, transition:"background .15s" }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background = T.surfaceEl}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.t1, marginBottom:1 }}>{task.title}</div>
        <div style={{ fontSize:10.5, color:T.t3 }}>{task.desc}</div>
      </div>
      <span style={{ fontSize:9, fontWeight:700, color:T.t4, textTransform:"uppercase", letterSpacing:".1em", whiteSpace:"nowrap", marginRight:8, fontFamily:T.mono }}>
        {task.impact}
      </span>
      <Btn variant="ghost" size="sm">{task.cta}</Btn>
    </div>
  );
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
// Icon containers all neutral — no per-type colors
function ActivityFeed({ items }) {
  const tm = { checkin:"✓", new:"★", risk:"!", revenue:"$" };
  return (
    <div>
      {items.map((item, i) => (
        <div key={item.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:i<items.length-1?`1px solid ${T.divider}`:"none" }}>
          <div style={{ width:22, height:22, borderRadius:6, flexShrink:0, background:T.surfaceEl, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:T.t3 }}>
            {tm[item.type] || "·"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11.5, color:T.t2, lineHeight:1.4 }}>{item.text}</div>
            <div style={{ fontSize:10, color:T.t4, marginTop:2, fontFamily:T.mono }}>{item.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MEMBER SEGMENTS ──────────────────────────────────────────────────────────
// Dot carries category color. Value is t1. Track bar fills.
function MemberSegments({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
      {segments.map((s, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:s.value>0?s.color:T.t4, flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4 }}>
              <span style={{ fontSize:11.5, fontWeight:500, color:s.value>0?T.t2:T.t3 }}>{s.label}</span>
              <span style={{ fontSize:13, fontWeight:700, color:s.value>0?T.t1:T.t4, fontFamily:T.mono }}>{s.value}</span>
            </div>
            <MiniBar value={s.value} max={total} color={s.color}/>
            <div style={{ fontSize:9, color:T.t4, marginTop:3, fontFamily:T.mono }}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RETENTION PULSE ──────────────────────────────────────────────────────────
// Numbers get semantic color only when threshold is crossed
function RetentionPulse({ weekOneReturn, retentionRate, avgVisits }) {
  const rows = [
    { label:"Week-1 return",    value:`${weekOneReturn}%`, color: weekOneReturn >= 60 ? T.success : weekOneReturn < 40 ? T.danger : T.t1 },
    { label:"30-day retention", value:`${retentionRate}%`, color: retentionRate  >= 70 ? T.success : retentionRate  < 50 ? T.danger : T.t1 },
    { label:"Avg visits / mo",  value:avgVisits,           color: avgVisits      >= 6  ? T.success : avgVisits      < 3  ? T.danger : T.t1 },
  ];
  return (
    <div>
      {rows.map((s, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:i<rows.length-1?`1px solid ${T.divider}`:"none" }}>
          <span style={{ fontSize:11.5, color:T.t3 }}>{s.label}</span>
          <span style={{ fontSize:15, fontWeight:700, color:s.color, fontFamily:T.mono }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── REVENUE ──────────────────────────────────────────────────────────────────
function RevenueSection({ mrr, newRev, lostRev }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
      {[
        { label:"Monthly Recurring", value:`$${mrr.toLocaleString()}`, change:"+3%",   changeUp:true,  sub:"100% recurring" },
        { label:"New This Month",    value:`+$${newRev}`,              change:"+$420", changeUp:true,  sub:"1 new membership" },
        { label:"Lost Revenue",      value:`$${lostRev}`,              change:"$0",    changeUp:false, sub:"No cancellations" },
      ].map((r, i) => (
        <div key={i} style={{ padding:"14px 16px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}` }}>
          <Label>{r.label}</Label>
          <div style={{ fontSize:22, fontWeight:700, color:T.t1, letterSpacing:"-0.04em", marginBottom:5, fontFamily:T.mono }}>{r.value}</div>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            {/* change only gets success color if it's actually good news */}
            <span style={{ fontSize:10, color:r.changeUp ? T.success : T.t3, fontFamily:T.mono }}>
              {r.changeUp ? "↑" : "–"} {r.change}
            </span>
            <span style={{ fontSize:10, color:T.t4 }}>{r.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
// All hover states uniform — no per-button colors
function QuickActions() {
  const actions = [
    { label:"Create Post",     icon:"✏" },
    { label:"Add Member",      icon:"+" },
    { label:"Start Challenge", icon:"🏆" },
    { label:"Create Event",    icon:"📅" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
      {actions.map((a, i) => (
        <button key={i}
          style={{ padding:"9px 11px", borderRadius:T.radiusSm, background:"rgba(255,255,255,0.025)", border:`1px solid ${T.border}`, color:T.t3, fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:7, transition:"all .15s", cursor:"pointer" }}
          onMouseEnter={e => { e.currentTarget.style.background=T.surfaceEl; e.currentTarget.style.color=T.t2; e.currentTarget.style.borderColor=T.borderEl; }}
          onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.025)"; e.currentTarget.style.color=T.t3; e.currentTarget.style.borderColor=T.border; }}
        >
          <span style={{ fontSize:13 }}>{a.icon}</span>
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── TOP NAV ─────────────────────────────────────────────────────────────────
function TopNav({ active, setActive, date, atRiskCount }) {
  const navItems = [
    { id:"overview",    label:"Overview"    },
    { id:"members",     label:"Members"     },
    { id:"analytics",   label:"Analytics"   },
    { id:"content",     label:"Content"     },
    { id:"automations", label:"Automations" },
    { id:"settings",    label:"Settings"    },
  ];
  return (
    <header style={{ background:"rgba(8,14,24,0.96)", backdropFilter:"blur(14px)", borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:100 }}>
      {/* Brand bar */}
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
      {/* Nav tabs */}
      <div style={{ display:"flex", alignItems:"center", padding:"0 32px", borderTop:`1px solid ${T.border}` }}>
        {navItems.map(n => {
          const on = active === n.id;
          return (
            <button key={n.id} onClick={() => setActive(n.id)} style={{
              padding:      "9px 16px",
              fontSize:     12,
              fontWeight:   on ? 600 : 400,
              color:        on ? T.t1 : T.t3,
              background:   "transparent",
              border:       "none",
              borderBottom: `2px solid ${on ? T.accent : "transparent"}`,
              cursor:       "pointer",
              transition:   "all .15s",
            }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.color = T.t2; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.color = T.t3; }}
            >
              {n.label}
            </button>
          );
        })}
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:10, color:T.t4, fontFamily:T.mono }}>{date}</span>
      </div>
    </header>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [activeNav,   setActiveNav]   = useState("overview");
  const [chartRange,  setChartRange]  = useState("daily");
  const [showHeatmap, setShowHeatmap] = useState(false);

  const M           = MOCK.metrics;
  const hour        = new Date().getHours();
  const greeting    = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const chartData   = MOCK.checkInData[chartRange];
  const chartLabels = MOCK.chartLabels[chartRange];
  const chartAvg    = (chartData.reduce((a, b) => a + b, 0) / chartData.length).toFixed(1);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, fontFamily:"'Inter', system-ui, sans-serif" }}>
      <style>{FONT_INJECT}</style>

      <TopNav active={activeNav} setActive={setActiveNav} date={MOCK.date} atRiskCount={M.atRisk}/>

      <main style={{ maxWidth:1280, margin:"0 auto", padding:"28px 32px 60px" }}>

        {/* Page header */}
        <div style={{ marginBottom:24, display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
          <div>
            <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:"-0.04em", color:T.t1, lineHeight:1.2 }}>
              {greeting}, {MOCK.owner}
            </h1>
            <p style={{ fontSize:13, color:T.t3, marginTop:4 }}>Here's what needs your attention today.</p>
          </div>
          {M.atRisk > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 13px", borderRadius:T.radiusSm, background:T.dangerSub, border:`1px solid ${T.dangerBrd}` }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:T.danger, animation:"pulse 2s infinite" }}/>
              <span style={{ fontSize:11, fontWeight:600, color:T.danger, fontFamily:T.mono }}>{M.atRisk} members at risk — act within 48h</span>
            </div>
          )}
        </div>

        {/* Focus strip */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <Label style={{ marginBottom:0 }}>Focus for today</Label>
            <div style={{ height:"1px", flex:1, background:T.divider }}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {MOCK.priorityTasks.map((t, i) => <FocusRow key={i} task={t}/>)}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
          <KpiCard label="Today's Check-ins"  value={M.checkInsToday} sub="Down vs yesterday"      subTrend="down" sparkData={M.checkInsWeek} cta="Send reminder" onCta={() => {}}/>
          <KpiCard label="Active This Week"   value={M.activeThisWeek} valueSuffix={`/ ${M.totalMembers}`} sub="Steady week-on-week" subTrend="up" sparkData={[2,3,1,4,2,3,1]}/>
          <KpiCard label="Currently in Gym"   value={M.currentlyInGym} sub={`Peak at ${M.peakHour}`} sparkData={[0,0,1,3,5,4,0]} cta="Set goal" onCta={() => {}}/>
          <KpiCard label="At-Risk Members"    value={M.atRisk} sub="14+ days without a visit" subTrend="down" sparkData={[0,1,1,2,1,2,2]} cta="View & message" onCta={() => {}} valueColor={M.atRisk > 0 ? T.danger : undefined}/>
        </div>

        {/* Two-col layout */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16, alignItems:"start" }}>

          {/* ── LEFT ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* At-risk + New */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Card>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div>
                    <Label style={{ marginBottom:2 }}>At-Risk Members</Label>
                    <div style={{ fontSize:11, color:T.t4 }}>No visit in 14+ days</div>
                  </div>
                  <Btn variant="ghost" size="sm">View all →</Btn>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {MOCK.atRiskMembers.map(m => <AtRiskRow key={m.id} member={m}/>)}
                </div>
              </Card>

              <Card>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div>
                    <Label style={{ marginBottom:2 }}>New Members</Label>
                    <div style={{ fontSize:11, color:T.t4 }}>Joined in the last 7 days</div>
                  </div>
                  <Btn variant="ghost" size="sm">Add member</Btn>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {MOCK.newMembers.map(m => <NewMemberRow key={m.id} member={m}/>)}
                </div>
                <Divider/>
                <StatNudge color={T.success} stat="Week-1 return: 60%." detail="Members who return in week 1 are far more likely to stay long-term."/>
              </Card>
            </div>

            {/* Check-in chart */}
            <Card>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
                <div>
                  <Label style={{ marginBottom:4 }}>Check-in Activity</Label>
                  <div style={{ fontSize:11, color:T.t4 }}>
                    Daily avg <span style={{ fontWeight:600, color:T.t2, fontFamily:T.mono }}>{chartAvg}</span> · Peak at 5–7 pm
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button onClick={() => setShowHeatmap(h => !h)} style={{ padding:"4px 11px", borderRadius:T.radiusSm, fontSize:11, fontWeight:600, cursor:"pointer", background:showHeatmap?T.surfaceEl:"transparent", color:showHeatmap?T.t1:T.t3, border:`1px solid ${showHeatmap?T.borderEl:T.border}`, transition:"all .15s" }}>
                    Heatmap
                  </button>
                  <RangeToggle
                    options={[{id:"daily",label:"Daily"},{id:"weekly",label:"Weekly"},{id:"monthly",label:"Monthly"}]}
                    value={chartRange}
                    onChange={setChartRange}
                  />
                </div>
              </div>
              {showHeatmap
                ? <CheckInHeatmap data={MOCK.checkInHeatmap}/>
                : <>
                    <BarChart data={chartData} labels={chartLabels} target={10}/>
                    <div style={{ display:"flex", gap:16, marginTop:10, paddingTop:10, borderTop:`1px solid ${T.divider}` }}>
                      {[
                        { color:T.accent,                style:{} },
                        { color:"rgba(59,130,246,0.28)", style:{}, label:"Past" },
                        { color:T.t4,                    style:{} },
                        { color:T.t4,                    style:{ opacity:0.4 }, label:"Average" },
                      ].map((l, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <div style={{ width:12, height:2, background:l.color, borderRadius:2, ...l.style }}/>
                          <span style={{ fontSize:9.5, color:T.t4, fontFamily:T.mono }}>{["Today","Past","Target","Average"][i]}</span>
                        </div>
                      ))}
                    </div>
                  </>
              }
            </Card>

            {/* Revenue */}
            <Card>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div>
                  <Label style={{ marginBottom:2 }}>Revenue</Label>
                  <div style={{ fontSize:11, color:T.t4 }}>Monthly performance</div>
                </div>
                {/* Status badge — success only because threshold is met */}
                <span style={{ fontSize:10, fontWeight:600, color:T.success, background:T.successSub, border:`1px solid ${T.successBrd}`, borderRadius:5, padding:"2px 8px", fontFamily:T.mono }}>
                  On Target
                </span>
              </div>
              <RevenueSection mrr={M.mrr} newRev={M.newRevenue} lostRev={M.lostRevenue}/>
              <Divider/>
              <StatNudge color={T.success} stat={`+${M.memberGrowth} new members this month.`} detail="On track with retention goals for Q2."/>
            </Card>

            {/* Member segments */}
            <Card>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div>
                  <Label style={{ marginBottom:2 }}>Member Segments</Label>
                  <div style={{ fontSize:11, color:T.t4 }}>{M.totalMembers} total members</div>
                </div>
                <Btn variant="ghost" size="sm">View members →</Btn>
              </div>
              <MemberSegments segments={MOCK.memberSegments}/>
            </Card>

          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:104 }}>

            <Card>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <Label style={{ marginBottom:0 }}>Action Items</Label>
                <span style={{ fontSize:10, fontWeight:700, color:M.atRisk>0?T.danger:T.t3, background:M.atRisk>0?T.dangerSub:"transparent", border:`1px solid ${M.atRisk>0?T.dangerBrd:T.border}`, borderRadius:5, padding:"1px 7px", fontFamily:T.mono }}>
                  {MOCK.actionItems.length} pending
                </span>
              </div>
              <div style={{ fontSize:11, color:T.t4, marginBottom:12 }}>Sorted by urgency</div>
              {MOCK.actionItems.map((item, i) => {
                const cm = { red:T.danger, yellow:T.warn, green:T.success, blue:T.accent };
                return (
                  <Signal key={item.id} color={cm[item.priority]} title={item.title} detail={item.desc} action={item.cta} onAction={() => {}} last={i===MOCK.actionItems.length-1}/>
                );
              })}
            </Card>

            <Card>
              <Label>Quick Actions</Label>
              <QuickActions/>
            </Card>

            <Card>
              <Label>Retention Pulse</Label>
              <RetentionPulse weekOneReturn={M.weekOneReturn} retentionRate={M.retentionRate} avgVisits={M.avgVisits}/>
            </Card>

            <Card>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                <Label style={{ marginBottom:0 }}>Recent Activity</Label>
                <Btn variant="ghost" size="sm">All →</Btn>
              </div>
              <ActivityFeed items={MOCK.recentActivity}/>
            </Card>

            {/* Churn nudge — surfaceEl, left border only color */}
            <div style={{ padding:"13px 15px", borderRadius:T.radiusSm, background:T.surfaceEl, border:`1px solid ${T.border}`, borderLeft:`3px solid ${T.danger}` }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:T.danger, marginBottom:5 }}>Churn Risk</div>
              <div style={{ fontSize:11, color:T.t3, lineHeight:1.6, marginBottom:10 }}>
                2 members haven't visited in 14+ days. Reaching out within 48h doubles retention probability.
              </div>
              <Btn variant="danger" size="sm">Message them now</Btn>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
