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
  { id: '10_visits',        title: 'Getting Started',  description: '10 gym check-ins',        icon: '🎯', color: 'from-blue-400 to-blue-600'      },
  { id: '50_visits',        title: 'Regular',          description: '50 gym check-ins',        icon: '🔥', color: 'from-orange-400 to-red-500'     },
  { id: '100_visits',       title: 'Dedicated',        description: '100 gym check-ins',       icon: '🏆', color: 'from-yellow-400 to-orange-500'  },
  { id: '7_day_streak',     title: 'Week Warrior',     description: '7-day streak',            icon: '⚡', color: 'from-green-400 to-emerald-500'  },
  { id: '30_day_streak',    title: 'Month Master',     description: '30-day streak',           icon: '🔥', color: 'from-red-400 to-pink-500'       },
  { id: '90_day_streak',    title: 'Consistency King', description: '90-day streak',           icon: '👑', color: 'from-purple-400 to-pink-500'    },
  { id: '1_year',           title: 'One Year Strong',  description: '1 year membership',       icon: '📅', color: 'from-indigo-400 to-blue-500'    },
  { id: 'community_leader', title: 'Community Leader', description: 'Active community member', icon: '👥', color: 'from-cyan-400 to-blue-500'      },
];

// ─── Rank sub-page ─────────────────────────────────────────────────────────────
function RankPage({ currentUser, onBack, checkIns = [] }) {
  const [equippedBadges, setEquippedBadges] = useState(currentUser?.equipped_badges || []);
  const userStats = {
    total_check_ins: checkIns.length,
    longest_streak:  currentUser?.longest_streak || 0,
    gym_join_date:   currentUser?.created_date,
  };
  const isBadgeEarned = (id) => {
    switch (id) {
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
  const earnedBadges         = BADGE_LIBRARY.filter(b => isBadgeEarned(b.id));
  const lockedBadges         = BADGE_LIBRARY.filter(b => !isBadgeEarned(b.id));
  const equippedBadgeDetails = earnedBadges.filter(b => equippedBadges.includes(b.id));
  const handleEquipBadge     = async (badgeId) => {
    let n = [...equippedBadges];
    if (n.includes(badgeId)) n = n.filter(id => id !== badgeId);
    else { if (n.length >= 3) n.shift(); n.push(badgeId); }
    setEquippedBadges(n);
    await base44.auth.updateMe({ equipped_badges: n });
  };
  return (
    <SubPage title="Rank" onBack={onBack}>
      {equippedBadgeDetails.length > 0 && (
        <div className="rounded-2xl p-3 bg-gradient-to-br from-amber-600/20 via-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-amber-400/40 shadow-lg mb-4">
          <h3 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-400" />Showcase</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {equippedBadgeDetails.map((badge) => (
              <div key={badge.id} className={`relative p-2 rounded-lg bg-gradient-to-br ${badge.color} border border-white/30 shadow-md`}>
                <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm"><CheckCircle className="w-2 h-2 text-amber-900" strokeWidth={3} /></div>
                <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"><span className="text-lg">{badge.icon}</span></div>
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
                  {isEquipped && <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm z-10"><CheckCircle className="w-2.5 h-2.5 text-amber-900" strokeWidth={3} /></div>}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30 relative"><span className="text-xl drop-shadow-lg z-10">{badge.icon}</span></div>
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
// ─── ILLUSTRATIONS — clean glowing neon on dark, iOS emoji style ───────────────
//     Key: simple shapes + rich gradient fills + soft bloom glow underneath
//     No complex geometry. Light comes from top-left. Glow pools at base.
// ═══════════════════════════════════════════════════════════════════════════════

// Analytics — ascending bars + magenta trend arrow (matches reference closely)
function AnalyticsIllustration() {
  // Four bars: [x, width, height]  — all share base y=88
  const bars = [
    { x: 8,  w: 18, h: 22 },
    { x: 30, w: 18, h: 38 },
    { x: 52, w: 18, h: 54 },
    { x: 74, w: 18, h: 70 },
  ];
  const base = 88;

  return (
    <svg width="96" height="78" viewBox="0 0 110 90" fill="none">
      <defs>
        {/* Per-bar gradient: bright at top, deep at bottom */}
        {bars.map((_, i) => (
          <linearGradient key={i} id={`b${i}`} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#e879f9" stopOpacity="0.95"/>
            <stop offset="40%"  stopColor="#a855f7"/>
            <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.9"/>
          </linearGradient>
        ))}
        {/* Bar inner highlight (left edge shine) */}
        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="white" stopOpacity="0.22"/>
          <stop offset="35%"  stopColor="white" stopOpacity="0.06"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        {/* Arrow gradient */}
        <linearGradient id="arr" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#c026d3"/>
          <stop offset="100%" stopColor="#f5d0fe"/>
        </linearGradient>
        {/* Bloom filter */}
        <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softbloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9"/>
        </filter>
        <filter id="arrglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5"/>
        </filter>
      </defs>

      {/* Floor glow — pools of light under each bar */}
      {bars.map((b, i) => (
        <ellipse key={i} cx={b.x + b.w / 2} cy={base + 2} rx={b.w * 0.7} ry={4}
          fill="#a855f7" filter="url(#softbloom)" opacity={0.5 + i * 0.1}/>
      ))}

      {/* Bars */}
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={base - b.h} width={b.w} height={b.h}
            rx={3} fill={`url(#b${i})`}/>
          {/* Left-edge shine */}
          <rect x={b.x} y={base - b.h} width={b.w} height={b.h}
            rx={3} fill="url(#shine)"/>
          {/* Top cap highlight */}
          <rect x={b.x + 2} y={base - b.h} width={b.w - 4} height={4}
            rx={2} fill="white" opacity="0.18"/>
        </g>
      ))}

      {/* Arrow glow pass */}
      <polyline
        points={bars.map(b => `${b.x + b.w / 2},${base - b.h - 6}`).join(' ')}
        stroke="#d946ef" strokeWidth="5" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
        filter="url(#arrglow)" opacity="0.6"/>

      {/* Arrow line */}
      <polyline
        points={bars.map(b => `${b.x + b.w / 2},${base - b.h - 6}`).join(' ')}
        stroke="url(#arr)" strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round"/>

      {/* Arrowhead */}
      {(() => {
        const last = bars[bars.length - 1], prev = bars[bars.length - 2];
        const ex = last.x + last.w / 2, ey = base - last.h - 6;
        const px = prev.x + prev.w / 2, py = base - prev.h - 6;
        const a = Math.atan2(ey - py, ex - px), L = 10, sp = 0.44;
        return (
          <polygon
            points={`${ex},${ey} ${ex - L*Math.cos(a-sp)},${ey - L*Math.sin(a-sp)} ${ex - L*Math.cos(a+sp)},${ey - L*Math.sin(a+sp)}`}
            fill="#f5d0fe"
          />
        );
      })()}
    </svg>
  );
}

// Workout Split — glowing dumbbell, blue/indigo
function SplitIllustration() {
  return (
    <svg width="96" height="78" viewBox="0 0 110 90" fill="none">
      <defs>
        <linearGradient id="sp-plate" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%"   stopColor="#c7d2fe"/>
          <stop offset="40%"  stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#3730a3"/>
        </linearGradient>
        <linearGradient id="sp-bar" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%"   stopColor="#e0e7ff"/>
          <stop offset="50%"  stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#312e81"/>
        </linearGradient>
        <linearGradient id="sp-collar" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%"   stopColor="#e0e7ff"/>
          <stop offset="100%" stopColor="#4f46e5"/>
        </linearGradient>
        <linearGradient id="sp-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <filter id="sp-bloom" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="9"/>
        </filter>
        <filter id="sp-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4"/>
        </filter>
      </defs>

      {/* Bloom */}
      <ellipse cx="55" cy="70" rx="46" ry="10" fill="#6366f1" filter="url(#sp-bloom)" opacity="0.75"/>

      {/* LEFT PLATE */}
      <rect x="4"  y="28" width="22" height="36" rx="5" fill="url(#sp-plate)"/>
      <rect x="4"  y="28" width="22" height="16" rx="5" fill="url(#sp-shine)"/>
      {/* Left plate subtle edge lines */}
      {[34,38,42,46,50,54].map(y => (
        <line key={y} x1="5" y1={y} x2="25" y2={y} stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
      ))}

      {/* LEFT COLLAR */}
      <rect x="26" y="34" width="8" height="24" rx="2" fill="url(#sp-collar)"/>
      <rect x="26" y="34" width="8" height="10" rx="2" fill="url(#sp-shine)"/>

      {/* HANDLE */}
      <rect x="34" y="38" width="44" height="16" rx="4" fill="url(#sp-bar)"/>
      <rect x="34" y="38" width="44" height="7"  rx="4" fill="url(#sp-shine)"/>
      {/* Knurling */}
      {[44,51,58,65,72].map(x => (
        <line key={x} x1={x} y1="39" x2={x} y2="53" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2"/>
      ))}

      {/* RIGHT COLLAR */}
      <rect x="78" y="34" width="8" height="24" rx="2" fill="url(#sp-collar)"/>
      <rect x="78" y="34" width="8" height="10" rx="2" fill="url(#sp-shine)"/>

      {/* RIGHT PLATE */}
      <rect x="86" y="28" width="22" height="36" rx="5" fill="url(#sp-plate)"/>
      <rect x="86" y="28" width="22" height="16" rx="5" fill="url(#sp-shine)"/>
      {[34,38,42,46,50,54].map(y => (
        <line key={y} x1="87" y1={y} x2="107" y2={y} stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
      ))}

      {/* Glow around handle */}
      <rect x="34" y="38" width="44" height="16" rx="4" fill="#818cf8"
        filter="url(#sp-glow)" opacity="0.4"/>
    </svg>
  );
}

// Goals — glowing bullseye target, cyan/blue with gold arrow
function GoalsIllustration() {
  const cx = 52, cy = 52;
  const rings = [
    { r: 40, fill: '#0284c7' },
    { r: 30, fill: '#0ea5e9' },
    { r: 20, fill: '#38bdf8' },
    { r: 11, fill: '#7dd3fc' },
    { r:  4, fill: '#ffffff' },
  ];
  return (
    <svg width="96" height="78" viewBox="0 0 110 90" fill="none">
      <defs>
        <radialGradient id="gls-r0" cx="38%" cy="32%">
          <stop offset="0%"   stopColor="#bae6fd"/>
          <stop offset="100%" stopColor="#0369a1"/>
        </radialGradient>
        <radialGradient id="gls-r1" cx="38%" cy="32%">
          <stop offset="0%"   stopColor="#7dd3fc"/>
          <stop offset="100%" stopColor="#0284c7"/>
        </radialGradient>
        <radialGradient id="gls-r2" cx="38%" cy="32%">
          <stop offset="0%"   stopColor="#bae6fd"/>
          <stop offset="100%" stopColor="#0ea5e9"/>
        </radialGradient>
        <radialGradient id="gls-r3" cx="38%" cy="32%">
          <stop offset="0%"   stopColor="#e0f2fe"/>
          <stop offset="100%" stopColor="#38bdf8"/>
        </radialGradient>
        <radialGradient id="gls-r4" cx="40%" cy="35%">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="100%" stopColor="#bae6fd"/>
        </radialGradient>
        <linearGradient id="gls-arr" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#d97706"/>
          <stop offset="100%" stopColor="#fef3c7"/>
        </linearGradient>
        <filter id="gls-bloom" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="10"/>
        </filter>
        <filter id="gls-arrglow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>

      {/* Bloom */}
      <circle cx={cx} cy={cy} r="40" fill="#0ea5e9" filter="url(#gls-bloom)" opacity="0.45"/>

      {/* Rings — back to front with radial gradient for 3D sphere effect */}
      <circle cx={cx} cy={cy} r="40" fill="url(#gls-r0)"/>
      <circle cx={cx} cy={cy} r="30" fill="url(#gls-r1)"/>
      <circle cx={cx} cy={cy} r="20" fill="url(#gls-r2)"/>
      <circle cx={cx} cy={cy} r="11" fill="url(#gls-r3)"/>
      <circle cx={cx} cy={cy} r=" 4" fill="url(#gls-r4)"/>

      {/* Ring separators (thin gaps) */}
      {[40, 30, 20, 11].map(r => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5"/>
      ))}

      {/* Arrow glow */}
      <line x1="105" y1="10" x2={cx + 3} y2={cy - 2}
        stroke="#fbbf24" strokeWidth="5" strokeLinecap="round"
        filter="url(#gls-arrglow)" opacity="0.5"/>
      {/* Arrow shaft */}
      <line x1="105" y1="10" x2={cx + 3} y2={cy - 2}
        stroke="url(#gls-arr)" strokeWidth="3" strokeLinecap="round"/>
      {/* Fletching */}
      <polygon points="105,10 98,6 100,15" fill="#fef3c7" opacity="0.95"/>
      {/* Tip */}
      <polygon points={`${cx+3},${cy-2} ${cx+11},${cy-9} ${cx+10},${cy+6}`} fill="#fef3c7"/>
    </svg>
  );
}

// Community — three glowing people, green/emerald
function CommunityIllustration() {
  return (
    <svg width="96" height="78" viewBox="0 0 110 90" fill="none">
      <defs>
        <radialGradient id="cm-hc" cx="38%" cy="30%">
          <stop offset="0%"   stopColor="#a7f3d0"/>
          <stop offset="100%" stopColor="#047857"/>
        </radialGradient>
        <radialGradient id="cm-hs" cx="38%" cy="30%">
          <stop offset="0%"   stopColor="#6ee7b7"/>
          <stop offset="100%" stopColor="#065f46"/>
        </radialGradient>
        <linearGradient id="cm-bc" x1="0.35" y1="0" x2="0.65" y2="1">
          <stop offset="0%"   stopColor="#6ee7b7"/>
          <stop offset="100%" stopColor="#064e3b"/>
        </linearGradient>
        <linearGradient id="cm-bs" x1="0.35" y1="0" x2="0.65" y2="1">
          <stop offset="0%"   stopColor="#34d399"/>
          <stop offset="100%" stopColor="#064e3b"/>
        </linearGradient>
        <linearGradient id="cm-shine" x1="0.2" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <filter id="cm-bloom" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="9"/>
        </filter>
      </defs>

      {/* Floor bloom */}
      <ellipse cx="55" cy="83" rx="50" ry="9" fill="#10b981" filter="url(#cm-bloom)" opacity="0.7"/>

      {/* ── LEFT PERSON (smaller, behind) ── */}
      {/* Body */}
      <path d="M12,84 Q12,62 24,60 Q36,62 36,84 Z" fill="url(#cm-bs)"/>
      {/* Head */}
      <circle cx="24" cy="50" r="11" fill="url(#cm-hs)"/>
      <circle cx="24" cy="50" r="11" fill="url(#cm-shine)"/>

      {/* ── RIGHT PERSON (smaller, behind) ── */}
      <path d="M74,84 Q74,62 86,60 Q98,62 98,84 Z" fill="url(#cm-bs)"/>
      <circle cx="86" cy="50" r="11" fill="url(#cm-hs)"/>
      <circle cx="86" cy="50" r="11" fill="url(#cm-shine)"/>

      {/* ── CENTRE PERSON (front, larger) ── */}
      <path d="M36,86 Q36,56 55,54 Q74,56 74,86 Z" fill="url(#cm-bc)"/>
      {/* Shine on body */}
      <path d="M39,86 Q39,59 50,56 Q46,58 46,86 Z" fill="white" opacity="0.08"/>
      {/* Head */}
      <circle cx="55" cy="40" r="16" fill="url(#cm-hc)"/>
      <circle cx="55" cy="40" r="16" fill="url(#cm-shine)"/>
    </svg>
  );
}

// Rank — glowing trophy, gold/amber
function RankIllustration() {
  return (
    <svg width="96" height="78" viewBox="0 0 110 90" fill="none">
      <defs>
        <radialGradient id="tr-cup" cx="35%" cy="28%">
          <stop offset="0%"   stopColor="#fef3c7"/>
          <stop offset="35%"  stopColor="#fbbf24"/>
          <stop offset="100%" stopColor="#78350f"/>
        </radialGradient>
        <radialGradient id="tr-base" cx="35%" cy="25%">
          <stop offset="0%"   stopColor="#fde68a"/>
          <stop offset="100%" stopColor="#92400e"/>
        </radialGradient>
        <radialGradient id="tr-star" cx="42%" cy="30%">
          <stop offset="0%"   stopColor="#fef9c3"/>
          <stop offset="100%" stopColor="#d97706"/>
        </radialGradient>
        <linearGradient id="tr-handle" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%"   stopColor="#fde68a"/>
          <stop offset="100%" stopColor="#b45309"/>
        </linearGradient>
        <linearGradient id="tr-shine" x1="0.15" y1="0" x2="0.4" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <filter id="tr-bloom" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="9"/>
        </filter>
        <filter id="tr-starglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
      </defs>

      {/* Floor bloom */}
      <ellipse cx="55" cy="84" rx="40" ry="8" fill="#f59e0b" filter="url(#tr-bloom)" opacity="0.7"/>

      {/* ── BASE ── */}
      <rect x="34" y="74" width="42" height="10" rx="3" fill="url(#tr-base)"/>
      <rect x="34" y="74" width="42" height="4" rx="3" fill="url(#tr-shine)"/>

      {/* ── STEM ── */}
      <rect x="48" y="66" width="14" height="10" rx="2" fill="url(#tr-base)"/>

      {/* ── CUP ── */}
      {/* Main cup shape: wide at top, narrows toward stem */}
      <path d="M22,20 Q22,8 55,6 Q88,8 88,20 L78,66 Q55,72 32,66 Z" fill="url(#tr-cup)"/>
      {/* Shine overlay */}
      <path d="M26,22 Q27,10 48,8 Q40,11 38,28 Z" fill="url(#tr-shine)"/>

      {/* ── HANDLES ── */}
      <path d="M22,26 Q6,26 4,40 Q2,56 20,56 L24,54"
        stroke="url(#tr-handle)" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M22,26 Q6,26 4,40 Q2,56 20,56 L24,54"
        stroke="#fef3c7" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.4"/>
      <path d="M88,26 Q104,26 106,40 Q108,56 90,56 L86,54"
        stroke="url(#tr-handle)" strokeWidth="6" fill="none" strokeLinecap="round"/>
      <path d="M88,26 Q104,26 106,40 Q108,56 90,56 L86,54"
        stroke="#fef3c7" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.4"/>

      {/* ── STAR ── */}
      {/* Glow pass */}
      <polygon points="55,18 58.5,28 69,28 61,34 64,44 55,38 46,44 49,34 41,28 51.5,28"
        fill="#fbbf24" filter="url(#tr-starglow)" opacity="0.7"/>
      {/* Star */}
      <polygon points="55,18 58.5,28 69,28 61,34 64,44 55,38 46,44 49,34 41,28 51.5,28"
        fill="url(#tr-star)"/>
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
      {/* Illustration */}
      <div className="absolute top-0 right-0 pointer-events-none" style={{ opacity: 0.95 }}>
        <Illustration/>
      </div>
      {/* Content */}
      <div className="relative flex flex-col gap-1.5" style={{ maxWidth: '60%' }}>
        <span className="text-[15px] font-black text-white tracking-tight">{label}</span>
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

  const activeGoals    = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const cards = [
    {
      id: 'analytics',
      label: 'Analytics',
      subtitle: `${workoutLogs.length} sessions logged`,
      description: 'Dive into your performance data, track personal records, and see how your lifts have progressed over time.',
      icon: BarChart3, iconColor: '#e879f9', iconBg: 'rgba(168,85,247,0.18)',
      accentColor: '#d946ef', accentBorder: 'rgba(168,85,247,0.45)', glowColor: 'rgba(168,85,247,0.35)',
      illustration: AnalyticsIllustration,
    },
    {
      id: 'split',
      label: 'Workout Split',
      subtitle: currentUser?.custom_split_name || (currentUser?.workout_split ? 'Active split' : 'No split set'),
      description: "View your weekly training schedule, heatmap, and track which sessions you've completed.",
      icon: Dumbbell, iconColor: '#818cf8', iconBg: 'rgba(99,102,241,0.18)',
      accentColor: '#a5b4fc', accentBorder: 'rgba(99,102,241,0.45)', glowColor: 'rgba(99,102,241,0.35)',
      illustration: SplitIllustration,
    },
    {
      id: 'goals',
      label: 'Goals',
      subtitle: `${activeGoals.length} active · ${completedGoals.length} completed`,
      description: 'Set targets, log milestones, and track your progress toward every fitness goal you set.',
      icon: Target, iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.18)',
      accentColor: '#93c5fd', accentBorder: 'rgba(59,130,246,0.45)', glowColor: 'rgba(59,130,246,0.35)',
      illustration: GoalsIllustration,
    },
    {
      id: 'community',
      label: 'Community',
      subtitle: gymMemberships.length === 1 ? '1 gym joined' : `${gymMemberships.length} gyms joined`,
      description: "See the leaderboard, check who's training today, and stay motivated with your gym crew.",
      icon: Users, iconColor: '#34d399', iconBg: 'rgba(16,185,129,0.18)',
      accentColor: '#6ee7b7', accentBorder: 'rgba(16,185,129,0.45)', glowColor: 'rgba(16,185,129,0.35)',
      illustration: CommunityIllustration,
      isLink: true, href: createPageUrl('Community'),
    },
    {
      id: 'rank',
      label: 'Rank',
      subtitle: 'Badges & achievements',
      description: 'Earn badges for hitting milestones, consistency streaks, and personal records across your training journey.',
      icon: Award, iconColor: '#fbbf24', iconBg: 'rgba(245,158,11,0.18)',
      accentColor: '#fde68a', accentBorder: 'rgba(245,158,11,0.45)', glowColor: 'rgba(245,158,11,0.35)',
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
