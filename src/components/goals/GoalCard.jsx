import React, { useState, useRef } from 'react';
import {
  TrendingUp, Flame, Zap, Bell, BellOff,
  Plus, Minus, Edit3, Check, CheckCircle2, X, Clock,
  Dumbbell, MoreHorizontal, Loader2, Trash2,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import confetti from 'canvas-confetti';

const TYPE_CONFIG = {
  numerical: {
    label: 'Lift Target',
    Icon: TrendingUp,
    rgb: '56,189,248',
    hex: '#38bdf8',
    grad: 'from-blue-500 to-cyan-500',
  },
  frequency: {
    label: 'Frequency',
    Icon: Zap,
    rgb: '251,146,60',
    hex: '#fb923c',
    grad: 'from-amber-400 to-orange-500',
  },
  consistency: {
    label: 'Streak',
    Icon: Flame,
    rgb: '52,211,153',
    hex: '#34d399',
    grad: 'from-emerald-400 to-teal-500',
  },
};

const COMPLETED_RGB = '74,222,128';
const COMPLETED_HEX = '#4ade80';

const a = (rgb, o) => `rgba(${rgb},${o})`;
const hex2 = (hex, opacity) => `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;

// ── Shared confirm dialog — same style as remove-friends / post delete ────────
function ConfirmDialog({ open, onClose, title, description, confirmLabel, confirmClass, onConfirm, isPending }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white p-6">
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-slate-300 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_3px_0_0_#1e293b,0_6px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu disabled:opacity-50 ${confirmClass}`}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

function ArcRing({ pct, rgb, hex, size = 120, stroke = 9 }) {
  const r    = (size - stroke * 2) / 2;
  const c    = size / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const off  = arc * (1 - Math.min(pct, 100) / 100);

  const ticks = [25, 50, 75].map(p => {
    const angle = (135 + (270 * p) / 100) * (Math.PI / 180);
    const inner = r - stroke / 2 - 1;
    const outer = r + stroke / 2 + 1;
    return {
      x1: c + inner * Math.cos(angle),
      y1: c + inner * Math.sin(angle),
      x2: c + outer * Math.cos(angle),
      y2: c + outer * Math.sin(angle),
      reached: pct >= p,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`arc-grad-${rgb.replace(/,/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hex} stopOpacity="0.7" />
          <stop offset="100%" stopColor={hex} />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke={a(rgb, 0.1)} strokeWidth={stroke}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(135 ${c} ${c})`} />
      {pct > 0 && (
        <circle cx={c} cy={c} r={r} fill="none"
          stroke={`url(#arc-grad-${rgb.replace(/,/g, '')})`}
          strokeWidth={stroke} strokeDasharray={`${arc} ${circ}`} strokeDashoffset={off}
          strokeLinecap="round" transform={`rotate(135 ${c} ${c})`}
          style={{
            filter: `drop-shadow(0 0 4px ${a(rgb, 0.4)})`,
            transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)',
          }} />
      )}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.reached ? hex : a(rgb, 0.25)} strokeWidth={1.5} strokeLinecap="round"
          style={{ transition: 'stroke 0.4s ease' }} />
      ))}
    </svg>
  );
}

function PressBtn({ onClick, disabled, className, style, children }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)} onTouchCancel={() => setPressed(false)}
      className={className}
      style={{
        ...style,
        transform: pressed && !disabled ? 'scale(0.94) translateY(1px)' : 'scale(1)',
        transition: pressed ? 'transform 0.07s ease' : 'transform 0.18s cubic-bezier(0.34,1.3,0.64,1)',
      }}>
      {children}
    </button>
  );
}

