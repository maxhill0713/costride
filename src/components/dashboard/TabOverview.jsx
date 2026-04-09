import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  AlertTriangle, ArrowRight, CheckCircle,
  ChevronRight, DollarSign, Home, LayoutGrid,
  Send, Settings, Trophy, UserPlus, Users, Zap,
  Activity, TrendingUp, TrendingDown, Search, RotateCcw,
  BarChart2, LogOut, Monitor, Star,
} from 'lucide-react';

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  bg:          '#060c18',
  surface:     '#0b1221',
  surfaceHigh: '#0f1830',
  border:      'rgba(255,255,255,0.06)',
  borderMid:   'rgba(255,255,255,0.10)',
  textPrimary:   '#eef2ff',
  textSecondary: '#7d8ea6',
  textMuted:     '#3d4f66',
  blue:   '#3b82f6', blueDim:   'rgba(59,130,246,0.12)',  blueBorder:  'rgba(59,130,246,0.28)',
  red:    '#f04f4f', redDim:    'rgba(240,79,79,0.10)',   redBorder:   'rgba(240,79,79,0.22)',
  amber:  '#f59e0b', amberDim:  'rgba(245,158,11,0.10)',  amberBorder: 'rgba(245,158,11,0.22)',
  green:  '#34d399', greenDim:  'rgba(52,211,153,0.10)',  greenBorder: 'rgba(52,211,153,0.22)',
};

const card = (ex = {}) => ({ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, ...ex });
const fmtM = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;

