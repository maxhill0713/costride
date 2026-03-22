import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle, ChevronRight, Flame, Award, BarChart3, Users, TrendingUp, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import ProgressiveOverloadTracker from '../components/profile/ProgressiveOverloadTracker';
import WeeklyVolumeChart from '../components/profile/WeeklyVolumeChart';

// ─── Shared card style ────────────────────────────────────────────────────────
const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const btnCyan = "bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-white font-bold rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center shadow-[0_3px_0_0_#0369a1,0_6px_16px_rgba(6,100,200,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

// ─── Illustrations ────────────────────────────────────────────────────────────
function GoalsIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <circle cx="60" cy="48" r="42" stroke="rgba(96,165,250,0.15)" strokeWidth="2" fill="none" />
      <circle cx="60" cy="48" r="30" stroke="rgba(96,165,250,0.25)" strokeWidth="2" fill="none" />
      <circle cx="60" cy="48" r="18" stroke="rgba(96,165,250,0.4)" strokeWidth="2" fill="none" />
      <circle cx="60" cy="48" r="8" fill="url(#gi1)" />
      <circle cx="60" cy="48" r="3" fill="white" opacity="0.95" />
      <line x1="90" y1="18" x2="66" y2="44" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="66,44 76,26 84,36" fill="#60a5fa" opacity="0.85" />
      <defs>
        <radialGradient id="gi1"><stop offset="0%" stopColor="#93c5fd"/><stop offset="100%" stopColor="#2563eb"/></radialGradient>
      </defs>
    </svg>
  );
}

function CommunityIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <circle cx="28" cy="30" r="11" fill="url(#ci1)" opacity="0.75" />
      <path d="M12 76 C12 56 44 56 44 76" fill="url(#ci1)" opacity="0.55" />
      <circle cx="60" cy="26" r="14" fill="url(#ci2)" />
      <path d="M38 78 C38 54 82 54 82 78" fill="url(#ci2)" opacity="0.8" />
      <circle cx="92" cy="30" r="11" fill="url(#ci1)" opacity="0.75" />
      <path d="M76 76 C76 56 108 56 108 76" fill="url(#ci1)" opacity="0.55" />
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
      <polygon points="60,6 68,28 92,28 73,43 80,66 60,52 40,66 47,43 28,28 52,28" fill="url(#ri1)" opacity="0.92" />
      <circle cx="60" cy="37" r="9" fill="white" opacity="0.12" />
      <circle cx="60" cy="37" r="5" fill="white" opacity="0.2" />
      <path d="M51,64 L46,82 L60,73 L74,82 L69,64" fill="url(#ri4)" opacity="0.85" />
      <polygon points="22,34 27,46 39,46 30,53 33,65 22,58 11,65 14,53 5,46 17,46" fill="url(#ri2)" opacity="0.6" />
      <polygon points="98,34 103,46 115,46 106,53 109,65 98,58 87,65 90,53 81,46 93,46" fill="url(#ri3)" opacity="0.6" />
      <defs>
        <linearGradient id="ri1" x1="60" y1="6" x2="60" y2="66" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde68a"/><stop offset="50%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="ri2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0"/><stop offset="100%" stopColor="#64748b"/>
        </linearGradient>
        <linearGradient id="ri3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdba74"/><stop offset="100%" stopColor="#92400e"/>
        </linearGradient>
        <linearGradient id="ri4" x1="60" y1="64" x2="60" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#78350f" stopOpacity="0.5"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Nav card (Community / Rank links) ───────────────────────────────────────
