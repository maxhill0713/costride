import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Edit2, Check, X, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Clock, Calculator, BookOpen, Info } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PlateCalculatorModal from './PlateCalculatorModal.jsx';
import WorkoutNotesModal from './WorkoutNotesModal.jsx';
import WorkoutSummaryModal from './WorkoutSummaryModal.jsx';
import WorkoutCelebration from './WorkoutCelebration.jsx';
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
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

  // Workout duration timer effect
  React.useEffect(() => {
  let interval;
  if (workoutStartTime && !showSummary) {
    interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
      const capped = Math.min(elapsed, 960); // Cap at 16 minutes (960 seconds)
      setWorkoutDuration(capped);
    }, 1000);
  }
  return () => clearInterval(interval);
  }, [workoutStartTime, showSummary]);

  // Freeze duration when summary modal opens
  React.useEffect(() => {
    if (showSummary && !frozenDuration) {
      setFrozenDuration(workoutDuration);
    }
    if (!showSummary) {
      setFrozenDuration(0);
    }
  }, [showSummary, workoutDuration, frozenDuration]);

  const startRestTimer = () => {
  const time = parseInt(restTimer) || 90;
  setRestTimer(time);
  setInitialRestTime(time);
  setIsTimerActive(true);
};

const today = useMemo(() => new Date(), []);
const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc
const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 (Mon-Sun)

// Determine today's workout
const getTodayWorkout = () => {
  if (!currentUser?.custom_workout_types) return null;

  const trainingDays = currentUser?.training_days || [];
  
  // Check if today is a training day
  if (!trainingDays.includes(adjustedDay)) {
    return { name: 'Rest Day', exercises: [] };
  }

  // Get the workout for today
  const workout = currentUser.custom_workout_types[adjustedDay];
  if (!workout) return null;

  return {
    name: workout.name || 'Training Day',
    exercises: workout.exercises || []
  };
};

const todayWorkout = getTodayWorkout();

// Fetch workout logs
const { data: previousWorkouts = [] } = useQuery({
  queryKey: ['workoutLog', currentUser?.id, adjustedDay],
  queryFn: async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const logs = await base44.entities.WorkoutLog.filter({
      user_id: currentUser.id,
      day_of_week: adjustedDay
    });
    return logs.filter(log => new Date(log.completed_date) >= oneWeekAgo);
  },
  enabled: !!currentUser?.id
});

// Get today's date for comparison
const todayDate = new Date().toISOString().split('T')[0];

// Filter out today's logs when getting last workout (for comparison)
const previousWorkoutsExcludingToday = previousWorkouts.filter(log => log.completed_date !== todayDate);
const lastWorkout = previousWorkoutsExcludingToday.length > 0 ? previousWorkoutsExcludingToday[previousWorkoutsExcludingToday.length - 1] : null;

// Check if workout already logged today
const alreadyLoggedToday = previousWorkouts.some(log => log.completed_date === todayDate);

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
  
  // Parse sets x reps (e.g., "3x10" -> 3 sets)
  const match = exercise.setsReps?.match(/(\d+)x/);
  const numSets = match ? parseInt(match[1]) : 1;
  
  // Create array for each set's weight
  const sets = Array(numSets).fill(null).map(() => ({
    weight: exercise.weight || '',
    reps: exercise.setsReps?.split('x')[1] || ''
  }));
  setEditSets(sets);
};

const handleSave = (index) => {
  // Use first set's weight, and reconstructed reps count
  const weight = editSets[0]?.weight || '';
  const repsCount = editSets.length;
  const reps = editSets[0]?.reps || '';
  const setsReps = `${repsCount}x${reps}`;

  const updatedExercises = [...todayWorkout.exercises];
  updatedExercises[index] = {
    ...updatedExercises[index],
    weight: weight,
    setsReps: setsReps
  };

  // Find all other days with the same workout name and update them too
  const updatedWorkoutTypes = { ...currentUser.custom_workout_types };
  const currentWorkoutName = todayWorkout.name;

  Object.keys(updatedWorkoutTypes).forEach(dayKey => {
    const workout = updatedWorkoutTypes[dayKey];
    if (workout.name === currentWorkoutName && parseInt(dayKey) !== adjustedDay) {
      // Update the same exercise in this duplicate day
      if (workout.exercises?.[index]?.exercise === updatedExercises[index].exercise) {
        updatedWorkoutTypes[dayKey] = {
          ...workout,
          exercises: workout.exercises.map((ex, i) => 
            i === index ? { ...ex, weight: weight, setsReps: setsReps } : ex
          )
        };
      }
    }
  });

  // Update current day
  updatedWorkoutTypes[adjustedDay] = {
    ...currentUser.custom_workout_types[adjustedDay],
    exercises: updatedExercises
  };

  // Save all changes
  base44.auth.updateMe({ custom_workout_types: updatedWorkoutTypes }).then(() => {
    queryClient.invalidateQueries(['currentUser']);
    setEditingIndex(null);
  });
};

