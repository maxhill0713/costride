javascript
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dumbbell, Plus, X, Check, Trash2, Copy, MoreHorizontal,
  Users, Trophy, Zap, Play, Edit2, Search, MessageSquarePlus,
  BarChart2, Heart, TrendingUp, AlertTriangle, CheckCircle,
  UserPlus, TrendingDown, ArrowUpDown, Sparkles, Lightbulb,
  RefreshCw, ChevronDown, ChevronRight,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';

// ── DESIGN TOKENS — exact match to ContentPage ──────────────────────────────
const C = {
  bg:         '#000000',
  sidebar:    '#0f0f12',
  card:       '#141416',
  card2:      '#1a1a1f',
  brd:        '#222226',
  t1:         '#ffffff',
  t2:         '#8a8a94',
  t3:         '#444450',
  cyan:       '#4d7fff',
  cyanDim:    'rgba(77,127,255,0.12)',
  cyanBrd:    'rgba(77,127,255,0.28)',
  red:        '#ff4d6d',
  redDim:     'rgba(255,77,109,0.15)',
  amber:      '#f59e0b',
  amberDim:   'rgba(245,158,11,0.10)',
  amberBrd:   'rgba(245,158,11,0.25)',
  emerald:    '#22c55e',
  emeraldDim: 'rgba(34,197,94,0.12)',
  emeraldBrd: 'rgba(34,197,94,0.28)',
  violet:     '#a78bfa',
  violetDim:  'rgba(167,139,250,0.12)',
  violetBrd:  'rgba(167,139,250,0.28)',
  sky:        '#38bdf8',
  skyDim:     'rgba(56,189,248,0.12)',
  skyBrd:     'rgba(56,189,248,0.28)',
  mono:       "'JetBrains Mono', monospace",
};
const FONT    = "'DM Sans', 'Segoe UI', system-ui, sans-serif";
const GRAD_BTN = { background: '#2563eb', border: 'none', color: '#fff' };

function useIsMobile(bp = 768) {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < bp : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [bp]);
  return m;
}

// ── WORKOUT TYPE CONFIG ─────────────────────────────────────────────────────
const WORKOUT_TYPES = {
  hiit:       { label: 'HIIT',       color: '#f87171', bg: 'rgba(248,113,113,.09)', border: 'rgba(248,113,113,.22)', emoji: '⚡' },
  strength:   { label: 'Strength',   color: '#818cf8', bg: 'rgba(129,140,248,.09)', border: 'rgba(129,140,248,.22)', emoji: '🏋️' },
  yoga:       { label: 'Yoga',       color: '#34d399', bg: 'rgba(52,211,153,.09)',  border: 'rgba(52,211,153,.22)',  emoji: '🧘' },
  cardio:     { label: 'Cardio',     color: '#38bdf8', bg: 'rgba(56,189,248,.09)',  border: 'rgba(56,189,248,.22)',  emoji: '🏃' },
  core:       { label: 'Core',       color: '#fbbf24', bg: 'rgba(251,191,36,.09)',  border: 'rgba(251,191,36,.22)',  emoji: '🎯' },
  beginner:   { label: 'Beginner',   color: '#a78bfa', bg: 'rgba(167,139,250,.09)', border: 'rgba(167,139,250,.22)', emoji: '🌱' },
  stretching: { label: 'Stretching', color: '#2dd4bf', bg: 'rgba(45,212,191,.09)',  border: 'rgba(45,212,191,.22)',  emoji: '🤸' },
};

const DEFAULT_WORKOUTS = [
  {
    id: 'w1', name: 'HIIT Blast', type: 'hiit', duration: 45, difficulty: 'Advanced',
    warmup: [{ id: 'e1', name: 'High knees', sets: '', reps: '2 min' }, { id: 'e2', name: 'Jump rope', sets: '', reps: '3 min' }],
    main: [{ id: 'e3', name: 'KB Swings', sets: '4', reps: '20' }, { id: 'e4', name: 'Burpees', sets: '4', reps: '15' }, { id: 'e5', name: 'Box Jumps', sets: '4', reps: '10' }, { id: 'e6', name: 'Battle ropes', sets: '4', reps: '30s' }],
    cooldown: [{ id: 'e7', name: 'Hip flexor stretch', sets: '', reps: '60s' }, { id: 'e8', name: 'Quad stretch', sets: '', reps: '60s' }],
    notes: 'Rest 45s between exercises, 2 min between rounds.',
  },
  {
    id: 'w2', name: 'Strength Builder', type: 'strength', duration: 60, difficulty: 'Intermediate',
    warmup: [{ id: 'e9', name: 'Mobility drills', sets: '', reps: '5 min' }, { id: 'e10', name: 'Activation band work', sets: '2', reps: '15' }],
    main: [{ id: 'e11', name: 'Back Squat', sets: '5', reps: '5' }, { id: 'e12', name: 'Bench Press', sets: '4', reps: '8' }, { id: 'e13', name: 'Barbell Row', sets: '4', reps: '8' }, { id: 'e14', name: 'Romanian Deadlift', sets: '3', reps: '10' }],
    cooldown: [{ id: 'e15', name: 'Foam roll quads & hamstrings', sets: '', reps: '3 min' }, { id: 'e16', name: 'Pigeon stretch', sets: '', reps: '90s each' }],
    notes: 'Rest 2–3 min between sets. Focus on form over load.',
  },
  {
    id: 'w3', name: 'Beginner Conditioning', type: 'beginner', duration: 30, difficulty: 'Beginner',
    warmup: [{ id: 'e17', name: 'March in place', sets: '', reps: '2 min' }, { id: 'e18', name: 'Arm circles', sets: '', reps: '30s each' }],
    main: [{ id: 'e19', name: 'Bodyweight squats', sets: '3', reps: '12' }, { id: 'e20', name: 'Knee push-ups', sets: '3', reps: '10' }, { id: 'e21', name: 'Reverse lunges', sets: '3', reps: '10 each' }, { id: 'e22', name: 'Glute bridges', sets: '3', reps: '15' }],
    cooldown: [{ id: 'e23', name: 'Cat-cow stretch', sets: '', reps: '1 min' }, { id: 'e24', name: "Child's pose", sets: '', reps: '60s' }],
    notes: 'Perfect for new members. Demonstrate each movement before starting.',
  },
  {
    id: 'w4', name: 'Core Finisher', type: 'core', duration: 15, difficulty: 'Intermediate',
    warmup: [{ id: 'e25', name: 'Cat-cow', sets: '', reps: '1 min' }],
    main: [{ id: 'e26', name: 'Plank hold', sets: '3', reps: '45s' }, { id: 'e27', name: 'Dead bugs', sets: '3', reps: '10 each' }, { id: 'e28', name: 'Russian twists', sets: '3', reps: '20' }, { id: 'e29', name: 'Hollow holds', sets: '3', reps: '30s' }],
    cooldown: [{ id: 'e30', name: 'Supine twist', sets: '', reps: '45s each' }],
    notes: 'Add at the end of any session. 20s rest between exercises.',
  },
];

const SORT_OPTIONS = [
  { value: 'name',             label: 'Name A–Z' },
  { value: 'most_assigned',    label: 'Most Assigned' },
  { value: 'least_engaged',    label: 'Least Engaged' },
  { value: 'recently_updated', label: 'Recently Updated' },
  { value: 'not_assigned',     label: 'Not Assigned' },
];

// ── HELPERS ─────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function completionColor(r) {
  if (r >= 70) return C.emerald;
  if (r >= 40) return C.amber;
  return C.red;
}

function getHealth(cr, ac, dsu) {
  if (ac === 0) return { label: 'Not Assigned', color: C.t3, bg: 'rgba(100,116,139,.05)', bdr: 'rgba(100,116,139,.12)' };
  if (cr >= 70 && dsu < 30) return { label: 'Performing',    color: C.emerald, bg: C.emeraldDim, bdr: C.emeraldBrd };
  if (cr >= 40 || dsu < 60) return { label: 'Needs Review',  color: C.amber,   bg: C.amberDim,   bdr: C.amberBrd   };
  return { label: 'Low Engagement', color: C.red, bg: C.redDim, bdr: 'rgba(255,77,109,0.28)' };
}

// ── PRIMITIVES ───────────────────────────────────────────────────────────────
function Pill({ children, color = C.t3, bg, border, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, color,
      background: bg || `${color}12`,
      border: `1px solid ${border || `${color}28`}`,
      borderRadius: 5, padding: '2px 7px',
      letterSpacing: '.04em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', lineHeight: '16px', fontFamily: FONT,
      ...style,
    }}>{children}</span>
  );
}

