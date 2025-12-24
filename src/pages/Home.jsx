import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Dumbbell, Trophy, Flame, Plus, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";

import LeaderboardCard from '@/components/leaderboard/LeaderboardCard';
import ExerciseFilter from '@/components/leaderboard/ExerciseFilter';
import StatsCard from '@/components/leaderboard/StatsCard';
import AddMemberModal from '@/components/members/AddMemberModal';
import LogLiftModal from '@/components/lifts/LogLiftModal';

export default function Home() {
  const queryClient = useQueryClient();
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showLogLift, setShowLogLift] = useState(false);

  // Fetch data
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.GymMember.list()
  });

  const { data: lifts = [], isLoading: loadingLifts } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list('-weight_lbs')
  });

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.GymMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowAddMember(false);
    }
  });

  const addLiftMutation = useMutation({
    mutationFn: (data) => base44.entities.Lift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifts'] });
      setShowLogLift(false);
    }
  });

  // Filter and get best lifts per member per exercise
  const getLeaderboard = () => {
    const filteredLifts = selectedExercise === 'all' 
      ? lifts 
      : lifts.filter(l => l.exercise === selectedExercise);

    // Get best lift per member (per exercise if filtering)
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

  const leaderboard = getLeaderboard();
  const totalPRs = lifts.filter(l => l.is_pr).length;
  const topLift = lifts.length > 0 ? Math.max(...lifts.map(l => l.weight_lbs)) : 0;

  const isLoading = loadingMembers || loadingLifts;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-400/10 via-transparent to-orange-500/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-lime-400/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl md:text-6xl font-black mb-2">
              <span className="text-lime-400">Hello</span>{' '}
              <span className="text-orange-400">Fattie</span>
            </h1>
            <p className="text-zinc-400 text-lg">Track. Compete. Dominate. 💪</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatsCard icon={Users} label="Members" value={members.length} color="lime" />
            <StatsCard icon={Dumbbell} label="Total Lifts" value={lifts.length} color="orange" />
            <StatsCard icon={Flame} label="PRs Hit" value={totalPRs} color="purple" />
            <StatsCard icon={Trophy} label="Top Lift" value={`${topLift}lb`} color="blue" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center mb-8">
            <Button
              onClick={() => setShowAddMember(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Add Member
            </Button>
            <Button
              onClick={() => setShowLogLift(true)}
              className="bg-lime-400 hover:bg-lime-500 text-zinc-900 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Lift
            </Button>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-lime-400" />
            Leaderboard
          </h2>
        </div>

        {/* Exercise Filter */}
        <div className="mb-6">
          <ExerciseFilter selected={selectedExercise} onSelect={setSelectedExercise} />
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-zinc-500"
            >
              <Dumbbell className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No lifts recorded yet</p>
              <p className="text-sm">Add members and start logging lifts!</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {leaderboard.map((lift, index) => (
                <LeaderboardCard
                  key={lift.id}
                  rank={index + 1}
                  name={lift.member_name}
                  weight={lift.weight_lbs}
                  exercise={lift.exercise}
                  isPR={lift.is_pr}
                  avatarUrl={members.find(m => m.id === lift.member_id)?.avatar_url}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddMemberModal
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        onSave={(data) => addMemberMutation.mutate(data)}
        isLoading={addMemberMutation.isPending}
      />

      <LogLiftModal
        open={showLogLift}
        onClose={() => setShowLogLift(false)}
        onSave={(data) => addLiftMutation.mutate(data)}
        members={members}
        isLoading={addLiftMutation.isPending}
      />
    </div>
  );
}