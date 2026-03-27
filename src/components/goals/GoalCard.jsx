import React, { useState, useRef } from 'react';
import { differenceInDays, format } from 'date-fns';
import confetti from 'canvas-confetti';

// ─── SVG Arc Ring ─────────────────────────────────────────────────────────────
function ArcRing({ pct, size = 130, stroke = 9 }) {
  const r    = (size - stroke * 2) / 2;
  const c    = size / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.75;
  const off  = arc * (1 - Math.min(pct, 100) / 100);
  const gradId = 'ring-grad';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth={stroke}
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" transform={`rotate(135 ${c} ${c})`} />
      {pct > 0 && (
        <circle cx={c} cy={c} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke}
          strokeDasharray={`${arc} ${circ}`} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(135 ${c} ${c})`}
          style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.45))', transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      )}
      {[25, 50, 75].map((p) => {
        const angle = (135 + (270 * p) / 100) * (Math.PI / 180);
        const inner = r - stroke / 2 - 1;
        const outer = r + stroke / 2 + 1;
        return (
          <line key={p}
            x1={c + inner * Math.cos(angle)} y1={c + inner * Math.sin(angle)}
            x2={c + outer * Math.cos(angle)} y2={c + outer * Math.sin(angle)}
            stroke={pct >= p ? '#22d3ee' : 'rgba(34,211,238,0.18)'}
            strokeWidth={1.5} strokeLinecap="round"
            style={{ transition: 'stroke 0.4s ease' }} />
        );
      })}
    </svg>
  );
}

// ─── Milestone bar ────────────────────────────────────────────────────────────
function MilestoneBar({ progress }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginTop: 12 }}>
      {[25, 50, 75, 100].map((m) => {
        const filled = progress >= m;
        return (
          <div key={m} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: '100%', height: 3, borderRadius: 99,
              background: filled ? '#22d3ee' : 'rgba(255,255,255,0.07)',
              boxShadow: filled ? '0 0 6px rgba(34,211,238,0.5)' : 'none',
              transition: 'background 0.5s ease, box-shadow 0.5s ease',
            }} />
            <span style={{ fontSize: 8.5, fontWeight: 700, color: filled ? '#22d3ee' : 'rgba(255,255,255,0.15)', transition: 'color 0.5s ease' }}>
              {m}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────
function DotMenu({ goal, onRequestDelete, onRequestToggleReminder }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer',
          color: open ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
          transition: 'color 0.15s', padding: 0,
        }}
        aria-label="Options"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <circle cx="9" cy="3.5" r="1.5" />
          <circle cx="9" cy="9"   r="1.5" />
          <circle cx="9" cy="14.5" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 36, zIndex: 20, minWidth: 148, borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(22,26,50,0.98) 0%, rgba(6,8,18,0.99) 100%)',
            border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)', overflow: 'hidden',
          }}>
            <button
              onClick={() => { onRequestToggleReminder?.(); setOpen(false); }}
              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {goal?.reminder_enabled ? 'Mute reminder' : 'Set reminder'}
            </button>
            <button
              onClick={() => { onRequestDelete?.(); setOpen(false); }}
              style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', color: '#f87171', borderTop: '1px solid rgba(255,255,255,0.05)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Delete goal
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, title, description, confirmLabel, onConfirm, danger }) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[10003] bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10004] bg-slate-900/80 backdrop-blur-md border border-slate-700/30 rounded-3xl shadow-2xl shadow-black/40 text-white p-6">
        <h3 className="text-xl font-black text-white mb-2">{title}</h3>
        <p className="text-slate-300 text-sm mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-200 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 border border-slate-500/40 shadow-[0_3px_0_0_#1e293b] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl font-bold text-sm text-white active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 ${danger ? 'bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_3px_0_0_#7f1d1d]' : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 shadow-[0_3px_0_0_#1a3fa8]'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main GoalCard ────────────────────────────────────────────────────────────
export default function GoalCard({ goal, onUpdate, onDelete, onToggleReminder }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editVal,   setEditVal]   = useState('');
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [showReminderConfirm, setShowReminderConfirm] = useState(false);
  const inputRef = useRef(null);

  const isCompleted = goal.status === 'completed';
  const currentVal  = goal.current_value ?? 0;
  const targetVal   = goal.target_value ?? 1;
  const progress    = Math.min((currentVal / targetVal) * 100, 100);
  const isReady     = progress >= 100 && !isCompleted;
  const unit        = goal.unit || '';

  const increment = (() => {
    if (goal.goal_type !== 'numerical') return 1;
    if (unit === 'kg' || unit === 'lbs') return targetVal > 100 ? 5 : 2.5;
    return 1;
  })();

  const typeLabel = goal.goal_type === 'frequency' ? 'Frequency' : goal.goal_type === 'consistency' ? 'Streak' : 'Lift Target';

  const daysLeft  = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent  = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const updateMilestones = (val) => (goal.milestones || []).map((m) => ({ ...m, reached: val >= m.value }));

  const handleStep = (delta) => {
    const next = Math.max(0, currentVal + delta);
    onUpdate(goal, next, goal.status, updateMilestones(next));
  };

  const openEdit = () => {
    setEditVal(String(currentVal));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const saveEdit = () => {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val >= 0) {
      const nextPct = (val / targetVal) * 100;
      if (nextPct >= 100 && progress < 100) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      onUpdate(goal, val, goal.status, updateMilestones(val));
    }
    setIsEditing(false);
  };

  const handleComplete = () => {
    confetti({ particleCount: 180, spread: 110, origin: { y: 0.55 } });
    onUpdate(goal, currentVal, 'completed', updateMilestones(currentVal));
  };

  const valueDisplay = (() => {
    if (goal.goal_type === 'frequency')   return `${currentVal} / ${targetVal} sessions ${goal.frequency_period || 'weekly'}`;
    if (goal.goal_type === 'consistency') return `${currentVal} / ${targetVal} day streak`;
    return `${currentVal} / ${targetVal}`;
  })();

  const isAutoTracked = goal.goal_type === 'consistency' || goal.goal_type === 'frequency';

  return (
    <>
      <div style={{
        width: '100%', borderRadius: 22,
        background: isCompleted
          ? 'linear-gradient(160deg, rgba(18,38,24,0.88) 0%, rgba(6,14,8,0.96) 100%)'
          : 'linear-gradient(160deg, rgba(26,32,58,0.80) 0%, rgba(8,10,22,0.96) 100%)',
        border: isCompleted ? '1px solid rgba(74,222,128,0.15)' : '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
        overflow: 'hidden', position: 'relative',
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', inset: '0 0 auto 0', height: 2,
          background: isCompleted
            ? 'linear-gradient(90deg, transparent 5%, #4ade80 40%, #22c55e 60%, transparent 95%)'
            : 'linear-gradient(90deg, transparent 5%, #22d3ee 40%, #06b6d4 60%, transparent 95%)',
          opacity: 0.5,
        }} />

        <div style={{ padding: '20px 20px 0' }}>
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, letterSpacing: -0.4, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {goal.title}
              </h2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: isCompleted ? 'rgba(74,222,128,0.10)' : 'rgba(34,211,238,0.10)', color: isCompleted ? '#4ade80' : '#22d3ee', border: `1px solid ${isCompleted ? 'rgba(74,222,128,0.22)' : 'rgba(34,211,238,0.22)'}` }}>
                  {typeLabel}
                </span>
                {goal.exercise && (
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 9h12M6 15h12"/></svg>
                    {goal.exercise}
                  </span>
                )}
              </div>
            </div>
            <DotMenu goal={goal} onRequestDelete={() => setShowDeleteConfirm(true)} onRequestToggleReminder={() => setShowReminderConfirm(true)} />
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.055)', margin: '0 -20px' }} />

          {/* ── Progress section ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 0 16px' }}>
            <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArcRing pct={progress} size={120} stroke={8} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: isCompleted ? '#4ade80' : '#fff', letterSpacing: -0.5 }}>
                  {Math.round(progress)}<sup style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, verticalAlign: 'super' }}>%</sup>
                </span>
                {isCompleted && <span style={{ fontSize: 8.5, fontWeight: 700, color: '#4ade80', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 }}>Done</span>}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 3px', fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Progress</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1 }}>{valueDisplay}</p>
              {unit && <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 600, color: isCompleted ? '#4ade80' : '#22d3ee', opacity: 0.7 }}>{unit}</p>}

              {daysLeft !== null && (
                <p style={{ margin: '5px 0 0', fontSize: 11, fontWeight: 600, color: isOverdue ? '#f87171' : isUrgent ? '#fb923c' : 'rgba(255,255,255,0.28)' }}>
                  {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left · ${format(new Date(goal.deadline), 'MMM d')}`}
                </p>
              )}

              <MilestoneBar progress={progress} />
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.055)', margin: '0 -20px' }} />

          {/* ── Controls ── */}
          {!isCompleted && (
            <div style={{ padding: '14px 0 18px' }}>
              <p style={{ margin: '0 0 10px', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
                Update Progress
              </p>

              {isAutoTracked ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 12, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.12)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#22d3ee', opacity: 0.7 }}>Auto-tracked from your check-ins</span>
                </div>
              ) : isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,211,238,0.30)' }}>
                  <input ref={inputRef} type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
                    style={{ flex: 1, height: 46, padding: '0 14px', background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 16, fontWeight: 700 }}
                    placeholder="Enter value…" />
                  <button onClick={() => setIsEditing(false)} style={{ width: 36, height: 46, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>
                  </button>
                  <button onClick={saveEdit} style={{ height: 46, padding: '0 18px', background: '#22d3ee', border: 'none', cursor: 'pointer', color: '#061820', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5,6 4.5,9 10.5,3"/></svg>
                    Save
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => handleStep(-increment)} disabled={currentVal <= 0}
                    style={{ width: 46, height: 46, borderRadius: 13, flexShrink: 0, background: 'rgba(255,255,255,0.11)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentVal <= 0 ? 'not-allowed' : 'pointer', opacity: currentVal <= 0 ? 0.35 : 1, color: 'rgba(255,255,255,0.80)' }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="2.5" y1="7.5" x2="12.5" y2="7.5"/></svg>
                  </button>

                  <button onClick={openEdit} style={{ flex: 1, height: 46, borderRadius: 13, background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{currentVal}</span>
                    {unit && <span style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee', opacity: 0.65 }}>{unit}</span>}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(34,211,238,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5l3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>

                  <button onClick={() => handleStep(+increment)}
                    style={{ height: 46, padding: '0 16px', borderRadius: 13, flexShrink: 0, background: 'linear-gradient(160deg, #22d3ee 0%, #0891b2 100%)', border: 'none', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#061820', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 3px 0 rgba(6,117,158,0.55), 0 5px 18px rgba(34,211,238,0.22)' }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                      <line x1="6.5" y1="1.5" x2="6.5" y2="11.5"/><line x1="1.5" y1="6.5" x2="11.5" y2="6.5"/>
                    </svg>
                    +{increment}{unit ? ` ${unit}` : ''}
                  </button>
                </div>
              )}

              {isReady && (
                <button onClick={handleComplete} style={{ marginTop: 10, width: '100%', height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none', boxShadow: '0 3px 0 #14532d, 0 5px 18px rgba(34,197,94,0.18)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Mark as Complete
                </button>
              )}
            </div>
          )}

          {isCompleted && (
            <div style={{ padding: '14px 0 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, background: 'rgba(74,222,128,0.07)', margin: '0 0 0 0' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#4ade80' }}>Goal achieved</span>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}
        title="Delete Goal?" description="This goal and all its progress will be permanently removed."
        confirmLabel="Delete" danger onConfirm={() => { onDelete(goal.id); setShowDeleteConfirm(false); }} />

      <ConfirmDialog open={showReminderConfirm} onClose={() => setShowReminderConfirm(false)}
        title={goal.reminder_enabled ? 'Mute Reminder?' : 'Set Reminder?'}
        description={goal.reminder_enabled ? "You won't receive reminders for this goal." : "You'll receive reminders to stay on track."}
        confirmLabel={goal.reminder_enabled ? 'Mute' : 'Enable'}
        onConfirm={() => { onToggleReminder(goal); setShowReminderConfirm(false); }} />
    </>
  );
}