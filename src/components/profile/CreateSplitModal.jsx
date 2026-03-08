import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Check } from 'lucide-react';
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
    days: [1,2,3,4,5],
    workouts: {
      1: { name: 'Chest', color: 'blue' },
      2: { name: 'Back', color: 'purple' },
      3: { name: 'Shoulders', color: 'cyan' },
      4: { name: 'Arms', color: 'pink' },
      5: { name: 'Legs', color: 'green' },
    },
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: '4 days · upper & lower alternating',
    icon: '⚡',
    color: 'from-blue-500 to-cyan-500',
    days: [1,2,4,5],
    workouts: {
      1: { name: 'Upper A', color: 'blue' },
      2: { name: 'Lower A', color: 'green' },
      4: { name: 'Upper B', color: 'cyan' },
      5: { name: 'Lower B', color: 'purple' },
    },
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: '6 days · PPL ×2',
    icon: '🔄',
    color: 'from-cyan-500 to-teal-500',
    days: [1,2,3,5,6,7],
    workouts: {
      1: { name: 'Push', color: 'orange' },
      2: { name: 'Pull', color: 'blue' },
      3: { name: 'Legs', color: 'green' },
      5: { name: 'Push', color: 'orange' },
      6: { name: 'Pull', color: 'blue' },
      7: { name: 'Legs', color: 'green' },
    },
  },
  {
    id: 'full_body',
    name: 'Full Body',
    description: '3 days · total body each session',
    icon: '🏋️',
    color: 'from-emerald-500 to-green-600',
    days: [1,3,5],
    workouts: {
      1: { name: 'Full Body A', color: 'green' },
      3: { name: 'Full Body B', color: 'cyan' },
      5: { name: 'Full Body C', color: 'blue' },
    },
  },
  {
    id: 'custom',
    name: 'Custom Split',
    description: 'Build your own from scratch',
    icon: '✏️',
    color: 'from-slate-600 to-slate-700',
    days: [],
    workouts: {},
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

const INPUT_BASE = { fontSize: '16px', WebkitAppearance: 'none', MozAppearance: 'textfield' };

function SmallInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={INPUT_BASE}
      className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[13px] text-white text-center focus:outline-none focus:border-blue-500/50 placeholder-slate-600"
    />
  );
}