// ─── 3-dot context menu ───────────────────────────────────────────────────────
function DotMenu({ goal, onRequestDelete, onRequestToggleReminder }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-8 h-8 flex items-center justify-center transition-opacity active:scale-90 duration-100"
        style={{ color: open ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-9 z-20 rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(28,32,56,0.98) 0%, rgba(8,10,22,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.09)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              minWidth: 160,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.07) 50%,transparent 90%)' }} />

            <button
              onClick={() => { onRequestToggleReminder(); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 transition-colors"
              style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 700 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {goal.reminder_enabled
                ? <BellOff className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                : <Bell className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
              }
              {goal.reminder_enabled ? 'Mute reminder' : 'Set reminder'}
            </button>

            <div className="mx-3 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

            <button
              onClick={() => { onRequestDelete(); setOpen(false); }}
              className="w-full px-4 py-2.5 text-left flex items-center gap-2 transition-colors"
              style={{ color: '#f87171', fontSize: 12, fontWeight: 700 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function GoalCard({ goal, onUpdate, onDelete, onToggleReminder }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editVal,   setEditVal]   = useState('');
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [showReminderConfirm, setShowReminderConfirm] = useState(false);
  const inputRef = useRef(null);

  const cfg         = TYPE_CONFIG[goal.goal_type] || TYPE_CONFIG.numerical;
  const isCompleted = goal.status === 'completed';
  const progress    = goal.target_value > 0
    ? Math.min((goal.current_value / goal.target_value) * 100, 100)
    : 0;
  const isReady     = progress >= 100 && !isCompleted;

  const rgb = isCompleted ? COMPLETED_RGB : cfg.rgb;
  const hex = isCompleted ? COMPLETED_HEX : cfg.hex;
  const { Icon } = cfg;

  const daysLeft  = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent  = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const increment = (() => {
    if (goal.goal_type !== 'numerical') return 1;
    if (goal.unit === 'kg' || goal.unit === 'lbs') return goal.target_value > 100 ? 5 : 2.5;
    return 1;
  })();

  const valueDisplay = (() => {
    const cur = goal.current_value ?? 0;
    const tgt = goal.target_value ?? 0;
    if (goal.goal_type === 'frequency')   return { value: `${cur} / ${tgt}`, unit: `sessions ${goal.frequency_period || 'weekly'}` };
    if (goal.goal_type === 'consistency') return { value: `${cur} / ${tgt}`, unit: 'day streak' };
    return { value: `${cur} / ${tgt}`, unit: goal.unit || '' };
  })();

  const updateMilestones = val =>
    (goal.milestones || []).map(m => ({ ...m, reached: val >= m.value }));

  const handleStep = delta => {
    const next = Math.max(0, (goal.current_value ?? 0) + delta);
    onUpdate(goal, next, goal.status, updateMilestones(next));
  };

  const handleEditSave = () => {
    const next = parseFloat(editVal);
    if (isNaN(next) || next < 0) { setIsEditing(false); return; }
    const nextPct = (next / goal.target_value) * 100;
    if (nextPct >= 100 && progress < 100) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } else if (nextPct >= 75 && progress < 75) {
      confetti({ particleCount: 50, spread: 50 });
    }
    onUpdate(goal, next, goal.status, updateMilestones(next));
    setIsEditing(false);
  };

  const handleComplete = () => {
    confetti({ particleCount: 180, spread: 110, origin: { y: 0.55 } });
    onUpdate(goal, goal.current_value, 'completed', updateMilestones(goal.current_value));
  };

  const openEdit = () => {
    setEditVal(String(goal.current_value ?? 0));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const isAutoTracked = goal.goal_type === 'consistency' || goal.goal_type === 'frequency';

  // Reminder confirm copy
  const reminderTitle = goal.reminder_enabled ? 'Mute Reminder?' : 'Set Reminder?';
  const reminderDesc  = goal.reminder_enabled
    ? 'You won\'t receive any more reminders for this goal.'
    : 'You\'ll receive reminders to help you stay on track with this goal.';
  const reminderLabel = goal.reminder_enabled ? 'Mute' : 'Enable';
  const reminderClass = goal.reminder_enabled
    ? 'bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 shadow-[0_3px_0_0_#1e293b,0_6px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]'
    : 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 shadow-[0_3px_0_0_#1a3fa8,0_6px_16px_rgba(0,80,200,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]';

  return (
    <>
      <div
        className="relative overflow-hidden rounded-[22px] select-none"
        style={{
          background: isCompleted
            ? 'linear-gradient(135deg, rgba(24,38,28,0.80) 0%, rgba(8,14,10,0.94) 100%)'
            : 'linear-gradient(135deg, rgba(30,35,60,0.78) 0%, rgba(8,10,20,0.94) 100%)',
          border: `1px solid ${isCompleted ? a(COMPLETED_RGB, 0.16) : 'rgba(255,255,255,0.07)'}`,
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          boxShadow: isCompleted
            ? `0 2px 20px rgba(0,0,0,0.4), 0 0 28px ${a(COMPLETED_RGB, 0.05)}`
            : '0 2px 20px rgba(0,0,0,0.4)',
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 5%, ${hex} 35%, ${hex} 65%, transparent 95%)`,
            opacity: 0.45,
          }} />

        {/* Top shine */}
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.07) 50%,transparent 90%)' }} />

<div style={{ position: 'relative', padding: '18px 18px 0' }}>

  {/* ── HEADER ── */}
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 17.5, fontWeight: 800,
        color: '#fff', letterSpacing: -0.4,
        lineHeight: 1.2, marginBottom: 9,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
      }}>
        {goal.title}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
          padding: '3.5px 9px', borderRadius: 100,
          background: a(rgb, 0.10), color: hex, border: `1px solid ${a(rgb, 0.22)}`
        }}>
          {cfg.label}
        </span>
        {goal.exercise && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
            padding: '3.5px 9px', borderRadius: 100,
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.28)',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', gap: 4
          }}>
            <Dumbbell style={{ width: 9, height: 9 }} />
            {goal.exercise}
          </span>
        )}
      </div>
    </div>
    <DotMenu
      goal={goal}
      onRequestDelete={() => setShowDeleteConfirm(true)}
      onRequestToggleReminder={() => setShowReminderConfirm(true)}
    />
  </div>

  {/* ── SEPARATOR ── */}
  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 -18px' }} />

  {/* ── PROGRESS ── */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 0 16px' }}>

    {/* Ring */}
    <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ArcRing pct={progress} rgb={rgb} hex={hex} size={108} stroke={7.5} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 25, fontWeight: 800, color: hex, lineHeight: 1 }}>
          {Math.round(progress)}<sup style={{ fontSize: 12, fontWeight: 700, opacity: 0.6, verticalAlign: 'super' }}>%</sup>
        </span>
        {isCompleted && (
          <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>Done</span>
        )}
        {!isCompleted && (
          <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginTop: 4 }}>of target</span>
        )}
      </div>
    </div>

    {/* Stats */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>Progress</p>
      <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -0.5 }}>
        {valueDisplay.value}
        <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.22)', marginLeft: 4 }}>/ {goal.target_value}</span>
      </p>
      <p style={{ fontSize: 11, fontWeight: 600, color: hex, opacity: 0.65, marginTop: 3 }}>{valueDisplay.unit}</p>

      {goal.deadline && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '10px 0 11px' }}>
          <Clock style={{
            width: 10, height: 10, flexShrink: 0,
            color: isOverdue ? '#f87171' : isUrgent ? '#fb923c' : 'rgba(255,255,255,0.28)'
          }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: isOverdue ? '#f87171' : isUrgent ? '#fb923c' : 'rgba(255,255,255,0.26)' }}>
            {isOverdue
              ? `${Math.abs(daysLeft)}d overdue`
              : daysLeft === 0
                ? 'Due today'
                : `${daysLeft}d left · ${format(new Date(goal.deadline), 'MMM d')}`}
          </span>
        </div>
      )}

      {/* Milestone track */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
        {[25, 50, 75, 100].map(m => {
          const filled = progress >= m;
          return (
            <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: '100%', height: 2.5, borderRadius: 10,
                background: filled ? hex : 'rgba(255,255,255,0.07)',
                boxShadow: filled ? `0 0 5px ${a(rgb, 0.5)}` : 'none',
                transition: 'all 0.5s ease'
              }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: filled ? hex : 'rgba(255,255,255,0.12)' }}>{m}%</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>

  {/* ── SEPARATOR ── */}
  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 -18px' }} />

  {/* ── CONTROLS ── */}
  <div style={{ padding: '15px 0 18px' }}>
    {!isCompleted && (
      isAutoTracked ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          height: 44, borderRadius: 13,
          background: a(rgb, 0.06), border: `1px solid ${a(rgb, 0.14)}`,
          fontSize: 11, fontWeight: 600, color: hex
        }}>
          <Zap style={{ width: 13, height: 13 }} />
          Auto-tracked from your check-ins
        </div>
      ) : isEditing ? (
        <div style={{
          display: 'flex', alignItems: 'center',
          borderRadius: 13, overflow: 'hidden',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${a(rgb, 0.3)}`
        }}>
          <input
            ref={inputRef}
            type="number"
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setIsEditing(false); }}
            style={{
              flex: 1, padding: '0 14px', height: 44,
              background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 15, fontWeight: 700,
              fontFamily: "'Syne', sans-serif"
            }}
            placeholder="Enter value…"
          />
          <button
            onClick={() => setIsEditing(false)}
            style={{ width: 38, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)' }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
          <PressBtn
            onClick={handleEditSave}
            style={{
              padding: '0 16px', height: 44, background: hex, border: 'none',
              color: '#050e1f', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5
            }}
          >
            <Check style={{ width: 12, height: 12 }} strokeWidth={3} />
            Save
          </PressBtn>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PressBtn
            onClick={() => handleStep(-increment)}
            disabled={(goal.current_value ?? 0) <= 0}
            style={{
              width: 44, height: 44, borderRadius: 13, flexShrink: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)', opacity: (goal.current_value ?? 0) <= 0 ? 0.2 : 1
            }}
          >
            <Minus style={{ width: 15, height: 15 }} strokeWidth={2.5} />
          </PressBtn>

          <button
            onClick={openEdit}
            style={{
              flex: 1, height: 44, borderRadius: 13,
              background: a(rgb, 0.06), border: `1px solid ${a(rgb, 0.15)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer', transition: 'background 0.12s'
            }}
          >
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: '#fff' }}>{goal.current_value ?? 0}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: hex, opacity: 0.6 }}>{goal.unit || ''}</span>
            <Edit3 style={{ width: 11, height: 11, opacity: 0.18, color: hex }} />
          </button>

          <PressBtn
            onClick={() => handleStep(+increment)}
            style={{
              height: 44, padding: '0 15px', borderRadius: 13, flexShrink: 0,
              background: hex, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: '#050e1f', fontSize: 13.5, fontWeight: 700,
              boxShadow: `0 3px 0 ${hex2(hex, 0.3)}, 0 5px 18px ${a(rgb, 0.2)}`,
              whiteSpace: 'nowrap'
            }}
          >
            <Plus style={{ width: 13, height: 13 }} strokeWidth={3} />
            +{increment}{goal.unit && goal.unit !== 'reps' ? ` ${goal.unit}` : ''}
          </PressBtn>
        </div>
      )
    )}

    {isReady && (
      <PressBtn
        onClick={handleComplete}
        style={{
          width: '100%', height: 44, borderRadius: 13, marginTop: 9,
          background: '#18a05a', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          color: '#fff', fontSize: 13.5, fontWeight: 700,
          boxShadow: '0 3px 0 #0d6638, 0 5px 16px rgba(34,197,94,0.14)'
        }}
      >
        <CheckCircle2 style={{ width: 15, height: 15 }} strokeWidth={2.5} />
        Mark as Complete
      </PressBtn>
    )}

    {isCompleted && (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        height: 44, borderRadius: 13, marginTop: 9,
        background: a(COMPLETED_RGB, 0.07), border: `1px solid ${a(COMPLETED_RGB, 0.15)}`,
        fontSize: 12.5, fontWeight: 700, color: COMPLETED_HEX
      }}>
        <CheckCircle2 style={{ width: 14, height: 14 }} />
        Goal achieved
      </div>
    )}
  </div>

</div>
      </div>

      {/* ── Delete goal confirm ── */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Goal?"
        description="This goal and all its progress will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        confirmClass="bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_3px_0_0_#7f1d1d,0_6px_16px_rgba(200,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
        onConfirm={() => { onDelete(goal.id); setShowDeleteConfirm(false); }}
      />

      {/* ── Reminder toggle confirm ── */}
      <ConfirmDialog
        open={showReminderConfirm}
        onClose={() => setShowReminderConfirm(false)}
        title={reminderTitle}
        description={reminderDesc}
        confirmLabel={reminderLabel}
        confirmClass={reminderClass}
        onConfirm={() => { onToggleReminder(goal); setShowReminderConfirm(false); }}
      />
    </>
  );
}

export default React.memo(GoalCard);