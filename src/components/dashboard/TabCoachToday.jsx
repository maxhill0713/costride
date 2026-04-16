import { useState, useMemo } from "react";

// ─── UTILITY ──────────────────────────────────────────────────────────────────
const diffDays = (a, b) => Math.floor((a - b) / 86400000);

// ─── DESIGN TOKENS — matches ContentPage exactly ──────────────────────────────
const C = {
  bg:       "#000000",
  sidebar:  "#0f0f12",
  card:     "#141416",
  card2:    "#1a1a1f",
  brd:      "#222226",
  t1:       "#ffffff",
  t2:       "#8a8a94",
  t3:       "#444450",
  cyan:     "#4d7fff",
  cyanDim:  "rgba(77,127,255,0.12)",
  cyanBrd:  "rgba(77,127,255,0.28)",
  red:      "#ff4d6d",
  redDim:   "rgba(255,77,109,0.15)",
  redBrd:   "rgba(255,77,109,0.28)",
  green:    "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",
  greenBrd: "rgba(34,197,94,0.25)",
  amber:    "#f59e0b",
  amberDim: "rgba(245,158,11,0.12)",
  amberBrd: "rgba(245,158,11,0.25)",
};

const FONT = "'DM Sans', 'Segoe UI', system-ui, sans-serif";

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("tct2-css")) {
  const s = document.createElement("style");
  s.id = "tct2-css";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .tct2 { font-family: ${FONT}; -webkit-font-smoothing: antialiased; }
    @keyframes tct2FadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes tct2Pulse  { 0%,100% { opacity:1; } 50% { opacity:.35; } }
    @keyframes tct2SlideDown { from { opacity:0; max-height:0; } to { opacity:1; max-height:500px; } }
    .t2-fu { animation: tct2FadeUp .4s cubic-bezier(.16,1,.3,1) both; }
    .t2-d1 { animation-delay:.05s } .t2-d2 { animation-delay:.1s }
    .t2-d3 { animation-delay:.15s } .t2-d4 { animation-delay:.2s }
    .t2-d5 { animation-delay:.25s } .t2-d6 { animation-delay:.3s }
    .t2-d7 { animation-delay:.35s }
    .tct2-btn {
      font-family: ${FONT}; cursor:pointer; outline:none; border:none;
      display:inline-flex; align-items:center; gap:5px;
      transition: opacity .15s, transform .15s;
    }
    .tct2-btn:hover  { opacity:.85; transform:translateY(-1px); }
    .tct2-btn:active { transform:scale(.97); }
    .tct2-row { transition:background .12s; cursor:pointer; }
    .tct2-row:hover { background:rgba(255,255,255,.025) !important; }
    .tct2-card {
      background:${C.card}; border:1px solid ${C.brd};
      border-radius:10px; overflow:hidden;
      transition:border-color .15s;
    }
    .tct2-card:hover { border-color:rgba(255,255,255,.08); }
    .tct2-scr::-webkit-scrollbar { width:3px; }
    .tct2-scr::-webkit-scrollbar-track { background:transparent; }
    .tct2-scr::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); border-radius:3px; }
    .tct2-tab { font-family:${FONT}; cursor:pointer; outline:none; border:none; transition:color .15s; }
    @media (max-width:1100px) { .tct2-main-grid { grid-template-columns:1fr !important; } }
    @media (max-width:640px)  { .tct2-stat-grid { grid-template-columns:1fr 1fr !important; } .tct2-root-pad { padding:14px 12px 60px !important; } }
  `;
  document.head.appendChild(s);
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const NOW_MOCK = (() => { const d = new Date(); d.setHours(12,15,0,0); return d; })();

const mkCI = (() => {
  let n = 1;
  return (uid, daysAgo) => {
    const d = new Date(NOW_MOCK);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(7 + Math.floor(Math.random()*4), Math.floor(Math.random()*60));
    return { id:`ci${n++}`, user_id:uid, check_in_date:d.toISOString() };
  };
})();

const MEMBERS = [
  { user_id:"u1",  user_name:"Sophie Allen",  membership:"Premium"  },
  { user_id:"u2",  user_name:"James Park",    membership:"Standard" },
  { user_id:"u3",  user_name:"Rachel Kim",    membership:"Premium"  },
  { user_id:"u4",  user_name:"Michael Chen",  membership:"Standard" },
  { user_id:"u5",  user_name:"Ella Torres",   membership:"Premium"  },
  { user_id:"u6",  user_name:"David Lowe",    membership:"Standard" },
  { user_id:"u7",  user_name:"Maria Santos",  membership:"Premium"  },
  { user_id:"u8",  user_name:"Tom Bradley",   membership:"Standard" },
  { user_id:"u9",  user_name:"Lisa Chen",     membership:"Premium"  },
  { user_id:"u10", user_name:"Alex Kumar",    membership:"Standard" },
];

const CHECKINS = [
  ...[0,1,3,5,7,9,11].map(d=>mkCI("u6",d)),
  ...[0,2,4,6,9,11,13].map(d=>mkCI("u7",d)),
  ...[1,3,5,8,10,12].map(d=>mkCI("u8",d)),
  ...[0,1,2,4,6,8,11].map(d=>mkCI("u9",d)),
  ...[3,5,7,9,11].map(d=>mkCI("u4",d)),
  ...[6,8,10,12,13].map(d=>mkCI("u5",d)),
  ...[7,9,11,12,13].map(d=>mkCI("u1",d)),
  ...[8,10,12,13].map(d=>mkCI("u2",d)),
  ...[15,18,21,24].map(d=>mkCI("u3",d)),
];

const CLASSES = [
  { id:"c1", name:"Morning Strength", schedule:"7:00 am",  max_capacity:15, bookings:Array.from({length:12},(_,i)=>({id:i})), duration_minutes:60, instructor:"Marcus Reid" },
  { id:"c2", name:"Yoga Flow",        schedule:"9:30 am",  max_capacity:15, bookings:Array.from({length:6}, (_,i)=>({id:i})), duration_minutes:60, instructor:"Sarah Mills" },
  { id:"c3", name:"Lunch HIIT",       schedule:"12:00 pm", max_capacity:15, bookings:Array.from({length:15},(_,i)=>({id:i})), duration_minutes:45, instructor:"Marcus Reid", notes:"Full house — consider sending a warmup tip before class." },
  { id:"c4", name:"Evening HIIT",     schedule:"6:00 pm",  max_capacity:20, bookings:Array.from({length:7}, (_,i)=>({id:i})), duration_minutes:45, instructor:"Tom Harris" },
  { id:"c5", name:"Spin Class",       schedule:"7:30 pm",  max_capacity:18, bookings:Array.from({length:14},(_,i)=>({id:i})), duration_minutes:45, instructor:"Amy Price" },
];

const CURRENT_USER = { display_name:"Marcus Reid" };

const MOCK_ACTIVITY = [
  { type:"checkin", name:"David Lowe",   detail:"Checked in to Morning Strength",        time:"2m ago",    color:C.green  },
  { type:"missed",  name:"Rachel Kim",   detail:"Missed Yoga Flow — no cancellation",    time:"14m ago",   color:C.red,   action:"Follow up" },
  { type:"sent",    name:"You",          detail:"Sent renewal message to Tom Bradley",   time:"47m ago",   color:C.cyan   },
  { type:"booking", name:"Maria Santos", detail:"Booked Evening HIIT at 6 pm",           time:"1h ago",    color:C.green  },
  { type:"booking", name:"3 members",    detail:"Booked Spin Class — now 14/18",         time:"2h ago",    color:C.green  },
  { type:"cancel",  name:"Michael Chen", detail:"Cancelled Thursday — 2nd this week",    time:"3h ago",    color:C.amber, action:"Check in" },
  { type:"new",     name:"Emma Wilson",  detail:"Started a 7-day trial",                 time:"Yesterday", color:C.cyan   },
];

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Avatar({ name, size=28 }) {
  const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#ef4444","#4d7fff","#10b981"];
  const bg = palette[(name?.charCodeAt(0)||0) % palette.length];
  const letters = (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0, background:bg,
      border:`1.5px solid ${C.card}`, color:"#fff", fontSize:size*.36, fontWeight:700,
      display:"flex", alignItems:"center", justifyContent:"center", userSelect:"none" }}>
      {letters}
    </div>
  );
}

function Pill({ children, color=C.t2, bg, border, style }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3,
      fontSize:10, fontWeight:700, color,
      background: bg || `${color}15`,
      border:`1px solid ${border || `${color}30`}`,
      borderRadius:20, padding:"2px 8px",
      letterSpacing:".03em", textTransform:"uppercase",
      whiteSpace:"nowrap", lineHeight:"16px", ...style }}>
      {children}
    </span>
  );
}

function Dot({ color, pulse, size=6 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, flexShrink:0,
      animation: pulse ? "tct2Pulse 2s ease-in-out infinite" : "none" }} />
  );
}

function Label({ children, style }) {
  return (
    <div style={{ fontSize:10, fontWeight:600, color:C.t3,
      textTransform:"uppercase", letterSpacing:".08em", lineHeight:1, ...style }}>
      {children}
    </div>
  );
}

function Mono({ children, style }) {
  return (
    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:500,
      letterSpacing:"-.02em", ...style }}>
      {children}
    </span>
  );
}

function CardHead({ label, sub, right, noBorder }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
      padding:"11px 16px",
      ...(noBorder ? {} : { borderBottom:`1px solid ${C.brd}` }) }}>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:C.t1, letterSpacing:"-.01em", lineHeight:1 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:C.t3, marginTop:4, lineHeight:1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (msg, color=C.cyan) => {
    const id = Date.now();
    setToasts(p=>[...p, {id, msg, color}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)), 3000);
  };
  return { toasts, toast };
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:200,
      display:"flex", flexDirection:"column-reverse", gap:6, maxWidth:300, pointerEvents:"none" }}>
      {toasts.map(t=>(
        <div key={t.id} style={{ background:C.card2, border:`1px solid ${C.brd}`,
          borderRadius:8, padding:"10px 14px", fontSize:12.5, fontWeight:500, color:C.t1,
          boxShadow:"0 8px 24px rgba(0,0,0,.6)", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:t.color, flexShrink:0 }}/>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── DERIVE ───────────────────────────────────────────────────────────────────
function deriveSessions(myClasses, now) {
  const nd = now.getHours() + now.getMinutes()/60;
  return myClasses.map((cls,i) => {
    const sched = typeof cls.schedule==="string" ? cls.schedule : "";
    let th = null;
    const m = sched.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (m) {
      th = parseInt(m[1]);
      if (m[3]?.toLowerCase()==="pm" && th!==12) th+=12;
      if (m[3]?.toLowerCase()==="am" && th===12) th=0;
      if (m[2]) th += parseInt(m[2])/60;
    }
    const cap=cls.max_capacity||20, booked=(cls.bookings||[]).length, dur=cls.duration_minutes||60;
    let status="upcoming";
    if (th!==null) {
      if (nd > th+dur/60) status="done";
      else if (nd>=th) status="live";
    }
    return { id:cls.id||`c${i}`, name:cls.name||"Session", time:sched, th, booked, cap,
      duration:`${dur}m`, status, coach:cls.instructor||null, notes:cls.notes||null };
  }).sort((a,b)=>(a.th??99)-(b.th??99));
}

function derivePriorities({ allMemberships, checkIns, sessions, now }) {
  const out = [];
  const inactive = allMemberships.filter(m => {
    const last = checkIns.filter(c=>c.user_id===m.user_id)
      .sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date))[0];
    return last && diffDays(now,new Date(last.check_in_date))>=7;
  });
  const never = allMemberships.filter(m=>!checkIns.some(c=>c.user_id===m.user_id));
  if (inactive.length>0||never.length>0) {
    const count=inactive.length+never.length;
    const names=[...inactive,...never].map(m=>m.user_name?.split(" ")[0]).slice(0,2).join(", ");
    out.push({ id:"inactive", severity:"high",
      title:`${count} client${count>1?"s":""} inactive 7+ days`,
      context:`${names}${count>2?` + ${count-2} more`:""} — each extra day lowers re-engagement by ~4%. Act now.`,
      cta:"Send Re-engagement", color:C.red, colorDim:C.redDim, colorBrd:C.redBrd });
  }
  const trialNames=["Emma Wilson","Josh Lee","Priya Nair","Sam Parker"];
  out.push({ id:"trials", severity:"med",
    title:`${trialNames.length} trials expiring this week`,
    context:`68% convert when contacted before day 4. Today is day 4 for ${trialNames[0]}. Send the upsell sequence.`,
    cta:"Start Upsell", color:C.amber, colorDim:C.amberDim, colorBrd:C.amberBrd });
  const under = sessions.filter(s=>s.status!=="done"&&s.cap>0&&s.booked/s.cap<0.4);
  if (under.length>0) {
    const s=under[0];
    out.push({ id:"underbooked", severity:"med",
      title:`"${s.name}" at ${Math.round(s.booked/s.cap*100)}% — ${s.cap-s.booked} spots`,
      context:`${s.booked}/${s.cap} booked. Push now to fill before ${s.time}.`,
      cta:"Promote Class", color:C.cyan, colorDim:C.cyanDim, colorBrd:C.cyanBrd });
  }
  return out.slice(0,3);
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function CommandHeader({ currentUser, now, sessions, priorities }) {
  const firstName = currentUser?.display_name?.split(" ")[0]||"Coach";
  const h = now.getHours();
  const greeting = h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  const dateStr = now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  const live = sessions.find(s=>s.status==="live");
  const next = sessions.find(s=>s.status==="upcoming");
  const urgent = priorities.filter(p=>p.severity==="high").length;
  const avgFill = (() => {
    const ss=sessions.filter(s=>s.cap>0);
    return ss.length ? Math.round(ss.reduce((a,s)=>a+s.booked/s.cap,0)/ss.length*100):0;
  })();

  return (
    <div className="t2-fu" style={{ paddingBottom:20, marginBottom:20,
      borderBottom:`1px solid ${C.brd}` }}>
      <div style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:C.t3,
            marginBottom:10, letterSpacing:".04em" }}>{dateStr}</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:C.t1,
            letterSpacing:"-.04em", lineHeight:1, marginBottom:0 }}>
            {greeting}, {firstName}
          </h1>
          <p style={{ marginTop:10, fontSize:13, color:C.t2, lineHeight:1.6, maxWidth:460 }}>
            {urgent>0
              ? <><span style={{color:C.red,fontWeight:600}}>{urgent} urgent item{urgent>1?"s":""}</span>{" "}need attention before your next session.</>
              : "All systems healthy. Review sessions and client activity below."}
          </p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
          {live ? (
            <div style={{ display:"flex", alignItems:"center", gap:8,
              padding:"8px 14px",
              background:C.greenDim, border:`1px solid ${C.greenBrd}`, borderRadius:8 }}>
              <Dot color={C.green} pulse />
              <span style={{ fontSize:12, fontWeight:600, color:C.green }}>{live.name}</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
                color:C.green, opacity:.7 }}>{live.booked}/{live.cap}</span>
            </div>
          ) : next ? (
            <div style={{ display:"flex", alignItems:"center", gap:8,
              padding:"8px 14px", background:C.card2,
              border:`1px solid ${C.brd}`, borderRadius:8 }}>
              <Dot color={C.cyan} size={5} />
              <span style={{ fontSize:12, color:C.t2 }}>
                Next up <strong style={{color:C.t1,fontWeight:600}}>{next.name}</strong> at {next.time}
              </span>
            </div>
          ) : null}

          <div className="tct2-stat-grid" style={{ display:"grid",
            gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
            {[
              { label:"urgent",   v:urgent,        color:C.red,   dim:C.redDim,   brd:C.redBrd },
              { label:"avg fill", v:`${avgFill}%`, color:C.cyan,  dim:C.cyanDim,  brd:C.cyanBrd },
              { label:"mtd",      v:"£8,240",      color:C.green, dim:C.greenDim, brd:C.greenBrd },
            ].map((p,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:6,
                padding:"7px 12px",
                background:p.dim, border:`1px solid ${p.brd}`, borderRadius:7 }}>
                <Mono style={{fontSize:12,fontWeight:600,color:p.color}}>{p.v}</Mono>
                <span style={{ fontSize:9, fontWeight:700, color:p.color, opacity:.6,
                  textTransform:"uppercase", letterSpacing:".06em" }}>{p.label}</span>
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
  const urgent = priorities.filter(p=>p.severity==="high").length;
  return (
    <div className="tct2-card t2-fu t2-d1" style={{ marginBottom:10,
      ...(urgent>0 ? {borderTop:`1px solid ${C.redBrd}`}:{}) }}>
      <CardHead
        label="Today's Priorities"
        sub={urgent>0 ? `${urgent} urgent — act before sessions begin`:"Everything on track"}
        right={
          <Pill color={urgent>0?C.red:C.green}
            bg={urgent>0?C.redDim:C.greenDim}
            border={urgent>0?C.redBrd:C.greenBrd}>
            {urgent>0?`${urgent} urgent`:"All clear"}
          </Pill>
        }
      />
      <div style={{ display:"grid",
        gridTemplateColumns: priorities.map(()=>"1fr").join(" ") }}>
        {priorities.map((p,i)=>(
          <div key={p.id} style={{ padding:"14px 16px 16px",
            borderRight: i<priorities.length-1 ? `1px solid ${C.brd}` : "none",
            display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
              <div style={{ width:28, height:28, borderRadius:7, flexShrink:0,
                background:p.colorDim, border:`1px solid ${p.colorBrd}`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:p.color }}/>
              </div>
              <div style={{ fontSize:12.5, fontWeight:600, color:C.t1,
                lineHeight:1.4, letterSpacing:"-.01em" }}>{p.title}</div>
            </div>
            <div style={{ fontSize:11.5, color:C.t3, lineHeight:1.65,
              paddingLeft:38 }}>{p.context}</div>
            <div style={{ paddingLeft:38 }}>
              <button className="tct2-btn" onClick={()=>toast(`Started: ${p.cta}`,p.color)} style={{
                fontSize:11.5, fontWeight:600, color:p.color,
                background:p.colorDim, border:`1px solid ${p.colorBrd}`,
                borderRadius:7, padding:"7px 14px" }}>
                {p.cta} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── QUICK STRIP ──────────────────────────────────────────────────────────────
function QuickStrip({ toast }) {
  const items = [
    { label:"Scan Check-in",    color:C.green, dim:C.greenDim, brd:C.greenBrd, msg:"QR scanner opened" },
    { label:"Broadcast",        color:C.cyan,  dim:C.cyanDim,  brd:C.cyanBrd,  msg:"Broadcast composer opened" },
    { label:"Schedule Session", color:C.cyan,  dim:C.cyanDim,  brd:C.cyanBrd,  msg:"Session scheduler opened" },
    { label:"All Clients",      color:C.t2,    dim:"rgba(255,255,255,.04)", brd:C.brd, msg:"Clients view opening" },
  ];
  return (
    <div className="t2-fu t2-d2" style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
      {items.map((a,i)=>(
        <button key={i} className="tct2-btn" onClick={()=>toast(a.msg,a.color)} style={{
          fontSize:12, fontWeight:600, color:a.color,
          background:a.dim, border:`1px solid ${a.brd}`,
          borderRadius:7, padding:"8px 16px", minHeight:36 }}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── ATTENDANCE CHART ─────────────────────────────────────────────────────────
function AttendanceChart({ checkIns, now }) {
  const [tip, setTip] = useState(null);
  const data = useMemo(()=>Array.from({length:14},(_,i)=>{
    const t=new Date(now); t.setDate(t.getDate()-(13-i));
    const count=checkIns.filter(c=>{
      const d=new Date(c.check_in_date);
      return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate();
    }).length;
    return { date:t, label:t.toLocaleDateString("en-GB",{weekday:"short"}),
      dayNum:t.getDate(), v:count, isToday:i===13 };
  }),[checkIns,now]);

  const maxV=Math.max(...data.map(d=>d.v),1);
  const W=100, H=68, PAD={t:6,b:22,l:2,r:2};
  const pW=W-PAD.l-PAD.r, pH=H-PAD.t-PAD.b;
  const pts=data.map((d,i)=>({...d,
    x:PAD.l+(i/(data.length-1))*pW,
    y:PAD.t+pH-(d.v/maxV)*pH }));

  const smoothPath=points=>{
    if(points.length<2) return "";
    let d=`M ${points[0].x} ${points[0].y}`;
    for(let i=0;i<points.length-1;i++){
      const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
      const cp1x=p1.x+(p2.x-p0.x)/6,cp1y=p1.y+(p2.y-p0.y)/6;
      const cp2x=p2.x-(p3.x-p1.x)/6,cp2y=p2.y-(p3.y-p1.y)/6;
      d+=` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const pathD=smoothPath(pts);
  const areaD=`${pathD} L ${pts[pts.length-1].x} ${PAD.t+pH} L ${pts[0].x} ${PAD.t+pH} Z`;
  const thisW=data.slice(7).reduce((a,b)=>a+b.v,0);
  const lastW=data.slice(0,7).reduce((a,b)=>a+b.v,0);
  const trend=lastW>0?Math.round(((thisW-lastW)/lastW)*100):0;
  const tUp=trend>=0;
  const bestDay=data.slice(7).reduce((a,b)=>b.v>a.v?b:a,{v:-1,label:"?"});
  const dailyAvg=(thisW/7).toFixed(1);

  return (
    <div className="tct2-card t2-fu t2-d3" style={{marginBottom:10}}>
      <CardHead label="Attendance" sub="Last 14 days" right={
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
          borderRadius:7, background:tUp?C.greenDim:C.redDim,
          border:`1px solid ${tUp?C.greenBrd:C.redBrd}` }}>
          <span style={{fontSize:10,color:tUp?C.green:C.red}}>{tUp?"↑":"↓"}</span>
          <Mono style={{fontSize:11,color:tUp?C.green:C.red}}>{Math.abs(trend)}%</Mono>
          <span style={{fontSize:10,color:tUp?C.green:C.red,opacity:.7}}>vs last wk</span>
        </div>
      }/>
      <div style={{padding:"14px 16px 6px"}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:160,overflow:"visible"}}
          onMouseLeave={()=>setTip(null)}>
          <defs>
            <linearGradient id="tct2-ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C.cyan} stopOpacity={.12}/>
              <stop offset="100%" stopColor={C.cyan} stopOpacity={0}/>
            </linearGradient>
          </defs>
          {[.25,.5,.75].map((v,i)=>(
            <line key={i} x1={PAD.l} y1={PAD.t+pH*(1-v)} x2={W-PAD.r} y2={PAD.t+pH*(1-v)}
              stroke="rgba(255,255,255,.04)" strokeWidth={.3}/>
          ))}
          <path d={areaD} fill="url(#tct2-ag)"/>
          <path d={pathD} fill="none" stroke={C.cyan} strokeWidth={1.4}
            strokeLinejoin="round" strokeLinecap="round"/>
          {(() => {
            const p=pts[pts.length-1];
            return (
              <g>
                <line x1={p.x} y1={PAD.t} x2={p.x} y2={PAD.t+pH}
                  stroke={C.cyan} strokeWidth={.4} strokeDasharray="1.5 2" opacity={.25}/>
                <circle cx={p.x} cy={p.y} r={2.5} fill={C.bg} stroke={C.cyan} strokeWidth={1.2}/>
              </g>
            );
          })()}
          {pts.map((p,i)=>(i===pts.length-1?null:
            <circle key={i} cx={p.x} cy={p.y} r={1} fill={C.cyan} opacity={.3}/>
          ))}
          {pts.map((p,i)=>(
            <rect key={`h${i}`} x={p.x-3.5} y={PAD.t-2} width={7} height={pH+8}
              fill="transparent" style={{cursor:"crosshair"}}
              onMouseEnter={()=>setTip({x:p.x,y:p.y,v:p.v,label:p.label,dayNum:p.dayNum,isToday:p.isToday})}/>
          ))}
          {tip&&(
            <g style={{pointerEvents:"none"}}>
              <line x1={tip.x} y1={PAD.t} x2={tip.x} y2={PAD.t+pH}
                stroke={C.cyan} strokeWidth={.4} opacity={.3}/>
              <circle cx={tip.x} cy={tip.y} r={2.5} fill={C.bg} stroke={C.cyan} strokeWidth={1.2}/>
              <rect x={Math.min(tip.x-13,W-28)} y={Math.max(tip.y-22,0)} width={26} height={14} rx={3}
                fill={C.card2} stroke={C.brd} strokeWidth={.4}/>
              <text x={Math.min(tip.x,W-15)} y={Math.max(tip.y-12,12)}
                textAnchor="middle" fill={C.t1} fontSize={6}
                fontFamily="monospace" fontWeight={600}>{tip.v}</text>
            </g>
          )}
          {pts.map((p,i)=>(
            <text key={`l${i}`} x={p.x} y={H-6} textAnchor="middle" fontSize={3.8}
              fill={p.isToday?C.cyan:C.t3} fontFamily="system-ui"
              fontWeight={p.isToday?700:400}>
              {p.isToday?"Today":i%2===0?`${p.label} ${p.dayNum}`:""}
            </text>
          ))}
        </svg>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderTop:`1px solid ${C.brd}`}}>
        {[
          {l:"This week", v:thisW, s:"check-ins"},
          {l:"Daily avg",  v:dailyAvg, s:"per day"},
          {l:"Peak day",   v:Math.max(...data.slice(7).map(d=>d.v)), s:bestDay.label, c:C.cyan},
        ].map((s,i)=>(
          <div key={i} style={{ padding:"12px 14px",
            borderRight:i<2?`1px solid ${C.brd}`:"none" }}>
            <Label style={{marginBottom:6}}>{s.l}</Label>
            <Mono style={{fontSize:22,color:s.c||C.t1,lineHeight:1,display:"block",fontWeight:600}}>{s.v}</Mono>
            <div style={{fontSize:10.5,color:C.t3,marginTop:3}}>{s.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SESSION HEALTH ───────────────────────────────────────────────────────────
function sHealth(booked, cap) {
  const r = cap>0?booked/cap:0;
  if (r>=.85) return {label:"Full",     color:C.green, dim:C.greenDim, brd:C.greenBrd};
  if (r>=.55) return {label:"Healthy",  color:C.cyan,  dim:C.cyanDim,  brd:C.cyanBrd };
  if (r>=.28) return {label:"Low",      color:C.amber, dim:C.amberDim, brd:C.amberBrd};
  return            {label:"Critical", color:C.red,   dim:C.redDim,   brd:C.redBrd  };
}

// ─── SESSION TIMELINE ─────────────────────────────────────────────────────────
function SessionTimeline({ sessions, now }) {
  const S=6, E=22, range=E-S;
  const toX=h=>((h-S)/range)*100;
  const toW=m=>(m/60/range)*100;
  const nd=now.getHours()+now.getMinutes()/60;
  const nowX=toX(nd);
  const stCol={live:C.green,upcoming:C.cyan,done:C.t3};
  return (
    <div style={{padding:"12px 16px 22px",borderBottom:`1px solid ${C.brd}`}}>
      <Label style={{marginBottom:10}}>Timeline</Label>
      <div style={{position:"relative",height:30}}>
        <div style={{position:"absolute",top:"50%",left:0,right:0,
          height:1,background:C.brd,transform:"translateY(-50%)"}}/>
        <div style={{position:"absolute",top:0,bottom:0,left:`${nowX}%`,
          width:1,background:C.red,opacity:.5,transform:"translateX(-50%)"}}>
          <div style={{position:"absolute",top:-6,left:"50%",transform:"translateX(-50%)",
            fontSize:7,fontFamily:"'IBM Plex Mono',monospace",color:C.red,fontWeight:600,
            whiteSpace:"nowrap",background:C.bg,padding:"0 3px"}}>NOW</div>
        </div>
        {sessions.filter(s=>s.th!==null).map(s=>{
          const c=stCol[s.status];
          const dur=parseInt(s.duration)||60;
          return (
            <div key={s.id} style={{position:"absolute",top:3,left:`${toX(s.th)}%`,
              width:`${toW(dur)}%`,height:22,
              background:`${c}18`,border:`1px solid ${c}30`,
              borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {s.status==="live"&&(
                <div style={{position:"absolute",left:0,top:0,bottom:0,
                  width:2,background:c,borderRadius:"5px 0 0 5px"}}/>
              )}
              <span style={{fontSize:8,fontWeight:600,color:c,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",padding:"0 5px"}}>
                {s.time}
              </span>
            </div>
          );
        })}
        {[6,9,12,15,18,21].map(h=>(
          <div key={h} style={{position:"absolute",bottom:-13,left:`${toX(h)}%`,
            transform:"translateX(-50%)"}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:7.5,color:C.t3}}>
              {String(h).padStart(2,"0")}:00
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
  const statColor={live:C.green,upcoming:C.cyan,done:C.t3};
  const statLabel={live:"Live",upcoming:"Upcoming",done:"Done"};
  const avgFill=Math.round(sessions.reduce((a,s)=>a+(s.cap>0?s.booked/s.cap:0),0)/Math.max(1,sessions.length)*100);

  return (
    <div className="tct2-card t2-fu t2-d4" style={{marginBottom:10}}>
      <CardHead label="Today's Sessions"
        sub={`${sessions.length} scheduled · ${avgFill}% avg fill`}
        right={
          <button className="tct2-btn" onClick={()=>toast("Session scheduler opened",C.cyan)}
            style={{ fontSize:11.5,fontWeight:600,color:C.cyan,
              background:C.cyanDim,border:`1px solid ${C.cyanBrd}`,
              borderRadius:7,padding:"6px 12px" }}>
            + Add
          </button>
        }
      />
      <SessionTimeline sessions={sessions} now={now}/>
      {/* Column headers */}
      <div style={{ display:"grid",gridTemplateColumns:"60px 1fr 100px 90px 36px",
        padding:"7px 16px",gap:0,borderBottom:`1px solid ${C.brd}`,
        background:"rgba(255,255,255,.015)" }}>
        {["Time","Session","Capacity","Health",""].map((h,i)=>(
          <Label key={i} style={{textAlign:i>1&&i<4?"center":"left"}}>{h}</Label>
        ))}
      </div>
      {sessions.map((s,i)=>{
        const h=sHealth(s.booked,s.cap);
        const pct=s.cap>0?Math.round(s.booked/s.cap*100):0;
        const isE=exp===s.id, isDone=s.status==="done";
        return (
          <div key={s.id}>
            <div className="tct2-row" onClick={()=>setExp(isE?null:s.id)} style={{
              display:"grid",gridTemplateColumns:"60px 1fr 100px 90px 36px",
              padding:"13px 16px",gap:0,alignItems:"center",
              opacity:isDone?.55:1,
              borderLeft:`2px solid ${isDone?"transparent":h.color}`,
              borderBottom:"none" }}>
              <Mono style={{fontSize:11,color:isDone?C.t3:C.t2,fontWeight:500}}>{s.time}</Mono>
              <div style={{minWidth:0,paddingRight:12}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                  {s.status==="live"&&<Dot color={C.green} pulse size={5}/>}
                  <span style={{fontSize:13,fontWeight:600,color:isDone?C.t2:C.t1,
                    letterSpacing:"-.01em",overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                  <Pill color={statColor[s.status]}>{statLabel[s.status]}</Pill>
                </div>
                {s.coach&&<div style={{fontSize:11,color:C.t3}}>{s.coach} · {s.duration}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:"85%",height:3,background:"rgba(255,255,255,.06)",
                  borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,
                    background:isDone?C.t3:h.color,
                    borderRadius:99,transition:"width .5s"}}/>
                </div>
                <Mono style={{fontSize:10,color:C.t3,fontWeight:500}}>{s.booked}/{s.cap}</Mono>
              </div>
              <div style={{display:"flex",justifyContent:"center"}}>
                <Pill color={h.color} bg={h.dim} border={h.brd}>{h.label}</Pill>
              </div>
              <div style={{display:"flex",justifyContent:"center",color:C.t3,
                transition:"transform .2s",
                transform:isE?"rotate(90deg)":"none"}}>
                <span style={{fontSize:12,color:C.t3}}>›</span>
              </div>
            </div>
            {isE&&(
              <div style={{padding:"12px 18px 14px",
                borderTop:`1px solid ${C.brd}`,borderBottom:`1px solid ${C.brd}`,
                background:"rgba(255,255,255,.012)"}}>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {[
                    {label:"Message Attendees",color:C.cyan, dim:C.cyanDim, brd:C.cyanBrd, msg:`Messaging ${s.booked} attendees`},
                    ...(!isDone&&h.label!=="Full"?[
                      {label:"Promote Class",color:C.amber,dim:C.amberDim,brd:C.amberBrd,msg:`Promoting ${s.name}`}
                    ]:[]),
                    {label:"Check-in",color:C.green,dim:C.greenDim,brd:C.greenBrd,msg:"QR scanner ready"},
                  ].map((a,j)=>(
                    <button key={j} className="tct2-btn" onClick={()=>toast(a.msg,a.color)} style={{
                      fontSize:11,fontWeight:600,color:a.color,
                      background:a.dim,border:`1px solid ${a.brd}`,
                      borderRadius:7,padding:"7px 12px"}}>
                      {a.label}
                    </button>
                  ))}
                </div>
                {s.notes&&(
                  <div style={{marginTop:10,fontSize:11.5,color:C.t3,fontStyle:"italic",
                    lineHeight:1.6,padding:"9px 12px",
                    background:C.amberDim,border:`1px solid ${C.amberBrd}`,borderRadius:7}}>
                    {s.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div style={{padding:"10px 16px",display:"flex",gap:24,
        borderTop:`1px solid ${C.brd}`,background:"rgba(255,255,255,.012)"}}>
        {[
          {l:"Booked",   v:sessions.reduce((a,s)=>a+s.booked,0)},
          {l:"Capacity", v:sessions.reduce((a,s)=>a+s.cap,0)},
          {l:"Progress", v:`${sessions.filter(s=>s.status==="done").length}/${sessions.length}`},
        ].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:6,alignItems:"baseline"}}>
            <Mono style={{fontSize:16,color:C.t1,fontWeight:600}}>{s.v}</Mono>
            <Label>{s.l}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────
function ActivityFeed({ toast }) {
  return (
    <div className="tct2-card t2-fu t2-d6">
      <CardHead label="Activity Feed" sub="Today's events"/>
      <div className="tct2-scr" style={{maxHeight:300,overflowY:"auto"}}>
        {MOCK_ACTIVITY.map((ev,i)=>(
          <div key={i} className="tct2-row" style={{display:"flex",alignItems:"center",
            gap:10,padding:"11px 14px",
            borderBottom:i<MOCK_ACTIVITY.length-1?`1px solid ${C.brd}`:"none"}}>
            <div style={{position:"relative",flexShrink:0}}>
              <Avatar name={ev.name} size={28}/>
              <div style={{position:"absolute",bottom:-1,right:-1,
                width:12,height:12,borderRadius:4,
                background:C.bg,border:`1px solid ${ev.color}30`,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:ev.color}}/>
              </div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <span style={{fontSize:12.5,fontWeight:600,color:C.t1}}>{ev.name}</span>
              {" "}<span style={{fontSize:11.5,color:C.t3}}>{ev.detail}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              {ev.action&&(
                <button className="tct2-btn" onClick={()=>toast(`${ev.action}: ${ev.name}`,ev.color)} style={{
                  fontSize:10.5,fontWeight:600,color:ev.color,
                  background:`${ev.color}12`,border:`1px solid ${ev.color}25`,
                  borderRadius:6,padding:"4px 9px"}}>
                  {ev.action}
                </button>
              )}
              <Mono style={{fontSize:10,color:C.t3}}>{ev.time}</Mono>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WEEKLY PERFORMANCE (SIDEBAR) ─────────────────────────────────────────────
function WeeklyPerformance({ checkIns, sessions, allMemberships, now }) {
  const thisStart=new Date(now); thisStart.setDate(thisStart.getDate()-7);
  const lastStart=new Date(now); lastStart.setDate(lastStart.getDate()-14);
  const ciThis=checkIns.filter(c=>new Date(c.check_in_date)>=thisStart).length;
  const ciLast=checkIns.filter(c=>{
    const d=new Date(c.check_in_date); return d>=lastStart&&d<thisStart;
  }).length;
  const ciChange=ciLast>0?Math.round(((ciThis-ciLast)/ciLast)*100):null;
  const fillRate=(()=>{
    const ss=sessions.filter(s=>s.cap>0);
    return ss.length?Math.round(ss.reduce((a,s)=>a+s.booked/s.cap,0)/ss.length*100):0;
  })();
  const atRisk=allMemberships.filter(m=>{
    const last=checkIns.filter(c=>c.user_id===m.user_id)
      .sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date))[0];
    return !last||diffDays(now,new Date(last.check_in_date))>=14;
  }).length;

  const rows=[
    {l:"Attendance",  v:ciThis,        change:ciChange, up:(ciChange??0)>=0, sub:"check-ins this week",   vc:null},
    {l:"Fill Rate",   v:`${fillRate}%`,change:null,     up:fillRate>=60,     sub:`${sessions.reduce((a,s)=>a+s.booked,0)}/${sessions.reduce((a,s)=>a+s.cap,0)} spots`, vc:null},
    {l:"At Risk",     v:atRisk,        change:null,     up:atRisk===0,       sub:"inactive 14+ days",     vc:atRisk>0?C.red:C.green},
    {l:"Revenue MTD", v:"£8,240",      change:8,        up:true,             sub:"vs £7,630 last month",  vc:C.green},
  ];

  return (
    <div className="tct2-card t2-fu t2-d5" style={{marginBottom:10}}>
      <CardHead label="Performance" sub="This week"/>
      {rows.map((m,i)=>(
        <div key={i} style={{padding:"12px 14px",
          borderBottom:i<rows.length-1?`1px solid ${C.brd}`:"none",
          display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,height:28,borderRadius:7,flexShrink:0,
            background:`${(m.vc||C.cyan)}12`,border:`1px solid ${(m.vc||C.cyan)}25`,
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{width:8,height:8,borderRadius:2,background:m.vc||C.cyan}}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <Label style={{marginBottom:4}}>{m.l}</Label>
            <div style={{display:"flex",alignItems:"baseline",gap:7}}>
              <Mono style={{fontSize:20,color:m.vc||C.t1,lineHeight:1,fontWeight:600}}>{m.v}</Mono>
              {m.change!==null&&(
                <div style={{display:"flex",alignItems:"center",gap:3,padding:"2px 6px",
                  borderRadius:5,background:m.up?C.greenDim:C.redDim,
                  border:`1px solid ${m.up?C.greenBrd:C.redBrd}`}}>
                  <span style={{fontSize:9,color:m.up?C.green:C.red}}>{m.up?"↑":"↓"}</span>
                  <Mono style={{fontSize:10,color:m.up?C.green:C.red}}>{Math.abs(m.change)}%</Mono>
                </div>
              )}
            </div>
            <div style={{fontSize:10.5,color:C.t3,marginTop:2}}>{m.sub}</div>
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

  const clients = useMemo(()=>allMemberships.map(m=>{
    const mCI=checkIns.filter(c=>c.user_id===m.user_id)
      .sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
    const last=mCI[0];
    const days=last?diffDays(now,new Date(last.check_in_date)):999;
    const ci30=mCI.filter(c=>diffDays(now,new Date(c.check_in_date))<=30).length;
    let level, reason;
    if(days===999)    {level="critical";reason="Never checked in";}
    else if(days>=21) {level="critical";reason=`${days}d inactive`;}
    else if(days>=14) {level="high";    reason=`${days}d inactive`;}
    else if(days>=7)  {level="med";     reason=`${days}d since last visit`;}
    else return null;
    return {id:m.user_id,name:m.user_name,days,ci30,level,reason};
  }).filter(Boolean).sort((a,b)=>b.days-a.days),[allMemberships,checkIns,now]);

  const lvlC={critical:C.red,high:C.amber,med:C.cyan};
  const cnt={all:clients.length,critical:clients.filter(c=>c.level==="critical").length,
    high:clients.filter(c=>c.level==="high").length,med:clients.filter(c=>c.level==="med").length};
  const filtered=filter==="all"?clients:clients.filter(c=>c.level===filter);
  const shown=showAll?filtered:filtered.slice(0,4);

  if(!clients.length) return (
    <div className="tct2-card t2-fu t2-d6">
      <CardHead label="Client Risk"/>
      <div style={{padding:"28px 14px",textAlign:"center"}}>
        <div style={{width:36,height:36,borderRadius:"50%",margin:"0 auto 10px",
          background:C.greenDim,border:`1px solid ${C.greenBrd}`,
          display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:C.green,fontSize:14}}>✓</span>
        </div>
        <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:3}}>All clients active</div>
        <div style={{fontSize:11,color:C.t3}}>No one inactive 7+ days</div>
      </div>
    </div>
  );

  return (
    <div className="tct2-card t2-fu t2-d6" style={{
      borderTop:`1px solid ${C.redBrd}`}}>
      <CardHead label="Client Risk" sub={`${clients.length} need attention`}
        right={<Pill color={C.red} bg={C.redDim} border={C.redBrd}>{cnt.critical} critical</Pill>}/>
      <div style={{display:"flex",gap:2,padding:"5px 8px",borderBottom:`1px solid ${C.brd}`,
        background:"rgba(255,255,255,.012)"}}>
        {[{k:"all",l:`All ${cnt.all}`},{k:"critical",l:`Crit ${cnt.critical}`},
          {k:"high",l:`High ${cnt.high}`},{k:"med",l:`Med ${cnt.med}`}].map(f=>(
          <button key={f.k} className="tct2-tab" onClick={()=>setFilter(f.k)} style={{
            fontSize:10.5,fontWeight:filter===f.k?700:500,
            color:filter===f.k?C.t1:C.t3,
            background:filter===f.k?"rgba(255,255,255,.06)":"transparent",
            borderRadius:6,padding:"5px 9px",flex:1}}>
            {f.l}
          </button>
        ))}
      </div>
      {shown.map((c,i)=>(
        <div key={c.id} style={{
          borderBottom:i<shown.length-1?`1px solid ${C.brd}`:"none",
          borderLeft:`2px solid ${lvlC[c.level]}`,
          padding:"10px 12px",display:"flex",alignItems:"center",gap:9}}>
          <Avatar name={c.name} size={26}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:C.t1,overflow:"hidden",
              textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{c.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:10.5,color:lvlC[c.level],fontWeight:500}}>{c.reason}</span>
              <span style={{fontSize:9.5,color:C.t3}}>· {c.ci30} visits/30d</span>
            </div>
          </div>
          <button className="tct2-btn" onClick={()=>toast(`Reaching out to ${c.name}`,lvlC[c.level])} style={{
            fontSize:10,fontWeight:600,color:lvlC[c.level],
            background:`${lvlC[c.level]}12`,border:`1px solid ${lvlC[c.level]}25`,
            borderRadius:6,padding:"5px 8px"}}>
            msg
          </button>
        </div>
      ))}
      {filtered.length>4&&(
        <div style={{padding:"8px 12px",borderTop:`1px solid ${C.brd}`}}>
          <button className="tct2-btn" onClick={()=>setShowAll(p=>!p)} style={{
            fontSize:11,fontWeight:600,color:C.cyan,background:"transparent",
            width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            {showAll?"Show less":`${filtered.length-4} more`}
            <span style={{fontSize:10}}>{showAll?"↑":"↓"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ENGAGEMENT HEATMAP (SIDEBAR) ─────────────────────────────────────────────
function EngagementHeatmap({ checkIns, now }) {
  const weeks=4, days=7;
  const cells=useMemo(()=>{
    const result=[];
    for(let w=weeks-1;w>=0;w--){
      for(let d=0;d<days;d++){
        const daysAgo=w*7+(6-d);
        const date=new Date(now); date.setDate(date.getDate()-daysAgo);
        const count=checkIns.filter(c=>{
          const cd=new Date(c.check_in_date);
          return cd.getFullYear()===date.getFullYear()&&cd.getMonth()===date.getMonth()&&cd.getDate()===date.getDate();
        }).length;
        result.push({date,count,daysAgo});
      }
    }
    return result;
  },[checkIns,now]);

  const maxC=Math.max(...cells.map(c=>c.count),1);
  const dayLabels=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div className="tct2-card t2-fu t2-d7" style={{marginBottom:10}}>
      <CardHead label="Engagement Map" sub="Last 4 weeks"/>
      <div style={{padding:"12px 14px 14px"}}>
        <div style={{display:"grid",gridTemplateColumns:`22px repeat(${weeks},1fr)`,gap:3}}>
          {dayLabels.map((d,i)=>(
            <div key={d} style={{gridColumn:1,gridRow:i+1,
              fontSize:8.5,fontFamily:"'IBM Plex Mono',monospace",color:C.t3,
              display:"flex",alignItems:"center"}}>
              {i%2===0?d:""}
            </div>
          ))}
          {cells.map((cell,i)=>{
            const w=Math.floor(i/7);
            const d=i%7;
            const intensity=cell.count/maxC;
            const bg=cell.count===0?C.card2:`rgba(77,127,255,${.1+intensity*.55})`;
            return (
              <div key={i} title={`${cell.date.toLocaleDateString("en-GB")} — ${cell.count} check-ins`}
                style={{gridColumn:w+2,gridRow:d+1,width:"100%",aspectRatio:"1",
                  borderRadius:3,background:bg,
                  border:`1px solid ${cell.count>0?`rgba(77,127,255,${.1+intensity*.2})`:"transparent"}`}}/>
            );
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,marginTop:9,justifyContent:"flex-end"}}>
          <span style={{fontSize:8.5,color:C.t3,fontFamily:"'IBM Plex Mono',monospace"}}>Less</span>
          {[0,.15,.3,.5,.7].map((v,i)=>(
            <div key={i} style={{width:9,height:9,borderRadius:2,
              background:v===0?C.card2:`rgba(77,127,255,${.1+v*.55})`}}/>
          ))}
          <span style={{fontSize:8.5,color:C.t3,fontFamily:"'IBM Plex Mono',monospace"}}>More</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function TabCoachToday({ allMemberships, checkIns, myClasses, currentUser, now }) {
  const { toasts, toast } = useToast();
  const sessions   = useMemo(()=>deriveSessions(myClasses,now),[myClasses,now]);
  const priorities = useMemo(()=>derivePriorities({allMemberships,checkIns,sessions,now}),[allMemberships,checkIns,sessions,now]);

  return (
    <div className="tct2 tct2-scr" style={{
      background:C.bg, minHeight:"100vh",
      color:C.t1, fontFamily:FONT,
      WebkitFontSmoothing:"antialiased" }}>
      <ToastStack toasts={toasts}/>
      <div className="tct2-root-pad" style={{
        maxWidth:1360, margin:"0 auto",
        padding:"24px 24px 60px" }}>
        <CommandHeader currentUser={currentUser} now={now} sessions={sessions} priorities={priorities}/>
        <TodaysPriorities priorities={priorities} toast={toast}/>
        <QuickStrip toast={toast}/>
        <div className="tct2-main-grid" style={{
          display:"grid", gridTemplateColumns:"1fr 300px",
          gap:10, alignItems:"start" }}>
          <div>
            <AttendanceChart checkIns={checkIns} now={now}/>
            <TodaysSessions sessions={sessions} toast={toast} now={now}/>
            <ActivityFeed toast={toast}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:0,
            position:"sticky",top:16}}>
            <WeeklyPerformance checkIns={checkIns} sessions={sessions} allMemberships={allMemberships} now={now}/>
            <ClientRiskFeed allMemberships={allMemberships} checkIns={checkIns} now={now} toast={toast}/>
            <EngagementHeatmap checkIns={checkIns} now={now}/>
          </div>
        </div>
      </div>
    </div>
  );
}

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
