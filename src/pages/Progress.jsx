import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle, BarChart3, ChevronRight, Dumbbell, Users, Flame, TrendingUp, Calendar, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import WorkoutProgressTracker from '../components/profile/WorkoutProgressTracker';

// ─── Shared back-page wrapper ─────────────────────────────────────────────────
function SubPage({ title, onBack, action, children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 pt-5 pb-32">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
            </button>
            <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Goals Sub-page ───────────────────────────────────────────────────────────
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
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => [...old, { id: `temp-${Date.now()}`, ...data, status: 'active', current_value: 0 }]);
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
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.map((goal) => goal.id === id ? { ...goal, ...data } : goal));
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

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const btnCyan = "bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-white font-bold rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center shadow-[0_3px_0_0_#0369a1,0_6px_16px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

  return (
    <SubPage title="Goals" onBack={onBack} action={
      <button onClick={() => setShowAddGoal(true)} className={btnCyan}>
        <Plus className="w-3.5 h-3.5" />New Goal
      </button>
    }>
      {activeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-base font-black text-white mb-1">No Goals Yet</p>
          <p className="text-sm text-slate-500 mb-5">Set your first fitness goal and start tracking.</p>
          <button onClick={() => setShowAddGoal(true)} className={btnCyan}><Plus className="w-3.5 h-3.5" />Create a Goal</button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdateGoal} onDelete={(id) => deleteGoalMutation.mutate(id)} onToggleReminder={(g) => updateGoalMutation.mutate({ id: g.id, data: { reminder_enabled: !g.reminder_enabled } })} />
          ))}
        </div>
      )}
      {completedGoals.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" />Completed ({completedGoals.length})</h4>
          <div className="space-y-2">
            {completedGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 bg-slate-800/40 border border-green-500/20 rounded-xl px-4 py-3">
                <div className="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{goal.title}</p>
                  <p className="text-xs text-slate-500">{goal.target_value} {goal.unit}</p>
                </div>
                <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">Done</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <AddGoalModal open={showAddGoal} onClose={() => setShowAddGoal(false)} onSave={(data) => createGoalMutation.mutate(data)} currentUser={currentUser} isLoading={createGoalMutation.isPending} />
    </SubPage>
  );
}

// ─── Split Sub-page ───────────────────────────────────────────────────────────
function SplitPage({ currentUser, checkIns, onBack }) {
  return (
    <SubPage title="Workout Split" onBack={onBack}>
      {currentUser?.workout_split && (
        <Card className="bg-slate-900/60 border border-slate-700/40 p-4 rounded-2xl mb-4">
          <WorkoutSplitHeatmap checkIns={checkIns} workoutSplit={currentUser?.workout_split} weeklyGoal={currentUser?.weekly_goal} trainingDays={currentUser?.training_days} customWorkoutTypes={currentUser?.custom_workout_types || {}} />
        </Card>
      )}
      <WorkoutProgressTracker currentUser={currentUser} />
    </SubPage>
  );
}

// ─── Analytics Sub-page ───────────────────────────────────────────────────────
function AnalyticsPage({ currentUser, workoutLogs, onBack }) {
  return (
    <SubPage title="Analytics" onBack={onBack}>
      <ExerciseInsights workoutLogs={workoutLogs} workoutSplit={currentUser?.custom_workout_types} trainingDays={currentUser?.training_days} />
    </SubPage>
  );
}

