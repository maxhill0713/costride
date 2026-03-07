import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Plus, Target, CheckCircle, BarChart3, Flame, Trophy,
  TrendingUp, Zap, Star, ChevronRight, Dumbbell, Calendar,
  Award, Shield, Crown, Swords, Activity, Lock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';

// ─── Sub-page: Goals ────────────────────────────────────────────────────────
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
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
            </button>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Goals</h1>
              <p className="text-xs text-slate-400">{activeGoals.length} active · {completedGoals.length} completed</p>
            </div>
          </div>
          <button onClick={() => setShowAddGoal(true)} className={btnClass}>
            <Plus className="w-3.5 h-3.5" />New Goal
          </button>
        </div>

        {/* Active goals */}
        {activeGoals.length === 0 ? (
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border-2 border-dashed border-white/10 p-10 text-center rounded-2xl shadow-2xl shadow-black/20">
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center">
                <Target className="w-10 h-10 text-blue-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">No Active Goals</h4>
              <p className="text-slate-400 text-sm mb-5 leading-relaxed">Set your first goal and start tracking your fitness journey.</p>
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

        {/* Completed goals */}
        {completedGoals.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />Completed Goals ({completedGoals.length})
            </h4>
            <div className="space-y-2">
              {completedGoals.slice(0, 5).map((goal) => (
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

// ─── Sub-page: Analytics ────────────────────────────────────────────────────
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
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Analytics</h1>
            <p className="text-xs text-slate-400">Your exercise insights & trends</p>
          </div>
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

// ─── Main Progress Hub ───────────────────────────────────────────────────────
export default function Progress() {
  const [view, setView] = useState('hub'); // 'hub' | 'goals' | 'analytics'
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

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  if (!currentUser) return null;

  if (view === 'goals') return <GoalsPage currentUser={currentUser} onBack={() => setView('hub')} />;
  if (view === 'analytics') return <AnalyticsPage currentUser={currentUser} workoutLogs={workoutLogs} onBack={() => setView('hub')} />;

  // ── computed stats ──
  const currentStreak = currentUser?.current_streak || 0;
  const longestStreak = currentUser?.longest_streak || 0;
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const totalCheckIns = checkIns.length;
  const totalWorkouts = workoutLogs.length;

  // XP / level system
  const xp = totalCheckIns * 50 + completedGoals.length * 200 + longestStreak * 10 + totalWorkouts * 30;
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpToNext = 500;
  const xpPct = Math.min((xpInLevel / xpToNext) * 100, 100);

  const levelTitles = ['Rookie', 'Grinder', 'Committed', 'Dedicated', 'Elite', 'Champion', 'Legend', 'Icon', 'Myth', 'G.O.A.T.'];
  const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)] || 'G.O.A.T.';

  // Streak rank
  const streakRank = currentStreak >= 100 ? { label: '🔥 On Fire', color: 'text-red-400' }
    : currentStreak >= 30 ? { label: '⚡ Unstoppable', color: 'text-yellow-400' }
    : currentStreak >= 7 ? { label: '💪 In the Zone', color: 'text-blue-400' }
    : { label: '🌱 Building Habit', color: 'text-green-400' };

  // Weekly stats
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyCheckIns = checkIns.filter((c) => new Date(c.check_in_date) >= oneWeekAgo).length;
  const weeklyGoal = currentUser?.weekly_goal || 4;
  const weeklyPct = Math.min((weeklyCheckIns / weeklyGoal) * 100, 100);

  // Nav cards
  const navCards = [
    {
      id: 'goals',
      icon: Target,
      label: 'Goals',
      sub: `${activeGoals.length} active`,
      accent: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]',
      glow: 'from-blue-500/20 to-cyan-500/20',
      border: 'hover:border-blue-500/40',
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'Analytics',
      sub: `${totalWorkouts} sessions`,
      accent: 'from-purple-500 to-pink-500',
      shadow: 'shadow-[0_3px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]',
      glow: 'from-purple-500/20 to-pink-500/20',
      border: 'hover:border-purple-500/40',
    },
  ];

  // Achievement badges
  const achievements = [
    { icon: '🔥', label: 'First Check-in', unlocked: totalCheckIns >= 1, req: 1, current: totalCheckIns, type: 'checkins' },
    { icon: '⚡', label: '10 Check-ins', unlocked: totalCheckIns >= 10, req: 10, current: totalCheckIns, type: 'checkins' },
    { icon: '💪', label: '7-Day Streak', unlocked: longestStreak >= 7, req: 7, current: longestStreak, type: 'streak' },
    { icon: '🏆', label: '30-Day Streak', unlocked: longestStreak >= 30, req: 30, current: longestStreak, type: 'streak' },
    { icon: '👑', label: 'Goal Crusher', unlocked: completedGoals.length >= 1, req: 1, current: completedGoals.length, type: 'goals' },
    { icon: '🌟', label: '50 Check-ins', unlocked: totalCheckIns >= 50, req: 50, current: totalCheckIns, type: 'checkins' },
  ];

  const btnBase = "active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu";

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-32 space-y-5">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Progress</h1>
            <p className="text-xs text-slate-400 mt-0.5">Your fitness journey at a glance</p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl px-3 py-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 leading-none">Level {level}</p>
              <p className="text-xs font-black text-white leading-tight">{levelTitle}</p>
            </div>
          </div>
        </div>

        {/* ── XP BAR ── */}
        <div className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-white">Level {level} · {levelTitle}</span>
            </div>
            <span className="text-xs text-slate-400">{xpInLevel} / {xpToNext} XP</span>
          </div>
          <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 transition-all duration-700 relative"
              style={{ width: `${xpPct}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">{xpToNext - xpInLevel} XP to Level {level + 1}</p>
        </div>

        {/* ── QUICK STATS ROW ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Streak', value: currentStreak, unit: 'days', icon: Flame, color: 'text-orange-400', glow: 'from-orange-500/20 to-red-500/20', border: 'hover:border-orange-400/30' },
            { label: 'Check-ins', value: totalCheckIns, unit: 'total', icon: Calendar, color: 'text-blue-400', glow: 'from-blue-500/20 to-cyan-500/20', border: 'hover:border-blue-400/30' },
            { label: 'Goals Done', value: completedGoals.length, unit: 'crushed', icon: Trophy, color: 'text-yellow-400', glow: 'from-yellow-500/20 to-orange-500/20', border: 'hover:border-yellow-400/30' },
          ].map(({ label, value, unit, icon: Icon, color, glow, border }) => (
            <div key={label} className={`group relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 ${border} rounded-2xl p-3 shadow-2xl shadow-black/20 transition-all duration-300`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${glow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <Icon className={`w-4 h-4 ${color} mb-1.5`} />
                <div className="text-2xl font-black text-white leading-none">{value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wide">{unit}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── WEEKLY GOAL BAR ── */}
        <div className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-white">This Week</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-black ${weeklyCheckIns >= weeklyGoal ? 'text-green-400' : 'text-white'}`}>{weeklyCheckIns}</span>
              <span className="text-xs text-slate-500">/ {weeklyGoal} sessions</span>
              {weeklyCheckIns >= weeklyGoal && <span className="text-xs ml-1">🎯</span>}
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className={`h-full rounded-full transition-all duration-700 ${weeklyCheckIns >= weeklyGoal ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
              style={{ width: `${weeklyPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {Array.from({ length: weeklyGoal }).map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < weeklyCheckIns ? 'bg-blue-400' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>

        {/* ── STREAK RANK ── */}
        <div className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Current Streak</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">{currentStreak}</span>
                  <span className="text-sm text-slate-400">days</span>
                </div>
                <p className={`text-xs font-bold ${streakRank.color}`}>{streakRank.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Best Ever</p>
              <p className="text-2xl font-black text-slate-300">{longestStreak}</p>
              <p className="text-[10px] text-slate-500">days</p>
            </div>
          </div>
        </div>

        {/* ── NAV CARDS (Goals / Analytics) ── */}
        <div className="grid grid-cols-2 gap-3">
          {navCards.map(({ id, icon: Icon, label, sub, accent, shadow, glow, border }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`group relative bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 ${border} rounded-2xl p-5 text-left ${btnBase} shadow-2xl shadow-black/20 transition-all duration-300`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${glow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-3 ${shadow} group-active:translate-y-[2px] transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-base font-black text-white">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>

        {/* ── ACHIEVEMENTS ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-400" />
              <h2 className="text-base font-bold text-white">Achievements</h2>
            </div>
            <span className="text-xs text-slate-400">{achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {achievements.map(({ icon, label, unlocked, req, current }) => (
              <div
                key={label}
                className={`relative group rounded-2xl border p-3 text-center transition-all duration-300 ${
                  unlocked
                    ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                    : 'bg-slate-900/40 border-slate-800/50'
                }`}
              >
                <div className={`text-2xl mb-1 transition-all duration-300 ${unlocked ? '' : 'grayscale opacity-30'}`}>
                  {unlocked ? icon : <Lock className="w-5 h-5 text-slate-600 mx-auto" />}
                </div>
                <p className={`text-[10px] font-semibold leading-tight ${unlocked ? 'text-slate-200' : 'text-slate-600'}`}>{label}</p>
                {!unlocked && (
                  <div className="mt-1.5 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-slate-600 to-slate-500 rounded-full"
                      style={{ width: `${Math.min((current / req) * 100, 100)}%` }}
                    />
                  </div>
                )}
                {unlocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-3 h-3 text-yellow-900" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── ACTIVE GOALS PREVIEW ── */}
        {activeGoals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-bold text-white">Active Goals</h2>
              </div>
              <button
                onClick={() => setView('goals')}
                className="text-xs text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300 transition-colors"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {activeGoals.slice(0, 2).map((goal) => {
                const pct = Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100);
                return (
                  <div key={goal.id} className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-white truncate">{goal.title}</p>
                      <span className="text-xs text-slate-400 ml-2 shrink-0">{Math.round(pct)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-slate-500">{goal.current_value || 0} {goal.unit}</span>
                      <span className="text-[10px] text-slate-500">{goal.target_value} {goal.unit}</span>
                    </div>
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
