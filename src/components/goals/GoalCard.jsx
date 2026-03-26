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

        <div className="relative p-5 space-y-4">

          {/* ── HEADER ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-[15px] font-black text-white leading-tight truncate">{goal.title}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ background: a(rgb, 0.10), color: hex, border: `1px solid ${a(rgb, 0.2)}` }}
                  >
                    {cfg.label}
                  </span>
                  {goal.exercise && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Dumbbell className="w-2.5 h-2.5" />
                      {goal.exercise}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3-dot menu — now opens confirm dialogs */}
            <DotMenu
              goal={goal}
              onRequestDelete={() => setShowDeleteConfirm(true)}
              onRequestToggleReminder={() => setShowReminderConfirm(true)}
            />
          </div>

          {/* ── PROGRESS SECTION ── */}
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 108, height: 108 }}>
              <ArcRing pct={progress} rgb={rgb} hex={hex} size={108} stroke={8} />
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

            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Progress</p>
                <p className="text-[20px] font-black text-white leading-none">{valueDisplay.value}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: hex, opacity: 0.6 }}>{valueDisplay.unit}</p>
              </div>
              {goal.deadline && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 flex-shrink-0"
                    style={{ color: isOverdue ? '#f87171' : isUrgent ? '#fb923c' : 'rgba(255,255,255,0.25)' }} />
                  <span className="text-[11px] font-bold"
                    style={{ color: isOverdue ? '#f87171' : isUrgent ? '#fb923c' : 'rgba(255,255,255,0.3)' }}>
                    {isOverdue
                      ? `${Math.abs(daysLeft)}d overdue`
                      : daysLeft === 0
                        ? 'Due today'
                        : `${daysLeft}d left · ${format(new Date(goal.deadline), 'MMM d')}`
                    }
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                {[25, 50, 75, 100].map(m => (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-1 rounded-full transition-all duration-500"
                      style={{
                        background: progress >= m ? hex : a(rgb, 0.12),
                        boxShadow: progress >= m ? `0 0 4px ${a(rgb, 0.35)}` : 'none',
                      }} />
                    <span className="text-[8px] font-bold" style={{ color: progress >= m ? hex : 'rgba(255,255,255,0.13)' }}>{m}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── UPDATE CONTROLS ── */}
          {!isCompleted && (
            isAutoTracked ? (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
                style={{ background: a(rgb, 0.06), border: `1px solid ${a(rgb, 0.12)}` }}>
                <Zap className="w-3.5 h-3.5" style={{ color: hex }} />
                <span className="text-[11px] font-bold" style={{ color: hex, opacity: 0.7 }}>
                  Auto-tracked from your check-ins
                </span>
              </div>
            ) : isEditing ? (
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${a(rgb, 0.25)}` }}>
                <div className="flex items-center">
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
              <div className="flex items-center gap-2">
                <PressBtn
                  onClick={() => handleStep(-increment)}
                  disabled={(goal.current_value ?? 0) <= 0}
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-25"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}
                >
                  <Minus className="w-4 h-4" strokeWidth={2.5} />
                </PressBtn>
                <button onClick={openEdit}
                  className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 group transition-all active:scale-[0.97]"
                  style={{ background: a(rgb, 0.08), border: `1px solid ${a(rgb, 0.18)}` }}>
                  <span className="text-[15px] font-black text-white">{goal.current_value ?? 0}</span>
                  <span className="text-[11px] font-bold" style={{ color: hex, opacity: 0.6 }}>{goal.unit || ''}</span>
                  <Edit3 className="w-3 h-3 opacity-25 group-hover:opacity-50 transition-opacity" style={{ color: hex }} />
                </button>
                <PressBtn
                  onClick={() => handleStep(+increment)}
                  className="flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl font-black text-[13px] text-white flex-shrink-0"
                  style={{ background: hex, boxShadow: `0 3px 0 0 ${hex2(hex, 0.3)}, 0 4px 12px ${a(rgb, 0.22)}` }}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span>+{increment}{goal.unit && goal.unit !== 'reps' ? ` ${goal.unit}` : ''}</span>
                </PressBtn>
              </div>
            )
          )}

          {isReady && (
            <PressBtn
              onClick={handleComplete}
              className="w-full h-11 rounded-xl font-black text-[14px] text-white flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #10b981)',
                boxShadow: '0 3px 0 0 rgba(16,185,129,0.3), 0 5px 16px rgba(34,197,94,0.18)',
              }}
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
              Mark as Complete
            </PressBtn>
          )}

          {isCompleted && (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{ background: a(COMPLETED_RGB, 0.07), border: `1px solid ${a(COMPLETED_RGB, 0.15)}` }}>
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: COMPLETED_HEX }} />
              <span className="text-[12px] font-black" style={{ color: COMPLETED_HEX }}>Goal achieved</span>
            </div>
          )}

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