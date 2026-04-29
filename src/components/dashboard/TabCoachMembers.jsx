/**
 * TabCoachMembers — UI matches TabMembers gold standard.
 * Table rows · right stats panel with recharts · slide-in preview · mobile bottom sheets.
 * Fully prop-driven, zero API dependencies.
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Search, X, Phone, Calendar, Dumbbell,
  Minus, AlertTriangle, Star,
  MessageCircle, UserPlus, ChevronRight, ChevronDown,
  Edit3, Send, CheckCircle, Plus, Trash2, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Users, Flame, Shield,
  Sparkles, MoreHorizontal, Lightbulb, Heart, XCircle,
  Check, SlidersHorizontal, BarChart2, Bell,
} from 'lucide-react';

/* ─── TOKENS — identical to TabMembers ────────────────────── */
const C = {
  bg:      '#0b0b0d',
  sidebar: '#0f0f12',
  card:    '#141416',
  card2:   '#18181b',
  brd:     '#222226',
  brd2:    '#2a2a30',
  t1:      '#ffffff',
  t2:      '#8a8a94',
  t3:      '#444450',
  cyan:    '#4d7fff',
  cyanD:   'rgba(77,127,255,0.08)',
  cyanB:   'rgba(77,127,255,0.25)',
  red:     '#ff4d6d',
  redD:    'rgba(255,77,109,0.1)',
  redB:    'rgba(255,77,109,0.25)',
  amber:   '#f59e0b',
  amberD:  'rgba(245,158,11,0.1)',
  amberB:  'rgba(245,158,11,0.25)',
  green:   '#22c55e',
  greenD:  'rgba(34,197,94,0.1)',
  greenB:  'rgba(34,197,94,0.25)',
  blue:    '#3b82f6',
  blueD:   'rgba(59,130,246,0.1)',
  blueB:   'rgba(59,130,246,0.25)',
};
const FONT      = "'DM Sans','Segoe UI',sans-serif";
const AV_COLORS = ['#4d7fff','#22c55e','#f59e0b','#ff4d6d','#a78bfa','#06b6d4','#f97316','#14b8a6'];
const GRID      = '1.7fr 112px 100px 90px 150px 190px';

const COACH_ACTIONS = [
  'Check in', 'Book session', 'Send message',
  'Celebrate progress', 'Missed sessions',
  'Custom plan offer', 'Upgrade plan', 'Welcome back',
];

/* ─── CSS ─────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('tcm2-css')) {
  const s = document.createElement('style');
  s.id = 'tcm2-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .tcm2-root * { box-sizing:border-box; }
    .tcm2-root { font-family:'DM Sans','Segoe UI',sans-serif; -webkit-font-smoothing:antialiased; }
    @keyframes tcm2FadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    @keyframes tcm2Pulse   { 0%,100%{opacity:.5} 50%{opacity:1} }
    @keyframes tcm2ModalIn { from{opacity:0;transform:scale(.94) translateY(10px)} to{opacity:1;transform:none} }
    .tcm2-fu { animation:tcm2FadeUp .35s cubic-bezier(.16,1,.3,1) both; }
    .tcm2-btn { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; border:none; transition:all .18s cubic-bezier(.16,1,.3,1); display:inline-flex; align-items:center; gap:6px; }
    .tcm2-btn:hover  { transform:translateY(-1px); }
    .tcm2-btn:active { transform:scale(.97); }
    .tcm2-row { transition:background .12s; cursor:pointer; }
    .tcm2-row:hover { background:#1a1a1e !important; }
    .tcm2-row:hover .tcm2-ra { opacity:1 !important; pointer-events:auto !important; }
    .tcm2-ra { opacity:0; pointer-events:none; transition:opacity .15s; }
    .tcm2-input { width:100%; background:rgba(255,255,255,0.03); border:1px solid #222226; color:#fff; font-size:13px; font-family:'DM Sans','Segoe UI',sans-serif; outline:none; border-radius:8px; padding:10px 14px; transition:all .18s; }
    .tcm2-input:focus { border-color:rgba(77,127,255,0.4); background:rgba(77,127,255,0.04); }
    .tcm2-input::placeholder { color:#444450; }
    .tcm2-select { background:rgba(255,255,255,0.03); border:1px solid #222226; color:#8a8a94; font-size:12px; font-family:'DM Sans','Segoe UI',sans-serif; outline:none; border-radius:8px; padding:7px 11px; cursor:pointer; }
    .tcm2-tab { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; background:none; border:none; transition:color .15s; }
    .tcm2-scr::-webkit-scrollbar { width:3px; }
    .tcm2-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    @media (max-width:1100px) { .tcm2-rp { display:none !important; } }
  `;
  document.head.appendChild(s);
}

/* ─── HELPERS ─────────────────────────────────────────────── */
function scoreColor(s) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.t2;
  if (s >= 40) return C.amber;
  return C.red;
}
function scoreTier(s) {
  if (s >= 80) return { label:'Healthy', color:C.green, bg:C.greenD, bdr:C.greenB };
  if (s >= 60) return { label:'Stable',  color:C.t2,   bg:'rgba(138,138,148,0.08)', bdr:'rgba(138,138,148,0.2)' };
  if (s >= 40) return { label:'Caution', color:C.amber, bg:C.amberD, bdr:C.amberB };
  return             { label:'At Risk', color:C.red,   bg:C.redD,   bdr:C.redB };
}
function trendOf(hist) {
  if (!hist || hist.length < 4) return { dir:'flat', delta:0 };
  const d = hist[hist.length-1] - hist[hist.length-4];
  if (d > 4)  return { dir:'up',   delta:d };
  if (d < -4) return { dir:'down', delta:d };
  return            { dir:'flat', delta:0 };
}
function riskReason(client) {
  const r = [];
  if (client.lastVisit >= 21)      r.push('No visit in 3+ weeks');
  else if (client.lastVisit >= 14) r.push('No visit in 2+ weeks');
  if (!client.sessionsThisMonth && !client.sessionsLastMonth) r.push('Zero sessions in 2 months');
  else if (client.sessionsThisMonth < client.sessionsLastMonth) r.push('Session frequency declining');
  if (client.consecutiveMissed >= 2) r.push(`${client.consecutiveMissed} no-shows`);
  if (!r.length && client.retentionScore < 40) r.push('Low engagement pattern');
  return r;
}
function deriveCoachAction(client) {
  if (client.lastVisit >= 21)                               return 'Missed sessions';
  if (client.lastVisit >= 14)                               return 'Check in';
  if (client.streak >= 21)                                  return 'Celebrate progress';
  if (client.sessionsThisMonth > client.sessionsLastMonth)  return 'Book session';
  if (client.consecutiveMissed >= 2)                        return 'Check in';
  if (client.isNew)                                          return 'Welcome back';
  return 'Send message';
}
function lastLabel(ds) {
  if (ds === 0)  return 'Today';
  if (ds === 1)  return 'Yesterday';
  if (ds >= 999) return 'Never';
  return `${ds}d ago`;
}
function statusSty(status) {
  return ({
    active:  { bg:C.greenD, brd:C.greenB, col:C.green, label:'Active'  },
    at_risk: { bg:C.redD,   brd:C.redB,   col:C.red,   label:'At Risk' },
    paused:  { bg:C.amberD, brd:C.amberB, col:C.amber, label:'Paused'  },
  })[status] || { bg:C.cyanD, brd:C.cyanB, col:C.cyan, label:'Member' };
}

