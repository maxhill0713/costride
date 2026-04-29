/**
 * TabCoachContent — redesigned to match ContentPage gold standard exactly.
 * Header + notification ticker · tabs · right sidebar with stat grid /
 * area chart / SVG activity dial · cards per tab · mobile FAB + sheets.
 * Zero external API dependencies. Fully prop-driven.
 */
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Flame, Check, Clock, Users, RefreshCw,
  ChevronDown, Trash2, Pencil, X, Send, Bell,
  MessageCircle, BarChart2, Search, Calendar,
  FileText, Zap, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

/* ─── TOKENS ────────────────────────────────────────────────── */
const C = {
  bg:      '#000000',
  sidebar: '#0f0f12',
  card:    '#141416',
  card2:   '#1a1a1f',
  brd:     '#222226',
  brd2:    '#2a2a30',
  t1:      '#ffffff',
  t2:      '#8a8a94',
  t3:      '#444450',
  cyan:    '#4d7fff',
  cyanD:   'rgba(77,127,255,0.12)',
  cyanB:   'rgba(77,127,255,0.28)',
  red:     '#ff4d6d',
  redD:    'rgba(255,77,109,0.15)',
  redB:    'rgba(255,77,109,0.3)',
  amber:   '#f59e0b',
  amberD:  'rgba(245,158,11,0.13)',
  amberB:  'rgba(245,158,11,0.28)',
  green:   '#22c55e',
  greenD:  'rgba(34,197,94,0.12)',
  greenB:  'rgba(34,197,94,0.28)',
  blue:    '#3b82f6',
  blueD:   'rgba(59,130,246,0.12)',
  blueB:   'rgba(59,130,246,0.28)',
  violet:  '#7c3aed',
};
const FONT    = "'DM Sans','Segoe UI',system-ui,sans-serif";
const GRAD    = { background:'#2563eb', border:'none', color:'#fff' };

/* ─── CSS ────────────────────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('tcc-css')) {
  const s = document.createElement('style');
  s.id = 'tcc-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
    .tcc * { box-sizing:border-box; }
    .tcc { font-family:'DM Sans','Segoe UI',sans-serif; -webkit-font-smoothing:antialiased; }
    @keyframes tccSlideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(-110%);opacity:0} }
    @keyframes tccSlideInR { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes tccFadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    @keyframes tccModalIn  { from{opacity:0;transform:scale(.95) translateY(8px)} to{opacity:1;transform:none} }
    @keyframes tccPulse    { 0%,100%{opacity:.5} 50%{opacity:1} }
    .tcc-fu { animation:tccFadeUp .35s cubic-bezier(.16,1,.3,1) both; }
    .tcc-card { transition:border-color .15s, box-shadow .15s; }
    .tcc-card:hover { border-color:rgba(77,127,255,0.28) !important; box-shadow:0 0 8px rgba(77,127,255,0.07); }
    .tcc-btn { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; border:none; transition:all .18s cubic-bezier(.16,1,.3,1); display:inline-flex; align-items:center; gap:6px; }
    .tcc-btn:hover { opacity:.88; }
    .tcc-scr::-webkit-scrollbar { width:3px; }
    .tcc-scr::-webkit-scrollbar-thumb { background:#222226; border-radius:3px; }
    .tcc-tab { font-family:'DM Sans','Segoe UI',sans-serif; cursor:pointer; outline:none; border:none; background:transparent; transition:color .15s; }
    .tcc-input { width:100%; background:rgba(255,255,255,0.03); border:1px solid #222226; color:#fff; font-size:13px; font-family:'DM Sans','Segoe UI',sans-serif; outline:none; border-radius:8px; padding:10px 14px; transition:all .18s; }
    .tcc-input:focus { border-color:rgba(77,127,255,0.4); background:rgba(77,127,255,0.04); }
    .tcc-input::placeholder { color:#444450; }
    @media(max-width:768px){.tcc-sidebar{display:none!important}}
  `;
  document.head.appendChild(s);
}

/* ─── HELPERS ────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  let d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:\d{2}$/)) d = new Date(dateStr + 'Z');
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)         return 'just now';
  if (s < 3600)       return `${Math.floor(s/60)}m ago`;
  if (s < 86400)      return `${Math.floor(s/3600)}h ago`;
  if (s < 86400*7)    return `${Math.floor(s/86400)}d ago`;
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

function buildDailyData(posts, polls, checkIns) {
  const now  = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0,0,0,0);
    const s   = date.getTime();
    const e   = s + 86400000;
    const lbl = i===0 ? 'Today' : date.toLocaleDateString('en-GB', { weekday:'short' });
    const inDay = str => {
      if (!str) return false;
      let d = new Date(str);
      if (typeof str==='string' && !str.endsWith('Z') && !str.match(/[+-]\d{2}:\d{2}$/)) d = new Date(str+'Z');
      return d.getTime()>=s && d.getTime()<e;
    };
    let v = 0;
    posts.forEach(p => { if (!p.is_hidden && inDay(p.created_date||p.created_at)) v++; });
    posts.forEach(p => { if (!p.is_hidden && inDay(p.updated_date||p.updated_at)) v += Object.keys(p.reactions||{}).length; });
    polls.forEach(p => { if (inDay(p.updated_date||p.updated_at||p.created_date)) v += (p.voters||[]).length; });
    checkIns.forEach(c => { if (inDay(c.check_in_date||c.created_date)) v++; });
    days.push({ label:lbl, v });
  }
  return days;
}

const POST_TYPE_STYLES = {
  announcement: { label:'Announcement', color:'#60a5fa', bg:'rgba(96,165,250,0.12)',  border:'rgba(96,165,250,0.28)'  },
  achievement:  { label:'Achievement',  color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.28)'  },
  event:        { label:'Event',        color:'#22c55e', bg:'rgba(34,197,94,0.12)',   border:'rgba(34,197,94,0.28)'   },
  offer:        { label:'Special Offer',color:'#ff4d6d', bg:'rgba(255,77,109,0.12)',  border:'rgba(255,77,109,0.28)'  },
  tip:          { label:'Fitness Tip',  color:'#a78bfa', bg:'rgba(167,139,250,0.12)', border:'rgba(167,139,250,0.28)' },
  workout:      { label:'Workout',      color:'#4d7fff', bg:'rgba(77,127,255,0.12)',  border:'rgba(77,127,255,0.28)'  },
};

const TABS = ['Announcements','Sessions','Challenges','Polls','Drafts','Scheduled'];
const TAB_ACTION = {
  Announcements: { label:'+ Post',      modal:'post'      },
  Sessions:      { label:'+ Session',   modal:'session'   },
  Challenges:    { label:'+ Challenge', modal:'challenge' },
  Polls:         { label:'+ Poll',      modal:'poll'      },
};

/* ─── MOBILE HOOK ────────────────────────────────────────────── */
function useIsMobile(bp=768) {
  const [m, setM] = useState(typeof window!=='undefined' ? window.innerWidth<bp : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth<bp);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [bp]);
  return m;
}

