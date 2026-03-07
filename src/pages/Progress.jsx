import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle, BarChart3, ChevronRight, Dumbbell, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
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
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors active:scale-95">
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
      <AddGoalModal open={showAddGoal} onClose={() => setShowAddGoal(false)} onSave={(data) => createGoalMutation.mutate(data)} currentUser={currentUser} isLoading={createGoalMutation.isPending} />
    </div>
  );
}

// ─── Split Sub-page ──────────────────────────────────────────────────────────
function SplitPage({ currentUser, checkIns, onBack }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-32 space-y-4">
        <div className="flex items-center gap-3 pt-2">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors active:scale-95">
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
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/60 transition-colors active:scale-95">
            <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
          </button>
          <h1 className="text-xl font-black text-white tracking-tight">Analytics</h1>
        </div>
        <ExerciseInsights workoutLogs={workoutLogs} workoutSplit={currentUser?.custom_workout_types} trainingDays={currentUser?.training_days} />
      </div>
    </div>
  );
}

// ─── Nav Card ─────────────────────────────────────────────────────────────────
function NavCard({ label, description, badge, badgeTextColor, badgeBg, badgeBorder, icon: Icon, tintFrom, tintTo, borderColor, iconBg, iconColor, glowColor, onClick, as: As = 'button', href }) {
  const [pressed, setPressed] = useState(false);

  const handleDown = () => setPressed(true);
  const handleUp = () => setPressed(false);

  const cardStyle = {
    transform: pressed ? 'scale(0.965)' : 'scale(1)',
    opacity: pressed ? 0.82 : 1,
    transition: pressed
      ? 'transform 0.08s ease, opacity 0.08s ease, box-shadow 0.08s ease'
      : 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
    boxShadow: pressed
      ? `0 0 28px 6px ${glowColor}, 0 4px 20px rgba(0,0,0,0.5)`
      : '0 2px 12px rgba(0,0,0,0.35)',
  };

  const inner = (
    <div className="relative w-full overflow-hidden rounded-2xl" style={cardStyle}>
      {/* frosted glass base — muted at rest, slightly more vivid on press via glow */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${tintFrom} 0%, ${tintTo} 100%)`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      />
      {/* pressed glow overlay */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${glowColor} 0%, transparent 70%)`,
          opacity: pressed ? 0.35 : 0,
          transition: 'opacity 0.08s ease',
        }}
      />
      {/* top highlight line */}
      <div
        className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)' }}
      />
      {/* border */}
      <div
        className="absolute inset-0 rounded-2xl border pointer-events-none"
        style={{
          borderColor: pressed ? glowColor : borderColor,
          transition: 'border-color 0.08s ease',
        }}
      />

      {/* content */}
      <div className="relative flex items-center gap-4 px-4 py-4">
        {/* icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: iconBg,
            boxShadow: pressed ? `0 0 14px 3px ${glowColor}` : `0 2px 8px ${iconColor}33`,
            transition: 'box-shadow 0.08s ease',
          }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>

        {/* text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[15px] font-bold text-white tracking-tight">{label}</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{ color: badgeTextColor, background: badgeBg, borderColor: badgeBorder }}
            >
              {badge}
            </span>
          </div>
          <p className="text-[12px] text-slate-400 leading-snug">{description}</p>
        </div>

        <ChevronRight
          className="w-4 h-4 flex-shrink-0"
          style={{ color: iconColor, opacity: 0.6 }}
        />
      </div>
    </div>
  );

  const events = {
    onMouseDown: handleDown,
    onMouseUp: handleUp,
    onMouseLeave: handleUp,
    onTouchStart: handleDown,
    onTouchEnd: handleUp,
    onTouchCancel: handleUp,
  };

  if (As === 'link') {
    return (
      <Link to={href} className="block w-full" {...events}>
        {inner}
      </Link>
    );
  }

  return (
    <button className="w-full text-left" onClick={onClick} {...events}>
      {inner}
    </button>
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
  const primaryGymId = currentUser?.primary_gym_id;

  const navCards = [
    {
      id: 'split',
      label: 'Workout Split',
      description: 'Day-by-day heatmap of your training week. See how consistently you hit each muscle group and track volume over time.',
      badge: currentUser?.workout_split ? 'Active split' : 'No split set',
      badgeTextColor: currentUser?.workout_split ? '#a5b4fc' : '#64748b',
      badgeBg: currentUser?.workout_split ? 'rgba(99,102,241,0.12)' : 'rgba(30,41,59,0.6)',
      badgeBorder: currentUser?.workout_split ? 'rgba(99,102,241,0.28)' : 'rgba(51,65,85,0.5)',
      icon: Dumbbell,
      tintFrom: 'rgba(55,48,163,0.10)',
      tintTo: 'rgba(8,10,20,0.88)',
      borderColor: 'rgba(99,102,241,0.15)',
      iconBg: 'rgba(99,102,241,0.14)',
      iconColor: '#818cf8',
      glowColor: 'rgba(99,102,241,0.55)',
      isLink: false,
    },
    {
      id: 'analytics',
      label: 'Advanced Analytics',
      description: "Volume trends, personal records and muscle group breakdowns across every session you've ever logged.",
      badge: workoutLogs.length > 0 ? `${workoutLogs.length} sessions` : 'No sessions yet',
      badgeTextColor: '#c4b5fd',
      badgeBg: 'rgba(109,40,217,0.12)',
      badgeBorder: 'rgba(109,40,217,0.28)',
      icon: BarChart3,
      tintFrom: 'rgba(88,28,135,0.10)',
      tintTo: 'rgba(8,10,20,0.88)',
      borderColor: 'rgba(139,92,246,0.15)',
      iconBg: 'rgba(139,92,246,0.14)',
      iconColor: '#c084fc',
      glowColor: 'rgba(139,92,246,0.55)',
      isLink: false,
    },
    {
      id: 'goals',
      label: 'Goals',
      description: "Create and track your fitness targets — lift milestones, attendance streaks, or bodyweight goals. Mark them off as you crush them.",
      badge: activeGoals.length > 0 ? `${activeGoals.length} active` : 'No goals yet',
      badgeTextColor: activeGoals.length > 0 ? '#93c5fd' : '#64748b',
      badgeBg: activeGoals.length > 0 ? 'rgba(37,99,235,0.12)' : 'rgba(30,41,59,0.6)',
      badgeBorder: activeGoals.length > 0 ? 'rgba(59,130,246,0.28)' : 'rgba(51,65,85,0.5)',
      icon: Target,
      tintFrom: 'rgba(23,37,84,0.10)',
      tintTo: 'rgba(8,10,20,0.88)',
      borderColor: 'rgba(59,130,246,0.15)',
      iconBg: 'rgba(59,130,246,0.14)',
      iconColor: '#60a5fa',
      glowColor: 'rgba(59,130,246,0.55)',
      isLink: false,
    },
    {
      id: 'community',
      label: 'Community',
      description: "Your gym's community feed and member activity. See who's training, react to posts, and stay motivated by those around you.",
      badge: gymMemberships.length > 0 ? `${gymMemberships.length} gym${gymMemberships.length > 1 ? 's' : ''} joined` : 'No gym joined',
      badgeTextColor: gymMemberships.length > 0 ? '#6ee7b7' : '#64748b',
      badgeBg: gymMemberships.length > 0 ? 'rgba(5,150,105,0.12)' : 'rgba(30,41,59,0.6)',
      badgeBorder: gymMemberships.length > 0 ? 'rgba(16,185,129,0.28)' : 'rgba(51,65,85,0.5)',
      icon: Users,
      tintFrom: 'rgba(6,78,59,0.10)',
      tintTo: 'rgba(8,10,20,0.88)',
      borderColor: 'rgba(16,185,129,0.15)',
      iconBg: 'rgba(16,185,129,0.14)',
      iconColor: '#34d399',
      glowColor: 'rgba(16,185,129,0.55)',
      isLink: true,
      href: primaryGymId ? createPageUrl('GymCommunity') + `?id=${primaryGymId}` : createPageUrl('Gyms'),
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 pb-32">
        <h1 className="text-2xl font-black text-white tracking-tight pt-2 mb-4">Progress</h1>
        <div className="flex flex-col gap-3">
          {navCards.map((card) => (
            <NavCard
              key={card.id}
              {...card}
              as={card.isLink ? 'link' : 'button'}
              onClick={card.isLink ? undefined : () => setView(card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
