import React, { useState } from 'react';
import { ChevronLeft, TrendingUp, Flame, Zap, Check, Loader2, Calendar, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const pageSlideVariants = {
  hidden:  { x: '100%', opacity: 1 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 380, damping: 36, mass: 1 } },
  exit:    { x: '100%', opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 } },
};

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const GOAL_TYPES = [
  {
    id: 'numerical',
    label: 'Lift a Number',
    sub: 'Hit a personal best on a specific lift',
    blurb: 'Set a target weight — e.g. Bench 140 kg. Progress updates automatically every time you log a matching lift.',
    icon: TrendingUp,
    grad: 'from-blue-500 to-cyan-500',
    rgb: '56,189,248',
    hex: '#38bdf8',
  },
  {
    id: 'frequency',
    label: 'Train X Times',
    sub: 'Hit a session count per week or month',
    blurb: 'Build consistency before chasing numbers. Every workout you log counts towards the target.',
    icon: Zap,
    grad: 'from-amber-400 to-orange-500',
    rgb: '251,146,60',
    hex: '#fb923c',
  },
  {
    id: 'consistency',
    label: 'Build a Streak',
    sub: 'Train every single day for X days',
    blurb: "Don't miss a day. Streaks reset to zero the moment you skip a session — no exceptions.",
    icon: Flame,
    grad: 'from-emerald-400 to-teal-500',
    rgb: '52,211,153',
    hex: '#34d399',
  },
];

// Per-exercise kg milestone suggestions
const EXERCISE_MILESTONES = {
  'Bench Press':        [60, 80, 100, 120, 140, 160],
  'Squat':              [80, 100, 120, 140, 160, 200],
  'Deadlift':           [100, 120, 140, 160, 200, 220],
  'Overhead Press':     [40, 60, 70, 80, 100, 120],
  'Barbell Row':        [60, 80, 100, 120, 140, 160],
  'Power Clean':        [60, 80, 100, 120, 140],
  'Incline Bench':      [60, 80, 100, 120, 140],
  'Romanian Deadlift':  [80, 100, 120, 140, 160],
  'Front Squat':        [60, 80, 100, 120, 140],
  'Pull-Ups':           [5, 8, 10, 15, 20],
};

const EXERCISES    = Object.keys(EXERCISE_MILESTONES);
const UNITS        = ['kg', 'lbs', 'reps'];
const FREQ_QUICK   = [2, 3, 4, 5, 6];
const STREAK_QUICK = [7, 14, 21, 30, 60, 100];
const PERIODS      = [
  { id: 'weekly',  label: 'Per Week'  },
  { id: 'monthly', label: 'Per Month' },
];

// ─────────────────────────────────────────────────────────────────────────────
// INPUT SANITISERS
// ─────────────────────────────────────────────────────────────────────────────

