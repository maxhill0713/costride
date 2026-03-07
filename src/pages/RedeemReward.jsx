import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Gift, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import WeeklyChallengeCard from '../components/challenges/WeeklyChallengeCard';

export default function RedeemReward() {
  const [showQRModal, setShowQRModal] = useState(false);
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
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const isPremium = subscription && subscription.length > 0;

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const gymIds = gymMemberships.map((m) => m.gym_id);

  const getWeekNumber = (date = new Date()) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDay) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
  };

  const weekNumber = getWeekNumber();

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['activeChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' }, '-created_date', 20),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const weeklyChallenges = allChallenges.slice(0, 3);

  const challenges = allChallenges.filter((challenge) => {
    const isParticipant = challenge.participants?.includes(currentUser?.id);
    return isParticipant;
  });

  const { data: completedChallenges = [] } = useQuery({
    queryKey: ['completedChallengesReward'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'completed' }, '-created_date', 30),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['gymRewards', gymIds.join(',')],
    queryFn: () => gymIds.length > 0 ?
    base44.entities.Reward.filter({ gym_id: gymIds[0], active: true }) :
    [],
    enabled: gymIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (prev) => prev
  });

  const { data: claimedBonuses = [] } = useQuery({
    queryKey: ['claimedBonuses', currentUser?.id],
    queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev
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
      { id: `temp-${rewardData.id}`, user_id: currentUser.id, reward_id: rewardData.id }]
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['claimedBonuses', currentUser?.id], context.previous);
    },
    onSuccess: () => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      queryClient.invalidateQueries({ queryKey: ['claimedBonuses'] });
      setShowQRModal(true);
    }
  });

  const userChallengeProgress = challenges.map((challenge) => {
    const participants = challenge.participants || [];
    const targetValue = challenge.target_value || 10;
    const progress = Math.floor(participants.length / targetValue * 100);
    return { ...challenge, progress, participantCount: participants.length, targetValue };
  }).sort((a, b) => b.progress - a.progress);

  const unclaimedRewards = rewards.filter((r) => {
    if (!r.active) return false;
    if (claimedBonuses.find((cb) => cb.reward_id === r.id)) return false;
    if (r.premium_only && !isPremium) return false;
    return true;
  });

  const completedChallengeRewards = completedChallenges.filter((challenge) => {
    const isWinner = challenge.winner_id === currentUser?.id;
    const isParticipant = challenge.participants?.includes(currentUser?.id);
    const notClaimed = !claimedBonuses.find((cb) => cb.challenge_id === challenge.id);
    return (isWinner || isParticipant) && notClaimed;
  }).map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    type: 'challenge',
    icon: '🏆',
    reward: challenge.reward,
    earnedText: `Completed: ${challenge.title}`,
    isChallenge: true,
    challengeId: challenge.id
  }));

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom_right,#050b1a,#102a70,#050b1a)] pb-24">
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4">
        {/* Top Navigation Buttons */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveSection('weekly')}
            className={`px-3 md:px-6 py-5 rounded-2xl font-bold text-base md:text-lg transition-all duration-100 flex flex-col items-center gap-2 backdrop-blur-md border active:shadow-none active:translate-y-[5px] active:scale-95 transform-gpu ${
              activeSection === 'weekly'
                ? 'bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 text-white border-transparent shadow-[0_5px_0_0_#5b21b6,0_8px_20px_rgba(120,40,220,0.4),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.05)]'
                : 'bg-slate-800/50 text-slate-300 border-slate-600/40 shadow-[0_5px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-slate-800/70 hover:text-white'
            }`}>
            <Zap className="w-5 h-5" />
            Weekly
          </button>
          <button
            onClick={() => setActiveSection('community')}
            className={`px-3 md:px-6 py-5 rounded-2xl font-bold text-base md:text-lg transition-all duration-100 flex flex-col items-center gap-2 backdrop-blur-md border active:shadow-none active:translate-y-[5px] active:scale-95 transform-gpu ${
              activeSection === 'community'
                ? 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-transparent shadow-[0_5px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)]'
                : 'bg-slate-800/50 text-slate-300 border-slate-600/40 shadow-[0_5px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-slate-800/70 hover:text-white'
            }`}>
            <Trophy className="w-5 h-5" />
            Community
          </button>
          <button
            onClick={() => setActiveSection('rewards')}
            className={`px-3 md:px-6 py-5 rounded-2xl font-bold text-base md:text-lg transition-all duration-100 flex flex-col items-center gap-2 backdrop-blur-md border active:shadow-none active:translate-y-[5px] active:scale-95 transform-gpu ${
              activeSection === 'rewards'
                ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-white border-transparent shadow-[0_5px_0_0_#b45309,0_8px_20px_rgba(180,83,9,0.4),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_0_20px_rgba(255,255,255,0.03)]'
                : 'bg-slate-800/50 text-slate-300 border-slate-600/40 shadow-[0_5px_0_0_#0f172a,0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-slate-800/70 hover:text-white'
            }`}>
            <Gift className="w-5 h-5" />
            Rewards
          </button>
        </div>

        {/* Weekly Challenges Section */}
        {activeSection === 'weekly' && (
          <div>
            <h2 className="text-xl font-black text-white mb-3 drop-shadow-sm">Weekly Challenges</h2>
            {weeklyChallenges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {weeklyChallenges.map((challenge) => (
                  <WeeklyChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUser={currentUser} />
                ))}
              </div> 
            ) : (
              <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-600/40 shadow-xl shadow-black/20 rounded-2xl p-8 text-center">
                <p className="text-blue-200/50">No weekly challenges available</p>
              </Card>
            )}
          </div>
        )}

        {/* Community Challenges Section */}
        {activeSection === 'community' && (
          <div>
            <h2 className="text-xl font-black text-white mb-3 drop-shadow-sm">Community Challenges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userChallengeProgress.length === 0 ? (
                <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-600/40 shadow-xl shadow-black/20 rounded-2xl p-8 col-span-2 text-center">
                  <p className="text-blue-200/50">Join gym challenges to get started</p>
                </Card> 
              ) : (
                userChallengeProgress.map((challenge) => (
                  <Card key={challenge.id} className="bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-[#050b1a]/80 backdrop-blur-xl border border-slate-600/40 hover:border-blue-400/50 transition-all duration-300 shadow-2xl shadow-black/30 hover:shadow-[0_0_20px_rgba(16,42,112,0.4)] rounded-2xl p-5">
                    <h4 className="font-bold text-white mb-2 drop-shadow-sm">{challenge.title}</h4>
                    <p className="text-xs text-blue-200/70 mb-3">{challenge.description}</p>

                    <div className="mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold text-slate-400">Progress</p>
                        <p className="text-[10px] font-bold text-amber-400">{Math.round(challenge.progress)}%</p>
                      </div>
                      <div className="relative h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          style={{ width: `${challenge.progress}%` }}
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      </div>
                    </div>
                    <Button disabled className="w-full mt-3 font-bold text-xs h-8 bg-green-600/90 text-white border border-green-500/50 shadow-sm">
                      ✓ Joined
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Rewards Section */}
        {activeSection === 'rewards' && (
          <div>
            <h2 className="text-xl font-black text-white mb-3 drop-shadow-sm">Available Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unclaimedRewards.length === 0 && completedChallengeRewards.length === 0 ? (
                <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-600/40 shadow-xl shadow-black/20 p-8 rounded-2xl col-span-2 text-center">
                  <p className="text-blue-200/50">No rewards available to claim</p>
                </Card> 
              ) : (
                <>
                  {completedChallengeRewards.map((reward) => (
                    <Card key={reward.id} className="bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-[#050b1a]/80 backdrop-blur-xl border border-slate-600/40 hover:border-amber-500/40 transition-all duration-300 shadow-2xl shadow-black/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] rounded-2xl p-5">
                      <h3 className="font-bold text-white mb-1 drop-shadow-sm">{reward.title}</h3>
                      <p className="text-xs text-amber-400 mb-2">{reward.earnedText}</p>
                      <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] mb-3 shadow-sm">
                        Challenge Reward
                      </Badge>
                      {reward.reward && (
                        <div className="mb-3 text-xs text-slate-300">💝 {reward.reward}</div>
                      )}
                      <Button
                        onClick={() => claimMutation.mutate(reward)}
                        disabled={claimMutation.isPending}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm rounded-lg h-9 shadow-md shadow-amber-900/50 border border-amber-400/50">
                        {claimMutation.isPending ? 'Claiming...' : 'Claim'}
                      </Button>
                    </Card>
                  ))}

                  {unclaimedRewards.map((reward) => (
                    <Card key={reward.id} className="bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-[#050b1a]/80 backdrop-blur-xl border border-slate-600/40 hover:border-cyan-500/40 transition-all duration-300 shadow-2xl shadow-black/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-white drop-shadow-sm">{reward.title}</h3>
                          {reward.premium_only && (
                            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] inline-block mt-1 shadow-sm">
                              Pro
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-cyan-400 mb-2">{reward.description}</p>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] mb-3 shadow-sm">
                        Available
                      </Badge>
                      {reward.value && (
                        <div className="mb-3 text-xs text-slate-300">💝 {reward.value}</div>
                      )}
                      <Button
                        onClick={() => claimMutation.mutate(reward)}
                        disabled={claimMutation.isPending || (reward.premium_only && !isPremium)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm rounded-lg h-9 shadow-md shadow-cyan-900/50 border border-cyan-400/50 disabled:opacity-50">
                        {claimMutation.isPending ? 'Claiming...' : reward.premium_only && !isPremium ? 'Pro Only' : 'Claim'}
                      </Button>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}