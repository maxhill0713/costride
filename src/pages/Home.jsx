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
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 via-blue-100/50 to-purple-100/50" />
        
        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-5xl md:text-6xl font-black mb-2">
              <span className="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">Hello</span>{' '}
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Fattie</span>
            </h1>
            <p className="text-gray-600 text-lg font-medium">Track. Compete. Dominate. 💪</p>
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
              className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 shadow-sm font-semibold rounded-2xl h-12"
            >
              <Users className="w-4 h-4 mr-2" />
              Add Member
            </Button>
            <Button
              onClick={() => setShowLogLift(true)}
              className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold shadow-md rounded-2xl h-12"
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
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
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
              <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-3xl shadow-sm border-2 border-gray-100"
            >
              <Dumbbell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-bold text-gray-700">No lifts recorded yet</p>
              <p className="text-sm text-gray-500 mt-1">Add members and start logging lifts!</p>
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