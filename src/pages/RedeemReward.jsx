import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Trophy, Flame, Gift, QrCode, Clock, Zap, Star, Target, Dumbbell } from 'lucide-react';
import confetti from 'canvas-confetti';
import WeeklyChallengeCard from '../components/challenges/WeeklyChallengeCard';

export default function RedeemReward() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [activeSection, setActiveSection] = useState('weekly');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: () => base44.entities.Subscription.filter({ 
      user_id: currentUser.id,
      status: 'active'
    }),
    enabled: !!currentUser,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000
  });

  const isPremium = subscription && subscription.length > 0;

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const gymIds = gymMemberships.map(m => m.gym_id);

  // Get current week number for rotating challenges
  const getWeekNumber = (date = new Date()) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDay) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
  };

  const weekNumber = getWeekNumber();
  
  // 3 rotating weekly challenges based on week number
  const weeklyCheckInChallenges = [
    {
      id: `weekly-checkins-${weekNumber}`,
      title: 'Check In 3 Times This Week',
      description: 'Visit your gym 3 times this week',
      type: 'checkin',
      target_value: 3,
      category: 'attendance',
      status: 'active',
      reward: '10 points',
      icon: '🏋️'
    },
    {
      id: `weekly-checkins-${weekNumber}-2`,
      title: 'Consistency Warrior',
      description: 'Check in 5 times this week',
      type: 'checkin',
      target_value: 5,
      category: 'streak',
      status: 'active',
      reward: '25 points',
      icon: '🔥'
    },
    {
      id: `weekly-checkins-${weekNumber}-3`,
      title: 'Daily Grind',
      description: 'Check in every day this week',
      type: 'checkin',
      target_value: 7,
      category: 'daily',
      status: 'active',
      reward: '50 points',
      icon: '⚡'
    }
  ];

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['activeChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' }, '-created_date', 20),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  // Re-use activeChallenges for weekly challenges — no duplicate fetch
  const weeklyChallenges = allChallenges.slice(0, 3);

  // Show all challenges where the user is a participant (from any source - home, gym, etc.)
  const challenges = allChallenges.filter(challenge => {
    const isParticipant = challenge.participants?.includes(currentUser?.id);
    return isParticipant;
  });

  const { data: completedChallenges = [] } = useQuery({
    queryKey: ['completedChallengesReward'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'completed' }, '-created_date', 30),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['gymRewards', gymIds.join(',')],
    queryFn: () => gymIds.length > 0
      ? base44.entities.Reward.filter({ gym_id: gymIds[0], active: true })
      : [],
    enabled: gymIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: claimedBonuses = [] } = useQuery({
    queryKey: ['claimedBonuses', currentUser?.id],
    queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const claimMutation = useMutation({
    mutationFn: async (rewardData) => {
      return await base44.entities.ClaimedBonus.create({
        user_id: currentUser.id,
        reward_id: rewardData.isChallenge ? null : rewardData.id,
        challenge_id: rewardData.isChallenge ? rewardData.id : null,
        offer_details: rewardData.title,
        earned_text: rewardData.earnedText || rewardData.title,
        redemption_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        redeemed: false
      });
    },
    onMutate: async (rewardData) => {
      await queryClient.cancelQueries({ queryKey: ['claimedBonuses', currentUser?.id] });
      const previous = queryClient.getQueryData(['claimedBonuses', currentUser?.id]);
      queryClient.setQueryData(['claimedBonuses', currentUser?.id], (old = []) => [
        ...old,
        { id: `temp-${rewardData.id}`, user_id: currentUser.id, reward_id: rewardData.id, challenge_id: rewardData.challengeId || null }
      ]);
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['claimedBonuses', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00E5FF', '#06b6d4', '#3b82f6'] });
      queryClient.invalidateQueries({ queryKey: ['claimedBonuses'] });
      queryClient.invalidateQueries({ queryKey: ['completedChallenges'] });
      setShowQRModal(true);
    }
  });

  const userChallengeProgress = challenges.map(challenge => {
    const participants = challenge.participants || [];
    const targetValue = challenge.target_value || 10;
    const progress = Math.floor((participants.length / targetValue) * 100);
    return { ...challenge, progress, participantCount: participants.length, targetValue };
  }).sort((a, b) => b.progress - a.progress);

  // Filter rewards - only show premium_only rewards to premium users
  const unclaimedRewards = rewards.filter(r => {
    if (!r.active) return false;
    if (claimedBonuses.find(cb => cb.reward_id === r.id)) return false;
    if (r.premium_only && !isPremium) return false;
    return true;
  });

  // Convert completed challenges to claimable rewards
  const completedChallengeRewards = completedChallenges
    .filter(challenge => {
      // Only show challenges the user participated in AND haven't claimed yet
      const isWinner = challenge.winner_id === currentUser?.id;
      const isParticipant = challenge.participants?.includes(currentUser?.id);
      const notClaimed = !claimedBonuses.find(cb => cb.challenge_id === challenge.id);
      
      return (isWinner || isParticipant) && notClaimed;
    })
    .map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: 'challenge',
      icon: '🏆',
      reward: challenge.reward,
      earnedText: `Completed: ${challenge.title}`,
      isChallenge: true,
      challengeId: challenge.id,
      gym_id: challenge.gym_id
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-24">
      {/* Header */}
      <div className="relative pt-4 pb-3 px-3 md:px-4 border-b border-blue-700/40">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 mb-1">Rewards & Challenges</h1>
          <p className="text-xs text-slate-400">Earn rewards, conquer challenges, claim prizes</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 md:px-4 py-3">
        {/* Header */}
        <div className="mb-6 hidden">
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">Rewards & Challenges</h1>
          <p className="text-sm text-slate-400">Earn rewards, conquer challenges, claim prizes</p>
        </div>

        {/* Section Tabs */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveSection('weekly')}
            className={`px-3 md:px-6 py-3.5 rounded-2xl font-bold text-xs md:text-sm transition-all flex flex-col items-center justify-center gap-1.5 ${
              activeSection === 'weekly'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 scale-105'
                : 'bg-slate-900/70 backdrop-blur-xl border border-slate-700/30 text-slate-400 hover:bg-slate-900/80 hover:border-slate-600/40'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span className="truncate w-full text-center">Weekly</span>
          </button>
          <button
            onClick={() => setActiveSection('community')}
            className={`px-3 md:px-6 py-3.5 rounded-2xl font-bold text-xs md:text-sm transition-all flex flex-col items-center justify-center gap-1.5 ${
              activeSection === 'community'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/20 scale-105'
                : 'bg-slate-900/70 backdrop-blur-xl border border-slate-700/30 text-slate-400 hover:bg-slate-900/80 hover:border-slate-600/40'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="truncate w-full text-center">Community</span>
          </button>
          <button
            onClick={() => setActiveSection('rewards')}
            className={`px-3 md:px-6 py-3.5 rounded-2xl font-bold text-xs md:text-sm transition-all flex flex-col items-center justify-center gap-1.5 ${
              activeSection === 'rewards'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20 scale-105'
                : 'bg-slate-900/70 backdrop-blur-xl border border-slate-700/30 text-slate-400 hover:bg-slate-900/80 hover:border-slate-600/40'
            }`}
          >
            <Gift className="w-5 h-5" />
            <span className="truncate w-full text-center">Rewards</span>
          </button>
        </div>



        {/* Weekly Challenges Section */}
        {activeSection === 'weekly' && (
          <div>
            <h2 className="text-xl font-black text-white mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Weekly Challenges
              </h2>
              {weeklyChallenges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weeklyChallenges.map((challenge) => (
                    <WeeklyChallengeCard 
                      key={challenge.id}
                      challenge={challenge}
                      currentUser={currentUser}
                    />
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 text-center">
                  <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No weekly challenges available right now</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Community Challenges Section */}
        {activeSection === 'community' && (
          <div>
            <h2 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              Community Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userChallengeProgress.length === 0 ? (
                <Card className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 col-span-2 text-center">
                  <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Join gym community challenges to get started</p>
                </Card>
              ) : (
                 userChallengeProgress.map((challenge) => (
                   <div key={challenge.id}>
                     <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-amber-400/30 transition-all overflow-hidden group relative shadow-2xl shadow-black/20">
                       <div className="relative">
                         <div className="flex items-start justify-between mb-3">
                           <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-white mb-2 text-sm text-slate-300">{challenge.title}</h4>
                             <p className="text-xs text-slate-400 mb-2">{challenge.description}</p>
                             <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] inline-block">
                               {challenge.targetValue} {challenge.goal_type === 'participation' ? 'participants' : 'check-ins'}
                             </Badge>
                           </div>
                           <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-lg shadow-amber-500/30">
                             <Trophy className="w-6 h-6 text-white" />
                           </div>
                         </div>

                         <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-3 flex items-center gap-2 mt-3">
                           <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                             <Gift className="w-4 h-4 text-white" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[10px] text-slate-400">Reward</p>
                             <p className="text-xs font-bold text-green-400">{challenge.reward || 'Challenge Badge'}</p>
                           </div>
                         </div>

                         <div className="mt-3 pt-3 border-t border-slate-700/50">
                           <div className="flex justify-between items-center mb-2">
                             <p className="text-[10px] font-bold text-slate-400">Progress</p>
                             <p className="text-[10px] font-bold text-amber-400">{Math.round(challenge.progress)}%</p>
                           </div>
                           <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                             <div 
                               style={{ width: `${challenge.progress}%` }}
                               className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"
                             />
                           </div>
                         </div>

                         <div className="mt-3">
                           <Button
                             disabled
                             className="w-full font-bold text-xs md:text-sm h-8 md:h-10 bg-gradient-to-r from-green-600 to-emerald-600 text-white border border-green-400/50"
                           >
                             ✓ Joined
                           </Button>
                         </div>
                       </div>
                     </Card>
                   </div>
                 ))
               )}
            </div>
          </div>
        )}

        {/* Rewards Section */}
        {activeSection === 'rewards' && (
          <div>
            <h2 className="text-xl font-black text-white mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-400" />
              Available Rewards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {unclaimedRewards.length === 0 && completedChallengeRewards.length === 0 ? (
               <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 rounded-2xl col-span-2 text-center">
                 <Gift className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                 <p className="text-slate-400">No rewards available to claim right now</p>
               </Card>
             ) : (
               <>
                 {completedChallengeRewards.map((reward) => (
                   <Card key={reward.id} className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-amber-400/30 transition-all group overflow-hidden shadow-2xl shadow-black/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white mb-1 text-sm md:text-base truncate">{reward.title}</h3>
                          <p className="text-xs md:text-sm text-amber-400 mb-2 line-clamp-1">{reward.earnedText}</p>
                          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] md:text-xs inline-block">
                            Challenge Reward
                          </Badge>
                        </div>
                        <div className="text-lg md:text-xl flex-shrink-0 ml-2">{reward.icon}</div>
                      </div>

                      <div className="pt-2 md:pt-2.5 border-t border-slate-700/50 mt-2">
                        {reward.reward && (
                          <div className="mb-2 text-xs md:text-sm text-slate-300">
                            💝 {reward.reward}
                          </div>
                        )}
                        <Button
                          onClick={() => {
                            setSelectedReward(reward);
                            claimMutation.mutate(reward);
                          }}
                          disabled={claimMutation.isPending}
                          className="w-full h-8 md:h-10 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm md:text-base rounded-lg md:rounded-xl transition-all"
                        >
                          {claimMutation.isPending ? 'Claiming...' : 'Claim'}
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {unclaimedRewards.map((reward) => (
                    <Card key={reward.id} className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-cyan-400/30 transition-all group overflow-hidden shadow-2xl shadow-black/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-sm md:text-base truncate">{reward.title}</h3>
                            {reward.premium_only && (
                              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] md:text-[10px] inline-block flex-shrink-0">
                                Pro
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-cyan-400 mb-2 line-clamp-1">{reward.description}</p>
                          <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] md:text-xs inline-block">
                            Available Now
                          </Badge>
                        </div>
                        <div className="text-lg md:text-xl flex-shrink-0 ml-2">{reward.icon}</div>
                      </div>

                      <div className="pt-2 md:pt-2.5 border-t border-slate-700/50 mt-2">
                        {reward.value && (
                          <div className="mb-2 text-xs md:text-sm text-slate-300">
                            💝 {reward.value}
                          </div>
                        )}
                        <Button
                          onClick={() => {
                            setSelectedReward(reward);
                            claimMutation.mutate(reward);
                          }}
                          disabled={claimMutation.isPending || (reward.premium_only && !isPremium)}
                          className="w-full h-8 md:h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm md:text-base rounded-lg md:rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {claimMutation.isPending ? 'Claiming...' : reward.premium_only && !isPremium ? 'Pro Only' : 'Claim'}
                        </Button>
                      </div>
                    </Card>
                  ))}
               </>
             )}
           </div>
         </div>
        </div>
        )}
      </div>
    </div>
  );
}