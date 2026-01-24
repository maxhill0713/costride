import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Trophy, Flame, Gift, QrCode, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function RedeemReward() {
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [activeSection, setActiveSection] = useState('challenges');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['activeChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' })
  });

  const { data: completedChallenges = [] } = useQuery({
    queryKey: ['completedChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'completed' })
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.list()
  });

  const { data: claimedBonuses = [] } = useQuery({
    queryKey: ['claimedBonuses', currentUser?.id],
    queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser?.id }),
    enabled: !!currentUser
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
    onSuccess: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00E5FF', '#06b6d4', '#3b82f6']
      });
      queryClient.invalidateQueries({ queryKey: ['claimedBonuses'] });
      queryClient.invalidateQueries({ queryKey: ['completedChallenges'] });
      setShowQRModal(true);
    }
  });

  const userChallengeProgress = challenges.map(challenge => {
    const participants = challenge.participants || [];
    const progress = Math.floor((participants.length / Math.max(participants.length, 5)) * 100);
    return { ...challenge, progress, participantCount: participants.length };
  }).sort((a, b) => b.progress - a.progress);

  const unclaimedRewards = rewards.filter(r => r.active && !claimedBonuses.find(cb => cb.reward_id === r.id));

  // Convert completed challenges to claimable rewards
  const completedChallengeRewards = completedChallenges
    .filter(challenge => !claimedBonuses.find(cb => cb.challenge_id === challenge.id))
    .map(challenge => ({
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-black text-white mb-1">Rewards & Challenges</h1>
          <p className="text-xs md:text-sm text-slate-400">Earn rewards, conquer challenges, claim prizes</p>
        </div>

        {/* Section Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSection('challenges')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSection === 'challenges'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg'
                : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Challenges
          </button>
          <button
            onClick={() => setActiveSection('gym')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSection === 'gym'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            In-Gym Rewards
          </button>
          <button
            onClick={() => setActiveSection('brand')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeSection === 'brand'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            Brand Rewards
          </button>
        </div>



        {/* Active Challenges Section */}
        {activeSection === 'challenges' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="mb-5 md:mb-6">
              <h2 className="text-lg md:text-2xl font-black text-white mb-2 md:mb-3 flex items-center gap-2">
                <Trophy className="w-5 md:w-6 h-5 md:h-6 text-amber-500" />
                Challenges
              </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {userChallengeProgress.length === 0 ? (
                <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl col-span-2 text-center">
                  <p className="text-slate-400">No active challenges at the moment</p>
                </Card>
              ) : (
                userChallengeProgress.map((challenge) => (
                  <Card key={challenge.id} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-3 md:p-4 rounded-xl md:rounded-2xl hover:border-amber-500/40 transition-all overflow-hidden group">
                    <div className="relative">
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white mb-1 text-sm md:text-base truncate">{challenge.title}</h3>
                          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] md:text-xs inline-block">
                            {challenge.category}
                          </Badge>
                        </div>
                        <Trophy className="w-4 md:w-5 h-4 md:h-5 text-amber-500 flex-shrink-0 ml-2" />
                      </div>

                      <div className="mb-2 md:mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] md:text-xs text-slate-400">{challenge.participantCount} in</span>
                          <span className="text-xs md:text-sm font-bold text-cyan-400">{challenge.progress}%</span>
                        </div>
                        <div className="h-1.5 md:h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${challenge.progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full shadow-lg shadow-cyan-500/50"
                          />
                        </div>
                      </div>

                      {challenge.reward && (
                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs">
                          <Gift className="w-3 md:w-4 h-3 md:h-4 text-cyan-400 flex-shrink-0" />
                          <span className="text-slate-300 truncate">{challenge.reward}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </motion.div>
        )}

        {/* In-Gym Rewards Section */}
        {activeSection === 'gym' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
         <div>
           <h2 className="text-lg md:text-2xl font-black text-white mb-2 md:mb-3 flex items-center gap-2">
             <Gift className="w-5 md:w-6 h-5 md:h-6 text-cyan-500" />
             Rewards
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
             {unclaimedRewards.length === 0 && completedChallengeRewards.length === 0 ? (
               <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl col-span-2 text-center">
                 <p className="text-slate-400">No rewards available to claim right now</p>
               </Card>
             ) : (
               <>
                 {completedChallengeRewards.map((reward) => (
                   <Card key={reward.id} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-3 md:p-4 rounded-xl md:rounded-2xl hover:border-cyan-500/40 transition-all group overflow-hidden">
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
                   <Card key={reward.id} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-3 md:p-4 rounded-xl md:rounded-2xl hover:border-cyan-500/40 transition-all group overflow-hidden">
                     <div className="flex items-start justify-between mb-2">
                       <div className="flex-1 min-w-0">
                         <h3 className="font-bold text-white mb-1 text-sm md:text-base truncate">{reward.title}</h3>
                         <p className="text-xs md:text-sm text-slate-400 mb-2 line-clamp-1">{reward.description}</p>
                         <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] md:text-xs inline-block">
                           {reward.type}
                         </Badge>
                       </div>
                       <div className="text-lg md:text-xl flex-shrink-0 ml-2">{reward.icon}</div>
                     </div>

                     <div className="pt-2 md:pt-2.5 border-t border-slate-700/50 mt-2">
                       {reward.points_required > 0 && (
                         <div className="mb-2 flex items-center gap-1.5 text-xs md:text-sm text-slate-400">
                           <Flame className="w-3 md:w-4 h-3 md:h-4 text-orange-500 flex-shrink-0" />
                           <span>{reward.points_required} pts</span>
                         </div>
                       )}
                       <Button
                         onClick={() => {
                           setSelectedReward(reward);
                           claimMutation.mutate(reward);
                         }}
                         disabled={claimMutation.isPending}
                         className="w-full h-8 md:h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-sm md:text-base rounded-lg md:rounded-xl transition-all"
                       >
                         {claimMutation.isPending ? 'Claiming...' : 'Claim'}
                       </Button>
                     </div>
                   </Card>
                 ))}
               </>
             )}
           </div>
         </div>
         </motion.div>
         )}

         {/* Brand Rewards Section */}
         {activeSection === 'brand' && (
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
           <div>
             <h2 className="text-lg md:text-2xl font-black text-white mb-2 md:mb-3 flex items-center gap-2">
               <Gift className="w-5 md:w-6 h-5 md:h-6 text-purple-500" />
               Brand Rewards
             </h2>
             <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl text-center">
               <p className="text-slate-400 mb-4">Coming soon! Earn discount codes and gift cards from top brands.</p>
               <Button
                 onClick={() => window.location.href = '/pages/BrandDiscounts'}
                 className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
               >
                 View Brand Discounts
               </Button>
             </Card>
           </div>
         </motion.div>
         )}

         {/* Claimed Rewards History */}
        {claimedBonuses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-4 md:mt-6">
            <h2 className="text-lg md:text-2xl font-black text-white mb-2 md:mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 md:w-6 h-5 md:h-6 text-green-500" />
              Claimed
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {claimedBonuses.map((bonus) => (
                <Card key={bonus.id} className="bg-slate-800/40 backdrop-blur-xl border border-green-500/30 p-3 md:p-4 rounded-xl md:rounded-2xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white mb-1 text-sm md:text-base truncate">{bonus.offer_details}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-400">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{new Date(bonus.created_date).toLocaleDateString()}</span>
                      </div>
                      {bonus.redeemed && (
                        <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] md:text-xs mt-1.5 inline-block">
                          ✓ Redeemed
                        </Badge>
                      )}
                    </div>
                    <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="bg-slate-900 border border-cyan-500/40 p-8 rounded-3xl max-w-md mx-auto text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Reward Claimed!</h3>
                <p className="text-slate-400 mb-6">Show this QR code at redemption to claim your reward</p>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl mb-6">
                  <div className="w-48 h-48 bg-white rounded-xl flex items-center justify-center mx-auto">
                    <QrCode className="w-32 h-32 text-slate-900" />
                  </div>
                </div>
                <Button
                  onClick={() => setShowQRModal(false)}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-xl"
                >
                  Done
                </Button>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}