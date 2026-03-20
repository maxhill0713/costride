import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle, BarChart3, ChevronRight, Dumbbell, Users, Flame, Calendar, Zap, TrendingUp, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import WorkoutProgressTracker from '../components/profile/WorkoutProgressTracker';
import StrengthProgress from '../components/profile/StrengthProgress';
import ProgressiveOverloadTracker from '../components/profile/ProgressiveOverloadTracker';
import WeeklyVolumeChart from '../components/profile/WeeklyVolumeChart';

// ─── Shared styles ─────────────────────────────────────────────────────────────
const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};
const btnCyan = "bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-white font-bold rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center shadow-[0_3px_0_0_#0369a1,0_6px_16px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

// ─── Sub-page wrapper ──────────────────────────────────────────────────────────
function SubPage({ title, onBack, action, children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 pt-5 pb-32">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-white/70 hover:text-white transition-all duration-100 transform-gpu"
              style={{
                background: 'linear-gradient(to bottom, rgba(40,50,80,0.9), rgba(20,25,45,0.95))',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 3px 0 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
              onMouseDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
              onMouseUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'; }}
              onTouchStart={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)'; }}>
              <ChevronRight className="w-5 h-5 rotate-180" />
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

// ─── Goals sub-page ────────────────────────────────────────────────────────────
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

// ─── Split sub-page ────────────────────────────────────────────────────────────
function SplitPage({ currentUser, checkIns, onBack }) {
  return (
    <SubPage title="Workout Split" onBack={onBack}>
      {currentUser?.workout_split && (
        <div className="rounded-2xl p-4 mb-4" style={CARD}>
          <WorkoutSplitHeatmap checkIns={checkIns} workoutSplit={currentUser?.workout_split} weeklyGoal={currentUser?.weekly_goal} trainingDays={currentUser?.training_days} customWorkoutTypes={currentUser?.custom_workout_types || {}} />
        </div>
      )}

    </SubPage>
  );
}

// ─── Analytics sub-page ───────────────────────────────────────────────────────
function AnalyticsPage({ currentUser, workoutLogs, onBack }) {
  return (
    <SubPage title="Analytics" onBack={onBack}>
      {/* Progressive Overload Tracker — top of analytics */}
      <ProgressiveOverloadTracker currentUser={currentUser} />

      {/* Weekly Rep Volume chart */}
      <div className="mt-6">
        <WeeklyVolumeChart currentUser={currentUser} />
      </div>

      {/* Exercise insights */}
      <div className="mt-6">
        <ExerciseInsights workoutLogs={workoutLogs} workoutSplit={currentUser?.custom_workout_types} trainingDays={currentUser?.training_days} />
      </div>
    </SubPage>
  );
}

// ─── Badge definitions & logic ───────────────────────────────────────────────
const BADGE_LIBRARY = [
  { id: '10_visits', title: 'Getting Started', description: '10 gym check-ins', icon: '🎯', color: 'from-blue-400 to-blue-600' },
  { id: '50_visits', title: 'Regular', description: '50 gym check-ins', icon: '🔥', color: 'from-orange-400 to-red-500' },
  { id: '100_visits', title: 'Dedicated', description: '100 gym check-ins', icon: '🏆', color: 'from-yellow-400 to-orange-500' },
  { id: '7_day_streak', title: 'Week Warrior', description: '7-day streak', icon: '⚡', color: 'from-green-400 to-emerald-500' },
  { id: '30_day_streak', title: 'Month Master', description: '30-day streak', icon: '🔥', color: 'from-red-400 to-pink-500' },
  { id: '90_day_streak', title: 'Consistency King', description: '90-day streak', icon: '👑', color: 'from-purple-400 to-pink-500' },
  { id: '1_year', title: 'One Year Strong', description: '1 year membership', icon: '📅', color: 'from-indigo-400 to-blue-500' },
  { id: 'community_leader', title: 'Community Leader', description: 'Active community member', icon: '👥', color: 'from-cyan-400 to-blue-500' }
];

// ─── Rank sub-page ─────────────────────────────────────────────────────────────
function RankPage({ currentUser, onBack, checkIns = [] }) {
  const [equippedBadges, setEquippedBadges] = useState(currentUser?.equipped_badges || []);
  const userStats = {
    total_check_ins: checkIns.length,
    longest_streak: currentUser?.longest_streak || 0,
    current_streak: currentUser?.current_streak || 0,
    gym_join_date: currentUser?.created_date
  };
  const isBadgeEarned = (badgeId) => {
    switch(badgeId) {
      case '10_visits': return userStats.total_check_ins >= 10;
      case '50_visits': return userStats.total_check_ins >= 50;
      case '100_visits': return userStats.total_check_ins >= 100;
      case '7_day_streak': return userStats.longest_streak >= 7;
      case '30_day_streak': return userStats.longest_streak >= 30;
      case '90_day_streak': return userStats.longest_streak >= 90;
      case '1_year': return userStats.gym_join_date && Math.floor((new Date() - new Date(userStats.gym_join_date)) / (1000*60*60*24)) >= 365;
      case 'community_leader': return userStats.total_check_ins >= 20;
      default: return false;
    }
  };
  const earnedBadges = BADGE_LIBRARY.filter(b => isBadgeEarned(b.id));
  const lockedBadges = BADGE_LIBRARY.filter(b => !isBadgeEarned(b.id));
  const equippedBadgeDetails = earnedBadges.filter(b => equippedBadges.includes(b.id));
  const handleEquipBadge = async (badgeId) => {
    let newEquipped = [...equippedBadges];
    if (newEquipped.includes(badgeId)) {
      newEquipped = newEquipped.filter(id => id !== badgeId);
    } else {
      if (newEquipped.length >= 3) newEquipped.shift();
      newEquipped.push(badgeId);
    }
    setEquippedBadges(newEquipped);
    await base44.auth.updateMe({ equipped_badges: newEquipped });
  };
  return (
    <SubPage title="Rank" onBack={onBack}>
      {equippedBadgeDetails.length > 0 && (
        <div className="rounded-2xl p-3 bg-gradient-to-br from-amber-600/20 via-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-amber-400/40 shadow-lg mb-4">
          <h3 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Showcase
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {equippedBadgeDetails.map((badge) => (
              <div key={badge.id} className={`relative p-2 rounded-lg bg-gradient-to-br ${badge.color} border border-white/30 shadow-md`}>
                <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-2 h-2 text-amber-900" strokeWidth={3} />
                </div>
                <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <span className="text-lg">{badge.icon}</span>
                </div>
                <h4 className="font-bold text-white text-[9px] text-center drop-shadow line-clamp-1">{badge.title}</h4>
              </div>
            ))}
          </div>
        </div>
      )}
      {earnedBadges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            Earned ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {earnedBadges.map((badge, index) => {
              const isEquipped = equippedBadges.includes(badge.id);
              return (
                <button
                  key={badge.id}
                  onClick={() => handleEquipBadge(badge.id)}
                  className={`p-3 text-center bg-gradient-to-br ${badge.color} border rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                    isEquipped ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  {isEquipped && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm z-10">
                      <CheckCircle className="w-2.5 h-2.5 text-amber-900" strokeWidth={3} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30 relative">
                    <span className="text-xl drop-shadow-lg z-10">{badge.icon}</span>
                  </div>
                  <h4 className="font-bold text-white text-[10px] mb-0.5 drop-shadow line-clamp-1">{badge.title}</h4>
                  <p className="text-[8px] text-white/80 font-medium drop-shadow line-clamp-1">{badge.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-slate-400" />
            Locked ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {lockedBadges.map((badge) => (
              <div key={badge.id} className="p-3 text-center bg-slate-900/70 backdrop-blur-sm border border-dashed border-slate-700/50 rounded-lg relative overflow-hidden cursor-not-allowed">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
                <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-slate-800/50 flex items-center justify-center shadow-sm relative opacity-40">
                  <span className="text-xl">{badge.icon}</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm">🔒</span>
                  </div>
                </div>
                <h4 className="font-bold text-slate-500 text-[10px] mb-0.5 relative z-10 line-clamp-1">{badge.title}</h4>
                <p className="text-[8px] text-slate-600 font-medium relative z-10 line-clamp-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SubPage>
  );
}

// ─── Illustrations ────────────────────────────────────────────────────────────
function AnalyticsIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <rect x="8"  y="56" width="16" height="32" rx="5" fill="url(#ab1)" />
      <rect x="30" y="38" width="16" height="50" rx="5" fill="url(#ab2)" />
      <rect x="52" y="20" width="16" height="68" rx="5" fill="url(#ab3)" />
      <rect x="74" y="30" width="16" height="58" rx="5" fill="url(#ab4)" />
      <rect x="96" y="10" width="16" height="78" rx="5" fill="url(#ab5)" />
      <polyline points="16,56 38,38 60,20 82,30 104,10" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.75" />
      {[[16,56],[38,38],[60,20],[82,30],[104,10]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#e879f9" opacity="0.9" />
      ))}
      <defs>
        <linearGradient id="ab1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity="0.85"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0.25"/></linearGradient>
        <linearGradient id="ab2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c084fc" stopOpacity="0.85"/><stop offset="100%" stopColor="#9333ea" stopOpacity="0.25"/></linearGradient>
        <linearGradient id="ab3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e879f9" stopOpacity="0.9"/><stop offset="100%" stopColor="#a855f7" stopOpacity="0.25"/></linearGradient>
        <linearGradient id="ab4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c084fc" stopOpacity="0.85"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0.25"/></linearGradient>
        <linearGradient id="ab5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f0abfc" stopOpacity="0.9"/><stop offset="100%" stopColor="#c026d3" stopOpacity="0.25"/></linearGradient>
      </defs>
    </svg>
  );
}

function SplitIllustration() {
  const src = "data:image/png;base64,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";
  return (
    <img
      src={src}
      alt="split"
      style={{ display: 'block', width: 84, height: 68, objectFit: "cover", borderRadius: 8, pointerEvents: 'none' }}
    />
  );
}

function GoalsIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <circle cx="60" cy="48" r="42" stroke="rgba(96,165,250,0.15)" strokeWidth="2" fill="none" />
      <circle cx="60" cy="48" r="30" stroke="rgba(96,165,250,0.25)" strokeWidth="2" fill="none" />
      <circle cx="60" cy="48" r="18" stroke="rgba(96,165,250,0.4)"  strokeWidth="2" fill="none" />
      <circle cx="60" cy="48" r="8"  fill="url(#gi1)" />
      <circle cx="60" cy="48" r="3"  fill="white" opacity="0.95" />
      <line x1="90" y1="18" x2="66" y2="44" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="66,44 76,26 84,36" fill="#60a5fa" opacity="0.85" />
      <rect x="4" y="22" width="6" height="52" rx="3" fill="rgba(59,130,246,0.12)" />
      <rect x="4" y="48" width="6" height="26" rx="3" fill="url(#gi2)" />
      <rect x="14" y="22" width="6" height="52" rx="3" fill="rgba(59,130,246,0.12)" />
      <rect x="14" y="34" width="6" height="40" rx="3" fill="url(#gi2)" />
      <defs>
        <radialGradient id="gi1"><stop offset="0%" stopColor="#93c5fd"/><stop offset="100%" stopColor="#2563eb"/></radialGradient>
        <linearGradient id="gi2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient>
      </defs>
    </svg>
  );
}

function CommunityIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <circle cx="28"  cy="30" r="11" fill="url(#ci1)" opacity="0.75" />
      <path d="M12 76 C12 56 44 56 44 76" fill="url(#ci1)" opacity="0.55" />
      <circle cx="60"  cy="26" r="14" fill="url(#ci2)" />
      <path d="M38 78 C38 54 82 54 82 78" fill="url(#ci2)" opacity="0.8" />
      <circle cx="92" cy="30" r="11" fill="url(#ci1)" opacity="0.75" />
      <path d="M76 76 C76 56 108 56 108 76" fill="url(#ci1)" opacity="0.55" />
      <line x1="39" y1="30" x2="46" y2="28" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.55" />
      <line x1="74" y1="28" x2="81" y2="30" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.55" />
      <circle cx="60" cy="26" r="22" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.2" />
      <circle cx="60" cy="26" r="32" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.1" />
      <defs>
        <radialGradient id="ci1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#059669"/></radialGradient>
        <radialGradient id="ci2"><stop offset="0%" stopColor="#a7f3d0"/><stop offset="100%" stopColor="#10b981"/></radialGradient>
      </defs>
    </svg>
  );
}

function RankIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <polygon
        points="60,6 68,28 92,28 73,43 80,66 60,52 40,66 47,43 28,28 52,28"
        fill="url(#ri1)"
        opacity="0.92"
      />
      <circle cx="60" cy="37" r="9" fill="white" opacity="0.12" />
      <circle cx="60" cy="37" r="5" fill="white" opacity="0.2" />
      <path d="M51,64 L46,82 L60,73 L74,82 L69,64" fill="url(#ri4)" opacity="0.85" />
      <polygon points="22,34 27,46 39,46 30,53 33,65 22,58 11,65 14,53 5,46 17,46" fill="url(#ri2)" opacity="0.6" />
      <polygon points="98,34 103,46 115,46 106,53 109,65 98,58 87,65 90,53 81,46 93,46" fill="url(#ri3)" opacity="0.6" />
      <circle cx="100" cy="12" r="2.5" fill="#fde68a" opacity="0.9" />
      <circle cx="108" cy="22" r="1.5" fill="#fde68a" opacity="0.55" />
      <circle cx="14"  cy="16" r="1.8" fill="#fde68a" opacity="0.65" />
      <circle cx="20"  cy="8"  r="1.2" fill="#fde68a" opacity="0.4" />
      <ellipse cx="55" cy="24" rx="7" ry="3" fill="white" opacity="0.12" transform="rotate(-20 55 24)" />
      <defs>
        <linearGradient id="ri1" x1="60" y1="6" x2="60" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a"/>
          <stop offset="50%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="ri2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0"/>
          <stop offset="100%" stopColor="#64748b"/>
        </linearGradient>
        <linearGradient id="ri3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdba74"/>
          <stop offset="100%" stopColor="#92400e"/>
        </linearGradient>
        <linearGradient id="ri4" x1="60" y1="64" x2="60" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.5"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Tall nav card ─────────────────────────────────────────────────────────────
function TallCard({ label, description, iconColor, accentColor, accentBorder, glowColor, illustration: Illustration, onClick, as: As = 'button', href }) {
  const [pressed, setPressed] = useState(false);
  const events = {
    onMouseDown:   () => setPressed(true),
    onMouseUp:     () => setPressed(false),
    onMouseLeave:  () => setPressed(false),
    onTouchStart:  () => setPressed(true),
    onTouchEnd:    () => setPressed(false),
    onTouchCancel: () => setPressed(false),
  };

  const inner = (
    <div
      className="relative overflow-hidden rounded-2xl w-full text-left"
      style={{
        background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
        border: `1px solid ${pressed ? accentBorder : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transform: pressed ? 'translateY(4px)' : 'translateY(0)',
        boxShadow: pressed
          ? 'none'
          : `0 4px 0 0 rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.45)`,
        transition: pressed
          ? 'transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease'
          : 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease',
        display: 'flex',
        alignItems: 'center',
        padding: '16px 0 16px 20px',
        gap: 0,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }}/>
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 20% 50%, ${glowColor} 0%, transparent 55%)`, opacity: pressed ? 0.2 : 0.08, transition: 'opacity 0.1s ease' }}/>

      <div className="relative flex-1 min-w-0" style={{ zIndex: 1, paddingRight: 20 }}>
        <p className="text-[17px] font-black text-white tracking-tight leading-tight mb-1.5">{label}</p>
        {description && (
          <p className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>{description}</p>
        )}
      </div>

      <div className="relative flex-shrink-0 flex items-center justify-center"
        style={{ width: 84, zIndex: 1 }}>
        <Illustration />
      </div>

      <div className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 44, zIndex: 1 }}>
        <motion.div
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}>
          <ChevronRight style={{ width: 22, height: 22, color: iconColor }} />
        </motion.div>
      </div>
    </div>
  );

  if (As === 'link') return <Link to={href} className="block" {...events}>{inner}</Link>;
  return <button className="w-full" onClick={onClick} {...events}>{inner}</button>;
}

// ─── Main Hub ──────────────────────────────────────────────────────────────────
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
  if (view === 'goals')     return <GoalsPage     currentUser={currentUser} onBack={() => setView('hub')} />;
  if (view === 'analytics') return <AnalyticsPage currentUser={currentUser} workoutLogs={workoutLogs} onBack={() => setView('hub')} />;
  if (view === 'split')     return <SplitPage     currentUser={currentUser} checkIns={checkIns} onBack={() => setView('hub')} />;
  if (view === 'rank')      return <RankPage      currentUser={currentUser} checkIns={checkIns} onBack={() => setView('hub')} />;

  const activeGoals    = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const cards = [
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Dive into your performance data, track personal records, and see how your lifts have progressed over time.',
      icon: BarChart3,
      iconColor: '#e879f9',
      iconBg: 'rgba(168,85,247,0.18)',
      accentColor: '#d946ef',
      accentBorder: 'rgba(168,85,247,0.45)',
      glowColor: 'rgba(168,85,247,0.35)',
      illustration: AnalyticsIllustration,
    },
    {
      id: 'split',
      label: 'Workout Split',
      description: "View your weekly training schedule, heatmap, and track which sessions you've completed.",
      icon: Dumbbell,
      iconColor: '#818cf8',
      iconBg: 'rgba(99,102,241,0.18)',
      accentColor: '#a5b4fc',
      accentBorder: 'rgba(99,102,241,0.45)',
      glowColor: 'rgba(99,102,241,0.35)',
      illustration: SplitIllustration,
    },
    {
      id: 'goals',
      label: 'Goals',
      description: 'Set targets, log milestones, and track your progress toward every fitness goal you set.',
      icon: Target,
      iconColor: '#60a5fa',
      iconBg: 'rgba(59,130,246,0.18)',
      accentColor: '#93c5fd',
      accentBorder: 'rgba(59,130,246,0.45)',
      glowColor: 'rgba(59,130,246,0.35)',
      illustration: GoalsIllustration,
    },
    {
      id: 'community',
      label: 'Community',
      description: "See the leaderboard, check who's training today, and stay motivated with your gym crew.",
      icon: Users,
      iconColor: '#34d399',
      iconBg: 'rgba(16,185,129,0.18)',
      accentColor: '#6ee7b7',
      accentBorder: 'rgba(16,185,129,0.45)',
      glowColor: 'rgba(16,185,129,0.35)',
      illustration: CommunityIllustration,
      isLink: true,
      href: createPageUrl('Community'),
    },
    {
      id: 'rank',
      label: 'Rank',
      description: 'Earn badges for hitting milestones, consistency streaks, and personal records across your training journey.',
      icon: Award,
      iconColor: '#fbbf24',
      iconBg: 'rgba(245,158,11,0.18)',
      accentColor: '#fde68a',
      accentBorder: 'rgba(245,158,11,0.45)',
      glowColor: 'rgba(245,158,11,0.35)',
      illustration: RankIllustration,
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-32 space-y-3">
        {cards.map((card) => (
          <TallCard
            key={card.id}
            {...card}
            as={card.isLink ? 'link' : 'button'}
            onClick={card.isLink ? undefined : () => setView(card.id)}
          />
        ))}
      </div>
    </div>
  );
}