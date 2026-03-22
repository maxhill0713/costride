import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Target, CheckCircle, BarChart3, ClipboardList, TrendingUp, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddGoalModal from '../components/goals/AddGoalModal';
import GoalCard from '../components/goals/GoalCard';
import ExerciseInsights from '../components/profile/ExerciseInsights';
import WorkoutSplitHeatmap from '../components/profile/WorkoutSplitHeatmap';
import ProgressiveOverloadTracker from '../components/profile/ProgressiveOverloadTracker';
import WeeklyVolumeChart from '../components/profile/WeeklyVolumeChart';

// ─── Shared styles ────────────────────────────────────────────────────────────
const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const btnNewGoal = "bg-slate-900/80 border border-slate-500/50 text-slate-400 font-bold rounded-full px-4 py-2 flex items-center gap-1.5 justify-center shadow-[0_5px_0_0_#172033,0_8px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 text-xs transform-gpu";

const sectionTitle = { fontSize: 16, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 };

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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-slate-700/60 flex items-center justify-center mb-4">
            <Target className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-base font-bold text-white mb-1">No Goals Yet</p>
          <p className="text-sm text-slate-500 mb-5">Set your first fitness goal and start tracking.</p>
          <button onClick={() => setShowAddGoal(true)} className={btnNewGoal}>
            <Plus className="w-3.5 h-3.5" />Create a Goal
          </button>
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

// ─── Medal colours for rank 1/2/3 ────────────────────────────────────────────
const MEDAL = ['#f59e0b', '#94a3b8', '#cd7c3a'];

// ─── Community Lift Rankings section ─────────────────────────────────────────
function CommunityLiftRankings({ currentUser }) {
  const primaryGymId = currentUser?.primary_gym_id;

  // Fetch gym info for the name
  const { data: gym } = useQuery({
    queryKey: ['gym', primaryGymId],
    queryFn: () => base44.entities.Gym.filter({ id: primaryGymId }).then(r => r[0] || null),
    enabled: !!primaryGymId,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch recent check-ins for this gym (last 30 days) to build a leaderboard
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: gymCheckIns = [], isLoading } = useQuery({
    queryKey: ['gymCheckIns', primaryGymId],
    queryFn: () => base44.entities.CheckIn.filter(
      { gym_id: primaryGymId, check_in_date: { $gte: thirtyDaysAgo } },
      '-check_in_date',
      500
    ),
    enabled: !!primaryGymId,
    staleTime: 3 * 60 * 1000,
  });

  // Build ranked leaderboard: aggregate check-ins per user
  const leaderboard = useMemo(() => {
    const map = {};
    gymCheckIns.forEach(ci => {
      if (!ci.user_id) return;
      if (!map[ci.user_id]) {
        map[ci.user_id] = {
          user_id: ci.user_id,
          name: ci.user_name || 'Member',
          count: 0,
          isMe: ci.user_id === currentUser?.id,
        };
      }
      map[ci.user_id].count++;
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [gymCheckIns, currentUser?.id]);

  if (!primaryGymId) {
    return (
      <div className="rounded-2xl p-5 text-center" style={CARD}>
        <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-500">No gym set as primary</p>
        <p className="text-xs text-slate-600 mt-1">Set a primary gym to see community rankings</p>
      </div>
    );
  }

  return (
    <div>
      {/* Section header */}
      <div className="mb-3">
        <h2 style={sectionTitle}>Community Lift Rankings</h2>
        {gym?.name && (
          <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0', fontWeight: 500 }}>
            {gym.name}
          </p>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden" style={CARD}>
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-10">
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(96,165,250,0.2)', borderTopColor: '#60a5fa', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ color: '#475569', fontSize: 12 }}>Loading rankings…</span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-500">No activity yet this month</p>
            <p className="text-xs text-slate-600 mt-1">Check in at your gym to appear on the leaderboard</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {leaderboard.map((entry, idx) => {
              const isMe = entry.isMe;
              const medal = MEDAL[idx];
              return (
                <div
                  key={entry.user_id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    background: isMe ? 'rgba(96,165,250,0.07)' : 'transparent',
                  }}
                >
                  {/* Rank */}
                  <div style={{
                    width: 24, flexShrink: 0, textAlign: 'center',
                    fontSize: idx < 3 ? 16 : 11,
                    fontWeight: 700,
                    color: medal || '#475569',
                  }}>
                    {idx < 3 ? ['🥇','🥈','🥉'][idx] : `${idx + 1}`}
                  </div>

                  {/* Avatar initial */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: isMe
                      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                      : 'rgba(255,255,255,0.06)',
                    border: isMe ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isMe ? '#fff' : '#94a3b8' }}>
                      {entry.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name */}
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: isMe ? 700 : 500,
                    color: isMe ? '#e2e8f0' : '#94a3b8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {entry.name}{isMe ? ' (you)' : ''}
                  </span>

                  {/* Check-in count */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: idx === 0 ? '#f59e0b' : isMe ? '#60a5fa' : '#64748b',
                    }}>
                      {entry.count}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 500, color: '#475569' }}>
                      {entry.count === 1 ? 'visit' : 'visits'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        {leaderboard.length > 0 && (
          <div style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: 10, fontWeight: 500, color: '#334155',
            textAlign: 'center',
          }}>
            Based on gym check-ins in the last 30 days
          </div>
        )}
      </div>
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

        {/* ── Header ── */}
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
            <AnalyticsTab currentUser={currentUser} workoutLogs={workoutLogs} checkIns={checkIns} />
          </div>
        </TabsContent>

        {/* ── Targets ── */}
        <TabsContent value="goals" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Personal Goals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 style={sectionTitle}>Personal Goals</h2>
                <button onClick={() => setShowAddGoal(true)} className={btnNewGoal}>
                  <Plus className="w-3.5 h-3.5" />New Goal
                </button>
              </div>
              <GoalsTab currentUser={currentUser} showAddGoal={showAddGoal} setShowAddGoal={setShowAddGoal} />
            </div>

            {/* Community Lift Rankings */}
            <CommunityLiftRankings currentUser={currentUser} />

          </div>
        </TabsContent>

        {/* ── Trainer (empty) ── */}
        <TabsContent value="rank" className="mt-0 px-3 md:px-4 py-5">
          <div className="max-w-4xl mx-auto" />
        </TabsContent>

      </Tabs>
    </div>
  );
}