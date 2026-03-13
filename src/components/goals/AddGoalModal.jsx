import React, { useState } from 'react';
import { ChevronLeft, Target, TrendingUp, Flame, Zap, Check, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const GOAL_TYPES = [
  {
    id: 'numerical',
    label: 'Lift a Number',
    sub: 'Hit a weight target on a specific lift',
    blurb: 'Set a personal best target — e.g. Bench Press 140 kg. Progress is tracked against your logged lifts and updates automatically as you train.',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    accentColor: 'rgba(56,189,248,0.45)',
    glowColor: 'rgba(56,189,248,0.30)',
    borderColor: 'rgba(56,189,248,0.35)',
    textColor: '#38bdf8',
  },
  {
    id: 'frequency',
    label: 'Train X Times',
    sub: 'Hit a weekly or monthly session count',
    blurb: 'Challenge yourself to show up consistently — e.g. 5 workouts per week. Great for building the habit before worrying about the numbers.',
    icon: Zap,
    color: 'from-amber-400 to-orange-500',
    accentColor: 'rgba(251,146,60,0.45)',
    glowColor: 'rgba(251,146,60,0.30)',
    borderColor: 'rgba(251,146,60,0.35)',
    textColor: '#fb923c',
  },
  {
    id: 'consistency',
    label: 'Build a Streak',
    sub: 'Train every day for X days straight',
    blurb: 'The hardest goal and often the most rewarding. Don\'t miss a day. Streaks reset to zero on the first missed session — no exceptions.',
    icon: Flame,
    color: 'from-emerald-400 to-teal-500',
    accentColor: 'rgba(52,211,153,0.45)',
    glowColor: 'rgba(52,211,153,0.30)',
    borderColor: 'rgba(52,211,153,0.35)',
    textColor: '#34d399',
  },
];

const EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
  'Barbell Row', 'Power Clean', 'Incline Bench Press',
  'Front Squat', 'Romanian Deadlift', 'Pull-Ups',
];

const UNITS = ['kg', 'lbs', 'reps'];

