import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Check, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SPLITS — fully populated, read-only, 6 exercises per day
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_SPLITS = [
  {
    id: 'bro',
    name: 'Bro Split',
    description: '5 days · one muscle group per day',
    icon: '💪',
    color: 'from-purple-500 to-indigo-600',
    days: [1, 2, 3, 4, 5],
    workouts: {
      1: { name: 'Chest', color: 'blue', exercises: [
        { exercise: 'Barbell Bench Press',    sets: '4', reps: '6',  weight: '' },
        { exercise: 'Incline Dumbbell Press', sets: '4', reps: '10', weight: '' },
        { exercise: 'Cable Fly',              sets: '3', reps: '12', weight: '' },
        { exercise: 'Dips',                   sets: '3', reps: '10', weight: '' },
        { exercise: 'Push-Ups',               sets: '3', reps: '15', weight: '' },
        { exercise: 'Pec Deck',               sets: '3', reps: '12', weight: '' },
      ]},
      2: { name: 'Back', color: 'purple', exercises: [
        { exercise: 'Deadlift',         sets: '4', reps: '5',  weight: '' },
        { exercise: 'Pull-Ups',         sets: '4', reps: '8',  weight: '' },
        { exercise: 'Barbell Row',      sets: '4', reps: '8',  weight: '' },
        { exercise: 'Lat Pulldown',     sets: '3', reps: '12', weight: '' },
        { exercise: 'Cable Row',        sets: '3', reps: '12', weight: '' },
        { exercise: 'Dumbbell Row',     sets: '3', reps: '10', weight: '' },
      ]},
      3: { name: 'Shoulders', color: 'cyan', exercises: [
        { exercise: 'Overhead Press',          sets: '4', reps: '8',  weight: '' },
        { exercise: 'Dumbbell Lateral Raise',  sets: '4', reps: '15', weight: '' },
        { exercise: 'Front Raises',            sets: '3', reps: '12', weight: '' },
        { exercise: 'Face Pulls',              sets: '3', reps: '15', weight: '' },
        { exercise: 'Arnold Press',            sets: '3', reps: '10', weight: '' },
        { exercise: 'Shrugs',                  sets: '3', reps: '15', weight: '' },
      ]},
      4: { name: 'Arms', color: 'pink', exercises: [
        { exercise: 'Barbell Curl',      sets: '4', reps: '10', weight: '' },
        { exercise: 'Hammer Curls',      sets: '3', reps: '12', weight: '' },
        { exercise: 'Incline Curl',      sets: '3', reps: '12', weight: '' },
        { exercise: 'Skull Crushers',    sets: '4', reps: '10', weight: '' },
        { exercise: 'Tricep Pushdown',   sets: '3', reps: '12', weight: '' },
        { exercise: 'Overhead Tricep',   sets: '3', reps: '12', weight: '' },
      ]},
      5: { name: 'Legs', color: 'green', exercises: [
        { exercise: 'Barbell Squat',     sets: '4', reps: '6',  weight: '' },
        { exercise: 'Romanian Deadlift', sets: '4', reps: '8',  weight: '' },
        { exercise: 'Leg Press',         sets: '3', reps: '12', weight: '' },
        { exercise: 'Leg Curl',          sets: '3', reps: '12', weight: '' },
        { exercise: 'Leg Extension',     sets: '3', reps: '15', weight: '' },
        { exercise: 'Calf Raises',       sets: '4', reps: '20', weight: '' },
      ]},
    },
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: '4 days · upper & lower alternating',
    icon: '⚡',
    color: 'from-blue-500 to-cyan-500',
    days: [1, 2, 4, 5],
    workouts: {
      1: { name: 'Upper A', color: 'blue', exercises: [
        { exercise: 'Barbell Bench Press',   sets: '4', reps: '6',  weight: '' },
        { exercise: 'Barbell Row',           sets: '4', reps: '6',  weight: '' },
        { exercise: 'Overhead Press',        sets: '3', reps: '8',  weight: '' },
        { exercise: 'Pull-Ups',              sets: '3', reps: '8',  weight: '' },
        { exercise: 'Lateral Raises',        sets: '3', reps: '15', weight: '' },
        { exercise: 'Tricep Pushdown',       sets: '3', reps: '12', weight: '' },
      ]},
      2: { name: 'Lower A', color: 'green', exercises: [
        { exercise: 'Barbell Squat',         sets: '4', reps: '6',  weight: '' },
        { exercise: 'Romanian Deadlift',     sets: '4', reps: '8',  weight: '' },
        { exercise: 'Leg Press',             sets: '3', reps: '10', weight: '' },
        { exercise: 'Leg Curl',              sets: '3', reps: '12', weight: '' },
        { exercise: 'Leg Extension',         sets: '3', reps: '12', weight: '' },
        { exercise: 'Calf Raises',           sets: '4', reps: '20', weight: '' },
      ]},
      4: { name: 'Upper B', color: 'cyan', exercises: [
        { exercise: 'Incline Dumbbell Press',   sets: '4', reps: '10', weight: '' },
        { exercise: 'Cable Row',                sets: '4', reps: '10', weight: '' },
        { exercise: 'Dumbbell Shoulder Press',  sets: '3', reps: '10', weight: '' },
        { exercise: 'Lat Pulldown',             sets: '3', reps: '12', weight: '' },
        { exercise: 'Barbell Curl',             sets: '3', reps: '12', weight: '' },
        { exercise: 'Skull Crushers',           sets: '3', reps: '12', weight: '' },
      ]},
      5: { name: 'Lower B', color: 'purple', exercises: [
        { exercise: 'Deadlift',               sets: '4', reps: '5',  weight: '' },
        { exercise: 'Bulgarian Split Squat',  sets: '3', reps: '10', weight: '' },
        { exercise: 'Hack Squat',             sets: '3', reps: '10', weight: '' },
        { exercise: 'Leg Curl',               sets: '3', reps: '12', weight: '' },
        { exercise: 'Leg Extension',          sets: '3', reps: '12', weight: '' },
        { exercise: 'Calf Raises',            sets: '4', reps: '20', weight: '' },
      ]},
    },
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: '6 days · PPL ×2',
    icon: '🔄',
    color: 'from-cyan-500 to-teal-500',
    days: [1, 2, 3, 5, 6, 7],
    workouts: {
      1: { name: 'Push A', color: 'orange', exercises: [
        { exercise: 'Barbell Bench Press',    sets: '4', reps: '6',  weight: '' },
        { exercise: 'Overhead Press',         sets: '4', reps: '8',  weight: '' },
        { exercise: 'Incline Dumbbell Press', sets: '3', reps: '10', weight: '' },
        { exercise: 'Cable Fly',              sets: '3', reps: '12', weight: '' },
        { exercise: 'Lateral Raises',         sets: '3', reps: '15', weight: '' },
        { exercise: 'Tricep Pushdown',        sets: '3', reps: '12', weight: '' },
      ]},
      2: { name: 'Pull A', color: 'blue', exercises: [
        { exercise: 'Deadlift',      sets: '4', reps: '5',  weight: '' },
        { exercise: 'Pull-Ups',      sets: '4', reps: '8',  weight: '' },
        { exercise: 'Barbell Row',   sets: '4', reps: '8',  weight: '' },
        { exercise: 'Face Pulls',    sets: '3', reps: '15', weight: '' },
        { exercise: 'Barbell Curl',  sets: '3', reps: '12', weight: '' },
        { exercise: 'Hammer Curls', sets: '3', reps: '12', weight: '' },
      ]},
      3: { name: 'Legs A', color: 'green', exercises: [
        { exercise: 'Barbell Squat',     sets: '4', reps: '6',  weight: '' },
        { exercise: 'Romanian Deadlift', sets: '4', reps: '8',  weight: '' },
        { exercise: 'Leg Press',         sets: '3', reps: '12', weight: '' },
        { exercise: 'Leg Curl',          sets: '3', reps: '12', weight: '' },
        { exercise: 'Leg Extension',     sets: '3', reps: '12', weight: '' },
        { exercise: 'Calf Raises',       sets: '4', reps: '20', weight: '' },
      ]},
      5: { name: 'Push B', color: 'orange', exercises: [
        { exercise: 'Incline Barbell Press',   sets: '4', reps: '8',  weight: '' },
        { exercise: 'Dumbbell Shoulder Press', sets: '4', reps: '10', weight: '' },
        { exercise: 'Cable Fly',               sets: '3', reps: '12', weight: '' },
        { exercise: 'Lateral Raises',          sets: '4', reps: '15', weight: '' },
        { exercise: 'Skull Crushers',          sets: '3', reps: '12', weight: '' },
        { exercise: 'Overhead Tricep',         sets: '3', reps: '12', weight: '' },
      ]},
      6: { name: 'Pull B', color: 'blue', exercises: [
        { exercise: 'Lat Pulldown',  sets: '4', reps: '10', weight: '' },
        { exercise: 'Cable Row',     sets: '4', reps: '10', weight: '' },
        { exercise: 'Dumbbell Row',  sets: '3', reps: '10', weight: '' },
        { exercise: 'Rear Delt Fly', sets: '3', reps: '15', weight: '' },
        { exercise: 'Incline Curl',  sets: '3', reps: '12', weight: '' },
        { exercise: 'Hammer Curls', sets: '3', reps: '12', weight: '' },
      ]},
      7: { name: 'Legs B', color: 'green', exercises: [
        { exercise: 'Front Squat',           sets: '4', reps: '8',  weight: '' },
        { exercise: 'Bulgarian Split Squat', sets: '3', reps: '10', weight: '' },
        { exercise: 'Hack Squat',            sets: '3', reps: '10', weight: '' },
        { exercise: 'Leg Curl',              sets: '3', reps: '12', weight: '' },
        { exercise: 'Leg Extension',         sets: '3', reps: '12', weight: '' },
        { exercise: 'Calf Raises',           sets: '4', reps: '20', weight: '' },
      ]},
    },
  },
  {
    id: 'full_body',
    name: 'Full Body',
    description: '3 days · total body each session',
    icon: '🏋️',
    color: 'from-emerald-500 to-green-600',
    days: [1, 3, 5],
    workouts: {
      1: { name: 'Full Body A', color: 'green', exercises: [
        { exercise: 'Barbell Squat',       sets: '4', reps: '6',  weight: '' },
        { exercise: 'Barbell Bench Press', sets: '4', reps: '8',  weight: '' },
        { exercise: 'Barbell Row',         sets: '4', reps: '8',  weight: '' },
        { exercise: 'Overhead Press',      sets: '3', reps: '10', weight: '' },
        { exercise: 'Barbell Curl',        sets: '3', reps: '12', weight: '' },
        { exercise: 'Calf Raises',         sets: '3', reps: '15', weight: '' },
      ]},
      3: { name: 'Full Body B', color: 'cyan', exercises: [
        { exercise: 'Deadlift',               sets: '4', reps: '5',  weight: '' },
        { exercise: 'Incline Dumbbell Press', sets: '4', reps: '10', weight: '' },
        { exercise: 'Pull-Ups',               sets: '4', reps: '8',  weight: '' },
        { exercise: 'Dumbbell Shoulder Press',sets: '3', reps: '10', weight: '' },
        { exercise: 'Tricep Pushdown',        sets: '3', reps: '12', weight: '' },
        { exercise: 'Leg Curl',               sets: '3', reps: '12', weight: '' },
      ]},
      5: { name: 'Full Body C', color: 'blue', exercises: [
        { exercise: 'Front Squat',           sets: '4', reps: '8',  weight: '' },
        { exercise: 'Dumbbell Bench Press',  sets: '4', reps: '10', weight: '' },
        { exercise: 'Cable Row',             sets: '4', reps: '10', weight: '' },
        { exercise: 'Lateral Raises',        sets: '3', reps: '15', weight: '' },
        { exercise: 'Hammer Curls',         sets: '3', reps: '12', weight: '' },
        { exercise: 'Calf Raises',           sets: '3', reps: '20', weight: '' },
      ]},
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
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
      type="text" inputMode="decimal" value={value}
      onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={INPUT_BASE}
      className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[13px] text-white text-center focus:outline-none focus:border-blue-500/50 placeholder-slate-600"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY DAY CARD (weight column is editable)
// ─────────────────────────────────────────────────────────────────────────────
function ReadOnlyDayCard({ day, workout, weights, onWeightChange }) {
  const grad = colorGradient(workout.color);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,16,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow`}>
          <span className="text-[11px] font-black text-white">{DAY_NAMES[day - 1]}</span>
        </div>
        <p className="flex-1 text-white text-[14px] font-bold">{workout.name}</p>
        <Lock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
      </div>
      <div className="flex gap-1.5 px-4 pb-3">
        {COLOR_OPTIONS.map(c => (
          <div key={c.value}
            className={`w-6 h-6 rounded-lg bg-gradient-to-br ${c.gradient} ${
              workout.color === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0b0f1c]' : 'opacity-20'
            }`}
          />
        ))}
      </div>
      {workout.exercises?.length > 0 && (
        <div className="border-t border-slate-800 px-4 pt-3 pb-2 space-y-2.5">
          <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 60px' }}>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Exercise</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Sets</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Reps</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Weight</span>
          </div>
          {workout.exercises.map((ex, idx) => (
            <div key={idx} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 60px' }}>
              <p className="px-2.5 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-slate-300 truncate">{ex.exercise}</p>
              <p className="text-[13px] text-slate-400 text-center font-bold">{ex.sets}</p>
              <p className="text-[13px] text-slate-400 text-center font-bold">{ex.reps}</p>
              <div className="relative">
                <input
                  type="text" inputMode="decimal"
                  value={weights?.[idx] ?? ''}
                  onChange={e => onWeightChange(idx, e.target.value)}
                  placeholder="—"
                  style={{ fontSize: '16px', WebkitAppearance: 'none' }}
                  className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[13px] text-white text-center focus:outline-none focus:border-blue-500/50 placeholder-slate-600"
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-bold pointer-events-none">kg</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="px-4 pb-3.5 pt-2">
        <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> Read-only — set as active below
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateSplitModal({ isOpen, onClose, currentUser }) {
  // step: 'pick' | 'preview' | 'configure'
  const [step, setStep]               = useState('pick');
  const [previewSplit, setPreviewSplit] = useState(null);
  const [splitName, setSplitName]     = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [workouts, setWorkouts]       = useState({});
  const [selectingActive, setSelectingActive] = useState(false);
  const [previewWeights, setPreviewWeights] = useState({}); // { [day]: { [exIdx]: weight } }
  const [weightsDirty, setWeightsDirty] = useState(false);
  const [savedSplits, setSavedSplits] = useState([]);
  const [activeSplitId, setActiveSplitId] = useState(''); // tracks by id

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen) return;
    const saved = currentUser?.saved_splits || [];
    setSavedSplits(saved);
    // active_split_id is saved explicitly whenever a split is set active — most reliable source
    const storedActiveId = currentUser?.active_split_id || '';
    if (storedActiveId) {
      setActiveSplitId(storedActiveId);
    } else {
      const activeName = currentUser?.custom_split_name || '';
      const activeByName = saved.find(s => s.name === activeName);
      setActiveSplitId(activeByName?.id || currentUser?.workout_split || '');
    }
    setStep('pick');
    setPreviewSplit(null);
    setPreviewWeights({});
    setWeightsDirty(false);
    setSplitName('');
    setSelectedDays([]);
    setWorkouts({});
    setSelectingActive(false);
  }, [isOpen]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'], refetchType: 'all' });
      toast.success('Split saved!');
      onClose();
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'], refetchType: 'all' }),
    onError: () => toast.error('Failed to update — please try again'),
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (step === 'preview') {
      setStep('pick');
      setPreviewSplit(null);
    } else if (step === 'configure') {
      setStep('pick');
    } else {
      onClose();
    }
  };

  // ── Set a split as active (works for both default and custom) ──────────────
  const handleSetActive = (splitEntry, weightsMap = {}) => {
    // splitEntry: { id, preset_id, name, training_days, workouts }
    // weightsMap: { [day]: { [exIdx]: weightString } } — only used for default splits previewed with weights

    // Merge any entered weights into the workouts before saving
    const mergedWorkouts = Object.fromEntries(
      Object.entries(splitEntry.workouts).map(([day, wt]) => {
        const dayWeights = weightsMap[day] || {};
        const mergedExercises = (wt.exercises || []).map((ex, idx) => ({
          ...ex,
          weight: dayWeights[idx] ?? ex.weight ?? '',
        }));
        return [day, { ...wt, exercises: mergedExercises }];
      })
    );
    const mergedEntry = { ...splitEntry, workouts: mergedWorkouts };

    setActiveSplitId(splitEntry.id);
    setSelectingActive(false);
    toast.success(`"${splitEntry.name}" set as active!`);

    // Ensure it's in savedSplits (with merged weights)
    const updated = [
      ...savedSplits.filter(s => s.id !== splitEntry.id),
      { ...mergedEntry, created_at: new Date().toISOString() },
    ];
    setSavedSplits(updated);

    setActiveMutation.mutate({
      active_split_id: splitEntry.id,
      workout_split: splitEntry.preset_id || 'custom',
      custom_split_name: splitEntry.name,
      training_days: splitEntry.training_days,
      custom_workout_types: mergedWorkouts,
      saved_splits: updated,
    });
  };

  // Build unified list: default splits + custom saved splits (non-default)
  const customSavedSplits = savedSplits.filter(s => !s.preset_id || s.preset_id === 'custom');

  // Open read-only preview for a default split
  // Load any previously saved weights from savedSplits for this split
  const openDefaultPreview = (def) => {
    setPreviewSplit(def);
    const savedVersion = savedSplits.find(s => s.id === def.id);
    if (savedVersion?.workouts) {
      // Extract weights map from saved workouts: { [day]: { [exIdx]: weight } }
      const loadedWeights = Object.fromEntries(
        Object.entries(savedVersion.workouts).map(([day, wt]) => [
          day,
          Object.fromEntries(
            (wt.exercises || []).map((ex, idx) => [idx, ex.weight || ''])
          ),
        ])
      );
      setPreviewWeights(loadedWeights);
    } else {
      setPreviewWeights({});
    }
    setWeightsDirty(false);
    setStep('preview');
  };

  // Open custom split for editing
  const openEditCustom = (split) => {
    setSplitName(split.name || '');
    setSelectedDays(split.training_days || []);
    setWorkouts(split.workouts || {});
    setStep('configure');
  };

  // Open new custom split
  const openCustomConfigure = () => {
    setSplitName('');
    setSelectedDays([]);
    setWorkouts({});
    setStep('configure');
  };

  const deleteSavedSplit = (splitId, e) => {
    e.stopPropagation();
    const updated = savedSplits.filter(s => s.id !== splitId);
    setSavedSplits(updated);
    if (activeSplitId === splitId) setActiveSplitId('');
    saveMutation.mutate({ saved_splits: updated });
  };

  // Save a custom split
  const handleSave = () => {
    const newSplit = {
      id: Date.now().toString(),
      preset_id: 'custom',
      name: splitName || 'My Split',
      training_days: selectedDays,
      workouts,
      created_at: new Date().toISOString(),
    };
    const updated = [...savedSplits.filter(s => s.name !== newSplit.name), newSplit];
    setSavedSplits(updated);
    saveMutation.mutate({
      workout_split: 'custom',
      custom_split_name: newSplit.name,
      training_days: selectedDays,
      custom_workout_types: workouts,
      saved_splits: updated,
    });
  };

  // ── Custom configure helpers ───────────────────────────────────────────────
  const toggleDay = (dayNum) => {
    if (selectedDays.includes(dayNum)) {
      setSelectedDays(prev => prev.filter(d => d !== dayNum));
      setWorkouts(prev => { const n = { ...prev }; delete n[dayNum]; return n; });
    } else {
      setSelectedDays(prev => [...prev, dayNum].sort((a, b) => a - b));
      setWorkouts(prev => ({ ...prev, [dayNum]: { name: '', color: 'blue', exercises: [] } }));
    }
  };
  const updateWorkout  = (day, field, value) => setWorkouts(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  const addExercise    = (day) => setWorkouts(prev => ({ ...prev, [day]: { ...prev[day], exercises: [...(prev[day]?.exercises || []), { exercise: '', sets: '3', reps: '10', weight: '' }] } }));
  const updateExercise = (day, idx, field, value) => setWorkouts(prev => { const exs = [...(prev[day]?.exercises || [])]; exs[idx] = { ...exs[idx], [field]: value }; return { ...prev, [day]: { ...prev[day], exercises: exs } }; });
  const removeExercise = (day, idx) => setWorkouts(prev => { const exs = [...(prev[day]?.exercises || [])]; exs.splice(idx, 1); return { ...prev, [day]: { ...prev[day], exercises: exs } }; });

  // ── Styles ─────────────────────────────────────────────────────────────────
  const btnPrimary   = "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-full px-6 py-2.5 shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";
  const btnSecondary = "bg-slate-800/70 border border-slate-600/50 text-slate-300 font-bold rounded-full px-5 py-2.5 shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";

  const headerTitle = step === 'preview' ? previewSplit?.name : step === 'configure' ? 'Custom Split' : 'My Splits';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex flex-col">
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex items-center px-4 py-4 border-b border-slate-700/40 flex-shrink-0">
          <div className="w-10 flex-shrink-0">
            <button onClick={handleBack} className="flex items-center justify-center active:scale-90 transition-transform">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">{headerTitle}</h2>
          </div>
          <div className="w-10 flex-shrink-0 flex justify-end">
            {step === 'pick' && (
              <button
                onClick={() => setSelectingActive(prev => !prev)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 transform-gpu
                  bg-gradient-to-b from-emerald-400 to-emerald-600
                  shadow-[0_2px_0_0_#065f46,0_4px_8px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]
                  active:shadow-none active:translate-y-[3px] active:scale-90
                  ${selectingActive ? 'ring-2 ring-emerald-300/60' : ''}`}
              >
                <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
              </button>
            )}

          </div>
        </div>

        {/* Selecting-active hint */}
        {step === 'pick' && selectingActive && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <p className="text-[11px] font-bold text-emerald-400">Tap any split to make it your active one</p>
          </div>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <div className="overflow-y-auto flex-1 pb-4">

          {/* ════ PICK ════ */}
          {step === 'pick' && (
            <div className="p-4 space-y-2">

              {/* ── All splits sorted: active first, then defaults, then custom ── */}
              {(() => {
                // Build unified list: default splits + custom saved splits
                const allSplits = [
                  ...DEFAULT_SPLITS.map(def => ({ type: 'default', id: def.id, def })),
                  ...customSavedSplits.map(split => ({ type: 'custom', id: split.id, split })),
                ];
                // Sort: active item floats to top, rest keep original order
                allSplits.sort((a, b) => {
                  if (a.id === activeSplitId) return -1;
                  if (b.id === activeSplitId) return 1;
                  return 0;
                });
                return allSplits.map(item => {
                  const isActive = activeSplitId === item.id;
                  if (item.type === 'default') {
                    const def = item.def;
                    const splitEntry = {
                      id: def.id, preset_id: def.id, name: def.name,
                      training_days: def.days, workouts: def.workouts,
                    };
                    return (
                      <div
                        key={def.id}
                        onClick={() => selectingActive ? handleSetActive(splitEntry) : openDefaultPreview(def)}
                        className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-transform active:scale-[0.98]"
                        style={{
                          background: isActive ? 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))' : 'rgba(15,20,40,0.7)',
                          border: isActive ? '2px solid rgba(16,185,129,0.55)' : selectingActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isActive ? '0 0 16px rgba(16,185,129,0.08)' : 'none',
                        }}
                      >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${def.color} flex items-center justify-center text-xl shadow-lg flex-shrink-0`}>{def.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-black text-white">{def.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{def.description}</p>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {def.days.map(d => (
                              <span key={d} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r ${def.color} text-white opacity-70`}>{DAY_NAMES[d - 1]}</span>
                            ))}
                          </div>
                        </div>
                        {selectingActive ? (
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-emerald-500/25 border-emerald-400' : 'border-slate-600'}`}>
                            {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                        ) : isActive ? (
                          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_2px_0_0_#065f46,0_3px_6px_rgba(16,185,129,0.2)] flex-shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                          </div>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        )}
                      </div>
                    );
                  } else {
                    const split = item.split;
                    const splitEntry = {
                      id: split.id, preset_id: 'custom', name: split.name,
                      training_days: split.training_days, workouts: split.workouts,
                    };
                    return (
                      <div
                        key={split.id}
                        onClick={() => selectingActive ? handleSetActive(splitEntry) : openEditCustom(split)}
                        className="flex items-center gap-3 p-3.5 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                        style={{
                          background: isActive ? 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.08))' : 'rgba(15,20,40,0.7)',
                          border: isActive ? '2px solid rgba(16,185,129,0.55)' : selectingActive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isActive ? '0 0 16px rgba(16,185,129,0.08)' : 'none',
                        }}
                      >
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg shadow flex-shrink-0">✏️</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-white truncate">{split.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {(split.training_days || []).map(d => <span key={d} className="text-[9px] font-bold text-slate-500">{DAY_NAMES[d - 1]}</span>)}
                            <span className="text-[9px] text-slate-600">· {(split.training_days || []).length} days</span>
                          </div>
                        </div>
                        {selectingActive ? (
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-emerald-500/25 border-emerald-400' : 'border-slate-600'}`}>
                            {isActive && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isActive && (
                              <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_2px_0_0_#065f46,0_3px_6px_rgba(16,185,129,0.2)]">
                                <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                              </div>
                            )}
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-700/60 pointer-events-none">
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <button onClick={(e) => deleteSavedSplit(split.id, e)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-700/60 hover:bg-red-500/20 transition-colors">
                              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                });
              })()}

              {/* ── Create Custom ── */}
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pt-3 px-1">Create a Custom Split</p>
              <div
                onClick={() => { if (!selectingActive) openCustomConfigure(); }}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform ${selectingActive ? 'opacity-30 pointer-events-none' : ''}`}
                style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xl shadow-lg flex-shrink-0">✏️</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-black text-white">Create New</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Build your own from scratch</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </div>

            </div>
          )}

          {/* ════ PREVIEW — read-only default split ════ */}
          {step === 'preview' && previewSplit && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-3xl">{previewSplit.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-white">{previewSplit.description}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {previewSplit.days.map(d => (
                      <span key={d} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r ${previewSplit.color} text-white opacity-80`}>{DAY_NAMES[d - 1]}</span>
                    ))}
                  </div>
                </div>
              </div>
              {previewSplit.days.map(day => {
                const wt = previewSplit.workouts[day];
                if (!wt) return null;
                return (
                  <ReadOnlyDayCard
                    key={day}
                    day={day}
                    workout={wt}
                    weights={previewWeights[day] || {}}
                    onWeightChange={(idx, val) => {
                      setPreviewWeights(prev => ({
                        ...prev,
                        [day]: { ...(prev[day] || {}), [idx]: val },
                      }));
                      setWeightsDirty(true);
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* ════ CONFIGURE — custom split ════ */}
          {step === 'configure' && (
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Split Name</label>
                <input
                  type="text" value={splitName} onChange={(e) => setSplitName(e.target.value.slice(0, 30))}
                  placeholder="My Training Split" maxLength={30} style={{ fontSize: '16px' }}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Training Days</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_NAMES.map((name, i) => {
                    const d = i + 1; const on = selectedDays.includes(d);
                    return (
                      <button key={d} onClick={() => toggleDay(d)}
                        className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl border-2 font-bold text-[10px] transition-all active:scale-90 ${
                          on ? 'bg-gradient-to-b from-blue-500 to-blue-700 border-blue-400/50 text-white shadow-[0_2px_0_0_#1a3fa8]'
                             : 'bg-slate-900/60 border-slate-700/40 text-slate-600'}`}
                      >
                        {name}{on && <div className="w-1 h-1 rounded-full bg-blue-200 opacity-70" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-600 font-medium">{selectedDays.length} training · {7 - selectedDays.length} rest</p>
              </div>

              {selectedDays.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Day Details</label>
                  {selectedDays.map((day) => {
                    const wt = workouts[day] || { name: '', color: 'blue', exercises: [] };
                    const exs = wt.exercises || [];
                    return (
                      <div key={day} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,16,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colorGradient(wt.color)} flex items-center justify-center flex-shrink-0 shadow`}>
                            <span className="text-[11px] font-black text-white">{DAY_NAMES[day - 1]}</span>
                          </div>
                          <input type="text" value={wt.name || ''} onChange={(e) => updateWorkout(day, 'name', e.target.value.slice(0, 25))}
                            placeholder={`Day ${day} workout…`} maxLength={25} style={{ fontSize: '16px' }}
                            className="flex-1 bg-transparent border-none text-white text-[14px] font-bold placeholder-slate-600 focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-1.5 px-4 pb-3">
                          {COLOR_OPTIONS.map(c => (
                            <button key={c.value} onClick={() => updateWorkout(day, 'color', c.value)}
                              className={`w-6 h-6 rounded-lg bg-gradient-to-br ${c.gradient} transition-all active:scale-90 ${wt.color === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0b0f1c]' : 'opacity-40'}`}
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
                                <input type="text" value={ex.exercise || ''} onChange={(e) => updateExercise(day, idx, 'exercise', e.target.value)}
                                  placeholder="e.g. Bench press" style={{ fontSize: '16px' }}
                                  className="px-2.5 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-full"
                                />
                                <SmallInput value={ex.sets ?? '3'} onChange={(v) => updateExercise(day, idx, 'sets', v)} placeholder="3" />
                                <SmallInput value={ex.reps ?? '10'} onChange={(v) => updateExercise(day, idx, 'reps', v)} placeholder="10" />
                                <div className="relative">
                                  <SmallInput value={ex.weight ?? ''} onChange={(v) => updateExercise(day, idx, 'weight', v)} placeholder="—" />
                                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-bold pointer-events-none">kg</span>
                                </div>
                                <button onClick={() => removeExercise(day, idx)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors active:scale-90">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="px-4 pb-3.5 pt-2">
                          <button onClick={() => addExercise(day)} className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors active:scale-95">
                            <Plus className="w-3.5 h-3.5" /> Add exercise
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
        {step === 'preview' && weightsDirty && (
          <div className="flex gap-2 px-4 py-4 border-t border-slate-800 flex-shrink-0">
            <button
              onClick={() => {
                // Merge weights into the split workouts and save to user
                const mergedWorkouts = Object.fromEntries(
                  Object.entries(previewSplit.workouts).map(([day, wt]) => {
                    const dayWeights = previewWeights[day] || {};
                    const mergedExercises = (wt.exercises || []).map((ex, idx) => ({
                      ...ex,
                      weight: dayWeights[idx] !== undefined ? dayWeights[idx] : ex.weight,
                    }));
                    return [day, { ...wt, exercises: mergedExercises }];
                  })
                );
                const splitEntry = {
                  id: previewSplit.id,
                  preset_id: previewSplit.id,
                  name: previewSplit.name,
                  training_days: previewSplit.days,
                  workouts: mergedWorkouts,
                  created_at: new Date().toISOString(),
                };
                const updated = [
                  ...savedSplits.filter(s => s.id !== previewSplit.id),
                  splitEntry,
                ];
                setSavedSplits(updated);
                // If this split is currently active, update active workout data too
                const isActive = activeSplitId === previewSplit.id;
                setActiveMutation.mutate({
                  saved_splits: updated,
                  ...(isActive ? {
                    custom_workout_types: mergedWorkouts,
                  } : {}),
                });
                toast.success('Weights saved!');
                setWeightsDirty(false);
              }}
              disabled={setActiveMutation.isPending}
              className="bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-full px-6 py-2.5 shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {setActiveMutation.isPending ? 'Saving…' : 'Save Weights'}
            </button>
          </div>
        )}
        {step === 'configure' && (
          <div className="flex gap-2 px-4 py-4 border-t border-slate-800 flex-shrink-0">
            <button onClick={handleBack} className={btnSecondary}>Back</button>
            <button onClick={handleSave} disabled={selectedDays.length === 0 || saveMutation.isPending}
              className={btnPrimary + ' flex-1 disabled:opacity-40 disabled:cursor-not-allowed'}>
              {saveMutation.isPending ? 'Saving…' : 'Save Split'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}