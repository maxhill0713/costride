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
import StrengthProgress from '../components/profile/StrengthProgress';

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
            <button onClick={onBack} className="p-2 -ml-2 text-white/70 hover:text-white active:scale-90 active:opacity-60 transition-all duration-100 transform-gpu">
              <ChevronRight className="w-6 h-6 rotate-180" />
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
  const activeGoals    = goals.filter((g) => g.status === 'active');
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
      <WorkoutProgressTracker currentUser={currentUser} />
    </SubPage>
  );
}

// ─── Analytics sub-page ───────────────────────────────────────────────────────
function AnalyticsPage({ currentUser, workoutLogs, onBack }) {
  return (
    <SubPage title="Analytics" onBack={onBack}>
      <StrengthProgress currentUser={currentUser} />
      <div className="mt-6">
        <ExerciseInsights workoutLogs={workoutLogs} workoutSplit={currentUser?.custom_workout_types} trainingDays={currentUser?.training_days} />
      </div>
    </SubPage>
  );
}

// ─── Badge definitions & logic ────────────────────────────────────────────────
const BADGE_LIBRARY = [
  { id: '10_visits',       title: 'Getting Started',   description: '10 gym check-ins',        icon: '🎯', color: 'from-blue-400 to-blue-600'       },
  { id: '50_visits',       title: 'Regular',           description: '50 gym check-ins',        icon: '🔥', color: 'from-orange-400 to-red-500'      },
  { id: '100_visits',      title: 'Dedicated',         description: '100 gym check-ins',       icon: '🏆', color: 'from-yellow-400 to-orange-500'   },
  { id: '7_day_streak',    title: 'Week Warrior',      description: '7-day streak',            icon: '⚡', color: 'from-green-400 to-emerald-500'   },
  { id: '30_day_streak',   title: 'Month Master',      description: '30-day streak',           icon: '🔥', color: 'from-red-400 to-pink-500'        },
  { id: '90_day_streak',   title: 'Consistency King',  description: '90-day streak',           icon: '👑', color: 'from-purple-400 to-pink-500'     },
  { id: '1_year',          title: 'One Year Strong',   description: '1 year membership',       icon: '📅', color: 'from-indigo-400 to-blue-500'     },
  { id: 'community_leader',title: 'Community Leader',  description: 'Active community member', icon: '👥', color: 'from-cyan-400 to-blue-500'       },
];