/* ── Avatar ─────────────────────────────────────────────────── */
function Avatar({ name = '?', size = 32 }) {
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const hue = [...name].reduce((a,c)=>a+c.charCodeAt(0),0) % 360;
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`hsl(${hue},40%,18%)`, border:`1.5px solid hsl(${hue},40%,28%)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.36, fontWeight:700, color:`hsl(${hue},55%,68%)`,
    }}>{initials}</div>
  );
}

/* ── Badge ──────────────────────────────────────────────────── */
function Badge({ label, color='blue', dot }) {
  const m = { blue:[T.blue,T.blueDim,T.blueBorder], red:[T.red,T.redDim,T.redBorder], amber:[T.amber,T.amberDim,T.amberBorder], green:[T.green,T.greenDim,T.greenBorder] };
  const [fg,bg,bd] = m[color]||m.blue;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:6,
      background:bg, border:`1px solid ${bd}`, fontSize:10, fontWeight:800, color:fg,
      letterSpacing:'0.08em', textTransform:'uppercase', flexShrink:0,
    }}>
      {dot && <span style={{width:5,height:5,borderRadius:'50%',background:fg,flexShrink:0}}/>}
      {label}
    </span>
  );
}

/* ── Btn ────────────────────────────────────────────────────── */
function Btn({ onClick, children, variant='primary', small, style:sx={} }) {
  const [hov, setHov] = useState(false);
  const base = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
    padding: small ? '6px 13px' : '9px 18px', borderRadius:9, cursor:'pointer', fontWeight:700,
    fontSize: small ? 11 : 12.5, transition:'all 0.15s', whiteSpace:'nowrap', flexShrink:0, ...sx };
  if (variant==='danger') return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background: hov?'rgba(240,79,79,0.22)':T.redDim, color:T.red, border:`1px solid ${T.redBorder}`}}>
      {children}
    </button>
  );
  if (variant==='ghost') return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background: hov?'rgba(255,255,255,0.05)':'transparent', color: hov?T.textSecondary:T.textMuted, border:'none'}}>
      {children}
    </button>
  );
  return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background: hov?'#4a8ef7':T.blue, color:'#fff', border:`1px solid ${T.blueBorder}`,
        boxShadow: hov?`0 0 20px rgba(59,130,246,0.25)`:'none'}}>
      {children}
    </button>
  );
}

/* ── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ activeTab, setActiveTab }) {
  const nav = [
    {id:'overview',Icon:Home,label:'Overview'},{id:'members',Icon:Users,label:'Members'},
    {id:'content',Icon:LayoutGrid,label:'Content'},{id:'analytics',Icon:BarChart2,label:'Analytics'},
    {id:'automations',Icon:Zap,label:'Automations'},{id:'settings',Icon:Settings,label:'Settings'},
  ];
  const bot = [{Icon:Monitor,label:'View Gym Page'},{Icon:Users,label:'Member View'},{Icon:LogOut,label:'Log Out'}];
  return (

  );
}

/* ── Header ─────────────────────────────────────────────────── */
function Header({ atRisk=3 }) {
  const d = new Date();
  const ds = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const ms = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 24px',
      borderBottom:`1px solid ${T.border}`, background:T.surface }}>
      <span style={{ fontSize:13, fontWeight:700, color:T.textSecondary, marginRight:4 }}>
        {ds[d.getDay()]} {d.getDate()} {ms[d.getMonth()]} {d.getFullYear()}
      </span>
      <div style={{ flex:1, position:'relative' }}>
        <Search size={13} color={T.textMuted} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }}/>
        <input placeholder="Search members..." style={{
          width:'100%', maxWidth:280, padding:'7px 12px 7px 32px',
          background:T.surfaceHigh, border:`1px solid ${T.border}`,
          borderRadius:9, color:T.textSecondary, fontSize:12, outline:'none', boxSizing:'border-box',
        }}/>
      </div>
      <Btn variant="ghost" small>Actions <ChevronRight size={11}/></Btn>
      <Avatar name="Max" size={30}/>
      <span style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>Max</span>
      {atRisk>0 && <Badge label={`${atRisk} At Risk`} color="red" dot/>}
    </div>
  );
}

/* ── At-Risk Pipeline ───────────────────────────────────────── */
function AtRiskPipeline({ atRisk=3, mrr=4800, totalMembers=87 }) {
  const rpm = mrr/totalMembers;
  const rev = Math.round(atRisk*rpm*0.65);
  const tiers = [
    { label:'Slipping (7+ Days):', count:12, color:T.amber, pct:68 },
    { label:'Ghosting (14+ Days):', count:3,  color:T.red,   pct:42, warn:true },
    { label:'Churn Imminent (21+ Days):', count:1, color:'#ff3b3b', pct:14 },
  ];
  return (
    <div style={{ ...card({ padding:20 }),
      background:`linear-gradient(135deg,${T.surface} 60%,rgba(240,79,79,0.06) 100%)`,
      border:`1px solid ${T.redBorder}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
        <div style={{ width:26, height:26, borderRadius:7, background:T.redDim, border:`1px solid ${T.redBorder}`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <AlertTriangle size={12} color={T.red}/>
        </div>
        <span style={{ fontSize:14, fontWeight:800, color:T.textPrimary }}>At-Risk Pipeline:</span>
        <Badge label={`${atRisk} Members Ghosting`} color="red"/>
        <span style={{ fontSize:11.5, color:T.textMuted }}>(14+ Days Inactive)</span>
      </div>
      <p style={{ margin:'0 0 16px', fontSize:12, color:T.textSecondary }}>
        ~<span style={{ color:T.red, fontWeight:800 }}>{fmtM(rev)}/mo MRR</span> at risk.
        {' '}Proactive outreach recovers ~<span style={{ color:T.green, fontWeight:700 }}>73%</span>.
      </p>

      <div style={{ display:'flex', gap:14, marginBottom:18 }}>
        {tiers.map((t,i)=>(
          <div key={i} style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ fontSize:10.5, color:T.textMuted }}>{t.label}</span>
              <span style={{ fontSize:10.5, fontWeight:800, color:t.color }}>{t.count} members</span>
            </div>
            <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${t.pct}%`, background:t.color, borderRadius:3, boxShadow:`0 0 8px ${t.color}` }}/>
            </div>
            {t.warn && (
              <div style={{ marginTop:6, width:18, height:18, borderRadius:'50%',
                background:T.amber, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:9, color:'#000', fontWeight:900 }}>!</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Btn variant="danger" style={{ width:'100%', justifyContent:'center', padding:'11px 18px', fontSize:12.5 }}>
        Message At-Risk Members Now <ArrowRight size={13}/>
      </Btn>
    </div>
  );
}

/* ── Engagement Impact ──────────────────────────────────────── */
function EngagementImpact({ stats={} }) {
  const metrics = [
    { v: stats.messagesSent??83,     label:'Messages Sent',     color:T.textPrimary, trend:null },
    { v: stats.reengaged??29,        label:'Members Re-engaged', color:T.green, trend:'+5% MoM', up:true },
    { v: fmtM(stats.mrrRetained??940), label:'MRR Retained',    color:T.blue, trend:'+15% MoM', up:true },
    { v: `${stats.reengagementRate??35}%`, label:'Re-engagement Rate', color:T.textPrimary, trend:null },
  ];
  return (
    <div style={{ ...card({ padding:18 }) }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <div style={{ width:24, height:24, borderRadius:6, background:T.blueDim, border:`1px solid ${T.blueBorder}`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Zap size={11} color={T.blue}/>
        </div>
        <span style={{ fontSize:12.5, fontWeight:700, color:T.textPrimary }}>
          Engagement Impact <span style={{ color:T.textMuted, fontWeight:400 }}>(This Month)</span>
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {metrics.map(({v,label,color,trend,up},i)=>(
          <div key={i} style={{ background:T.surfaceHigh, border:`1px solid ${T.border}`, borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:26, fontWeight:900, color, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{v}</div>
            <div style={{ fontSize:11, color:T.textSecondary, fontWeight:600 }}>{label}</div>
            {trend && (
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:5 }}>
                {up ? <TrendingUp size={10} color={T.green}/> : <TrendingDown size={10} color={T.red}/>}
                <span style={{ fontSize:10, color:up?T.green:T.red, fontWeight:700 }}>{trend}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Member Health Donut ────────────────────────────────────── */
function MemberHealth({ totalMembers=87 }) {
  const data = [
    { label:'Highly Active (0-6d)', pct:75, color:T.green },
    { label:'Slipping (7-13d)',      pct:15, color:T.amber },
    { label:'At Risk (14d+)',        pct:10, color:T.red },
  ];
  return (
    <div style={{ ...card({ padding:18 }) }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <div style={{ width:24, height:24, borderRadius:6, background:T.greenDim, border:`1px solid ${T.greenBorder}`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Activity size={11} color={T.green}/>
        </div>
        <span style={{ fontSize:12.5, fontWeight:700, color:T.textPrimary }}>Member Health Overview</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:110, height:110, flexShrink:0, position:'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.map(d=>({name:d.label,value:d.pct}))}
                cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                {data.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontSize:17, fontWeight:900, color:T.textPrimary, lineHeight:1 }}>{totalMembers}</span>
            <span style={{ fontSize:8.5, color:T.textMuted, marginTop:2 }}>total</span>
          </div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:9 }}>
          {data.map(({label,pct,color},i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0, boxShadow:`0 0 6px ${color}` }}/>
              <span style={{ fontSize:10.5, color:T.textSecondary, flex:1 }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:800, color, minWidth:32, textAlign:'right' }}>{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Smart Priorities ───────────────────────────────────────── */
function SmartPriorities() {
  const [done, setDone] = useState({});
  const items = [
    { id:'p1', label:'High-Value Call: Sarah J.', sub:'($150 plan, 10d no visit)', color:T.red },
    { id:'p2', label:'Fix Bounce: Update phone',  sub:'for John Doe', color:T.amber },
    { id:'p3', label:'Milestone: Anniversary',    sub:'kudos to 5 members', color:T.blue },
  ];
  return (
    <div style={card()}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'13px 16px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Star size={12} color={T.amber}/>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:T.textMuted, textTransform:'uppercase' }}>Smart Priorities</span>
        </div>
        <span style={{ fontSize:10, color:T.textMuted }}>(To-Do List)</span>
      </div>
      {items.map(({id,label,sub,color})=>{
        const ck = !!done[id];
        return (
          <div key={id} onClick={()=>setDone(p=>({...p,[id]:!p[id]}))}
            style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'11px 16px',
              cursor:'pointer', borderLeft:`3px solid ${ck?T.textMuted:color}`,
              borderBottom:`1px solid ${T.border}`, transition:'all 0.1s' }}>
            <div style={{ width:16, height:16, borderRadius:4, flexShrink:0, marginTop:1,
              border:`1.5px solid ${ck?T.green:T.borderMid}`,
              background:ck?T.greenDim:'transparent',
              display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
              {ck && <CheckCircle size={10} color={T.green}/>}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:ck?T.textMuted:T.textPrimary,
                textDecoration:ck?'line-through':'none' }}>{label}</div>
              <div style={{ fontSize:10.5, color:T.textMuted, marginTop:2 }}>{sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Recent Live Activity ───────────────────────────────────── */
function RecentLiveActivity() {
  const evs = [
    { name:'James Okafor', action:'returned via automation', time:'just now', type:'returned' },
    { name:'Sofia Reyes',  action:'— Inactive',              time:'1 min ago', type:'inactive' },
    { name:'Mei Zhang',    action:'— message sent',          time:'just now',  type:'message' },
  ];
  const ts = {
    returned:{ color:T.green, bg:T.greenDim, bd:T.greenBorder, Icon:RotateCcw },
    inactive:{ color:T.amber, bg:T.amberDim, bd:T.amberBorder, Icon:AlertTriangle },
    message: { color:T.blue,  bg:T.blueDim,  bd:T.blueBorder,  Icon:Send },
  };
  return (
    <div style={card()}>
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'13px 16px', borderBottom:`1px solid ${T.border}` }}>
        <span style={{ width:7,height:7,borderRadius:'50%',background:T.green,boxShadow:`0 0 7px ${T.green}`,flexShrink:0 }}/>
        <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:T.textMuted, textTransform:'uppercase' }}>Recent Live Activity</span>
      </div>
      {evs.map((ev,i)=>{
        const {color,bg,bd,Icon}=ts[ev.type];
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px',
            borderBottom: i<evs.length-1?`1px solid ${T.border}`:'none' }}>
            <Avatar name={ev.name} size={30}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, color:T.textPrimary, lineHeight:1.3 }}>
                <span style={{ fontWeight:700 }}>{ev.name}</span>
                <span style={{ color:ev.type==='inactive'?T.amber:T.textSecondary }}> {ev.action}</span>
              </div>
              <div style={{ fontSize:10.5, color:T.textMuted, marginTop:2 }}>{ev.time}</div>
            </div>
            <div style={{ width:24,height:24,borderRadius:'50%',background:bg,border:`1px solid ${bd}`,
              display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Icon size={10} color={color}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Action Queue ───────────────────────────────────────────── */
function ActionQueue({ atRisk=3 }) {
  const items = [
    { tag:'Retention', tc:'red', title:`${atRisk} members at risk`, detail:'No visit in 14+ days', acc:T.red },
    { tag:'New Members', tc:'amber', title:'2 new — no return', detail:'Week-1 retention window', acc:T.amber },
  ];
  return (
    <div style={card()}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'13px 16px', borderBottom:`1px solid ${T.border}` }}>
        <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:T.textMuted, textTransform:'uppercase' }}>Action Queue</span>
        <Badge label="1 Urgent" color="red"/>
      </div>
      {items.map((act,i)=>(
        <div key={i} style={{ padding:'13px 16px', borderLeft:`3px solid ${act.acc}`,
          borderBottom: i<items.length-1?`1px solid ${T.border}`:'none' }}>
          <div style={{ marginBottom:5 }}><Badge label={act.tag} color={act.tc}/></div>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.textPrimary, marginBottom:3 }}>{act.title}</div>
          <div style={{ fontSize:11, color:T.textMuted, marginBottom:10 }}>{act.detail}</div>
          <div style={{ display:'flex', gap:6 }}>
            <Btn small style={{ flex:1 }}><Send size={10}/> Message</Btn>
            <Btn small variant="ghost">View</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main Export ────────────────────────────────────────────── */
export default function TabOverview({
  totalMembers=87, retentionRate=78, atRisk=3, mrr=4800,
  automationStats={ messagesSent:83, reengaged:29, mrrRetained:940, reengagementRate:35 },
}) {
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const id = 'tab-ov8-anim';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ov8m>*{animation:fadeUp 0.35s ease both}
        .ov8m>*:nth-child(1){animation-delay:0ms}.ov8m>*:nth-child(2){animation-delay:70ms}.ov8m>*:nth-child(3){animation-delay:140ms}
        .ov8s>*{animation:fadeUp 0.35s ease both}
        .ov8s>*:nth-child(1){animation-delay:60ms}.ov8s>*:nth-child(2){animation-delay:120ms}.ov8s>*:nth-child(3){animation-delay:180ms}
      `;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{ display:'flex', background:T.bg, minHeight:'100vh',
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Header atRisk={atRisk}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, padding:20, alignItems:'start' }}>
          {/* Left */}
          <div className="ov8m" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <AtRiskPipeline atRisk={atRisk} mrr={mrr} totalMembers={totalMembers}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <EngagementImpact stats={automationStats}/>
              <MemberHealth totalMembers={totalMembers}/>
            </div>
          </div>
          {/* Right */}
          <div className="ov8s" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <SmartPriorities/>
            <RecentLiveActivity/>
            <ActionQueue atRisk={atRisk}/>
          </div>
        </div>
      </div>
    </div>
  );
}
