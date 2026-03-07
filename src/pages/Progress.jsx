import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle, BarChart3, ChevronRight, Dumbbell, Users, Flame, Calendar, Zap, TrendingUp, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import WorkoutProgressTracker from '../components/profile/WorkoutProgressTracker';

// ─── Shared styles ────────────────────────────────────────────────────────────
const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const btnCyan = "bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-white font-bold rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center shadow-[0_3px_0_0_#0369a1,0_6px_16px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

// ─── Sub-page wrapper ─────────────────────────────────────────────────────────
function SubPage({ title, onBack, action, children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 pt-5 pb-32">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center active:scale-90 transition-transform">
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

// ─── Goals sub-page ───────────────────────────────────────────────────────────
function GoalsPage({ currentUser, onBack }) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser.id }),
    enabled: !!currentUser, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['goals', currentUser?.id] });
      const previous = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => [...old, { id: `temp-${Date.now()}`, ...data, status: 'active', current_value: 0 }]);
      return { previous };
    },
    onError: (err, data, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowAddGoal(false); },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const prev = queryClient.getQueryData(['goals', currentUser?.id]);
      queryClient.setQueryData(['goals', currentUser?.id], (old = []) => old.map((g) => g.id === id ? { ...g, ...data } : g));
      return { prev };
    },
    onError: (err, v, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.prev); },
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
    onError: (err, id, ctx) => { queryClient.setQueryData(['goals', currentUser?.id], ctx.previous); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); },
  });

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <SubPage title="Goals" onBack={onBack} action={
      <button onClick={() => setShowAddGoal(true)} className={btnCyan}><Plus className="w-3.5 h-3.5" />New Goal</button>
    }>
      {activeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-4"><Target className="w-7 h-7 text-slate-600" /></div>
          <p className="text-base font-black text-white mb-1">No Goals Yet</p>
          <p className="text-sm text-slate-500 mb-5">Set your first fitness goal and start tracking.</p>
          <button onClick={() => setShowAddGoal(true)} className={btnCyan}><Plus className="w-3.5 h-3.5" />Create a Goal</button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal}
              onUpdate={(g, v, s, m) => { const d = { current_value: v, status: s || g.status }; if (m) d.milestones = m; updateGoalMutation.mutate({ id: g.id, data: d }); }}
              onDelete={(id) => deleteGoalMutation.mutate(id)}
              onToggleReminder={(g) => updateGoalMutation.mutate({ id: g.id, data: { reminder_enabled: !g.reminder_enabled } })}
            />
          ))}
        </div>
      )}
      {completedGoals.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" />Completed ({completedGoals.length})</h4>
          <div className="space-y-2">
            {completedGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={CARD}>
                <div className="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-green-400" /></div>
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

// ─── Split sub-page ───────────────────────────────────────────────────────────
function SplitPage({ currentUser, checkIns, onBack }) {
  return (
    <SubPage title="Workout Split" onBack={onBack}>
      {currentUser?.workout_split && (
        <div className="rounded-2xl p-4 mb-4" style={CARD}>
          <WorkoutSplitHeatmap checkIns={checkIns} workoutSplit={currentUser?.workout_split} weeklyGoal={currentUser?.weekly_goal} trainingDays={currentUser?.training_days} customWorkoutTypes={currentUser?.custom_workout_types || {}} />
        </div>
      )}
      <WorkoutProgressTracker currentUser={currentUser} />
    </SubPage>
  );
}

// ─── Analytics sub-page ───────────────────────────────────────────────────────
function AnalyticsPage({ currentUser, workoutLogs, onBack }) {
  return (
    <SubPage title="Analytics" onBack={onBack}>
      <ExerciseInsights workoutLogs={workoutLogs} workoutSplit={currentUser?.custom_workout_types} trainingDays={currentUser?.training_days} />
    </SubPage>
  );
}

// ─── 2×2 Nav Card ────────────────────────────────────────────────────────────
function GridCard({ label, icon: Icon, iconColor, iconBg, glowColor, accentBorder, stat, statLabel, onClick, as: As = 'button', href }) {
  const [pressed, setPressed] = useState(false);
  const events = {
    onMouseDown: () => setPressed(true), onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false), onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false), onTouchCancel: () => setPressed(false),
  };

  const inner = (
    <div
      className="relative overflow-hidden rounded-2xl flex flex-col justify-between p-4"
      style={{
        minHeight: '130px',
        background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
        border: `1px solid ${pressed ? accentBorder : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transform: pressed ? 'scale(0.965)' : 'scale(1)',
        opacity: pressed ? 0.84 : 1,
        boxShadow: pressed ? `0 0 12px 2px ${glowColor}` : '0 2px 12px rgba(0,0,0,0.3)',
        transition: pressed
          ? 'transform 0.08s ease, opacity 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease'
          : 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* subtle top shine */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09), transparent)' }} />
      {/* pressed glow */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: `radial-gradient(circle at 25% 25%, ${glowColor} 0%, transparent 55%)`, opacity: pressed ? 0.16 : 0, transition: 'opacity 0.08s ease' }} />

      {/* Icon */}
      <div className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
        <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
      </div>

      {/* Stat + label */}
      <div className="relative">
        {stat !== undefined && stat !== null && (
          <p className="text-[22px] font-black text-white leading-none">{stat}</p>
        )}
        {statLabel && (
          <p className="text-[11px] mt-0.5 font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.38)' }}>{statLabel}</p>
        )}
        <p className="text-[13px] font-bold text-white mt-2 leading-tight">{label}</p>
      </div>
    </div>
  );

  if (As === 'link') return <Link to={href} className="block" {...events}>{inner}</Link>;
  return <button className="w-full text-left" onClick={onClick} {...events}>{inner}</button>;
}

// ─── Weekly Consistency Bar ───────────────────────────────────────────────────
function WeeklyConsistency({ checkIns, weeklyGoal = 4 }) {
  // Build last 8 weeks of data
  const weeks = [];
  const now = new Date();
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - w * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = checkIns.filter(c => {
      const d = new Date(c.check_in_date);
      return d >= weekStart && d < weekEnd;
    }).length;
    weeks.push({ count, isCurrentWeek: w === 0 });
  }

  const maxCount = Math.max(...weeks.map(w => w.count), weeklyGoal, 1);

  return (
    <div className="rounded-2xl p-4" style={CARD}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          <span className="text-[13px] font-black text-white">Weekly Consistency</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">Goal: {weeklyGoal}× / week</span>
      </div>
      <div className="flex items-end gap-1.5 h-14">
        {weeks.map((week, i) => {
          const pct = Math.min(100, (week.count / maxCount) * 100);
          const metGoal = week.count >= weeklyGoal;
          const isThis = week.isCurrentWeek;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-md overflow-hidden" style={{ height: '44px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                <div
                  className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${pct}%`,
                    background: isThis
                      ? 'linear-gradient(to top, #3b82f6, #60a5fa)'
                      : metGoal
                        ? 'linear-gradient(to top, #1d4ed8, #3b82f6)'
                        : 'linear-gradient(to top, rgba(99,102,241,0.4), rgba(99,102,241,0.6))',
                  }}
                />
              </div>
              <span className="text-[8px] font-bold" style={{ color: isThis ? '#60a5fa' : 'rgba(255,255,255,0.2)' }}>
                {isThis ? 'now' : `W${i + 1}`}
              </span>
            </div>
          );
        })}
      </div>
      {/* Goal line label */}
      <div className="flex items-center gap-2 mt-2.5">
        <div className="flex-1 h-px" style={{ background: 'rgba(59,130,246,0.25)', borderTop: '1px dashed rgba(59,130,246,0.35)' }} />
        <span className="text-[9px] text-blue-400/60 font-bold uppercase tracking-wider">Goal line</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(59,130,246,0.25)', borderTop: '1px dashed rgba(59,130,246,0.35)' }} />
      </div>
    </div>
  );
}