// ─── Rank sub-page ─────────────────────────────────────────────────────────────
function RankPage({ currentUser, onBack, checkIns = [] }) {
  const [equippedBadges, setEquippedBadges] = useState(currentUser?.equipped_badges || []);
  const userStats = {
    total_check_ins: checkIns.length,
    longest_streak:  currentUser?.longest_streak || 0,
    current_streak:  currentUser?.current_streak || 0,
    gym_join_date:   currentUser?.created_date,
  };
  const isBadgeEarned = (badgeId) => {
    switch (badgeId) {
      case '10_visits':        return userStats.total_check_ins >= 10;
      case '50_visits':        return userStats.total_check_ins >= 50;
      case '100_visits':       return userStats.total_check_ins >= 100;
      case '7_day_streak':     return userStats.longest_streak >= 7;
      case '30_day_streak':    return userStats.longest_streak >= 30;
      case '90_day_streak':    return userStats.longest_streak >= 90;
      case '1_year':           return userStats.gym_join_date && Math.floor((new Date() - new Date(userStats.gym_join_date)) / (1000*60*60*24)) >= 365;
      case 'community_leader': return userStats.total_check_ins >= 20;
      default: return false;
    }
  };
  const earnedBadges      = BADGE_LIBRARY.filter(b => isBadgeEarned(b.id));
  const lockedBadges      = BADGE_LIBRARY.filter(b => !isBadgeEarned(b.id));
  const equippedBadgeDetails = earnedBadges.filter(b => equippedBadges.includes(b.id));
  const handleEquipBadge  = async (badgeId) => {
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
          <h3 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-400" />Showcase</h3>
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
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-400" />Earned ({earnedBadges.length})</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {earnedBadges.map((badge) => {
              const isEquipped = equippedBadges.includes(badge.id);
              return (
                <button key={badge.id} onClick={() => handleEquipBadge(badge.id)}
                  className={`p-3 text-center bg-gradient-to-br ${badge.color} border rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group cursor-pointer ${isEquipped ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/20 hover:border-white/40'}`}>
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
          <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-slate-400" />Locked ({lockedBadges.length})</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {lockedBadges.map((badge) => (
              <div key={badge.id} className="p-3 text-center bg-slate-900/70 backdrop-blur-sm border border-dashed border-slate-700/50 rounded-lg relative overflow-hidden cursor-not-allowed">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
                <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-slate-800/50 flex items-center justify-center shadow-sm relative opacity-40">
                  <span className="text-xl">{badge.icon}</span>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm">🔒</span></div>
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

// ═══════════════════════════════════════════════════════════════════════════════
// ─── 3D ILLUSTRATIONS (iOS-style, glowing neon) ────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Analytics — ascending 3D bars + magenta trend arrow (matches reference exactly)
function AnalyticsIllustration() {
  const bars = [
    { x: 6,  base: 86, w: 16, h: 20 },
    { x: 27, base: 86, w: 16, h: 34 },
    { x: 48, base: 86, w: 16, h: 50 },
    { x: 69, base: 86, w: 16, h: 66 },
  ];
  const d = 8;
  const fronts = ['#6d28d9','#7c3aed','#9333ea','#a855f7'];
  const sides  = ['#4c1d95','#5b21b6','#6d28d9','#7c3aed'];
  const tops   = ['#a78bfa','#c084fc','#d8b4fe','#ede9fe'];
  const trendPts = bars.map(b => `${b.x + b.w/2},${b.base - b.h - 5}`).join(' ');

  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <defs>
        <filter id="ab-bg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <filter id="ab-arr" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
        {bars.map((_, i) => (
          <linearGradient key={i} id={`abf${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tops[i]} stopOpacity="0.95"/>
            <stop offset="100%" stopColor={fronts[i]}/>
          </linearGradient>
        ))}
        <linearGradient id="ab-arrow" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#c026d3"/>
          <stop offset="100%" stopColor="#f5d0fe"/>
        </linearGradient>
        <linearGradient id="ab-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Ambient bloom */}
      <ellipse cx="56" cy="84" rx="54" ry="10" fill="#7c3aed" filter="url(#ab-bg)" opacity="0.8"/>

      {bars.map((b, i) => {
        const { x, base, w, h } = b;
        const fy = base - h;
        return (
          <g key={i}>
            {/* Right depth face */}
            <polygon
              points={`${x+w},${fy} ${x+w+d},${fy-d} ${x+w+d},${base-d} ${x+w},${base}`}
              fill={sides[i]} opacity="0.9"
            />
            {/* Front face */}
            <rect x={x} y={fy} width={w} height={h} fill={`url(#abf${i})`} rx="2"/>
            {/* Shine */}
            <rect x={x} y={fy} width={w} height={h * 0.45} fill="url(#ab-shine)" rx="2"/>
            {/* Top face */}
            <polygon
              points={`${x},${fy} ${x+d},${fy-d} ${x+w+d},${fy-d} ${x+w},${fy}`}
              fill={tops[i]} opacity="0.95"
            />
          </g>
        );
      })}

      {/* Trend line glow */}
      <polyline points={trendPts} stroke="#e879f9" strokeWidth="5" fill="none"
        strokeLinecap="round" strokeLinejoin="round" filter="url(#ab-arr)" opacity="0.5"/>
      {/* Trend line */}
      <polyline points={trendPts} stroke="url(#ab-arrow)" strokeWidth="2.8" fill="none"
        strokeLinecap="round" strokeLinejoin="round"/>
      {/* Arrow head */}
      {(() => {
        const last = bars[bars.length - 1], prev = bars[bars.length - 2];
        const ex = last.x + last.w/2, ey = last.base - last.h - 5;
        const px = prev.x + prev.w/2, py = prev.base - prev.h - 5;
        const ang = Math.atan2(ey - py, ex - px), al = 11, sp = 0.42;
        return (
          <polygon
            points={`${ex},${ey} ${ex - al*Math.cos(ang-sp)},${ey - al*Math.sin(ang-sp)} ${ex - al*Math.cos(ang+sp)},${ey - al*Math.sin(ang+sp)}`}
            fill="#f5d0fe"
          />
        );
      })()}
    </svg>
  );
}

// Workout Split — 3D dumbbell (blue/indigo)
function SplitIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <defs>
        <filter id="db-bg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <linearGradient id="db-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a5b4fc"/>
          <stop offset="100%" stopColor="#4338ca"/>
        </linearGradient>
        <linearGradient id="db-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c7d2fe"/>
          <stop offset="100%" stopColor="#6366f1"/>
        </linearGradient>
        <linearGradient id="db-collar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e0e7ff"/>
          <stop offset="100%" stopColor="#818cf8"/>
        </linearGradient>
        <linearGradient id="db-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Ambient bloom */}
      <ellipse cx="60" cy="70" rx="50" ry="11" fill="#6366f1" filter="url(#db-bg)" opacity="0.75"/>

      {/* ── LEFT PLATE ── */}
      <polygon points="28,30 35,23 35,73 28,80" fill="#3730a3" opacity="0.85"/>
      <rect x="8" y="30" width="20" height="50" rx="3" fill="url(#db-plate)"/>
      <rect x="8" y="30" width="20" height="22" rx="3" fill="url(#db-shine)"/>
      <polygon points="8,30 15,23 35,23 28,30" fill="#c7d2fe" opacity="0.95"/>
      {[38,44,50,56,62].map(y => <line key={y} x1="9" y1={y} x2="27" y2={y} stroke="rgba(0,0,0,0.15)" strokeWidth="1.2"/>)}

      {/* ── LEFT COLLAR ── */}
      <polygon points="28,37 33,31 33,69 28,75" fill="#4338ca" opacity="0.9"/>
      <rect x="28" y="37" width="6" height="36" rx="1" fill="url(#db-collar)"/>
      <polygon points="28,37 33,31 39,31 34,37" fill="#e0e7ff" opacity="0.9"/>

      {/* ── HANDLE ── */}
      <polygon points="34,40 40,34 80,34 74,40" fill="#e0e7ff" opacity="0.85"/>
      <rect x="34" y="40" width="52" height="18" rx="3" fill="url(#db-handle)"/>
      <rect x="34" y="40" width="52" height="8" rx="3" fill="url(#db-shine)"/>
      {[46,53,60,67,74].map(x => <line key={x} x1={x} y1="41" x2={x} y2="57" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2"/>)}

      {/* ── RIGHT COLLAR ── */}
      <polygon points="74,37 79,31 85,31 80,37" fill="#e0e7ff" opacity="0.9"/>
      <rect x="74" y="37" width="6" height="36" rx="1" fill="url(#db-collar)"/>
      <polygon points="80,37 85,31 85,69 80,75" fill="#4338ca" opacity="0.9"/>

      {/* ── RIGHT PLATE ── */}
      <polygon points="86,30 93,23 93,73 86,80" fill="#3730a3" opacity="0.85"/>
      <rect x="86" y="30" width="20" height="50" rx="3" fill="url(#db-plate)"/>
      <rect x="86" y="30" width="20" height="22" rx="3" fill="url(#db-shine)"/>
      <polygon points="86,30 93,23 113,23 106,30" fill="#c7d2fe" opacity="0.95"/>
      {[38,44,50,56,62].map(y => <line key={y} x1="87" y1={y} x2="105" y2={y} stroke="rgba(0,0,0,0.15)" strokeWidth="1.2"/>)}
    </svg>
  );
}

// Goals — 3D bullseye target with gold arrow
function GoalsIllustration() {
  const rings = [
    { rx: 46, ry: 13, front: '#0284c7', edge: '#075985' },
    { rx: 34, ry:  9, front: '#0ea5e9', edge: '#0369a1' },
    { rx: 22, ry:  6, front: '#38bdf8', edge: '#0284c7' },
    { rx: 12, ry:  3.5, front: '#7dd3fc', edge: '#38bdf8' },
    { rx:  4, ry:  1.5, front: '#ffffff', edge: '#bae6fd' },
  ];
  const cx = 56, cy = 60;

  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <defs>
        <filter id="tg-bg"  x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <filter id="tg-arr" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
        <linearGradient id="tg-shine" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="arr-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#d97706"/>
          <stop offset="60%"  stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#fef3c7"/>
        </linearGradient>
      </defs>

      {/* Bloom */}
      <ellipse cx={cx} cy={cy + 8} rx="52" ry="11" fill="#0ea5e9" filter="url(#tg-bg)" opacity="0.65"/>

      {/* Rings back-to-front */}
      {[...rings].reverse().map((r, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy + 5} rx={r.rx} ry={r.ry * 0.65} fill={r.edge} opacity="0.8"/>
          <ellipse cx={cx} cy={cy}     rx={r.rx} ry={r.ry}         fill={r.front}/>
          <ellipse cx={cx - r.rx*0.14} cy={cy - r.ry*0.3} rx={r.rx*0.55} ry={r.ry*0.38} fill="url(#tg-shine)"/>
        </g>
      ))}

      {/* Arrow glow */}
      <line x1="108" y1="12" x2={cx + 2} y2={cy - 1}
        stroke="#fbbf24" strokeWidth="6" strokeLinecap="round" opacity="0.4" filter="url(#tg-arr)"/>
      {/* Arrow shaft */}
      <line x1="108" y1="12" x2={cx + 2} y2={cy - 1}
        stroke="url(#arr-g)" strokeWidth="3.5" strokeLinecap="round"/>
      {/* Fletching */}
      <polygon points="108,12 101,8 103,17" fill="#fef3c7" opacity="0.9"/>
      {/* Tip */}
      <polygon points={`${cx+2},${cy-1} ${cx+10},${cy-8} ${cx+9},${cy+6}`} fill="#fef3c7"/>

      {/* Sparkles */}
      {[[100,6],[114,28],[16,22],[20,80],[102,80]].map(([x,y], i) => (
        <g key={i}>
          <line x1={x-3} y1={y} x2={x+3} y2={y} stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
          <line x1={x} y1={y-3} x2={x} y2={y+3} stroke="#fde68a" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
        </g>
      ))}
    </svg>
  );
}

// Community — 3D people cluster (green/teal)
function CommunityIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <defs>
        <filter id="cm-bg" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <linearGradient id="cm-head-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6ee7b7"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
        <linearGradient id="cm-head-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a7f3d0"/>
          <stop offset="100%" stopColor="#10b981"/>
        </linearGradient>
        <linearGradient id="cm-body-s" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#34d399"/>
          <stop offset="100%" stopColor="#065f46"/>
        </linearGradient>
        <linearGradient id="cm-body-c" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6ee7b7"/>
          <stop offset="100%" stopColor="#047857"/>
        </linearGradient>
        <linearGradient id="cm-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.32"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Bloom */}
      <ellipse cx="60" cy="86" rx="52" ry="10" fill="#10b981" filter="url(#cm-bg)" opacity="0.7"/>

      {/* ── LEFT PERSON ── */}
      <ellipse cx="26" cy="86" rx="13" ry="4" fill="#047857" opacity="0.4"/>
      {/* Body depth */}
      <path d="M38,54 Q43,56 43,86 L38,86 Z" fill="#065f46" opacity="0.7"/>
      {/* Body */}
      <path d="M14,86 Q14,56 26,54 Q38,56 38,86 Z" fill="url(#cm-body-s)" opacity="0.9"/>
      {/* Head depth */}
      <ellipse cx="30" cy="49" rx="10" ry="3.5" fill="#047857" opacity="0.5"/>
      {/* Head */}
      <circle cx="26" cy="40" r="12" fill="url(#cm-head-s)"/>
      <circle cx="22" cy="36" r="6"  fill="url(#cm-shine)"/>

      {/* ── RIGHT PERSON ── */}
      <ellipse cx="94" cy="86" rx="13" ry="4" fill="#047857" opacity="0.4"/>
      <path d="M106,54 Q111,56 111,86 L106,86 Z" fill="#065f46" opacity="0.7"/>
      <path d="M82,86 Q82,56 94,54 Q106,56 106,86 Z" fill="url(#cm-body-s)" opacity="0.9"/>
      <ellipse cx="98" cy="49" rx="10" ry="3.5" fill="#047857" opacity="0.5"/>
      <circle cx="94" cy="40" r="12" fill="url(#cm-head-s)"/>
      <circle cx="90" cy="36" r="6"  fill="url(#cm-shine)"/>

      {/* ── CENTRE PERSON (front, larger) ── */}
      <ellipse cx="60" cy="88" rx="18" ry="5" fill="#047857" opacity="0.5"/>
      {/* Body depth */}
      <path d="M78,50 Q85,53 85,88 L78,88 Z" fill="#065f46" opacity="0.75"/>
      {/* Body */}
      <path d="M42,88 Q42,50 60,48 Q78,50 78,88 Z" fill="url(#cm-body-c)"/>
      {/* Shine on body */}
      <path d="M45,88 Q45,53 55,50 Q53,52 53,88 Z" fill="white" opacity="0.08"/>
      {/* Head depth */}
      <ellipse cx="65" cy="45" rx="14" ry="5" fill="#047857" opacity="0.5"/>
      {/* Head */}
      <circle cx="60" cy="32" r="16" fill="url(#cm-head-c)"/>
      <circle cx="54" cy="26" r="8"  fill="url(#cm-shine)"/>

      {/* Connection lines */}
      <line x1="38" y1="54" x2="46" y2="52" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>
      <line x1="74" y1="52" x2="82" y2="54" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>

      {/* Sparkles */}
      {[[60,14],[108,32],[12,32]].map(([x,y], i) => (
        <g key={i}>
          <line x1={x-2.5} y1={y} x2={x+2.5} y2={y} stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
          <line x1={x} y1={y-2.5} x2={x} y2={y+2.5} stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
        </g>
      ))}
    </svg>
  );
}

