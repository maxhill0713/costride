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

// ─── Decorative SVG illustrations ─────────────────────────────────────────────
function AnalyticsIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none">
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
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none">
      <rect x="42" y="42" width="36" height="12" rx="6" fill="url(#si1)" />
      <rect x="12" y="28" width="18" height="40" rx="7" fill="url(#si2)" />
      <rect x="30" y="34" width="12" height="28" rx="4" fill="url(#si3)" />
      <rect x="90" y="28" width="18" height="40" rx="7" fill="url(#si2)" />
      <rect x="78" y="34" width="12" height="28" rx="4" fill="url(#si3)" />
      <circle cx="60" cy="48" r="5" fill="#818cf8" opacity="0.7" />
      {[10,24,38,52,66,80,94,108].map((x, i) => (
        <circle key={i} cx={x} cy="88" r="5"
          fill={i < 5 ? '#6366f1' : 'rgba(99,102,241,0.18)'}
          opacity={i < 5 ? 0.9 : 0.5}
        />
      ))}
      <defs>
        <linearGradient id="si1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#818cf8"/></linearGradient>
        <linearGradient id="si2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#818cf8" stopOpacity="0.9"/><stop offset="100%" stopColor="#4338ca" stopOpacity="0.4"/></linearGradient>
        <linearGradient id="si3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.8"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0.35"/></linearGradient>
      </defs>
    </svg>
  );
}

function GoalsIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none">
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
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none">
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
        style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)' }} />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 25% 35%, ${glowColor} 0%, transparent 60%)`, opacity: pressed ? 0.22 : 0.09, transition: 'opacity 0.1s ease' }} />

      {/* Illustration — top right corner */}
      <div className="absolute top-0 right-0 pointer-events-none" style={{ transform: 'translate(6px, -6px)', opacity: 0.85 }}>
        <div style={{ transform: 'scale(0.72)', transformOrigin: 'top right' }}>
          <Illustration />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-col gap-1.5" style={{ maxWidth: '62%' }}>
        {/* Icon + title row */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
          <span className="text-[15px] font-black text-white tracking-tight">{label}</span>
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-[11px] font-bold" style={{ color: accentColor }}>{subtitle}</p>
        )}

        {/* Description */}
        {description && (
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{description}</p>
        )}
      </div>

      {/* Arrow chip bottom-right */}
      <div className="absolute bottom-3 right-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: iconBg, border: `1px solid ${accentBorder}` }}>
          <ChevronRight className="w-3.5 h-3.5" style={{ color: iconColor }} />
        </div>
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

  if (!currentUser) return <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]" />;
  if (view === 'goals')     return <GoalsPage currentUser={currentUser} onBack={() => setView('hub')} />;
  if (view === 'analytics') return <AnalyticsPage currentUser={currentUser} workoutLogs={workoutLogs} onBack={() => setView('hub')} />;
  if (view === 'split')     return <SplitPage currentUser={currentUser} checkIns={checkIns} onBack={() => setView('hub')} />;

  const activeGoals    = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const primaryGymId   = currentUser?.primary_gym_id;
  const weeklyGoal     = currentUser?.weekly_goal || 4;

  const cards = [
    {
      id: 'analytics',
      label: 'Analytics',
      subtitle: `${workoutLogs.length} sessions logged`,
      description: 'Dive into your performance data, track personal records, and see how your lifts have progressed over time.',
      bullets: ['Exercise volume trends', 'Personal records', 'Muscle group breakdown'],
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
      subtitle: currentUser?.custom_split_name || (currentUser?.workout_split ? 'Active split' : 'No split set'),
      description: 'View your weekly training schedule, heatmap, and track which sessions you\'ve completed.',
      bullets: ['Weekly heatmap view', 'Rest day tracking', 'Split progress'],
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
      subtitle: `${activeGoals.length} active · ${completedGoals.length} completed`,
      description: 'Set targets, log milestones, and track your progress toward every fitness goal you set.',
      bullets: ['Custom targets & units', 'Milestone tracking', 'Progress reminders'],
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
      subtitle: gymMemberships.length === 1 ? '1 gym joined' : `${gymMemberships.length} gyms joined`,
      description: 'See the leaderboard, check who\'s training today, and stay motivated with your gym crew.',
      bullets: ['Live check-in feed', 'Weekly leaderboard', 'Busy times chart'],
      icon: Users,
      iconColor: '#34d399',
      iconBg: 'rgba(16,185,129,0.18)',
      accentColor: '#6ee7b7',
      accentBorder: 'rgba(16,185,129,0.45)',
      glowColor: 'rgba(16,185,129,0.35)',
      illustration: CommunityIllustration,
      isLink: true,
      href: primaryGymId ? createPageUrl('GymCommunity') + `?id=${primaryGymId}` : createPageUrl('Gyms'),
    },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)]">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-32 space-y-3">
        <h1 className="text-xl font-black text-white tracking-tight mb-1">Progress</h1>
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