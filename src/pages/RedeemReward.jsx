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
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ['activeChallenges'],
    queryFn: () => base44.entities.Challenge.filter({ status: 'active' })
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
    mutationFn: async (rewardId) => {
      return await base44.entities.ClaimedBonus.create({
        user_id: currentUser.id,
        reward_id: rewardId,
        offer_details: selectedReward.title,
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
      setShowQRModal(true);
    }
  });

  const userChallengeProgress = challenges.map(challenge => {
    const participants = challenge.participants || [];
    const progress = Math.floor((participants.length / Math.max(participants.length, 5)) * 100);
    return { ...challenge, progress, participantCount: participants.length };
  }).sort((a, b) => b.progress - a.progress);

  const unclaimedRewards = rewards.filter(r => r.active && !claimedBonuses.find(cb => cb.reward_id === r.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-black text-white mb-1">Rewards & Challenges</h1>
          <p className="text-xs md:text-sm text-slate-400">Earn rewards, conquer challenges, claim prizes</p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
          {/* Stats Cards */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-3 md:p-4 rounded-xl md:rounded-2xl hover:border-cyan-500/30 transition-all">
              <div className="flex flex-col items-center text-center">
                <Trophy className="w-6 md:w-8 h-6 md:h-8 text-amber-500/60 mb-1" />
                <p className="text-slate-400 text-[10px] md:text-xs">Challenges</p>
                <p className="text-xl md:text-2xl font-black text-white">{userChallengeProgress.length}</p>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-3 md:p-4 rounded-xl md:rounded-2xl hover:border-cyan-500/30 transition-all">
              <div className="flex flex-col items-center text-center">
                <Gift className="w-6 md:w-8 h-6 md:h-8 text-cyan-500/60 mb-1" />
                <p className="text-slate-400 text-[10px] md:text-xs">Available</p>
                <p className="text-xl md:text-2xl font-black text-white">{unclaimedRewards.length}</p>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-3 md:p-4 rounded-xl md:rounded-2xl hover:border-cyan-500/30 transition-all">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-6 md:w-8 h-6 md:h-8 text-green-500/60 mb-1" />
                <p className="text-slate-400 text-[10px] md:text-xs">Claimed</p>
                <p className="text-xl md:text-2xl font-black text-white">{claimedBonuses.length}</p>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Active Challenges Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-500" />
              Active Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userChallengeProgress.length === 0 ? (
                <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl col-span-2 text-center">
                  <p className="text-slate-400">No active challenges at the moment</p>
                </Card>
              ) : (
                userChallengeProgress.map((challenge) => (
                  <Card key={challenge.id} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl hover:border-amber-500/40 transition-all overflow-hidden group">
                    <div className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-1">{challenge.title}</h3>
                          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                            {challenge.category}
                          </Badge>
                        </div>
                        <Trophy className="w-6 h-6 text-amber-500" />
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">{challenge.participantCount} participants</span>
                          <span className="text-sm font-bold text-cyan-400">{challenge.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${challenge.progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full shadow-lg shadow-cyan-500/50"
                          />
                        </div>
                      </div>

                      {challenge.reward && (
                        <div className="flex items-center gap-2 text-sm">
                          <Gift className="w-4 h-4 text-cyan-400" />
                          <span className="text-slate-300">{challenge.reward}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* My Rewards Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div>
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
              <Gift className="w-6 h-6 text-cyan-500" />
              My Rewards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unclaimedRewards.length === 0 ? (
                <Card className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl col-span-2 text-center">
                  <p className="text-slate-400">No rewards available to claim right now</p>
                </Card>
              ) : (
                unclaimedRewards.map((reward) => (
                  <Card key={reward.id} className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl hover:border-cyan-500/40 transition-all group overflow-hidden">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-2">{reward.title}</h3>
                        <p className="text-sm text-slate-400 mb-3">{reward.description}</p>
                        <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs">
                          {reward.type}
                        </Badge>
                      </div>
                      <div className="text-2xl">{reward.icon}</div>
                    </div>

                    <div className="pt-3 border-t border-slate-700/50">
                      {reward.points_required > 0 && (
                        <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>{reward.points_required} points</span>
                        </div>
                      )}
                      <Button
                        onClick={() => {
                          setSelectedReward(reward);
                          claimMutation.mutate(reward.id);
                        }}
                        disabled={claimMutation.isPending}
                        className="w-full h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold rounded-xl transition-all"
                      >
                        {claimMutation.isPending ? 'Claiming...' : 'Claim Reward'}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Claimed Rewards History */}
        {claimedBonuses.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8">
            <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Claimed Rewards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claimedBonuses.map((bonus) => (
                <Card key={bonus.id} className="bg-slate-800/40 backdrop-blur-xl border border-green-500/30 p-5 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{bonus.offer_details}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                        <Clock className="w-3 h-3" />
                        <span>Claimed: {new Date(bonus.created_date).toLocaleDateString()}</span>
                      </div>
                      {bonus.redeemed && (
                        <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs mt-2">
                          ✓ Redeemed
                        </Badge>
                      )}
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-500" />
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