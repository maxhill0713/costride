import { useState, useMemo, useCallback, useEffect } from "react";
import {
  AlertTriangle, TrendingDown, TrendingUp, Users, UserPlus,
  Flame, Send, X, ChevronRight, ChevronDown, ChevronLeft, Search,
  Check, Bell, Activity, Star, Tag, MoreHorizontal,
  Plus, ArrowUpRight, DollarSign, Zap,
} from "lucide-react";

/* ══ EXACT TabEngagement tokens ══ */
const T = {
  bg:         "#08090e",
  surface:    "#0f1016",
  surfaceEl:  "#14151d",
  surfaceHov: "#191a24",
  border:     "#1e2030",
  borderEl:   "#262840",
  divider:    "#141520",
  t1:"#ededf0", t2:"#9191a4", t3:"#525266", t4:"#2e2e42",
  accent:     "#4c6ef5",
  accentDim:  "#1a2048",
  accentBrd:  "#263070",
  red:        "#c0392b",
  redDim:     "#160f0d",
  redBrd:     "#2e1614",
  amber:      "#b07b30",
  amberDim:   "#161008",
  amberBrd:   "#2a2010",
  green:      "#2d8a62",
  greenDim:   "#091912",
  greenBrd:   "#132e20",
  r:"8px", rsm:"6px",
  sh:"0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025)",
};

const MEMBERS = [
  { id:"1", name:"Marcus Webb",    ini:"MW", ci:0, plan:"Premium", mv:120, ds:22,  v30:0,  pv:8,  vt:47,  str:0,  ch:84, jd:180, rc:38, reasons:["No visits in 22 days","Was averaging 8/mo → 0","Missed last 3 booked classes"],    act:"Send 'We miss you'",   st:"At risk",      sd:"No visits in 22d · Down from 8/month", seg:"atRisk"  },
  { id:"2", name:"Priya Sharma",   ini:"PS", ci:1, plan:"Monthly", mv:60,  ds:16,  v30:1,  pv:4,  vt:31,  str:0,  ch:71, jd:95,  rc:44, reasons:["16 days since last visit","Frequency down 75%","Usually comes Tues/Thurs"],       act:"Friendly check-in",    st:"Dropping off", sd:"Frequency −75% · Pattern broken",       seg:"atRisk"  },
  { id:"3", name:"Tyler Rhodes",   ini:"TR", ci:2, plan:"Monthly", mv:60,  ds:9,   v30:1,  pv:5,  vt:12,  str:0,  ch:55, jd:28,  rc:52, reasons:["New member not building habit","Only 1 visit this month","Week 4 — critical"],  act:"Habit-building nudge", st:"New",          sd:"28 days in · 1 visit this month",       seg:"new"     },
  { id:"4", name:"Chloe Nakamura", ini:"CN", ci:3, plan:"Annual",  mv:90,  ds:1,   v30:14, pv:11, vt:203, str:18, ch:4,  jd:420, rc:96, reasons:[],                                                                                  act:"Challenge invite",     st:"Consistent",   sd:"18-day streak · Up 27% this month",     seg:"active"  },
  { id:"5", name:"Devon Osei",     ini:"DO", ci:4, plan:"Monthly", mv:60,  ds:19,  v30:0,  pv:3,  vt:8,   str:0,  ch:78, jd:45,  rc:35, reasons:["19 days absent","Early-stage member at risk","Visited 3× then stopped"],          act:"Personal outreach",    st:"At risk",      sd:"19 days absent · Joined & disappeared", seg:"atRisk"  },
  { id:"6", name:"Anya Petrov",    ini:"AP", ci:5, plan:"Premium", mv:120, ds:0,   v30:9,  pv:7,  vt:88,  str:7,  ch:6,  jd:210, rc:94, reasons:[],                                                                                  act:"Referral ask",         st:"Engaged",      sd:"7-day streak · Consistent performer",   seg:"active"  },
  { id:"7", name:"Jamie Collins",  ini:"JC", ci:6, plan:"Monthly", mv:60,  ds:5,   v30:2,  pv:4,  vt:19,  str:0,  ch:42, jd:58,  rc:58, reasons:["Frequency halved this month","Skipped usual Friday session"],                     act:"Motivate",             st:"Dropping off", sd:"Frequency halved · Below target",        seg:"inactive"},
  { id:"8", name:"Sam Rivera",     ini:"SR", ci:7, plan:"Monthly", mv:60,  ds:999, v30:0,  pv:0,  vt:1,   str:0,  ch:91, jd:6,   rc:30, reasons:["Joined 6 days ago, 1 visit only","Critical first-week window","Has not returned"], act:"Week-1 welcome",       st:"New",          sd:"6 days in · First week habit window",   seg:"new"     },
];

const AVG = ["#252a45","#1c2f28","#2e2540","#352e18","#2e1818","#173040","#2e2540","#302418"];

