import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';

export default function AssignWorkoutModal({ open, onClose, member, coach }) {
  const [workoutData, setWorkoutData] = useState({
    exercises: [{ name: '', sets: 3, reps: 10, weight: 0 }],
  });
  const queryClient = useQueryClient();

  const assignMutation = useMutation({
    mutationFn: (data) =>
      base44.functions.invoke('assignWorkoutToMember', {
        memberId: member.id,
        workoutData: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setWorkoutData({ exercises: [{ name: '', sets: 3, reps: 10, weight: 0 }] });
      onClose();
    },
  });

  const handleAddExercise = () => {
    setWorkoutData({
      ...workoutData,
      exercises: [...workoutData.exercises, { name: '', sets: 3, reps: 10, weight: 0 }],
    });
  };

  const handleExerciseChange = (index, field, value) => {
    const updated = [...workoutData.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setWorkoutData({ ...workoutData, exercises: updated });
  };

  const handleRemoveExercise = (index) => {
    setWorkoutData({
      ...workoutData,
      exercises: workoutData.exercises.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (workoutData.exercises.some(ex => !ex.name.trim())) {
      alert('All exercises must have a name');
      return;
    }
    assignMutation.mutate(workoutData);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-6 z-50 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">Assign Workout to {member?.full_name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {workoutData.exercises.map((ex, i) => (
            <div key={i} className="p-4 bg-slate-800 rounded-lg space-y-3">
              <input
                type="text"
                placeholder="Exercise name"
                value={ex.name}
                onChange={(e) => handleExerciseChange(i, 'name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-500 text-sm"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Sets"
                  value={ex.sets}
                  onChange={(e) => handleExerciseChange(i, 'sets', parseInt(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={ex.reps}
                  onChange={(e) => handleExerciseChange(i, 'reps', parseInt(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm"
                />
                <input
                  type="number"
                  placeholder="Weight (kg)"
                  value={ex.weight}
                  onChange={(e) => handleExerciseChange(i, 'weight', parseFloat(e.target.value))}
                  className="px-3 py-2 rounded-lg bg-slate-700 text-white text-sm"
                />
              </div>
              {workoutData.exercises.length > 1 && (
                <button
                  onClick={() => handleRemoveExercise(i)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove exercise
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleAddExercise}
          className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold mb-4"
        >
          + Add Exercise
        </button>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={assignMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {assignMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Workout'
            )}
          </Button>
        </div>
      </div>
    </>
  );
}