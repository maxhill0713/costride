/**
 * TabCoachToday — Mission Control Redesign
 *
 * Design philosophy: "Every pixel has a job."
 * Gym owners open this page and immediately know what to act on.
 * No passive data. No decorative charts. No wasted space.
 *
 * LAYOUT:
 *   [COMMAND HEADER]  — greeting + live pulse + next session
 *   [TODAY'S PRIORITIES] — 3-5 ranked, actionable intelligence cards
 *   [TWO-COLUMN GRID]
 *     Left:  Attendance Chart (14d, meaningful) → Today's Sessions → Activity Feed
 *     Right: Weekly Performance → Client Risk Feed
 *
 * REMOVED: stat cards, tiny sparklines, redundant adherence %s, daily goals widget
 * ADDED:   priority engine, session health scoring, risk feed with actions, activity stream
 */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { differenceInDays, format, parseISO } from "date-fns";

// ─── CSS INJECTION ────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("mcc-css")) {
  const s = document.createElement("style");
  s.id = "mcc-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

    .mcc-root, .mcc-root * { box-sizing: border-box; margin: 0; padding: 0; }
    .mcc-root { font-family: 'Figtree', system-ui, sans-serif; }
    .mono { font-family: 'DM Mono', monospace !important; }

    @keyframes mcc-up    { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
    @keyframes mcc-in    { from { opacity:0; transform:scale(.98)      } to { opacity:1; transform:none } }
    @keyframes mcc-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes mcc-grow  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
    @keyframes mcc-bar   { from{height:0} to{height:var(--h)} }

    .u  { animation: mcc-up .3s cubic-bezier(.22,1,.36,1) both; }
    .u1 { animation-delay: .04s } .u2 { animation-delay: .08s }
    .u3 { animation-delay: .12s } .u4 { animation-delay: .16s }
    .u5 { animation-delay: .20s }

    .mcc-btn { font-family: 'Figtree', sans-serif; cursor: pointer; border: none; outline: none;
      transition: all .13s; display: inline-flex; align-items: center; gap: 5px; }
    .mcc-btn:active { transform: scale(.96); }

    .mcc-hover { transition: background .1s; }
    .mcc-hover:hover { background: rgba(255,255,255,0.025) !important; }

    .mcc-scr::-webkit-scrollbar { width: 2px; }
    .mcc-scr::-webkit-scrollbar-thumb { background: rgba(255,255,255,.07); border-radius: 4px; }

    .mcc-card { border-radius: 11px; overflow: hidden; transition: border-color .15s; }
    .mcc-card:hover { border-color: rgba(255,255,255,0.10) !important; }

    .pri-card { border-radius: 10px; cursor: pointer; transition: all .14s; }
    .pri-card:hover { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.11) !important; }

    .tip { position: absolute; pointer-events: none; transition: opacity .12s; }
  `;
  document.head.appendChild(s);
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  bg:  "#07090e", s0: "#0a0c14", s1: "#0d1018", s2: "#10141f", s3: "#131926",
  b0:  "rgba(255,255,255,0.05)", b1: "rgba(255,255,255,0.08)", b2: "rgba(255,255,255,0.13)",
  t0:  "#eef2f7", t1: "#c8d3e0", t2: "#7e90a4", t3: "#3d5068", t4: "#1e2e3e",
  blue:    "#4a8df0", blueDim:  "rgba(74,141,240,0.09)", blueBrd: "rgba(74,141,240,0.22)",
  green:   "#1ea870", greenDim: "rgba(30,168,112,0.09)", greenBrd:"rgba(30,168,112,0.22)",
  amber:   "#d68e28", amberDim: "rgba(214,142,40,0.09)", amberBrd:"rgba(214,142,40,0.22)",
  red:     "#d95050", redDim:   "rgba(217,80,80,0.09)",  redBrd:  "rgba(217,80,80,0.22)",
  purple:  "#8b6cf6", purpleDim:"rgba(139,108,246,0.09)",purpleBrd:"rgba(139,108,246,0.22)",
};

const CARD  = { background: T.s1, border: `1px solid ${T.b1}`, borderRadius: 11, overflow: "hidden" };
const CSHADOW = "inset 0 1px 0 rgba(255,255,255,0.03), 0 2px 10px rgba(0,0,0,0.4)";

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Lbl = ({ c, style = {} }) => (
  <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: c || T.t3, ...style }}>{c}</span>
);

const Dot = ({ color, pulse }) => (
  <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0,
    animation: pulse ? "mcc-pulse 2s ease-in-out infinite" : "none" }} />
);

const Chip = ({ children, color, bg, brd, style = {} }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, fontWeight:800,
    letterSpacing:".07em", textTransform:"uppercase", color: color||T.t2,
    background: bg||"rgba(255,255,255,0.05)", border:`1px solid ${brd||T.b1}`,
    borderRadius:4, padding:"2px 7px", whiteSpace:"nowrap", ...style }}>
    {children}
  </span>
);

const Divider = ({ style = {} }) => <div style={{ height:1, background:T.b0, ...style }} />;

const CardHead = ({ label, sub, right, border = true }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
    padding:"13px 18px", ...(border ? { borderBottom:`1px solid ${T.b0}` } : {}) }}>
    <div>
      <div style={{ fontSize:11.5, fontWeight:700, color:T.t0, letterSpacing:"-.01em" }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:T.t2, marginTop:2 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

function Avatar({ name, src, size = 28, accent = T.t3 }) {
  const [err, setErr] = useState(false);
  const ini = (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, overflow:"hidden",
      background:`${accent}18`, border:`1.5px solid ${accent}28`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*.33, fontWeight:700, color:accent }}>
      {src&&!err ? <img src={src} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setErr(true)}/> : ini}
    </div>
  );
}

function ActionBtn({ label, color, bg, brd, onClick, icon }) {
  return (
    <button className="mcc-btn" onClick={onClick} style={{ fontSize:10, fontWeight:700, color, background:bg,
      border:`1px solid ${brd}`, borderRadius:6, padding:"5px 11px", whiteSpace:"nowrap" }}>
      {icon && icon}{label}
    </button>
  );
}

// ─── 1. TODAY'S PRIORITIES (HERO SECTION) ────────────────────────────────────
function derivePriorities({ allMemberships, checkIns, sessions, now, openModal, setTab }) {
  const priorities = [];

  // P1: Clients inactive 7+ days
  const inactive7 = allMemberships.filter(m => {
    const mCI = checkIns.filter(c => c.user_id === m.user_id);
    const last = mCI.sort((a,b) => new Date(b.check_in_date||b.check_in_time) - new Date(a.check_in_date||a.check_in_time))[0];
    const d = last ? differenceInDays(now, new Date(last.check_in_date||last.check_in_time)) : 999;
    return d >= 7 && d < 999;
  });
  const neverChecked = allMemberships.filter(m => checkIns.filter(c=>c.user_id===m.user_id).length === 0);

  if (inactive7.length > 0 || neverChecked.length > 0) {
    const count = inactive7.length + neverChecked.length;
    priorities.push({
      id: "inactive",
      severity: "high",
      icon: "🔴",
      title: `${count} client${count>1?"s":""} haven't attended in 7+ days`,
      context: count > 1
        ? `${inactive7.map(m=>m.user_name||"Client").slice(0,2).join(", ")}${count>2?` + ${count-2} more`:""} — each additional inactive day increases churn risk by ~4%.`
        : `${(inactive7[0]||neverChecked[0])?.user_name||"A client"} — re-engagement now is 3× more effective than waiting another week.`,
      cta: "Send Re-engagement Messages",
      ctaFn: () => openModal?.("message"),
      color: T.red, colorDim: T.redDim, colorBrd: T.redBrd,
    });
  }

  // P2: Underbooked sessions today
  const underbooked = sessions.filter(s => s.status !== "done" && s.cap > 0 && (s.booked / s.cap) < 0.4);
  if (underbooked.length > 0) {
    const s = underbooked[0];
    const pct = Math.round((s.booked/s.cap)*100);
    priorities.push({
      id: "underbooked",
      severity: "med",
      icon: "🟡",
      title: `${underbooked.length > 1 ? `${underbooked.length} sessions are` : `"${s.name}" is`} significantly underbooked`,
      context: `${s.name} is at ${pct}% capacity (${s.booked}/${s.cap} spots). A quick message to your members could fill ${s.cap - s.booked} open slot${s.cap-s.booked>1?"s":""}.`,
      cta: "Promote Session",
      ctaFn: () => openModal?.("classes"),
      color: T.amber, colorDim: T.amberDim, colorBrd: T.amberBrd,
    });
  }

  // P3: Clients with zero check-ins ever (onboarding risk)
  if (neverChecked.length > 0 && inactive7.length === 0) {
    priorities.push({
      id: "onboarding",
      severity: "med",
      icon: "🟡",
      title: `${neverChecked.length} member${neverChecked.length>1?"s have":""} never checked in`,
      context: `New members who don't check in within their first 2 weeks are 70% more likely to cancel. Reach out to ${neverChecked[0]?.user_name||"them"} today.`,
      cta: "Message New Members",
      ctaFn: () => openModal?.("message"),
      color: T.amber, colorDim: T.amberDim, colorBrd: T.amberBrd,
    });
  }

  // P4: No sessions scheduled today
  if (sessions.length === 0) {
    priorities.push({
      id: "nosessions",
      severity: "low",
      icon: "🔵",
      title: "No sessions scheduled today",
      context: "Gyms with scheduled classes have 38% higher member retention. Adding even one group session can significantly boost engagement.",
      cta: "Schedule a Session",
      ctaFn: () => openModal?.("classes"),
      color: T.blue, colorDim: T.blueDim, colorBrd: T.blueBrd,
    });
  }

  // P5: Live session with no check-ins
  const liveEmpty = sessions.find(s => s.status === "live" && s.booked > 0 && s.checkInsToday === 0);
  if (liveEmpty) {
    priorities.push({
      id: "livemissing",
      severity: "high",
      icon: "🔴",
      title: `"${liveEmpty.name}" is live but no one has checked in`,
      context: `${liveEmpty.booked} member${liveEmpty.booked>1?"s":""} booked this session. Use QR check-in or manually log attendance now.`,
      cta: "Open Check-in Scanner",
      ctaFn: () => openModal?.("qrScanner"),
      color: T.red, colorDim: T.redDim, colorBrd: T.redBrd,
    });
  }

  // If everything is fine
  if (priorities.length === 0) {
    priorities.push({
      id: "allgood",
      severity: "ok",
      icon: "✅",
      title: "You're on top of everything today",
      context: `All clients active, sessions healthy. Use this window to plan next week's schedule or review monthly performance.`,
      cta: "View Analytics",
      ctaFn: () => setTab?.("analytics"),
      color: T.green, colorDim: T.greenDim, colorBrd: T.greenBrd,
    });
  }

  return priorities.slice(0, 5);
}

