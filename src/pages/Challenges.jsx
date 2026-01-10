import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Flame, Users, Calendar, Target, TrendingUp } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import CreateChallengeModal from '../components/challenges/CreateChallengeModal';

export default function Challenges() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list('-created_date')
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const joinChallengeMutation = useMutation({
    mutationFn: ({ challengeId, challenge }) => {
      const participants = challenge.participants || [];
      if (!participants.includes(currentUser.id)) {
        participants.push(currentUser.id);
      }
      return base44.entities.Challenge.update(challengeId, { participants });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    }
  });

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const upcomingChallenges = challenges.filter(c => c.status === 'upcoming');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  const handleJoin = (challenge) => {
    joinChallengeMutation.mutate({ challengeId: challenge.id, challenge });
  };

  const renderChallenge = (challenge) => {
    const isParticipant = challenge.participants?.includes(currentUser?.id);
    const participantCount = challenge.participants?.length || 0;

    return (
      <Card key={challenge.id} className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/50 overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-[1.02] hover:border-cyan-500/50 transition-all duration-300 rounded-3xl">
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500" />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {challenge.type === 'team' ? (
                  <Users className="w-5 h-5 text-blue-400" />
                ) : (
                  <Target className="w-5 h-5 text-purple-400" />
                )}
                <Badge variant="outline" className="capitalize border-cyan-600/50 text-cyan-300">{challenge.type.replace('_', ' ')}</Badge>
                {challenge.status === 'active' && (
                  <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center gap-1 shadow-lg shadow-cyan-500/30">
                    <Flame className="w-3 h-3" />
                    Live
                  </Badge>
                )}
              </div>
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-cyan-200 via-blue-200 to-cyan-200 bg-clip-text text-transparent mb-2">{challenge.title}</h3>
              <p className="text-slate-200 font-normal mb-3 leading-relaxed">{challenge.description}</p>

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-slate-400 text-xs">Duration</p>
                    <p className="font-semibold text-white">
                      {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-slate-400 text-xs">Goal</p>
                    <p className="font-semibold text-white capitalize">{challenge.goal_type.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Exercise Badge */}
              {challenge.exercise && (
                <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 capitalize">{challenge.exercise.replace('_', ' ')}</Badge>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-600/30">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-600/50 rounded-full">
              <Users className="w-4 h-4 text-slate-300" />
              <span className="text-sm font-bold text-white">{participantCount}</span>
              <span className="text-xs text-slate-400 font-medium">joined</span>
            </div>
            {challenge.status !== 'completed' && (
              <Button
              onClick={() => handleJoin(challenge)}
              disabled={isParticipant}
              className={`${
                isParticipant 
                  ? 'bg-gradient-to-r from-teal-500/20 to-green-500/20 text-teal-300 border border-teal-500/50 hover:bg-gradient-to-r hover:from-teal-500/20 hover:to-green-500/20' 
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40'
              } text-white font-bold rounded-2xl transition-all`}
              >
              {isParticipant ? '✓ Joined' : 'Join Challenge'}
              </Button>
            )}
            {challenge.status === 'completed' && challenge.winner_name && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-400 shadow-lg shadow-yellow-500/20">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent text-sm">👑 {challenge.winner_name}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 px-4 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMCAxMGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bS0xMCAwYzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMTAgMTBjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyek0yNiAzNGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bTEwIDBjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
                  Challenges
                </h1>
              </div>
              <p className="text-cyan-100 text-lg font-medium">Compete, win, and earn bragging rights</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white hover:scale-105 font-bold rounded-2xl h-12 px-6 shadow-lg transition-all"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-10">
        <Card className="bg-gradient-to-br from-slate-800/95 via-slate-700/95 to-slate-800/95 backdrop-blur-sm border border-blue-700/30 shadow-2xl rounded-3xl overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-blue-700/50">
            <div className="p-6 text-center hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-cyan-400" />
                <p className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{activeChallenges.length}</p>
              </div>
              <p className="text-sm font-semibold text-cyan-300">Active Now</p>
            </div>
            <div className="p-6 text-center hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-purple-400" />
                <p className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{upcomingChallenges.length}</p>
              </div>
              <p className="text-sm font-semibold text-purple-300">Upcoming</p>
            </div>
            <div className="p-6 text-center hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-teal-400" />
                <p className="text-3xl font-black bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent">{completedChallenges.length}</p>
              </div>
              <p className="text-sm font-semibold text-teal-300">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Challenges List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="active">
          <TabsList className="grid grid-cols-3 w-full mb-6 bg-gradient-to-br from-slate-700/90 to-slate-800/90 backdrop-blur-sm border border-blue-600/30 p-1.5 rounded-2xl shadow-sm">
            <TabsTrigger value="active" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-slate-400">
              <Flame className="w-4 h-4 mr-1.5" />
              Active
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-slate-400">
              <Calendar className="w-4 h-4 mr-1.5" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-slate-400">
              <Trophy className="w-4 h-4 mr-1.5" />
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-5">
            {activeChallenges.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-cyan-700/50 rounded-3xl bg-slate-800/50">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/30">
                  <Flame className="w-10 h-10 text-cyan-400" />
                </div>
                <p className="text-slate-300 font-medium">No active challenges</p>
                <p className="text-sm text-slate-400 mt-1">Check back soon or create one!</p>
              </Card>
            ) : (
              activeChallenges.map(renderChallenge)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-5">
            {upcomingChallenges.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-purple-700/50 rounded-3xl bg-slate-800/50">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <Calendar className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-slate-300 font-medium">No upcoming challenges</p>
                <p className="text-sm text-slate-400 mt-1">Stay tuned for new competitions!</p>
              </Card>
            ) : (
              upcomingChallenges.map(renderChallenge)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-5">
            {completedChallenges.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-teal-700/50 rounded-3xl bg-slate-800/50">
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
                  <Trophy className="w-10 h-10 text-teal-400" />
                </div>
                <p className="text-slate-300 font-medium">No completed challenges yet</p>
                <p className="text-sm text-slate-400 mt-1">Winners will be displayed here!</p>
              </Card>
            ) : (
              completedChallenges.map(renderChallenge)
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateChallengeModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        gyms={gyms}
      />
    </div>
  );
}