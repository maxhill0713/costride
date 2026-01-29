import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Edit2, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TodayWorkout({ currentUser }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');
  const queryClient = useQueryClient();

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

  // Fetch last week's workout log
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

  const lastWorkout = previousWorkouts.length > 0 ? previousWorkouts[previousWorkouts.length - 1] : null;
  
  // Check if workout already logged today
  const todayDate = new Date().toISOString().split('T')[0];
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
    setEditWeight(exercise.weight || '');
    setEditReps(exercise.setsReps || '');
  };

  const handleSave = (index) => {
    const updatedExercises = [...todayWorkout.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      weight: editWeight,
      setsReps: editReps
    };
    updateWorkoutMutation.mutate(updatedExercises);
  };

  const handleCancel = () => {
    setEditingIndex(null);
  };

  const logWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (alreadyLoggedToday) {
        throw new Error('You have already logged this workout today');
      }
      await base44.entities.WorkoutLog.create({
        user_id: currentUser.id,
        workout_name: todayWorkout.name,
        day_of_week: adjustedDay,
        exercises: todayWorkout.exercises,
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
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-semibold px-2 py-0.5">
          <TrendingUp className="w-3 h-3 mr-0.5" />
          +{(currentWeight - lastWeight).toFixed(1)}
        </Badge>
      );
    } else if (currentWeight < lastWeight) {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs font-semibold px-2 py-0.5">
          <TrendingDown className="w-3 h-3 mr-0.5" />
          {(currentWeight - lastWeight).toFixed(1)}
        </Badge>
      );
    }
    return null;
  };

  if (!todayWorkout) {
    return (
      <Card className="bg-slate-800/60 border border-slate-600/40 p-6 rounded-2xl text-center">
        <Dumbbell className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-300 font-semibold text-sm">No workout split configured yet</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/30 backdrop-blur-xl border border-slate-600/20 shadow-2xl shadow-slate-900/50 p-5 rounded-2xl">
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Dumbbell className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 tracking-tight">Today's Workout</h3>
          </div>
          <h2 className="text-base font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent tracking-tight">
            {todayWorkout.name}
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">Log your lifts to track progress</p>
        {alreadyLoggedToday ? (
          <div className="text-center py-1.5">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs font-semibold px-3 py-1">
              ✓ Logged Today
            </Badge>
          </div>
        ) : (
          <>
            {lastWorkout && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">
                  Last: {new Date(lastWorkout.completed_date).toLocaleDateString()}
                </p>
                <Button
                  onClick={() => logWorkoutMutation.mutate()}
                  disabled={logWorkoutMutation.isPending}
                  size="sm"
                  className="h-7 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700"
                >
                  Log Completed
                </Button>
              </div>
            )}
            {!lastWorkout && todayWorkout.exercises.length > 0 && (
              <Button
                onClick={() => logWorkoutMutation.mutate()}
                disabled={logWorkoutMutation.isPending}
                size="sm"
                className="h-7 text-xs font-semibold w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Log Completed
              </Button>
            )}
          </>
        )}
      </div>

      {/* Exercises */}
      {todayWorkout.exercises && todayWorkout.exercises.length > 0 ? (
        <div className="space-y-2.5">
          {/* Headers */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 mb-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exercise</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sets x Reps</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight</div>
          </div>

          {/* Exercise Rows */}
          {todayWorkout.exercises.map((exercise, index) => (
            <div key={index} className={`p-3 bg-slate-700/50 rounded-lg border border-slate-600/30 ${editingIndex === index ? 'block' : 'grid grid-cols-[1fr_auto_auto] gap-3 items-center'}`}>
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
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Sets x Reps"
                      value={editReps}
                      onChange={(e) => setEditReps(e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white text-xs flex-1"
                    />
                    <Input
                      type="text"
                      placeholder="Weight"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="bg-slate-600 border-slate-500 text-white text-xs flex-1"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => handleSave(index)}
                      size="sm"
                      disabled={updateWorkoutMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 h-7"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-slate-300 h-7"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-semibold text-white leading-tight">
                      {exercise.exercise || '-'}
                    </div>
                    {lastWorkout?.exercises?.[index] && (
                      <div className="text-xs text-slate-400 font-medium">
                        Last: {lastWorkout.exercises[index].weight}kg
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-200">
                    {exercise.setsReps || '-'}
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">
                        {exercise.weight || '-'}
                      </span>
                      {getProgressIndicator(exercise, index)}
                    </div>
                    <Button
                      onClick={() => handleEdit(index, exercise)}
                      size="icon"
                      variant="ghost"
                      className="w-6 h-6 text-slate-400 hover:text-white shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/30 text-center">
          <p className="text-slate-300 text-sm font-medium">Rest day - No exercises scheduled</p>
        </div>
      )}
    </Card>
  );
}