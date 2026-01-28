import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Dumbbell } from 'lucide-react';

export default function TodayWorkout({ currentUser }) {
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
      <div className="flex items-center gap-2 mb-2">
        <Dumbbell className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-white">Today's Workout</h3>
      </div>

      {/* Workout Title */}
      <div className="mb-3">
        <h2 className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-0.5">
          {todayWorkout.name}
        </h2>
        <p className="text-[10px] text-slate-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
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
            <div key={index} className="grid grid-cols-3 gap-2 p-2 bg-slate-700/50 rounded-lg border border-slate-600/30">
              <div className="text-xs font-semibold text-white">
                {exercise.exercise || '-'}
              </div>
              <div className="text-sm text-slate-300">
                {exercise.setsReps || '-'}
              </div>
              <div className="text-sm text-slate-300">
                {exercise.weight || '-'}
              </div>
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