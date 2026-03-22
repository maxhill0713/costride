import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Check, Lock, MoreVertical, Star, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DEFAULT_SPLITS = [
{
  id: 'bro', name: 'Bro Split', description: '5 days · one muscle group per day',
  blurb: 'You train one muscle group per day — for example chest on Monday, back on Tuesday — giving each muscle a full week to recover before hitting it again. The upside is that you can really focus on and exhaust one area each session, which many people find satisfying. The downside is that if you miss a day, that muscle only gets trained once that week, and beginners may not need a full 7 days of rest between sessions.',
  icon: '💪', color: 'from-purple-500 to-indigo-600', accentColor: 'rgba(168,85,247,0.45)', glowColor: 'rgba(168,85,247,0.35)', days: [1, 2, 3, 4, 5],
  workouts: {
    1: { name: 'Chest', color: 'blue', exercises: [{ exercise: 'Barbell Bench Press', sets: '4', reps: '6', weight: '' },{ exercise: 'Incline Dumbbell Press', sets: '4', reps: '10', weight: '' },{ exercise: 'Cable Fly', sets: '3', reps: '12', weight: '' },{ exercise: 'Dips', sets: '3', reps: '10', weight: '' },{ exercise: 'Push-Ups', sets: '3', reps: '15', weight: '' },{ exercise: 'Pec Deck', sets: '3', reps: '12', weight: '' }] },
    2: { name: 'Back', color: 'purple', exercises: [{ exercise: 'Deadlift', sets: '4', reps: '5', weight: '' },{ exercise: 'Pull-Ups', sets: '4', reps: '8', weight: '' },{ exercise: 'Barbell Row', sets: '4', reps: '8', weight: '' },{ exercise: 'Lat Pulldown', sets: '3', reps: '12', weight: '' },{ exercise: 'Cable Row', sets: '3', reps: '12', weight: '' },{ exercise: 'Dumbbell Row', sets: '3', reps: '10', weight: '' }] },
    3: { name: 'Shoulders', color: 'cyan', exercises: [{ exercise: 'Overhead Press', sets: '4', reps: '8', weight: '' },{ exercise: 'Dumbbell Lateral Raise', sets: '4', reps: '15', weight: '' },{ exercise: 'Front Raises', sets: '3', reps: '12', weight: '' },{ exercise: 'Face Pulls', sets: '3', reps: '15', weight: '' },{ exercise: 'Arnold Press', sets: '3', reps: '10', weight: '' },{ exercise: 'Shrugs', sets: '3', reps: '15', weight: '' }] },
    4: { name: 'Arms', color: 'pink', exercises: [{ exercise: 'Barbell Curl', sets: '4', reps: '10', weight: '' },{ exercise: 'Hammer Curls', sets: '3', reps: '12', weight: '' },{ exercise: 'Incline Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Skull Crushers', sets: '4', reps: '10', weight: '' },{ exercise: 'Tricep Pushdown', sets: '3', reps: '12', weight: '' },{ exercise: 'Overhead Tricep', sets: '3', reps: '12', weight: '' }] },
    5: { name: 'Legs', color: 'green', exercises: [{ exercise: 'Barbell Squat', sets: '4', reps: '6', weight: '' },{ exercise: 'Romanian Deadlift', sets: '4', reps: '8', weight: '' },{ exercise: 'Leg Press', sets: '3', reps: '12', weight: '' },{ exercise: 'Leg Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Leg Extension', sets: '3', reps: '15', weight: '' },{ exercise: 'Calf Raises', sets: '4', reps: '20', weight: '' }] }
  }
},
{
  id: 'upper_lower', name: 'Upper / Lower', description: '4 days · upper & lower alternating',
  blurb: 'You split your body into upper (chest, back, shoulders, arms) and lower (legs, glutes) sessions, training each twice per week. This is a great step up from full-body training and works well for building both strength and size because each muscle gets hit more frequently. The main drawback is that upper-body days can feel long since you are covering a lot of muscles in one session.',
  icon: '⚡', color: 'from-blue-500 to-cyan-500', accentColor: 'rgba(59,130,246,0.45)', glowColor: 'rgba(59,130,246,0.35)', days: [1, 2, 4, 5],
  workouts: {
    1: { name: 'Upper A', color: 'blue', exercises: [{ exercise: 'Barbell Bench Press', sets: '4', reps: '6', weight: '' },{ exercise: 'Barbell Row', sets: '4', reps: '6', weight: '' },{ exercise: 'Overhead Press', sets: '3', reps: '8', weight: '' },{ exercise: 'Pull-Ups', sets: '3', reps: '8', weight: '' },{ exercise: 'Lateral Raises', sets: '3', reps: '15', weight: '' },{ exercise: 'Tricep Pushdown', sets: '3', reps: '12', weight: '' }] },
    2: { name: 'Lower A', color: 'green', exercises: [{ exercise: 'Barbell Squat', sets: '4', reps: '6', weight: '' },{ exercise: 'Romanian Deadlift', sets: '4', reps: '8', weight: '' },{ exercise: 'Leg Press', sets: '3', reps: '10', weight: '' },{ exercise: 'Leg Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Leg Extension', sets: '3', reps: '12', weight: '' },{ exercise: 'Calf Raises', sets: '4', reps: '20', weight: '' }] },
    4: { name: 'Upper B', color: 'cyan', exercises: [{ exercise: 'Incline Dumbbell Press', sets: '4', reps: '10', weight: '' },{ exercise: 'Cable Row', sets: '4', reps: '10', weight: '' },{ exercise: 'Dumbbell Shoulder Press', sets: '3', reps: '10', weight: '' },{ exercise: 'Lat Pulldown', sets: '3', reps: '12', weight: '' },{ exercise: 'Barbell Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Skull Crushers', sets: '3', reps: '12', weight: '' }] },
    5: { name: 'Lower B', color: 'purple', exercises: [{ exercise: 'Deadlift', sets: '4', reps: '5', weight: '' },{ exercise: 'Bulgarian Split Squat', sets: '3', reps: '10', weight: '' },{ exercise: 'Hack Squat', sets: '3', reps: '10', weight: '' },{ exercise: 'Leg Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Leg Extension', sets: '3', reps: '12', weight: '' },{ exercise: 'Calf Raises', sets: '4', reps: '20', weight: '' }] }
  }
},
{
  id: 'ppl', name: 'Push / Pull / Legs', description: '6 days · PPL ×2',
  blurb: 'Push Pull Legs groups muscles by how they move — push days cover chest, shoulders and triceps; pull days cover back and biceps; leg days cover everything below the waist. Running the cycle twice a week means each muscle gets trained twice, which is ideal for maximising growth. The downside is the 6-day commitment, which can be tough to maintain and leaves little room for rest if life gets busy.',
  icon: '🔄', color: 'from-cyan-500 to-teal-500', accentColor: 'rgba(20,184,166,0.45)', glowColor: 'rgba(20,184,166,0.35)', days: [1, 2, 3, 5, 6, 7],
  workouts: {
    1: { name: 'Push A', color: 'orange', exercises: [{ exercise: 'Barbell Bench Press', sets: '4', reps: '6', weight: '' },{ exercise: 'Overhead Press', sets: '4', reps: '8', weight: '' },{ exercise: 'Incline Dumbbell Press', sets: '3', reps: '10', weight: '' },{ exercise: 'Cable Fly', sets: '3', reps: '12', weight: '' },{ exercise: 'Lateral Raises', sets: '3', reps: '15', weight: '' },{ exercise: 'Tricep Pushdown', sets: '3', reps: '12', weight: '' }] },
    2: { name: 'Pull A', color: 'blue', exercises: [{ exercise: 'Deadlift', sets: '4', reps: '5', weight: '' },{ exercise: 'Pull-Ups', sets: '4', reps: '8', weight: '' },{ exercise: 'Barbell Row', sets: '4', reps: '8', weight: '' },{ exercise: 'Face Pulls', sets: '3', reps: '15', weight: '' },{ exercise: 'Barbell Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Hammer Curls', sets: '3', reps: '12', weight: '' }] },
    3: { name: 'Legs A', color: 'green', exercises: [{ exercise: 'Barbell Squat', sets: '4', reps: '6', weight: '' },{ exercise: 'Romanian Deadlift', sets: '4', reps: '8', weight: '' },{ exercise: 'Leg Press', sets: '3', reps: '12', weight: '' },{ exercise: 'Leg Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Leg Extension', sets: '3', reps: '12', weight: '' },{ exercise: 'Calf Raises', sets: '4', reps: '20', weight: '' }] },
    5: { name: 'Push B', color: 'orange', exercises: [{ exercise: 'Incline Barbell Press', sets: '4', reps: '8', weight: '' },{ exercise: 'Dumbbell Shoulder Press', sets: '4', reps: '10', weight: '' },{ exercise: 'Cable Fly', sets: '3', reps: '12', weight: '' },{ exercise: 'Lateral Raises', sets: '4', reps: '15', weight: '' },{ exercise: 'Skull Crushers', sets: '3', reps: '12', weight: '' },{ exercise: 'Overhead Tricep', sets: '3', reps: '12', weight: '' }] },
    6: { name: 'Pull B', color: 'blue', exercises: [{ exercise: 'Lat Pulldown', sets: '4', reps: '10', weight: '' },{ exercise: 'Cable Row', sets: '4', reps: '10', weight: '' },{ exercise: 'Dumbbell Row', sets: '3', reps: '10', weight: '' },{ exercise: 'Rear Delt Fly', sets: '3', reps: '15', weight: '' },{ exercise: 'Incline Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Hammer Curls', sets: '3', reps: '12', weight: '' }] },
    7: { name: 'Legs B', color: 'green', exercises: [{ exercise: 'Front Squat', sets: '4', reps: '8', weight: '' },{ exercise: 'Bulgarian Split Squat', sets: '3', reps: '10', weight: '' },{ exercise: 'Hack Squat', sets: '3', reps: '10', weight: '' },{ exercise: 'Leg Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Leg Extension', sets: '3', reps: '12', weight: '' },{ exercise: 'Calf Raises', sets: '4', reps: '20', weight: '' }] }
  }
},
{
  id: 'full_body', name: 'Full Body', description: '3 days · total body each session',
  blurb: 'Every session trains your whole body — squats, pressing, pulling and more all in one workout, three times a week. This is widely considered the best option for beginners because you practice every movement pattern frequently, which speeds up learning and early strength gains. The trade-off is that sessions can feel tiring, and as you get stronger the workouts become harder to complete in a reasonable time.',
  icon: '🏋️', color: 'from-emerald-500 to-green-600', accentColor: 'rgba(16,185,129,0.45)', glowColor: 'rgba(16,185,129,0.35)', days: [1, 3, 5],
  workouts: {
    1: { name: 'Full Body A', color: 'green', exercises: [{ exercise: 'Barbell Squat', sets: '4', reps: '6', weight: '' },{ exercise: 'Barbell Bench Press', sets: '4', reps: '8', weight: '' },{ exercise: 'Barbell Row', sets: '4', reps: '8', weight: '' },{ exercise: 'Overhead Press', sets: '3', reps: '10', weight: '' },{ exercise: 'Barbell Curl', sets: '3', reps: '12', weight: '' },{ exercise: 'Calf Raises', sets: '3', reps: '15', weight: '' }] },
    3: { name: 'Full Body B', color: 'cyan', exercises: [{ exercise: 'Deadlift', sets: '4', reps: '5', weight: '' },{ exercise: 'Incline Dumbbell Press', sets: '4', reps: '10', weight: '' },{ exercise: 'Pull-Ups', sets: '4', reps: '8', weight: '' },{ exercise: 'Dumbbell Shoulder Press', sets: '3', reps: '10', weight: '' },{ exercise: 'Tricep Pushdown', sets: '3', reps: '12', weight: '' },{ exercise: 'Leg Curl', sets: '3', reps: '12', weight: '' }] },
    5: { name: 'Full Body C', color: 'blue', exercises: [{ exercise: 'Front Squat', sets: '4', reps: '8', weight: '' },{ exercise: 'Dumbbell Bench Press', sets: '4', reps: '10', weight: '' },{ exercise: 'Cable Row', sets: '4', reps: '10', weight: '' },{ exercise: 'Lateral Raises', sets: '3', reps: '15', weight: '' },{ exercise: 'Hammer Curls', sets: '3', reps: '12', weight: '' },{ exercise: 'Calf Raises', sets: '3', reps: '20', weight: '' }] }
  }
}];

