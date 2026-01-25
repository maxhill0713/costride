import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, BarChart3, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Premium() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: () => base44.entities.Subscription.filter({ user_id: currentUser.id }),
    enabled: !!currentUser
  });

  const hasActiveSub = subscription?.[0]?.status === 'active';

  const checkoutMutation = useMutation({
    mutationFn: async (plan) => {
      const response = await base44.functions.invoke('createSubscriptionCheckout', {
        priceId: plan.priceId,
        subscriptionType: plan.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Check if running in iframe
        if (window.self !== window.top) {
          toast.error('Please open this page in a new tab to complete checkout');
          return;
        }
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
    }
  });

  const monthlyPrice = 4.99;
  const yearlyPrice = 49.99; // ~2 months free

  const userPlans = [
    {
      id: 'user_premium',
      name: 'Premium Member',
      monthlyPrice: monthlyPrice,
      yearlyPrice: yearlyPrice,
      monthlyPriceId: 'price_1SsCGXBzxbKKg1zZT7cHR7uh',
      yearlyPriceId: 'price_1SsCqKBzxbKKg1zZ5INp9GWN',
      icon: Crown,
      color: 'from-purple-500 to-pink-500',
      features: [
        'Unlock brand rewards - earn double the rewards',
        'Exclusive discounts & limited drops',
        'Free products from premium partners',
        'Early access + priority redemption',
        'Exclusive leaderboard badges',
        'Ad-free experience'
      ]
    }
  ];





  const handleSubscribe = (plan) => {
    const priceId = billingCycle === 'yearly' ? plan.yearlyPriceId : plan.monthlyPriceId;
    checkoutMutation.mutate({ ...plan, priceId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-b from-slate-900/50 to-transparent px-4 pt-8 pb-12 border-b border-blue-700/40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Premium Membership</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Unlock exclusive rewards, early access to drops, and double your earnings
          </p>
        </div>
      </div>

      {/* User Plans */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid gap-8 max-w-lg mx-auto">
          {userPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className="relative overflow-hidden bg-gradient-to-br from-slate-800/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-purple-600/30 shadow-lg">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                  </div>

                  {/* Billing Cycle Toggle */}
                  <div className="flex items-center gap-2 mb-8 p-1 bg-slate-700/50 rounded-2xl border border-slate-600/30">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                        billingCycle === 'monthly'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`flex-1 px-4 py-2 rounded-xl font-bold transition-all text-sm ${
                        billingCycle === 'yearly'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Yearly
                        <Badge className="bg-green-500 text-white text-xs">17% OFF</Badge>
                      </div>
                    </button>
                  </div>

                  <div className="mb-8 bg-slate-700/30 rounded-2xl p-6 border border-slate-600/30">
                    {billingCycle === 'monthly' ? (
                      <div>
                        <span className="text-5xl font-black text-white">${plan.monthlyPrice}</span>
                        <span className="text-slate-400 ml-2">/month</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-5xl font-black text-white">${plan.yearlyPrice}</span>
                        <span className="text-slate-400 ml-2">/year</span>
                        <div className="text-sm text-slate-300 mt-3">
                          ${(plan.yearlyPrice / 12).toFixed(2)}/month • Save 2 months
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={hasActiveSub || checkoutMutation.isPending}
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-bold h-12 rounded-xl`}
                  >
                    {checkoutMutation.isPending ? 'Loading...' : hasActiveSub ? 'Current Plan' : 'Subscribe Now'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>



      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 border-t border-blue-700/40">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3">What You Get</h2>
          <p className="text-slate-400">Everything you need to maximize your fitness rewards</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 text-center bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-600/40 hover:border-purple-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Exclusive Rewards</h3>
            <p className="text-sm text-slate-400">Premium-only discounts & limited drops</p>
          </Card>

          <Card className="p-6 text-center bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-600/40 hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Double Rewards</h3>
            <p className="text-sm text-slate-400">Earn 2x rewards on every check-in</p>
          </Card>

          <Card className="p-6 text-center bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-600/40 hover:border-orange-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Early Access</h3>
            <p className="text-sm text-slate-400">First to claim limited quantity rewards</p>
          </Card>

          <Card className="p-6 text-center bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm border border-slate-600/40 hover:border-green-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Free Products</h3>
            <p className="text-sm text-slate-400">Premium partner gifts & samples</p>
          </Card>
        </div>
      </div>
    </div>
  );
}