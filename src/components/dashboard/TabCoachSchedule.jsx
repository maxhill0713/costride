/**
 * TabCoachContent — ContentPage gold-standard layout with all coach content:
 * Workout Plans · Nutrition Plans · Programs · Sessions · Challenges · Posts
 * Header + notification ticker · right sidebar (stats/chart/dial) · mobile FAB
 * Zero external dependencies. Fully prop-driven.
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus, Flame, Check, Clock, Users, RefreshCw,
  ChevronDown, Trash2, Pencil, X, Send,
  BarChart2, Search, Calendar, Dumbbell, Utensils,
  Target, Award, FileText, Layers, UserPlus,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ─── TOKENS ────────────────────────────────────────────────── */
const C = {
  bg:     '#000000',
  sidebar:'#0f0f12',
  card:   '#141416',
  card2:  '#1a1a1f',
  brd:    '#222226',
  brd2:   '#2a2a30',
  t1:     '#ffffff',
  t2:     '#8a8a94',
  t3:     '#444450',
  cyan:   '#4d7fff',
  cyanD:  'rgba(77,127,255,0.12)',
  cyanB:  'rgba(77,127,255,0.28)',
  red:    '#ff4d6d',
  redD:   'rgba(255,77,109,0.15)',
  redB:   'rgba(255,77,109,0.3)',
  amber:  '#f59e0b',
  amberD: 'rgba(245,158,11,0.13)',
  amberB: 'rgba(245,158,11,0.28)',
  green:  '#22c55e',
  greenD: 'rgba(34,197,94,0.12)',
  greenB: 'rgba(34,197,94,0.28)',
  blue:   '#3b82f6',
  blueD:  'rgba(59,130,246,0.12)',
  blueB:  'rgba(59,130,246,0.28)',
  violet: '#7c3aed',
  violetD:'rgba(124,58,237,0.12)',
  violetB:'rgba(124,58,237,0.28)',
};
const FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";
const GRAD = { background:'#2563eb', border:'none', color:'#fff' };

/* ─── CSS ────────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('tcc2-css')) {
  const s = document.createElement('style');
  s.id = 'tcc2-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .tcc2*{box-sizing:border-box}
    .tcc2{font-family:'DM Sans','Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
    @keyframes tcc2SlideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(-110%);opacity:0}}
    @keyframes tcc2SlideInR{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes tcc2FadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    @keyframes tcc2ModalIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:none}}
    @keyframes tcc2Pulse{0%,100%{opacity:.5}50%{opacity:1}}
    .tcc2-fu{animation:tcc2FadeUp .35s cubic-bezier(.16,1,.3,1) both}
    .tcc2-card{transition:border-color .15s,box-shadow .15s}
    .tcc2-card:hover{border-color:rgba(77,127,255,0.28)!important;box-shadow:0 0 8px rgba(77,127,255,.07)}
    .tcc2-btn{font-family:'DM Sans','Segoe UI',sans-serif;cursor:pointer;outline:none;border:none;transition:all .18s cubic-bezier(.16,1,.3,1);display:inline-flex;align-items:center;gap:6px}
    .tcc2-scr::-webkit-scrollbar{width:3px}
    .tcc2-scr::-webkit-scrollbar-thumb{background:#222226;border-radius:3px}
    .tcc2-input{width:100%;background:rgba(255,255,255,0.03);border:1px solid #222226;color:#fff;font-size:13px;font-family:'DM Sans','Segoe UI',sans-serif;outline:none;border-radius:8px;padding:10px 14px;transition:all .18s}
    .tcc2-input:focus{border-color:rgba(77,127,255,0.4);background:rgba(77,127,255,0.04)}
    .tcc2-input::placeholder{color:#444450}
    .tcc2-row{transition:background .1s;cursor:pointer}
    .tcc2-row:hover{background:#1a1a1e!important}
    @media(max-width:768px){.tcc2-sidebar{display:none!important}}
  `;
  document.head.appendChild(s);
}

/* ─── CONSTANTS ──────────────────────────────────────────────── */
const TABS = ['Workout Plans','Nutrition Plans','Programs','Sessions','Challenges','Posts'];
const TAB_ACTION = {
  'Workout Plans':   { label:'+ Plan',      modal:'workout_plan'   },
  'Nutrition Plans': { label:'+ Nutrition', modal:'nutrition_plan' },
  'Programs':        { label:'+ Program',   modal:'program'        },
  'Sessions':        { label:'+ Session',   modal:'session'        },
  'Challenges':      { label:'+ Challenge', modal:'challenge'      },
  'Posts':           { label:'+ Post',      modal:'post'           },
};
const TAB_ICONS = {
  'Workout Plans':   Dumbbell,
  'Nutrition Plans': Utensils,
  'Programs':        Layers,
  'Sessions':        Calendar,
  'Challenges':      Award,
  'Posts':           FileText,
};
const WORKOUT_TYPES = ['Strength','Cardio','HIIT','Flexibility','Circuit','Sport-Specific'];
const AV_COLORS = ['#4d7fff','#22c55e','#f59e0b','#ff4d6d','#a78bfa','#06b6d4','#f97316','#14b8a6'];
const DIFF_COLORS = {
  Beginner:     { color:C.green,  bg:'rgba(34,197,94,0.12)',   bdr:'rgba(34,197,94,0.28)'   },
  Intermediate: { color:'#f59e0b', bg:'rgba(245,158,11,0.13)', bdr:'rgba(245,158,11,0.28)' },
  Advanced:     { color:'#ff4d6d', bg:'rgba(255,77,109,0.15)', bdr:'rgba(255,77,109,0.3)'  },
  Elite:        { color:'#7c3aed', bg:'rgba(124,58,237,0.12)', bdr:'rgba(124,58,237,0.28)' },
};
const POST_TYPE_STYLES = {
  announcement:{ label:'Announcement', color:'#60a5fa', bg:'rgba(96,165,250,0.12)',  border:'rgba(96,165,250,0.28)'  },
  achievement: { label:'Achievement',  color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.28)'  },
  tip:         { label:'Fitness Tip',  color:'#a78bfa', bg:'rgba(167,139,250,0.12)', border:'rgba(167,139,250,0.28)' },
  workout:     { label:'Workout',      color:'#4d7fff', bg:'rgba(77,127,255,0.12)',  border:'rgba(77,127,255,0.28)'  },
  offer:       { label:'Offer',        color:'#ff4d6d', bg:'rgba(255,77,109,0.12)',  border:'rgba(255,77,109,0.28)'  },
};

/* ─── HELPERS ────────────────────────────────────────────────── */
function timeAgo(str) {
  if (!str) return '';
  let d = new Date(str);
  if (isNaN(d.getTime())) return '';
  if (typeof str==='string' && !str.endsWith('Z') && !str.match(/[+-]\d{2}:\d{2}$/)) d = new Date(str+'Z');
  const s = (Date.now()-d.getTime())/1000;
  if (s<60)       return 'just now';
  if (s<3600)     return `${Math.floor(s/60)}m ago`;
  if (s<86400)    return `${Math.floor(s/3600)}h ago`;
  if (s<86400*7)  return `${Math.floor(s/86400)}d ago`;
  return d.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
}

function buildDailyData(workoutPlans, nutritionPlans, sessions, posts) {
  const now = new Date();
  return Array.from({length:7},(_,i)=>{
    const date = new Date(now);
    date.setDate(date.getDate()-(6-i));
    date.setHours(0,0,0,0);
    const s=date.getTime(), e=s+86400000;
    const lbl = i===6?'Today':date.toLocaleDateString('en-GB',{weekday:'short'});
    const inDay = str => {
      if (!str) return false;
      let d=new Date(str);
      if (typeof str==='string'&&!str.endsWith('Z')&&!str.match(/[+-]\d{2}:\d{2}$/)) d=new Date(str+'Z');
      return d.getTime()>=s && d.getTime()<e;
    };
    let v=0;
    [...workoutPlans,...nutritionPlans].forEach(p=>{ if(inDay(p.created_date||p.created_at)) v++; });
    sessions.forEach(s2=>{ if(inDay(s2.session_date||s2.created_date)) v++; });
    posts.forEach(p=>{ if(inDay(p.created_date||p.created_at)) v++; });
    return {label:lbl,v};
  });
}

