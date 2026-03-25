import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy } from 'lucide-react';
import LeaderboardCard from '@/components/leaderboard/LeaderboardCard';
import ExerciseFilter from '@/components/leaderboard/ExerciseFilter';

export default function Leaderboard() {
  const [selectedExercise, setSelectedExercise] = useState('all');

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

  const getLeaderboard = () => {
    const filteredLifts = selectedExercise === 'all' 
      ? lifts 
      : lifts.filter(l => l.exercise === selectedExercise);

    const bestLifts = {};
    filteredLifts.forEach(lift => {
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
  };

  const leaderboard = useMemo(() => getLeaderboard(), [lifts, selectedExercise]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900">Leaderboard</h1>
        </div>

        <div className="mb-6">
          <ExerciseFilter selected={selectedExercise} onSelect={setSelectedExercise} />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
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