function TodaysPriorities({ priorities }) {
  const SvgIcons = {
    high: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
    med: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={12} cy={12} r={10}/><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12.01} y2={16}/></svg>,
    low: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={12} cy={12} r={10}/><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12.01} y2={16}/></svg>,
    ok: <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>,
  };

  return (
    <div className="mcc-card u" style={{ ...CARD, boxShadow: CSHADOW, marginBottom: 14 }}>
      <CardHead
        label="Today's Priorities"
        sub={`${priorities.filter(p=>p.severity!=="ok").length} item${priorities.filter(p=>p.severity!=="ok").length!==1?"s":""} need your attention`}
        right={
          <Chip color={priorities[0]?.severity==="ok" ? T.green : T.red} bg={priorities[0]?.severity==="ok" ? T.greenDim : T.redDim} brd={priorities[0]?.severity==="ok" ? T.greenBrd : T.redBrd}>
            {priorities[0]?.severity==="ok" ? "All Clear" : priorities.filter(p=>p.severity==="high").length > 0 ? `${priorities.filter(p=>p.severity==="high").length} Urgent` : "Review"}
          </Chip>
        }
      />
      <div style={{ display:"grid", gridTemplateColumns: priorities.length === 1 ? "1fr" : priorities.length === 2 ? "1fr 1fr" : "1fr 1fr 1fr", gap:0 }}>
        {priorities.map((p, i) => (
          <div key={p.id} className="pri-card"
            style={{ background:"transparent", border:"none", borderRight: i < priorities.length-1 ? `1px solid ${T.b0}` : "none",
              padding:"16px 18px", display:"flex", flexDirection:"column", gap:10 }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
              <div style={{ width:26, height:26, borderRadius:7, background:p.colorDim, border:`1px solid ${p.colorBrd}`,
                display:"flex", alignItems:"center", justifyContent:"center", color:p.color, flexShrink:0, marginTop:1 }}>
                {SvgIcons[p.severity]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:T.t0, lineHeight:1.35, letterSpacing:"-.01em" }}>{p.title}</div>
              </div>
            </div>
            {/* Context */}
            <div style={{ fontSize:11, color:T.t2, lineHeight:1.6, paddingLeft:35 }}>{p.context}</div>
            {/* CTA */}
            <div style={{ paddingLeft:35 }}>
              <button className="mcc-btn" onClick={p.ctaFn}
                style={{ fontSize:11, fontWeight:700, color:p.color, background:p.colorDim, border:`1px solid ${p.colorBrd}`,
                  borderRadius:7, padding:"7px 14px", display:"flex", alignItems:"center", gap:5 }}>
                {p.cta}
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={5} y1={12} x2={19} y2={12}/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. ATTENDANCE CHART (14-day, meaningful) ─────────────────────────────────
function AttendanceChart({ checkIns, now }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const data = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const t = new Date(now);
    t.setDate(t.getDate() - (13 - i));
    const count = checkIns.filter(c => {
      const d = new Date(c.check_in_date || c.check_in_time);
      return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
    }).length;
    return {
      date: t,
      label: t.toLocaleDateString("en-GB", { weekday:"short", day:"numeric" }),
      v: count,
      isToday: i === 13,
      isWeekend: t.getDay()===0 || t.getDay()===6,
    };
  }), [checkIns, now]);

  const maxV = Math.max(...data.map(d=>d.v), 1);
  const W = 100, H = 80; // SVG viewBox percentages
  const PAD = { t:8, b:28, l:4, r:4 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / (data.length-1)) * plotW,
    y: PAD.t + plotH - (d.v / maxV) * plotH,
    ...d,
  }));

  // Detect anomalies (drops > 50% from adjacent average)
  const anomalies = pts.filter((p, i) => {
    if (i < 1 || i > pts.length - 2) return false;
    const avg = (pts[i-1].v + pts[i+1].v) / 2;
    return avg > 2 && p.v < avg * 0.4;
  });

  const pathD = pts.map((p,i) => `${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${PAD.t+plotH} L ${pts[0].x} ${PAD.t+plotH} Z`;

  const prevWeek = data.slice(0,7).reduce((a,b)=>a+b.v,0);
  const thisWeek = data.slice(7).reduce((a,b)=>a+b.v,0);
  const trend = prevWeek > 0 ? Math.round(((thisWeek-prevWeek)/prevWeek)*100) : 0;
  const trendUp = trend >= 0;

  return (
    <div className="mcc-card u u1" style={{ ...CARD, boxShadow: CSHADOW, marginBottom: 12 }}>
      <CardHead
        label="Attendance — Last 14 Days"
        sub={`${thisWeek} check-ins this week`}
        right={
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {anomalies.length > 0 && (
              <Chip color={T.amber} bg={T.amberDim} brd={T.amberBrd}>
                <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94"/></svg>
                {anomalies.length} anomaly{anomalies.length>1?"s":""}
              </Chip>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:5,
              background: trendUp ? T.greenDim : T.redDim, border:`1px solid ${trendUp ? T.greenBrd : T.redBrd}` }}>
              <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={trendUp?T.green:T.red} strokeWidth={2.5}>
                {trendUp ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
              </svg>
              <span className="mono" style={{ fontSize:10, fontWeight:500, color:trendUp?T.green:T.red }}>
                {Math.abs(trend)}% vs last week
              </span>
            </div>
          </div>
        }
      />
      <div style={{ padding:"16px 18px 8px", position:"relative" }}>
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:160, overflow:"visible" }}
          onMouseLeave={() => setTooltip(null)}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={T.blue} stopOpacity={0.18}/>
              <stop offset="100%" stopColor={T.blue} stopOpacity={0.01}/>
            </linearGradient>
            <linearGradient id="areaGradA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={T.amber} stopOpacity={0.12}/>
              <stop offset="100%" stopColor={T.amber} stopOpacity={0.01}/>
            </linearGradient>
          </defs>

          {/* Weekend bands */}
          {pts.filter(p=>p.isWeekend&&!p.isToday).map((p,i) => (
            <rect key={i} x={p.x-1.5} y={PAD.t} width={3} height={plotH} fill="rgba(255,255,255,0.015)" rx={1}/>
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGrad)"/>

          {/* Anomaly areas */}
          {anomalies.map((p,i) => (
            <circle key={i} cx={p.x} cy={p.y} r={5} fill={T.amberDim} stroke={T.amber} strokeWidth={1}/>
          ))}

          {/* Line */}
          <path d={pathD} fill="none" stroke={T.blue} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" opacity={.85}/>

          {/* Today highlight */}
          {(() => {
            const p = pts[pts.length-1];
            return (
              <>
                <line x1={p.x} y1={PAD.t} x2={p.x} y2={PAD.t+plotH} stroke={T.blue} strokeWidth={.8} strokeDasharray="2 2" opacity={.4}/>
                <circle cx={p.x} cy={p.y} r={3} fill={T.blue} stroke={T.s1} strokeWidth={1.5}/>
              </>
            );
          })()}

          {/* Hover targets */}
          {pts.map((p, i) => (
            <rect key={i} x={p.x-3} y={PAD.t} width={6} height={plotH+2} fill="transparent" style={{cursor:"crosshair"}}
              onMouseEnter={() => setTooltip({ x:p.x, y:p.y, label:p.label, v:p.v, isAnomaly:anomalies.includes(p) })}/>
          ))}

          {/* Tooltip */}
          {tooltip && (
            <g style={{ pointerEvents:"none" }}>
              <circle cx={tooltip.x} cy={tooltip.y} r={3} fill={tooltip.isAnomaly?T.amber:T.blue} stroke={T.s1} strokeWidth={1.5}/>
              <rect x={Math.min(tooltip.x-12, W-28)} y={tooltip.y-18} width={26} height={14} rx={3} fill={T.s3} stroke={T.b2} strokeWidth={.5}/>
              <text x={Math.min(tooltip.x, W-15)} y={tooltip.y-8} textAnchor="middle" fill={T.t0} fontSize={6} fontFamily="DM Mono" fontWeight={500}>{tooltip.v}</text>
            </g>
          )}

          {/* X axis labels */}
          {pts.filter((_, i) => i % 2 === 0 || i === pts.length-1).map((p,i) => (
            <text key={i} x={p.x} y={H-4} textAnchor="middle" fontSize={5.5} fill={p.isToday?T.blue:T.t4} fontFamily="Figtree" fontWeight={p.isToday?700:400}>
              {p.isToday ? "Today" : p.label}
            </text>
          ))}
        </svg>

        {/* Insight strip below chart */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:1, borderTop:`1px solid ${T.b0}`, marginTop:4 }}>
          {[
            { l:"This week", v:thisWeek, sub:"check-ins" },
            { l:"Daily avg", v:data.slice(7).length ? (thisWeek/7).toFixed(1) : "—", sub:"per day" },
            { l:"Best day", v:Math.max(...data.slice(7).map(d=>d.v)), sub:data.slice(7).reduce((a,b)=>b.v>a.v?b:a,{v:-1,label:"?"}).label },
          ].map((s,i) => (
            <div key={i} style={{ padding:"10px 14px", borderRight: i<2 ? `1px solid ${T.b0}` : "none" }}>
              <div style={{ fontSize:9.5, fontWeight:700, color:T.t3, textTransform:"uppercase", letterSpacing:".11em", marginBottom:4 }}>{s.l}</div>
              <div className="mono" style={{ fontSize:18, fontWeight:500, color:T.t0, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:T.t3, marginTop:2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3. TODAY'S SESSIONS (UPGRADED) ──────────────────────────────────────────
function sessionHealth(booked, cap) {
  const pct = cap > 0 ? booked / cap : 0;
  if (pct >= 0.85) return { label:"Full",         color:T.green,  dim:T.greenDim,  brd:T.greenBrd  };
  if (pct >= 0.5 ) return { label:"Healthy",      color:T.blue,   dim:T.blueDim,   brd:T.blueBrd   };
  if (pct >= 0.2 ) return { label:"Underbooked",  color:T.amber,  dim:T.amberDim,  brd:T.amberBrd  };
  return               { label:"Critical",     color:T.red,    dim:T.redDim,    brd:T.redBrd    };
}

function TodaysSessions({ sessions, openModal }) {
  const [expanded, setExpanded] = useState(null);

  const statMap = { live:"Live", upcoming:"Upcoming", done:"Done" };
  const statColor = { live:T.green, upcoming:T.blue, done:T.t3 };

  if (sessions.length === 0) return (
    <div className="mcc-card u u2" style={{ ...CARD, boxShadow:CSHADOW, marginBottom:12 }}>
      <CardHead label="Today's Sessions" right={
        <ActionBtn label="Add Session" color={T.blue} bg={T.blueDim} brd={T.blueBrd} onClick={()=>openModal?.("classes")}
          icon={<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>}/>
      }/>
      <div style={{ padding:"36px 24px", textAlign:"center" }}>
        <div style={{ width:38, height:38, borderRadius:10, background:T.s2, border:`1px solid ${T.b1}`,
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", color:T.t3 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>
        </div>
        <div style={{ fontSize:13, fontWeight:600, color:T.t1, marginBottom:6 }}>No sessions scheduled</div>
        <div style={{ fontSize:11, color:T.t3, lineHeight:1.6, maxWidth:300, margin:"0 auto 16px" }}>
          Classes and PT sessions help track fill rates, attendance, and client engagement in one place.
        </div>
        <button className="mcc-btn" onClick={()=>openModal?.("classes")}
          style={{ fontSize:12, fontWeight:700, color:T.blue, background:T.blueDim, border:`1px solid ${T.blueBrd}`, borderRadius:8, padding:"9px 18px" }}>
          Schedule First Session
        </button>
      </div>
    </div>
  );

  return (
    <div className="mcc-card u u2" style={{ ...CARD, boxShadow:CSHADOW, marginBottom:12 }}>
      <CardHead
        label="Today's Sessions"
        sub={`${sessions.length} scheduled · ${Math.round(sessions.reduce((a,s)=>a+(s.cap>0?s.booked/s.cap:0),0)/sessions.length*100)}% avg fill`}
        right={
          <ActionBtn label="Add Session" color={T.blue} bg={T.blueDim} brd={T.blueBrd} onClick={()=>openModal?.("classes")}
            icon={<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>}/>
        }
      />

      {/* Column heads */}
      <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 80px 100px 80px",
        padding:"7px 18px", borderBottom:`1px solid ${T.b0}`, gap:0 }}>
        {["Time","Session","Fill","Health","Actions"].map((h,i) => (
          <div key={i} style={{ fontSize:9.5, fontWeight:700, color:T.t3, textTransform:"uppercase", letterSpacing:".11em", textAlign: i>1?"center":"left" }}>{h}</div>
        ))}
      </div>

      {sessions.map((s, i) => {
        const health = sessionHealth(s.booked, s.cap);
        const pct = s.cap > 0 ? Math.round((s.booked/s.cap)*100) : 0;
        const isExp = expanded === s.id;
        const isDone = s.status === "done";
        return (
          <div key={s.id} style={{ opacity: isDone ? .6 : 1 }}>
            <div className="mcc-hover" onClick={() => setExpanded(isExp ? null : s.id)}
              style={{ display:"grid", gridTemplateColumns:"60px 1fr 80px 100px 80px",
                padding:"12px 18px", gap:0, alignItems:"center", cursor:"pointer",
                borderBottom: i<sessions.length-1 ? `1px solid ${T.b0}` : "none",
                borderLeft:`2.5px solid ${isDone ? T.t4 : health.color}` }}>

              {/* Time */}
              <div className="mono" style={{ fontSize:11, color:isDone?T.t3:T.t2 }}>{s.time||"—"}</div>

              {/* Name + coach + status */}
              <div style={{ minWidth:0, paddingRight:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:4 }}>
                  {s.status==="live" && <Dot color={T.green} pulse/>}
                  <span style={{ fontSize:13, fontWeight:600, color:isDone?T.t2:T.t0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</span>
                  <Chip color={statColor[s.status]} bg={`${statColor[s.status]}10`} brd={`${statColor[s.status]}25`}>
                    {statMap[s.status]}
                  </Chip>
                </div>
                {s.coach && <div style={{ fontSize:10, color:T.t3 }}>{s.coach} · {s.duration}</div>}
              </div>

              {/* Fill bar + numbers */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <div style={{ width:"100%", height:3, background:T.b0, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:isDone?T.t4:health.color, borderRadius:99, transition:"width .6s" }}/>
                </div>
                <div className="mono" style={{ fontSize:9.5, color:T.t2 }}>{s.booked}/{s.cap}</div>
              </div>

              {/* Health badge */}
              <div style={{ display:"flex", justifyContent:"center" }}>
                <Chip color={health.color} bg={health.dim} brd={health.brd}>{health.label}</Chip>
              </div>

              {/* Actions */}
              <div style={{ display:"flex", justifyContent:"center" }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={T.t4} strokeWidth={2}
                  style={{ transform:isExp?"rotate(90deg)":"none", transition:"transform .2s" }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>

            {/* Expanded quick actions */}
            {isExp && (
              <div style={{ padding:"12px 18px 14px 22px", borderBottom:`1px solid ${T.b0}`, background:"rgba(255,255,255,0.01)" }}>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                  <ActionBtn label="Message Attendees" color={T.blue} bg={T.blueDim} brd={T.blueBrd} onClick={()=>openModal?.("message")}
                    icon={<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}/>
                  {!isDone && health.label !== "Full" && (
                    <ActionBtn label="Promote Class" color={T.amber} bg={T.amberDim} brd={T.amberBrd} onClick={()=>openModal?.("classes")}
                      icon={<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>}/>
                  )}
                  <ActionBtn label="Open Check-in" color={T.green} bg={T.greenDim} brd={T.greenBrd} onClick={()=>openModal?.("qrScanner")}
                    icon={<svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={4} height={4}/></svg>}/>
                </div>
                {s.notes && (
                  <div style={{ marginTop:10, fontSize:11, color:T.t3, fontStyle:"italic" }}>{s.notes}</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Footer totals */}
      <div style={{ padding:"11px 18px", display:"flex", gap:20, alignItems:"center", background:"rgba(255,255,255,0.01)" }}>
        {[
          { l:"Total booked",   v:sessions.reduce((a,s)=>a+s.booked,0) },
          { l:"Total capacity", v:sessions.reduce((a,s)=>a+s.cap,0) },
          { l:"Sessions done",  v:`${sessions.filter(s=>s.status==="done").length}/${sessions.length}` },
        ].map((s,i) => (
          <div key={i} style={{ display:"flex", gap:6, alignItems:"baseline" }}>
            <span className="mono" style={{ fontSize:14, fontWeight:500, color:T.t1 }}>{s.v}</span>
            <span style={{ fontSize:9.5, fontWeight:700, color:T.t3, textTransform:"uppercase", letterSpacing:".1em" }}>{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. RECENT ACTIVITY FEED ──────────────────────────────────────────────────
function ActivityFeed({ checkIns, allMemberships, now }) {
  const events = useMemo(() => {
    const evs = checkIns.map(ci => {
      const member = allMemberships.find(m => m.user_id === ci.user_id);
      const d = new Date(ci.check_in_date || ci.check_in_time);
      const minsAgo = Math.floor((now - d) / 60000);
      return {
        type: "checkin",
        name: member?.user_name || ci.user_name || "Member",
        avatar: member?.avatar_url || null,
        time: minsAgo < 1 ? "Just now" : minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo/60)}h ago` : `${Math.floor(minsAgo/1440)}d ago`,
        timeMs: d.getTime(),
        color: T.green, label: "Checked in",
      };
    });
    return evs.sort((a,b) => b.timeMs - a.timeMs).slice(0, 10);
  }, [checkIns, allMemberships, now]);

  return (
    <div className="mcc-card u u4" style={{ ...CARD, boxShadow:CSHADOW }}>
      <CardHead label="Recent Activity" sub={events.length ? `${events.length} events today` : "No activity yet today"} />
      {events.length === 0 ? (
        <div style={{ padding:"28px 18px", textAlign:"center" }}>
          <div style={{ fontSize:12, color:T.t3, lineHeight:1.6 }}>Activity will appear here as members check in, book sessions, or receive messages.</div>
        </div>
      ) : (
        <div className="mcc-scr" style={{ maxHeight:280, overflowY:"auto" }}>
          {events.map((ev, i) => (
            <div key={i} className="mcc-hover" style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
              borderBottom: i<events.length-1 ? `1px solid ${T.b0}` : "none" }}>
              <div style={{ position:"relative", flexShrink:0 }}>
                <Avatar name={ev.name} src={ev.avatar} size={28} accent={ev.color}/>
                <div style={{ position:"absolute", bottom:-1, right:-1, width:8, height:8, borderRadius:"50%",
                  background:ev.color, border:`1.5px solid ${T.s1}` }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.t1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {ev.name}
                </div>
                <div style={{ fontSize:10, color:T.t3, marginTop:1 }}>{ev.label}</div>
              </div>
              <div className="mono" style={{ fontSize:10, color:T.t4, flexShrink:0 }}>{ev.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 5. WEEKLY PERFORMANCE SUMMARY ───────────────────────────────────────────
function WeeklyPerformance({ checkIns, sessions, allMemberships, now }) {
  const thisWeekStart = new Date(now); thisWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekStart = new Date(now); lastWeekStart.setDate(lastWeekStart.getDate() - 14);

  const ciThisWeek = checkIns.filter(c => new Date(c.check_in_date||c.check_in_time) >= thisWeekStart).length;
  const ciLastWeek = checkIns.filter(c => {
    const d = new Date(c.check_in_date||c.check_in_time);
    return d >= lastWeekStart && d < thisWeekStart;
  }).length;

  const totalBooked = sessions.reduce((a,s)=>a+s.booked,0);
  const totalCap    = sessions.reduce((a,s)=>a+s.cap,0);
  const fillRate    = totalCap > 0 ? Math.round((totalBooked/totalCap)*100) : 0;

  const atRiskNow  = allMemberships.filter(m => {
    const last = checkIns.filter(c=>c.user_id===m.user_id).sort((a,b)=>new Date(b.check_in_date||b.check_in_time)-new Date(a.check_in_date||a.check_in_time))[0];
    return !last || differenceInDays(now, new Date(last.check_in_date||last.check_in_time)) >= 14;
  }).length;

  const ciChange = ciLastWeek > 0 ? Math.round(((ciThisWeek-ciLastWeek)/ciLastWeek)*100) : null;

  const metrics = [
    { l:"Attendance", v:ciThisWeek, change:ciChange, up:ciChange>=0, sub:"check-ins this week" },
    { l:"Fill Rate",  v:`${fillRate}%`, change:null, up:fillRate>=60, sub:totalCap>0?`${totalBooked}/${totalCap} spots`:"No sessions yet" },
    { l:"At Risk",    v:atRiskNow, change:null, up:atRiskNow===0, sub:atRiskNow>0?"inactive 14+ days":"all clients active" },
  ];

  return (
    <div className="mcc-card u" style={{ ...CARD, boxShadow:CSHADOW, marginBottom:12 }}>
      <CardHead label="Weekly Performance" />
      <div style={{ display:"flex", flexDirection:"column" }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ padding:"12px 16px", borderBottom: i<metrics.length-1 ? `1px solid ${T.b0}` : "none",
            display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <div>
              <div style={{ fontSize:9.5, fontWeight:700, color:T.t3, textTransform:"uppercase", letterSpacing:".11em", marginBottom:5 }}>{m.l}</div>
              <div className="mono" style={{ fontSize:22, fontWeight:500, color: m.l==="At Risk" && m.v>0 ? T.red : m.l==="At Risk" ? T.green : T.t0, letterSpacing:"-.04em", lineHeight:1 }}>{m.v}</div>
              <div style={{ fontSize:10, color:T.t3, marginTop:3 }}>{m.sub}</div>
            </div>
            {m.change !== null && (
              <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:6,
                background: m.up ? T.greenDim : T.redDim, border:`1px solid ${m.up?T.greenBrd:T.redBrd}` }}>
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={m.up?T.green:T.red} strokeWidth={2.5}>
                  {m.up ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                </svg>
                <span className="mono" style={{ fontSize:11, color:m.up?T.green:T.red }}>{Math.abs(m.change)}%</span>
              </div>
            )}
            {m.change === null && (
              <div style={{ width:32, height:3, borderRadius:99, background:m.up?T.green:m.v===0?T.t4:T.red }}/>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 6. CLIENT RISK FEED ─────────────────────────────────────────────────────
function ClientRiskFeed({ allMemberships, checkIns, now, openModal, setTab }) {
  const [expanded, setExpanded] = useState(false);

  const clients = useMemo(() => allMemberships.map(m => {
    const mCI = checkIns.filter(c=>c.user_id===m.user_id)
      .sort((a,b) => new Date(b.check_in_date||b.check_in_time) - new Date(a.check_in_date||a.check_in_time));
    const last = mCI[0];
    const daysAgo = last ? differenceInDays(now, new Date(last.check_in_date||last.check_in_time)) : 999;
    const ci30 = mCI.filter(c => differenceInDays(now, new Date(c.check_in_date||c.check_in_time)) <= 30).length;
    let level, reason;
    if (daysAgo === 999) { level="critical"; reason="Never checked in — immediate outreach needed"; }
    else if (daysAgo >= 21) { level="critical"; reason=`${daysAgo} days inactive — high churn risk`; }
    else if (daysAgo >= 14) { level="high"; reason=`${daysAgo} days inactive — send re-engagement`; }
    else if (daysAgo >= 7)  { level="med";  reason=`${daysAgo} days since last visit — check in`; }
    else return null;
    return { id:m.user_id, name:m.user_name||"Client", avatar:m.avatar_url||null, daysAgo, ci30, level, reason };
  }).filter(Boolean).sort((a,b) => b.daysAgo - a.daysAgo), [allMemberships, checkIns, now]);

  const SHOW = 5;
  const shown = expanded ? clients : clients.slice(0, SHOW);
  const lvlColor = { critical:T.red, high:T.amber, med:T.blue };

  if (clients.length === 0) return (
    <div className="mcc-card u u1" style={{ ...CARD, boxShadow:CSHADOW }}>
      <CardHead label="Client Risk Feed"/>
      <div style={{ padding:"24px 16px", textAlign:"center" }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:T.greenDim, border:`1px solid ${T.greenBrd}`,
          display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px" }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontSize:12, fontWeight:600, color:T.t1, marginBottom:3 }}>All clients active</div>
        <div style={{ fontSize:10, color:T.t3 }}>No one inactive for 7+ days</div>
      </div>
    </div>
  );

  return (
    <div className="mcc-card u u1" style={{ ...CARD, boxShadow:CSHADOW, borderTop:`2px solid ${T.red}` }}>
      <CardHead
        label="Client Risk Feed"
        sub={`${clients.length} client${clients.length>1?"s":""} need attention`}
        right={
          <div style={{ display:"flex", gap:6 }}>
            {clients.filter(c=>c.level==="critical").length > 0 && (
              <Chip color={T.red} bg={T.redDim} brd={T.redBrd}>{clients.filter(c=>c.level==="critical").length} Critical</Chip>
            )}
            <button className="mcc-btn" onClick={()=>setTab?.("members")}
              style={{ fontSize:9.5, fontWeight:700, color:T.t2, background:"transparent", border:`1px solid ${T.b1}`, borderRadius:5, padding:"3px 9px" }}>
              View all →
            </button>
          </div>
        }
      />

      <div>
        {shown.map((c, i) => (
          <div key={c.id||i} style={{ borderBottom: i<shown.length-1 ? `1px solid ${T.b0}` : "none",
            borderLeft:`2.5px solid ${lvlColor[c.level]}`, padding:"11px 14px",
            display:"flex", alignItems:"flex-start", gap:10 }}>
            <Avatar name={c.name} src={c.avatar} size={30} accent={lvlColor[c.level]}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.t0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>{c.name}</div>
              <div style={{ fontSize:10.5, color:c.level==="critical"?T.red:c.level==="high"?T.amber:T.blue, lineHeight:1.4 }}>{c.reason}</div>
              <div style={{ fontSize:10, color:T.t3, marginTop:2 }}>{c.ci30} check-in{c.ci30!==1?"s":""} in last 30 days</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:5, flexShrink:0 }}>
              <ActionBtn label="Message" color={T.amber} bg={T.amberDim} brd={T.amberBrd} onClick={()=>openModal?.("message")}/>
              <ActionBtn label="Book" color={T.blue} bg={T.blueDim} brd={T.blueBrd} onClick={()=>openModal?.("classes")}/>
            </div>
          </div>
        ))}
      </div>

      {clients.length > SHOW && (
        <div style={{ padding:"9px 16px", borderTop:`1px solid ${T.b0}` }}>
          <button className="mcc-btn" onClick={()=>setExpanded(p=>!p)}
            style={{ fontSize:10, fontWeight:700, color:T.blue, background:"transparent", width:"100%", padding:"3px 0" }}>
            {expanded ? "Show less" : `Show ${clients.length - SHOW} more at-risk clients`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 7. QUICK ACTIONS STRIP ───────────────────────────────────────────────────
function QuickActionsStrip({ openModal, setTab }) {
  const actions = [
    { label:"Scan Check-in", color:T.green, bg:T.greenDim, brd:T.greenBrd, fn:()=>openModal?.("qrScanner"),
      icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={4} height={4}/></svg> },
    { label:"Broadcast Message", color:T.blue, bg:T.blueDim, brd:T.blueBrd, fn:()=>openModal?.("post"),
      icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
    { label:"Schedule Session", color:T.purple, bg:T.purpleDim, brd:T.purpleBrd, fn:()=>openModal?.("classes"),
      icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg> },
    { label:"View All Clients", color:T.t1, bg:"rgba(255,255,255,0.04)", brd:T.b1, fn:()=>setTab?.("members"),
      icon:<svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  ];
  return (
    <div style={{ display:"flex", gap:7, marginBottom:20, flexWrap:"wrap" }}>
      {actions.map((a,i) => (
        <button key={i} className="mcc-btn" onClick={a.fn}
          style={{ fontSize:12, fontWeight:700, color:a.color, background:a.bg, border:`1px solid ${a.brd}`, borderRadius:8, padding:"8px 16px", gap:7 }}>
          {a.icon} {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function TabCoachToday({
  allMemberships = [],
  checkIns = [],
  myClasses = [],
  currentUser,
  openModal,
  setTab,
  now = new Date(),
}) {

  // ── Session derivation (same logic as original) ──────────────────────────
  const sessions = useMemo(() => {
    const nowDecimal = now.getHours() + now.getMinutes() / 60;
    return myClasses.map((cls, i) => {
      const schedStr = typeof cls.schedule==="string" ? cls.schedule
        : (Array.isArray(cls.schedule) && cls.schedule[0]?.time ? cls.schedule[0].time : "");
      let timeHour = null;
      const m = schedStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      if (m) {
        timeHour = parseInt(m[1]);
        if (m[3]?.toLowerCase()==="pm" && timeHour!==12) timeHour+=12;
        if (m[3]?.toLowerCase()==="am" && timeHour===12) timeHour=0;
        if (m[2]) timeHour += parseInt(m[2])/60;
      }
      const cap = cls.max_capacity || cls.capacity || 20;
      const booked = (cls.bookings || []).length;
      const durMin = cls.duration_minutes || cls.duration || 60;
      let status = "upcoming";
      if (timeHour!==null) {
        if (nowDecimal > timeHour+durMin/60) status="done";
        else if (nowDecimal >= timeHour) status="live";
      }
      return {
        id: cls.id||`cls-${i}`, name:cls.name||"Unnamed Class", time:schedStr||"—",
        booked, cap, duration:`${durMin}m`, status,
        coach:cls.instructor||cls.coach_name||null, notes:cls.notes||null,
        _sortKey: timeHour??99,
      };
    }).sort((a,b)=>a._sortKey-b._sortKey);
  }, [myClasses, now]);

  const priorities = useMemo(() => derivePriorities({ allMemberships, checkIns, sessions, now, openModal, setTab }), [allMemberships, checkIns, sessions, now]);

  const greeting = (() => {
    const h = now.getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();
  const firstName = currentUser?.display_name?.split(" ")[0] || currentUser?.full_name?.split(" ")[0] || "Coach";
  const dateStr = now.toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" });
  const liveSession = sessions.find(s=>s.status==="live");

  return (
    <div className="mcc-root mcc-scr" style={{ background:T.bg, minHeight:"100%", padding:"0 0 48px" }}>

      {/* ── COMMAND HEADER ── */}
      <div className="u" style={{ padding:"24px 0 18px", borderBottom:`1px solid ${T.b0}`, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <div>
            <div style={{ fontSize:11, color:T.t2, marginBottom:5 }}>{dateStr}</div>
            <h1 style={{ fontFamily:"Figtree, sans-serif", fontSize:24, fontWeight:800, color:T.t0,
              letterSpacing:"-.04em", lineHeight:1 }}>
              {greeting}, {firstName}
            </h1>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {liveSession ? (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px",
                background:T.greenDim, border:`1px solid ${T.greenBrd}`, borderRadius:8 }}>
                <Dot color={T.green} pulse/>
                <span style={{ fontSize:12, fontWeight:700, color:T.green }}>{liveSession.name} · Live now</span>
                <span className="mono" style={{ fontSize:10, color:T.green, opacity:.7 }}>{liveSession.booked}/{liveSession.cap}</span>
              </div>
            ) : sessions.find(s=>s.status==="upcoming") && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 13px",
                background:T.s2, border:`1px solid ${T.b1}`, borderRadius:8 }}>
                <Dot color={T.blue}/>
                <span style={{ fontSize:11, color:T.t2 }}>Next: <strong style={{color:T.t1}}>{sessions.find(s=>s.status==="upcoming")?.name}</strong> · {sessions.find(s=>s.status==="upcoming")?.time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TODAY'S PRIORITIES ── */}
      <TodaysPriorities priorities={priorities} />

      {/* ── QUICK ACTIONS STRIP ── */}
      <QuickActionsStrip openModal={openModal} setTab={setTab} />

      {/* ── MAIN GRID ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:14, alignItems:"start" }}>

        {/* LEFT COLUMN */}
        <div style={{ display:"flex", flexDirection:"column" }}>
          <AttendanceChart checkIns={checkIns} now={now}/>
          <TodaysSessions sessions={sessions} openModal={openModal}/>
          <ActivityFeed checkIns={checkIns} allMemberships={allMemberships} now={now}/>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, position:"sticky", top:0 }}>
          <WeeklyPerformance checkIns={checkIns} sessions={sessions} allMemberships={allMemberships} now={now}/>
          <ClientRiskFeed allMemberships={allMemberships} checkIns={checkIns} now={now} openModal={openModal} setTab={setTab}/>
        </div>
      </div>
    </div>
  );
}