/* ─── MOBILE HOOK ────────────────────────────────────────────── */
function useIsMobile(bp=768) {
  const [m,setM]=useState(typeof window!=='undefined'?window.innerWidth<bp:false);
  useEffect(()=>{const h=()=>setM(window.innerWidth<bp);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[bp]);
  return m;
}

/* ─── NOTIFICATION TICKER ────────────────────────────────────── */
function NotificationTicker({ workoutPlans, nutritionPlans, programs, sessions, clients }) {
  const msgs = useMemo(()=>{
    const out=[];
    const tp=workoutPlans.length+nutritionPlans.length;
    if (tp>0) out.push(`${tp} plan${tp!==1?'s':''} ready to assign to clients`);
    const ap=programs.filter(p=>!p.end_date||new Date(p.end_date)>=new Date()).length;
    if (ap>0) out.push(`${ap} active training program${ap!==1?'s':''} in progress`);
    const us=sessions.filter(s=>s.session_date&&new Date(s.session_date)>new Date()).length;
    if (us>0) out.push(`${us} session${us!==1?'s':''} scheduled`);
    if (clients.length>0) out.push(`${clients.length} client${clients.length!==1?'s':''} on your roster`);
    if (!out.length) out.push('Create your first workout plan to get started');
    return out;
  },[workoutPlans,nutritionPlans,programs,sessions,clients]);

  const idxRef=useRef(0);
  const [idx,setIdx]=useState(0);
  const [prevIdx,setPrevIdx]=useState(null);
  const [trans,setTrans]=useState(false);

  useEffect(()=>{
    if (msgs.length<=1) return;
    const id=setInterval(()=>{
      const prev=idxRef.current,next=(prev+1)%msgs.length;
      idxRef.current=next;setPrevIdx(prev);setIdx(next);setTrans(true);
      setTimeout(()=>{setPrevIdx(null);setTrans(false);},800);
    },12000);
    return()=>clearInterval(id);
  },[msgs.length]);

  return (
    <div style={{width:'100%',height:37,background:'rgba(77,127,255,0.11)',borderRadius:4,overflow:'hidden',position:'relative',display:'flex',alignItems:'center'}}>
      {trans&&prevIdx!==null&&<span style={{position:'absolute',left:0,right:0,textAlign:'center',fontSize:11.5,fontWeight:600,color:'#93c5fd',fontFamily:FONT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',padding:'0 14px',animation:'tcc2SlideOut 0.8s cubic-bezier(0.4,0,0.2,1) forwards'}}>{msgs[prevIdx]}</span>}
      <span key={idx} style={{position:'absolute',left:0,right:0,textAlign:'center',fontSize:11.5,fontWeight:600,color:'#93c5fd',fontFamily:FONT,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',padding:'0 14px',animation:trans?'tcc2SlideInR 0.8s cubic-bezier(0.4,0,0.2,1) forwards':'none'}}>{msgs[idx]}</span>
    </div>
  );
}

/* ─── CHART TOOLTIP ──────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:'#111c2a',border:`1px solid ${C.cyanB}`,borderRadius:7,padding:'5px 10px',fontSize:11.5,color:C.t1}}>
      <div style={{fontSize:10,color:C.t3,marginBottom:2}}>{label}</div>
      <span style={{color:C.cyan,fontWeight:700}}>{payload[0].value} activities</span>
    </div>
  );
}

/* ─── ACTIVITY DIAL ──────────────────────────────────────────── */
function ActivityDial({ pct }) {
  const R=62,cx=76,cy=72,c=Math.max(0,Math.min(100,pct));
  const angle=Math.PI-(c/100)*Math.PI;
  const x=cx+R*Math.cos(angle),y=cy-R*Math.sin(angle);
  const trackD=`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`;
  const fillD=c===0?'':c>=100?trackD:`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  const dc=c<30?C.red:c<60?C.amber:C.green;
  const dl=c<30?'Low':c<60?'Moderate':c<85?'Good':'Excellent';
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:'100%'}}>
      <svg width="152" height="90" viewBox="0 0 152 90" style={{overflow:'visible'}}>
        <path d={trackD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
        {fillD&&<path d={fillD} fill="none" stroke={dc} strokeWidth="10" strokeLinecap="round" strokeOpacity="0.85"/>}
        {c>0&&<circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="6" fill={dc}/>}
        <text x={cx} y={cy-4} textAnchor="middle" style={{fontSize:22,fontWeight:800,fill:'#fff',fontFamily:"'DM Sans',sans-serif"}}>{c}%</text>
        <text x={cx} y={cy+14} textAnchor="middle" style={{fontSize:10,fontWeight:700,fill:dc,fontFamily:"'DM Sans',sans-serif"}}>{dl}</text>
      </svg>
      <div style={{display:'flex',justifyContent:'space-between',width:'100%',marginTop:2}}>
        <span style={{fontSize:9,color:C.t3,fontWeight:600}}>0%</span>
        <span style={{fontSize:9,color:C.t3,fontWeight:600}}>100%</span>
      </div>
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
function RightSidebar({ workoutPlans, nutritionPlans, programs, sessions, challenges, posts, clients, interactionsToday, onTabChange }) {
  const chartData = useMemo(()=>buildDailyData(workoutPlans,nutritionPlans,sessions,posts),[workoutPlans,nutritionPlans,sessions,posts]);
  const activeProgs      = programs.filter(p=>!p.end_date||new Date(p.end_date)>=new Date()).length;
  const upcomingSess     = sessions.filter(s=>s.session_date&&new Date(s.session_date)>new Date()).length;
  const activeChallenges = challenges.filter(c=>!c.end_date||new Date(c.end_date)>=new Date()).length;
  const totalPlans       = workoutPlans.length+nutritionPlans.length;
  const WEEK             = 7*86400000;
  const recentSess       = sessions.filter(s=>{ const d=s.session_date||s.created_date; return d&&(Date.now()-new Date(d).getTime())<WEEK; }).length;
  const activePct        = clients.length>0?Math.min(100,Math.round(recentSess/clients.length*100)):0;

  const stats=[
    {label:'Total Plans',      val:totalPlans,        col:C.cyan,   tab:'Workout Plans'},
    {label:'Active Programs',  val:activeProgs,       col:'#7c3aed',tab:'Programs'      },
    {label:'Sessions / week',  val:upcomingSess,      col:C.green,  tab:'Sessions'      },
    {label:'Live Challenges',  val:activeChallenges,  col:C.amber,  tab:'Challenges'    },
  ];

  return (
    <div className="tcc2-sidebar" style={{width:244,flexShrink:0,background:C.sidebar,borderLeft:`1px solid ${C.brd}`,display:'flex',flexDirection:'column',fontFamily:FONT,alignSelf:'flex-start'}}>
      <div style={{padding:'16px 16px 12px',borderBottom:`1px solid ${C.brd}`}}>
        <div style={{fontSize:12,fontWeight:700,color:C.t1}}>Content Overview</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1px',background:C.brd,borderBottom:`1px solid ${C.brd}`}}>
        {stats.map((s,i)=>(
          <div key={i} onClick={()=>s.tab&&onTabChange?.(s.tab)} style={{padding:'12px 14px',background:C.sidebar,cursor:'pointer',transition:'background 0.12s'}}
            onMouseEnter={e=>e.currentTarget.style.background=C.cyanD}
            onMouseLeave={e=>e.currentTarget.style.background=C.sidebar}>
            <div style={{fontSize:10,color:C.t3,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:s.col,lineHeight:1}}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'16px 16px 14px',borderBottom:`1px solid ${C.brd}`}}>
        <div style={{fontSize:10,color:C.t3,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>Client Activity</div>
        <div style={{fontSize:38,fontWeight:700,color:C.t1,letterSpacing:'-0.03em',lineHeight:1}}>{interactionsToday}</div>
        <div style={{fontSize:11,color:C.t3,marginTop:5}}>interactions today</div>
      </div>
      <div style={{padding:'14px 16px 12px 4px',borderBottom:`1px solid ${C.brd}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,padding:'0 12px'}}>
          <span style={{fontSize:12,fontWeight:600,color:C.t1}}>Activity This Week</span>
          <span style={{fontSize:10,color:C.t3}}>7d</span>
        </div>
        <ResponsiveContainer width="100%" height={108}>
          <AreaChart data={chartData} margin={{top:4,right:22,bottom:0,left:-24}}>
            <defs>
              <linearGradient id="tcc2IG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.cyan} stopOpacity={0.35}/>
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="label" tick={{fill:C.t3,fontSize:8.5,fontFamily:FONT}} axisLine={false} tickLine={false} interval={0}/>
            <YAxis tick={{fill:C.t3,fontSize:9,fontFamily:FONT}} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip/>}/>
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#tcc2IG)" dot={false} activeDot={{r:3,fill:C.cyan,strokeWidth:2,stroke:C.card}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{padding:'14px 16px 20px',minHeight:190}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <span style={{fontSize:12,fontWeight:600,color:C.t1}}>Client Activity</span>
          <span style={{fontSize:10,color:C.t3}}>7d</span>
        </div>
        <div style={{display:'flex',justifyContent:'center',marginBottom:12}}><ActivityDial pct={activePct}/></div>
        <div style={{textAlign:'center',fontSize:11,color:C.t3}}>{Math.min(recentSess,clients.length)} of {clients.length} clients active this week</div>
      </div>
    </div>
  );
}

/* ─── TABS BAR ───────────────────────────────────────────────── */
function TabsBar({ active, setActive, isMobile }) {
  return (
    <div style={{borderBottom:`1px solid ${C.brd}`,...(isMobile?{position:'sticky',top:0,zIndex:90,background:C.bg}:{})}}>
      <div style={{display:'flex',alignItems:'center',gap:2,...(isMobile?{overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}:{})}}>
        {TABS.map(tab=>{
          const Icon=TAB_ICONS[tab],on=active===tab;
          return (
            <button key={tab} onClick={()=>setActive(tab)} style={{display:'flex',alignItems:'center',gap:5,padding:isMobile?'10px 16px':'7px 14px',fontSize:12.5,background:'transparent',border:'none',borderBottom:`2px solid ${on?C.cyan:'transparent'}`,color:on?C.t1:C.t2,fontWeight:on?700:400,cursor:'pointer',marginBottom:-1,fontFamily:FONT,whiteSpace:'nowrap',flexShrink:0,minHeight:44}}>
              <Icon style={{width:13,height:13,flexShrink:0}}/>{tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── SORT DROPDOWN ──────────────────────────────────────────── */
function SortDropdown({ value, onChange, options }) {
  const [open,setOpen]=useState(false);
  const ref=useRef(null);
  const cur=options.find(o=>o.value===value)||options[0];
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',background:'rgba(255,255,255,0.04)',border:`1px solid ${open?C.cyanB:C.brd}`,borderRadius:7,color:open?C.t1:C.t2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:FONT,transition:'all .15s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.t1;}}
        onMouseLeave={e=>{if(!open){e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;}}}>
        {cur.label}<ChevronDown style={{width:12,height:12,transition:'transform .2s',transform:open?'rotate(180deg)':'none'}}/>
      </button>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 5px)',right:0,zIndex:200,background:C.card2,border:`1px solid ${C.brd}`,borderRadius:9,overflow:'hidden',minWidth:148,boxShadow:'0 8px 24px rgba(0,0,0,0.55)'}}>
          {options.map(opt=>(
            <button key={opt.value} onClick={()=>{onChange(opt.value);setOpen(false);}} style={{display:'block',width:'100%',textAlign:'left',padding:'9px 13px',background:opt.value===value?C.cyanD:'transparent',border:'none',color:opt.value===value?C.cyan:C.t2,fontSize:12,fontWeight:opt.value===value?700:500,cursor:'pointer',fontFamily:FONT}}
              onMouseEnter={e=>{if(opt.value!==value)e.currentTarget.style.background='rgba(255,255,255,0.05)'}}
              onMouseLeave={e=>{if(opt.value!==value)e.currentTarget.style.background='transparent'}}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── MICRO ──────────────────────────────────────────────────── */
function Empty({ label, Icon=FileText, onAdd, addLabel }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'56px 0',gap:14}}>
      <div style={{width:48,height:48,borderRadius:14,background:C.cyanD,border:`1px solid ${C.cyanB}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <Icon style={{width:20,height:20,color:C.cyan}}/>
      </div>
      <div style={{fontSize:13,fontWeight:600,color:C.t2,fontFamily:FONT}}>No {label} yet</div>
      {onAdd&&<button onClick={onAdd} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 16px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONT,...GRAD}}>
        <Plus style={{width:11,height:11}}/>{addLabel||`Create ${label}`}
      </button>}
    </div>
  );
}

function Pill({ children, color, bg, bdr }) {
  return <span style={{display:'inline-flex',alignItems:'center',fontSize:10,fontWeight:700,color:color||C.t2,background:bg||'rgba(138,138,148,0.08)',border:`1px solid ${bdr||'rgba(138,138,148,0.2)'}`,borderRadius:20,padding:'2.5px 8px',letterSpacing:'.04em',textTransform:'uppercase',whiteSpace:'nowrap',lineHeight:'16px',fontFamily:FONT}}>{children}</span>;
}

function Av({ name='?', size=28, avatarMap={}, userId=null }) {
  const col=AV_COLORS[name.charCodeAt(0)%AV_COLORS.length];
  const src=userId?avatarMap[userId]:null;
  const ini=name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  if (src) return <img src={src} alt={name} style={{width:size,height:size,borderRadius:'50%',flexShrink:0,objectFit:'cover',border:`1.5px solid ${col}55`}}/>;
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:col+'1a',color:col,fontSize:size*0.32,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',border:`1.5px solid ${col}33`,fontFamily:'monospace'}}>{ini}</div>;
}

function ConfirmDelete({ title, detail, onConfirm, onClose }) {
  const [busy,setBusy]=useState(false);
  return (
    <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,0.72)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:C.card,border:`1px solid rgba(255,77,109,0.25)`,borderRadius:14,padding:'20px 24px',width:380,maxWidth:'90vw',display:'flex',flexDirection:'column',gap:16,animation:'tcc2ModalIn .28s cubic-bezier(.16,1,.3,1) both'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div><div style={{fontSize:15,fontWeight:800,color:C.t1}}>{title}</div>{detail&&<div style={{fontSize:12,color:C.t2,marginTop:2}}>{detail}</div>}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.t3,cursor:'pointer',display:'flex',alignItems:'center',padding:4}}><X style={{width:15,height:15}}/></button>
        </div>
        <div style={{fontSize:12.5,color:C.t2,lineHeight:1.55}}>This will permanently remove this item. <span style={{color:C.red,fontWeight:600}}>This cannot be undone.</span></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 16px',borderRadius:8,background:'transparent',border:`1px solid ${C.brd}`,color:C.t2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:FONT}}>Cancel</button>
          <button onClick={async()=>{setBusy(true);try{await onConfirm();}finally{setBusy(false);}}} disabled={busy} style={{padding:'8px 18px',borderRadius:8,background:C.red,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:busy?'not-allowed':'pointer',opacity:busy?.7:1,fontFamily:FONT}}>
            {busy?'Removing…':'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

function actionBtn(hover=false) {
  return {display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,color:C.t2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:FONT,transition:'all .15s'};
}

/* ─── WORKOUT PLANS ──────────────────────────────────────────── */
function TabWorkoutPlans({ workoutPlans, clients, avatarMap, openModal, onDelete, onEdit }) {
  const [search,setSearch]=useState('');
  const [typeF,setTypeF]=useState('All');
  const [diffF,setDiffF]=useState('All');
  const [toDel,setToDel]=useState(null);
  const filtered=useMemo(()=>{
    let l=[...workoutPlans];
    if(typeF!=='All') l=l.filter(p=>p.type===typeF);
    if(diffF!=='All') l=l.filter(p=>p.difficulty===diffF);
    if(search.trim()) l=l.filter(p=>(p.name||'').toLowerCase().includes(search.toLowerCase())||(p.description||'').toLowerCase().includes(search.toLowerCase()));
    return l;
  },[workoutPlans,typeF,diffF,search]);
  return (
    <>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}>
          <Search style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:13,height:13,color:C.t3,pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search workout plans…" className="tcc2-input" style={{paddingLeft:36}}/>
        </div>
        <SortDropdown value={typeF} onChange={setTypeF} options={[{value:'All',label:'All Types'},...WORKOUT_TYPES.map(t=>({value:t,label:t}))]}/>
        <SortDropdown value={diffF} onChange={setDiffF} options={[{value:'All',label:'All Levels'},{value:'Beginner',label:'Beginner'},{value:'Intermediate',label:'Intermediate'},{value:'Advanced',label:'Advanced'},{value:'Elite',label:'Elite'}]}/>
        <button onClick={()=>openModal?.('workout_plan')} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONT,...GRAD}}>
          <Plus style={{width:12,height:12}}/>Create Plan
        </button>
      </div>
      <div style={{fontSize:12,fontWeight:500,color:C.t2,marginBottom:12}}>{filtered.length} workout plan{filtered.length!==1?'s':''}</div>
      {filtered.length===0 ? <Empty label="workout plans" Icon={Dumbbell} onAdd={()=>openModal?.('workout_plan')} addLabel="Create Workout Plan"/> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
          {filtered.map(plan=>{
            const d=DIFF_COLORS[plan.difficulty]||{color:C.t2,bg:'rgba(138,138,148,0.08)',bdr:'rgba(138,138,148,0.2)'};
            const typeColMap={Strength:C.red,Cardio:C.cyan,HIIT:C.amber,Flexibility:C.green,Circuit:'#7c3aed','Sport-Specific':C.blue};
            const tc=typeColMap[plan.type]||C.t2;
            const assigned=(plan.assigned_clients||[]).length;
            return (
              <div key={plan.id} className="tcc2-card" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'14px 16px 12px',borderBottom:`1px solid ${C.brd}`}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{plan.name||'Untitled Plan'}</div>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                        {plan.type&&<span style={{fontSize:10,fontWeight:700,color:tc,background:tc+'15',border:`1px solid ${tc}30`,borderRadius:20,padding:'2px 8px',textTransform:'uppercase',letterSpacing:'.04em'}}>{plan.type}</span>}
                        {plan.difficulty&&<Pill color={d.color} bg={d.bg} bdr={d.bdr}>{plan.difficulty}</Pill>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:4,flexShrink:0,marginLeft:8}}>
                      <button onClick={()=>onEdit?.(plan)} style={{width:28,height:28,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${C.brd}`,color:C.t3,cursor:'pointer',transition:'all .15s'}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.cyan;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t3;}}><Pencil style={{width:11,height:11}}/></button>
                      <button onClick={()=>setToDel(plan)} style={{width:28,height:28,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${C.brd}`,color:C.t3,cursor:'pointer',transition:'all .15s'}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t3;}}><Trash2 style={{width:11,height:11}}/></button>
                    </div>
                  </div>
                  {plan.description&&<div style={{fontSize:11.5,color:C.t2,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{plan.description}</div>}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',borderBottom:`1px solid ${C.brd}`}}>
                  {[
                    {label:'Exercises',val:plan.exercises?.length||plan.exercise_count||'—',col:C.cyan},
                    {label:'Duration', val:plan.duration_weeks?`${plan.duration_weeks}wk`:plan.duration||'—',col:C.t1},
                    {label:'Assigned', val:assigned,col:assigned>0?C.green:C.t3},
                  ].map((s,i)=>(
                    <div key={i} style={{padding:'10px 12px',borderRight:i<2?`1px solid ${C.brd}`:'none',textAlign:'center'}}>
                      <div style={{fontSize:16,fontWeight:700,color:s.col,lineHeight:1}}>{s.val}</div>
                      <div style={{fontSize:9.5,color:C.t3,textTransform:'uppercase',letterSpacing:'.05em',marginTop:3}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Exercises preview */}
                {plan.exercises?.length>0&&(
                  <div style={{padding:'8px 16px',borderBottom:`1px solid ${C.brd}`,display:'flex',gap:4,flexWrap:'wrap'}}>
                    {plan.exercises.slice(0,4).map((ex,i)=>(
                      <span key={i} style={{fontSize:10,color:C.t3,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,borderRadius:6,padding:'2px 7px'}}>{typeof ex==='string'?ex:ex.name||`Ex ${i+1}`}</span>
                    ))}
                    {plan.exercises.length>4&&<span style={{fontSize:10,color:C.t3}}>+{plan.exercises.length-4} more</span>}
                  </div>
                )}
                <div style={{padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontSize:10.5,color:C.t3}}>{plan.created_date?timeAgo(plan.created_date):'—'}</div>
                  <button onClick={()=>openModal?.('assign_plan',plan)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,background:C.cyanD,border:`1px solid ${C.cyanB}`,color:C.cyan,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:FONT}}>
                    <UserPlus style={{width:11,height:11}}/>Assign
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {toDel&&<ConfirmDelete title="Remove Workout Plan" detail={toDel.name} onConfirm={async()=>{await onDelete?.(toDel.id);setToDel(null);}} onClose={()=>setToDel(null)}/>}
    </>
  );
}

/* ─── NUTRITION PLANS ────────────────────────────────────────── */
function TabNutritionPlans({ nutritionPlans, openModal, onDelete, onEdit }) {
  const [search,setSearch]=useState('');
  const [toDel,setToDel]=useState(null);
  const filtered=useMemo(()=>{
    if(!search.trim()) return nutritionPlans;
    const q=search.toLowerCase();
    return nutritionPlans.filter(p=>(p.name||'').toLowerCase().includes(q)||(p.goal||'').toLowerCase().includes(q));
  },[nutritionPlans,search]);
  const GOAL_COLS={'Weight Loss':C.red,'Muscle Gain':C.cyan,'Maintenance':C.green,'Performance':C.amber,'Cutting':C.red,'Bulking':C.blue};
  return (
    <>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}>
          <Search style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',width:13,height:13,color:C.t3,pointerEvents:'none'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search nutrition plans…" className="tcc2-input" style={{paddingLeft:36}}/>
        </div>
        <button onClick={()=>openModal?.('nutrition_plan')} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONT,...GRAD}}>
          <Plus style={{width:12,height:12}}/>Create Plan
        </button>
      </div>
      <div style={{fontSize:12,fontWeight:500,color:C.t2,marginBottom:12}}>{filtered.length} nutrition plan{filtered.length!==1?'s':''}</div>
      {filtered.length===0 ? <Empty label="nutrition plans" Icon={Utensils} onAdd={()=>openModal?.('nutrition_plan')} addLabel="Create Nutrition Plan"/> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
          {filtered.map(plan=>{
            const gc=GOAL_COLS[plan.goal]||C.t2;
            const assigned=(plan.assigned_clients||[]).length;
            const totalMacros=(plan.protein||0)+(plan.carbs||0)+(plan.fat||0);
            return (
              <div key={plan.id} className="tcc2-card" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'14px 16px 12px',borderBottom:`1px solid ${C.brd}`}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{plan.name||'Untitled Plan'}</div>
                      {plan.goal&&<span style={{fontSize:10,fontWeight:700,color:gc,background:gc+'15',border:`1px solid ${gc}30`,borderRadius:20,padding:'2px 8px',textTransform:'uppercase',letterSpacing:'.04em'}}>{plan.goal}</span>}
                    </div>
                    <div style={{display:'flex',gap:4,flexShrink:0,marginLeft:8}}>
                      <button onClick={()=>onEdit?.(plan)} style={{width:28,height:28,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${C.brd}`,color:C.t3,cursor:'pointer',transition:'all .15s'}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.cyan;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t3;}}><Pencil style={{width:11,height:11}}/></button>
                      <button onClick={()=>setToDel(plan)} style={{width:28,height:28,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${C.brd}`,color:C.t3,cursor:'pointer',transition:'all .15s'}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t3;}}><Trash2 style={{width:11,height:11}}/></button>
                    </div>
                  </div>
                  {plan.description&&<div style={{fontSize:11.5,color:C.t2,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{plan.description}</div>}
                </div>
                {/* Macros */}
                {(plan.calories||plan.protein||plan.carbs||plan.fat)&&(
                  <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.brd}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      {[{l:'Calories',v:plan.calories?`${plan.calories}kcal`:'—',c:C.amber},{l:'Protein',v:plan.protein?`${plan.protein}g`:'—',c:C.cyan},{l:'Carbs',v:plan.carbs?`${plan.carbs}g`:'—',c:C.green},{l:'Fat',v:plan.fat?`${plan.fat}g`:'—',c:C.red}].map((m,i)=>(
                        <div key={i} style={{textAlign:'center'}}>
                          <div style={{fontSize:13,fontWeight:700,color:m.c}}>{m.v}</div>
                          <div style={{fontSize:9.5,color:C.t3,textTransform:'uppercase',letterSpacing:'.05em'}}>{m.l}</div>
                        </div>
                      ))}
                    </div>
                    {totalMacros>0&&(
                      <div style={{height:4,borderRadius:99,overflow:'hidden',display:'flex',gap:1}}>
                        {[{v:plan.protein||0,c:C.cyan},{v:plan.carbs||0,c:C.green},{v:plan.fat||0,c:C.red}].map((m,i)=>(
                          <div key={i} style={{flex:m.v,background:m.c,opacity:.75,minWidth:m.v>0?3:0}}/>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* Meals preview */}
                {plan.meals?.length>0&&(
                  <div style={{padding:'8px 16px',borderBottom:`1px solid ${C.brd}`}}>
                    <div style={{fontSize:10,color:C.t3,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:5}}>Meals ({plan.meals.length})</div>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {plan.meals.slice(0,4).map((m,i)=>(
                        <span key={i} style={{fontSize:10,color:C.t3,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,borderRadius:6,padding:'2px 7px'}}>{typeof m==='string'?m:m.name||`Meal ${i+1}`}</span>
                      ))}
                      {plan.meals.length>4&&<span style={{fontSize:10,color:C.t3}}>+{plan.meals.length-4} more</span>}
                    </div>
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',borderBottom:`1px solid ${C.brd}`}}>
                  {[{label:'Meals/day',val:plan.meals_per_day||plan.meal_count||plan.meals?.length||'—',col:C.t1},{label:'Assigned',val:assigned,col:assigned>0?C.green:C.t3}].map((s,i)=>(
                    <div key={i} style={{padding:'10px 12px',borderRight:i<1?`1px solid ${C.brd}`:'none',textAlign:'center'}}>
                      <div style={{fontSize:16,fontWeight:700,color:s.col,lineHeight:1}}>{s.val}</div>
                      <div style={{fontSize:9.5,color:C.t3,textTransform:'uppercase',letterSpacing:'.05em',marginTop:3}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:'10px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontSize:10.5,color:C.t3}}>{plan.created_date?timeAgo(plan.created_date):'—'}</div>
                  <button onClick={()=>openModal?.('assign_nutrition',plan)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,background:C.cyanD,border:`1px solid ${C.cyanB}`,color:C.cyan,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:FONT}}>
                    <UserPlus style={{width:11,height:11}}/>Assign
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {toDel&&<ConfirmDelete title="Remove Nutrition Plan" detail={toDel.name} onConfirm={async()=>{await onDelete?.(toDel.id);setToDel(null);}} onClose={()=>setToDel(null)}/>}
    </>
  );
}

/* ─── PROGRAMS ───────────────────────────────────────────────── */
function TabPrograms({ programs, openModal, onDelete }) {
  const [toDel,setToDel]=useState(null);
  const [rerunning,setRerunning]=useState(null);
  const nowDate=new Date();
  const live=programs.filter(p=>!p.end_date||new Date(p.end_date)>=nowDate);
  const ended=programs.filter(p=>p.end_date&&new Date(p.end_date)<nowDate);
  const btnSty={display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,color:C.t2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:FONT,transition:'all .15s'};
  const Card=({prog,showRerun})=>{
    const enrolled=(prog.enrolled_clients||prog.participants||[]).length;
    const weeks=prog.duration_weeks||prog.weeks||'—';
    const phases=(prog.phases||[]).length;
    return (
      <div className="tcc2-card" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,marginBottom:10,overflow:'hidden'}}>
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.brd}`}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
            <div style={{width:42,height:42,borderRadius:10,flexShrink:0,background:C.violetD||'rgba(124,58,237,0.12)',border:`1px solid ${C.violetB||'rgba(124,58,237,0.28)'}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Layers style={{width:18,height:18,color:'#7c3aed'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:4}}>{prog.name||'Training Program'}</div>
              {prog.description&&<div style={{fontSize:11.5,color:C.t2,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{prog.description}</div>}
            </div>
            <button onClick={()=>setToDel(prog)} style={{width:28,height:28,borderRadius:7,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:'transparent',border:`1px solid ${C.brd}`,color:C.t3,cursor:'pointer',transition:'all .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t3;}}><Trash2 style={{width:11,height:11}}/></button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',borderBottom:`1px solid ${C.brd}`}}>
          {[{label:'Duration',val:weeks!=='—'?`${weeks} wk`:weeks,col:C.t1},{label:'Phases',val:phases||'—',col:'#7c3aed'},{label:'Enrolled',val:enrolled,col:enrolled>0?C.green:C.t3},{label:'Status',val:showRerun?'Ended':'Active',col:showRerun?C.t3:C.green}].map((s,i)=>(
            <div key={i} style={{padding:'10px 12px',borderRight:i<3?`1px solid ${C.brd}`:'none',textAlign:'center'}}>
              <div style={{fontSize:14,fontWeight:700,color:s.col,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:9.5,color:C.t3,textTransform:'uppercase',letterSpacing:'.05em',marginTop:3}}>{s.label}</div>
            </div>
          ))}
        </div>
        {(prog.workout_plan_names||prog.nutrition_plan_name)&&(
          <div style={{padding:'8px 16px',borderBottom:`1px solid ${C.brd}`,display:'flex',gap:6,flexWrap:'wrap'}}>
            {(prog.workout_plan_names||[]).map((n,i)=><span key={i} style={{fontSize:10,color:C.red,background:C.redD,border:`1px solid ${C.redB}`,borderRadius:6,padding:'2px 7px',display:'flex',alignItems:'center',gap:3}}><Dumbbell style={{width:8,height:8}}/>{n}</span>)}
            {prog.nutrition_plan_name&&<span style={{fontSize:10,color:C.green,background:C.greenD,border:`1px solid ${C.greenB}`,borderRadius:6,padding:'2px 7px',display:'flex',alignItems:'center',gap:3}}><Utensils style={{width:8,height:8}}/>{prog.nutrition_plan_name}</span>}
          </div>
        )}
        {(prog.start_date||prog.end_date)&&<div style={{padding:'8px 16px',borderBottom:`1px solid ${C.brd}`,fontSize:11,color:C.t3}}>{prog.start_date&&`Start: ${prog.start_date}`}{prog.start_date&&prog.end_date&&' → '}{prog.end_date&&`End: ${prog.end_date}`}</div>}
        <div style={{padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
          <button onClick={()=>openModal?.('assign_program',prog)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,background:C.cyanD,border:`1px solid ${C.cyanB}`,color:C.cyan,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:FONT}}>
            <UserPlus style={{width:11,height:11}}/>Enrol Client
          </button>
          {showRerun&&(
            <button disabled={rerunning===prog.id} onClick={async()=>{setRerunning(prog.id);try{await new Promise(r=>setTimeout(r,600));}finally{setRerunning(null);}}} style={btnSty}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.cyan;e.currentTarget.style.background=C.cyanD;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
              <RefreshCw style={{width:11,height:11}}/>{rerunning===prog.id?'Re-running…':'Re-run Program'}
            </button>
          )}
        </div>
      </div>
    );
  };
  return (
    <>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,marginTop:2}}>
        <div style={{fontSize:12,fontWeight:500,color:C.t2}}>{live.length} active program{live.length!==1?'s':''}</div>
        <button onClick={()=>openModal?.('program')} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONT,...GRAD}}>
          <Plus style={{width:12,height:12}}/>Create Program
        </button>
      </div>
      {live.length===0?<Empty label="active programs" Icon={Layers} onAdd={()=>openModal?.('program')} addLabel="Create Program"/>:live.map(p=><Card key={p.id} prog={p} showRerun={false}/>)}
      {ended.length>0&&<>
        <div style={{fontSize:12,fontWeight:700,color:C.t2,margin:'20px 0 10px',paddingTop:12,borderTop:`1px solid ${C.brd}`,textTransform:'uppercase',letterSpacing:'0.08em'}}>Ended Programs</div>
        {ended.map(p=><Card key={p.id} prog={p} showRerun/>)}
      </>}
      {toDel&&<ConfirmDelete title="Remove Program" detail={toDel.name} onConfirm={async()=>{await onDelete?.(toDel.id);setToDel(null);}} onClose={()=>setToDel(null)}/>}
    </>
  );
}

/* ─── SESSIONS ───────────────────────────────────────────────── */
function TabSessions({ sessions, clients, avatarMap, openModal, now }) {
  const nowMs=now?new Date(now).getTime():Date.now();
  const upcoming=[...sessions.filter(s=>s.session_date&&new Date(s.session_date).getTime()>nowMs)].sort((a,b)=>new Date(a.session_date)-new Date(b.session_date));
  const past=[...sessions.filter(s=>s.session_date&&new Date(s.session_date).getTime()<=nowMs)].sort((a,b)=>new Date(b.session_date)-new Date(a.session_date)).slice(0,12);
  const statusCols={confirmed:C.cyan,attended:C.green,no_show:C.red,cancelled:C.t3,pending:C.amber};
  const Card=({session,isPast})=>{
    const d=new Date(session.session_date);
    const dateLabel=d.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'});
    const timeLabel=d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    const cName=session.client_name||session.member_name||'Client';
    const status=session.status||'confirmed';
    const sc=statusCols[status]||C.cyan;
    return (
      <div className="tcc2-card" style={{background:C.card,border:`1px solid ${isPast?C.brd:C.cyanB}`,borderRadius:10,padding:'13px 16px',marginBottom:8,display:'flex',alignItems:'center',gap:12,opacity:isPast?.75:1}}>
        <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:isPast?'rgba(255,255,255,0.04)':C.cyanD,border:`1px solid ${isPast?C.brd:C.cyanB}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontSize:17,fontWeight:700,color:isPast?C.t3:C.cyan,lineHeight:1}}>{d.getDate()}</div>
          <div style={{fontSize:8,color:isPast?C.t3:C.cyan,fontWeight:600,textTransform:'uppercase'}}>{d.toLocaleDateString('en-GB',{month:'short'})}</div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:3}}>{session.session_name||session.class_name||'Coaching Session'}</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <Av name={cName} size={20} avatarMap={avatarMap} userId={session.client_id||session.member_id}/>
            <span style={{fontSize:11.5,color:C.t2}}>{cName}</span>
          </div>
        </div>
        {session.notes&&<div style={{fontSize:11,color:C.t3,maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{session.notes}</div>}
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontSize:12,fontWeight:700,color:isPast?C.t3:C.cyan}}>{timeLabel}</div>
          <div style={{fontSize:10.5,color:C.t3,marginTop:2}}>{dateLabel}</div>
        </div>
        <Pill color={sc} bg={sc+'15'} bdr={sc+'30'}>{status}</Pill>
        {!isPast&&<div style={{width:8,height:8,borderRadius:'50%',flexShrink:0,background:C.green,animation:'tcc2Pulse 2s ease infinite'}}/>}
      </div>
    );
  };
  return (
    <>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,marginTop:2}}>
        <div style={{fontSize:12,fontWeight:500,color:C.t2}}>{upcoming.length} upcoming session{upcoming.length!==1?'s':''}</div>
        <button onClick={()=>openModal?.('session')} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONT,...GRAD}}>
          <Plus style={{width:12,height:12}}/>Book Session
        </button>
      </div>
      {upcoming.length===0?<Empty label="upcoming sessions" Icon={Calendar} onAdd={()=>openModal?.('session')} addLabel="Book Session"/>:upcoming.map(s=><Card key={s.id} session={s} isPast={false}/>)}
      {past.length>0&&<>
        <div style={{fontSize:12,fontWeight:700,color:C.t2,margin:'20px 0 10px',paddingTop:12,borderTop:`1px solid ${C.brd}`,textTransform:'uppercase',letterSpacing:'0.08em'}}>Past Sessions</div>
        {past.map(s=><Card key={s.id} session={s} isPast/>)}
      </>}
    </>
  );
}

