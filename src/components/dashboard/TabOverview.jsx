import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import {
  AlertTriangle, ArrowRight, CheckCircle, ChevronRight, Send,
  Settings, Trophy, UserPlus, Users, Zap, Activity, TrendingUp,
  TrendingDown, Search, RotateCcw, BarChart2, Star, Bell,
  Calendar, Clock, MessageSquare, Phone, PlayCircle, List,
  AlertCircle, Check, MoreHorizontal, Eye, Dumbbell,
} from 'lucide-react';

/* ─── Design tokens ──────────────────────────────────────────── */
const T = {
  bg:          '#060c18',
  surface:     '#0b1221',
  surfaceHigh: '#0f1830',
  surfaceMid:  '#0d1628',
  border:      'rgba(255,255,255,0.06)',
  borderMid:   'rgba(255,255,255,0.10)',
  textPrimary:   '#eef2ff',
  textSecondary: '#7d8ea6',
  textMuted:     '#3d4f66',
  blue:   '#3b82f6', blueDim:   'rgba(59,130,246,0.12)',  blueBorder:  'rgba(59,130,246,0.28)',
  red:    '#f04f4f', redDim:    'rgba(240,79,79,0.10)',   redBorder:   'rgba(240,79,79,0.22)',
  amber:  '#f59e0b', amberDim:  'rgba(245,158,11,0.10)',  amberBorder: 'rgba(245,158,11,0.22)',
  green:  '#34d399', greenDim:  'rgba(52,211,153,0.10)',  greenBorder: 'rgba(52,211,153,0.22)',
  purple: '#a78bfa', purpleDim: 'rgba(167,139,250,0.10)', purpleBorder:'rgba(167,139,250,0.22)',
};

const card = (ex={}) => ({
  background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, ...ex,
});
const fmtM = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${Math.round(n)}`;

/* ── Avatar ─────────────────────────────────────────────────── */
function Avatar({ name='?', size=28 }) {
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const hue = [...name].reduce((a,c)=>a+c.charCodeAt(0),0) % 360;
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`hsl(${hue},40%,16%)`, border:`1.5px solid hsl(${hue},40%,26%)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.36, fontWeight:700, color:`hsl(${hue},55%,65%)`,
    }}>{initials}</div>
  );
}

/* ── AvatarStack ─────────────────────────────────────────────── */
function AvatarStack({ names=[], size=22 }) {
  return (
    <div style={{ display:'flex', alignItems:'center' }}>
      {names.slice(0,5).map((n,i)=>(
        <div key={i} style={{ marginLeft: i===0?0:-7, zIndex:10-i }}>
          <Avatar name={n} size={size}/>
        </div>
      ))}
      {names.length>5 && (
        <div style={{ width:size, height:size, borderRadius:'50%', background:T.surfaceHigh,
          border:`1.5px solid ${T.border}`, display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:9, color:T.textMuted, marginLeft:-7 }}>
          +{names.length-5}
        </div>
      )}
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────────── */
function Badge({ label, color='blue', dot, small }) {
  const m = {
    blue:[T.blue,T.blueDim,T.blueBorder],
    red:[T.red,T.redDim,T.redBorder],
    amber:[T.amber,T.amberDim,T.amberBorder],
    green:[T.green,T.greenDim,T.greenBorder],
    purple:[T.purple,T.purpleDim,T.purpleBorder],
  };
  const [fg,bg,bd] = m[color]||m.blue;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4,
      padding: small ? '2px 6px' : '3px 8px',
      borderRadius:5, background:bg, border:`1px solid ${bd}`,
      fontSize: small ? 9 : 10, fontWeight:800, color:fg,
      letterSpacing:'0.07em', textTransform:'uppercase', flexShrink:0,
    }}>
      {dot && <span style={{width:5,height:5,borderRadius:'50%',background:fg,flexShrink:0}}/>}
      {label}
    </span>
  );
}