const COLOR_OPTIONS = [
  { value: 'blue', gradient: 'from-blue-500 to-blue-600' },
  { value: 'purple', gradient: 'from-purple-500 to-purple-600' },
  { value: 'cyan', gradient: 'from-cyan-500 to-cyan-600' },
  { value: 'green', gradient: 'from-green-500 to-green-600' },
  { value: 'orange', gradient: 'from-orange-500 to-orange-600' },
  { value: 'pink', gradient: 'from-pink-500 to-pink-600' },
  { value: 'red', gradient: 'from-red-500 to-red-600' },
  { value: 'yellow', gradient: 'from-yellow-400 to-yellow-500' }
];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function colorGradient(c) {
  return COLOR_OPTIONS.find((o) => o.value === c)?.gradient || 'from-blue-500 to-blue-600';
}
const INPUT_BASE = { fontSize: '16px', WebkitAppearance: 'none', MozAppearance: 'textfield' };

function SetActiveButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center whitespace-nowrap font-bold transition-all duration-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 py-2 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 backdrop-blur-md text-white border border-transparent rounded-lg text-xs h-8 px-2.5 shadow-[0_3px_0_0_#5b21b6,inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">
      Set Active
    </button>
  );
}

function SmallInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text" inputMode="decimal" value={value}
      onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={INPUT_BASE}
      className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[13px] text-white text-center focus:outline-none focus:border-blue-500/50 placeholder-slate-600" />
  );
}

