import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dumbbell, Plus, X, Check, Trash2, Copy,
  MoreHorizontal, Users, Trophy, Zap, Play, Edit2,
  Search, MessageSquarePlus, BarChart2, Heart,
  TrendingUp, AlertTriangle, CheckCircle, UserPlus,
  TrendingDown, ArrowUpDown, Sparkles, Lightbulb,
  RefreshCw, ChevronRight,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';

// ─── CSS ──────────────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('tcc-css')) {
  const s = document.createElement('style');
  s.id = 'tcc-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .tcc { font-family: 'DM Sans', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    @keyframes tccFadeUp   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
    @keyframes tccSlideIn  { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:none } }
    @keyframes tccGlow     { 0%,100% { box-shadow:0 0 0 0 rgba(245,158,11,0) } 50% { box-shadow:0 0 0 5px rgba(245,158,11,.1) } }
    .tcc-fade  { animation: tccFadeUp  .28s cubic-bezier(.4,0,.2,1) both; }
    .tcc-slide { animation: tccSlideIn .22s cubic-bezier(.4,0,.2,1) both; }
    .tcc-glow  { animation: tccGlow 2.4s ease infinite; }
    .tcc-btn { font-family: 'DM Sans', sans-serif; cursor: pointer; outline: none;
               transition: all .14s cubic-bezier(.4,0,.2,1); border: none; }
    .tcc-btn:active { transform: scale(.965); }
    .tcc-card { transition: border-color .18s, transform .18s, box-shadow .18s; cursor: pointer; position: relative; }
    .tcc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.5) !important; }
    .tcc-card:hover .tcc-card-actions { opacity: 1; pointer-events: auto; }
    .tcc-card-actions { opacity: 0; pointer-events: none; transition: opacity .14s; }
    .tcc-input { width: 100%; background: rgba(255,255,255,.03); border: 1px solid #222226;
                 color: #fff; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500;
                 outline: none; border-radius: 9px; padding: 10px 14px; transition: all .14s; }
    .tcc-input:focus { border-color: rgba(77,127,255,.45); background: rgba(77,127,255,.04);
                       box-shadow: 0 0 0 3px rgba(77,127,255,.08); }
    .tcc-input::placeholder { color: #444450; }
    .tcc-select { background: rgba(255,255,255,.03); border: 1px solid #222226;
                  color: #8a8a94; font-size: 12px; font-family: 'DM Sans', sans-serif; font-weight: 600;
                  outline: none; border-radius: 9px; padding: 10px 12px; cursor: pointer; appearance: none; }
    .tcc-row-hover:hover { background: rgba(255,255,255,.025) !important; }
    .tcc-ex-row:hover .tcc-ex-del { opacity: 1 !important; }
    .tcc-grid { display: grid; grid-template-columns: minmax(0,1fr) 272px; gap: 18px; align-items: start; }
    @media (max-width: 1024px) { .tcc-grid { grid-template-columns: 1fr !important; } .tcc-sidebar { display: none !important; } }
    @media (max-width: 640px)  { .tcc-perf-grid { grid-template-columns: repeat(2,1fr) !important; } }
  `;
  document.head.appendChild(s);
}

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── 
const T = {
  bg:       '#000000',
  surface:  '#0a0a0d',
  card:     '#141416',
  card2:    '#1a1a1f',
  brd:      '#222226',
  brd2:     '#2a2a30',
  t1:       '#ffffff',
  t2:       '#8a8a94',
  t3:       '#444450',
  t4:       '#2a2a30',
  cyan:     '#4d7fff',
  cyanDim:  'rgba(77,127,255,0.10)',
  cyanBrd:  'rgba(77,127,255,0.25)',
  emerald:    '#10b981',
  emeraldDim: 'rgba(16,185,129,0.08)',
  emeraldBrd: 'rgba(16,185,129,0.20)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,0.08)',
  amberBrd: 'rgba(245,158,11,0.20)',
  red:      '#ef4444',
  redDim:   'rgba(239,68,68,0.08)',
  redBrd:   'rgba(239,68,68,0.20)',
  sky:      '#38bdf8',
  skyDim:   'rgba(56,189,248,0.08)',
  skyBrd:   'rgba(56,189,248,0.20)',
  violet:   '#a78bfa',
  violetDim:'rgba(167,139,250,0.08)',
  violetBrd:'rgba(167,139,250,0.20)',
  mono: "'JetBrains Mono', monospace",
};

const FONT = "'DM Sans', system-ui, sans-serif";

// ─── WORKOUT TYPE CONFIG ──────────────────────────────────────────────────────
const WORKOUT_TYPES = {
  hiit:       { label:'HIIT',       color:'#f87171', bg:'rgba(248,113,113,.09)', border:'rgba(248,113,113,.22)', emoji:'⚡' },
  strength:   { label:'Strength',   color:'#818cf8', bg:'rgba(129,140,248,.09)', border:'rgba(129,140,248,.22)', emoji:'🏋️' },
  yoga:       { label:'Yoga',       color:'#34d399', bg:'rgba(52,211,153,.09)',  border:'rgba(52,211,153,.22)',  emoji:'🧘' },
  cardio:     { label:'Cardio',     color:'#38bdf8', bg:'rgba(56,189,248,.09)',  border:'rgba(56,189,248,.22)',  emoji:'🏃' },
  core:       { label:'Core',       color:'#fbbf24', bg:'rgba(251,191,36,.09)',  border:'rgba(251,191,36,.22)',  emoji:'🎯' },
  beginner:   { label:'Beginner',   color:'#a78bfa', bg:'rgba(167,139,250,.09)', border:'rgba(167,139,250,.22)', emoji:'🌱' },
  stretching: { label:'Stretching', color:'#2dd4bf', bg:'rgba(45,212,191,.09)',  border:'rgba(45,212,191,.22)',  emoji:'🤸' },
};

// ─── DEFAULT WORKOUTS ─────────────────────────────────────────────────────────
const DEFAULT_WORKOUTS = [
  {
    id:'w1', name:'HIIT Blast', type:'hiit', duration:45, difficulty:'Advanced',
    warmup:[{id:'e1',name:'High knees',sets:'',reps:'2 min'},{id:'e2',name:'Jump rope',sets:'',reps:'3 min'}],
    main:[{id:'e3',name:'KB Swings',sets:'4',reps:'20'},{id:'e4',name:'Burpees',sets:'4',reps:'15'},{id:'e5',name:'Box Jumps',sets:'4',reps:'10'},{id:'e6',name:'Battle ropes',sets:'4',reps:'30s'}],
    cooldown:[{id:'e7',name:'Hip flexor stretch',sets:'',reps:'60s'},{id:'e8',name:'Quad stretch',sets:'',reps:'60s'}],
    notes:'Rest 45s between exercises, 2 min between rounds.',
  },
  {
    id:'w2', name:'Strength Builder', type:'strength', duration:60, difficulty:'Intermediate',
    warmup:[{id:'e9',name:'Mobility drills',sets:'',reps:'5 min'},{id:'e10',name:'Activation band work',sets:'2',reps:'15'}],
    main:[{id:'e11',name:'Back Squat',sets:'5',reps:'5'},{id:'e12',name:'Bench Press',sets:'4',reps:'8'},{id:'e13',name:'Barbell Row',sets:'4',reps:'8'},{id:'e14',name:'Romanian Deadlift',sets:'3',reps:'10'}],
    cooldown:[{id:'e15',name:'Foam roll quads & hamstrings',sets:'',reps:'3 min'},{id:'e16',name:'Pigeon stretch',sets:'',reps:'90s each'}],
    notes:'Rest 2–3 min between sets. Focus on form over load.',
  },
  {
    id:'w3', name:'Beginner Conditioning', type:'beginner', duration:30, difficulty:'Beginner',
    warmup:[{id:'e17',name:'March in place',sets:'',reps:'2 min'},{id:'e18',name:'Arm circles',sets:'',reps:'30s each'}],
    main:[{id:'e19',name:'Bodyweight squats',sets:'3',reps:'12'},{id:'e20',name:'Knee push-ups',sets:'3',reps:'10'},{id:'e21',name:'Reverse lunges',sets:'3',reps:'10 each'},{id:'e22',name:'Glute bridges',sets:'3',reps:'15'}],
    cooldown:[{id:'e23',name:'Cat-cow stretch',sets:'',reps:'1 min'},{id:'e24',name:"Child's pose",sets:'',reps:'60s'}],
    notes:'Perfect for new members. Demonstrate each movement before starting.',
  },
  {
    id:'w4', name:'Core Finisher', type:'core', duration:15, difficulty:'Intermediate',
    warmup:[{id:'e25',name:'Cat-cow',sets:'',reps:'1 min'}],
    main:[{id:'e26',name:'Plank hold',sets:'3',reps:'45s'},{id:'e27',name:'Dead bugs',sets:'3',reps:'10 each'},{id:'e28',name:'Russian twists',sets:'3',reps:'20'},{id:'e29',name:'Hollow holds',sets:'3',reps:'30s'}],
    cooldown:[{id:'e30',name:'Supine twist',sets:'',reps:'45s each'}],
    notes:'Add at the end of any session. 20s rest between exercises.',
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2,9); }

function getHealth(completionRate, assignedCount, daysSinceUpdate) {
  if (assignedCount === 0) return { label:'Not Assigned', color:T.t3,      bg:'rgba(100,116,139,.05)', bdr:'rgba(100,116,139,.12)' };
  if (completionRate >= 70 && daysSinceUpdate < 30) return { label:'Performing',    color:T.emerald, bg:T.emeraldDim, bdr:T.emeraldBrd };
  if (completionRate >= 40 || daysSinceUpdate < 60) return { label:'Needs Review',  color:T.amber,   bg:T.amberDim,   bdr:T.amberBrd   };
  return { label:'Low Engagement', color:T.red, bg:T.redDim, bdr:T.redBrd };
}

function completionColor(r) {
  if (r >= 70) return T.emerald;
  if (r >= 40) return T.amber;
  return T.red;
}

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Pill({ children, color = T.t3, bg, border, style = {} }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      fontSize:10, fontWeight:700, color,
      background: bg || `${color}12`,
      border:`1px solid ${border || `${color}28`}`,
      borderRadius:6, padding:'2px 8px',
      letterSpacing:'.04em', textTransform:'uppercase',
      whiteSpace:'nowrap', lineHeight:'16px', fontFamily:FONT,
      ...style,
    }}>{children}</span>
  );
}

function StatCell({ label, value, color = T.t2, size = 20, dim = false }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{
        fontFamily:T.mono, fontSize:size, fontWeight:700,
        color: dim ? T.t3 : color, lineHeight:1, letterSpacing:'-.03em',
      }}>{value}</div>
      <div style={{ fontSize:8, color:T.t3, textTransform:'uppercase', letterSpacing:'.07em', marginTop:4, fontWeight:700 }}>{label}</div>
    </div>
  );
}

function HealthBar({ segments, height = 4 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div style={{ display:'flex', gap:2, height, borderRadius:99, overflow:'hidden' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{
          flex: seg.value / total, background: seg.color, borderRadius:99,
          minWidth: seg.value > 0 ? 3 : 0, transition:'flex .4s cubic-bezier(.4,0,.2,1)',
        }} />
      ))}
    </div>
  );
}

// ─── DOT MENU ─────────────────────────────────────────────────────────────────
function DotMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <button className="tcc-btn" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(255,255,255,.04)', border:`1px solid ${T.brd}`,
          borderRadius:8, color:T.t3,
        }}
        onMouseEnter={e => e.currentTarget.style.color = T.t2}
        onMouseLeave={e => e.currentTarget.style.color = T.t3}>
        <MoreHorizontal style={{ width:13, height:13 }} />
      </button>
      {open && (
        <div style={{
          position:'absolute', top:34, right:0, zIndex:9999,
          background:T.card2, border:`1px solid ${T.brd2}`,
          borderRadius:12, boxShadow:'0 16px 48px rgba(0,0,0,.7)',
          minWidth:148, overflow:'hidden',
        }}>
          {items.map((item, i) => {
            const Ic = item.icon;
            return (
              <button key={i} className="tcc-btn" onClick={e => { e.stopPropagation(); setOpen(false); item.action(); }}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:9,
                  padding:'10px 14px', fontSize:12, fontWeight:600,
                  color: item.danger ? T.red : T.t1, background:'transparent', textAlign:'left',
                  fontFamily:FONT,
                }}
                onMouseEnter={e => e.currentTarget.style.background = item.danger ? T.redDim : 'rgba(255,255,255,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Ic style={{ width:12, height:12 }} /> {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── PERFORMANCE OVERVIEW ─────────────────────────────────────────────────────
function PerformanceOverview({ workouts, workoutStats }) {
  const total = workouts.length;
  const assigned = workouts.filter(w => (workoutStats[w.id]?.assignedCount || 0) > 0).length;
  const unassigned = total - assigned;
  const avgCompletion = assigned > 0
    ? Math.round(workouts.filter(w => workoutStats[w.id]?.assignedCount > 0)
        .reduce((s, w) => s + (workoutStats[w.id]?.completionRate || 0), 0) / assigned)
    : 0;
  const needsAttention = workouts.filter(w => {
    const s = workoutStats[w.id];
    return s && ((s.assignedCount > 0 && s.completionRate < 40) || (s.assignedCount > 0 && s.daysSinceActivity > 14));
  }).length;
  const typePerf = {};
  workouts.forEach(w => {
    const s = workoutStats[w.id];
    if (!s || s.assignedCount === 0) return;
    if (!typePerf[w.type]) typePerf[w.type] = { total:0, sum:0 };
    typePerf[w.type].total++;
    typePerf[w.type].sum += s.completionRate;
  });
  const bestType = Object.entries(typePerf).sort((a,b) => (b[1].sum/b[1].total)-(a[1].sum/a[1].total))[0];
  const cColor = completionColor(avgCompletion);

  const cardBase = {
    padding:'20px 22px', borderRadius:14,
    background:T.card, border:`1px solid ${T.brd}`,
    position:'relative', overflow:'hidden',
  };

  return (
    <div className="tcc-fade" style={{ marginBottom:20 }}>
      <div className="tcc-perf-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>

        {/* Library */}
        <div style={cardBase}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at top right, rgba(77,127,255,0.06), transparent 65%)`, pointerEvents:'none' }} />
          <div style={{ fontSize:10, fontWeight:700, color:T.t3, letterSpacing:'.07em', textTransform:'uppercase', marginBottom:14 }}>Library</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:14 }}>
            <span style={{ fontFamily:T.mono, fontSize:42, fontWeight:700, color:T.t1, lineHeight:1, letterSpacing:'-.05em' }}>{total}</span>
            <span style={{ fontSize:12, color:T.t3 }}>workouts</span>
          </div>
          <HealthBar height={4} segments={[
            { value:assigned, color:T.emerald },
            { value:unassigned, color:T.t4 },
          ]} />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:10, color:T.emerald, fontWeight:600 }}>{assigned} assigned</span>
            <span style={{ fontSize:10, color:T.t3 }}>{unassigned} unused</span>
          </div>
        </div>

        {/* Avg Completion */}
        <div style={cardBase}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background: assigned > 0 ? cColor : T.t3, flexShrink:0 }} />
            <span style={{ fontSize:10, fontWeight:700, color:T.t3, letterSpacing:'.07em', textTransform:'uppercase' }}>Avg Completion</span>
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:3, marginBottom:6 }}>
            <span style={{ fontFamily:T.mono, fontSize:42, fontWeight:700, color: assigned > 0 ? cColor : T.t3, lineHeight:1, letterSpacing:'-.05em' }}>
              {assigned > 0 ? avgCompletion : '—'}
            </span>
            {assigned > 0 && <span style={{ fontSize:18, fontWeight:700, color:cColor }}>%</span>}
          </div>
          <div style={{ fontSize:11, color:T.t3, fontWeight:500 }}>
            {avgCompletion >= 70 ? 'Strong engagement' : avgCompletion >= 40 ? 'Room to improve' : assigned > 0 ? 'Needs attention' : 'No data yet'}
          </div>
        </div>

        {/* Needs Attention */}
        <div style={{ ...cardBase, background: needsAttention > 0 ? `rgba(245,158,11,0.06)` : T.card, border:`1px solid ${needsAttention > 0 ? T.amberBrd : T.brd}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
            <div className={needsAttention > 0 ? 'tcc-glow' : ''} style={{ width:6, height:6, borderRadius:'50%', background: needsAttention > 0 ? T.amber : T.t3, flexShrink:0 }} />
            <span style={{ fontSize:10, fontWeight:700, color: needsAttention > 0 ? T.amber : T.t3, letterSpacing:'.07em', textTransform:'uppercase' }}>Need Review</span>
          </div>
          <div style={{ fontFamily:T.mono, fontSize:42, fontWeight:700, color: needsAttention > 0 ? T.amber : T.t3, lineHeight:1, letterSpacing:'-.05em', marginBottom:6 }}>
            {needsAttention}
          </div>
          <div style={{ fontSize:11, color: needsAttention > 0 ? T.amber : T.t3, fontWeight: needsAttention > 0 ? 600 : 500 }}>
            {needsAttention > 0 ? 'Low completion or inactive' : 'All workouts healthy'}
          </div>
        </div>

        {/* Best Type */}
        <div style={cardBase}>
          <div style={{ fontSize:10, fontWeight:700, color:T.t3, letterSpacing:'.07em', textTransform:'uppercase', marginBottom:14 }}>Best Performing</div>
          {bestType ? (() => {
            const tc = WORKOUT_TYPES[bestType[0]] || WORKOUT_TYPES.strength;
            const avg = Math.round(bestType[1].sum / bestType[1].total);
            return (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:tc.bg, border:`1px solid ${tc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{tc.emoji}</div>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:tc.color, letterSpacing:'-.02em' }}>{tc.label}</div>
                    <div style={{ fontSize:10, color:T.t3 }}>workout type</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:T.t3 }}>
                  <span style={{ fontFamily:T.mono, fontWeight:700, color:T.emerald, fontSize:13 }}>{avg}%</span>&nbsp;avg completion
                </div>
              </div>
            );
          })() : (
            <div style={{ fontSize:12, color:T.t3, paddingTop:4 }}>Assign workouts to see data</div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── NEEDS ATTENTION ──────────────────────────────────────────────────────────
function NeedsAttention({ workouts, workoutStats, onAssign, onEdit, openModal }) {
  const alerts = useMemo(() => {
    const items = [];
    workouts.forEach(wo => {
      const s = workoutStats[wo.id];
      if (!s) return;
      if (s.assignedCount === 0)
        items.push({ type:'unassigned',   workout:wo, reason:'Not assigned to any clients',        actionLabel:'Assign',        actionFn:() => onAssign(wo),       color:T.t3,    icon:Users });
      else if (s.completionRate < 40)
        items.push({ type:'low',          workout:wo, reason:`Only ${s.completionRate}% completion`, actionLabel:'Follow up',     actionFn:() => openModal('post'),  color:T.red,   icon:TrendingDown });
      else if (s.daysSinceActivity > 14)
        items.push({ type:'inactive',     workout:wo, reason:`No activity in ${s.daysSinceActivity}d`,actionLabel:'Send reminder', actionFn:() => openModal('post'),  color:T.amber, icon:AlertTriangle });
      else if ((s.daysSinceUpdate ?? 999) > 60)
        items.push({ type:'stale',        workout:wo, reason:'Not updated in 60+ days',             actionLabel:'Review & refresh',actionFn:() => onEdit(wo),        color:T.amber, icon:RefreshCw });
    });
    return items.slice(0, 5);
  }, [workouts, workoutStats]);

  if (alerts.length === 0) return null;

  return (
    <div className="tcc-fade" style={{ marginBottom:20, animationDelay:'.05s' }}>
      <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${T.amberBrd}`, background:`rgba(245,158,11,0.04)` }}>
        <div style={{ padding:'13px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${T.amberBrd}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="tcc-glow" style={{ width:7, height:7, borderRadius:'50%', background:T.amber }} />
            <span style={{ fontSize:12, fontWeight:700, color:T.t1, letterSpacing:'-.01em' }}>Needs Attention</span>
            <Pill color={T.amber}>{alerts.length} workout{alerts.length > 1 ? 's' : ''}</Pill>
          </div>
          <span style={{ fontSize:10, color:T.t3, fontWeight:600 }}>Sorted by impact</span>
        </div>
        <div style={{ padding:'6px 8px' }}>
          {alerts.map((alert, i) => {
            const tc = WORKOUT_TYPES[alert.workout.type] || WORKOUT_TYPES.strength;
            const Ic = alert.icon;
            return (
              <div key={i} className="tcc-row-hover" style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 12px', borderRadius:10, transition:'background .12s', background:'transparent' }}>
                <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background:tc.bg, border:`1px solid ${tc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{tc.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.t1, marginBottom:2, letterSpacing:'-.01em' }}>{alert.workout.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:alert.color, fontWeight:600 }}>
                    <Ic style={{ width:10, height:10 }} /> {alert.reason}
                  </div>
                </div>
                <button className="tcc-btn" onClick={e => { e.stopPropagation(); alert.actionFn?.(); }}
                  style={{ padding:'6px 14px', borderRadius:8, background:`${alert.color}10`, border:`1px solid ${alert.color}25`, color:alert.color, fontSize:11, fontWeight:700, flexShrink:0 }}
                  onMouseEnter={e => e.currentTarget.style.background = `${alert.color}1e`}
                  onMouseLeave={e => e.currentTarget.style.background = `${alert.color}10`}>
                  {alert.actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── WORKOUT CARD ─────────────────────────────────────────────────────────────
function WorkoutCard({ workout, stats, isSelected, onSelect, onEdit, onDelete, onDuplicate, onAssign }) {
  const tc = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;
  const health = getHealth(stats.completionRate, stats.assignedCount, stats.daysSinceUpdate ?? 999);
  return (
    <div className="tcc-card" onClick={() => onSelect(workout)}
      style={{ borderRadius:14, overflow:'hidden', background:T.card, border:`1px solid ${isSelected ? `${tc.color}35` : T.brd}` }}>
      {/* Color strip */}
      <div style={{ height:3, background:`linear-gradient(90deg, ${tc.color}, ${tc.color}55)` }} />
      <div style={{ padding:'16px 18px 18px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:tc.bg, border:`1px solid ${tc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:T.t1, letterSpacing:'-.02em', lineHeight:1.25, marginBottom:5 }}>{workout.name}</div>
              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                <Pill color={tc.color} bg={tc.bg} border={tc.border}>{tc.label}</Pill>
                {workout.duration && <span style={{ fontSize:10, color:T.t3, fontWeight:600 }}>⏱ {workout.duration}min</span>}
              </div>
            </div>
          </div>
          <div className="tcc-card-actions">
            <DotMenu items={[
              { icon:Edit2, label:'Edit', action:() => onEdit(workout) },
              { icon:Copy, label:'Duplicate', action:() => onDuplicate(workout) },
              { icon:Trash2, label:'Delete', action:() => onDelete(workout.id), danger:true },
            ]} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', borderRadius:10, overflow:'hidden', border:`1px solid ${T.brd}`, marginBottom:12 }}>
          <div style={{ padding:'10px 8px', textAlign:'center', background:'rgba(255,255,255,.02)' }}>
            <StatCell label="Clients" value={stats.assignedCount} color={T.cyan} />
          </div>
          <div style={{ padding:'10px 8px', textAlign:'center', background:'rgba(255,255,255,.02)', borderLeft:`1px solid ${T.brd}`, borderRight:`1px solid ${T.brd}` }}>
            <StatCell label="Done" value={stats.assignedCount === 0 ? '—' : `${stats.completionRate}%`} color={completionColor(stats.completionRate)} dim={stats.assignedCount === 0} />
          </div>
          <div style={{ padding:'10px 8px', textAlign:'center', background:'rgba(255,255,255,.02)' }}>
            <StatCell label="Updated" value={stats.daysSinceUpdate === null ? '—' : stats.daysSinceUpdate === 0 ? 'Now' : `${stats.daysSinceUpdate}d`} color={T.violet} />
          </div>
        </div>

        {/* Health + difficulty */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <Pill color={health.color} bg={health.bg} border={health.bdr}>{health.label}</Pill>
          {workout.difficulty && <span style={{ fontSize:10, color:T.t3, fontWeight:600 }}>{workout.difficulty}</span>}
        </div>

        {/* Exercise preview */}
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:14 }}>
          {workout.main.slice(0,2).map((ex, i) => (
            <div key={i} style={{ fontSize:11, color:T.t3, display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:3, height:3, borderRadius:'50%', background:tc.color, flexShrink:0 }} />
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}>{ex.name}</span>
              {(ex.sets || ex.reps) && <span style={{ fontFamily:T.mono, fontSize:9, color:T.t4, flexShrink:0, fontWeight:600 }}>{ex.sets ? `${ex.sets}×${ex.reps}` : ex.reps}</span>}
            </div>
          ))}
          {workout.main.length > 2 && <span style={{ fontSize:10, color:T.t4, paddingLeft:11, fontWeight:600 }}>+{workout.main.length - 2} more exercises</span>}
        </div>

        {/* Assign CTA */}
        <button className="tcc-btn" onClick={e => { e.stopPropagation(); onAssign(workout); }}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px', borderRadius:10, background:`${tc.color}0c`, border:`1px solid ${tc.color}22`, color:tc.color, fontSize:12, fontWeight:700 }}
          onMouseEnter={e => { e.currentTarget.style.background = `${tc.color}1a`; e.currentTarget.style.borderColor = `${tc.color}38`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${tc.color}0c`; e.currentTarget.style.borderColor = `${tc.color}22`; }}>
          <Play style={{ width:12, height:12 }} /> Assign Workout
        </button>
      </div>
    </div>
  );
}

// ─── WORKOUT DETAIL PANEL ─────────────────────────────────────────────────────
function WorkoutDetailPanel({ workout, stats, allMemberships, checkIns, now, avatarMap, onEdit, onAssign, onClose, openModal }) {
  const tc = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;
  const health = getHealth(stats.completionRate, stats.assignedCount, stats.daysSinceUpdate ?? 999);
  const [tab, setTab] = useState('clients');

  const assignedClients = useMemo(() => {
    return stats.assignedMemberIds.map(uid => {
      const m = allMemberships.find(x => x.user_id === uid) || { user_id:uid, user_name:'Client' };
      const lastCI = checkIns.filter(c => c.user_id === uid).sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      const daysAgo = lastCI ? Math.floor((now - new Date(lastCI.check_in_date)) / 864e5) : null;
      const engStatus = daysAgo === null ? 'never' : daysAgo > 14 ? 'inactive' : daysAgo > 7 ? 'low' : 'active';
      const engColor = { active:T.emerald, low:T.amber, inactive:T.red, never:T.t3 }[engStatus];
      const engLabel = { active:'Active', low:'Low activity', inactive:'Inactive', never:'Never visited' }[engStatus];
      return { ...m, daysAgo, engStatus, engColor, engLabel };
    });
  }, [stats.assignedMemberIds, allMemberships, checkIns, now]);

  const suggestions = useMemo(() => allMemberships.filter(m => {
    if (stats.assignedMemberIds.includes(m.user_id)) return false;
    const r30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30*864e5).length;
    return r30 >= 2;
  }).slice(0,4), [allMemberships, stats.assignedMemberIds, checkIns, now]);

  const TABS = [
    { id:'clients',   label:`Clients (${stats.assignedCount})`,  icon:Users },
    { id:'exercises', label:`Exercises (${workout.main.length})`, icon:Dumbbell },
    { id:'suggest',   label:`Suggestions (${suggestions.length})`,icon:Lightbulb },
  ];

  return (
    <div className="tcc-slide" style={{ borderRadius:14, overflow:'hidden', background:T.card, border:`1px solid ${T.brd}` }}>
      {/* Header */}
      <div style={{ padding:'18px 22px 16px', borderBottom:`1px solid ${T.brd}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:46, height:46, borderRadius:14, background:tc.bg, border:`1px solid ${tc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:T.t1, letterSpacing:'-.03em', marginBottom:6 }}>{workout.name}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                <Pill color={tc.color} bg={tc.bg} border={tc.border}>{tc.label}</Pill>
                <Pill color={health.color} bg={health.bg} border={health.bdr}>{health.label}</Pill>
                {workout.difficulty && <span style={{ fontSize:11, color:T.t3, fontWeight:600 }}>{workout.difficulty}</span>}
                {workout.duration && <span style={{ fontSize:11, color:T.t3, fontWeight:600 }}>⏱ {workout.duration}min</span>}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <button className="tcc-btn" onClick={() => onEdit(workout)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:9, background:`${tc.color}0c`, border:`1px solid ${tc.color}25`, color:tc.color, fontSize:12, fontWeight:700 }}
              onMouseEnter={e => e.currentTarget.style.background = `${tc.color}1e`}
              onMouseLeave={e => e.currentTarget.style.background = `${tc.color}0c`}>
              <Edit2 style={{ width:12, height:12 }} /> Edit
            </button>
            <button className="tcc-btn" onClick={() => onAssign(workout)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, background:tc.color, border:'none', color:'#fff', fontSize:12, fontWeight:700, boxShadow:`0 2px 14px ${tc.color}35` }}>
              <UserPlus style={{ width:12, height:12 }} /> Assign
            </button>
            <button className="tcc-btn" onClick={onClose}
              style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,.04)', border:`1px solid ${T.brd}`, color:T.t3 }}
              onMouseEnter={e => e.currentTarget.style.color = T.t1}
              onMouseLeave={e => e.currentTarget.style.color = T.t3}>
              <X style={{ width:13, height:13 }} />
            </button>
          </div>
        </div>
        {/* Quick stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[
            { label:'Clients',       value:stats.assignedCount,  color:T.cyan },
            { label:'Completion',    value:stats.assignedCount===0 ? '—' : `${stats.completionRate}%`, color:stats.assignedCount>0 ? completionColor(stats.completionRate) : T.t3 },
            { label:'Last activity', value:stats.daysSinceActivity>=999 ? 'Never' : `${stats.daysSinceActivity}d ago`, color:stats.daysSinceActivity>14 ? T.red : T.emerald },
            { label:'Updated',       value:stats.daysSinceUpdate===null ? '—' : stats.daysSinceUpdate===0 ? 'Today' : `${stats.daysSinceUpdate}d ago`, color:T.violet },
          ].map((s,i) => (
            <div key={i} style={{ padding:'12px 14px', borderRadius:10, textAlign:'center', background:'rgba(255,255,255,.025)', border:`1px solid ${T.brd}` }}>
              <div style={{ fontFamily:T.mono, fontSize:19, fontWeight:700, color:s.color, lineHeight:1, letterSpacing:'-.03em' }}>{s.value}</div>
              <div style={{ fontSize:8, color:T.t3, textTransform:'uppercase', letterSpacing:'.07em', marginTop:5, fontWeight:700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${T.brd}`, padding:'0 8px' }}>
        {TABS.map(t => {
          const Ic = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} className="tcc-btn" onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'12px 8px', background:'none', borderBottom:`2px solid ${active ? tc.color : 'transparent'}`, color: active ? tc.color : T.t3, fontSize:11, fontWeight: active ? 700 : 600, display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginBottom:-1, letterSpacing:'-.01em' }}>
              <Ic style={{ width:11, height:11 }} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding:'18px 22px' }}>
        {tab === 'clients' && (assignedClients.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <Users style={{ width:24, height:24, color:T.t3, margin:'0 auto 12px' }} />
            <p style={{ fontSize:13, color:T.t2, fontWeight:700, margin:'0 0 14px', letterSpacing:'-.01em' }}>No clients assigned yet</p>
            <button className="tcc-btn" onClick={() => onAssign(workout)}
              style={{ fontSize:12, fontWeight:700, color:tc.color, background:`${tc.color}0c`, border:`1px solid ${tc.color}22`, borderRadius:9, padding:'9px 20px' }}>
              Assign to clients
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {assignedClients.map((m, i) => (
              <div key={m.user_id||i} className="tcc-row-hover"
                style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:11, background:'rgba(255,255,255,.02)', border:`1px solid ${T.brd}`, transition:'background .12s' }}>
                <div style={{ width:36, height:36, borderRadius:11, flexShrink:0, overflow:'hidden', background:`${m.engColor}0d`, border:`1px solid ${m.engColor}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:m.engColor }}>
                  {avatarMap?.[m.user_id]
                    ? <img src={avatarMap[m.user_id]} alt={m.user_name} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.currentTarget.style.display='none'} />
                    : (m.user_name||'?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-.01em' }}>{m.user_name||'Client'}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:3 }}>
                    <Pill color={m.engColor} style={{ fontSize:8, padding:'1px 6px' }}>{m.engLabel}</Pill>
                    <span style={{ fontSize:10, color:T.t3 }}>{m.daysAgo===null ? 'Never visited' : m.daysAgo===0 ? 'Today' : `${m.daysAgo}d ago`}</span>
                  </div>
                </div>
                {m.engStatus !== 'active' && (
                  <button className="tcc-btn" onClick={() => openModal('post', { memberId:m.user_id })}
                    style={{ fontSize:10, fontWeight:700, color:T.cyan, background:T.cyanDim, border:`1px solid ${T.cyanBrd}`, borderRadius:7, padding:'5px 11px', flexShrink:0 }}>
                    Follow up
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}

        {tab === 'exercises' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr 1fr', gap:12 }}>
            {[
              { title:'Warmup',       exercises:workout.warmup,   accent:T.sky,    emoji:'🔥' },
              { title:'Main Workout', exercises:workout.main,     accent:tc.color, emoji:tc.emoji },
              { title:'Cooldown',     exercises:workout.cooldown, accent:T.emerald,emoji:'❄️' },
            ].map((sec, si) => (
              <div key={si} style={{ borderRadius:12, padding:'14px', background:`${sec.accent}04`, border:`1px solid ${sec.accent}14` }}>
                <div style={{ fontSize:10, fontWeight:700, color:sec.accent, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>{sec.emoji} {sec.title}</div>
                {sec.exercises.length === 0
                  ? <p style={{ fontSize:11, color:T.t3 }}>—</p>
                  : sec.exercises.map((ex, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                      <div style={{ width:4, height:4, borderRadius:'50%', background:sec.accent, flexShrink:0 }} />
                      <span style={{ fontSize:11, color:T.t2, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:500 }}>{ex.name}</span>
                      {(ex.sets||ex.reps) && <span style={{ fontFamily:T.mono, fontSize:9, color:T.t3, flexShrink:0 }}>{ex.sets ? `${ex.sets}×${ex.reps}` : ex.reps}</span>}
                    </div>
                  ))
                }
              </div>
            ))}
            {workout.notes && (
              <div style={{ gridColumn:'1/-1', padding:'11px 14px', borderRadius:10, background:'rgba(255,255,255,.02)', border:`1px solid ${T.brd}`, fontSize:12, color:T.t3, lineHeight:1.6, fontWeight:500 }}>
                📝 {workout.notes}
              </div>
            )}
          </div>
        )}

        {tab === 'suggest' && (suggestions.length === 0 ? (
          <div style={{ textAlign:'center', padding:'28px 0' }}>
            <CheckCircle style={{ width:22, height:22, color:T.emerald, margin:'0 auto 10px' }} />
            <p style={{ fontSize:12, fontWeight:700, color:T.emerald, margin:0 }}>All active clients are assigned</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:11, color:T.t3, marginBottom:12, fontWeight:500 }}>Active clients not yet assigned this workout.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {suggestions.map((m, i) => {
                const r30 = checkIns.filter(c => c.user_id===m.user_id && (now - new Date(c.check_in_date)) < 30*864e5).length;
                return (
                  <div key={m.user_id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:11, background:'rgba(255,255,255,.02)', border:`1px solid ${T.brd}` }}>
                    <div style={{ width:36, height:36, borderRadius:11, flexShrink:0, overflow:'hidden', background:T.emeraldDim, border:`1px solid ${T.emeraldBrd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:T.emerald }}>
                      {avatarMap?.[m.user_id]
                        ? <img src={avatarMap[m.user_id]} alt={m.user_name} loading="lazy" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.currentTarget.style.display='none'} />
                        : (m.user_name||'?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.t1, letterSpacing:'-.01em' }}>{m.user_name||'Client'}</div>
                      <div style={{ fontSize:10, color:T.t3, fontWeight:600 }}>{r30} visits this month</div>
                    </div>
                    <button className="tcc-btn" onClick={() => onAssign(workout)}
                      style={{ fontSize:10, fontWeight:700, color:tc.color, background:`${tc.color}0c`, border:`1px solid ${tc.color}22`, borderRadius:7, padding:'5px 12px', flexShrink:0 }}>
                      Assign
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ))}
      </div>
    </div>
  );
}

// ─── INSIGHTS PANEL ───────────────────────────────────────────────────────────
function InsightsPanel({ workouts, workoutStats }) {
  const unassigned = workouts.filter(w => (workoutStats[w.id]?.assignedCount||0)===0);
  const lowEngagement = workouts.filter(w => { const s=workoutStats[w.id]; return s && s.assignedCount>0 && s.completionRate<40; });
  const typePerf = {};
  workouts.forEach(w => {
    const s = workoutStats[w.id];
    if (!s || s.assignedCount===0) return;
    if (!typePerf[w.type]) typePerf[w.type] = { total:0, sum:0 };
    typePerf[w.type].total++;
    typePerf[w.type].sum += s.completionRate;
  });
  const bestEntry = Object.entries(typePerf).sort((a,b) => (b[1].sum/b[1].total)-(a[1].sum/a[1].total))[0];
  const insights = [
    bestEntry && { icon:TrendingUp, color:T.emerald, text:`${WORKOUT_TYPES[bestEntry[0]]?.label||bestEntry[0]} workouts have the highest completion rate (${Math.round(bestEntry[1].sum/bestEntry[1].total)}%)` },
    unassigned.length>0 && { icon:AlertTriangle, color:T.amber, text:`${unassigned.length} workout${unassigned.length>1?'s are':' is'} never used — assign or archive them` },
    lowEngagement.length>0 && { icon:TrendingDown, color:T.red, text:`${lowEngagement.length} workout${lowEngagement.length>1?'s have':' has'} completion below 40%` },
    { icon:Lightbulb, color:T.cyan, text:'Clients on structured programmes retain 2.4× longer on average' },
    workouts.length>=4 && { icon:Sparkles, color:T.violet, text:'Offer at least one workout per training style for variety' },
  ].filter(Boolean).slice(0,4);

  return (
    <div style={{ borderRadius:14, overflow:'hidden', background:T.card, border:`1px solid ${T.brd}` }}>
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.brd}`, display:'flex', alignItems:'center', gap:8 }}>
        <Sparkles style={{ width:13, height:13, color:T.violet }} />
        <span style={{ fontSize:12, fontWeight:700, color:T.t1, letterSpacing:'-.01em' }}>Insights</span>
      </div>
      <div style={{ padding:'8px 10px' }}>
        {insights.map((ins, i) => {
          const Ic = ins.icon;
          return (
            <div key={i} className="tcc-row-hover" style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 9px', borderRadius:9, transition:'background .12s', background:'transparent' }}>
              <div style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:`${ins.color}0e`, border:`1px solid ${ins.color}20` }}>
                <Ic style={{ width:11, height:11, color:ins.color }} />
              </div>
              <span style={{ fontSize:12, color:T.t2, lineHeight:1.55, flex:1, fontWeight:500 }}>{ins.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── LIBRARY BREAKDOWN ────────────────────────────────────────────────────────
function LibraryBreakdown({ workouts }) {
  const counts = {};
  workouts.forEach(w => { counts[w.type] = (counts[w.type]||0)+1; });
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  return (
    <div style={{ borderRadius:14, background:T.card, border:`1px solid ${T.brd}`, padding:'16px 18px' }}>
      <div style={{ fontSize:12, fontWeight:700, color:T.t1, marginBottom:16, letterSpacing:'-.01em' }}>Library Breakdown</div>
      {sorted.map(([type, count], i, arr) => {
        const tc = WORKOUT_TYPES[type] || WORKOUT_TYPES.strength;
        const pct = Math.round((count / workouts.length)*100);
        return (
          <div key={type} style={{ marginBottom: i < arr.length-1 ? 12 : 0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:13 }}>{tc.emoji}</span>
                <span style={{ fontSize:12, color:T.t2, fontWeight:600 }}>{tc.label}</span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                <span style={{ fontFamily:T.mono, fontSize:15, fontWeight:700, color:tc.color }}>{count}</span>
                <span style={{ fontFamily:T.mono, fontSize:10, color:T.t3 }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height:3, borderRadius:99, background:'rgba(255,255,255,.04)', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:99, background:tc.color, width:`${pct}%`, transition:'width .5s cubic-bezier(.4,0,.2,1)' }} />
            </div>
          </div>
        );
      })}
      <div style={{ borderTop:`1px solid ${T.brd}`, marginTop:14, paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:T.t2, fontWeight:600 }}>Total workouts</span>
        <span style={{ fontFamily:T.mono, fontSize:17, fontWeight:700, color:T.t1 }}>{workouts.length}</span>
      </div>
    </div>
  );
}

// ─── EXERCISE ROW ─────────────────────────────────────────────────────────────
function ExerciseRow({ ex, onChange, onDelete }) {
  const inputS = { padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.03)', border:`1px solid ${T.brd}`, color:T.t1, fontSize:12, outline:'none', fontFamily:FONT, fontWeight:500 };
  return (
    <div className="tcc-ex-row" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:9, background:'rgba(255,255,255,.025)', border:`1px solid ${T.brd}`, marginBottom:5 }}>
      <Dumbbell style={{ width:11, height:11, color:T.t3, flexShrink:0 }} />
      <input value={ex.name} onChange={e => onChange({ ...ex, name:e.target.value })} placeholder="Exercise name" style={{ ...inputS, flex:1 }} />
      <input value={ex.sets} onChange={e => onChange({ ...ex, sets:e.target.value })} placeholder="Sets" style={{ ...inputS, width:50 }} />
      <span style={{ fontSize:10, color:T.t3, fontWeight:700 }}>×</span>
      <input value={ex.reps} onChange={e => onChange({ ...ex, reps:e.target.value })} placeholder="Reps / time" style={{ ...inputS, width:88 }} />
      <button className="tcc-btn tcc-ex-del" onClick={onDelete} style={{ background:'none', color:T.red, padding:0, display:'flex', opacity:0, transition:'opacity .12s' }}>
        <X style={{ width:12, height:12 }} />
      </button>
    </div>
  );
}

// ─── SECTION BLOCK ────────────────────────────────────────────────────────────
function SectionBlock({ title, accent, exercises, onChange, icon: Icon }) {
  const addEx = () => onChange([...exercises, { id:uid(), name:'', sets:'', reps:'' }]);
  const updateEx = (idx, ex) => { const u=[...exercises]; u[idx]=ex; onChange(u); };
  const deleteEx = (idx) => onChange(exercises.filter((_,i) => i!==idx));
  return (
    <div style={{ borderRadius:12, padding:'14px', marginBottom:10, background:`${accent}04`, border:`1px solid ${accent}14` }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:11 }}>
        <div style={{ width:27, height:27, borderRadius:8, background:`${accent}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon style={{ width:12, height:12, color:accent }} />
        </div>
        <span style={{ fontSize:12, fontWeight:700, color:T.t1, letterSpacing:'-.01em' }}>{title}</span>
        <span style={{ fontSize:10, color:T.t3, fontWeight:600 }}>{exercises.length} exercise{exercises.length!==1?'s':''}</span>
      </div>
      {exercises.map((ex, i) => <ExerciseRow key={ex.id||i} ex={ex} onChange={u => updateEx(i,u)} onDelete={() => deleteEx(i)} />)}
      <button className="tcc-btn" onClick={addEx}
        style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:accent, background:`${accent}09`, border:`1px solid ${accent}20`, borderRadius:8, padding:'7px 13px', marginTop:4 }}
        onMouseEnter={e => e.currentTarget.style.background = `${accent}15`}
        onMouseLeave={e => e.currentTarget.style.background = `${accent}09`}>
        <Plus style={{ width:10, height:10 }} /> Add exercise
      </button>
    </div>
  );
}