/* ─── CHALLENGES ─────────────────────────────────────────────── */
function TabChallenges({ challenges, openModal, onDelete }) {
  const [toDel,setToDel]=useState(null);
  const [rerunning,setRerunning]=useState(null);
  const nowDate=new Date();
  const live=challenges.filter(c=>!c.end_date||new Date(c.end_date)>=nowDate);
  const ended=challenges.filter(c=>c.end_date&&new Date(c.end_date)<nowDate);
  const btnSty={display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,color:C.t2,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:FONT,transition:'all .15s'};
  const Card=({ch,showRerun})=>(
    <div className="tcc2-card" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:10,padding:'13px 16px',marginBottom:8}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:3}}>{ch.title}</div>
          {ch.description&&<div style={{fontSize:11.5,color:C.t2,marginBottom:3,lineHeight:1.5}}>{ch.description}</div>}
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            {(ch.start_date||ch.end_date)&&<span style={{fontSize:11,color:C.t3}}>{ch.start_date}{ch.start_date&&ch.end_date&&' → '}{ch.end_date||'Ongoing'}</span>}
            {ch.target&&<span style={{fontSize:11,color:C.t2}}><strong>Target:</strong> {ch.target}</span>}
            <span style={{fontSize:11.5,color:C.t2}}>{(ch.participants||[]).length} joined</span>
          </div>
        </div>
        <button onClick={()=>setToDel(ch)} style={btnSty}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redD;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
          <Trash2 style={{width:12,height:12}}/><span>Remove</span>
        </button>
      </div>
      {ch.reward&&<div style={{marginTop:8,fontSize:11,color:C.amber}}><Award style={{width:10,height:10,verticalAlign:'middle',marginRight:4}}/>Reward: {ch.reward}</div>}
      {showRerun&&(
        <div style={{marginTop:10}}>
          <button disabled={rerunning===ch.id} onClick={async()=>{setRerunning(ch.id);try{await new Promise(r=>setTimeout(r,600));}finally{setRerunning(null);}}} style={btnSty}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.cyan;e.currentTarget.style.background=C.cyanD;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
            <RefreshCw style={{width:11,height:11}}/>{rerunning===ch.id?'Re-running…':'Re-run Challenge'}
          </button>
        </div>
      )}
    </div>
  );
  return (
    <>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,marginTop:2}}>
        <div style={{fontSize:12,fontWeight:500,color:C.t2}}>{live.length} live challenge{live.length!==1?'s':''}</div>
        <button onClick={()=>openModal?.('challenge')} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONT,...GRAD}}>
          <Plus style={{width:12,height:12}}/>New Challenge
        </button>
      </div>
      {live.length===0?<Empty label="live challenges" Icon={Award} onAdd={()=>openModal?.('challenge')} addLabel="New Challenge"/>:live.map(c=><Card key={c.id} ch={c} showRerun={false}/>)}
      {ended.length>0&&<>
        <div style={{fontSize:12,fontWeight:700,color:C.t2,margin:'20px 0 10px',paddingTop:12,borderTop:`1px solid ${C.brd}`,textTransform:'uppercase',letterSpacing:'0.08em'}}>Ended Challenges</div>
        {ended.map(c=><Card key={c.id} ch={c} showRerun/>)}
      </>}
      {toDel&&<ConfirmDelete title="Remove Challenge" detail={toDel.title} onConfirm={async()=>{await onDelete?.(toDel.id);setToDel(null);}} onClose={()=>setToDel(null)}/>}
    </>
  );
}

