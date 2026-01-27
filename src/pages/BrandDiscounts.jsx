import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Tag, Calendar, CheckCircle, XCircle, AlertCircle, CreditCard, ArrowLeft, Trophy, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { format, differenceInDays } from 'date-fns';

export default function BrandDiscounts() {
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemStatus, setRedeemStatus] = useState(null); // null, 'success', 'error', 'expired', 'used'
  const [redeemMessage, setRedeemMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: () => base44.entities.Subscription.filter({ 
      user_id: currentUser.id,
      status: 'active'
    }),
    enabled: !!currentUser
  });

  const isPremium = subscription && subscription.length > 0;

  const { data: userCodes = [] } = useQuery({
    queryKey: ['brandDiscountCodes', currentUser?.id],
    queryFn: () => base44.entities.BrandDiscountCode.filter({ assigned_to: currentUser.id }),
    enabled: !!currentUser
  });

  const { data: challengeParticipants = [] } = useQuery({
    queryKey: ['challengeParticipants', currentUser?.id],
    queryFn: () => base44.entities.ChallengeParticipant.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const { data: allChallenges = [] } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => base44.entities.Challenge.list()
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.list()
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser?.id, status: 'active' }),
    enabled: !!currentUser
  });

  // Get user's joined challenges
  const userChallenges = challengeParticipants
    .map(cp => allChallenges.find(c => c.id === cp.challenge_id))
    .filter(Boolean);

  // Get gym rewards from user's gyms
  const userGymIds = gymMemberships.map(gm => gm.gym_id);
  const gymRewards = rewards.filter(r => userGymIds.includes(r.gym_id));

  const redeemMutation = useMutation({
    mutationFn: async (code) => {
      const allCodes = await base44.entities.BrandDiscountCode.list();
      const discountCode = allCodes.find(c => 
        c.code.toLowerCase() === code.toLowerCase() && 
        (c.assigned_to === currentUser.id || !c.assigned_to)
      );

      if (!discountCode) {
        throw new Error('Invalid code');
      }

      if (discountCode.status === 'used') {
        throw new Error('Code already used');
      }

      if (discountCode.expiry_date && new Date(discountCode.expiry_date) < new Date()) {
        throw new Error('Code expired');
      }

      return base44.entities.BrandDiscountCode.update(discountCode.id, {
        status: 'used',
        assigned_to: currentUser.id,
        redeemed_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      setRedeemStatus('success');
      setRedeemMessage('Discount code redeemed successfully!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      queryClient.invalidateQueries({ queryKey: ['brandDiscountCodes'] });
      setRedeemCode('');
    },
    onError: (error) => {
      if (error.message === 'Code already used') {
        setRedeemStatus('used');
        setRedeemMessage('This code has already been used');
      } else if (error.message === 'Code expired') {
        setRedeemStatus('expired');
        setRedeemMessage('This code has expired');
      } else {
        setRedeemStatus('error');
        setRedeemMessage('Invalid discount code');
      }
    }
  });

  const handleRedeem = () => {
    if (!redeemCode.trim()) return;
    setRedeemStatus(null);
    redeemMutation.mutate(redeemCode.trim());
  };

  const unusedCodes = userCodes.filter(c => c.status === 'unused' && (!c.expiry_date || new Date(c.expiry_date) >= new Date()));
  const usedCodes = userCodes.filter(c => c.status === 'used');
  const expiredCodes = userCodes.filter(c => c.expiry_date && new Date(c.expiry_date) < new Date() && c.status === 'unused');

  // Split by type
  const unusedDiscounts = unusedCodes.filter(c => c.type === 'discount_code');
  const unusedGiftCards = unusedCodes.filter(c => c.type === 'gift_card');
  const usedDiscounts = usedCodes.filter(c => c.type === 'discount_code');
  const usedGiftCards = usedCodes.filter(c => c.type === 'gift_card');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="text-white hover:bg-white/10 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="text-center mb-8">
          <div className="w-12 md:w-16 h-12 md:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-6 md:w-8 h-6 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">Rewards & Challenges</h1>
          <p className="text-sm md:text-base text-slate-300">Track your challenges and rewards</p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="challenges" className="mb-6">
          <TabsList className="w-full bg-slate-800/50 p-1 rounded-xl mb-6">
            <TabsTrigger value="challenges" className="flex-1">
              <Trophy className="w-4 h-4 mr-2" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="gym-rewards" className="flex-1">
              <Target className="w-4 h-4 mr-2" />
              Gym Rewards
            </TabsTrigger>
            <TabsTrigger value="brand-rewards" className="flex-1">
              <Gift className="w-4 h-4 mr-2" />
              Brand Rewards
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            {userChallenges.length > 0 ? (
              <div className="space-y-3">
                {userChallenges.map((challenge) => {
                  const participant = challengeParticipants.find(cp => cp.challenge_id === challenge.id);
                  const progress = participant?.progress || 0;
                  const progressPercentage = challenge.target_value ? (progress / challenge.target_value) * 100 : 0;
                  const daysLeft = challenge.end_date ? differenceInDays(new Date(challenge.end_date), new Date()) : 0;
                  
                  return (
                    <Card key={challenge.id} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-5">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white text-base">{challenge.title}</h4>
                          {challenge.status === 'active' && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        {challenge.description && (
                          <p className="text-sm text-slate-300 mb-2">{challenge.description}</p>
                        )}
                        {challenge.reward && (
                          <div className="flex items-center gap-2 mb-3">
                            <Gift className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400 font-semibold">{challenge.reward}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-400">Progress</span>
                          <span className="text-xs font-semibold text-slate-200">
                            {progress} / {challenge.target_value}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon'}
                        </div>
                        {challenge.category && (
                          <span className="capitalize">{challenge.category.replace('_', ' ')}</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-12 text-center">
                <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Active Challenges</h3>
                <p className="text-slate-300">Join challenges from your gym community to see them here!</p>
              </Card>
            )}
          </TabsContent>

          {/* Gym Rewards Tab */}
          <TabsContent value="gym-rewards">
            {gymRewards.length > 0 ? (
              <div className="space-y-3">
                {gymRewards.map((reward) => (
                  <Card key={reward.id} className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-5 h-5 text-orange-600" />
                          <h4 className="font-bold text-gray-900">{reward.title}</h4>
                          {reward.value && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                              {reward.value}
                            </span>
                          )}
                        </div>
                        {reward.description && (
                          <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="capitalize">{reward.type?.replace('_', ' ')}</span>
                          {reward.points_required > 0 && (
                            <span>{reward.points_required} points required</span>
                          )}
                          {reward.requirement !== 'points' && reward.requirement !== 'none' && (
                            <span className="capitalize">{reward.requirement.replace('_', ' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-12 text-center">
                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Gym Rewards</h3>
                <p className="text-slate-300">Join a gym to see available rewards!</p>
              </Card>
            )}
          </TabsContent>

          {/* Brand Rewards Tab */}
          <TabsContent value="brand-rewards">
            {!isPremium ? (
              <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/50 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Premium Members Only</h3>
                <p className="text-slate-300 mb-6">Unlock exclusive brand rewards, discounts, and free products with Premium</p>
                <Button
                  onClick={() => window.location.href = '/pages/Premium'}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl h-12 px-8"
                >
                  Upgrade to Premium
                </Button>
              </Card>
            ) : (
              <>
        {/* Redeem Code Section */}
        <Card className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Tag className="w-5 md:w-6 h-5 md:h-6 text-purple-400 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-bold text-white">Redeem Code</h3>
              <p className="text-xs md:text-sm text-slate-300">Enter your discount code below</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleRedeem()}
              placeholder="Enter code..."
              className="bg-slate-800/50 border-slate-600 text-white rounded-xl uppercase"
              maxLength={20}
            />
            <Button
              onClick={handleRedeem}
              disabled={!redeemCode.trim() || redeemMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl px-4 md:px-8 text-sm md:text-base whitespace-nowrap"
            >
              {redeemMutation.isPending ? 'Checking...' : 'Redeem'}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {redeemStatus === 'success' && (
              <motion.div
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-600/30 rounded-lg"
              >
               <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-green-400 flex-shrink-0" />
               <p className="text-xs md:text-sm text-green-300 font-medium">{redeemMessage}</p>
              </motion.div>
            )}

            {redeemStatus === 'error' && (
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-600/30 rounded-lg"
               >
                 <XCircle className="w-4 md:w-5 h-4 md:h-5 text-red-400 flex-shrink-0" />
                 <p className="text-xs md:text-sm text-red-300 font-medium">{redeemMessage}</p>
               </motion.div>
             )}

            {redeemStatus === 'used' && (
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="flex items-center gap-2 p-3 bg-orange-900/30 border border-orange-600/30 rounded-lg"
               >
                 <AlertCircle className="w-4 md:w-5 h-4 md:h-5 text-orange-400 flex-shrink-0" />
                 <p className="text-xs md:text-sm text-orange-300 font-medium">{redeemMessage}</p>
               </motion.div>
             )}

            {redeemStatus === 'expired' && (
               <motion.div
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 className="flex items-center gap-2 p-3 bg-gray-900/30 border border-gray-600/30 rounded-lg"
               >
                 <AlertCircle className="w-4 md:w-5 h-4 md:h-5 text-gray-400 flex-shrink-0" />
                 <p className="text-xs md:text-sm text-gray-300 font-medium">{redeemMessage}</p>
               </motion.div>
             )}
          </AnimatePresence>
        </Card>

        {/* Tabs for Active Items */}
        {unusedCodes.length > 0 && (
          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="w-full bg-slate-800/50 p-1 rounded-xl mb-4">
              <TabsTrigger value="all" className="flex-1">All ({unusedCodes.length})</TabsTrigger>
              <TabsTrigger value="discounts" className="flex-1">Discounts ({unusedDiscounts.length})</TabsTrigger>
              <TabsTrigger value="giftcards" className="flex-1">Gift Cards ({unusedGiftCards.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {unusedCodes.map((code) => (
                <Card key={code.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                         {code.type === 'gift_card' ? (
                           <CreditCard className="w-4 md:w-5 h-4 md:h-5 text-purple-600 flex-shrink-0" />
                         ) : (
                           <Tag className="w-4 md:w-5 h-4 md:h-5 text-blue-600 flex-shrink-0" />
                         )}
                         <h4 className="font-bold text-gray-900 text-sm md:text-base">{code.brand}</h4>
                         <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                           {code.discount_value}
                         </span>
                       </div>
                      {code.description && (
                        <p className="text-xs md:text-sm text-gray-600 mb-2">{code.description}</p>
                      )}
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-[10px] md:text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3 flex-shrink-0" />
                          <span className="font-mono font-bold truncate">{code.code}</span>
                        </div>
                        {code.expiry_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>Expires {new Date(code.expiry_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="discounts" className="space-y-3">
              {unusedDiscounts.length > 0 ? (
                unusedDiscounts.map((code) => (
                  <Card key={code.id} className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-gray-900">{code.brand}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            {code.discount_value}
                          </span>
                        </div>
                        {code.description && (
                          <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span className="font-mono font-bold">{code.code}</span>
                          </div>
                          {code.expiry_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Expires {new Date(code.expiry_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No discount codes available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="giftcards" className="space-y-3">
              {unusedGiftCards.length > 0 ? (
                unusedGiftCards.map((code) => (
                  <Card key={code.id} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                          <h4 className="font-bold text-gray-900">{code.brand}</h4>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-black rounded-full">
                            {code.discount_value}
                          </span>
                        </div>
                        {code.description && (
                          <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span className="font-mono font-bold">{code.code}</span>
                          </div>
                          {code.expiry_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Expires {new Date(code.expiry_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No gift cards available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Used Codes */}
        {usedCodes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base md:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 md:w-5 h-4 md:h-5 text-slate-400 flex-shrink-0" />
              Redeemed ({usedCodes.length})
            </h3>
            <Tabs defaultValue="all">
              <TabsList className="w-full bg-slate-800/50 p-1 rounded-xl mb-4">
                <TabsTrigger value="all" className="flex-1">All ({usedCodes.length})</TabsTrigger>
                <TabsTrigger value="discounts" className="flex-1">Discounts ({usedDiscounts.length})</TabsTrigger>
                <TabsTrigger value="giftcards" className="flex-1">Gift Cards ({usedGiftCards.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3">
                {usedCodes.map((code) => (
                  <Card key={code.id} className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 p-5 opacity-75">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {code.type === 'gift_card' ? (
                            <CreditCard className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Tag className="w-5 h-5 text-gray-600" />
                          )}
                          <h4 className="font-bold text-gray-900">{code.brand}</h4>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                            {code.discount_value}
                          </span>
                        </div>
                        {code.description && (
                          <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span className="font-mono">{code.code}</span>
                          </div>
                          {code.redeemed_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Redeemed {new Date(code.redeemed_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="discounts" className="space-y-3">
                {usedDiscounts.length > 0 ? usedDiscounts.map((code) => (
                  <Card key={code.id} className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 p-5 opacity-75">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-5 h-5 text-gray-600" />
                          <h4 className="font-bold text-gray-900">{code.brand}</h4>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                            {code.discount_value}
                          </span>
                        </div>
                        {code.description && (
                          <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span className="font-mono">{code.code}</span>
                          </div>
                          {code.redeemed_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Redeemed {new Date(code.redeemed_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>No redeemed discount codes</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="giftcards" className="space-y-3">
                {usedGiftCards.length > 0 ? usedGiftCards.map((code) => (
                  <Card key={code.id} className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 p-5 opacity-75">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-5 h-5 text-gray-600" />
                          <h4 className="font-bold text-gray-900">{code.brand}</h4>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                            {code.discount_value}
                          </span>
                        </div>
                        {code.description && (
                          <p className="text-sm text-gray-600 mb-2">{code.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span className="font-mono">{code.code}</span>
                          </div>
                          {code.redeemed_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Redeemed {new Date(code.redeemed_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>No redeemed gift cards</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Expired Codes */}
        {expiredCodes.length > 0 && (
          <div>
            <h3 className="text-base md:text-lg font-bold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 md:w-5 h-4 md:h-5 text-red-400 flex-shrink-0" />
              Expired Codes ({expiredCodes.length})
            </h3>
            <div className="space-y-3">
              {expiredCodes.map((code) => (
                <Card key={code.id} className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300 p-5 opacity-60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-900">{code.brand}</h4>
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                          Expired
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Expired {new Date(code.expiry_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {unusedCodes.length === 0 && usedCodes.length === 0 && expiredCodes.length === 0 && (
        <Card className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 md:p-12 text-center">
          <Gift className="w-12 md:w-16 h-12 md:h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">No Codes Yet</h3>
          <p className="text-sm md:text-base text-slate-300 mb-4">You don't have any discount codes. Enter a code above to get started!</p>
        </Card>
        )}
              </>
          )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}