import { useState } from "react";

// ─── FONTS ────────────────────────────────────────────────────────────────────
const FONT_INJECT = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=DM+Mono:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #060b17; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  button { font-family: inherit; cursor: pointer; }
  input, select, textarea { font-family: inherit; }
`;

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:         "#060b17",
  surface:    "#0a0f1e",
  surface2:   "#0d1225",
  border:     "rgba(255,255,255,0.06)",
  borderH:    "rgba(255,255,255,0.1)",
  shimmer:    "linear-gradient(180deg, rgba(255,255,255,0.018) 0%, transparent 50%)",
  shadow:     "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
  radius:     14,
  radiusSm:   9,
  t1: "#f1f5f9",
  t2: "#cbd5e1",
  t3: "#64748b",
  t4: "#334155",
  accent:     "#5179ff",
  accentSub:  "rgba(81,121,255,0.1)",
  accentBrd:  "rgba(81,121,255,0.3)",
  success:    "#22c55e",
  successSub: "rgba(34,197,94,0.08)",
  successBrd: "rgba(34,197,94,0.25)",
  warn:       "#f59e0b",
  warnSub:    "rgba(245,158,11,0.08)",
  warnBrd:    "rgba(245,158,11,0.25)",
  danger:     "#ef4444",
  dangerSub:  "rgba(239,68,68,0.08)",
  dangerBrd:  "rgba(239,68,68,0.25)",
  mono:       "'DM Mono', monospace",
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK = {
  gym:   "Foundry Gym",
  owner: "Max",
  date:  "Friday 3 April",
  metrics: {
    checkInsToday:     0,
    checkInsWeek:      [3, 1, 2, 4, 3, 5, 0],
    activeThisWeek:    1,
    totalMembers:      4,
    currentlyInGym:    0,
    peakHour:          "5–7pm",
    atRisk:            2,
    mrr:               3560,
    newRevenue:        420,
    lostRevenue:       0,
    memberGrowth:      2,
    retentionRate:     75,
    weekOneReturn:     60,
    avgVisits:         4.2,
  },
  atRiskMembers: [
    { id:1, name:"Emily R.",  lastVisit:"10 days ago", daysSince:10, risk:"High",   avatar:"ER", plan:"Premium",  visits30:2 },
    { id:2, name:"Alex D.",   lastVisit:"16 days ago", daysSince:16, risk:"High",   avatar:"AD", plan:"Standard", visits30:0 },
    { id:3, name:"Jordan T.", lastVisit:"21 days ago", daysSince:21, risk:"High",   avatar:"JT", plan:"Premium",  visits30:0 },
  ],
  newMembers: [
    { id:4, name:"Sam K.",   joinedDays:3, avatar:"SK", plan:"Trial",    visits30:1 },
    { id:5, name:"Priya M.", joinedDays:6, avatar:"PM", plan:"Standard", visits30:3 },
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
    { id:1, priority:"red",    title:"Message at-risk members",           desc:"Emily R. and Alex D. haven't visited in 10+ days. Reaching out now is your highest-leverage move.", cta:"Send messages", badge:"2 at risk",   members:["ER","AD"] },
    { id:2, priority:"yellow", title:"Remind today's no-shows",           desc:"Mornings are quiet — a push notification to members who haven't checked in yet could boost attendance.", cta:"Send reminder", badge:"Retention",   members:[] },
    { id:3, priority:"green",  title:"Community post to boost engagement", desc:"Sharing a motivation post drives 30% higher mid-week check-ins based on your history.", cta:"Create post",   badge:"Engagement",  members:[] },
    { id:4, priority:"blue",   title:"5 trial sign-ups expire soon",      desc:"Connect these members to an ongoing plan before the trial window closes.", cta:"View trials",   badge:"Alert",       members:[] },
  ],
  priorityTasks: [
    { icon:"🔴", title:"Message 2 at-risk members",   desc:"Could retain 2 members",        impact:"High impact", cta:"Message now",   color:T.danger  },
    { icon:"🟡", title:"Remind today's no-shows",     desc:"Boost this week's check-ins",   impact:"Med impact",  cta:"Send reminder", color:T.warn    },
    { icon:"🟢", title:"Check your current revenue",  desc:"Healthy — on target this month",impact:"On track",    cta:"View revenue",  color:T.success },
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
    { label:"Super Active", value:1, color:T.success, sub:"15+ visits/mo" },
    { label:"Active",       value:2, color:T.accent,  sub:"4–14 visits/mo" },
    { label:"Casual",       value:1, color:T.warn,    sub:"1–3 visits/mo" },
    { label:"At Risk",      value:2, color:T.danger,  sub:"14+ days out"  },
    { label:"New",          value:2, color:T.t3,      sub:"Last 30 days"  },
  ],
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{
      position:"relative", overflow:"hidden",
      background:T.surface,
      border:`1px solid ${T.border}`,
      borderRadius:T.radius,
      boxShadow:T.shadow,
      padding:"18px 20px",
      ...style,
    }}>
      <div style={{ position:"absolute", inset:0, background:T.shimmer, pointerEvents:"none", borderRadius:"inherit" }} />
      {children}
    </div>
  );
}

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, color:T.t4, textTransform:"uppercase", letterSpacing:".13em", fontFamily:T.mono, marginBottom:8, ...style }}>
      {children}
    </div>
  );
}

function Divider({ style = {} }) {
  return <div style={{ height:1, background:T.border, margin:"12px 0", ...style }} />;
}

function Avatar({ initials, size = 32, color = T.accent }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`${color}20`, border:`1.5px solid ${color}40`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:Math.round(size*0.33), fontWeight:700, color, fontFamily:T.mono, flexShrink:0,
    }}>
      {initials}
    </div>
  );
}

function Badge({ children, color = T.accent, style = {} }) {
  return (
    <span style={{
      fontSize:9, fontWeight:700, color,
      background:`${color}18`, border:`1px solid ${color}30`,
      borderRadius:5, padding:"2px 7px",
      fontFamily:T.mono, textTransform:"uppercase", letterSpacing:".06em",
      whiteSpace:"nowrap", ...style,
    }}>
      {children}
    </span>
  );
}

function Btn({ children, variant = "ghost", size = "sm", onClick, style = {}, disabled = false }) {
  const pad = size==="sm"?"5px 11px":size==="md"?"7px 14px":"9px 18px";
  const fs  = size==="sm"?11:size==="md"?12:13;
  const V = {
    primary:{ background:T.accent,     color:"#fff",    border:`1px solid ${T.accentBrd}` },
    ghost:  { background:"rgba(255,255,255,0.04)", color:T.t3, border:`1px solid ${T.border}` },
    danger: { background:T.dangerSub,  color:T.danger,  border:`1px solid ${T.dangerBrd}` },
    warn:   { background:T.warnSub,    color:T.warn,    border:`1px solid ${T.warnBrd}`   },
    success:{ background:T.successSub, color:T.success, border:`1px solid ${T.successBrd}`},
    accent: { background:T.accentSub,  color:T.accent,  border:`1px solid ${T.accentBrd}` },
  };
  return (
    <button disabled={disabled} onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", gap:5, padding:pad, borderRadius:T.radiusSm, fontFamily:T.mono, fontWeight:600, fontSize:fs, transition:"all .15s", outline:"none", letterSpacing:".01em", opacity:disabled?0.45:1, cursor:disabled?"default":"pointer", ...V[variant], ...style }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity="0.78"; }}
      onMouseLeave={e=>{ if(!disabled) e.currentTarget.style.opacity="1"; }}
    >
      {children}
    </button>
  );
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data = [], color = T.accent, width = 84, height = 38 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v,i) => {
    const x = data.length===1 ? width/2 : (i/(data.length-1))*width;
    const y = height - (v/max)*(height*0.82) - 2;
    return [x, y];
  });
  const poly     = pts.map(p=>p.join(",")).join(" ");
  const areaCl   = `${pts[pts.length-1][0]},${height} ${pts[0][0]},${height}`;
  const gradId   = `sg${Math.abs(color.replace(/[^a-z0-9]/gi,"").split("").reduce((a,c)=>a+c.charCodeAt(0),0))}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow:"visible", flexShrink:0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${poly} ${areaCl}`} fill={`url(#${gradId})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.5" fill={color}/>
    </svg>
  );
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function BarChart({ data, labels, target = 10 }) {
  const max       = Math.max(...data, target, 1);
  const avg       = data.length ? data.reduce((a,b)=>a+b,0)/data.length : 0;
  const tPct      = (target/max)*100;
  const aPct      = (avg/max)*100;
  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:22, width:24, display:"flex", flexDirection:"column", justifyContent:"space-between", pointerEvents:"none", zIndex:1 }}>
        {[max,Math.round(max/2),0].map((v,i)=>(
          <span key={i} style={{ fontSize:9, color:T.t4, fontFamily:T.mono, lineHeight:1 }}>{v}</span>
        ))}
      </div>
      <div style={{ marginLeft:28, position:"relative" }}>
        {/* Gridlines */}
        <div style={{ position:"absolute", inset:"0 0 22px 0", pointerEvents:"none" }}>
          {[0,25,50,75,100].map(p=>(
            <div key={p} style={{ position:"absolute", left:0, right:0, bottom:`${p}%`, borderTop:"1px solid rgba(255,255,255,0.03)" }}/>
          ))}
        </div>
        {/* Target line */}
        <div style={{ position:"absolute", left:0, right:0, bottom:`calc(${tPct}% + 22px)`, zIndex:2, pointerEvents:"none" }}>
          <div style={{ borderTop:"1.5px dashed rgba(255,255,255,0.16)", position:"relative" }}>
            <span style={{ position:"absolute", right:0, top:-10, fontSize:9, color:T.t4, background:T.surface, padding:"0 4px", fontFamily:T.mono }}>Target: {target}/day</span>
          </div>
        </div>
        {/* Avg line */}
        <div style={{ position:"absolute", left:0, right:0, bottom:`calc(${aPct}% + 22px)`, zIndex:2, pointerEvents:"none" }}>
          <div style={{ borderTop:`1px dashed ${T.accentBrd}` }}/>
        </div>
        {/* Bars */}
        <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:140 }}>
          {data.map((v,i)=>{
            const pct = (v/max)*100;
            const isLast = i===data.length-1;
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", height:"100%", justifyContent:"flex-end" }}>
                <div title={`${labels?.[i]??i}: ${v}`} style={{
                  width:"100%", height:`${Math.max(pct,2)}%`,
                  background: isLast ? `linear-gradient(180deg,${T.accent},rgba(81,121,255,0.55))` : v===0 ? "rgba(255,255,255,0.04)" : "rgba(81,121,255,0.28)",
                  borderRadius:"3px 3px 0 0", transition:"height .7s cubic-bezier(0.34,1.56,0.64,1)",
                }}/>
              </div>
            );
          })}
        </div>
        {/* X labels */}
        <div style={{ display:"flex", gap:4, marginTop:5 }}>
          {data.map((_,i)=>(
            <div key={i} style={{ flex:1, textAlign:"center", fontSize:9, color:i===data.length-1?T.accent:T.t4, fontFamily:T.mono }}>{labels?.[i]??i+1}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHECK-IN HEATMAP ─────────────────────────────────────────────────────────
function CheckInHeatmap({ data }) {
  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = ["6am","7","8","9","10","11","12","1pm","2","3","4","5","6","7","8","9pm"];
  const max   = Math.max(...data.flat(), 1);
  const getColor = v => {
    if (v===0) return "rgba(255,255,255,0.03)";
    const p = v/max;
    if (p<0.25) return "rgba(81,121,255,0.18)";
    if (p<0.50) return "rgba(81,121,255,0.38)";
    if (p<0.75) return "rgba(81,121,255,0.60)";
    return T.accent;
  };
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"flex", gap:2, minWidth:"fit-content" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:2, paddingTop:20, paddingRight:4 }}>
          {days.map((d,i)=>(
            <div key={i} style={{ height:16, display:"flex", alignItems:"center", fontSize:9, color:T.t4, fontFamily:T.mono, whiteSpace:"nowrap" }}>{d}</div>
          ))}
        </div>
        <div>
          <div style={{ display:"flex", gap:2, marginBottom:2 }}>
            {hours.map((h,i)=>(
              <div key={i} style={{ width:28, fontSize:8, color:T.t4, textAlign:"center", fontFamily:T.mono }}>{h}</div>
            ))}
          </div>
          {data.map((row,ri)=>(
            <div key={ri} style={{ display:"flex", gap:2, marginBottom:2 }}>
              {row.map((v,ci)=>(
                <div key={ci} title={`${days[ri]} ${hours[ci]}: ${v} check-ins`}
                  style={{ width:28, height:16, borderRadius:3, background:getColor(v), transition:"background .2s" }}/>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8 }}>
        <span style={{ fontSize:9, color:T.t4, fontFamily:T.mono }}>Less</span>
        {[0.03,0.18,0.38,0.60,1].map((o,i)=>(
          <div key={i} style={{ width:12, height:12, borderRadius:2, background:`rgba(81,121,255,${o})` }}/>
        ))}
        <span style={{ fontSize:9, color:T.t4, fontFamily:T.mono }}>More</span>
      </div>
    </div>
  );
}

// ─── MINI BAR (segment chart) ─────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max>0 ? (value/max)*100 : 0;
  return (
    <div style={{ flex:1, height:3, background:T.border, borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99, transition:"width .6s ease" }}/>
    </div>
  );
}

// ─── RANGE TOGGLE ─────────────────────────────────────────────────────────────
function RangeToggle({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:2, background:"rgba(255,255,255,0.04)", borderRadius:8, padding:3 }}>
      {options.map(o=>(
        <button key={o.id} onClick={()=>onChange(o.id)} style={{
          padding:"4px 11px", borderRadius:6, fontSize:10, fontWeight:600,
          cursor:"pointer", fontFamily:T.mono, textTransform:"capitalize",
          background:value===o.id?T.surface:"transparent",
          color:value===o.id?T.t1:T.t4,
          border:`1px solid ${value===o.id?T.borderH:"transparent"}`,
          transition:"all .15s",
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ─── PRIORITY TASKS ───────────────────────────────────────────────────────────
function PriorityTasks({ tasks, date }) {
  return (
    <Card>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.warn, textTransform:"uppercase", letterSpacing:".1em", fontFamily:T.mono }}>⚡ Focus for today</div>
        <div style={{ height:1, flex:1, background:T.border }}/>
        <span style={{ fontSize:10, color:T.t4, fontFamily:T.mono }}>{date}</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {tasks.map((t,i)=>(
          <div key={i}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:T.radiusSm, background:"rgba(255,255,255,0.025)", border:`1px solid ${T.border}`, borderLeft:`3px solid ${t.color}`, transition:"all .15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.042)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.025)"; }}
          >
            <span style={{ fontSize:15, flexShrink:0 }}>{t.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.t1, marginBottom:1 }}>{t.title}</div>
              <div style={{ fontSize:10, color:T.t3 }}>{t.desc}</div>
            </div>
            <span style={{ fontSize:9, fontWeight:700, color:T.t4, textTransform:"uppercase", letterSpacing:".08em", whiteSpace:"nowrap", marginRight:8, fontFamily:T.mono }}>{t.impact}</span>
            <Btn variant="ghost" size="sm">{t.cta}</Btn>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── METRIC CARD ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, insight, comparison, comparisonUp, sparkData, sparkColor, cta, onCta, danger=false, warn=false, success=false }) {
  const ac  = danger?T.danger:warn?T.warn:success?T.success:T.accent;
  const brd = danger?T.dangerBrd:warn?T.warnBrd:success?T.successBrd:T.border;
  const bv  = danger?"danger":warn?"warn":success?"success":"ghost";
  return (
    <div style={{ position:"relative", overflow:"hidden", background:T.surface, border:`1px solid ${brd}`, borderRadius:T.radius, boxShadow:T.shadow, padding:"16px 18px 14px" }}>
      <div style={{ position:"absolute", inset:0, background:T.shimmer, pointerEvents:"none", borderRadius:"inherit" }}/>
      {danger && <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at top right,rgba(239,68,68,0.04),transparent 60%)", pointerEvents:"none" }}/>}
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:36, fontWeight:800, lineHeight:1, letterSpacing:"-0.05em", color:danger?T.danger:T.t1, fontFamily:T.mono }}>{value}</div>
          {insight && <div style={{ fontSize:11, color:danger?T.danger:T.t3, marginTop:5, lineHeight:1.4 }}>{insight}</div>}
          {comparison && (
            <div style={{ fontSize:10, color:comparisonUp?T.success:T.danger, marginTop:3, display:"flex", alignItems:"center", gap:3 }}>
              <span>{comparisonUp?"↑":"↓"}</span><span>{comparison}</span>
            </div>
          )}
        </div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor||ac}/>}
      </div>
      {cta && <div style={{ marginTop:12 }}><Btn variant={bv} size="sm" onClick={onCta}>{cta}</Btn></div>}
    </div>
  );
}

// ─── AT-RISK ROW ──────────────────────────────────────────────────────────────
function AtRiskRow({ member }) {
  const c = member.daysSince>=21?T.danger:member.daysSince>=14?T.warn:T.t3;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:T.radiusSm, background:`${c}08`, border:`1px solid ${c}20`, borderLeft:`3px solid ${c}` }}>
      <Avatar initials={member.avatar} size={30} color={c}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.t1, marginBottom:1 }}>{member.name}</div>
        <div style={{ fontSize:10, color:c }}>{member.lastVisit} <span style={{ color:T.t4 }}>· {member.plan}</span></div>
      </div>
      <Badge color={c}>{member.risk} risk</Badge>
      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
        <Btn variant="danger" size="sm">Message</Btn>
        <Btn variant="ghost"  size="sm">View</Btn>
      </div>
    </div>
  );
}

