import React, { useState, useRef } from 'react';
import {
  TrendingUp, Flame, Zap, Bell, BellOff, Trash2,
  Plus, Minus, Edit3, Check, CheckCircle2, X, Clock,
  Dumbbell, Calendar,
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import confetti from 'canvas-confetti';

// ─────────────────────────────────────────────────────────────────────────────
// GOAL TYPE CONFIG  (mirrors AddGoalModal palette)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const a   = (rgb, o) => `rgba(${rgb},${o})`;
const hex2 = (hex, opacity) => `${hex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;

// ─────────────────────────────────────────────────────────────────────────────
// ARC RING  — 270° sweep SVG
// ─────────────────────────────────────────────────────────────────────────────

function ArcRing({ pct, rgb, hex, size = 120, stroke = 9 }) {
  const r    = (size - stroke * 2) / 2;
  const c    = size / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;          // 270° of the circle
  const off  = arc * (1 - Math.min(pct, 100) / 100);

  // milestone ticks at 25 / 50 / 75 %
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

      {/* Track */}
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke={a(rgb, 0.1)}
        strokeWidth={stroke}
        strokeDasharray={`${arc} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(135 ${c} ${c})`}
      />

      {/* Progress arc */}
      {pct > 0 && (
        <circle
          cx={c} cy={c} r={r}
          fill="none"
          stroke={`url(#arc-grad-${rgb.replace(/,/g, '')})`}
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circ}`}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform={`rotate(135 ${c} ${c})`}
          style={{
            filter: `drop-shadow(0 0 7px ${a(rgb, 0.55)})`,
            transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      )}

      {/* Milestone ticks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.reached ? hex : a(rgb, 0.25)}
          strokeWidth={1.5}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.4s ease' }}
        />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESS BUTTON  — tactile press mechanic used throughout
// ─────────────────────────────────────────────────────────────────────────────

function PressBtn({ onClick, disabled, className, style, children }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)} onTouchCancel={() => setPressed(false)}
      className={className}
      style={{
        ...style,
        transform: pressed && !disabled ? 'scale(0.94) translateY(1px)' : 'scale(1)',
        transition: pressed ? 'transform 0.07s ease' : 'transform 0.18s cubic-bezier(0.34,1.3,0.64,1)',
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function GoalCard({ goal, onUpdate, onDelete, onToggleReminder }) {
  const [isEditing,   setIsEditing]   = useState(false);
  const [editVal,     setEditVal]     = useState('');
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

  // Deadline
  const daysLeft   = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
  const isOverdue  = daysLeft !== null && daysLeft < 0;
  const isUrgent   = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  // Smart increment
  const increment = (() => {
    if (goal.goal_type !== 'numerical') return 1;
    if (goal.unit === 'kg' || goal.unit === 'lbs') return goal.target_value > 100 ? 5 : 2.5;
    return 1;
  })();

  // Display text under ring
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

  return (
    <div
      className="relative overflow-hidden rounded-[24px] select-none"
      style={{
        background: isCompleted
          ? 'linear-gradient(160deg,rgba(10,30,18,0.97),rgba(5,20,12,0.99))'
          : 'linear-gradient(160deg,rgba(10,14,32,0.97),rgba(5,8,20,0.99))',
        border: `1.5px solid ${isCompleted ? a(COMPLETED_RGB, 0.18) : a(cfg.rgb, 0.14)}`,
        boxShadow: isCompleted
          ? `0 4px 32px rgba(0,0,0,0.5), 0 0 40px ${a(COMPLETED_RGB, 0.08)}`
          : `0 4px 32px rgba(0,0,0,0.5), 0 0 40px ${a(cfg.rgb, 0.06)}`,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      {/* Ambient glow blob */}
      <div className="absolute -top-12 -left-8 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${a(rgb, 0.10)} 0%, transparent 70%)`,
          transition: 'background 0.4s ease',
        }} />

      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${hex} 40%, ${hex} 60%, transparent 100%)`, opacity: 0.7 }} />

      {/* Top shine */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.07) 50%,transparent 90%)' }} />

      <div className="relative p-5 space-y-4">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${isCompleted ? 'from-green-500 to-emerald-600' : cfg.grad} flex items-center justify-center flex-shrink-0`}
              style={{ boxShadow: `0 4px 14px ${a(rgb, 0.35)}` }}
            >
              {isCompleted
                ? <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                : <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              }
            </div>

            {/* Title + badges */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[16px] font-black text-white leading-tight truncate">{goal.title}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {/* Goal type pill */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ background: a(rgb, 0.12), color: hex, border: `1px solid ${a(rgb, 0.25)}` }}
                >
                  {cfg.label}
                </span>
                {/* Exercise badge */}
                {goal.exercise && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Dumbbell className="w-2.5 h-2.5" />
                    {goal.exercise}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onToggleReminder(goal)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{
                background: goal.reminder_enabled ? a(rgb, 0.12) : 'rgba(255,255,255,0.04)',
                color: goal.reminder_enabled ? hex : 'rgba(255,255,255,0.25)',
                border: `1px solid ${goal.reminder_enabled ? a(rgb, 0.22) : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {goal.reminder_enabled
                ? <Bell className="w-3.5 h-3.5" />
                : <BellOff className="w-3.5 h-3.5" />
              }
            </button>
            <button
              onClick={() => onDelete(goal.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.5)', border: '1px solid rgba(239,68,68,0.1)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── PROGRESS SECTION ── */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Arc ring */}
          <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 108, height: 108 }}>
            <ArcRing pct={progress} rgb={rgb} hex={hex} size={108} stroke={8} />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[22px] font-black leading-none" style={{ color: hex }}>
                {Math.round(progress)}
                <span className="text-[12px] font-bold opacity-70">%</span>
              </span>
              {isCompleted && (
                <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: hex, opacity: 0.7 }}>Done</span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Value display */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Progress</p>
              <p className="text-[20px] font-black text-white leading-none">{valueDisplay.value}</p>
              <p className="text-[11px] font-semibold mt-0.5" style={{ color: hex, opacity: 0.65 }}>{valueDisplay.unit}</p>
            </div>

            {/* Deadline */}
            {goal.deadline && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 flex-shrink-0"
                  style={{ color: isOverdue ? '#f87171' : isUrgent ? '#fb923c' : 'rgba(255,255,255,0.3)' }} />
                <span className="text-[11px] font-bold"
                  style={{ color: isOverdue ? '#f87171' : isUrgent ? '#fb923c' : 'rgba(255,255,255,0.35)' }}>
                  {isOverdue
                    ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0
                      ? 'Due today'
                      : `${daysLeft}d left · ${format(new Date(goal.deadline), 'MMM d')}`
                  }
                </span>
              </div>
            )}

            {/* Milestone progress pips */}
            <div className="flex items-center gap-1.5">
              {[25, 50, 75, 100].map(m => (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-1 rounded-full transition-all duration-500"
                    style={{ background: progress >= m ? hex : a(rgb, 0.15), boxShadow: progress >= m ? `0 0 5px ${a(rgb, 0.5)}` : 'none' }} />
                  <span className="text-[8px] font-bold" style={{ color: progress >= m ? hex : 'rgba(255,255,255,0.15)' }}>{m}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── UPDATE CONTROLS ── */}
        {!isCompleted && (
          isAutoTracked ? (
            /* Auto-tracked badge */
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{ background: a(rgb, 0.07), border: `1px solid ${a(rgb, 0.15)}` }}>
              <Zap className="w-3.5 h-3.5" style={{ color: hex }} />
              <span className="text-[11px] font-bold" style={{ color: hex, opacity: 0.75 }}>
                Auto-tracked from your check-ins
              </span>
            </div>
          ) : isEditing ? (
            /* Manual edit input */
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${a(rgb, 0.3)}` }}>
              <div className="flex items-center gap-0">
                <input
                  ref={inputRef}
                  type="number"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setIsEditing(false); }}
                  style={{ fontSize: 16, fontFamily: 'inherit' }}
                  className="flex-1 px-4 py-3 bg-transparent text-white text-[15px] font-black focus:outline-none placeholder-slate-600"
                  placeholder="Enter value…"
                />
                <button onClick={() => setIsEditing(false)}
                  className="w-11 flex items-center justify-center h-full py-3 text-slate-500 hover:text-slate-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
                <PressBtn onClick={handleEditSave}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 font-black text-[13px] text-white"
                  style={{ background: hex, minWidth: 72 }}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} /> Save
                </PressBtn>
              </div>
            </div>
          ) : (
            /* Quick step controls */
            <div className="flex items-center gap-2">
              {/* Minus */}
              <PressBtn
                onClick={() => handleStep(-increment)}
                disabled={(goal.current_value ?? 0) <= 0}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-25"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)' }}
              >
                <Minus className="w-4 h-4" strokeWidth={2.5} />
              </PressBtn>

              {/* Center: current + unit */}
              <button onClick={openEdit}
                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 group transition-all active:scale-[0.97]"
                style={{ background: a(rgb, 0.09), border: `1px solid ${a(rgb, 0.22)}` }}>
                <span className="text-[15px] font-black text-white">{goal.current_value ?? 0}</span>
                <span className="text-[11px] font-bold" style={{ color: hex, opacity: 0.65 }}>{goal.unit || ''}</span>
                <Edit3 className="w-3 h-3 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: hex }} />
              </button>

              {/* Plus */}
              <PressBtn
                onClick={() => handleStep(+increment)}
                className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl font-black text-[13px] text-white flex-shrink-0"
                style={{ background: hex, boxShadow: `0 3px 0 0 ${hex2(hex, 0.35)}, 0 4px 16px ${a(rgb, 0.3)}` }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>+{increment}{goal.unit && goal.unit !== 'reps' ? ` ${goal.unit}` : ''}</span>
              </PressBtn>
            </div>
          )
        )}

        {/* ── MARK COMPLETE ── (shown when 100% but not yet marked done) */}
        {isReady && (
          <PressBtn
            onClick={handleComplete}
            className="w-full h-11 rounded-xl font-black text-[14px] text-white flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #10b981)',
              boxShadow: '0 3px 0 0 rgba(16,185,129,0.35), 0 6px 20px rgba(34,197,94,0.25)',
            }}
          >
            <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={2.5} />
            Mark as Complete
          </PressBtn>
        )}

        {/* ── COMPLETED STATE ── */}
        {isCompleted && (
          <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
            style={{ background: a(COMPLETED_RGB, 0.08), border: `1px solid ${a(COMPLETED_RGB, 0.2)}` }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: COMPLETED_HEX }} />
            <span className="text-[12px] font-black" style={{ color: COMPLETED_HEX }}>Goal achieved</span>
          </div>
        )}

      </div>
    </div>
  );
}
