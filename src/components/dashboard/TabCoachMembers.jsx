import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, X, Phone, Calendar, Dumbbell, TrendingUp, TrendingDown,
  Minus, Activity, AlertTriangle, Zap, Star, CreditCard,
  Clock, MessageCircle, User, UserPlus, ChevronRight, Bell,
  Edit3, Send, CheckCircle, Plus, Trash2, ShieldAlert, ChevronDown,
} from 'lucide-react';

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('tcm-css')) {
  const s = document.createElement('style');
  s.id = 'tcm-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .tcm { font-family: 'DM Sans', -apple-system, sans-serif; }
    @keyframes tcmFU { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:none } }
    @keyframes tcmSD { from { opacity:0; transform:translateY(-3px) } to { opacity:1; transform:none } }
    .tcm-fu { animation: tcmFU .25s ease both; }
    .tcm-sd { animation: tcmSD .18s ease both; }
    .tcm-root { display: grid; grid-template-columns: minmax(0,1fr) 268px; gap: 14px; }
    .tcm-left  { display: flex; flex-direction: column; gap: 0; }
    .tcm-tabs  { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.07);
                 overflow-x: auto; scrollbar-width: none; flex-shrink: 0; }
    .tcm-tabs::-webkit-scrollbar { display: none; }
    .tcm-tab   { padding: 9px 14px; font-size: 11px; font-family: inherit; background: none;
                 border: none; border-bottom: 2px solid transparent; cursor: pointer;
                 transition: all .14s; white-space: nowrap; flex-shrink: 0; margin-bottom: -1px; }
    .tcm-feed  { display: flex; flex-direction: column; gap: 6px; padding-top: 12px; }
    .tcm-row   { transition: background .1s; cursor: pointer; }
    .tcm-row:hover { background: rgba(255,255,255,.022) !important; }
    .tcm-btn   { font-family: 'DM Sans', sans-serif; cursor: pointer; outline: none;
                 transition: all .12s; }
    .tcm-btn:hover   { filter: brightness(1.1); }
    .tcm-btn:active  { filter: brightness(.95); transform: scale(.98); }
    .tcm-sidebar { display: flex; flex-direction: column; gap: 10px; }
    .tcm-inp { width: 100%; background: #0c1520; border: 1px solid rgba(255,255,255,.07);
               color: #dde6f0; font-size: 11px; font-family: 'DM Sans', sans-serif;
               outline: none; border-radius: 8px; padding: 8px 12px;
               transition: border-color .14s; resize: vertical; }
    .tcm-inp:focus { border-color: rgba(61,130,244,.45); }
    .tcm-sel { background: #091320; border: 1px solid rgba(255,255,255,.07);
               color: #dde6f0; font-size: 11px; font-family: 'DM Sans', sans-serif;
               outline: none; border-radius: 7px; padding: 7px 10px; cursor: pointer; }
    @media (max-width: 900px) {
      .tcm-root { grid-template-columns: 1fr; }
      .tcm-sidebar { display: none; }
    }
  `;
  document.head.appendChild(s);
}

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg:       '#080f1a',
  surface:  '#0c1520',
  inset:    '#091320',
  border:   'rgba(255,255,255,0.07)',
  borderMd: 'rgba(255,255,255,0.11)',
  t1: '#dde6f0',
  t2: '#7a8fa8',
  t3: '#3d5068',
  t4: '#1e3048',
  blue:     '#3d82f4',
  blueDim:  'rgba(61,130,244,0.10)',
  blueStr:  'rgba(61,130,244,0.22)',
  amber:    '#e8962a',
  amberDim: 'rgba(232,150,42,0.09)',
  amberStr: 'rgba(232,150,42,0.20)',
  red:      '#e05252',
  redDim:   'rgba(224,82,82,0.09)',
  redStr:   'rgba(224,82,82,0.20)',
  green:    '#21a36f',
  greenDim: 'rgba(33,163,111,0.09)',
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Avatar({ name = '?', size = 32 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(61,130,244,0.10)', border: '1px solid rgba(61,130,244,0.20)',
      fontSize: size * .33, fontWeight: 800, color: C.blue, letterSpacing: '-.01em',
    }}>{initials}</div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 11, overflow: 'hidden', ...style,
    }}>{children}</div>
  );
}

function CardHdr({ title, badge, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
      borderBottom: `1px solid ${C.border}` }}>
      <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: C.t1,
        textTransform: 'uppercase', letterSpacing: '.07em' }}>{title}</span>
      {badge && <span style={{ fontSize: 8, fontWeight: 800, color: C.amber,
        background: C.amberDim, border: `1px solid ${C.amberStr}`,
        borderRadius: 99, padding: '2px 8px', textTransform: 'uppercase',
        letterSpacing: '.05em' }}>{badge}</span>}
      {action && (
        <button className="tcm-btn" onClick={onAction} style={{
          fontSize: 9, fontWeight: 700, color: C.blue,
          background: C.blueDim, border: `1px solid ${C.blueStr}`,
          borderRadius: 6, padding: '3px 9px',
        }}>{action}</button>
      )}
    </div>
  );
}

function SideCard({ children, style }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 11, padding: '13px 14px', ...style }}>
      {children}
    </div>
  );
}

function SideHdr({ children }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase',
      letterSpacing: '.08em', marginBottom: 10 }}>{children}</div>
  );
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Spark({ data = [], color = C.blue, w = 64, h = 22 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1;
  const pts = data.map((v, i) => [
    2 + (i / (data.length - 1)) * (w - 4),
    3 + (1 - (v - min) / rng) * (h - 6),
  ]);
  const poly = pts.map(p => p.join(',')).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
      style={{ display: 'block', overflow: 'visible', opacity: .75, flexShrink: 0 }}>
      <polyline points={poly} stroke={color} strokeWidth="1.2"
        fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="2" fill={color}/>
    </svg>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return C.green;
  if (s >= 60) return C.t1;
  if (s >= 40) return C.amber;
  return C.red;
}
function scoreMeta(s) {
  if (s >= 80) return { label: 'Healthy',   color: C.green };
  if (s >= 60) return { label: 'Stable',    color: C.t1   };
  if (s >= 40) return { label: 'Caution',   color: C.amber };
  return              { label: 'At Risk',   color: C.red   };
}
function trendOf(hist) {
  if (!hist || hist.length < 4) return { dir: 'flat', delta: 0 };
  const d = hist[hist.length - 1] - hist[hist.length - 4];
  if (d > 4)  return { dir: 'up',   delta: d };
  if (d < -4) return { dir: 'down', delta: d };
  return            { dir: 'flat', delta: 0 };
}

const SEV = {
  Active:  { color: C.red,   dim: C.redDim,   str: C.redStr   },
  Monitor: { color: C.amber, dim: C.amberDim, str: C.amberStr },
  Mild:    { color: C.blue,  dim: C.blueDim,  str: C.blueStr  },
  Cleared: { color: C.green, dim: C.greenDim, str: 'rgba(33,163,111,0.2)' },
};

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CLIENTS = [
  {
    id: 1, name: 'Sarah Mitchell', email: 'sarah.m@example.com', phone: '+44 7911 123 456',
    tier: 'Premium', status: 'active', goal: 'Weight Loss',
    retentionScore: 88, retentionHistory: [68,72,74,78,80,83,86,88],
    sessionsThisMonth: 9, sessionsLastMonth: 7, lastVisit: 1, streak: 14,
    consecutiveMissed: 0, joinDate: 'Sep 2023', membership: 'Unlimited Monthly',
    monthlySpend: 149, tags: ['HIIT','Yoga'],
    notes: 'Responds exceptionally well to HIIT circuits. Prefers early morning slots and positive reinforcement. Strong candidate for a challenge feature testimonial.',
    nextSession: 'Tomorrow, 7:00 AM', upcomingClasses: ['HIIT Thursday','Yoga Sunday'],
    injuries: [{ id:1, area:'Left Knee', severity:'Monitor', note:'Post-ACL sensitivity. Avoid high-impact lunges and deep single-leg squats.', logged:'Mar 2024' }],
  },
  {
    id: 2, name: 'James Chen', email: 'j.chen@example.com', phone: '+44 7700 234 567',
    tier: 'Standard', status: 'active', goal: 'Muscle Gain',
    retentionScore: 73, retentionHistory: [78,77,76,75,74,74,73,73],
    sessionsThisMonth: 5, sessionsLastMonth: 7, lastVisit: 4, streak: 2,
    consecutiveMissed: 0, joinDate: 'Feb 2024', membership: '3× Week',
    monthlySpend: 89, tags: ['Strength','CrossFit'], notes: 'Highly competitive — responds well to benchmarks. Missed 2 sessions this month without notice.',
    nextSession: 'Friday, 6:30 PM', upcomingClasses: ['Strength Friday'], injuries: [],
  },
  {
    id: 3, name: 'Olivia Hartley', email: 'olivia.h@example.com', phone: '+44 7733 345 678',
    tier: 'Premium', status: 'at_risk', goal: 'Stress Relief',
    retentionScore: 38, retentionHistory: [82,79,70,61,53,46,41,38],
    sessionsThisMonth: 1, sessionsLastMonth: 5, lastVisit: 18, streak: 0,
    consecutiveMissed: 3, joinDate: 'Jan 2023', membership: 'Unlimited Monthly',
    monthlySpend: 149, tags: ['Yoga','Pilates'],
    notes: 'Significant engagement drop over 6 weeks. Mentioned work stress in last session. A warm personal check-in is strongly recommended.',
    nextSession: null, upcomingClasses: [],
    injuries: [{ id:1, area:'Right Shoulder', severity:'Mild', note:'Mild impingement. Avoid overhead pressing until cleared.', logged:'Jan 2024' }],
  },
  {
    id: 4, name: 'Marcus Williams', email: 'marcus.w@example.com', phone: '+44 7808 456 789',
    tier: 'Elite', status: 'active', goal: 'Athletic Performance',
    retentionScore: 96, retentionHistory: [88,89,91,92,93,94,95,96],
    sessionsThisMonth: 12, sessionsLastMonth: 11, lastVisit: 0, streak: 28,
    consecutiveMissed: 0, joinDate: 'Mar 2022', membership: 'Unlimited + PT',
    monthlySpend: 299, tags: ['Strength','HIIT','Boxing'],
    notes: 'Star client. Never misses a session. Ask about marathon prep plans in Q3. Great brand ambassador candidate.',
    nextSession: 'Today, 5:30 PM', upcomingClasses: ['Boxing Today','HIIT Wednesday','Strength Friday'], injuries: [],
  },
  {
    id: 5, name: 'Priya Sharma', email: 'p.sharma@example.com', phone: '+44 7912 567 890',
    tier: 'Standard', status: 'paused', goal: 'General Fitness',
    retentionScore: 54, retentionHistory: [65,63,60,57,54,51,53,54],
    sessionsThisMonth: 2, sessionsLastMonth: 4, lastVisit: 9, streak: 1,
    consecutiveMissed: 2, joinDate: 'Nov 2023', membership: 'Pay As You Go',
    monthlySpend: 55, tags: ['Cardio','Pilates'],
    notes: 'Membership paused due to travel — returns mid-month. Send a personalised welcome-back message.',
    nextSession: 'Returns 15th', upcomingClasses: [],
    injuries: [{ id:1, area:'Lower Back', severity:'Monitor', note:'Recurring tightness after long flights. Prioritise mobility work on return.', logged:'Feb 2024' }],
  },
  {
    id: 6, name: 'Tom Gallagher', email: 't.gallagher@example.com', phone: '+44 7765 678 901',
    tier: 'Standard', status: 'active', goal: 'Weight Loss',
    retentionScore: 67, retentionHistory: [55,57,60,62,64,65,66,67],
    sessionsThisMonth: 4, sessionsLastMonth: 3, lastVisit: 3, streak: 3,
    consecutiveMissed: 0, joinDate: 'Apr 2024', membership: '2× Week',
    monthlySpend: 69, tags: ['Cardio','Functional'],
    notes: 'Newer member with solid upward progress. Consider suggesting a trial upgrade to 3× per week.',
    nextSession: 'Wednesday, 12:00 PM', upcomingClasses: ['Functional Wednesday'], injuries: [],
  },
  {
    id: 7, name: 'Aisha Okonkwo', email: 'a.okonkwo@example.com', phone: '+44 7890 789 012',
    tier: 'Elite', status: 'active', goal: 'Endurance & Toning',
    retentionScore: 91, retentionHistory: [84,85,87,88,89,90,90,91],
    sessionsThisMonth: 10, sessionsLastMonth: 10, lastVisit: 1, streak: 21,
    consecutiveMissed: 0, joinDate: 'Jul 2022', membership: 'Unlimited + PT',
    monthlySpend: 299, tags: ['Spin','Yoga','Pilates'],
    notes: 'Excellent form awareness. Strong candidate for the 8-week challenge. Has referred two friends this quarter.',
    nextSession: 'Tomorrow, 9:30 AM', upcomingClasses: ['Spin Tuesday','Yoga Thursday'],
    injuries: [{ id:1, area:'Left Hip Flexor', severity:'Cleared', note:'Fully recovered. No restrictions.', logged:'Dec 2023' }],
  },
  {
    id: 8, name: 'Daniel Foster', email: 'd.foster@example.com', phone: '+44 7700 890 123',
    tier: 'Standard', status: 'at_risk', goal: 'Strength Building',
    retentionScore: 27, retentionHistory: [74,66,57,47,39,34,30,27],
    sessionsThisMonth: 0, sessionsLastMonth: 3, lastVisit: 31, streak: 0,
    consecutiveMissed: 5, joinDate: 'Aug 2023', membership: '3× Week',
    monthlySpend: 89, tags: ['Strength'],
    notes: 'Has not attended in over a month. Last two messages went unanswered. Consider a personal phone call.',
    nextSession: null, upcomingClasses: [],
    injuries: [
      { id:1, area:'Right Wrist',   severity:'Active',  note:'Sprain from October. Barbell pressing restricted until physio clearance.', logged:'Oct 2023' },
      { id:2, area:'Left Shoulder', severity:'Monitor', note:'General instability. Recommend band work before loading overhead movements.', logged:'Jan 2024' },
    ],
  },
];

// ─── PRESETS ──────────────────────────────────────────────────────────────────
const PRESETS = [
  { id:'checkin',  label:'Check-in',        text: fn=>`Hey ${fn} 👋 Just checking in — how are things going? Would love to see you back this week.` },
  { id:'missed',   label:'Missed sessions', text: fn=>`Hi ${fn}, we noticed you haven't been in for a bit. Just checking everything's okay.` },
  { id:'congrats', label:'Celebrate',       text: fn=>`${fn} — you've been absolutely crushing it lately! Your consistency is seriously impressive 💪` },
  { id:'upgrade',  label:'Upgrade offer',   text: fn=>`Hey ${fn}, given how consistent you've been, I think you'd get a lot from stepping up your plan. Want to chat options?` },
  { id:'welcome',  label:'Welcome back',    text: fn=>`Hi ${fn}, great to have you back! We've got some exciting sessions lined up — let's pick up right where you left off.` },
];

