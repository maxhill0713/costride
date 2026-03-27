import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, Circle } from 'lucide-react';

export default function AssignedWorkoutsList({ currentUser }) {
  const queryClient = useQueryClient();
  const [activatingId, setActivatingId] = useState(null);

  // Fetch assigned workouts from AssignedWorkout entity
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignedWorkouts', currentUser?.id],
    queryFn: () => base44.entities.AssignedWorkout.filter({ member_id: currentUser.id }),
    enabled: !!currentUser?.id,
    staleTime: 5 * 60 * 1000,
  });

  const activateMutation = useMutation({
    mutationFn: async (assignmentId) => {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) return;

      const workout = assignment.workout_data;

      // Create active split from assigned workout
      const activeSplit = {
        name: workout.name,
        exercises: workout.exercises || [],
        assigned_by_coach_id: assignment.coach_id,
        assigned_by_coach_name: assignment.coach_name,
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

      // Mark assignment as activated
      await base44.entities.AssignedWorkout.update(assignmentId, { is_activated: true });

      return activeSplit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setActivatingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (assignmentId) => base44.entities.AssignedWorkout.delete(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedWorkouts'] });
    },
  });

  if (!assignments || assignments.length === 0) {
    return null;
  }

  const isActive = (assignment) => currentUser?.active_workout === assignment.workout_data.name;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Coach Assigned Workouts</h3>
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="p-4 rounded-lg border transition-all"
          style={{
            background: isActive(assignment) ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
            borderColor: isActive(assignment) ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {isActive(assignment) ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}
                <h4 className="font-bold text-white text-sm">{assignment.workout_data.name}</h4>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Assigned by {assignment.coach_name}
              </p>
              <div className="text-xs text-slate-400 space-y-1">
                {assignment.workout_data.exercises?.map((ex, idx) => (
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
              {!isActive(assignment) && !assignment.is_activated && (
                <Button
                  onClick={() => {
                    setActivatingId(assignment.id);
                    activateMutation.mutate(assignment.id);
                  }}
                  disabled={activateMutation.isPending && activatingId === assignment.id}
                  className="text-xs h-8 bg-blue-600 hover:bg-blue-700"
                >
                  Activate
                </Button>
              )}
              {isActive(assignment) && (
                <div className="text-xs text-green-500 font-bold">Active</div>
              )}
              <button
                onClick={() => deleteMutation.mutate(assignment.id)}
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