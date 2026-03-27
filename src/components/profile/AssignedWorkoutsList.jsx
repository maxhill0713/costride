import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, Circle } from 'lucide-react';

export default function AssignedWorkoutsList({ assignedWorkouts = [], currentUser }) {
  const queryClient = useQueryClient();
  const [activatingId, setActivatingId] = useState(null);

  const activateMutation = useMutation({
    mutationFn: async (workoutId) => {
      const assignedWorkout = assignedWorkouts.find(w => w.assigned_date === workoutId);
      if (!assignedWorkout) return;

      // Create active split from assigned workout
      const activeSplit = {
        name: assignedWorkout.name,
        exercises: assignedWorkout.exercises || [],
        assigned_by_coach_id: assignedWorkout.assigned_by_coach_id,
        assigned_by_coach_name: assignedWorkout.assigned_by_coach_name,
        is_active: true,
        created_from_assignment: true,
      };

      // Update user with new active split
      const userWorkouts = currentUser.workouts || [];
      userWorkouts.push(activeSplit);

      await base44.auth.updateMe({
        workouts: userWorkouts,
        active_workout: activeSplit.name,
      });

      return activeSplit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setActivatingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (workoutId) => {
      const filtered = assignedWorkouts.filter(w => w.assigned_date !== workoutId);
      await base44.auth.updateMe({
        assigned_workouts: filtered,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  if (!assignedWorkouts || assignedWorkouts.length === 0) {
    return null;
  }

  const isActive = (workout) => currentUser?.active_workout === workout.name;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Coach Assigned Workouts</h3>
      {assignedWorkouts.map((workout, i) => (
        <div
          key={i}
          className="p-4 rounded-lg border transition-all"
          style={{
            background: isActive(workout) ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
            borderColor: isActive(workout) ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isActive(workout) ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <h4 className="font-bold text-white text-sm">{workout.name}</h4>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Assigned by {workout.assigned_by_coach_name}
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                {workout.exercises?.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>{ex.name}</span>
                    <span className="text-slate-500">
                      {ex.sets}x{ex.reps} @ {ex.weight}kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              {!isActive(workout) && (
                <Button
                  onClick={() => {
                    setActivatingId(workout.assigned_date);
                    activateMutation.mutate(workout.assigned_date);
                  }}
                  disabled={activateMutation.isPending && activatingId === workout.assigned_date}
                  className="text-xs h-8 bg-blue-600 hover:bg-blue-700"
                >
                  Activate
                </Button>
              )}
              {isActive(workout) && (
                <div className="text-xs text-green-500 font-bold">Active</div>
              )}
              <button
                onClick={() => deleteMutation.mutate(workout.assigned_date)}
                disabled={deleteMutation.isPending}
                className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}