function useCountUp(target, delay=0) {
  const [v,setV]=useState(0);
  useEffect(()=>{
    const t=setTimeout(()=>{
      let s=null;
      const step=ts=>{if(!s)s=ts;const p=Math.min((ts-s)/900,1);const e=1-Math.pow(1-p,3);setV(Math.round(e*target));if(p<1)requestAnimationFrame(step);};
      requestAnimationFrame(step);
    },delay);
    return()=>clearTimeout(t);
  },[target,delay]);
  return v;
}

const Av=({m,size=30})=>(
  <div style={{width:size,height:size,borderRadius:T.rsm,background:AVG[m.ci%8],border:`1px solid ${T.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.31,fontWeight:700,color:T.t2,letterSpacing:"0.02em",fontFamily:"monospace"}}>{m.ini}</div>
);

const Bar=({pct,color,h=3})=>(
  <div style={{height:h,borderRadius:99,background:T.divider,flex:1}}>
    <div style={{height:"100%",width:`${pct}%`,borderRadius:99,background:color,opacity:.75}}/>
  </div>
);

function GBtn({children,onClick,style={},danger}){
  const [hov,sH]=useState(false);
  return <button onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} onClick={e=>{e.stopPropagation();onClick?.();}}
    style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:T.rsm,fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"1px solid",background:danger&&hov?T.redDim:hov?T.surfaceHov:T.surfaceEl,borderColor:danger&&hov?T.redBrd:hov?T.borderEl:T.border,color:danger&&hov?T.red:T.t2,transition:"all .12s",...style}}>{children}</button>;
}

function PBtn({children,onClick,style={}}){
  const [hov,sH]=useState(false);
  return <button onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} onClick={e=>{e.stopPropagation();onClick?.();}}
    style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:T.rsm,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",border:"1px solid transparent",background:T.accent,color:"#fff",opacity:hov?.88:1,transition:"opacity .12s",...style}}>{children}</button>;
}

function ABtn({children,onClick,style={}}){
  const [hov,sH]=useState(false);
  return <button onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} onClick={e=>{e.stopPropagation();onClick?.();}}
    style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:T.rsm,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",background:hov?T.accent:T.accentDim,border:`1px solid ${hov?T.accent:T.accentBrd}`,color:hov?"#fff":T.accent,transition:"all .12s",...style}}>{children}</button>;
}

/* ── Metrics bar — mirrors TabEngagement exactly ── */
function MetricsBar({ members }) {
  const ar = members.filter(m=>m.ch>=60);
  const activeN = members.filter(m=>m.ds<7).length;
  const arVal = ar.reduce((s,m)=>s+m.mv,0);
  const engRate = Math.round((activeN/members.length)*100);

  const wkColor = ar.length >= 3 ? T.red : ar.length >= 1 ? T.amber : T.green;

  const metrics = [
    { Icon: Users,         label: "Total Members",   val: String(members.length), sub: "enrolled across all plans",         dot: T.t4 },
    { Icon: Activity,      label: "Active (7 days)", val: String(activeN),        sub: `${engRate}% of total membership`,   dot: activeN > 0 ? T.green : T.t4 },
    { Icon: AlertTriangle, label: "At Risk",         val: String(ar.length),      sub: "60%+ churn probability",            dot: ar.length > 0 ? T.red : T.green },
    { Icon: DollarSign,    label: "Revenue at Risk", val: `$${arVal}`,            sub: "monthly recurring at risk",         dot: arVal > 0 ? T.red : T.green },
  ];

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderBottom:`1px solid ${T.border}`,background:T.surface}}>
      {metrics.map((m,i) => (
        <div key={i} style={{padding:"16px 20px",borderRight:i<3?`1px solid ${T.border}`:"none",transition:"background .12s",cursor:"default"}}
          onMouseEnter={e=>e.currentTarget.style.background=T.surfaceEl}
          onMouseLeave={e=>e.currentTarget.style.background=T.surface}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <div style={{width:26,height:26,borderRadius:T.rsm,background:T.surfaceEl,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <m.Icon size={11} color={T.t3}/>
            </div>
            <span style={{fontSize:10,fontWeight:600,color:T.t3,textTransform:"uppercase",letterSpacing:".1em"}}>{m.label}</span>
            <div style={{marginLeft:"auto"}}><div style={{width:5,height:5,borderRadius:"50%",background:m.dot}}/></div>
          </div>
          <div style={{fontSize:28,fontWeight:700,color:T.t1,letterSpacing:"-0.04em",lineHeight:1,marginBottom:5,fontVariantNumeric:"tabular-nums"}}>{m.val}</div>
          <div style={{fontSize:10,color:T.t3,lineHeight:1.5}}>{m.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Segment pills — top of feed ── */
function Segs({ members, active, onFilter, onBulk }) {
  const segs = useMemo(()=>[
    { id:"atRisk",   Icon:AlertTriangle, label:"Need attention", count:members.filter(m=>m.ch>=60).length,           action:"Message all", urgent:true },
    { id:"dropping", Icon:TrendingDown,  label:"Dropping off",   count:members.filter(m=>m.pv>0&&m.v30<=m.pv*.5).length, action:"Nudge all" },
    { id:"new",      Icon:UserPlus,      label:"New members",    count:members.filter(m=>m.jd<=14).length,           action:"Welcome" },
    { id:"active",   Icon:Flame,         label:"On streak",      count:members.filter(m=>m.str>=5).length,           action:"Challenge" },
  ],[members]);

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:18}}>
      {segs.map(s => {
        const on = active===s.id;
        return (
          <div key={s.id} onClick={()=>onFilter(on?"all":s.id)}
            onMouseEnter={e=>{if(!on)e.currentTarget.style.background=T.surfaceEl;}}
            onMouseLeave={e=>{if(!on)e.currentTarget.style.background=T.surface;}}
            style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:T.r,background:on?T.accentDim:T.surface,border:`1px solid ${on?T.accentBrd:T.border}`,boxShadow:T.sh,cursor:"pointer",transition:"all .12s"}}>
            <div style={{width:30,height:30,borderRadius:T.rsm,background:on?T.accentDim:T.surfaceEl,border:`1px solid ${on?T.accentBrd:T.border}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <s.Icon size={13} color={on?T.accent:T.t3}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{fontSize:18,fontWeight:700,color:s.urgent&&s.count>0?T.red:on?T.accent:T.t1,lineHeight:1.1,fontVariantNumeric:"tabular-nums"}}>{s.count}</div>
                {s.urgent&&s.count>0&&<span style={{width:5,height:5,borderRadius:"50%",background:T.red,display:"inline-block",animation:"pulse 2s ease-in-out infinite"}}/>}
              </div>
              <div style={{fontSize:10,color:on?T.accent:T.t3,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
            </div>
            {s.count>0&&(
              <button onClick={e=>{e.stopPropagation();onBulk(s.id);}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.accent;e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color="#fff";}}
                onMouseLeave={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.borderColor=T.accentBrd;e.currentTarget.style.color=T.accent;}}
                style={{padding:"3px 8px",borderRadius:T.rsm,background:T.accentDim,border:`1px solid ${T.accentBrd}`,color:T.accent,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,transition:"all .12s"}}>
                {s.action}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Priority churn card ── */
function ChurnCard({ m, onMsg, onSel }) {
  const [hov,sH] = useState(false);
  const bc = m.ch>=70?T.red:m.ch>=40?T.amber:T.t3;
  return (
    <div onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} onClick={()=>onSel(m)}
      style={{padding:"14px 16px",background:hov?T.surfaceHov:T.surface,border:`1px solid ${T.border}`,borderLeft:`2px solid ${bc}`,borderRadius:T.r,boxShadow:T.sh,cursor:"pointer",transition:"background .12s"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Av m={m} size={32}/>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:T.t1}}>{m.name}</div>
            <div style={{fontSize:10,color:T.t3,marginTop:1}}>{m.ds===999?"Never visited":`Last seen ${m.ds}d ago`}</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:22,fontWeight:700,color:bc,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{m.ch}%</div>
          <div style={{fontSize:9,color:T.t3,marginTop:2}}>churn risk</div>
        </div>
      </div>
      <div style={{marginBottom:10}}><Bar pct={m.ch} color={bc} h={2}/></div>
      <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:12}}>
        {m.reasons.slice(0,2).map((r,i)=>(
          <div key={i} style={{display:"flex",gap:7}}>
            <span style={{color:T.t4,fontSize:10,marginTop:1,flexShrink:0}}>—</span>
            <span style={{fontSize:11,color:T.t3,lineHeight:1.5}}>{r}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10,borderTop:`1px solid ${T.divider}`}}>
        <span style={{fontSize:11,color:T.t3}}><span style={{color:T.t2,fontWeight:500}}>${m.mv}</span>/mo · {m.rc}% return rate</span>
        <button onClick={e=>{e.stopPropagation();onMsg(m);}}
          onMouseEnter={e=>{e.currentTarget.style.background=T.accent;e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.borderColor=T.accentBrd;e.currentTarget.style.color=T.accent;}}
          style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:T.rsm,background:T.accentDim,border:`1px solid ${T.accentBrd}`,color:T.accent,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .12s",whiteSpace:"nowrap"}}>
          <Send size={9}/> {m.act}
        </button>
      </div>
    </div>
  );
}

/* ── Table ── */
function Table({ members, filter, search, sort, setSort, selRows, toggleRow, toggleAll, prev, setPrev, onMsg }) {
  const filtered = useMemo(()=>{
    let l = members;
    if(filter==="atRisk")   l=l.filter(m=>m.ch>=60);
    if(filter==="dropping") l=l.filter(m=>m.pv>0&&m.v30<=m.pv*.5);
    if(filter==="new")      l=l.filter(m=>m.jd<=14);
    if(filter==="active")   l=l.filter(m=>m.str>=5);
    if(filter==="inactive") l=l.filter(m=>m.ds>=14);
    if(search) l=l.filter(m=>m.name.toLowerCase().includes(search.toLowerCase()));
    return l;
  },[members,filter,search]);

  const sorted = useMemo(()=>[...filtered].sort((a,b)=>{
    if(sort==="churnDesc") return b.ch-a.ch;
    if(sort==="lastVisit") return a.ds-b.ds;
    if(sort==="value")     return b.mv-a.mv;
    if(sort==="name")      return a.name.localeCompare(b.name);
    return b.ch-a.ch;
  }),[filtered,sort]);

  const COLS = "28px 1.8fr 1fr 70px 80px 80px 80px 150px";
  const hdrs = [{label:"MEMBER",k:"name"},{label:"STATUS",k:null},{label:"CHURN",k:"churnDesc"},{label:"LAST SEEN",k:"lastVisit"},{label:"TREND",k:null},{label:"VALUE",k:"value"},{label:"ACTION",k:null}];

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:COLS,gap:8,padding:"7px 16px",borderBottom:`1px solid ${T.border}`,background:T.bg}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
          <input type="checkbox" checked={sorted.length>0&&selRows.size===sorted.length} onChange={()=>toggleAll(sorted)} style={{width:12,height:12,accentColor:T.accent,cursor:"pointer"}}/>
        </div>
        {hdrs.map((c,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
            <span onClick={()=>c.k&&setSort(c.k)} style={{fontSize:9,fontWeight:600,color:sort===c.k?T.accent:T.t4,textTransform:"uppercase",letterSpacing:".1em",cursor:c.k?"pointer":"default"}}>{c.label}</span>
            {c.k&&<ChevronDown size={7} color={sort===c.k?T.accent:T.t4}/>}
          </div>
        ))}
      </div>
      {sorted.length===0
        ? (
          <div style={{padding:"52px 20px",textAlign:"center"}}>
            <Users size={32} color={T.t4} style={{margin:"0 auto 12px"}}/>
            <div style={{fontSize:13,color:T.t2,fontWeight:500,marginBottom:4}}>No members match</div>
            <div style={{fontSize:11,color:T.t3}}>Try a different filter or search term</div>
          </div>
        )
        : sorted.map((m,idx)=>{
          const isSel=selRows.has(m.id), isPrev=prev?.id===m.id;
          const trend=m.pv>0?Math.round(((m.v30-m.pv)/m.pv)*100):0;
          const bc=m.ch>=70?T.red:m.ch>=40?T.amber:T.t3;
          return (
            <div key={m.id} onClick={()=>setPrev(isPrev?null:m)}
              onMouseEnter={e=>{if(!isPrev&&!isSel)e.currentTarget.style.background=T.surfaceHov;}}
              onMouseLeave={e=>{e.currentTarget.style.background=isPrev?T.surfaceEl:isSel?`${T.accent}08`:"transparent";}}
              style={{display:"grid",gridTemplateColumns:COLS,gap:8,padding:"10px 16px",borderBottom:idx<sorted.length-1?`1px solid ${T.divider}`:"none",borderLeft:isPrev?`2px solid ${T.accent}`:"2px solid transparent",background:isPrev?T.surfaceEl:isSel?`${T.accent}08`:"transparent",cursor:"pointer",transition:"background .1s",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{e.stopPropagation();toggleRow(m.id);}}>
                <input type="checkbox" checked={isSel} onChange={()=>toggleRow(m.id)} style={{width:12,height:12,accentColor:T.accent,cursor:"pointer"}}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <Av m={m} size={28}/>
                  {m.str>=5&&<div style={{position:"absolute",top:-2,right:-2,width:10,height:10,borderRadius:"50%",background:T.surfaceEl,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Flame size={6} color={T.t3}/></div>}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:isPrev?T.accent:T.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                  <div style={{fontSize:10,color:T.t3}}>{m.plan} · {m.vt} visits</div>
                </div>
              </div>
              <div>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:500,background:T.surfaceEl,color:m.st==="At risk"?T.red:T.t2,border:`1px solid ${T.border}`}}>
                  {m.st==="At risk"&&<span style={{width:4,height:4,borderRadius:"50%",background:T.red,display:"inline-block",animation:"pulse 2s ease-in-out infinite"}}/>}{m.st}
                </span>
                <div style={{fontSize:10,color:T.t3,marginTop:3,lineHeight:1.4}}>{m.sd}</div>
              </div>
              <div>
                <span style={{fontSize:13,fontWeight:600,color:m.ch>=70?T.red:m.ch>=40?T.amber:T.t2,fontVariantNumeric:"tabular-nums"}}>{m.ch}%</span>
                <div style={{marginTop:5}}><Bar pct={m.ch} color={bc} h={2}/></div>
              </div>
              <div><span style={{fontSize:12,fontWeight:500,color:m.ds>=14?T.red:m.ds<=1?T.green:T.t1}}>{m.ds===999?"Never":m.ds===0?"Today":`${m.ds}d ago`}</span></div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                {trend>10?<><TrendingUp size={11} color={T.green}/><span style={{fontSize:10,color:T.green}}>+{trend}%</span></>
                 :trend<-10?<><TrendingDown size={11} color={T.red}/><span style={{fontSize:10,color:T.red}}>{trend}%</span></>
                 :<span style={{fontSize:10,color:T.t3}}>—</span>}
              </div>
              <div><div style={{fontSize:12,fontWeight:600,color:T.t1}}>${m.mv}</div><div style={{fontSize:9,color:T.t3}}>/month</div></div>
              <div onClick={e=>e.stopPropagation()}>
                <button onClick={()=>onMsg(m)}
                  onMouseEnter={e=>{e.currentTarget.style.background=T.accent;e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=T.accentDim;e.currentTarget.style.borderColor=T.accentBrd;e.currentTarget.style.color=T.accent;}}
                  style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:T.rsm,background:T.accentDim,border:`1px solid ${T.accentBrd}`,color:T.accent,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",transition:"all .12s"}}>
                  {m.act} <ChevronRight size={7}/>
                </button>
                <div style={{fontSize:9,color:T.t3,marginTop:3}}>~{m.rc}% success</div>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

function BulkBar({ selRows, members, onClear, onBulk }) {
  if(selRows.size===0) return null;
  const sel = members.filter(m=>selRows.has(m.id));
  const tv = sel.reduce((s,m)=>s+m.mv,0);
  return (
    <div style={{borderTop:`1px solid ${T.borderEl}`,background:T.surfaceEl}}>
      <div style={{padding:"7px 16px",borderBottom:`1px solid ${T.divider}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:11,color:T.t2,fontWeight:500}}>{selRows.size} selected <span style={{color:T.t3,fontWeight:400}}>· ${tv}/mo combined</span></span>
        <button onClick={onClear} style={{fontSize:11,color:T.t3,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
      </div>
      <div style={{padding:"9px 16px",display:"flex",alignItems:"center",gap:6}}>
        <PBtn onClick={()=>onBulk(sel)}><Send size={11}/> Message {selRows.size}</PBtn>
        <ABtn><Tag size={11}/> Tag</ABtn>
        <ABtn><Star size={11}/> Add to list</ABtn>
        <div style={{flex:1}}/>
        <span style={{fontSize:11,color:T.t3}}>{sel.filter(m=>m.ch>=60).length} at risk</span>
      </div>
    </div>
  );
}

/* ── Right panel ── */
function RightPanel({ members, onFilter }) {
  const hr = members.filter(m=>m.ch>=70);
  const nq = members.filter(m=>m.jd<=10&&m.vt<2);
  const tv = hr.reduce((s,m)=>s+m.mv,0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* Churn alert */}
      {hr.length>0&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderLeft:`2px solid ${T.red}`,borderRadius:T.r,boxShadow:T.sh,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:T.red,display:"inline-block",animation:"pulse 2s ease-in-out infinite"}}/>
            <span style={{fontSize:12,fontWeight:600,color:T.t1}}>{hr.length} likely to churn</span>
          </div>
          <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
            {hr.slice(0,3).map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 7px 2px 3px",borderRadius:20,background:T.surfaceEl,border:`1px solid ${T.border}`}}>
                <Av m={m} size={14}/><span style={{fontSize:10,color:T.t2}}>{m.name.split(" ")[0]}</span>
              </div>
            ))}
            {hr.length>3&&<span style={{fontSize:10,color:T.t3,alignSelf:"center"}}>+{hr.length-3}</span>}
          </div>
          <div style={{fontSize:11,color:T.t3,marginBottom:12}}><span style={{color:T.red,fontWeight:600}}>${tv}</span>/mo at risk</div>
          <div style={{display:"flex",gap:6}}>
            <PBtn style={{flex:1,justifyContent:"center"}} onClick={()=>onFilter("atRisk")}><Send size={9}/> Message all</PBtn>
            <GBtn onClick={()=>onFilter("atRisk")}>View</GBtn>
          </div>
        </div>
      )}

      {/* New going quiet */}
      {nq.length>0&&(
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.r,boxShadow:T.sh,padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}><UserPlus size={11} color={T.t3}/><span style={{fontSize:12,fontWeight:600,color:T.t1}}>New members going quiet</span></div>
          <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
            {nq.map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 7px 2px 3px",borderRadius:20,background:T.surfaceEl,border:`1px solid ${T.border}`}}>
                <Av m={m} size={14}/><span style={{fontSize:10,color:T.t2}}>{m.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:T.t3,lineHeight:1.5,marginBottom:12}}>Week-1 follow-up has the highest retention impact.</div>
          <div style={{display:"flex",gap:6}}>
            <PBtn style={{flex:1,justifyContent:"center"}} onClick={()=>onFilter("new")}><Send size={9}/> Follow up</PBtn>
            <GBtn onClick={()=>onFilter("new")}>View</GBtn>
          </div>
        </div>
      )}

      {/* Drop-off patterns */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.r,boxShadow:T.sh,padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}><TrendingDown size={11} color={T.t3}/><span style={{fontSize:12,fontWeight:600,color:T.t1}}>Drop-off patterns</span></div>
        <div style={{fontSize:11,color:T.t3,marginBottom:14,lineHeight:1.5}}>When members go quiet after joining.</div>
        {[{label:"Week 1",pct:25,color:T.red},{label:"Week 2",pct:66,color:T.amber},{label:"Week 4",pct:41,color:T.t3}].map((b,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<2?8:0}}>
            <span style={{fontSize:10,color:T.t3,minWidth:42}}>{b.label}</span>
            <div style={{flex:1,height:2,borderRadius:99,background:T.divider}}><div style={{height:"100%",width:`${b.pct}%`,background:b.color,borderRadius:99,opacity:.55}}/></div>
            <span style={{fontSize:10,fontWeight:600,color:T.t2,minWidth:28,textAlign:"right"}}>{b.pct}%</span>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.r,boxShadow:T.sh,padding:"14px 16px"}}>
        <div style={{fontSize:11,fontWeight:600,color:T.t2,marginBottom:12,textTransform:"uppercase",letterSpacing:".1em"}}>Insights</div>
        {[`${hr.length} members haven't engaged in 14+ days`,"Highly engaged members refer at 3× the rate","New members respond best in days 3–7"].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:7,marginBottom:i<2?8:0}}>
            <span style={{color:T.t4,fontSize:10,marginTop:2,flexShrink:0}}>·</span>
            <span style={{fontSize:11,color:T.t3,lineHeight:1.5}}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Member detail panel ── */
function Preview({ m, onClose, onMsg }) {
  if(!m) return null;
  const bc = m.ch>=70?T.red:m.ch>=40?T.amber:T.t3;
  const es = Math.min(100,Math.round((m.v30/12)*100));
  const ec = es>=60?T.green:es>=30?T.amber:T.red;
  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,width:300,background:T.surface,borderLeft:`1px solid ${T.border}`,zIndex:200,display:"flex",flexDirection:"column",boxShadow:"-12px 0 40px rgba(0,0,0,0.6)",animation:"panelIn .18s ease"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${T.divider}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Av m={m} size={36}/>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:T.t1,marginBottom:3}}>{m.name}</div>
            <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:500,background:T.surfaceEl,color:m.st==="At risk"?T.red:T.t2,border:`1px solid ${T.border}`}}>
              {m.st==="At risk"&&<span style={{width:4,height:4,borderRadius:"50%",background:T.red,display:"inline-block",animation:"pulse 2s ease-in-out infinite"}}/>}{m.st}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{width:26,height:26,borderRadius:T.rsm,background:T.surfaceEl,border:`1px solid ${T.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={11} color={T.t3}/></button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
        {m.ch>=40&&(
          <div style={{padding:"12px 14px",borderRadius:T.r,marginBottom:12,background:T.surfaceEl,border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600,color:m.ch>=70?T.red:T.amber}}>{m.ch}% churn risk</span>
              <span style={{fontSize:10,color:T.t3}}>${m.mv}/mo</span>
            </div>
            <Bar pct={m.ch} color={bc}/>
            <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
              {m.reasons.map((r,i)=>(
                <div key={i} style={{display:"flex",gap:7}}><span style={{color:T.t4,fontSize:10,marginTop:2,flexShrink:0}}>—</span><span style={{fontSize:11,color:T.t2,lineHeight:1.5}}>{r}</span></div>
              ))}
            </div>
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
          {[{label:"This mo",val:m.v30},{label:"Last mo",val:m.pv},{label:"Total",val:m.vt}].map((s,i)=>(
            <div key={i} style={{padding:"10px",borderRadius:T.rsm,background:T.surfaceEl,border:`1px solid ${T.border}`,textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:T.t1,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{s.val}</div>
              <div style={{fontSize:9,color:T.t3,marginTop:3,textTransform:"uppercase",letterSpacing:".07em"}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:10,color:T.t3,textTransform:"uppercase",letterSpacing:".09em"}}>Engagement</span>
            <span style={{fontSize:11,fontWeight:600,color:ec}}>{es}%</span>
          </div>
          <div style={{height:3,borderRadius:99,background:T.divider}}><div style={{height:"100%",width:`${es}%`,borderRadius:99,background:ec,opacity:.7}}/></div>
        </div>
        <div style={{padding:"12px 14px",borderRadius:T.r,background:T.accentDim,border:`1px solid ${T.accentBrd}`}}>
          <div style={{fontSize:9,color:T.accent,textTransform:"uppercase",letterSpacing:".09em",marginBottom:4,fontWeight:600}}>Recommended</div>
          <div style={{fontSize:12,fontWeight:600,color:T.t1,marginBottom:3}}>{m.act}</div>
          <div style={{fontSize:10,color:T.t3}}>{m.rc}% predicted success</div>
        </div>
      </div>
      <div style={{padding:"12px 16px",borderTop:`1px solid ${T.divider}`,display:"flex",gap:7}}>
        <button onClick={()=>onMsg(m)} style={{flex:1,padding:"8px",borderRadius:T.rsm,background:T.accent,border:"none",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Send size={11}/> {m.act}</button>
        <button style={{padding:"8px 11px",borderRadius:T.rsm,background:T.surfaceEl,border:`1px solid ${T.border}`,color:T.t2,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}><MoreHorizontal size={13}/></button>
      </div>
    </div>
  );
}

/* ── Message toast ── */
function Toast({ member, onClose }) {
  const [sent,setSent] = useState(false);
  const [body,setBody] = useState(member?`Hey ${member.name.split(" ")[0]}, we've missed seeing you at the gym. Your progress is waiting — come back and pick up where you left off.`:"");
  if(!member) return null;
  return (
    <div style={{position:"fixed",bottom:80,right:26,width:340,background:T.surface,border:`1px solid ${T.borderEl}`,borderRadius:T.r,boxShadow:"0 4px 24px rgba(0,0,0,0.5)",zIndex:300,overflow:"hidden",animation:"toastIn .18s ease"}}>
      <div style={{padding:"11px 14px",borderBottom:`1px solid ${T.divider}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}><Bell size={11} color={T.t3}/><span style={{fontSize:11,fontWeight:600,color:T.t1}}>Push notification</span><span style={{fontSize:10,color:T.t3}}>→ {member.name.split(" ")[0]}</span></div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer"}}><X size={11} color={T.t3}/></button>
      </div>
      <div style={{padding:"12px 14px"}}>
        <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3}
          style={{width:"100%",boxSizing:"border-box",background:T.surfaceEl,border:`1px solid ${T.border}`,borderRadius:T.rsm,padding:"8px 10px",fontSize:11,color:T.t1,resize:"none",outline:"none",fontFamily:"inherit",lineHeight:1.6}}
          onFocus={e=>e.target.style.borderColor=T.accentBrd} onBlur={e=>e.target.style.borderColor=T.border}/>
        <div style={{marginTop:3,fontSize:10,color:T.t3}}>{member.rc}% predicted return rate</div>
        <button onClick={()=>{setSent(true);setTimeout(onClose,1600);}}
          style={{marginTop:9,width:"100%",padding:"8px",borderRadius:T.rsm,border:"none",background:sent?T.surfaceEl:T.accent,color:sent?T.green:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}>
          {sent?<><Check size={11}/> Sent</>:<><Send size={11}/> Send to {member.name.split(" ")[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════ */
export default function MembersPage() {
  const members = MEMBERS;
  const [filter,setFilter]   = useState("all");
  const [search,setSearch]   = useState("");
  const [sort,setSort]       = useState("churnDesc");
  const [selRows,setSelRows] = useState(new Set());
  const [prev,setPrev]       = useState(null);
  const [msg,setMsg]         = useState(null);

  const counts = useMemo(()=>({
    all:      members.length,
    atRisk:   members.filter(m=>m.ch>=60).length,
    dropping: members.filter(m=>m.pv>0&&m.v30<=m.pv*.5).length,
    new:      members.filter(m=>m.jd<=14).length,
    active:   members.filter(m=>m.str>=5).length,
    inactive: members.filter(m=>m.ds>=14).length,
  }),[]);

  const priority = useMemo(()=>members.filter(m=>m.ch>=55).sort((a,b)=>b.ch-a.ch).slice(0,4),[]);

  const toggleRow = useCallback(id=>setSelRows(p=>{const s=new Set(p);s.has(id)?s.delete(id):s.add(id);return s;}),[]);
  const toggleAll = useCallback(rows=>{if(selRows.size===rows.length)setSelRows(new Set());else setSelRows(new Set(rows.map(m=>m.id)));},[ selRows]);

  const tabs = [{id:"all",label:"All"},{id:"atRisk",label:"At Risk"},{id:"dropping",label:"Dropping"},{id:"new",label:"New"},{id:"active",label:"Active"},{id:"inactive",label:"Inactive"}];

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"'Geist','DM Sans','Helvetica Neue',Arial,sans-serif",color:T.t1,fontSize:13,lineHeight:1.5}}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        @keyframes panelIn{from{transform:translateX(24px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes toastIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:99px}
      `}</style>

      {/* ── Page header — mirrors Content page exactly ── */}
      <div style={{padding:"20px 24px 16px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,borderBottom:`1px solid ${T.border}`}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
            <div style={{width:28,height:28,borderRadius:T.rsm,background:T.accentDim,border:`1px solid ${T.accentBrd}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Users size={13} color={T.accent}/>
            </div>
            <h1 style={{fontSize:18,fontWeight:700,color:T.t1,margin:0,letterSpacing:"-0.03em"}}>Members</h1>
          </div>
          <p style={{fontSize:12,color:T.t3,margin:0,lineHeight:1.6}}>AI-powered retention · know who needs you, act instantly</p>
        </div>
        <div style={{display:"flex",gap:7,flexShrink:0}}>
          <GBtn><Activity size={11}/> Export</GBtn>
          <PBtn><Plus size={11}/> Invite Member</PBtn>
        </div>
      </div>

      {/* ── Metrics bar — full width, 4 columns ── */}
      <MetricsBar members={members}/>

      {/* ── Body — two-column layout ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 280px",minHeight:"calc(100vh - 90px)"}}>

        {/* ── Center ── */}
        <div style={{padding:"22px 24px 60px",overflowY:"auto",display:"flex",flexDirection:"column",gap:18}}>

          {/* Priority section */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,fontWeight:600,color:T.t2,textTransform:"uppercase",letterSpacing:".1em"}}>Priority Today</span>
                <div style={{display:"flex",alignItems:"center",gap:5,padding:"1px 7px",borderRadius:20,background:T.surfaceEl,border:`1px solid ${T.border}`}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:T.red,display:"inline-block",animation:"pulse 2s ease-in-out infinite"}}/>
                  <span style={{fontSize:10,fontWeight:600,color:T.red}}>{priority.length} need attention</span>
                </div>
              </div>
              <span style={{fontSize:11,color:T.t3}}>${priority.reduce((s,m)=>s+m.mv,0)}/mo at risk</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9}}>
              {priority.map(m=>(
                <ChurnCard key={m.id} m={m} onMsg={setMsg} onSel={m=>setPrev(p=>p?.id===m.id?null:m)}/>
              ))}
            </div>
          </div>

          {/* Segment pills */}
          <Segs members={members} active={filter} onFilter={setFilter} onBulk={id=>{
            const seg=members.filter(m=>{
              if(id==="atRisk") return m.ch>=60;
              if(id==="dropping") return m.pv>0&&m.v30<=m.pv*.5;
              if(id==="new") return m.jd<=14;
              if(id==="active") return m.str>=5;
              return false;
            });
            if(seg.length) setMsg(seg[0]);
          }}/>

          {/* Member table */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:T.r,boxShadow:T.sh,overflow:"hidden"}}>
            {/* Table toolbar */}
            <div style={{padding:"9px 14px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:2,flexWrap:"wrap",position:"sticky",top:0,background:T.surface,zIndex:10}}>
              {tabs.map(t=>{
                const on = filter===t.id;
                return (
                  <button key={t.id} onClick={()=>setFilter(t.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:T.rsm,fontSize:11,fontWeight:on?600:400,cursor:"pointer",fontFamily:"inherit",background:on?T.accentDim:"transparent",color:on?T.accent:T.t3,border:`1px solid ${on?T.accentBrd:"transparent"}`,transition:"all .1s"}}>
                    {t.label}{counts[t.id]>0&&<span style={{fontSize:9,color:on?T.accent:T.t4}}>{counts[t.id]}</span>}
                  </button>
                );
              })}
              <div style={{flex:1}}/>
              <div style={{position:"relative"}}>
                <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"5px 26px 5px 9px",borderRadius:T.rsm,background:T.surfaceEl,border:`1px solid ${T.border}`,color:T.t2,fontSize:11,outline:"none",cursor:"pointer",fontFamily:"inherit",appearance:"none"}}>
                  <option value="churnDesc">Highest risk</option>
                  <option value="lastVisit">Recently active</option>
                  <option value="value">Highest value</option>
                  <option value="name">Name A–Z</option>
                </select>
                <ChevronDown size={9} color={T.t4} style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              </div>
              <div style={{position:"relative"}}>
                <Search size={11} color={T.t4} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                <input placeholder="Search members…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{padding:"5px 10px 5px 26px",borderRadius:T.rsm,background:T.surfaceEl,border:`1px solid ${T.border}`,color:T.t1,fontSize:11,outline:"none",fontFamily:"inherit",width:160}}
                  onFocus={e=>e.target.style.borderColor=T.accentBrd} onBlur={e=>e.target.style.borderColor=T.border}/>
              </div>
            </div>

            <Table members={members} filter={filter} search={search} sort={sort} setSort={setSort}
              selRows={selRows} toggleRow={toggleRow} toggleAll={toggleAll} prev={prev} setPrev={setPrev} onMsg={setMsg}/>
            <BulkBar selRows={selRows} members={members} onClear={()=>setSelRows(new Set())} onBulk={sel=>setMsg(sel[0])}/>

            {/* Pagination */}
            <div style={{padding:"9px 16px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:3}}>
                {[ChevronLeft,ChevronRight].map((Icon,i)=>(
                  <button key={i} style={{width:26,height:26,borderRadius:T.rsm,background:"transparent",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",opacity:.4}}><Icon size={11} color={T.t2}/></button>
                ))}
                <button style={{width:26,height:26,borderRadius:T.rsm,background:T.accentDim,border:`1px solid ${T.accentBrd}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:11,fontWeight:700,color:T.accent,fontFamily:"inherit"}}>1</button>
              </div>
              <span style={{fontSize:10,color:T.t3}}>{members.length} members · page 1 of 1</span>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{padding:"18px 16px 40px",overflowY:"auto",borderLeft:`1px solid ${T.border}`,background:T.surface}}>
          <RightPanel members={members} onFilter={setFilter}/>
        </div>
      </div>

      {prev&&<Preview m={prev} onClose={()=>setPrev(null)} onMsg={setMsg}/>}
      {msg&&<Toast member={msg} onClose={()=>setMsg(null)}/>}

      {/* FAB */}
      <button style={{position:"fixed",bottom:26,right:26,zIndex:100,display:"flex",alignItems:"center",gap:7,padding:"12px 20px",borderRadius:50,background:T.accent,color:"#fff",border:"none",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 20px ${T.accent}40`,transition:"all .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 6px 28px ${T.accent}55`;}}
        onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=`0 4px 20px ${T.accent}40`;}}>
        <Plus size={13}/> Invite Member
      </button>
    </div>
  );
}
