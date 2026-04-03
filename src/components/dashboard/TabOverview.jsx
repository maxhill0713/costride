import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  TrendingDown, ArrowUpRight, Zap, CheckCircle, Trophy,
  UserPlus, QrCode, MessageSquarePlus, Pencil, Calendar,
  Activity, Users, AlertTriangle, ChevronRight, Minus,
  TrendingUp, Clock, Send, Heart, Sun, Moon, Sunrise,
  Coffee, LayoutDashboard, Settings, BarChart2, FileText,
  Repeat, LogOut, ScanLine, Plus, Bell, Eye,
} from "lucide-react";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',system-ui,sans-serif;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px;}
button{font-family:inherit;cursor:pointer;border:none;outline:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
@keyframes shimmer{0%{opacity:0.6}50%{opacity:1}100%{opacity:0.6}}`;

const C = {
  bg:       "#06101c",
  sidebar:  "#080e18",
  surface:  "#0c1728",
  el:       "#101e30",
  elHov:    "#142437",
  border:   "rgba(255,255,255,0.06)",
  borderMd: "rgba(255,255,255,0.10)",
  divider:  "rgba(255,255,255,0.04)",
  t1:"#eef2f7", t2:"#8094ac", t3:"#3d5269", t4:"#1e3048",
  accent:   "#3b82f6",
  aLow:     "rgba(59,130,246,0.10)",
  aBrd:     "rgba(59,130,246,0.22)",
  ok:       "#10b981",
  okLow:    "rgba(16,185,129,0.08)",
  okBrd:    "rgba(16,185,129,0.18)",
  warn:     "#f59e0b",
  warnLow:  "rgba(245,158,11,0.08)",
  warnBrd:  "rgba(245,158,11,0.18)",
  risk:     "#ef4444",
  riskLow:  "rgba(239,68,68,0.08)",
  riskBrd:  "rgba(239,68,68,0.18)",
  mono:     "'DM Mono',monospace",
  r:        12,
  rsm:      8,
};
const tick = { fill: C.t3, fontSize: 10, fontFamily: "inherit" };

const NOW = new Date();
const DAY = 86400000;
const d2d = (a,b) => Math.floor((a-b)/DAY);
const DAYS_S = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONS_L = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONS_S = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtFull = d => `${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]} ${d.getDate()} ${MONS_L[d.getMonth()]}`;
const fmtDay  = d => DAYS_S[d.getDay()];
const fmtMD   = d => `${MONS_S[d.getMonth()]} ${d.getDate()}`;

function greeting(h) {
  if(h<5)  return{text:"Good night",   Icon:Moon};
  if(h<12) return{text:"Good morning", Icon:Sunrise};
  if(h<17) return{text:"Good afternoon",Icon:Sun};
  return          {text:"Good evening", Icon:Coffee};
}

const chartDays7  = Array.from({length:7},(_,i)=>({day:fmtDay(new Date(NOW.getTime()-(6-i)*DAY)),value:[3,1,2,4,3,5,0][i]}));
const chartDays30 = Array.from({length:30},(_,i)=>({day:fmtMD(new Date(NOW.getTime()-(29-i)*DAY)),value:[0,2,1,0,3,5,4,2,0,1,3,4,5,0,2,1,0,3,2,1,4,3,2,5,4,3,2,1,0,0][i]}));

const M = {
  owner:"Max", gym:"Foundry Gym",
  todayCI:0, yesterdayCI:5, todayVsYest:-100,
  activeThisWeek:1, totalMembers:4, retentionRate:75,
  newSignUps:2, cancelledEst:0, atRisk:2,
  spark:[3,1,2,4,3,5,0], monthCiPer:[15,8,3,2,6],
  mrr:3560, newRev:420, lostRev:0,
};
const DATA = {
  atRiskMembers:[
    {id:1,name:"Emily R.",  days:10,plan:"Premium"},
    {id:2,name:"Alex D.",   days:16,plan:"Standard"},
    {id:3,name:"Jordan T.", days:21,plan:"Premium"},
  ],
  week1:{returned:1,didnt:1,names:["Alex D."]},
  retBreak:{week1:1,week2to4:1,month2to3:0,beyond:0},
  growthData:[
    {l:"Sep",v:1},{l:"Oct",v:2},{l:"Nov",v:1},{l:"Dec",v:0},
    {l:"Jan",v:2},{l:"Feb",v:1},{l:"Mar",v:2},
  ],
  checkIns:[
    {check_in_date:new Date(NOW.getTime()-5*60000).toISOString(),   uid:4},
    {check_in_date:new Date(NOW.getTime()-1*DAY).toISOString(),     uid:5},
    {check_in_date:new Date(NOW.getTime()-2*DAY).toISOString(),     uid:4},
  ],
  activity:[
    {name:"Sam K.",   action:"checked in",         time:new Date(NOW.getTime()-5*60000)},
    {name:"Priya M.", action:"joined as a member", time:new Date(NOW.getTime()-6*DAY)},
    {name:"Emily R.", action:"last seen",           time:new Date(NOW.getTime()-10*DAY)},
    {name:"Alex D.",  action:"went inactive",       time:new Date(NOW.getTime()-16*DAY)},
  ],
  newNoReturn:1,
  challenges:[],
  posts:[],
};

/* ── primitives ── */
function Div({ style={}, children, ...p }) {
  return <div style={style} {...p}>{children}</div>;
}
function Card({children,style={},accent}) {
  return (
    <div style={{borderRadius:C.r,background:C.surface,border:`1px solid ${C.border}`,
      borderLeft:accent?`2px solid ${accent}`:undefined,
      padding:"18px 20px",overflow:"hidden",animation:"fadeUp .3s ease both",...style}}>
      {children}
    </div>
  );
}
function Label({children,style={}}) {
  return <div style={{fontSize:10,fontWeight:700,color:C.t3,textTransform:"uppercase",
    letterSpacing:".14em",marginBottom:8,...style}}>{children}</div>;
}
function Divider({style={}}) {
  return <div style={{height:"1px",background:C.divider,margin:"12px 0",...style}}/>;
}
function Avatar({name="",size=28}) {
  const ini = name.split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase()||"?";
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:C.el,
      border:`1px solid ${C.border}`,display:"flex",alignItems:"center",
      justifyContent:"center",fontSize:Math.round(size*.33),fontWeight:600,
      color:C.t2,fontFamily:C.mono,flexShrink:0}}>{ini}</div>
  );
}
function Badge({children,color,bg,brd}) {
  return (
    <span style={{fontSize:9,fontWeight:700,color:color||C.t2,background:bg||C.el,
      border:`1px solid ${brd||C.border}`,borderRadius:5,padding:"2px 7px",
      textTransform:"uppercase",letterSpacing:".05em",flexShrink:0}}>{children}</span>
  );
}
function Btn({children,variant="ghost",onClick,style={},disabled=false}) {
  const V={
    ghost:  {background:C.el, color:C.t2, border:`1px solid ${C.border}`},
    accent: {background:C.aLow, color:C.accent, border:`1px solid ${C.aBrd}`},
    ok:     {background:C.okLow, color:C.ok, border:`1px solid ${C.okBrd}`},
    warn:   {background:C.warnLow, color:C.warn, border:`1px solid ${C.warnBrd}`},
    risk:   {background:C.riskLow, color:C.risk, border:`1px solid ${C.riskBrd}`},
    primary:{background:C.accent, color:"#fff", border:"none"},
  };
  return (
    <button disabled={disabled} onClick={onClick} style={{display:"inline-flex",alignItems:"center",
      gap:5,padding:"5px 12px",borderRadius:C.rsm,fontWeight:600,fontSize:11,
      transition:"opacity .15s",opacity:disabled?.4:1,...V[variant],...style}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity=".72"}}
      onMouseLeave={e=>{if(!disabled)e.currentTarget.style.opacity="1"}}>
      {children}
    </button>
  );
}
function Spark({data=[],w=60,h=24}) {
  if(!data||data.length<2)return<div style={{width:w,height:h}}/>;
  const mx=Math.max(...data,1),mn=Math.min(...data,0),rng=mx-mn||1;
  const pts=data.map((v,i)=>{
    const x=(i/(data.length-1))*w;
    const y=h-((v-mn)/rng)*(h-4)-2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const f=pts.split(" ")[0],l=pts.split(" ").slice(-1)[0];
  const area=`${f.split(",")[0]},${h} ${pts} ${l.split(",")[0]},${h}`;
  return (
    <svg width={w} height={h} style={{display:"block",flexShrink:0}}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity=".15"/>
          <stop offset="100%" stopColor={C.accent} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)"/>
      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function Ring({pct,size=42,stroke=3,color}) {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.divider} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size*.22} fontWeight={700} fill={color} fontFamily="inherit">{pct}%</text>
    </svg>
  );
}
function Nudge({color,icon:Icon,stat,detail,action,onAction}) {
  return (
    <div style={{marginTop:12,display:"flex",alignItems:"flex-start",gap:8,
      padding:"9px 11px",borderRadius:C.rsm,background:C.el,
      border:`1px solid ${C.border}`,borderLeft:`2px solid ${color}`}}>
      {Icon&&<Icon style={{width:11,height:11,color,flexShrink:0,marginTop:1}}/>}
      <div style={{flex:1,minWidth:0}}>
        <span style={{fontSize:11,fontWeight:600,color:C.t1}}>{stat} </span>
        <span style={{fontSize:11,color:C.t3}}>{detail}</span>
      </div>
      {action&&onAction&&(
        <button onClick={onAction} style={{flexShrink:0,fontSize:10,fontWeight:600,
          color,background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",
          display:"flex",alignItems:"center",gap:2,padding:0}}>
          {action}<ChevronRight style={{width:9,height:9}}/>
        </button>
      )}
    </div>
  );
}
function ChartTip({active,payload,label}) {
  if(!active||!payload?.length)return null;
  return (
    <div style={{background:"#040d17",border:`1px solid ${C.borderMd}`,borderRadius:C.rsm,
      padding:"7px 11px",boxShadow:"0 8px 24px rgba(0,0,0,.6)"}}>
      <p style={{color:C.t3,fontSize:10,fontWeight:500,margin:"0 0 2px"}}>{label}</p>
      <p style={{color:C.t1,fontWeight:700,fontSize:14,margin:0}}>{payload[0].value}</p>
    </div>
  );
}

/* ── Sidebar ── */
const NAV = [
  {id:"overview",  Icon:LayoutDashboard, label:"Overview"},
  {id:"members",   Icon:Users,           label:"Members"},
  {id:"content",   Icon:FileText,        label:"Content"},
  {id:"analytics", Icon:BarChart2,       label:"Analytics"},
  {id:"automations",Icon:Repeat,         label:"Automations"},
  {id:"settings",  Icon:Settings,        label:"Settings"},
];
function Sidebar({active,setActive}) {
  const [hov,setHov]=useState(null);
  return (
    <div style={{width:220,minWidth:220,background:C.sidebar,borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",
      overflowY:"auto",zIndex:10}}>
      {/* logo */}
      <div style={{padding:"20px 18px 16px",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:C.accent,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:16,fontWeight:700,color:"#fff",flexShrink:0}}>F</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.t1,lineHeight:1.2}}>Foundry Gym</div>
            <div style={{fontSize:9,color:C.t3,textTransform:"uppercase",
              letterSpacing:".12em",fontFamily:C.mono}}>GYM OWNER</div>
          </div>
        </div>
      </div>
      {/* nav */}
      <nav style={{padding:"12px 10px",flex:1}}>
        <div style={{fontSize:9,fontWeight:700,color:C.t4,textTransform:"uppercase",
          letterSpacing:".14em",padding:"4px 8px",marginBottom:4}}>Navigation</div>
        {NAV.map(n=>{
          const on=active===n.id, h=hov===n.id;
          return (
            <button key={n.id} onClick={()=>setActive(n.id)}
              onMouseEnter={()=>setHov(n.id)} onMouseLeave={()=>setHov(null)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:9,
                padding:"8px 10px",borderRadius:C.rsm,marginBottom:2,
                background:on?C.aLow:h?C.el:"transparent",
                color:on?C.accent:h?C.t1:C.t2,
                border:`1px solid ${on?C.aBrd:"transparent"}`,
                fontSize:13,fontWeight:on?600:400,transition:"all .15s"}}>
              <n.Icon style={{width:14,height:14,flexShrink:0}}/>
              {n.label}
            </button>
          );
        })}
        {/* links section */}
        <div style={{marginTop:20}}>
          <div style={{fontSize:9,fontWeight:700,color:C.t4,textTransform:"uppercase",
            letterSpacing:".14em",padding:"4px 8px",marginBottom:4}}>Links</div>
          {["View Gym Page","Member View"].map(l=>(
            <button key={l} style={{width:"100%",display:"flex",alignItems:"center",gap:9,
              padding:"7px 10px",borderRadius:C.rsm,marginBottom:2,
              background:"transparent",color:C.t3,fontSize:12,fontWeight:400}}>
              <Eye style={{width:12,height:12,flexShrink:0}}/>{l}
            </button>
          ))}
        </div>
      </nav>
      {/* log out */}
      <div style={{padding:"12px 10px",borderTop:`1px solid ${C.border}`}}>
        <button style={{width:"100%",display:"flex",alignItems:"center",gap:9,
          padding:"8px 10px",borderRadius:C.rsm,background:"transparent",
          color:C.risk,fontSize:12,fontWeight:500}}>
          <LogOut style={{width:13,height:13,flexShrink:0}}/>Log Out
        </button>
      </div>
    </div>
  );
}

/* ── Top bar ── */
function TopBar({atRisk}) {
  return (
    <div style={{height:50,display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"0 24px",borderBottom:`1px solid ${C.border}`,background:C.sidebar,
      position:"sticky",top:0,zIndex:9,backdropFilter:"blur(12px)"}}>
      <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{fmtFull(NOW)}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {atRisk>0&&(
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",
            borderRadius:C.rsm,background:C.riskLow,border:`1px solid ${C.riskBrd}`}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:C.risk,
              animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:10.5,fontWeight:600,color:C.risk,fontFamily:C.mono}}>
              {atRisk} at-risk
            </span>
          </div>
        )}
        <Btn variant="ghost"><ScanLine style={{width:12,height:12}}/>Scan QR</Btn>
        <Btn variant="primary"><Plus style={{width:12,height:12}}/>New Post</Btn>
        <div style={{width:"1px",height:20,background:C.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.el,
            border:`1px solid ${C.border}`,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:11,fontWeight:700,color:C.t2}}>M</div>
          <span style={{fontSize:12,fontWeight:600,color:C.t2}}>Max</span>
        </div>
      </div>
    </div>
  );
}

/* ── Priority Panel ── */
function PriorityItem({item,idx}) {
  const [hov,setHov]=useState(false);
  const delay=`${idx*0.06}s`;
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"flex",alignItems:"flex-start",gap:12,padding:"13px 15px",
        borderRadius:C.rsm,background:hov?C.elHov:C.el,
        border:`1px solid ${hov?C.borderMd:C.border}`,
        borderLeft:`2px solid ${item.color}`,
        transition:"all .15s",cursor:"pointer",animation:`fadeUp .3s ease ${delay} both`}}>
      <div style={{width:32,height:32,borderRadius:9,background:C.surface,
        border:`1px solid ${C.border}`,display:"flex",alignItems:"center",
        justifyContent:"center",flexShrink:0}}>
        <item.Icon style={{width:13,height:13,color:item.color}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12.5,fontWeight:600,color:C.t1,marginBottom:3,lineHeight:1.3}}>
          {item.title}
        </div>
        <div style={{fontSize:11,color:C.t3,lineHeight:1.45}}>{item.detail}</div>
        {item.impact&&(
          <span style={{display:"inline-flex",alignItems:"center",gap:3,marginTop:6,
            fontSize:10,fontWeight:600,color:item.color,
            background:`${item.color}12`,border:`1px solid ${item.color}25`,
            borderRadius:5,padding:"2px 8px"}}>
            {item.impact}
          </span>
        )}
      </div>
      {item.cta&&(
        <button style={{flexShrink:0,fontSize:10.5,fontWeight:600,color:item.color,
          background:`${item.color}12`,border:`1px solid ${item.color}25`,
          borderRadius:7,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",
          display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
          {item.cta}<ChevronRight style={{width:9,height:9}}/>
        </button>
      )}
    </div>
  );
}
function PriorityPanel({items=[]}) {
  if(!items.length)return null;
  return (
    <Card style={{marginBottom:18,padding:"18px 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <Zap style={{width:13,height:13,color:C.accent}}/>
        <Label style={{marginBottom:0}}>Today's Priorities</Label>
        <span style={{marginLeft:"auto",fontSize:10,fontWeight:600,color:C.t3,
          background:C.el,border:`1px solid ${C.border}`,borderRadius:6,padding:"2px 8px"}}>
          {items.length} action{items.length!==1?"s":""}
        </span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {items.map((p,i)=><PriorityItem key={i} item={p} idx={i}/>)}
      </div>
    </Card>
  );
}

/* ── KPI Cards ── */
function KpiCard({label,value,suffix,sub,subTrend,subCtx,spark,ring,ringColor,valueColor,cta,onCta,insight,delay="0s"}) {
  const tc=subTrend==="up"?C.ok:subTrend==="down"?C.risk:C.t3;
  const Ti=subTrend==="up"?ArrowUpRight:subTrend==="down"?TrendingDown:Minus;
  const showRing=ring!=null&&ring>5&&ring<98;
  return (
    <div style={{borderRadius:C.r,padding:"15px 17px",background:C.surface,
      border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",
      animation:`fadeUp .35s ease ${delay} both`}}>
      <Label>{label}</Label>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:8}}>
        <div>
          <div style={{display:"flex",alignItems:"baseline",gap:4}}>
            <span style={{fontSize:34,fontWeight:700,color:valueColor||C.t1,
              lineHeight:1,letterSpacing:"-0.04em",fontFamily:C.mono}}>{value}</span>
            {suffix&&<span style={{fontSize:12,color:C.t3}}>{suffix}</span>}
          </div>
          {sub&&(
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:6}}>
              <Ti style={{width:10,height:10,color:tc,flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:500,color:tc}}>{sub}</span>
            </div>
          )}
          {subCtx&&<div style={{fontSize:10,color:C.t3,marginTop:3}}>{subCtx}</div>}
        </div>
        {showRing?<Ring pct={ring} color={ringColor||C.accent}/>
          :spark?.some(v=>v>0)?<Spark data={spark}/>:null}
      </div>
      {insight&&<div style={{fontSize:10,color:C.t3,padding:"6px 0 2px",
        borderTop:`1px solid ${C.divider}`,fontStyle:"italic"}}>{insight}</div>}
      {cta&&onCta&&(
        <button onClick={onCta} style={{marginTop:8,width:"100%",padding:"6px 10px",
          borderRadius:C.rsm,background:C.el,border:`1px solid ${C.borderMd}`,
          color:C.t1,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",
          alignItems:"center",justifyContent:"center",gap:5}}>
          {cta}<ChevronRight style={{width:10,height:10}}/>
        </button>
      )}
    </div>
  );
}

/* ── At-Risk Preview ── */
function AtRiskPreview({members=[],onMsg,onAll}) {
  return (
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <Label style={{marginBottom:2}}>At-Risk Members</Label>
          <div style={{fontSize:11,color:C.t3}}>No visit in 14+ days</div>
        </div>
        <button onClick={onAll} style={{fontSize:11,fontWeight:500,color:C.t3,
          background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
          View all<ChevronRight style={{width:11,height:11}}/>
        </button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {members.slice(0,4).map((m,i)=>{
          const rc=m.days>=21?C.risk:C.warn;
          const rl=m.days>=21?"High":"Med";
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,
              padding:"9px 12px",borderRadius:C.rsm,background:C.el,border:`1px solid ${C.border}`}}>
              <Avatar name={m.name} size={28}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:C.t1,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</div>
                <div style={{fontSize:10,color:C.t3,marginTop:1,fontFamily:C.mono}}>
                  Last visit {m.days}d ago · {m.plan}
                </div>
              </div>
              <Badge color={rc} bg={`${rc}10`} brd={`${rc}25`}>{rl}</Badge>
              <button onClick={e=>{e.stopPropagation();onMsg?.(m)}}
                style={{flexShrink:0,padding:"4px 9px",borderRadius:6,
                  background:"transparent",border:`1px solid ${C.borderMd}`,
                  color:C.t2,fontSize:10,fontWeight:600,cursor:"pointer",
                  display:"flex",alignItems:"center",gap:3}}>
                <Send style={{width:9,height:9}}/>Message
              </button>
            </div>
          );
        })}
      </div>
      <Nudge color={C.risk} icon={Heart}
        stat="Direct outreach works."
        detail="A personal message is the most effective way to bring back lapsed members — response rates peak in the first 48h."/>
    </Card>
  );
}

/* ── Check-in Chart ── */
function CheckInChart({data,range,setRange}) {
  const todayLabel=range<=7?fmtDay(NOW):fmtMD(NOW);
  const avg=useMemo(()=>(data.reduce((a,b)=>a+b.value,0)/data.length).toFixed(1),[data]);
  const todayVal=data.find(d=>d.day===todayLabel)?.value??0;
  const chartMax=Math.max(...data.map(d=>d.value),1);
  const isLowest=todayVal>0&&data.filter(d=>d.value>0).length>1&&todayVal<=Math.min(...data.filter(d=>d.value>0).map(d=>d.value));
  return (
    <Card style={{padding:"18px 18px 14px"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <Label style={{marginBottom:4}}>Check-in Activity</Label>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{fontSize:11,color:C.t3}}>
              Daily avg <span style={{fontWeight:600,color:C.t2,fontFamily:C.mono}}>{avg}</span>
            </div>
            {todayVal>0&&<>
              <div style={{width:3,height:3,borderRadius:"50%",background:C.t3}}/>
              <div style={{fontSize:11,color:C.t3}}>
                Today <span style={{fontWeight:600,color:C.accent,fontFamily:C.mono}}>{todayVal}</span>
              </div>
            </>}
            <div style={{fontSize:10,color:C.t3,fontStyle:"italic"}}>Peak activity 5–7pm</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {[{v:7,l:"7D"},{v:30,l:"30D"}].map(r=>(
            <button key={r.v} onClick={()=>setRange(r.v)} style={{
              fontSize:11,fontWeight:range===r.v?700:400,padding:"4px 11px",
              borderRadius:C.rsm,cursor:"pointer",
              background:range===r.v?C.el:"rgba(255,255,255,0.025)",
              color:range===r.v?C.t1:C.t3,
              border:`1px solid ${range===r.v?C.borderMd:C.border}`,transition:"all .15s"}}>
              {r.l}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{top:4,right:4,left:-8,bottom:0}} barSize={range<=7?18:7}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false}/>
          <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} interval={range<=7?0:4}/>
          <YAxis tick={tick} axisLine={false} tickLine={false} width={26} allowDecimals={false}
            domain={[0,Math.max(chartMax+1,5)]}/>
          <Tooltip cursor={{fill:"rgba(255,255,255,0.02)"}} content={<ChartTip/>}/>
          <Bar dataKey="value" radius={[3,3,0,0]}>
            {data.map((e,i)=>(
              <Cell key={i} fill={C.accent} fillOpacity={e.day===todayLabel?.85:.3}/>
            ))}
          </Bar>
          {parseFloat(avg)>0&&(
            <ReferenceLine y={parseFloat(avg)} stroke={C.t4} strokeDasharray="4 4"
              label={{value:`avg ${avg}`,position:"insideTopRight",fill:C.t3,
                fontSize:9,fontFamily:"inherit"}}/>
          )}
        </BarChart>
      </ResponsiveContainer>
      <div style={{display:"flex",alignItems:"center",gap:14,marginTop:10,
        paddingTop:10,borderTop:`1px solid ${C.divider}`}}>
        {[{op:.85,l:"Today"},{op:.3,l:"Past days"}].map((x,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,borderRadius:2,background:C.accent,opacity:x.op}}/>
            <span style={{fontSize:10,color:C.t3}}>{x.l}</span>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:14,height:1,borderTop:`2px dashed ${C.t4}`}}/>
          <span style={{fontSize:10,color:C.t3}}>Daily avg</span>
        </div>
      </div>
      {isLowest&&<Nudge color={C.warn} icon={TrendingDown}
        stat="Lowest day this week."
        detail="Consider sending a reminder or motivational post to boost tomorrow's attendance."/>}
    </Card>
  );
}

/* ── Revenue ── */
function RevenueSection({mrr,newRev,lostRev}) {
  const items=[
    {label:"Monthly Recurring Revenue",value:`$${mrr.toLocaleString()}`,
      sub:"100% Revenue",badge:"Healthy",bc:C.ok,bb:C.okLow,bbrd:C.okBrd},
    {label:"New Revenue",value:`+$${newRev}`,
      sub:"New sale this month",color:C.ok},
    {label:"Lost Revenue",value:`$${lostRev}`,
      sub:"Loss this month",color:lostRev>0?C.risk:C.t3},
  ];
  return (
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <Label style={{marginBottom:0}}>Revenue</Label>
        {items[0].badge&&(
          <span style={{fontSize:10,fontWeight:600,color:items[0].bc,
            background:items[0].bb,border:`1px solid ${items[0].bbrd}`,
            borderRadius:6,padding:"2px 9px"}}>{items[0].badge}</span>
        )}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        {items.map((it,i)=>(
          <div key={i} style={{padding:"12px 14px",borderRadius:C.rsm,
            background:C.el,border:`1px solid ${C.border}`,
            borderLeft:i===0?`2px solid ${C.ok}`:undefined}}>
            <div style={{fontSize:10,color:C.t3,marginBottom:6,textTransform:"uppercase",
              letterSpacing:".1em"}}>{it.label}</div>
            <div style={{fontSize:i===0?24:18,fontWeight:700,color:it.color||C.t1,
              fontFamily:C.mono,letterSpacing:"-0.04em"}}>{it.value}</div>
            <div style={{fontSize:11,color:C.t3,marginTop:4}}>{it.sub}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Member Growth ── */
function MemberGrowth({newSignUps,cancelled,retention,growthData}) {
  const hasData=(growthData||[]).filter(d=>d.v>0).length>=2;
  const net=newSignUps-cancelled;
  const rc=retention>=70?C.ok:retention<50?C.risk:C.t2;
  return (
    <Card>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <Label style={{marginBottom:4}}>Member Growth</Label>
          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
            <span style={{fontSize:26,fontWeight:700,color:C.t1,
              letterSpacing:"-0.04em",fontFamily:C.mono}}>
              {newSignUps>0?`+${newSignUps}`:newSignUps}
            </span>
            <span style={{fontSize:12,color:C.t3}}>this month</span>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <div style={{padding:"3px 9px",borderRadius:6,
            background:retention>=70?C.okLow:C.el,
            border:`1px solid ${retention>=70?C.okBrd:C.border}`,
            fontSize:11,fontWeight:600,color:rc}}>{retention}% retained</div>
          {cancelled>0&&<div style={{padding:"3px 9px",borderRadius:6,
            background:C.riskLow,border:`1px solid ${C.riskBrd}`,
            fontSize:11,fontWeight:600,color:C.risk}}>{cancelled} left</div>}
        </div>
      </div>
      {hasData?(
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={growthData} barSize={16} margin={{top:4,right:4,left:-8,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false}/>
            <XAxis dataKey="l" tick={tick} axisLine={false} tickLine={false}/>
            <YAxis tick={tick} axisLine={false} tickLine={false} width={24} allowDecimals={false}/>
            <Tooltip content={<ChartTip/>} cursor={{fill:"rgba(255,255,255,0.02)"}}/>
            <Bar dataKey="v" fill={C.accent} fillOpacity={.7} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      ):(
        <div style={{height:100,display:"flex",alignItems:"center",justifyContent:"center",
          borderRadius:C.rsm,background:C.el}}>
          <div style={{fontSize:12,color:C.t3}}>Chart populates as data grows</div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",
        marginTop:12,paddingTop:12,borderTop:`1px solid ${C.divider}`}}>
        {[
          {l:"New",      v:newSignUps,         c:newSignUps>0?C.ok:C.t1},
          {l:"Cancelled",v:cancelled,          c:cancelled>0?C.risk:C.t4},
          {l:"Net",      v:`${net>=0?"+":""}${net}`,c:net<0?C.risk:C.t1},
        ].map((s,i)=>(
          <div key={i} style={{textAlign:"center",padding:"0 8px",
            borderRight:i<2?`1px solid ${C.divider}`:"none"}}>
            <div style={{fontSize:18,fontWeight:700,color:s.c,
              letterSpacing:"-0.03em",fontFamily:C.mono}}>{s.v}</div>
            <div style={{fontSize:10,color:C.t3,marginTop:3,
              textTransform:"uppercase",letterSpacing:".06em"}}>{s.l}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Activity Feed ── */
function ActivityFeed({items=[],now}) {
  if(!items.length)return(
    <Card>
      <Label>Recent Activity</Label>
      <div style={{padding:"20px 0",textAlign:"center"}}>
        <Activity style={{width:18,height:18,color:C.t3,margin:"0 auto 8px",display:"block",opacity:.4}}/>
        <p style={{fontSize:12,color:C.t3,margin:"0 0 3px",fontWeight:500}}>No activity yet today</p>
        <p style={{fontSize:11,color:C.t3,margin:0,opacity:.7}}>Typical peak is 5–7pm</p>
      </div>
    </Card>
  );
  return (
    <Card>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <Label style={{marginBottom:0}}>Recent Activity</Label>
        <Btn variant="ghost" size="sm">All →</Btn>
      </div>
      <div style={{marginTop:12}}>
        {items.slice(0,6).map((a,i)=>{
          const mins=Math.floor((now-new Date(a.time))/60000);
          const ts=mins<60?`${mins}m ago`:mins<1440?`${Math.floor(mins/60)}h ago`:`${Math.floor(mins/1440)}d ago`;
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",
              borderBottom:i<Math.min(items.length,6)-1?`1px solid ${C.divider}`:"none"}}>
              <Avatar name={a.name} size={26}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:C.t1,lineHeight:1.4,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  <span style={{fontWeight:600}}>{a.name}</span>
                  <span style={{color:C.t2}}> {a.action}</span>
                </div>
              </div>
              <span style={{fontSize:10,color:C.t3,flexShrink:0,fontFamily:C.mono}}>{ts}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Right Sidebar Panels ── */
function Signal({color,icon:Icon,title,detail,action,onAction,last}) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onAction} onMouseEnter={()=>onAction&&setHov(true)}
      onMouseLeave={()=>onAction&&setHov(false)}
      style={{padding:"10px 12px",borderRadius:C.rsm,
        background:hov&&onAction?C.el:C.surface,
        border:`1px solid ${C.border}`,borderLeft:`2px solid ${color}`,
        marginBottom:last?0:5,cursor:onAction?"pointer":"default",transition:"background .15s"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
        {Icon&&<Icon style={{width:12,height:12,color,flexShrink:0,marginTop:2}}/>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,color:C.t1,lineHeight:1.3,marginBottom:2}}>{title}</div>
          <div style={{fontSize:11,color:C.t3,lineHeight:1.45}}>{detail}</div>
        </div>
        {action&&(
          <span style={{fontSize:10,fontWeight:600,color,flexShrink:0,
            display:"flex",alignItems:"center",gap:2,marginTop:1}}>
            {action}<ChevronRight style={{width:9,height:9}}/>
          </span>
        )}
      </div>
    </div>
  );
}
function ActionItems({atRisk,checkIns,posts,challenges,now,newNoReturn=0,onMsg,onView}) {
  const signals=useMemo(()=>{
    const items=[];
    if(newNoReturn>0)items.push({priority:1,color:C.risk,Icon:UserPlus,
      title:`${newNoReturn} new member${newNoReturn>1?"s":""} haven't returned`,
      detail:"Joined 1–2 weeks ago, no second visit. Week-1 follow-up has the highest retention impact.",
      action:"Follow up",fn:onMsg});
    if(atRisk>0)items.push({priority:2,color:atRisk>=5?C.risk:C.warn,Icon:AlertTriangle,
      title:`${atRisk} member${atRisk>1?"s":""} inactive 14+ days`,
      detail:`Direct outreach is the most effective re-engagement method.`,
      action:"View & message",fn:onView});
    if(!(challenges||[]).some(c=>!c.ended_at))items.push({priority:3,color:C.warn,Icon:Trophy,
      title:"No active challenge",
      detail:"Members with an active goal visit more consistently.",
      action:"Create one",fn:()=>{}});
    if(!(posts||[]).find(p=>d2d(now,new Date(p.created_at||now))<=7))items.push({priority:4,color:C.warn,Icon:MessageSquarePlus,
      title:"No community posts yet",
      detail:"Regular posts lift engagement. Try a motivational post or a poll.",
      action:"Post now",fn:()=>{}});
    const todayCount=checkIns.filter(c=>{
      const d=new Date(c.check_in_date);
      return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
    }).length;
    if(todayCount===0&&now.getHours()>=10)items.push({priority:5,color:C.warn,Icon:QrCode,
      title:"No check-ins recorded today",
      detail:"Check-ins usually start by 9–10am. Scanner issue?",
      action:"Check scanner",fn:()=>{}});
    return items.sort((a,b)=>a.priority-b.priority).slice(0,5);
  },[atRisk,newNoReturn,posts?.length,challenges?.length]);
  const urgentCount=signals.filter(s=>s.color===C.risk).length;
  return (
    <Card style={{padding:"16px 18px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <Label style={{marginBottom:0}}>Action Items</Label>
        {signals.length>0&&(
          <span style={{fontSize:10,fontWeight:700,
            color:urgentCount>0?C.risk:C.t3,
            background:urgentCount>0?C.riskLow:"transparent",
            border:`1px solid ${urgentCount>0?C.riskBrd:C.border}`,
            borderRadius:6,padding:"1px 7px"}}>
            {signals.length} pending
          </span>
        )}
      </div>
      <div style={{fontSize:11,color:C.t4,marginBottom:12}}>Sorted by urgency</div>
      {signals.length===0?(
        <div style={{padding:"11px 12px",borderRadius:C.rsm,background:C.el,
          border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.ok}`,
          display:"flex",alignItems:"center",gap:8}}>
          <CheckCircle style={{width:12,height:12,color:C.ok,flexShrink:0}}/>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:C.t1}}>All clear today</div>
            <div style={{fontSize:11,color:C.t3,marginTop:1}}>No immediate actions needed</div>
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column"}}>
          {signals.map((s,i)=>(
            <Signal key={i} color={s.color} icon={s.Icon} title={s.title}
              detail={s.detail} action={s.action} onAction={s.fn} last={i===signals.length-1}/>
          ))}
        </div>
      )}
    </Card>
  );
}
function QuickActions() {
  const acts=[
    {Icon:FileText,        l:"Create Post"},
    {Icon:UserPlus,        l:"Add Member"},
    {Icon:Trophy,          l:"Start Challenge"},
    {Icon:Calendar,        l:"Create Event"},
  ];
  return (
    <Card style={{padding:"16px 18px"}}>
      <Label>Quick Actions</Label>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
        {acts.map(({Icon:I,l},i)=>{
          const [hov,setHov]=useState(false);// eslint-disable-line
          return (
            <button key={i} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
              style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",
                borderRadius:C.rsm,background:hov?C.elHov:C.el,
                border:`1px solid ${hov?C.borderMd:C.border}`,
                cursor:"pointer",transition:"all .15s"}}>
              <I style={{width:12,height:12,color:C.accent,flexShrink:0}}/>
              <span style={{fontSize:11,fontWeight:600,color:hov?C.t1:C.t2}}>{l}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
function RetentionBreak({breakdown={},onAll}) {
  const rows=[
    {l:"New — went quiet",   s:"Joined <2 wks",    v:breakdown.week1||0,   c:C.risk},
    {l:"Early drop-off",     s:"Weeks 2–4",         v:breakdown.week2to4||0,c:C.warn},
    {l:"Month 2–3 slip",     s:"Common churn",      v:breakdown.month2to3||0,c:C.warn},
    {l:"Long inactive",      s:"21+ days absent",   v:breakdown.beyond||0,  c:C.t3},
  ];
  const total=rows.reduce((s,r)=>s+r.v,0);
  return (
    <Card style={{padding:"16px 18px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <Label style={{marginBottom:0}}>Drop-off Risk</Label>
        <button onClick={onAll} style={{fontSize:11,fontWeight:500,color:C.t3,
          background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
          View all<ChevronRight style={{width:11,height:11}}/>
        </button>
      </div>
      {total===0?(
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",
          borderRadius:C.rsm,background:C.el,border:`1px solid ${C.border}`,
          borderLeft:`2px solid ${C.ok}`}}>
          <CheckCircle style={{width:12,height:12,color:C.ok,flexShrink:0}}/>
          <span style={{fontSize:11,color:C.t2}}>No drop-off risks detected</span>
        </div>
      ):rows.map((r,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"7px 0",borderBottom:i<rows.length-1?`1px solid ${C.divider}`:"none"}}>
          <div>
            <span style={{fontSize:11,fontWeight:500,color:r.v>0?C.t1:C.t3}}>{r.l}</span>
            <span style={{fontSize:10,color:C.t3,marginLeft:6}}>{r.s}</span>
          </div>
          <span style={{fontSize:13,fontWeight:700,color:r.v>0?r.c:C.t4,fontFamily:C.mono}}>{r.v}</span>
        </div>
      ))}
    </Card>
  );
}
function WeekOneReturn({data={},onMsg}) {
  const {returned=0,didnt=0,names=[]}=data;
  const total=returned+didnt;
  const pct=total>0?Math.round((returned/total)*100):0;
  const pc=total===0?C.t3:pct>=60?C.ok:pct>=40?C.t1:C.risk;
  return (
    <Card style={{padding:"16px 18px"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <Label style={{marginBottom:2}}>Week-1 Return Rate</Label>
          <div style={{fontSize:11,color:C.t3}}>Joined 1–3 weeks ago</div>
        </div>
        <div style={{fontSize:24,fontWeight:700,color:pc,
          letterSpacing:"-0.04em",lineHeight:1,fontFamily:C.mono}}>
          {total===0?"—":`${pct}%`}
        </div>
      </div>
      {total===0?(
        <p style={{fontSize:12,color:C.t3,margin:0}}>No members in the 1–3 week window yet.</p>
      ):(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
            {[{count:returned,label:"Came back",c:returned>0?C.ok:C.t4},
              {count:didnt,   label:"Didn't return",c:didnt>0?C.risk:C.t4}].map((cell,i)=>(
              <div key={i} style={{padding:"9px 10px",borderRadius:C.rsm,
                background:C.el,border:`1px solid ${C.border}`,textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:700,color:cell.c,
                  letterSpacing:"-0.03em",fontFamily:C.mono}}>{cell.count}</div>
                <div style={{fontSize:10,color:C.t3,marginTop:2,textTransform:"uppercase",
                  letterSpacing:".05em"}}>{cell.label}</div>
              </div>
            ))}
          </div>
          {didnt>0&&names.length>0&&(
            <div style={{marginBottom:10,padding:"8px 11px",borderRadius:C.rsm,
              background:C.el,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.risk}`}}>
              <div style={{fontSize:11,color:C.t2,marginBottom:4,lineHeight:1.5}}>
                {names.join(", ")}{didnt>3?` +${didnt-3} more`:""} — no return visit yet
              </div>
              <button onClick={()=>onMsg?.()} style={{fontSize:11,fontWeight:600,
                color:C.risk,background:"none",border:"none",cursor:"pointer",
                padding:0,display:"flex",alignItems:"center",gap:3}}>
                Send follow-up<ChevronRight style={{width:10,height:10}}/>
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

/* ── Root ── */
export default function GymOwnerDashboard() {
  const [nav,setNav]=useState("overview");
  const [range,setRange]=useState(7);
  const now=NOW;

  const inGymNow=DATA.checkIns.filter(c=>{
    const diff=(now-new Date(c.check_in_date))/60000;
    return diff>=0&&diff<=120;
  }).length;

  const ciSub=M.yesterdayCI===0
    ?(M.todayCI>0?"No data for yesterday":"No check-ins yet today")
    :M.todayVsYest>0?`+${M.todayVsYest}% vs yesterday`
    :M.todayVsYest<0?`${M.todayVsYest}% vs yesterday`
    :"Same as yesterday";
  const ciTrend=M.yesterdayCI>0&&M.todayVsYest>0?"up":M.yesterdayCI>0&&M.todayVsYest<0?"down":null;
  const wAvg=useMemo(()=>{
    const d=range<=7?chartDays7:chartDays30;
    return (d.reduce((a,b)=>a+b.value,0)/d.length).toFixed(1);
  },[range]);
  const isLowest=M.todayCI>0&&chartDays7.filter(d=>d.value>0).length>1&&
    M.todayCI<=Math.min(...chartDays7.filter(d=>d.value>0).map(d=>d.value));
  const ciInsight=isLowest?"Lowest this week — consider sending a reminder"
    :M.todayCI===0&&now.getHours()<10?"Mornings are usually quiet — peak at 5–7pm":null;

  const priorities=useMemo(()=>{
    const items=[];
    if(M.atRisk>0)items.push({color:C.risk,Icon:Heart,
      title:`Message ${M.atRisk} at-risk member${M.atRisk>1?"s":""}`,
      detail:`${M.atRisk} member${M.atRisk>1?"s haven't":" hasn't"} visited in 14+ days. Personal outreach is the most effective retention tool.`,
      impact:`Could retain ${M.atRisk} member${M.atRisk>1?"s":""}`,cta:"Send messages",onAction:()=>{}});
    if(DATA.newNoReturn>0)items.push({color:C.risk,Icon:UserPlus,
      title:`Follow up with ${DATA.newNoReturn} new member${DATA.newNoReturn>1?"s":""}`,
      detail:"Joined recently but haven't returned. Week-1 follow-ups have the single highest retention impact.",
      impact:"Highest retention impact",cta:"Follow up",onAction:()=>{}});
    const todayCount=DATA.checkIns.filter(c=>{
      const d=new Date(c.check_in_date);
      return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
    }).length;
    if(todayCount===0&&now.getHours()>=10)items.push({color:C.warn,Icon:Clock,
      title:"Remind today's no-shows",
      detail:"No check-ins recorded yet today. A quick reminder can boost this week's attendance.",
      impact:"Boost this week's check-ins",cta:"Send reminder",onAction:()=>{}});
    if(!DATA.challenges.some(c=>!c.ended_at)&&M.totalMembers>=3)items.push({color:C.warn,Icon:Trophy,
      title:"Launch a challenge",
      detail:"No active challenge running. Members with goals visit significantly more consistently.",
      impact:"Boost weekly visits",cta:"Create challenge",onAction:()=>{}});
    if(!DATA.posts.some(p=>d2d(now,new Date(p.created_at||now))<=7))items.push({color:C.accent,Icon:MessageSquarePlus,
      title:"Post a community update",
      detail:"Regular posts lift engagement scores. Try a motivational post, poll, or class promo.",
      impact:"Improve engagement",cta:"Post now",onAction:()=>{}});
    return items.slice(0,5);
  },[]);

  const {text:greet,Icon:GIcon}=greeting(now.getHours());
  const chartData=range<=7?chartDays7:chartDays30;
  const showRing=M.retentionRate>5&&M.retentionRate<98;

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.t1,
      fontFamily:"'DM Sans',system-ui,sans-serif",display:"flex"}}>
      <style>{FONT}</style>
      <Sidebar active={nav} setActive={setNav}/>
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        <TopBar atRisk={M.atRisk}/>
        <main style={{flex:1,padding:"24px 24px 60px",overflowY:"auto"}}>
          {/* greeting */}
          <div style={{marginBottom:20,animation:"fadeUp .3s ease both"}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
              <GIcon style={{width:14,height:14,color:C.warn,opacity:.7}}/>
              <span style={{fontSize:11,color:C.t3}}>{fmtFull(now)}</span>
            </div>
            <h1 style={{fontSize:20,fontWeight:700,color:C.t1,margin:0,
              letterSpacing:"-0.02em",lineHeight:1.35}}>
              {greet}, {M.owner}!{" "}
              <span style={{fontWeight:400,color:C.t3}}>Here's what to focus on today</span>
            </h1>
          </div>

          {/* layout: main + right sidebar */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:18,alignItems:"start"}}>
            {/* ── left ── */}
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <PriorityPanel items={priorities}/>

              {/* KPI row */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                <KpiCard label="Today's Check-ins" value={M.todayCI}
                  sub={ciSub} subTrend={ciTrend}
                  subCtx={wAvg?`Avg: ${wAvg}/day`:undefined}
                  spark={M.spark} insight={ciInsight}
                  cta={M.todayCI===0&&now.getHours()>=10?"Send reminder":undefined}
                  onCta={()=>{}} delay=".05s"/>
                <KpiCard label="Active This Week" value={M.activeThisWeek}
                  suffix={` of ${M.totalMembers}`}
                  sub={`${M.retentionRate}% retention`}
                  subTrend={M.retentionRate>=70?"up":M.retentionRate<50?"down":null}
                  subCtx={M.retentionRate<60?"Below 70% target":M.retentionRate>=80?"Top 20%":"Steady"}
                  ring={showRing?M.retentionRate:null}
                  ringColor={M.retentionRate>=70?C.ok:M.retentionRate>=50?C.warn:C.risk}
                  spark={!showRing?M.spark:null} delay=".10s"/>
                <KpiCard label="Current in Gym" value={inGymNow}
                  sub={inGymNow===0?(now.getHours()<10?"Early — peak 5–7pm":now.getHours()<17?"Quiet midday":"No recent check-ins"):`Member${inGymNow>1?"s":""} in last 2h`}
                  subTrend={inGymNow>0?"up":null}
                  spark={M.spark}
                  insight={now.getHours()>=17&&now.getHours()<=19?"Peak hours right now":null}
                  delay=".15s"/>
                <KpiCard label="At-Risk Members" value={M.atRisk}
                  sub={M.atRisk>0?`${Math.round((M.atRisk/Math.max(M.totalMembers,1))*100)}% of gym inactive`:"All members active"}
                  subTrend={M.atRisk>0?"down":"up"}
                  subCtx={M.atRisk>0?"14+ days without a visit":undefined}
                  spark={M.spark} valueColor={M.atRisk>0?C.risk:undefined}
                  cta={M.atRisk>0?"View & message":undefined}
                  onCta={()=>{}}
                  insight={M.atRisk>0?"Direct outreach is most effective":null}
                  delay=".20s"/>
              </div>

              {M.atRisk>0&&<AtRiskPreview members={DATA.atRiskMembers} onMsg={()=>{}} onAll={()=>{}}/>}
              <CheckInChart data={chartData} range={range} setRange={setRange}/>
              <RevenueSection mrr={M.mrr} newRev={M.newRev} lostRev={M.lostRev}/>
              <MemberGrowth newSignUps={M.newSignUps} cancelled={M.cancelledEst}
                retention={M.retentionRate} growthData={DATA.growthData}/>
              <ActivityFeed items={DATA.activity} now={now}/>
            </div>

            {/* ── right sidebar ── */}
            <div style={{display:"flex",flexDirection:"column",gap:12,
              position:"sticky",top:58}}>
              <ActionItems atRisk={M.atRisk} checkIns={DATA.checkIns}
                posts={DATA.posts} challenges={DATA.challenges} now={now}
                newNoReturn={DATA.newNoReturn} onMsg={()=>{}} onView={()=>{}}/>
              <QuickActions/>
              <RetentionBreak breakdown={DATA.retBreak} onAll={()=>{}}/>
              <WeekOneReturn data={DATA.week1} onMsg={()=>{}}/>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
