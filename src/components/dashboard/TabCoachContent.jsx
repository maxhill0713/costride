import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dumbbell, Plus, X, Check, Trash2, Copy,
  ChevronDown, ChevronUp, MoreHorizontal,
  Users, Calendar, Trophy, Zap, BookOpen,
  Play, Edit2, Search, Award, MessageSquarePlus,
  BarChart2, ClipboardList, Heart,
  MessageCircle, TrendingUp, AlertTriangle, CheckCircle,
  UserPlus, Activity, TrendingDown, Filter, ArrowUpDown,
  ArrowUpRight, ArrowDownRight, Sparkles, Lightbulb,
  Eye, Target, Flame, LayoutGrid, List, ChevronRight,
  RefreshCw, Send, XCircle, Minus, Shield,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('wps-css')) {
  const s = document.createElement('style');
  s.id = 'wps-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .wps { font-family: 'Instrument Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }

    @keyframes wpsFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
    @keyframes wpsSlideIn { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:none } }
    @keyframes wpsPulse { 0%,100% { opacity:.55 } 50% { opacity:1 } }
    @keyframes wpsGlow { 0%,100% { box-shadow:0 0 0 0 rgba(245,158,11,0) } 50% { box-shadow:0 0 0 4px rgba(245,158,11,.08) } }

    .wps-fade { animation: wpsFadeUp .3s cubic-bezier(.4,0,.2,1) both; }
    .wps-slide { animation: wpsSlideIn .25s cubic-bezier(.4,0,.2,1) both; }
    .wps-glow { animation: wpsGlow 2.5s ease infinite; }

    .wps-btn { font-family: 'Instrument Sans', sans-serif; cursor: pointer; outline: none;
               transition: all .15s cubic-bezier(.4,0,.2,1); border: none; }
    .wps-btn:active { transform: scale(.97); }

    .wps-card { transition: all .18s cubic-bezier(.4,0,.2,1); cursor: pointer; position: relative; }
    .wps-card:hover { border-color: rgba(99,102,241,.25) !important; transform: translateY(-1px); }
    .wps-card:hover .wps-card-actions { opacity: 1; pointer-events: auto; }
    .wps-card-actions { opacity: 0; pointer-events: none; transition: opacity .15s; }

    .wps-input { width: 100%; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
                 color: #e2e8f0; font-size: 13px; font-family: 'Instrument Sans', sans-serif;
                 outline: none; border-radius: 10px; padding: 10px 14px; transition: all .15s; }
    .wps-input:focus { border-color: rgba(99,102,241,.4); background: rgba(255,255,255,.04);
                       box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
    .wps-input::placeholder { color: rgba(148,163,184,.4); }

    .wps-select { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
                  color: #e2e8f0; font-size: 12px; font-family: 'Instrument Sans', sans-serif;
                  outline: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; appearance: none; }

    .wps-tooltip { position: relative; }
    .wps-tooltip::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 6px);
      left: 50%; transform: translateX(-50%); background: #1e293b; color: #e2e8f0;
      font-size: 11px; padding: 5px 10px; border-radius: 6px; white-space: nowrap;
      opacity: 0; pointer-events: none; transition: opacity .15s; z-index: 50;
      border: 1px solid rgba(255,255,255,.08); }
    .wps-tooltip:hover::after { opacity: 1; }

    .wps-exercise-row:hover .wps-ex-del { opacity: 1; }
    .wps-ex-del { opacity: 0; transition: opacity .12s; }

    .wps-grid { display: grid; grid-template-columns: minmax(0,1fr) 280px; gap: 16px; align-items: start; }
    @media (max-width: 1024px) {
      .wps-grid { grid-template-columns: 1fr !important; }
      .wps-sidebar { display: none !important; }
      .wps-perf-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 640px) {
      .wps-perf-grid { grid-template-columns: 1fr !important; }
      .wps-controls { flex-direction: column !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:       '#06090f',
  surface:  '#0b1121',
  surfaceH: '#0e1528',
  card:     '#0d1424',
  border:   'rgba(255,255,255,.05)',
  borderH:  'rgba(255,255,255,.09)',
  borderA:  'rgba(255,255,255,.12)',

  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#1e293b',

  emerald:    '#10b981',
  emeraldDim: 'rgba(16,185,129,.08)',
  emeraldBdr: 'rgba(16,185,129,.18)',

  indigo:    '#6366f1',
  indigoDim: 'rgba(99,102,241,.08)',
  indigoBdr: 'rgba(99,102,241,.18)',

  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,.07)',
  amberBdr: 'rgba(245,158,11,.16)',

  red:      '#ef4444',
  redDim:   'rgba(239,68,68,.07)',
  redBdr:   'rgba(239,68,68,.16)',

  sky:      '#38bdf8',
  skyDim:   'rgba(56,189,248,.07)',
  skyBdr:   'rgba(56,189,248,.16)',

  violet:   '#a78bfa',
  violetDim:'rgba(167,139,250,.08)',
  violetBdr:'rgba(167,139,250,.18)',

  mono: "'JetBrains Mono', monospace",
};

// ─── WORKOUT TYPE CONFIG ──────────────────────────────────────────────────────
const WORKOUT_TYPES = {
  hiit:       { label: 'HIIT',       color: '#f87171', bg: 'rgba(248,113,113,.08)', border: 'rgba(248,113,113,.18)', emoji: '⚡' },
  strength:   { label: 'Strength',   color: '#818cf8', bg: 'rgba(129,140,248,.08)', border: 'rgba(129,140,248,.18)', emoji: '🏋️' },
  yoga:       { label: 'Yoga',       color: '#34d399', bg: 'rgba(52,211,153,.08)',  border: 'rgba(52,211,153,.18)',  emoji: '🧘' },
  cardio:     { label: 'Cardio',     color: '#38bdf8', bg: 'rgba(56,189,248,.08)',  border: 'rgba(56,189,248,.18)',  emoji: '🏃' },
  core:       { label: 'Core',       color: '#fbbf24', bg: 'rgba(251,191,36,.08)',  border: 'rgba(251,191,36,.18)',  emoji: '🎯' },
  beginner:   { label: 'Beginner',   color: '#a78bfa', bg: 'rgba(167,139,250,.08)', border: 'rgba(167,139,250,.18)', emoji: '🌱' },
  stretching: { label: 'Stretching', color: '#2dd4bf', bg: 'rgba(45,212,191,.08)',  border: 'rgba(45,212,191,.18)',  emoji: '🤸' },
};

// ─── DEFAULT WORKOUTS ─────────────────────────────────────────────────────────
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
    warmup: [{ id: 'e17', name: 'March in place', sets: '', reps: '2 min' }, { id: 'e18', name: 'Arm circles', sets: '', reps: '30s each direction' }],
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

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function Pill({ children, color = T.t3, bg, border, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color,
      background: bg || `${color}0d`, border: `1px solid ${border || `${color}22`}`,
      borderRadius: 6, padding: '2px 8px', letterSpacing: '.02em',
      textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: '16px',
      ...style,
    }}>{children}</span>
  );
}

function Mono({ children, style }) {
  return <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 500, letterSpacing: '-.02em', ...style }}>{children}</span>;
}

