import { useState, useMemo } from "react";

// ─── UTILITY ──────────────────────────────────────────────────────────────────
const diffDays = (a, b) => Math.floor((a - b) / 86400000);

// ─── DESIGN TOKENS — matched to Overview page ─────────────────────────────────
// Monochromatic navy base. Color is EARNED, not decorative.
const T = {
  bg:  "#07090d",
  s1:  "#0d1018",
  s2:  "#111520",
  s3:  "#161c2a",
  b0:  "rgba(255,255,255,0.055)",
  b1:  "rgba(255,255,255,0.09)",
  b2:  "rgba(255,255,255,0.14)",
  t0:  "#ffffff",
  t1:  "#e2e8f0",
  t2:  "#8892a4",
  t3:  "#4a5a6e",
  t4:  "#253040",
  // Primary action — indigo (matches Overview's "New Post" / chart fill)
  indigo:  "#5b6df0",
  indigoD: "rgba(91,109,240,0.10)",
  indigoB: "rgba(91,109,240,0.22)",
  // Positive / active
  green:   "#22c55e",
  greenD:  "rgba(34,197,94,0.08)",
  greenB:  "rgba(34,197,94,0.18)",
  // Danger / at-risk
  red:     "#f05252",
  redD:    "rgba(240,82,82,0.08)",
  redB:    "rgba(240,82,82,0.20)",
  // Warning / pending
  amber:   "#f0a030",
  amberD:  "rgba(240,160,48,0.08)",
  amberB:  "rgba(240,160,48,0.20)",
};

