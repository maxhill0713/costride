import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle, Building2, MapPin, ArrowLeft } from 'lucide-react';
import ClaimedRewardCard from '../components/rewards/ClaimedRewardCard';
import { useTranslation } from 'react-i18next';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 p-6">
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

            {/* Available Rewards */}
            {unclaimedRewards.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  {t('profile.availableRewards')} ({unclaimedRewards.length})
                </h4>
                <div className="grid gap-4">
                  {unclaimedRewards.map((reward) => {
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