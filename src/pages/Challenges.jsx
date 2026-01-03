import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Flame, Users, Swords, Calendar, Target, TrendingUp } from 'lucide-react';
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
      <Card key={challenge.id} className="bg-white border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all">
        <div className={`h-2 ${challenge.type === 'gym_vs_gym' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`} />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {challenge.type === 'gym_vs_gym' ? (
                  <Swords className="w-5 h-5 text-red-500" />
                ) : challenge.type === 'team' ? (
                  <Users className="w-5 h-5 text-blue-500" />
                ) : (
                  <Target className="w-5 h-5 text-purple-500" />
                )}
                <Badge variant="outline" className="capitalize">{challenge.type.replace('_', ' ')}</Badge>
                {challenge.status === 'active' && (
                  <Badge className="bg-green-500 text-white flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    Live
                  </Badge>
                )}
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{challenge.title}</h3>
              <p className="text-gray-600 mb-3">{challenge.description}</p>
              
              {/* Gym vs Gym */}
              {challenge.type === 'gym_vs_gym' && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl mb-3">
                  <div className="flex-1 text-center">
                    <p className="font-bold text-gray-900">{challenge.gym_name}</p>
                    <p className="text-xs text-gray-500">Home Gym</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <span className="font-black text-red-600">VS</span>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="font-bold text-gray-900">{challenge.competing_gym_name}</p>
                    <p className="text-xs text-gray-500">Challenger</p>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Duration</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Goal</p>
                    <p className="font-semibold text-gray-900 capitalize">{challenge.goal_type.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Exercise Badge */}
              {challenge.exercise && (
                <Badge className="bg-blue-100 text-blue-700 capitalize">{challenge.exercise.replace('_', ' ')}</Badge>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">{participantCount} participants</span>
            </div>
            {challenge.status !== 'completed' && (
              <Button
                onClick={() => handleJoin(challenge)}
                disabled={isParticipant}
                className={`${isParticipant ? 'bg-gray-300' : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} text-white font-bold rounded-2xl`}
              >
                {isParticipant ? 'Joined' : 'Join Challenge'}
              </Button>
            )}
            {challenge.status === 'completed' && challenge.winner_name && (
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-gray-900">{challenge.winner_name}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                <Trophy className="w-10 h-10" />
                Challenges
              </h1>
              <p className="text-orange-100 text-lg">Compete, win, and earn bragging rights</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-2xl"
            >
              Create Challenge
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <Card className="bg-white border-2 border-gray-200 shadow-xl">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            <div className="p-4 text-center">
              <p className="text-3xl font-black text-gray-900">{activeChallenges.length}</p>
              <p className="text-sm text-gray-500">Active Now</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-3xl font-black text-gray-900">{upcomingChallenges.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-3xl font-black text-gray-900">{completedChallenges.length}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Challenges List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="active">
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeChallenges.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-gray-200">
                <Flame className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No active challenges</p>
              </Card>
            ) : (
              activeChallenges.map(renderChallenge)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingChallenges.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-gray-200">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No upcoming challenges</p>
              </Card>
            ) : (
              upcomingChallenges.map(renderChallenge)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedChallenges.length === 0 ? (
              <Card className="p-12 text-center border-2 border-dashed border-gray-200">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No completed challenges yet</p>
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