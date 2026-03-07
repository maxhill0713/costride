import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle, BarChart3, ChevronRight, Dumbbell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import WorkoutProgressTracker from '../components/profile/WorkoutProgressTracker';

// ─── Goals Sub-page ──────────────────────────────────────────────────────────
function GoalsPage({ currentUser, onBack }) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser.id }),
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
        ...old, { id: `temp-${Date.now()}`, ...data, status: 'active', current_value: 0 },
      ]);
      return { previous };
    },
    onError: (err, data, context) => { queryClient.setQueryData(['goals', currentUser?.id], context.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowAddGoal(false); },
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
    onError: (err, variables, context) => { queryClient.setQueryData(['goals', currentUser?.id], context.previousGoals); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.filter((g) => g.id !== id));
      return { previous };
    },
    onError: (err, id, context) => { queryClient.setQueryData(['goals', currentUser?.id], context.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); },
  });

  const handleUpdateGoal = (goal, newValue, status, milestones) => {
    const updateData = { current_value: newValue, status: status || goal.status };
    if (milestones) updateData.milestones = milestones;
    updateGoalMutation.mutate({ id: goal.id, data: updateData });
  };

  const handleToggleReminder = (goal) => {
    updateGoalMutation.mutate({ id: goal.id, data: { reminder_enabled: !goal.reminder_enabled } });
  };

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const btnClass = "bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 backdrop-blur-md text-white font-bold rounded-full px-4 py-1.5 flex items-center gap-2 justify-center border border-transparent shadow-[0_3px_0_0_#0369a1,0_8px_20px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-32 space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
            </button>
            <h1 className="text-xl font-black text-white tracking-tight">Goals</h1>
          </div>
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
              <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdateGoal} onDelete={(id) => deleteGoalMutation.mutate(id)} onToggleReminder={handleToggleReminder} />
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

// ─── Split Sub-page ──────────────────────────────────────────────────────────
function SplitPage({ currentUser, checkIns, onBack }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-32 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
          </button>
          <h1 className="text-xl font-black text-white tracking-tight">Split</h1>
        </div>
        {currentUser?.workout_split && (
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2 mb-3">
              <Dumbbell className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Your Split Progress</h3>
            </div>
            <WorkoutSplitHeatmap checkIns={checkIns} workoutSplit={currentUser?.workout_split} weeklyGoal={currentUser?.weekly_goal} trainingDays={currentUser?.training_days} customWorkoutTypes={currentUser?.custom_workout_types || {}} />
          </Card>
        )}
        <WorkoutProgressTracker currentUser={currentUser} />
      </div>
    </div>
  );
}

// ─── Analytics Sub-page ──────────────────────────────────────────────────────
function AnalyticsPage({ currentUser, workoutLogs, onBack }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-32 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
          </button>
          <h1 className="text-xl font-black text-white tracking-tight">Analytics</h1>
        </div>
        <ExerciseInsights
          workoutLogs={workoutLogs}
          workoutSplit={currentUser?.custom_workout_types}
          trainingDays={currentUser?.training_days}
        />
      </div>
    </div>
  );
}

// ─── Main Hub ────────────────────────────────────────────────────────────────
export default function Progress() {
  const [view, setView] = useState('hub');

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

  if (!currentUser) return null;

  if (view === 'goals') return <GoalsPage currentUser={currentUser} onBack={() => setView('hub')} />;
  if (view === 'analytics') return <AnalyticsPage currentUser={currentUser} workoutLogs={workoutLogs} onBack={() => setView('hub')} />;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const navCards = [
    {
      id: 'goals',
      icon: Target,
      label: 'Goals',
      sub: `${activeGoals.length} active · ${completedGoals.length} completed`,
      iconBg: 'from-blue-500 to-cyan-500',
      iconShadow: 'shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]',
      hoverBorder: 'hover:border-blue-500/40',
      hoverGlow: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'Analytics',
      sub: `${workoutLogs.length} sessions logged`,
      iconBg: 'from-purple-500 to-pink-500',
      iconShadow: 'shadow-[0_3px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]',
      hoverBorder: 'hover:border-purple-500/40',
      hoverGlow: 'from-purple-500/10 to-pink-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-32 space-y-4">

        <h1 className="text-2xl font-black text-white tracking-tight pt-2">Progress</h1>

        <div className="grid grid-cols-2 gap-3">
          {navCards.map(({ id, icon: Icon, label, sub, iconBg, iconShadow, hoverBorder, hoverGlow }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`group relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 ${hoverBorder} rounded-2xl p-5 text-left active:translate-y-[2px] active:scale-[0.98] transition-all duration-100 transform-gpu shadow-2xl shadow-black/20`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${hoverGlow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center mb-3 ${iconShadow}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-base font-black text-white">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}