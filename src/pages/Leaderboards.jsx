import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Users, Dumbbell, Target, Crown, Medal, Award, Flame, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Leaderboards() {
  const [timeframe, setTimeframe] = useState('all-time');

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const { data: gymStats = [] } = useQuery({
    queryKey: ['gymStats'],
    queryFn: () => base44.entities.GymStats.list()
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list()
  });

  const { data: lifts = [] } = useQuery({
    queryKey: ['lifts'],
    queryFn: () => base44.entities.Lift.list()
  });

  // Calculate gym rankings
  const calculateGymRankings = () => {
    return gyms.map(gym => {
      const stats = gymStats.find(s => s.gym_id === gym.id) || {};
      const gymChallenges = challenges.filter(c => 
        c.gym_id === gym.id || c.competing_gym_id === gym.id
      );
      const challengesWon = challenges.filter(c => c.winner_id === gym.id).length;
      
      // Calculate engagement score
      const totalMembers = stats.total_members || gym.members_count || 0;
      const activeMembers = stats.active_members || Math.floor(totalMembers * 0.7);
      const totalLifts = stats.total_lifts || 0;
      const engagementScore = stats.engagement_score || (totalLifts + (challengesWon * 100) + (activeMembers * 10));

      return {
        ...gym,
        stats: {
          totalMembers,
          activeMembers,
          totalLifts,
          challengesWon,
          engagementScore,
          totalWeightMoved: stats.total_weight_moved || 0
        }
      };
    });
  };

  const rankedGyms = calculateGymRankings();

  // Sort by different metrics
  const getTopGyms = (metric) => {
    return [...rankedGyms].sort((a, b) => {
      if (metric === 'engagement') return b.stats.engagementScore - a.stats.engagementScore;
      if (metric === 'members') return b.stats.totalMembers - a.stats.totalMembers;
      if (metric === 'challenges') return b.stats.challengesWon - a.stats.challengesWon;
      if (metric === 'lifts') return b.stats.totalLifts - a.stats.totalLifts;
      if (metric === 'weight') return b.stats.totalWeightMoved - a.stats.totalWeightMoved;
      return 0;
    });
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  const renderLeaderboard = (gyms, metric) => {
    const sortedGyms = getTopGyms(metric).slice(0, 10);

    if (sortedGyms.length === 0) {
      return (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300 rounded-3xl bg-white/50">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">No gym data available yet</p>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {sortedGyms.map((gym, index) => {
          const rank = index + 1;
          const metricValue = 
            metric === 'engagement' ? gym.stats.engagementScore :
            metric === 'members' ? gym.stats.totalMembers :
            metric === 'challenges' ? gym.stats.challengesWon :
            metric === 'lifts' ? gym.stats.totalLifts :
            metric === 'weight' ? Math.round(gym.stats.totalWeightMoved).toLocaleString() + ' lbs' :
            0;

          return (
            <Link key={gym.id} to={createPageUrl('GymCommunity') + '?id=' + gym.id}>
              <Card className={`bg-white/95 backdrop-blur-sm border overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-3xl ${
                rank <= 3 ? 'border-2' : 'border-gray-200/50'
              } ${
                rank === 1 ? 'border-yellow-400 shadow-yellow-100' :
                rank === 2 ? 'border-gray-400 shadow-gray-100' :
                rank === 3 ? 'border-orange-400 shadow-orange-100' : ''
              }`}>
                <div className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-14 h-14 rounded-2xl ${getRankBadge(rank)} flex items-center justify-center font-black text-2xl shadow-lg flex-shrink-0`}>
                      {rank <= 3 ? getRankIcon(rank) : rank}
                    </div>

                    {/* Gym Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-gray-900 truncate">{gym.name}</h3>
                        {gym.verified && (
                          <Badge className="bg-green-500 text-white text-xs">Verified</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{gym.type} • {gym.city}</p>
                    </div>

                    {/* Metric Score */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue}
                      </div>
                      <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                        {metric === 'engagement' ? 'Points' :
                         metric === 'members' ? 'Members' :
                         metric === 'challenges' ? 'Wins' :
                         metric === 'lifts' ? 'Lifts' :
                         metric === 'weight' ? '' : 'Score'}
                      </div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  {rank <= 3 && (
                    <div className="mt-4 pt-4 border-t border-gray-200/50 flex gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-gray-700">{gym.stats.totalMembers}</span>
                        <span className="text-gray-500">members</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="w-4 h-4 text-orange-500" />
                        <span className="font-semibold text-gray-700">{gym.stats.challengesWon}</span>
                        <span className="text-gray-500">wins</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Flame className="w-4 h-4 text-red-500" />
                        <span className="font-semibold text-gray-700">{gym.stats.totalLifts}</span>
                        <span className="text-gray-500">lifts</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50/30 to-orange-50/30">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 px-4 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMCAxMGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bS0xMCAwYzAgMS4xLS45IDItMiAycy0yLS45LTItMiAuOS0yIDItMiAyIC45IDIgMnptMTAgMTBjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyek0yNiAzNGMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTIgLjktMiAyLTIgMiAuOSAyIDJ6bTEwIDBjMCAxLjEtLjkgMi0yIDJzLTItLjktMi0yIC45LTIgMi0yIDIgLjkgMiAyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Trophy className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white">
                Gym Leaderboards
              </h1>
              <p className="text-white/90 text-lg font-medium mt-1">See which gyms dominate the community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="max-w-4xl mx-auto px-4 -mt-12 mb-8">
        <Card className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden p-6">
          <div className="flex items-end justify-center gap-4 h-48">
            {getTopGyms('engagement').slice(0, 3).map((gym, idx) => {
              const rank = idx + 1;
              const actualRank = rank === 0 ? 2 : rank === 1 ? 1 : 3;
              const height = actualRank === 1 ? 'h-40' : actualRank === 2 ? 'h-32' : 'h-24';
              const order = rank === 0 ? 'order-first' : rank === 1 ? 'order-first md:order-none' : 'order-last';
              
              return (
                <Link 
                  key={gym.id} 
                  to={createPageUrl('GymCommunity') + '?id=' + gym.id}
                  className={`flex flex-col items-center ${order} flex-1 max-w-[140px]`}
                >
                  <div className="relative mb-3">
                    <div className={`w-16 h-16 rounded-full overflow-hidden ring-4 ${
                      actualRank === 1 ? 'ring-yellow-400' :
                      actualRank === 2 ? 'ring-gray-400' :
                      'ring-orange-500'
                    } shadow-xl`}>
                      {gym.image_url ? (
                        <img src={gym.image_url} alt={gym.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">{gym.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${getRankBadge(actualRank)} flex items-center justify-center shadow-lg`}>
                      {actualRank === 1 ? <Crown className="w-4 h-4" /> :
                       actualRank === 2 ? <Medal className="w-4 h-4" /> :
                       <Award className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className={`${height} w-full rounded-t-2xl ${
                    actualRank === 1 ? 'bg-gradient-to-t from-yellow-400 to-orange-500' :
                    actualRank === 2 ? 'bg-gradient-to-t from-gray-300 to-gray-400' :
                    'bg-gradient-to-t from-orange-400 to-orange-600'
                  } flex flex-col items-center justify-center text-white shadow-xl transition-all hover:scale-105`}>
                    <div className="text-3xl font-black mb-1">{actualRank}</div>
                    <p className="text-sm font-bold text-center px-2 truncate w-full">{gym.name}</p>
                    <div className="text-xs mt-2 bg-white/20 px-3 py-1 rounded-full">
                      {gym.stats.engagementScore.toLocaleString()} pts
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Leaderboard Tabs */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <Tabs defaultValue="engagement">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-white/80 backdrop-blur-sm border border-gray-200/50 p-1.5 rounded-2xl shadow-sm">
            <TabsTrigger value="engagement" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-xs">
              <Zap className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Overall</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-xs">
              <Users className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-xs">
              <Trophy className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Challenges</span>
            </TabsTrigger>
            <TabsTrigger value="lifts" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-xs">
              <Dumbbell className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="weight" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold text-xs">
              <TrendingUp className="w-4 h-4 md:mr-1" />
              <span className="hidden md:inline">Weight</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="engagement">
            {renderLeaderboard(rankedGyms, 'engagement')}
          </TabsContent>

          <TabsContent value="members">
            {renderLeaderboard(rankedGyms, 'members')}
          </TabsContent>

          <TabsContent value="challenges">
            {renderLeaderboard(rankedGyms, 'challenges')}
          </TabsContent>

          <TabsContent value="lifts">
            {renderLeaderboard(rankedGyms, 'lifts')}
          </TabsContent>

          <TabsContent value="weight">
            {renderLeaderboard(rankedGyms, 'weight')}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}