/* ─── NOTIFICATION TICKER ────────────────────────────────────── */
function NotificationTicker({ posts, challenges, polls, checkIns, clients }) {
  const msgs = useMemo(() => {
    const ONE_HOUR = 3600000;
    const recent = str => {
      if (!str) return false;
      let d = new Date(str);
      if (typeof str==='string' && !str.endsWith('Z') && !str.match(/[+-]\d{2}:\d{2}$/)) d = new Date(str+'Z');
      return Date.now()-d.getTime() < ONE_HOUR;
    };
    const out = [];
    const newPosts = posts.filter(p => !p.is_hidden && recent(p.created_date||p.created_at));
    if (newPosts.length===1) out.push('1 new announcement posted to your clients');
    else if (newPosts.length>1) out.push(`${newPosts.length} new posts sent to your clients`);
    const liveC = challenges.filter(c => !c.end_date || new Date(c.end_date)>=new Date()).length;
    if (liveC>0) out.push(`${liveC} active challenge${liveC>1?'s':''} running with your clients`);
    const pollVotes = polls.filter(p => recent(p.updated_date||p.updated_at)).reduce((s,p)=>s+(p.voters||[]).length,0);
    if (pollVotes>0) out.push(`${pollVotes} client${pollVotes>1?'s':''} responded to your polls`);
    const recentCI = checkIns.filter(c => recent(c.check_in_date||c.created_date));
    if (recentCI.length===1) out.push('1 client just checked in');
    else if (recentCI.length>1) out.push(`${recentCI.length} clients checked in recently`);
    if (!out.length) out.push(`${clients.length} client${clients.length!==1?'s':''} on your coaching roster`);
    return out;
  }, [posts, challenges, polls, checkIns, clients]);

  const idxRef = useRef(0);
  const [idx,    setIdx]    = useState(0);
  const [prevIdx,setPrevIdx] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (msgs.length<=1) return;
    const id = setInterval(() => {
      const prev = idxRef.current;
      const next = (prev+1) % msgs.length;
      idxRef.current = next;
      setPrevIdx(prev);
      setIdx(next);
      setTransitioning(true);
      setTimeout(() => { setPrevIdx(null); setTransitioning(false); }, 800);
    }, 12000);
    return () => clearInterval(id);
  }, [msgs.length]);

  if (!msgs.length) return null;
  return (
    <div style={{ width:'100%', height:37, background:'rgba(77,127,255,0.11)', borderRadius:4, overflow:'hidden', position:'relative', display:'flex', alignItems:'center' }}>
      {transitioning && prevIdx!==null && (
        <span style={{ position:'absolute', left:0, right:0, textAlign:'center', fontSize:11.5, fontWeight:600, color:'#93c5fd', fontFamily:FONT, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', padding:'0 14px', animation:'tccSlideOut 0.8s cubic-bezier(0.4,0,0.2,1) forwards' }}>
          {msgs[prevIdx]}
        </span>
      )}
      <span key={idx} style={{ position:'absolute', left:0, right:0, textAlign:'center', fontSize:11.5, fontWeight:600, color:'#93c5fd', fontFamily:FONT, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', padding:'0 14px', animation:transitioning?'tccSlideInR 0.8s cubic-bezier(0.4,0,0.2,1) forwards':'none' }}>
        {msgs[idx]}
      </span>
    </div>
  );
}

/* ─── TABS BAR ───────────────────────────────────────────────── */
function TabsBar({ active, setActive, isMobile }) {
  return (
    <div style={{ borderBottom:`1px solid ${C.brd}`, ...(isMobile ? { position:'sticky', top:0, zIndex:90, background:C.bg } : {}) }}>
      <div style={{ display:'flex', alignItems:'center', gap:2, ...(isMobile ? { overflowX:'auto', WebkitOverflowScrolling:'touch', scrollbarWidth:'none' } : {}) }}>
        {TABS.map(tab => (
          <button key={tab} className="tcc-tab" onClick={()=>setActive(tab)} style={{
            padding: isMobile ? '10px 16px' : '7px 14px',
            fontSize:12.5, borderBottom:`2px solid ${active===tab?C.cyan:'transparent'}`,
            color:active===tab?C.t1:C.t2, fontWeight:active===tab?700:400,
            marginBottom:-1, fontFamily:FONT, whiteSpace:'nowrap', flexShrink:0, minHeight:44,
          }}>{tab}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── CHART TOOLTIP ──────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#111c2a', border:`1px solid ${C.cyanB}`, borderRadius:7, padding:'5px 10px', fontSize:11.5, color:C.t1 }}>
      <div style={{ fontSize:10, color:C.t3, marginBottom:2 }}>{label}</div>
      <span style={{ color:C.cyan, fontWeight:700 }}>{payload[0].value} interactions</span>
    </div>
  );
}

/* ─── ACTIVITY DIAL ──────────────────────────────────────────── */
function ActivityDial({ pct }) {
  const R=62, cx=76, cy=72;
  const c = Math.max(0, Math.min(100, pct));
  const angle = Math.PI - (c/100)*Math.PI;
  const x = cx + R*Math.cos(angle), y = cy - R*Math.sin(angle);
  const trackD = `M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`;
  const fillD  = c===0 ? '' : c>=100 ? trackD : `M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  const dialCol = c<30 ? C.red : c<60 ? C.amber : C.green;
  const dialLbl = c<30 ? 'Low' : c<60 ? 'Moderate' : c<85 ? 'Good' : 'Excellent';
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>
      <svg width="152" height="90" viewBox="0 0 152 90" style={{ overflow:'visible' }}>
        <path d={trackD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={dialCol} strokeWidth="10" strokeLinecap="round" strokeOpacity="0.85" />}
        {c>0 && <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r="6" fill={dialCol} />}
        <text x={cx} y={cy-4}  textAnchor="middle" style={{ fontSize:22, fontWeight:800, fill:'#fff',    fontFamily:"'DM Sans',sans-serif" }}>{c}%</text>
        <text x={cx} y={cy+14} textAnchor="middle" style={{ fontSize:10, fontWeight:700, fill:dialCol, fontFamily:"'DM Sans',sans-serif" }}>{dialLbl}</text>
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', width:'100%', marginTop:2 }}>
        <span style={{ fontSize:9, color:C.t3, fontWeight:600 }}>0%</span>
        <span style={{ fontSize:9, color:C.t3, fontWeight:600 }}>100%</span>
      </div>
    </div>
  );
}

/* ─── RIGHT SIDEBAR ──────────────────────────────────────────── */
function RightSidebar({ posts, challenges, polls, checkIns, clients, postsThisWeek, livePolls, liveChallenges, sessionsThisWeek, interactionsToday, onTabChange }) {
  const chartData = useMemo(() => buildDailyData(posts, polls, checkIns), [posts, polls, checkIns]);
  const WEEK = 7*86400000;
  const activeClients = useMemo(() => {
    const ids = new Set();
    posts.forEach(p => { if (Date.now()-new Date(p.created_date||p.created_at||0).getTime()<WEEK && p.client_id) ids.add(p.client_id); });
    polls.forEach(p => (p.voters||[]).forEach(id => ids.add(id)));
    checkIns.forEach(c => { if (Date.now()-new Date(c.check_in_date||c.created_date||0).getTime()<WEEK && c.user_id) ids.add(c.user_id); });
    return ids.size;
  }, [posts, polls, checkIns]);
  const totalClients = clients.length || 1;
  const activityPct = Math.round((activeClients/totalClients)*100);

  const stats = [
    { label:'Posts / week',    val:postsThisWeek,   col:C.cyan, tab:'Announcements' },
    { label:'Live Polls',      val:livePolls,        col:C.cyan, tab:'Polls'         },
    { label:'Live Challenges', val:liveChallenges,   col:C.cyan, tab:'Challenges'    },
    { label:'Sessions / week', val:sessionsThisWeek, col:C.cyan, tab:'Sessions'      },
  ];

  return (
    <div className="tcc-sidebar" style={{ width:244, flexShrink:0, background:C.sidebar, borderLeft:`1px solid ${C.brd}`, display:'flex', flexDirection:'column', fontFamily:FONT, alignSelf:'flex-start' }}>
      {/* Header */}
      <div style={{ padding:'16px 16px 12px', borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>Content Overview</div>
      </div>
      {/* 4-stat grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1px', background:C.brd, borderBottom:`1px solid ${C.brd}` }}>
        {stats.map((s,i) => (
          <div key={i} onClick={()=>s.tab&&onTabChange?.(s.tab)}
            style={{ padding:'12px 14px', background:C.sidebar, cursor:'pointer', transition:'background 0.12s' }}
            onMouseEnter={e=>e.currentTarget.style.background=C.cyanD}
            onMouseLeave={e=>e.currentTarget.style.background=C.sidebar}>
            <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:700, color:s.col, lineHeight:1 }}>{s.val}</div>
          </div>
        ))}
      </div>
      {/* Activity counter */}
      <div style={{ padding:'16px 16px 14px', borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ fontSize:10, color:C.t3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Client Activity</div>
        <div style={{ fontSize:38, fontWeight:700, color:C.t1, letterSpacing:'-0.03em', lineHeight:1 }}>{interactionsToday}</div>
        <div style={{ fontSize:11, color:C.t3, marginTop:5 }}>interactions today</div>
      </div>
      {/* Interactions chart */}
      <div style={{ padding:'14px 16px 12px 4px', borderBottom:`1px solid ${C.brd}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, padding:'0 12px' }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.t1 }}>Interactions This Week</span>
          <span style={{ fontSize:10, color:C.t3 }}>7d</span>
        </div>
        <ResponsiveContainer width="100%" height={108}>
          <AreaChart data={chartData} margin={{ top:4, right:22, bottom:0, left:-24 }}>
            <defs>
              <linearGradient id="tccIG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.cyan} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill:C.t3, fontSize:8.5, fontFamily:FONT }} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={{ fill:C.t3, fontSize:9, fontFamily:FONT }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} />
            <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2} fill="url(#tccIG)" dot={false}
              activeDot={{ r:3, fill:C.cyan, strokeWidth:2, stroke:C.card }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Activity dial */}
      <div style={{ padding:'14px 16px 20px', minHeight:190 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.t1 }}>Client Activity</span>
          <span style={{ fontSize:10, color:C.t3 }}>7d</span>
        </div>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <ActivityDial pct={activityPct} />
        </div>
        <div style={{ textAlign:'center', fontSize:11, color:C.t3 }}>
          {activeClients} of {totalClients} clients active this week
        </div>
      </div>
    </div>
  );
}

/* ─── SORT DROPDOWN ──────────────────────────────────────────── */
function SortDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cur = options.find(o=>o.value===value) || options[0];
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:'rgba(255,255,255,0.04)', border:`1px solid ${open?C.cyanB:C.brd}`, borderRadius:7, color:open?C.t1:C.t2, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FONT, transition:'all .15s' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.t1;}}
        onMouseLeave={e=>{if(!open){e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;}}}>
        {cur.label}<ChevronDown style={{ width:12, height:12, transition:'transform .2s', transform:open?'rotate(180deg)':'none' }} />
      </button>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 5px)', right:0, zIndex:200, background:C.card2, border:`1px solid ${C.brd}`, borderRadius:9, overflow:'hidden', minWidth:148, boxShadow:'0 8px 24px rgba(0,0,0,0.55)' }}>
          {options.map(opt => (
            <button key={opt.value} onClick={()=>{onChange(opt.value);setOpen(false);}} style={{ display:'block', width:'100%', textAlign:'left', padding:'9px 13px', background:opt.value===value?C.cyanD:'transparent', border:'none', color:opt.value===value?C.cyan:C.t2, fontSize:12, fontWeight:opt.value===value?700:500, cursor:'pointer', fontFamily:FONT, transition:'background .12s' }}
              onMouseEnter={e=>{if(opt.value!==value)e.currentTarget.style.background='rgba(255,255,255,0.05)';}}
              onMouseLeave={e=>{if(opt.value!==value)e.currentTarget.style.background='transparent';}}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── EMPTY STATE ────────────────────────────────────────────── */
function Empty({ label }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'56px 0', gap:12 }}>
      <div style={{ fontSize:13, fontWeight:500, color:C.t2, fontFamily:FONT }}>No {label} yet</div>
    </div>
  );
}