// ─── WORKOUT EDITOR ───────────────────────────────────────────────────────────
function WorkoutEditor({ workout, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => workout
    ? { ...workout, warmup:[...workout.warmup], main:[...workout.main], cooldown:[...workout.cooldown] }
    : { id:uid(), name:'', type:'strength', duration:45, difficulty:'Intermediate', warmup:[], main:[], cooldown:[], notes:'' }
  );
  const tc = WORKOUT_TYPES[draft.type] || WORKOUT_TYPES.strength;
  const canSave = draft.name.trim().length > 0;

  return (
    <div style={{ borderRadius:14, overflow:'hidden', background:T.card, border:`1px solid ${T.brd}` }}>
      {/* Editor header */}
      <div style={{ padding:'18px 22px 16px', borderBottom:`1px solid ${T.brd}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:tc.bg, border:`1px solid ${tc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:T.t1, letterSpacing:'-.02em' }}>{workout ? 'Edit Workout' : 'New Workout'}</div>
              <div style={{ fontSize:11, color:T.t3, marginTop:2, fontWeight:500 }}>Fill in the details below</div>
            </div>
          </div>
          <button className="tcc-btn" onClick={onCancel}
            style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,.04)', border:`1px solid ${T.brd}`, color:T.t3 }}
            onMouseEnter={e => e.currentTarget.style.color = T.t1}
            onMouseLeave={e => e.currentTarget.style.color = T.t3}>
            <X style={{ width:13, height:13 }} />
          </button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 140px', gap:10, marginBottom:14 }}>
          <input className="tcc-input" value={draft.name} onChange={e => setDraft(p => ({ ...p, name:e.target.value }))} placeholder="Workout name" />
          <input className="tcc-input" value={draft.duration} onChange={e => setDraft(p => ({ ...p, duration:e.target.value }))} placeholder="Minutes" type="number" />
          <select className="tcc-select" value={draft.difficulty} onChange={e => setDraft(p => ({ ...p, difficulty:e.target.value }))}>
            {['Beginner','Intermediate','Advanced','Elite'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* Type selector */}
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {Object.entries(WORKOUT_TYPES).map(([key, t]) => (
            <button key={key} className="tcc-btn" onClick={() => setDraft(p => ({ ...p, type:key }))}
              style={{ padding:'5px 13px', borderRadius:8, fontSize:11, fontWeight:700, background: draft.type===key ? t.bg : 'transparent', border:`1px solid ${draft.type===key ? t.border : T.brd}`, color: draft.type===key ? t.color : T.t3 }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'18px 22px' }}>
        <SectionBlock title="Warmup"       accent={T.sky}    icon={Play}    exercises={draft.warmup}   onChange={v => setDraft(p => ({ ...p, warmup:v }))} />
        <SectionBlock title="Main Workout" accent={tc.color} icon={Dumbbell} exercises={draft.main}    onChange={v => setDraft(p => ({ ...p, main:v }))} />
        <SectionBlock title="Cooldown"     accent={T.emerald}icon={Heart}   exercises={draft.cooldown} onChange={v => setDraft(p => ({ ...p, cooldown:v }))} />

        <div style={{ marginTop:6 }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:7 }}>Coaching Notes</div>
          <textarea className="tcc-input" value={draft.notes} onChange={e => setDraft(p => ({ ...p, notes:e.target.value }))}
            placeholder="Tips, modifications, cues, equipment needed…"
            style={{ minHeight:66, resize:'vertical', lineHeight:1.6 }} />
        </div>

        <div style={{ display:'flex', gap:10, marginTop:18 }}>
          <button className="tcc-btn" onClick={onCancel}
            style={{ flex:1, padding:'11px', borderRadius:10, background:'rgba(255,255,255,.04)', border:`1px solid ${T.brd}`, color:T.t3, fontSize:12, fontWeight:700 }}
            onMouseEnter={e => e.currentTarget.style.color = T.t1}
            onMouseLeave={e => e.currentTarget.style.color = T.t3}>
            Cancel
          </button>
          <button className="tcc-btn" onClick={() => canSave && onSave(draft)} disabled={!canSave}
            style={{ flex:2, padding:'11px', borderRadius:10, background: canSave ? tc.color : 'rgba(255,255,255,.04)', border:'none', color: canSave ? '#fff' : T.t3, fontSize:12, fontWeight:700, boxShadow: canSave ? `0 2px 14px ${tc.color}30` : 'none', cursor: canSave ? 'pointer' : 'not-allowed' }}>
            {workout ? '✓ Save Changes' : '✓ Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ASSIGN MODAL ─────────────────────────────────────────────────────────────
function AssignModal({ workout, allMemberships, myClasses, avatarMap, onClose, openModal }) {
  const [tab, setTab] = useState('member');
  const [search, setSearch] = useState('');
  const [assigned, setAssigned] = useState([]);
  const tc = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;

  const filtered = useMemo(() => {
    if (tab==='member') return allMemberships.filter(m => !search || (m.user_name||'').toLowerCase().includes(search.toLowerCase())).slice(0,12);
    if (tab==='class')  return myClasses.filter(c => !search || (c.name||'').toLowerCase().includes(search.toLowerCase()));
    return [];
  }, [tab, search, allMemberships, myClasses]);

  const toggle = id => setAssigned(p => p.includes(id) ? p.filter(x => x!==id) : [...p, id]);

  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.75)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={onClose}>
      <div style={{ width:'100%', maxWidth:490, maxHeight:'82vh', overflowY:'auto', borderRadius:18, background:T.card, border:`1px solid ${T.brd2}`, boxShadow:'0 32px 80px rgba(0,0,0,.75)' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ padding:'20px 24px 16px', borderBottom:`1px solid ${T.brd}`, position:'sticky', top:0, background:T.card, zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:T.t1, letterSpacing:'-.02em' }}>Assign Workout</div>
              <div style={{ fontSize:11, color:T.t3, marginTop:3, fontWeight:500 }}>{workout.name} · {workout.main.length} exercises</div>
            </div>
            <button className="tcc-btn" onClick={onClose} style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,.04)', border:`1px solid ${T.brd}`, color:T.t3 }}>
              <X style={{ width:13, height:13 }} />
            </button>
          </div>
          <div style={{ display:'flex', gap:7 }}>
            {[
              { id:'member',    icon:Users,    label:'Member',    color:T.cyan },
              { id:'class',     icon:Dumbbell, label:'Class',     color:T.violet },
              { id:'challenge', icon:Trophy,   label:'Challenge', color:T.amber },
            ].map(t => {
              const Ic = t.icon;
              const active = tab===t.id;
              return (
                <button key={t.id} className="tcc-btn" onClick={() => setTab(t.id)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'9px 8px', borderRadius:10, border:`1px solid ${active ? `${t.color}30` : T.brd}`, background: active ? `${t.color}0e` : 'transparent', color: active ? t.color : T.t3, fontSize:11, fontWeight: active ? 700 : 600 }}>
                  <Ic style={{ width:11, height:11 }} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding:'18px 24px' }}>
          {(tab==='member'||tab==='class') && (
            <>
              <div style={{ position:'relative', marginBottom:14 }}>
                <Search style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:13, height:13, color:T.t3 }} />
                <input className="tcc-input" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab==='class' ? 'classes' : 'members'}…`} style={{ paddingLeft:36 }} />
              </div>
              {filtered.map((item, i) => {
                const id = item.user_id || item.id;
                const name = item.user_name || item.name;
                const isChosen = assigned.includes(id);
                return (
                  <div key={id||i} onClick={() => toggle(id)}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:11, marginBottom:6, background: isChosen ? `${T.cyan}08` : 'rgba(255,255,255,.025)', border:`1px solid ${isChosen ? T.cyanBrd : T.brd}`, cursor:'pointer', transition:'all .12s' }}>
                    <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, border:`1.5px solid ${isChosen ? T.cyan : 'rgba(255,255,255,.15)'}`, background: isChosen ? T.cyan : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .14s' }}>
                      {isChosen && <Check style={{ width:11, height:11, color:'#fff' }} />}
                    </div>
                    {tab==='member' && <Avatar name={name} size={30} src={avatarMap?.[id]} />}
                    {tab==='class' && <div style={{ width:30, height:30, borderRadius:9, background:T.violetDim, display:'flex', alignItems:'center', justifyContent:'center' }}><Dumbbell style={{ width:13, height:13, color:T.violet }} /></div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-.01em' }}>{name}</div>
                      {tab==='member' && item.membership_type && <div style={{ fontSize:10, color:T.t3, fontWeight:600 }}>{item.membership_type}</div>}
                      {tab==='class' && item.schedule && <div style={{ fontSize:10, color:T.t3, fontWeight:600 }}>{item.schedule}</div>}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab==='challenge' && (
            <div style={{ textAlign:'center', padding:'32px 0' }}>
              <div style={{ width:56, height:56, borderRadius:16, background:T.amberDim, border:`1px solid ${T.amberBrd}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <Trophy style={{ width:26, height:26, color:T.amber }} />
              </div>
              <p style={{ fontSize:15, fontWeight:800, color:T.t1, margin:'0 0 8px', letterSpacing:'-.02em' }}>Create a Challenge</p>
              <p style={{ fontSize:12, color:T.t3, margin:'0 0 20px', fontWeight:500 }}>Include this workout as the programme.</p>
              <button className="tcc-btn" onClick={() => { openModal('challenge', { workoutId:workout.id, workoutName:workout.name }); onClose(); }}
                style={{ padding:'11px 26px', borderRadius:11, background:T.amber, border:'none', color:'#000', fontSize:12, fontWeight:800, boxShadow:`0 2px 14px ${T.amber}35` }}>
                Create Challenge
              </button>
            </div>
          )}

          {(tab==='member'||tab==='class') && assigned.length>0 && (
            <button className="tcc-btn" onClick={() => { openModal('assignWorkout', { workoutId:workout.id, workoutName:workout.name, assignTo:tab, ids:assigned }); onClose(); }}
              style={{ width:'100%', marginTop:16, padding:'13px', borderRadius:12, background:tc.color, border:'none', color:'#fff', fontSize:13, fontWeight:800, boxShadow:`0 2px 16px ${tc.color}35`, letterSpacing:'-.01em' }}>
              Assign to {assigned.length} {tab==='class' ? (assigned.length===1?'Class':'Classes') : (assigned.length===1?'Member':'Members')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ onCreateNew }) {
  const templates = [
    { emoji:'⚡', name:'HIIT Blast',        type:'hiit',     desc:'High-intensity interval training' },
    { emoji:'🏋️', name:'Strength Builder',  type:'strength', desc:'Progressive overload fundamentals' },
    { emoji:'🌱', name:'Beginner Flow',     type:'beginner', desc:'Perfect for new members' },
  ];
  return (
    <div className="tcc-fade" style={{ padding:'60px 32px', textAlign:'center', borderRadius:16, background:T.card, border:`1px solid ${T.brd}` }}>
      <div style={{ width:60, height:60, borderRadius:18, margin:'0 auto 24px', background:T.violetDim, border:`1px solid ${T.violetBrd}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Dumbbell style={{ width:26, height:26, color:T.violet }} />
      </div>
      <h3 style={{ fontSize:22, fontWeight:800, color:T.t1, margin:'0 0 8px', letterSpacing:'-.03em' }}>Build Your Workout Library</h3>
      <p style={{ fontSize:13, color:T.t3, margin:'0 0 36px', maxWidth:420, marginLeft:'auto', marginRight:'auto', lineHeight:1.65, fontWeight:500 }}>
        Create workouts, assign them to clients, and track completion rates. Your content is a performance asset.
      </p>
      <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', maxWidth:560, margin:'0 auto 28px' }}>
        {templates.map((t, i) => {
          const tc = WORKOUT_TYPES[t.type];
          return (
            <div key={i} className="tcc-fade"
              style={{ flex:'1 1 160px', maxWidth:190, padding:'22px 16px', borderRadius:14, textAlign:'center', background:'rgba(255,255,255,.025)', border:`1px solid ${T.brd}`, animationDelay:`${i*.08}s`, cursor:'pointer', transition:'border-color .15s, background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=`${tc.color}35`; e.currentTarget.style.background=`${tc.color}07`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=T.brd; e.currentTarget.style.background='rgba(255,255,255,.025)'; }}>
              <div style={{ width:40, height:40, borderRadius:12, margin:'0 auto 12px', background:tc.bg, border:`1px solid ${tc.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{t.emoji}</div>
              <div style={{ fontSize:13, fontWeight:700, color:T.t1, marginBottom:5, letterSpacing:'-.01em' }}>{t.name}</div>
              <div style={{ fontSize:11, color:T.t3, lineHeight:1.55, fontWeight:500 }}>{t.desc}</div>
            </div>
          );
        })}
      </div>
      <button className="tcc-btn" onClick={onCreateNew}
        style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 26px', borderRadius:12, background:T.cyan, color:'#fff', fontSize:13, fontWeight:800, boxShadow:`0 2px 18px ${T.cyan}30`, letterSpacing:'-.01em' }}>
        <Plus style={{ width:15, height:15 }} /> Create Your First Workout
      </button>
    </div>
  );
}

// ─── SORT OPTIONS ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id:'name',             label:'Name A–Z' },
  { id:'most_assigned',    label:'Most Assigned' },
  { id:'least_engaged',    label:'Least Engaged' },
  { id:'recently_updated', label:'Recently Updated' },
  { id:'not_assigned',     label:'Not Assigned' },
];

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function TabCoachContent({
  events, polls, posts, classes: gymClasses = [], recaps = [], shoutouts = [],
  checkIns, ci30, avatarMap, allMemberships = [],
  openModal, now,
  onDeletePost = () => {},
  onDeleteEvent = () => {},
  onDeleteClass = () => {},
  onDeletePoll = () => {},
  onDeleteRecap = () => {},
  onDeleteShoutout = () => {},
}) {
  const [workouts, setWorkouts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('coachWorkoutLibrary') || 'null') || DEFAULT_WORKOUTS; }
    catch { return DEFAULT_WORKOUTS; }
  });
  const [editorOpen,  setEditorOpen]  = useState(false);
  const [editingWO,   setEditingWO]   = useState(null);
  const [selectedWO,  setSelectedWO]  = useState(null);
  const [assignWO,    setAssignWO]    = useState(null);
  const [libSearch,   setLibSearch]   = useState('');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [sortBy,      setSortBy]      = useState('name');
  const [showSort,    setShowSort]    = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    if (!showSort) return;
    const h = e => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showSort]);

  const saveWorkouts = u => {
    setWorkouts(u);
    try { localStorage.setItem('coachWorkoutLibrary', JSON.stringify(u)); } catch {}
  };

  const handleSave = draft => {
    const withDate = { ...draft, updated_at:new Date().toISOString() };
    const exists = workouts.find(w => w.id === draft.id);
    saveWorkouts(exists ? workouts.map(w => w.id===draft.id ? withDate : w) : [withDate, ...workouts]);
    setEditorOpen(false);
    setEditingWO(null);
    if (selectedWO?.id === draft.id) setSelectedWO(withDate);
  };

  const handleDelete    = id  => { saveWorkouts(workouts.filter(w => w.id!==id)); if (selectedWO?.id===id) setSelectedWO(null); };
  const handleDuplicate = wo  => saveWorkouts([{ ...wo, id:uid(), name:`${wo.name} (copy)`, updated_at:new Date().toISOString() }, ...workouts]);
  const handleEdit      = wo  => { setEditingWO(wo); setEditorOpen(true); };
  const handleNew       = ()  => { setEditingWO(null); setEditorOpen(true); };

  const workoutStats = useMemo(() => {
    const stats = {};
    workouts.forEach(wo => {
      let assignedIds = [];
      try { const asgn = JSON.parse(localStorage.getItem('coachWorkoutAssignments')||'{}'); assignedIds = asgn[wo.id]||[]; } catch {}
      const completedCount = assignedIds.filter(uid => checkIns.some(c => c.user_id===uid && (now - new Date(c.check_in_date)) < 30*864e5)).length;
      const completionRate = assignedIds.length > 0 ? Math.round((completedCount/assignedIds.length)*100) : 0;
      const lastActivities = assignedIds.map(uid => {
        const last = checkIns.filter(c => c.user_id===uid).sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        return last ? (now - new Date(last.check_in_date)) / 864e5 : 999;
      });
      stats[wo.id] = {
        assignedCount:    assignedIds.length,
        completionRate,
        daysSinceActivity: assignedIds.length===0 ? 999 : Math.floor(Math.min(...lastActivities)),
        daysSinceUpdate:   wo.updated_at ? Math.floor((now - new Date(wo.updated_at)) / 864e5) : null,
        assignedMemberIds: assignedIds,
      };
    });
    return stats;
  }, [workouts, checkIns, now]);

  const filteredWorkouts = useMemo(() => {
    let list = workouts.filter(w =>
      (typeFilter==='all' || w.type===typeFilter) &&
      (!libSearch || (w.name||'').toLowerCase().includes(libSearch.toLowerCase()))
    );
    const s = id => workoutStats[id] || { assignedCount:0, completionRate:0, daysSinceUpdate:999 };
    if (sortBy==='most_assigned')    list = [...list].sort((a,b) => s(b.id).assignedCount   - s(a.id).assignedCount);
    if (sortBy==='least_engaged')    list = [...list].sort((a,b) => s(a.id).completionRate  - s(b.id).completionRate);
    if (sortBy==='recently_updated') list = [...list].sort((a,b) => (s(a.id).daysSinceUpdate??999) - (s(b.id).daysSinceUpdate??999));
    if (sortBy==='not_assigned')     list = list.filter(w => s(w.id).assignedCount===0);
    if (sortBy==='name')             list = [...list].sort((a,b) => (a.name||'').localeCompare(b.name||''));
    return list;
  }, [workouts, typeFilter, libSearch, sortBy, workoutStats]);

  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.event_date) >= now), [events, now]);
  const engagementScore = useMemo(() =>
    posts.reduce((s,p) => s + (p.likes?.length||0) + (p.comments?.length||0), 0) +
    polls.reduce((s,p) => s + (p.voters?.length||0), 0),
  [posts, polls]);

  const currentSort = SORT_OPTIONS.find(s => s.id===sortBy);
  const hasWorkouts = workouts.length > 0;

  return (
    <div className="tcc" style={{ background:T.bg, minHeight:'100vh', padding:'28px 24px' }}>
      {assignWO && (
        <AssignModal workout={assignWO} allMemberships={allMemberships} myClasses={gymClasses} avatarMap={avatarMap} openModal={openModal} onClose={() => setAssignWO(null)} />
      )}

      {/* ── Page header ── */}
      <div className="tcc-fade" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:800, color:T.t1, margin:0, letterSpacing:'-.04em' }}>Workout Performance</h1>
          <p style={{ fontSize:12, color:T.t3, margin:'5px 0 0', fontWeight:600 }}>
            {workouts.length} workout{workouts.length!==1?'s':''} in your library
          </p>
        </div>
        <button className="tcc-btn" onClick={handleNew}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:11, background:T.cyan, color:'#fff', fontSize:13, fontWeight:800, boxShadow:`0 2px 14px ${T.cyan}28`, letterSpacing:'-.01em' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 22px ${T.cyan}45`}
          onMouseLeave={e => e.currentTarget.style.boxShadow = `0 2px 14px ${T.cyan}28`}>
          <Plus style={{ width:15, height:15 }} /> New Workout
        </button>
      </div>

      {!hasWorkouts && !editorOpen ? (
        <EmptyState onCreateNew={handleNew} />
      ) : (
        <>
          {/* ── Editor ── */}
          {editorOpen && (
            <div style={{ marginBottom:20 }}>
              <WorkoutEditor workout={editingWO} onSave={handleSave} onCancel={() => { setEditorOpen(false); setEditingWO(null); }} />
            </div>
          )}

          {!editorOpen && (
            <>
              <PerformanceOverview workouts={workouts} workoutStats={workoutStats} />
              <NeedsAttention workouts={workouts} workoutStats={workoutStats} onAssign={setAssignWO} onEdit={handleEdit} openModal={openModal} />

              {/* ── Controls ── */}
              <div className="tcc-fade" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap', animationDelay:'.08s' }}>
                {/* Search */}
                <div style={{ position:'relative', flex:1, minWidth:220 }}>
                  <Search style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:T.t3, pointerEvents:'none' }} />
                  <input className="tcc-input" value={libSearch} onChange={e => setLibSearch(e.target.value)} placeholder="Search workouts…" style={{ paddingLeft:40 }} />
                  {libSearch && (
                    <button onClick={() => setLibSearch('')} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:T.t3, display:'flex', padding:0 }}>
                      <X style={{ width:14, height:14 }} />
                    </button>
                  )}
                </div>
                {/* Sort */}
                <div ref={sortRef} style={{ position:'relative', flexShrink:0 }}>
                  <button className="tcc-btn" onClick={() => setShowSort(o => !o)}
                    style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 16px', borderRadius:10, background:'rgba(255,255,255,.04)', border:`1px solid ${showSort ? T.cyanBrd : T.brd}`, color: showSort ? T.cyan : T.t2, fontSize:12, fontWeight:700 }}>
                    <ArrowUpDown style={{ width:12, height:12 }} /> {currentSort?.label||'Sort'}
                  </button>
                  {showSort && (
                    <div style={{ position:'absolute', top:'calc(100% + 5px)', right:0, zIndex:999, background:T.card2, border:`1px solid ${T.brd2}`, borderRadius:12, boxShadow:'0 16px 48px rgba(0,0,0,.7)', minWidth:190, overflow:'hidden' }}>
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.id} className="tcc-btn" onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                          style={{ width:'100%', padding:'10px 16px', fontSize:12, fontWeight: sortBy===opt.id ? 700 : 600, color: sortBy===opt.id ? T.cyan : T.t1, background: sortBy===opt.id ? T.cyanDim : 'transparent', textAlign:'left', display:'flex', alignItems:'center', gap:8, fontFamily:FONT }}
                          onMouseEnter={e => { if (sortBy!==opt.id) e.currentTarget.style.background='rgba(255,255,255,.04)'; }}
                          onMouseLeave={e => { if (sortBy!==opt.id) e.currentTarget.style.background='transparent'; }}>
                          {sortBy===opt.id && <Check style={{ width:10, height:10 }} />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Type filter chips ── */}
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:18 }}>
                {[
                  { id:'all', label:'All workouts', color:T.cyan },
                  ...Object.entries(WORKOUT_TYPES).map(([k,v]) => ({ id:k, label:`${v.emoji} ${v.label}`, color:v.color })),
                ].map(t => (
                  <button key={t.id} className="tcc-btn" onClick={() => setTypeFilter(t.id)}
                    style={{ padding:'5px 13px', borderRadius:8, fontSize:11, fontWeight:700, background: typeFilter===t.id ? `${t.color}0e` : 'transparent', border:`1px solid ${typeFilter===t.id ? `${t.color}28` : T.brd}`, color: typeFilter===t.id ? t.color : T.t3 }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── Main two-column grid ── */}
              <div className="tcc-grid">
                {/* Left: cards + detail */}
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {filteredWorkouts.length === 0 ? (
                    <div style={{ padding:44, textAlign:'center', borderRadius:14, background:T.card, border:`1px solid ${T.brd}` }}>
                      <Search style={{ width:22, height:22, color:T.t3, margin:'0 auto 12px' }} />
                      <p style={{ fontSize:14, color:T.t2, fontWeight:700, margin:'0 0 5px', letterSpacing:'-.01em' }}>
                        {sortBy==='not_assigned' ? 'All workouts are assigned' : 'No workouts found'}
                      </p>
                      <p style={{ fontSize:12, color:T.t3, margin:'0 0 16px', fontWeight:500 }}>Try adjusting your search or filter</p>
                      <button className="tcc-btn" onClick={handleNew}
                        style={{ fontSize:12, fontWeight:700, color:T.cyan, background:T.cyanDim, border:`1px solid ${T.cyanBrd}`, borderRadius:9, padding:'8px 18px' }}>
                        Create a workout
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:12 }}>
                      {filteredWorkouts.map((wo, i) => (
                        <div key={wo.id||i} className="tcc-fade" style={{ animationDelay:`${Math.min(i*.04,.28)}s` }}>
                          <WorkoutCard
                            workout={wo}
                            stats={workoutStats[wo.id] || { assignedCount:0, completionRate:0, daysSinceActivity:999, daysSinceUpdate:null }}
                            isSelected={selectedWO?.id === wo.id}
                            onSelect={w => setSelectedWO(selectedWO?.id===w.id ? null : w)}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onAssign={setAssignWO}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedWO && (
                    <WorkoutDetailPanel
                      workout={selectedWO}
                      stats={workoutStats[selectedWO.id] || { assignedCount:0, completionRate:0, daysSinceActivity:999, daysSinceUpdate:null, assignedMemberIds:[] }}
                      allMemberships={allMemberships}
                      checkIns={checkIns}
                      now={now}
                      avatarMap={avatarMap}
                      onEdit={handleEdit}
                      onAssign={setAssignWO}
                      onClose={() => setSelectedWO(null)}
                      openModal={openModal}
                    />
                  )}
                </div>

                {/* Right: sidebar */}
                <div className="tcc-sidebar" style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <InsightsPanel workouts={workouts} workoutStats={workoutStats} />
                  <LibraryBreakdown workouts={workouts} />

                  {/* Quick actions */}
                  <div style={{ borderRadius:14, background:T.card, border:`1px solid ${T.brd}`, padding:'16px 18px' }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.t1, marginBottom:14, letterSpacing:'-.01em' }}>Quick Actions</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {[
                        { icon:Dumbbell,         label:'New Workout', sub:`${workouts.length} in library`,    color:T.violet, action:handleNew },
                        { icon:MessageSquarePlus, label:'Post Update', sub:'Engage members',                  color:T.cyan,   action:() => openModal('post') },
                        { icon:BarChart2,         label:'New Poll',    sub:`${polls.length} active`,           color:T.emerald,action:() => openModal('poll') },
                        { icon:Trophy,            label:'Challenge',   sub:'Drive consistency',               color:T.amber,  action:() => openModal('challenge') },
                      ].map(({ icon:Ic, label, sub, color, action }, i) => (
                        <button key={i} className="tcc-btn" onClick={action}
                          style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 13px', borderRadius:10, width:'100%', background:'rgba(255,255,255,.025)', border:`1px solid ${T.brd}`, textAlign:'left', transition:'all .14s' }}
                          onMouseEnter={e => { e.currentTarget.style.background=`${color}07`; e.currentTarget.style.borderColor=`${color}25`; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.025)'; e.currentTarget.style.borderColor=T.brd; }}>
                          <div style={{ width:30, height:30, borderRadius:9, flexShrink:0, background:`${color}0e`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Ic style={{ width:13, height:13, color }} />
                          </div>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.t1, letterSpacing:'-.01em' }}>{label}</div>
                            <div style={{ fontSize:10, color:T.t3, fontWeight:600, marginTop:1 }}>{sub}</div>
                          </div>
                          <ChevronRight style={{ width:12, height:12, color:T.t3, marginLeft:'auto' }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content engagement */}
                  <div style={{ borderRadius:14, background:T.card, border:`1px solid ${T.brd}`, padding:'16px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:T.t1, letterSpacing:'-.01em' }}>Content Engagement</span>
                      <Zap style={{ width:13, height:13, color:T.violet }} />
                    </div>
                    <div style={{ fontFamily:T.mono, fontSize:32, fontWeight:700, color:T.t1, letterSpacing:'-.05em', marginBottom:12 }}>{engagementScore}</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {[
                        { label:'Likes',    val:posts.reduce((s,p) => s+(p.likes?.length||0),0),   color:'#f87171' },
                        { label:'Comments', val:posts.reduce((s,p) => s+(p.comments?.length||0),0), color:T.cyan },
                        { label:'Votes',    val:polls.reduce((s,p) => s+(p.voters?.length||0),0),   color:T.violet },
                      ].map((s,i) => (
                        <span key={i} style={{ fontFamily:T.mono, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:6, background:'rgba(255,255,255,.03)', border:`1px solid ${T.brd}`, color:s.color }}>
                          {s.val} {s.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming events */}
                  {upcomingEvents.length > 0 && (
                    <div style={{ borderRadius:14, background:T.card, border:`1px solid ${T.brd}`, padding:'16px 18px' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:T.t1, letterSpacing:'-.01em' }}>Upcoming Events</span>
                        <button className="tcc-btn" onClick={() => openModal('event')}
                          style={{ fontSize:9, fontWeight:700, color:T.emerald, background:T.emeraldDim, border:`1px solid ${T.emeraldBrd}`, borderRadius:6, padding:'3px 9px' }}>
                          + New
                        </button>
                      </div>
                      {upcomingEvents.slice(0,3).map((ev, i) => {
                        const d = new Date(ev.event_date);
                        const diff = Math.floor((d - now) / 86400000);
                        return (
                          <div key={ev.id||i} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom: i < Math.min(upcomingEvents.length,3)-1 ? `1px solid ${T.brd}` : 'none' }}>
                            <div style={{ flexShrink:0, borderRadius:10, padding:'5px 9px', textAlign:'center', background:T.emeraldDim, border:`1px solid ${T.emeraldBrd}`, minWidth:36 }}>
                              <div style={{ fontFamily:T.mono, fontSize:15, fontWeight:700, color:T.emerald, lineHeight:1 }}>{format(d,'d')}</div>
                              <div style={{ fontSize:8, color:T.t3, textTransform:'uppercase', fontWeight:700, marginTop:1 }}>{format(d,'MMM')}</div>
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-.01em' }}>{ev.title}</div>
                              <div style={{ fontSize:10, color: diff<=2 ? T.red : T.t3, fontWeight:600, marginTop:2 }}>
                                {diff===0 ? 'Today' : diff===1 ? 'Tomorrow' : `${diff}d away`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}