// Title — strips HTML/script injection chars, keeps normal punctuation.
// maxLength is also enforced on the input element itself as a second layer.
const sanitiseTitle = (v) =>
  v
    .replace(/[<>{};`\\]/g, '')  // strip injection-risk chars
    .slice(0, 50);               // matches the maxLength attribute

// Number fields — digits and a single decimal point only.
// Blocks 'e', '+', '-' and scientific notation that type="number" allows.
// maxChars prevents absurdly large values (e.g. 999.99 = 6 chars).
const sanitiseNumber = (v, maxChars = 6) => {
  const stripped = v.replace(/[^\d.]/g, '');          // digits and dot only
  const parts = stripped.split('.');
  const sanitised = parts.length > 2                  // only one decimal point
    ? parts[0] + '.' + parts.slice(1).join('')
    : stripped;
  return sanitised.slice(0, maxChars);
};

// ─────────────────────────────────────────────────────────────────────────────
// TINY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const a14 = rgb => `rgba(${rgb},0.14)`;
const a30 = rgb => `rgba(${rgb},0.30)`;
const a35 = rgb => `rgba(${rgb},0.35)`;

const Label = ({ children }) => (
  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
    {children}
  </span>
);

// Secured NumberInput — type="text" + inputMode="decimal" prevents the browser
// from allowing 'e', '+', '-' while still showing a numeric keyboard on mobile.
const NumberInput = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    inputMode="decimal"
    maxLength={6}
    value={value}
    onChange={e => onChange(sanitiseNumber(e.target.value))}
    placeholder={placeholder}
    style={{ fontSize: 16 }}
    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
  />
);

// ─────────────────────────────────────────────────────────────────────────────
// GOAL TYPE CARD  (same press mechanic as SplitCard)
// ─────────────────────────────────────────────────────────────────────────────

function GoalTypeCard({ type, selected, onClick }) {
  const [pressed, setPressed] = useState(false);
  const Icon = type.icon;
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)} onTouchCancel={() => setPressed(false)}
      className="relative w-full text-left overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(135deg,rgba(18,22,44,0.88) 0%,rgba(8,10,20,0.96) 100%)',
        border: `1.5px solid ${selected ? a35(type.rgb) : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(20px)',
        transform: pressed ? 'scale(0.977) translateY(2px)' : 'scale(1)',
        boxShadow: pressed
          ? `0 2px 8px rgba(0,0,0,0.5),0 0 20px ${a30(type.rgb)}`
          : selected ? `0 4px 24px rgba(0,0,0,0.4),0 0 28px ${a30(type.rgb)}` : '0 4px 16px rgba(0,0,0,0.35)',
        transition: pressed
          ? 'transform 0.08s ease,box-shadow 0.08s ease'
          : 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1),box-shadow 0.22s ease,border-color 0.22s ease',
      }}>
      {/* shine */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.09) 50%,transparent 90%)' }} />
      {/* glow blob */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 20% 50%,${a30(type.rgb)} 0%,transparent 60%)`, opacity: selected ? 0.55 : 0.12, transition: 'opacity 0.2s ease' }} />

      <div className="relative flex items-center gap-4 p-4">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${type.grad} flex items-center justify-center flex-shrink-0`}
          style={{ boxShadow: `0 4px 16px ${a30(type.rgb)}` }}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15.5px] font-black text-white leading-tight">{type.label}</p>
          <p className="text-[11.5px] text-slate-400 mt-0.5">{type.sub}</p>
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            background: selected ? type.hex : 'rgba(255,255,255,0.05)',
            border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.12)',
            boxShadow: selected ? `0 0 12px ${a30(type.rgb)}` : 'none',
          }}>
          {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENTED CONTROL
// ─────────────────────────────────────────────────────────────────────────────

function Seg({ options, value, onChange, rgb, hex }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {options.map(o => {
        const on = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            className="flex-1 py-2 rounded-lg text-[12px] font-bold transition-all duration-150 active:scale-95"
            style={{ background: on ? a14(rgb) : 'transparent', color: on ? hex : 'rgba(255,255,255,0.28)', outline: on ? `1px solid ${a35(rgb)}` : 'none', fontFamily: 'inherit' }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHIP ROW  (exercises + quick-pick numbers)
// ─────────────────────────────────────────────────────────────────────────────

function Chips({ items, value, onToggle, rgb, hex, suffix = '' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const on = String(value) === String(item);
        return (
          <button key={item} onClick={() => onToggle(on ? '' : String(item))}
            className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-150 active:scale-95"
            style={{
              background: on ? a14(rgb) : 'rgba(255,255,255,0.04)',
              color: on ? hex : 'rgba(255,255,255,0.32)',
              border: `1px solid ${on ? a35(rgb) : 'rgba(255,255,255,0.07)'}`,
              fontFamily: 'inherit',
            }}>
            {item}{suffix}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE ROW
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({ on, onToggle, title, sub, rgb, hex }) {
  return (
    <button onClick={onToggle}
      className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 active:scale-[0.98]"
      style={{ background: on ? a14(rgb) : 'rgba(255,255,255,0.03)', border: `1px solid ${on ? a35(rgb) : 'rgba(255,255,255,0.07)'}` }}>
      <div className="text-left">
        <p className="text-[13px] font-bold text-white">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>
      </div>
      <div className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all duration-200"
        style={{ background: on ? hex : 'rgba(255,255,255,0.1)' }}>
        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: on ? 'calc(100% - 22px)' : '2px' }} />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE GOAL PREVIEW  (only shown once target is valid)
// ─────────────────────────────────────────────────────────────────────────────

function GoalPreview({ gt, title, target, current, unit, exercise, period, deadline }) {
  const pct = current && parseFloat(target) > 0
    ? Math.min(100, Math.round((parseFloat(current) / parseFloat(target)) * 100))
    : 0;

  const summary =
    gt.id === 'numerical'
      ? `${exercise || 'Any lift'} · ${target} ${unit}`
      : gt.id === 'frequency'
        ? `${target} sessions ${PERIODS.find(p => p.id === period)?.label.toLowerCase()}`
        : `${target}-day streak`;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: `linear-gradient(135deg,rgba(${gt.rgb},0.08) 0%,rgba(8,10,20,0.7) 100%)`, border: `1px solid ${a35(gt.rgb)}` }}>
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gt.grad} flex items-center justify-center flex-shrink-0`}>
            <Target className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-black text-white truncate">{title || summary}</p>
            <p className="text-[11px] mt-0.5 font-semibold" style={{ color: gt.hex, opacity: 0.75 }}>{summary}</p>
          </div>
          {deadline && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Calendar className="w-2.5 h-2.5 text-slate-500" />
              <span className="text-[9px] font-bold text-slate-500">
                {new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
        </div>

        {current > 0 && (
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-[10px] text-slate-600 font-bold">Starting point</span>
              <span className="text-[10px] font-bold" style={{ color: gt.hex }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg,${gt.hex}88,${gt.hex})`, boxShadow: `0 0 8px ${a30(gt.rgb)}` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function AddGoalModal({ open, onClose, onSave, currentUser, isLoading }) {
  const [step,        setStep]        = useState('pick');
  const [typeId,      setTypeId]      = useState(null);
  const [title,       setTitle]       = useState('');
  const [target,      setTarget]      = useState('');
  const [current,     setCurrent]     = useState('');
  const [unit,        setUnit]        = useState('kg');
  const [exercise,    setExercise]    = useState('');
  const [period,      setPeriod]      = useState('weekly');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline,    setDeadline]    = useState('');
  const [reminder,    setReminder]    = useState(true);
  const [isClosing,   setIsClosing]   = useState(false);

  const gt = GOAL_TYPES.find(t => t.id === typeId);

  const reset = () => {
    setStep('pick'); setTypeId(null); setTitle(''); setTarget(''); setCurrent('');
    setUnit('kg'); setExercise(''); setPeriod('weekly');
    setHasDeadline(false); setDeadline(''); setReminder(true);
  };

  const close = () => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); reset(); onClose(); }, 320);
  };

  const handleSave = () => {
    const autoTitle =
      gt.id === 'numerical'
        ? `${exercise || 'Lift'} ${target}${unit}`
        : gt.id === 'frequency'
          ? `${target} sessions ${PERIODS.find(p => p.id === period)?.label.toLowerCase()}`
          : `${target}-day streak`;

    onSave({
      title:            sanitiseTitle(title) || autoTitle,
      goal_type:        typeId,
      target_value:     parseFloat(target) || 0,
      current_value:    parseFloat(current) || 0,
      unit:             gt.id === 'numerical' ? unit : gt.id === 'frequency' ? 'sessions' : 'days',
      exercise:         gt.id === 'numerical' ? exercise : '',
      frequency_period: gt.id !== 'numerical' ? period : 'weekly',
      deadline:         hasDeadline ? deadline : '',
      reminder_enabled: reminder,
      status:           'active',
      user_id:          currentUser?.id,
      user_name:        currentUser?.full_name,
    });
    reset();
  };

  const canSave = target !== '' && parseFloat(target) > 0;
  const milestones = exercise && unit !== 'reps' ? (EXERCISE_MILESTONES[exercise] || []) : [];

  const btnSec = "bg-slate-800/70 border border-slate-600/50 text-slate-300 font-bold rounded-full px-5 py-2.5 shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";

  return (
    <AnimatePresence>
      {open && !isClosing && (
      <>
        <motion.div
          key="goal-overlay"
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          variants={overlayVariants}
          initial="hidden" animate="visible" exit="exit"
          onClick={close}
        />
        <motion.div
          key="goal-panel"
          className="fixed inset-0 z-50"
          style={{ minHeight: '100dvh', background: 'linear-gradient(to bottom right, #02040a, #0d2360, #02040a)' }}
          variants={pageSlideVariants}
          initial="hidden" animate="visible" exit="exit"
        >
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center px-4 py-[14.7px] border-b border-slate-700/40 flex-shrink-0">
          <div style={{ minWidth: 40 }}>
            <button onClick={step === 'configure' ? () => setStep('pick') : close}
              className="flex items-center justify-center active:scale-90 transition-transform">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">
              {step === 'pick' ? 'Set a Goal' : gt?.label}
            </h2>
          </div>
          <div style={{ minWidth: 40 }} />
        </div>

        {/* BODY */}
        <div className="overflow-y-auto flex-1 pb-6">

          {/* ── STEP 1: PICK ── */}
          {step === 'pick' && (
            <div className="p-4 space-y-3">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[13px] font-black text-white mb-1">What are you working towards?</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">Choose a goal type. You can set as many goals as you like.</p>
              </div>

              {GOAL_TYPES.map(type => (
                <GoalTypeCard key={type.id} type={type} selected={typeId === type.id} onClick={() => setTypeId(type.id)} />
              ))}

              {gt && (
                <div className="p-4 rounded-2xl" style={{ background: a14(gt.rgb), border: `1px solid ${a35(gt.rgb)}` }}>
                  <p className="text-[11.5px] leading-relaxed font-medium" style={{ color: gt.hex, opacity: 0.85 }}>
                    {gt.blurb}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: CONFIGURE ── */}
          {step === 'configure' && gt && (
            <div className="p-4 space-y-5">

              {/* Title */}
              <div className="space-y-2">
                <Label>Title <span className="normal-case text-slate-600 font-medium">(optional — auto-generated if blank)</span></Label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(sanitiseTitle(e.target.value))}
                  maxLength={50}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  style={{ fontSize: 16 }}
                  placeholder={
                    gt.id === 'numerical'   ? 'e.g. Bench Press 140 kg' :
                    gt.id === 'frequency'   ? 'e.g. Train 5× per week'  : 'e.g. 30-day streak'
                  }
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>

              {/* ── NUMERICAL ── */}
              {gt.id === 'numerical' && (<>
                <div className="space-y-2">
                  <Label>Exercise <span className="normal-case text-slate-600 font-medium">(optional)</span></Label>
                  <Chips items={EXERCISES} value={exercise}
                    onToggle={v => { setExercise(v); setTarget(''); }}
                    rgb={gt.rgb} hex={gt.hex} />
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Seg options={UNITS.map(u => ({ id: u, label: u }))} value={unit}
                    onChange={v => { setUnit(v); setTarget(''); }}
                    rgb={gt.rgb} hex={gt.hex} />
                </div>

                <div className="space-y-2">
                  <Label>Target {unit}</Label>
                  {milestones.length > 0 && (
                    <Chips items={milestones} value={target} onToggle={setTarget} rgb={gt.rgb} hex={gt.hex} />
                  )}
                  <NumberInput value={target} onChange={setTarget} placeholder={unit === 'reps' ? '10' : '140'} />
                </div>

                <div className="space-y-2">
                  <Label>Current Best <span className="normal-case text-slate-600 font-medium">(optional — shows starting progress)</span></Label>
                  <NumberInput value={current} onChange={setCurrent} placeholder={`Your current ${unit} PB`} />
                </div>
              </>)}

              {/* ── FREQUENCY ── */}
              {gt.id === 'frequency' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sessions</Label>
                    <Chips items={FREQ_QUICK} value={target} onToggle={setTarget} rgb={gt.rgb} hex={gt.hex} />
                    <NumberInput value={target} onChange={setTarget} placeholder="5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Seg options={PERIODS} value={period} onChange={setPeriod} rgb={gt.rgb} hex={gt.hex} />
                  </div>
                </div>
              )}

              {/* ── CONSISTENCY ── */}
              {gt.id === 'consistency' && (
                <div className="space-y-2">
                  <Label>Streak length (days)</Label>
                  <Chips items={STREAK_QUICK} value={target} onToggle={setTarget} rgb={gt.rgb} hex={gt.hex} />
                  <NumberInput value={target} onChange={setTarget} placeholder="30" />
                </div>
              )}

              {/* Deadline toggle */}
              <div className="space-y-2">
                <Toggle on={hasDeadline} onToggle={() => { setHasDeadline(d => !d); setDeadline(''); }}
                  title="Add a deadline" sub="Set a target date to hit this goal by"
                  rgb={gt.rgb} hex={gt.hex} />
                {hasDeadline && (
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    style={{ fontSize: 16, colorScheme: 'dark' }}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white focus:outline-none focus:border-blue-500/60 transition-colors"
                  />
                )}
              </div>

              {/* Reminder */}
              <Toggle on={reminder} onToggle={() => setReminder(r => !r)}
                title="Weekly reminders" sub="Get a nudge each week until you hit the goal"
                rgb={gt.rgb} hex={gt.hex} />

              {/* Live preview */}
              {canSave && (
                <GoalPreview gt={gt} title={title} target={target} current={current}
                  unit={unit} exercise={exercise} period={period}
                  deadline={hasDeadline ? deadline : ''} />
              )}

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="flex gap-2 px-4 py-4 border-t border-slate-800 flex-shrink-0">
          {step === 'pick' ? (
            <>
              <button onClick={close} className={btnSec}>Cancel</button>
              <button disabled={!typeId} onClick={() => setStep('configure')}
                className="flex-1 font-black rounded-full px-6 py-2.5 text-sm transition-all duration-100 transform-gpu active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-white"
                style={{
                  background: gt ? gt.hex : 'rgba(255,255,255,0.1)',
                  boxShadow: gt ? `0 3px 0 0 ${gt.hex}55, 0 6px 20px ${a30(gt.rgb)}` : 'none',
                }}>
                Next
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep('pick')} className={btnSec}>Back</button>
              <button disabled={!canSave || isLoading} onClick={handleSave}
                className="flex-1 font-black rounded-full px-6 py-2.5 text-sm transition-all duration-100 transform-gpu active:translate-y-[3px] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
                style={{
                  background: canSave ? gt.hex : 'rgba(255,255,255,0.1)',
                  boxShadow: canSave ? `0 3px 0 0 ${gt.hex}55, 0 6px 20px ${a30(gt.rgb)}` : 'none',
                }}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Goal'}
              </button>
            </>
          )}
        </div>

      </div>
        </motion.div>
      </>
      )}
    </AnimatePresence>
  );
}