/* ─── BUILD CLIENT FROM BOOKINGS ──────────────────────────── */
function buildClientFromBookings(userId, clientName, clientBookings, checkIns, now) {
  const now_    = now ? now.getTime() : Date.now();
  const msDay   = 86400000;
  const msMonth = 30 * msDay;
  const noShows  = clientBookings.filter(b => b.status === 'no_show');
  const confirmed = clientBookings.filter(b => b.status === 'confirmed');
  const sessionsThisMonth = clientBookings.filter(b => b.session_date && (now_ - new Date(b.session_date)) < msMonth).length;
  const sessionsLastMonth = clientBookings.filter(b => {
    const d = b.session_date ? now_ - new Date(b.session_date) : null;
    return d !== null && d >= msMonth && d < 2 * msMonth;
  }).length;
  const userCI        = (checkIns||[]).filter(c=>c.user_id===userId).sort((a,b)=>new Date(b.check_in_date)-new Date(a.check_in_date));
  const lastCIDate    = userCI[0] ? new Date(userCI[0].check_in_date) : null;
  const lastVisitDays = lastCIDate ? Math.floor((now_ - lastCIDate.getTime()) / msDay) : 999;
  let streak = 0;
  for (let i = 0; i < userCI.length; i++) {
    const d = Math.floor((now_ - new Date(userCI[i].check_in_date).getTime()) / msDay);
    if (d <= streak + 2) streak = d + 1; else break;
  }
  let score = 70;
  if (lastVisitDays === 999)     score -= 40;
  else if (lastVisitDays > 21)   score -= 30;
  else if (lastVisitDays > 14)   score -= 20;
  else if (lastVisitDays > 7)    score -= 10;
  if (!sessionsThisMonth && !sessionsLastMonth) score -= 20;
  else if (sessionsThisMonth > sessionsLastMonth) score += 10;
  else if (sessionsThisMonth < sessionsLastMonth) score -= 10;
  score = Math.max(5, Math.min(98, score));
  const retentionHistory = Array.from({length:8}, (_, i) => {
    const ws = now_ - (7-i)*7*msDay, we = ws + 7*msDay;
    const cnt = userCI.filter(c => { const t=new Date(c.check_in_date).getTime(); return t>=ws&&t<we; }).length;
    return Math.min(100, 40 + cnt * 15);
  });
  const status       = score >= 65 ? 'active' : score >= 35 ? 'paused' : 'at_risk';
  const nextBooking  = confirmed.filter(b=>b.session_date&&new Date(b.session_date)>now).sort((a,b)=>new Date(a.session_date)-new Date(b.session_date))[0];
  const firstBooking = [...clientBookings].sort((a,b)=>new Date(a.session_date||a.created_date)-new Date(b.session_date||b.created_date))[0];
  const joinDateRaw  = firstBooking ? new Date(firstBooking.session_date||firstBooking.created_date) : null;
  const isNew        = joinDateRaw && (now_ - joinDateRaw.getTime()) < msMonth;
  const client = {
    id:userId, name:clientName||'Client', email:'', phone:'',
    tier:'Standard', status, goal:'General Fitness',
    retentionScore:score, retentionHistory,
    sessionsThisMonth, sessionsLastMonth,
    lastVisit: lastVisitDays===999 ? 999 : lastVisitDays,
    streak, consecutiveMissed:noShows.length,
    joinDate: firstBooking ? new Date(firstBooking.session_date||firstBooking.created_date).toLocaleDateString('en-GB',{month:'short',year:'numeric'}) : '—',
    membership:'Class Booking', monthlySpend:0, tags:[], notes:'', isNew,
    nextSession: nextBooking ? new Date(nextBooking.session_date).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}) : null,
    upcomingClasses: confirmed.filter(b=>b.session_date&&new Date(b.session_date)>now).slice(0,3).map(b=>b.session_name||'Class'),
    injuries:[],
  };
  client._action = deriveCoachAction(client);
  return client;
}

/* ─── CHART BUILDERS ──────────────────────────────────────── */
function buildRetentionTrend(clients) {
  return Array.from({length:8}, (_, i) => {
    const avg = clients.length > 0
      ? Math.round(clients.reduce((s,c) => s + ((c.retentionHistory||[])[i] ?? c.retentionScore ?? 50), 0) / clients.length)
      : 0;
    return { m:`W${i+1}`, v:avg };
  });
}
function buildScoreDist(clients) {
  const total = clients.length || 1;
  return [
    { label:'Healthy', pct:Math.round(clients.filter(c=>c.retentionScore>=80).length/total*100),                              color:C.green },
    { label:'Stable',  pct:Math.round(clients.filter(c=>c.retentionScore>=60&&c.retentionScore<80).length/total*100),         color:C.t2    },
    { label:'Caution', pct:Math.round(clients.filter(c=>c.retentionScore>=40&&c.retentionScore<60).length/total*100),         color:C.amber },
    { label:'At Risk', pct:Math.round(clients.filter(c=>c.retentionScore<40).length/total*100),                               color:C.red   },
  ];
}

function useIsMobile() {
  const [v, setV] = useState(typeof window!=='undefined' ? window.innerWidth<768 : false);
  useEffect(() => { const h=()=>setV(window.innerWidth<768); window.addEventListener('resize',h); return ()=>window.removeEventListener('resize',h); }, []);
  return v;
}