function HealthBar({ segments, height = 4 }) {
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 2, height, borderRadius: 99, overflow: 'hidden' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{ flex: seg.value / total, background: seg.color, borderRadius: 99, minWidth: seg.value > 0 ? 3 : 0 }} />
      ))}
    </div>
  );
}

// SortDropdown — exact match to ContentPage's SortDropdown
function SortDropdown({ value, onChange, options: optionsProp }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const options = optionsProp || SORT_OPTIONS;
  const current = options.find(o => o.value === value) || options[0];
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${open ? C.cyanBrd : C.brd}`, borderRadius: 7, color: open ? C.t1 : C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', outline: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanBrd; e.currentTarget.style.color = C.t1; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; } }}>
        <span>{current.label}</span>
        <ChevronDown size={12} style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 5px)', right: 0, zIndex: 200, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 9, overflow: 'hidden', minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.55)' }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 13px', background: opt.value === value ? C.cyanDim : 'transparent', border: 'none', color: opt.value === value ? C.cyan : C.t2, fontSize: 12, fontWeight: opt.value === value ? 700 : 500, cursor: 'pointer', fontFamily: FONT, transition: 'background .12s, color .12s', outline: 'none' }}
              onMouseEnter={e => { if (opt.value !== value) { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = C.t1; } }}
              onMouseLeave={e => { if (opt.value !== value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.t2; } }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── DOT MENU ─────────────────────────────────────────────────────────────────
function DotMenu({ items, visible = true }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0, opacity: visible ? 1 : 0, transition: 'opacity .14s', pointerEvents: visible ? 'auto' : 'none' }}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.04)', border: `1px solid ${C.brd}`, borderRadius: 8, color: C.t3, cursor: 'pointer', outline: 'none', transition: 'all .14s' }}
        onMouseEnter={e => { e.currentTarget.style.color = C.t2; e.currentTarget.style.borderColor = C.cyanBrd; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.t3; e.currentTarget.style.borderColor = C.brd; }}>
        <MoreHorizontal style={{ width: 13, height: 13 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 34, right: 0, zIndex: 9999, background: C.card2, border: `1px solid ${C.brd}`, borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,.7)', minWidth: 148, overflow: 'hidden' }}>
          {items.map((item, i) => {
            const Ic = item.icon;
            return (
              <button key={i} onClick={e => { e.stopPropagation(); setOpen(false); item.action(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', fontSize: 12, fontWeight: 600, color: item.danger ? C.red : C.t1, background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, outline: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = item.danger ? C.redDim : 'rgba(255,255,255,.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Ic style={{ width: 12, height: 12 }} /> {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── PERFORMANCE OVERVIEW — 4 stat cards matching ContentPage card aesthetic ──
function PerformanceOverview({ workouts, workoutStats }) {
  const total      = workouts.length;
  const assigned   = workouts.filter(w => (workoutStats[w.id]?.assignedCount || 0) > 0).length;
  const unassigned = total - assigned;
  const avgCompletion = assigned > 0
    ? Math.round(workouts.filter(w => workoutStats[w.id]?.assignedCount > 0)
        .reduce((s, w) => s + (workoutStats[w.id]?.completionRate || 0), 0) / assigned) : 0;
  const needsAttention = workouts.filter(w => {
    const s = workoutStats[w.id];
    return s && ((s.assignedCount > 0 && s.completionRate < 40) || (s.assignedCount > 0 && s.daysSinceActivity > 14));
  }).length;
  const typePerf = {};
  workouts.forEach(w => {
    const s = workoutStats[w.id];
    if (!s || s.assignedCount === 0) return;
    if (!typePerf[w.type]) typePerf[w.type] = { total: 0, sum: 0 };
    typePerf[w.type].total++;
    typePerf[w.type].sum += s.completionRate;
  });
  const bestType  = Object.entries(typePerf).sort((a, b) => (b[1].sum / b[1].total) - (a[1].sum / a[1].total))[0];
  const cColor    = assigned > 0 ? completionColor(avgCompletion) : C.t3;

  const cardBase = {
    padding: '20px 20px', borderRadius: 14,
    background: C.card, border: `1px solid ${C.brd}`,
    position: 'relative', overflow: 'hidden',
    transition: 'border-color .15s',
    cursor: 'default',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>

      {/* Library */}
      <div style={cardBase}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at top right, rgba(77,127,255,0.06), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 14 }}>Library</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: C.mono, fontSize: 40, fontWeight: 700, color: C.t1, lineHeight: 1, letterSpacing: '-.05em' }}>{total}</span>
          <span style={{ fontSize: 12, color: C.t3 }}>workouts</span>
        </div>
        <HealthBar height={4} segments={[{ value: assigned, color: C.emerald }, { value: unassigned, color: C.t3 }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: C.emerald, fontWeight: 600 }}>{assigned} assigned</span>
          <span style={{ fontSize: 10, color: C.t3 }}>{unassigned} unused</span>
        </div>
      </div>

      {/* Avg Completion */}
      <div style={cardBase}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: cColor, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: '.07em', textTransform: 'uppercase' }}>Avg Completion</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 6 }}>
          <span style={{ fontFamily: C.mono, fontSize: 40, fontWeight: 700, color: cColor, lineHeight: 1, letterSpacing: '-.05em' }}>
            {assigned > 0 ? avgCompletion : '—'}
          </span>
          {assigned > 0 && <span style={{ fontSize: 18, fontWeight: 700, color: cColor }}>%</span>}
        </div>
        <div style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>
          {avgCompletion >= 70 ? 'Strong engagement' : avgCompletion >= 40 ? 'Room to improve' : assigned > 0 ? 'Needs attention' : 'No data yet'}
        </div>
      </div>

      {/* Need Review */}
      <div style={{ ...cardBase, background: needsAttention > 0 ? 'rgba(245,158,11,0.05)' : C.card, border: `1px solid ${needsAttention > 0 ? C.amberBrd : C.brd}` }}
        onMouseEnter={e => { if (!needsAttention) e.currentTarget.style.borderColor = C.cyanBrd; }}
        onMouseLeave={e => { if (!needsAttention) e.currentTarget.style.borderColor = C.brd; }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: needsAttention > 0 ? C.amber : C.t3, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: needsAttention > 0 ? C.amber : C.t3, letterSpacing: '.07em', textTransform: 'uppercase' }}>Need Review</span>
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 40, fontWeight: 700, color: needsAttention > 0 ? C.amber : C.t3, lineHeight: 1, letterSpacing: '-.05em', marginBottom: 6 }}>
          {needsAttention}
        </div>
        <div style={{ fontSize: 11, color: needsAttention > 0 ? C.amber : C.t3, fontWeight: needsAttention > 0 ? 600 : 500 }}>
          {needsAttention > 0 ? 'Low completion or inactive' : 'All workouts healthy'}
        </div>
      </div>

      {/* Best Type */}
      <div style={cardBase}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.cyanBrd}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.brd}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 14 }}>Best Performing</div>
        {bestType ? (() => {
          const tc  = WORKOUT_TYPES[bestType[0]] || WORKOUT_TYPES.strength;
          const avg = Math.round(bestType[1].sum / bestType[1].total);
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{tc.emoji}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: tc.color, letterSpacing: '-.02em' }}>{tc.label}</div>
                  <div style={{ fontSize: 10, color: C.t3 }}>workout type</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.t3 }}>
                <span style={{ fontFamily: C.mono, fontWeight: 700, color: C.emerald, fontSize: 13 }}>{avg}%</span>{' '}avg completion
              </div>
            </div>
          );
        })() : (
          <div style={{ fontSize: 12, color: C.t3, paddingTop: 4 }}>Assign workouts to see data</div>
        )}
      </div>
    </div>
  );
}

// ── NEEDS ATTENTION ──────────────────────────────────────────────────────────
function NeedsAttention({ workouts, workoutStats, onAssign, onEdit, openModal }) {
  const alerts = useMemo(() => {
    const items = [];
    workouts.forEach(wo => {
      const s = workoutStats[wo.id];
      if (!s) return;
      if (s.assignedCount === 0)
        items.push({ workout: wo, reason: 'Not assigned to any clients', actionLabel: 'Assign', actionFn: () => onAssign(wo), color: C.t3, icon: Users });
      else if (s.completionRate < 40)
        items.push({ workout: wo, reason: `Only ${s.completionRate}% completion`, actionLabel: 'Follow up', actionFn: () => openModal('post'), color: C.red, icon: TrendingDown });
      else if (s.daysSinceActivity > 14)
        items.push({ workout: wo, reason: `No activity in ${s.daysSinceActivity}d`, actionLabel: 'Send reminder', actionFn: () => openModal('post'), color: C.amber, icon: AlertTriangle });
      else if ((s.daysSinceUpdate ?? 999) > 60)
        items.push({ workout: wo, reason: 'Not updated in 60+ days', actionLabel: 'Review', actionFn: () => onEdit(wo), color: C.amber, icon: RefreshCw });
    });
    return items.slice(0, 5);
  }, [workouts, workoutStats]);

  if (!alerts.length) return null;

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.amberBrd}`, background: 'rgba(245,158,11,0.04)', marginBottom: 18 }}>
      <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.amberBrd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.amber }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, letterSpacing: '-.01em' }}>Needs Attention</span>
          <Pill color={C.amber}>{alerts.length} workout{alerts.length > 1 ? 's' : ''}</Pill>
        </div>
        <span style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>Sorted by impact</span>
      </div>
      <div style={{ padding: '6px 8px' }}>
        {alerts.map((alert, i) => {
          const tc = WORKOUT_TYPES[alert.workout.type] || WORKOUT_TYPES.strength;
          const Ic = alert.icon;
          return (
            <div key={i}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 12px', borderRadius: 10, transition: 'background .12s', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{tc.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 2, letterSpacing: '-.01em' }}>{alert.workout.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: alert.color, fontWeight: 600 }}>
                  <Ic style={{ width: 10, height: 10 }} /> {alert.reason}
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); alert.actionFn?.(); }}
                style={{ padding: '6px 14px', borderRadius: 8, background: `${alert.color}10`, border: `1px solid ${alert.color}25`, color: alert.color, fontSize: 11, fontWeight: 700, flexShrink: 0, cursor: 'pointer', fontFamily: FONT, outline: 'none', transition: 'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${alert.color}1e`}
                onMouseLeave={e => e.currentTarget.style.background = `${alert.color}10`}>
                {alert.actionLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── WORKOUT CARD — matching ContentPage post card aesthetic ───────────────────
function WorkoutCard({ workout, stats, isSelected, onSelect, onEdit, onDelete, onDuplicate, onAssign }) {
  const [hovered, setHovered] = useState(false);
  const tc     = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;
  const health = getHealth(stats.completionRate, stats.assignedCount, stats.daysSinceUpdate ?? 999);

  return (
    <div
      onClick={() => onSelect(workout)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12, overflow: 'hidden',
        background: isSelected ? `${tc.color}05` : C.card,
        border: `1px solid ${isSelected ? `${tc.color}30` : hovered ? C.cyanBrd : C.brd}`,
        boxShadow: hovered ? '0 0 8px rgba(77,127,255,0.07)' : 'none',
        cursor: 'pointer',
        transition: 'border-color .18s, box-shadow .18s',
      }}>
      {/* Color strip */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${tc.color}, ${tc.color}55)` }} />

      <div style={{ padding: '16px 18px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-.02em', lineHeight: 1.25, marginBottom: 5 }}>{workout.name}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Pill color={tc.color} bg={tc.bg} border={tc.border}>{tc.label}</Pill>
                {workout.duration && <span style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>⏱ {workout.duration}min</span>}
              </div>
            </div>
          </div>
          <DotMenu visible={hovered} items={[
            { icon: Edit2,  label: 'Edit',      action: () => onEdit(workout) },
            { icon: Copy,   label: 'Duplicate', action: () => onDuplicate(workout) },
            { icon: Trash2, label: 'Delete',    action: () => onDelete(workout.id), danger: true },
          ]} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.brd}`, marginBottom: 12 }}>
          {[
            { label: 'Clients', value: stats.assignedCount,              color: C.cyan },
            { label: 'Done',    value: stats.assignedCount === 0 ? '—' : `${stats.completionRate}%`, color: completionColor(stats.completionRate), dim: stats.assignedCount === 0 },
            { label: 'Updated', value: stats.daysSinceUpdate === null ? '—' : stats.daysSinceUpdate === 0 ? 'Now' : `${stats.daysSinceUpdate}d`, color: C.violet },
          ].map((s, i) => (
            <div key={i} style={{ padding: '10px 8px', textAlign: 'center', background: 'rgba(255,255,255,.02)', ...(i > 0 ? { borderLeft: `1px solid ${C.brd}` } : {}) }}>
              <div style={{ fontFamily: C.mono, fontSize: 17, fontWeight: 700, color: s.dim ? C.t3 : s.color, lineHeight: 1, letterSpacing: '-.03em' }}>{s.value}</div>
              <div style={{ fontSize: 8, color: C.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 4, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Health + difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pill color={health.color} bg={health.bg} border={health.bdr}>{health.label}</Pill>
          {workout.difficulty && <span style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>{workout.difficulty}</span>}
        </div>

        {/* Exercise preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
          {workout.main.slice(0, 2).map((ex, i) => (
            <div key={i} style={{ fontSize: 11, color: C.t3, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: tc.color, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{ex.name}</span>
              {(ex.sets || ex.reps) && <span style={{ fontFamily: C.mono, fontSize: 9, color: C.t3, flexShrink: 0, fontWeight: 600 }}>{ex.sets ? `${ex.sets}×${ex.reps}` : ex.reps}</span>}
            </div>
          ))}
          {workout.main.length > 2 && <span style={{ fontSize: 10, color: C.t3, paddingLeft: 11, fontWeight: 600 }}>+{workout.main.length - 2} more exercises</span>}
        </div>

        {/* Assign CTA */}
        <button onClick={e => { e.stopPropagation(); onAssign(workout); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px', borderRadius: 10, background: `${tc.color}0c`, border: `1px solid ${tc.color}22`, color: tc.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none', fontFamily: FONT, transition: 'background .14s, border-color .14s' }}
          onMouseEnter={e => { e.currentTarget.style.background = `${tc.color}1a`; e.currentTarget.style.borderColor = `${tc.color}38`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${tc.color}0c`; e.currentTarget.style.borderColor = `${tc.color}22`; }}>
          <Play style={{ width: 12, height: 12 }} /> Assign Workout
        </button>
      </div>
    </div>
  );
}

// ── WORKOUT DETAIL PANEL ─────────────────────────────────────────────────────
function WorkoutDetailPanel({ workout, stats, allMemberships, checkIns, now, avatarMap, onEdit, onAssign, onClose, openModal }) {
  const tc     = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;
  const health = getHealth(stats.completionRate, stats.assignedCount, stats.daysSinceUpdate ?? 999);
  const [tab, setTab] = useState('clients');

  const assignedClients = useMemo(() => {
    return stats.assignedMemberIds.map(uid => {
      const m = allMemberships.find(x => x.user_id === uid) || { user_id: uid, user_name: 'Client' };
      const lastCI = checkIns.filter(c => c.user_id === uid).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      const daysAgo = lastCI ? Math.floor((now - new Date(lastCI.check_in_date)) / 864e5) : null;
      const engStatus = daysAgo === null ? 'never' : daysAgo > 14 ? 'inactive' : daysAgo > 7 ? 'low' : 'active';
      const engColor  = { active: C.emerald, low: C.amber, inactive: C.red, never: C.t3 }[engStatus];
      const engLabel  = { active: 'Active', low: 'Low activity', inactive: 'Inactive', never: 'Never visited' }[engStatus];
      return { ...m, daysAgo, engStatus, engColor, engLabel };
    });
  }, [stats.assignedMemberIds, allMemberships, checkIns, now]);

  const suggestions = useMemo(() => allMemberships.filter(m => {
    if (stats.assignedMemberIds.includes(m.user_id)) return false;
    const r30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
    return r30 >= 2;
  }).slice(0, 4), [allMemberships, stats.assignedMemberIds, checkIns, now]);

  const TABS = [
    { id: 'clients',   label: `Clients (${stats.assignedCount})`,   icon: Users    },
    { id: 'exercises', label: `Exercises (${workout.main.length})`,  icon: Dumbbell },
    { id: 'suggest',   label: `Suggestions (${suggestions.length})`, icon: Lightbulb },
  ];

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: C.card, border: `1px solid ${C.brd}` }}>
      {/* Panel header */}
      <div style={{ padding: '18px 22px 16px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.t1, letterSpacing: '-.03em', marginBottom: 6 }}>{workout.name}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Pill color={tc.color} bg={tc.bg} border={tc.border}>{tc.label}</Pill>
                <Pill color={health.color} bg={health.bg} border={health.bdr}>{health.label}</Pill>
                {workout.difficulty && <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>{workout.difficulty}</span>}
                {workout.duration   && <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>⏱ {workout.duration}min</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => onEdit(workout)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: `${tc.color}0c`, border: `1px solid ${tc.color}25`, color: tc.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none', fontFamily: FONT, transition: 'background .14s' }}
              onMouseEnter={e => e.currentTarget.style.background = `${tc.color}1e`}
              onMouseLeave={e => e.currentTarget.style.background = `${tc.color}0c`}>
              <Edit2 style={{ width: 12, height: 12 }} /> Edit
            </button>
            <button onClick={() => onAssign(workout)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, background: tc.color, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none', fontFamily: FONT, boxShadow: `0 2px 14px ${tc.color}35`, transition: 'opacity .14s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity  = '1'}>
              <UserPlus style={{ width: 12, height: 12 }} /> Assign
            </button>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.04)', border: `1px solid ${C.brd}`, color: C.t3, cursor: 'pointer', outline: 'none', transition: 'color .14s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.t1}
              onMouseLeave={e => e.currentTarget.style.color = C.t3}>
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Clients',       value: stats.assignedCount,   color: C.cyan },
            { label: 'Completion',    value: stats.assignedCount === 0 ? '—' : `${stats.completionRate}%`, color: stats.assignedCount > 0 ? completionColor(stats.completionRate) : C.t3 },
            { label: 'Last activity', value: stats.daysSinceActivity >= 999 ? 'Never' : `${stats.daysSinceActivity}d ago`, color: stats.daysSinceActivity > 14 ? C.red : C.emerald },
            { label: 'Updated',       value: stats.daysSinceUpdate === null ? '—' : stats.daysSinceUpdate === 0 ? 'Today' : `${stats.daysSinceUpdate}d ago`, color: C.violet },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,.025)', border: `1px solid ${C.brd}` }}>
              <div style={{ fontFamily: C.mono, fontSize: 19, fontWeight: 700, color: s.color, lineHeight: 1, letterSpacing: '-.03em' }}>{s.value}</div>
              <div style={{ fontSize: 8, color: C.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 5, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.brd}`, padding: '0 8px' }}>
        {TABS.map(t => {
          const Ic     = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '12px 8px', background: 'none', border: 'none', borderBottom: `2px solid ${active ? tc.color : 'transparent'}`, color: active ? tc.color : C.t3, fontSize: 11, fontWeight: active ? 700 : 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: -1, cursor: 'pointer', fontFamily: FONT, outline: 'none', transition: 'color .14s' }}>
              <Ic style={{ width: 11, height: 11 }} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: '18px 22px' }}>
        {/* Clients tab */}
        {tab === 'clients' && (
          assignedClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Users style={{ width: 24, height: 24, color: C.t3, margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: C.t2, fontWeight: 700, margin: '0 0 14px', letterSpacing: '-.01em' }}>No clients assigned yet</p>
              <button onClick={() => onAssign(workout)}
                style={{ fontSize: 12, fontWeight: 700, color: tc.color, background: `${tc.color}0c`, border: `1px solid ${tc.color}22`, borderRadius: 9, padding: '9px 20px', cursor: 'pointer', fontFamily: FONT, outline: 'none' }}>
                Assign to clients
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {assignedClients.map((m, i) => (
                <div key={m.user_id || i}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, background: 'rgba(255,255,255,.02)', border: `1px solid ${C.brd}`, transition: 'background .12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.035)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, overflow: 'hidden', background: `${m.engColor}0d`, border: `1px solid ${m.engColor}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: m.engColor }}>
                    {avatarMap?.[m.user_id]
                      ? <img src={avatarMap[m.user_id]} alt={m.user_name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                      : (m.user_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{m.user_name || 'Client'}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                      <Pill color={m.engColor} style={{ fontSize: 8, padding: '1px 6px' }}>{m.engLabel}</Pill>
                      <span style={{ fontSize: 10, color: C.t3 }}>{m.daysAgo === null ? 'Never visited' : m.daysAgo === 0 ? 'Today' : `${m.daysAgo}d ago`}</span>
                    </div>
                  </div>
                  {m.engStatus !== 'active' && (
                    <button onClick={() => openModal('post', { memberId: m.user_id })}
                      style={{ fontSize: 10, fontWeight: 700, color: C.cyan, background: C.cyanDim, border: `1px solid ${C.cyanBrd}`, borderRadius: 7, padding: '5px 11px', flexShrink: 0, cursor: 'pointer', fontFamily: FONT, outline: 'none' }}>
                      Follow up
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Exercises tab */}
        {tab === 'exercises' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12 }}>
            {[
              { title: 'Warmup',       exercises: workout.warmup,   accent: C.sky,    emoji: '🔥' },
              { title: 'Main Workout', exercises: workout.main,     accent: tc.color, emoji: tc.emoji },
              { title: 'Cooldown',     exercises: workout.cooldown, accent: C.emerald, emoji: '❄️' },
            ].map((sec, si) => (
              <div key={si} style={{ borderRadius: 12, padding: '14px', background: `${sec.accent}04`, border: `1px solid ${sec.accent}14` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: sec.accent, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>{sec.emoji} {sec.title}</div>
                {sec.exercises.length === 0
                  ? <p style={{ fontSize: 11, color: C.t3 }}>—</p>
                  : sec.exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: sec.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.t2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{ex.name}</span>
                      {(ex.sets || ex.reps) && <span style={{ fontFamily: C.mono, fontSize: 9, color: C.t3, flexShrink: 0 }}>{ex.sets ? `${ex.sets}×${ex.reps}` : ex.reps}</span>}
                    </div>
                  ))
                }
              </div>
            ))}
            {workout.notes && (
              <div style={{ gridColumn: '1/-1', padding: '11px 14px', borderRadius: 10, background: 'rgba(255,255,255,.02)', border: `1px solid ${C.brd}`, fontSize: 12, color: C.t3, lineHeight: 1.6, fontWeight: 500 }}>
                📝 {workout.notes}
              </div>
            )}
          </div>
        )}

        {/* Suggestions tab */}
        {tab === 'suggest' && (
          suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <CheckCircle style={{ width: 22, height: 22, color: C.emerald, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: C.emerald, margin: 0 }}>All active clients are assigned</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: C.t3, marginBottom: 12, fontWeight: 500 }}>Active clients not yet assigned this workout.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.map((m, i) => {
                  const r30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
                  return (
                    <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, background: 'rgba(255,255,255,.02)', border: `1px solid ${C.brd}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, overflow: 'hidden', background: C.emeraldDim, border: `1px solid ${C.emeraldBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: C.emerald }}>
                        {avatarMap?.[m.user_id]
                          ? <img src={avatarMap[m.user_id]} alt={m.user_name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                          : (m.user_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, letterSpacing: '-.01em' }}>{m.user_name || 'Client'}</div>
                        <div style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>{r30} visits this month</div>
                      </div>
                      <button onClick={() => onAssign(workout)}
                        style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: `${tc.color}0c`, border: `1px solid ${tc.color}22`, borderRadius: 7, padding: '5px 12px', flexShrink: 0, cursor: 'pointer', fontFamily: FONT, outline: 'none' }}>
                        Assign
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

// ── RIGHT SIDEBAR — 244px, exact match to ContentPage sidebar structure ───────
function RightSidebar({ workouts, workoutStats, posts, polls, events, openModal }) {
  const total      = workouts.length;
  const assigned   = workouts.filter(w => (workoutStats[w.id]?.assignedCount || 0) > 0).length;
  const avgCompletion = assigned > 0
    ? Math.round(workouts.filter(w => workoutStats[w.id]?.assignedCount > 0)
        .reduce((s, w) => s + (workoutStats[w.id]?.completionRate || 0), 0) / assigned) : 0;
  const needsAttention = workouts.filter(w => {
    const s = workoutStats[w.id];
    return s && ((s.assignedCount > 0 && s.completionRate < 40) || (s.assignedCount > 0 && s.daysSinceActivity > 14));
  }).length;

  const engagementScore =
    posts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0) +
    polls.reduce((s, p) => s + (p.voters?.length || 0), 0);

  // Library breakdown
  const counts = {};
  workouts.forEach(w => { counts[w.type] = (counts[w.type] || 0) + 1; });
  const sortedTypes = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Insights
  const typePerf = {};
  workouts.forEach(w => {
    const s = workoutStats[w.id];
    if (!s || s.assignedCount === 0) return;
    if (!typePerf[w.type]) typePerf[w.type] = { total: 0, sum: 0 };
    typePerf[w.type].total++;
    typePerf[w.type].sum += s.completionRate;
  });
  const bestEntry    = Object.entries(typePerf).sort((a, b) => (b[1].sum / b[1].total) - (a[1].sum / a[1].total))[0];
  const lowEngCount  = workouts.filter(w => { const s = workoutStats[w.id]; return s && s.assignedCount > 0 && s.completionRate < 40; }).length;
  const unusedCount  = workouts.filter(w => (workoutStats[w.id]?.assignedCount || 0) === 0).length;
  const insights = [
    bestEntry   && { icon: TrendingUp,   color: C.emerald, text: `${WORKOUT_TYPES[bestEntry[0]]?.label || bestEntry[0]} workouts lead with ${Math.round(bestEntry[1].sum / bestEntry[1].total)}% completion` },
    unusedCount && { icon: AlertTriangle, color: C.amber,   text: `${unusedCount} workout${unusedCount > 1 ? 's are' : ' is'} never used — assign or archive` },
    lowEngCount && { icon: TrendingDown,  color: C.red,     text: `${lowEngCount} workout${lowEngCount > 1 ? 's have' : ' has'} completion below 40%` },
                 { icon: Lightbulb,      color: C.cyan,    text: 'Structured programmes retain clients 2.4× longer' },
  ].filter(Boolean).slice(0, 4);

  // Stat cells for 2×2 grid — matches ContentPage's stat grid exactly
  const statCells = [
    { label: 'Total',    val: total,      color: C.cyan   },
    { label: 'Assigned', val: assigned,   color: C.emerald },
    { label: 'Avg Done', val: assigned > 0 ? `${avgCompletion}%` : '—', color: assigned > 0 ? completionColor(avgCompletion) : C.t3 },
    { label: 'Review',   val: needsAttention, color: needsAttention > 0 ? C.amber : C.t3 },
  ];

  return (
    <div style={{ width: 244, flexShrink: 0, background: C.sidebar, borderLeft: `1px solid ${C.brd}`, display: 'flex', flexDirection: 'column', fontFamily: FONT, alignSelf: 'flex-start' }}>
      {/* Header — exact match to ContentPage "Content Overview" */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Library Overview</div>
      </div>

      {/* 2×2 stat grid — exact match to ContentPage stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.brd, borderBottom: `1px solid ${C.brd}` }}>
        {statCells.map((s, i) => (
          <div key={i}
            style={{ padding: '12px 14px', background: C.sidebar, cursor: 'default', transition: 'background .12s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.cyanDim}
            onMouseLeave={e => e.currentTarget.style.background = C.sidebar}>
            <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Engagement — exact match to ContentPage "Community Activity" */}
      <div style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ fontSize: 10, color: C.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Content Engagement</div>
        <div style={{ fontSize: 38, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', lineHeight: 1 }}>{engagementScore}</div>
        <div style={{ fontSize: 11, color: C.t3, marginTop: 5 }}>total interactions</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
          {[
            { label: 'Likes',    val: posts.reduce((s, p) => s + (p.likes?.length || 0), 0),    color: '#f87171' },
            { label: 'Comments', val: posts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: C.cyan   },
            { label: 'Votes',    val: polls.reduce((s, p) => s + (p.voters?.length || 0), 0),   color: C.violet },
          ].map((s, i) => (
            <span key={i} style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, background: 'rgba(255,255,255,.03)', border: `1px solid ${C.brd}`, color: s.color }}>
              {s.val} {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Library Breakdown — matches ContentPage's chart section */}
      <div style={{ padding: '14px 16px 12px 16px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Library Breakdown</span>
          <span style={{ fontSize: 10, color: C.t3 }}>{total} total</span>
        </div>
        {sortedTypes.map(([type, count]) => {
          const tc  = WORKOUT_TYPES[type] || WORKOUT_TYPES.strength;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={type} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12 }}>{tc.emoji}</span>
                  <span style={{ fontSize: 11, color: C.t2, fontWeight: 600 }}>{tc.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: tc.color }}>{count}</span>
                  <span style={{ fontFamily: C.mono, fontSize: 9, color: C.t3 }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: tc.color, width: `${pct}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights + Quick Actions — matches ContentPage "Member Activity" section */}
      <div style={{ padding: '14px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
          <Sparkles style={{ width: 13, height: 13, color: C.violet }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Insights</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {insights.map((ins, i) => {
            const Ic = ins.icon;
            return (
              <div key={i}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 8px', borderRadius: 9, transition: 'background .12s', background: 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${ins.color}0e`, border: `1px solid ${ins.color}20` }}>
                  <Ic style={{ width: 11, height: 11, color: ins.color }} />
                </div>
                <span style={{ fontSize: 11, color: C.t2, lineHeight: 1.55, flex: 1, fontWeight: 500 }}>{ins.text}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: MessageSquarePlus, label: 'Post Update',   sub: 'Engage members',    color: C.cyan,   action: () => openModal('post')      },
              { icon: BarChart2,         label: 'New Poll',      sub: 'Gather feedback',   color: C.emerald, action: () => openModal('poll')     },
              { icon: Trophy,            label: 'New Challenge', sub: 'Drive consistency', color: C.amber,  action: () => openModal('challenge') },
            ].map(({ icon: Ic, label, sub, color, action }, i) => (
              <button key={i} onClick={action}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, width: '100%', background: 'rgba(255,255,255,.025)', border: `1px solid ${C.brd}`, textAlign: 'left', cursor: 'pointer', fontFamily: FONT, outline: 'none', transition: 'all .14s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${color}07`; e.currentTarget.style.borderColor = `${color}25`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.025)'; e.currentTarget.style.borderColor = C.brd; }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${color}0e`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic style={{ width: 13, height: 13, color }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, letterSpacing: '-.01em' }}>{label}</div>
                  <div style={{ fontSize: 10, color: C.t3, fontWeight: 600, marginTop: 1 }}>{sub}</div>
                </div>
                <ChevronRight style={{ width: 12, height: 12, color: C.t3, marginLeft: 'auto' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EXERCISE ROW ─────────────────────────────────────────────────────────────
function ExerciseRow({ ex, onChange, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const inputS = {
    padding: '8px 10px', borderRadius: 8,
    background: 'rgba(255,255,255,.03)', border: `1px solid ${C.brd}`,
    color: C.t1, fontSize: 12, outline: 'none', fontFamily: FONT, fontWeight: 500,
    transition: 'border-color .14s, background .14s',
  };
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,.025)', border: `1px solid ${C.brd}`, marginBottom: 5 }}>
      <Dumbbell style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
      <input value={ex.name}   onChange={e => onChange({ ...ex, name: e.target.value })}  placeholder="Exercise name" style={{ ...inputS, flex: 1 }}
        onFocus={e => { e.target.style.borderColor = C.cyanBrd; e.target.style.background = 'rgba(77,127,255,.04)'; }}
        onBlur={e  => { e.target.style.borderColor = C.brd;     e.target.style.background = 'rgba(255,255,255,.03)'; }} />
      <input value={ex.sets}   onChange={e => onChange({ ...ex, sets: e.target.value })}  placeholder="Sets"         style={{ ...inputS, width: 50 }}
        onFocus={e => { e.target.style.borderColor = C.cyanBrd; e.target.style.background = 'rgba(77,127,255,.04)'; }}
        onBlur={e  => { e.target.style.borderColor = C.brd;     e.target.style.background = 'rgba(255,255,255,.03)'; }} />
      <span style={{ fontSize: 10, color: C.t3, fontWeight: 700 }}>×</span>
      <input value={ex.reps}   onChange={e => onChange({ ...ex, reps: e.target.value })}  placeholder="Reps / time"  style={{ ...inputS, width: 88 }}
        onFocus={e => { e.target.style.borderColor = C.cyanBrd; e.target.style.background = 'rgba(77,127,255,.04)'; }}
        onBlur={e  => { e.target.style.borderColor = C.brd;     e.target.style.background = 'rgba(255,255,255,.03)'; }} />
      <button onClick={onDelete}
        style={{ background: 'none', border: 'none', color: C.red, padding: 0, display: 'flex', cursor: 'pointer', outline: 'none', opacity: hovered ? 1 : 0, transition: 'opacity .12s', flexShrink: 0 }}>
        <X style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}

// ── SECTION BLOCK (editor) ───────────────────────────────────────────────────
function SectionBlock({ title, accent, exercises, onChange, icon: Icon }) {
  const addEx    = ()          => onChange([...exercises, { id: uid(), name: '', sets: '', reps: '' }]);
  const updateEx = (idx, ex)   => { const u = [...exercises]; u[idx] = ex; onChange(u); };
  const deleteEx = idx         => onChange(exercises.filter((_, i) => i !== idx));
  return (
    <div style={{ borderRadius: 12, padding: '14px', marginBottom: 10, background: `${accent}04`, border: `1px solid ${accent}14` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 }}>
        <div style={{ width: 27, height: 27, borderRadius: 8, background: `${accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color: accent }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, letterSpacing: '-.01em' }}>{title}</span>
        <span style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
      </div>
      {exercises.map((ex, i) => <ExerciseRow key={ex.id || i} ex={ex} onChange={u => updateEx(i, u)} onDelete={() => deleteEx(i)} />)}
      <button onClick={addEx}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: accent, background: `${accent}09`, border: `1px solid ${accent}20`, borderRadius: 8, padding: '7px 13px', marginTop: 4, cursor: 'pointer', fontFamily: FONT, outline: 'none', transition: 'background .14s' }}
        onMouseEnter={e => e.currentTarget.style.background = `${accent}15`}
        onMouseLeave={e => e.currentTarget.style.background = `${accent}09`}>
        <Plus style={{ width: 10, height: 10 }} /> Add exercise
      </button>
    </div>
  );
}

// ── WORKOUT EDITOR ───────────────────────────────────────────────────────────
function WorkoutEditor({ workout, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => workout
    ? { ...workout, warmup: [...workout.warmup], main: [...workout.main], cooldown: [...workout.cooldown] }
    : { id: uid(), name: '', type: 'strength', duration: 45, difficulty: 'Intermediate', warmup: [], main: [], cooldown: [], notes: '' }
  );
  const tc      = WORKOUT_TYPES[draft.type] || WORKOUT_TYPES.strength;
  const canSave = draft.name.trim().length > 0;

  const inputBase = {
    padding: '10px 14px', borderRadius: 9,
    background: 'rgba(255,255,255,.03)', border: `1px solid ${C.brd}`,
    color: C.t1, fontSize: 13, fontFamily: FONT, fontWeight: 500, outline: 'none', transition: 'all .14s',
  };

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: C.card, border: `1px solid ${C.brd}` }}>
      {/* Editor header */}
      <div style={{ padding: '18px 22px 16px', borderBottom: `1px solid ${C.brd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-.02em' }}>{workout ? 'Edit Workout' : 'New Workout'}</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 2, fontWeight: 500 }}>Fill in the details below</div>
            </div>
          </div>
          <button onClick={onCancel}
            style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.04)', border: `1px solid ${C.brd}`, color: C.t3, cursor: 'pointer', outline: 'none', transition: 'color .14s' }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 140px', gap: 10, marginBottom: 14 }}>
          <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Workout name" style={inputBase}
            onFocus={e => { e.target.style.borderColor = C.cyanBrd; e.target.style.background = 'rgba(77,127,255,.04)'; }}
            onBlur={e  => { e.target.style.borderColor = C.brd;     e.target.style.background = 'rgba(255,255,255,.03)'; }} />
          <input value={draft.duration} onChange={e => setDraft(p => ({ ...p, duration: e.target.value }))} placeholder="Mins" type="number" style={inputBase}
            onFocus={e => { e.target.style.borderColor = C.cyanBrd; e.target.style.background = 'rgba(77,127,255,.04)'; }}
            onBlur={e  => { e.target.style.borderColor = C.brd;     e.target.style.background = 'rgba(255,255,255,.03)'; }} />
          <select value={draft.difficulty} onChange={e => setDraft(p => ({ ...p, difficulty: e.target.value }))}
            style={{ ...inputBase, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', appearance: 'none' }}>
            {['Beginner', 'Intermediate', 'Advanced', 'Elite'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* Type chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Object.entries(WORKOUT_TYPES).map(([key, t]) => (
            <button key={key} onClick={() => setDraft(p => ({ ...p, type: key }))}
              style={{ padding: '5px 13px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: draft.type === key ? t.bg : 'transparent', border: `1px solid ${draft.type === key ? t.border : C.brd}`, color: draft.type === key ? t.color : C.t3, cursor: 'pointer', fontFamily: FONT, outline: 'none', transition: 'all .14s' }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '18px 22px' }}>
        <SectionBlock title="Warmup"       accent={C.sky}    icon={Play}    exercises={draft.warmup}   onChange={v => setDraft(p => ({ ...p, warmup: v }))} />
        <SectionBlock title="Main Workout" accent={tc.color} icon={Dumbbell} exercises={draft.main}    onChange={v => setDraft(p => ({ ...p, main: v }))} />
        <SectionBlock title="Cooldown"     accent={C.emerald} icon={Heart}   exercises={draft.cooldown} onChange={v => setDraft(p => ({ ...p, cooldown: v }))} />

        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 7 }}>Coaching Notes</div>
          <textarea value={draft.notes} onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))}
            placeholder="Tips, modifications, cues, equipment needed…"
            style={{ width: '100%', minHeight: 66, resize: 'vertical', lineHeight: 1.6, padding: '10px 14px', borderRadius: 9, background: 'rgba(255,255,255,.03)', border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, fontFamily: FONT, fontWeight: 500, outline: 'none', boxSizing: 'border-box', transition: 'all .14s' }}
            onFocus={e => { e.target.style.borderColor = C.cyanBrd; e.target.style.background = 'rgba(77,127,255,.04)'; }}
            onBlur={e  => { e.target.style.borderColor = C.brd;     e.target.style.background = 'rgba(255,255,255,.03)'; }} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '11px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: `1px solid ${C.brd}`, color: C.t3, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, outline: 'none', transition: 'color .14s' }}
            onMouseEnter={e => e.currentTarget.style.color = C.t1}
            onMouseLeave={e => e.currentTarget.style.color = C.t3}>
            Cancel
          </button>
          <button onClick={() => canSave && onSave(draft)} disabled={!canSave}
            style={{ flex: 2, padding: '11px', borderRadius: 10, background: canSave ? tc.color : 'rgba(255,255,255,.04)', border: 'none', color: canSave ? '#fff' : C.t3, fontSize: 12, fontWeight: 700, boxShadow: canSave ? `0 2px 14px ${tc.color}30` : 'none', cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: FONT, outline: 'none', transition: 'opacity .14s' }}
            onMouseEnter={e => { if (canSave) e.currentTarget.style.opacity = '.85'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            {workout ? '✓ Save Changes' : '✓ Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ASSIGN MODAL ─────────────────────────────────────────────────────────────
function AssignModal({ workout, allMemberships, myClasses, avatarMap, onClose, openModal }) {
  const [tab,      setTab]      = useState('member');
  const [search,   setSearch]   = useState('');
  const [assigned, setAssigned] = useState([]);
  const tc = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;

  const filtered = useMemo(() => {
    if (tab === 'member') return allMemberships.filter(m => !search || (m.user_name || '').toLowerCase().includes(search.toLowerCase())).slice(0, 12);
    if (tab === 'class')  return myClasses.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()));
    return [];
  }, [tab, search, allMemberships, myClasses]);

  const toggle = id => setAssigned(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const MODAL_TABS = [
    { id: 'member',    icon: Users,    label: 'Member',    color: C.cyan   },
    { id: 'class',     icon: Dumbbell, label: 'Class',     color: C.violet },
    { id: 'challenge', icon: Trophy,   label: 'Challenge', color: C.amber  },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 490, maxHeight: '82vh', overflowY: 'auto', borderRadius: 18, background: C.card, border: `1px solid ${C.brd}`, boxShadow: '0 32px 80px rgba(0,0,0,.75)' }}
        onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.brd}`, position: 'sticky', top: 0, background: C.card, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-.02em' }}>Assign Workout</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 3, fontWeight: 500 }}>{workout.name} · {workout.main.length} exercises</div>
            </div>
            <button onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.04)', border: `1px solid ${C.brd}`, color: C.t3, cursor: 'pointer', outline: 'none', transition: 'color .14s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.t1}
              onMouseLeave={e => e.currentTarget.style.color = C.t3}>
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 7 }}>
            {MODAL_TABS.map(t => {
              const Ic     = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 8px', borderRadius: 10, border: `1px solid ${active ? `${t.color}30` : C.brd}`, background: active ? `${t.color}0e` : 'transparent', color: active ? t.color : C.t3, fontSize: 11, fontWeight: active ? 700 : 600, cursor: 'pointer', fontFamily: FONT, outline: 'none', transition: 'all .14s' }}>
                  <Ic style={{ width: 11, height: 11 }} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '18px 24px' }}>
          {(tab === 'member' || tab === 'class') && (
            <>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.t3, pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${tab === 'class' ? 'classes' : 'members'}…`}
                  style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 9, background: 'rgba(255,255,255,.03)', border: `1px solid ${C.brd}`, color: C.t1, fontSize: 13, fontFamily: FONT, fontWeight: 500, outline: 'none', boxSizing: 'border-box', transition: 'all .14s' }}
                  onFocus={e => { e.target.style.borderColor = C.cyanBrd; e.target.style.background = 'rgba(77,127,255,.04)'; }}
                  onBlur={e  => { e.target.style.borderColor = C.brd;     e.target.style.background = 'rgba(255,255,255,.03)'; }} />
              </div>
              {filtered.map((item, i) => {
                const id       = item.user_id || item.id;
                const name     = item.user_name || item.name;
                const isChosen = assigned.includes(id);
                return (
                  <div key={id || i} onClick={() => toggle(id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 11, marginBottom: 6, background: isChosen ? C.cyanDim : 'rgba(255,255,255,.025)', border: `1px solid ${isChosen ? C.cyanBrd : C.brd}`, cursor: 'pointer', transition: 'all .12s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, border: `1.5px solid ${isChosen ? C.cyan : 'rgba(255,255,255,.15)'}`, background: isChosen ? C.cyan : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .14s' }}>
                      {isChosen && <Check style={{ width: 11, height: 11, color: '#fff' }} />}
                    </div>
                    {tab === 'member' && <Avatar name={name} size={30} src={avatarMap?.[id]} />}
                    {tab === 'class'  && <div style={{ width: 30, height: 30, borderRadius: 9, background: C.violetDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Dumbbell style={{ width: 13, height: 13, color: C.violet }} /></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-.01em' }}>{name}</div>
                      {tab === 'member' && item.membership_type && <div style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>{item.membership_type}</div>}
                      {tab === 'class'  && item.schedule         && <div style={{ fontSize: 10, color: C.t3, fontWeight: 600 }}>{item.schedule}</div>}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab === 'challenge' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: C.amberDim, border: `1px solid ${C.amberBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trophy style={{ width: 26, height: 26, color: C.amber }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: C.t1, margin: '0 0 8px', letterSpacing: '-.02em' }}>Create a Challenge</p>
              <p style={{ fontSize: 12, color: C.t3, margin: '0 0 20px', fontWeight: 500 }}>Include this workout as the programme.</p>
              <button onClick={() => { openModal('challenge', { workoutId: workout.id, workoutName: workout.name }); onClose(); }}
                style={{ padding: '11px 26px', borderRadius: 11, background: C.amber, border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, outline: 'none', boxShadow: `0 2px 14px ${C.amber}35`, transition: 'opacity .14s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Create Challenge
              </button>
            </div>
          )}

          {(tab === 'member' || tab === 'class') && assigned.length > 0 && (
            <button onClick={() => { openModal('assignWorkout', { workoutId: workout.id, workoutName: workout.name, assignTo: tab, ids: assigned }); onClose(); }}
              style={{ width: '100%', marginTop: 16, padding: '13px', borderRadius: 12, background: tc.color, border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: FONT, outline: 'none', boxShadow: `0 2px 16px ${tc.color}35`, letterSpacing: '-.01em', transition: 'opacity .14s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Assign to {assigned.length} {tab === 'class' ? (assigned.length === 1 ? 'Class' : 'Classes') : (assigned.length === 1 ? 'Member' : 'Members')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
function EmptyState({ onCreateNew }) {
  const templates = [
    { emoji: '⚡', name: 'HIIT Blast',       type: 'hiit',     desc: 'High-intensity interval training' },
    { emoji: '🏋️', name: 'Strength Builder', type: 'strength', desc: 'Progressive overload fundamentals' },
    { emoji: '🌱', name: 'Beginner Flow',    type: 'beginner', desc: 'Perfect for new members' },
  ];
  return (
    <div style={{ padding: '60px 32px', textAlign: 'center', borderRadius: 16, background: C.card, border: `1px solid ${C.brd}` }}>
      <div style={{ width: 60, height: 60, borderRadius: 18, margin: '0 auto 24px', background: C.violetDim, border: `1px solid ${C.violetBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Dumbbell style={{ width: 26, height: 26, color: C.violet }} />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: C.t1, margin: '0 0 8px', letterSpacing: '-.03em' }}>Build Your Workout Library</h3>
      <p style={{ fontSize: 13, color: C.t3, margin: '0 0 36px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65, fontWeight: 500 }}>
        Create workouts, assign them to clients, and track completion rates.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 560, margin: '0 auto 28px' }}>
        {templates.map((t, i) => {
          const tc = WORKOUT_TYPES[t.type];
          return (
            <div key={i}
              style={{ flex: '1 1 160px', maxWidth: 190, padding: '22px 16px', borderRadius: 14, textAlign: 'center', background: 'rgba(255,255,255,.025)', border: `1px solid ${C.brd}`, cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${tc.color}35`; e.currentTarget.style.background = `${tc.color}07`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.background = 'rgba(255,255,255,.025)'; }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, margin: '0 auto 12px', background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{t.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 5, letterSpacing: '-.01em' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55, fontWeight: 500 }}>{t.desc}</div>
            </div>
          );
        })}
      </div>
      <button onClick={onCreateNew}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 26px', borderRadius: 12, ...GRAD_BTN, fontSize: 13, fontWeight: 800, boxShadow: `0 2px 18px rgba(37,99,235,0.30)`, letterSpacing: '-.01em', cursor: 'pointer', fontFamily: FONT, outline: 'none', transition: 'opacity .14s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        <Plus style={{ width: 15, height: 15 }} /> Create Your First Workout
      </button>
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export default function TabCoachContent({
  events       = [],
  polls        = [],
  posts        = [],
  classes: gymClasses = [],
  checkIns     = [],
  avatarMap    = {},
  allMemberships = [],
  openModal,
  now,
  onDeletePost    = () => {},
  onDeleteEvent   = () => {},
  onDeleteClass   = () => {},
  onDeletePoll    = () => {},
  onDeleteRecap   = () => {},
  onDeleteShoutout = () => {},
}) {
  const isMobile = useIsMobile();

  // ── Workout state ──
  const [workouts,    setWorkouts]    = useState(() => {
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

  const saveWorkouts = u => {
    setWorkouts(u);
    try { localStorage.setItem('coachWorkoutLibrary', JSON.stringify(u)); } catch {}
  };

  const handleSave = draft => {
    const withDate = { ...draft, updated_at: new Date().toISOString() };
    const exists   = workouts.find(w => w.id === draft.id);
    saveWorkouts(exists ? workouts.map(w => w.id === draft.id ? withDate : w) : [withDate, ...workouts]);
    setEditorOpen(false);
    setEditingWO(null);
    if (selectedWO?.id === draft.id) setSelectedWO(withDate);
  };

  const handleDelete    = id  => { saveWorkouts(workouts.filter(w => w.id !== id)); if (selectedWO?.id === id) setSelectedWO(null); };
  const handleDuplicate = wo  => saveWorkouts([{ ...wo, id: uid(), name: `${wo.name} (copy)`, updated_at: new Date().toISOString() }, ...workouts]);
  const handleEdit      = wo  => { setEditingWO(wo); setEditorOpen(true); };
  const handleNew       = ()  => { setEditingWO(null); setEditorOpen(true); };

  // ── Workout stats ──
  const workoutStats = useMemo(() => {
    const stats = {};
    workouts.forEach(wo => {
      let assignedIds = [];
      try { const a = JSON.parse(localStorage.getItem('coachWorkoutAssignments') || '{}'); assignedIds = a[wo.id] || []; } catch {}
      const completedCount = assignedIds.filter(uid => checkIns.some(c => c.user_id === uid && (now - new Date(c.check_in_date)) < 30 * 864e5)).length;
      const completionRate = assignedIds.length > 0 ? Math.round((completedCount / assignedIds.length) * 100) : 0;
      const lastActivities = assignedIds.map(uid => {
        const last = checkIns.filter(c => c.user_id === uid).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        return last ? (now - new Date(last.check_in_date)) / 864e5 : 999;
      });
      stats[wo.id] = {
        assignedCount:     assignedIds.length,
        completionRate,
        daysSinceActivity: assignedIds.length === 0 ? 999 : Math.floor(Math.min(...lastActivities)),
        daysSinceUpdate:   wo.updated_at ? Math.floor((now - new Date(wo.updated_at)) / 864e5) : null,
        assignedMemberIds: assignedIds,
      };
    });
    return stats
  // ─────────────────────────────────────────────────────────────────────────────
// PASTE THIS DIRECTLY AFTER THE TRUNCATED LINE:
//   return stats
// (i.e. replace everything from "return stats" to end-of-file with this block)
// ─────────────────────────────────────────────────────────────────────────────

    return stats;
  }, [workouts, checkIns, now]);

  // ── Filtered + sorted workout list ─────────────────────────────────────────
  const displayedWorkouts = useMemo(() => {
    let list = workouts.filter(wo => {
      const matchSearch =
        !libSearch ||
        wo.name.toLowerCase().includes(libSearch.toLowerCase()) ||
        (WORKOUT_TYPES[wo.type]?.label || '').toLowerCase().includes(libSearch.toLowerCase());
      const matchType = typeFilter === 'all' || wo.type === typeFilter;
      return matchSearch && matchType;
    });

    list = [...list].sort((a, b) => {
      const sa = workoutStats[a.id] || {};
      const sb = workoutStats[b.id] || {};
      switch (sortBy) {
        case 'most_assigned':
          return (sb.assignedCount || 0) - (sa.assignedCount || 0);
        case 'least_engaged':
          if (sa.assignedCount === 0 && sb.assignedCount === 0) return 0;
          if (sa.assignedCount === 0) return 1;
          if (sb.assignedCount === 0) return -1;
          return (sa.completionRate || 0) - (sb.completionRate || 0);
        case 'recently_updated':
          return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
        case 'not_assigned':
          return (sa.assignedCount || 0) - (sb.assignedCount || 0);
        default: // 'name'
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  }, [workouts, workoutStats, libSearch, typeFilter, sortBy]);

  // ── Derived flags ───────────────────────────────────────────────────────────
  const showEditor = editorOpen;
  const showDetail = !showEditor && selectedWO;

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', minHeight: '100%', background: C.bg, fontFamily: FONT }}>

      {/* ── Main column ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Page header */}
        <div style={{
          padding: isMobile ? '16px 16px 12px' : '20px 24px 16px',
          borderBottom: `1px solid ${C.brd}`,
          background: C.bg,
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: C.violetDim, border: `1px solid ${C.violetBrd}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Dumbbell style={{ width: 15, height: 15, color: C.violet }} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-.02em', lineHeight: 1.2 }}>
                  Workout Library
                </div>
                <div style={{ fontSize: 11, color: C.t3, fontWeight: 500, marginTop: 2 }}>
                  {workouts.length} workout{workouts.length !== 1 ? 's' : ''} · Build, assign &amp; track
                </div>
              </div>
            </div>

            <button
              onClick={handleNew}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 10,
                ...GRAD_BTN,
                fontSize: 12, fontWeight: 800,
                boxShadow: '0 2px 14px rgba(37,99,235,0.30)',
                letterSpacing: '-.01em', cursor: 'pointer',
                fontFamily: FONT, outline: 'none',
                transition: 'opacity .14s', flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Plus style={{ width: 13, height: 13 }} /> New Workout
            </button>
          </div>

          {/* Search + filter row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 0 }}>
              <Search style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                width: 12, height: 12, color: C.t3, pointerEvents: 'none',
              }} />
              <input
                value={libSearch}
                onChange={e => setLibSearch(e.target.value)}
                placeholder="Search workouts…"
                style={{
                  width: '100%', padding: '8px 12px 8px 32px',
                  borderRadius: 8, background: 'rgba(255,255,255,.04)',
                  border: `1px solid ${C.brd}`, color: C.t1,
                  fontSize: 12, fontFamily: FONT, fontWeight: 500,
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'all .14s',
                }}
                onFocus={e => { e.target.style.borderColor = C.cyanBrd; e.target.style.background = 'rgba(77,127,255,.04)'; }}
                onBlur={e  => { e.target.style.borderColor = C.brd;     e.target.style.background = 'rgba(255,255,255,.04)'; }}
              />
            </div>

            {/* Type chips — hide overflow on mobile */}
            {!isMobile && (
              <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap' }}>
                {[{ key: 'all', label: 'All', emoji: '🗂' }, ...Object.entries(WORKOUT_TYPES).map(([k, v]) => ({ key: k, label: v.label, emoji: v.emoji }))].map(t => {
                  const active = typeFilter === t.key;
                  const tc2    = t.key !== 'all' ? WORKOUT_TYPES[t.key] : null;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTypeFilter(t.key)}
                      style={{
                        padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700,
                        background: active ? (tc2 ? tc2.bg : C.cyanDim) : 'transparent',
                        border: `1px solid ${active ? (tc2 ? tc2.border : C.cyanBrd) : C.brd}`,
                        color: active ? (tc2 ? tc2.color : C.cyan) : C.t3,
                        cursor: 'pointer', fontFamily: FONT, outline: 'none',
                        transition: 'all .14s',
                      }}
                    >
                      {t.emoji} {t.label}
                    </button>
                  );
                })}
              </div>
            )}

            <SortDropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
          </div>
        </div>

        {/* Page body */}
        <div style={{ flex: 1, padding: isMobile ? '16px' : '20px 24px', overflow: 'auto' }}>

          {/* Performance overview — hidden when editor is open */}
          {!showEditor && (
            <PerformanceOverview workouts={workouts} workoutStats={workoutStats} />
          )}

          {/* Needs attention banner */}
          {!showEditor && (
            <NeedsAttention
              workouts={workouts}
              workoutStats={workoutStats}
              onAssign={wo => setAssignWO(wo)}
              onEdit={handleEdit}
              openModal={openModal}
            />
          )}

          {/* ── Editor panel ── */}
          {showEditor && (
            <WorkoutEditor
              workout={editingWO}
              onSave={handleSave}
              onCancel={() => { setEditorOpen(false); setEditingWO(null); }}
            />
          )}

          {/* ── Detail panel ── */}
          {showDetail && !showEditor && (
            <div style={{ marginBottom: 20 }}>
              <WorkoutDetailPanel
                workout={selectedWO}
                stats={workoutStats[selectedWO.id] || { assignedCount: 0, completionRate: 0, daysSinceActivity: 999, daysSinceUpdate: null, assignedMemberIds: [] }}
                allMemberships={allMemberships}
                checkIns={checkIns}
                now={now}
                avatarMap={avatarMap}
                onEdit={handleEdit}
                onAssign={wo => setAssignWO(wo)}
                onClose={() => setSelectedWO(null)}
                openModal={openModal}
              />
            </div>
          )}

          {/* ── Workout grid ── */}
          {!showEditor && (
            workouts.length === 0 ? (
              <EmptyState onCreateNew={handleNew} />
            ) : displayedWorkouts.length === 0 ? (
              <div style={{
                padding: '56px 24px', textAlign: 'center',
                borderRadius: 14, background: C.card, border: `1px solid ${C.brd}`,
              }}>
                <Search style={{ width: 22, height: 22, color: C.t3, margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: C.t2, margin: '0 0 6px', letterSpacing: '-.01em' }}>
                  No workouts match your filters
                </p>
                <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>
                  Try adjusting the search or type filter
                </p>
              </div>
            ) : (
              <>
                {/* Result count */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                  <span style={{ fontSize: 11, color: C.t3, fontWeight: 600 }}>
                    {displayedWorkouts.length} workout{displayedWorkouts.length !== 1 ? 's' : ''}
                    {(libSearch || typeFilter !== 'all') && ' · filtered'}
                  </span>
                  {(libSearch || typeFilter !== 'all') && (
                    <button
                      onClick={() => { setLibSearch(''); setTypeFilter('all'); }}
                      style={{
                        fontSize: 11, fontWeight: 700, color: C.cyan,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: FONT, outline: 'none', padding: 0,
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : selectedWO
                      ? 'repeat(auto-fill, minmax(280px, 1fr))'
                      : 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 12,
                }}>
                  {displayedWorkouts.map(wo => (
                    <WorkoutCard
                      key={wo.id}
                      workout={wo}
                      stats={workoutStats[wo.id] || { assignedCount: 0, completionRate: 0, daysSinceActivity: 999, daysSinceUpdate: null }}
                      isSelected={selectedWO?.id === wo.id}
                      onSelect={w => setSelectedWO(prev => prev?.id === w.id ? null : w)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onAssign={wo => setAssignWO(wo)}
                    />
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>

      {/* ── Right sidebar — hidden on mobile ── */}
      {!isMobile && (
        <RightSidebar
          workouts={workouts}
          workoutStats={workoutStats}
          posts={posts}
          polls={polls}
          events={events}
          openModal={openModal}
        />
      )}

      {/* ── Assign modal ── */}
      {assignWO && (
        <AssignModal
          workout={assignWO}
          allMemberships={allMemberships}
          myClasses={gymClasses}
          avatarMap={avatarMap}
          onClose={() => setAssignWO(null)}
          openModal={openModal}
        />
      )}
    </div>
  );
}