// ─── 2×2 Grid Card ───────────────────────────────────────────────────────────
function GridCard({ label, icon: Icon, iconColor, stat, statLabel, onClick, as: As = 'button', href }) {
  const [pressed, setPressed] = useState(false);
  const events = {
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false),
    onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false),
    onTouchCancel: () => setPressed(false),
  };

  const inner = (
    <div
      className="w-full flex flex-col justify-between min-h-[130px] p-4 rounded-[20px]"
      style={{
        background: 'rgb(20,22,34)',
        border: '1px solid rgba(255,255,255,0.05)',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
        opacity: pressed ? 0.7 : 1,
        transition: pressed
          ? 'transform 0.08s ease, opacity 0.08s ease'
          : 'transform 0.2s ease, opacity 0.2s ease',
      }}
    >
      <Icon className="w-[22px] h-[22px]" style={{ color: iconColor }} />
      <div>
        {stat !== undefined && (
          <p className="text-[22px] font-black text-white leading-none">{stat}</p>
        )}
        {statLabel && (
          <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'rgba(255,255,255,0.32)' }}>{statLabel}</p>
        )}
        <p className="text-[13px] font-bold text-white mt-2 leading-tight">{label}</p>
      </div>
    </div>
  );

  if (As === 'link') {
    return <Link to={href} className="block" {...events}>{inner}</Link>;
  }
  return <button className="w-full text-left" onClick={onClick} {...events}>{inner}</button>;
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────
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

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  if (!currentUser) return null;

  if (view === 'goals') return <GoalsPage currentUser={currentUser} onBack={() => setView('hub')} />;
  if (view === 'analytics') return <AnalyticsPage currentUser={currentUser} workoutLogs={workoutLogs} onBack={() => setView('hub')} />;
  if (view === 'split') return <SplitPage currentUser={currentUser} checkIns={checkIns} onBack={() => setView('hub')} />;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const streak = currentUser?.current_streak || 0;
  const thisWeekCheckIns = checkIns.filter(c => {
    const d = new Date(c.check_in_date);
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
    return d >= weekStart;
  }).length;
  const primaryGymId = currentUser?.primary_gym_id;

  const gridCards = [
    {
      id: 'split',
      label: 'Split',
      icon: Dumbbell,
      iconColor: '#818cf8',
      stat: currentUser?.workout_split ? (currentUser.custom_split_name || currentUser.workout_split) : '—',
      statLabel: currentUser?.workout_split ? `${currentUser?.weekly_goal || 0}× per week` : 'No split set',
      isLink: false,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      iconColor: '#c084fc',
      stat: workoutLogs.length,
      statLabel: 'sessions logged',
      isLink: false,
    },
    {
      id: 'goals',
      label: 'Goals',
      icon: Target,
      iconColor: '#60a5fa',
      stat: activeGoals.length,
      statLabel: `${completedGoals.length} completed`,
      isLink: false,
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users,
      iconColor: '#34d399',
      stat: gymMemberships.length,
      statLabel: gymMemberships.length === 1 ? 'gym joined' : 'gyms joined',
      isLink: true,
      href: primaryGymId ? createPageUrl('GymCommunity') + `?id=${primaryGymId}` : createPageUrl('Gyms'),
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-32">

        {/* ── Page title ── */}
        <h1 className="text-xl font-black text-white tracking-tight mb-5">Progress</h1>

        {/* ── Overview stat strip ── */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: 'Streak', value: streak, suffix: streak === 1 ? ' day' : ' days', icon: Flame, color: '#f97316' },
            { label: 'This Week', value: thisWeekCheckIns, suffix: ' sessions', icon: Calendar, color: '#60a5fa' },
            { label: 'All Time', value: checkIns.length, suffix: ' check-ins', icon: Zap, color: '#a78bfa' },
          ].map(({ label, value, suffix, icon: Icon, color }) => (
            <div key={label} className="rounded-[20px] px-3 py-3 flex flex-col items-center text-center" style={{background:"rgb(20,22,34)",border:"1px solid rgba(255,255,255,0.05)"}}>
              <Icon className="w-4 h-4 mb-1.5" style={{ color }} />
              <p className="text-[20px] font-black text-white leading-none">{value}</p>
              <p className="text-[9px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* ── 2×2 grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {gridCards.map((card) => (
            <GridCard
              key={card.id}
              {...card}
              as={card.isLink ? 'link' : 'button'}
              onClick={card.isLink ? undefined : () => setView(card.id)}
            />
          ))}
        </div>

        {/* ── Quick wins: active goals preview ── */}
        {activeGoals.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-black text-slate-400 uppercase tracking-wider">Active Goals</h2>
              <button onClick={() => setView('goals')} className="text-[11px] text-blue-400 font-bold active:scale-95 transition-transform">View all →</button>
            </div>
            <div className="space-y-2">
              {activeGoals.slice(0, 2).map((goal) => {
                const pct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
                return (
                  <div key={goal.id} className="rounded-[20px] px-4 py-3" style={{background:"rgb(20,22,34)",border:"1px solid rgba(255,255,255,0.05)"}}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-bold text-white truncate flex-1 mr-3">{goal.title}</p>
                      <span className="text-[11px] font-black text-blue-400 flex-shrink-0">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5">{goal.current_value} / {goal.target_value} {goal.unit}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
