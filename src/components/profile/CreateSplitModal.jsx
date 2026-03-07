import React, { useState, useEffect } from 'react';
import { Dumbbell, ChevronRight, X, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─── Preset split templates ───────────────────────────────────────────────────
const PRESET_SPLITS = [
  {
    id: 'bro',
    name: 'Bro Split',
    description: '5 days · one muscle group per day',
    icon: '💪',
    color: 'from-purple-500 to-indigo-600',
    glow: 'rgba(139,92,246,0.3)',
    days: [1,2,3,4,5],
    workouts: {
      1: { name: 'Chest', color: 'blue' },
      2: { name: 'Back', color: 'purple' },
      3: { name: 'Shoulders', color: 'cyan' },
      4: { name: 'Arms', color: 'pink' },
      5: { name: 'Legs', color: 'green' },
    }
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: '4 days · upper & lower alternating',
    icon: '⚡',
    color: 'from-blue-500 to-cyan-500',
    glow: 'rgba(59,130,246,0.3)',
    days: [1,2,4,5],
    workouts: {
      1: { name: 'Upper A', color: 'blue' },
      2: { name: 'Lower A', color: 'green' },
      4: { name: 'Upper B', color: 'cyan' },
      5: { name: 'Lower B', color: 'purple' },
    }
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: '6 days · PPL ×2',
    icon: '🔄',
    color: 'from-cyan-500 to-teal-500',
    glow: 'rgba(6,182,212,0.3)',
    days: [1,2,3,5,6,7],
    workouts: {
      1: { name: 'Push', color: 'orange' },
      2: { name: 'Pull', color: 'blue' },
      3: { name: 'Legs', color: 'green' },
      5: { name: 'Push', color: 'orange' },
      6: { name: 'Pull', color: 'blue' },
      7: { name: 'Legs', color: 'green' },
    }
  },
  {
    id: 'full_body',
    name: 'Full Body',
    description: '3 days · total body each session',
    icon: '🏋️',
    color: 'from-emerald-500 to-green-600',
    glow: 'rgba(16,185,129,0.3)',
    days: [1,3,5],
    workouts: {
      1: { name: 'Full Body A', color: 'green' },
      3: { name: 'Full Body B', color: 'cyan' },
      5: { name: 'Full Body C', color: 'blue' },
    }
  },
  {
    id: 'custom',
    name: 'Custom Split',
    description: 'Build your own from scratch',
    icon: '✏️',
    color: 'from-slate-600 to-slate-700',
    glow: 'rgba(100,116,139,0.2)',
    days: [],
    workouts: {}
  },
];

const COLOR_OPTIONS = [
  { value: 'blue',   gradient: 'from-blue-500 to-blue-600' },
  { value: 'purple', gradient: 'from-purple-500 to-purple-600' },
  { value: 'cyan',   gradient: 'from-cyan-500 to-cyan-600' },
  { value: 'green',  gradient: 'from-green-500 to-green-600' },
  { value: 'orange', gradient: 'from-orange-500 to-orange-600' },
  { value: 'pink',   gradient: 'from-pink-500 to-pink-600' },
  { value: 'red',    gradient: 'from-red-500 to-red-600' },
  { value: 'yellow', gradient: 'from-yellow-400 to-yellow-500' },
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function colorGradient(c) {
  return COLOR_OPTIONS.find(o => o.value === c)?.gradient || 'from-blue-500 to-blue-600';
}

export default function CreateSplitModal({ isOpen, onClose, currentUser }) {
  const [step, setStep] = useState('pick'); // 'pick' | 'configure'
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [splitName, setSplitName] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(currentUser?.weekly_goal || 4);
  const [selectedDays, setSelectedDays] = useState([]);
  const [workouts, setWorkouts] = useState({});
  const queryClient = useQueryClient();

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      // If user already has a split, load it
      if (currentUser?.workout_split) {
        setStep('configure');
        setSplitName(currentUser.custom_split_name || '');
        setSelectedDays(currentUser.training_days || []);
        setWorkouts(currentUser.custom_workout_types || {});
        setWeeklyGoal(currentUser.weekly_goal || 4);
        const preset = PRESET_SPLITS.find(p => p.id === currentUser.workout_split) || PRESET_SPLITS[4];
        setSelectedPreset(preset);
      } else {
        setStep('pick');
        setSelectedPreset(null);
        setSplitName('');
        setSelectedDays([]);
        setWorkouts({});
        setWeeklyGoal(4);
      }
    }
  }, [isOpen]);

  const selectPreset = (preset) => {
    setSelectedPreset(preset);
    setSplitName(preset.id !== 'custom' ? preset.name : '');
    setSelectedDays([...preset.days]);
    const w = {};
    Object.entries(preset.workouts).forEach(([day, wt]) => {
      w[day] = { name: wt.name, color: wt.color, exercises: [] };
    });
    setWorkouts(w);
    setStep('configure');
  };

  const toggleDay = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      setSelectedDays(prev => prev.filter(d => d !== dayNum));
      setWorkouts(prev => { const n = {...prev}; delete n[dayNum]; return n; });
    } else {
      const sorted = [...selectedDays, dayNum].sort((a,b) => a-b);
      setSelectedDays(sorted);
      setWorkouts(prev => ({ ...prev, [dayNum]: { name: '', color: 'blue', exercises: [] } }));
    }
  };

  const updateWorkout = (day, field, value) => {
    setWorkouts(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const addExercise = (day) => {
    setWorkouts(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        exercises: [...(prev[day]?.exercises || []), { exercise: '', sets: '3', reps: '10', weight: '20' }]
      }
    }));
  };

  const updateExercise = (day, idx, field, value) => {
    setWorkouts(prev => {
      const exs = [...(prev[day]?.exercises || [])];
      exs[idx] = { ...exs[idx], [field]: value };
      return { ...prev, [day]: { ...prev[day], exercises: exs } };
    });
  };

  const removeExercise = (day, idx) => {
    setWorkouts(prev => {
      const exs = [...(prev[day]?.exercises || [])];
      exs.splice(idx, 1);
      return { ...prev, [day]: { ...prev[day], exercises: exs } };
    });
  };

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Split saved!');
      onClose();
    }
  });

  const handleSave = () => {
    saveMutation.mutate({
      workout_split: selectedPreset?.id || 'custom',
      custom_split_name: splitName || selectedPreset?.name || 'My Split',
      weekly_goal: weeklyGoal,
      training_days: selectedDays,
      custom_workout_types: workouts,
    });
  };

  const canSave = selectedDays.length > 0;

  // ─── Shared button styles ──────────────────────────────────────────────────
  const btnPrimary = "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-full px-6 py-2.5 shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";
  const btnSecondary = "bg-slate-800/70 border border-slate-600/50 text-slate-300 font-bold rounded-full px-5 py-2.5 shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex flex-col">
        <div className="flex flex-col h-full w-full max-w-2xl mx-auto">

          {/* ── HEADER ── */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40 flex-shrink-0">
            <div className="flex items-center gap-3">
              {step === 'configure' && (
                <button onClick={() => setStep('pick')} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 active:scale-90 transition-transform mr-1">
                  <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
                </button>
              )}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-white leading-tight">
                  {step === 'pick' ? 'Choose a Split' : (splitName || selectedPreset?.name || 'Configure Split')}
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  {step === 'pick' ? 'Pick a template or build your own' : 'Customise your training days'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 active:scale-90 transition-transform">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div className="overflow-y-auto flex-1 pb-4">

            {/* ════ STEP 1 — PICK PRESET ════ */}
            {step === 'pick' && (
              <div className="p-4 space-y-2.5">
                {PRESET_SPLITS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(preset)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/40 active:scale-[0.98] transition-all hover:border-slate-600/60 group text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${preset.color} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-black text-white">{preset.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{preset.description}</p>
                      {/* Day preview pills */}
                      {preset.days.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {preset.days.map(d => (
                            <span key={d} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r ${preset.color} text-white opacity-80`}>
                              {DAY_NAMES[d-1]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* ════ STEP 2 — CONFIGURE ════ */}
            {step === 'configure' && (
              <div className="p-4 space-y-4">

                {/* Split name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Split Name</label>
                  <input
                    type="text"
                    value={splitName}
                    onChange={(e) => setSplitName(e.target.value.slice(0, 30))}
                    placeholder={selectedPreset?.name || 'My Training Split'}
                    maxLength={30}
                    style={{ fontSize: '16px' }}
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>

                {/* Weekly goal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Weekly Goal</label>
                    <span className="text-[18px] font-black text-white">{weeklyGoal}<span className="text-slate-500 text-sm font-bold">×</span></span>
                  </div>
                  <input
                    type="range" min="1" max="7" value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: '#3b82f6' }}
                  />
                  <div className="flex justify-between">
                    {[1,2,3,4,5,6,7].map(n => (
                      <span key={n} className={`text-[9px] font-bold ${weeklyGoal === n ? 'text-blue-400' : 'text-slate-700'}`}>{n}</span>
                    ))}
                  </div>
                </div>

                {/* Day selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Training Days</label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAY_NAMES.map((name, i) => {
                      const d = i + 1;
                      const on = selectedDays.includes(d);
                      return (
                        <button
                          key={d}
                          onClick={() => toggleDay(d)}
                          className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl border-2 font-bold text-[10px] transition-all active:scale-90 ${
                            on
                              ? 'bg-gradient-to-b from-blue-500 to-blue-700 border-blue-400/50 text-white shadow-[0_2px_0_0_#1a3fa8]'
                              : 'bg-slate-900/60 border-slate-700/40 text-slate-600'
                          }`}
                        >
                          {name}
                          {on && <div className="w-1 h-1 rounded-full bg-blue-200 opacity-70" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium">{selectedDays.length} training · {7 - selectedDays.length} rest</p>
                </div>

                {/* Per-day workout config */}
                {selectedDays.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Day Details</label>
                    {selectedDays.map((day) => {
                      const wt = workouts[day] || { name: '', color: 'blue', exercises: [] };
                      const exs = wt.exercises || [];
                      return (
                        <div key={day} className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden">
                          {/* Day header */}
                          <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colorGradient(wt.color)} flex items-center justify-center flex-shrink-0 shadow`}>
                              <span className="text-[11px] font-black text-white">{DAY_NAMES[day-1]}</span>
                            </div>
                            <input
                              type="text"
                              value={wt.name || ''}
                              onChange={(e) => updateWorkout(day, 'name', e.target.value.slice(0, 25))}
                              placeholder={`Day ${day} workout…`}
                              maxLength={25}
                              style={{ fontSize: '16px' }}
                              className="flex-1 bg-transparent border-none text-white text-[14px] font-bold placeholder-slate-600 focus:outline-none"
                            />
                          </div>

                          {/* Colour picker */}
                          <div className="flex gap-1.5 px-4 pb-3">
                            {COLOR_OPTIONS.map(c => (
                              <button
                                key={c.value}
                                onClick={() => updateWorkout(day, 'color', c.value)}
                                className={`w-6 h-6 rounded-lg bg-gradient-to-br ${c.gradient} transition-all active:scale-90 ${
                                  wt.color === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0b0f1c]' : 'opacity-40'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Exercises */}
                          {exs.length > 0 && (
                            <div className="border-t border-slate-800 px-4 pt-2.5 pb-1 space-y-2">
                              {/* Column headers */}
                              <div className="grid gap-1.5" style={{ gridTemplateColumns: '1fr 60px 60px 60px 24px' }}>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Exercise</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider text-center">Sets</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider text-center">Reps</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider text-center">kg</span>
                                <span />
                              </div>
                              {exs.map((ex, idx) => (
                                <div key={idx} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: '1fr 60px 60px 60px 24px' }}>
                                  <input
                                    type="text"
                                    value={ex.exercise || ''}
                                    onChange={(e) => updateExercise(day, idx, 'exercise', e.target.value)}
                                    placeholder="e.g. Bench"
                                    style={{ fontSize: '16px' }}
                                    className="px-2.5 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-full"
                                  />
                                  {/* Sets */}
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={ex.sets || '3'}
                                      onChange={(e) => updateExercise(day, idx, 'sets', e.target.value)}
                                      style={{ fontSize: '16px' }}
                                      className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-white text-center focus:outline-none focus:border-blue-500/50"
                                    />
                                  </div>
                                  {/* Reps */}
                                  <input
                                    type="number"
                                    value={ex.reps || '10'}
                                    onChange={(e) => updateExercise(day, idx, 'reps', e.target.value)}
                                    style={{ fontSize: '16px' }}
                                    className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-white text-center focus:outline-none focus:border-blue-500/50"
                                  />
                                  {/* Weight */}
                                  <div className="relative flex items-center">
                                    <input
                                      type="number"
                                      value={ex.weight || '20'}
                                      onChange={(e) => updateExercise(day, idx, 'weight', e.target.value)}
                                      style={{ fontSize: '16px' }}
                                      className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-white text-center focus:outline-none focus:border-blue-500/50 pr-5"
                                    />
                                    <span className="absolute right-1.5 text-[8px] text-slate-500 font-bold pointer-events-none">kg</span>
                                  </div>
                                  {/* Remove */}
                                  <button onClick={() => removeExercise(day, idx)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors active:scale-90">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add exercise */}
                          <div className="px-4 pb-3.5 pt-2">
                            <button
                              onClick={() => addExercise(day)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />Add exercise
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="flex gap-2 px-4 py-4 border-t border-slate-800 flex-shrink-0">
            {step === 'pick' ? (
              <button onClick={onClose} className={btnSecondary + ' flex-1'}>Cancel</button>
            ) : (
              <>
                <button onClick={() => setStep('pick')} className={btnSecondary}>Back</button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || saveMutation.isPending}
                  className={btnPrimary + ' flex-1 disabled:opacity-40 disabled:cursor-not-allowed'}
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save Split'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}