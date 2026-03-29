import { useState, useMemo } from "react";
import {
  AlertTriangle, MessageCircle, Calendar, TrendingDown, TrendingUp,
  QrCode, CheckCircle, Users, Activity, Zap, Star, Send,
  ArrowUpRight, ArrowDownRight, Minus, BarChart2, Clock,
  ChevronRight, Plus, Dumbbell, Bell
} from "lucide-react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const D = {
  bgBase:    "#07101e",
  bgSurface: "#0c1825",
  bgCard:    "#101f30",
  bgInset:   "#091422",

  border:    "rgba(255,255,255,0.07)",
  borderMd:  "rgba(255,255,255,0.12)",

  t1: "#edf2f7",
  t2: "#8a9bb0",
  t3: "#4a5d72",
  t4: "#2a3a4d",

  blue:      "#3b82f6",
  blueSub:   "rgba(59,130,246,0.10)",
  blueBdr:   "rgba(59,130,246,0.22)",

  red:       "#ef4444",
  redSub:    "rgba(239,68,68,0.10)",
  redBdr:    "rgba(239,68,68,0.22)",

  amber:     "#f59e0b",
  amberSub:  "rgba(245,158,11,0.10)",
  amberBdr:  "rgba(245,158,11,0.22)",

  green:     "#10b981",
  greenSub:  "rgba(16,185,129,0.10)",
  greenBdr:  "rgba(16,185,129,0.22)",
};

