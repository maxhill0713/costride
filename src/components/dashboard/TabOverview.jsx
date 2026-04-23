/**
 * Forge Fitness — Gym Owner Dashboard (Overview)
 */
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import {
LayoutDashboard, Users, FileText, BarChart2, MessageCircle,
Zap, BrainCircuit, Settings, QrCode, Search, Plus, Bell,
ChevronRight, ArrowUpRight, Eye, TrendingUp, Activity,
AlertTriangle, Flame, ChevronDown,
} from 'lucide-react';
/* ─── TOKENS ─────────────────────────────────────────────── */
const C = {
  bg:       '#000000',
  sidebar:  '#0f0f12',
  card:     '#141416',
  brd:      '#222226',
  t1:       '#ffffff',
  t2:       '#8a8a94',
  t3:       '#444450',
  cyan:     '#4d7fff',          // blue-500
  cyanDim:  'rgba(77,127,255,0.14)',
  cyanBrd:  'rgba(77,127,255,0.38)',
  red:      '#ff4d6d',
  redDim:   'rgba(255,77,109,0.15)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.15)',
  gradStart: '#4d7fff',
  gradMid:   '#2563eb',
  gradEnd:   '#1d4ed8',
};
const BG = (deg = 135) =>
  `linear-gradient(${deg}deg, ${C.gradStart} 0%, ${C.gradMid} 50%, ${C.gradEnd} 100%)`;