/* ─── DELETE CONFIRM MODAL ───────────────────────────────────── */
function ConfirmDelete({ title, detail, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:C.card, border:`1px solid rgba(255,77,109,0.25)`, borderRadius:14, padding:'20px 24px', width:380, maxWidth:'90vw', display:'flex', flexDirection:'column', gap:16, animation:'tccModalIn .28s cubic-bezier(.16,1,.3,1) both' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:C.t1 }}>{title}</div>
            {detail && <div style={{ fontSize:12, color:C.t2, marginTop:2 }}>{detail}</div>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.t3, cursor:'pointer', display:'flex', alignItems:'center', padding:4, borderRadius:6 }}><X style={{ width:15, height:15 }} /></button>
        </div>
        <div style={{ fontSize:12.5, color:C.t2, lineHeight:1.55 }}>This will permanently remove this item. <span style={{ color:C.red, fontWeight:600 }}>This cannot be undone.</span></div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, background:'transparent', border:`1px solid ${C.brd}`, color:C.t2, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
          <button onClick={async()=>{setBusy(true);try{await onConfirm();}finally{setBusy(false);}}} disabled={busy} style={{ padding:'8px 18px', borderRadius:8, background:C.red, border:'none', color:'#fff', fontSize:12, fontWeight:700, cursor:busy?'not-allowed':'pointer', opacity:busy?.7:1, fontFamily:FONT }}>
            {busy?'Removing…':'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MESSAGE MODAL ──────────────────────────────────────────── */
function MessageModal({ name, onClose }) {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const fn = (name||'there').split(' ')[0];
  return (
    <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.72)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:14, padding:'20px 24px', width:400, maxWidth:'90vw', display:'flex', flexDirection:'column', gap:14, animation:'tccModalIn .28s cubic-bezier(.16,1,.3,1) both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.t1 }}>Message Client</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:C.t3, cursor:'pointer' }}><X style={{ width:15, height:15 }} /></button>
        </div>
        {sent
          ? <div style={{ textAlign:'center', padding:'20px 0', color:C.green, fontSize:13, fontWeight:600 }}>✓ Message sent to {fn}</div>
          : <>
              <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder={`Write a message to ${fn}…`} rows={4} className="tcc-input" style={{ resize:'vertical', lineHeight:1.6 }} />
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={onClose} style={{ padding:'8px 16px', borderRadius:8, background:'transparent', border:`1px solid ${C.brd}`, color:C.t2, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FONT }}>Cancel</button>
                <button onClick={()=>setSent(true)} disabled={!msg.trim()} style={{ padding:'8px 18px', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:msg.trim()?'pointer':'not-allowed', opacity:msg.trim()?1:.55, fontFamily:FONT, ...GRAD }}>Send Message</button>
              </div>
            </>
        }
      </div>
    </div>
  );
}