/* ─── POSTS ──────────────────────────────────────────────────── */
function TabPosts({ posts, coach, avatarMap, openModal, onDelete, onPublish }) {
  const [filter,setFilter]=useState('published');
  const [publishing,setPublishing]=useState(null);
  const PALLETE=['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#4d7fff','#10b981'];
  const nowMs=Date.now();
  const published=posts.filter(p=>!p.is_hidden&&!p.is_draft&&(!p.scheduled_date||new Date(p.scheduled_date).getTime()<=nowMs));
  const drafts   =posts.filter(p=>p.is_draft);
  const scheduled=posts.filter(p=>p.scheduled_date&&new Date(p.scheduled_date).getTime()>nowMs&&!p.is_draft);
  const visible=filter==='published'?published:filter==='drafts'?drafts:scheduled;
  const cName=coach?.name||'You';
  const avatarBg=PALLETE[(cName.charCodeAt(0)||0)%PALLETE.length];
  const cAvatar=coach?avatarMap[coach.id]||coach.avatar||null:null;
  const initials=cName.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
  return (
    <>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,marginTop:2}}>
        <div style={{display:'flex',gap:2,padding:'3px',background:C.card,border:`1px solid ${C.brd}`,borderRadius:9}}>
          {[{id:'published',label:`Published (${published.length})`},{id:'drafts',label:`Drafts (${drafts.length})`},{id:'scheduled',label:`Scheduled (${scheduled.length})`}].map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{padding:'6px 12px',borderRadius:7,fontSize:11.5,fontWeight:filter===f.id?700:400,background:filter===f.id?C.cyanD:'transparent',border:`1px solid ${filter===f.id?C.cyanB:'transparent'}`,color:filter===f.id?C.cyan:C.t3,cursor:'pointer',fontFamily:FONT,whiteSpace:'nowrap'}}>{f.label}</button>
          ))}
        </div>
        <button onClick={()=>openModal?.('post')} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONT,...GRAD}}>
          <Plus style={{width:12,height:12}}/>New Post
        </button>
      </div>
      {visible.length===0?<Empty label={filter} Icon={FileText} onAdd={()=>openModal?.('post')} addLabel="Create Post"/>:(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {visible.map(p=>{
            const pt=POST_TYPE_STYLES[p.post_type]||POST_TYPE_STYLES.announcement;
            const sched=p.scheduled_date?new Date(p.scheduled_date):null;
            const schedLabel=sched?sched.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+' at '+sched.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):null;
            return (
              <div key={p.id} className="tcc2-card" style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,height:138,display:'flex',overflow:'hidden'}}>
                {p.image_url&&<div style={{width:128,height:128,flexShrink:0,alignSelf:'center',margin:5,borderRadius:8,overflow:'hidden'}}><img src={p.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/></div>}
                <div style={{flex:1,display:'flex',overflow:'hidden'}}>
                  <div style={{flex:1,minWidth:0,padding:'10px',display:'flex',flexDirection:'column',gap:5}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:7}}>
                      <div style={{width:26,height:26,borderRadius:'50%',flexShrink:0,background:avatarBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:'#fff',overflow:'hidden'}}>
                        {cAvatar?<img src={cAvatar} alt={cName} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:initials}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                          <div style={{fontSize:12,fontWeight:700,color:C.t1,lineHeight:1.2}}>{cName}</div>
                          {p.post_type&&<span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,background:pt.bg,border:`1px solid ${pt.border}`,color:pt.color,flexShrink:0}}>{pt.label}</span>}
                          {p.is_draft&&<span style={{fontSize:9,fontWeight:700,padding:'1px 6px',borderRadius:4,background:C.amberD,border:`1px solid ${C.amberB}`,color:C.amber}}>Draft</span>}
                        </div>
                        {schedLabel?<div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><Clock style={{width:9,height:9,color:C.cyan}}/><span style={{fontSize:10,color:C.cyan,fontWeight:700}}>{schedLabel}</span></div>:<div style={{fontSize:10,color:C.t3,marginTop:2}}>{timeAgo(p.created_date||p.created_at)}</div>}
                      </div>
                    </div>
                    {p.content&&<div style={{fontSize:11.5,color:C.t2,lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{p.content}</div>}
                    {Object.keys(p.reactions||{}).length>0&&<div style={{fontSize:10,color:C.t3}}>{Object.keys(p.reactions).length} reaction{Object.keys(p.reactions).length!==1?'s':''}</div>}
                  </div>
                  <div style={{width:110,flexShrink:0,borderLeft:`1px solid ${C.brd}`,padding:'10px 8px',display:'flex',flexDirection:'column',gap:7}}>
                    <div style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.10em',color:C.t3,marginBottom:2}}>Actions</div>
                    {p.is_draft&&(
                      <button onClick={async()=>{setPublishing(p.id);try{await onPublish?.(p);}finally{setPublishing(null);}}} disabled={publishing===p.id}
                        style={{display:'flex',alignItems:'center',gap:5,width:'100%',padding:'4px 8px',borderRadius:8,fontSize:10.5,fontWeight:700,cursor:publishing===p.id?'default':'pointer',fontFamily:FONT,opacity:publishing===p.id?.6:1,...(publishing===p.id?{background:C.brd,border:'none',color:C.t3}:GRAD)}}>
                        <Plus style={{width:11,height:11}}/><span>{publishing===p.id?'Posting…':'Post Now'}</span>
                      </button>
                    )}
                    <button onClick={()=>onDelete?.(p.id)} style={{display:'flex',alignItems:'center',gap:5,width:'100%',padding:'4px 8px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.brd}`,color:C.t2,fontSize:10.5,fontWeight:600,cursor:'pointer',fontFamily:FONT,transition:'all .15s'}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redD;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
                      <Trash2 style={{width:11,height:11}}/><span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ─── FAB ────────────────────────────────────────────────────── */
function FAB({ onClick }) {
  return (
    <button onClick={onClick} style={{position:'fixed',bottom:76,right:18,zIndex:190,width:52,height:52,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 10px rgba(37,99,235,0.35)',...GRAD}}>
      <Plus style={{width:22,height:22}}/>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabCoachContent({
  coach              = null,
  workoutPlans       = [],
  nutritionPlans     = [],
  programs           = [],
  sessions           = [],
  challenges         = [],
  posts              = [],
  clients            = [],
  checkIns           = [],
  bookings           = [],
  avatarMap          = {},
  now                = new Date(),
  openModal          = ()=>{},
  onDeleteWorkout    = null,
  onDeleteNutrition  = null,
  onDeleteProgram    = null,
  onDeleteChallenge  = null,
  onDeletePost       = null,
  onPublishDraft     = null,
  onEditWorkout      = null,
  onEditNutrition    = null,
}) {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState('Workout Plans');
  const [showMenu, setShowMenu] = useState(false);

  const allSessions = useMemo(()=>[
    ...sessions,
    ...bookings.filter(b=>b.session_date).map(b=>({id:b.id,session_date:b.session_date,session_name:b.session_name||b.class_name||'Coaching Session',client_name:b.client_name||b.member_name||'Client',client_id:b.client_id||b.member_id,status:b.status})),
  ],[sessions,bookings]);

  const nowMs=now?new Date(now).getTime():Date.now();
  const todayStart=new Date(nowMs); todayStart.setHours(0,0,0,0);
  const todayMs=todayStart.getTime();
  const isToday=str=>{if(!str)return false;let d=new Date(str);return d.getTime()>=todayMs;};
  const interactionsToday=[
    ...posts.filter(p=>!p.is_hidden&&isToday(p.created_date||p.created_at)),
    ...workoutPlans.filter(p=>isToday(p.created_date)),
    ...nutritionPlans.filter(p=>isToday(p.created_date)),
    ...allSessions.filter(s=>isToday(s.session_date)),
  ].length;

  const tabAction=TAB_ACTION[tab];
  const CREATE_ITEMS=[
    {label:'💪 Workout Plan',  action:()=>{openModal('workout_plan');setShowMenu(false);setTab('Workout Plans');}},
    {label:'🥗 Nutrition Plan', action:()=>{openModal('nutrition_plan');setShowMenu(false);setTab('Nutrition Plans');}},
    {label:'🏗️ Program',       action:()=>{openModal('program');setShowMenu(false);setTab('Programs');}},
    {label:'📅 Session',       action:()=>{openModal('session');setShowMenu(false);setTab('Sessions');}},
    {label:'🏆 Challenge',     action:()=>{openModal('challenge');setShowMenu(false);setTab('Challenges');}},
    {label:'📝 Post',          action:()=>{openModal('post');setShowMenu(false);setTab('Posts');}},
  ];

  return (
    <div className="tcc2" style={{display:'flex',flex:1,minHeight:0,background:C.bg,color:C.t1,fontFamily:FONT,fontSize:13,lineHeight:1.5,WebkitFontSmoothing:'antialiased'}}>
      <div style={{flex:1,overflowY:'auto',minWidth:0,...(isMobile?{paddingBottom:80}:{})}}>

        {!isMobile&&(
          <div style={{padding:'4px 16px 0 4px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative'}}>
            <h1 style={{fontSize:22,fontWeight:800,color:C.t1,margin:0,letterSpacing:'-0.03em',lineHeight:1.2,flexShrink:0}}>Content <span style={{color:C.cyan}}>Hub</span></h1>
            <div style={{position:'absolute',left:'50%',transform:'translateX(-50%)',width:'clamp(300px,52%,780px)',pointerEvents:'none'}}>
              <div style={{pointerEvents:'auto'}}>
                <NotificationTicker workoutPlans={workoutPlans} nutritionPlans={nutritionPlans} programs={programs} sessions={allSessions} clients={clients}/>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
              {tabAction&&<button onClick={()=>openModal(tabAction.modal)} style={{display:'flex',alignItems:'center',gap:4,padding:'9px 18px',borderRadius:9,fontSize:12.5,fontWeight:700,cursor:'pointer',fontFamily:FONT,...GRAD}}><Plus style={{width:12,height:12}}/>{tabAction.label.replace('+ ','')}</button>}
            </div>
          </div>
        )}

        {isMobile&&(
          <div style={{padding:'14px 16px 10px',display:'flex',alignItems:'center',justifyContent:'space-between',background:C.bg,borderBottom:`1px solid ${C.brd}`}}>
            <div>
              <div style={{fontSize:17,fontWeight:800,color:C.t1,letterSpacing:'-0.02em'}}>Content <span style={{color:C.cyan}}>Hub</span></div>
              <div style={{fontSize:11,color:C.t3,marginTop:2}}>{workoutPlans.length+nutritionPlans.length} plans · {programs.length} programs</div>
            </div>
            <button onClick={()=>setShowMenu(o=>!o)} style={{width:40,height:40,borderRadius:11,background:C.cyanD,border:`1px solid ${C.cyanB}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <BarChart2 style={{width:16,height:16,color:C.cyan}}/>
            </button>
          </div>
        )}

        <div style={{padding:isMobile?'0 0':'0 4px'}}><TabsBar active={tab} setActive={setTab} isMobile={isMobile}/></div>

        <div style={{padding:isMobile?'8px 12px 24px':'0 16px 32px 4px'}}>
          {tab==='Workout Plans'&&<TabWorkoutPlans workoutPlans={workoutPlans} clients={clients} avatarMap={avatarMap} openModal={openModal} onDelete={onDeleteWorkout} onEdit={onEditWorkout}/>}
          {tab==='Nutrition Plans'&&<TabNutritionPlans nutritionPlans={nutritionPlans} openModal={openModal} onDelete={onDeleteNutrition} onEdit={onEditNutrition}/>}
          {tab==='Programs'&&<TabPrograms programs={programs} openModal={openModal} onDelete={onDeleteProgram}/>}
          {tab==='Sessions'&&<TabSessions sessions={allSessions} clients={clients} avatarMap={avatarMap} openModal={openModal} now={now}/>}
          {tab==='Challenges'&&<TabChallenges challenges={challenges} openModal={openModal} onDelete={onDeleteChallenge}/>}
          {tab==='Posts'&&<TabPosts posts={posts} coach={coach} avatarMap={avatarMap} openModal={openModal} onDelete={onDeletePost} onPublish={onPublishDraft}/>}
        </div>
      </div>

      {!isMobile&&(
        <RightSidebar workoutPlans={workoutPlans} nutritionPlans={nutritionPlans} programs={programs} sessions={allSessions} challenges={challenges} posts={posts} clients={clients} interactionsToday={interactionsToday} onTabChange={setTab}/>
      )}

      {isMobile&&(
        <>
          <FAB onClick={()=>setShowMenu(o=>!o)}/>
          {showMenu&&(
            <>
              <div onClick={()=>setShowMenu(false)} style={{position:'fixed',inset:0,zIndex:188}}/>
              <div style={{position:'fixed',bottom:136,right:16,zIndex:189,background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,overflow:'hidden',minWidth:195,boxShadow:'0 -4px 40px rgba(0,0,0,0.8)'}}>
                {CREATE_ITEMS.map(item=>(
                  <button key={item.label} onClick={item.action} style={{width:'100%',display:'block',padding:'14px 18px',background:'transparent',border:'none',borderBottom:`1px solid ${C.brd}`,color:C.t1,fontSize:13.5,fontWeight:500,cursor:'pointer',textAlign:'left',fontFamily:FONT,minHeight:52}}>{item.label}</button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}