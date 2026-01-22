import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, TrendingUp, Users, BarChart3, Star, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Premium() {
  const [selectedPlan, setSelectedPlan] = useState(null);
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

  const subscribeMutation = useMutation({
    mutationFn: (plan) => base44.entities.Subscription.create({
      user_id: currentUser.id,
      subscriber_name: currentUser.full_name,
      subscription_type: plan.id,
      status: 'trial',
      start_date: new Date().toISOString().split('T')[0],
      amount: plan.price
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast.success('Welcome to Premium! 🎉');
    }
  });

  const userPlans = [
    {
      id: 'user_premium',
      name: 'Premium Member',
      price: 4.99,
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
    subscribeMutation.mutate(plan);
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
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-900 mb-2">For Members</h2>
          <p className="text-gray-600">Enhance your workout experience</p>
        </div>

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
                  
                  <div className="mb-6">
                    <span className="text-5xl font-black text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
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
                    disabled={hasActiveSub}
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white font-bold h-14 rounded-2xl text-lg`}
                  >
                    {hasActiveSub ? 'Current Plan' : 'Start 7-Day Free Trial'}
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