// ─── CSS INJECTION ─────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("td-v4-css")) {
  const s = document.createElement("style");
  s.id = "td-v4-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .td { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; }
    @keyframes tdFadeUp   { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
    @keyframes tdSlideIn  { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:none } }
    @keyframes tdCountUp  { from { opacity:0; transform:scale(0.88) } to { opacity:1; transform:scale(1) } }
    @keyframes tdPulse    { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(16,185,129,0.4)} 50%{opacity:0.8;box-shadow:0 0 0 6px rgba(16,185,129,0)} }
    .fade-up   { animation: tdFadeUp 0.32s cubic-bezier(0.22,1,0.36,1) both; }
    .slide-in  { animation: tdSlideIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
    .count-up  { animation: tdCountUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
    .live-dot  { animation: tdPulse 2.4s ease-in-out infinite; }

    .priority-row {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 18px; cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.042);
      transition: background 0.13s;
      position: relative;
    }
    .priority-row::before {
      content: ''; position: absolute; left: 0; top: 8px; bottom: 8px;
      width: 3px; border-radius: 0 3px 3px 0;
      background: transparent; transition: background 0.15s;
    }
    .priority-row:hover { background: rgba(239,68,68,0.04) !important; }
    .priority-row:hover::before { background: #ef4444; }
    .priority-row:last-child { border-bottom: none; }

    .td-row { transition: background 0.1s; cursor: pointer; }
    .td-row:hover { background: rgba(255,255,255,0.02) !important; }

    .pill-blue   { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; background:rgba(59,130,246,0.12); border:1px solid rgba(59,130,246,0.25); color:#60a5fa; }
    .pill-green  { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.25); color:#34d399; }
    .pill-red    { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); color:#f87171; }
    .pill-amber  { display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25); color:#fbbf24; }
    .pill-neutral{ display:inline-flex; align-items:center; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#8a9bb0; }

    .td-btn { border:none; cursor:pointer; transition: all 0.12s; }
    .td-btn:hover { filter:brightness(1.15); transform:translateY(-1px); }
    .td-btn:active { transform:translateY(0); filter:brightness(0.95); }

    .kpi-value { animation: tdCountUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
  `;
  document.head.appendChild(s);
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────

/** Delta badge: +N / -N / flat */
function Delta({ value }) {
  if (value === 0 || value === undefined) return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, fontWeight:700,
      color:D.t3, background:"rgba(255,255,255,0.05)", borderRadius:99, padding:"2px 7px" }}>
      <Minus style={{ width:9, height:9 }}/> —
    </span>
  );
  const up = value > 0;
  const color = up ? D.green : D.red;
  const Icon  = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, fontWeight:700,
      color, background:`${color}14`, border:`1px solid ${color}28`, borderRadius:99, padding:"2px 7px" }}>
      <Icon style={{ width:9, height:9 }}/> {up ? "+" : ""}{value}
    </span>
  );
}

/** Spark — SVG sparkline */
export function Spark({ data = [], color = D.blue, height = 28 }) {
  const w = 80;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={height} style={{ overflow:"visible", flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round"/>
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const lx = w;
        const ly = height - (last / max) * (height - 4) - 2;
        return <circle cx={lx} cy={ly} r={2.5} fill={color}/>;
      })()}
    </svg>
  );
}

/** MiniAvatar */
export function MiniAvatar({ name = "?", src, size = 28, urgency }) {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg    = urgency === "danger" ? D.redSub  : urgency === "risk" ? D.amberSub : "rgba(255,255,255,0.06)";
  const bdr   = urgency === "danger" ? D.redBdr  : urgency === "risk" ? D.amberBdr : D.border;
  const color = urgency === "danger" ? D.red     : urgency === "risk" ? D.amber    : D.t2;
  return src ? (
    <img src={src} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover",
      border:`1.5px solid ${bdr}`, flexShrink:0 }}/>
  ) : (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, display:"flex",
      alignItems:"center", justifyContent:"center", background:bg, border:`1.5px solid ${bdr}`,
      fontSize:Math.round(size*0.36), fontWeight:800, color, letterSpacing:"-0.01em" }}>
      {initials}
    </div>
  );
}

/** KpiCard — the top metric tiles */
export function KpiCard({
  icon: Icon, label, value, sub, subColor,
  valueColor, footerBar, footerColor, trend,
  delay = 0,
}) {
  const barColor = footerColor || D.blue;
  const barVal   = Math.min(100, Math.max(0, footerBar ?? 0));

  return (
    <div className="fade-up" style={{
      animationDelay:`${delay}s`,
      background: D.bgSurface,
      border: `1px solid ${D.border}`,
      borderRadius: 14,
      padding: "18px 20px 16px",
      display: "flex", flexDirection: "column", gap: 10,
      position: "relative", overflow: "hidden",
    }}>
      {/* Top row: icon + label + trend */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          {Icon && (
            <div style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,0.04)",
              border:`1px solid ${D.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon style={{ width:13, height:13, color:D.t3 }}/>
            </div>
          )}
          <span style={{ fontSize:10, fontWeight:700, color:D.t3, textTransform:"uppercase",
            letterSpacing:"0.08em" }}>{label}</span>
        </div>
        {trend !== undefined && <Delta value={trend}/>}
      </div>

      {/* Value */}
      <div className="kpi-value" style={{ animationDelay:`${delay + 0.08}s` }}>
        <span style={{ fontSize:36, fontWeight:800, letterSpacing:"-0.045em", lineHeight:1,
          color: valueColor || D.t1 }}>{value}</span>
      </div>

      {/* Sub */}
      {sub && (
        <div style={{ fontSize:11, color:subColor || D.t3, fontWeight:500, marginTop:-4 }}>{sub}</div>
      )}

      {/* Footer progress bar */}
      {footerBar !== undefined && (
        <div style={{ marginTop:4 }}>
          <div style={{ height:3, borderRadius:99, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${barVal}%`, background:barColor, borderRadius:99,
              transition:"width 1s cubic-bezier(0.22,1,0.36,1)" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:5 }}>
            <span style={{ fontSize:9, color:D.t4 }}>0%</span>
            <span style={{ fontSize:9, color:barColor, fontWeight:700 }}>{barVal}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** DashCard — section container */
export function DashCard({ title, icon: TitleIcon, action, onAction, accentColor, children }) {
  const ac = accentColor || null;
  return (
    <div style={{
      background: D.bgSurface,
      border: `1px solid ${ac ? `${ac}28` : D.border}`,
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:9, padding:"13px 18px",
        borderBottom:`1px solid ${D.border}`,
        background: ac ? `${ac}06` : "transparent",
      }}>
        {ac && <div style={{ width:3, height:16, borderRadius:99, background:ac, flexShrink:0 }}/>}
        {TitleIcon && <TitleIcon style={{ width:13, height:13, color:ac || D.t3, flexShrink:0 }}/>}
        <span style={{ flex:1, fontSize:12, fontWeight:800, color:D.t1, letterSpacing:"-0.01em" }}>{title}</span>
        {action && (
          <button className="td-btn" onClick={onAction} style={{
            fontSize:10, fontWeight:700, color: ac || D.blue,
            background:`${ac || D.blue}12`, border:`1px solid ${ac || D.blue}28`,
            borderRadius:7, padding:"4px 10px", fontFamily:"inherit",
          }}>{action}</button>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────
const SAMPLE = {
  coach: { name: "Max Chen" },
  atRisk: [
    { id:1, name:"Sarah Williams", daysAgo:18, r30:1, score:28, reason:"No visit in 18 days — high churn risk", tag:"danger" },
    { id:2, name:"James Okafor",   daysAgo:12, r30:2, score:44, reason:"Visits down 60% vs last month",        tag:"risk"   },
    { id:3, name:"Priya Nair",     daysAgo: 9, r30:3, score:51, reason:"9 days since last visit",              tag:"risk"   },
  ],
  classes: [
    { id:1, name:"CrossFit Madness", time:"06:00am", booked:18, cap:20, duration:60,  status:"done",     spark:[3,5,4,6,5,6,4] },
    { id:2, name:"HIIT Blast",       time:"09:30am", booked:12, cap:15, duration:45,  status:"live",     spark:[2,4,3,5,4,3,5] },
    { id:3, name:"Yoga Flow",        time:"12:00pm", booked: 8, cap:12, duration:60,  status:"upcoming", spark:[1,2,3,2,4,3,3] },
    { id:4, name:"Strength Lab",     time:"06:00pm", booked:14, cap:20, duration:75,  status:"upcoming", spark:[4,3,5,4,6,5,6] },
  ],
  weekPulse: [12, 8, 15, 11, 17, 9, 14],
  weekDays:  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  rosterHealth: { safe:22, risk:6, danger:3, total:31 },
  notable: [
    { id:1, name:"Tom Rivera",   badge:"Milestone",  sub:"Hit 50 visits today",  bc:D.amber  },
    { id:2, name:"Lisa Park",    badge:"Streak",     sub:"8-week streak",        bc:D.blue   },
    { id:3, name:"Marcus Webb",  badge:"Here today", sub:"Just checked in",      bc:D.green  },
  ],
};

// ─── TODAY DASHBOARD ─────────────────────────────────────────────────────────
export default function TodayDashboard() {
  const [expanded, setExpanded] = useState(null);

  const today = new Date();
  const dayStr = today.toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" });
  const hour   = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const todayAttendees = 34;
  const fillRate  = 71;
  const atRiskCt  = SAMPLE.atRisk.length;
  const sessToday = SAMPLE.classes.length;
  const liveClass = SAMPLE.classes.find(c => c.status === "live");

  const avgRetention = Math.round(
    (SAMPLE.rosterHealth.safe * 85 + SAMPLE.rosterHealth.risk * 50 + SAMPLE.rosterHealth.danger * 20) /
    SAMPLE.rosterHealth.total
  );

  return (
    <div className="td" style={{ background:D.bgBase, minHeight:"100vh", padding:"24px 28px",
      display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── HEADER ── */}
      <div className="fade-up" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, color:D.t4, textTransform:"uppercase",
            letterSpacing:"0.10em", marginBottom:6 }}>{dayStr}</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:D.t1, letterSpacing:"-0.04em",
            margin:0, lineHeight:1.1 }}>
            {greeting}, {SAMPLE.coach.name.split(" ")[0]}.
          </h1>
          <p style={{ fontSize:12, color:D.t3, margin:"5px 0 0", fontWeight:400 }}>
            Your command center for today.
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="td-btn" style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px",
            borderRadius:9, background:"rgba(255,255,255,0.04)", border:`1px solid ${D.border}`,
            color:D.t2, fontSize:11, fontWeight:700, fontFamily:"inherit" }}>
            <QrCode style={{ width:13, height:13 }}/> Scan Check-in
          </button>
          <button className="td-btn" style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px",
            borderRadius:9, background:D.blueSub, border:`1px solid ${D.blueBdr}`,
            color:D.blue, fontSize:11, fontWeight:700, fontFamily:"inherit" }}>
            <Plus style={{ width:13, height:13 }}/> Add Session
          </button>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <KpiCard
          icon={Users}
          label="Attendees Today"
          value={todayAttendees}
          sub="vs 29 yesterday"
          subColor={D.green}
          trend={+5}
          delay={0.04}
        />
        <KpiCard
          icon={Activity}
          label="Fill Rate"
          value={`${fillRate}%`}
          sub="Across 4 sessions"
          subColor={D.t3}
          footerBar={fillRate}
          footerColor={fillRate >= 70 ? D.green : fillRate >= 45 ? D.blue : D.amber}
          delay={0.08}
        />
        <KpiCard
          icon={AlertTriangle}
          label="At Risk"
          value={atRiskCt}
          sub={atRiskCt > 0 ? "Clients need action" : "All clear"}
          subColor={atRiskCt > 0 ? D.red : D.green}
          valueColor={atRiskCt > 0 ? D.red : D.t1}
          trend={atRiskCt > 0 ? -atRiskCt : 0}
          delay={0.12}
        />
        <KpiCard
          icon={Calendar}
          label="Sessions Today"
          value={sessToday}
          sub={`${SAMPLE.classes.filter(c=>c.status==="done").length} done · ${SAMPLE.classes.filter(c=>c.status==="live").length} live`}
          subColor={D.t3}
          footerBar={Math.round((SAMPLE.classes.filter(c=>c.status==="done").length / sessToday) * 100)}
          footerColor={D.blue}
          delay={0.16}
        />
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 280px", gap:14, alignItems:"start" }}>

        {/* ── LEFT COL: Action Required ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          <DashCard title="Action Required" icon={AlertTriangle}
            accentColor={D.amber} action="Message All" onAction={()=>{}}>

            {SAMPLE.atRisk.map((m, i) => (
              <div key={m.id} className={`priority-row fade-up`}
                style={{ animationDelay:`${0.2 + i*0.06}s`, background:"transparent" }}>

                <MiniAvatar name={m.name} size={32} urgency={m.tag}/>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:D.t1,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</span>
                    <span className={m.tag === "danger" ? "pill-red" : "pill-amber"}>{m.tag}</span>
                  </div>
                  <span style={{ fontSize:10, color:D.t3 }}>{m.reason}</span>
                </div>

                {/* Spark */}
                <Spark data={[3,1,2,0,1,0,0]} color={m.tag==="danger" ? D.red : D.amber} height={22}/>

                {/* 1-click message */}
                <button className="td-btn" style={{ display:"flex", alignItems:"center", gap:5,
                  padding:"5px 10px", borderRadius:7, border:`1px solid ${D.blueBdr}`,
                  background:D.blueSub, color:D.blue, fontSize:10, fontWeight:700, fontFamily:"inherit",
                  whiteSpace:"nowrap" }}>
                  <MessageCircle style={{ width:9, height:9 }}/> Message
                </button>
                <button className="td-btn" style={{ display:"flex", alignItems:"center", gap:5,
                  padding:"5px 10px", borderRadius:7, border:`1px solid ${D.amberBdr}`,
                  background:D.amberSub, color:D.amber, fontSize:10, fontWeight:700, fontFamily:"inherit",
                  whiteSpace:"nowrap" }}>
                  <Calendar style={{ width:9, height:9 }}/> Book
                </button>
              </div>
            ))}

            {/* Quiet zone notice */}
            <div style={{ padding:"10px 18px", borderTop:`1px solid ${D.border}`,
              display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:10, color:D.t4 }}>+4 more clients need attention this week</span>
              <button className="td-btn" style={{ marginLeft:"auto", fontSize:10, fontWeight:700,
                color:D.blue, background:D.blueSub, border:`1px solid ${D.blueBdr}`,
                borderRadius:6, padding:"3px 9px", fontFamily:"inherit" }}>
                View all
              </button>
            </div>
          </DashCard>

          {/* Roster Health mini */}
          <DashCard title="Roster Health" icon={BarChart2}>
            <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
              {/* Avg score ring + label */}
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:4 }}>
                <div style={{ position:"relative", width:52, height:52, flexShrink:0 }}>
                  <svg width={52} height={52} style={{ transform:"rotate(-90deg)" }}>
                    <circle cx={26} cy={26} r={20} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4}/>
                    <circle cx={26} cy={26} r={20} fill="none" stroke={D.green} strokeWidth={4}
                      strokeLinecap="round"
                      strokeDasharray={`${(avgRetention/100)*125.7} 125.7`}/>
                  </svg>
                  <div style={{ position:"absolute", inset:0, display:"flex",
                    alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:12, fontWeight:800, color:D.green }}>{avgRetention}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:D.t1 }}>Avg Retention Score</div>
                  <div style={{ fontSize:10, color:D.t3, marginTop:2 }}>
                    {Math.round(SAMPLE.rosterHealth.safe / SAMPLE.rosterHealth.total * 100)}% of clients on track
                  </div>
                </div>
              </div>
              {[
                { label:"Healthy",  count:SAMPLE.rosterHealth.safe,   pct:71, c:D.green },
                { label:"At risk",  count:SAMPLE.rosterHealth.risk,   pct:19, c:D.amber },
                { label:"Danger",   count:SAMPLE.rosterHealth.danger, pct:10, c:D.red   },
              ].map((row, i) => (
                <div key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <span style={{ fontSize:10, color:D.t2 }}>{row.label}</span>
                    <span style={{ fontSize:10, color:D.t3 }}>{row.count} · {row.pct}%</span>
                  </div>
                  <div style={{ height:3, borderRadius:99, background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${row.pct}%`, background:row.c, borderRadius:99,
                      transition:"width 1s ease" }}/>
                  </div>
                </div>
              ))}
            </div>
          </DashCard>
        </div>

        {/* ── MIDDLE COL: Today's Schedule ── */}
        <DashCard title="Today's Sessions" icon={Calendar}
          action="+ Add" onAction={()=>{}}>
          <div>
            {SAMPLE.classes.map((cls, i) => {
              const fillPct  = Math.round((cls.booked / cls.cap) * 100);
              const fillCol  = fillPct >= 80 ? D.green : fillPct >= 50 ? D.blue : D.amber;
              const isExp    = expanded === cls.id;
              const statusLabel = cls.status === "live" ? "live" : cls.status === "done" ? "done" : "upcoming";

              return (
                <div key={cls.id} className="fade-up" style={{ animationDelay:`${0.22 + i*0.05}s` }}>
                  <div className="td-row" onClick={() => setExpanded(isExp ? null : cls.id)}
                    style={{ display:"flex", alignItems:"center", gap:11, padding:"12px 18px",
                      borderBottom: `1px solid ${D.border}`, background:"transparent" }}>

                    {/* Status dot */}
                    <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
                      background: cls.status==="live" ? D.green : cls.status==="done" ? D.t4 : D.blue,
                    }} className={cls.status==="live" ? "live-dot" : ""}/>

                    {/* Time */}
                    <span style={{ fontSize:11, fontWeight:700, color:cls.status==="done"?D.t4:D.t2,
                      width:54, flexShrink:0 }}>{cls.time}</span>

                    {/* Name + pills */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
                        <span style={{ fontSize:12, fontWeight:700,
                          color:cls.status==="done"?D.t3:D.t1,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {cls.name}
                        </span>
                        <span className={
                          cls.status==="live"     ? "pill-green"  :
                          cls.status==="done"     ? "pill-neutral":
                          "pill-blue"
                        }>{statusLabel}</span>
                      </div>
                      {/* Capacity bar */}
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, height:3, borderRadius:99, background:"rgba(255,255,255,0.05)",
                          overflow:"hidden", maxWidth:80 }}>
                          <div style={{ height:"100%", width:`${fillPct}%`, background:fillCol,
                            borderRadius:99 }}/>
                        </div>
                        <span style={{ fontSize:10, fontWeight:700, color:fillCol, whiteSpace:"nowrap" }}>
                          {cls.booked}/{cls.cap}
                        </span>
                        <span style={{ fontSize:9, color:D.t4 }}>{cls.duration}m</span>
                      </div>
                    </div>

                    <Spark data={cls.spark} color={cls.status==="done"?D.t4:fillCol} height={22}/>

                    <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                      <button className="td-btn" style={{ display:"flex", alignItems:"center", gap:4,
                        padding:"4px 9px", borderRadius:6, border:`1px solid rgba(16,185,129,0.28)`,
                        background:"rgba(16,185,129,0.10)", color:D.green, fontSize:9, fontWeight:700,
                        fontFamily:"inherit" }} onClick={e=>e.stopPropagation()}>
                        <QrCode style={{ width:9, height:9 }}/> Check-in
                      </button>
                    </div>
                    <ChevronRight style={{ width:11, height:11, color:D.t4, flexShrink:0,
                      transform:isExp?"rotate(90deg)":"none", transition:"transform 0.2s" }}/>
                  </div>

                  {/* Expanded detail */}
                  {isExp && (
                    <div className="slide-in" style={{ padding:"12px 18px 14px", background:D.bgCard,
                      borderBottom:`1px solid ${D.border}` }}>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
                        {[
                          { l:"Booked",   v:cls.booked,             c:D.blue  },
                          { l:"Attended", v:Math.ceil(cls.booked*.7),c:D.green },
                          { l:"No-shows", v:Math.floor(cls.booked*.3),c:D.red  },
                          { l:"Open",     v:cls.cap-cls.booked,     c:D.t3    },
                        ].map((s,j)=>(
                          <div key={j} style={{ padding:"8px 10px", borderRadius:8, textAlign:"center",
                            background:"rgba(255,255,255,0.02)", border:`1px solid ${D.border}` }}>
                            <div style={{ fontSize:18, fontWeight:800, color:s.c,
                              letterSpacing:"-0.04em" }}>{s.v}</div>
                            <div style={{ fontSize:8, color:D.t4, textTransform:"uppercase",
                              letterSpacing:"0.06em", marginTop:3 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:7 }}>
                        {[
                          { label:"Send reminder", icon:Bell, color:D.amber },
                          { label:"Message group", icon:MessageCircle, color:D.blue },
                          { label:"Mark complete", icon:CheckCircle, color:D.green },
                        ].map(({label,icon:Ic,color},k)=>(
                          <button key={k} className="td-btn" style={{ display:"flex", alignItems:"center",
                            gap:5, padding:"5px 11px", borderRadius:7, border:`1px solid ${color}28`,
                            background:`${color}10`, color, fontSize:10, fontWeight:700,
                            fontFamily:"inherit" }}>
                            <Ic style={{ width:10, height:10 }}/>{label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DashCard>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Quick Actions */}
          <DashCard title="Quick Actions" icon={Zap}>
            <div style={{ padding:"8px 10px", display:"flex", flexDirection:"column", gap:4 }}>
              {[
                { label:"Scan check-in",  icon:QrCode,         color:D.green },
                { label:"Send message",   icon:MessageCircle,  color:D.blue  },
                { label:"Book a client",  icon:Calendar,       color:D.amber },
                { label:"New session",    icon:Plus,           color:D.blue  },
                { label:"Assign workout", icon:Dumbbell,       color:D.t3    },
              ].map(({ label, icon:Ic, color }, i) => (
                <button key={i} className="td-btn" style={{
                  display:"flex", alignItems:"center", gap:10, padding:"9px 11px",
                  borderRadius:9, background:"rgba(255,255,255,0.02)",
                  border:`1px solid ${D.border}`, textAlign:"left", width:"100%",
                  fontFamily:"inherit", transition:"all 0.12s",
                }}>
                  <div style={{ width:26, height:26, borderRadius:8, background:`${color}12`,
                    border:`1px solid ${color}20`, display:"flex", alignItems:"center",
                    justifyContent:"center", flexShrink:0 }}>
                    <Ic style={{ width:12, height:12, color }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, color:D.t2 }}>{label}</span>
                  <ArrowUpRight style={{ width:10, height:10, color:D.t4, marginLeft:"auto" }}/>
                </button>
              ))}
            </div>
          </DashCard>

          {/* 7-day Pulse */}
          <DashCard title="7-Day Pulse" icon={Activity}>
            <div style={{ padding:"14px 16px" }}>
              <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:48, marginBottom:8 }}>
                {SAMPLE.weekPulse.map((v, i) => {
                  const maxV = Math.max(...SAMPLE.weekPulse);
                  const h = Math.max(4, (v/maxV)*44);
                  const isToday = i === 6;
                  return (
                    <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
                      alignItems:"center", gap:4 }}>
                      <div style={{ width:"100%", height:h, borderRadius:4, transition:"height 0.6s ease",
                        background: isToday ? D.blue : `${D.blue}35` }}/>
                      <span style={{ fontSize:8, color:isToday?D.blue:D.t4,
                        fontWeight:isToday?800:400 }}>{SAMPLE.weekDays[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ paddingTop:10, borderTop:`1px solid ${D.border}`,
                display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:D.t1, letterSpacing:"-0.04em" }}>
                    {SAMPLE.weekPulse[6]}
                  </div>
                  <div style={{ fontSize:9, color:D.t3 }}>Today</div>
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:D.t2, letterSpacing:"-0.04em" }}>
                    {SAMPLE.weekPulse.reduce((a,b)=>a+b,0)}
                  </div>
                  <div style={{ fontSize:9, color:D.t3 }}>This week</div>
                </div>
              </div>
            </div>
          </DashCard>

          {/* Notable Today */}
          <DashCard title="Notable Today" icon={Star}>
            {SAMPLE.notable.map((m, i) => (
              <div key={m.id} className="td-row" style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
                borderBottom: i < SAMPLE.notable.length-1 ? `1px solid ${D.border}` : "none",
                background:"transparent",
              }}>
                <MiniAvatar name={m.name} size={28}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:D.t1,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.name}</div>
                  <div style={{ fontSize:9, color:D.t3, marginTop:1 }}>{m.sub}</div>
                </div>
                <span style={{ fontSize:8, fontWeight:800, color:m.bc,
                  background:`${m.bc}12`, border:`1px solid ${m.bc}28`,
                  borderRadius:99, padding:"2px 8px", textTransform:"uppercase",
                  letterSpacing:"0.05em", whiteSpace:"nowrap" }}>{m.badge}</span>
                <button className="td-btn" style={{ width:24, height:24, borderRadius:6,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background:D.blueSub, border:`1px solid ${D.blueBdr}`, color:D.blue, padding:0 }}>
                  <MessageCircle style={{ width:10, height:10 }}/>
                </button>
              </div>
            ))}
          </DashCard>
        </div>
      </div>
    </div>
  );
}
