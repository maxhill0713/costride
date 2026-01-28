import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dumbbell, Edit2, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

  if (!todayWorkout) {
    return (
      <Card className="bg-slate-800/60 border border-slate-600/40 p-6 rounded-2xl text-center">
        <Dumbbell className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No workout split configured yet</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/60 border border-slate-600/40 p-4 rounded-2xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Today's Workout</h3>
        </div>
        <h2 className="text-sm font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          {todayWorkout.name}
        </h2>
      </div>

      {/* Exercises */}
      {todayWorkout.exercises && todayWorkout.exercises.length > 0 ? (
        <div className="space-y-2">
          {/* Headers */}
          <div className="grid grid-cols-3 gap-2 mb-1.5">
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Exercise</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Sets x Reps</div>
            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Weight</div>
          </div>

          {/* Exercise Rows */}
          {todayWorkout.exercises.map((exercise, index) => (
            <div key={index} className={`p-2 bg-slate-700/50 rounded-lg border border-slate-600/30 ${editingIndex === index ? 'block' : 'grid grid-cols-3 gap-2'}`}>
              {editingIndex === index ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-white mb-2">{exercise.exercise}</div>
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
                  <div className="text-xs font-semibold text-white">
                    {exercise.exercise || '-'}
                  </div>
                  <div className="text-sm text-slate-300">
                    {exercise.setsReps || '-'}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      {exercise.weight || '-'}
                    </span>
                    <Button
                      onClick={() => handleEdit(index, exercise)}
                      size="icon"
                      variant="ghost"
                      className="w-5 h-5 text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2 bg-slate-700/50 rounded-lg border border-slate-600/30 text-center">
          <p className="text-slate-400 text-xs">Rest day - No exercises scheduled</p>
        </div>
      )}
    </Card>
  );
}