const PERIODS = [
  { id: 'daily',   label: 'Per Day'   },
  { id: 'weekly',  label: 'Per Week'  },
  { id: 'monthly', label: 'Per Month' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
      {children}
    </span>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', maxLength }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{ fontSize: '16px' }}
      className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GOAL TYPE CARD
// ─────────────────────────────────────────────────────────────────────────────

function GoalTypeCard({ type, selected, onClick }) {
  const [pressed, setPressed] = useState(false);
  const Icon = type.icon;

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      className="relative w-full text-left overflow-hidden rounded-2xl"
      style={{
        background: selected
          ? `linear-gradient(135deg, rgba(20,26,52,0.95) 0%, rgba(8,10,20,0.99) 100%)`
          : 'linear-gradient(135deg, rgba(18,22,44,0.85) 0%, rgba(8,10,20,0.95) 100%)',
        border: `1.5px solid ${selected ? type.borderColor : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: 'blur(20px)',
        transform: pressed ? 'scale(0.977) translateY(2px)' : 'scale(1)',
        boxShadow: pressed
          ? `0 2px 8px rgba(0,0,0,0.5), 0 0 20px 2px ${type.glowColor}`
          : selected
            ? `0 4px 24px rgba(0,0,0,0.4), 0 0 28px ${type.glowColor}`
            : '0 4px 16px rgba(0,0,0,0.35)',
        transition: pressed
          ? 'transform 0.08s ease, box-shadow 0.08s ease'
          : 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease',
      }}
    >
      {/* Top shine */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.09) 50%, transparent 90%)' }} />

      {/* Glow blob */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 20% 50%, ${type.glowColor} 0%, transparent 60%)`,
          opacity: selected ? 0.5 : 0.15,
          transition: 'opacity 0.2s ease',
        }} />

      <div className="relative flex items-center gap-4 p-4">
        {/* Icon */}
        <div
          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
          style={{ boxShadow: `0 4px 16px ${type.glowColor}` }}
        >
          <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-black text-white leading-tight">{type.label}</p>
          <p className="text-[11.5px] text-slate-400 mt-0.5 leading-snug">{type.sub}</p>
        </div>

        {/* Check */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            background: selected ? `linear-gradient(135deg, ${type.textColor}, ${type.textColor}cc)` : 'rgba(255,255,255,0.05)',
            border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.12)',
            boxShadow: selected ? `0 0 12px ${type.glowColor}` : 'none',
          }}
        >
          {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENTED CONTROL
// ─────────────────────────────────────────────────────────────────────────────

function SegmentedControl({ options, value, onChange, accentColor, textColor }) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {options.map(opt => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="flex-1 py-2 rounded-lg text-[12px] font-bold transition-all duration-150 active:scale-95"
            style={{
              background: active ? accentColor : 'transparent',
              color: active ? textColor : 'rgba(255,255,255,0.28)',
              outline: active ? `1px solid ${textColor}44` : 'none',
              fontFamily: 'inherit',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE PICKER
// ─────────────────────────────────────────────────────────────────────────────

function ExercisePicker({ value, onChange, accentColor, textColor }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXERCISES.map(ex => {
        const active = value === ex;
        return (
          <button
            key={ex}
            onClick={() => onChange(active ? '' : ex)}
            className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-150 active:scale-95"
            style={{
              background: active ? accentColor : 'rgba(255,255,255,0.04)',
              color: active ? textColor : 'rgba(255,255,255,0.35)',
              border: active ? `1px solid ${textColor}55` : '1px solid rgba(255,255,255,0.07)',
              fontFamily: 'inherit',
            }}
          >
            {ex}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function AddGoalModal({ open, onClose, onSave, currentUser, isLoading }) {
  const [step, setStep]               = useState('pick');
  const [goalTypeId, setGoalTypeId]   = useState(null);

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit,        setUnit]        = useState('kg');
  const [exercise,    setExercise]    = useState('');
  const [period,      setPeriod]      = useState('weekly');
  const [deadline,    setDeadline]    = useState('');
  const [reminder,    setReminder]    = useState(true);

  if (!open) return null;

  const goalType    = GOAL_TYPES.find(t => t.id === goalTypeId);
  const accentColor = goalType?.accentColor || 'rgba(56,189,248,0.18)';
  const textColor   = goalType?.textColor   || '#38bdf8';

  const resetAndClose = () => {
    setStep('pick');
    setGoalTypeId(null);
    setTitle(''); setDescription(''); setTargetValue('');
    setUnit('kg'); setExercise(''); setPeriod('weekly');
    setDeadline(''); setReminder(true);
    onClose();
  };

  const handleBack = () => {
    if (step === 'configure') setStep('pick');
    else resetAndClose();
  };

  const handleSave = () => {
    onSave({
      title:             title || `${goalType.label} Goal`,
      description,
      goal_type:         goalTypeId,
      target_value:      parseFloat(targetValue) || 0,
      current_value:     0,
      unit:              goalTypeId === 'numerical' ? unit : goalTypeId === 'frequency' ? 'sessions' : 'days',
      exercise:          goalTypeId === 'numerical' ? exercise : '',
      frequency_period:  goalTypeId !== 'numerical' ? period : 'weekly',
      deadline,
      reminder_enabled:  reminder,
      status:            'active',
      user_id:           currentUser?.id,
      user_name:         currentUser?.full_name,
    });

    setStep('pick');
    setGoalTypeId(null);
    setTitle(''); setDescription(''); setTargetValue('');
    setUnit('kg'); setExercise(''); setPeriod('weekly');
    setDeadline(''); setReminder(true);
  };

  const canProceed = !!goalTypeId;
  const canSave    = targetValue !== '' && parseFloat(targetValue) > 0;

  const headerTitle = step === 'pick' ? 'Set a Goal' : goalType?.label ?? 'Configure';

  // ── btn styles matching CreateSplitModal ──
  const btnSecondary = "bg-slate-800/70 border border-slate-600/50 text-slate-300 font-bold rounded-full px-5 py-2.5 shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";

  return (
    <div className="fixed inset-0 z-50 bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex flex-col">
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex items-center px-4 py-[14.7px] border-b border-slate-700/40 flex-shrink-0">
          <div className="flex-shrink-0" style={{ minWidth: 40 }}>
            <button onClick={handleBack} className="flex items-center justify-center active:scale-90 transition-transform">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">{headerTitle}</h2>
          </div>
          <div style={{ minWidth: 40 }} />
        </div>

        {/* ── BODY ── */}
        <div className="overflow-y-auto flex-1 pb-6">

          {/* ════ STEP 1: PICK TYPE ════ */}
          {step === 'pick' && (
            <div className="p-4 space-y-3">

              {/* Intro */}
              <div
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-[13px] font-black text-white mb-0.5">What kind of goal?</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pick the type that best describes what you're working towards. You can always set more goals later.
                </p>
              </div>

              {/* Goal type cards */}
              {GOAL_TYPES.map(type => (
                <GoalTypeCard
                  key={type.id}
                  type={type}
                  selected={goalTypeId === type.id}
                  onClick={() => setGoalTypeId(type.id)}
                />
              ))}

              {/* Blurb for selected type */}
              {goalType && (
                <div
                  className="p-4 rounded-2xl transition-all duration-300"
                  style={{
                    background: `rgba(${goalType.accentColor.replace('rgba(', '').replace(')', '').split(',').slice(0, 3).join(',')}, 0.08)`,
                    border: `1px solid ${goalType.borderColor}`,
                  }}
                >
                  <p className="text-[11.5px] leading-relaxed" style={{ color: goalType.textColor, opacity: 0.85 }}>
                    {goalType.blurb}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ════ STEP 2: CONFIGURE ════ */}
          {step === 'configure' && goalType && (
            <div className="p-4 space-y-5">

              {/* Goal title */}
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <TextInput
                  value={title}
                  onChange={setTitle}
                  placeholder={
                    goalType.id === 'numerical'  ? 'e.g. Bench Press 140 kg' :
                    goalType.id === 'frequency'  ? 'e.g. Train 5× per week'  :
                                                   'e.g. 30-day streak'
                  }
                  maxLength={50}
                />
              </div>

              {/* ── NUMERICAL: exercise + target + unit ── */}
              {goalType.id === 'numerical' && (
                <>
                  <div className="space-y-2">
                    <Label>Exercise <span className="normal-case text-slate-600 font-medium">(optional)</span></Label>
                    <ExercisePicker value={exercise} onChange={setExercise} accentColor={accentColor} textColor={textColor} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Target</Label>
                      <input
                        type="number"
                        value={targetValue}
                        onChange={e => setTargetValue(e.target.value)}
                        placeholder="140"
                        style={{ fontSize: '16px' }}
                        className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <SegmentedControl
                        options={UNITS.map(u => ({ id: u, label: u }))}
                        value={unit}
                        onChange={setUnit}
                        accentColor={accentColor}
                        textColor={textColor}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── FREQUENCY: target + period ── */}
              {goalType.id === 'frequency' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Sessions</Label>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={e => setTargetValue(e.target.value)}
                      placeholder="5"
                      style={{ fontSize: '16px' }}
                      className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <SegmentedControl
                      options={PERIODS}
                      value={period}
                      onChange={setPeriod}
                      accentColor={accentColor}
                      textColor={textColor}
                    />
                  </div>
                </div>
              )}

              {/* ── CONSISTENCY: days ── */}
              {goalType.id === 'consistency' && (
                <div className="space-y-2">
                  <Label>Streak Target (days)</Label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={e => setTargetValue(e.target.value)}
                    placeholder="30"
                    style={{ fontSize: '16px' }}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label>Why This Goal <span className="normal-case text-slate-600 font-medium">(optional)</span></Label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's driving this goal for you…"
                  rows={2}
                  style={{ fontSize: '16px', resize: 'none' }}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label>Deadline <span className="normal-case text-slate-600 font-medium">(optional)</span></Label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  style={{ fontSize: '16px', colorScheme: 'dark' }}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>

              {/* Reminder toggle */}
              <button
                onClick={() => setReminder(r => !r)}
                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]"
                style={{
                  background: reminder ? `rgba(${goalType.accentColor.replace('rgba(', '').replace(')', '').split(',').slice(0, 3).join(',')}, 0.10)` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${reminder ? goalType.borderColor : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <div>
                  <p className="text-[13px] font-bold text-white text-left">Weekly reminders</p>
                  <p className="text-[11px] text-slate-500 text-left mt-0.5">Get a nudge each week until you hit the goal</p>
                </div>
                <div
                  className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all duration-200"
                  style={{ background: reminder ? goalType.textColor : 'rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                    style={{ left: reminder ? 'calc(100% - 22px)' : '2px' }}
                  />
                </div>
              </button>

            </div>
          )}

        </div>

        {/* ── FOOTER ── */}
        <div className="flex gap-2 px-4 py-4 border-t border-slate-800 flex-shrink-0">
          {step === 'pick' ? (
            <>
              <button onClick={resetAndClose} className={btnSecondary}>
                Cancel
              </button>
              <button
                disabled={!canProceed}
                onClick={() => setStep('configure')}
                className="flex-1 font-black rounded-full px-6 py-2.5 text-sm transition-all duration-100 transform-gpu active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: canProceed && goalType
                    ? `linear-gradient(135deg, ${goalType.textColor}cc, ${goalType.textColor})`
                    : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  boxShadow: canProceed && goalType
                    ? `0 3px 0 0 ${goalType.textColor}55, 0 6px 20px ${goalType.glowColor}`
                    : 'none',
                }}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button onClick={handleBack} className={btnSecondary}>
                Back
              </button>
              <button
                disabled={!canSave || isLoading}
                onClick={handleSave}
                className="flex-1 font-black rounded-full px-6 py-2.5 text-sm transition-all duration-100 transform-gpu active:translate-y-[3px] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: canSave
                    ? `linear-gradient(135deg, ${goalType.textColor}cc, ${goalType.textColor})`
                    : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  boxShadow: canSave
                    ? `0 3px 0 0 ${goalType.textColor}55, 0 6px 20px ${goalType.glowColor}`
                    : 'none',
                }}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Goal'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
