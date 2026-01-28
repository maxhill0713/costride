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
    <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-indigo-300" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Today's Workout</h3>
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent ml-10">
          {todayWorkout.name}
        </h2>
      </div>

      {/* Exercises */}
      {todayWorkout.exercises && todayWorkout.exercises.length > 0 ? (
        <div className="space-y-3">
          {/* Headers */}
          <div className="grid grid-cols-3 gap-3 px-3 py-2 bg-slate-700/30 rounded-lg mb-2">
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Exercise</div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sets × Reps</div>
            <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Weight</div>
          </div>

          {/* Exercise Rows */}
          {todayWorkout.exercises.map((exercise, index) => (
            <div key={index} className={`transition-all duration-200 ${editingIndex === index ? 'block' : 'grid grid-cols-3 gap-3'} p-3 bg-slate-700/40 hover:bg-slate-700/60 rounded-lg border border-slate-600/40 hover:border-slate-500/60 group`}>
              {editingIndex === index ? (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-white">{exercise.exercise}</div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Sets x Reps"
                      value={editReps}
                      onChange={(e) => setEditReps(e.target.value)}
                      className="bg-slate-600/60 border-slate-500 text-white text-sm flex-1 rounded-lg"
                    />
                    <Input
                      type="text"
                      placeholder="Weight"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      className="bg-slate-600/60 border-slate-500 text-white text-sm flex-1 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSave(index)}
                      size="sm"
                      disabled={updateWorkoutMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg h-8"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-slate-400 hover:text-slate-300 rounded-lg h-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm font-semibold text-slate-100">
                    {exercise.exercise || '-'}
                  </div>
                  <div className="text-sm text-slate-300 font-medium">
                    {exercise.setsReps || '-'}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">
                      {exercise.weight || '-'}
                    </span>
                    <Button
                      onClick={() => handleEdit(index, exercise)}
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7 text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/40 text-center">
          <p className="text-slate-400 text-sm font-medium">Rest day — No exercises scheduled</p>
        </div>
      )}
    </Card>
  );
}