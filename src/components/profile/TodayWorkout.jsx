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

export default function TodayWorkout({ currentUser }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editSets, setEditSets] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [restTimer, setRestTimer] = useState('');
  const [initialRestTime, setInitialRestTime] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
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

  // Rest timer effect
  React.useEffect(() => {
    let interval;
    if (isTimerActive && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(t => t - 1);
      }, 1000);
    } else if (restTimer === 0 && isTimerActive) {
      setIsTimerActive(false);
      // Vibrate and play sound when timer completes
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      // Play beep sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
      audio.play().catch(() => {});
    }
    return () => clearInterval(interval);
  }, [isTimerActive, restTimer]);

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
      
      await base44.entities.WorkoutLog.create({
        user_id: currentUser.id,
        workout_name: todayWorkout.name,
        day_of_week: adjustedDay,
        exercises: todayWorkout.exercises,
        notes: workoutNotes,
        completed_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workoutLog']);
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
    <Card className={`bg-gradient-to-br from-slate-900/50 via-slate-900/40 to-slate-950/50 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl shadow-black/30 ${isExpanded ? 'p-5' : 'p-3'}`}>
      <div className={isExpanded ? "space-y-3 mb-4" : "space-y-2"}>
         <div className={`flex items-center justify-between ${isExpanded ? 'gap-3' : 'gap-2'}`}>
          <div className="flex items-center gap-2">
            <div className={`rounded-lg bg-gradient-to-br from-orange-400/90 to-orange-500/90 flex items-center justify-center shadow-md shadow-orange-500/10 ${isExpanded ? 'w-8 h-8' : 'w-7 h-7'}`}>
              <Dumbbell className={isExpanded ? 'w-4 h-4 text-white' : 'w-3.5 h-3.5 text-white'} />
            </div>
            <h3 className={`font-bold text-slate-100 tracking-tight uppercase ${isExpanded ? 'text-xs' : 'text-[11px]'}`}>Today's Workout</h3>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="relative text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <h2 className={`font-black bg-gradient-to-r from-orange-300 to-orange-200 bg-clip-text text-transparent tracking-tight ${isExpanded ? 'text-lg' : 'text-base'}`}>
          {todayWorkout.name}
          </h2>
         </div>
        {showInfo && (
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
            <p className="text-xs text-blue-200 leading-relaxed mb-2 font-medium">
              <strong className="text-blue-100">How to use:</strong>
            </p>
            <ul className="text-[11px] text-blue-200/90 space-y-1.5 leading-relaxed">
              <li>• <strong>Expand:</strong> Tap the down arrow to view all exercises</li>
              <li>• <strong>Update weight/reps:</strong> Click the pencil icon next to any exercise, enter new values, then save</li>
              <li>• <strong>Track progress:</strong> Green/red badges show weight increases/decreases vs. last workout</li>
              <li>• <strong>Rest timer:</strong> Click timer, choose duration, hit "Go" - full screen countdown between sets</li>
              <li>• <strong>Plate calculator:</strong> Use calculator icon to see which plates to load on the bar</li>
              <li>• <strong>Log completion:</strong> Hit "Log Workout" when finished to save progress and maintain your streak</li>
            </ul>
          </div>
        )}
        {alreadyLoggedToday ? (
          <div className="flex items-center justify-center gap-1.5 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">Logged</span>
          </div>
        ) : (
          <>
            {lastWorkout && (
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-medium">
                  Last: {new Date(lastWorkout.completed_date).toLocaleDateString()}
                </p>
                <Button
                  onClick={() => logWorkoutMutation.mutate()}
                  disabled={logWorkoutMutation.isPending}
                  size="sm"
                  className="h-7 text-[10px] font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-3 shadow-lg shadow-orange-500/30 rounded-lg"
                >
                  Log Workout
                </Button>
              </div>
            )}
            {!lastWorkout && todayWorkout.exercises.length > 0 && (
              <Button
                onClick={() => logWorkoutMutation.mutate()}
                disabled={logWorkoutMutation.isPending}
                size="sm"
                className="h-7 text-[10px] font-bold w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 rounded-lg"
              >
                Log Workout
              </Button>
            )}
          </>
        )}
      </div>

      {/* Exercises - Collapsible */}
      {isExpanded && (
        <div className="text-[10px] text-slate-400 mb-3 leading-relaxed">Log your lifts to track progress</div>
      )}
      {isExpanded && todayWorkout.exercises && todayWorkout.exercises.length > 0 ? (
        <div className="space-y-2">
          {/* Headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 mb-1.5">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sets x Reps</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Weight</div>
          </div>

          {/* Exercise Rows */}
          {todayWorkout.exercises.map((exercise, index) => (
            <div key={index} className={`p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg shadow-black/10 ${editingIndex === index ? 'block' : 'grid grid-cols-[1fr_auto_auto] gap-2 items-center'} hover:border-white/20 transition-all`}>
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
                          <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Set {setIndex + 1}</label>
                          <Input
                            type="text"
                            placeholder="Weight (kg)"
                            value={set.weight}
                            onChange={(e) => {
                              const newSets = [...editSets];
                              newSets[setIndex].weight = e.target.value;
                              setEditSets(newSets);
                            }}
                            className="bg-slate-700/60 border border-slate-600/60 text-white text-xs rounded-lg focus:ring-1 focus:ring-orange-500/50"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Reps</label>
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
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-bold text-white leading-tight">
                      {exercise.exercise || '-'}
                    </div>
                    {lastWorkout?.exercises?.[index] && (
                      <div className="text-[10px] text-slate-500 font-medium">
                        Last: {lastWorkout.exercises[index].weight}kg
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-300 bg-white/10 px-2 py-1 rounded-lg">
                    {exercise.setsReps || '-'}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="flex items-center gap-2">
                        <div className="text-sm font-black text-white bg-gradient-to-r from-orange-500/80 to-orange-600/80 px-2.5 py-1 rounded-lg shadow-md shadow-orange-500/10">
                          {exercise.weight || '-'}
                          <span className="text-[10px] font-bold ml-1">kg</span>
                        </div>
                        {lastWorkout?.exercises?.[index] && getProgressIndicator(exercise, index)}
                      </div>
                    <Button
                      onClick={() => handleEdit(index, exercise)}
                      size="icon"
                      variant="ghost"
                      className="w-6 h-6 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Rest Timer & Tools */}
          <div className="mt-4 pt-3 border-t border-slate-600/30 flex items-center justify-between gap-3">
            {/* Timer Section */}
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1">
                <button
                  onClick={() => setShowTimerOptions(!showTimerOptions)}
                  className="relative w-full flex flex-col items-center gap-1 px-5 py-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-orange-400/20 shadow-lg shadow-black/10 hover:border-orange-400/30 transition-all"
                >
                  <span className="text-[10px] font-bold text-orange-400/70 uppercase tracking-wider">Rest Timer</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-300 font-black text-2xl tabular-nums">{restTimer || '90'}</span>
                    <span className="text-orange-300 text-sm font-bold">s</span>
                  </div>
                  {isTimerActive && (
                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-orange-400 border-r-orange-400 animate-spin" style={{ width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', left: '-2px', top: '-2px' }} />
                  )}
                </button>

                {/* Timer Options Dropdown */}
                {showTimerOptions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTimerOptions(false)} />
                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl shadow-black/20 p-2 z-50">
                      <div className="grid grid-cols-3 gap-1.5">
                        {timerPresets.map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => {
                              setRestTimer(preset.value);
                              setShowTimerOptions(false);
                            }}
                            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-orange-500/10 text-slate-300 hover:text-orange-400 text-xs font-bold transition-all active:scale-95 border border-white/10 hover:border-orange-500/30"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
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
                className="text-sm font-bold px-6 py-4 rounded-2xl bg-gradient-to-r from-orange-500/90 to-orange-600/90 hover:from-orange-600/90 hover:to-orange-700/90 text-white transition-all active:scale-95 shadow-md shadow-orange-500/10"
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
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-slate-400 hover:text-white ml-auto"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>

          {/* Full Screen Timer Overlay */}
          {isTimerActive && (
            <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center">
              <div className="text-center space-y-8">
                {/* Progress Ring */}
                <div className="relative w-64 h-64 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-slate-700"
                    />
                    <circle
                      cx="128"
                      cy="128"
                      r="120"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 120}`}
                      strokeDashoffset={`${2 * Math.PI * 120 * (1 - restTimer / initialRestTime)}`}
                      className="text-orange-400 transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-7xl font-black text-orange-400 tabular-nums">
                      {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
                <p className="text-xl text-slate-300 font-semibold">Rest Time</p>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setIsTimerActive(false)}
                    className="px-8 py-6 text-lg font-bold bg-orange-500 hover:bg-orange-600"
                  >
                    Stop Timer
                  </Button>
                  <Button
                    onClick={() => setRestTimer(t => t + 30)}
                    variant="outline"
                    className="px-8 py-6 text-lg font-bold border-orange-500 text-orange-400"
                  >
                    +30s
                  </Button>
                </div>
              </div>
            </div>
          )}
          </div>
      ) : isExpanded && todayWorkout.exercises.length === 0 ? (
        <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/30 text-center">
          <p className="text-slate-300 text-xs font-medium">Rest day - No exercises scheduled</p>
          <div className="flex justify-center mt-3 pt-2 border-t border-slate-600/30">
            <Button
              onClick={() => setIsExpanded(false)}
              variant="ghost"
              size="icon"
              className="w-6 h-6 text-slate-400 hover:text-white"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center pt-1">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-slate-400 hover:text-white"
        >
          <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Modals */}
      <PlateCalculatorModal isOpen={showCalculator} onClose={() => setShowCalculator(false)} />
      <WorkoutNotesModal isOpen={showNotes} onClose={() => setShowNotes(false)} workoutName={todayWorkout?.name} />
      </Card>
      );
      }