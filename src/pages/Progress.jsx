import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';

export default function Progress() {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => [
        ...old,
        { id: `temp-${Date.now()}`, ...data, status: 'active', current_value: 0 },
      ]);
      return { previous };
    },
    onError: (err, data, context) => {
      queryClient.setQueryData(['goals', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowAddGoal(false);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) =>
        old.map((goal) => goal.id === id ? { ...goal, ...data } : goal)
      );
      return { previousGoals };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['goals', currentUser?.id], context.previousGoals);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) =>
        old.filter((g) => g.id !== id)
      );
      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['goals', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleUpdateGoal = (goal, newValue, status, milestones) => {
    const updateData = { current_value: newValue, status: status || goal.status };
    if (milestones) { updateData.milestones = milestones; }
    updateGoalMutation.mutate({ id: goal.id, data: updateData });
  };

  const handleToggleReminder = (goal) => {
    updateGoalMutation.mutate({ id: goal.id, data: { reminder_enabled: !goal.reminder_enabled } });
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  if (!currentUser) return null;

  const btnClass = "bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 backdrop-blur-md text-white font-bold rounded-full px-4 py-1.5 flex items-center gap-2 justify-center border border-transparent shadow-[0_3px_0_0_#0369a1,0_8px_20px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-32 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Progress</h1>
        </div>

        {/* ── GOALS SECTION ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-200">Goals</h2>
            <button onClick={() => setShowAddGoal(true)} className={btnClass}>
              <Plus className="w-3.5 h-3.5" />New Goal
            </button>
          </div>

          {activeGoals.length === 0 ? (
            <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border-2 border-dashed border-white/10 p-10 text-center rounded-2xl shadow-2xl shadow-black/20">
              <div className="max-w-sm mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center">
                  <Target className="w-10 h-10 text-blue-400" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">No Active Goals</h4>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">Set your first goal and start tracking your fitness journey. Whether it's lifting heavier, working out more often, or building consistency.</p>
                <button onClick={() => setShowAddGoal(true)} className={btnClass + " mx-auto"}>
                  <Plus className="w-3.5 h-3.5" />Create Your First Goal
                </button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={handleUpdateGoal}
                  onDelete={(id) => deleteGoalMutation.mutate(id)}
                  onToggleReminder={handleToggleReminder}
                />
              ))}
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />Completed Goals ({completedGoals.length})
              </h4>
              <div className="space-y-2">
                {completedGoals.slice(0, 3).map((goal) => (
                  <Card key={goal.id} className="bg-slate-800/40 border border-green-500/30 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-white text-sm truncate">{goal.title}</h5>
                        <p className="text-xs text-slate-400">{goal.target_value} {goal.unit} achieved</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-300 border border-green-500/40 text-xs">✓ Done</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── INSIGHTS SECTION ── */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-200">Insights</h2>
          <ExerciseInsights
            workoutLogs={workoutLogs}
            workoutSplit={currentUser?.custom_workout_types}
            trainingDays={currentUser?.training_days}
          />
        </div>
      </div>

      <AddGoalModal
        open={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSave={(data) => createGoalMutation.mutate(data)}
        currentUser={currentUser}
        isLoading={createGoalMutation.isPending}
      />
    </div>
  );
}