import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy } from 'lucide-react';
import LeaderboardCard from '@/components/leaderboard/LeaderboardCard';
import ExerciseFilter from '@/components/leaderboard/ExerciseFilter';

const TIME_FILTERS = [
  { id: 'all',   label: 'All Time' },
  { id: 'month', label: 'This Month' },
  { id: 'week',  label: 'This Week' },
];

export default function Leaderboard() {
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: lifts = [], isLoading } = useQuery({
    queryKey: ['leaderboardLifts', selectedExercise],
    queryFn: () => selectedExercise === 'all'
      ? base44.entities.Lift.filter({ is_pr: true }, '-weight_lbs', 200)
      : base44.entities.Lift.filter({ exercise: selectedExercise, is_pr: true }, '-weight_lbs', 100),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const leaderboard = useMemo(() => {
    let filtered = selectedExercise === 'all'
      ? lifts
      : lifts.filter(l => l.exercise === selectedExercise);

    // Apply time filter
    if (selectedTime === 'week') {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      filtered = filtered.filter(l => l.created_date >= cutoff);
    } else if (selectedTime === 'month') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      filtered = filtered.filter(l => l.created_date >= cutoff);
    }

    // Best lift per user (or per user+exercise when filtered)
    const bestLifts = {};
    filtered.forEach(lift => {
      const key = selectedExercise === 'all'
        ? lift.member_id
        : `${lift.member_id}-${lift.exercise}`;
      if (!bestLifts[key] || lift.weight_lbs > bestLifts[key].weight_lbs) {
        bestLifts[key] = lift;
      }
    });

    return Object.values(bestLifts)
      .sort((a, b) => b.weight_lbs - a.weight_lbs)
      .slice(0, 10);
  }, [lifts, selectedExercise, selectedTime]);

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#02040a,#0d2360,#02040a)] px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-[22px] font-black text-white tracking-tight">Leaderboard</h1>
        </div>

        <div className="mb-4">
          <ExerciseFilter selected={selectedExercise} onSelect={setSelectedExercise} />
        </div>

        {/* Time filter */}
        <div className="flex gap-2 mb-5">
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedTime(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedTime === f.id
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-800/60 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-slate-700/60 flex-shrink-0" />
                <div className="w-14 h-14 rounded-full bg-slate-700/60 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded bg-slate-700/60 w-1/3" />
                  <div className="h-3 rounded bg-slate-700/60 w-1/5" />
                </div>
                <div className="w-12 h-8 rounded bg-slate-700/60" />
              </div>
            ))
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-14 h-14 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-300 font-semibold">No lifts logged yet</p>
              <p className="text-sm text-slate-500 mt-1">Be the first to set a record!</p>
            </div>
          ) : (
            leaderboard.map((lift, index) => (
              <LeaderboardCard
                key={lift.id}
                rank={index + 1}
                name={lift.member_name}
                weight={lift.weight_lbs}
                exercise={lift.exercise}
                isPR={lift.is_pr}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}