function ReadOnlyDayCard({ day, workout, weights, onWeightChange, sets, onSetsChange, reps, onRepsChange }) {
  const grad = colorGradient(workout.color);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(12,16,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow`}>
          <span className="text-[11px] font-black text-white">{DAY_NAMES[day - 1]}</span>
        </div>
        <p className="flex-1 text-white text-[14px] font-bold">{workout.name}</p>
      </div>
      <div className="flex gap-1.5 px-4 pb-3">
        {COLOR_OPTIONS.map((c) =>
          <div key={c.value} className={`w-6 h-6 rounded-lg bg-gradient-to-br ${c.gradient} ${workout.color === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0b0f1c]' : 'opacity-20'}`} />
        )}
      </div>
      {workout.exercises?.length > 0 &&
        <div className="border-t border-slate-800 px-4 pt-3 pb-2 space-y-2.5">
          <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 60px' }}>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Exercise</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Sets</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Reps</span>
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Weight</span>
          </div>
          {workout.exercises.map((ex, idx) =>
            <div key={idx} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 60px' }}>
              <p className="px-2.5 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-slate-300 truncate">{ex.exercise}</p>
              <input type="text" inputMode="decimal" value={sets?.[idx] ?? ex.sets ?? ''} onChange={(e) => onSetsChange(idx, e.target.value)} placeholder={ex.sets || '—'} style={{ fontSize: '16px', WebkitAppearance: 'none' }} className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[13px] text-white text-center focus:outline-none focus:border-blue-500/50 placeholder-slate-600" />
              <input type="text" inputMode="decimal" value={reps?.[idx] ?? ex.reps ?? ''} onChange={(e) => onRepsChange(idx, e.target.value)} placeholder={ex.reps || '—'} style={{ fontSize: '16px', WebkitAppearance: 'none' }} className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[13px] text-white text-center focus:outline-none focus:border-blue-500/50 placeholder-slate-600" />
              <div className="relative">
                <input type="text" inputMode="decimal" value={weights?.[idx] ?? ''} onChange={(e) => onWeightChange(idx, e.target.value)} placeholder="—" style={{ fontSize: '16px', WebkitAppearance: 'none' }} className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[13px] text-white text-center focus:outline-none focus:border-blue-500/50 placeholder-slate-600" />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-bold pointer-events-none">kg</span>
              </div>
            </div>
          )}
        </div>
      }
    </div>
  );
}