const FONT = "'DM Sans', 'Segoe UI', sans-serif";
/* ─── SCHEDULE DATA ──────────────────────────────────────── */
const SCHEDULE = [
  { time: '06:00', label: 'Early Bird HIIT',        instructor: 'Alex T.',   capacity: 12, booked: 11, color: '#f59e0b' },
  { time: '08:30', label: 'Morning Yoga Flow',       instructor: 'Sara M.',   capacity: 10, booked: 7,  color: '#14b8a6' },
  { time: '10:00', label: 'Strength & Conditioning', instructor: 'Coach Dan', capacity: 8,  booked: 8,  color: '#ff4d6d' },
  { time: '12:15', label: 'Lunchtime Spin',          instructor: 'Priya K.',  capacity: 15, booked: 9,  color: '#6366f1' },
  { time: '17:30', label: 'Peak Hour Open Gym',      instructor: '',          capacity: 40, booked: 31, color: '#4d7fff' },
  { time: '18:45', label: 'Boxing Basics',           instructor: 'Mike O.',   capacity: 12, booked: 12, color: '#ef4444' },
  { time: '19:30', label: 'Evening HIIT',            instructor: 'Alex T.',   capacity: 12, booked: 6,  color: '#f59e0b' },
];
/* ─── AVATAR ─────────────────────────────────────────────── */
function Av({ name, size = 20, style = {} }) {
const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#ef4444'];
const idx = (name?.charCodeAt(0) || 0) % colors.length;
return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[idx], border: `1.5px solid ${C.card}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      flexShrink: 0, ...style,
    }}>{(name || '?')[0].toUpperCase()}</div>
  );
}
/* ─── WAVEFORM ───────────────────────────────────────────── */
function WaveForm({ color = C.cyan }) {
const pts = [26,22,24,18,20,15,17,12,14,10,12,8,10,7,9,5,7,11,8,5,7,4,6,3,5,8,6,3,5,2,4,5];
const w = 130, h = 28;
const max = Math.max(...pts);
const pathD = pts.map((v, i) =>
`${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${h - (v / max) * (h - 4) - 2}`
  ).join(' ');
return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', width: '100%', height: 28 }}>
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${pathD} L ${w} ${h} L 0 ${h} Z`} fill="url(#wg)"/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
/* ─── MINI AREA ──────────────────────────────────────────── */
function MiniArea({ color = C.cyan }) {
const data = [{ v:28 },{ v:32 },{ v:30 },{ v:38 },{ v:42 },{ v:50 },{ v:55 },{ v:60 },{ v:70 }];
return (
    <ResponsiveContainer width="100%" height={28}>
      <AreaChart data={data} margin={{ top:2, right:0, bottom:0, left:0 }}>
        <defs>
          <linearGradient id="mag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#mag)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  );
}
/* ─── DONUT ──────────────────────────────────────────────── */
function Donut({ pct, size = 58, stroke = 5, color = C.cyan }) {
const r = (size - stroke * 2) / 2;
const circ = 2 * Math.PI * r;
const offset = circ - (pct / 100) * circ;
return (
    <div style={{ position:'relative', display:'inline-flex', flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
      </svg>
      <div style={{
        position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize: size < 50 ? 9 : 10, fontWeight:700, color:C.t1,
      }}>{pct}%</div>
    </div>
  );
}
/* ─── TREND ARROW ────────────────────────────────────────── */
function TrendArrow({ color = C.cyan, w = 52, h = 34 }) {
return (
    <svg width={w} height={h} viewBox="0 0 52 34">
      <polyline points="2,28 12,18 22,21 34,10 50,3"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="42,3 50,3 50,11"
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
/* ─── SIDEBAR ────────────────────────────────────────────── */
const NAV = [
  { icon: LayoutDashboard, label:'Overview',   active:true },
  { icon: Eye,             label:'Views' },
  { icon: Users,           label:'Members' },
  { icon: FileText,        label:'Content' },
  { icon: BarChart2,       label:'Analytics' },
  { icon: MessageCircle,   label:'Community' },
  { icon: Zap,             label:'Automations' },
  { icon: BrainCircuit,    label:'AI Coach' },
];
function Sidebar() {
return (
    <div style={{ width:188, flexShrink:0, background:C.sidebar, borderRight:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', height:'100vh' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px', borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ width:28, height:28, borderRadius:8, background:BG(), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🔥</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:C.t1, letterSpacing:'-0.02em' }}>Forge Fitness</div>
          <div style={{ fontSize:10, color:C.t2 }}>GYM OWNER</div>
        </div>
      </div>
      <div style={{ padding:'10px 8px', flex:1 }}>
        <div style={{ fontSize:9.5, fontWeight:600, color:C.t3, letterSpacing:'0.08em', textTransform:'uppercase', padding:'4px 8px 8px' }}>Navigation</div>
        {NAV.map((item,i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:7, cursor:'pointer',
            background: item.active ? C.cyanDim : 'transparent',
            borderLeft: item.active ? `2px solid ${C.cyan}` : '2px solid transparent',
            color: item.active ? C.t1 : C.t2,
            fontSize:12.5, fontWeight: item.active ? 600 : 400, marginBottom:1,
          }}>
            <item.icon style={{ width:13, height:13, flexShrink:0 }}/>{item.label}
          </div>
        ))}
      </div>
      <div style={{ padding:'8px', borderTop:`1px solid ${C.brd}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:7, cursor:'pointer', color:C.t2, fontSize:12.5 }}>
          <Settings style={{ width:13, height:13 }}/> Settings
        </div>
      </div>
    </div>
  );
}
/* ─── TOP BAR ────────────────────────────────────────────── */
function TopBar() {
return (
    <div style={{ height:46, flexShrink:0, background:C.sidebar, borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:13, fontWeight:600, color:C.t2 }}>Gym Owner Dashboard</span>
        <div style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.brd}`, borderRadius:7, padding:'5px 10px', width:220 }}>
          <Search style={{ width:12, height:12, color:C.t3, flexShrink:0 }}/>
          <span style={{ fontSize:12, color:C.t3 }}>Search members, content, or insights…</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.brd}`, borderRadius:7, padding:'5px 10px', fontSize:11.5, color:C.t2 }}>
          <span>📅</span> Friday 10 April 2026
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:7, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, color:C.cyan, fontSize:12, fontWeight:600, cursor:'pointer' }}>
        <QrCode style={{ width:12, height:12 }}/> + Scan QR
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════
   MOBILE
══════════════════════════════════════════════════════════ */
function MobileTopBar() {
return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 16px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:11, background:BG(), display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🔥</div>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:C.t1, letterSpacing:'-0.02em' }}>Forge Fitness</div>
          <div style={{ fontSize:10, color:C.t2, letterSpacing:'0.05em', textTransform:'uppercase' }}>Gym Owner · Apr 10</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:C.card, border:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Bell style={{ width:16, height:16, color:C.t2 }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'0 13px', height:36, borderRadius:10, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, color:C.cyan, fontSize:12.5, fontWeight:700, cursor:'pointer' }}>
          <QrCode style={{ width:13, height:13 }}/> QR
        </div>
      </div>
    </div>
  );
}
function MobileHero() {
return (
    <div style={{ padding:'0 16px 16px' }}>
      <div style={{ fontSize:20, fontWeight:800, color:C.t1, letterSpacing:'-0.03em', lineHeight:1.2 }}>
Good morning, Max. 👋
      </div>
      <div style={{ fontSize:13, color:C.t2, marginTop:5, lineHeight:1.5 }}>
Retention pulse is strong —{' '}
        <span style={{ color:C.cyan, fontWeight:600 }}>+4% from last week</span>
      </div>
      <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10, padding:'11px 13px', background:'rgba(255,77,109,0.07)', border:`1px solid rgba(255,77,109,0.22)`, borderRadius:12 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,77,109,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <AlertTriangle style={{ width:13, height:13, color:C.red }}/>
        </div>
        <div style={{ flex:1, fontSize:12, color:C.t2, lineHeight:1.5 }}>
Peak hours in 18 min · 5 at-risk members · 3 predicted churns
        </div>
        <div style={{ fontSize:12, fontWeight:700, color:C.cyan, flexShrink:0 }}>View</div>
      </div>
    </div>
  );
}
function MobileKpiGrid() {
return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:14, padding:'13px 13px 11px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-18, right:-18, width:60, height:60, borderRadius:'50%', background:C.cyan, opacity:0.05, filter:'blur(18px)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:11, color:C.t2, fontWeight:500 }}>Check-ins</span>
          <div style={{ width:22, height:22, borderRadius:6, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Activity style={{ width:11, height:11, color:C.cyan }}/>
          </div>
        </div>
        <div style={{ fontSize:32, fontWeight:800, color:C.t1, letterSpacing:'-0.04em', lineHeight:1 }}>34</div>
        <div style={{ fontSize:11, color:C.cyan, fontWeight:600, marginTop:4, marginBottom:10, display:'flex', alignItems:'center', gap:3 }}>
          <ArrowUpRight style={{ width:10, height:10 }}/> +24%
        </div>
        <WaveForm color={C.cyan}/>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:14, padding:'13px 13px 11px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-18, right:-18, width:60, height:60, borderRadius:'50%', background:C.cyan, opacity:0.05, filter:'blur(18px)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:11, color:C.t2, fontWeight:500 }}>Weekly Active</span>
          <div style={{ width:22, height:22, borderRadius:6, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Users style={{ width:11, height:11, color:C.cyan }}/>
          </div>
        </div>
        <div style={{ fontSize:32, fontWeight:800, color:C.t1, letterSpacing:'-0.04em', lineHeight:1 }}>42</div>
        <div style={{ fontSize:11, color:C.cyan, fontWeight:600, marginTop:4, marginBottom:10, display:'flex', alignItems:'center', gap:3 }}>
          <ArrowUpRight style={{ width:10, height:10 }}/> +7%
        </div>
        <MiniArea color={C.cyan}/>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:14, padding:'13px 13px 11px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-18, right:-18, width:60, height:60, borderRadius:'50%', background:'#6366f1', opacity:0.06, filter:'blur(18px)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:11, color:C.t2, fontWeight:500 }}>Live in Gym</span>
          <div style={{ width:22, height:22, borderRadius:6, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Flame style={{ width:11, height:11, color:'#6366f1' }}/>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:32, fontWeight:800, color:C.t1, letterSpacing:'-0.04em', lineHeight:1 }}>
19<span style={{ fontSize:16, color:C.t3, fontWeight:400 }}>%</span>
            </div>
            <div style={{ fontSize:10.5, color:C.t3, marginTop:5 }}>Peak 5–7 PM</div>
          </div>
          <Donut pct={19} size={52} stroke={5} color="#6366f1"/>
        </div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.cyanBrd}`, borderRadius:14, padding:'13px 13px 11px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-18, right:-18, width:60, height:60, borderRadius:'50%', background:C.cyan, opacity:0.07, filter:'blur(18px)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:11, color:C.t2, fontWeight:500 }}>Retention</span>
          <div style={{ width:22, height:22, borderRadius:6, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <TrendingUp style={{ width:11, height:11, color:C.cyan }}/>
          </div>
        </div>
        <div style={{ fontSize:32, fontWeight:800, color:C.cyan, letterSpacing:'-0.04em', lineHeight:1 }}>96%</div>
        <div style={{ fontSize:10.5, color:C.t3, marginTop:4, marginBottom:6 }}>Elite Tier</div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <TrendArrow color={C.cyan} w={46} h={26}/>
        </div>
      </div>
    </div>
  );
}
function MSH({ title, action, actionLabel='See all' }) {
return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
      <div style={{ fontSize:15, fontWeight:700, color:C.t1, letterSpacing:'-0.01em' }}>{title}</div>
      {action && (
        <div onClick={action} style={{ fontSize:12, color:C.cyan, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:2 }}>
          {actionLabel}<ChevronRight style={{ width:12, height:12 }}/>
        </div>
      )}
    </div>
  );
}
function MobilePriorities() {
const items = [
    { avs:['S','M','P'], text:'Nudge 5 at-risk members',        badge:'Urgent', bColor:C.red,   bBg:C.redDim },
    { avs:['D','E'],     text:'Launch "30-Day Strength Surge"', badge:'Run It', bColor:C.amber, bBg:C.amberDim },
    { avs:['R'],         text:'Review April revenue impact',    badge:null },
  ];
return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {items.map((it,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:13, background:C.card, border:`1px solid ${C.brd}`, cursor:'pointer' }}>
          <div style={{ display:'flex', flexShrink:0 }}>
            {it.avs.map((n,j) => <Av key={j} name={n} size={28} style={{ marginLeft:j>0?-8:0, border:`2px solid ${C.card}` }}/>)}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, color:C.t1, fontWeight:500, lineHeight:1.35 }}>{it.text}</div>
            {it.badge && (
              <span style={{ display:'inline-block', marginTop:5, fontSize:10.5, fontWeight:700, color:it.bColor, background:it.bBg, border:`1px solid ${it.bColor}50`, borderRadius:5, padding:'2px 9px' }}>{it.badge}</span>
            )}
          </div>
          <ChevronRight style={{ width:14, height:14, color:C.t3, flexShrink:0 }}/>
        </div>
      ))}
    </div>
  );
}
function MobileSchedule() {
const [expanded, setExpanded] = useState(false);
const shown = expanded ? SCHEDULE : SCHEDULE.slice(0,4);
return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {shown.map((s,i) => {
const pct = Math.round((s.booked/s.capacity)*100);
const full = s.booked >= s.capacity;
return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:11, padding:'12px 14px', borderRadius:13, background:C.card, border:`1px solid ${C.brd}` }}>
              <div style={{ width:3, height:36, borderRadius:4, background:s.color, flexShrink:0 }}/>
              <div style={{ fontSize:11.5, fontWeight:700, color:C.t3, width:36, flexShrink:0 }}>{s.time}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</div>
                {s.instructor && <div style={{ fontSize:11, color:C.t2, marginTop:2 }}>{s.instructor}</div>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:44, height:3, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:full?C.red:s.color, borderRadius:2 }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:full?C.red:C.t2, minWidth:26 }}>{s.booked}/{s.capacity}</span>
                </div>
                {full && <span style={{ fontSize:9, fontWeight:700, color:C.red, background:C.redDim, border:`1px solid ${C.red}40`, borderRadius:4, padding:'1px 6px' }}>FULL</span>}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => setExpanded(!expanded)} style={{ width:'100%', marginTop:8, padding:'11px', background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, borderRadius:12, color:C.t2, fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
        {expanded ? 'Show less' : `${SCHEDULE.length-4} more classes`}
        <ChevronDown style={{ width:13, height:13, transform:expanded?'rotate(180deg)':'none', transition:'transform 0.2s' }}/>
      </button>
    </div>
  );
}
function MobileCommunity() {
const cards = [
    { tag:'🆕 New Post',         tagColor:C.cyan,  title:"Coach Alex's Mobility Flow",    sub:'27 joined · 4 new reactions' },
    { tag:'Member Spotlight',    tagColor:C.amber, title:"Priya's 12-week transformation", sub:'Tap to celebrate 🎉' },
    { tag:'Event live tomorrow', tagColor:C.red,   title:'Free Recovery Workshop',         sub:'Register before it fills' },
  ];
return (
    <div style={{ overflowX:'auto', paddingBottom:4, marginLeft:-16, paddingLeft:16 }}>
      <div style={{ display:'flex', gap:10, paddingRight:16, width:'max-content' }}>
        {cards.map((c,i) => (
          <div key={i} style={{ width:185, flexShrink:0, padding:'13px 14px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}`, cursor:'pointer' }}>
            <div style={{ display:'inline-block', fontSize:10, fontWeight:700, color:c.tagColor, background:`${c.tagColor}18`, border:`1px solid ${c.tagColor}30`, borderRadius:5, padding:'2px 8px', marginBottom:8 }}>{c.tag}</div>
            <div style={{ fontSize:13, color:C.t1, fontWeight:600, lineHeight:1.35, marginBottom:5 }}>{c.title}</div>
            {c.sub && <div style={{ fontSize:11, color:C.t3, lineHeight:1.4 }}>{c.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
function MobileFab() {
return (
    <div style={{ position:'fixed', bottom:80, right:18, zIndex:100 }}>
      <button style={{ width:50, height:50, borderRadius:25, background:BG(), border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 14px rgba(77,127,255,0.30), 0 4px 10px rgba(77,127,255,0.18)' }}>
        <Plus style={{ width:22, height:22 }}/>
      </button>
    </div>
  );
}
function MobileBottomNav({ activeTab = 'Overview' }) {
const tabsConfig = [
    { key:'Overview',   icon:LayoutDashboard, label:'Home' },
    { key:'Members',    icon:Users,           label:'Members' },
    { key:'Analytics',  icon:BarChart2,       label:'Analytics' },
    { key:'Community',  icon:MessageCircle,   label:'Community' },
    { key:'AICoach',    icon:BrainCircuit,    label:'AI Coach' },
  ];
return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, background:'rgba(10,10,12,0.97)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderTop:`1px solid ${C.brd}`, padding:'8px 0 12px', display:'grid', gridTemplateColumns:'repeat(5,1fr)' }}>
      {tabsConfig.map((t,i) => {
const isActive = activeTab === t.key;
return (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer' }}>
            <div style={{ width:34, height:28, borderRadius:8, background:isActive?C.cyanDim:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <t.icon style={{ width:18, height:18, color:isActive?C.cyan:C.t3 }}/>
            </div>
            <div style={{ fontSize:9.5, color:isActive?C.cyan:C.t3, fontWeight:isActive?600:400 }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}
function MobileOverview() {
return (
    <div style={{ fontFamily:FONT, background:C.bg, minHeight:'100vh', paddingBottom:110 }}>
      <MobileTopBar />
      <MobileHero />
      <div style={{ padding:'0 16px', marginBottom:22 }}>
        <MSH title="Key Metrics" />
        <MobileKpiGrid />
      </div>
      <div style={{ padding:'0 16px', marginBottom:22 }}>
        <MSH title="Today's Priorities" action={() => {}} />
        <MobilePriorities />
      </div>
      <div style={{ padding:'0 16px', marginBottom:22 }}>
        <MSH title="Today's Schedule" action={() => {}} actionLabel="+ Add" />
        <MobileSchedule />
      </div>
      <div style={{ marginBottom:22 }}>
        <div style={{ padding:'0 16px 10px' }}>
          <MSH title="Community" action={() => {}} />
        </div>
        <MobileCommunity />
      </div>
      <MobileFab />
      <MobileBottomNav activeTab="Overview" />
    </div>
  );
}
/* ══════════════════════════════════════════════════════════
   DESKTOP OVERVIEW
══════════════════════════════════════════════════════════ */
function DesktopOverview() {
return (
    <div style={{ fontFamily:FONT, display:'flex', flexDirection:'column', gap:11, padding:'16px 20px', background:'#000', minHeight:'100%' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:19, fontWeight:700, color:C.t1, margin:0, letterSpacing:'-0.02em', lineHeight:1.25 }}>
Good morning, Max. Your retention pulse is strong today.
          </h1>
          <div style={{ fontSize:12, color:C.t2, marginTop:4, display:'flex', gap:5, alignItems:'center' }}>
42 members active <span style={{ color:C.t3 }}>•</span>
96% weekly retention <span style={{ color:C.t3 }}>•</span>
            <span style={{ color:C.cyan }}>+4% from last week</span>
          </div>
        </div>
        <button style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', background:BG(), border:'none', borderRadius:9, fontSize:12.5, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:FONT, boxShadow:'0 0 10px rgba(77,127,255,0.22), 0 2px 8px rgba(77,127,255,0.12)', flexShrink:0 }}>
          <Plus style={{ width:13, height:13 }}/> New Post
        </button>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', background:'rgba(255,255,255,0.02)', border:`1px solid ${C.brd}`, borderRadius:8, fontSize:12, color:C.t2 }}>
        <span>Peak hours begin in 18 minutes &nbsp;•&nbsp; 5 at-risk members detected &nbsp;•&nbsp; AI predicts 3 potential churns &nbsp;•&nbsp; 4 new community posts today</span>
        <span style={{ color:C.cyan, fontWeight:600, cursor:'pointer', marginLeft:10, flexShrink:0 }}>View</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
            <span style={{ fontSize:11, color:C.t2, fontWeight:500 }}>Today's Check-ins</span>
            <div style={{ width:18, height:18, borderRadius:5, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ArrowUpRight style={{ width:10, height:10, color:C.t3 }}/>
            </div>
          </div>
          <div style={{ fontSize:28, fontWeight:700, color:C.t1, letterSpacing:'-0.03em', lineHeight:1.1 }}>34</div>
          <div style={{ fontSize:11, color:C.cyan, display:'flex', alignItems:'center', gap:3, marginBottom:6 }}>
            <ArrowUpRight style={{ width:10, height:10 }}/> +24% ↑
          </div>
          <WaveForm color={C.cyan}/>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:C.t2, fontWeight:500, marginBottom:2 }}>Weekly Active Members</div>
          <div style={{ fontSize:28, fontWeight:700, color:C.t1, letterSpacing:'-0.03em', lineHeight:1.1 }}>42</div>
          <div style={{ fontSize:11, color:C.cyan, display:'flex', alignItems:'center', gap:3, marginBottom:6 }}>
            <ArrowUpRight style={{ width:10, height:10 }}/> +7%
          </div>
          <MiniArea color={C.cyan}/>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
            <span style={{ fontSize:11, color:C.t2, fontWeight:500 }}>Live in Gym</span>
            <div style={{ width:18, height:18, borderRadius:5, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Plus style={{ width:10, height:10, color:C.t3 }}/>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:2 }}>
            <div>
              <div style={{ fontSize:28, fontWeight:700, color:C.t1, letterSpacing:'-0.03em', lineHeight:1 }}>
19<span style={{ fontSize:15, color:C.t3, fontWeight:400 }}>%</span>
              </div>
              <div style={{ fontSize:10.5, color:C.t3, marginTop:4 }}>Peak 5–7 PM</div>
            </div>
            <Donut pct={19} size={58} stroke={5} color={C.cyan}/>
          </div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
            <span style={{ fontSize:11, color:C.t2, fontWeight:500 }}>Retention Score</span>
            <div style={{ width:18, height:18, borderRadius:5, background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ArrowUpRight style={{ width:10, height:10, color:C.t3 }}/>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginTop:2 }}>
            <div>
              <div style={{ fontSize:32, fontWeight:700, color:C.cyan, letterSpacing:'-0.03em', lineHeight:1 }}>96%</div>
              <div style={{ fontSize:11, color:C.t3, marginTop:4 }}>Elite Tier</div>
            </div>
            <TrendArrow color={C.cyan}/>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:11 }}>
        <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, padding:'16px 18px', flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:13, fontWeight:600, color:C.t1 }}>Today's Schedule</span>
            <button style={{ padding:'5px 12px', borderRadius:6, background:C.cyanDim, border:`1px solid ${C.cyanBrd}`, color:C.cyan, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>+ Add Class</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {SCHEDULE.map((s,i) => {
const pct = Math.round((s.booked/s.capacity)*100);
const full = s.booked >= s.capacity;
return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 11px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${C.brd}`, borderLeft:`3px solid ${s.color}` }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.t3, width:36, flexShrink:0 }}>{s.time}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:600, color:C.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</div>
                    {s.instructor && <div style={{ fontSize:10.5, color:C.t2, marginTop:1 }}>{s.instructor}</div>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:7, flexShrink:0 }}>
                    <div style={{ width:60 }}>
                      <div style={{ height:3, background:C.brd, borderRadius:2, overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:full?C.red:s.color, borderRadius:2 }}/>
                      </div>
                    </div>
                    <span style={{ fontSize:10.5, fontWeight:700, color:full?C.red:C.t2, minWidth:32, textAlign:'right' }}>{s.booked}/{s.capacity}</span>
                    {full && <span style={{ fontSize:9, fontWeight:700, color:C.red, background:C.redDim, border:`1px solid ${C.red}40`, borderRadius:4, padding:'1px 5px' }}>FULL</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, padding:'16px', width:248, flexShrink:0, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <div style={{ width:20, height:20, borderRadius:5, background:C.redDim, border:`1px solid rgba(255,77,109,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <AlertTriangle style={{ width:11, height:11, color:C.red }}/>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>At-Risk Members</span>
            <span style={{ marginLeft:'auto', fontSize:11, fontWeight:700, color:C.red, background:C.redDim, border:`1px solid rgba(255,77,109,0.28)`, borderRadius:5, padding:'2px 7px' }}>5</span>
          </div>
          <div style={{ fontSize:11, color:C.t3, marginBottom:12 }}>Haven't visited in 14+ days</div>
          <div style={{ display:'flex', flexDirection:'column', gap:7, flex:1 }}>
            {[
              { name:'Sarah M.',   days:21, risk:'High'   },
              { name:'Jake T.',    days:18, risk:'High'   },
              { name:'Priya K.',   days:16, risk:'Medium' },
              { name:'Dan R.',     days:15, risk:'Medium' },
              { name:'Emma L.',    days:14, risk:'Medium' },
            ].map((m,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Av name={m.name} size={26} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:C.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize:10.5, color:C.t3 }}>{m.days} days away</div>
                </div>
                <span style={{
                  fontSize:9.5, fontWeight:700, borderRadius:4, padding:'2px 7px', flexShrink:0,
                  color: m.risk === 'High' ? C.red : C.amber,
                  background: m.risk === 'High' ? C.redDim : C.amberDim,
                  border: `1px solid ${m.risk === 'High' ? 'rgba(255,77,109,0.28)' : 'rgba(245,158,11,0.28)'}`,
                }}>{m.risk}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${C.brd}` }}>
            <button style={{ width:'100%', padding:'8px 0', borderRadius:7, background:'transparent', border:`1px solid ${C.cyanBrd}`, color:C.cyan, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
              See all at-risk members <ChevronRight style={{ width:12, height:12 }}/>
            </button>
          </div>
        </div>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:13, fontWeight:600, color:C.t1 }}>Community Highlights</span>
            <ChevronRight style={{ width:12, height:12, color:C.t3 }}/>
          </div>
          <div style={{ display:'flex', gap:7 }}>
            {['Post Photo','Create Challenge','Schedule Event'].map((lbl,i) => (
              <button key={i} style={{ padding:'5px 11px', borderRadius:6, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.brd}`, color:C.t2, fontSize:11.5, cursor:'pointer', fontFamily:FONT, fontWeight:500 }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { tag:'🆕 New Post',         tagColor:C.cyan,  title:"Coach Alex's Mobility Flow",    sub:'27 joined' },
            { tag:'Member Spotlight',    tagColor:C.amber, title:"Priya's 12-week transformation" },
            { tag:'Event live tomorrow', tagColor:C.red,   title:'Free Recovery Workshop' },
          ].map((c,i) => (
            <div key={i}
              style={{ padding:'12px 14px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:`1px solid ${C.brd}`, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}
            >
              <div style={{ fontSize:10.5, fontWeight:600, color:c.tagColor, marginBottom:4 }}>{c.tag}</div>
              <div style={{ fontSize:12.5, color:C.t1, fontWeight:500, lineHeight:1.3 }}>{c.title}</div>
              {c.sub && <div style={{ fontSize:11, color:C.t3, marginTop:3 }}>• {c.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/* ══════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════ */
export default function TabOverview({ openModal, setTab } = {}) {
const [isMobile, setIsMobile] = useState(() =>
typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
return () => window.removeEventListener('resize', h);
  }, []);
return isMobile ? <MobileOverview /> : <DesktopOverview />;
}