/* ── Btn ────────────────────────────────────────────────────── */
function Btn({ onClick, children, variant='primary', small, style:sx={} }) {
  const [hov, setHov] = useState(false);
  const base = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:5,
    padding: small ? '5px 10px' : '8px 14px', borderRadius:7, cursor:'pointer', fontWeight:700,
    fontSize: small ? 10.5 : 12, transition:'all 0.15s', whiteSpace:'nowrap', flexShrink:0,
    border:'none', ...sx };
  if (variant==='danger') return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background:hov?'rgba(240,79,79,0.22)':T.redDim, color:T.red, border:`1px solid ${T.redBorder}`}}>
      {children}
    </button>
  );
  if (variant==='ghost') return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background:hov?'rgba(255,255,255,0.05)':'transparent', color:hov?T.textSecondary:T.textMuted, border:'none'}}>
      {children}
    </button>
  );
  if (variant==='secondary') return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background:hov?T.surfaceHigh:T.surfaceMid, color:T.textSecondary, border:`1px solid ${T.border}`}}>
      {children}
    </button>
  );
  if (variant==='green') return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background:hov?'rgba(52,211,153,0.22)':T.greenDim, color:T.green, border:`1px solid ${T.greenBorder}`}}>
      {children}
    </button>
  );
  if (variant==='amber') return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background:hov?'rgba(245,158,11,0.22)':T.amberDim, color:T.amber, border:`1px solid ${T.amberBorder}`}}>
      {children}
    </button>
  );
  return (
    <button onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onClick}
      style={{...base, background:hov?'#4a8ef7':T.blue, color:'#fff', border:`1px solid ${T.blueBorder}`,
        boxShadow:hov?`0 0 16px rgba(59,130,246,0.3)`:'none'}}>
      {children}
    </button>
  );
}