const handleCancel = () => {
  setEditingIndex(null);
};

const logWorkoutMutation = useMutation({
  mutationFn: async () => {
    if (alreadyLoggedToday) {
      throw new Error('You have already logged this workout today');
    }
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

    // Create posts for weight increases
    if (lastWorkout?.exercises) {
      const improvements = todayWorkout.exercises
        .map((exercise, index) => {
          const lastExercise = lastWorkout.exercises[index];
          if (!lastExercise) return null;
          
          const currentWeight = parseFloat(exercise.weight) || 0;
          const lastWeight = parseFloat(lastExercise.weight) || 0;
          
          if (currentWeight > lastWeight) {
            return {
              exercise: exercise.exercise,
              increase: currentWeight - lastWeight
            };
          }
          return null;
        })
        .filter(Boolean);

      // Create a post for each improvement
      for (const improvement of improvements) {
        await base44.entities.Post.create({
          member_id: currentUser.id,
          member_name: currentUser.full_name || currentUser.username || 'User',
          member_avatar: currentUser.avatar_url || '',
          content: `${currentUser.full_name || currentUser.username || 'User'} increased their weight on ${improvement.exercise} by ${improvement.increase.toFixed(1)}kg!`,
          likes: 0,
          comments: [],
          reactions: {}
        });
      }
    }

    // Create workout completion post with nudge button
    await base44.entities.Post.create({
      member_id: currentUser.id,
      member_name: currentUser.full_name || currentUser.username || 'User',
      member_avatar: currentUser.avatar_url || '',
      content: 'Well done, workout finished! Now its time to get your friends involved!',
      likes: 0,
      comments: [],
      reactions: {},
      exercise: 'workout_completion_nudge' // Special flag for nudge posts
    });

    // Increment user's streak
    const newStreak = previousStreak + 1;
    await base44.auth.updateMe({ current_streak: newStreak });
    
    // Fetch user's active challenges and their progress
    let challengesData = [];
    try {
      const participants = await base44.entities.ChallengeParticipant.filter({
        user_id: currentUser.id,
        status: 'active'
      });
      
      challengesData = await Promise.all(
        participants.map(async (p) => {
          try {
            const challenge = await base44.entities.Challenge.filter({ id: p.challenge_id });
            return {
              id: p.id,
              title: challenge[0]?.title || 'Challenge',
              target_value: p.target_value,
              current_progress: p.current_progress,
              previous_progress: Math.max(0, p.current_progress - 1)
            };
          } catch (err) {
            console.error('Error fetching challenge:', err);
            return null;
          }
        })
      );
      challengesData = challengesData.filter(Boolean);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    }
    
    setCelebrationData({
      previousStreak,
      currentStreak: newStreak,
      challenges: challengesData
    });
    
    return { previousStreak, newStreak, challengesData };
    },
  onSuccess: () => {
     setShowSummary(false);
     setShowCelebration(true);
     queryClient.invalidateQueries({ queryKey: ['workoutLog', currentUser?.id, adjustedDay] });
     queryClient.invalidateQueries({ queryKey: ['posts'] });
     queryClient.invalidateQueries({ queryKey: ['currentUser'] });
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
    className={`bg-gradient-to-br from-slate-900/60 via-slate-900/50 to-slate-950/60 backdrop-blur-[50px] border border-white/30 rounded-2xl shadow-2xl shadow-black/30 ${isExpanded ? 'p-5' : 'p-3 cursor-pointer'}`}
  >
    <div className="space-y-2 mb-4">
       <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700/90 to-blue-900/90 flex items-center justify-center shadow-md shadow-blue-900/20">
            <Dumbbell className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-[11px] font-bold text-slate-100 tracking-tight uppercase">Today's Workout</h3>
          <button
            onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
            className="relative text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <h2 className={`font-black bg-gradient-to-r from-orange-300 to-orange-200 bg-clip-text text-transparent tracking-tight ${todayWorkout.name.length > 12 ? 'text-sm leading-6 break-words' : 'text-xl'}`}>
        {todayWorkout.name.length > 30 ? todayWorkout.name.substring(0, 30) : todayWorkout.name}
        </h2>
       </div>
      {showInfo && (
        <>
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
        </>
      )}
      {alreadyLoggedToday && !isExpanded && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            queryClient.invalidateQueries({ queryKey: ['workoutLog', currentUser?.id, adjustedDay] });
            setIsExpanded(true);
          }}
          size="sm"
          className="w-full h-6 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 rounded-lg text-white mt-3"
        >
          Log Workout
        </Button>
      )}

      </div>

    {/* Exercises - Collapsible */}
    {isExpanded && (
      <div className="text-[10px] text-slate-400 mb-2 leading-relaxed">Log your lifts to track progress</div>
    )}
    {isExpanded && todayWorkout.exercises && todayWorkout.exercises.length > 0 ? (
      <div className="space-y-2">
        {/* Headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 mb-1.5 items-end">
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center px-2">Sets x Reps</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-left pl-2.5">Weight</div>
          <div className="w-6"></div>
        </div>

        {/* Exercise Rows */}
        {todayWorkout.exercises.map((exercise, index) => (
          <div key={index} className={`p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg shadow-black/10 ${editingIndex === index ? 'block' : 'grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center'} hover:border-white/20 transition-all -ml-[5%] -mr-[5%]`}>
            {editingIndex === index ? (
              <div className="space-y-2.5">
                 <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-white">{exercise.exercise}</div>
                  {lastWorkout?.exercises?.[index] && (
                    <div className="text-xs text-slate-400 font-medium">
                      Last: {lastWorkout.exercises[index].weight}kg
                    </div>
                  )}
                 </div>
                {/* Individual Sets */}
                <div className="space-y-2">
                  {editSets.map((set, setIndex) => (
                    <div key={setIndex} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Reps - Set {setIndex + 1}</label>
                        <Input
                          type="text"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => {
                            const newSets = [...editSets];
                            newSets[setIndex].reps = e.target.value;
                            setEditSets(newSets);
                          }}
                          className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Weight</label>
                        <Input
                          type="text"
                          placeholder="Weight"
                          value={set.weight}
                          onChange={(e) => {
                            const newSets = [...editSets];
                            newSets[setIndex].weight = e.target.value;
                            setEditSets(newSets);
                          }}
                          className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleSave(index)}
                    size="sm"
                    disabled={updateWorkoutMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-600/90 hover:to-orange-700/90 h-7 shadow-md shadow-orange-500/10"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={handleCancel}
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-slate-400 hover:text-white h-7"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 ml-2">
                  <div className="text-sm font-bold text-white leading-tight">
                    {exercise.exercise || '-'}
                  </div>
                  {lastWorkout?.exercises?.[index] && (
                    <div className="text-[10px] text-slate-500 font-medium">
                      Last: {lastWorkout.exercises[index].weight}kg
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-300 bg-white/10 px-2 py-1 rounded-lg text-center min-w-[62px]">
                  {exercise.setsReps || '-'}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                      <div className="text-sm font-black text-white bg-gradient-to-r from-blue-700/90 to-blue-900/90 px-2.5 py-1 rounded-lg shadow-md shadow-blue-900/20 min-w-[65px] text-center">
                        {exercise.weight || '-'}
                        <span className="text-[10px] font-bold ml-1">kg</span>
                      </div>
                      {lastWorkout?.exercises?.[index] && getProgressIndicator(exercise, index)}
                    </div>
                  <Button
                    onClick={() => handleEdit(index, exercise)}
                    size="icon"
                    variant="ghost"
                    className="w-6 h-6 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all shrink-0 ml-auto -mr-[12%]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Log Workout Button - Only when Expanded */}
        {isExpanded && !alreadyLoggedToday && (
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
              onClick={() => {
                setShowSummary(true);
                setFrozenDuration(workoutDuration);
              }}
              disabled={logWorkoutMutation.isPending}
              size="sm"
              className="w-full h-7 text-[10px] font-bold bg-gradient-to-r from-blue-800/95 to-blue-950/95 hover:from-blue-900/95 hover:to-slate-950 shadow-lg shadow-blue-900/40 rounded-lg"
            >
              {logWorkoutMutation.isPending ? 'Logging...' : 'Log Workout'}
            </Button>
          </div>
        )}

        {/* Summary Button - Show after logged */}
        {isExpanded && alreadyLoggedToday && (
          <Button
            onClick={() => setShowSummary(true)}
            size="sm"
            className="w-full h-7 text-[10px] font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/30 rounded-lg text-white"
          >
            View Summary
          </Button>
        )}

        {/* Rest Timer & Tools */}
        <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-between gap-3">
          {/* Timer Section */}
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1">
              <button
                 onClick={() => setShowTimerOptions(!showTimerOptions)}
                 className="relative w-full flex flex-col items-center gap-1 px-5 py-2 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-blue-700/30 shadow-lg shadow-black/10 hover:border-blue-700/50 transition-all"
               >
                <span className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider">Rest Timer</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-300 font-black text-2xl tabular-nums">{restTimer || '90'}</span>
                  <span className="text-blue-300 text-sm font-bold">s</span>
                </div>

              </button>

              {/* Timer Options Dropdown */}
              {showTimerOptions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowTimerOptions(false)} />
                  <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-lg shadow-2xl shadow-black/20 z-50 flex items-center justify-center gap-4 px-4 py-2">
                    <button
                      onClick={() => {
                        const currentValue = parseInt(restTimer) || 90;
                        const newValue = Math.max(10, currentValue - 10);
                        setRestTimer(newValue);
                      }}
                      className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-700/90 to-blue-900/90 hover:from-blue-800/90 hover:to-slate-950/90 text-white text-xl font-bold transition-all active:scale-95 shadow-md shadow-blue-900/20"
                    >
                      −
                    </button>
                    <button
                      onClick={() => {
                        const currentValue = parseInt(restTimer) || 90;
                        const newValue = currentValue + 10;
                        setRestTimer(newValue);
                      }}
                      className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-blue-700/90 to-blue-900/90 hover:from-blue-800/90 hover:to-slate-950/90 text-white text-xl font-bold transition-all active:scale-95 shadow-md shadow-blue-900/20"
                    >
                      +
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => {
                 if (!isTimerActive) {
                   const time = parseInt(restTimer) || 90;
                   setRestTimer(time);
                   setInitialRestTime(time);
                 }
                 setIsTimerActive(!isTimerActive);
               }}
               className="text-sm font-bold px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-700/90 to-blue-900/90 hover:from-blue-800/90 hover:to-slate-950/90 text-white transition-all active:scale-95 shadow-md shadow-blue-900/20"
             >
              {isTimerActive ? 'Stop' : 'Go'}
            </button>
          </div>

          {/* Quick Action Icons */}
           <div className="flex items-center gap-1.5">
             <Button
               onClick={() => setShowCalculator(true)}
               size="icon"
               variant="ghost"
               className="w-6 h-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
               title="Plate Calculator"
             >
               <Calculator className="w-3.5 h-3.5" />
             </Button>
             <Button
               onClick={() => setShowNotes(true)}
               size="icon"
               variant="ghost"
               className="w-6 h-6 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
               title="Notes"
             >
               <BookOpen className="w-3.5 h-3.5" />
             </Button>
           </div>

          {/* Collapse Arrow */}
          <Button
            onClick={() => { setIsExpanded(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-slate-400 hover:text-white ml-auto"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
        </div>


        </div>
    ) : isExpanded && todayWorkout.exercises.length === 0 ? (
      <div className="p-5 bg-gradient-to-br from-green-500/10 via-slate-900/40 to-slate-950/50 rounded-lg border border-green-500/30 text-center">
        <p className="text-green-300 text-sm font-semibold mb-1">Enjoy your rest day! 🌿</p>
        <p className="text-slate-400 text-xs font-medium leading-relaxed">Recovery is when your muscles grow. You've worked hard—rest is part of your progress.</p>
        <div className="flex justify-center mt-4 pt-3 border-t border-slate-600/30">
          <Button
            onClick={() => { setIsExpanded(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-slate-400 hover:text-white"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
          </div>
      </div>
    ) : (
      <div className="flex justify-center pt-1">
      <Button
        onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
        variant="ghost"
        size="icon"
        className="w-9 h-9 text-slate-400 hover:text-white"
      >
        <ChevronDown className="w-6 h-6" />
        </Button>
      </div>
    )}

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
      isLoading={logWorkoutMutation.isPending}
    />

    {showCelebration && celebrationData && (
      <WorkoutCelebration
        previousStreak={celebrationData.previousStreak}
        currentStreak={celebrationData.currentStreak}
        challenges={celebrationData.challenges}
        onComplete={() => {
          setShowCelebration(false);
          if (onWorkoutLogged) onWorkoutLogged();
        }}
      />
    )}
    </Card>
  );
}