import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, CheckCircle, Building2, MapPin, ArrowLeft, Crown, Sparkles, Lock } from 'lucide-react';
import ClaimedRewardCard from '../components/rewards/ClaimedRewardCard';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function GymRewards() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser
  });

  const isPremium = subscription?.[0]?.subscription_type === 'user_premium';

  const { data: allRewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.list()
  });

  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser
  });

  const { data: allGyms = [] } = useQuery({
    queryKey: ['gyms'],
    queryFn: () => base44.entities.Gym.list()
  });

  const { data: claimedBonuses = [] } = useQuery({
    queryKey: ['claimedBonuses', currentUser?.id],
    queryFn: () => base44.entities.ClaimedBonus.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => base44.entities.CheckIn.list('-check_in_date')
  });

  const claimRewardMutation = useMutation({
    mutationFn: async ({ reward, userId }) => {
      const redemptionCode = `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      await base44.entities.ClaimedBonus.create({
        user_id: userId,
        gym_id: reward.gym_id,
        bonus_type: reward.type === 'discount' ? 'gym_offer' : 'free_day_pass',
        offer_details: reward.title,
        redemption_code: redemptionCode,
        redeemed: false
      });
      
      return base44.entities.Reward.update(reward.id, {
        claimed_by: [...(reward.claimed_by || []), userId]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['claimedBonuses'] });
    }
  });

  const memberGymIds = gymMemberships.map(m => m.gym_id);
  const memberGyms = allGyms.filter(g => memberGymIds.includes(g.id));
  const availableRewards = allRewards.filter(r => 
    r.active && memberGymIds.includes(r.gym_id)
  );

  const userCheckIns = checkIns.filter(c => c.user_id === currentUser?.id);
  const userCheckInCount = userCheckIns.length;
  const currentStreak = currentUser?.current_streak || 0;
  
  const hasClaimedReward = (reward) => reward.claimed_by?.includes(currentUser?.id);
  const claimedRewards = availableRewards.filter(r => hasClaimedReward(r));
  const unclaimedRewards = availableRewards.filter(r => !hasClaimedReward(r));

  // Separate premium and regular rewards
  const premiumRewards = unclaimedRewards.filter(r => r.premium_only);
  const regularRewards = unclaimedRewards.filter(r => !r.premium_only);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
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
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">In-Gym Rewards</h1>
          <p className="text-slate-300">Claim free day passes and exclusive gym offers</p>
        </div>

        {availableRewards.length === 0 ? (
          <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-8 text-center shadow-lg">
            <Gift className="w-16 h-16 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-300 mb-2">{t('profile.noRewards')}</p>
            <p className="text-sm text-slate-400">{t('profile.joinGym')}</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Claimed Rewards */}
            {claimedRewards.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-green-300 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {t('profile.claimedRewards')} ({claimedRewards.length})
                </h4>
                <div className="grid gap-4">
                  {claimedRewards.map((reward) => {
                    const claimedBonus = claimedBonuses.find(cb => 
                      cb.gym_id === reward.gym_id && 
                      cb.offer_details === reward.title
                    );
                    const gym = allGyms.find(g => g.id === reward.gym_id);
                    
                    return claimedBonus ? (
                      <ClaimedRewardCard
                        key={reward.id}
                        claimedBonus={claimedBonus}
                        reward={reward}
                        gym={gym}
                      />
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Premium Upgrade Banner */}
            {!isPremium && premiumRewards.length > 0 && (
              <Link to={createPageUrl('Premium')}>
                <Card className="p-5 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 border-2 border-yellow-400/50 text-white hover:shadow-2xl hover:shadow-purple-500/50 transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5" />
                      <Badge className="bg-yellow-400 text-purple-900 border-0 font-bold">
                        PREMIUM EXCLUSIVE
                      </Badge>
                    </div>
                    <h3 className="font-black text-xl mb-1">Unlock {premiumRewards.length} Premium Rewards</h3>
                    <p className="text-white/90 text-sm mb-3">
                      Get bigger discounts, limited rewards & premium brands for £4.99/mo
                    </p>
                    <Button className="bg-white text-purple-600 hover:bg-white/90 font-bold rounded-xl">
                      Upgrade to Premium
                    </Button>
                  </div>
                </Card>
              </Link>
            )}

            {/* Premium Rewards Section */}
            {premiumRewards.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Premium Rewards ({premiumRewards.length})
                  </h4>
                  {!isPremium && (
                    <Link to={createPageUrl('Premium')}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Go Premium
                      </Button>
                    </Link>
                  )}
                </div>
                <div className="grid gap-4">
                  {premiumRewards.map((reward) => {
                    const meetsRequirement = (() => {
                      switch (reward.requirement) {
                        case 'check_ins_10':
                          return userCheckInCount >= 10;
                        case 'check_ins_50':
                          return userCheckInCount >= 50;
                        case 'streak_30':
                          return currentStreak >= 30;
                        case 'none':
                          return true;
                        case 'points':
                          return true;
                        default:
                          return false;
                      }
                    })();

                    const isQuantityLimited = reward.quantity_limited && reward.max_quantity;
                    const quantityRemaining = isQuantityLimited ? reward.max_quantity - (reward.claimed_by?.length || 0) : null;
                    const canClaim = isPremium && meetsRequirement && (!isQuantityLimited || quantityRemaining > 0);

                    return (
                      <Card key={reward.id} className={`p-5 border-2 transition-all relative ${
                        !isPremium 
                          ? 'bg-slate-800/50 border-purple-500/50' 
                          : canClaim 
                            ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/50' 
                            : 'bg-slate-800/50 border-slate-600/50'
                      }`}>
                        {!isPremium && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                            <div className="text-center px-4">
                              <Crown className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                              <p className="text-white font-bold mb-2">Premium Only</p>
                              <Link to={createPageUrl('Premium')}>
                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                                  Unlock
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )}
                        <Badge className="absolute top-3 right-3 bg-purple-600 text-white border-0 z-20">
                          <Crown className="w-3 h-3 mr-1" />
                          PREMIUM
                        </Badge>
                        {isQuantityLimited && quantityRemaining !== null && (
                          <Badge className="absolute top-3 left-3 bg-orange-600 text-white border-0 animate-pulse z-20">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {quantityRemaining} left
                          </Badge>
                        )}
                        <div className="flex items-start gap-4 mt-6">
                          <div className="text-4xl">{reward.icon || '🎁'}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-bold text-white">{reward.title}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">{reward.gym_name}</p>
                              </div>
                              {reward.value && (
                                <span className="px-2 py-1 bg-purple-500/30 text-purple-200 text-xs font-bold rounded-full border border-purple-500/50">
                                  {reward.value}
                                </span>
                              )}
                            </div>
                            
                            {reward.description && (
                              <p className="text-sm text-slate-300 mb-3">{reward.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full capitalize border border-purple-500/30">
                                  {reward.requirement.replace(/_/g, ' ')}
                                </span>
                                <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs font-medium rounded-full capitalize border border-pink-500/30">
                                  {reward.type.replace(/_/g, ' ')}
                                </span>
                              </div>
                              
                              {isPremium && (
                                !meetsRequirement ? (
                                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    {t('profile.locked')}
                                  </span>
                                ) : isQuantityLimited && quantityRemaining === 0 ? (
                                  <span className="text-xs text-slate-400 font-medium">
                                    Sold Out
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => claimRewardMutation.mutate({
                                      reward,
                                      userId: currentUser.id
                                    })}
                                    disabled={claimRewardMutation.isPending}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
                                  >
                                    {t('profile.claimNow')}
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Regular Rewards */}
            {regularRewards.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-cyan-300 mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  {t('profile.availableRewards')} ({regularRewards.length})
                </h4>
                <div className="grid gap-4">
                  {regularRewards.map((reward) => {
                    const meetsRequirement = (() => {
                      switch (reward.requirement) {
                        case 'check_ins_10':
                          return userCheckInCount >= 10;
                        case 'check_ins_50':
                          return userCheckInCount >= 50;
                        case 'streak_30':
                          return currentStreak >= 30;
                        case 'none':
                          return true;
                        case 'points':
                          return true;
                        default:
                          return false;
                      }
                    })();

                    return (
                      <Card key={reward.id} className={`p-5 border-2 transition-all ${
                        meetsRequirement 
                          ? 'bg-white border-purple-200 hover:shadow-lg' 
                          : 'bg-white border-gray-200 opacity-60'
                      }`}>
                        <div className="flex items-start gap-4">
                          <div className="text-4xl">{reward.icon || '🎁'}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <h4 className="font-bold text-gray-900">{reward.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{reward.gym_name}</p>
                              </div>
                              {reward.value && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                  {reward.value}
                                </span>
                              )}
                            </div>
                            
                            {reward.description && (
                              <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full capitalize">
                                  {reward.requirement.replace(/_/g, ' ')}
                                </span>
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full capitalize">
                                  {reward.type.replace(/_/g, ' ')}
                                </span>
                              </div>
                              
                              {!meetsRequirement ? (
                                <span className="text-xs text-gray-500 font-medium">
                                  {t('profile.locked')}
                                </span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => claimRewardMutation.mutate({
                                    reward,
                                    userId: currentUser.id
                                  })}
                                  disabled={claimRewardMutation.isPending}
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
                                >
                                  {t('profile.claimNow')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}