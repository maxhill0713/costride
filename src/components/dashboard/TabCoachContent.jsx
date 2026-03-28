import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, subDays, differenceInDays } from 'date-fns';
import {
  Dumbbell, Plus, X, Check, Trash2, Copy,
  ChevronDown, ChevronUp, MoreHorizontal,
  Users, Calendar, Trophy, Zap, BookOpen,
  Play, Edit2, Search, Award, MessageSquarePlus,
  BarChart2, ClipboardList, Heart,
  MessageCircle, TrendingUp, AlertTriangle, CheckCircle,
  UserPlus, Activity, TrendingDown, Filter, ArrowUpDown,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';

// ─── Design tokens (matches owner dashboard, purple primary) ──────────────────
const DC = {
  bgSurface: '#0c1422',
  bgCard:    '#0f1c30',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.13)',
  divider:   'rgba(255,255,255,0.05)',
  purple:    '#8b5cf6',
  purpleDim: 'rgba(139,92,246,0.10)',
  purpleBrd: 'rgba(139,92,246,0.22)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569', t4: '#2d3f55',
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  .twp-root  { display: grid; grid-template-columns: minmax(0,1fr) clamp(260px,22%,300px); gap: 16px; align-items: start; }
  .twp-left  { display: flex; flex-direction: column; gap: 16px; }
  .twp-right { display: flex; flex-direction: column; gap: 12px; }
  .workout-card { border-radius: 12px; background: #0c1422; border: 1px solid rgba(255,255,255,0.07); overflow: hidden; transition: border-color 0.15s, transform 0.15s; cursor: pointer; }
  .workout-card:hover { border-color: rgba(139,92,246,0.35); transform: translateY(-1px); }
  .workout-card.selected { border-color: rgba(139,92,246,0.4); background: rgba(139,92,246,0.04); }
  .exercise-row { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 5px; }
  .exercise-row:hover .ex-delete { opacity: 1; }
  .ex-delete { opacity: 0; transition: opacity 0.1s; }
  .section-block { border-radius: 12px; padding: 12px 14px; margin-bottom: 10px; }
  .type-btn { padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; white-space: nowrap; }
  .assign-btn { display: flex; align-items: center; gap: 8px; padding: 10px 13px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.025); cursor: pointer; transition: all 0.14s; text-align: left; width: 100%; }
  .assign-btn:hover { background: rgba(255,255,255,0.055); border-color: rgba(255,255,255,0.12); }
  .wo-client-row:hover { background: rgba(255,255,255,0.035) !important; }
  @media (max-width: 768px) {
    .twp-root  { grid-template-columns: 1fr !important; }
    .twp-right { order: -1; }
  }
`;

// ─── Workout type config ──────────────────────────────────────────────────────
const WORKOUT_TYPES = {
  hiit:       { label: 'HIIT',       color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   emoji: '⚡' },
  strength:   { label: 'Strength',   color: '#818cf8', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)',  emoji: '🏋️' },
  yoga:       { label: 'Yoga',       color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  emoji: '🧘' },
  cardio:     { label: 'Cardio',     color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.25)',  emoji: '🏃' },
  core:       { label: 'Core',       color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)',  emoji: '🎯' },
  beginner:   { label: 'Beginner',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)', emoji: '🌱' },
  stretching: { label: 'Stretching', color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)',  border: 'rgba(45,212,191,0.25)',  emoji: '🤸' },
};

// Default starter library
const DEFAULT_WORKOUTS = [
  {
    id: 'w1', name: 'HIIT Blast', type: 'hiit', duration: 45, difficulty: 'Advanced',
    warmup:  [{ id: 'e1', name: 'High knees', sets: '', reps: '2 min' }, { id: 'e2', name: 'Jump rope', sets: '', reps: '3 min' }],
    main:    [{ id: 'e3', name: 'KB Swings', sets: '4', reps: '20' }, { id: 'e4', name: 'Burpees', sets: '4', reps: '15' }, { id: 'e5', name: 'Box Jumps', sets: '4', reps: '10' }, { id: 'e6', name: 'Battle ropes', sets: '4', reps: '30s' }],
    cooldown:[{ id: 'e7', name: 'Hip flexor stretch', sets: '', reps: '60s' }, { id: 'e8', name: 'Quad stretch', sets: '', reps: '60s' }],
    notes: 'Rest 45s between exercises, 2 min between rounds.',
  },
  {
    id: 'w2', name: 'Strength Builder', type: 'strength', duration: 60, difficulty: 'Intermediate',
    warmup:  [{ id: 'e9', name: 'Mobility drills', sets: '', reps: '5 min' }, { id: 'e10', name: 'Activation band work', sets: '2', reps: '15' }],
    main:    [{ id: 'e11', name: 'Back Squat', sets: '5', reps: '5' }, { id: 'e12', name: 'Bench Press', sets: '4', reps: '8' }, { id: 'e13', name: 'Barbell Row', sets: '4', reps: '8' }, { id: 'e14', name: 'Romanian Deadlift', sets: '3', reps: '10' }],
    cooldown:[{ id: 'e15', name: 'Foam roll quads & hamstrings', sets: '', reps: '3 min' }, { id: 'e16', name: 'Pigeon stretch', sets: '', reps: '90s each' }],
    notes: 'Rest 2–3 min between sets. Focus on form over load.',
  },
  {
    id: 'w3', name: 'Beginner Conditioning', type: 'beginner', duration: 30, difficulty: 'Beginner',
    warmup:  [{ id: 'e17', name: 'March in place', sets: '', reps: '2 min' }, { id: 'e18', name: 'Arm circles', sets: '', reps: '30s each direction' }],
    main:    [{ id: 'e19', name: 'Bodyweight squats', sets: '3', reps: '12' }, { id: 'e20', name: 'Knee push-ups', sets: '3', reps: '10' }, { id: 'e21', name: 'Reverse lunges', sets: '3', reps: '10 each' }, { id: 'e22', name: 'Glute bridges', sets: '3', reps: '15' }],
    cooldown:[{ id: 'e23', name: 'Cat-cow stretch', sets: '', reps: '1 min' }, { id: 'e24', name: "Child's pose", sets: '', reps: '60s' }],
    notes: 'Perfect for new members. Demonstrate each movement before starting.',
  },
  {
    id: 'w4', name: 'Core Finisher', type: 'core', duration: 15, difficulty: 'Intermediate',
    warmup:  [{ id: 'e25', name: 'Cat-cow', sets: '', reps: '1 min' }],
    main:    [{ id: 'e26', name: 'Plank hold', sets: '3', reps: '45s' }, { id: 'e27', name: 'Dead bugs', sets: '3', reps: '10 each' }, { id: 'e28', name: 'Russian twists', sets: '3', reps: '20' }, { id: 'e29', name: 'Hollow holds', sets: '3', reps: '30s' }],
    cooldown:[{ id: 'e30', name: 'Supine twist', sets: '', reps: '45s each' }],
    notes: 'Add at the end of any session. 20s rest between exercises.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function SectionLabel({ children, accent = '#8b5cf6' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 14, borderRadius: 99, background: accent, flexShrink: 0 }}/>
      <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4f8', letterSpacing: '-0.01em' }}>{children}</span>
    </div>
  );
}

// ─── Workout health indicator ─────────────────────────────────────────────────
function getHealth(completionRate, assignedCount, daysSinceUpdate) {
  if (assignedCount === 0) return { label: 'Not Assigned', color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' };
  if (completionRate >= 70 && daysSinceUpdate < 30) return { label: 'Healthy', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
  if (completionRate >= 40 || daysSinceUpdate < 60) return { label: 'Needs Attention', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' };
  return { label: 'Low Engagement', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
}

// ─── Engagement signal badges ──────────────────────────────────────────────────
function EngagementSignals({ workout, stats }) {
  const signals = [];
  if (stats.assignedCount === 0) signals.push({ label: 'Not assigned', color: '#64748b' });
  else if (stats.completionRate < 40) signals.push({ label: `${stats.completionRate}% completion`, color: '#ef4444' });
  if (stats.daysSinceActivity > 14 && stats.assignedCount > 0) signals.push({ label: `No activity ${stats.daysSinceActivity}d`, color: '#f59e0b' });
  if (signals.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
      {signals.map((s, i) => (
        <span key={i} style={{ fontSize: 8, fontWeight: 700, color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}22`, borderRadius: 4, padding: '1px 5px' }}>
          ⚠ {s.label}
        </span>
      ))}
    </div>
  );
}