export default function CreateSplitModal({ isOpen, onClose, currentUser, openToEdit = false }) {
  const [step, setStep] = useState('pick');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [splitName, setSplitName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [workouts, setWorkouts] = useState({});
  // Local copy of saved splits so deletes are reflected immediately
  const [localSavedSplits, setLocalSavedSplits] = useState([]);
  const [selectingActive, setSelectingActive] = useState(false);

  const queryClient = useQueryClient();

  // Sync local splits from currentUser whenever modal opens or currentUser changes
  useEffect(() => {
    setLocalSavedSplits(currentUser?.saved_splits || []);
  }, [currentUser?.saved_splits]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('pick');
    setSelectedPreset(null);
    setSplitName('');
    setSelectedDays([]);
    setWorkouts({});
    setLocalSavedSplits(currentUser?.saved_splits || []);
    setSelectingActive(false);
  }, [isOpen]);

  // Local active name — updated optimistically so UI reflects instantly on tap
  const [localActiveName, setLocalActiveName] = useState(currentUser?.custom_split_name || '');

  useEffect(() => {
    setLocalActiveName(currentUser?.custom_split_name || '');
  }, [currentUser?.custom_split_name]);

  const activeSaved = localSavedSplits.find(s => s.name === localActiveName);
  const otherSaved = localSavedSplits.filter(s => s.name !== localActiveName);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const loadSavedSplit = (split) => {
    const preset = PRESET_SPLITS.find(p => p.id === split.preset_id) || PRESET_SPLITS[4];
    setSelectedPreset(preset);
    setSplitName(split.name || '');
    setSelectedDays(split.training_days || []);
    setWorkouts(split.workouts || {});
    setStep('configure');
  };

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

  // ── Day / exercise helpers ────────────────────────────────────────────────
  const toggleDay = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      setSelectedDays(prev => prev.filter(d => d !== dayNum));
      setWorkouts(prev => { const n = { ...prev }; delete n[dayNum]; return n; });
    } else {
      setSelectedDays(prev => [...prev, dayNum].sort((a, b) => a - b));
      setWorkouts(prev => ({ ...prev, [dayNum]: { name: '', color: 'blue', exercises: [] } }));
    }
  };

  const updateWorkout = (day, field, value) =>
    setWorkouts(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const addExercise = (day) =>
    setWorkouts(prev => ({
      ...prev,
      [day]: { ...prev[day], exercises: [...(prev[day]?.exercises || []), { exercise: '', sets: '3', reps: '10', weight: '' }] },
    }));

  const updateExercise = (day, idx, field, value) =>
    setWorkouts(prev => {
      const exs = [...(prev[day]?.exercises || [])];
      exs[idx] = { ...exs[idx], [field]: value };
      return { ...prev, [day]: { ...prev[day], exercises: exs } };
    });

  const removeExercise = (day, idx) =>
    setWorkouts(prev => {
      const exs = [...(prev[day]?.exercises || [])];
      exs.splice(idx, 1);
      return { ...prev, [day]: { ...prev[day], exercises: exs } };
    });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Split saved!');
      onClose();
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Active split updated!');
    },
  });

  const handleSave = () => {
    const newSplit = {
      id: Date.now().toString(),
      preset_id: selectedPreset?.id || 'custom',
      name: splitName || selectedPreset?.name || 'My Split',
      training_days: selectedDays,
      workouts,
      created_at: new Date().toISOString(),
    };
    const updated = [...localSavedSplits.filter(s => s.name !== newSplit.name), newSplit];
    saveMutation.mutate({
      workout_split: selectedPreset?.id || 'custom',
      custom_split_name: newSplit.name,
      training_days: selectedDays,
      custom_workout_types: workouts,
      saved_splits: updated,
    });
  };

  const handlePickActive = (split) => {
    setLocalActiveName(split.name);
    setActiveMutation.mutate({
      workout_split: split.preset_id || 'custom',
      custom_split_name: split.name,
      training_days: split.training_days || [],
      custom_workout_types: split.workouts || {},
    });
  };

  const deleteSavedSplit = (splitId, e) => {
    e.stopPropagation();
    const updated = localSavedSplits.filter(s => s.id !== splitId);
    setLocalSavedSplits(updated);
    saveMutation.mutate({ saved_splits: updated });
  };

  const canSave = selectedDays.length > 0;

  const btnPrimary = "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-full px-6 py-2.5 shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";
  const btnSecondary = "bg-slate-800/70 border border-slate-600/50 text-slate-300 font-bold rounded-full px-5 py-2.5 shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex flex-col">
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex items-center px-4 py-4 border-b border-slate-700/40 flex-shrink-0">

          {/* Left: back chevron — fixed width so title stays centred */}
          <div className="w-10 flex-shrink-0">
            <button
              onClick={() => {
                if (step === 'configure') { setStep('pick'); }
                else { onClose(); }
              }}
              className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
          </div>

          {/* Centre: title only, no icon, no subtitle */}
          <div className="flex-1 flex justify-center">
            <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">
              {step === 'pick'
                ? 'My Splits'
                : (splitName || selectedPreset?.name || 'Configure Split')}
            </h2>
          </div>

          {/* Right: tick button (pick step only) to enter "select active" mode */}
          <div className="w-10 flex-shrink-0 flex justify-end">
            {step === 'pick' && localSavedSplits.length > 0 && (
              <button
                onClick={() => setSelectingActive(s => !s)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                  selectingActive
                    ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-700/60 text-slate-400'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="overflow-y-auto flex-1 pb-4">

          {/* ════ STEP 1 — PICK ════ */}
          {step === 'pick' && (
            <div className="p-4 space-y-2">
              {/* Selecting active banner */}
              {selectingActive && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <p className="text-[11px] font-bold text-emerald-400">Tap a split to make it active</p>
                </div>
              )}

              {/* Active saved split — always first, green border */}
              {activeSaved && (() => {
                const preset = PRESET_SPLITS.find(p => p.id === activeSaved.preset_id) || PRESET_SPLITS[4];
                return (
                  <div
                    onClick={() => selectingActive ? (handlePickActive(activeSaved), setSelectingActive(false)) : loadSavedSplit(activeSaved)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left cursor-pointer active:scale-[0.98] transition-all "
                    style={{
                      background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))',
                      border: '2px solid rgba(16,185,129,0.55)',
                      boxShadow: '0 0 16px rgba(16,185,129,0.08)',
                    }}
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${preset.color} flex items-center justify-center text-lg shadow flex-shrink-0`}>
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-black text-white truncate">{activeSaved.name}</p>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">ACTIVE</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {(activeSaved.training_days || []).map(d => (
                          <span key={d} className="text-[9px] font-bold text-slate-400">{DAY_NAMES[d - 1]}</span>
                        ))}
                        <span className="text-[9px] text-slate-500">· {(activeSaved.training_days || []).length} days</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25">
                        <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSavedSplit(activeSaved.id, e); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-700/60 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Other saved splits */}
              {otherSaved.map((split) => {
                const preset = PRESET_SPLITS.find(p => p.id === split.preset_id) || PRESET_SPLITS[4];
                return (
                  <div
                    key={split.id}
                    onClick={() => loadSavedSplit(split)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left cursor-pointer active:scale-[0.98] transition-all "
                    style={{
                      background: 'rgba(15,20,40,0.7)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${preset.color} flex items-center justify-center text-lg shadow flex-shrink-0`}>
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-white truncate">{split.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {(split.training_days || []).map(d => (
                          <span key={d} className="text-[9px] font-bold text-slate-500">{DAY_NAMES[d - 1]}</span>
                        ))}
                        <span className="text-[9px] text-slate-600">· {(split.training_days || []).length} days</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePickActive(split); }}
                        className="text-[9px] font-black px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors active:scale-90"
                      >
                        SET ACTIVE
                      </button>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-700/60">
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSavedSplit(split.id, e); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-700/60 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Preset templates — always shown */}
              {PRESET_SPLITS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-all group text-left"
                  style={{
                    background: 'rgba(15,20,40,0.7)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${preset.color} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>
                    {preset.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-black text-white">{preset.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{preset.description}</p>
                    {preset.days.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {preset.days.map(d => (
                          <span key={d} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r ${preset.color} text-white opacity-70`}>
                            {DAY_NAMES[d - 1]}
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
                <p className="text-[10px] text-slate-600 font-medium">
                  {selectedDays.length} training · {7 - selectedDays.length} rest
                </p>
              </div>

              {selectedDays.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Day Details</label>
                  {selectedDays.map((day) => {
                    const wt = workouts[day] || { name: '', color: 'blue', exercises: [] };
                    const exs = wt.exercises || [];
                    return (
                      <div
                        key={day}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: 'rgba(12,16,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colorGradient(wt.color)} flex items-center justify-center flex-shrink-0 shadow`}>
                            <span className="text-[11px] font-black text-white">{DAY_NAMES[day - 1]}</span>
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

                        {exs.length > 0 && (
                          <div className="border-t border-slate-800 px-4 pt-3 pb-2 space-y-2.5">
                            <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 60px 28px' }}>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Exercise</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Sets</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Reps</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Weight</span>
                              <span />
                            </div>
                            {exs.map((ex, idx) => (
                              <div key={idx} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 60px 28px' }}>
                                <input
                                  type="text"
                                  value={ex.exercise || ''}
                                  onChange={(e) => updateExercise(day, idx, 'exercise', e.target.value)}
                                  placeholder="e.g. Bench press"
                                  style={{ fontSize: '16px' }}
                                  className="px-2.5 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-full"
                                />
                                <SmallInput value={ex.sets ?? '3'} onChange={(v) => updateExercise(day, idx, 'sets', v)} placeholder="3" />
                                <SmallInput value={ex.reps ?? '10'} onChange={(v) => updateExercise(day, idx, 'reps', v)} placeholder="10" />
                                <div className="relative">
                                  <SmallInput value={ex.weight ?? ''} onChange={(v) => updateExercise(day, idx, 'weight', v)} placeholder="—" />
                                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-bold pointer-events-none">kg</span>
                                </div>
                                <button
                                  onClick={() => removeExercise(day, idx)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors active:scale-90"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="px-4 pb-3.5 pt-2">
                          <button
                            onClick={() => addExercise(day)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add exercise
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

        {/* ── FOOTER (configure screen only) ── */}
        {step === 'configure' && (
          <div className="flex gap-2 px-4 py-4 border-t border-slate-800 flex-shrink-0">
            <button onClick={() => setStep('pick')} className={btnSecondary}>Back</button>
            <button
              onClick={handleSave}
              disabled={!canSave || saveMutation.isPending}
              className={btnPrimary + ' flex-1 disabled:opacity-40 disabled:cursor-not-allowed'}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Split'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}