// ─── Main Hub ─────────────────────────────────────────────────────────────────
export default function Progress() {
  const [view, setView] = useState('hub');

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me(), staleTime: 5 * 60 * 1000 });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', currentUser?.id],
    queryFn: () => base44.entities.Goal.filter({ user_id: currentUser.id }),
    enabled: !!currentUser, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }),
    enabled: !!currentUser, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns', currentUser?.id],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: currentUser.id }, '-check_in_date', 200),
    enabled: !!currentUser, staleTime: 2 * 60 * 1000, placeholderData: (prev) => prev,
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser, staleTime: 5 * 60 * 1000, placeholderData: (prev) => prev,
  });

  if (!currentUser) return null;

  if (view === 'goals') return <GoalsPage currentUser={currentUser} onBack={() => setView('hub')} />;
  if (view === 'analytics') return <AnalyticsPage currentUser={currentUser} workoutLogs={workoutLogs} onBack={() => setView('hub')} />;
  if (view === 'split') return <SplitPage currentUser={currentUser} checkIns={checkIns} onBack={() => setView('hub')} />;

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const streak = currentUser?.current_streak || 0;
  const longestStreak = currentUser?.longest_streak || 0;
  const primaryGymId = currentUser?.primary_gym_id;
  const weeklyGoal = currentUser?.weekly_goal || 4;

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
  const thisWeek = checkIns.filter(c => new Date(c.check_in_date) >= weekStart).length;
  const weekPct = Math.min(100, Math.round((thisWeek / weeklyGoal) * 100));

  // Month consistency % (last 30 days)
  const monthAgo = new Date(now); monthAgo.setDate(now.getDate() - 30);
  const monthCheckIns = checkIns.filter(c => new Date(c.check_in_date) >= monthAgo).length;
  const monthPct = Math.round((monthCheckIns / 30) * 100);

  const gridCards = [
    {
      id: 'split', label: 'Split',
      icon: Dumbbell, iconColor: '#818cf8', iconBg: 'rgba(99,102,241,0.16)',
      glowColor: 'rgba(99,102,241,0.45)', accentBorder: 'rgba(99,102,241,0.45)',
      stat: currentUser?.workout_split ? (currentUser.custom_split_name || '—') : '—',
      statLabel: currentUser?.workout_split ? `${weeklyGoal}× / week` : 'No split set',
    },
    {
      id: 'analytics', label: 'Analytics',
      icon: BarChart3, iconColor: '#c084fc', iconBg: 'rgba(139,92,246,0.16)',
      glowColor: 'rgba(139,92,246,0.45)', accentBorder: 'rgba(139,92,246,0.45)',
      stat: workoutLogs.length, statLabel: 'sessions logged',
    },
    {
      id: 'goals', label: 'Goals',
      icon: Target, iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.16)',
      glowColor: 'rgba(59,130,246,0.45)', accentBorder: 'rgba(59,130,246,0.45)',
      stat: activeGoals.length, statLabel: `${completedGoals.length} completed`,
    },
    {
      id: 'community', label: 'Community',
      icon: Users, iconColor: '#34d399', iconBg: 'rgba(16,185,129,0.16)',
      glowColor: 'rgba(16,185,129,0.45)', accentBorder: 'rgba(16,185,129,0.45)',
      stat: gymMemberships.length, statLabel: gymMemberships.length === 1 ? 'gym joined' : 'gyms joined',
      isLink: true,
      href: primaryGymId ? createPageUrl('GymCommunity') + `?id=${primaryGymId}` : createPageUrl('Gyms'),
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-32 space-y-4">

        <h1 className="text-xl font-black text-white tracking-tight">Progress</h1>

        {/* ── Top stat row ── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Streak', value: streak, sub: `Best ${longestStreak}`, icon: Flame, color: '#f97316', bg: 'rgba(249,115,22,0.14)' },
            { label: 'This Week', value: thisWeek, sub: `of ${weeklyGoal} sessions`, icon: Calendar, color: '#60a5fa', bg: 'rgba(59,130,246,0.14)' },
            { label: 'All Time', value: checkIns.length, sub: 'check-ins', icon: Zap, color: '#a78bfa', bg: 'rgba(167,139,250,0.14)' },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl p-3 flex flex-col items-center text-center" style={CARD}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-[22px] font-black text-white leading-none">{value}</p>
              <p className="text-[9px] text-white/30 font-medium mt-1 leading-tight">{sub}</p>
              <p className="text-[9px] font-bold mt-1 uppercase tracking-wider" style={{ color }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── This week progress bar ── */}
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[13px] font-black text-white">This Week</p>
              <p className="text-[10px] text-white/35 mt-0.5">{thisWeek} of {weeklyGoal} sessions done</p>
            </div>
            <span className="text-[18px] font-black" style={{ color: weekPct >= 100 ? '#34d399' : '#60a5fa' }}>{weekPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${weekPct}%`,
                background: weekPct >= 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              }}
            />
          </div>
          {/* Day dots */}
          <div className="flex gap-1.5 mt-3">
            {['M','T','W','T','F','S','S'].map((day, i) => {
              const dayDate = new Date(weekStart); dayDate.setDate(weekStart.getDate() + i);
              const done = checkIns.some(c => {
                const d = new Date(c.check_in_date);
                return d.toDateString() === dayDate.toDateString();
              });
              const isToday = dayDate.toDateString() === now.toDateString();
              const isPast = dayDate < now && !isToday;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full h-6 rounded-md flex items-center justify-center"
                    style={{
                      background: done
                        ? 'linear-gradient(135deg, #3b82f6, #60a5fa)'
                        : isToday
                          ? 'rgba(59,130,246,0.2)'
                          : 'rgba(255,255,255,0.05)',
                      border: isToday ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                    }}
                  >
                    {done && <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />}
                  </div>
                  <span className="text-[8px] font-bold" style={{ color: isToday ? '#60a5fa' : 'rgba(255,255,255,0.2)' }}>{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 2×2 nav grid ── */}
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

        {/* ── Weekly consistency chart ── */}
        <WeeklyConsistency checkIns={checkIns} weeklyGoal={weeklyGoal} />

        {/* ── Month consistency pill ── */}
        <div className="rounded-2xl p-4" style={CARD}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-[13px] font-black text-white">30-Day Consistency</span>
            </div>
            <span className="text-[13px] font-black" style={{ color: monthPct >= 70 ? '#34d399' : monthPct >= 40 ? '#60a5fa' : '#f97316' }}>
              {monthPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${monthPct}%`,
                background: monthPct >= 70
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : monthPct >= 40
                    ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                    : 'linear-gradient(90deg, #f97316, #fb923c)',
              }}
            />
          </div>
          <p className="text-[10px] text-white/30 mt-2">{monthCheckIns} sessions in the last 30 days</p>
        </div>

        {/* ── Active goals preview ── */}
        {activeGoals.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[11px] font-black text-white/40 uppercase tracking-wider">Active Goals</h2>
              <button onClick={() => setView('goals')} className="text-[11px] text-blue-400 font-bold active:scale-95 transition-transform">View all →</button>
            </div>
            <div className="space-y-2">
              {activeGoals.slice(0, 2).map((goal) => {
                const pct = goal.target_value > 0 ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100)) : 0;
                return (
                  <div key={goal.id} className="rounded-2xl px-4 py-3" style={CARD}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-bold text-white truncate flex-1 mr-3">{goal.title}</p>
                      <span className="text-[11px] font-black text-blue-400 flex-shrink-0">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-white/25 mt-1.5">{goal.current_value} / {goal.target_value} {goal.unit}</p>
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
