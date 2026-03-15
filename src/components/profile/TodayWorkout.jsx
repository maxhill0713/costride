import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Edit2, Check, X, TrendingUp, TrendingDown, ChevronDown, Clock, Calculator, BookOpen, Info, ChevronLeft } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PlateCalculatorModal from './PlateCalculatorModal.jsx';
import WorkoutNotesModal from './WorkoutNotesModal.jsx';
import WorkoutSummaryModal from './WorkoutSummaryModal.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useTimer } from '../TimerContext';

// ── Workout Switcher Modal ───────────────────────────────────────────────────
function WorkoutSwitcherModal({ open, onClose, currentUser, activeDayKey, onSelect }) {
  if (!open) return null;

  const workoutTypes = currentUser?.custom_workout_types || {};
  const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const workoutDays = Object.entries(workoutTypes)
    .map(([dayKey, workout]) => ({
      dayKey: parseInt(dayKey),
      name: workout?.name || DAY_NAMES[parseInt(dayKey)] || `Day ${dayKey}`,
      exercises: workout?.exercises || [],
      dayName: DAY_NAMES[parseInt(dayKey)] || `Day ${dayKey}`,
    }))
    .filter(d => d.exercises.length > 0)
    .sort((a, b) => {
      if (a.dayKey === activeDayKey) return -1;
      if (b.dayKey === activeDayKey) return 1;
      return a.dayKey - b.dayKey;
    });

  return (
    <>
      <div
        className="fixed z-[10005] bg-slate-950/70 backdrop-blur-sm"
        style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
        onClick={onClose}
      />
      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10006] bg-slate-900/90 backdrop-blur-xl border border-slate-700/40 rounded-3xl shadow-2xl shadow-black/60 text-white overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-xl font-black text-white tracking-tight text-center">Switch Workout</h3>
        </div>
        <div className="px-3 pb-2 space-y-1.5 max-h-[60vh] overflow-y-auto">
          {workoutDays.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">No workouts configured yet.</p>
          )}
          {workoutDays.map((wd) => {
            const isActive = wd.dayKey === activeDayKey;
            return (
              <button
                key={wd.dayKey}
                onClick={() => { onSelect(wd.dayKey); onClose(); }}
                className={`w-full text-left rounded-2xl border transition-all duration-200 px-4 py-3 ${
                  isActive
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : 'border-slate-700/40 bg-slate-800/50 hover:border-slate-500/60 hover:bg-slate-700/50'
                }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-black truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                      {wd.name}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function TodayWorkout({ currentUser, workoutStartTime, onWorkoutStart, onWorkoutLogged }) {
  const { restTimer, setRestTimer, isTimerActive, setIsTimerActive, initialRestTime, setInitialRestTime } = useTimer();
  const [editingIndex, setEditingIndex] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editSets, setEditSets] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showLogConfirm, setShowLogConfirm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [frozenDuration, setFrozenDuration] = useState(0);
  const [summaryLog, setSummaryLog] = useState(null);

  const [overrideDayKey, setOverrideDayKey] = useState(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    let interval;
    if (workoutStartTime && !showSummary) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
        setWorkoutDuration(elapsed);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStartTime, showSummary]);

  React.useEffect(() => {
    if (showSummary && !frozenDuration) {
      setFrozenDuration(workoutDuration);
    }
    if (!showSummary) {
      setFrozenDuration(0);
    }
  }, [showSummary, workoutDuration, frozenDuration]);

  const today = useMemo(() => new Date(), []);
  const dayOfWeek = today.getDay();
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  const activeDayKey = overrideDayKey !== null ? overrideDayKey : adjustedDay;

  const getTodayWorkout = () => {
    if (!currentUser?.custom_workout_types) return null;

    if (overrideDayKey !== null) {
      const workout = currentUser.custom_workout_types[overrideDayKey];
      if (!workout) return null;
      return {
        name: workout.name || 'Training Day',
        exercises: workout.exercises || [],
      };
    }

    const trainingDays = currentUser?.training_days || [];
    if (!trainingDays.includes(adjustedDay)) {
      return { name: 'Rest Day', exercises: [] };
    }
    const workout = currentUser.custom_workout_types[adjustedDay];
    if (!workout) return null;
    return {
      name: workout.name || 'Training Day',
      exercises: workout.exercises || [],
    };
  };

  const todayWorkout = getTodayWorkout();

  const isDefaultSplit = () => {
    const activeSplitId = currentUser?.active_split_id || '';
    const savedSplits = currentUser?.saved_splits || [];
    if (activeSplitId) {
      const activeSplit = savedSplits.find((s) => s.id === activeSplitId);
      if (activeSplit) {
        return activeSplit.preset_id && activeSplit.preset_id !== 'custom';
      }
    }
    const workoutSplit = currentUser?.workout_split || '';
    return workoutSplit !== 'custom' && workoutSplit !== '';
  };

  const { data: previousWorkouts = [] } = useQuery({
    queryKey: ['workoutLog', currentUser?.id, activeDayKey],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const logs = await base44.entities.WorkoutLog.filter({
        user_id: currentUser.id,
        day_of_week: activeDayKey,
      });
      return logs.filter((log) => new Date(log.completed_date) >= oneWeekAgo);
    },
    enabled: !!currentUser?.id,
  });

  const todayDate = new Date().toISOString().split('T')[0];
  const previousWorkoutsExcludingToday = previousWorkouts.filter((log) => log.completed_date !== todayDate);
  const lastWorkout = previousWorkoutsExcludingToday.length > 0
    ? previousWorkoutsExcludingToday[previousWorkoutsExcludingToday.length - 1]
    : null;
  const todayLog = previousWorkouts.find((log) => log.completed_date === todayDate);
  const alreadyLoggedToday = !!todayLog;

  const updateWorkoutMutation = useMutation({
    mutationFn: async (updatedExercises) => {
      const updatedWorkout = {
        ...currentUser.custom_workout_types,
        [activeDayKey]: {
          ...currentUser.custom_workout_types[activeDayKey],
          exercises: updatedExercises,
        },
      };
      await base44.auth.updateMe({ custom_workout_types: updatedWorkout });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setEditingIndex(null);
    },
  });

  const handleEdit = (index, exercise) => {
    setEditingIndex(index);
    const setsRepsStr = exercise.setsReps || '';
    const parts = setsRepsStr.split('x').filter((p) => p);
    setEditSets(parts[0] || exercise.sets || '');
    setEditReps(parts[1] || exercise.reps || '');
    setEditWeight(exercise.weight || '');
  };

  const handleSave = (index) => {
    const currentExercise = todayWorkout.exercises[index];
    const weight = editWeight || currentExercise.weight;
    const sets = editSets || currentExercise.sets || currentExercise.setsReps?.split('x')?.[0];
    const reps = editReps || currentExercise.reps || currentExercise.setsReps?.split('x')?.[1];
    const setsReps = `${sets}x${reps}`;

    const updatedExercises = [...todayWorkout.exercises];
    updatedExercises[index] = { ...updatedExercises[index], weight, setsReps, sets, reps };

    const updatedWorkoutTypes = { ...currentUser.custom_workout_types };
    const currentWorkoutName = todayWorkout.name;

    Object.keys(updatedWorkoutTypes).forEach((dayKey) => {
      const workout = updatedWorkoutTypes[dayKey];
      if (workout.name === currentWorkoutName && parseInt(dayKey) !== activeDayKey) {
        if (workout.exercises?.[index]?.exercise === updatedExercises[index].exercise) {
          updatedWorkoutTypes[dayKey] = {
            ...workout,
            exercises: workout.exercises.map((ex, i) =>
              i === index ? { ...ex, weight, setsReps, sets, reps } : ex
            ),
          };
        }
      }
    });

    updatedWorkoutTypes[activeDayKey] = {
      ...currentUser.custom_workout_types[activeDayKey],
      exercises: updatedExercises,
    };

    base44.auth.updateMe({ custom_workout_types: updatedWorkoutTypes }).then(() => {
      queryClient.invalidateQueries(['currentUser']);
      setEditingIndex(null);
    });
  };

  const handleCancel = () => setEditingIndex(null);

  const logWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (alreadyLoggedToday) throw new Error('You have already logged this workout today');
      const user = await base44.auth.me();
      const workout_notes = user?.workout_notes || {};
      const workoutNotes = workout_notes[todayWorkout.name] || '';
      await base44.entities.WorkoutLog.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.username || 'User',
        workout_name: todayWorkout.name,
        workout_type: todayWorkout.name,
        day_of_week: activeDayKey,
        exercises: todayWorkout.exercises,
        notes: workoutNotes,
        completed_date: new Date().toISOString().split('T')[0],
      });

      const newStreak = (currentUser.current_streak || 0) + 1;
      await base44.auth.updateMe({ current_streak: newStreak });
      let challengesData = [];
      try {
        const participants = await base44.entities.ChallengeParticipant.filter({ user_id: currentUser.id, status: 'active' });
        challengesData = await Promise.all(
          participants.map(async (p) => {
            try {
              const challenge = await base44.entities.Challenge.filter({ id: p.challenge_id });
              return {
                id: p.id,
                title: challenge[0]?.title || 'Challenge',
                target_value: p.target_value,
                current_progress: p.current_progress,
                previous_progress: Math.max(0, p.current_progress - 1),
              };
            } catch (err) { return null; }
          })
        );
        challengesData = challengesData.filter(Boolean);
      } catch (err) {}
      return { previousStreak: currentUser.current_streak || 0, newStreak, challengesData };
    },
    onSuccess: (data) => {
      setShowSummary(false);
      queryClient.invalidateQueries({ queryKey: ['workoutLog', currentUser?.id, activeDayKey] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      if (onWorkoutLogged) {
        onWorkoutLogged(
          data?.challengesData || [],
          todayWorkout?.exercises || [],
          todayWorkout?.name || '',
          lastWorkout?.exercises || []
        );
      }
    },
    onError: (error) => {
      console.error('Error logging workout:', error?.response?.data || error?.message || error);
      setShowSummary(false);
    },
  });

  const getProgressIndicator = (exercise, index) => {
    if (!lastWorkout?.exercises?.[index]) return null;
    const lastWeight = parseFloat(lastWorkout.exercises[index].weight) || 0;
    const currentWeight = parseFloat(exercise.weight) || 0;
    if (currentWeight > lastWeight) {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] font-semibold px-1.5 py-0">
          <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
          +{(currentWeight - lastWeight).toFixed(1)}
        </Badge>
      );
    } else if (currentWeight < lastWeight) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-semibold px-1.5 py-0">
          <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
          {(currentWeight - lastWeight).toFixed(1)}
        </Badge>
      );
    }
    return null;
  };

  const CollapseChevron = ({ onClick, className = '' }) => (
    <motion.button
      onClick={onClick}
      className={`flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors duration-200 p-1 ${className}`}
      animate={{ y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
      <ChevronDown className="w-5 h-5 rotate-180" />
    </motion.button>
  );

  if (!todayWorkout) {
    return (
      <Card className="bg-slate-900/70 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-4 text-center">
        <Dumbbell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-300 font-semibold text-xs">No workout split configured yet</p>
      </Card>
    );
  }

  // ── Fixed timer time display — always the same size regardless of active state ──
  const timerDisplay = (() => {
    const t = parseInt(restTimer) || 90;
    return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;
  })();

  return (
    <>
      <Card
        onClick={() => !isExpanded && setIsExpanded(true)}
        className={`relative overflow-hidden rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.35)] p-3 ${!isExpanded && 'cursor-pointer'}`}
        style={{
          background: 'linear-gradient(135deg, rgba(55,48,163,0.10) 0%, rgba(8,10,20,0.88) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(99,102,241,0.15)',
        }}>

        {/* Header */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
              <h3 className="text-[11px] font-bold text-slate-100 tracking-tight uppercase">Today's Workout</h3>
              <motion.button
                onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                className="relative text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
                whileTap={{ scale: 0.78, y: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
                <Info className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            <motion.button
              onClick={(e) => { e.stopPropagation(); if (!alreadyLoggedToday) setShowSwitcher(true); }}
              whileTap={!alreadyLoggedToday ? { scale: 0.95 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`flex-1 flex items-center justify-center gap-1 group${alreadyLoggedToday ? ' cursor-default' : ''}`}>
              <h2
                className="font-black bg-gradient-to-r from-orange-300 to-orange-200 bg-clip-text text-transparent tracking-tight leading-tight"
                style={{ fontSize: '16.5px' }}>
                {todayWorkout.name.length > 28 ? todayWorkout.name.substring(0, 28) + '…' : todayWorkout.name}
              </h2>
            </motion.button>
          </div>

          {showInfo && (
            <div className="relative z-50 bg-blue-500/10 border border-blue-400/30 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-blue-200 leading-relaxed mb-2 font-medium">
                <strong className="text-blue-100">How to use:</strong>
              </p>
              <ul className="text-[11px] text-blue-200/90 space-y-1.5 leading-relaxed">
                <li>• <strong>Expand:</strong> Tap the down arrow to view all exercises</li>
                <li>• <strong>Switch workout:</strong> Tap the workout name to swap to a different day's session</li>
                <li>• <strong>Update weight/reps:</strong> Click the pencil icon next to any exercise, enter new values, then save</li>
                <li>• <strong>Track progress:</strong> Green/red badges show weight increases/decreases vs. last workout</li>
                <li>• <strong>Rest timer:</strong> Click timer, choose duration, hit "Go" - full screen countdown between sets</li>
                <li>• <strong>Plate calculator:</strong> Use calculator icon to see which plates to load on the bar</li>
                <li>• <strong>Workout duration:</strong> Auto-starts timer when you check in. Duration displays when you log the workout</li>
                <li>• <strong>Log completion:</strong> Hit "Log Workout" when finished - see your duration summary and save progress</li>
              </ul>
            </div>
          )}
        </div>

        {/* COLLAPSED STATE */}
        {!isExpanded && (
          <div className="flex flex-col items-center gap-2 pb-1">
            {alreadyLoggedToday && (
              <Button
                onClick={(e) => { e.stopPropagation(); setSummaryLog(todayLog); }}
                size="sm"
                className="hover:bg-primary/90 inline-flex items-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white font-bold rounded-lg px-3 w-full h-7 text-[10px] justify-center border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                View Summary
              </Button>
            )}
            <motion.button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
              className="flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors duration-200 p-1"
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
              <ChevronDown className="w-5 h-5" />
            </motion.button>
          </div>
        )}

        {/* EXPANDED STATE */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ overflow: 'hidden', transformOrigin: 'top', visibility: isExpanded ? 'visible' : 'hidden' }}>
              <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">Log your lifts to track progress</p>

              {todayWorkout.exercises && todayWorkout.exercises.length > 0 ? (
                <div className="px-2 space-y-2">
                  {/* Headers */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05, duration: 0.2 }}
                    className="grid grid-cols-[1fr_44px_12px_44px_auto_auto] gap-1 mb-1.5 items-end">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Exercise</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Sets</div>
                    <div></div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Reps</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">Weight</div>
                    <div className="w-6"></div>
                  </motion.div>

                  {/* Exercise Rows */}
                  {todayWorkout.exercises.map((exercise, index) => (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={{}}
                      className="bg-white/5 pt-2 py-2 pl-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg shadow-black/10 grid grid-cols-[1fr_44px_12px_44px_auto_auto] gap-1 items-center hover:border-white/20 transition-all -ml-[2%] -mr-[2%]">
                      {editingIndex === index ? (
                        <div className="col-span-full rounded-2xl p-4" style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <button onClick={handleCancel} className="text-slate-400 hover:text-slate-200 transition-colors" />
                              <div className="text-l font-bold text-white -ml-2">{exercise.exercise}</div>
                            </div>
                            {lastWorkout?.exercises?.[index] && (
                              <div className="text-xs text-slate-400 font-medium">Last: {lastWorkout.exercises[index].weight}kg</div>
                            )}
                          </div>

                          {isDefaultSplit() ? (
                            <div className="space-y-2.5">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5 text-xs">SETS</label>
                                  <Input type="text" placeholder="3" value={editSets} disabled style={{ fontSize: '16px' }} className="bg-slate-700/30 border border-slate-600/30 text-slate-400 text-xs rounded-lg cursor-not-allowed opacity-60 w-full" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5 text-xs">REPS</label>
                                  <Input type="text" placeholder="10" value={editReps} disabled style={{ fontSize: '16px' }} className="bg-slate-700/30 border border-slate-600/30 text-slate-400 text-xs rounded-lg cursor-not-allowed opacity-60 w-full" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5 text-xs">WEIGHT</label>
                                  <Input type="text" placeholder="kg" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Sets</label>
                                  <Input type="text" placeholder="3" value={editSets} onChange={(e) => setEditSets(e.target.value)} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Reps</label>
                                  <Input type="text" placeholder="10" value={editReps} onChange={(e) => setEditReps(e.target.value)} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Weight</label>
                                  <Input type="text" placeholder="kg" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-1 mt-3">
                            <Button onClick={() => handleSave(index)} size="sm" disabled={updateWorkoutMutation.isPending} className="ease-in-out hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button onClick={handleCancel} size="sm" variant="ghost" className="ease-in-out hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 backdrop-blur-md text-slate-300 border border-transparent shadow-[0_3px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_20px_rgba(255,255,255,0.02)] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="">
                            <div className="text-sm font-bold text-white leading-tight ml-1">{exercise.exercise || '-'}</div>
                            {lastWorkout?.exercises?.[index] && (
                              <div className="text-[10px] text-slate-500 font-medium">Last: {lastWorkout.exercises[index].weight}kg</div>
                            )}
                          </div>
                          <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                            {exercise.sets || exercise.setsReps?.split('x')?.[0] || '-'}
                          </div>
                          <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
                          <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                            {exercise.reps || exercise.setsReps?.split('x')?.[1] || '-'}
                          </div>
                          <div className="flex items-center gap- ml-1">
                            <div className="flex items-center gap-2">
                              <div className="bg-gradient-to-r text-white mx-auto pb-1 pl-1 pt-1 text-sm font-black text-center opacity-100 rounded-2xl from-blue-700/90 to-blue-900/90 shadow-md shadow-blue-900/20 min-w-[55px]">
                                {exercise.weight || '-'}<span className="text-[10px] font-bold">kg</span>
                              </div>
                              {lastWorkout?.exercises?.[index] && getProgressIndicator(exercise, index)}
                            </div>
                            <motion.button
                              onClick={() => handleEdit(index, exercise)}
                              whileTap={{ scale: 0.78, y: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                              className="inline-flex items-center justify-center w-6 h-6 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-md transition-all shrink-0 ml-1 -mr-[12%]">
                              <Edit2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}

                  {/* Log Workout Button */}
                  {!alreadyLoggedToday && (
                    <div className="mb-3 space-y-2">
                      {workoutStartTime && (
                        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-[11px] text-amber-300 font-semibold">
                            {Math.floor(workoutDuration / 60)}:{(workoutDuration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                      <Button
                        onClick={() => { setFrozenDuration(workoutDuration); setShowSummary(true); }}
                        disabled={logWorkoutMutation.isPending}
                        size="sm"
                        className="hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-white px-3 w-full h-8 text-[10px] font-bold bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 backdrop-blur-md rounded-lg border border-slate-500/50 shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">
                        {logWorkoutMutation.isPending ? 'Logging...' : 'Log Workout'}
                      </Button>
                    </div>
                  )}

                  {/* View Summary — expanded state */}
                  {alreadyLoggedToday && (
                    <Button
                      onClick={() => setSummaryLog(todayLog)}
                      size="sm"
                      className="hover:bg-primary/90 inline-flex items-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white font-bold rounded-lg px-3 w-full h-7 text-[10px] justify-center border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                      View Summary
                    </Button>
                  )}

                  {/* ── Rest Timer & Tools ── */}
                  <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-between gap-3 pb-4">
                    <div className="flex-1 flex items-center gap-2">

                      {/*
                        Timer display box — fixed at height:51px always.
                        When active: shows countdown. When inactive: shows set time.
                        The dropdown for adjusting time is only shown when inactive.
                      */}
                      <div className="relative" style={{ flex: '0 0 auto', width: '49%' }}>
                        <button
                          onClick={() => { if (!isTimerActive) setShowTimerOptions(!showTimerOptions); }}
                          style={{ height: '51px' }}
                          className="relative w-full flex items-center justify-center gap-2 px-4 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 backdrop-blur-xl border border-transparent shadow-[0_3px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu overflow-hidden">
                          <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <span className="text-blue-300 font-black text-2xl tabular-nums leading-none">
                            {timerDisplay}
                          </span>
                        </button>

                        {/* Adjust dropdown — only available when timer is NOT running */}
                        {showTimerOptions && !isTimerActive && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowTimerOptions(false)} />
                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl shadow-black/20 z-50 flex items-center justify-center gap-2.5 px-2 py-2">
                              <button
                                onClick={() => { const v = parseInt(restTimer) || 90; setRestTimer(Math.max(10, v - 10)); }}
                                className="flex items-center justify-center w-14 h-10 rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu text-xl font-bold">
                                −
                              </button>
                              <button
                                onClick={() => { const v = parseInt(restTimer) || 90; setRestTimer(v + 10); }}
                                className="flex items-center justify-center w-14 h-10 rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu text-xl font-bold">
                                +
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/*
                        Go / Stop button — fixed at height:51px always.
                        Width is also locked so switching label doesn't resize it.
                      */}
                      <button
                        onClick={() => {
                          if (!isTimerActive) {
                            setShowTimerOptions(false);
                            const time = parseInt(restTimer) || 90;
                            setRestTimer(time);
                            setInitialRestTime(time);
                          }
                          setIsTimerActive(!isTimerActive);
                        }}
                        style={{ height: '51px', width: '64px', flexShrink: 0 }}
                        className="text-sm font-bold rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                        {isTimerActive ? 'Stop' : 'Go'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 mr-1">
                      <Button onClick={() => setShowCalculator(true)} size="icon" variant="ghost" className="w-6 h-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Plate Calculator">
                        <Calculator className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => setShowNotes(true)} size="icon" variant="ghost" className="w-6 h-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Notes">
                        <BookOpen className="w-3.5 h-3.5" />
                      </Button>
                      <CollapseChevron
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); }}
                        className="w-10 h-6"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* REST DAY */
                <div className="px-2">
                  <div className="p-5 bg-gradient-to-br from-green-500/10 via-slate-900/40 to-slate-950/50 rounded-lg border border-green-500/30 text-center mb-4">
                    <p className="text-green-300 text-sm font-semibold mb-1">Enjoy your rest day! 🌿</p>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">Recovery is when your muscles grow. You've worked hard—rest is part of your progress.</p>
                  </div>
                  <div className="flex justify-center mb-4">
                    <CollapseChevron
                      onClick={(e) => { e.stopPropagation(); setIsExpanded(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <PlateCalculatorModal isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
        <WorkoutNotesModal isOpen={showNotes} onClose={() => setShowNotes(false)} workoutName={todayWorkout?.name} />
        <WorkoutSummaryModal
          isOpen={showSummary}
          duration={frozenDuration * 1000}
          workoutName={todayWorkout?.name}
          exercises={todayWorkout?.exercises}
          lastWorkout={lastWorkout}
          notes={currentUser?.workout_notes?.[todayWorkout?.name] || ''}
          onConfirm={() => logWorkoutMutation.mutate()}
          onCancel={() => setShowSummary(false)}
          isLoading={logWorkoutMutation.isPending}
        />
      </Card>

      {/* Workout Summary Modal */}
      <AnimatePresence>
        {summaryLog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSummaryLog(null)}
            style={{
              position: 'fixed',
              top: '-100px',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10005,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '120px 16px 32px',
            }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-slate-900/60 backdrop-blur-md border border-slate-700/20 rounded-3xl shadow-2xl shadow-black/20 text-white p-6 max-h-[80vh] overflow-y-auto">

              <div className="mb-5 text-center">
                <h3 className="text-2xl font-black text-white mb-1">{summaryLog.workout_name || summaryLog.title || summaryLog.workout_type || 'Workout'}</h3>
                <p className="text-sm text-slate-400 font-medium">
                  {summaryLog.completed_date ? new Date(summaryLog.completed_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                </p>
              </div>

              {summaryLog.check_in_time && summaryLog.completed_date && (
                <div className="mb-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                  <p className="text-xs text-orange-300/80 font-bold uppercase tracking-wide mb-1">Total Time at Gym</p>
                  <p className="text-xl font-black text-orange-300">
                    {(() => {
                      const checkIn = new Date(summaryLog.check_in_time);
                      const checkOut = new Date(summaryLog.completed_date);
                      const diffMs = checkOut - checkIn;
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                    })()}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'Duration', value: summaryLog.duration_minutes ? `${summaryLog.duration_minutes}m` : '—' },
                  { label: 'Exercises', value: summaryLog.exercises?.length || summaryLog.exercise_count || '—' },
                  { label: 'Volume', value: summaryLog.total_volume ? `${summaryLog.total_volume}kg` : '—' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
                    <p className="text-sm font-black text-blue-300">{stat.value}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {summaryLog.exercises?.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Exercises</p>
                  <div className="grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 mb-1.5 items-end px-2 -mx-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-7">Sets</div>
                    <div />
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Reps</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2.5">Weight</div>
                  </div>
                  <div className="space-y-2 -mx-2">
                    {summaryLog.exercises.map((ex, idx) => {
                      const exName = ex.name || ex.exercise_name || ex.exercise || ex.title || `Exercise ${idx + 1}`;
                      const rawWeight = ex.weight_kg ?? ex.weight_lbs ?? ex.weight;
                      const setsRepsStr = String(ex.setsReps || ex.sets_reps || ex.set_reps || '');
                      const srParts = setsRepsStr ? setsRepsStr.split(/\s*[xX]\s*/) : [];
                      const sets = ex.sets ?? ex.set_count ?? ex.num_sets ?? srParts[0] ?? '-';
                      const reps = ex.reps ?? ex.rep_count ?? ex.num_reps ?? srParts[1] ?? '-';
                      const weight = rawWeight ?? '-';
                      return (
                        <div key={idx} className="bg-white/5 pt-2 pb-2 pl-2 rounded-xl border border-white/10 grid grid-cols-[1fr_36px_12px_36px_auto] gap-1 items-center">
                          <div className="text-sm font-bold text-white leading-tight ml-1">{exName}</div>
                          <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center ml-1" style={{ width: '36px' }}>{sets}</div>
                          <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
                          <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>{reps}</div>
                          <div className="ml-3 pr-3">
                            <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-1 pl-1 pt-1 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                              {weight}<span className="text-[10px] font-bold">kg</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {summaryLog.notes && (
                <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Notes</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{summaryLog.notes}</p>
                </div>
              )}

              {!summaryLog.exercises?.length && !summaryLog.notes && (
                <p className="text-xs text-slate-500 text-center mt-4">No additional details recorded.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WorkoutSwitcherModal
        open={showSwitcher}
        onClose={() => setShowSwitcher(false)}
        currentUser={currentUser}
        activeDayKey={activeDayKey}
        onSelect={(dayKey) => {
          setOverrideDayKey(dayKey === adjustedDay ? null : dayKey);
          setEditingIndex(null);
        }}
      />
    </>
  );
}