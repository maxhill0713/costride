import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Flame, Dumbbell, Calendar, TrendingUp, Users, Star, Medal } from 'lucide-react';
import { differenceInDays } from 'date-fns';

function RankBadge({ pct }) {
  if (pct <= 5) return { label: 'Elite', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.30)', icon: '👑' };
  if (pct <= 15) return { label: 'Top Tier', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.30)', icon: '💎' };
  if (pct <= 35) return { label: 'Strong', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.30)', icon: '⚡' };
  if (pct <= 60) return { label: 'Rising', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.30)', icon: '🔥' };
  return { label: 'Getting There', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.20)', icon: '💪' };
}

function StatCard({ icon: Icon, label, value, subtitle, pct, color }) {
  const badge = RankBadge({ pct });
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (Math.max(0, Math.min(100, 100 - pct)) / 100) * circumference;

  return (
    <div className="rounded-2xl p-4 flex items-center gap-4"
      style={{ background: badge.bg, border: `1px solid ${badge.border}` }}>
      <div className="relative flex-shrink-0">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="36" cy="36" r="30" fill="none" stroke={badge.color} strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x="36" y="36" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 10, fontWeight: 800, fill: badge.color, letterSpacing: '-0.03em' }}>
            Top {pct}%
          </text>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: badge.color }} />
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: badge.color }}>{label}</p>
        </div>
        <p className="text-xl font-black text-white leading-none">{value}</p>
        {subtitle && <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#64748b' }}>{subtitle}</p>}
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-sm">{badge.icon}</span>
          <span className="text-[11px] font-bold" style={{ color: badge.color }}>{badge.label}</span>
        </div>
      </div>
    </div>
  );
}