function TallCard({ label, description, iconColor, accentBorder, glowColor, illustration: Illustration, onClick, as: As = 'button', href }) {
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
        boxShadow: pressed ? 'none' : '0 4px 0 0 rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.45)',
        transition: pressed
          ? 'transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease'
          : 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease',
        display: 'flex', alignItems: 'center', padding: '16px 0 16px 20px',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 20% 50%, ${glowColor} 0%, transparent 55%)`, opacity: pressed ? 0.2 : 0.08 }} />
      <div className="relative flex-1 min-w-0" style={{ zIndex: 1, paddingRight: 20 }}>
        <p className="text-[17px] font-black text-white tracking-tight leading-tight mb-1.5">{label}</p>
        {description && <p className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>{description}</p>}
      </div>
      <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 84, zIndex: 1 }}>
        <Illustration />
      </div>
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 44, zIndex: 1 }}>
        <ChevronRight style={{ width: 22, height: 22, color: iconColor }} />
      </div>
    </div>
  );

  if (As === 'link') return <Link to={href} className="block" {...events}>{inner}</Link>;
  return <button className="w-full" onClick={onClick} {...events}>{inner}</button>;
}

// ─── Badge definitions ────────────────────────────────────────────────────────
const BADGE_LIBRARY = [
  { id: '10_visits',        title: 'Getting Started',    description: '10 gym check-ins',    icon: '🎯', color: 'from-blue-400 to-blue-600' },
  { id: '50_visits',        title: 'Regular',            description: '50 gym check-ins',    icon: '🔥', color: 'from-orange-400 to-red-500' },
  { id: '100_visits',       title: 'Dedicated',          description: '100 gym check-ins',   icon: '🏆', color: 'from-yellow-400 to-orange-500' },
  { id: '7_day_streak',     title: 'Week Warrior',       description: '7-day streak',         icon: '⚡', color: 'from-green-400 to-emerald-500' },
  { id: '30_day_streak',    title: 'Month Master',       description: '30-day streak',        icon: '🔥', color: 'from-red-400 to-pink-500' },
  { id: '90_day_streak',    title: 'Consistency King',   description: '90-day streak',        icon: '👑', color: 'from-purple-400 to-pink-500' },
  { id: '1_year',           title: 'One Year Strong',    description: '1 year membership',   icon: '📅', color: 'from-indigo-400 to-blue-500' },
  { id: 'community_leader', title: 'Community Leader',   description: 'Active community member', icon: '👥', color: 'from-cyan-400 to-blue-500' },
];

// ─── Analytics tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ currentUser, workoutLogs, checkIns }) {
  return (
    <div className="space-y-6">
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <ProgressiveOverloadTracker currentUser={currentUser} />
      </div>
      <div style={{ ...CARD, borderRadius: 16, padding: '16px 16px' }}>
        <WeeklyVolumeChart currentUser={currentUser} />
      </div>
      {currentUser?.workout_split && (
        <WorkoutSplitHeatmap
          checkIns={checkIns}
          workoutSplit={currentUser?.workout_split}
          weeklyGoal={currentUser?.weekly_goal}
          trainingDays={currentUser?.training_days}
          customWorkoutTypes={currentUser?.custom_workout_types || {}}
        />
      )}
      <ExerciseInsights
        workoutLogs={workoutLogs}
        workoutSplit={currentUser?.custom_workout_types}
        trainingDays={currentUser?.training_days}
      />
    </div>
  );
}

// ─── Goals tab ────────────────────────────────────────────────────────────────
function GoalsTab({ currentUser, showAddGoal, setShowAddGoal }) {
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

  const activeGoals    = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <div className="space-y-4">
      {activeGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-base font-bold text-white mb-1">No Goals Yet</p>
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
        <div className="mt-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />Completed ({completedGoals.length})
          </h4>
          <div className="space-y-2">
            {completedGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={CARD}>
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

// ─── Rank tab ─────────────────────────────────────────────────────────────────
function RankTab({ currentUser, checkIns }) {
  const [equippedBadges, setEquippedBadges] = useState(currentUser?.equipped_badges || []);

  const userStats = {
    total_check_ins: checkIns.length,
    longest_streak: currentUser?.longest_streak || 0,
    gym_join_date: currentUser?.created_date,
  };

  const isBadgeEarned = (badgeId) => {
    switch (badgeId) {
      case '10_visits':        return userStats.total_check_ins >= 10;
      case '50_visits':        return userStats.total_check_ins >= 50;
      case '100_visits':       return userStats.total_check_ins >= 100;
      case '7_day_streak':     return userStats.longest_streak >= 7;
      case '30_day_streak':    return userStats.longest_streak >= 30;
      case '90_day_streak':    return userStats.longest_streak >= 90;
      case '1_year':           return userStats.gym_join_date && Math.floor((new Date() - new Date(userStats.gym_join_date)) / (1000 * 60 * 60 * 24)) >= 365;
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
    <div className="space-y-6">
      {/* Community nav card */}
      <TallCard
        label="Community"
        description="See the leaderboard, check who's training today, and stay motivated with your gym crew."
        iconColor="#34d399"
        accentBorder="rgba(16,185,129,0.45)"
        glowColor="rgba(16,185,129,0.35)"
        illustration={CommunityIllustration}
        as="link"
        href={createPageUrl('Community')}
      />

      {/* Badge showcase */}
      {equippedBadgeDetails.length > 0 && (
        <div className="rounded-2xl p-3 bg-gradient-to-br from-amber-600/20 via-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-amber-400/40 shadow-lg">
          <h3 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />Showcase
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

      {/* Earned badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />Earned ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {earnedBadges.map((badge) => {
              const isEquipped = equippedBadges.includes(badge.id);
              return (
                <button
                  key={badge.id}
                  onClick={() => handleEquipBadge(badge.id)}
                  className={`p-3 text-center bg-gradient-to-br ${badge.color} border rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group cursor-pointer ${isEquipped ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/20 hover:border-white/40'}`}
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

      {/* Locked badges — greyscale only, no lock emoji */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-slate-500" />Locked ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {lockedBadges.map((badge) => (
              <div key={badge.id} className="p-3 text-center rounded-lg relative overflow-hidden"
                style={{ background: 'rgba(15,20,35,0.6)', border: '1px solid rgba(71,85,105,0.3)', opacity: 0.45 }}>
                <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <span className="text-xl grayscale">{badge.icon}</span>
                </div>
                <h4 className="font-bold text-slate-400 text-[10px] mb-0.5 line-clamp-1">{badge.title}</h4>
                <p className="text-[8px] text-slate-600 font-medium line-clamp-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Progress() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
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

  const [showAddGoal, setShowAddGoal] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <Tabs defaultValue="analytics" className="w-full">

        {/* ── Header — exact Gyms page height/font match ── */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b-2 border-blue-700/40 px-3 md:px-4 pt-6 pb-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center h-18">
              <TabsList className="flex justify-between w-full bg-transparent p-0 h-10 gap-0 border-0">
                <TabsTrigger
                  value="analytics"
                  className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-base justify-center"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="goals"
                  className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-base justify-center"
                >
                  <Target className="w-5 h-5 mr-2" />Targets
                </TabsTrigger>
                <TabsTrigger
                  value="rank"
                  className="flex-1 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 data-[state=active]:bg-transparent text-slate-400 hover:text-slate-300 border-b-2 border-transparent rounded-none px-0 py-3 mb-[-2px] transition-colors bg-transparent text-base justify-center"
                >
                  <ClipboardList className="w-5 h-5 mr-2" />Trainer
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </div>

        {/* ── Analytics ── */}
        <TabsContent value="analytics" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto">
            <AnalyticsTab
              currentUser={currentUser}
              workoutLogs={workoutLogs}
              checkIns={checkIns}
            />
          </div>
        </TabsContent>

        {/* ── Targets (goals + rank/badges) ── */}
        <TabsContent value="goals" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowAddGoal(true)} className={btnCyan}>
                  <Plus className="w-3.5 h-3.5" />New Goal
                </button>
              </div>
              <GoalsTab currentUser={currentUser} showAddGoal={showAddGoal} setShowAddGoal={setShowAddGoal} />
            </div>
            <div>
              <RankTab currentUser={currentUser} checkIns={checkIns} />
            </div>
          </div>
        </TabsContent>

        {/* ── Trainer (empty — to be populated) ── */}
        <TabsContent value="rank" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto" />
        </TabsContent>

      </Tabs>
    </div>
  );
}