// ─── 3-dot menu ───────────────────────────────────────────────────────────────
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
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 7, cursor: 'pointer' }}>
        <MoreHorizontal style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.5)' }}/>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 30, right: 0, zIndex: 9999, background: '#1a1f36', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.5)', minWidth: 130, overflow: 'hidden' }}>
          {items.map((item, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setOpen(false); item.action(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 12, fontWeight: 600, color: item.danger ? '#f87171' : '#d4e4f4', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              <item.icon style={{ width: 12, height: 12 }}/> {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Workout card (library grid) ─────────────────────────────────────────────
function WorkoutCard({ workout, stats, isSelected, onSelect, onEdit, onDelete, onDuplicate, onAssign }) {
  const tc     = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;
  const health = getHealth(stats.completionRate, stats.assignedCount, stats.daysSinceUpdate);

  return (
    <div className={`workout-card${isSelected ? ' selected' : ''}`} onClick={() => onSelect(workout)}>
      <div style={{ height: 3, background: `linear-gradient(90deg,${tc.color},${tc.color}66)` }}/>
      <div style={{ padding: '14px 15px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {tc.emoji}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{workout.name}</div>
              <span style={{ fontSize: 9, fontWeight: 800, color: tc.color, background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 4, padding: '1px 6px' }}>{tc.label}</span>
            </div>
          </div>
          <DotMenu items={[
            { icon: Edit2,  label: 'Edit',      action: () => onEdit(workout)      },
            { icon: Copy,   label: 'Duplicate', action: () => onDuplicate(workout) },
            { icon: Trash2, label: 'Delete',    action: () => onDelete(workout.id), danger: true },
          ]}/>
        </div>

        {/* Usage stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8, padding: '8px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#38bdf8', letterSpacing: '-0.02em' }}>{stats.assignedCount}</div>
            <div style={{ fontSize: 8, color: DC.t4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned</div>
          </div>
          <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: stats.completionRate >= 70 ? '#10b981' : stats.completionRate >= 40 ? '#f59e0b' : stats.assignedCount === 0 ? DC.t4 : '#ef4444', letterSpacing: '-0.02em' }}>
              {stats.assignedCount === 0 ? '—' : `${stats.completionRate}%`}
            </div>
            <div style={{ fontSize: 8, color: DC.t4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: DC.purple, letterSpacing: '-0.02em' }}>
              {stats.daysSinceUpdate === null ? '—' : stats.daysSinceUpdate === 0 ? 'Today' : `${stats.daysSinceUpdate}d`}
            </div>
            <div style={{ fontSize: 8, color: DC.t4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Updated</div>
          </div>
        </div>

        {/* Health badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: health.color, background: health.bg, border: `1px solid ${health.border}`, borderRadius: 4, padding: '2px 7px' }}>
            {health.label}
          </span>
          {workout.duration && <span style={{ fontSize: 10, color: '#64748b' }}>⏱ {workout.duration}min</span>}
        </div>

        {/* Engagement signals */}
        <EngagementSignals workout={workout} stats={stats}/>

        {/* Exercise preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, margin: '10px 0 12px' }}>
          {workout.main.slice(0, 2).map((ex, i) => (
            <div key={i} style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: tc.color, flexShrink: 0 }}/>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
              {(ex.sets || ex.reps) && <span style={{ fontSize: 9, color: '#475569', flexShrink: 0 }}>{ex.sets ? `${ex.sets}×${ex.reps}` : ex.reps}</span>}
            </div>
          ))}
          {workout.main.length > 2 && <div style={{ fontSize: 9, color: '#3a5070', paddingLeft: 8 }}>+{workout.main.length - 2} more exercises</div>}
        </div>

        {/* Assign CTA */}
        <button onClick={e => { e.stopPropagation(); onAssign(workout); }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 9, background: `${tc.color}12`, border: `1px solid ${tc.color}28`, color: tc.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = `${tc.color}22`}
          onMouseLeave={e => e.currentTarget.style.background = `${tc.color}12`}>
          <Play style={{ width: 11, height: 11 }}/> Assign Workout
        </button>
      </div>
    </div>
  );
}

// ─── Workout Detail Panel ─────────────────────────────────────────────────────
function WorkoutDetailPanel({ workout, stats, allMemberships, checkIns, now, onEdit, onAssign, onClose, openModal }) {
  const tc     = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;
  const health = getHealth(stats.completionRate, stats.assignedCount, stats.daysSinceUpdate);

  const [tab, setTab] = useState('clients');

  // Enrich assigned clients
  const assignedClients = useMemo(() => {
    return stats.assignedMemberIds.map(uid => {
      const m         = allMemberships.find(x => x.user_id === uid) || { user_id: uid, user_name: 'Client' };
      const r30       = checkIns.filter(c => c.user_id === uid && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
      const lastCI    = checkIns.filter(c => c.user_id === uid).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      const daysAgo   = lastCI ? Math.floor((now - new Date(lastCI.check_in_date)) / 864e5) : null;
      const engStatus = daysAgo === null ? 'never' : daysAgo > 14 ? 'inactive' : daysAgo > 7 ? 'low' : 'active';
      const engColor  = { active: '#10b981', low: '#f59e0b', inactive: '#ef4444', never: '#64748b' }[engStatus];
      const engLabel  = { active: 'Active', low: 'Low activity', inactive: 'Inactive', never: 'Never visited' }[engStatus];
      return { ...m, r30, daysAgo, engStatus, engColor, engLabel };
    });
  }, [stats.assignedMemberIds, allMemberships, checkIns, now]);

  // Suggested clients to assign (active but not yet assigned)
  const suggestions = useMemo(() => {
    return allMemberships.filter(m => {
      if (stats.assignedMemberIds.includes(m.user_id)) return false;
      const r30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
      return r30 >= 2;
    }).slice(0, 4);
  }, [allMemberships, stats.assignedMemberIds, checkIns, now]);

  return (
    <div style={{ borderRadius: 12, background: DC.bgSurface, border: `1px solid ${tc.color}30`, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 18px 14px', background: `${tc.color}06`, borderBottom: `1px solid ${tc.color}18` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{tc.emoji}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f4f8' }}>{workout.name}</div>
              <div style={{ display: 'flex', gap: 7, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: tc.color, background: tc.bg, borderRadius: 4, padding: '1px 6px', border: `1px solid ${tc.border}` }}>{tc.label}</span>
                {workout.difficulty && <span style={{ fontSize: 10, color: '#64748b' }}>{workout.difficulty}</span>}
                {workout.duration && <span style={{ fontSize: 10, color: '#64748b' }}>⏱ {workout.duration}min</span>}
                <span style={{ fontSize: 9, fontWeight: 800, color: health.color, background: health.bg, border: `1px solid ${health.border}`, borderRadius: 4, padding: '1px 6px' }}>{health.label}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => onEdit(workout)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: `${tc.color}0f`, border: `1px solid ${tc.color}25`, color: tc.color, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              <Edit2 style={{ width: 11, height: 11 }}/> Edit
            </button>
            <button onClick={() => onAssign(workout)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: `linear-gradient(135deg,${tc.color}28,${tc.color}14)`, border: `1px solid ${tc.color}40`, color: tc.color, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
              <UserPlus style={{ width: 11, height: 11 }}/> Assign
            </button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b', cursor: 'pointer' }}>
              <X style={{ width: 12, height: 12 }}/>
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[
            { label: 'Clients', value: stats.assignedCount, color: '#38bdf8' },
            { label: 'Completion', value: stats.assignedCount === 0 ? '—' : `${stats.completionRate}%`, color: stats.completionRate >= 70 ? '#10b981' : stats.completionRate >= 40 ? '#f59e0b' : '#ef4444' },
            { label: 'Last activity', value: stats.daysSinceActivity === 999 ? 'Never' : `${stats.daysSinceActivity}d ago`, color: stats.daysSinceActivity > 14 ? '#ef4444' : '#10b981' },
            { label: 'Updated', value: stats.daysSinceUpdate === null ? '—' : stats.daysSinceUpdate === 0 ? 'Today' : `${stats.daysSinceUpdate}d ago`, color: '#a78bfa' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 8, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${tc.color}12` }}>
        {[
          { id: 'clients',   label: `👥 Clients (${stats.assignedCount})` },
          { id: 'exercises', label: `🏋️ Exercises (${workout.main.length})` },
          { id: 'suggest',   label: `💡 Suggestions (${suggestions.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 8px', background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${tc.color}` : '2px solid transparent', color: tab === t.id ? tc.color : '#3a5070', fontSize: 10, fontWeight: tab === t.id ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Clients tab */}
      {tab === 'clients' && (
        <div style={{ padding: '14px 18px' }}>
          {assignedClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Users style={{ width: 24, height: 24, color: '#3a5070', margin: '0 auto 10px' }}/>
              <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: '0 0 12px' }}>No clients assigned yet</p>
              <button onClick={() => onAssign(workout)} style={{ fontSize: 11, fontWeight: 700, color: tc.color, background: `${tc.color}10`, border: `1px solid ${tc.color}25`, borderRadius: 9, padding: '8px 16px', cursor: 'pointer' }}>
                Assign to clients
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {assignedClients.map((m, i) => (
                <div key={m.user_id || i} className="wo-client-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.1s' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${m.engColor}14`, border: `1.5px solid ${m.engColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: m.engColor, flexShrink: 0 }}>
                    {(m.user_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user_name || 'Client'}</div>
                    <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: m.engColor, background: `${m.engColor}10`, borderRadius: 4, padding: '1px 5px' }}>{m.engLabel}</span>
                      <span style={{ fontSize: 9, color: '#3a5070' }}>
                        {m.daysAgo === null ? 'Never visited' : m.daysAgo === 0 ? 'Last visit: today' : `Last visit: ${m.daysAgo}d ago`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {m.engStatus !== 'active' && (
                      <button onClick={() => openModal('post', { memberId: m.user_id })} style={{ fontSize: 9, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                        Follow up
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Exercises tab */}
      {tab === 'exercises' && (
        <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 12 }}>
          {[
            { title: 'Warmup',       exercises: workout.warmup,    accent: '#38bdf8', emoji: '🔥' },
            { title: 'Main Workout', exercises: workout.main,      accent: tc.color,  emoji: tc.emoji },
            { title: 'Cooldown',     exercises: workout.cooldown,  accent: '#34d399', emoji: '❄️' },
          ].map((sec, si) => (
            <div key={si} style={{ borderRadius: 11, padding: '12px', background: `${sec.accent}06`, border: `1px solid ${sec.accent}18` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: sec.accent, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{sec.emoji} {sec.title}</div>
              {sec.exercises.length === 0
                ? <p style={{ fontSize: 10, color: '#3a5070', margin: 0 }}>—</p>
                : sec.exercises.map((ex, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: sec.accent, flexShrink: 0 }}/>
                    <span style={{ fontSize: 11, color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                    {(ex.sets || ex.reps) && <span style={{ fontSize: 9, color: '#475569', flexShrink: 0 }}>{ex.sets ? `${ex.sets}×${ex.reps}` : ex.reps}</span>}
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      )}

      {/* Suggestions tab */}
      {tab === 'suggest' && (
        <div style={{ padding: '14px 18px' }}>
          {suggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#3a5070' }}>
              <CheckCircle style={{ width: 20, height: 20, color: '#10b981', margin: '0 auto 8px' }}/>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#10b981', margin: 0 }}>All active clients are assigned</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 10 }}>
                These active clients aren't assigned this workout yet — consider adding them.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {suggestions.map((m, i) => {
                  const r30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 864e5).length;
                  return (
                    <div key={m.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#10b981', flexShrink: 0 }}>
                        {(m.user_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8' }}>{m.user_name || 'Client'}</div>
                        <div style={{ fontSize: 9, color: '#3a5070' }}>{r30} visits this month · good fit for this program</div>
                      </div>
                      <button onClick={() => onAssign(workout)} style={{ fontSize: 9, fontWeight: 700, color: tc.color, background: `${tc.color}10`, border: `1px solid ${tc.color}22`, borderRadius: 7, padding: '5px 9px', cursor: 'pointer', flexShrink: 0 }}>
                        Assign
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {workout.notes && tab === 'exercises' && (
        <div style={{ padding: '0 18px 16px' }}>
          <div style={{ padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
            📝 {workout.notes}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Low Engagement Alerts ────────────────────────────────────────────────────
function LowEngagementAlerts({ workouts, workoutStats, allMemberships, checkIns, now, onAssign, openModal }) {
  const alerts = useMemo(() => {
    const items = [];

    workouts.forEach(wo => {
      const stats = workoutStats[wo.id];
      if (!stats) return;

      if (stats.assignedCount === 0) {
        items.push({ type: 'unassigned', workout: wo, stats, reason: 'Not assigned to any clients', action: 'Assign now', actionFn: () => onAssign(wo), color: '#64748b' });
      } else if (stats.completionRate < 40 && stats.assignedCount > 0) {
        items.push({ type: 'low_completion', workout: wo, stats, reason: `Only ${stats.completionRate}% completion rate`, action: 'Follow up with clients', actionFn: () => onAssign(wo), color: '#ef4444' });
      } else if (stats.daysSinceActivity > 14 && stats.assignedCount > 0) {
        items.push({ type: 'inactive', workout: wo, stats, reason: `No activity in ${stats.daysSinceActivity} days`, action: 'Send reminder', actionFn: () => openModal('post'), color: '#f59e0b' });
      } else if (stats.daysSinceUpdate > 60) {
        items.push({ type: 'stale', workout: wo, stats, reason: 'Not updated in 60+ days', action: 'Review & refresh', actionFn: null, color: '#f59e0b' });
      }
    });

    return items.slice(0, 5);
  }, [workouts, workoutStats]);

  if (alerts.length === 0) return null;

  return (
    <div style={{ borderRadius: 12, background: DC.bgSurface, border: `1px solid ${DC.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${DC.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle style={{ width: 13, height: 13, color: '#f59e0b' }}/>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8', flex: 1 }}>Engagement Alerts</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 99, padding: '1px 6px' }}>{alerts.length}</span>
      </div>
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map((alert, i) => {
          const tc = WORKOUT_TYPES[alert.workout.type] || WORKOUT_TYPES.strength;
          return (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.015)', border: `1px solid ${alert.color}18`, borderLeft: `2px solid ${alert.color}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>{tc.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.workout.name}</div>
                  <div style={{ fontSize: 10, color: alert.color, marginTop: 1 }}>{alert.reason}</div>
                </div>
              </div>
              <button onClick={alert.actionFn} style={{ fontSize: 10, fontWeight: 700, color: alert.color, background: `${alert.color}0e`, border: `1px solid ${alert.color}22`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer' }}>
                → {alert.action}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Exercise row (in editor) ─────────────────────────────────────────────────
function ExerciseRow({ ex, onChange, onDelete }) {
  const inputS = { padding: '5px 8px', borderRadius: 6, background: '#060c18', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4f8', fontSize: 11, outline: 'none' };
  return (
    <div className="exercise-row">
      <Dumbbell style={{ width: 11, height: 11, color: '#3a5070', flexShrink: 0 }}/>
      <input value={ex.name} onChange={e => onChange({ ...ex, name: e.target.value })} placeholder="Exercise name" style={{ ...inputS, flex: 1 }}/>
      <input value={ex.sets} onChange={e => onChange({ ...ex, sets: e.target.value })} placeholder="Sets" style={{ ...inputS, width: 46 }}/>
      <span style={{ fontSize: 10, color: '#3a5070' }}>×</span>
      <input value={ex.reps} onChange={e => onChange({ ...ex, reps: e.target.value })} placeholder="Reps / time" style={{ ...inputS, width: 80 }}/>
      <button onClick={onDelete} className="ex-delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 0, display: 'flex' }}>
        <X style={{ width: 12, height: 12 }}/>
      </button>
    </div>
  );
}

// ─── Section block (Warmup / Main / Cooldown) ─────────────────────────────────
function SectionBlock({ title, accent, exercises, onChange, icon: Icon }) {
  const addExercise = () => onChange([...exercises, { id: uid(), name: '', sets: '', reps: '' }]);
  const updateEx = (idx, ex) => { const u = [...exercises]; u[idx] = ex; onChange(u); };
  const deleteEx = (idx) => onChange(exercises.filter((_, i) => i !== idx));

  return (
    <div className="section-block" style={{ background: `${accent}06`, border: `1px solid ${accent}18` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 12, height: 12, color: accent }}/>
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>{title}</span>
        <span style={{ fontSize: 10, color: '#3a5070', fontWeight: 500 }}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
      </div>
      <div>
        {exercises.map((ex, i) => (
          <ExerciseRow key={ex.id || i} ex={ex} onChange={u => updateEx(i, u)} onDelete={() => deleteEx(i)}/>
        ))}
      </div>
      <button onClick={addExercise} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: accent, background: `${accent}0a`, border: `1px solid ${accent}22`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', marginTop: 4 }}>
        <Plus style={{ width: 10, height: 10 }}/> Add exercise
      </button>
    </div>
  );
}

// ─── Assign modal ─────────────────────────────────────────────────────────────
function AssignModal({ workout, allMemberships, myClasses, avatarMap, onClose, openModal }) {
  const [tab, setTab] = useState('member');
  const [search, setSearch] = useState('');
  const [assigned, setAssigned] = useState([]);

  const tc = WORKOUT_TYPES[workout.type] || WORKOUT_TYPES.strength;

  const filtered = useMemo(() => {
    if (tab === 'member') return allMemberships.filter(m => !search || (m.user_name || '').toLowerCase().includes(search.toLowerCase())).slice(0, 12);
    if (tab === 'class')  return myClasses.filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()));
    return [];
  }, [tab, search, allMemberships, myClasses]);

  const toggle = (id) => setAssigned(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', borderRadius: 20, background: '#0d1b2e', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#0d1b2e', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#f0f4f8' }}>Assign Workout</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{workout.name} · {workout.main.length} exercises</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b', cursor: 'pointer' }}>
              <X style={{ width: 13, height: 13 }}/>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'member',    icon: Users,   label: 'Assign to Member',    color: '#38bdf8' },
              { id: 'class',     icon: Dumbbell,label: 'Assign to Class',     color: '#a78bfa' },
              { id: 'challenge', icon: Trophy,  label: 'Assign to Challenge', color: '#fbbf24' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 8px', borderRadius: 9, border: tab === t.id ? `1px solid ${t.color}35` : '1px solid rgba(255,255,255,0.07)', background: tab === t.id ? `${t.color}12` : 'transparent', color: tab === t.id ? t.color : '#3a5070', fontSize: 10, fontWeight: tab === t.id ? 800 : 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <t.icon style={{ width: 10, height: 10 }}/> {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: '14px 20px' }}>
          {(tab === 'class' || tab === 'member') && (
            <>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: '#3a5070' }}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab === 'class' ? 'classes' : 'members'}…`} style={{ width: '100%', padding: '8px 12px 8px 30px', borderRadius: 9, background: '#060c18', border: '1px solid rgba(255,255,255,0.07)', color: '#f0f4f8', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}/>
              </div>
              {filtered.map((item, i) => {
                const id = item.user_id || item.id;
                const name = item.user_name || item.name;
                const isChosen = assigned.includes(id);
                return (
                  <div key={id || i} onClick={() => toggle(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, background: isChosen ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isChosen ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', marginBottom: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${isChosen ? '#a78bfa' : 'rgba(255,255,255,0.15)'}`, background: isChosen ? '#a78bfa' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isChosen && <Check style={{ width: 10, height: 10, color: '#fff' }}/>}
                    </div>
                    {tab === 'member' && <Avatar name={name} size={28} src={avatarMap?.[id]}/>}
                    {tab === 'class' && <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Dumbbell style={{ width: 12, height: 12, color: '#a78bfa' }}/></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      {tab === 'class' && item.schedule && <div style={{ fontSize: 10, color: '#64748b' }}>{item.schedule}</div>}
                      {tab === 'member' && item.membership_type && <div style={{ fontSize: 10, color: '#64748b' }}>{item.membership_type}</div>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {tab === 'challenge' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <Trophy style={{ width: 32, height: 32, color: '#fbbf24', margin: '0 auto 12px', opacity: 0.6 }}/>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f4f8', margin: '0 0 6px' }}>Assign to a Challenge</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 16px' }}>Create a challenge and include this workout as the programme.</p>
              <button onClick={() => { openModal('challenge', { workoutId: workout.id, workoutName: workout.name }); onClose(); }}
                style={{ padding: '9px 20px', borderRadius: 10, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', color: '#fbbf24', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                Create Challenge with this Workout
              </button>
            </div>
          )}
          {(tab === 'class' || tab === 'member') && assigned.length > 0 && (
            <button onClick={() => { openModal('assignWorkout', { workoutId: workout.id, workoutName: workout.name, assignTo: tab, ids: assigned }); onClose(); }}
              style={{ width: '100%', marginTop: 14, padding: '11px', borderRadius: 11, background: `linear-gradient(135deg,${tc.color}30,${tc.color}18)`, border: `1px solid ${tc.color}40`, color: tc.color, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              Assign to {assigned.length} {tab === 'class' ? (assigned.length === 1 ? 'Class' : 'Classes') : (assigned.length === 1 ? 'Member' : 'Members')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Workout editor ───────────────────────────────────────────────────────────
function WorkoutEditor({ workout, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => workout
    ? { ...workout, warmup: [...workout.warmup], main: [...workout.main], cooldown: [...workout.cooldown] }
    : { id: uid(), name: '', type: 'strength', duration: 45, difficulty: 'Intermediate', warmup: [], main: [], cooldown: [], notes: '' }
  );

  const inputS = { padding: '8px 10px', borderRadius: 8, background: '#060c18', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f4f8', fontSize: 12, outline: 'none', boxSizing: 'border-box' };
  const tc = WORKOUT_TYPES[draft.type] || WORKOUT_TYPES.strength;

  return (
    <div style={{ borderRadius: 12, background: DC.bgSurface, border: `1px solid ${tc.color}30`, overflow: 'hidden' }}>
      <div style={{ padding: '16px 18px 14px', background: `${tc.color}08`, borderBottom: `1px solid ${tc.color}18` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{tc.emoji}</div>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#f0f4f8' }}>{workout ? 'Edit Workout' : 'New Workout'}</span>
          </div>
          <button onClick={onCancel} style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b', cursor: 'pointer' }}>
            <X style={{ width: 12, height: 12 }}/>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 120px', gap: 8, marginBottom: 10 }}>
          <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Workout name" style={{ ...inputS }}/>
          <input value={draft.duration} onChange={e => setDraft(p => ({ ...p, duration: e.target.value }))} placeholder="Mins" type="number" style={{ ...inputS }}/>
          <select value={draft.difficulty} onChange={e => setDraft(p => ({ ...p, difficulty: e.target.value }))} style={{ ...inputS, cursor: 'pointer' }}>
            {['Beginner', 'Intermediate', 'Advanced', 'Elite'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Object.entries(WORKOUT_TYPES).map(([key, t]) => (
            <button key={key} onClick={() => setDraft(p => ({ ...p, type: key }))} className="type-btn"
              style={{ background: draft.type === key ? t.bg : 'transparent', border: `1px solid ${draft.type === key ? t.border : 'rgba(255,255,255,0.07)'}`, color: draft.type === key ? t.color : '#3a5070' }}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        <SectionBlock title="Warmup" accent="#38bdf8"  icon={Play}    exercises={draft.warmup}   onChange={v => setDraft(p => ({ ...p, warmup:   v }))}/>
        <SectionBlock title="Main Workout" accent={tc.color} icon={Dumbbell} exercises={draft.main} onChange={v => setDraft(p => ({ ...p, main:     v }))}/>
        <SectionBlock title="Cooldown" accent="#34d399" icon={Heart}   exercises={draft.cooldown} onChange={v => setDraft(p => ({ ...p, cooldown: v }))}/>
        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#3a5070', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Coaching Notes</div>
          <textarea value={draft.notes} onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))} placeholder="Tips, modifications, cues, equipment needed…"
            style={{ width: '100%', minHeight: 60, padding: '8px 10px', borderRadius: 8, background: '#060c18', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 11, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}/>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave(draft)} disabled={!draft.name.trim()}
            style={{ flex: 2, padding: '10px', borderRadius: 10, background: draft.name.trim() ? `linear-gradient(135deg,${tc.color}28,${tc.color}14)` : 'rgba(255,255,255,0.03)', border: `1px solid ${draft.name.trim() ? `${tc.color}40` : 'rgba(255,255,255,0.06)'}`, color: draft.name.trim() ? tc.color : '#3a5070', fontSize: 12, fontWeight: 800, cursor: draft.name.trim() ? 'pointer' : 'not-allowed' }}>
            {workout ? '✓ Save Changes' : '✓ Add to Library'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { id: 'name',         label: 'Name A–Z' },
  { id: 'most_assigned',label: 'Most Assigned' },
  { id: 'least_engaged',label: 'Least Engaged' },
  { id: 'recently_updated', label: 'Recently Updated' },
  { id: 'not_assigned', label: 'Not Assigned' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabCoachContent({
  events, polls, posts, classes: gymClasses = [], recaps = [], shoutouts = [],
  checkIns, ci30, avatarMap, allMemberships = [],
  openModal, now,
  onDeletePost     = () => {},
  onDeleteEvent    = () => {},
  onDeleteClass    = () => {},
  onDeletePoll     = () => {},
  onDeleteRecap    = () => {},
  onDeleteShoutout = () => {},
}) {
  const [workouts,     setWorkouts]     = useState(() => { try { return JSON.parse(localStorage.getItem('coachWorkoutLibrary') || 'null') || DEFAULT_WORKOUTS; } catch { return DEFAULT_WORKOUTS; } });
  const [editorOpen,   setEditorOpen]   = useState(false);
  const [editingWO,    setEditingWO]    = useState(null);
  const [selectedWO,   setSelectedWO]   = useState(null);
  const [assignWO,     setAssignWO]     = useState(null);
  const [libSearch,    setLibSearch]    = useState('');
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [sortBy,       setSortBy]       = useState('name');
  const [showSort,     setShowSort]     = useState(false);
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

  const handleDelete    = (id)  => { saveWorkouts(workouts.filter(w => w.id !== id)); if (selectedWO?.id === id) setSelectedWO(null); };
  const handleDuplicate = (wo)  => saveWorkouts([{ ...wo, id: uid(), name: `${wo.name} (copy)`, updated_at: new Date().toISOString() }, ...workouts]);
  const handleEdit      = (wo)  => { setEditingWO(wo); setEditorOpen(true); };
  const handleNew       = ()    => { setEditingWO(null); setEditorOpen(true); };

  // ── Compute per-workout stats (derived from assignments in localStorage / props) ──
  // Since real assignment data lives in backend, we simulate from AssignedWorkout data
  // stored locally + checkIns as a proxy for activity
  const workoutStats = useMemo(() => {
    const stats = {};
    workouts.forEach(wo => {
      // Try to get assigned member IDs from localStorage assignment records
      let assignedIds = [];
      try {
        const assignments = JSON.parse(localStorage.getItem('coachWorkoutAssignments') || '{}');
        assignedIds = assignments[wo.id] || [];
      } catch {}

      const assignedCount   = assignedIds.length;
      // Simulate completion: assigned members who checked in recently
      const completedCount  = assignedIds.filter(uid => checkIns.some(c => c.user_id === uid && (now - new Date(c.check_in_date)) < 30 * 864e5)).length;
      const completionRate  = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : 0;
      // Days since any assigned client was active
      const lastActivities  = assignedIds.map(uid => {
        const last = checkIns.filter(c => c.user_id === uid).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
        return last ? (now - new Date(last.check_in_date)) / 864e5 : 999;
      });
      const daysSinceActivity = assignedCount === 0 ? 999 : Math.min(...lastActivities);
      const daysSinceUpdate   = wo.updated_at ? Math.floor((now - new Date(wo.updated_at)) / 864e5) : null;

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

    if (sortBy === 'most_assigned')   list = [...list].sort((a, b) => s(b.id).assignedCount - s(a.id).assignedCount);
    if (sortBy === 'least_engaged')   list = [...list].sort((a, b) => s(a.id).completionRate - s(b.id).completionRate);
    if (sortBy === 'recently_updated')list = [...list].sort((a, b) => (s(a.id).daysSinceUpdate ?? 999) - (s(b.id).daysSinceUpdate ?? 999));
    if (sortBy === 'not_assigned')    list = list.filter(w => s(w.id).assignedCount === 0);
    if (sortBy === 'name')            list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return list;
  }, [workouts, typeFilter, libSearch, sortBy, workoutStats]);

  const upcomingEvents = useMemo(() => events.filter(e => new Date(e.event_date) >= now), [events, now]);
  const engagementScore = useMemo(() =>
    posts.reduce((s, p) => s + (p.likes?.length || 0) + (p.comments?.length || 0), 0) +
    polls.reduce((s, p) => s + (p.voters?.length || 0), 0),
    [posts, polls]
  );

  const cardStyle = { background: DC.bgSurface, border: `1px solid ${DC.border}`, borderRadius: 12, padding: 16, flexShrink: 0 };
  const currentSort = SORT_OPTIONS.find(s => s.id === sortBy);

  // Library-level health summary
  const healthSummary = useMemo(() => {
    let healthy = 0, needsAttention = 0, lowEngagement = 0, unassigned = 0;
    workouts.forEach(wo => {
      const s = workoutStats[wo.id];
      if (!s) return;
      const h = getHealth(s.completionRate, s.assignedCount, s.daysSinceUpdate ?? 999);
      if (h.label === 'Healthy')          healthy++;
      else if (h.label === 'Needs Attention') needsAttention++;
      else if (h.label === 'Low Engagement')  lowEngagement++;
      else unassigned++;
    });
    return { healthy, needsAttention, lowEngagement, unassigned };
  }, [workouts, workoutStats]);

  return (
    <>
      <style>{CSS}</style>
      {assignWO && (
        <AssignModal
          workout={assignWO}
          allMemberships={allMemberships}
          myClasses={gymClasses}
          avatarMap={avatarMap}
          openModal={openModal}
          onClose={() => setAssignWO(null)}
        />
      )}

      <div className="twp-root">

        {/* ══ LEFT ══════════════════════════════════════════════════════════ */}
        <div className="twp-left">

          {/* ── EDITOR ── */}
          {editorOpen && (
            <WorkoutEditor
              workout={editingWO}
              onSave={handleSave}
              onCancel={() => { setEditorOpen(false); setEditingWO(null); }}
            />
          )}

          {!editorOpen && (
            <>
              {/* ── Library header + health summary ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <SectionLabel>Workout Library</SectionLabel>
                <button onClick={handleNew} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: DC.purpleDim, border: `1px solid ${DC.purpleBrd}`, color: DC.purple, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Plus style={{ width: 12, height: 12 }}/> New Workout
                </button>
              </div>

              {/* Health summary strip */}
              {workouts.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[
                    { label: 'Healthy',         value: healthSummary.healthy,        color: '#10b981' },
                    { label: 'Needs Attention',  value: healthSummary.needsAttention, color: '#f59e0b' },
                    { label: 'Low Engagement',   value: healthSummary.lowEngagement,  color: '#ef4444' },
                    { label: 'Not Assigned',     value: healthSummary.unassigned,     color: '#64748b' },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: DC.bgSurface, border: `1px solid ${DC.border}`, textAlign: 'center', cursor: i > 0 && s.value > 0 ? 'pointer' : 'default' }}
                      onClick={() => { if (i === 3 && s.value > 0) setSortBy('not_assigned'); else if (i === 2 && s.value > 0) setSortBy('least_engaged'); }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: DC.t4, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Low engagement alerts ── */}
              <LowEngagementAlerts
                workouts={workouts}
                workoutStats={workoutStats}
                allMemberships={allMemberships}
                checkIns={checkIns}
                now={now}
                onAssign={setAssignWO}
                openModal={openModal}
              />

              {/* ── Search + filter + sort ── */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 140 }}>
                  <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: '#3a5070' }}/>
                  <input value={libSearch} onChange={e => setLibSearch(e.target.value)} placeholder="Search workouts…" style={{ width: '100%', padding: '7px 12px 7px 30px', borderRadius: 9, background: DC.bgSurface, border: `1px solid ${DC.border}`, color: DC.t1, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}/>
                </div>

                {/* Sort dropdown */}
                <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={() => setShowSort(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: DC.bgSurface, border: `1px solid ${showSort ? DC.purpleBrd : DC.border}`, color: showSort ? DC.purple : DC.t2, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    <ArrowUpDown style={{ width: 11, height: 11 }}/> {currentSort?.label || 'Sort'}
                  </button>
                  {showSort && (
                    <div style={{ position: 'absolute', top: '110%', right: 0, background: '#1a1f36', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.5)', minWidth: 170, overflow: 'hidden', zIndex: 999 }}>
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.id} onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                          style={{ width: '100%', padding: '9px 14px', fontSize: 11, fontWeight: sortBy === opt.id ? 800 : 500, color: sortBy === opt.id ? '#a78bfa' : '#d4e4f4', background: sortBy === opt.id ? 'rgba(167,139,250,0.1)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 7 }}
                          onMouseEnter={e => { if (sortBy !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { if (sortBy !== opt.id) e.currentTarget.style.background = 'none'; }}>
                          {sortBy === opt.id && <Check style={{ width: 10, height: 10 }}/>}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Type filter chips */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[{ id: 'all', label: 'All' }, ...Object.entries(WORKOUT_TYPES).map(([k, v]) => ({ id: k, label: `${v.emoji} ${v.label}` }))].map(t => (
                  <button key={t.id} onClick={() => setTypeFilter(t.id)} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 10, fontWeight: typeFilter === t.id ? 700 : 500, background: typeFilter === t.id ? 'rgba(167,139,250,0.12)' : 'transparent', border: `1px solid ${typeFilter === t.id ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.06)'}`, color: typeFilter === t.id ? '#a78bfa' : '#3a5070', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* ── Workout grid ── */}
              {filteredWorkouts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', borderRadius: 12, background: DC.bgSurface, border: `1px solid ${DC.border}` }}>
                  <Dumbbell style={{ width: 28, height: 28, color: '#3a5070', margin: '0 auto 10px' }}/>
                  <p style={{ fontSize: 12, color: '#3a5070', fontWeight: 600, margin: '0 0 12px' }}>{sortBy === 'not_assigned' ? 'All workouts are assigned' : 'No workouts found'}</p>
                  <button onClick={handleNew} style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>Create a workout</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                  {filteredWorkouts.map((wo, i) => (
                    <WorkoutCard
                      key={wo.id || i}
                      workout={wo}
                      stats={workoutStats[wo.id] || { assignedCount: 0, completionRate: 0, daysSinceActivity: 999, daysSinceUpdate: null }}
                      isSelected={selectedWO?.id === wo.id}
                      onSelect={wo => setSelectedWO(selectedWO?.id === wo.id ? null : wo)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onAssign={setAssignWO}
                    />
                  ))}
                </div>
              )}

              {/* ── Workout Detail Panel ── */}
              {selectedWO && (
                <WorkoutDetailPanel
                  workout={selectedWO}
                  stats={workoutStats[selectedWO.id] || { assignedCount: 0, completionRate: 0, daysSinceActivity: 999, daysSinceUpdate: null, assignedMemberIds: [] }}
                  allMemberships={allMemberships}
                  checkIns={checkIns}
                  now={now}
                  onEdit={handleEdit}
                  onAssign={setAssignWO}
                  onClose={() => setSelectedWO(null)}
                  openModal={openModal}
                />
              )}
            </>
          )}
        </div>

        {/* ══ RIGHT SIDEBAR ══════════════════════════════════════════════════ */}
        <div className="twp-right">

          {/* Quick actions */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8', marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { icon: Dumbbell,          label: 'New Workout',   sub: `${workouts.length} in library`,          color: '#a78bfa', action: handleNew },
                { icon: MessageSquarePlus, label: 'Post Update',   sub: 'Engage members',                         color: '#38bdf8', action: () => openModal('post')     },
                { icon: BarChart2,         label: 'New Poll',      sub: `${polls.length} active`,                 color: '#34d399', action: () => openModal('poll')      },
                { icon: Trophy,            label: 'New Challenge', sub: 'Drive consistency',                      color: '#fbbf24', action: () => openModal('challenge')  },
              ].map(({ icon: Ic, label, sub, color, action }, i) => (
                <button key={i} onClick={action} className="assign-btn"
                  onMouseEnter={e => { e.currentTarget.style.background = `${color}0f`; e.currentTarget.style.borderColor = `${color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic style={{ width: 12, height: 12, color }}/>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8' }}>{label}</div>
                    <div style={{ fontSize: 9, color: DC.t4 }}>{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Library stats */}
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8', marginBottom: 12 }}>Library Stats</div>
            {Object.entries(WORKOUT_TYPES).map(([key, t]) => {
              const count = workouts.filter(w => w.type === key).length;
              if (count === 0) return null;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 14 }}>{t.emoji}</span>
                  <span style={{ flex: 1, fontSize: 11, color: '#8ba0b8', fontWeight: 500 }}>{t.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: t.color, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6, padding: '1px 8px' }}>{count}</span>
                </div>
              );
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 0' }}>
              <span style={{ fontSize: 14 }}>📚</span>
              <span style={{ flex: 1, fontSize: 11, color: '#8ba0b8', fontWeight: 500 }}>Total workouts</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#a78bfa' }}>{workouts.length}</span>
            </div>
          </div>

          {/* Content engagement */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Content Engagement</div>
              <Zap style={{ width: 13, height: 13, color: '#a78bfa' }}/>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f4f8', letterSpacing: '-0.04em', marginBottom: 8 }}>{engagementScore}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: 'Likes',      val: posts.reduce((s, p) => s + (p.likes?.length || 0), 0),    color: '#f87171' },
                { label: 'Comments',   val: posts.reduce((s, p) => s + (p.comments?.length || 0), 0), color: '#38bdf8' },
                { label: 'Poll votes', val: polls.reduce((s, p) => s + (p.voters?.length || 0), 0),   color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: s.color }}>
                  {s.val} {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          {upcomingEvents.length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>Upcoming Events</div>
                <button onClick={() => openModal('event')} style={{ fontSize: 9, fontWeight: 700, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>+ New</button>
              </div>
              {upcomingEvents.slice(0, 3).map((ev, i) => {
                const d    = new Date(ev.event_date);
                const diff = Math.floor((d - now) / 86400000);
                return (
                  <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < Math.min(upcomingEvents.length, 3)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: 7, padding: '4px 6px', textAlign: 'center', minWidth: 30 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{format(d, 'd')}</div>
                      <div style={{ fontSize: 7, color: '#1a5a3a', textTransform: 'uppercase' }}>{format(d, 'MMM')}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f0f4f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      <div style={{ fontSize: 9, color: diff <= 2 ? '#f87171' : '#64748b' }}>{diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : `${diff}d away`}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent posts */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4f8' }}>My Recent Posts</div>
              <button onClick={() => openModal('post')} style={{ fontSize: 9, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 5, padding: '2px 7px', cursor: 'pointer' }}>+ New</button>
            </div>
            {posts.length === 0
              ? <div style={{ fontSize: 11, color: DC.t4, textAlign: 'center', padding: '10px 0' }}>No posts yet</div>
              : posts.slice(0, 3).map((p, i) => (
                <div key={p.id || i} style={{ padding: '6px 8px', borderRadius: 7, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: i < 2 ? 5 : 0, fontSize: 11, fontWeight: 600, color: '#8ba0b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.content?.split('\n')[0] || p.title || 'Post'}
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </>
  );
}