/* ── Sparkline ──────────────────────────────────────────────── */
function Sparkline({ data=[], color=T.blue, height=38, width=110 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1))*width;
    const y = height - ((v-min)/range)*(height-6) - 3;
    return `${x},${y}`;
  }).join(' ');
  const area = `M0,${height} L${pts.split(' ').map(p=>`L${p}`).join(' ')} L${width},${height} Z`
    .replace('L L','M').replace(/L(\d)/,'L$1');
  const gradId = `sg_${color.replace('#','')}`;
  return (
    <svg width={width} height={height} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 1 — Member Retention Status & Forecast
═══════════════════════════════════════════════════════════════ */
function RetentionStatusCard({ totalMembers=87, mrr=4800 }) {
  const tiers = [
    {
      label:'Slipping', sub:'(7-10d)', count:12, color:T.amber, barPct:82,
      members:['Alex B','Sam C','Chris D','Jordan E','Taylor F','Riley G','Casey H'],
      action:'Bulk Message Nudge', actionVariant:'amber', Icon:MessageSquare,
    },
    {
      label:'Slipping', sub:'(11-13d)', count:3, color:'#f97316', barPct:55,
      members:['Morgan K','Drew L','Quinn M'],
      action:'Bulk Message Nudge', actionVariant:'amber', Icon:MessageSquare,
    },
    {
      label:'Ghosting', sub:'(14-20d)', count:3, color:T.red, barPct:42,
      members:['Jamie N','Avery O','Blake P'],
      action:'Schedule Individual Call', actionVariant:'danger', Icon:Phone,
    },
    {
      label:'Churn Imminent', sub:'(21d+)', count:1, color:'#ff2d2d', barPct:14,
      members:['Skyler Q'],
      action:'Run Automated Rule', actionVariant:'secondary', Icon:PlayCircle,
    },
  ];

  return (
    <div style={{ ...card({padding:0}),
      background:`linear-gradient(135deg,${T.surface} 70%,rgba(240,79,79,0.05) 100%)`,
      border:`1px solid ${T.redBorder}` }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'14px 18px 10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:7, background:T.redDim,
            border:`1px solid ${T.redBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <AlertTriangle size={12} color={T.red}/>
          </div>
          <span style={{ fontSize:13.5, fontWeight:800, color:T.textPrimary }}>
            Member Retention Status &amp; Forecast
          </span>
          <span style={{ fontSize:11, color:T.textMuted }}>(14+ Days Inactive)</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:T.red,
            boxShadow:`0 0 6px ${T.red}` }}/>
          <span style={{ fontSize:11.5, fontWeight:700, color:T.textPrimary }}>3 Members at MikKit</span>
        </div>
      </div>

      {/* Subtitle */}
      <div style={{ padding:'0 18px 12px', fontSize:12, color:T.textSecondary }}>
        ~<span style={{ color:T.red, fontWeight:800 }}>-$17/mo MRR</span> at risk.
        {' '}Proactive outreach recovers ~<span style={{ color:T.green, fontWeight:700 }}>75%</span>.
      </div>

      {/* Tier columns */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
        gap:0, borderTop:`1px solid ${T.border}` }}>
        {tiers.map((t, i) => (
          <div key={i} style={{ padding:'12px 14px',
            borderRight: i<3 ? `1px solid ${T.border}` : 'none' }}>
            {/* Label + count */}
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6 }}>
              <div>
                <span style={{ fontSize:11, fontWeight:700, color:T.textSecondary }}>{t.label} </span>
                <span style={{ fontSize:10, color:T.textMuted }}>{t.sub}</span>
              </div>
              <span style={{ fontSize:11, fontWeight:800, color:t.color }}>{t.count} members</span>
            </div>
            {/* Progress bar */}
            <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:10 }}>
              <div style={{ height:'100%', width:`${t.barPct}%`, background:t.color,
                borderRadius:2, boxShadow:`0 0 6px ${t.color}66` }}/>
            </div>
            {/* Avatars */}
            <div style={{ marginBottom:10 }}>
              <AvatarStack names={t.members} size={24}/>
            </div>
            {/* Action button */}
            <button style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center',
              gap:5, padding:'7px 8px', borderRadius:7, cursor:'pointer', fontWeight:700,
              fontSize:10.5, border:`1px solid ${t.color}44`,
              background:`${t.color}18`, color:t.color, whiteSpace:'nowrap' }}>
              <t.Icon size={10}/>
              {t.action}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px',
        borderTop:`1px solid ${T.border}`, background:'rgba(0,0,0,0.15)', borderRadius:'0 0 12px 12px' }}>
        <div style={{ width:16, height:16, borderRadius:4, background:T.redDim,
          border:`1px solid ${T.redBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <TrendingDown size={9} color={T.red}/>
        </div>
        <span style={{ fontSize:11.5, color:T.textSecondary }}>
          Projected churn forecast:{' '}
          <span style={{ color:T.red, fontWeight:800 }}>$117/mo</span>
          {' '}on projected{' '}
          <span style={{ color:T.green, fontWeight:700 }}>-25%</span>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 2 — Re-designed Engagement Metrics
═══════════════════════════════════════════════════════════════ */
function EngagementMetrics({ stats={} }) {
  const msgData  = [42,38,55,48,62,58,71,65,83];
  const reengData= [14,18,15,22,20,26,24,29,29];
  const mrrData  = [710,740,760,800,820,870,900,920,940];

  const rows = [
    { value:stats.messagesSent??83,  label:'Messages Sent',
      data:msgData, color:T.textPrimary, trend:null },
    { value:stats.reengaged??29, label:'Members Re-engaged',
      data:reengData, color:T.green, trend:'+5% MoM', up:true },
    { value:`$${stats.mrrRetained??940}`, label:'MRR',
      data:mrrData, color:T.blue, trend:'+MRR MoM', up:true },
  ];

  return (
    <div style={{ ...card({ padding:0 }) }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 16px',
        borderBottom:`1px solid ${T.border}` }}>
        <div style={{ width:22, height:22, borderRadius:6, background:T.blueDim,
          border:`1px solid ${T.blueBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <BarChart2 size={10} color={T.blue}/>
        </div>
        <span style={{ fontSize:12, fontWeight:800, color:T.textPrimary }}>
          Re-designed Engagement Metrics
        </span>
      </div>

      {/* Metrics rows */}
      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {rows.map(({ value, label, data, color, trend, up }, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:'0 0 auto', minWidth:48 }}>
              <div style={{ fontSize:22, fontWeight:900, color, letterSpacing:'-0.03em', lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:10, color:T.textMuted, marginTop:2, whiteSpace:'nowrap' }}>{label}</div>
              {trend && (
                <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:3 }}>
                  {up ? <TrendingUp size={9} color={T.green}/> : <TrendingDown size={9} color={T.red}/>}
                  <span style={{ fontSize:9, color:up?T.green:T.red, fontWeight:700 }}>{trend}</span>
                </div>
              )}
            </div>
            <div style={{ flex:1 }}>
              <Sparkline data={data} color={color} height={36} width={120}/>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding:'10px 16px', borderTop:`1px solid ${T.border}` }}>
        <button style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none',
          color:T.blue, fontSize:11.5, fontWeight:700, cursor:'pointer', padding:0 }}>
          View Full Report <ArrowRight size={11}/>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 3 — Member Health Overview
═══════════════════════════════════════════════════════════════ */
function MemberHealth({ totalMembers=87 }) {
  const [tab, setTab] = useState('All');
  const tabs = ['Premium','Basic','All'];
  const data = [
    { label:'Highly Active (0-6d)', pct:75, color:T.green },
    { label:'Slipping (7-13d)',      pct:10, color:T.amber },
    { label:'At Risk (14+)',         pct:16, color:T.red },
  ];
  const visibleTotal = 4;
  const trendData = [1.2,1.4,1.3,1.5,1.4,1.6,1.35,1.35,1.353];

  return (
    <div style={{ ...card({ padding:0 }) }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'13px 16px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:22, height:22, borderRadius:6, background:T.greenDim,
            border:`1px solid ${T.greenBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Activity size={10} color={T.green}/>
          </div>
          <span style={{ fontSize:12, fontWeight:800, color:T.textPrimary }}>Member Health Overview</span>
        </div>
        <div style={{ display:'flex', gap:3 }}>
          {tabs.map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'3px 8px', borderRadius:5, fontSize:9.5, fontWeight:700,
              cursor:'pointer', border:'none',
              background: tab===t ? T.blue : 'transparent',
              color: tab===t ? '#fff' : T.textMuted,
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'14px 16px' }}>
        {/* Donut + legend */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <div style={{ width:90, height:90, flexShrink:0, position:'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.map(d=>({name:d.label,value:d.pct}))}
                  cx="50%" cy="50%" innerRadius={28} outerRadius={42}
                  startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  {data.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:18, fontWeight:900, color:T.textPrimary, lineHeight:1 }}>{visibleTotal}</span>
              <span style={{ fontSize:8, color:T.textMuted, marginTop:1 }}>total</span>
            </div>
          </div>
          <div style={{ flex:1 }}>
            {data.map(({label,pct,color},i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:7 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:color,
                  flexShrink:0, boxShadow:`0 0 5px ${color}` }}/>
                <span style={{ fontSize:10, color:T.textSecondary, flex:1 }}>{label}</span>
                <span style={{ fontSize:11.5, fontWeight:800, color, minWidth:28, textAlign:'right' }}>{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visit frequency trend */}
        <div style={{ background:T.surfaceHigh, border:`1px solid ${T.border}`, borderRadius:8, padding:'10px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:10, color:T.textMuted }}>Average Visit Frequency trend</span>
            <span style={{ fontSize:12, fontWeight:800, color:T.textSecondary }}>1.353</span>
          </div>
          <Sparkline data={trendData} color={T.green} height={28} width={200}/>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 4 — Recent Live Activity
═══════════════════════════════════════════════════════════════ */
function RecentLiveActivity() {
  const [tab, setTab] = useState('Automated outreach');
  const tabs = ['Automated outreach','Member action','Staff action'];

  const evs = [
    { name:'James Okafor', action:'returned via automation', time:'just now', type:'returned' },
    { name:'Seffa Sharma', action:'— inactive',              time:'1 min ago', type:'inactive' },
    { name:'Mal Zhang',    action:'— message sent',          time:'just now',  type:'message'  },
  ];
  const ts = {
    returned:{ color:T.green, bg:T.greenDim, bd:T.greenBorder, Icon:RotateCcw },
    inactive:{ color:T.amber, bg:T.amberDim, bd:T.amberBorder, Icon:AlertTriangle },
    message: { color:T.blue,  bg:T.blueDim,  bd:T.blueBorder,  Icon:Send },
  };

  return (
    <div style={{ ...card({ padding:0 }) }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'11px 14px 8px',
        borderBottom:`1px solid ${T.border}` }}>
        <span style={{ width:7,height:7,borderRadius:'50%',background:T.green,
          boxShadow:`0 0 7px ${T.green}`,flexShrink:0 }}/>
        <span style={{ fontSize:10.5, fontWeight:800, letterSpacing:'0.1em',
          color:T.textMuted, textTransform:'uppercase' }}>Recent Live Activity</span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, padding:'8px 14px 0',
        borderBottom:`1px solid ${T.border}` }}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            padding:'5px 9px', background:'none', border:'none',
            borderBottom: tab===t ? `2px solid ${T.blue}` : '2px solid transparent',
            color: tab===t ? T.blue : T.textMuted,
            fontSize:9.5, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
            marginBottom:-1,
          }}>{t}</button>
        ))}
      </div>

      {/* Events */}
      {evs.map((ev,i)=>{
        const s = ts[ev.type];
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
            borderBottom: i<evs.length-1?`1px solid ${T.border}`:'none' }}>
            <Avatar name={ev.name} size={28}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11.5, color:T.textPrimary, lineHeight:1.3 }}>
                <span style={{ fontWeight:700 }}>{ev.name}</span>
                <span style={{ color:ev.type==='inactive'?T.amber:T.textSecondary }}> {ev.action}</span>
              </div>
              <div style={{ fontSize:10, color:T.textMuted, marginTop:1 }}>{ev.time}</div>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              {/* action icons */}
              {[MessageSquare, Phone, Eye].map((Ic,j)=>(
                <div key={j} style={{ width:22,height:22,borderRadius:5,
                  background:T.surfaceHigh, border:`1px solid ${T.border}`,
                  display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}>
                  <Ic size={9} color={T.textMuted}/>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 5 — Priority To-Dos
═══════════════════════════════════════════════════════════════ */
function PriorityTodos() {
  const [filter, setFilter] = useState('High');
  const [bulkSel, setBulkSel] = useState(false);
  const filters = ['Critical','High','Medium'];

  const sections = [
    {
      title:'At-Risk Calls',
      items:[{
        name:'Sarah J.',
        detail:'returned to the fient',
        sub:'Automated outreach with an outreach\n1000 visits et ricio',
        badge:'2 dots', badgeColor:'amber',
      }],
    },
    {
      title:'Member Updates',
      items:[{
        name:'Priya Sharma',
        detail:'retuned to thmnibers',
        sub:'1 John Doe',
        badge:'3 sent', badgeColor:'blue',
      }],
    },
    {
      title:'Anniversaries',
      items:[{
        name:'Anniversaries',
        detail:'→ for 8.81 mankary',
        sub:'',
        badge:null,
      }],
    },
  ];

  return (
    <div style={{ ...card({ padding:0 }) }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'11px 14px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:20, height:20, borderRadius:5, background:T.amberDim,
            border:`1px solid ${T.amberBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Star size={10} color={T.amber}/>
          </div>
          <span style={{ fontSize:11.5, fontWeight:800, color:T.textPrimary }}>Priority To-Dos</span>
        </div>
        <button onClick={()=>setBulkSel(!bulkSel)} style={{
          padding:'4px 9px', borderRadius:6, background:bulkSel?T.blue:T.blueDim,
          border:`1px solid ${T.blueBorder}`, color:bulkSel?'#fff':T.blue,
          fontSize:10, fontWeight:700, cursor:'pointer',
        }}>Bulk Message Selected</button>
      </div>

      {/* Filter row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 14px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', gap:6 }}>
          {filters.map(f=>{
            const colors = { Critical:T.red, High:T.amber, Medium:T.green };
            const c = colors[f]||T.blue;
            return (
              <button key={f} onClick={()=>setFilter(f)} style={{
                padding:'3px 9px', borderRadius:5, cursor:'pointer', fontSize:10, fontWeight:700,
                background: filter===f ? `${c}22` : 'transparent',
                border: filter===f ? `1px solid ${c}44` : `1px solid transparent`,
                color: filter===f ? c : T.textMuted,
              }}>{f}</button>
            );
          })}
        </div>
        <span style={{ fontSize:10, color:T.textMuted }}>Effort Estimate</span>
      </div>

      {/* Sections */}
      {sections.map((sec,si)=>(
        <div key={si}>
          <div style={{ padding:'7px 14px 4px',
            fontSize:10, fontWeight:800, color:T.textMuted,
            letterSpacing:'0.08em', textTransform:'uppercase',
            background:'rgba(0,0,0,0.12)' }}>
            {sec.title}
          </div>
          {sec.items.map((item,ii)=>(
            <div key={ii} style={{ display:'flex', alignItems:'flex-start', gap:9,
              padding:'9px 14px', borderBottom:`1px solid ${T.border}` }}>
              <Avatar name={item.name==='Anniversaries'?'An N':item.name} size={26}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11.5, fontWeight:700, color:T.textPrimary, lineHeight:1.3 }}>
                  <span style={{ color:T.textPrimary }}>{item.name}</span>
                  <span style={{ color:T.textMuted, fontWeight:400 }}> {item.detail}</span>
                </div>
                {item.sub && (
                  <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{item.sub}</div>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                {item.badge && (
                  <Badge label={item.badge} color={item.badgeColor} small/>
                )}
                <div style={{ width:18, height:18, borderRadius:4, background:T.surfaceHigh,
                  border:`1px solid ${T.border}`, display:'flex', alignItems:'center',
                  justifyContent:'center', cursor:'pointer' }}>
                  <MoreHorizontal size={9} color={T.textMuted}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 6 — Facility Snapshots (NEW)
═══════════════════════════════════════════════════════════════ */
function FacilitySnapshots() {
  const occupancy = 72;
  const classes = [
    { name:'Soccer day 1', time:'7:39 pm', instructor:'Raela-5th-\ninstructor', instructor2:'Ariys Sham', status:'Active' },
  ];

  return (
    <div style={{ ...card({ padding:0 }) }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'11px 14px', borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:20, height:20, borderRadius:5, background:T.greenDim,
            border:`1px solid ${T.greenBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Dumbbell size={10} color={T.green}/>
          </div>
          <span style={{ fontSize:11.5, fontWeight:800, color:T.textPrimary }}>New Card: Facility Snapshots</span>
        </div>
      </div>

      <div style={{ padding:'12px 14px' }}>
        {/* Occupancy */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:11, fontWeight:700, color:T.textSecondary }}>Real-time class occupancy</span>
          </div>
          <div style={{ position:'relative', height:20, background:T.surfaceHigh,
            border:`1px solid ${T.border}`, borderRadius:4, overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
              justifyContent:'space-between', padding:'0 8px', zIndex:2 }}>
              <span style={{ fontSize:9, color:T.textMuted }}>Low</span>
              <span style={{ fontSize:9, color:T.textMuted }}>High</span>
            </div>
            <div style={{ width:`${occupancy}%`, height:'100%',
              background:`linear-gradient(90deg,${T.green}88,${T.green})`,
              borderRadius:4, zIndex:1, position:'relative' }}/>
          </div>
        </div>

        {/* Upcoming class schedule */}
        <div style={{ marginBottom:12 }}>
          <span style={{ fontSize:10, fontWeight:800, color:T.textMuted,
            textTransform:'uppercase', letterSpacing:'0.08em' }}>Upcoming class schedule</span>
          <div style={{ marginTop:8, background:T.surfaceHigh, border:`1px solid ${T.border}`,
            borderRadius:7, overflow:'hidden' }}>
            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
              padding:'6px 10px', borderBottom:`1px solid ${T.border}` }}>
              {['BOOKING STATUS','INSTRUCTOR','INSTRUCTOR'].map((h,i)=>(
                <span key={i} style={{ fontSize:8.5, fontWeight:800, color:T.textMuted,
                  letterSpacing:'0.08em', textAlign: i>0?'center':'left' }}>{h}</span>
              ))}
            </div>
            {/* Row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
              padding:'8px 10px', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:10.5, fontWeight:700, color:T.textPrimary }}>Soccer day 1</div>
                <div style={{ fontSize:9.5, color:T.textMuted }}>7:39 pm</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:9.5, color:T.textSecondary }}>Raela-5th-</div>
                <div style={{ fontSize:9.5, color:T.textSecondary }}>instructor</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:9.5, color:T.textSecondary }}>Ariys Sham</div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff presence */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 10px', background:T.surfaceHigh, border:`1px solid ${T.border}`,
            borderRadius:7 }}>
            <div>
              <div style={{ fontSize:10.5, fontWeight:700, color:T.textSecondary, marginBottom:2 }}>Staff presence</div>
              <div style={{ fontSize:9.5, color:T.textMuted }}>Staff presence</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:9.5, color:T.green, fontWeight:700 }}>Active</span>
              <span style={{ fontSize:9.5, color:T.textMuted }}>vs. scheduled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CARD 7 — System Actions
═══════════════════════════════════════════════════════════════ */
function SystemActions() {
  const [checked, setChecked] = useState({});

  const items = [
    { id:'a1', type:'alert', icon:AlertCircle, color:T.red,
      title:'System alerts', detail:'System alerts fato and system alerts.' },
    { id:'a2', type:'list', icon:List, color:T.textMuted,
      title:'Manual task lists', detail:'Review action toot ment' },
    { id:'a3', type:'list', icon:List, color:T.textMuted,
      title:'Manual task lists', detail:'Oumne to the task lists.' },
  ];

  return (
    <div style={{ ...card({ padding:0 }) }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'11px 14px', borderBottom:`1px solid ${T.border}` }}>
        <span style={{ fontSize:11.5, fontWeight:800, color:T.textPrimary }}>System Actions</span>
        <button style={{ padding:'4px 9px', borderRadius:6, background:T.blueDim,
          border:`1px solid ${T.blueBorder}`, color:T.blue,
          fontSize:10, fontWeight:700, cursor:'pointer' }}>
          Review All Actions
        </button>
      </div>

      <div style={{ padding:'8px 0' }}>
        {items.map((item, i) => {
          const ck = !!checked[item.id];
          return (
            <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:9,
              padding:'9px 14px', borderBottom: i<items.length-1?`1px solid ${T.border}`:'none' }}>
              {/* Check / icon */}
              {item.type==='alert' ? (
                <div style={{ width:20, height:20, borderRadius:5, background:T.redDim,
                  border:`1px solid ${T.redBorder}`, display:'flex', alignItems:'center',
                  justifyContent:'center', flexShrink:0, marginTop:1 }}>
                  <item.icon size={10} color={T.red}/>
                </div>
              ) : (
                <div onClick={()=>setChecked(p=>({...p,[item.id]:!p[item.id]}))}
                  style={{ width:16, height:16, borderRadius:4, flexShrink:0, marginTop:2,
                    border:`1.5px solid ${ck?T.green:T.borderMid}`,
                    background:ck?T.greenDim:'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', transition:'all 0.15s' }}>
                  {ck && <Check size={10} color={T.green}/>}
                </div>
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11.5, fontWeight:700, color:T.textPrimary,
                  textDecoration: ck?'line-through':'none',
                  color: ck?T.textMuted:T.textPrimary }}>{item.title}</div>
                <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{item.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabOverview({
  totalMembers=87, retentionRate=78, atRisk=3, mrr=4800,
  automationStats={ messagesSent:83, reengaged:29, mrrRetained:940, reengagementRate:35 },
}) {
  useEffect(() => {
    const id = 'tab-ov9-anim';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = `
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .ov9row>*{animation:fadeUp 0.38s ease both}
        .ov9row>*:nth-child(1){animation-delay:0ms}
        .ov9row>*:nth-child(2){animation-delay:80ms}
        .ov9row>*:nth-child(3){animation-delay:160ms}
        .ov9row>*:nth-child(4){animation-delay:240ms}
      `;
      document.head.appendChild(el);
    }
  }, []);

  return (
    <div style={{ background:T.bg, minHeight:'100vh', padding:18,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>

      {/* Row 1 — Full width retention card */}
      <div style={{ marginBottom:14 }}>
        <RetentionStatusCard totalMembers={totalMembers} mrr={mrr}/>
      </div>

      {/* Row 2 — Engagement | Health | Live Activity */}
      <div className="ov9row" style={{ display:'grid',
        gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14, alignItems:'start' }}>
        <EngagementMetrics stats={automationStats}/>
        <MemberHealth totalMembers={totalMembers}/>
        <RecentLiveActivity/>
      </div>

      {/* Row 3 — Priority Todos | Facility Snapshots | System Actions */}
      <div className="ov9row" style={{ display:'grid',
        gridTemplateColumns:'1fr 1fr 1fr', gap:14, alignItems:'start' }}>
        <PriorityTodos/>
        <FacilitySnapshots/>
        <SystemActions/>
      </div>
    </div>
  );
}