/* ─── MICRO COMPONENTS ───────────────────────────────────── */
function Av({ client, size=30, avatarMap={} }) {
  const name = client.name||'?';
  const col  = AV_COLORS[(client.id||name).split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_COLORS.length];
  const src  = avatarMap[client.id] || client.avatar_url || null;
  const ini  = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const dot  = {active:C.green,at_risk:C.red,paused:C.amber}[client.status];
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:'50%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',background:col+'1a',color:col,fontSize:size*0.32,fontWeight:800,border:`1.5px solid ${col}33`,fontFamily:'monospace'}}>
        {src ? <img src={src} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : ini}
      </div>
      {dot && <div style={{position:'absolute',bottom:-1,right:-1,width:Math.max(7,size*0.22),height:Math.max(7,size*0.22),borderRadius:'50%',background:dot,border:`2px solid ${C.bg}`}}/>}
    </div>
  );
}
function Pill({ children, color, bg, bdr, style:s }) {
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,color:color||C.t2,background:bg||'rgba(138,138,148,0.08)',border:`1px solid ${bdr||'rgba(138,138,148,0.2)'}`,borderRadius:20,padding:'2.5px 8px',letterSpacing:'.04em',textTransform:'uppercase',whiteSpace:'nowrap',lineHeight:'16px',fontFamily:FONT,...s}}>{children}</span>;
}
function Label({ children, style:s }) {
  return <div style={{fontSize:9.5,fontWeight:600,color:C.t3,textTransform:'uppercase',letterSpacing:'.07em',...s}}>{children}</div>;
}
function TrendLine({ data=[], color=C.cyan, w=60, h=24 }) {
  if (!data||data.length<2) return <div style={{width:w,height:h}}/>;
  const min=Math.min(...data),max=Math.max(...data),rng=(max-min)||1;
  const pts=data.map((v,i)=>[(i/(data.length-1))*w, 4+(1-(v-min)/rng)*(h-8)]);
  const smooth=ps => { let d=`M ${ps[0][0]} ${ps[0][1]}`; for(let i=0;i<ps.length-1;i++){const p0=ps[Math.max(0,i-1)],p1=ps[i],p2=ps[i+1],p3=ps[Math.min(ps.length-1,i+2)]; d+=` C ${p1[0]+(p2[0]-p0[0])/6} ${p1[1]+(p2[1]-p0[1])/6}, ${p2[0]-(p3[0]-p1[0])/6} ${p2[1]-(p3[1]-p1[1])/6}, ${p2[0]} ${p2[1]}`;} return d; };
  const line=smooth(pts); const [lx,ly]=pts[pts.length-1]; const uid=color.replace(/[^a-z0-9]/gi,'');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{display:'block',overflow:'visible',flexShrink:0}}>
      <defs><linearGradient id={`tl-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={`${line} L ${w},${h} L 0,${h} Z`} fill={`url(#tl-${uid})`}/>
      <path d={line} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill={C.card} stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}
function ChartTip({ active, payload, suffix='' }) {
  if (!active||!payload?.length) return null;
  return <div style={{background:'#111c2a',border:`1px solid ${C.cyanB}`,borderRadius:7,padding:'5px 10px',fontSize:11.5,color:C.t1}}><span style={{color:C.cyan,fontWeight:700}}>{payload[0].value}{suffix}</span></div>;
}

/* ─── ACTION DROPDOWN ─────────────────────────────────────── */
function ActionDropdown({ client, onMessage }) {
  const [open,setOpen]=useState(false); const [sel,setSel]=useState(client._action||'Send message');
  return (
    <div style={{position:'relative'}} onClick={e=>e.stopPropagation()}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:6,background:C.cyanD,border:`1px solid ${C.cyanB}`,color:C.cyan,fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',fontFamily:FONT}}>
        {sel.length>22 ? sel.slice(0,20)+'…' : sel}<ChevronDown style={{width:9,height:9,flexShrink:0}}/>
      </button>
      {open && (<>
        <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:99}}/>
        <div style={{position:'absolute',top:'calc(100% + 4px)',right:0,zIndex:100,background:C.card2,border:`1px solid ${C.brd2}`,borderRadius:8,overflow:'hidden',minWidth:195,boxShadow:'0 8px 24px rgba(0,0,0,0.45)'}}>
          {COACH_ACTIONS.map(a=>(
            <div key={a} onClick={()=>{setSel(a);setOpen(false);onMessage({...client,_action:a});}} style={{padding:'8px 12px',fontSize:12,color:a===sel?C.cyan:C.t2,cursor:'pointer',fontFamily:FONT,background:a===sel?C.cyanD:'transparent',display:'flex',alignItems:'center',justifyContent:'space-between',transition:'background .1s'}} onMouseEnter={e=>{if(a!==sel)e.currentTarget.style.background=C.card;}} onMouseLeave={e=>{if(a!==sel)e.currentTarget.style.background='transparent';}}>
              {a}{a===sel&&<Check style={{width:10,height:10,color:C.cyan}}/>}
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
}

/* ─── RIGHT PANEL — mirrors TabMembers RightPanel ────────── */
function RightPanel({ allClients }) {
  const retTrend = useMemo(()=>buildRetentionTrend(allClients),[allClients]);
  const scoreDist = useMemo(()=>buildScoreDist(allClients),[allClients]);
  const total=allClients.length, active=allClients.filter(c=>c.status==='active').length, atRisk=allClients.filter(c=>c.status==='at_risk').length, newC=allClients.filter(c=>c.isNew).length;
  const avg=total>0 ? Math.round(allClients.reduce((s,c)=>s+c.retentionScore,0)/total) : 0;
  return (
    <div className="tcm2-rp tcm2-scr" style={{width:240,flexShrink:0,background:C.sidebar,borderLeft:`1px solid ${C.brd}`,display:'flex',flexDirection:'column',overflowY:'auto',fontFamily:FONT}}>
      <div style={{padding:'16px 16px 14px',borderBottom:`1px solid ${C.brd}`}}>
        <div style={{fontSize:10,color:C.t3,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>Total Clients</div>
        <div style={{fontSize:38,fontWeight:700,color:C.t1,letterSpacing:'-0.03em',lineHeight:1}}>{total}</div>
        <div style={{fontSize:11,color:C.t3,marginTop:5}}>on your roster</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1px',background:C.brd,borderBottom:`1px solid ${C.brd}`}}>
        {[{label:'Active',val:active,col:C.cyan},{label:'At Risk',val:atRisk,col:C.red},{label:'New',val:newC,col:C.blue},{label:'Avg Score',val:avg,col:scoreColor(avg)}].map((s,i)=>(
          <div key={i} style={{padding:'12px 14px',background:C.sidebar}}>
            <div style={{fontSize:10,color:C.t3,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:s.col,lineHeight:1}}>{s.val}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'14px 16px 10px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <span style={{fontSize:12,fontWeight:600,color:C.t1}}>Retention Trend</span>
          <span style={{fontSize:10,color:C.t3}}>8 weeks</span>
        </div>
        <ResponsiveContainer width="100%" height={88}>
          <AreaChart data={retTrend} margin={{top:4,right:4,bottom:0,left:-28}}>
            <defs><linearGradient id="rp-ret" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.35}/><stop offset="100%" stopColor={C.cyan} stopOpacity={0.02}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="m" tick={{fill:C.t3,fontSize:9,fontFamily:FONT}} axisLine={false} tickLine={false}/>
            <YAxis domain={[0,100]} tick={{fill:C.t3,fontSize:9,fontFamily:FONT}} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTip/>}/>
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#rp-ret)" dot={false} activeDot={{r:3,fill:C.cyan,strokeWidth:2,stroke:C.card}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{height:1,background:C.brd}}/>
      <div style={{padding:'14px 16px 16px'}}>
        <div style={{fontSize:12,fontWeight:600,color:C.t1,marginBottom:12}}>Score Distribution</div>
        {scoreDist.map((b,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{fontSize:10,color:C.t2,width:42,flexShrink:0}}>{b.label}</span>
            <div style={{flex:1,height:3,background:C.brd,borderRadius:2,overflow:'hidden'}}><div style={{width:`${b.pct}%`,height:'100%',background:b.color,borderRadius:2,opacity:0.7}}/></div>
            <span style={{fontSize:10,fontWeight:600,color:C.t2,width:26,textAlign:'right'}}>{b.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TABLE HEAD ──────────────────────────────────────────── */
function TableHead({ sort, setSort }) {
  const cols=[{label:'Client',key:'name'},{label:'Status',key:null},{label:'Last Visit',key:'lastVisit'},{label:'Sessions',key:'sessions'},{label:'Score',key:'score'},{label:'Action',key:null}];
  return (
    <div style={{display:'grid',gridTemplateColumns:GRID,gap:12,padding:'7px 18px',borderBottom:`1px solid ${C.brd}`,background:C.card,fontFamily:FONT,flexShrink:0}}>
      {cols.map((c,i)=>(
        <div key={i} onClick={()=>c.key&&setSort(c.key)} style={{display:'flex',alignItems:'center',gap:3,fontSize:9.5,fontWeight:600,letterSpacing:'0.07em',textTransform:'uppercase',color:sort===c.key?C.t2:C.t3,cursor:c.key?'pointer':'default',justifyContent:i===cols.length-1?'flex-end':'flex-start'}}>
          {c.label}{c.key&&<ChevronDown style={{width:8,height:8,color:C.t3}}/>}
        </div>
      ))}
    </div>
  );
}

/* ─── CLIENT ROW — mirrors TabMembers MemberRow ───────────── */
function ClientRow({ client, isPrev, onPreview, onMessage, isLast, avatarMap }) {
  const ss=statusSty(client.status), sc=scoreColor(client.retentionScore), trend=trendOf(client.retentionHistory), delta=client.sessionsThisMonth-client.sessionsLastMonth;
  const reasons=riskReason(client), lvCol=client.lastVisit>=14?C.red:client.lastVisit<=1?C.cyan:C.t2;
  const activeInj=(client.injuries||[]).filter(i=>i.severity!=='Cleared').length;
  return (
    <div className="tcm2-row" onClick={()=>onPreview(client)} style={{display:'grid',gridTemplateColumns:GRID,gap:12,padding:'11px 18px',alignItems:'center',background:isPrev?'#1a1a1e':'transparent',borderBottom:isLast?'none':`1px solid ${C.brd}`,borderLeft:`2px solid ${isPrev?C.cyan:'transparent'}`,fontFamily:FONT}}>
      <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
        <div style={{position:'relative',flexShrink:0}}>
          <Av client={client} size={30} avatarMap={avatarMap}/>
          {client.streak>=7&&<div style={{position:'absolute',top:-2,right:-2,width:11,height:11,borderRadius:'50%',background:C.card,display:'flex',alignItems:'center',justifyContent:'center'}}><Flame style={{width:7,height:7,color:C.amber}}/></div>}
        </div>
        <div style={{minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2,flexWrap:'wrap'}}>
            <span style={{fontSize:13,fontWeight:700,color:isPrev?C.cyan:C.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{client.name}</span>
            {client.isNew&&<Pill color={C.blue} bg={C.blueD} bdr={C.blueB}>New</Pill>}
            {activeInj>0&&<span style={{fontSize:10,fontWeight:600,color:C.red,display:'flex',alignItems:'center',gap:2}}><ShieldAlert style={{width:9,height:9}}/>{activeInj}</span>}
          </div>
          <div style={{fontSize:10.5,color:client.status==='at_risk'?C.red:C.t3}}>{client.status==='at_risk'&&reasons[0]?reasons[0]:client.goal}</div>
        </div>
      </div>
      <div><span style={{padding:'3px 8px',borderRadius:20,background:ss.bg,border:`1px solid ${ss.brd}`,fontSize:10,fontWeight:700,color:ss.col,whiteSpace:'nowrap'}}>{ss.label}</span></div>
      <div><div style={{fontSize:12.5,fontWeight:600,color:lvCol}}>{lastLabel(client.lastVisit)}</div></div>
      <div>
        <div style={{display:'flex',alignItems:'baseline',gap:4}}><span style={{fontSize:15,fontWeight:700,color:C.t1}}>{client.sessionsThisMonth}</span>{delta!==0&&<span style={{fontSize:10,fontWeight:700,color:delta>0?C.green:C.red}}>{delta>0?'+':''}{delta}</span>}</div>
        <div style={{fontSize:10,color:C.t3,marginTop:1}}>this month</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <TrendLine data={client.retentionHistory} color={sc} w={52} h={22}/>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:20,fontWeight:700,color:sc,lineHeight:1,letterSpacing:'-0.02em'}}>{client.retentionScore}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:2,marginTop:2}}>
            {trend.dir==='up'&&<ArrowUpRight style={{width:8,height:8,color:C.green}}/>}{trend.dir==='down'&&<ArrowDownRight style={{width:8,height:8,color:C.red}}/>}
            <Label>{trend.dir}</Label>
          </div>
        </div>
      </div>
      <div onClick={e=>e.stopPropagation()} style={{display:'flex',justifyContent:'flex-end'}}>
        <ActionDropdown client={client} onMessage={onMessage}/>
      </div>
    </div>
  );
}

/* ─── CLIENT PREVIEW — mirrors TabMembers MemberPreview ────── */
const PREV_TABS=['Overview','Notes','Actions'];
function ClientPreview({ client, onClose, onMessage, avatarMap }) {
  const [tab,setTab]=useState('Overview'), [noteVal,setNoteVal]=useState(client.notes||''), [noteSaved,setNoteSaved]=useState(false);
  const [custom,setCustom]=useState(''), [preset,setPreset]=useState(null), [sending,setSending]=useState(false), [sent,setSent]=useState(false);
  useEffect(()=>{setTab('Overview');setNoteVal(client.notes||'');},[client.id]);
  const sc=scoreColor(client.retentionScore), tier=scoreTier(client.retentionScore), trend=trendOf(client.retentionHistory), delta=client.sessionsThisMonth-client.sessionsLastMonth, reasons=riskReason(client), fn=client.name.split(' ')[0];
  const activeInj=(client.injuries||[]).filter(i=>i.severity!=='Cleared');
  const PRESETS=[{id:'checkin',label:'Check-in',text:fn=>`Hey ${fn}, just checking in — how are things going? Would love to see you back.`},{id:'missed',label:'Missed',text:fn=>`Hi ${fn}, noticed you haven't been in. Everything okay?`},{id:'congrats',label:'Celebrate',text:fn=>`${fn} — you've been absolutely crushing it! Consistency is everything.`},{id:'book',label:'Book',text:fn=>`Hey ${fn}, let's lock in your next session — when works for you?`}];
  const message=preset ? (PRESETS.find(p=>p.id===preset)?.text(fn)||'') : custom;
  function handleSend(){if(!message.trim())return;setSending(true);setTimeout(()=>{setSending(false);setSent(true);},800);setTimeout(()=>{setSent(false);setCustom('');setPreset(null);},2500);}
  return (
    <div style={{position:'fixed',top:0,right:240,bottom:0,width:272,background:C.sidebar,borderLeft:`1px solid ${C.brd}`,zIndex:200,display:'flex',flexDirection:'column',boxShadow:'-8px 0 28px rgba(0,0,0,0.5)',fontFamily:FONT}}>
      <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Av client={client} size={34} avatarMap={avatarMap}/>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.t1}}>{client.name}</div>
            <div style={{fontSize:10.5,color:C.t3,marginTop:2}}>Since {client.joinDate}</div>
          </div>
        </div>
        <button onClick={onClose} style={{width:24,height:24,borderRadius:6,background:'transparent',border:`1px solid ${C.brd}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X style={{width:10,height:10,color:C.t3}}/></button>
      </div>
      <div style={{display:'flex',borderBottom:`1px solid ${C.brd}`,flexShrink:0}}>
        {PREV_TABS.map(t=>{const on=tab===t;return(<button key={t} className="tcm2-tab" onClick={()=>setTab(t)} style={{padding:'9px 14px',fontSize:11.5,borderBottom:`2px solid ${on?C.cyan:'transparent'}`,color:on?C.cyan:C.t3,fontWeight:on?700:400,marginBottom:-1}}>{t}</button>);})}
      </div>
      <div className="tcm2-scr" style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
        {tab==='Overview'&&(<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
            {[{label:'Retention Score',val:client.retentionScore,col:sc,sub:tier.label},{label:'Sessions / mo',val:client.sessionsThisMonth,col:delta>0?C.green:delta<0?C.red:C.t1,sub:`${delta>=0?'+':''}${delta} vs last`},{label:'Last Visit',val:lastLabel(client.lastVisit),col:client.lastVisit>=14?C.red:client.lastVisit<=1?C.cyan:C.t1,sub:client.lastVisit>=14?'Needs attention':'On track'},{label:'Streak',val:client.streak>0?`${client.streak}d`:'—',col:client.streak>=14?C.amber:C.t1,sub:client.streak>=14?'On fire!':'Keep going'}].map((s,i)=>(
              <div key={i} style={{padding:'10px',borderRadius:8,background:C.card,border:`1px solid ${C.brd}`}}>
                <div style={{fontSize:9.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:16,fontWeight:700,color:s.col,marginBottom:3}}>{s.val}</div>
                <div style={{fontSize:10,color:C.t3}}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{padding:'10px 12px',borderRadius:8,background:C.card,border:`1px solid ${C.brd}`}}>
            <div style={{fontSize:9.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>8-Week Engagement</div>
            <TrendLine data={client.retentionHistory} color={sc} w={218} h={36}/>
            <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6,fontSize:10.5,fontWeight:700,color:trend.dir==='up'?C.green:trend.dir==='down'?C.red:C.t3}}>
              {trend.dir==='up'&&<ArrowUpRight style={{width:11,height:11}}/>}{trend.dir==='down'&&<ArrowDownRight style={{width:11,height:11}}/>}
              {trend.dir==='up'?`+${trend.delta} pts — Improving`:trend.dir==='down'?`${trend.delta} pts — Declining`:'Holding steady'}
            </div>
          </div>
          {client.status==='at_risk'&&<div style={{padding:'10px 12px',borderRadius:8,background:C.redD,border:`1px solid ${C.redB}`,borderLeft:`3px solid ${C.red}`,display:'flex',alignItems:'flex-start',gap:8}}><AlertTriangle style={{width:12,height:12,color:C.red,flexShrink:0,marginTop:1}}/><div><div style={{fontSize:11,fontWeight:700,color:C.red,marginBottom:2}}>High churn risk</div><div style={{fontSize:10.5,color:C.t2,lineHeight:1.5}}>{reasons.join(' · ')}.</div></div></div>}
          {client.streak>=14&&<div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:8,background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.18)'}}><Flame style={{width:13,height:13,color:C.amber,flexShrink:0}}/><span style={{fontSize:12,fontWeight:600,color:C.amber}}>{client.streak}-day streak — recognize it!</span></div>}
          {activeInj.length>0&&<div style={{padding:'10px 12px',borderRadius:8,background:C.card,border:`1px solid ${C.amberB}`,borderLeft:`3px solid ${C.amber}`}}><div style={{fontSize:9.5,color:C.amber,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6,fontWeight:700}}>Active Restrictions</div>{activeInj.map((inj,i)=><div key={i} style={{fontSize:11.5,color:C.t2,marginBottom:3}}><span style={{color:C.t1,fontWeight:600}}>{inj.area}</span> — {inj.severity}</div>)}</div>}
          <div style={{padding:'10px 12px',borderRadius:8,background:C.cyanD,border:`1.5px solid ${C.cyanB}`}}>
            <div style={{fontSize:9.5,color:C.cyan,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6,fontWeight:700}}>Recommended Action</div>
            <div style={{fontSize:13,fontWeight:700,color:C.t1,marginBottom:8}}>{client._action}</div>
            <div style={{height:2,background:'rgba(77,127,255,0.15)',borderRadius:2,overflow:'hidden',marginBottom:5}}><div style={{width:`${Math.min(95,100-client.retentionScore*0.4)}%`,height:'100%',background:C.cyan,borderRadius:2}}/></div>
            <div style={{fontSize:10.5,color:C.t2}}>{Math.min(95,Math.round(100-client.retentionScore*0.4))}% predicted success</div>
          </div>
        </>)}
        {tab==='Notes'&&(<>
          <Label style={{marginBottom:6}}>Coach Notes — Private</Label>
          <textarea className="tcm2-input" rows={6} value={noteVal} onChange={e=>setNoteVal(e.target.value)} placeholder={`Add coaching notes for ${fn}…`} style={{resize:'vertical',lineHeight:1.6}}/>
          <button className="tcm2-btn" onClick={()=>{setNoteSaved(true);setTimeout(()=>setNoteSaved(false),2000);}} style={{padding:'8px 14px',borderRadius:8,background:noteSaved?C.greenD:C.cyanD,border:`1px solid ${noteSaved?C.greenB:C.cyanB}`,color:noteSaved?C.green:C.cyan,fontSize:11.5,fontWeight:600}}>
            {noteSaved?<><CheckCircle style={{width:11}}/> Saved</>:<><Edit3 style={{width:11}}/> Save Notes</>}
          </button>
          <div style={{marginTop:8}}>{[{l:'Member since',v:client.joinDate},{l:'Sessions/mo',v:client.sessionsThisMonth},{l:'Last visit',v:lastLabel(client.lastVisit)},{l:'Streak',v:client.streak>0?`${client.streak}d`:'—'}].map((r,i,arr)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:i<arr.length-1?`1px solid ${C.brd}`:'none'}}>
              <span style={{fontSize:11,color:C.t3}}>{r.l}</span><span style={{fontSize:11.5,fontWeight:600,color:C.t1,fontFamily:'monospace'}}>{r.v}</span>
            </div>
          ))}</div>
        </>)}
        {tab==='Actions'&&(<>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}}>
            {PRESETS.map(p=><button key={p.id} className="tcm2-btn" onClick={()=>setPreset(v=>v===p.id?null:p.id)} style={{padding:'5px 10px',borderRadius:7,fontSize:11,fontWeight:600,background:preset===p.id?C.cyanD:'rgba(255,255,255,0.03)',border:`1px solid ${preset===p.id?C.cyanB:C.brd}`,color:preset===p.id?C.cyan:C.t3}}>{p.label}</button>)}
          </div>
          {preset ? <div style={{padding:'11px 13px',borderRadius:8,background:C.card,border:`1px solid ${C.brd}`,borderLeft:`3px solid ${C.cyan}`,fontSize:12,color:C.t2,lineHeight:1.6,marginBottom:8}}>{message}</div>
            : <textarea className="tcm2-input" rows={4} value={custom} onChange={e=>setCustom(e.target.value)} placeholder={`Write a message to ${fn}…`} style={{marginBottom:8,lineHeight:1.5}}/>}
          <button className="tcm2-btn" onClick={handleSend} disabled={!message.trim()||sending||sent} style={{width:'100%',padding:'9px',borderRadius:8,justifyContent:'center',fontSize:12,fontWeight:700,background:sent?C.greenD:!message.trim()?'rgba(255,255,255,0.03)':C.cyan,border:`1px solid ${sent?C.greenB:!message.trim()?C.brd:C.cyanB}`,color:sent?C.green:!message.trim()?C.t3:'#fff'}}>
            {sent?<><CheckCircle style={{width:12}}/> Sent</>:sending?'Sending…':<><Send style={{width:12}}/> Send to {fn}</>}
          </button>
        </>)}
      </div>
      <div style={{padding:'12px 14px',borderTop:`1px solid ${C.brd}`}}>
        <button onClick={()=>onMessage(client)} style={{width:'100%',padding:'9px',borderRadius:8,background:C.cyan,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontFamily:FONT}}>
          <Send style={{width:11,height:11}}/> {client._action}
        </button>
      </div>
    </div>
  );
}

/* ─── MESSAGE TOAST — mirrors TabMembers MessageToast ────── */
function MessageToast({ client, onClose }) {
  const [sent,setSent]=useState(false), [body,setBody]=useState(client?`Hey ${client.name.split(' ')[0]}, just checking in — hope everything's great! Your progress has been incredible.`:'');
  if (!client) return null;
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',width:340,background:C.sidebar,border:`1px solid ${C.brd2}`,borderRadius:11,boxShadow:'0 8px 32px rgba(0,0,0,0.5)',zIndex:300,overflow:'hidden',fontFamily:FONT}}>
      <div style={{padding:'10px 14px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <Bell style={{width:11,height:11,color:C.t3}}/><span style={{fontSize:12,fontWeight:700,color:C.t1}}>Message</span><span style={{fontSize:10.5,color:C.t3}}>→ {client.name.split(' ')[0]}</span>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',display:'flex'}}><X style={{width:11,height:11,color:C.t3}}/></button>
      </div>
      <div style={{padding:'12px 14px'}}>
        <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} style={{width:'100%',boxSizing:'border-box',background:C.card,border:`1px solid ${C.brd}`,borderRadius:7,padding:'9px 11px',fontSize:11.5,color:C.t1,resize:'none',outline:'none',lineHeight:1.6,fontFamily:FONT}}/>
        <div style={{marginTop:4,fontSize:10.5,color:C.t3}}>Recommended: {client._action}</div>
        <button onClick={()=>{setSent(true);setTimeout(onClose,1600);}} style={{marginTop:9,width:'100%',padding:'8px',borderRadius:8,border:'none',fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,background:sent?C.card:C.cyan,color:sent?C.cyan:'#fff',transition:'all 0.2s',fontFamily:FONT}}>
          {sent?<><Check style={{width:11,height:11}}/> Sent</>:<><Send style={{width:11,height:11}}/> Send to {client.name.split(' ')[0]}</>}
        </button>
      </div>
    </div>
  );
}

/* ─── FILTER TABS ─────────────────────────────────────────── */
function FilterTabs({ filter, setFilter, counts }) {
  const tabs=[{id:'all',label:'All',count:counts.all,dot:null},{id:'at_risk',label:'At Risk',count:counts.at_risk,dot:C.red},{id:'paused',label:'Dropping',count:counts.paused,dot:C.amber},{id:'new',label:'New',count:counts.new,dot:C.blue},{id:'high_value',label:'High Value',count:counts.high_value,dot:C.cyan},{id:'inactive',label:'Inactive',count:counts.inactive,dot:null}];
  return (
    <div style={{display:'flex',alignItems:'center',gap:2,borderBottom:`1px solid ${C.brd}`,padding:'0 18px',background:C.card,fontFamily:FONT,flexShrink:0}}>
      {tabs.map(t=>{const on=filter===t.id;return(<button key={t.id} className="tcm2-tab" onClick={()=>setFilter(t.id)} style={{display:'flex',alignItems:'center',gap:5,padding:'9px 10px',background:'transparent',border:'none',borderBottom:on?`2px solid ${C.cyan}`:'2px solid transparent',color:on?C.t1:C.t2,fontSize:12,fontWeight:on?700:400,fontFamily:FONT}}>{t.dot&&<div style={{width:5,height:5,borderRadius:'50%',background:t.dot,opacity:on?1:0.5}}/>}{t.label}{t.count>0&&<span style={{fontSize:9.5,color:on?C.t2:C.t3}}>{t.count}</span>}</button>);})}
    </div>
  );
}

/* ─── ADD CLIENT MODAL ────────────────────────────────────── */
function AddClientModal({ open, onClose, availableMembers=[], existingIds=[], pendingIds=[], onAdd }) {
  const [search,setSearch]=useState(''), [adding,setAdding]=useState(null), [added,setAdded]=useState(new Set());
  useEffect(()=>{if(open){setSearch('');setAdded(new Set());}}, [open]);
  if (!open) return null;
  const filtered=availableMembers.filter(m=>{const id=m.user_id||m.id; if(existingIds.includes(id)||pendingIds.includes(id)||added.has(id))return false; return !search.trim()||(m.user_name||m.name||'').toLowerCase().includes(search.toLowerCase());});
  async function handleAdd(m){const id=m.user_id||m.id;setAdding(id);await new Promise(r=>setTimeout(r,400));setAdded(p=>new Set([...p,id]));setAdding(null);onAdd?.(m);}
  return (
    <div style={{position:'fixed',inset:0,zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:460,background:C.card,borderRadius:16,border:`1px solid ${C.brd}`,overflow:'hidden',animation:'tcm2ModalIn .28s cubic-bezier(.16,1,.3,1) both',boxShadow:'0 24px 60px rgba(0,0,0,0.6)'}}>
        <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div><div style={{fontSize:14,fontWeight:700,color:C.t1}}>Add Client</div><div style={{fontSize:11,color:C.t3,marginTop:3}}>Invite a member to your coaching roster</div></div>
          <button className="tcm2-btn" onClick={onClose} style={{width:26,height:26,borderRadius:7,background:'transparent',border:`1px solid ${C.brd}`,color:C.t3,justifyContent:'center'}}><X style={{width:11}}/></button>
        </div>
        <div style={{padding:'12px 20px 8px'}}><div style={{position:'relative'}}><Search style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',width:12,height:12,color:C.t3,pointerEvents:'none'}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…" className="tcm2-input" style={{paddingLeft:32}} autoFocus/></div></div>
        <div className="tcm2-scr" style={{maxHeight:300,overflowY:'auto',padding:'0 12px 14px'}}>
          {filtered.length===0 ? <div style={{textAlign:'center',padding:'28px 0',color:C.t3,fontSize:12}}>{availableMembers.length===0?'No members available':'No results'}</div>
            : filtered.map((m,i)=>{const id=m.user_id||m.id,name=m.user_name||m.name||'Member',isAdded=added.has(id);return(
              <div key={id||i} style={{display:'flex',alignItems:'center',gap:11,padding:'9px 8px',borderRadius:8,marginBottom:2,cursor:'default',transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='#1a1a1e'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{width:32,height:32,borderRadius:'50%',background:AV_COLORS[name.charCodeAt(0)%AV_COLORS.length]+'1a',color:AV_COLORS[name.charCodeAt(0)%AV_COLORS.length],fontSize:12,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,border:`1.5px solid ${AV_COLORS[name.charCodeAt(0)%AV_COLORS.length]}33`,fontFamily:'monospace'}}>{name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:12.5,fontWeight:600,color:C.t1}}>{name}</div>{m.email&&<div style={{fontSize:10.5,color:C.t3}}>{m.email}</div>}</div>
                <button className="tcm2-btn" onClick={()=>handleAdd(m)} disabled={isAdded||adding===id} style={{padding:'5px 12px',borderRadius:7,fontSize:11,fontWeight:600,background:isAdded?C.greenD:C.cyanD,border:`1px solid ${isAdded?C.greenB:C.cyanB}`,color:isAdded?C.green:C.cyan}}>
                  {isAdded?<><CheckCircle style={{width:10}}/> Added</>:adding===id?'Adding…':<><UserPlus style={{width:10}}/> Add</>}
                </button>
              </div>
            );})}
        </div>
        {added.size>0&&<div style={{padding:'10px 20px',borderTop:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{fontSize:12,color:C.green}}>{added.size} client{added.size>1?'s':''} added</span><button className="tcm2-btn" onClick={onClose} style={{padding:'6px 14px',borderRadius:7,fontSize:12,fontWeight:700,background:C.cyan,color:'#fff'}}>Done</button></div>}
      </div>
    </div>
  );
}

/* ─── BOTTOM SHEET ────────────────────────────────────────── */
function BottomSheet({ open, onClose, maxHeight='88vh', children }) {
  const [vis,setVis]=useState(false);
  useEffect(()=>{if(open){const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setVis(true)));return()=>cancelAnimationFrame(id);}else setVis(false);},[open]);
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:600,fontFamily:FONT}}>
      <div onClick={onClose} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)',opacity:vis?1:0,transition:'opacity 0.3s'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,background:C.sidebar,borderRadius:'22px 22px 0 0',border:`1px solid ${C.brd}`,borderBottom:'none',maxHeight,display:'flex',flexDirection:'column',transform:`translateY(${vis?'0':'100%'})`,transition:'transform 0.38s cubic-bezier(0.32,0.72,0,1)',overflow:'hidden'}}>
        <div style={{padding:'14px 0 6px',display:'flex',justifyContent:'center',flexShrink:0}}><div style={{width:40,height:4,borderRadius:2,background:C.brd2}}/></div>
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>{children}</div>
      </div>
    </div>
  );
}

/* ─── MOBILE FILTER CHIPS ─────────────────────────────────── */
function MobileFilterChips({ filter, setFilter, counts }) {
  const chips=[{id:'all',label:'All',count:counts.all,dot:null},{id:'at_risk',label:'At Risk',count:counts.at_risk,dot:C.red},{id:'paused',label:'Dropping',count:counts.paused,dot:C.amber},{id:'new',label:'New',count:counts.new,dot:C.blue},{id:'high_value',label:'High Value',count:counts.high_value,dot:C.cyan},{id:'inactive',label:'Inactive',count:counts.inactive,dot:null}];
  return (
    <div style={{display:'flex',gap:8,overflowX:'auto',padding:'10px 16px',background:C.bg,flexShrink:0,scrollbarWidth:'none'}}>
      {chips.map(c=>{const on=filter===c.id;return(<button key={c.id} onClick={()=>setFilter(c.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:24,flexShrink:0,whiteSpace:'nowrap',background:on?C.cyanD:C.card,border:`1.5px solid ${on?C.cyanB:C.brd}`,color:on?C.cyan:C.t2,fontSize:13,fontWeight:on?700:500,cursor:'pointer',fontFamily:FONT}}>
        {c.dot&&<div style={{width:7,height:7,borderRadius:'50%',background:c.dot,opacity:on?1:0.6}}/>}{c.label}{c.count>0&&<span style={{padding:'1px 7px',borderRadius:12,background:on?C.cyanB:C.brd2,color:on?C.cyan:C.t3,fontSize:11,fontWeight:700}}>{c.count}</span>}
      </button>);})}
    </div>
  );
}

/* ─── MOBILE CLIENT CARD ──────────────────────────────────── */
function MobileClientCard({ client, onPreview, onMessage, avatarMap }) {
  const ss=statusSty(client.status), sc=scoreColor(client.retentionScore), delta=client.sessionsThisMonth-client.sessionsLastMonth, lvCol=client.lastVisit>=14?C.red:client.lastVisit<=1?C.cyan:C.t2;
  return (
    <div onClick={()=>onPreview(client)} style={{margin:'0 12px 10px',borderRadius:16,background:C.card,border:`1.5px solid ${C.brd}`,overflow:'hidden',cursor:'pointer',fontFamily:FONT}}>
      <div style={{padding:'14px 14px 12px',display:'flex',alignItems:'center',gap:12}}>
        <div style={{position:'relative',flexShrink:0}}>
          <Av client={client} size={44} avatarMap={avatarMap}/>
          {client.streak>=7&&<div style={{position:'absolute',top:-3,right:-3,width:18,height:18,borderRadius:'50%',background:C.card,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${C.brd}`}}><Flame style={{width:10,height:10,color:C.amber}}/></div>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <div style={{fontSize:15.5,fontWeight:700,color:C.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{client.name}</div>
            <span style={{padding:'4px 10px',borderRadius:20,background:ss.bg,border:`1px solid ${ss.brd}`,fontSize:10.5,fontWeight:700,color:ss.col,whiteSpace:'nowrap',flexShrink:0}}>{ss.label}</span>
          </div>
          <div style={{fontSize:12,color:C.t3}}>{client.goal}</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',borderTop:`1px solid ${C.brd}`,background:C.card2}}>
        {[{label:'Last Visit',val:lastLabel(client.lastVisit),col:lvCol},{label:'Sessions',val:`${client.sessionsThisMonth}${delta!==0?` (${delta>0?'+':''}${delta})`:''}`,col:delta>0?C.green:delta<0?C.red:C.t1},{label:'Score',val:client.retentionScore,col:sc}].map((stat,i)=>(
          <div key={i} style={{padding:'10px 12px',borderRight:i<2?`1px solid ${C.brd}`:'none'}}>
            <div style={{fontSize:10,color:C.t3,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>{stat.label}</div>
            <div style={{fontSize:13.5,fontWeight:700,color:stat.col}}>{stat.val}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'12px 14px',borderTop:`1px solid ${C.brd}`}}>
        <button onClick={e=>{e.stopPropagation();onMessage(client);}} style={{width:'100%',padding:'12px 16px',borderRadius:10,background:C.cyanD,border:`1.5px solid ${C.cyanB}`,color:C.cyan,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}><Send style={{width:14,height:14,flexShrink:0}}/><span>{client._action}</span></div>
          <ChevronRight style={{width:14,height:14,flexShrink:0,opacity:0.6}}/>
        </button>
      </div>
    </div>
  );
}

/* ─── MOBILE PREVIEW SHEET ────────────────────────────────── */
function MobilePreviewSheet({ client, onClose, onMessage, avatarMap }) {
  const [open,setOpen]=useState(true), sc=scoreColor(client.retentionScore), delta=client.sessionsThisMonth-client.sessionsLastMonth;
  const close=()=>{setOpen(false);setTimeout(onClose,380);};
  return (
    <BottomSheet open={open} onClose={close} maxHeight="90vh">
      <div style={{padding:'4px 18px 14px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}><Av client={client} size={46} avatarMap={avatarMap}/><div><div style={{fontSize:17,fontWeight:700,color:C.t1}}>{client.name}</div><div style={{fontSize:12.5,color:C.t3,marginTop:3}}>{client.goal} · since {client.joinDate}</div></div></div>
        <button onClick={close} style={{width:34,height:34,borderRadius:9,background:C.card,border:`1px solid ${C.brd}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X style={{width:14,height:14,color:C.t3}}/></button>
      </div>
      <div className="tcm2-scr" style={{flex:1,overflowY:'auto',padding:'16px 16px 0'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          {[{label:'Retention Score',val:client.retentionScore,col:sc,sub:scoreTier(client.retentionScore).label},{label:'Sessions / mo',val:client.sessionsThisMonth,col:delta>0?C.green:delta<0?C.red:C.t1,sub:`${delta>=0?'+':''}${delta} vs last`},{label:'Last Visit',val:lastLabel(client.lastVisit),col:client.lastVisit>=14?C.red:client.lastVisit<=1?C.cyan:C.t1,sub:client.lastVisit>=14?'Needs attention':'On track'},{label:'Streak',val:client.streak>0?`${client.streak}d`:'—',col:client.streak>=14?C.amber:C.t1,sub:client.streak>=14?'On fire!':'Keep going'}].map((stat,i)=>(
            <div key={i} style={{padding:'14px',borderRadius:12,background:C.card,border:`1px solid ${C.brd}`}}>
              <div style={{fontSize:10.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>{stat.label}</div>
              <div style={{fontSize:19,fontWeight:700,color:stat.col,marginBottom:4}}>{stat.val}</div>
              <div style={{fontSize:11,color:C.t3}}>{stat.sub}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'16px',borderRadius:12,marginBottom:16,background:C.cyanD,border:`1.5px solid ${C.cyanB}`}}>
          <div style={{fontSize:10.5,color:C.cyan,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8,fontWeight:700}}>Recommended Action</div>
          <div style={{fontSize:15,fontWeight:700,color:C.t1,marginBottom:12}}>{client._action}</div>
          <div style={{height:4,background:'rgba(77,127,255,0.15)',borderRadius:2,overflow:'hidden',marginBottom:6}}><div style={{width:`${Math.min(95,100-client.retentionScore*0.4)}%`,height:'100%',background:C.cyan,borderRadius:2}}/></div>
          <div style={{fontSize:11.5,color:C.t2}}><span style={{color:C.cyan,fontWeight:700}}>{Math.min(95,Math.round(100-client.retentionScore*0.4))}%</span> predicted success</div>
        </div>
      </div>
      <div style={{padding:'14px 16px 28px',borderTop:`1px solid ${C.brd}`,flexShrink:0}}>
        <button onClick={()=>{close();setTimeout(()=>onMessage(client),50);}} style={{width:'100%',padding:'15px',borderRadius:14,background:C.cyan,border:'none',color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:FONT,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          <Send style={{width:15,height:15}}/>{client._action}
        </button>
      </div>
    </BottomSheet>
  );
}

/* ─── MOBILE MESSAGE SHEET ────────────────────────────────── */
function MobileMessageSheet({ client, onClose }) {
  const [sent,setSent]=useState(false), [open,setOpen]=useState(true), [body,setBody]=useState(client?`Hey ${client.name.split(' ')[0]}, just checking in — hope everything's great! Would love to see you back for a session soon.`:'');
  const close=()=>{setOpen(false);setTimeout(onClose,380);};
  if (!client) return null;
  return (
    <BottomSheet open={open} onClose={close} maxHeight="75vh">
      <div style={{padding:'4px 18px 14px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:C.cyanD,border:`1px solid ${C.cyanB}`,display:'flex',alignItems:'center',justifyContent:'center'}}><Bell style={{width:16,height:16,color:C.cyan}}/></div>
          <div><div style={{fontSize:14,fontWeight:700,color:C.t1}}>Message</div><div style={{fontSize:11.5,color:C.t3,marginTop:2}}>→ {client.name} · {client._action}</div></div>
        </div>
        <button onClick={close} style={{width:32,height:32,borderRadius:8,background:C.card,border:`1px solid ${C.brd}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X style={{width:13,height:13,color:C.t3}}/></button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
        <textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} style={{width:'100%',boxSizing:'border-box',background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,padding:'13px 14px',fontSize:14,color:C.t1,resize:'none',outline:'none',lineHeight:1.65,fontFamily:FONT}}/>
        <div style={{fontSize:12,color:C.t3,marginBottom:16,marginTop:8}}>Recommended: <span style={{color:C.cyan,fontWeight:700}}>{client._action}</span></div>
        <button onClick={()=>{setSent(true);setTimeout(close,1800);}} disabled={sent} style={{width:'100%',padding:'15px',borderRadius:14,border:'none',fontSize:15,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:sent?C.card:C.cyan,color:sent?C.cyan:'#fff',transition:'all 0.25s',fontFamily:FONT}}>
          {sent?<><Check style={{width:15,height:15}}/> Sent!</>:<><Send style={{width:15,height:15}}/> Send to {client.name.split(' ')[0]}</>}
        </button>
      </div>
    </BottomSheet>
  );
}

/* ─── MOBILE STATS SHEET ──────────────────────────────────── */
function MobileStatsSheet({ open, onClose, allClients }) {
  const [shOpen,setShOpen]=useState(open); useEffect(()=>setShOpen(open),[open]);
  const close=()=>{setShOpen(false);setTimeout(onClose,380);};
  const retTrend=useMemo(()=>buildRetentionTrend(allClients),[allClients]), scoreDist=useMemo(()=>buildScoreDist(allClients),[allClients]);
  const total=allClients.length, active=allClients.filter(c=>c.status==='active').length, atRisk=allClients.filter(c=>c.status==='at_risk').length, newC=allClients.filter(c=>c.isNew).length;
  const avg=total>0?Math.round(allClients.reduce((s,c)=>s+c.retentionScore,0)/total):0;
  if (!open) return null;
  return (
    <BottomSheet open={shOpen} onClose={close} maxHeight="92vh">
      <div style={{padding:'4px 18px 14px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div><div style={{fontSize:16,fontWeight:700,color:C.t1}}>Analytics</div><div style={{fontSize:11.5,color:C.t3,marginTop:2}}>Client health overview</div></div>
        <button onClick={close} style={{width:34,height:34,borderRadius:9,background:C.card,border:`1px solid ${C.brd}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X style={{width:14,height:14,color:C.t3}}/></button>
      </div>
      <div className="tcm2-scr" style={{flex:1,overflowY:'auto',padding:'16px'}}>
        <div style={{padding:'20px',borderRadius:16,marginBottom:14,background:C.card,border:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div><div style={{fontSize:11,color:C.t3,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>Total Clients</div><div style={{fontSize:44,fontWeight:700,color:C.t1,letterSpacing:'-0.03em',lineHeight:1}}>{total}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:11,color:C.t3,marginBottom:4}}>Avg Score</div><div style={{fontSize:28,fontWeight:700,color:scoreColor(avg),letterSpacing:'-0.02em'}}>{avg}</div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
          {[{label:'Active',val:active,col:C.cyan},{label:'At Risk',val:atRisk,col:C.red},{label:'New',val:newC,col:C.blue},{label:'Avg Score',val:avg,col:scoreColor(avg)}].map((s,i)=>(
            <div key={i} style={{padding:'16px',borderRadius:14,background:C.card,border:`1px solid ${C.brd}`}}>
              <div style={{fontSize:10.5,color:C.t3,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>{s.label}</div>
              <div style={{fontSize:24,fontWeight:700,color:s.col,lineHeight:1}}>{s.val}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div style={{fontSize:14,fontWeight:700,color:C.t1}}>Retention Trend</div><div style={{fontSize:11,color:C.t3}}>8 weeks</div></div>
          <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:14,padding:'14px 10px 8px'}}>
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={retTrend} margin={{top:4,right:4,bottom:0,left:-26}}>
                <defs><linearGradient id="mob-ret" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.35}/><stop offset="100%" stopColor={C.cyan} stopOpacity={0.02}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="m" tick={{fill:C.t3,fontSize:10,fontFamily:FONT}} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{fill:C.t3,fontSize:10,fontFamily:FONT}} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTip/>}/>
                <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2.5} fill="url(#mob-ret)" dot={false} activeDot={{r:4,fill:C.cyan,strokeWidth:2,stroke:C.card}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:14}}>Score Distribution</div>
          <div style={{background:C.card,border:`1px solid ${C.brd}`,borderRadius:14,overflow:'hidden'}}>
            {scoreDist.map((b,i)=>(
              <div key={i} style={{padding:'14px 16px',borderBottom:i<scoreDist.length-1?`1px solid ${C.brd}`:'none'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}><span style={{fontSize:13,fontWeight:600,color:C.t1}}>{b.label}</span><span style={{fontSize:14,fontWeight:700,color:b.color}}>{b.pct}%</span></div>
                <div style={{height:5,background:C.brd,borderRadius:3,overflow:'hidden'}}><div style={{width:`${b.pct}%`,height:'100%',background:b.color,borderRadius:3,opacity:0.75}}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOT EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabCoachMembers({
  coach=null, bookings=[], checkIns=[], avatarMap={}, now=new Date(),
  pendingInvites=[], acceptedInvites=[], availableMembers=[],
  onAddClient=null, onCancelInvite=null, onSetTab=null, openModal=()=>{},
}) {
  const isMobile=useIsMobile();
  const [filter,setFilter]=useState('all'), [sort,setSort]=useState('lastVisit'), [search,setSearch]=useState('');
  const [preview,setPreview]=useState(null), [msgTarget,setMsgTarget]=useState(null), [statsOpen,setStatsOpen]=useState(false), [showAdd,setShowAdd]=useState(false);
  const [localPending,setLocalPending]=useState(pendingInvites);
  useEffect(()=>setLocalPending(pendingInvites),[pendingInvites]);
  useEffect(()=>{const h=()=>setShowAdd(true);window.addEventListener('coachOpenAddClient',h);return()=>window.removeEventListener('coachOpenAddClient',h);},[]);

  const allClients=useMemo(()=>{
    const by={};
    bookings.forEach(b=>{if(!b.client_id)return;if(!by[b.client_id])by[b.client_id]={name:b.client_name||'Client',bookings:[]};by[b.client_id].bookings.push(b);});
    acceptedInvites.forEach(inv=>{if(!by[inv.member_id])by[inv.member_id]={name:inv.member_name||'Client',bookings:[]};});
    return Object.entries(by).map(([userId,{name,bookings:cb}])=>({...buildClientFromBookings(userId,name,cb,checkIns,now),avatar_url:avatarMap?.[userId]||null}));
  },[bookings,acceptedInvites,checkIns,avatarMap,now]);

  const counts=useMemo(()=>({
    all:allClients.length+localPending.length, at_risk:allClients.filter(c=>c.status==='at_risk').length,
    paused:allClients.filter(c=>c.status==='paused').length, new:allClients.filter(c=>c.isNew).length,
    high_value:allClients.filter(c=>c.retentionScore>=80).length, inactive:allClients.filter(c=>c.lastVisit>=14||c.lastVisit>=999).length,
  }),[allClients,localPending]);

  const visible=useMemo(()=>{
    let list=[...allClients];
    if(filter==='at_risk')    list=list.filter(c=>c.status==='at_risk');
    if(filter==='paused')     list=list.filter(c=>c.status==='paused');
    if(filter==='new')        list=list.filter(c=>c.isNew);
    if(filter==='high_value') list=list.filter(c=>c.retentionScore>=80);
    if(filter==='inactive')   list=list.filter(c=>c.lastVisit>=14||c.lastVisit>=999);
    if(search.trim()){const q=search.toLowerCase();list=list.filter(c=>c.name.toLowerCase().includes(q)||c.goal.toLowerCase().includes(q));}
    return list.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='score'?b.retentionScore-a.retentionScore:sort==='sessions'?b.sessionsThisMonth-a.sessionsThisMonth:a.lastVisit-b.lastVisit);
  },[allClients,filter,sort,search]);

  const handleMsg=useCallback(c=>{setMsgTarget(c);setPreview(null);},[]);
  const existingIds=allClients.map(c=>c.id), pendingIds=localPending.map(i=>i.member_id);

  /* ─── MOBILE ─────────────────────────────────────────────── */
  if (isMobile) return (
    <div className="tcm2-root" style={{display:'flex',flexDirection:'column',height:'100%',background:C.bg,color:C.t1,overflow:'hidden'}}>
      <AddClientModal open={showAdd} onClose={()=>setShowAdd(false)} availableMembers={availableMembers} existingIds={existingIds} pendingIds={pendingIds} onAdd={m=>{setShowAdd(false);onAddClient?.(m);}}/>
      <div style={{flexShrink:0,position:'sticky',top:0,zIndex:100,background:C.bg,borderBottom:`1px solid ${C.brd}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 10px'}}>
          <div><div style={{fontSize:15,fontWeight:700,color:C.t1}}>Members / CRM</div><div style={{fontSize:11,color:C.t3}}>{allClients.length} clients · {counts.at_risk} at risk</div></div>
          <div style={{display:'flex',gap:8}}>
            {counts.at_risk>0&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:8,background:C.redD,border:`1px solid ${C.redB}`,fontSize:12,color:C.red,fontWeight:700}}><div style={{width:6,height:6,borderRadius:'50%',background:C.red,animation:'tcm2Pulse 2s ease infinite'}}/>{counts.at_risk}</div>}
            <button onClick={()=>setStatsOpen(true)} style={{width:40,height:40,borderRadius:11,background:C.cyanD,border:`1px solid ${C.cyanB}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><BarChart2 style={{width:16,height:16,color:C.cyan}}/></button>
            <button onClick={()=>setShowAdd(true)} style={{width:40,height:40,borderRadius:11,background:C.cyan,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}><UserPlus style={{width:16,height:16,color:'#fff'}}/></button>
          </div>
        </div>
        <div style={{padding:'0 16px 12px'}}><div style={{display:'flex',alignItems:'center',gap:10,background:C.card,border:`1px solid ${C.brd}`,borderRadius:12,padding:'10px 14px'}}><Search style={{width:14,height:14,color:C.t3,flexShrink:0}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…" style={{flex:1,background:'none',border:'none',outline:'none',color:C.t1,fontSize:14,fontFamily:FONT}}/></div></div>
        <MobileFilterChips filter={filter} setFilter={setFilter} counts={counts}/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 16px 8px',background:C.bg}}>
          <span style={{fontSize:12,color:C.t3}}>{visible.length} client{visible.length!==1?'s':''}</span>
          <div style={{display:'flex',alignItems:'center',gap:6}}><SlidersHorizontal style={{width:12,height:12,color:C.t3}}/><select value={sort} onChange={e=>setSort(e.target.value)} style={{background:'transparent',border:'none',color:C.t2,fontSize:12,outline:'none',cursor:'pointer',fontFamily:FONT,appearance:'none'}}><option value="lastVisit">Last visit</option><option value="score">Score</option><option value="sessions">Sessions</option><option value="name">Name A–Z</option></select></div>
        </div>
      </div>
      <div className="tcm2-scr" style={{flex:1,overflowY:'auto',paddingTop:10,paddingBottom:20}}>
        {visible.length===0 ? <div style={{padding:'64px 16px',textAlign:'center'}}><Users style={{width:36,height:36,color:C.t3,margin:'0 auto 14px',display:'block'}}/><div style={{fontSize:15,color:C.t2,fontWeight:600}}>No clients match</div></div>
          : visible.map(c=><MobileClientCard key={c.id} client={c} avatarMap={avatarMap} onPreview={cc=>setPreview(preview?.id===cc.id?null:cc)} onMessage={handleMsg}/>)}
      </div>
      {preview   && <MobilePreviewSheet client={preview} onClose={()=>setPreview(null)} onMessage={handleMsg} avatarMap={avatarMap}/>}
      {msgTarget && <MobileMessageSheet client={msgTarget} onClose={()=>setMsgTarget(null)}/>}
      {statsOpen && <MobileStatsSheet open={statsOpen} onClose={()=>setStatsOpen(false)} allClients={allClients}/>}
    </div>
  );

  /* ─── DESKTOP ────────────────────────────────────────────── */
  return (
    <div className="tcm2-root" style={{display:'flex',height:'100%',background:C.bg,color:C.t1,overflow:'hidden'}}>
      <AddClientModal open={showAdd} onClose={()=>setShowAdd(false)} availableMembers={availableMembers} existingIds={existingIds} pendingIds={pendingIds} onAdd={m=>{setShowAdd(false);onAddClient?.(m);}}/>
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
          {/* Header */}
          <div style={{padding:'14px 18px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:`1px solid ${C.brd}`,flexShrink:0}}>
            <div><div style={{fontSize:18,fontWeight:700,color:C.t1,letterSpacing:'-0.02em'}}>Members <span style={{color:C.t3,fontWeight:300}}>/</span> <span style={{color:C.cyan}}>CRM</span></div><div style={{fontSize:11,color:C.t3,marginTop:2}}>{allClients.length} client{allClients.length!==1?'s':''} · AI-powered retention</div></div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {counts.at_risk>0&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:7,background:C.redD,border:`1px solid ${C.redB}`,fontSize:11.5,color:C.red,fontWeight:600}}><div style={{width:5,height:5,borderRadius:'50%',background:C.red,animation:'tcm2Pulse 2s ease infinite'}}/>{counts.at_risk} At Risk</div>}
              <div style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.brd}`,borderRadius:7,padding:'5px 10px'}}><Search style={{width:11,height:11,color:C.t3,flexShrink:0}}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…" style={{background:'transparent',border:'none',outline:'none',color:C.t1,fontSize:12,width:160,fontFamily:FONT}}/></div>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:'6px 10px',borderRadius:7,background:C.card,border:`1px solid ${C.brd}`,color:C.t2,fontSize:11.5,outline:'none',cursor:'pointer',fontFamily:FONT}}><option value="lastVisit">Last visit</option><option value="score">Score ↓</option><option value="sessions">Sessions</option><option value="name">Name A–Z</option></select>
              <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:7,background:C.cyan,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:FONT}}><UserPlus style={{width:12,height:12}}/> Add Client</button>
            </div>
          </div>
          <FilterTabs filter={filter} setFilter={setFilter} counts={counts}/>
          <div className="tcm2-scr" style={{flex:1,overflowY:'auto'}}>
            <TableHead sort={sort} setSort={setSort}/>
            {allClients.length===0 ? (
              <div style={{padding:'64px 24px',textAlign:'center'}}>
                <Users style={{width:32,height:32,color:C.t3,margin:'0 auto 14px',display:'block'}}/>
                <div style={{fontSize:16,fontWeight:700,color:C.t2,marginBottom:6}}>No clients yet</div>
                <div style={{fontSize:12,color:C.t3,marginBottom:20}}>Clients appear automatically when members book your classes</div>
                <button onClick={()=>setShowAdd(true)} style={{padding:'9px 20px',borderRadius:9,background:C.cyan,border:'none',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:FONT,display:'inline-flex',alignItems:'center',gap:7}}><UserPlus style={{width:13,height:13}}/> Add First Client</button>
              </div>
            ) : visible.length===0 ? (
              <div style={{padding:'48px 16px',textAlign:'center'}}><Search style={{width:24,height:24,color:C.t3,margin:'0 auto 10px',display:'block'}}/><div style={{fontSize:13,color:C.t2}}>No clients match this filter</div></div>
            ) : visible.map((c,i)=>(
              <ClientRow key={c.id} client={c} isPrev={preview?.id===c.id} isLast={i===visible.length-1} onPreview={cc=>setPreview(preview?.id===cc.id?null:cc)} onMessage={handleMsg} avatarMap={avatarMap}/>
            ))}
            <div style={{padding:'8px 18px',borderTop:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'flex-end'}}><span style={{fontSize:10.5,color:C.t3}}>{visible.length} of {allClients.length} clients{localPending.length>0?` · ${localPending.length} pending`:''}</span></div>
          </div>
        </div>
        <RightPanel allClients={allClients}/>
      </div>
      {preview   && <ClientPreview client={preview} onClose={()=>setPreview(null)} onMessage={handleMsg} avatarMap={avatarMap}/>}
      {msgTarget && <MessageToast client={msgTarget} onClose={()=>setMsgTarget(null)}/>}
    </div>
  );
}