/* ─── POST QUICK ACTIONS ─────────────────────────────────────── */
function PostQuickActions({ post, clientName, onDelete, onEdit, compact }) {
  const [modal, setModal] = useState(null);
  const w = compact ? 105 : 126;
  const btnSty = { display:'flex', alignItems:'center', gap:5, width:'100%', padding:compact?'4px 8px':'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, color:C.t2, fontSize:compact?10.5:12, fontWeight:600, cursor:'pointer', fontFamily:FONT, textAlign:'left', transition:'all .15s' };
  const ic = compact ? 11 : 13;
  return (
    <>
      <div style={{ width:w, flexShrink:0, borderLeft:`1px solid ${C.brd}`, padding:compact?'10px 8px':'12px 10px', display:'flex', flexDirection:'column', gap:compact?7:8 }}>
        <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.10em', color:C.t3, marginBottom:2 }}>Quick Actions</div>
        {onEdit && (
          <button style={btnSty} onClick={()=>setModal('edit')}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.t1;e.currentTarget.style.background=C.cyanD;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
            <Pencil style={{ width:ic, height:ic }} /><span>Edit</span>
          </button>
        )}
        {clientName && (
          <button style={btnSty} onClick={()=>setModal('msg')}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.t1;e.currentTarget.style.background=C.cyanD;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
            <MessageCircle style={{ width:ic, height:ic }} /><span>Message</span>
          </button>
        )}
        {onDelete && (
          <button style={btnSty} onClick={()=>setModal('del')}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redD;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
            <Trash2 style={{ width:ic, height:ic }} /><span>Remove</span>
          </button>
        )}
      </div>
      {modal==='del'  && <ConfirmDelete title="Remove Post" onConfirm={async()=>{await onDelete?.(post.id);setModal(null);}} onClose={()=>setModal(null)} />}
      {modal==='msg'  && <MessageModal name={clientName} onClose={()=>setModal(null)} />}
    </>
  );
}

/* ─── ANNOUNCEMENTS TAB ──────────────────────────────────────── */
function TabAnnouncements({ posts, clients, avatarMap, onDeletePost, onUpdatePost, filter, setFilter }) {
  const sevenAgo = Date.now() - 7*86400000;
  const visible = posts.filter(p => {
    if (p.is_hidden || p.is_draft) return false;
    if (p.scheduled_date && new Date(p.scheduled_date).getTime()>Date.now()) return false;
    const created = p.created_date||p.created_at||p.date;
    const isRecent = created ? new Date(created).getTime()>=sevenAgo : true;
    if (filter==='recent' && !isRecent) return false;
    return true;
  });
  const PALLETE = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#4d7fff','#10b981'];
  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, marginTop:2 }}>
        <div style={{ fontSize:12, fontWeight:500, color:C.t2 }}>{visible.length} post{visible.length!==1?'s':''} in the last 7 days</div>
        <SortDropdown value={filter} onChange={setFilter} options={[{value:'all',label:'All Posts'},{value:'recent',label:'Last 7 days'}]} />
      </div>
      {visible.length===0 ? <Empty label="announcements" /> : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {visible.map(p => {
            const pt = POST_TYPE_STYLES[p.post_type] || POST_TYPE_STYLES.announcement;
            const name = p.client_name || p.member_name || 'Clients';
            const avatarBg = PALLETE[(name.charCodeAt(0)||0) % PALLETE.length];
            const avatar = p.client_id ? avatarMap[p.client_id] : null;
            const initials = name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
            const reactions = Object.keys(p.reactions||{}).length;
            return (
              <div key={p.id} className="tcc-card" style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, height:138, display:'flex', overflow:'hidden' }}>
                {p.image_url && (
                  <div style={{ width:128, height:128, flexShrink:0, alignSelf:'center', margin:5, borderRadius:8, overflow:'hidden' }}>
                    <img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  </div>
                )}
                <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                  <div style={{ flex:1, minWidth:0, padding:'10px', display:'flex', flexDirection:'column', gap:5 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
                      <div style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, background:avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', overflow:'hidden' }}>
                        {avatar ? <img src={avatar} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:C.t1, lineHeight:1.2 }}>{name}</div>
                          <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4, background:pt.bg, border:`1px solid ${pt.border}`, color:pt.color, flexShrink:0 }}>{pt.label}</span>
                        </div>
                        <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>{timeAgo(p.created_date||p.created_at)}</div>
                      </div>
                    </div>
                    {p.content && (
                      <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                        {p.content}
                      </div>
                    )}
                    {reactions>0 && (
                      <div style={{ marginTop:'auto', fontSize:10, color:C.t3 }}>
                        <Zap style={{ width:10, height:10, color:C.amber, verticalAlign:'middle' }} /> {reactions} reaction{reactions>1?'s':''}
                      </div>
                    )}
                  </div>
                  <PostQuickActions post={p} onDelete={onDeletePost} onEdit={onUpdatePost?()=>{}:null} compact />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ─── SESSIONS TAB ───────────────────────────────────────────── */
function TabSessions({ sessions, clients, avatarMap, now }) {
  const nowMs = now ? new Date(now).getTime() : Date.now();
  const upcoming = sessions.filter(s => s.session_date && new Date(s.session_date).getTime()>nowMs).sort((a,b)=>new Date(a.session_date)-new Date(b.session_date));
  const past     = sessions.filter(s => s.session_date && new Date(s.session_date).getTime()<=nowMs).sort((a,b)=>new Date(b.session_date)-new Date(a.session_date)).slice(0,10);
  const SessionCard = ({ session, isPast }) => {
    const d    = new Date(session.session_date);
    const dateLabel = d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
    const timeLabel = d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
    const clientName = session.client_name || session.member_name || 'Client';
    const avatar = session.client_id ? avatarMap[session.client_id] : null;
    const col = '#4d7fff';
    const initials = clientName.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
    return (
      <div className="tcc-card" style={{ background:C.card, border:`1px solid ${isPast?C.brd:C.cyanB}`, borderRadius:10, padding:'13px 16px', marginBottom:8, display:'flex', alignItems:'center', gap:12, opacity:isPast?.7:1 }}>
        <div style={{ width:42, height:42, borderRadius:10, flexShrink:0, background:isPast?'rgba(255,255,255,0.04)':C.cyanD, border:`1px solid ${isPast?C.brd:C.cyanB}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:16, fontWeight:700, color:isPast?C.t3:C.cyan, lineHeight:1 }}>{d.getDate()}</div>
          <div style={{ fontSize:8, color:isPast?C.t3:C.cyan, fontWeight:600, textTransform:'uppercase' }}>{d.toLocaleDateString('en-GB',{month:'short'})}</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:3 }}>{session.session_name||session.class_name||'Coaching Session'}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, background:col+'1a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:col, overflow:'hidden' }}>
              {avatar ? <img src={avatar} alt={clientName} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials}
            </div>
            <span style={{ fontSize:11.5, color:C.t2 }}>{clientName}</span>
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:isPast?C.t3:C.cyan }}>{timeLabel}</div>
          <div style={{ fontSize:10.5, color:C.t3, marginTop:2 }}>{dateLabel}</div>
        </div>
        <div style={{ width:8, height:8, borderRadius:'50%', flexShrink:0, background:isPast?C.t3:C.green, animation:isPast?'none':'tccPulse 2s ease infinite' }} />
      </div>
    );
  };
  return (
    <>
      <div style={{ fontSize:12, fontWeight:500, color:C.t2, marginBottom:10, marginTop:2 }}>{upcoming.length} upcoming session{upcoming.length!==1?'s':''}</div>
      {upcoming.length===0 ? <Empty label="upcoming sessions" /> : upcoming.map(s=><SessionCard key={s.id} session={s} isPast={false} />)}
      {past.length>0 && (
        <>
          <div style={{ fontSize:12, fontWeight:700, color:C.t2, margin:'20px 0 10px', paddingTop:12, borderTop:`1px solid ${C.brd}`, textTransform:'uppercase', letterSpacing:'0.08em' }}>Past Sessions</div>
          {past.map(s=><SessionCard key={s.id} session={s} isPast />)}
        </>
      )}
    </>
  );
}

/* ─── CHALLENGES TAB ─────────────────────────────────────────── */
function TabChallenges({ challenges, onDelete, onRerun }) {
  const [toDelete,  setToDelete]  = useState(null);
  const [rerunning, setRerunning] = useState(null);
  const nowDate = new Date();
  const live  = challenges.filter(c => !c.end_date || new Date(c.end_date)>=nowDate);
  const ended = challenges.filter(c => c.end_date  && new Date(c.end_date)<nowDate);
  const btnSty = { display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, color:C.t2, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:FONT, flexShrink:0, transition:'all .15s' };
  const ChallengeCard = ({ ch, showRerun }) => (
    <div className="tcc-card" style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:10, padding:'13px 16px', marginBottom:8 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.t1, marginBottom:3 }}>{ch.title}</div>
          {ch.description && <div style={{ fontSize:11.5, color:C.t2, marginBottom:3 }}>{ch.description}</div>}
          <div style={{ fontSize:11, color:C.t3 }}>{ch.start_date} → {ch.end_date||'Ongoing'}</div>
          <div style={{ fontSize:11.5, color:C.t2, marginTop:4 }}>{(ch.participants||[]).length} joined</div>
        </div>
        <button onClick={()=>setToDelete(ch)} style={btnSty}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redD;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
          <Trash2 style={{ width:12, height:12 }} /><span>Remove</span>
        </button>
      </div>
      {showRerun && (
        <div style={{ marginTop:10 }}>
          <button disabled={rerunning===ch.id} onClick={async()=>{
            setRerunning(ch.id);
            try{await onRerun?.(ch);}finally{setRerunning(null);}
          }} style={btnSty}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.cyan;e.currentTarget.style.background=C.cyanD;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
            <RefreshCw style={{ width:12, height:12 }} /><span>{rerunning===ch.id?'Re-running…':'Re-run Challenge'}</span>
          </button>
        </div>
      )}
    </div>
  );
  return (
    <>
      <div style={{ fontSize:12, fontWeight:500, color:C.t2, marginBottom:10, marginTop:2 }}>{live.length} live challenge{live.length!==1?'s':''}</div>
      {live.length===0 ? <Empty label="live challenges" /> : live.map(c=><ChallengeCard key={c.id} ch={c} showRerun={false} />)}
      {ended.length>0 && (
        <>
          <div style={{ fontSize:12, fontWeight:700, color:C.t2, margin:'20px 0 10px', paddingTop:12, borderTop:`1px solid ${C.brd}`, textTransform:'uppercase', letterSpacing:'0.08em' }}>Ended Challenges</div>
          {ended.map(c=><ChallengeCard key={c.id} ch={c} showRerun />)}
        </>
      )}
      {toDelete && <ConfirmDelete title="Remove Challenge" detail={toDelete.title} onConfirm={async()=>{await onDelete?.(toDelete.id);setToDelete(null);}} onClose={()=>setToDelete(null)} />}
    </>
  );
}

/* ─── POLLS TAB ──────────────────────────────────────────────── */
function TabPolls({ polls, clients, onDelete }) {
  const [toDelete, setToDelete] = useState(null);
  const [sort,     setSort]     = useState('created');
  const nowMs = Date.now();
  const pollEnd = p => p.end_date ? new Date(p.end_date).getTime()+86400000-1 : Infinity;
  const live   = [...polls.filter(p=>pollEnd(p)>=nowMs)].sort((a,b)=>sort==='created'?new Date(a.created_date||0)-new Date(b.created_date||0):pollEnd(a)-pollEnd(b));
  const ended  = [...polls.filter(p=>p.end_date&&pollEnd(p)<nowMs)].sort((a,b)=>pollEnd(b)-pollEnd(a));
  const totalClients = clients.length||1;
  const PollCard = ({ poll, showTimer }) => {
    const voters = (poll.voters||[]).length;
    const pct = Math.round(voters/totalClients*100);
    const endMs = pollEnd(poll);
    const timeLeft = (() => {
      if (!poll.end_date || endMs===Infinity) return null;
      const diff = endMs-nowMs;
      if (diff<=0) return null;
      const h = diff/(1000*60*60);
      return h<24 ? `${Math.round(h)}h left` : `${Math.round(diff/(1000*60*60*24))}d left`;
    })();
    const isUrgent = timeLeft && endMs-nowMs<86400000;
    const opts = poll.options||[];
    const total = opts.reduce((s,o)=>s+(typeof o==='object'?(o.votes||0):0),0);
    const maxV  = Math.max(...opts.map(o=>typeof o==='object'?(o.votes||0):0),0);
    return (
      <div className="tcc-card" style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, overflow:'hidden', display:'flex', marginBottom:10 }}>
        <div style={{ flex:'0 0 70%', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.t1, lineHeight:1.4, flex:1 }}>{poll.question||poll.title}</span>
            {showTimer && timeLeft && (
              <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0, padding:'3px 8px', borderRadius:6, background:isUrgent?'rgba(255,77,109,0.12)':C.cyanD, border:`1px solid ${isUrgent?C.redB:C.cyanB}`, color:isUrgent?'#ff6b85':C.cyan, fontSize:11, fontWeight:700 }}>
                <Clock style={{ width:10, height:10 }} /><span>{timeLeft}</span>
              </div>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {opts.map((opt,i) => {
              const optTxt   = typeof opt==='object'?(opt.text||opt.label||`Option ${i+1}`):opt;
              const optVotes = typeof opt==='object'?(opt.votes||0):0;
              const barPct   = total>0 ? Math.round(optVotes/total*100) : 0;
              const isWinner = optVotes===maxV && optVotes>0;
              return (
                <div key={i} style={{ position:'relative', borderRadius:9, overflow:'hidden' }}>
                  <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${Math.max(barPct,3)}%`, background:isWinner?'rgba(37,99,235,0.45)':'rgba(148,163,184,0.22)', borderRadius:9, transition:'width .7s cubic-bezier(.4,0,.2,1)' }} />
                  <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 12px' }}>
                    <span style={{ fontSize:13, fontWeight:600, color:isWinner?'#93c5fd':'rgba(255,255,255,0.8)' }}>{optTxt}</span>
                    <span style={{ fontSize:12, fontWeight:700, marginLeft:8, flexShrink:0, color:isWinner?'#60a5fa':'rgba(255,255,255,0.35)' }}>{barPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ flex:'0 0 30%', borderLeft:`1px solid ${C.brd}`, padding:'14px', display:'flex', flexDirection:'column', justifyContent:'space-between', gap:10 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Users style={{ width:12, height:12, color:C.cyan }} />
              <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>{voters} Response{voters!==1?'s':''}</span>
            </div>
            {totalClients>0 && <span style={{ fontSize:11, color:C.t2, paddingLeft:18 }}>{pct}% of clients</span>}
          </div>
          <button onClick={()=>setToDelete(poll)} style={{ display:'flex', alignItems:'center', gap:6, width:'100%', padding:'7px 10px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, color:C.t2, fontSize:11.5, fontWeight:600, cursor:'pointer', fontFamily:FONT, transition:'all .15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redD;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
            <Trash2 style={{ width:12, height:12 }} /><span>Remove</span>
          </button>
        </div>
      </div>
    );
  };
  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, marginTop:2 }}>
        <div style={{ fontSize:12, fontWeight:500, color:C.t2 }}>{live.length} live poll{live.length!==1?'s':''}</div>
        <SortDropdown value={sort} onChange={setSort} options={[{value:'created',label:'Date Created'},{value:'time_left',label:'Time Left'}]} />
      </div>
      {live.length===0 ? <Empty label="live polls" /> : live.map(p=><PollCard key={p.id} poll={p} showTimer />)}
      {ended.length>0 && (
        <>
          <div style={{ fontSize:12, fontWeight:500, color:C.t2, margin:'20px 0 10px', paddingTop:12, borderTop:`1px solid ${C.brd}` }}>{ended.length} ended poll{ended.length!==1?'s':''}</div>
          {ended.map(p=><PollCard key={p.id} poll={p} showTimer={false} />)}
        </>
      )}
      {toDelete && <ConfirmDelete title="Remove Poll" onConfirm={async()=>{await onDelete?.(toDelete.id);setToDelete(null);}} onClose={()=>setToDelete(null)} />}
    </>
  );
}

/* ─── DRAFTS TAB ─────────────────────────────────────────────── */
function TabDrafts({ posts, coach, avatarMap, onDeletePost, onPublish, onEditPost }) {
  const [publishing, setPublishing] = useState(null);
  const drafts = posts.filter(p=>p.is_draft && !p.is_hidden);
  const PALLETE = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#4d7fff','#10b981'];
  if (drafts.length===0) return <Empty label="drafts" />;
  return (
    <>
      <div style={{ fontSize:12, fontWeight:500, color:C.t2, marginBottom:10 }}>{drafts.length} draft{drafts.length!==1?'s':''}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {drafts.map(p => {
          const pt = POST_TYPE_STYLES[p.post_type]||POST_TYPE_STYLES.announcement;
          const name = coach?.name||'You';
          const avatarBg = PALLETE[(name.charCodeAt(0)||0) % PALLETE.length];
          const avatar = coach ? (avatarMap[coach.id]||coach.avatar||null) : null;
          return (
            <div key={p.id} className="tcc-card" style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, height:138, display:'flex', overflow:'hidden' }}>
              {p.image_url && (
                <div style={{ width:128, height:128, flexShrink:0, alignSelf:'center', margin:5, borderRadius:8, overflow:'hidden' }}>
                  <img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                </div>
              )}
              <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                <div style={{ flex:1, minWidth:0, padding:'10px', display:'flex', flexDirection:'column', gap:5 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, background:avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', overflow:'hidden' }}>
                      {avatar ? <img src={avatar} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:C.t1, lineHeight:1.2 }}>{name}</div>
                        {p.post_type && <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4, background:pt.bg, border:`1px solid ${pt.border}`, color:pt.color, flexShrink:0 }}>{pt.label}</span>}
                        <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4, background:C.amberD, border:`1px solid ${C.amberB}`, color:C.amber, flexShrink:0 }}>Draft</span>
                      </div>
                      <div style={{ fontSize:10, color:C.t3, marginTop:2 }}>Saved {timeAgo(p.created_date)}</div>
                    </div>
                  </div>
                  {p.content && <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.content}</div>}
                </div>
                {/* Quick Actions */}
                <div style={{ width:116, flexShrink:0, borderLeft:`1px solid ${C.brd}`, padding:'10px 8px', display:'flex', flexDirection:'column', gap:7 }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.10em', color:C.t3, marginBottom:2 }}>Quick Actions</div>
                  <button onClick={async()=>{ setPublishing(p.id); try{await onPublish?.(p);}finally{setPublishing(null);} }} disabled={publishing===p.id}
                    style={{ display:'flex', alignItems:'center', gap:5, width:'100%', padding:'4px 8px', borderRadius:8, fontSize:10.5, fontWeight:700, cursor:publishing===p.id?'default':'pointer', fontFamily:FONT, opacity:publishing===p.id?.6:1, ...(publishing===p.id?{background:C.brd,border:'none',color:C.t3}:GRAD) }}>
                    <Plus style={{ width:11, height:11 }} /><span>{publishing===p.id?'Posting…':'Post Now'}</span>
                  </button>
                  <button onClick={()=>onEditPost?.(p)} style={{ display:'flex', alignItems:'center', gap:5, width:'100%', padding:'4px 8px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, color:C.t2, fontSize:10.5, fontWeight:600, cursor:'pointer', fontFamily:FONT, transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.t1;e.currentTarget.style.background=C.cyanD;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
                    <Pencil style={{ width:11, height:11 }} /><span>Edit</span>
                  </button>
                  <button onClick={()=>onDeletePost?.(p.id)} style={{ display:'flex', alignItems:'center', gap:5, width:'100%', padding:'4px 8px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, color:C.t2, fontSize:10.5, fontWeight:600, cursor:'pointer', fontFamily:FONT, transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redD;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
                    <Trash2 style={{ width:11, height:11 }} /><span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── SCHEDULED TAB ──────────────────────────────────────────── */
function TabScheduled({ posts, coach, avatarMap, onDeletePost, onEditPost }) {
  const [sort, setSort] = useState('planned');
  const nowMs = Date.now();
  const PALLETE = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#4d7fff','#10b981'];
  const scheduled = [...posts.filter(p=>p.scheduled_date && !p.is_draft && new Date(p.scheduled_date).getTime()>nowMs)]
    .sort((a,b)=>sort==='planned'?new Date(a.scheduled_date)-new Date(b.scheduled_date):new Date(b.created_date||0)-new Date(a.created_date||0));
  if (scheduled.length===0) return <Empty label="scheduled posts" />;
  return (
    <>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:500, color:C.t2 }}>{scheduled.length} scheduled post{scheduled.length!==1?'s':''}</div>
        <SortDropdown value={sort} onChange={setSort} options={[{value:'planned',label:'Planned Release'},{value:'created',label:'Date Created'}]} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {scheduled.map(p => {
          const pt = POST_TYPE_STYLES[p.post_type]||POST_TYPE_STYLES.announcement;
          const name = coach?.name||'You';
          const avatarBg = PALLETE[(name.charCodeAt(0)||0) % PALLETE.length];
          const avatar = coach ? (avatarMap[coach.id]||coach.avatar||null) : null;
          const sched  = new Date(p.scheduled_date);
          const schedLabel = sched.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})+' at '+sched.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
          const diffMs = sched.getTime()-nowMs;
          const diffDays = Math.ceil(diffMs/86400000);
          const timeUntil = diffDays<=0?'Today':diffDays===1?'Tomorrow':`In ${diffDays}d`;
          return (
            <div key={p.id} className="tcc-card" style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, height:138, display:'flex', overflow:'hidden' }}>
              {p.image_url && <div style={{ width:128, height:128, flexShrink:0, alignSelf:'center', margin:5, borderRadius:8, overflow:'hidden' }}><img src={p.image_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} /></div>}
              <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
                <div style={{ flex:1, minWidth:0, padding:'10px', display:'flex', flexDirection:'column', gap:5 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, background:avatarBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#fff', overflow:'hidden' }}>
                      {avatar ? <img src={avatar} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>{name}</div>
                        {p.post_type && <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4, background:pt.bg, border:`1px solid ${pt.border}`, color:pt.color }}>{pt.label}</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                        <Clock style={{ width:10, height:10, color:C.cyan }} />
                        <span style={{ fontSize:10, color:C.cyan, fontWeight:700 }}>{schedLabel}</span>
                      </div>
                      <div style={{ fontSize:10, color:C.t3, marginTop:1 }}>{timeUntil}</div>
                    </div>
                  </div>
                  {p.content && <div style={{ fontSize:11.5, color:C.t2, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.content}</div>}
                </div>
                <div style={{ width:105, flexShrink:0, borderLeft:`1px solid ${C.brd}`, padding:'10px 8px', display:'flex', flexDirection:'column', gap:7 }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.10em', color:C.t3, marginBottom:2 }}>Quick Actions</div>
                  <button onClick={()=>onEditPost?.(p)} style={{ display:'flex', alignItems:'center', gap:5, width:'100%', padding:'4px 8px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, color:C.t2, fontSize:10.5, fontWeight:600, cursor:'pointer', fontFamily:FONT, transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanB;e.currentTarget.style.color=C.t1;e.currentTarget.style.background=C.cyanD;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
                    <Pencil style={{ width:11, height:11 }} /><span>Edit</span>
                  </button>
                  <button onClick={()=>onDeletePost?.(p.id)} style={{ display:'flex', alignItems:'center', gap:5, width:'100%', padding:'4px 8px', borderRadius:8, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.brd}`, color:C.t2, fontSize:10.5, fontWeight:600, cursor:'pointer', fontFamily:FONT, transition:'all .15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.redB;e.currentTarget.style.color=C.red;e.currentTarget.style.background=C.redD;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.t2;e.currentTarget.style.background='rgba(255,255,255,0.03)';}}>
                    <Trash2 style={{ width:11, height:11 }} /><span>Cancel</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── BOTTOM SHEET (mobile) ──────────────────────────────────── */
function BottomSheet({ open, onClose, children, maxHeight='88vh' }) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (open) { const id=requestAnimationFrame(()=>requestAnimationFrame(()=>setV(true))); return ()=>cancelAnimationFrame(id); }
    else setV(false);
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, fontFamily:FONT }}>
      <div onClick={onClose} style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', opacity:v?1:0, transition:'opacity .3s' }} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:C.sidebar, borderRadius:'22px 22px 0 0', border:`1px solid ${C.brd}`, borderBottom:'none', maxHeight, display:'flex', flexDirection:'column', transform:`translateY(${v?'0':'100%'})`, transition:'transform .38s cubic-bezier(0.32,.72,0,1)', overflow:'hidden' }}>
        <div style={{ padding:'14px 0 6px', display:'flex', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:C.brd2 }} />
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── FAB ────────────────────────────────────────────────────── */
function FAB({ onClick }) {
  return (
    <button onClick={onClick} style={{ position:'fixed', bottom:76, right:18, zIndex:190, width:52, height:52, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 10px rgba(37,99,235,0.35)', ...GRAD }}>
      <Plus style={{ width:22, height:22 }} />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabCoachContent({
  coach            = null,
  posts            = [],
  sessions         = [],
  challenges       = [],
  polls            = [],
  checkIns         = [],
  clients          = [],
  bookings         = [],
  avatarMap        = {},
  now              = new Date(),
  openModal        = () => {},
  onDeletePost     = null,
  onUpdatePost     = null,
  onPublishDraft   = null,
  onDeleteChallenge= null,
  onRerunChallenge = null,
  onDeletePoll     = null,
  onSetTab         = null,
}) {
  const isMobile = useIsMobile();
  const [tab,         setTab]        = useState('Announcements');
  const [showMenu,    setShowMenu]   = useState(false);
  const [feedFilter,  setFeedFilter] = useState('all');

  /* Derived stats */
  const nowMs      = now ? new Date(now).getTime() : Date.now();
  const sevenAgo   = nowMs - 7*86400000;
  const isRecent   = str => str && new Date(str).getTime()>=sevenAgo;
  const postsThisWeek    = posts.filter(p=>!p.is_hidden&&!p.is_draft&&isRecent(p.created_date||p.created_at)).length;
  const livePolls        = polls.filter(p=>!p.end_date||new Date(p.end_date)>=new Date()).length;
  const liveChallenges   = challenges.filter(c=>!c.end_date||new Date(c.end_date)>=new Date()).length;
  const sessionsThisWeek = sessions.filter(s=>s.session_date&&isRecent(s.session_date)).length;

  const todayStart = new Date(nowMs); todayStart.setHours(0,0,0,0);
  const todayMs    = todayStart.getTime();
  const isToday    = str => { if (!str) return false; let d=new Date(str); return d.getTime()>=todayMs; };
  const postsToday   = posts.filter(p=>!p.is_hidden&&isToday(p.created_date||p.created_at)).length;
  const pollsToday   = polls.filter(p=>isToday(p.updated_date||p.created_date)).reduce((s,p)=>s+(p.voters||[]).length,0);
  const reactToday   = posts.filter(p=>!p.is_hidden&&isToday(p.updated_date||p.created_date)).reduce((s,p)=>s+Object.keys(p.reactions||{}).length,0);
  const interactionsToday = postsToday + pollsToday + reactToday;

  const CREATE_ITEMS = [
    { label:'📝 New Post',      action:()=>{ openModal('post');      setShowMenu(false); setTab('Announcements'); }},
    { label:'📅 New Session',   action:()=>{ openModal('session');   setShowMenu(false); setTab('Sessions');      }},
    { label:'🏆 New Challenge', action:()=>{ openModal('challenge'); setShowMenu(false); setTab('Challenges');    }},
    { label:'📊 New Poll',      action:()=>{ openModal('poll');      setShowMenu(false); setTab('Polls');         }},
  ];
  const tabAction = TAB_ACTION[tab];

  return (
    <div className="tcc" style={{ display:'flex', flex:1, minHeight:0, background:C.bg, color:C.t1, fontFamily:FONT, fontSize:13, lineHeight:1.5, WebkitFontSmoothing:'antialiased' }}>

      {/* ── MAIN COLUMN ── */}
      <div style={{ flex:1, overflowY:'auto', minWidth:0, ...(isMobile?{paddingBottom:80}:{}) }}>

        {/* Header */}
        {!isMobile && (
          <div style={{ padding:'4px 16px 0 4px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
            <h1 style={{ fontSize:22, fontWeight:800, color:C.t1, margin:0, letterSpacing:'-0.03em', lineHeight:1.2, flexShrink:0 }}>
              Content <span style={{ color:C.cyan }}>Hub</span>
            </h1>
            <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', width:'clamp(300px,52%,780px)', pointerEvents:'none' }}>
              <div style={{ pointerEvents:'auto' }}>
                <NotificationTicker posts={posts} challenges={challenges} polls={polls} checkIns={checkIns} clients={clients} />
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              {tabAction && (
                <button onClick={()=>openModal(tabAction.modal)} className="tcc-btn" style={{ display:'flex', alignItems:'center', gap:4, padding:'9px 18px', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:'pointer', fontFamily:FONT, ...GRAD }}>
                  <Plus style={{ width:12, height:12 }} /> {tabAction.label.replace('+ ','')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile header */}
        {isMobile && (
          <div style={{ padding:'14px 16px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', background:C.bg, borderBottom:`1px solid ${C.brd}` }}>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:C.t1, letterSpacing:'-0.02em' }}>Content <span style={{ color:C.cyan }}>Hub</span></div>
              <div style={{ fontSize:11, color:C.t3, marginTop:2 }}>{postsThisWeek} posts · {liveChallenges} challenges · {livePolls} polls</div>
            </div>
            <button onClick={()=>setShowMenu(o=>!o)} style={{ width:40, height:40, borderRadius:11, background:C.cyanD, border:`1px solid ${C.cyanB}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <BarChart2 style={{ width:16, height:16, color:C.cyan }} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ padding:isMobile?'0 0':'0 4px' }}>
          <TabsBar active={tab} setActive={setTab} isMobile={isMobile} />
        </div>

        {/* Tab content */}
        <div style={{ padding:isMobile?'8px 12px 24px':'0 16px 32px 4px' }}>
          {tab==='Announcements' && (
            <TabAnnouncements posts={posts} clients={clients} avatarMap={avatarMap}
              onDeletePost={onDeletePost} onUpdatePost={onUpdatePost}
              filter={feedFilter} setFilter={setFeedFilter} />
          )}
          {tab==='Sessions' && (
            <TabSessions sessions={[
              ...sessions,
              ...bookings.filter(b=>b.session_date).map(b=>({
                id:b.id, session_date:b.session_date,
                session_name:b.session_name||b.class_name||'Coaching Session',
                client_name:b.client_name||b.member_name||'Client',
                client_id:b.client_id||b.member_id,
                status:b.status,
              }))
            ]} clients={clients} avatarMap={avatarMap} now={now} />
          )}
          {tab==='Challenges' && (
            <TabChallenges challenges={challenges} onDelete={onDeleteChallenge} onRerun={onRerunChallenge} />
          )}
          {tab==='Polls' && (
            <TabPolls polls={polls} clients={clients} onDelete={onDeletePoll} />
          )}
          {tab==='Drafts' && (
            <TabDrafts posts={posts} coach={coach} avatarMap={avatarMap}
              onDeletePost={onDeletePost} onPublish={onPublishDraft} onEditPost={p=>onUpdatePost?.(p)} />
          )}
          {tab==='Scheduled' && (
            <TabScheduled posts={posts} coach={coach} avatarMap={avatarMap}
              onDeletePost={onDeletePost} onEditPost={p=>onUpdatePost?.(p)} />
          )}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      {!isMobile && (
        <RightSidebar
          posts={posts} challenges={challenges} polls={polls} checkIns={checkIns} clients={clients}
          postsThisWeek={postsThisWeek} livePolls={livePolls} liveChallenges={liveChallenges}
          sessionsThisWeek={sessionsThisWeek} interactionsToday={interactionsToday}
          onTabChange={setTab}
        />
      )}

      {/* ── MOBILE FAB ── */}
      {isMobile && (
        <>
          <FAB onClick={()=>setShowMenu(o=>!o)} />
          {showMenu && (
            <>
              <div onClick={()=>setShowMenu(false)} style={{ position:'fixed', inset:0, zIndex:188 }} />
              <div style={{ position:'fixed', bottom:136, right:16, zIndex:189, background:C.card, border:`1px solid ${C.brd}`, borderRadius:12, overflow:'hidden', minWidth:195, boxShadow:'0 -4px 40px rgba(0,0,0,0.8)' }}>
                {CREATE_ITEMS.map(item => (
                  <button key={item.label} onClick={item.action} style={{ width:'100%', display:'block', padding:'14px 18px', background:'transparent', border:'none', borderBottom:`1px solid ${C.brd}`, color:C.t1, fontSize:13.5, fontWeight:500, cursor:'pointer', textAlign:'left', fontFamily:FONT, minHeight:52 }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── MOBILE STATS SHEET ── */}
      {isMobile && (
        <BottomSheet open={showMenu && !CREATE_ITEMS} onClose={()=>setShowMenu(false)} maxHeight="92vh">
          <div style={{ padding:'4px 18px 16px', borderBottom:`1px solid ${C.brd}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div><div style={{ fontSize:16, fontWeight:700, color:C.t1, fontFamily:FONT }}>Analytics</div><div style={{ fontSize:11.5, color:C.t3, marginTop:2, fontFamily:FONT }}>Content performance</div></div>
            <button onClick={()=>setShowMenu(false)} style={{ width:34, height:34, borderRadius:9, background:C.card, border:`1px solid ${C.brd}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X style={{ width:14, height:14, color:C.t3 }} /></button>
          </div>
          <div className="tcc-scr" style={{ flex:1, overflowY:'auto', padding:'16px', fontFamily:FONT }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {[
                { label:'Posts / week',    val:postsThisWeek,   col:C.cyan },
                { label:'Live Polls',      val:livePolls,        col:C.cyan },
                { label:'Live Challenges', val:liveChallenges,   col:C.cyan },
                { label:'Sessions / week', val:sessionsThisWeek, col:C.cyan },
              ].map((s,i) => (
                <div key={i} style={{ padding:'16px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}` }}>
                  <div style={{ fontSize:10.5, color:C.t3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:24, fontWeight:700, color:s.col, lineHeight:1 }}>{s.val}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'20px', borderRadius:14, background:C.card, border:`1px solid ${C.brd}`, marginBottom:16 }}>
              <div style={{ fontSize:11, color:C.t3, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Client Activity</div>
              <div style={{ fontSize:44, fontWeight:700, color:C.t1, letterSpacing:'-0.03em', lineHeight:1 }}>{interactionsToday}</div>
              <div style={{ fontSize:11, color:C.t3, marginTop:5 }}>interactions today</div>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.brd}`, borderRadius:14, padding:'14px 10px 8px', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, padding:'0 4px' }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.t1 }}>This Week</span>
                <span style={{ fontSize:11, color:C.t3 }}>7d</span>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={buildDailyData(posts,polls,checkIns)} margin={{ top:4, right:4, bottom:0, left:-26 }}>
                  <defs>
                    <linearGradient id="tccIGm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={C.cyan} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:C.t3, fontSize:10, fontFamily:FONT }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fill:C.t3, fontSize:10, fontFamily:FONT }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="v" stroke={C.cyan} strokeWidth={2.5} fill="url(#tccIGm)" dot={false} activeDot={{ r:4, fill:C.cyan, strokeWidth:2, stroke:C.card }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display:'flex', justifyContent:'center', paddingBottom:20 }}>
              <ActivityDial pct={clients.length>0 ? Math.round(Math.min(checkIns.filter(c=>Date.now()-new Date(c.check_in_date||c.created_date||0).getTime()<7*86400000).length/clients.length,1)*100) : 0} />
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