const DROP_TABS = ['Overview','Notes','Injuries','Schedule','Actions'];

// ─── INLINE DROP PANEL ────────────────────────────────────────────────────────
function DropPanel({ client, onClose, openModal }) {
  const [tab,      setTab]      = useState('Overview');
  const [noteVal,  setNoteVal]  = useState(client.notes);
  const [noteSaved,setNoteSaved]= useState(false);
  const [custom,   setCustom]   = useState('');
  const [preset,   setPreset]   = useState(null);
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [injuries, setInjuries] = useState(client.injuries || []);
  const [addInj,   setAddInj]   = useState(false);
  const [injForm,  setInjForm]  = useState({ area:'', severity:'Monitor', note:'' });

  const fn            = client.name.split(' ')[0];
  const isRisk        = client.status === 'at_risk';
  const isPaused      = client.status === 'paused';
  const activeInj     = injuries.filter(i => i.severity !== 'Cleared');
  const hasActiveInj  = injuries.some(i => i.severity === 'Active');
  const accentColor   = isRisk ? C.red : C.blue;
  const delta         = client.sessionsThisMonth - client.sessionsLastMonth;
  const sc            = scoreColor(client.retentionScore);
  const smeta         = scoreMeta(client.retentionScore);
  const trend         = trendOf(client.retentionHistory);
  const TIcon         = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus;
  const tColor        = trend.dir === 'up' ? C.green : trend.dir === 'down' ? C.red : C.t3;
  const message       = preset ? (PRESETS.find(p => p.id === preset)?.text(fn) || '') : custom;

  useEffect(() => { setNoteVal(client.notes); setTab('Overview'); }, [client.id]);
  useEffect(() => { setAddInj(false); setPreset(null); }, [tab]);

  function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 900);
    setTimeout(() => { setSent(false); setCustom(''); setPreset(null); }, 2800);
  }
  function saveNote() { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000); }
  function addInjury() {
    if (!injForm.area.trim()) return;
    const logged = new Date().toLocaleString('en-GB', { month:'short', year:'numeric' });
    setInjuries(p => [...p, { id: Date.now(), ...injForm, logged }]);
    setInjForm({ area:'', severity:'Monitor', note:'' });
    setAddInj(false);
  }

  return (
    <div className="tcm-sd" style={{
      borderTop: `1px solid ${accentColor}20`,
      borderLeft: `2px solid ${accentColor}`,
    }}>
      {/* Drop header */}
      <div style={{ padding:'11px 14px', background: C.inset,
        borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <Avatar name={client.name} size={22}/>
          <div>
            <span style={{ fontSize:12, fontWeight:700, color:C.t1 }}>{client.name}</span>
            <span style={{ fontSize:10, color:C.t3, marginLeft:8 }}>{client.membership} · Since {client.joinDate}</span>
          </div>
          <span style={{ fontSize:8, fontWeight:800, color:C.t3,
            background:'rgba(255,255,255,.05)', border:`1px solid ${C.border}`,
            borderRadius:99, padding:'2px 7px', textTransform:'uppercase', letterSpacing:'.05em' }}>{client.tier}</span>
          {isRisk && <span style={{ fontSize:8, fontWeight:800, color:C.red,
            background:C.redDim, border:`1px solid ${C.redStr}`,
            borderRadius:99, padding:'2px 7px', textTransform:'uppercase' }}>At Risk</span>}
          {isPaused && <span style={{ fontSize:8, fontWeight:800, color:C.t3,
            background:'rgba(255,255,255,.04)', border:`1px solid ${C.border}`,
            borderRadius:99, padding:'2px 7px', textTransform:'uppercase' }}>Paused</span>}
        </div>
        <button className="tcm-btn" onClick={e => { e.stopPropagation(); onClose(); }} style={{
          width:24, height:24, borderRadius:6, display:'flex', alignItems:'center',
          justifyContent:'center', background:'transparent', border:`1px solid ${C.border}`,
        }}>
          <X style={{ width:10, height:10, color:C.t3 }}/>
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', background:C.surface, borderBottom:`1px solid ${C.border}`,
        overflowX:'auto', scrollbarWidth:'none' }}>
        {DROP_TABS.map(t => {
          const isAct = tab === t;
          const isInj = t === 'Injuries';
          const badge = isInj ? activeInj.length : 0;
          const badgeColor = hasActiveInj ? C.red : C.amber;
          return (
            <button key={t} onClick={e => { e.stopPropagation(); setTab(t); }} style={{
              padding:'8px 14px', fontSize:11, fontFamily:'inherit',
              background:'none', border:'none',
              borderBottom:`2px solid ${isAct ? accentColor : 'transparent'}`,
              cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, marginBottom:-1,
              fontWeight: isAct ? 700 : 500,
              color: isAct ? accentColor : C.t3,
              display:'flex', alignItems:'center', gap:5, transition:'color .14s',
            }}>
              {t}
              {badge > 0 && (
                <span style={{ fontSize:8, fontWeight:800, color:badgeColor,
                  background:`${badgeColor}12`, border:`1px solid ${badgeColor}25`,
                  borderRadius:99, padding:'0 5px' }}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div onClick={e => e.stopPropagation()} style={{ padding:'14px 16px 16px' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'Overview' && (
          <div>
            {/* Score hero */}
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 12px',
              borderRadius:9, marginBottom:12,
              background:`${sc}07`, border:`1px solid ${sc}1a` }}>
              <div style={{ textAlign:'center', minWidth:52 }}>
                <div style={{ fontSize:34, fontWeight:800, color:sc, lineHeight:1, letterSpacing:'-.04em' }}>
                  {client.retentionScore}
                </div>
                <div style={{ fontSize:8, color:sc, fontWeight:700, marginTop:3,
                  textTransform:'uppercase', letterSpacing:'.06em' }}>{smeta.label}</div>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
                  <TIcon style={{ width:10, height:10, color:tColor }}/>
                  <span style={{ fontSize:10, fontWeight:700, color:tColor }}>
                    {trend.dir==='up' ? `+${trend.delta} pts — Improving`
                      : trend.dir==='down' ? `${trend.delta} pts — Declining`
                      : 'Stable — holding steady'}
                  </span>
                </div>
                <Spark data={client.retentionHistory} color={sc} w={160} h={28}/>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:12 }}>
              {[
                { l:'Sessions / mo', v:client.sessionsThisMonth, c: delta > 0 ? C.green : delta < 0 ? C.red : C.t1 },
                { l:'Monthly spend', v:`£${client.monthlySpend}`, c:C.t1 },
                { l:'Streak',        v: client.streak > 0 ? `${client.streak}d` : '—', c: client.streak >= 14 ? C.green : C.t1 },
              ].map((s,i) => (
                <div key={i} style={{ padding:'8px 10px', borderRadius:8, textAlign:'center',
                  background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:16, fontWeight:800, color:s.c, letterSpacing:'-.03em', lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:8, color:C.t3, textTransform:'uppercase', letterSpacing:'.06em', marginTop:3 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Nudges */}
            {isRisk && (
              <div style={{ padding:'9px 12px', borderRadius:8, background:C.redDim,
                border:`1px solid ${C.redStr}`, borderLeft:`2px solid ${C.red}`,
                display:'flex', alignItems:'flex-start', gap:8 }}>
                <AlertTriangle style={{ width:11, height:11, color:C.red, flexShrink:0, marginTop:1 }}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.red }}>High churn risk. </span>
                  <span style={{ fontSize:11, color:C.t3, lineHeight:1.5 }}>
                    Last visit {client.lastVisit} days ago. A personal call beats any automated message.
                  </span>
                </div>
                <button className="tcm-btn" onClick={() => setTab('Actions')} style={{
                  fontSize:9, fontWeight:700, color:C.red, background:'transparent',
                  border:'none', whiteSpace:'nowrap', flexShrink:0, display:'flex', alignItems:'center', gap:2,
                }}>Actions <ChevronRight style={{ width:9, height:9 }}/></button>
              </div>
            )}
            {client.streak >= 21 && (
              <div style={{ padding:'9px 12px', borderRadius:8, background:C.greenDim,
                border:`1px solid rgba(33,163,111,.2)`, borderLeft:`2px solid ${C.green}`,
                display:'flex', alignItems:'flex-start', gap:8 }}>
                <Zap style={{ width:11, height:11, color:C.green, flexShrink:0, marginTop:1 }}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:C.green }}>{client.streak}-day streak. </span>
                  <span style={{ fontSize:11, color:C.t3 }}>Acknowledge this milestone — recognition drives retention.</span>
                </div>
                <button className="tcm-btn" onClick={() => setTab('Actions')} style={{
                  fontSize:9, fontWeight:700, color:C.green, background:'transparent',
                  border:'none', whiteSpace:'nowrap', flexShrink:0, display:'flex', alignItems:'center', gap:2,
                }}>Message <ChevronRight style={{ width:9, height:9 }}/></button>
              </div>
            )}
            {!isRisk && client.streak < 21 && (
              <div style={{ padding:'8px 12px', borderRadius:8,
                background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}`,
                borderLeft:`2px solid ${C.green}`, display:'flex', alignItems:'center', gap:8 }}>
                <CheckCircle style={{ width:11, height:11, color:C.green, flexShrink:0 }}/>
                <span style={{ fontSize:11, color:C.t3 }}>Tracking well — no action needed right now.</span>
              </div>
            )}
          </div>
        )}

        {/* ── NOTES ── */}
        {tab === 'Notes' && (
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:C.t3, textTransform:'uppercase',
              letterSpacing:'.08em', marginBottom:8 }}>Coach Notes — Private</div>
            <textarea className="tcm-inp" rows={6} value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              placeholder={`Add coaching notes for ${fn}…`}/>
            <button className="tcm-btn" onClick={saveNote} style={{
              marginTop:8, display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
              borderRadius:7, background: noteSaved ? C.greenDim : C.blueDim,
              border:`1px solid ${noteSaved ? 'rgba(33,163,111,.2)' : C.blueStr}`,
              color: noteSaved ? C.green : C.blue, fontSize:10, fontWeight:700,
            }}>
              {noteSaved ? <><CheckCircle style={{ width:10, height:10 }}/> Saved</>
                        : <><Edit3 style={{ width:10, height:10 }}/> Save Notes</>}
            </button>
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:9, fontWeight:700, color:C.t3, textTransform:'uppercase',
                letterSpacing:'.08em', marginBottom:8 }}>Quick Reference</div>
              {[
                { l:'Membership', v:client.membership },
                { l:'Since',      v:client.joinDate   },
                { l:'Goal',       v:client.goal       },
                { l:'Classes',    v:client.tags.join(', ') || '—' },
                { l:'Email',      v:client.email      },
                { l:'Phone',      v:client.phone      },
              ].map((r,i,arr) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'6px 0',
                  borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize:10, color:C.t3 }}>{r.l}</span>
                  <span style={{ fontSize:10, fontWeight:600, color:C.t1 }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── INJURIES ── */}
        {tab === 'Injuries' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:9, fontWeight:700, color:C.t3, textTransform:'uppercase', letterSpacing:'.08em' }}>
                  Injury & Limitation Log
                </div>
                {activeInj.length > 0 && (
                  <div style={{ fontSize:10, color: hasActiveInj ? C.red : C.amber, fontWeight:600, marginTop:2 }}>
                    {activeInj.length} active {activeInj.length===1?'restriction':'restrictions'}
                  </div>
                )}
              </div>
              <button className="tcm-btn" onClick={() => setAddInj(v=>!v)} style={{
                display:'flex', alignItems:'center', gap:5, padding:'4px 10px',
                borderRadius:6, background:C.blueDim, border:`1px solid ${C.blueStr}`,
                color:C.blue, fontSize:9, fontWeight:700,
              }}>
                <Plus style={{ width:9, height:9 }}/> Log
              </button>
            </div>

            {addInj && (
              <div style={{ padding:11, borderRadius:8, marginBottom:12,
                background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}`,
                borderLeft:`2px solid ${C.blue}` }}>
                <div style={{ display:'flex', gap:7, marginBottom:7 }}>
                  <input className="tcm-inp" value={injForm.area}
                    onChange={e => setInjForm(f=>({...f, area:e.target.value}))}
                    placeholder="Body area (e.g. Left Knee)"
                    style={{ flex:1, padding:'7px 10px', borderRadius:7 }}/>
                  <select className="tcm-sel" value={injForm.severity}
                    onChange={e => setInjForm(f=>({...f, severity:e.target.value}))}>
                    {['Active','Monitor','Mild','Cleared'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <textarea className="tcm-inp" rows={2} value={injForm.note}
                  onChange={e => setInjForm(f=>({...f, note:e.target.value}))}
                  placeholder="Describe the limitation…" style={{ marginBottom:8 }}/>
                <div style={{ display:'flex', gap:6 }}>
                  <button className="tcm-btn" onClick={addInjury} style={{
                    flex:1, padding:'6px 10px', borderRadius:7, fontSize:10, fontWeight:700,
                    background:C.blue, border:'none', color:'#fff',
                  }}>Save</button>
                  <button className="tcm-btn" onClick={() => setAddInj(false)} style={{
                    padding:'6px 10px', borderRadius:7, fontSize:10, fontWeight:700,
                    background:'transparent', border:`1px solid ${C.border}`, color:C.t3,
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {injuries.length === 0 ? (
              <div style={{ padding:'20px', textAlign:'center', borderRadius:9,
                background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}` }}>
                <p style={{ fontSize:12, color:C.t2, fontWeight:600, margin:'0 0 3px' }}>No injuries logged</p>
                <p style={{ fontSize:10, color:C.t3, margin:0 }}>{fn} has no active restrictions on file.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {injuries.map(inj => {
                  const s = SEV[inj.severity] || SEV.Mild;
                  return (
                    <div key={inj.id} style={{ padding:'10px 12px', borderRadius:8,
                      background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}`,
                      borderLeft:`2px solid ${s.color}` }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                        <span style={{ fontSize:11, fontWeight:700, color:C.t1, flex:1 }}>{inj.area}</span>
                        <span style={{ fontSize:8, fontWeight:800, color:s.color,
                          background:s.dim, border:`1px solid ${s.str}`,
                          borderRadius:99, padding:'2px 7px', whiteSpace:'nowrap',
                          textTransform:'uppercase' }}>{inj.severity}</span>
                        <button className="tcm-btn" onClick={() => setInjuries(p=>p.filter(i=>i.id!==inj.id))}
                          style={{ width:20, height:20, borderRadius:5, display:'flex', alignItems:'center',
                            justifyContent:'center', background:'transparent', border:'none', color:C.t3 }}
                          onMouseEnter={e=>e.currentTarget.style.color=C.red}
                          onMouseLeave={e=>e.currentTarget.style.color=C.t3}>
                          <Trash2 style={{ width:10, height:10 }}/>
                        </button>
                      </div>
                      {inj.note && <p style={{ fontSize:10, color:C.t2, margin:'0 0 4px', lineHeight:1.55 }}>{inj.note}</p>}
                      <span style={{ fontSize:9, color:C.t3 }}>Logged {inj.logged}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {tab === 'Schedule' && (
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:C.t3, textTransform:'uppercase',
              letterSpacing:'.08em', marginBottom:12 }}>Sessions & Classes</div>
            {client.nextSession ? (
              <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px',
                borderRadius:9, marginBottom:10, background:C.blueDim,
                border:`1px solid ${C.blueStr}` }}>
                <Calendar style={{ width:12, height:12, color:C.blue, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:9, color:C.t3, fontWeight:600, marginBottom:2 }}>Next session</div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>{client.nextSession}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding:'10px 12px', borderRadius:9, marginBottom:10,
                background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}`,
                borderLeft:`2px solid ${isPaused ? C.amber : C.t4}` }}>
                <p style={{ fontSize:11, color:C.t2, margin:0, fontWeight:600 }}>
                  {isPaused ? `${fn}'s membership is paused.` : 'No upcoming sessions booked.'}
                </p>
              </div>
            )}
            {client.upcomingClasses?.length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:12 }}>
                {client.upcomingClasses.map((cls,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8,
                    padding:'7px 10px', borderRadius:7,
                    background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}` }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:C.blue, flexShrink:0 }}/>
                    <span style={{ flex:1, fontSize:11, color:C.t1, fontWeight:500 }}>{cls}</span>
                    <span style={{ fontSize:8, color:C.t3, fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'.05em' }}>Booked</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:12 }}>
              {[
                { l:'This Month', v:client.sessionsThisMonth, c:C.t1 },
                { l:'Last Month', v:client.sessionsLastMonth, c:C.t2 },
                { l:'Change',     v:`${delta>=0?'+':''}${delta}`, c: delta>=0?C.green:C.red },
              ].map((s,i) => (
                <div key={i} style={{ padding:'9px 10px', borderRadius:8, textAlign:'center',
                  background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:18, fontWeight:800, color:s.c, letterSpacing:'-.03em', lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:8, color:C.t3, textTransform:'uppercase', letterSpacing:'.06em', marginTop:3 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <button className="tcm-btn" style={{
              width:'100%', padding:'8px 14px', borderRadius:8,
              background:C.blueDim, border:`1px solid ${C.blueStr}`,
              color:C.blue, fontSize:11, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              <Calendar style={{ width:11, height:11 }}/> Book into a Class
            </button>
          </div>
        )}

        {/* ── ACTIONS ── */}
        {tab === 'Actions' && (
          <div>
            <div style={{ display:'flex', gap:7, marginBottom:14, flexWrap:'wrap' }}>
              {[
                { icon:Phone,    label:'Call',    color:C.green },
                { icon:Calendar, label:'Book',    color:C.blue  },
                { icon:Dumbbell, label:'Workout', color:C.amber },
              ].map(({ icon:Ic, label, color },i) => (
                <button key={i} className="tcm-btn" style={{
                  flex:'1 1 auto', display:'flex', alignItems:'center',
                  justifyContent:'center', gap:5, padding:'8px 10px', borderRadius:8,
                  background:`${color}09`, border:`1px solid ${color}20`,
                  color, fontSize:10, fontWeight:700,
                }}>
                  <Ic style={{ width:11, height:11 }}/> {label}
                </button>
              ))}
            </div>
            <div style={{ fontSize:9, fontWeight:700, color:C.t3, textTransform:'uppercase',
              letterSpacing:'.08em', marginBottom:8 }}>Send Message to {fn}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
              {PRESETS.map(p => (
                <button key={p.id} className="tcm-btn" onClick={() => setPreset(v=>v===p.id?null:p.id)} style={{
                  padding:'4px 9px', borderRadius:6, fontSize:10, fontWeight:600,
                  background: preset===p.id ? C.blueDim : 'rgba(255,255,255,.03)',
                  border:`1px solid ${preset===p.id ? C.blueStr : C.border}`,
                  color: preset===p.id ? C.blue : C.t3,
                }}>{p.label}</button>
              ))}
            </div>
            {preset ? (
              <div style={{ marginBottom:10, padding:'9px 11px', borderRadius:8,
                background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}`,
                borderLeft:`2px solid ${C.blue}`,
                fontSize:11, color:C.t2, lineHeight:1.6 }}>{message}</div>
            ) : (
              <textarea className="tcm-inp" rows={3} value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder={`Write a message to ${fn}…`}
                style={{ marginBottom:10 }}/>
            )}
            <button className="tcm-btn" onClick={handleSend}
              disabled={!message.trim() || sending || sent} style={{
                width:'100%', padding:'8px 14px', borderRadius:8,
                background: sent ? C.greenDim : !message.trim() ? 'rgba(255,255,255,.04)' : C.blue,
                border:`1px solid ${sent ? 'rgba(33,163,111,.25)' : !message.trim() ? C.border : C.blueStr}`,
                color: sent ? C.green : !message.trim() ? C.t3 : '#fff',
                fontSize:11, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
              {sent ? <><CheckCircle style={{ width:11, height:11 }}/> Sent</>
                : sending ? 'Sending…'
                : <><Send style={{ width:11, height:11 }}/> Send to {fn}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CLIENT ROW ───────────────────────────────────────────────────────────────
function ClientRow({ client, isOpen, onToggle, openModal }) {
  const isRisk   = client.status === 'at_risk';
  const isPaused = client.status === 'paused';
  const sc       = scoreColor(client.retentionScore);
  const trend    = trendOf(client.retentionHistory);
  const delta    = client.sessionsThisMonth - client.sessionsLastMonth;
  const TIcon    = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus;
  const tColor   = trend.dir === 'up' ? C.green : trend.dir === 'down' ? C.red : C.t3;
  const activeInj = (client.injuries || []).filter(i => i.severity !== 'Cleared').length;
  const hasActive = (client.injuries || []).some(i => i.severity === 'Active');

  return (
    <div style={{ background: C.surface, border:`1px solid ${C.border}`,
      borderRadius: 10, overflow:'hidden',
      borderLeft: isRisk && !isOpen ? `2px solid ${C.red}` : `2px solid transparent`,
    }}>
      {/* Row */}
      <div className="tcm-row" onClick={onToggle} style={{
        display:'flex', alignItems:'center', gap:12, padding:'12px 14px',
        background:'transparent',
      }}>
        {/* Avatar */}
        <Avatar name={client.name} size={34}/>

        {/* Name + meta */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.t1,
              letterSpacing:'-.015em' }}>{client.name}</span>
            <span style={{ fontSize:8, fontWeight:700, color:C.t3,
              background:'rgba(255,255,255,.05)', border:`1px solid ${C.border}`,
              borderRadius:99, padding:'1px 7px', textTransform:'uppercase',
              letterSpacing:'.05em' }}>{client.tier}</span>
            {isRisk && <span style={{ fontSize:8, fontWeight:800, color:C.red,
              background:C.redDim, border:`1px solid ${C.redStr}`,
              borderRadius:99, padding:'1px 7px', textTransform:'uppercase' }}>At Risk</span>}
            {isPaused && <span style={{ fontSize:8, fontWeight:700, color:C.t3,
              background:'rgba(255,255,255,.04)', border:`1px solid ${C.border}`,
              borderRadius:99, padding:'1px 7px', textTransform:'uppercase' }}>Paused</span>}
            {client.streak >= 14 && <span style={{ fontSize:9, color:C.amber }}>🔥 {client.streak}d</span>}
            {activeInj > 0 && (
              <span style={{ fontSize:9, fontWeight:700,
                color: hasActive ? C.red : C.amber,
                display:'flex', alignItems:'center', gap:2 }}>
                <ShieldAlert style={{ width:9, height:9 }}/> {activeInj}
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:10, color:C.t3 }}>{client.goal}</span>
            <span style={{ fontSize:10, color:C.t4 }}>·</span>
            <span style={{ fontSize:10, fontWeight:600,
              color: client.lastVisit===0 ? C.green : client.lastVisit>14 ? C.red : client.lastVisit>7 ? C.amber : C.t3 }}>
              {client.lastVisit===0 ? 'Today' : client.lastVisit===1 ? 'Yesterday' : `${client.lastVisit}d ago`}
            </span>
            <span style={{ fontSize:10, color:C.t4 }}>·</span>
            <span style={{ fontSize:10, color:C.t3 }}>
              {client.sessionsThisMonth} sessions
              {delta !== 0 && (
                <span style={{ color: delta>0?C.green:C.red, fontWeight:700, marginLeft:3 }}>
                  ({delta>0?'+':''}{delta})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Spark + score */}
        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <Spark data={client.retentionHistory} color={sc} w={64} h={22}/>
          <div style={{ textAlign:'right', minWidth:34 }}>
            <div style={{ fontSize:20, fontWeight:800, color:sc,
              lineHeight:1, letterSpacing:'-.04em' }}>{client.retentionScore}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:2, marginTop:2 }}>
              <TIcon style={{ width:8, height:8, color:tColor }}/>
              <span style={{ fontSize:7.5, fontWeight:700, color:C.t3,
                textTransform:'uppercase', letterSpacing:'.04em' }}>{trend.dir}</span>
            </div>
          </div>
          <ChevronDown style={{
            width:12, height:12, flexShrink:0, color: isOpen ? C.blue : C.t4,
            transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s ease, color .14s',
          }}/>
        </div>
      </div>

      {/* Drop panel */}
      {isOpen && <DropPanel client={client} onClose={onToggle} openModal={openModal}/>}
    </div>
  );
}

// ─── SUMMARY STRIP ────────────────────────────────────────────────────────────
function SummaryStrip({ clients }) {
  const mrr      = clients.reduce((s,c) => s + c.monthlySpend, 0);
  const avgScore = Math.round(clients.reduce((s,c) => s + c.retentionScore, 0) / (clients.length || 1));
  const active   = clients.filter(c => c.status === 'active').length;
  const atRisk   = clients.filter(c => c.status === 'at_risk').length;
  const ameta    = scoreMeta(avgScore);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
      {[
        { label:'Monthly Revenue', value:`£${mrr.toLocaleString()}`, sub:'total MRR',           color:C.green },
        { label:'Avg Retention',   value:avgScore,                   sub:ameta.label,            color:ameta.color },
        { label:'Active Clients',  value:active,                     sub:'regularly attending',  color:C.blue  },
        { label:'Need Outreach',   value:atRisk,                     sub:'at churn risk',        color:atRisk>0?C.red:C.t3 },
      ].map((s,i) => (
        <div key={i} style={{ padding:'13px 16px', borderRadius:11,
          background:C.surface, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:9, color:C.t3, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'.07em', marginBottom:6 }}>{s.label}</div>
          <div style={{ fontSize:24, fontWeight:800, color:s.color,
            lineHeight:1, letterSpacing:'-.04em', marginBottom:4 }}>{s.value}</div>
          <div style={{ fontSize:9, color:C.t3 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ clients, openClient }) {
  const atRisk   = clients.filter(c => c.status === 'at_risk');
  const topClient = [...clients].sort((a,b) => b.retentionScore - a.retentionScore)[0];
  const withActiveInj = clients.filter(c => (c.injuries||[]).some(i=>i.severity==='Active'));

  return (
    <div className="tcm-sidebar">

      {/* Priority Outreach */}
      {atRisk.length > 0 && (
        <SideCard style={{ borderLeft:`2px solid ${C.red}` }}>
          <SideHdr>Priority Outreach</SideHdr>
          <div style={{ fontSize:10, color:C.red, fontWeight:600, marginTop:-6, marginBottom:10 }}>
            {atRisk.length} at churn risk
          </div>
          {atRisk.map((c,i) => (
            <div key={c.id} onClick={() => openClient(c)} style={{
              display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
              borderRadius:8, marginBottom: i<atRisk.length-1 ? 5 : 0,
              background:'rgba(255,255,255,.02)', border:`1px solid ${C.border}`,
              cursor:'pointer', transition:'border-color .13s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.redStr}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
              <Avatar name={c.name} size={26}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.t1,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                <div style={{ fontSize:9, color:C.t3 }}>{c.lastVisit}d since last visit</div>
              </div>
              <span style={{ fontSize:15, fontWeight:800, color:scoreColor(c.retentionScore),
                letterSpacing:'-.03em' }}>{c.retentionScore}</span>
            </div>
          ))}
        </SideCard>
      )}

      {/* Retention Health */}
      <SideCard>
        <SideHdr>Retention Health</SideHdr>
        {[
          { label:'Healthy (80+)',   count:clients.filter(c=>c.retentionScore>=80).length,                                        color:C.green },
          { label:'Stable (60–79)', count:clients.filter(c=>c.retentionScore>=60&&c.retentionScore<80).length,                    color:C.t1    },
          { label:'Caution (40–59)',count:clients.filter(c=>c.retentionScore>=40&&c.retentionScore<60).length,                    color:C.amber },
          { label:'At Risk (<40)',   count:clients.filter(c=>c.retentionScore<40).length,                                         color:C.red   },
        ].map((r,i,arr) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'7px 0', borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : 'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:r.color, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:C.t2 }}>{r.label}</span>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.count}</span>
          </div>
        ))}
      </SideCard>

      {/* Top Performer */}
      {topClient && (
        <SideCard>
          <SideHdr>Top Performer</SideHdr>
          <div onClick={() => openClient(topClient)} style={{ cursor:'pointer' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
              <Avatar name={topClient.name} size={32}/>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.t1 }}>{topClient.name}</div>
                <div style={{ fontSize:10, color:C.t3 }}>{topClient.membership}</div>
              </div>
            </div>
            <div style={{ padding:'8px 10px', borderRadius:8, background:C.greenDim,
              border:`1px solid rgba(33,163,111,.18)`,
              display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:28, fontWeight:800, color:C.green,
                letterSpacing:'-.04em', lineHeight:1 }}>{topClient.retentionScore}</div>
              <Spark data={topClient.retentionHistory} color={C.green} w={100} h={24}/>
            </div>
          </div>
        </SideCard>
      )}

      {/* Active injury alerts */}
      {withActiveInj.length > 0 && (
        <SideCard style={{ borderLeft:`2px solid ${C.red}` }}>
          <SideHdr>Active Injuries</SideHdr>
          <div style={{ fontSize:10, color:C.red, fontWeight:600, marginTop:-6, marginBottom:10 }}>
            {withActiveInj.length} client{withActiveInj.length>1?'s':''} restricted
          </div>
          {withActiveInj.map((c,i) => {
            const active = (c.injuries||[]).filter(i=>i.severity==='Active');
            return (
              <div key={c.id} onClick={() => openClient(c)} style={{
                padding:'8px 10px', borderRadius:8, background:C.redDim,
                border:`1px solid ${C.redStr}`,
                marginBottom: i<withActiveInj.length-1 ? 5 : 0, cursor:'pointer',
              }}>
                <div style={{ fontSize:11, fontWeight:700, color:C.t1, marginBottom:3 }}>{c.name}</div>
                {active.map(inj => (
                  <div key={inj.id} style={{ fontSize:9, color:C.red, fontWeight:600 }}>⚠ {inj.area}</div>
                ))}
              </div>
            );
          })}
        </SideCard>
      )}

      {/* Revenue split */}
      <SideCard>
        <SideHdr>Revenue Split</SideHdr>
        {['Elite','Premium','Standard'].map((tier,i,arr) => {
          const val = CLIENTS.filter(c=>c.tier===tier).reduce((s,c)=>s+c.monthlySpend,0);
          const total = CLIENTS.reduce((s,c)=>s+c.monthlySpend,0);
          const pct = total > 0 ? Math.round((val/total)*100) : 0;
          return (
            <div key={tier} style={{ marginBottom: i<arr.length-1 ? 9 : 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:10, color:C.t2 }}>{tier}</span>
                <span style={{ fontSize:10, fontWeight:700, color:C.t1 }}>
                  £{val} <span style={{ color:C.t3, fontWeight:400 }}>({pct}%)</span>
                </span>
              </div>
              <div style={{ height:2, borderRadius:99, background:'rgba(255,255,255,.05)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:C.blue,
                  opacity: .4 + i * .2 }}/>
              </div>
            </div>
          );
        })}
      </SideCard>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function TabCoachMembers({ openModal = () => {} }) {
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [sortBy,  setSortBy]  = useState('risk');
  const [openId,  setOpenId]  = useState(null);

  const atRiskCount = CLIENTS.filter(c => c.status === 'at_risk').length;

  const FILTERS = [
    { id:'all',      label:'All Clients', count:CLIENTS.length },
    { id:'active',   label:'Active',      count:CLIENTS.filter(c=>c.status==='active').length },
    { id:'at_risk',  label:'At Risk',     count:atRiskCount, urgent:true },
    { id:'paused',   label:'Paused',      count:CLIENTS.filter(c=>c.status==='paused').length },
    { id:'elite',    label:'Elite',       count:CLIENTS.filter(c=>c.tier==='Elite').length },
    { id:'injuries', label:'Injured',     count:CLIENTS.filter(c=>(c.injuries||[]).some(i=>i.severity!=='Cleared')).length },
  ];

  const visible = useMemo(() => {
    let list = [...CLIENTS];
    if (filter === 'active')   list = list.filter(c=>c.status==='active');
    if (filter === 'at_risk')  list = list.filter(c=>c.status==='at_risk');
    if (filter === 'paused')   list = list.filter(c=>c.status==='paused');
    if (filter === 'elite')    list = list.filter(c=>c.tier==='Elite');
    if (filter === 'injuries') list = list.filter(c=>(c.injuries||[]).some(i=>i.severity!=='Cleared'));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.goal.toLowerCase().includes(q) ||
        c.tags.some(t=>t.toLowerCase().includes(q))
      );
    }
    if (sortBy==='risk')      list.sort((a,b)=>a.retentionScore-b.retentionScore);
    if (sortBy==='score')     list.sort((a,b)=>b.retentionScore-a.retentionScore);
    if (sortBy==='lastVisit') list.sort((a,b)=>b.lastVisit-a.lastVisit);
    if (sortBy==='name')      list.sort((a,b)=>a.name.localeCompare(b.name));
    return list;
  }, [filter, search, sortBy]);

  function openClient(c) {
    setOpenId(c.id);
    setTimeout(() => {
      document.getElementById(`cr-${c.id}`)?.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }, 40);
  }

  return (
    <div className="tcm" style={{ background:C.bg, minHeight:'100vh', padding:'20px' }}>
      <SummaryStrip clients={CLIENTS}/>

      {/* Controls */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
            width:12, height:12, color:C.t3, pointerEvents:'none' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search by name, goal, or class…"
            style={{ width:'100%', padding:'9px 34px', borderRadius:9, background:C.surface,
              border:`1px solid ${C.border}`, color:C.t1, fontSize:11, outline:'none',
              fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .14s' }}
            onFocus={e=>e.target.style.borderColor=C.blueStr}
            onBlur={e=>e.target.style.borderColor=C.border}/>
          {search && (
            <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%',
              transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer',
              color:C.t3, display:'flex', padding:0 }}>
              <X style={{ width:12, height:12 }}/>
            </button>
          )}
        </div>

        {/* Sort */}
        <div style={{ display:'flex', gap:3, padding:'3px', background:'rgba(255,255,255,.02)',
          border:`1px solid ${C.border}`, borderRadius:8 }}>
          {[{id:'risk',label:'Priority'},{id:'score',label:'Score'},{id:'lastVisit',label:'Last Seen'},{id:'name',label:'Name'}].map(s => (
            <button key={s.id} className="tcm-btn" onClick={()=>setSortBy(s.id)} style={{
              padding:'5px 10px', borderRadius:6, fontSize:10,
              fontWeight: sortBy===s.id ? 700 : 500,
              background: sortBy===s.id ? C.blueDim : 'transparent',
              border:`1px solid ${sortBy===s.id ? C.blueStr : 'transparent'}`,
              color: sortBy===s.id ? C.blue : C.t3,
              whiteSpace:'nowrap',
            }}>{s.label}</button>
          ))}
        </div>

        <button className="tcm-btn" onClick={()=>openModal?.('addClient')} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9,
          background:C.blue, border:`1px solid ${C.blueStr}`, color:'#fff',
          fontSize:11, fontWeight:700, flexShrink:0,
        }}>
          <UserPlus style={{ width:12, height:12 }}/> Add Client
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tcm-tabs" style={{ marginBottom:0 }}>
        <span style={{ fontSize:9, fontWeight:700, color:C.t3, textTransform:'uppercase',
          letterSpacing:'.08em', padding:'9px 14px 9px 0', flexShrink:0 }}>Clients</span>
        {FILTERS.map(f => {
          const isAct = filter === f.id;
          const isUrg = f.urgent && f.count > 0;
          const tc = isAct ? (isUrg ? C.red : C.blue) : C.t3;
          return (
            <button key={f.id} className="tcm-tab" onClick={()=>setFilter(f.id)} style={{
              fontWeight: isAct ? 700 : 500, color: tc,
              borderBottomColor: isAct ? tc : 'transparent',
              display:'flex', alignItems:'center', gap:5,
            }}>
              {f.label}
              {f.count > 0 && (
                <span style={{ fontSize:8, fontWeight:800,
                  background: isAct ? (isUrg ? `${C.red}18` : C.blueDim) : 'rgba(255,255,255,.05)',
                  color: isAct ? tc : C.t3, padding:'1px 5px', borderRadius:99 }}>
                  {f.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="tcm-root" style={{ marginTop:14 }}>
        <div className="tcm-left">
          {/* Col hint */}
          {visible.length > 0 && (
            <div style={{ display:'flex', padding:'0 14px 8px', justifyContent:'space-between' }}>
              <span style={{ fontSize:9, fontWeight:700, color:C.t4, textTransform:'uppercase', letterSpacing:'.07em' }}>Client</span>
              <span style={{ fontSize:9, fontWeight:700, color:C.t4, textTransform:'uppercase', letterSpacing:'.07em' }}>8-week · Score</span>
            </div>
          )}

          {/* List */}
          <div className="tcm-feed">
            {visible.length === 0 ? (
              <div style={{ padding:'40px', textAlign:'center', borderRadius:11,
                background:C.surface, border:`1px solid ${C.border}` }}>
                <p style={{ fontSize:13, color:C.t2, fontWeight:600, margin:'0 0 4px' }}>No clients found</p>
                <p style={{ fontSize:11, color:C.t3, margin:0 }}>Try adjusting your search or filter</p>
              </div>
            ) : (
              <>
                {visible.map(c => (
                  <div key={c.id} id={`cr-${c.id}`}>
                    <ClientRow
                      client={c}
                      isOpen={openId === c.id}
                      onToggle={() => setOpenId(p => p===c.id ? null : c.id)}
                      openModal={openModal}
                    />
                  </div>
                ))}
                <p style={{ textAlign:'center', fontSize:10, color:C.t3, margin:'8px 0 0', paddingBottom:16 }}>
                  {visible.length} of {CLIENTS.length} clients
                </p>
              </>
            )}
          </div>
        </div>

        <Sidebar clients={visible} openClient={openClient}/>
      </div>
    </div>
  );
}