export default function CommunityRank() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const gymId = urlParams.get('id');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const resolvedGymId = gymId || currentUser?.primary_gym_id || gymMemberships[0]?.gym_id;

  const { data: gym } = useQuery({
    queryKey: ['gym', resolvedGymId],
    queryFn: () => base44.entities.Gym.filter({ id: resolvedGymId }).then(r => r[0]),
    enabled: !!resolvedGymId,
    staleTime: 10 * 60 * 1000,
  });

  // All members in this gym
  const { data: allMemberships = [], isLoading: membersLoading } = useQuery({
    queryKey: ['allGymMemberships', resolvedGymId],
    queryFn: () => base44.entities.GymMembership.filter({ gym_id: resolvedGymId, status: 'active' }),
    enabled: !!resolvedGymId,
    staleTime: 5 * 60 * 1000,
  });

  const memberIds = allMemberships.map(m => m.user_id);

  // All check-ins for this gym
  const { data: allCheckIns = [], isLoading: checkInsLoading } = useQuery({
    queryKey: ['gymCheckIns', resolvedGymId],
    queryFn: () => base44.entities.CheckIn.filter({ gym_id: resolvedGymId }, '-check_in_date', 5000),
    enabled: !!resolvedGymId,
    staleTime: 5 * 60 * 1000,
  });

  // All workout logs — just for current user and community
  const { data: myWorkoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }, '-created_date', 500),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
  });

  // All workout logs for all gym members (to compare volume/exercises)
  const { data: allWorkoutLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['allGymWorkoutLogs', resolvedGymId],
    queryFn: () => base44.entities.WorkoutLog.list('-created_date', 5000),
    enabled: !!resolvedGymId && memberIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = membersLoading || checkInsLoading || logsLoading;

  const rankings = useMemo(() => {
    if (!currentUser || memberIds.length === 0) return null;

    const gymMemberSet = new Set(memberIds);

    // ── Consistency (check-ins per member) ──
    const checkInsByMember = {};
    allCheckIns.forEach(c => {
      if (!gymMemberSet.has(c.user_id)) return;
      checkInsByMember[c.user_id] = (checkInsByMember[c.user_id] || 0) + 1;
    });
    const myCheckIns = checkInsByMember[currentUser.id] || 0;

    // ── Streak ──
    const myStreak = currentUser.current_streak || 0;
    // We don't have all users' streaks easily, so approximate from check-in recency
    // Count consecutive recent days from check-in data per user
    const streakByMember = {};
    const sortedCheckInsByMember = {};
    allCheckIns.forEach(c => {
      if (!gymMemberSet.has(c.user_id)) return;
      if (!sortedCheckInsByMember[c.user_id]) sortedCheckInsByMember[c.user_id] = [];
      sortedCheckInsByMember[c.user_id].push(c.check_in_date);
    });
    Object.entries(sortedCheckInsByMember).forEach(([uid, dates]) => {
      const sorted = [...new Set(dates)].sort().reverse();
      let streak = 0;
      let prev = new Date();
      for (const d of sorted) {
        const date = new Date(d);
        const diff = differenceInDays(prev, date);
        if (diff <= 1) { streak++; prev = date; }
        else break;
      }
      streakByMember[uid] = streak;
    });

    // ── Volume (workout logs) ──
    const gymLogs = allWorkoutLogs.filter(l => gymMemberSet.has(l.user_id));
    const volumeByMember = {};
    gymLogs.forEach(log => {
      const vol = log.total_volume || log.exercises?.reduce((sum, ex) => {
        const w = parseFloat(ex.weight) || 0;
        const sets = parseInt(ex.sets) || 1;
        const reps = parseInt(ex.reps) || 1;
        return sum + w * sets * reps;
      }, 0) || 0;
      volumeByMember[log.user_id] = (volumeByMember[log.user_id] || 0) + vol;
    });
    const myVolume = volumeByMember[currentUser.id] || 0;

    // ── Workouts logged count ──
    const logCountByMember = {};
    gymLogs.forEach(log => {
      logCountByMember[log.user_id] = (logCountByMember[log.user_id] || 0) + 1;
    });
    const myLogCount = logCountByMember[currentUser.id] || 0;

    // ── Compute percentiles ──
    const percentile = (myVal, allVals) => {
      if (allVals.length === 0) return 50;
      const below = allVals.filter(v => v < myVal).length;
      return Math.max(1, Math.round((1 - below / allVals.length) * 100));
    };

    const allCheckInCounts = memberIds.map(id => checkInsByMember[id] || 0);
    const allStreaks = memberIds.map(id => streakByMember[id] || 0);
    const allVolumes = memberIds.map(id => volumeByMember[id] || 0);
    const allLogCounts = memberIds.map(id => logCountByMember[id] || 0);

    return {
      consistency: { pct: percentile(myCheckIns, allCheckInCounts), value: myCheckIns, subtitle: `vs avg ${Math.round(allCheckInCounts.reduce((a,b)=>a+b,0)/Math.max(1,allCheckInCounts.length))} check-ins` },
      streak: { pct: percentile(myStreak, allStreaks), value: `${myStreak} days`, subtitle: `community avg ${Math.round(allStreaks.reduce((a,b)=>a+b,0)/Math.max(1,allStreaks.length))} days` },
      volume: { pct: percentile(myVolume, allVolumes), value: myVolume > 0 ? `${(myVolume/1000).toFixed(1)}t` : '—', subtitle: myVolume > 0 ? 'total volume lifted' : 'log workouts to rank' },
      workouts: { pct: percentile(myLogCount, allLogCounts), value: myLogCount, subtitle: `avg ${Math.round(allLogCounts.reduce((a,b)=>a+b,0)/Math.max(1,allLogCounts.length))} in community` },
      memberCount: memberIds.length,
    };
  }, [currentUser, memberIds, allCheckIns, allWorkoutLogs]);

  const overallPct = rankings
    ? Math.round((rankings.consistency.pct + rankings.streak.pct + rankings.volume.pct + rankings.workouts.pct) / 4)
    : null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0e1e 0%, #0f1a35 50%, #080c1a 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-4"
        style={{ background: 'rgba(10,14,30,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div>
          <h1 className="text-[15px] font-black text-white leading-none">Community Rank</h1>
          {gym && <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#475569' }}>{gym.name}</p>}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 pb-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-sm font-medium" style={{ color: '#475569' }}>Calculating your rank…</p>
          </div>
        ) : !resolvedGymId ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Users className="w-12 h-12 mb-3" style={{ color: '#334155' }} />
            <p className="text-base font-bold text-white mb-1">No gym joined yet</p>
            <p className="text-sm" style={{ color: '#475569' }}>Join a gym to see how you rank against other members.</p>
          </div>
        ) : rankings ? (
          <>
            {/* Overall rank hero */}
            <div className="rounded-2xl p-5 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(160deg, rgba(15,20,45,0.9), rgba(8,11,26,0.95))', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="absolute inset-0 opacity-10"
                style={{ background: `radial-gradient(circle at 50% 0%, ${RankBadge({ pct: overallPct }).color} 0%, transparent 70%)` }} />
              <div className="relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Medal className="w-4 h-4" style={{ color: RankBadge({ pct: overallPct }).color }} />
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Overall Ranking</p>
                </div>
                <p className="text-5xl font-black text-white leading-none mb-1">
                  Top <span style={{ color: RankBadge({ pct: overallPct }).color }}>{overallPct}%</span>
                </p>
                <p className="text-[13px] font-semibold mt-2" style={{ color: '#64748b' }}>
                  out of {rankings.memberCount} member{rankings.memberCount !== 1 ? 's' : ''} at {gym?.name || 'your gym'}
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: RankBadge({ pct: overallPct }).bg, border: `1px solid ${RankBadge({ pct: overallPct }).border}` }}>
                  <span className="text-sm">{RankBadge({ pct: overallPct }).icon}</span>
                  <span className="text-[12px] font-bold" style={{ color: RankBadge({ pct: overallPct }).color }}>{RankBadge({ pct: overallPct }).label}</span>
                </div>
              </div>
            </div>

            {/* Category rankings */}
            <p className="text-[11px] font-bold uppercase tracking-widest px-1" style={{ color: '#334155' }}>Breakdown</p>

            <StatCard icon={Calendar} label="Consistency" pct={rankings.consistency.pct}
              value={`${rankings.consistency.value} check-ins`} subtitle={rankings.consistency.subtitle} />

            <StatCard icon={Flame} label="Streak" pct={rankings.streak.pct}
              value={rankings.streak.value} subtitle={rankings.streak.subtitle} />

            <StatCard icon={Dumbbell} label="Workouts Logged" pct={rankings.workouts.pct}
              value={`${rankings.workouts.value} sessions`} subtitle={rankings.workouts.subtitle} />

            <StatCard icon={TrendingUp} label="Volume Lifted" pct={rankings.volume.pct}
              value={rankings.volume.value} subtitle={rankings.volume.subtitle} />

            <p className="text-[10px] text-center pb-2" style={{ color: '#1e293b' }}>
              Rankings update in real-time based on gym member activity
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}