// Rank — 3D trophy cup with star (gold/amber)
function RankIllustration() {
  return (
    <svg width="84" height="68" viewBox="0 0 120 96" fill="none">
      <defs>
        <filter id="tr-bg"  x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8"/>
        </filter>
        <filter id="tr-str" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
        <linearGradient id="tr-cup" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%"   stopColor="#fde68a"/>
          <stop offset="45%"  stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#92400e"/>
        </linearGradient>
        <linearGradient id="tr-side" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#b45309"/>
          <stop offset="100%" stopColor="#78350f"/>
        </linearGradient>
        <linearGradient id="tr-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#92400e"/>
        </linearGradient>
        <linearGradient id="tr-shine" x1="0.15" y1="0" x2="0.35" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.45"/>
          <stop offset="55%"  stopColor="white" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id="tr-star" cx="45%" cy="30%">
          <stop offset="0%"   stopColor="#fef9c3"/>
          <stop offset="100%" stopColor="#d97706"/>
        </radialGradient>
      </defs>

      {/* Bloom */}
      <ellipse cx="60" cy="86" rx="46" ry="9" fill="#f59e0b" filter="url(#tr-bg)" opacity="0.72"/>

      {/* ── BASE ── */}
      <polygon points="37,82 43,76 77,76 83,82" fill="#fbbf24" opacity="0.92"/>
      <rect x="37" y="82" width="46" height="8" rx="2" fill="url(#tr-base)"/>
      <polygon points="83,82 89,76 89,90 83,90" fill="#92400e" opacity="0.8"/>

      {/* ── STEM ── */}
      <polygon points="63,74 69,68 69,76 63,82" fill="#b45309" opacity="0.85"/>
      <rect x="51" y="74" width="12" height="8" rx="1" fill="url(#tr-cup)"/>
      <polygon points="51,74 57,68 69,68 63,74" fill="#fde68a" opacity="0.92"/>

      {/* ── CUP BODY ── */}
      {/* Right depth face */}
      <polygon points="80,22 88,16 88,62 80,68" fill="url(#tr-side)" opacity="0.88"/>
      {/* Front face */}
      <path d="M32,22 Q32,10 60,8 Q88,10 88,22 L80,68 Q60,74 40,68 Z" fill="url(#tr-cup)"/>
      {/* Top face */}
      <polygon points="32,22 39,16 81,16 88,22" fill="#fde68a" opacity="0.92"/>
      {/* Shine */}
      <path d="M36,24 Q38,13 54,10 Q46,13 44,27 Z" fill="url(#tr-shine)"/>

      {/* ── HANDLES ── */}
      <path d="M32,28 Q15,28 13,42 Q11,58 28,58 L32,55"
        stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M32,28 Q15,28 13,42 Q11,58 28,58 L32,55"
        stroke="#fde68a" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.55"/>
      <path d="M88,28 Q105,28 107,42 Q109,58 92,58 L88,55"
        stroke="#f59e0b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M88,28 Q105,28 107,42 Q109,58 92,58 L88,55"
        stroke="#fde68a" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.55"/>

      {/* ── STAR ── */}
      <g filter="url(#tr-str)">
        <polygon points="60,18 63.5,28 74,28 66,34 69,44 60,38 51,44 54,34 46,28 56.5,28"
          fill="#fbbf24" opacity="0.6"/>
      </g>
      <polygon points="60,18 63.5,28 74,28 66,34 69,44 60,38 51,44 54,34 46,28 56.5,28"
        fill="url(#tr-star)"/>

      {/* Sparkles */}
      {[[112,12],[16,12],[110,76],[10,76],[60,4]].map(([x,y], i) => (
        <g key={i}>
          <line x1={x-3} y1={y} x2={x+3} y2={y} stroke="#fde68a" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
          <line x1={x} y1={y-3} x2={x} y2={y+3} stroke="#fde68a" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"/>
        </g>
      ))}
    </svg>
  );
}

