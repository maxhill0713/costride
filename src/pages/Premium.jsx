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
      yearlyPriceId: 'price_REPLACE_WITH_YEARLY_PREMIUM_PRICE_ID', // TODO: Replace with actual yearly price ID
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Crown className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-black mb-4">Unlock Premium Features</h1>
          <p className="text-xl text-purple-100">
            Take your fitness journey to the next level
          </p>
        </div>
      </div>

      {/* User Plans */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid gap-8 max-w-md mx-auto">
          {userPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card key={plan.id} className="relative overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all">
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${plan.color}`} />
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                      </div>
                    </div>
                    </div>

                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center justify-center gap-3 mb-6 p-1 bg-gray-100 rounded-2xl">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        billingCycle === 'monthly'
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`px-6 py-3 rounded-xl font-bold transition-all ${
                        billingCycle === 'yearly'
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        Yearly
                        <Badge className="bg-green-500 text-white text-xs">Save 17%</Badge>
                      </div>
                    </button>
                    </div>

                    <div className="mb-6">
                    {billingCycle === 'monthly' ? (
                      <>
                        <span className="text-5xl font-black text-gray-900">${plan.monthlyPrice}</span>
                        <span className="text-gray-500">/month</span>
                      </>
                    ) : (
                      <>
                        <span className="text-5xl font-black text-gray-900">${plan.yearlyPrice}</span>
                        <span className="text-gray-500">/year</span>
                        <div className="text-sm text-gray-600 mt-2">
                          ${(plan.yearlyPrice / 12).toFixed(2)}/month • 2 MONTHS FREE
                        </div>
                      </>
                    )}
                    </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    disabled={hasActiveSub || checkoutMutation.isPending}
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-bold h-14 rounded-2xl text-lg`}
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
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-2">Why Go Premium?</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 text-center border-2 border-gray-200">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Exclusive Rewards</h3>
            <p className="text-sm text-gray-600">Premium-only discounts & limited drops</p>
          </Card>

          <Card className="p-6 text-center border-2 border-gray-200">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Double Rewards</h3>
            <p className="text-sm text-gray-600">Earn 2x rewards on every check-in</p>
          </Card>

          <Card className="p-6 text-center border-2 border-gray-200">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Early Access</h3>
            <p className="text-sm text-gray-600">First to claim limited quantity rewards</p>
          </Card>

          <Card className="p-6 text-center border-2 border-gray-200">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Free Products</h3>
            <p className="text-sm text-gray-600">Premium partner gifts & samples</p>
          </Card>
        </div>
      </div>
    </div>
  );
}