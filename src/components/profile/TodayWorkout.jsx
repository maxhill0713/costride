import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Edit2, Check, X, TrendingUp, TrendingDown, ChevronDown, Clock, Calculator, BookOpen, Info } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PlateCalculatorModal from './PlateCalculatorModal.jsx';
import WorkoutNotesModal from './WorkoutNotesModal.jsx';
import WorkoutSummaryModal from './WorkoutSummaryModal.jsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

import { useTimer } from '../TimerContext';

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
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [frozenDuration, setFrozenDuration] = useState(0);
  const queryClient = useQueryClient();

  const timerPresets = [
    { label: '10s', value: 10 },
    { label: '30s', value: 30 },
    { label: '45s', value: 45 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
    { label: '5m', value: 300 },
    { label: '10m', value: 600 }
  ];

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

  const getTodayWorkout = () => {
    if (!currentUser?.custom_workout_types) return null;
    const trainingDays = currentUser?.training_days || [];
    if (!trainingDays.includes(adjustedDay)) {
      return { name: 'Rest Day', exercises: [] };
    }
    const workout = currentUser.custom_workout_types[adjustedDay];
    if (!workout) return null;
    return {
      name: workout.name || 'Training Day',
      exercises: workout.exercises || []
    };
  };

  const todayWorkout = getTodayWorkout();

  const { data: previousWorkouts = [] } = useQuery({
    queryKey: ['workoutLog', currentUser?.id, adjustedDay],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const logs = await base44.entities.WorkoutLog.filter({
        user_id: currentUser.id,
        day_of_week: adjustedDay
      });
      return logs.filter((log) => new Date(log.completed_date) >= oneWeekAgo);
    },
    enabled: !!currentUser?.id
  });

  const todayDate = new Date().toISOString().split('T')[0];
  const previousWorkoutsExcludingToday = previousWorkouts.filter((log) => log.completed_date !== todayDate);
  const lastWorkout = previousWorkoutsExcludingToday.length > 0 ? previousWorkoutsExcludingToday[previousWorkoutsExcludingToday.length - 1] : null;
  const alreadyLoggedToday = previousWorkouts.some((log) => log.completed_date === todayDate);

  const updateWorkoutMutation = useMutation({
    mutationFn: async (updatedExercises) => {
      const updatedWorkout = {
        ...currentUser.custom_workout_types,
        [adjustedDay]: {
          ...currentUser.custom_workout_types[adjustedDay],
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
    setEditingIndex(index);
    setEditReps(exercise.setsReps || '');
    setEditWeight(exercise.weight || '');
    setEditSets([]);
  };

  const handleSave = (index) => {
    const weight = editWeight;
    const setsReps = editReps;
    const updatedExercises = [...todayWorkout.exercises];
    updatedExercises[index] = { ...updatedExercises[index], weight, setsReps };
    const updatedWorkoutTypes = { ...currentUser.custom_workout_types };
    const currentWorkoutName = todayWorkout.name;
    Object.keys(updatedWorkoutTypes).forEach((dayKey) => {
      const workout = updatedWorkoutTypes[dayKey];
      if (workout.name === currentWorkoutName && parseInt(dayKey) !== adjustedDay) {
        if (workout.exercises?.[index]?.exercise === updatedExercises[index].exercise) {
          updatedWorkoutTypes[dayKey] = {
            ...workout,
            exercises: workout.exercises.map((ex, i) =>
              i === index ? { ...ex, weight, setsReps } : ex
            )
          };
        }
      }
    });
    updatedWorkoutTypes[adjustedDay] = {
      ...currentUser.custom_workout_types[adjustedDay],
      exercises: updatedExercises
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
      const previousStreak = currentUser.current_streak || 0;
      await base44.entities.WorkoutLog.create({
        user_id: currentUser.id,
        user_name: currentUser.full_name || currentUser.username || 'User',
        workout_name: todayWorkout.name,
        workout_type: todayWorkout.name,
        day_of_week: adjustedDay,
        exercises: todayWorkout.exercises,
        notes: workoutNotes,
        completed_date: new Date().toISOString().split('T')[0]
      });

      const newStreak = (currentUser.current_streak || 0) + 1;
      await base44.auth.updateMe({ current_streak: newStreak });
      let challengesData = [];
      try {
        const participants = await base44.entities.ChallengeParticipant.filter({ user_id: currentUser.id, status: 'active' });
        challengesData = await Promise.all(participants.map(async (p) => {
          try {
            const challenge = await base44.entities.Challenge.filter({ id: p.challenge_id });
            return { id: p.id, title: challenge[0]?.title || 'Challenge', target_value: p.target_value, current_progress: p.current_progress, previous_progress: Math.max(0, p.current_progress - 1) };
          } catch (err) { return null; }
        }));
        challengesData = challengesData.filter(Boolean);
      } catch (err) {}
      return { previousStreak: currentUser.current_streak || 0, newStreak, challengesData };
    },
    onSuccess: (data) => {
      setShowSummary(false);
      queryClient.invalidateQueries({ queryKey: ['workoutLog', currentUser?.id, adjustedDay] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      if (onWorkoutLogged) onWorkoutLogged(data?.challengesData || [], todayWorkout?.exercises || [], todayWorkout?.name || '');
    },
    onError: (error) => {
      console.error('Error logging workout:', error?.response?.data || error?.message || error);
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

  if (!todayWorkout) {
    return (
      <Card className="bg-slate-900/70 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-4 text-center">
        <Dumbbell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-300 font-semibold text-xs">No workout split configured yet</p>
      </Card>
    );
  }

  return (
    <Card
      onClick={() => !isExpanded && setIsExpanded(true)}
      className={`relative overflow-hidden rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.35)] p-3 ${!isExpanded && 'cursor-pointer'}`}
      style={{
        background: 'linear-gradient(135deg, rgba(55,48,163,0.10) 0%, rgba(8,10,20,0.88) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(99,102,241,0.15)'
      }}>

      {/* Header — always visible, never moves */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
            <h3 className="text-[11px] font-bold text-slate-100 tracking-tight uppercase">Today's Workout</h3>
            <button
              onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
              className="relative text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0">
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <h2 className="flex-1 text-center font-black bg-gradient-to-r from-orange-300 to-orange-200 bg-clip-text text-transparent tracking-tight" style={{ fontSize: '16.5px' }}>
            {todayWorkout.name.length > 30 ? todayWorkout.name.substring(0, 30) : todayWorkout.name}
          </h2>
        </div>

        {showInfo &&
          <div className="relative z-50 bg-blue-500/10 border border-blue-400/30 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs text-blue-200 leading-relaxed mb-2 font-medium">
              <strong className="text-blue-100">How to use:</strong>
            </p>
            <ul className="text-[11px] text-blue-200/90 space-y-1.5 leading-relaxed">
              <li>• <strong>Expand:</strong> Tap the down arrow to view all exercises</li>
              <li>• <strong>Update weight/reps:</strong> Click the pencil icon next to any exercise, enter new values, then save</li>
              <li>• <strong>Track progress:</strong> Green/red badges show weight increases/decreases vs. last workout</li>
              <li>• <strong>Rest timer:</strong> Click timer, choose duration, hit "Go" - full screen countdown between sets</li>
              <li>• <strong>Plate calculator:</strong> Use calculator icon to see which plates to load on the bar</li>
              <li>• <strong>Workout duration:</strong> Auto-starts timer when you check in. Duration displays when you log the workout</li>
              <li>• <strong>Log completion:</strong> Hit "Log Workout" when finished - see your duration summary and save progress</li>
            </ul>
          </div>
        }
      </div>

      {/* COLLAPSED STATE */}
      {!isExpanded && (
        <div className="flex flex-col items-center gap-2 pb-1">
          {alreadyLoggedToday && (
            <Button
              onClick={(e) => { e.stopPropagation(); setShowSummary(true); }}
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
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Sets</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center"></div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Reps</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-left pl-2.5">Weight</div>
                <div className="w-6"></div>
              </motion.div>

              {/* Exercise Rows */}
              {todayWorkout.exercises.map((exercise, index) =>
               <motion.div
                 key={index}
                 initial={false}
                 animate={{}}
                 className="bg-white/5 pt-2 py-2 pl-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg shadow-black/10 grid grid-cols-[1fr_44px_12px_44px_auto_auto] gap-1 items-center hover:border-white/20 transition-all -ml-[2%] -mr-[2%]">
                  {editingIndex === index ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold text-white">{exercise.exercise}</div>
                        {lastWorkout?.exercises?.[index] &&
                          <div className="text-xs text-slate-400 font-medium">Last: {lastWorkout.exercises[index].weight}kg</div>
                        }
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Sets x Reps</label>
                          <Input type="text" placeholder="e.g. 3x10" value={editReps} onChange={(e) => setEditReps(e.target.value)} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50" />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Weight</label>
                          <Input type="text" placeholder="kg" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50" />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button onClick={() => handleSave(index)} size="sm" disabled={updateWorkoutMutation.isPending} className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-md px-3 text-xs flex-1 h-7 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#c2410c,0_8px_20px_rgba(194,65,12,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 duration-100 transform-gpu">
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button onClick={handleCancel} size="sm" variant="ghost" className="flex-1 text-slate-400 hover:text-white h-7">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1 ml-2">
                         <div className="text-sm font-bold text-white leading-tight -ml-1">{exercise.exercise || '-'}</div>
                         {lastWorkout?.exercises?.[index] &&
                           <div className="text-[10px] text-slate-500 font-medium">Last: {lastWorkout.exercises[index].weight}kg</div>
                         }
                       </div>
                       <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center w-full">
                         {exercise.sets || exercise.setsReps?.split('x')?.[0] || '-'}
                       </div>
                       <div className="text-slate-400 text-xs font-bold flex items-center justify-center">×</div>
                       <div className="bg-white/10 text-slate-300 py-1 text-sm font-semibold text-center rounded-lg flex items-center justify-center w-full">
                         {exercise.reps || exercise.setsReps?.split('x')?.[1] || '-'}
                       </div>
                      <div className="flex items-center gap- ml-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-r text-white mx-auto pb-1 pl-1 pt-1 text-sm font-black text-center opacity-100 rounded-2xl from-blue-700/90 to-blue-900/90 shadow-md shadow-blue-900/20 min-w-[55px]">
                            {exercise.weight || '-'}<span className="text-[10px] font-bold">kg</span>
                          </div>
                          {lastWorkout?.exercises?.[index] && getProgressIndicator(exercise, index)}
                        </div>
                        <Button onClick={() => handleEdit(index, exercise)} size="icon" variant="ghost" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 w-6 h-6 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all shrink-0 ml-1 -mr-[12%]">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

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
                    onClick={() => { setFrozenDuration(workoutDuration); logWorkoutMutation.mutate(); }}
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
                  onClick={() => setShowSummary(true)}
                  size="sm"
                  className="hover:bg-primary/90 inline-flex items-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white font-bold rounded-lg px-3 w-full h-7 text-[10px] justify-center border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu">
                  View Summary
                </Button>
              )}

              {/* Rest Timer & Tools */}
              <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-between gap-3 pb-4">
                <div className="flex-1 flex items-center gap-2">
                  <div className="relative" style={{ flex: '0 0 auto', width: '49%' }}>
                    <button
                      onClick={() => setShowTimerOptions(!showTimerOptions)}
                      className="relative w-full flex items-center justify-center gap-2 px-4 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 backdrop-blur-xl border border-transparent shadow-[0_3px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:from-slate-600 hover:via-slate-700 hover:to-slate-800 active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu overflow-hidden"
                      style={{ height: '51px' }}>
                      <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <span className="text-blue-300 font-black text-2xl tabular-nums leading-none">
                        {(() => { const t = parseInt(restTimer) || 90; return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`; })()}
                      </span>
                    </button>
                    {showTimerOptions && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowTimerOptions(false)} />
                        <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl shadow-black/20 z-50 flex items-center justify-center gap-2.5 px-2 py-2">
                          <button onClick={() => { const v = parseInt(restTimer) || 90; setRestTimer(Math.max(10, v - 10)); }} className="flex items-center justify-center w-14 h-10 rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu text-xl font-bold">−</button>
                          <button onClick={() => { const v = parseInt(restTimer) || 90; setRestTimer(v + 10); }} className="flex items-center justify-center w-14 h-10 rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu text-xl font-bold">+</button>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (!isTimerActive) { const time = parseInt(restTimer) || 90; setRestTimer(time); setInitialRestTime(time); }
                      setIsTimerActive(!isTimerActive);
                    }}
                    className="text-sm font-bold px-5 rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu flex-shrink-0"
                    style={{ height: '51px' }}>
                    {isTimerActive ? 'Stop' : 'Go'}
                  </button>
                </div>
                {/* Tools — calculator & notes shifted left, chevron wider hit area */}
                <div className="flex items-center gap-2.5 mr-1">
                  <Button onClick={() => setShowCalculator(true)} size="icon" variant="ghost" className="w-6 h-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Plate Calculator">
                    <Calculator className="w-3.5 h-3.5" />
                  </Button>
                  <Button onClick={() => setShowNotes(true)} size="icon" variant="ghost" className="w-6 h-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Notes">
                    <BookOpen className="w-3.5 h-3.5" />
                  </Button>
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center justify-center w-10 h-6 text-slate-500 hover:text-slate-300 transition-colors duration-200"
                    whileTap={{ scale: 0.8 }}>
                    <motion.div
                      animate={{ rotate: 180 }}
                      initial={{ rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-gradient-to-br from-green-500/10 via-slate-900/40 to-slate-950/50 rounded-lg border border-green-500/30 text-center mb-8">
              <p className="text-green-300 text-sm font-semibold mb-1">Enjoy your rest day! 🌿</p>
              <p className="text-slate-400 text-xs font-medium leading-relaxed">Recovery is when your muscles grow. You've worked hard—rest is part of your progress.</p>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
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
        isLoading={logWorkoutMutation.isPending} />

    </Card>
  );
}