// ─── NEW MEMBER ROW ───────────────────────────────────────────────────────────
function NewMemberRow({ member }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:T.radiusSm, background:T.accentSub, border:`1px solid ${T.accentBrd}`, borderLeft:`3px solid ${T.accent}` }}>
      <Avatar initials={member.avatar} size={30} color={T.accent}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.t1, marginBottom:1 }}>{member.name}</div>
        <div style={{ fontSize:10, color:T.t3 }}>Joined {member.joinedDays} days ago · {member.plan}</div>
      </div>
      <Badge color={T.accent}>New</Badge>
      <div style={{ display:"flex", gap:5, flexShrink:0 }}>
        <Btn variant="accent" size="sm">Welcome</Btn>
        <Btn variant="ghost"  size="sm">View</Btn>
      </div>
    </div>
  );
}

// ─── ACTION SIDEBAR ITEM ──────────────────────────────────────────────────────
function ActionItem({ item }) {
  const colorMap   = { red:T.danger, yellow:T.warn, green:T.success, blue:T.accent };
  const variantMap = { red:"danger",  yellow:"warn",  green:"success", blue:"accent" };
  const c = colorMap[item.priority];
  return (
    <div
      style={{ padding:"11px 12px", borderRadius:T.radiusSm, background:"rgba(255,255,255,0.02)", border:`1px solid ${T.border}`, borderLeft:`3px solid ${c}`, transition:"background .15s" }}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.038)"}
      onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:6, marginBottom:4 }}>
        <div style={{ fontSize:11, fontWeight:600, color:T.t1, lineHeight:1.4, flex:1 }}>{item.title}</div>
        <Badge color={c}>{item.badge}</Badge>
      </div>
      {item.members && item.members.length>0 && (
        <div style={{ display:"flex", marginBottom:7 }}>
          {item.members.map((av,i)=>(
            <div key={i} style={{ marginLeft:i>0?-6:0, border:`2px solid ${T.surface}`, borderRadius:"50%" }}>
              <Avatar initials={av} size={20} color={c}/>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize:10, color:T.t4, marginBottom:9, lineHeight:1.5 }}>{item.desc}</div>
      <Btn variant={variantMap[item.priority]} size="sm">{item.cta}</Btn>
    </div>
  );
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
function ActivityFeed({ items }) {
  const typeMap = { checkin:{icon:"✓",color:T.success}, new:{icon:"★",color:T.accent}, risk:{icon:"!",color:T.danger}, revenue:{icon:"$",color:T.warn} };
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      {items.map((item,i)=>{
        const t = typeMap[item.type]||typeMap.checkin;
        return (
          <div key={item.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 0", borderBottom:i<items.length-1?`1px solid ${T.border}`:"none" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, background:`${t.color}18`, border:`1px solid ${t.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:t.color, fontFamily:T.mono }}>
              {t.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:T.t2, lineHeight:1.4 }}>{item.text}</div>
              <div style={{ fontSize:10, color:T.t4, marginTop:2, fontFamily:T.mono }}>{item.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MEMBER SEGMENTS ──────────────────────────────────────────────────────────
function MemberSegments({ segments }) {
  const total = segments.reduce((a,s)=>a+s.value,0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {segments.map((s,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
              <span style={{ fontSize:11, fontWeight:600, color:T.t2 }}>{s.label}</span>
              <span style={{ fontSize:12, fontWeight:700, color:s.value>0?T.t1:T.t4, fontFamily:T.mono }}>{s.value}</span>
            </div>
            <MiniBar value={s.value} max={total} color={s.color}/>
            <div style={{ fontSize:9, color:T.t4, marginTop:2 }}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RETENTION PULSE ──────────────────────────────────────────────────────────
function RetentionPulse({ weekOneReturn, retentionRate, avgVisits }) {
  const stats = [
    { label:"Week-1 return rate", value:`${weekOneReturn}%`, color:weekOneReturn>=60?T.success:weekOneReturn>=40?T.warn:T.danger },
    { label:"30-day retention",   value:`${retentionRate}%`, color:retentionRate>=70?T.success:retentionRate>=50?T.warn:T.danger },
    { label:"Avg visits / member",value:avgVisits,           color:avgVisits>=6?T.success:avgVisits>=3?T.warn:T.danger },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column" }}>
      {stats.map((s,i)=>(
        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:i<stats.length-1?`1px solid ${T.border}`:"none" }}>
          <span style={{ fontSize:11, color:T.t3 }}>{s.label}</span>
          <span style={{ fontSize:14, fontWeight:700, color:s.color, fontFamily:T.mono }}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
function QuickActions() {
  const actions = [
    { label:"Create Post",    icon:"✏️" },
    { label:"Add Member",     icon:"👤" },
    { label:"Start Challenge",icon:"🏆" },
    { label:"Create Event",   icon:"📅" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
      {actions.map((a,i)=>(
        <button key={i}
          style={{ padding:"9px 10px", borderRadius:T.radiusSm, background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}`, color:T.t3, fontSize:11, fontWeight:600, fontFamily:T.mono, display:"flex", alignItems:"center", gap:6, transition:"all .15s", cursor:"pointer", textAlign:"left" }}
          onMouseEnter={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.color=T.t2; e.currentTarget.style.borderColor=T.borderH; }}
          onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.03)"; e.currentTarget.style.color=T.t3; e.currentTarget.style.borderColor=T.border; }}
        >
          <span style={{ fontSize:13 }}>{a.icon}</span><span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── REVENUE SECTION ──────────────────────────────────────────────────────────
function RevenueSection({ mrr, newRev, lostRev }) {
  const cards = [
    { label:"Monthly Recurring", value:`$${mrr.toLocaleString()}`, badge:"Healthy",    badgeColor:T.success, sub:"100% recurring revenue", change:"+3%",  up:true },
    { label:"New This Month",    value:`+$${newRev}`,              badge:"New sales",   badgeColor:T.accent,  sub:"1 new membership",       change:"+$420", up:true },
    { label:"Lost Revenue",      value:`$${lostRev}`,              badge:"Zero churn",  badgeColor:T.success, sub:"No cancellations",        change:"$0",    up:true },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
      {cards.map((r,i)=>(
        <div key={i} style={{ position:"relative", overflow:"hidden", padding:"14px 16px", borderRadius:T.radiusSm, background:T.surface2, border:`1px solid ${T.border}` }}>
          <div style={{ position:"absolute", inset:0, background:T.shimmer, pointerEvents:"none" }}/>
          <SectionLabel>{r.label}</SectionLabel>
          <div style={{ fontSize:24, fontWeight:800, color:T.t1, letterSpacing:"-0.04em", fontFamily:T.mono, marginBottom:5 }}>{r.value}</div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
            <Badge color={r.badgeColor}>{r.badge}</Badge>
            <span style={{ fontSize:10, color:r.up?T.success:T.danger }}>{r.up?"↑":"↓"} {r.change}</span>
          </div>
          <div style={{ fontSize:10, color:T.t4 }}>{r.sub}</div>
        </div>
      ))}
    </div>
  );
}


// ─── TOP HEADER ───────────────────────────────────────────────────────────────
function TopHeader({ date, atRiskCount }) {
  return (
    <header style={{ padding:"13px 28px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(6,11,23,0.92)", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:50 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button style={{ width:30, height:30, borderRadius:7, background:"transparent", border:`1px solid ${T.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3 }}>
          {[0,1,2].map(i=><div key={i} style={{ width:12, height:1.5, background:T.t4, borderRadius:99 }}/>)}
        </button>
        <div style={{ fontSize:14, fontWeight:700, color:T.t2, letterSpacing:"-0.01em" }}>{date}</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {atRiskCount>0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 11px", borderRadius:8, background:T.dangerSub, border:`1px solid ${T.dangerBrd}`, cursor:"pointer" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.danger }}/>
            <span style={{ fontSize:11, fontWeight:600, color:T.danger, fontFamily:T.mono }}>{atRiskCount} at risk</span>
          </div>
        )}
        <Btn variant="ghost" size="sm">⊞ Scan QR</Btn>
        <button style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:700, background:`linear-gradient(135deg,${T.accent},#3a5acc)`, color:"#fff", border:"none", cursor:"pointer", fontFamily:T.mono, display:"flex", alignItems:"center", gap:6, boxShadow:`0 2px 14px ${T.accentSub}` }}>
          ✏️ New Post
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Avatar initials="M" size={32} color={T.accent}/>
          <span style={{ fontSize:13, fontWeight:600, color:T.t2 }}>Max</span>
          <span style={{ fontSize:12, color:T.t4 }}>≡</span>
        </div>
      </div>
    </header>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function GymOwnerDashboard() {
  const [activeNav,   setActiveNav]   = useState("overview");
  const [chartRange,  setChartRange]  = useState("daily");
  const [showHeatmap, setShowHeatmap] = useState(false);

  const M = MOCK.metrics;
  const hour     = new Date().getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const chartData   = MOCK.checkInData[chartRange];
  const chartLabels = MOCK.chartLabels[chartRange];
  const chartAvg    = parseFloat((chartData.reduce((a,b)=>a+b,0)/chartData.length).toFixed(1));

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.t1, fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{FONT_INJECT}</style>
      <div style={{ display:"flex", minHeight:"100vh" }}>

        <SidebarNav active={activeNav} setActive={setActiveNav}/>

        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflowX:"hidden" }}>
          <TopHeader date={MOCK.date} atRiskCount={M.atRisk}/>

          <main style={{ padding:"22px 24px 40px", display:"flex", gap:18, alignItems:"flex-start", flex:1 }}>

            {/* ══ CENTER COLUMN ══ */}
            <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:14 }}>

              {/* Greeting */}
              <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.04em", color:T.t1, lineHeight:1.2 }}>
                {greeting}, {MOCK.owner}!{" "}
                <span style={{ fontWeight:400, color:T.t4, fontSize:18 }}>Here's what to focus on today</span>
              </h1>

              <PriorityTasks tasks={MOCK.priorityTasks} date={MOCK.date}/>

              {/* Metrics row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:11 }}>
                <MetricCard label="Today's Check-ins" value={M.checkInsToday} insight="Lowest this week" comparison="100% vs yesterday" comparisonUp={false} sparkData={M.checkInsWeek} cta="Send reminder"/>
                <MetricCard label="Active This Week" value={`${M.activeThisWeek} of ${M.totalMembers}`} insight="Top 20% — steady" comparison="Steady vs last week" comparisonUp={true} sparkData={[2,3,1,4,2,3,1]} sparkColor={T.success}/>
                <MetricCard label="Currently in Gym" value={M.currentlyInGym} insight={`Peak usually ${M.peakHour}`} sparkData={[0,0,1,3,5,4,0]} sparkColor={T.t4} cta="Set a goal"/>
                <MetricCard label="At-Risk Members" value={M.atRisk} insight="No visit in 14+ days" comparison="A recent drop" comparisonUp={false} sparkData={[0,1,1,2,1,2,2]} cta="View all (2)" danger/>
              </div>

              {/* At-risk + New members side by side */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <Card>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div>
                      <SectionLabel>At-Risk Members</SectionLabel>
                      <div style={{ fontSize:11, color:T.t4, marginTop:-4 }}>No visit 14+ days — act now</div>
                    </div>
                    <Btn variant="ghost" size="sm">View all →</Btn>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {MOCK.atRiskMembers.map(m=><AtRiskRow key={m.id} member={m}/>)}
                  </div>
                </Card>

                <Card>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                    <div>
                      <SectionLabel>New Members</SectionLabel>
                      <div style={{ fontSize:11, color:T.t4, marginTop:-4 }}>Joined in the last 7 days</div>
                    </div>
                    <Btn variant="ghost" size="sm">Add member</Btn>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                    {MOCK.newMembers.map(m=><NewMemberRow key={m.id} member={m}/>)}
                  </div>
                  <Divider/>
                  <div style={{ padding:"10px 12px", borderRadius:T.radiusSm, background:T.successSub, border:`1px solid ${T.successBrd}` }}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.success, marginBottom:2 }}>Week-1 return rate: 60%</div>
                    <div style={{ fontSize:10, color:T.t4 }}>Good early retention — keep engaging them in the first 2 weeks.</div>
                  </div>
                </Card>
              </div>

              {/* Check-in chart */}
              <Card>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
                  <div>
                    <SectionLabel>Check-in Activity</SectionLabel>
                    <div style={{ fontSize:11, color:T.t4 }}>Daily avg <span style={{ color:T.t1, fontWeight:600, fontFamily:T.mono }}>{chartAvg}</span> · Peak activity 5–7pm</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <button onClick={()=>setShowHeatmap(h=>!h)} style={{ padding:"4px 10px", borderRadius:6, fontSize:10, fontWeight:600, cursor:"pointer", fontFamily:T.mono, background:showHeatmap?T.accentSub:"transparent", color:showHeatmap?T.accent:T.t4, border:`1px solid ${showHeatmap?T.accentBrd:T.border}`, transition:"all .15s" }}>
                      Heatmap
                    </button>
                    <RangeToggle options={[{id:"daily",label:"Daily"},{id:"weekly",label:"Weekly"},{id:"monthly",label:"Monthly"}]} value={chartRange} onChange={setChartRange}/>
                  </div>
                </div>
                {showHeatmap
                  ? <CheckInHeatmap data={MOCK.checkInHeatmap}/>
                  : <>
                      <BarChart data={chartData} labels={chartLabels} target={10}/>
                      <div style={{ display:"flex", gap:16, marginTop:8 }}>
                        {[{color:T.accent,label:"Today"},{color:"rgba(81,121,255,0.28)",label:"Daily"},{color:"rgba(255,255,255,0.16)",label:"Target"},{color:T.accentBrd,label:"Avg"}].map((l,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <div style={{ width:10, height:2, background:l.color, borderRadius:2 }}/>
                            <span style={{ fontSize:9, color:T.t4, fontFamily:T.mono }}>{l.label}</span>
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
                    <SectionLabel>Revenue</SectionLabel>
                    <div style={{ fontSize:11, color:T.t4, marginTop:-4 }}>Monthly performance at a glance</div>
                  </div>
                  <Badge color={T.success}>Healthy · On Target</Badge>
                </div>
                <RevenueSection mrr={M.mrr} newRev={M.newRevenue} lostRev={M.lostRevenue}/>
                <Divider/>
                <div style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 14px", borderRadius:T.radiusSm, background:T.successSub, border:`1px solid ${T.successBrd}` }}>
                  <span style={{ fontSize:20 }}>📈</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.t1 }}>Member Growth: <span style={{ color:T.success }}>+{M.memberGrowth} this month</span></div>
                    <div style={{ fontSize:10, color:T.t4, marginTop:2 }}>Healthy — on track with your retention goals for Q2</div>
                  </div>
                  <Badge color={T.success}>Healthy</Badge>
                </div>
              </Card>

              {/* Member segments */}
              <Card>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div>
                    <SectionLabel>Member Segments</SectionLabel>
                    <div style={{ fontSize:11, color:T.t4, marginTop:-4 }}>Breakdown of your {M.totalMembers} members</div>
                  </div>
                  <Btn variant="ghost" size="sm">View members →</Btn>
                </div>
                <MemberSegments segments={MOCK.memberSegments}/>
              </Card>

            </div>

            {/* ══ RIGHT SIDEBAR ══ */}
            <aside style={{ width:264, flexShrink:0, display:"flex", flexDirection:"column", gap:12, position:"sticky", top:68 }}>

              <Card>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <SectionLabel style={{ marginBottom:0 }}>Action Items</SectionLabel>
                  <Badge color={T.t4}>Summary</Badge>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {MOCK.actionItems.map(item=><ActionItem key={item.id} item={item}/>)}
                </div>
              </Card>

              <Card>
                <SectionLabel>Quick Actions</SectionLabel>
                <QuickActions/>
              </Card>

              <Card>
                <SectionLabel>Retention Pulse</SectionLabel>
                <RetentionPulse weekOneReturn={M.weekOneReturn} retentionRate={M.retentionRate} avgVisits={M.avgVisits}/>
              </Card>

              <Card>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
                  <SectionLabel style={{ marginBottom:0 }}>Recent Activity</SectionLabel>
                  <Btn variant="ghost" size="sm">All →</Btn>
                </div>
                <ActivityFeed items={MOCK.recentActivity}/>
              </Card>

              {/* Churn risk callout */}
              <div style={{ padding:"12px 14px", borderRadius:T.radiusSm, background:T.dangerSub, border:`1px solid ${T.dangerBrd}`, borderLeft:`3px solid ${T.danger}` }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.danger, marginBottom:4 }}>⚠ Churn risk</div>
                <div style={{ fontSize:11, color:T.t3, lineHeight:1.5, marginBottom:8 }}>
                  2 members haven't visited in 14+ days. Reaching out in the next 48 hours doubles retention probability.
                </div>
                <Btn variant="danger" size="sm">Message them now</Btn>
              </div>

            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}