function HealthBar({ segments, height = 5 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 2, height, borderRadius: 99, overflow: 'hidden' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{
          flex: seg.value / total, background: seg.color, borderRadius: 99,
          minWidth: seg.value > 0 ? 3 : 0, transition: 'flex .4s cubic-bezier(.4,0,.2,1)',
        }} />
      ))}
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getHealth(completionRate, assignedCount, daysSinceUpdate) {
  if (assignedCount === 0) return { label: 'Not Assigned', color: T.t3,      bg: 'rgba(100,116,139,.06)', bdr: 'rgba(100,116,139,.12)' };
  if (completionRate >= 70 && daysSinceUpdate < 30) return { label: 'Performing', color: T.emerald, bg: T.emeraldDim, bdr: T.emeraldBdr };
  if (completionRate >= 40 || daysSinceUpdate < 60) return { label: 'Needs Review', color: T.amber, bg: T.amberDim, bdr: T.amberBdr };
  return { label: 'Low Engagement', color: T.red, bg: T.redDim, bdr: T.redBdr };
}

function completionColor(rate) {
  if (rate >= 70) return T.emerald;
  if (rate >= 40) return T.amber;
  return T.red;
}

// ─── 3-DOT MENU ──────────────────────────────────────────────────────────────
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
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button className="wps-btn" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, borderRadius: 8,
          color: T.t3,
        }}>
        <MoreHorizontal style={{ width: 13, height: 13 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 32, right: 0, zIndex: 9999,
          background: T.card, border: `1px solid ${T.borderA}`,
          borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.5)',
          minWidth: 140, overflow: 'hidden',
        }}>
          {items.map((item, i) => (
            <button key={i} className="wps-btn" onClick={e => { e.stopPropagation(); setOpen(false); item.action(); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', fontSize: 12, fontWeight: 600,
                color: item.danger ? T.red : T.t1, background: 'transparent', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = item.danger ? T.redDim : 'rgba(255,255,255,.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <item.icon style={{ width: 12, height: 12 }} /> {item.label}
            </button>
          ))}
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
    ? Math.round(workouts.filter(w => workoutStats[w.id]?.assignedCount > 0).reduce((s, w) => s + (workoutStats[w.id]?.completionRate || 0), 0) / assigned)
    : 0;
  const needsAttention = workouts.filter(w => {
    const s = workoutStats[w.id];
    if (!s) return false;
    return (s.assignedCount > 0 && s.completionRate < 40) || (s.assignedCount > 0 && s.daysSinceActivity > 14);
  }).length;

  // Best performing type
  const typePerf = {};
  workouts.forEach(w => {
    const s = workoutStats[w.id];
    if (!s || s.assignedCount === 0) return;
    if (!typePerf[w.type]) typePerf[w.type] = { total: 0, sum: 0 };
    typePerf[w.type].total++;
    typePerf[w.type].sum += s.completionRate;
  });
  const bestType = Object.entries(typePerf).sort((a, b) => (b[1].sum / b[1].total) - (a[1].sum / a[1].total))[0];

  return (
    <div className="wps-fade" style={{ marginBottom: 20 }}>
      <div className="wps-perf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
        {/* Library size */}
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: `linear-gradient(135deg, ${T.surface}, ${T.card})`,
          border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100,
            background: `radial-gradient(circle at top right, ${T.indigo}06, transparent 70%)` }} />
          <div style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em',
            textTransform: 'uppercase', marginBottom: 12 }}>Workout Library</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 38, fontWeight: 700, color: T.t1,
              lineHeight: 1, letterSpacing: '-.04em' }}>{total}</span>
            <span style={{ fontSize: 12, color: T.t3 }}>workouts</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <HealthBar height={5} segments={[
              { value: assigned, color: T.emerald },
              { value: unassigned, color: T.t3 },
            ]} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 10, color: T.emerald }}>{assigned} assigned</span>
              <span style={{ fontSize: 10, color: T.t3 }}>{unassigned} unused</span>
            </div>
          </div>
        </div>

        {/* Avg Completion */}
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: T.surface, border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: completionColor(avgCompletion) }} />
            <span style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em',
              textTransform: 'uppercase' }}>Avg Completion</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: T.mono, fontSize: 38, fontWeight: 700,
              color: assigned > 0 ? completionColor(avgCompletion) : T.t3,
              lineHeight: 1, letterSpacing: '-.04em' }}>
              {assigned > 0 ? avgCompletion : '—'}
            </span>
            {assigned > 0 && <span style={{ fontSize: 14, fontWeight: 700, color: completionColor(avgCompletion) }}>%</span>}
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>
            {avgCompletion >= 70 ? 'Strong engagement' : avgCompletion >= 40 ? 'Room for improvement' : assigned > 0 ? 'Needs attention' : 'No data yet'}
          </div>
        </div>

        {/* Needs Attention */}
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: needsAttention > 0 ? T.amberDim : T.surface,
          border: `1px solid ${needsAttention > 0 ? T.amberBdr : T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: needsAttention > 0 ? T.amber : T.t3 }} />
            <span style={{ fontSize: 10, color: needsAttention > 0 ? T.amber : T.t3, fontWeight: 600,
              letterSpacing: '.06em', textTransform: 'uppercase' }}>Need Review</span>
          </div>
          <span style={{ fontFamily: T.mono, fontSize: 38, fontWeight: 700,
            color: needsAttention > 0 ? T.amber : T.t3, lineHeight: 1, letterSpacing: '-.04em' }}>
            {needsAttention}
          </span>
          <div style={{ fontSize: 11, color: needsAttention > 0 ? T.amber : T.t3, marginTop: 6,
            fontWeight: needsAttention > 0 ? 600 : 400 }}>
            {needsAttention > 0 ? 'Low completion or inactive' : 'All workouts healthy'}
          </div>
        </div>

        {/* Top Performing Type */}
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: T.surface, border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em',
            textTransform: 'uppercase', marginBottom: 12 }}>Best Performing</div>
          {bestType ? (() => {
            const tc = WORKOUT_TYPES[bestType[0]] || WORKOUT_TYPES.strength;
            const avg = Math.round(bestType[1].sum / bestType[1].total);
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{tc.emoji}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: tc.color }}>{tc.label}</span>
                </div>
                <div style={{ fontSize: 11, color: T.t3 }}>
                  <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.emerald }}>{avg}%</span> avg completion
                </div>
              </div>
            );
          })() : (
            <div style={{ fontSize: 12, color: T.t3 }}>Assign workouts to see data</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NEEDS ATTENTION SECTION ──────────────────────────────────────────────────
function NeedsAttention({ workouts, workoutStats, onAssign, onEdit, openModal }) {
  const alerts = useMemo(() => {
    const items = [];
    workouts.forEach(wo => {
      const s = workoutStats[wo.id];
      if (!s) return;
      if (s.assignedCount === 0) {
        items.push({ type: 'unassigned', workout: wo, reason: 'Not assigned to any clients', actionLabel: 'Assign now', actionFn: () => onAssign(wo), color: T.t3, icon: Users });
      } else if (s.completionRate < 40 && s.assignedCount > 0) {
        items.push({ type: 'low_completion', workout: wo, reason: `Only ${s.completionRate}% completion`, actionLabel: 'Follow up', actionFn: () => openModal('post'), color: T.red, icon: TrendingDown });
      } else if (s.daysSinceActivity > 14 && s.assignedCount > 0) {
        items.push({ type: 'inactive', workout: wo, reason: `No activity in ${s.daysSinceActivity}d`, actionLabel: 'Send reminder', actionFn: () => openModal('post'), color: T.amber, icon: AlertTriangle });
      } else if ((s.daysSinceUpdate ?? 999) > 60) {
        items.push({ type: 'stale', workout: wo, reason: 'Not updated in 60+ days', actionLabel: 'Review & refresh', actionFn: () => onEdit(wo), color: T.amber, icon: RefreshCw });
      }
    });
    return items.slice(0, 5);
  }, [workouts, workoutStats]);

  if (alerts.length === 0) return null;

  return (
    <div className="wps-fade" style={{ marginBottom: 20, animationDelay: '.05s' }}>
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${T.amberBdr}`,
        background: `linear-gradient(135deg, ${T.amberDim}, ${T.surface})`,
      }}>
        <div style={{
          padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${T.amberBdr}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="wps-glow" style={{ width: 8, height: 8, borderRadius: '50%', background: T.amber }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>Needs Attention</span>
            <Pill color={T.amber}>{alerts.length} workout{alerts.length > 1 ? 's' : ''}</Pill>
          </div>
          <span style={{ fontSize: 10, color: T.t3 }}>Sorted by impact</span>
        </div>

        <div style={{ padding: '6px' }}>
          {alerts.map((alert, i) => {
            const tc = WORKOUT_TYPES[alert.workout.type] || WORKOUT_TYPES.strength;
            const Ic = alert.icon;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 10,
                transition: 'background .12s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.015)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: tc.bg, border: `1px solid ${tc.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{tc.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, marginBottom: 2 }}>{alert.workout.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: alert.color, fontWeight: 500 }}>
                    <Ic style={{ width: 10, height: 10 }} /> {alert.reason}
                  </div>
                </div>
                <button className="wps-btn" onClick={e => { e.stopPropagation(); alert.actionFn?.(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', borderRadius: 8,
                    background: `${alert.color}12`, border: `1px solid ${alert.color}22`,
                    color: alert.color, fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
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

// ─── WORKOUT CARD (REDESIGNED) ────────────────────────────────────────────────
function WorkoutCard({ workout, stats, isSelected, onSelect, onEdit, onDelete, onDuplicate, onAssign }) {
  const tc = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;
  const health = getHealth(stats.completionRate, stats.assignedCount, stats.daysSinceUpdate ?? 999);

  return (
    <div className="wps-card" onClick={() => onSelect(workout)}
      style={{
        borderRadius: 14, overflow: 'hidden',
        background: isSelected ? `${tc.color}04` : T.surface,
        border: `1px solid ${isSelected ? `${tc.color}30` : T.border}`,
      }}>
      {/* Color strip */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${tc.color}, ${tc.color}44)` }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: tc.bg, border: `1px solid ${tc.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
            }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, letterSpacing: '-.02em', lineHeight: 1.2 }}>{workout.name}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                <Pill color={tc.color} bg={tc.bg} border={tc.border} style={{ fontSize: 9 }}>{tc.label}</Pill>
                {workout.duration && <span style={{ fontSize: 10, color: T.t3 }}>⏱ {workout.duration}min</span>}
              </div>
            </div>
          </div>
          <div className="wps-card-actions">
            <DotMenu items={[
              { icon: Edit2, label: 'Edit', action: () => onEdit(workout) },
              { icon: Copy, label: 'Duplicate', action: () => onDuplicate(workout) },
              { icon: Trash2, label: 'Delete', action: () => onDelete(workout.id), danger: true },
            ]} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
          marginBottom: 10, padding: '10px', borderRadius: 10,
          background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.sky, lineHeight: 1 }}>{stats.assignedCount}</div>
            <div style={{ fontSize: 8, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3 }}>Clients</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700,
              color: stats.assignedCount === 0 ? T.t3 : completionColor(stats.completionRate), lineHeight: 1 }}>
              {stats.assignedCount === 0 ? '—' : `${stats.completionRate}%`}
            </div>
            <div style={{ fontSize: 8, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3 }}>Done</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.violet, lineHeight: 1 }}>
              {stats.daysSinceUpdate === null ? '—' : stats.daysSinceUpdate === 0 ? 'Now' : `${stats.daysSinceUpdate}d`}
            </div>
            <div style={{ fontSize: 8, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3 }}>Updated</div>
          </div>
        </div>

        {/* Health + difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Pill color={health.color} bg={health.bg} border={health.bdr} style={{ fontSize: 9 }}>{health.label}</Pill>
          {workout.difficulty && <span style={{ fontSize: 10, color: T.t3 }}>{workout.difficulty}</span>}
        </div>

        {/* Exercise preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
          {workout.main.slice(0, 2).map((ex, i) => (
            <div key={i} style={{ fontSize: 11, color: T.t3, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: tc.color, flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
              {(ex.sets || ex.reps) && (
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.t3, flexShrink: 0 }}>
                  {ex.sets ? `${ex.sets}×${ex.reps}` : ex.reps}
                </span>
              )}
            </div>
          ))}
          {workout.main.length > 2 && (
            <span style={{ fontSize: 10, color: T.t4, paddingLeft: 9 }}>+{workout.main.length - 2} more</span>
          )}
        </div>

        {/* Assign CTA */}
        <button className="wps-btn" onClick={e => { e.stopPropagation(); onAssign(workout); }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px', borderRadius: 10,
            background: `${tc.color}0a`, border: `1px solid ${tc.color}1a`,
            color: tc.color, fontSize: 12, fontWeight: 700,
          }}
          onMouseEnter={e => e.currentTarget.style.background = `${tc.color}18`}
          onMouseLeave={e => e.currentTarget.style.background = `${tc.color}0a`}>
          <Play style={{ width: 12, height: 12 }} /> Assign
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
      const m = allMemberships.find(x => x.user_id === uid) || { user_id: uid, user_name: 'Client' };
      const r30 = checkIns.filter(c => c.user_id === uid && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
      const lastCI = checkIns.filter(c => c.user_id === uid).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      const daysAgo = lastCI ? Math.floor((now - new Date(lastCI.check_in_date)) / 864e5) : null;
      const engStatus = daysAgo === null ? 'never' : daysAgo > 14 ? 'inactive' : daysAgo > 7 ? 'low' : 'active';
      const engColor = { active: T.emerald, low: T.amber, inactive: T.red, never: T.t3 }[engStatus];
      const engLabel = { active: 'Active', low: 'Low activity', inactive: 'Inactive', never: 'Never visited' }[engStatus];
      return { ...m, r30, daysAgo, engStatus, engColor, engLabel };
    });
  }, [stats.assignedMemberIds, allMemberships, checkIns, now]);

  const suggestions = useMemo(() => {
    return allMemberships.filter(m => {
      if (stats.assignedMemberIds.includes(m.user_id)) return false;
      const r30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
      return r30 >= 2;
    }).slice(0, 4);
  }, [allMemberships, stats.assignedMemberIds, checkIns, now]);

  return (
    <div className="wps-slide" style={{
      borderRadius: 14, overflow: 'hidden',
      background: T.surface, border: `1px solid ${tc.color}25`,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 14px',
        background: `${tc.color}04`, borderBottom: `1px solid ${tc.color}15`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: tc.bg, border: `1px solid ${tc.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: T.t1, letterSpacing: '-.03em' }}>{workout.name}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                <Pill color={tc.color} bg={tc.bg} border={tc.border}>{tc.label}</Pill>
                {workout.difficulty && <span style={{ fontSize: 11, color: T.t3 }}>{workout.difficulty}</span>}
                {workout.duration && <span style={{ fontSize: 11, color: T.t3 }}>⏱ {workout.duration}min</span>}
                <Pill color={health.color} bg={health.bg} border={health.bdr}>{health.label}</Pill>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <button className="wps-btn" onClick={() => onEdit(workout)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9,
              background: `${tc.color}0a`, border: `1px solid ${tc.color}20`,
              color: tc.color, fontSize: 12, fontWeight: 700,
            }}>
              <Edit2 style={{ width: 12, height: 12 }} /> Edit
            </button>
            <button className="wps-btn" onClick={() => onAssign(workout)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9,
              background: tc.color, border: 'none',
              color: '#fff', fontSize: 12, fontWeight: 700,
              boxShadow: `0 2px 12px ${tc.color}30`,
            }}>
              <UserPlus style={{ width: 12, height: 12 }} /> Assign
            </button>
            <button className="wps-btn" onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'rgba(255,255,255,.04)',
              border: `1px solid ${T.border}`, color: T.t3,
            }}>
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Clients', value: stats.assignedCount, color: T.sky },
            { label: 'Completion', value: stats.assignedCount === 0 ? '—' : `${stats.completionRate}%`, color: stats.assignedCount > 0 ? completionColor(stats.completionRate) : T.t3 },
            { label: 'Last activity', value: stats.daysSinceActivity >= 999 ? 'Never' : `${stats.daysSinceActivity}d ago`, color: stats.daysSinceActivity > 14 ? T.red : T.emerald },
            { label: 'Updated', value: stats.daysSinceUpdate === null ? '—' : stats.daysSinceUpdate === 0 ? 'Today' : `${stats.daysSinceUpdate}d ago`, color: T.violet },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 10, textAlign: 'center',
              background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
            }}>
              <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, padding: '0 8px' }}>
        {[
          { id: 'clients', label: `Clients (${stats.assignedCount})`, icon: Users },
          { id: 'exercises', label: `Exercises (${workout.main.length})`, icon: Dumbbell },
          { id: 'suggest', label: `Suggestions (${suggestions.length})`, icon: Lightbulb },
        ].map(t => {
          const Ic = t.icon;
          return (
            <button key={t.id} className="wps-btn" onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '11px 8px',
              background: 'none',
              borderBottom: `2px solid ${tab === t.id ? tc.color : 'transparent'}`,
              color: tab === t.id ? tc.color : T.t3,
              fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              marginBottom: -1,
            }}>
              <Ic style={{ width: 11, height: 11 }} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px 20px' }}>
        {tab === 'clients' && (
          assignedClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <Users style={{ width: 22, height: 22, color: T.t3, margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: T.t2, fontWeight: 600, margin: '0 0 12px' }}>No clients assigned yet</p>
              <button className="wps-btn" onClick={() => onAssign(workout)} style={{
                fontSize: 12, fontWeight: 700, color: tc.color,
                background: `${tc.color}0d`, border: `1px solid ${tc.color}20`,
                borderRadius: 9, padding: '9px 18px',
              }}>Assign to clients</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {assignedClients.map((m, i) => (
                <div key={m.user_id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 11,
                  background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                  transition: 'background .12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.035)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                    background: `${m.engColor}0d`, border: `1px solid ${m.engColor}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: m.engColor,
                  }}>
                    {avatarMap?.[m.user_id]
                      ? <img src={avatarMap[m.user_id]} alt={m.user_name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                      : (m.user_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                      <Pill color={m.engColor} style={{ fontSize: 8, padding: '1px 6px' }}>{m.engLabel}</Pill>
                      <span style={{ fontSize: 10, color: T.t3 }}>
                        {m.daysAgo === null ? 'Never visited' : m.daysAgo === 0 ? 'Today' : `${m.daysAgo}d ago`}
                      </span>
                    </div>
                  </div>
                  {m.engStatus !== 'active' && (
                    <button className="wps-btn" onClick={() => openModal('post', { memberId: m.user_id })} style={{
                      fontSize: 10, fontWeight: 700, color: T.sky,
                      background: T.skyDim, border: `1px solid ${T.skyBdr}`,
                      borderRadius: 7, padding: '5px 10px', flexShrink: 0,
                    }}>Follow up</button>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'exercises' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12 }}>
            {[
              { title: 'Warmup', exercises: workout.warmup, accent: T.sky, emoji: '🔥' },
              { title: 'Main Workout', exercises: workout.main, accent: tc.color, emoji: tc.emoji },
              { title: 'Cooldown', exercises: workout.cooldown, accent: T.emerald, emoji: '❄️' },
            ].map((sec, si) => (
              <div key={si} style={{
                borderRadius: 12, padding: '14px',
                background: `${sec.accent}04`, border: `1px solid ${sec.accent}12`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: sec.accent, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                  {sec.emoji} {sec.title}
                </div>
                {sec.exercises.length === 0
                  ? <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>—</p>
                  : sec.exercises.map((ex, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: sec.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: T.t2, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                      {(ex.sets || ex.reps) && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, flexShrink: 0 }}>{ex.sets ? `${ex.sets}×${ex.reps}` : ex.reps}</span>}
                    </div>
                  ))
                }
              </div>
            ))}
            {workout.notes && (
              <div style={{ gridColumn: '1 / -1', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`, fontSize: 12, color: T.t3, lineHeight: 1.55 }}>
                📝 {workout.notes}
              </div>
            )}
          </div>
        )}

        {tab === 'suggest' && (
          suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle style={{ width: 20, height: 20, color: T.emerald, margin: '0 auto 8px' }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: T.emerald, margin: 0 }}>All active clients are assigned</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: T.t3, marginBottom: 10 }}>
                Active clients not yet assigned this workout.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {suggestions.map((m, i) => {
                  const r30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
                  return (
                    <div key={m.user_id || i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 11,
                      background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                        background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: T.emerald,
                      }}>
                        {avatarMap?.[m.user_id]
                          ? <img src={avatarMap[m.user_id]} alt={m.user_name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.currentTarget.style.display = 'none'} />
                          : (m.user_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{m.user_name || 'Client'}</div>
                        <div style={{ fontSize: 10, color: T.t3 }}>{r30} visits this month</div>
                      </div>
                      <button className="wps-btn" onClick={() => onAssign(workout)} style={{
                        fontSize: 10, fontWeight: 700, color: tc.color,
                        background: `${tc.color}0d`, border: `1px solid ${tc.color}20`,
                        borderRadius: 7, padding: '5px 10px', flexShrink: 0,
                      }}>Assign</button>
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

// ─── INSIGHTS PANEL ───────────────────────────────────────────────────────────
function InsightsPanel({ workouts, workoutStats }) {
  const unassigned = workouts.filter(w => (workoutStats[w.id]?.assignedCount || 0) === 0);
  const lowEngagement = workouts.filter(w => {
    const s = workoutStats[w.id];
    return s && s.assignedCount > 0 && s.completionRate < 40;
  });

  // Best type
  const typePerf = {};
  workouts.forEach(w => {
    const s = workoutStats[w.id];
    if (!s || s.assignedCount === 0) return;
    if (!typePerf[w.type]) typePerf[w.type] = { total: 0, sum: 0 };
    typePerf[w.type].total++;
    typePerf[w.type].sum += s.completionRate;
  });
  const bestEntry = Object.entries(typePerf).sort((a, b) => (b[1].sum / b[1].total) - (a[1].sum / a[1].total))[0];

  const insights = [
    bestEntry && {
      icon: TrendingUp, color: T.emerald,
      text: `${WORKOUT_TYPES[bestEntry[0]]?.label || bestEntry[0]} workouts have the highest completion rate (${Math.round(bestEntry[1].sum / bestEntry[1].total)}%)`,
    },
    unassigned.length > 0 && {
      icon: AlertTriangle, color: T.amber,
      text: `${unassigned.length} workout${unassigned.length > 1 ? 's are' : ' is'} never used — assign or archive them`,
    },
    lowEngagement.length > 0 && {
      icon: TrendingDown, color: T.red,
      text: `${lowEngagement.length} workout${lowEngagement.length > 1 ? 's have' : ' has'} completion below 40%`,
    },
    {
      icon: Lightbulb, color: T.sky,
      text: 'Clients assigned structured programmes retain 2.4× longer',
    },
    workouts.length >= 4 && {
      icon: Sparkles, color: T.violet,
      text: 'Variety matters — offer at least one workout per training style',
    },
  ].filter(Boolean).slice(0, 4);

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: T.surface, border: `1px solid ${T.border}`,
    }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 7 }}>
        <Sparkles style={{ width: 12, height: 12, color: T.violet }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t1, letterSpacing: '.02em' }}>Insights</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {insights.map((ins, i) => {
          const Ic = ins.icon;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 8px', borderRadius: 8,
              transition: 'background .12s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${ins.color}0d`, border: `1px solid ${ins.color}1a`,
              }}>
                <Ic style={{ width: 11, height: 11, color: ins.color }} />
              </div>
              <span style={{ fontSize: 12, color: T.t2, lineHeight: 1.5, flex: 1 }}>{ins.text}</span>
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
  workouts.forEach(w => { counts[w.type] = (counts[w.type] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{
      borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginBottom: 14, letterSpacing: '.02em' }}>
        Library Breakdown
      </div>
      {sorted.map(([type, count], i, arr) => {
        const tc = WORKOUT_TYPES[type] || WORKOUT_TYPES.strength;
        const pct = Math.round((count / workouts.length) * 100);
        return (
          <div key={type} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>{tc.emoji}</span>
                <span style={{ fontSize: 11, color: T.t2 }}>{tc.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: tc.color }}>{count}</span>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t3 }}>{pct}%</span>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: tc.color, width: `${pct}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
            </div>
          </div>
        );
      })}
      <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: T.t2 }}>Total</span>
        <span style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.t1 }}>{workouts.length}</span>
      </div>
    </div>
  );
}

// ─── EXERCISE ROW (EDITOR) ────────────────────────────────────────────────────
function ExerciseRow({ ex, onChange, onDelete }) {
  const inputS = {
    padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,.03)',
    border: `1px solid ${T.border}`, color: T.t1, fontSize: 12,
    outline: 'none', fontFamily: 'inherit',
  };
  return (
    <div className="wps-exercise-row" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 10px', borderRadius: 9,
      background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
      marginBottom: 5,
    }}>
      <Dumbbell style={{ width: 11, height: 11, color: T.t3, flexShrink: 0 }} />
      <input value={ex.name} onChange={e => onChange({ ...ex, name: e.target.value })}
        placeholder="Exercise name" style={{ ...inputS, flex: 1 }} />
      <input value={ex.sets} onChange={e => onChange({ ...ex, sets: e.target.value })}
        placeholder="Sets" style={{ ...inputS, width: 48 }} />
      <span style={{ fontSize: 10, color: T.t3 }}>×</span>
      <input value={ex.reps} onChange={e => onChange({ ...ex, reps: e.target.value })}
        placeholder="Reps / time" style={{ ...inputS, width: 84 }} />
      <button className="wps-btn wps-ex-del" onClick={onDelete}
        style={{ background: 'none', color: T.red, padding: 0, display: 'flex' }}>
        <X style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}

// ─── SECTION BLOCK (EDITOR) ──────────────────────────────────────────────────
function SectionBlock({ title, accent, exercises, onChange, icon: Icon }) {
  const addEx = () => onChange([...exercises, { id: uid(), name: '', sets: '', reps: '' }]);
  const updateEx = (idx, ex) => { const u = [...exercises]; u[idx] = ex; onChange(u); };
  const deleteEx = (idx) => onChange(exercises.filter((_, i) => i !== idx));

  return (
    <div style={{
      borderRadius: 12, padding: '14px', marginBottom: 10,
      background: `${accent}04`, border: `1px solid ${accent}12`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: `${accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon style={{ width: 12, height: 12, color: accent }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>{title}</span>
        <span style={{ fontSize: 10, color: T.t3 }}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
      </div>
      {exercises.map((ex, i) => (
        <ExerciseRow key={ex.id || i} ex={ex} onChange={u => updateEx(i, u)} onDelete={() => deleteEx(i)} />
      ))}
      <button className="wps-btn" onClick={addEx} style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, color: accent,
        background: `${accent}08`, border: `1px solid ${accent}18`,
        borderRadius: 8, padding: '6px 12px', marginTop: 4,
      }}>
        <Plus style={{ width: 10, height: 10 }} /> Add exercise
      </button>
    </div>
  );
}

// ─── WORKOUT EDITOR ───────────────────────────────────────────────────────────
function WorkoutEditor({ workout, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => workout
    ? { ...workout, warmup: [...workout.warmup], main: [...workout.main], cooldown: [...workout.cooldown] }
    : { id: uid(), name: '', type: 'strength', duration: 45, difficulty: 'Intermediate', warmup: [], main: [], cooldown: [], notes: '' }
  );

  const tc = WORKOUT_TYPES[draft.type] || WORKOUT_TYPES.strength;

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: T.surface, border: `1px solid ${tc.color}25`,
    }}>
      <div style={{
        padding: '16px 20px 14px',
        background: `${tc.color}04`, borderBottom: `1px solid ${tc.color}15`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: tc.bg, border: `1px solid ${tc.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>{tc.emoji}</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.t1 }}>{workout ? 'Edit Workout' : 'New Workout'}</span>
          </div>
          <button className="wps-btn" onClick={onCancel} style={{
            width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(255,255,255,.04)',
            border: `1px solid ${T.border}`, color: T.t3,
          }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 130px', gap: 8, marginBottom: 12 }}>
          <input className="wps-input" value={draft.name}
            onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
            placeholder="Workout name" style={{ padding: '9px 12px' }} />
          <input className="wps-input" value={draft.duration}
            onChange={e => setDraft(p => ({ ...p, duration: e.target.value }))}
            placeholder="Mins" type="number" style={{ padding: '9px 12px' }} />
          <select className="wps-select" value={draft.difficulty}
            onChange={e => setDraft(p => ({ ...p, difficulty: e.target.value }))}>
            {['Beginner', 'Intermediate', 'Advanced', 'Elite'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Object.entries(WORKOUT_TYPES).map(([key, t]) => (
            <button key={key} className="wps-btn" onClick={() => setDraft(p => ({ ...p, type: key }))}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: draft.type === key ? t.bg : 'transparent',
                border: `1px solid ${draft.type === key ? t.border : T.border}`,
                color: draft.type === key ? t.color : T.t3,
              }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <SectionBlock title="Warmup" accent={T.sky} icon={Play} exercises={draft.warmup}
          onChange={v => setDraft(p => ({ ...p, warmup: v }))} />
        <SectionBlock title="Main Workout" accent={tc.color} icon={Dumbbell} exercises={draft.main}
          onChange={v => setDraft(p => ({ ...p, main: v }))} />
        <SectionBlock title="Cooldown" accent={T.emerald} icon={Heart} exercises={draft.cooldown}
          onChange={v => setDraft(p => ({ ...p, cooldown: v }))} />

        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Coaching Notes</div>
          <textarea className="wps-input" value={draft.notes}
            onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))}
            placeholder="Tips, modifications, cues, equipment needed…"
            style={{ minHeight: 60, resize: 'vertical', lineHeight: 1.5 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="wps-btn" onClick={onCancel} style={{
            flex: 1, padding: '10px', borderRadius: 10,
            background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`,
            color: T.t3, fontSize: 12, fontWeight: 700,
          }}>Cancel</button>
          <button className="wps-btn" onClick={() => onSave(draft)} disabled={!draft.name.trim()}
            style={{
              flex: 2, padding: '10px', borderRadius: 10,
              background: draft.name.trim() ? tc.color : 'rgba(255,255,255,.03)',
              border: 'none',
              color: draft.name.trim() ? '#fff' : T.t3,
              fontSize: 12, fontWeight: 700,
              boxShadow: draft.name.trim() ? `0 2px 12px ${tc.color}30` : 'none',
              cursor: draft.name.trim() ? 'pointer' : 'not-allowed',
            }}>
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
    if (tab === 'member') return allMemberships.filter(m => !search || (m.user_name || '').toLowerCase().includes(search.toLowerCase())).slice(0, 12);
    if (tab === 'class') return myClasses.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()));
    return [];
  }, [tab, search, allMemberships, myClasses]);

  const toggle = (id) => setAssigned(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto',
        borderRadius: 20, background: T.card,
        border: `1px solid ${T.borderA}`,
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '18px 22px 14px', borderBottom: `1px solid ${T.border}`,
          position: 'sticky', top: 0, background: T.card, zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.t1 }}>Assign Workout</div>
              <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{workout.name} · {workout.main.length} exercises</div>
            </div>
            <button className="wps-btn" onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'rgba(255,255,255,.04)',
              border: `1px solid ${T.border}`, color: T.t3,
            }}>
              <X style={{ width: 13, height: 13 }} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'member', icon: Users, label: 'Member', color: T.sky },
              { id: 'class', icon: Dumbbell, label: 'Class', color: T.violet },
              { id: 'challenge', icon: Trophy, label: 'Challenge', color: T.amber },
            ].map(t => (
              <button key={t.id} className="wps-btn" onClick={() => setTab(t.id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '8px', borderRadius: 10,
                border: `1px solid ${tab === t.id ? `${t.color}30` : T.border}`,
                background: tab === t.id ? `${t.color}0d` : 'transparent',
                color: tab === t.id ? t.color : T.t3,
                fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
              }}>
                <t.icon style={{ width: 11, height: 11 }} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 22px' }}>
          {(tab === 'member' || tab === 'class') && (
            <>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: T.t3 }} />
                <input className="wps-input" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${tab === 'class' ? 'classes' : 'members'}…`}
                  style={{ paddingLeft: 34 }} />
              </div>
              {filtered.map((item, i) => {
                const id = item.user_id || item.id;
                const name = item.user_name || item.name;
                const isChosen = assigned.includes(id);
                return (
                  <div key={id || i} onClick={() => toggle(id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 11, marginBottom: 6,
                    background: isChosen ? `${T.violet}08` : 'rgba(255,255,255,.02)',
                    border: `1px solid ${isChosen ? T.violetBdr : T.border}`,
                    cursor: 'pointer', transition: 'all .12s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `1.5px solid ${isChosen ? T.violet : 'rgba(255,255,255,.15)'}`,
                      background: isChosen ? T.violet : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isChosen && <Check style={{ width: 10, height: 10, color: '#fff' }} />}
                    </div>
                    {tab === 'member' && <Avatar name={name} size={28} src={avatarMap?.[id]} />}
                    {tab === 'class' && (
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: T.violetDim, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Dumbbell style={{ width: 12, height: 12, color: T.violet }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      {tab === 'class' && item.schedule && <div style={{ fontSize: 10, color: T.t3 }}>{item.schedule}</div>}
                      {tab === 'member' && item.membership_type && <div style={{ fontSize: 10, color: T.t3 }}>{item.membership_type}</div>}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {tab === 'challenge' && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <Trophy style={{ width: 32, height: 32, color: T.amber, margin: '0 auto 12px', opacity: .6 }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: T.t1, margin: '0 0 6px' }}>Create a Challenge</p>
              <p style={{ fontSize: 12, color: T.t3, margin: '0 0 18px' }}>Include this workout as the programme.</p>
              <button className="wps-btn" onClick={() => { openModal('challenge', { workoutId: workout.id, workoutName: workout.name }); onClose(); }}
                style={{
                  padding: '10px 22px', borderRadius: 10,
                  background: T.amber, border: 'none',
                  color: '#000', fontSize: 12, fontWeight: 700,
                  boxShadow: `0 2px 12px ${T.amber}30`,
                }}>
                Create Challenge
              </button>
            </div>
          )}

          {(tab === 'member' || tab === 'class') && assigned.length > 0 && (
            <button className="wps-btn" onClick={() => { openModal('assignWorkout', { workoutId: workout.id, workoutName: workout.name, assignTo: tab, ids: assigned }); onClose(); }}
              style={{
                width: '100%', marginTop: 14, padding: '12px', borderRadius: 12,
                background: tc.color, border: 'none',
                color: '#fff', fontSize: 13, fontWeight: 700,
                boxShadow: `0 2px 12px ${tc.color}30`,
              }}>
              Assign to {assigned.length} {tab === 'class' ? (assigned.length === 1 ? 'Class' : 'Classes') : (assigned.length === 1 ? 'Member' : 'Members')}
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
    { emoji: '⚡', name: 'HIIT Blast', type: 'hiit', desc: 'High-intensity interval training' },
    { emoji: '🏋️', name: 'Strength Builder', type: 'strength', desc: 'Progressive overload fundamentals' },
    { emoji: '🌱', name: 'Beginner Flow', type: 'beginner', desc: 'Perfect for new members' },
  ];

  return (
    <div className="wps-fade" style={{
      padding: '48px 32px', textAlign: 'center', borderRadius: 16,
      background: `linear-gradient(180deg, ${T.surface}, ${T.bg})`,
      border: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
        background: T.violetDim, border: `1px solid ${T.violetBdr}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Dumbbell style={{ width: 24, height: 24, color: T.violet }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: T.t1, margin: '0 0 6px', letterSpacing: '-.02em' }}>
        Build Your Workout Library
      </h3>
      <p style={{ fontSize: 13, color: T.t3, margin: '0 0 32px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Create workouts, assign them to clients, and track completion rates. Your content is a performance asset.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 600, margin: '0 auto 24px' }}>
        {templates.map((t, i) => {
          const tc = WORKOUT_TYPES[t.type];
          return (
            <div key={i} className="wps-fade" style={{
              flex: '1 1 170px', maxWidth: 200,
              padding: '20px 16px', borderRadius: 14, textAlign: 'center',
              background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
              animationDelay: `${i * .08}s`, cursor: 'pointer',
              transition: 'border-color .15s, background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${tc.color}30`; e.currentTarget.style.background = `${tc.color}06`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, margin: '0 auto 12px',
                background: tc.bg, border: `1px solid ${tc.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{t.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5 }}>{t.desc}</div>
            </div>
          );
        })}
      </div>

      <button className="wps-btn" onClick={onCreateNew} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '12px 24px', borderRadius: 12,
        background: T.indigo, color: '#fff',
        fontSize: 13, fontWeight: 700,
        boxShadow: '0 2px 16px rgba(99,102,241,.25)',
      }}>
        <Plus style={{ width: 14, height: 14 }} /> Create Your First Workout
      </button>
    </div>
  );
}

// ─── SORT OPTIONS ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'name', label: 'Name A–Z' },
  { id: 'most_assigned', label: 'Most Assigned' },
  { id: 'least_engaged', label: 'Least Engaged' },
  { id: 'recently_updated', label: 'Recently Updated' },
  { id: 'not_assigned', label: 'Not Assigned' },
];

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
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
  const [workouts, setWorkouts] = useState(() => { try { return JSON.parse(localStorage.getItem('coachWorkoutLibrary') || 'null') || DEFAULT_WORKOUTS; } catch { return DEFAULT_WORKOUTS; } });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWO, setEditingWO] = useState(null);
  const [selectedWO, setSelectedWO] = useState(null);
  const [assignWO, setAssignWO] = useState(null);
  const [libSearch, setLibSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    if (!showSort) return;
    const h = e => { if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showSort]);

  const saveWorkouts = (u) => {
    setWorkouts(u);
    try { localStorage.setItem('coachWorkoutLibrary', JSON.stringify(u)); } catch {}
  };

  const handleSave = (draft) => {
    const now_ = new Date().toISOString();
    const withDate = { ...draft, updated_at: now_ };
    const exists = workouts.find(w => w.id === draft.id);
    saveWorkouts(exists ? workouts.map(w => w.id === draft.id ? withDate : w) : [withDate, ...workouts]);
    setEditorOpen(false);
    setEditingWO(null);
    if (selectedWO?.id === draft.id) setSelectedWO(withDate);
  };

  const handleDelete = (id) => { saveWorkouts(workouts.filter(w => w.id !== id)); if (selectedWO?.id === id) setSelectedWO(null); };
  const handleDuplicate = (wo) => saveWorkouts([{ ...wo, id: uid(), name: `${wo.name} (copy)`, updated_at: new Date().toISOString() }, ...workouts]);
  const handleEdit = (wo) => { setEditingWO(wo); setEditorOpen(true); };
  const handleNew = () => { setEditingWO(null); setEditorOpen(true); };

  const workoutStats = useMemo(() => {
    const stats = {};
    workouts.forEach(wo => {
      let assignedIds = [];
      try { const assignments = JSON.parse(localStorage.getItem('coachWorkoutAssignments') || '{}'); assignedIds = assignments[wo.id] || []; } catch {}
      const assignedCount = assignedIds.length;
      const completedCount = assignedIds.filter(uid => checkIns.some(c => c.user_id === uid && (now - new Date(c.check_in_date)) < 30 * 864e5)).length;
      const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
      const lastActivities = assignedIds.map(uid => {
        const last = checkIns.filter(c => c.user_id === uid).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        return last ? (now - new Date(last.check_in_date)) / 864e5 : 999;
      });
      const daysSinceActivity = assignedCount === 0 ? 999 : Math.min(...lastActivities);
      const daysSinceUpdate = wo.updated_at ? Math.floor((now - new Date(wo.updated_at)) / 864e5) : null;
      stats[wo.id] = { assignedCount, completionRate, daysSinceActivity: Math.floor(daysSinceActivity), daysSinceUpdate, assignedMemberIds: assignedIds };
    });
    return stats;
  }, [workouts, checkIns, now]);

  const filteredWorkouts = useMemo(() => {
    let list = workouts.filter(w =>
      (typeFilter === 'all' || w.type === typeFilter) &&
      (!libSearch || (w.name || '').toLowerCase().includes(libSearch.toLowerCase()))
    );
    const s = id => workoutStats[id] || { assignedCount: 0, completionRate: 0, daysSinceUpdate: 999 };
    if (sortBy === 'most_assigned') list = [...list].sort((a, b) => s(b.id).assignedCount - s(a.id).assignedCount);
    if (sortBy === 'least_engaged') list = [...list].sort((a, b) => s(a.id).completionRate - s(b.id).completionRate);
    if (sortBy === 'recently_updated') list = [...list].sort((a, b) => (s(a.id).daysSinceUpdate ?? 999) - (s(b.id).daysSinceUpdate ?? 999));
    if (sortBy === 'not_assigned') list = list.filter(w => s(w.id).assignedCount === 0);
    if (sortBy === 'name') list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [workouts, typeFilter, libSearch, sortBy, workoutStats]);

  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.event_date) >= now), [events, now]);
  const engagementScore = useMemo(() =>
    posts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0) +
    polls.reduce((s, p) => s + (p.voters?.length || 0), 0),
  [posts, polls]);

  const currentSort = SORT_OPTIONS.find(s => s.id === sortBy);
  const hasWorkouts = workouts.length > 0;

  return (
    <div className="wps" style={{ background: T.bg, minHeight: '100vh', padding: '24px' }}>
      {assignWO && (
        <AssignModal workout={assignWO} allMemberships={allMemberships}
          myClasses={gymClasses} avatarMap={avatarMap}
          openModal={openModal} onClose={() => setAssignWO(null)} />
      )}

      {/* Page Header */}
      <div className="wps-fade" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: '-.03em' }}>
            Workout Performance
          </h1>
          <p style={{ fontSize: 12, color: T.t3, margin: '4px 0 0' }}>
            {workouts.length} workout{workouts.length !== 1 ? 's' : ''} in your library
          </p>
        </div>
        <button className="wps-btn" onClick={handleNew} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10,
          background: T.indigo, color: '#fff', fontSize: 13, fontWeight: 700,
          boxShadow: '0 2px 12px rgba(99,102,241,.25)',
        }}>
          <Plus style={{ width: 14, height: 14 }} /> New Workout
        </button>
      </div>

      {!hasWorkouts && !editorOpen ? (
        <EmptyState onCreateNew={handleNew} />
      ) : (
        <>
          {/* Editor */}
          {editorOpen && (
            <div style={{ marginBottom: 20 }}>
              <WorkoutEditor workout={editingWO} onSave={handleSave}
                onCancel={() => { setEditorOpen(false); setEditingWO(null); }} />
            </div>
          )}

          {!editorOpen && (
            <>
              {/* Performance Overview */}
              <PerformanceOverview workouts={workouts} workoutStats={workoutStats} />

              {/* Needs Attention */}
              <NeedsAttention workouts={workouts} workoutStats={workoutStats}
                onAssign={setAssignWO} onEdit={handleEdit} openModal={openModal} />

              {/* Controls */}
              <div className="wps-controls wps-fade" style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
                flexWrap: 'wrap', animationDelay: '.1s',
              }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                  <Search style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                    width: 14, height: 14, color: T.t3, pointerEvents: 'none' }} />
                  <input className="wps-input" value={libSearch} onChange={e => setLibSearch(e.target.value)}
                    placeholder="Search workouts…" style={{ paddingLeft: 38, paddingRight: 36 }} />
                  {libSearch && (
                    <button onClick={() => setLibSearch('')} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: T.t3, display: 'flex', padding: 0,
                    }}>
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>

                {/* Sort */}
                <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
                  <button className="wps-btn" onClick={() => setShowSort(o => !o)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                    borderRadius: 10, background: 'rgba(255,255,255,.03)',
                    border: `1px solid ${showSort ? T.indigoBdr : T.border}`,
                    color: showSort ? T.indigo : T.t2, fontSize: 12, fontWeight: 600,
                  }}>
                    <ArrowUpDown style={{ width: 12, height: 12 }} /> {currentSort?.label || 'Sort'}
                  </button>
                  {showSort && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 999,
                      background: T.card, border: `1px solid ${T.borderA}`,
                      borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.5)',
                      minWidth: 180, overflow: 'hidden',
                    }}>
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.id} className="wps-btn" onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                          style={{
                            width: '100%', padding: '10px 14px', fontSize: 12,
                            fontWeight: sortBy === opt.id ? 700 : 500,
                            color: sortBy === opt.id ? T.indigo : T.t1,
                            background: sortBy === opt.id ? T.indigoDim : 'transparent',
                            textAlign: 'left', display: 'flex', alignItems: 'center', gap: 7,
                          }}
                          onMouseEnter={e => { if (sortBy !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
                          onMouseLeave={e => { if (sortBy !== opt.id) e.currentTarget.style.background = 'transparent'; }}>
                          {sortBy === opt.id && <Check style={{ width: 10, height: 10 }} />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Type filter chips */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                {[{ id: 'all', label: 'All', color: T.indigo }, ...Object.entries(WORKOUT_TYPES).map(([k, v]) => ({ id: k, label: `${v.emoji} ${v.label}`, color: v.color }))].map(t => (
                  <button key={t.id} className="wps-btn" onClick={() => setTypeFilter(t.id)} style={{
                    padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    background: typeFilter === t.id ? `${t.color}0d` : 'transparent',
                    border: `1px solid ${typeFilter === t.id ? `${t.color}25` : T.border}`,
                    color: typeFilter === t.id ? t.color : T.t3,
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Main Grid */}
              <div className="wps-grid">
                {/* Left: Workout grid + detail */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {filteredWorkouts.length === 0 ? (
                    <div style={{
                      padding: 40, textAlign: 'center', borderRadius: 14,
                      background: T.surface, border: `1px solid ${T.border}`,
                    }}>
                      <Search style={{ width: 20, height: 20, color: T.t3, margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 14, color: T.t2, fontWeight: 600, margin: '0 0 4px' }}>
                        {sortBy === 'not_assigned' ? 'All workouts are assigned' : 'No workouts found'}
                      </p>
                      <p style={{ fontSize: 12, color: T.t3, margin: '0 0 14px' }}>
                        Try adjusting your search or filter
                      </p>
                      <button className="wps-btn" onClick={handleNew} style={{
                        fontSize: 12, fontWeight: 700, color: T.indigo,
                        background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
                        borderRadius: 9, padding: '8px 16px',
                      }}>Create a workout</button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                      {filteredWorkouts.map((wo, i) => (
                        <div key={wo.id || i} className="wps-fade" style={{ animationDelay: `${Math.min(i * .04, .3)}s` }}>
                          <WorkoutCard
                            workout={wo}
                            stats={workoutStats[wo.id] || { assignedCount: 0, completionRate: 0, daysSinceActivity: 999, daysSinceUpdate: null }}
                            isSelected={selectedWO?.id === wo.id}
                            onSelect={wo => setSelectedWO(selectedWO?.id === wo.id ? null : wo)}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onAssign={setAssignWO}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detail Panel */}
                  {selectedWO && (
                    <WorkoutDetailPanel
                      workout={selectedWO}
                      stats={workoutStats[selectedWO.id] || { assignedCount: 0, completionRate: 0, daysSinceActivity: 999, daysSinceUpdate: null, assignedMemberIds: [] }}
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

                {/* Sidebar */}
                <div className="wps-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <InsightsPanel workouts={workouts} workoutStats={workoutStats} />
                  <LibraryBreakdown workouts={workouts} />

                  {/* Quick Actions */}
                  <div style={{
                    borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, padding: '16px 18px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginBottom: 14, letterSpacing: '.02em' }}>Quick Actions</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { icon: Dumbbell, label: 'New Workout', sub: `${workouts.length} in library`, color: T.violet, action: handleNew },
                        { icon: MessageSquarePlus, label: 'Post Update', sub: 'Engage members', color: T.sky, action: () => openModal('post') },
                        { icon: BarChart2, label: 'New Poll', sub: `${polls.length} active`, color: T.emerald, action: () => openModal('poll') },
                        { icon: Trophy, label: 'Challenge', sub: 'Drive consistency', color: T.amber, action: () => openModal('challenge') },
                      ].map(({ icon: Ic, label, sub, color, action }, i) => (
                        <button key={i} className="wps-btn" onClick={action} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 10, width: '100%',
                          background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                          textAlign: 'left', transition: 'all .12s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${color}06`; e.currentTarget.style.borderColor = `${color}20`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; e.currentTarget.style.borderColor = T.border; }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: `${color}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Ic style={{ width: 12, height: 12, color }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>{label}</div>
                            <div style={{ fontSize: 10, color: T.t3 }}>{sub}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Content Engagement */}
                  <div style={{
                    borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.t1 }}>Content Engagement</span>
                      <Zap style={{ width: 12, height: 12, color: T.violet }} />
                    </div>
                    <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: T.t1, letterSpacing: '-.04em', marginBottom: 10 }}>{engagementScore}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Likes', val: posts.reduce((s, p) => s + (p.likes?.length || 0), 0), color: '#f87171' },
                        { label: 'Comments', val: posts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: T.sky },
                        { label: 'Votes', val: polls.reduce((s, p) => s + (p.voters?.length || 0), 0), color: T.violet },
                      ].map((s, i) => (
                        <span key={i} style={{
                          fontFamily: T.mono, fontSize: 10, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 6,
                          background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, color: s.color,
                        }}>
                          {s.val} {s.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  {upcomingEvents.length > 0 && (
                    <div style={{
                      borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, padding: '16px 18px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.t1 }}>Upcoming Events</span>
                        <button className="wps-btn" onClick={() => openModal('event')} style={{
                          fontSize: 9, fontWeight: 700, color: T.emerald,
                          background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`,
                          borderRadius: 6, padding: '3px 8px',
                        }}>+ New</button>
                      </div>
                      {upcomingEvents.slice(0, 3).map((ev, i) => {
                        const d = new Date(ev.event_date);
                        const diff = Math.floor((d - now) / 86400000);
                        return (
                          <div key={ev.id || i} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 0',
                            borderBottom: i < Math.min(upcomingEvents.length, 3) - 1 ? `1px solid ${T.border}` : 'none',
                          }}>
                            <div style={{
                              flexShrink: 0, borderRadius: 8, padding: '4px 8px', textAlign: 'center',
                              background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, minWidth: 32,
                            }}>
                              <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: T.emerald, lineHeight: 1 }}>{format(d, 'd')}</div>
                              <div style={{ fontSize: 8, color: T.t3, textTransform: 'uppercase' }}>{format(d, 'MMM')}</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                              <div style={{ fontSize: 10, color: diff <= 2 ? T.red : T.t3 }}>{diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`}</div>
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
