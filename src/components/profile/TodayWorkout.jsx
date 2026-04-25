import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Edit2, Check, X, TrendingUp, TrendingDown, ChevronDown, Clock, Calculator, BookOpen, Info, ChevronLeft, Pencil, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PlateCalculatorModal from './PlateCalculatorModal.jsx';
import WorkoutNotesModal from './WorkoutNotesModal.jsx';
import WorkoutSummaryModal from './WorkoutSummaryModal.jsx';
import HomeSummaryModal from '../home/WorkoutSummaryModal.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useTimer } from '../TimerContext';
import { recordTrainedOnRestDay, useRestDayCredit as applyRestDayCredit, hasRestDayCredit, recordRestSwap, getRestSwap, clearRestSwap, recordCreditRestDay, getCreditRestDay, clearCreditRestDay } from '../../lib/weekSwaps.js';

const DAY_NAMES_FULL = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Workout Switcher Modal ───────────────────────────────────────────────────
function WorkoutSwitcherModal({ open, onClose, currentUser, activeDayKey, adjustedDay, onSelect, restSwapActive, creditRestActive }) {
  if (!open) return null;

  const workoutTypes = currentUser?.custom_workout_types || {};
  const trainingDays = currentUser?.training_days || [];

  const activeSplitId = currentUser?.active_split_id;
  const activeSplit = (currentUser?.saved_splits || []).find((s) => s.id === activeSplitId);
  const mirroredPairs = activeSplit?.mirrored_pairs || [];
  const mirroredSecondDays = new Set();
  mirroredPairs.forEach(([dayA, dayB]) => mirroredSecondDays.add(Math.max(dayA, dayB)));

  const seenNames = new Set();
  const workoutDays = Object.entries(workoutTypes)
    .map(([dayKey, workout]) => ({
      dayKey: parseInt(dayKey),
      name: workout?.name || DAY_NAMES_FULL[parseInt(dayKey)] || `Day ${dayKey}`,
      exercises: workout?.exercises || [],
    }))
    .filter((d) => {
      if (d.exercises.length === 0) return false;
      if (mirroredSecondDays.has(d.dayKey)) return false;
      if (seenNames.has(d.name)) return false;
      seenNames.add(d.name);
      return true;
    })
    .sort((a, b) => {
      if (a.dayKey === activeDayKey) return -1;
      if (b.dayKey === activeDayKey) return 1;
      return a.dayKey - b.dayKey;
    });

  const creditAvailable = hasRestDayCredit();

  // True if today was originally a rest day but the user switched it to a workout
  const todayWasRestDayOverridden = !trainingDays.includes(adjustedDay) && activeDayKey === adjustedDay && !restSwapActive && !creditRestActive;

  const todayIsTrainingDay = trainingDays.includes(adjustedDay) && !restSwapActive;
  const futureRestDaysForSwap = (!creditAvailable && todayIsTrainingDay)
    ? [1, 2, 3, 4, 5, 6, 7].filter((d) => {
        if (trainingDays.includes(d)) return false;
        if (d <= adjustedDay) return false;
        return true;
      })
    : [];

  return (
    <>
      <div
        className="fixed z-[10005] bg-slate-950/70 backdrop-blur-sm"
        style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
        onClick={onClose} />

      <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-11/12 max-w-sm z-[10006] bg-slate-900/90 backdrop-blur-xl border border-slate-700/40 rounded-3xl shadow-2xl shadow-black/60 text-white overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-xl font-black text-white tracking-tight text-center">Switch Workout</h3>
        </div>
        <div className="px-3 pb-4 space-y-1.5 max-h-[60vh] overflow-y-auto">

          {restSwapActive && (
            <button
              onClick={() => { onSelect(adjustedDay, 'revert-rest-swap'); onClose(); }}
              className="w-full text-left rounded-2xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 px-4 py-3 flex items-center gap-3">
              <ArrowLeftRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-base font-black text-blue-300">Switch today back to a workout</p>
            </button>
          )}

          {creditRestActive && (
            <button
              onClick={() => { onSelect(adjustedDay, 'revert-credit-rest'); onClose(); }}
              className="w-full text-left rounded-2xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-200 px-4 py-3 flex items-center gap-3">
              <ArrowLeftRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-base font-black text-blue-300">Switch today back to a workout</p>
                <p className="text-xs text-blue-500/80 mt-0.5">Your rest token will be returned</p>
              </div>
            </button>
          )}

          {todayWasRestDayOverridden && (
            <button
              onClick={() => { onSelect(adjustedDay, 'revert-rest-override'); onClose(); }}
              className="w-full text-left rounded-2xl border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition-all duration-200 px-4 py-3 flex items-center gap-3">
              <ArrowLeftRight className="w-4 h-4 text-green-400 flex-shrink-0" />
              <p className="text-base font-black text-green-300">Switch back to rest day</p>
            </button>
          )}

          {!restSwapActive && !creditRestActive && creditAvailable && todayIsTrainingDay && (
            <>
              <button
                onClick={() => { onSelect(adjustedDay, 'use-credit-rest'); onClose(); }}
                className="w-full text-left rounded-2xl border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition-all duration-200 px-4 py-3 flex items-center gap-3">
                <ArrowLeftRight className="w-4 h-4 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-base font-black text-green-300">Rest Day</p>
                  <p className="text-xs text-green-500/80 mt-0.5">You earned this by training on a rest day</p>
                </div>
              </button>
              <div className="border-t border-slate-700/40 pt-1" />
            </>
          )}

          {!restSwapActive && futureRestDaysForSwap.length > 0 && (
            <>
              {futureRestDaysForSwap.map((d) => (
                <button
                  key={`swap-rest-${d}`}
                  onClick={() => { onSelect(d, 'move-to-rest'); onClose(); }}
                  className="w-full text-left rounded-2xl border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 transition-all duration-200 px-4 py-3 flex items-center gap-3">
                  <ArrowLeftRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-base font-black text-orange-300">Rest today, train on {DAY_NAMES_FULL[d]}</p>
                </button>
              ))}
              <div className="border-t border-slate-700/40 pt-1" />
            </>
          )}

          {!restSwapActive && workoutDays.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">No workouts configured yet.</p>
          )}
          {!restSwapActive && workoutDays.map((wd) => {
            const isActive = wd.dayKey === activeDayKey;
            return (
              <button
                key={wd.dayKey}
                onClick={() => { onSelect(wd.dayKey, 'workout'); onClose(); }}
                className={`w-full text-left rounded-2xl border transition-all duration-200 px-4 py-3 ${
                  isActive
                    ? 'border-blue-500/60 bg-blue-500/10'
                    : 'border-slate-700/40 bg-slate-800/50 hover:border-slate-500/60 hover:bg-slate-700/50'
                }`}>
                <p className={`text-base font-black truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {wd.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function TodayWorkout({ currentUser, workoutStartTime, onWorkoutStart, onWorkoutLogged, onOverrideDayChange, checkedInToday = false, todayCheckInTime = null }) {
  const { restTimer, setRestTimer, isTimerActive, setIsTimerActive, initialRestTime, setInitialRestTime, openTimerBar, setOpenTimerBar, setTimerWorkout } = useTimer();
  const [editingIndex, setEditingIndex] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editSets, setEditSets] = useState([]);
  const [editingCardioIndex, setEditingCardioIndex] = useState(null);
  const [editCardioRounds, setEditCardioRounds] = useState('');
  const [editCardioTime, setEditCardioTime] = useState('');
  const [editCardioRest, setEditCardioRest] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showLogConfirm, setShowLogConfirm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [frozenDuration, setFrozenDuration] = useState(0);
  const frozenDurationRef = React.useRef(0);
  const [summaryLog, setSummaryLog] = useState(null);
  const [editingGroupedSet, setEditingGroupedSet] = useState(null);
  const [showMissingData, setShowMissingData] = useState(false);

  const [overrideDayKey, setOverrideDayKey] = useState(() => {
    try {
      const stored = localStorage.getItem('workoutOverrideDay');
      const storedDate = localStorage.getItem('workoutOverrideDayDate');
      const todayStr = new Date().toISOString().split('T')[0];
      if (stored && storedDate === todayStr) return parseInt(stored);
      return null;
    } catch {
      return null;
    }
  });

  const [restSwapActive, setRestSwapActive] = useState(() => {
    const swap = getRestSwap();
    if (!swap) return false;
    const today = new Date();
    const dow = today.getDay();
    const todayNum = dow === 0 ? 7 : dow;
    return swap.fromDay === todayNum;
  });

  useEffect(() => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      if (overrideDayKey === null) {
        localStorage.removeItem('workoutOverrideDay');
        localStorage.removeItem('workoutOverrideDayDate');
      } else {
        localStorage.setItem('workoutOverrideDay', String(overrideDayKey));
        localStorage.setItem('workoutOverrideDayDate', todayStr);
      }
    } catch {}
  }, [overrideDayKey]);

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
    if (!showSummary) {
      setFrozenDuration(0);
    }
  }, [showSummary]);

  const today = useMemo(() => new Date(), []);
  const dayOfWeek = today.getDay();
  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  const activeDayKey = overrideDayKey !== null ? overrideDayKey : adjustedDay;

  const [creditRestActive, setCreditRestActive] = useState(() => {
    return getCreditRestDay() === (new Date().getDay() === 0 ? 7 : new Date().getDay());
  });

  const getTodayWorkout = () => {
    if (!currentUser?.custom_workout_types) return null;

    if (restSwapActive) {
      return { name: 'Rest Day', exercises: [], cardio: [] };
    }

    if (creditRestActive) {
      return { name: 'Rest Day', exercises: [], cardio: [] };
    }

    if (overrideDayKey !== null) {
      const workout = currentUser.custom_workout_types[overrideDayKey];
      if (!workout) return null;
      return {
        name: workout.name || 'Training Day',
        exercises: workout.exercises || [],
        cardio: workout.cardio || []
      };
    }

    // If today is the "toDay" of a rest swap, show the workout from "fromDay"
    const restSwapData = getRestSwap();
    if (restSwapData && restSwapData.toDay === adjustedDay) {
      const workout = currentUser.custom_workout_types[restSwapData.fromDay];
      if (workout) {
        return {
          name: workout.name || 'Training Day',
          exercises: workout.exercises || [],
          cardio: workout.cardio || []
        };
      }
    }

    const trainingDays = currentUser?.training_days || [];
    if (!trainingDays.includes(adjustedDay)) {
      return { name: 'Rest Day', exercises: [], cardio: [] };
    }
    const workout = currentUser.custom_workout_types[adjustedDay];
    if (!workout) return null;
    return {
      name: workout.name || 'Training Day',
      exercises: workout.exercises || [],
      cardio: workout.cardio || []
    };
  };

  const todayWorkout = getTodayWorkout();

  React.useEffect(() => {
    if (todayWorkout) setTimerWorkout(todayWorkout);
  }, [JSON.stringify(todayWorkout)]);

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
        day_of_week: activeDayKey
      });
      return logs.filter((log) => new Date(log.completed_date) >= oneWeekAgo);
    },
    enabled: !!currentUser?.id
  });

  const todayDate = new Date().toISOString().split('T')[0];
  const previousWorkoutsExcludingToday = previousWorkouts.filter((log) => log.completed_date !== todayDate);
  const lastWorkout = previousWorkoutsExcludingToday.length > 0 ?
  previousWorkoutsExcludingToday[previousWorkoutsExcludingToday.length - 1] :
  null;
  const todayLog = previousWorkouts.find((log) => log.completed_date === todayDate);
  const alreadyLoggedToday = !!todayLog;

  const updateWorkoutMutation = useMutation({
    mutationFn: async (updatedExercises) => {
      const updatedWorkout = {
        ...currentUser.custom_workout_types,
        [activeDayKey]: {
          ...currentUser.custom_workout_types[activeDayKey],
          exercises: updatedExercises
        }
      };
      await base44.auth.updateMe({ custom_workout_types: updatedWorkout });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setEditingIndex(null);
    }
  });

  const handleEdit = (index, exercise) => {
    setEditingGroupedSet(null);
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
            )
          };
        }
      }
    });

    updatedWorkoutTypes[activeDayKey] = {
      ...currentUser.custom_workout_types[activeDayKey],
      exercises: updatedExercises
    };

    base44.auth.updateMe({ custom_workout_types: updatedWorkoutTypes }).then(() => {
      queryClient.invalidateQueries(['currentUser']);
      setEditingIndex(null);
    });
  };

  const handleCancel = () => setEditingIndex(null);

  const handleEditGroupedSet = (index, exercise, setLabel) => {
    setEditingIndex(null);
    setEditingGroupedSet({ index, setLabel });
    setEditWeight(exercise.weight || '');
    setEditReps(exercise.reps || exercise.setsReps?.split('x')?.[1] || '');
  };

  const handleSaveGroupedSet = () => {
    if (!editingGroupedSet) return;
    const { index } = editingGroupedSet;
    const currentExercise = todayWorkout.exercises[index];
    const weight = editWeight || currentExercise.weight;
    const reps = editReps || currentExercise.reps || currentExercise.setsReps?.split('x')?.[1];
    const sets = '1';
    const setsReps = `${sets}x${reps}`;

    const updatedExercises = [...todayWorkout.exercises];
    updatedExercises[index] = { ...updatedExercises[index], weight, setsReps, sets: '1', reps };

    const updatedWorkoutTypes = { ...currentUser.custom_workout_types };
    const currentWorkoutName = todayWorkout.name;

    Object.keys(updatedWorkoutTypes).forEach((dayKey) => {
      const workout = updatedWorkoutTypes[dayKey];
      if (workout.name === currentWorkoutName && parseInt(dayKey) !== activeDayKey) {
        if (workout.exercises?.[index]?.exercise === currentExercise.exercise) {
          updatedWorkoutTypes[dayKey] = {
            ...workout,
            exercises: workout.exercises.map((ex, i) =>
            i === index ? { ...ex, weight, setsReps, sets: '1', reps } : ex
            )
          };
        }
      }
    });

    updatedWorkoutTypes[activeDayKey] = {
      ...currentUser.custom_workout_types[activeDayKey],
      exercises: updatedExercises
    };

    base44.auth.updateMe({ custom_workout_types: updatedWorkoutTypes }).then(() => {
      queryClient.invalidateQueries(['currentUser']);
      setEditingGroupedSet(null);
    });
  };

  const formatTime = (raw) => {
    const digits = (raw || '').replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';
    const padded = digits.padStart(3, '0');
    const mins = parseInt(padded.slice(0, padded.length - 2), 10);
    const secs = Math.min(parseInt(padded.slice(-2), 10), 59);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const sanitiseTimeInput = (raw) => {
    const digits = (raw || '').replace(/\D/g, '').slice(0, 4);
    if (!digits) return '';
    const padded = digits.padStart(3, '0');
    const mins = parseInt(padded.slice(0, padded.length - 2), 10);
    const secs = Math.min(parseInt(padded.slice(-2), 10), 59);
    const clamped = `${mins}${String(secs).padStart(2, '0')}`;
    return clamped.replace(/^0+/, '') || '0';
  };

  const handleEditCardio = (index, c) => {
    setEditingCardioIndex(index);
    setEditCardioRounds(c.rounds || '1');
    setEditCardioTime(c.time || '');
    setEditCardioRest(c.rest || '');
  };

  const handleSaveCardio = (index) => {
    const updatedCardio = [...(todayWorkout.cardio || [])];
    updatedCardio[index] = { ...updatedCardio[index], rounds: editCardioRounds, time: editCardioTime, rest: editCardioRest };
    const updatedWorkoutTypes = {
      ...currentUser.custom_workout_types,
      [activeDayKey]: {
        ...currentUser.custom_workout_types[activeDayKey],
        cardio: updatedCardio
      }
    };
    base44.auth.updateMe({ custom_workout_types: updatedWorkoutTypes }).then(() => {
      queryClient.invalidateQueries(['currentUser']);
      setEditingCardioIndex(null);
    });
  };

  const logWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (alreadyLoggedToday) throw new Error('You have already logged this workout today');
      const user = await base44.auth.me();
      const workout_notes = user?.workout_notes || {};
      const workoutNotes = workout_notes[todayWorkout.name] || '';

      const totalVolume = (todayWorkout.exercises || []).reduce((sum, ex) => {
        const sets = parseFloat(ex.sets || ex.setsReps?.split('x')?.[0]) || 0;
        const reps = parseFloat(ex.reps || ex.setsReps?.split('x')?.[1]) || 0;
        const weight = parseFloat(ex.weight) || 0;
        return sum + sets * reps * weight;
      }, 0);

      let durationSecs = frozenDurationRef.current > 0 ? frozenDurationRef.current : workoutDuration;
      if (!durationSecs && todayCheckInTime) {
        durationSecs = Math.round((Date.now() - todayCheckInTime) / 1000);
      }
      if (!durationSecs && currentUser?.id) {
        try {
          const recentCIs = await base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 5);
          const todayCI = recentCIs.find((c) => {
            const d = new Date(c.check_in_date);
            const now2 = new Date();
            return d.getFullYear() === now2.getFullYear() && d.getMonth() === now2.getMonth() && d.getDate() === now2.getDate();
          });
          if (todayCI) durationSecs = Math.round((Date.now() - new Date(todayCI.check_in_date).getTime()) / 1000);
        } catch {}
      }
      const durationMins = durationSecs > 0 ? Math.round(durationSecs / 60) : undefined;

      const normalisedExercises = (todayWorkout.exercises || []).map((ex) => {
        const setsRepsStr = String(ex.setsReps || '');
        const srParts = /[xX×]/.test(setsRepsStr) ? setsRepsStr.split(/[xX×]/) : [];
        const sets = String(ex.sets || srParts[0] || '');
        const reps = String(ex.reps || srParts[1] || '');
        return { ...ex, sets, reps, setsReps: sets && reps ? `${sets}x${reps}` : ex.setsReps || null };
      });

      await base44.entities.WorkoutLog.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.username || 'User',
        workout_name: todayWorkout.name,
        workout_type: todayWorkout.name,
        day_of_week: activeDayKey,
        exercises: normalisedExercises,
        cardio: todayWorkout.cardio || [],
        notes: workoutNotes,
        completed_date: new Date().toISOString().split('T')[0],
        duration_minutes: durationMins,
        total_volume: totalVolume > 0 ? Math.round(totalVolume) : undefined
      });

      const newStreak = (currentUser.current_streak || 0) + 1;

      const nowDate = new Date();
      const currentMonth = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
      const logDayOfWeek = nowDate.getDay();
      const isWeekend = logDayOfWeek === 0 || logDayOfWeek === 6;
      const prevProgress = currentUser.monthly_challenge_progress || {};
      const isNewMonth = prevProgress.month !== currentMonth;

      const newMonthlyProgress = {
        month: currentMonth,
        streak_master: Math.min(7, newStreak),
        discipline_builder: isNewMonth ? 1 : (prevProgress.discipline_builder || 0) + 1,
        weekend_warrior: isNewMonth ?
        isWeekend ? 1 : 0 :
        (prevProgress.weekend_warrior || 0) + (isWeekend ? 1 : 0)
      };

      await base44.auth.updateMe({ current_streak: newStreak, monthly_challenge_progress: newMonthlyProgress });

      const MONTHLY_CHALLENGE_DEFS = [
      { id: 'streak_master', title: 'Streak Master', progressKey: 'streak_master', target: 7, emoji: '🏅', description: 'Maintain your gym streak for 7 consecutive days', reward: '🏅 Streak Master Badge' },
      { id: 'discipline_builder', title: 'Discipline Builder', progressKey: 'discipline_builder', target: 15, emoji: '💪', description: 'Log 15 workouts this month', reward: '💪 Discipline Builder Badge' },
      { id: 'weekend_warrior', title: 'Weekend Warrior', progressKey: 'weekend_warrior', target: 5, emoji: '⚔️', description: 'Log your workout on Saturday or Sunday 5 times!', reward: '⚔️ Weekend Warrior Badge' }];

      const challengesData = MONTHLY_CHALLENGE_DEFS.
      map((def) => {
        const prevVal = isNewMonth ? 0 : prevProgress[def.progressKey] || 0;
        const newVal = newMonthlyProgress[def.progressKey] || 0;
        if (newVal > prevVal) {
          return { id: def.id, title: def.title, emoji: def.emoji, description: def.description, reward: def.reward, target_value: def.target, previous_value: prevVal, new_value: newVal };
        }
        return null;
      }).
      filter(Boolean);

      const weekendWarriorJustCompleted = challengesData.some(
        (c) => c.id === 'weekend_warrior' && c.new_value >= c.target_value && c.previous_value < c.target_value
      );
      if (weekendWarriorJustCompleted) {
        const currentFreezes = user.streak_freezes ?? 3;
        await base44.auth.updateMe({ streak_freezes: currentFreezes + 2 });
      }

      return { previousStreak: currentUser.current_streak || 0, newStreak, challengesData, weekendWarriorJustCompleted };
    },
    onSuccess: (data) => {
      const todayTrainingDays = currentUser?.training_days || [];
      if (!todayTrainingDays.includes(adjustedDay)) {
        recordTrainedOnRestDay(adjustedDay);
      }
      setShowSummary(false);
      setIsExpanded(false);
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
    onError: () => {
      setShowSummary(false);
    }
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
        </Badge>);
    } else if (currentWeight < lastWeight) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-semibold px-1.5 py-0">
          <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
          {(currentWeight - lastWeight).toFixed(1)}
        </Badge>);
    }
    return null;
  };

  const CollapseChevron = ({ onClick, className = '' }) =>
  <motion.button
    onClick={onClick}
    className={`flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors duration-200 p-1 ${className}`}
    animate={{ y: [0, -4, 0] }}
    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
      <ChevronDown className="w-5 h-5 rotate-180" />
    </motion.button>;

  if (!todayWorkout) {
    return (
      <Card className="bg-slate-900/70 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-4 text-center">
        <Dumbbell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-300 font-semibold text-xs">No workout split configured yet</p>
      </Card>);
  }

  const exerciseGridCols = alreadyLoggedToday ?
  '1fr 44px 12px 44px auto' :
  '1fr 44px 12px 44px auto auto';

  const cardioGridCols = alreadyLoggedToday ?
  '1fr 44px 12px 44px 44px' :
  '1fr 44px 12px 44px 44px auto';

  const infoBullets = [
  { label: 'Check in', text: "You must be physically at your gym for the check-in button to appear — tap it at the very start of your session to begin your timer and unlock workout logging." },
  { label: 'Expand', text: "Tap the down arrow to view all exercises for today's session." },
  { label: 'Switch workout', text: "Tap the workout name to swap to a different day's session." },
  { label: 'Update weight/reps', text: 'Click the pencil icon next to any exercise, enter new values, then save.' },
  { label: 'Timer', text: 'Tap Workout Timer to open the rest/cardio timer.' },
  { label: 'Plate calculator', text: 'Use the calculator icon to see which plates to load on the bar.' },
  { label: 'Log completion', text: 'Hit "Log Workout" when finished to save your progress and update your streak.' }];

  const buildExerciseGroups = (exercises) => {
    const groups = [];
    const nameToGroupIdx = {};
    (exercises || []).forEach((exercise, index) => {
      const key = (exercise.exercise || '').trim().toLowerCase();
      if (!key) {
        groups.push({ key: `__empty_${index}`, name: exercise.exercise || '', items: [{ exercise, index }] });
        return;
      }
      if (nameToGroupIdx[key] === undefined) {
        nameToGroupIdx[key] = groups.length;
        groups.push({ key, name: exercise.exercise, items: [{ exercise, index }] });
      } else {
        groups[nameToGroupIdx[key]].items.push({ exercise, index });
      }
    });
    return groups;
  };

  return (
    <>
      <Card
        onClick={() => !isExpanded && setIsExpanded(true)}
        className={`relative overflow-hidden rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.35)] p-3 ${!isExpanded && 'cursor-pointer'}`}
        style={{
          background: 'linear-gradient(135deg, rgba(20,24,48,0.94) 0%, rgba(8,10,22,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)'
        }}>

        <div className="absolute inset-x-0 top-0 h-px pointer-events-none z-10" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
        <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: 'radial-gradient(ellipse at 25% 35%, rgba(99,102,241,0.12) 0%, transparent 60%)' }} />

        {/* Header */}
        <div className="space-y-2 mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
              <h3 className="text-[13px] font-bold text-slate-100 tracking-tight uppercase">TODAY'S WORKOUT</h3>
              <motion.button
                onClick={(e) => {e.stopPropagation();setShowInfo(!showInfo);}}
                whileTap={{ scale: 0.78, y: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  cursor: 'pointer',
                  color: showInfo ? '#60a5fa' : '#475569',
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s'
                }}>
                <Info size={15} />
              </motion.button>
            </div>

            <motion.button
              onClick={(e) => {e.stopPropagation();if (!alreadyLoggedToday) setShowSwitcher(true);}}
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

          {/* Info Box */}
          <AnimatePresence>
            {showInfo &&
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 26, mass: 1.1, opacity: { duration: 0.2 } }}
              style={{ overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}>
              
                <div style={{
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(96,165,250,0.07) 0%, rgba(52,211,153,0.04) 100%)',
                border: '1px solid rgba(96,165,250,0.16)',
                borderRadius: 10,
                padding: '10px 13px',
                overflow: 'hidden'
              }}>
                  <div style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.35), transparent)'
                }} />
                  <p style={{
                  fontSize: 11, fontWeight: 700, color: '#93c5fd',
                  margin: '0 0 7px', letterSpacing: '0.02em'
                }}>
                    How to use
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {infoBullets.map(({ label, text }) =>
                  <li key={label} style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                        <span style={{ color: '#475569', fontSize: 11, lineHeight: 1.55, flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.55, fontWeight: 500 }}>
                          <span style={{ color: '#93c5fd', fontWeight: 700 }}>{label}:</span>{' '}{text}
                        </span>
                      </li>
                  )}
                  </ul>
                </div>
              </motion.div>
            }
          </AnimatePresence>
        </div>

        {/* COLLAPSED STATE */}
        <AnimatePresence initial={false}>
          {!isExpanded &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-2 pb-1">
            
              {alreadyLoggedToday &&
            <Button
              onClick={(e) => {e.stopPropagation();setSummaryLog(todayLog);}}
              size="sm"
              className="hover:bg-primary/90 inline-flex items-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white font-bold rounded-lg px-3 w-full h-7 text-[10px] justify-center border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                  View Summary
                </Button>
            }
              <motion.button
              onClick={(e) => {e.stopPropagation();setIsExpanded(true);}}
              className="flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors duration-200 p-1"
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
                <ChevronDown className="w-5 h-5" />
              </motion.button>
            </motion.div>
          }
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded &&
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 26,
              mass: 1.1,
              opacity: { duration: 0.2 }
            }}
            style={{ overflow: 'hidden', transformOrigin: 'top' }}>
            
              <motion.div
              initial={{ y: -12 }}
              animate={{ y: 0 }}
              exit={{ y: -12 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 26,
                mass: 1.1
              }}>
              

              {todayWorkout.exercises && todayWorkout.exercises.length > 0 ?
              <div className="px-2 space-y-2">

                  {/* ── Column headers ── */}
                  <div
                  className="grid gap-1 mb-1.5 items-end"
                  style={{ gridTemplateColumns: exerciseGridCols }}>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Exercise</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-5">Sets</div>
                    <div></div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-5">Reps</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">Weight</div>
                    {!alreadyLoggedToday && <div className="w-6" />}
                  </div>

                  {/* Exercise groups */}
                  {buildExerciseGroups(todayWorkout.exercises).map((group) => {
                  const isGrouped = group.items.length > 1;

                  if (!isGrouped) {
                    const { exercise, index } = group.items[0];
                    const isEditing = editingIndex === index;
                    return (
                      <motion.div
                        key={group.key}
                        initial={false}
                        animate={{}}
                        className="bg-white/5 pt-1 py-1 pl-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg shadow-black/10 grid gap-1 items-center hover:border-white/20 transition-all -ml-[2%] -mr-[2%]"
                        style={{ gridTemplateColumns: isEditing ? '1fr' : exerciseGridCols }}>
                          {isEditing ?
                        <div className="col-span-full rounded-2xl p-4" style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <button onClick={handleCancel} className="text-slate-400 hover:text-slate-200 transition-colors" />
                                  <div className="text-l font-bold text-white -ml-2">{exercise.exercise}</div>
                                </div>
                              </div>

                              {isDefaultSplit() ?
                          <div className="space-y-2.5">
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5 text-xs">SETS</label>
                                      <Input type="text" inputMode="numeric" placeholder="3" maxLength={2} value={editSets} onChange={(e) => setEditSets(e.target.value.replace(/\D/g, '').slice(0, 2))} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5 text-xs">REPS</label>
                                      <Input type="text" inputMode="numeric" placeholder="10" maxLength={3} value={editReps} onChange={(e) => setEditReps(e.target.value.replace(/\D/g, '').slice(0, 3))} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5 text-xs">WEIGHT</label>
                                      <Input type="text" inputMode="decimal" placeholder="kg" maxLength={6} value={editWeight} onChange={(e) => {const v = e.target.value.replace(/[^\d.]/g, '');const parts = v.split('.');const sanitised = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : v;setEditWeight(sanitised.slice(0, 6));}} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                    </div>
                                  </div>
                                </div> :

                          <div className="space-y-2.5">
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Sets</label>
                                      <Input type="text" inputMode="numeric" placeholder="3" maxLength={2} value={editSets} onChange={(e) => setEditSets(e.target.value.replace(/\D/g, '').slice(0, 2))} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Reps</label>
                                      <Input type="text" inputMode="numeric" placeholder="10" maxLength={3} value={editReps} onChange={(e) => setEditReps(e.target.value.replace(/\D/g, '').slice(0, 3))} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                    </div>
                                    <div className="flex-1">
                                      <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Weight</label>
                                      <Input type="text" inputMode="decimal" placeholder="kg" maxLength={6} value={editWeight} onChange={(e) => {const v = e.target.value.replace(/[^\d.]/g, '');const parts = v.split('.');const sanitised = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : v;setEditWeight(sanitised.slice(0, 6));}} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                    </div>
                                  </div>
                                </div>
                          }

                              <div className="flex gap-1 mt-3">
                                <Button onClick={() => handleSave(index)} size="sm" disabled={updateWorkoutMutation.isPending} className="ease-in-out hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button onClick={handleCancel} size="sm" variant="ghost" className="ease-in-out hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 backdrop-blur-md text-slate-300 border border-transparent shadow-[0_3px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_0_20px_rgba(255,255,255,0.02)] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div> :

                        <>
                              <div className="">
                                <div className="text-sm font-bold text-white leading-tight ml-1">{exercise.exercise || '-'}</div>
                              </div>
                              <div className="bg-white/10 text-slate-300 py-0.5 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                                {exercise.sets || exercise.setsReps?.split('x')?.[0] || '-'}
                              </div>
                              <div className="text-slate-400 text-xs font-bold flex items-center justify-center -ml-2">×</div>
                              <div className="bg-white/10 text-slate-300 py-0.5 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                                {exercise.reps || exercise.setsReps?.split('x')?.[1] || '-'}
                              </div>
                              <div className="flex items-center gap- ml-1 mr-2">
                                <div className="flex items-center gap-2">
                                  <div className="bg-gradient-to-r text-white mx-auto pb-0.5 pl-1 pt-0.5 text-sm font-black text-center opacity-100 rounded-2xl from-blue-700/90 to-blue-900/90 shadow-md shadow-blue-900/20 min-w-[55px]">
                                    {exercise.weight || '-'}<span className="text-[10px] font-bold">kg</span>
                                  </div>
                                </div>
                                {!alreadyLoggedToday &&
                            <motion.button
                              onClick={() => handleEdit(index, exercise)}
                              whileTap={{ scale: 0.78, y: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                              className="inline-flex items-center justify-center w-6 h-6 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-md transition-all shrink-0 ml-1 -mr-[12%]">
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </motion.button>
                            }
                              </div>
                            </>
                        }
                        </motion.div>);
                  }

                  const sorted = [...group.items].sort(
                    (a, b) => (parseFloat(b.exercise.weight) || 0) - (parseFloat(a.exercise.weight) || 0)
                  );

                  return (
                    <motion.div
                      key={group.key}
                      initial={false}
                      animate={{}}
                      className="bg-white/5 pt-1 pb-1 pl-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg shadow-black/10 hover:border-white/20 transition-all -ml-[2%] -mr-[2%]">

                        {sorted.map(({ exercise, index }, setIdx) => {
                        const setLabel = `Set ${setIdx + 1}`;
                        const isEditingThis = editingGroupedSet?.index === index;

                        if (isEditingThis) {
                          return (
                            <div key={index} className="rounded-2xl p-4 mr-2 mb-1" style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="text-sm font-bold text-white">{group.name}</div>
                                  <div className="inline-flex items-center justify-center px-3 py-0.5 rounded-lg bg-white/10 border border-white/10 text-[12px] font-black text-slate-200">
                                    {setLabel}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Reps</label>
                                    <Input type="text" inputMode="numeric" placeholder="10" maxLength={3} value={editReps} onChange={(e) => setEditReps(e.target.value.replace(/\D/g, '').slice(0, 3))} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Weight</label>
                                    <Input type="text" inputMode="decimal" placeholder="kg" maxLength={6} value={editWeight} onChange={(e) => {const v = e.target.value.replace(/[^\d.]/g, '');const parts = v.split('.');const sanitised = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : v;setEditWeight(sanitised.slice(0, 6));}} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                  </div>
                                </div>
                                <div className="flex gap-1 mt-3">
                                  <Button onClick={handleSaveGroupedSet} size="sm" className="ease-in-out hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button onClick={() => setEditingGroupedSet(null)} size="sm" variant="ghost" className="ease-in-out hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 text-slate-300 border border-transparent shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>);
                        }

                        return (
                          <div key={index} className="grid gap-1 items-center pr-2 mb-1" style={{ gridTemplateColumns: exerciseGridCols }}>
                              <div className="ml-1">
                                {setIdx === 0 ?
                              <div className="text-sm font-bold text-white leading-tight">{group.name}</div> :

                              <div />
                              }
                              </div>
                              <div className="bg-white/10 text-slate-300 py-0.5 text-[11px] font-bold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                                {setLabel}
                              </div>
                              <div className="text-slate-400 text-xs font-bold flex items-center justify-center -ml-2">×</div>
                              <div className="bg-white/10 text-slate-300 py-0.5 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                                {exercise.reps || exercise.setsReps?.split('x')?.[1] || '-'}
                              </div>
                              <div className="flex items-center gap-1 ml-1">
                                <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white pb-0.5 pl-1 pt-0.5 text-sm font-black text-center rounded-2xl shadow-md shadow-blue-900/20 min-w-[55px]">
                                  {exercise.weight || '-'}<span className="text-[10px] font-bold">kg</span>
                                </div>
                              </div>
                              {!alreadyLoggedToday &&
                            <motion.button
                              onClick={() => handleEditGroupedSet(index, exercise, setLabel)}
                              whileTap={{ scale: 0.78, y: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                              className="inline-flex items-center justify-center w-6 h-6 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-md transition-all shrink-0">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </motion.button>
                            }
                            </div>);
                      })}
                      </motion.div>);
                })}

                  {/* Cardio Rows */}
                  {todayWorkout.cardio && todayWorkout.cardio.length > 0 &&
                <div className="mt-3">
                      <div
                    className="grid gap-1 mb-1.5 items-end px-1"
                    style={{ gridTemplateColumns: cardioGridCols }}>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-16">Rounds</div>
                        <div />
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-14">Time/Round</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center -ml-9">Rest</div>
                      </div>

                      {todayWorkout.cardio.map((c, index) =>
                  <motion.div
                    key={`cardio-${index}`}
                    className="bg-white/5 pt-2 py-2 pl-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg shadow-black/10 items-center hover:border-white/20 transition-all -ml-[2%] -mr-[2%] mb-2"
                    style={{ display: editingCardioIndex === index ? 'block' : 'grid', gridTemplateColumns: cardioGridCols, gap: '4px' }}>
                          {editingCardioIndex === index ?
                    <div className="col-span-full rounded-2xl p-4" style={{ background: 'rgba(15,20,40,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="text-sm font-bold text-white mb-3">{c.exercise || 'Cardio'}</div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Rounds</label>
                                  <Input type="text" inputMode="numeric" maxLength={2} value={editCardioRounds} onChange={(e) => setEditCardioRounds(e.target.value.replace(/\D/g, '').slice(0, 2))} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Time/Round</label>
                                  <Input type="text" inputMode="numeric" value={formatTime(editCardioTime)} onChange={(e) => setEditCardioTime(sanitiseTimeInput(e.target.value))} placeholder="0:00" style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full" />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1.5">Rest</label>
                                  <Input type="text" inputMode="numeric" value={formatTime(editCardioRest)} onChange={(e) => setEditCardioRest(sanitiseTimeInput(e.target.value))} placeholder="0:00" disabled={parseInt(editCardioRounds) <= 1} style={{ fontSize: '16px' }} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50 w-full disabled:opacity-40" />
                                </div>
                              </div>
                              <div className="flex gap-1 mt-3">
                                <Button onClick={() => handleSaveCardio(index)} size="sm" className="ease-in-out inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button onClick={() => setEditingCardioIndex(null)} size="sm" variant="ghost" className="ease-in-out inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 text-slate-300 border border-transparent shadow-[0_3px_0_0_#0f172a] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div> :
                    <>
                              <div className="text-sm font-bold text-white leading-tight ml-1">{c.exercise || '—'}</div>
                              <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center -ml-5" style={{ width: '36px' }}>
                                {c.rounds || '—'}
                              </div>
                              <div />
                              <div className="bg-gradient-to-r from-blue-700/90 to-blue-900/90 text-white py-2 text-xs font-black text-center rounded-2xl flex items-center justify-center shadow-md shadow-blue-900/20 -ml-2">
                                {c.time ? formatTime(c.time) : '—'}
                              </div>
                              <div className="bg-white/10 text-slate-300 py-1.5 text-sm font-semibold text-center rounded-lg flex items-center justify-center" style={{ width: '36px' }}>
                                {parseInt(c.rounds) > 1 && c.rest ? formatTime(c.rest) : '—'}
                              </div>
                              {!alreadyLoggedToday &&
                      <motion.button
                        onClick={() => handleEditCardio(index, c)}
                        whileTap={{ scale: 0.78, y: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                        className="inline-flex items-center justify-center w-8 h-6 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-md transition-all shrink-0 ml-1 -mr-[12%]">
                                <Edit2 className="lucide lucide-pen w-4 h-3.5 -ml-6" />
                              </motion.button>
                      }
                            </>
                    }
                        </motion.div>
                  )}
                    </div>
                }

                  {/* Log Workout Button */}
                  {!alreadyLoggedToday && checkedInToday &&
                <div className="mb-3 space-y-2">
                      {workoutStartTime &&
                  <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-[11px] text-amber-300 font-semibold">
                            {Math.floor(workoutDuration / 60)}:{(workoutDuration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                  }
                      <Button
                    onClick={() => {
                      const hasMissing = (todayWorkout.exercises || []).some(ex => {
                        const sets = ex.sets || ex.setsReps?.split('x')?.[0];
                        const reps = ex.reps || ex.setsReps?.split('x')?.[1];
                        const weight = ex.weight;
                        return !sets || !reps || !weight;
                      });
                      if (hasMissing) { setShowMissingData(true); return; }
                      setIsExpanded(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      const captured = workoutDuration;
                      frozenDurationRef.current = captured;
                      setFrozenDuration(captured);
                      logWorkoutMutation.mutate();
                    }}
                    disabled={logWorkoutMutation.isPending}
                    size="sm"
                    className="hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-white px-3 w-full h-8 text-[10px] font-bold bg-gradient-to-b from-blue-700 via-blue-800 to-blue-900 backdrop-blur-md rounded-lg border border-slate-500/50 shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transform-gpu">
                        {logWorkoutMutation.isPending ? 'Logging...' : 'Log Workout'}
                      </Button>
                    </div>
                }

                  {/* View Summary */}
                  {alreadyLoggedToday &&
                <Button
                  onClick={() => setSummaryLog(todayLog)}
                  size="sm"
                  className="hover:bg-primary/90 inline-flex items-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white font-bold rounded-lg px-3 w-full h-7 text-[10px] justify-center border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                      View Summary
                    </Button>
                }

                  {/* Timer & Tools */}
                  <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-between gap-3 pb-4">
                    <div className="flex-1 flex items-center gap-2">
                      {/* CHANGED: Label updated to "Workout Timer", flex increased slightly to 0.78 */}
                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTimerBar(true);
                      }}
                      style={{ height: '41px', flex: 0.78 }}
                      className="relative flex items-center justify-center gap-1.5 px-3 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 backdrop-blur-xl border border-transparent shadow-[0_3px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                        <Clock className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="text-blue-300 font-black text-[13px] leading-none tracking-tight">
                          Workout Timer
                        </span>
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
                      onClick={(e) => {e.stopPropagation();setIsExpanded(false);setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);}}
                      className="w-10 h-6" />
                    </div>
                  </div>
                </div> : (

              /* REST DAY or EMPTY SPLIT */
              <div className="px-2">
              {(() => {
                  const trainingDays = currentUser?.training_days || [];
                  const restSwapForCard = getRestSwap();
                  const isSwapTargetDay = restSwapForCard && restSwapForCard.toDay === adjustedDay;
                  const isTrainingDay = overrideDayKey !== null || trainingDays.includes(adjustedDay) || isSwapTargetDay;
                  const hasNoExercises = (!todayWorkout.exercises || todayWorkout.exercises.length === 0) && (!todayWorkout.cardio || todayWorkout.cardio.length === 0);
                  const isEmptySplit = isTrainingDay && hasNoExercises && todayWorkout.name !== 'Rest Day';

                  if (isEmptySplit) {
                    return (
                      <div className="p-5 bg-gradient-to-br from-blue-500/10 via-slate-900/40 to-slate-950/50 rounded-lg border border-blue-500/20 text-center mb-4">
                      <p className="text-slate-200 text-sm font-bold mb-1">No exercises set for today</p>
                      <p className="text-slate-400 text-xs font-medium leading-relaxed mb-4">You don't have a workout routine set for today. Edit your custom split and add some exercises.</p>
                      <Link
                          to="/Profile?editSplit=true"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white
                          bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700
                          border border-transparent
                          shadow-[0_3px_0_0_#1a3fa8,0_6px_16px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]
                          active:shadow-none active:translate-y-[3px] active:scale-95
                          transition-all duration-100 transform-gpu">
                        <Pencil className="w-4 h-4" />
                        Edit Split
                      </Link>
                    </div>);
                  }

                  return (
                    <div className="p-5 bg-gradient-to-br from-green-500/10 via-slate-900/40 to-slate-950/50 rounded-lg border border-green-500/30 text-center mb-4">
                    <p className="text-green-300 text-sm font-semibold mb-1">Enjoy your rest day! 🌿</p>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">Recovery is when your muscles grow. You've worked hard—rest is part of your progress.</p>
                  </div>);
                })()}
              <div className="flex justify-center mb-4">
                <CollapseChevron
                    onClick={(e) => {e.stopPropagation();setIsExpanded(false);setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);}} />
              </div>
            </div>)
              }

              </motion.div>
            </motion.div>
          }
        </AnimatePresence>

        <PlateCalculatorModal isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
        <WorkoutNotesModal isOpen={showNotes} onClose={() => setShowNotes(false)} workoutName={todayWorkout?.name} />
        <WorkoutSummaryModal
          isOpen={showSummary}
          duration={frozenDurationRef.current * 1000}
          workoutName={todayWorkout?.name}
          exercises={todayWorkout?.exercises}
          lastWorkout={lastWorkout}
          notes={currentUser?.workout_notes?.[todayWorkout?.name] || ''}
          onConfirm={() => {setShowSummary(false);logWorkoutMutation.mutate();}}
          onCancel={() => setShowSummary(false)}
          isLoading={logWorkoutMutation.isPending} />
      </Card>

      <HomeSummaryModal summaryLog={summaryLog} onClose={() => setSummaryLog(null)} currentStreak={currentUser?.current_streak} />

      {/* Missing data popup */}
      {showMissingData && (
        <div
          className="fixed inset-0 z-[10010] flex items-center justify-center"
          onClick={() => setShowMissingData(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative mx-6 max-w-xs w-full rounded-3xl text-center px-6 py-7 shadow-2xl shadow-black/60"
            style={{ background: 'linear-gradient(135deg, rgba(30,35,60,0.98) 0%, rgba(8,10,22,0.99) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-3xl mb-3">⚠️</div>
            <p className="text-white font-black text-base leading-snug tracking-tight">
              You've missed some data, fill it in and log your workout!
            </p>
            <p className="text-slate-500 text-xs mt-3">Tap anywhere to dismiss</p>
          </div>
        </div>
      )}

      <WorkoutSwitcherModal
        open={showSwitcher}
        onClose={() => setShowSwitcher(false)}
        currentUser={currentUser}
        activeDayKey={activeDayKey}
        adjustedDay={adjustedDay}
        restSwapActive={restSwapActive}
        creditRestActive={creditRestActive}
        onSelect={(dayKey, mode) => {
          if (mode === 'revert-credit-rest') {
            clearCreditRestDay();
            setCreditRestActive(false);
            setOverrideDayKey(null);
            setEditingIndex(null);
            onOverrideDayChange?.(null);
            window.dispatchEvent(new Event('weekSwapChanged'));
          } else if (mode === 'use-credit-rest') {
            recordCreditRestDay(adjustedDay);
            setCreditRestActive(true);
            setOverrideDayKey(null);
            setEditingIndex(null);
            onOverrideDayChange?.(null);
            window.dispatchEvent(new Event('weekSwapChanged'));
          } else if (mode === 'rest-to-training') {
            applyRestDayCredit(dayKey);
            window.dispatchEvent(new Event('weekSwapChanged'));
          } else if (mode === 'move-to-rest') {
            recordRestSwap(adjustedDay, dayKey);
            setRestSwapActive(true);
            setOverrideDayKey(null);
            setEditingIndex(null);
            onOverrideDayChange?.(null);
            window.dispatchEvent(new Event('weekSwapChanged'));
          } else if (mode === 'revert-rest-swap') {
            clearRestSwap();
            setRestSwapActive(false);
            setOverrideDayKey(null);
            setEditingIndex(null);
            onOverrideDayChange?.(null);
            window.dispatchEvent(new Event('weekSwapChanged'));
          } else if (mode === 'revert-rest-override') {
            setOverrideDayKey(null);
            setEditingIndex(null);
            onOverrideDayChange?.(null);
            window.dispatchEvent(new Event('weekSwapChanged'));
          } else {
            const newOverride = dayKey === adjustedDay ? null : dayKey;
            setOverrideDayKey(newOverride);
            setEditingIndex(null);
            onOverrideDayChange?.(newOverride);
            window.dispatchEvent(new Event('weekSwapChanged'));
          }
        }} />
    </>);
}