function SplitCard({ onClick, isActive, glowColor, children }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div onClick={onClick} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)} onTouchCancel={() => setPressed(false)}
      className="relative overflow-hidden rounded-2xl cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        transform: pressed ? 'scale(0.977) translateY(2px)' : 'scale(1)',
        boxShadow: pressed ? `0 2px 8px rgba(0,0,0,0.5), 0 0 22px 2px ${glowColor || 'rgba(99,102,241,0.35)'}` : `0 4px 24px rgba(0,0,0,0.4)`,
        transition: pressed ? 'transform 0.08s ease, box-shadow 0.08s ease' : 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.22s ease'
      }}>
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(ellipse at 25% 35%, ${glowColor || 'rgba(99,102,241,0.35)'} 0%, transparent 60%)`, opacity: pressed ? 0.22 : isActive ? 0.14 : 0.09, transition: 'opacity 0.1s ease' }} />
      {children}
    </div>
  );
}

function SetActiveSplitModal({ open, onClose, allSplits, activeSplitId, onSave, isSaving }) {
  const [selected, setSelected] = useState(null);
  useEffect(() => { if (open) setSelected(null); }, [open]);
  const effectiveActive = selected ?? activeSplitId;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-[60] grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] max-w-lg max-h-[80vh] overflow-y-auto [&>button]:hidden bg-slate-800/30 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2"><Star className="w-5 h-5 text-purple-400" />Set Active Split</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-purple-500/10 border border-purple-400/30 rounded-xl p-2.5">
            <p className="text-purple-200 text-xs">Your active split is the workout plan shown on your Home page and used when you log training sessions.</p>
          </div>
          <div className="space-y-2">
            {allSplits.map((entry, i) => {
              const isPrimary = effectiveActive === entry.id;
              return (
                <button key={entry.id} onClick={() => setSelected(entry.id)} className={`w-full text-left p-2 rounded-xl border-2 transition-all ${isPrimary ? 'bg-purple-500/20 border-purple-400/50' : 'bg-slate-800/50 border-slate-700/50 hover:border-purple-400/30'}`} style={{ animationDelay: `${140 + i * 55}ms` }}>
                  <div className="flex items-center justify-between">
                    <div><h4 className="font-bold text-white text-sm">{entry.name}</h4><p className="text-xs text-slate-400 mt-0.5">{entry.description || `${(entry.training_days || []).length} days · custom`}</p></div>
                    {isPrimary && <Badge className="bg-purple-500 text-white flex-shrink-0"><Star className="w-3 h-3 mr-1" />Active</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 py-2 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 backdrop-blur-md text-white border border-slate-500/40 h-9 px-4 flex-1 shadow-[0_3px_0_0_#1e293b,inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">Cancel</Button>
            <Button onClick={() => { if (selected) onSave(selected); else onClose(); }} disabled={isSaving} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 py-2 bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 backdrop-blur-md text-white border border-transparent h-9 px-4 flex-1 shadow-[0_3px_0_0_#5b21b6,inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CreateSplitModal({ isOpen, onClose, currentUser }) {
  const [step, setStep] = useState('pick');
  const [previewSplit, setPreviewSplit] = useState(null);
  const [splitName, setSplitName] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [workouts, setWorkouts] = useState({});
  const [previewWeights, setPreviewWeights] = useState({});
  const [previewSets, setPreviewSets] = useState({});
  const [previewReps, setPreviewReps] = useState({});
  const [weightsDirty, setWeightsDirty] = useState(false);
  const [dotsMenuOpen, setDotsMenuOpen] = useState(false);
  const [confirmDeleteSplitId, setConfirmDeleteSplitId] = useState(null);
  const [editingSplitId, setEditingSplitId] = useState(null);
  const [savedSplits, setSavedSplits] = useState([]);
  const [activeSplitId, setActiveSplitId] = useState('');
  const [showSetActiveModal, setShowSetActiveModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen) return;
    const saved = currentUser?.saved_splits || [];
    setSavedSplits(saved);
    const storedActiveId = currentUser?.active_split_id || '';
    if (storedActiveId) { setActiveSplitId(storedActiveId); } else {
      const activeName = currentUser?.custom_split_name || '';
      const activeByName = saved.find((s) => s.name === activeName);
      setActiveSplitId(activeByName?.id || currentUser?.workout_split || '');
    }
    setStep('pick'); setPreviewSplit(null); setPreviewWeights({}); setWeightsDirty(false);
    setSplitName(''); setSelectedDays([]); setWorkouts({}); setEditingSplitId(null);
    setDotsMenuOpen(false); setShowSetActiveModal(false);
  }, [isOpen]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currentUser'], refetchType: 'all' }); toast.success('Split saved!'); setSplitName(''); setSelectedDays([]); setWorkouts({}); setStep('pick'); }
  });

  const setActiveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'], refetchType: 'all' }),
    onError: () => toast.error('Failed to update — please try again')
  });

  const handleBack = () => {
    if (step === 'preview') { setStep('pick'); setPreviewSplit(null); }
    else if (step === 'configure') { setDotsMenuOpen(false); setEditingSplitId(null); setStep('pick'); }
    else { onClose(); }
  };

  const allSplitsForModal = [
    ...DEFAULT_SPLITS.map((def) => ({ id: def.id, name: def.name, description: def.description, preset_id: def.id, training_days: def.days, workouts: def.workouts })),
    ...savedSplits.filter((s) => !s.preset_id || s.preset_id === 'custom').map((s) => ({ id: s.id, name: s.name, description: null, preset_id: 'custom', training_days: s.training_days, workouts: s.workouts }))
  ];

  const handleSetActiveFromModal = (splitId) => {
    const entry = allSplitsForModal.find((s) => s.id === splitId);
    if (!entry) return;
    setActiveSplitId(entry.id);
    toast.success(`"${entry.name}" set as active!`);
    const updated = [...savedSplits.filter((s) => s.id !== entry.id), { ...entry, created_at: new Date().toISOString() }];
    setSavedSplits(updated);
    setActiveMutation.mutate({ active_split_id: entry.id, workout_split: entry.preset_id || 'custom', custom_split_name: entry.name, training_days: entry.training_days, custom_workout_types: entry.workouts, saved_splits: updated });
    setShowSetActiveModal(false);
  };

  const customSavedSplits = savedSplits.filter((s) => !s.preset_id || s.preset_id === 'custom');

  const openDefaultPreview = (def) => {
    setPreviewSplit(def);
    const savedVersion = savedSplits.find((s) => s.id === def.id);
    if (savedVersion?.workouts) {
      setPreviewWeights(Object.fromEntries(Object.entries(savedVersion.workouts).map(([day, wt]) => [day, Object.fromEntries((wt.exercises || []).map((ex, idx) => [idx, ex.weight || '']))])));
      setPreviewSets(Object.fromEntries(Object.entries(savedVersion.workouts).map(([day, wt]) => [day, Object.fromEntries((wt.exercises || []).map((ex, idx) => [idx, ex.sets || '']))])));
      setPreviewReps(Object.fromEntries(Object.entries(savedVersion.workouts).map(([day, wt]) => [day, Object.fromEntries((wt.exercises || []).map((ex, idx) => [idx, ex.reps || '']))])));
    } else { setPreviewWeights({}); setPreviewSets({}); setPreviewReps({}); }
    setWeightsDirty(false); setStep('preview');
  };

  const openEditCustom = (split) => { setSplitName(split.name || ''); setSelectedDays(split.training_days || []); setWorkouts(split.workouts || {}); setEditingSplitId(split.id); setDotsMenuOpen(false); setStep('configure'); };
  const openCustomConfigure = () => { setSplitName(''); setSelectedDays([]); setWorkouts({}); setEditingSplitId(null); setDotsMenuOpen(false); setStep('configure'); };

  const handleSave = () => {
    const newSplit = { id: editingSplitId || Date.now().toString(), preset_id: 'custom', name: splitName || 'My Split', training_days: selectedDays, workouts, created_at: new Date().toISOString() };
    const updated = [...savedSplits.filter((s) => s.id !== newSplit.id), newSplit];
    setSavedSplits(updated);
    saveMutation.mutate({ workout_split: 'custom', custom_split_name: newSplit.name, training_days: selectedDays, custom_workout_types: workouts, saved_splits: updated });
  };

  const toggleDay = (dayNum) => {
    if (selectedDays.includes(dayNum)) { setSelectedDays((prev) => prev.filter((d) => d !== dayNum)); setWorkouts((prev) => { const n = { ...prev }; delete n[dayNum]; return n; }); }
    else { setSelectedDays((prev) => [...prev, dayNum].sort((a, b) => a - b)); setWorkouts((prev) => ({ ...prev, [dayNum]: { name: '', color: 'blue', exercises: [] } })); }
  };
  const updateWorkout = (day, field, value) => setWorkouts((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  const addExercise = (day) => setWorkouts((prev) => ({ ...prev, [day]: { ...prev[day], exercises: [...(prev[day]?.exercises || []), { exercise: '', sets: '3', reps: '10', weight: '' }] } }));
  const updateExercise = (day, idx, field, value) => setWorkouts((prev) => { const exs = [...(prev[day]?.exercises || [])]; exs[idx] = { ...exs[idx], [field]: value }; return { ...prev, [day]: { ...prev[day], exercises: exs } }; });
  const removeExercise = (day, idx) => setWorkouts((prev) => { const exs = [...(prev[day]?.exercises || [])]; exs.splice(idx, 1); return { ...prev, [day]: { ...prev[day], exercises: exs } }; });
  const addCardio = (day) => setWorkouts((prev) => ({ ...prev, [day]: { ...prev[day], cardio: [...(prev[day]?.cardio || []), { exercise: '', rounds: '1', time: '', rest: '' }] } }));
  const updateCardio = (day, idx, field, value) => setWorkouts((prev) => { const arr = [...(prev[day]?.cardio || [])]; arr[idx] = { ...arr[idx], [field]: value }; return { ...prev, [day]: { ...prev[day], cardio: arr } }; });
  const removeCardio = (day, idx) => setWorkouts((prev) => { const arr = [...(prev[day]?.cardio || [])]; arr.splice(idx, 1); return { ...prev, [day]: { ...prev[day], cardio: arr } }; });

  // ── Time input: raw digits → M:SS format ─────────────────────────────────
  const formatTime = (raw) => {
    const digits = (raw || '').replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';
    const padded = digits.padStart(3, '0');
    const mins = padded.slice(0, padded.length - 2);
    const secs = padded.slice(-2);
    return `${parseInt(mins, 10)}:${secs}`;
  };
  const handleTimeChange = (day, idx, field, raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    updateCardio(day, idx, field, digits);
  };

  const btnPrimary = "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-full px-6 py-2.5 shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";
  const btnSecondary = "bg-slate-800/70 border border-slate-600/50 text-slate-300 font-bold rounded-full px-5 py-2.5 shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu";
  const headerTitle = step === 'preview' ? previewSplit?.name : step === 'configure' ? 'Custom Split' : 'My Splits';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] flex flex-col">
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto">

        {/* ── HEADER ── */}
        <div className="relative flex items-center px-4 py-[14.7px] border-b border-slate-700/40 flex-shrink-0">
          <div className="flex-shrink-0">
            <button onClick={handleBack} className="flex items-center justify-center active:scale-90 transition-transform">
              <ChevronLeft className="w-6 h-6 text-slate-300" />
            </button>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h2 className="text-[22px] font-black text-white leading-tight tracking-tight">{headerTitle}</h2>
          </div>
          <div className="flex-shrink-0 flex items-center justify-end gap-1 ml-auto">

            {/* PICK page */}
            {step === 'pick' && (
              <>
                <button onClick={() => setShowSetActiveModal(true)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 transform-gpu bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 shadow-[0_2px_0_0_#5b21b6,0_4px_8px_rgba(120,40,220,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-90">
                  <Star className="w-4 h-4 text-white" />
                </button>
                <button onClick={openCustomConfigure} className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 transform-gpu bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_2px_0_0_#1a3fa8,0_4px_8px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-90">
                  <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>
              </>
            )}

            {/* PREVIEW page */}
            {step === 'preview' && (
              <SetActiveButton onClick={() => setShowSetActiveModal(true)} />
            )}

            {/* CONFIGURE page — Set Active top right only */}
            {step === 'configure' && editingSplitId && (
              <SetActiveButton onClick={() => setShowSetActiveModal(true)} />
            )}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div className="overflow-y-auto flex-1 pb-4">

          {/* PICK */}
          {step === 'pick' && (
            <div className="p-4 space-y-2">
              {(() => {
                const allSplits = [...DEFAULT_SPLITS.map((def) => ({ type: 'default', id: def.id, def })), ...customSavedSplits.map((split) => ({ type: 'custom', id: split.id, split }))];
                allSplits.sort((a, b) => { if (a.id === activeSplitId) return -1; if (b.id === activeSplitId) return 1; return 0; });
                return allSplits.map((item) => {
                  const isActive = activeSplitId === item.id;
                  if (item.type === 'default') {
                    const def = item.def;
                    return (
                      <SplitCard key={def.id} onClick={() => openDefaultPreview(def)} isActive={isActive} glowColor={def.glowColor}>
                        <div className="flex items-center gap-4 p-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[18.2px] font-black text-white">{def.name}</p>
                            <p className="text-[11.55px] text-slate-400 mt-0.5"><span className="text-slate-500">Default - </span>{def.description}</p>
                            <div className="flex gap-1 mt-1.5 flex-wrap">{def.days.map((d) => <span key={d} className={`text-[10.35px] font-bold w-[30px] py-0.5 rounded-md bg-gradient-to-r ${def.color} text-white opacity-80 text-center inline-block`}>{DAY_NAMES[d - 1]}</span>)}</div>
                          </div>
                          {isActive && <div className="w-[34px] h-[34px] rounded-xl bg-purple-600/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-purple-500/50 flex-shrink-0"><Star className="w-[19px] h-[19px] text-white" /></div>}
                          <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        </div>
                      </SplitCard>
                    );
                  } else {
                    const split = item.split;
                    return (
                      <SplitCard key={split.id} onClick={() => openEditCustom(split)} isActive={isActive} glowColor="rgba(99,102,241,0.35)">
                        <div className="flex items-center gap-4 p-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[18.2px] font-black text-white truncate">{split.name}</p>
                            <p className="text-[11.55px] text-slate-400 mt-0.5">{(split.training_days || []).length} days · custom</p>
                            <div className="flex gap-1 mt-1.5 flex-wrap">{(split.training_days || []).map((d) => <span key={d} className="text-[10.35px] font-bold w-[30px] py-0.5 rounded-md bg-gradient-to-r from-slate-600 to-slate-700 text-white opacity-80 text-center inline-block">{DAY_NAMES[d - 1]}</span>)}</div>
                          </div>
                          {isActive && <div className="w-[34px] h-[34px] rounded-xl bg-purple-600/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-purple-500/50 flex-shrink-0"><Star className="w-[19px] h-[19px] text-white" /></div>}
                          <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        </div>
                      </SplitCard>
                    );
                  }
                });
              })()}
            </div>
          )}

          {/* PREVIEW */}
          {step === 'preview' && previewSplit && (
            <div className="p-4 space-y-3">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[13px] font-black text-white">{previewSplit.description}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">{previewSplit.days.map((d) => <span key={d} className={`text-[10.35px] font-bold w-[30px] py-0.5 rounded-md bg-gradient-to-r ${previewSplit.color} text-white opacity-80 text-center inline-block`}>{DAY_NAMES[d - 1]}</span>)}</div>
                {previewSplit.blurb && <p className="text-[11px] text-slate-400 leading-relaxed mt-3">{previewSplit.blurb}</p>}
              </div>
              {previewSplit.days.map((day) => {
                const wt = previewSplit.workouts[day];
                if (!wt) return null;
                return <ReadOnlyDayCard key={day} day={day} workout={wt} weights={previewWeights[day] || {}} onWeightChange={(idx, val) => { setPreviewWeights((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), [idx]: val } })); setWeightsDirty(true); }} sets={previewSets[day] || {}} onSetsChange={(idx, val) => { setPreviewSets((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), [idx]: val } })); setWeightsDirty(true); }} reps={previewReps[day] || {}} onRepsChange={(idx, val) => { setPreviewReps((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), [idx]: val } })); setWeightsDirty(true); }} />;
              })}
            </div>
          )}

          {/* CONFIGURE */}
          {step === 'configure' && (
            <div className="p-4 space-y-4">

              {/* ── Split Name row ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Split Name</label>
                  {editingSplitId && (
                    <div className="relative">
                      <button onClick={() => setDotsMenuOpen((prev) => !prev)} className="w-8 h-8 flex items-center justify-center active:scale-90 transition-transform">
                        <MoreVertical className="w-[18px] h-[18px] text-slate-400" />
                      </button>
                      {dotsMenuOpen && (
                        <div className="absolute right-0 top-9 z-20 rounded-xl overflow-hidden shadow-xl" style={{ background: 'rgba(30,35,55,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <button onClick={() => { setDotsMenuOpen(false); setConfirmDeleteSplitId(editingSplitId); }} className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold text-slate-300 hover:bg-slate-700/60 transition-colors w-full whitespace-nowrap">
                            Delete Split
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <input type="text" value={splitName} onChange={(e) => setSplitName(e.target.value.slice(0, 30))} placeholder="My Training Split" maxLength={30} style={{ fontSize: '16px' }} className="w-full px-4 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Training Days</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAY_NAMES.map((name, i) => {
                    const d = i + 1; const on = selectedDays.includes(d);
                    return (
                      <button key={d} onClick={() => toggleDay(d)} className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl border-2 font-bold text-[10px] transition-all active:scale-90 ${on ? 'bg-gradient-to-b from-blue-500 to-blue-700 border-blue-400/50 text-white shadow-[0_2px_0_0_#1a3fa8]' : 'bg-slate-900/60 border-slate-700/40 text-slate-600'}`}>
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
                          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colorGradient(wt.color)} flex items-center justify-center flex-shrink-0 shadow`}><span className="text-[11px] font-black text-white">{DAY_NAMES[day - 1]}</span></div>
                          <input type="text" value={wt.name || ''} onChange={(e) => updateWorkout(day, 'name', e.target.value.slice(0, 25))} placeholder={`Day ${day} workout…`} maxLength={25} style={{ fontSize: '16px' }} className="flex-1 bg-transparent border-none text-white text-[14px] font-bold placeholder-slate-600 focus:outline-none" />
                        </div>
                        <div className="flex gap-1.5 px-4 pb-3">{COLOR_OPTIONS.map((c) => <button key={c.value} onClick={() => updateWorkout(day, 'color', c.value)} className={`w-6 h-6 rounded-lg bg-gradient-to-br ${c.gradient} transition-all active:scale-90 ${wt.color === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0b0f1c]' : 'opacity-40'}`} />)}</div>
                        {exs.length > 0 && (
                          <div className="border-t border-slate-800 px-4 pt-3 pb-2 space-y-2.5">
                            <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 60px 28px' }}>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Exercise</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Sets</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Reps</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Weight</span>
                              <span />
                            </div>
                            {exs.map((ex, idx) =>
                              <div key={idx} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 52px 52px 60px 28px' }}>
                                <input type="text" value={ex.exercise || ''} onChange={(e) => updateExercise(day, idx, 'exercise', e.target.value)} placeholder="e.g. Bench press" style={{ fontSize: '16px' }} className="px-2.5 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-full" />
                                <SmallInput value={ex.sets ?? '3'} onChange={(v) => updateExercise(day, idx, 'sets', v)} placeholder="3" />
                                <SmallInput value={ex.reps ?? '10'} onChange={(v) => updateExercise(day, idx, 'reps', v)} placeholder="10" />
                                <div className="relative"><SmallInput value={ex.weight ?? ''} onChange={(v) => updateExercise(day, idx, 'weight', v)} placeholder="—" /><span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-bold pointer-events-none">kg</span></div>
                                <button onClick={() => removeExercise(day, idx)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors active:scale-90"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── Cardio rows ── */}
                        {(wt.cardio || []).length > 0 && (
                          <div className="border-t border-slate-800 px-4 pt-3 pb-2 space-y-2.5">
                            <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 46px 62px 62px 28px' }}>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">Exercise</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Rounds</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Time/Round</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider text-center">Rest</span>
                              <span />
                            </div>
                            {(wt.cardio || []).map((c, idx) => {
                              const rounds = parseInt(c.rounds, 10) || 0;
                              const restDisabled = rounds <= 1;
                              return (
                                <div key={idx} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 46px 62px 62px 28px' }}>
                                  <input type="text" value={c.exercise || ''} onChange={(e) => updateCardio(day, idx, 'exercise', e.target.value)} placeholder="e.g. Rowing" style={{ fontSize: '16px' }} className="px-2.5 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[12px] text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 w-full" />
                                  <SmallInput value={c.rounds ?? '1'} onChange={(v) => updateCardio(day, idx, 'rounds', v)} placeholder="1" />
                                  {/* Time per round */}
                                  <div className="relative">
                                    <input
                                      type="text" inputMode="numeric"
                                      value={formatTime(c.time)}
                                      onChange={(e) => handleTimeChange(day, idx, 'time', e.target.value)}
                                      placeholder="0:00"
                                      style={{ fontSize: '16px', WebkitAppearance: 'none' }}
                                      className="w-full px-2 py-2 bg-slate-800/70 border border-slate-700/40 rounded-lg text-[11px] text-white text-center focus:outline-none focus:border-blue-500/50 placeholder-slate-600 pr-6"
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 font-bold pointer-events-none">min</span>
                                  </div>
                                  {/* Rest */}
                                  <div className="relative">
                                    <input
                                      type="text" inputMode="numeric"
                                      value={restDisabled ? '' : formatTime(c.rest)}
                                      onChange={(e) => { if (!restDisabled) handleTimeChange(day, idx, 'rest', e.target.value); }}
                                      placeholder="0:00"
                                      disabled={restDisabled}
                                      style={{ fontSize: '16px', WebkitAppearance: 'none' }}
                                      className={`w-full px-2 py-2 border rounded-lg text-[11px] text-center focus:outline-none pr-6 transition-opacity ${restDisabled ? 'bg-slate-900/40 border-slate-800/40 text-slate-700 placeholder-slate-800 cursor-not-allowed opacity-50' : 'bg-slate-800/70 border-slate-700/40 text-white placeholder-slate-600 focus:border-blue-500/50'}`}
                                    />
                                    <span className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-bold pointer-events-none ${restDisabled ? 'text-slate-700' : 'text-slate-500'}`}>min</span>
                                  </div>
                                  <button onClick={() => removeCardio(day, idx)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors active:scale-90"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="px-4 pb-3.5 pt-2 flex flex-col gap-1.5">
                          <button onClick={() => addExercise(day)} className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors active:scale-95"><Plus className="w-3.5 h-3.5" /> Add exercise</button>
                          <button onClick={() => addCardio(day)} className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors active:scale-95"><Plus className="w-3.5 h-3.5" /> Add cardio</button>
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
                const mergedWorkouts = Object.fromEntries(Object.entries(previewSplit.workouts).map(([day, wt]) => {
                  const dayWeights = previewWeights[day] || {}; const daySets = previewSets[day] || {}; const dayReps = previewReps[day] || {};
                  const mergedExercises = (wt.exercises || []).map((ex, idx) => ({ ...ex, weight: dayWeights[idx] !== undefined ? dayWeights[idx] : ex.weight, sets: daySets[idx] !== undefined && daySets[idx] !== '' ? daySets[idx] : ex.sets, reps: dayReps[idx] !== undefined && dayReps[idx] !== '' ? dayReps[idx] : ex.reps }));
                  return [day, { ...wt, exercises: mergedExercises }];
                }));
                const splitEntry = { id: previewSplit.id, preset_id: previewSplit.id, name: previewSplit.name, training_days: previewSplit.days, workouts: mergedWorkouts, created_at: new Date().toISOString() };
                const updated = [...savedSplits.filter((s) => s.id !== previewSplit.id), splitEntry];
                setSavedSplits(updated);
                const isActive = activeSplitId === previewSplit.id;
                setActiveMutation.mutate({ saved_splits: updated, ...(isActive ? { custom_workout_types: mergedWorkouts } : {}) });
                toast.success('Weights saved!'); setWeightsDirty(false);
              }}
              disabled={setActiveMutation.isPending}
              className="bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-black rounded-full px-6 py-2.5 shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-sm transform-gpu flex-1 disabled:opacity-40 disabled:cursor-not-allowed">
              {setActiveMutation.isPending ? 'Saving…' : 'Save Weights'}
            </button>
          </div>
        )}
        {step === 'configure' && (
          <div className="flex gap-2 px-4 py-4 border-t border-slate-800 flex-shrink-0">
            <button onClick={handleBack} className={btnSecondary}>Back</button>
            <button onClick={handleSave} disabled={selectedDays.length === 0 || saveMutation.isPending} className={btnPrimary + ' flex-1 disabled:opacity-40 disabled:cursor-not-allowed'}>
              {saveMutation.isPending ? 'Saving…' : 'Save Split'}
            </button>
          </div>
        )}
      </div>

      <SetActiveSplitModal open={showSetActiveModal} onClose={() => setShowSetActiveModal(false)} allSplits={allSplitsForModal} activeSplitId={activeSplitId} onSave={handleSetActiveFromModal} isSaving={setActiveMutation.isPending} />

      {confirmDeleteSplitId && (
        <div className="absolute inset-0 z-60 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setConfirmDeleteSplitId(null)}>
          <div className="w-full max-w-xs rounded-2xl p-6 space-y-4" style={{ background: 'rgba(18,22,40,0.98)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={(e) => e.stopPropagation()}>
            <p className="text-[15px] font-black text-white text-center leading-snug">Are you sure you want to delete this split?</p>
            <p className="text-[12px] text-slate-500 text-center">This is irreversible.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmDeleteSplitId(null)} className="flex-1 py-2.5 rounded-full text-[13px] font-bold text-slate-300 bg-slate-700/70 border border-slate-600/50 active:scale-95 transition-transform">Cancel</button>
              <button onClick={() => { const id = confirmDeleteSplitId; setConfirmDeleteSplitId(null); const updated = savedSplits.filter((s) => s.id !== id); setSavedSplits(updated); if (activeSplitId === id) setActiveSplitId(''); saveMutation.mutate({ saved_splits: updated }); }} className="flex-1 py-2.5 rounded-full text-[13px] font-bold text-white bg-gradient-to-b from-red-500 to-red-600 shadow-[0_3px_0_0_#7f1d1d] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}