const CARD   = { background:T.s1, border:`1px solid ${T.b0}`, borderRadius:12, overflow:"hidden" };
const SHADOW = "0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
if (typeof document !== "undefined" && !document.getElementById("mcc-styles")) {
  const s = document.createElement("style");
  s.id = "mcc-styles";
  s.textContent = `
    .mcc,.mcc *{box-sizing:border-box;margin:0;padding:0;}
    .mcc{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;}
    .mono{font-family:'SF Mono','Fira Code','Cascadia Code',monospace!important;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}
    .fadeUp{animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both;}
    .d1{animation-delay:.05s}.d2{animation-delay:.10s}.d3{animation-delay:.15s}
    .d4{animation-delay:.20s}.d5{animation-delay:.25s}
    .hov{transition:background .1s;}
    .hov:hover{background:rgba(255,255,255,0.02)!important;}
    .btn{cursor:pointer;border:none;outline:none;font-family:inherit;
      transition:opacity .1s,transform .1s;display:inline-flex;align-items:center;gap:5px;}
    .btn:hover{opacity:.82;}
    .btn:active{transform:scale(.97);}
    .scr::-webkit-scrollbar{width:2px;}
    .scr::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:2px;}
    .pri-card{transition:background .1s;}
    .pri-card:hover{background:rgba(255,255,255,0.015)!important;}
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
  {user_id:"u1", user_name:"Sophie Allen"},
  {user_id:"u2", user_name:"James Park"},
  {user_id:"u3", user_name:"Rachel Kim"},
  {user_id:"u4", user_name:"Michael Chen"},
  {user_id:"u5", user_name:"Ella Torres"},
  {user_id:"u6", user_name:"David Lowe"},
  {user_id:"u7", user_name:"Maria Santos"},
  {user_id:"u8", user_name:"Tom Bradley"},
  {user_id:"u9", user_name:"Lisa Chen"},
  {user_id:"u10",user_name:"Alex Kumar"},
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
  {id:"c1",name:"Morning Strength",schedule:"7:00 am", max_capacity:15,bookings:Array.from({length:12},(_,i)=>({id:i})),duration_minutes:60,instructor:"Marcus Reid"},
  {id:"c2",name:"Yoga Flow",       schedule:"9:30 am", max_capacity:15,bookings:Array.from({length:6}, (_,i)=>({id:i})),duration_minutes:60,instructor:"Sarah Mills"},
  {id:"c3",name:"Lunch HIIT",      schedule:"12:00 pm",max_capacity:15,bookings:Array.from({length:15},(_,i)=>({id:i})),duration_minutes:45,instructor:"Marcus Reid",notes:"Full house — consider sending a warmup tip before class."},
  {id:"c4",name:"Evening HIIT",    schedule:"6:00 pm", max_capacity:20,bookings:Array.from({length:7}, (_,i)=>({id:i})),duration_minutes:45,instructor:"Tom Harris"},
  {id:"c5",name:"Spin Class",      schedule:"7:30 pm", max_capacity:18,bookings:Array.from({length:14},(_,i)=>({id:i})),duration_minutes:45,instructor:"Amy Price"},
];

const CURRENT_USER = { display_name:"Marcus Reid" };

const MOCK_ACTIVITY = [
  {type:"checkin",name:"David Lowe",  detail:"Checked into Morning Strength",      time:"2m ago",    dot:T.green},
  {type:"missed", name:"Rachel Kim",  detail:"Missed Yoga Flow — no cancellation", time:"14m ago",   dot:T.red,   action:"Follow up"},
  {type:"sent",   name:"You",         detail:"Renewal message sent to Tom Bradley",time:"47m ago",   dot:T.t3},
  {type:"booking",name:"Maria Santos",detail:"Booked Evening HIIT at 6pm",         time:"1h ago",    dot:T.green},
  {type:"booking",name:"3 members",   detail:"Booked Spin Class — now 14/18",      time:"2h ago",    dot:T.green},
  {type:"cancel", name:"Michael Chen",detail:"Cancelled Thursday — 2nd this week", time:"3h ago",    dot:T.amber, action:"Check in"},
  {type:"new",    name:"Emma Wilson", detail:"Started 7-day trial membership",     time:"Yesterday", dot:T.indigo},
];

// ─── ATOMS ────────────────────────────────────────────────────────────────────

function Chip({ children, color, bg, brd, style={} }) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:9,fontWeight:700,
      letterSpacing:".09em",textTransform:"uppercase",color:color||T.t3,
      background:bg||"rgba(255,255,255,0.04)",border:`1px solid ${brd||T.b0}`,
      borderRadius:4,padding:"2px 7px",whiteSpace:"nowrap",...style}}>
      {children}
    </span>
  );
}

function Dot({ color, pulse }) {
  return <div style={{width:5,height:5,borderRadius:"50%",background:color,flexShrink:0,
    animation:pulse?"pulse 2.2s ease-in-out infinite":"none"}}/>;
}

function Avatar({ name, size=28, accent }) {
  const ac = accent||T.t3;
  const ini = (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:`${ac}12`,
      border:`1px solid ${ac}20`,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*.32,fontWeight:700,color:ac,userSelect:"none"}}>{ini}</div>
  );
}

function Btn({ label, color, bg, brd, onClick, icon, style={} }) {
  return (
    <button className="btn" onClick={onClick} style={{fontSize:10.5,fontWeight:600,color,
      background:bg||"transparent",border:`1px solid ${brd||T.b1}`,
      borderRadius:6,padding:"5px 12px",whiteSpace:"nowrap",...style}}>
      {icon}{label}
    </button>
  );
}

function CardHead({ label, sub, right, border=true }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
      padding:"12px 18px",...(border?{borderBottom:`1px solid ${T.b0}`}:{})}}>
      <div>
        <div style={{fontSize:10.5,fontWeight:700,color:T.t2,textTransform:"uppercase",
          letterSpacing:".1em"}}>{label}</div>
        {sub&&<div style={{fontSize:10,color:T.t3,marginTop:2}}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

const I = {
  arrow: (n=10)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={5} y1={12} x2={19} y2={12}/><polyline points="12 5 19 12 12 19"/></svg>,
  warn:  (n=13)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1={12} y1={9} x2={12} y2={13}/><line x1={12} y1={17} x2={12.01} y2={17}/></svg>,
  info:  (n=13)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={12} cy={12} r={10}/><line x1={12} y1={8} x2={12} y2={12}/><line x1={12} y1={16} x2={12.01} y2={16}/></svg>,
  check: (n=13)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>,
  up:    (n=10)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="18 15 12 9 6 15"/></svg>,
  down:  (n=10)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="6 9 12 15 18 9"/></svg>,
  msg:   (n=11)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  cal:   (n=11)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>,
  qr:    (n=11)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={3} y={3} width={7} height={7}/><rect x={14} y={3} width={7} height={7}/><rect x={14} y={14} width={7} height={7}/><rect x={3} y={14} width={4} height={4}/></svg>,
  plus:  (n=11)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>,
  users: (n=11)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  chevR: (n=10)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>,
  speak: (n=11)=><svg width={n} height={n} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>,
};

// ─── TOAST ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = (msg, color=T.indigo) => {
    const id = Date.now();
    setToasts(p=>[...p,{id,msg,color}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3000);
  };
  return {toasts,toast};
}

function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{position:"absolute",top:18,right:18,zIndex:100,
      display:"flex",flexDirection:"column",gap:6,pointerEvents:"none",maxWidth:280}}>
      {toasts.map(t=>(
        <div key={t.id} style={{animation:"slideIn .2s cubic-bezier(.22,1,.36,1) both",
          background:T.s2,border:`1px solid ${T.b1}`,borderLeft:`2px solid ${t.color}`,
          borderRadius:8,padding:"9px 14px",fontSize:11.5,color:T.t1,lineHeight:1.5}}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── DERIVE SESSIONS ──────────────────────────────────────────────────────────

function deriveSessions(myClasses, now) {
  const nd = now.getHours() + now.getMinutes()/60;
  return myClasses.map((cls,i)=>{
    const sched = typeof cls.schedule==="string" ? cls.schedule : "";
    let th = null;
    const m = sched.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (m) {
      th = parseInt(m[1]);
      if (m[3]?.toLowerCase()==="pm" && th!==12) th+=12;
      if (m[3]?.toLowerCase()==="am" && th===12) th=0;
      if (m[2]) th+=parseInt(m[2])/60;
    }
    const cap=cls.max_capacity||20, booked=(cls.bookings||[]).length, dur=cls.duration_minutes||60;
    let status="upcoming";
    if (th!==null) {
      if (nd>th+dur/60) status="done";
      else if (nd>=th) status="live";
    }
    return {id:cls.id||`c${i}`,name:cls.name||"Session",time:sched,th,booked,cap,
      duration:`${dur}m`,status,coach:cls.instructor||null,notes:cls.notes||null};
  }).sort((a,b)=>(a.th??99)-(b.th??99));
}

// ─── DERIVE PRIORITIES ────────────────────────────────────────────────────────

function derivePriorities({ allMemberships, checkIns, sessions, now }) {
  const out = [];

  const inactive = allMemberships.filter(m=>{
    const last = checkIns.filter(c=>c.user_id===m.user_id)
      .sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date))[0];
    return last && diffDays(now,new Date(last.check_in_date))>=7;
  });
  const never = allMemberships.filter(m=>!checkIns.some(c=>c.user_id===m.user_id));

  if (inactive.length>0||never.length>0) {
    const count=inactive.length+never.length;
    const names=[...inactive,...never].map(m=>m.user_name?.split(" ")[0]).slice(0,2).join(", ");
    out.push({id:"inactive",rank:1,severity:"high",
      title:`${count} client${count>1?"s haven't":"hasn't"} attended in 7+ days`,
      context:`${names}${count>2?` + ${count-2} more`:""} — each extra day lowers re-engagement success by ~4%. Today is the best window to act.`,
      cta:"Send Re-engagement",
      color:T.red,colorDim:T.redD,colorBrd:T.redB,accent:T.red});
  }

  out.push({id:"trials",rank:2,severity:"med",
    title:"4 trial members expire this week",
    context:"Avg conversion is 68% when contacted before day 4. Today is day 4 for Emma Wilson — the window is closing.",
    cta:"Start Upsell Sequence",
    color:T.amber,colorDim:T.amberD,colorBrd:T.amberB,accent:T.amber});

  const under = sessions.filter(s=>s.status!=="done"&&s.cap>0&&s.booked/s.cap<0.4);
  if (under.length>0) {
    const s=under[0];
    out.push({id:"underbooked",rank:3,severity:"med",
      title:`"${s.name}" is at ${Math.round(s.booked/s.cap*100)}% — ${s.cap-s.booked} spots open`,
      context:`${s.booked}/${s.cap} filled. Last month this class averaged ${s.cap-2} attendees. A quick push can still close the gap.`,
      cta:"Promote Class",
      color:T.indigo,colorDim:T.indigoD,colorBrd:T.indigoB,accent:T.indigo});
  }

  if (out.length===0) out.push({id:"ok",rank:1,severity:"ok",
    title:"You're on top of everything today",
    context:"All clients active, sessions healthy. Use this window to plan next week or review monthly performance trends.",
    cta:"View Analytics",
    color:T.green,colorDim:T.greenD,colorBrd:T.greenB,accent:T.green});

  return out.slice(0,4);
}

// ─── COMMAND HEADER ───────────────────────────────────────────────────────────

function CommandHeader({ currentUser, now, sessions, priorities }) {
  const firstName = currentUser?.display_name?.split(" ")[0]||"Coach";
  const h = now.getHours();
  const greeting = h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  const dateStr = now.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});
  const live = sessions.find(s=>s.status==="live");
  const next = sessions.find(s=>s.status==="upcoming");
  const urgent = priorities.filter(p=>p.severity==="high").length;
  const avgFill = (() => {
    const s=sessions.filter(ss=>ss.cap>0);
    return s.length?Math.round(s.reduce((a,ss)=>a+ss.booked/ss.cap,0)/s.length*100):0;
  })();

  return (
    <div className="fadeUp" style={{paddingBottom:20,marginBottom:20,borderBottom:`1px solid ${T.b0}`}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
        <div>
          <div className="mono" style={{fontSize:10,color:T.t3,marginBottom:8,letterSpacing:".06em"}}>{dateStr}</div>
          <h1 style={{fontSize:28,fontWeight:800,color:T.t0,letterSpacing:"-.05em",lineHeight:1}}>
            {greeting}, {firstName}.
          </h1>
          <div style={{marginTop:10,fontSize:12.5,color:T.t3,lineHeight:1.5}}>
            {urgent>0
              ? <><span style={{color:T.red,fontWeight:700}}>{urgent} urgent item{urgent>1?"s":""}</span> need your attention — act before the next session begins.</>
              : "Everything looks healthy. Review your sessions and risk feed below."}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:7}}>
          {live ? (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",
              background:T.greenD,border:`1px solid ${T.greenB}`,borderRadius:8}}>
              <Dot color={T.green} pulse/>
              <span style={{fontSize:12,fontWeight:700,color:T.green}}>{live.name} · Live now</span>
              <span className="mono" style={{fontSize:10.5,color:T.green,opacity:.6}}>{live.booked}/{live.cap}</span>
            </div>
          ) : next ? (
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"7px 13px",
              background:T.s2,border:`1px solid ${T.b1}`,borderRadius:8}}>
              <Dot color={T.t3}/>
              <span style={{fontSize:11,color:T.t2}}>Next: <strong style={{color:T.t1,fontWeight:600}}>{next.name}</strong> · {next.time}</span>
            </div>
          ) : null}
          <div style={{display:"flex",gap:5}}>
            {[
              {v:urgent,     l:"urgent",   c:T.red,   d:T.redD,   b:T.redB},
              {v:`${avgFill}%`,l:"avg fill",c:T.t1,   d:T.s2,     b:T.b1},
              {v:"£8,240",   l:"mtd",      c:T.green, d:T.greenD, b:T.greenB},
            ].map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",
                background:p.d,border:`1px solid ${p.b}`,borderRadius:6}}>
                <span className="mono" style={{fontSize:11,fontWeight:600,color:p.c}}>{p.v}</span>
                <span style={{fontSize:8.5,fontWeight:700,color:p.c,opacity:.6,
                  textTransform:"uppercase",letterSpacing:".07em"}}>{p.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TODAY'S PRIORITIES ───────────────────────────────────────────────────────

function TodaysPriorities({ priorities, toast }) {
  const urgent = priorities.filter(p=>p.severity==="high").length;
  const cols = priorities.length===1?"1fr":priorities.length===2?"1fr 1fr":"1fr 1fr 1fr";

  return (
    <div className="fadeUp" style={{...CARD,boxShadow:SHADOW,marginBottom:14}}>
      <CardHead label="Today's Priorities"
        sub={urgent>0?`${urgent} urgent · act before sessions begin`:"Everything on track"}
        right={<Chip color={urgent>0?T.red:T.green} bg={urgent>0?T.redD:T.greenD} brd={urgent>0?T.redB:T.greenB}>
          {urgent>0?`${urgent} urgent`:"all clear"}
        </Chip>}/>
      <div style={{display:"grid",gridTemplateColumns:cols}}>
        {priorities.map((p,i)=>(
          <div key={p.id} className="pri-card" style={{
            padding:"16px 18px",
            // Left border accent is the ONLY color — matches Overview Action Items
            borderLeft:`2px solid ${p.accent}`,
            borderRight:i<priorities.length-1?`1px solid ${T.b0}`:"none",
            display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
              <span className="mono" style={{fontSize:9.5,color:T.t4,fontWeight:600,paddingTop:2,
                minWidth:16,flexShrink:0}}>0{p.rank}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12.5,fontWeight:700,color:T.t0,lineHeight:1.35,
                  letterSpacing:"-.01em"}}>{p.title}</div>
              </div>
            </div>
            <div style={{fontSize:11,color:T.t3,lineHeight:1.65,paddingLeft:26}}>{p.context}</div>
            <div style={{paddingLeft:26}}>
              <button className="btn" onClick={()=>toast(`Started: ${p.cta}`,p.color)}
                style={{fontSize:10.5,fontWeight:700,color:p.color,background:p.colorDim,
                  border:`1px solid ${p.colorBrd}`,borderRadius:6,padding:"6px 13px"}}>
                {p.cta} {I.arrow(9)}
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
    // Primary — indigo fill (matches Overview "+ New Post")
    {label:"Scan Check-in",    color:T.t0, bg:T.indigo, brd:T.indigo,  icon:I.qr(12),    primary:true,  msg:"QR scanner opened"},
    // Ghosts — dark bg, subtle border
    {label:"Broadcast Message",color:T.t1, bg:T.s2,     brd:T.b1,      icon:I.msg(12),   primary:false, msg:"Message composer opened"},
    {label:"Schedule Session", color:T.t1, bg:T.s2,     brd:T.b1,      icon:I.cal(12),   primary:false, msg:"Session scheduler opened"},
    {label:"All Clients",      color:T.t2, bg:"transparent",brd:T.b0,  icon:I.users(12), primary:false, msg:"Opening clients tab"},
  ];
  return (
    <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
      {items.map((a,i)=>(
        <button key={i} className="btn" onClick={()=>toast(a.msg,T.indigo)}
          style={{fontSize:11.5,fontWeight:a.primary?700:600,color:a.color,
            background:a.bg,border:`1px solid ${a.brd}`,borderRadius:8,padding:"8px 15px",gap:7}}>
          <span style={{color:a.primary?T.t0:T.indigo,display:"inline-flex"}}>{a.icon}</span>
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
    const t = new Date(now); t.setDate(t.getDate()-(13-i));
    const count = checkIns.filter(c=>{
      const d=new Date(c.check_in_date);
      return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate();
    }).length;
    return {date:t,label:t.toLocaleDateString("en-GB",{weekday:"short",day:"numeric"}),
      v:count,isToday:i===13,isWeekend:t.getDay()===0||t.getDay()===6};
  }),[checkIns,now]);

  const maxV = Math.max(...data.map(d=>d.v),1);
  const W=100,H=78,PAD={t:6,b:28,l:2,r:2};
  const pW=W-PAD.l-PAD.r, pH=H-PAD.t-PAD.b;
  const pts = data.map((d,i)=>({...d,
    x:PAD.l+(i/(data.length-1))*pW,y:PAD.t+pH-(d.v/maxV)*pH}));

  const anomalies = pts.filter((p,i)=>{
    if(i<1||i>pts.length-2) return false;
    const avg=(pts[i-1].v+pts[i+1].v)/2;
    return avg>1&&p.v<avg*0.45;
  });

  const pathD = pts.map((p,i)=>`${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${PAD.t+pH} L ${pts[0].x} ${PAD.t+pH} Z`;

  const thisW=data.slice(7).reduce((a,b)=>a+b.v,0);
  const lastW=data.slice(0,7).reduce((a,b)=>a+b.v,0);
  const trend=lastW>0?Math.round(((thisW-lastW)/lastW)*100):0;
  const tUp=trend>=0;
  const bestDay=data.slice(7).reduce((a,b)=>b.v>a.v?b:a,{v:-1,label:"?"});

  return (
    <div className="fadeUp d1" style={{...CARD,boxShadow:SHADOW,marginBottom:12}}>
      <CardHead label="Attendance — Last 14 Days"
        sub={`${thisW} check-ins this week`}
        right={
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            {anomalies.length>0&&<Chip color={T.amber} bg={T.amberD} brd={T.amberB}>{anomalies.length} anomaly</Chip>}
            <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:5,
              background:tUp?T.greenD:T.redD,border:`1px solid ${tUp?T.greenB:T.redB}`}}>
              <span style={{color:tUp?T.green:T.red}}>{tUp?I.up(9):I.down(9)}</span>
              <span className="mono" style={{fontSize:9.5,color:tUp?T.green:T.red,fontWeight:500}}>
                {Math.abs(trend)}% vs last week
              </span>
            </div>
          </div>
        }/>
      <div style={{padding:"14px 18px 0"}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:155,overflow:"visible"}}
          onMouseLeave={()=>setTip(null)}>
          <defs>
            <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.indigo} stopOpacity={.20}/>
              <stop offset="100%" stopColor={T.indigo} stopOpacity={.01}/>
            </linearGradient>
          </defs>
          {[.33,.66].map((v,i)=>(
            <line key={i} x1={PAD.l} y1={PAD.t+pH*(1-v)} x2={W-PAD.r} y2={PAD.t+pH*(1-v)}
              stroke="rgba(255,255,255,0.035)" strokeWidth={.5}/>
          ))}
          {pts.filter(p=>p.isWeekend).map((p,i)=>(
            <rect key={i} x={p.x-2} y={PAD.t} width={4} height={pH} fill="rgba(255,255,255,0.008)" rx={1}/>
          ))}
          <path d={areaD} fill="url(#ag)"/>
          {anomalies.map((p,i)=>(
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={5} fill={T.amberD} stroke={T.amber} strokeWidth={1}/>
              <line x1={p.x} y1={p.y+5} x2={p.x} y2={PAD.t+pH}
                stroke={T.amber} strokeWidth={.5} strokeDasharray="1.5 2" opacity={.35}/>
            </g>
          ))}
          <path d={pathD} fill="none" stroke={T.indigo} strokeWidth={1.7}
            strokeLinejoin="round" strokeLinecap="round" opacity={.9}/>
          {(()=>{const p=pts[pts.length-1];return<>
            <line x1={p.x} y1={PAD.t} x2={p.x} y2={PAD.t+pH}
              stroke={T.indigo} strokeWidth={.6} strokeDasharray="2 2" opacity={.3}/>
            <circle cx={p.x} cy={p.y} r={3} fill={T.indigo} stroke={T.s1} strokeWidth={1.5}/>
          </>})()}
          {pts.map((p,i)=>(
            <rect key={i} x={p.x-3.5} y={PAD.t} width={7} height={pH+4} fill="transparent"
              style={{cursor:"crosshair"}}
              onMouseEnter={()=>setTip({x:p.x,y:p.y,v:p.v,label:p.label,
                isA:anomalies.some(a=>a.date.getTime()===p.date.getTime())})}/>
          ))}
          {tip&&(()=>{const tx=Math.min(tip.x,W-13);return(
            <g style={{pointerEvents:"none"}}>
              <circle cx={tip.x} cy={tip.y} r={2.5} fill={tip.isA?T.amber:T.indigo} stroke={T.s1} strokeWidth={1.5}/>
              <rect x={tx-11} y={tip.y-18} width={22} height={13} rx={3} fill={T.s3} stroke={T.b2} strokeWidth={.5}/>
              <text x={tx} y={tip.y-9} textAnchor="middle" fill={T.t0} fontSize={5.5}
                fontFamily="monospace" fontWeight={600}>{tip.v}</text>
            </g>
          )})()}
          {pts.filter((_,i)=>i%2===0||i===pts.length-1).map((p,i)=>(
            <text key={i} x={p.x} y={H-3} textAnchor="middle" fontSize={5.5}
              fill={p.isToday?T.indigo:T.t4} fontFamily="system-ui" fontWeight={p.isToday?700:400}>
              {p.isToday?"Today":p.label}
            </text>
          ))}
        </svg>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderTop:`1px solid ${T.b0}`}}>
        {[
          {l:"This week",v:thisW,               s:"check-ins"},
          {l:"Daily avg", v:(thisW/7).toFixed(1),s:"per day"},
          {l:"Best day",  v:Math.max(...data.slice(7).map(d=>d.v)),s:bestDay.label},
        ].map((s,i)=>(
          <div key={i} style={{padding:"11px 16px",borderRight:i<2?`1px solid ${T.b0}`:"none"}}>
            <div style={{fontSize:9,fontWeight:700,color:T.t4,textTransform:"uppercase",
              letterSpacing:".1em",marginBottom:5}}>{s.l}</div>
            <div className="mono" style={{fontSize:21,fontWeight:600,color:T.t0,lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:9.5,color:T.t3,marginTop:2}}>{s.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SESSION HEALTH ────────────────────────────────────────────────────────────

function sHealth(booked,cap) {
  const r=cap>0?booked/cap:0;
  if(r>=.85) return {label:"Full",       color:T.green,  dim:T.greenD,  brd:T.greenB};
  if(r>=.55) return {label:"Healthy",    color:T.indigo, dim:T.indigoD, brd:T.indigoB};
  if(r>=.28) return {label:"Underbooked",color:T.amber,  dim:T.amberD,  brd:T.amberB};
  return          {label:"Critical",    color:T.red,    dim:T.redD,    brd:T.redB};
}

// ─── SESSION TIMELINE ─────────────────────────────────────────────────────────

function SessionTimeline({ sessions }) {
  const S=6, E=22, range=E-S;
  const toX = h=>`${((h-S)/range)*100}%`;
  const toW = m=>`${(m/60/range)*100}%`;
  const stCol={live:T.green, upcoming:T.indigo, done:T.t4};
  return (
    <div style={{padding:"10px 18px 16px",borderBottom:`1px solid ${T.b0}`}}>
      <div style={{fontSize:9,fontWeight:700,color:T.t4,textTransform:"uppercase",
        letterSpacing:".1em",marginBottom:10}}>Session Timeline</div>
      <div style={{position:"relative",height:24}}>
        <div style={{position:"absolute",top:"50%",left:0,right:0,height:1,
          background:T.b0,transform:"translateY(-50%)"}}/>
        {sessions.filter(s=>s.th!==null).map(s=>{
          const c=stCol[s.status], dur=parseInt(s.duration)||60;
          return (
            <div key={s.id} style={{position:"absolute",top:0,left:toX(s.th),width:toW(dur),
              height:"100%",background:`${c}12`,border:`1px solid ${c}30`,borderRadius:3,
              display:"flex",alignItems:"center",justifyContent:"center"}}
              title={`${s.name} · ${s.time} · ${s.booked}/${s.cap}`}>
              <span style={{fontSize:7.5,fontWeight:600,color:c,whiteSpace:"nowrap",
                overflow:"hidden",textOverflow:"ellipsis",padding:"0 3px"}}>{s.time}</span>
            </div>
          );
        })}
        {[6,9,12,15,18,21].map(h=>(
          <div key={h} style={{position:"absolute",bottom:-13,left:toX(h),transform:"translateX(-50%)"}}>
            <span className="mono" style={{fontSize:7.5,color:T.t4}}>{String(h).padStart(2,"0")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TODAY'S SESSIONS ─────────────────────────────────────────────────────────

function TodaysSessions({ sessions, toast }) {
  const [exp, setExp] = useState(null);
  const statLabel={live:"Live",upcoming:"Upcoming",done:"Done"};
  const statColor={live:T.green,upcoming:T.indigo,done:T.t3};
  const avgFill=Math.round(sessions.reduce((a,s)=>a+(s.cap>0?s.booked/s.cap:0),0)/Math.max(1,sessions.length)*100);

  return (
    <div className="fadeUp d2" style={{...CARD,boxShadow:SHADOW,marginBottom:12}}>
      <CardHead label="Today's Sessions"
        sub={`${sessions.length} scheduled · ${avgFill}% avg fill`}
        right={<Btn label="Add Session" color={T.t1} bg={T.s2} brd={T.b1}
          icon={<span style={{color:T.indigo,display:"inline-flex"}}>{I.plus(10)}</span>}
          onClick={()=>toast("Opening scheduler",T.indigo)}/>}/>
      <SessionTimeline sessions={sessions}/>
      <div style={{display:"grid",gridTemplateColumns:"56px 1fr 80px 100px 40px",
        padding:"7px 18px",gap:0,borderBottom:`1px solid ${T.b0}`}}>
        {["Time","Session","Fill","Health",""].map((h,i)=>(
          <div key={i} style={{fontSize:8.5,fontWeight:700,color:T.t4,textTransform:"uppercase",
            letterSpacing:".1em",textAlign:i>1?"center":"left"}}>{h}</div>
        ))}
      </div>
      {sessions.map((s,i)=>{
        const h=sHealth(s.booked,s.cap);
        const pct=s.cap>0?Math.round(s.booked/s.cap*100):0;
        const isE=exp===s.id, isDone=s.status==="done";
        return (
          <div key={s.id} style={{opacity:isDone?.5:1}}>
            <div className="hov" onClick={()=>setExp(isE?null:s.id)}
              style={{display:"grid",gridTemplateColumns:"56px 1fr 80px 100px 40px",
                padding:"11px 18px",gap:0,alignItems:"center",cursor:"pointer",
                borderBottom:i<sessions.length-1?`1px solid ${T.b0}`:"none",
                borderLeft:`2px solid ${isDone?T.t4:h.color}`}}>
              <div className="mono" style={{fontSize:10,color:isDone?T.t4:T.t2}}>{s.time}</div>
              <div style={{minWidth:0,paddingRight:8}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  {s.status==="live"&&<Dot color={T.green} pulse/>}
                  <span style={{fontSize:12.5,fontWeight:600,color:isDone?T.t2:T.t0,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                  <Chip color={statColor[s.status]} bg={`${statColor[s.status]}0f`}
                    brd={`${statColor[s.status]}22`}>{statLabel[s.status]}</Chip>
                </div>
                {s.coach&&<div style={{fontSize:9.5,color:T.t3}}>{s.coach} · {s.duration}</div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:"80%",height:2.5,background:T.b0,borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:isDone?T.t4:h.color,borderRadius:99}}/>
                </div>
                <span className="mono" style={{fontSize:8.5,color:T.t3}}>{s.booked}/{s.cap}</span>
              </div>
              <div style={{display:"flex",justifyContent:"center"}}>
                <Chip color={h.color} bg={h.dim} brd={h.brd}>{h.label}</Chip>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",color:T.t4,
                transition:"transform .18s",transform:isE?"rotate(90deg)":"none"}}>
                {I.chevR(10)}
              </div>
            </div>
            {isE&&(
              <div style={{padding:"11px 20px 13px",borderBottom:`1px solid ${T.b0}`,
                background:"rgba(255,255,255,0.01)"}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <Btn label="Message Attendees" color={T.t1} bg={T.s2} brd={T.b1}
                    icon={<span style={{color:T.indigo,display:"inline-flex"}}>{I.msg(10)}</span>}
                    onClick={()=>toast(`Messaging ${s.booked} attendees`,T.indigo)}/>
                  {!isDone&&h.label!=="Full"&&(
                    <Btn label="Promote Class" color={T.amber} bg={T.amberD} brd={T.amberB}
                      icon={I.speak(10)} onClick={()=>toast(`Promoting ${s.name}`,T.amber)}/>
                  )}
                  <Btn label="Check-in Scanner" color={T.green} bg={T.greenD} brd={T.greenB}
                    icon={I.qr(10)} onClick={()=>toast("QR scanner ready",T.green)}/>
                </div>
                {s.notes&&<div style={{marginTop:9,fontSize:10.5,color:T.t3,fontStyle:"italic"}}>{s.notes}</div>}
              </div>
            )}
          </div>
        );
      })}
      <div style={{padding:"9px 18px",display:"flex",gap:18,borderTop:`1px solid ${T.b0}`,
        background:"rgba(255,255,255,0.008)"}}>
        {[
          {l:"Booked",   v:sessions.reduce((a,s)=>a+s.booked,0)},
          {l:"Capacity", v:sessions.reduce((a,s)=>a+s.cap,0)},
          {l:"Done",     v:`${sessions.filter(s=>s.status==="done").length}/${sessions.length}`},
        ].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:5,alignItems:"baseline"}}>
            <span className="mono" style={{fontSize:15,fontWeight:600,color:T.t1}}>{s.v}</span>
            <span style={{fontSize:8.5,fontWeight:700,color:T.t4,textTransform:"uppercase",
              letterSpacing:".09em"}}>{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ACTIVITY FEED ────────────────────────────────────────────────────────────

function ActivityFeed({ toast }) {
  return (
    <div className="fadeUp d4" style={{...CARD,boxShadow:SHADOW}}>
      <CardHead label="Recent Activity" sub="Today's events"/>
      <div className="scr" style={{maxHeight:280,overflowY:"auto"}}>
        {MOCK_ACTIVITY.map((ev,i)=>(
          <div key={i} className="hov" style={{display:"flex",alignItems:"center",gap:10,
            padding:"9px 16px",borderBottom:i<MOCK_ACTIVITY.length-1?`1px solid ${T.b0}`:"none"}}>
            <div style={{position:"relative",flexShrink:0}}>
              {/* Avatar — neutral. Only the dot carries color. */}
              <Avatar name={ev.name} size={26} accent={T.t3}/>
              <div style={{position:"absolute",bottom:-1,right:-1,width:7,height:7,
                borderRadius:"50%",background:ev.dot,border:`1.5px solid ${T.s1}`}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <span style={{fontSize:11.5,fontWeight:600,color:T.t1}}>{ev.name}</span>
              <span style={{fontSize:10.5,color:T.t3}}> · {ev.detail}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
              {ev.action&&(
                <button className="btn" onClick={()=>toast(`${ev.action}: ${ev.name}`,ev.dot)}
                  style={{fontSize:9,fontWeight:700,color:ev.dot,background:`${ev.dot}0f`,
                    border:`1px solid ${ev.dot}28`,borderRadius:4,padding:"3px 8px"}}>
                  {ev.action}
                </button>
              )}
              <span className="mono" style={{fontSize:9,color:T.t4}}>{ev.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WEEKLY PERFORMANCE ───────────────────────────────────────────────────────

function WeeklyPerformance({ checkIns, sessions, allMemberships, now }) {
  const thisStart=new Date(now); thisStart.setDate(thisStart.getDate()-7);
  const lastStart=new Date(now); lastStart.setDate(lastStart.getDate()-14);
  const ciThis=checkIns.filter(c=>new Date(c.check_in_date)>=thisStart).length;
  const ciLast=checkIns.filter(c=>{const d=new Date(c.check_in_date);return d>=lastStart&&d<thisStart;}).length;
  const ciChange=ciLast>0?Math.round(((ciThis-ciLast)/ciLast)*100):null;
  const fillRate=(()=>{const s=sessions.filter(s=>s.cap>0);return s.length?Math.round(s.reduce((a,s)=>a+s.booked/s.cap,0)/s.length*100):0;})();
  const atRisk=allMemberships.filter(m=>{
    const last=checkIns.filter(c=>c.user_id===m.user_id)
      .sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date))[0];
    return !last||diffDays(now,new Date(last.check_in_date))>=14;
  }).length;

  const rows=[
    {l:"Attendance",  v:ciThis,       change:ciChange, up:(ciChange??0)>=0, sub:"check-ins this week",  vc:null},
    {l:"Fill Rate",   v:`${fillRate}%`,change:null,     up:fillRate>=60,     sub:`${sessions.reduce((a,s)=>a+s.booked,0)}/${sessions.reduce((a,s)=>a+s.cap,0)} spots`,vc:null},
    {l:"At Risk",     v:atRisk,        change:null,     up:atRisk===0,       sub:"inactive 14+ days",   vc:atRisk>0?T.red:T.green},
    {l:"Revenue MTD", v:"£8,240",      change:8,        up:true,             sub:"vs £7,630 last month",vc:null},
  ];

  return (
    <div className="fadeUp" style={{...CARD,boxShadow:SHADOW,marginBottom:12}}>
      <CardHead label="Weekly Performance"/>
      {rows.map((m,i)=>(
        <div key={i} style={{padding:"11px 16px",
          borderBottom:i<rows.length-1?`1px solid ${T.b0}`:"none",
          display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div>
            {/* Label — 9px uppercase muted — exactly matches Overview card labels */}
            <div style={{fontSize:9,fontWeight:700,color:T.t3,textTransform:"uppercase",
              letterSpacing:".11em",marginBottom:5}}>{m.l}</div>
            {/* Number — large mono white — matches Overview's hero stat style */}
            <div className="mono" style={{fontSize:22,fontWeight:600,lineHeight:1,
              letterSpacing:"-.03em",color:m.vc||T.t0}}>{m.v}</div>
            <div style={{fontSize:9.5,color:T.t3,marginTop:3}}>{m.sub}</div>
          </div>
          {m.change!==null&&(
            <div style={{display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:5,
              background:m.up?T.greenD:T.redD,border:`1px solid ${m.up?T.greenB:T.redB}`}}>
              <span style={{color:m.up?T.green:T.red}}>{m.up?I.up(9):I.down(9)}</span>
              <span className="mono" style={{fontSize:10,color:m.up?T.green:T.red,fontWeight:500}}>
                {Math.abs(m.change)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── CLIENT RISK FEED ─────────────────────────────────────────────────────────

function ClientRiskFeed({ allMemberships, checkIns, now, toast }) {
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const clients = useMemo(()=>allMemberships.map(m=>{
    const mCI=checkIns.filter(c=>c.user_id===m.user_id)
      .sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
    const last=mCI[0];
    const days=last?diffDays(now,new Date(last.check_in_date)):999;
    const ci30=mCI.filter(c=>diffDays(now,new Date(c.check_in_date))<=30).length;
    let level,reason;
    if(days===999){level="critical";reason="Never checked in";}
    else if(days>=21){level="critical";reason=`${days} days inactive`;}
    else if(days>=14){level="high";reason=`${days} days inactive`;}
    else if(days>=7){level="med";reason=`${days} days since last visit`;}
    else return null;
    return {id:m.user_id,name:m.user_name,days,ci30,level,reason};
  }).filter(Boolean).sort((a,b)=>b.days-a.days),[allMemberships,checkIns,now]);

  const lvlC={critical:T.red, high:T.amber, med:T.indigo};
  const cnt={all:clients.length,
    critical:clients.filter(c=>c.level==="critical").length,
    high:clients.filter(c=>c.level==="high").length,
    med:clients.filter(c=>c.level==="med").length};
  const filtered=filter==="all"?clients:clients.filter(c=>c.level===filter);
  const shown=showAll?filtered:filtered.slice(0,4);

  if(!clients.length) return (
    <div className="fadeUp d1" style={{...CARD,boxShadow:SHADOW}}>
      <CardHead label="Client Risk Feed"/>
      <div style={{padding:"22px 16px",textAlign:"center"}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:T.greenD,border:`1px solid ${T.greenB}`,
          display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",color:T.green}}>
          {I.check(13)}
        </div>
        <div style={{fontSize:11.5,fontWeight:600,color:T.t1,marginBottom:3}}>All clients active</div>
        <div style={{fontSize:10,color:T.t3}}>No one inactive for 7+ days</div>
      </div>
    </div>
  );

  return (
    <div className="fadeUp d1" style={{...CARD,boxShadow:SHADOW,borderTop:`2px solid ${T.red}`}}>
      <CardHead label="Client Risk Feed"
        sub={`${clients.length} client${clients.length>1?"s":""} need attention`}
        right={<Chip color={T.red} bg={T.redD} brd={T.redB}>{cnt.critical} critical</Chip>}/>
      {/* Filter tabs — ghost, indigo for active state */}
      <div style={{display:"flex",gap:1,padding:"7px 12px",borderBottom:`1px solid ${T.b0}`}}>
        {[{k:"all",l:`All (${cnt.all})`},{k:"critical",l:`Critical (${cnt.critical})`},
          {k:"high",l:`High (${cnt.high})`},{k:"med",l:`Med (${cnt.med})`}].map(f=>(
          <button key={f.k} className="btn" onClick={()=>setFilter(f.k)} style={{
            fontSize:10,fontWeight:filter===f.k?700:500,
            color:filter===f.k?T.t0:T.t3,
            background:filter===f.k?"rgba(255,255,255,0.06)":"transparent",
            border:"none",borderRadius:5,padding:"5px 9px"}}>
            {f.l}
          </button>
        ))}
      </div>
      {shown.map((c,i)=>(
        <div key={c.id} style={{borderBottom:i<shown.length-1?`1px solid ${T.b0}`:"none",
          // Left border = risk level. Matches Overview "Action Items" treatment.
          borderLeft:`2px solid ${lvlC[c.level]}`,
          padding:"10px 14px",display:"flex",alignItems:"flex-start",gap:9}}>
          {/* Neutral avatar — no colored tint */}
          <Avatar name={c.name} size={28} accent={T.t3}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11.5,fontWeight:600,color:T.t0,overflow:"hidden",
              textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{c.name}</div>
            {/* Risk text = colored, bg = neutral */}
            <div style={{fontSize:10,color:lvlC[c.level],lineHeight:1.4}}>{c.reason}</div>
            <div style={{fontSize:9.5,color:T.t4,marginTop:2}}>{c.ci30} visit{c.ci30!==1?"s":""} in 30 days</div>
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            <button className="btn" onClick={()=>toast(`Messaging ${c.name}`,T.amber)}
              style={{fontSize:9,fontWeight:600,color:T.t1,background:T.s2,
                border:`1px solid ${T.b1}`,borderRadius:4,padding:"4px 8px"}}>
              {I.msg(9)} Msg
            </button>
            <button className="btn" onClick={()=>toast(`Booking for ${c.name}`,T.indigo)}
              style={{fontSize:9,fontWeight:600,color:T.t1,background:T.s2,
                border:`1px solid ${T.b1}`,borderRadius:4,padding:"4px 8px"}}>
              {I.cal(9)} Book
            </button>
          </div>
        </div>
      ))}
      {filtered.length>4&&(
        <div style={{padding:"8px 16px",borderTop:`1px solid ${T.b0}`}}>
          <button className="btn" onClick={()=>setShowAll(p=>!p)}
            style={{fontSize:10,fontWeight:600,color:T.indigo,background:"transparent",
              width:"100%",padding:"2px 0"}}>
            {showAll?`Show less`:`Show ${filtered.length-4} more at-risk clients`}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function TabCoachToday({ allMemberships, checkIns, myClasses, currentUser, now }) {
  const {toasts,toast} = useToast();
  const sessions   = useMemo(()=>deriveSessions(myClasses,now),[myClasses,now]);
  const priorities = useMemo(()=>derivePriorities({allMemberships,checkIns,sessions,now}),[allMemberships,checkIns,sessions,now]);

  return (
    <div className="mcc scr" style={{background:T.bg,minHeight:"100vh",
      padding:"24px 24px 60px",overflowX:"hidden",position:"relative"}}>
      <ToastStack toasts={toasts}/>
      <CommandHeader currentUser={currentUser} now={now} sessions={sessions} priorities={priorities}/>
      <TodaysPriorities priorities={priorities} toast={toast}/>
      <QuickStrip toast={toast}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14,alignItems:"start"}}>
        <div>
          <AttendanceChart checkIns={checkIns} now={now}/>
          <TodaysSessions sessions={sessions} toast={toast}/>
          <ActivityFeed toast={toast}/>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12,position:"sticky",top:0}}>
          <WeeklyPerformance checkIns={checkIns} sessions={sessions} allMemberships={allMemberships} now={now}/>
          <ClientRiskFeed allMemberships={allMemberships} checkIns={checkIns} now={now} toast={toast}/>
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