// ─── Tall nav card ─────────────────────────────────────────────────────────────
function TallCard({ label, subtitle, description, icon: Icon, iconColor, iconBg, accentColor, accentBorder, glowColor, illustration: Illustration, onClick, as: As = 'button', href }) {
  const [pressed, setPressed] = useState(false);
  const events = {
    onMouseDown: () => setPressed(true), onMouseUp: () => setPressed(false),
    onMouseLeave: () => setPressed(false), onTouchStart: () => setPressed(true),
    onTouchEnd: () => setPressed(false), onTouchCancel: () => setPressed(false),
  };
  const inner = (
    <div
      className="relative overflow-hidden rounded-2xl p-4 w-full text-left"
      style={{
        background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
        border: `1px solid ${pressed ? accentBorder : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        transform: pressed ? 'scale(0.977) translateY(2px)' : 'scale(1)',
        boxShadow: pressed
          ? `0 2px 8px rgba(0,0,0,0.5), 0 0 22px 2px ${glowColor}`
          : `0 4px 24px rgba(0,0,0,0.4)`,
        transition: pressed
          ? 'transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease'
          : 'transform 0.22s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.22s ease, border-color 0.22s ease',
      }}
    >
      {/* Top shine */}
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }}/>
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 25% 35%, ${glowColor} 0%, transparent 60%)`, opacity: pressed ? 0.22 : 0.09, transition: 'opacity 0.1s ease' }}/>
      {/* Illustration — top-right */}
      <div className="absolute top-3 right-2 pointer-events-none overflow-hidden" style={{ borderTopRightRadius: 16 }}>
        <Illustration/>
      </div>
      {/* Content */}
      <div className="relative flex flex-col gap-1.5" style={{ maxWidth: '62%' }}>
        <div className="flex items-center">
          <span className="text-[15px] font-black text-white tracking-tight">{label}</span>
        </div>
        {description && (
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>{description}</p>
        )}
      </div>
      {/* Arrow */}
      <div className="absolute bottom-5 right-3">
        <ChevronRight className="w-3.5 h-3.5" style={{ color: iconColor }}/>
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
  if (view === 'goals')     return <GoalsPage     currentUser={currentUser} onBack={() => setView('hub')}/>;
  if (view === 'analytics') return <AnalyticsPage currentUser={currentUser} workoutLogs={workoutLogs} onBack={() => setView('hub')}/>;
  if (view === 'split')     return <SplitPage     currentUser={currentUser} checkIns={checkIns} onBack={() => setView('hub')}/>;
  if (view === 'rank')      return <RankPage      currentUser={currentUser} checkIns={checkIns} onBack={() => setView('hub')}/>;

  const activeGoals  = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const cards = [
    {
      id: 'analytics',
      label: 'Analytics',
      subtitle: `${workoutLogs.length} sessions logged`,
      description: 'Dive into your performance data, track personal records, and see how your lifts have progressed over time.',
      icon: BarChart3,
      iconColor: '#e879f9', iconBg: 'rgba(168,85,247,0.18)',
      accentColor: '#d946ef', accentBorder: 'rgba(168,85,247,0.45)',
      glowColor: 'rgba(168,85,247,0.35)',
      illustration: AnalyticsIllustration,
    },
    {
      id: 'split',
      label: 'Workout Split',
      subtitle: currentUser?.custom_split_name || (currentUser?.workout_split ? 'Active split' : 'No split set'),
      description: "View your weekly training schedule, heatmap, and track which sessions you've completed.",
      icon: Dumbbell,
      iconColor: '#818cf8', iconBg: 'rgba(99,102,241,0.18)',
      accentColor: '#a5b4fc', accentBorder: 'rgba(99,102,241,0.45)',
      glowColor: 'rgba(99,102,241,0.35)',
      illustration: SplitIllustration,
    },
    {
      id: 'goals',
      label: 'Goals',
      subtitle: `${activeGoals.length} active · ${completedGoals.length} completed`,
      description: 'Set targets, log milestones, and track your progress toward every fitness goal you set.',
      icon: Target,
      iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.18)',
      accentColor: '#93c5fd', accentBorder: 'rgba(59,130,246,0.45)',
      glowColor: 'rgba(59,130,246,0.35)',
      illustration: GoalsIllustration,
    },
    {
      id: 'community',
      label: 'Community',
      subtitle: gymMemberships.length === 1 ? '1 gym joined' : `${gymMemberships.length} gyms joined`,
      description: "See the leaderboard, check who's training today, and stay motivated with your gym crew.",
      icon: Users,
      iconColor: '#34d399', iconBg: 'rgba(16,185,129,0.18)',
      accentColor: '#6ee7b7', accentBorder: 'rgba(16,185,129,0.45)',
      glowColor: 'rgba(16,185,129,0.35)',
      illustration: CommunityIllustration,
      isLink: true,
      href: createPageUrl('Community'),
    },
    {
      id: 'rank',
      label: 'Rank',
      subtitle: 'Badges & achievements',
      description: 'Earn badges for hitting milestones, consistency streaks, and personal records across your training journey.',
      icon: Award,
      iconColor: '#fbbf24', iconBg: 'rgba(245,158,11,0.18)',
      accentColor: '#fde68a', accentBorder: 'rgba(245,158,11,0.45)',
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
