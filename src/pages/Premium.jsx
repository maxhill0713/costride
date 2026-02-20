import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star, BarChart3, Check, Brain, TrendingUp, Target, Award, Sparkles, Flame, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Premium() {
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
    mutationFn: async (priceId) => {
      const response = await base44.functions.invoke('createSubscriptionCheckout', {
        priceId: priceId,
        subscriptionType: 'user_premium'
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
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

  const monthlyPrice = 7.99;
  const yearlyPrice = 79.99; // ~2 months free

  const premiumFeatures = [
    {
      category: 'Advanced Analytics',
      icon: Brain,
      color: 'text-blue-400',
      features: [
        'AI-powered workout analysis and personalized guidance',
        'Real-time form improvement suggestions',
        'Advanced exercise metrics and body part tracking',
        'Weekly AI fitness recommendations'
      ]
    },
    {
      category: 'Performance Tracking',
      icon: TrendingUp,
      color: 'text-green-400',
      features: [
        'Exercise-specific weight progression trackers',
        'Personal records with detailed history',
        'Muscle group intensity heatmaps',
        'Peak performance time analysis'
      ]
    },
    {
      category: 'Challenges & Rewards',
      icon: Target,
      color: 'text-purple-400',
      features: [
        'Access to 2x more exclusive challenges',
        'Premium challenge categories',
        'Double reward points on all challenges',
        'Priority leaderboard placement'
      ]
    },
    {
      category: 'Exclusive Features',
      icon: Crown,
      color: 'text-amber-400',
      features: [
        'Advanced split day volume progress',
        'Workout program customization AI',
        'Unlimited workout notes and analytics',
        'Premium community access'
      ]
    },
    {
      category: 'Rewards & Earnings',
      icon: Sparkles,
      color: 'text-pink-400',
      features: [
        'Double brand rewards earnings',
        'Exclusive brand partnerships',
        'Early access to limited drops',
        'Ad-free experience everywhere'
      ]
    },
    {
      category: 'Community & Badges',
      icon: Award,
      color: 'text-orange-400',
      features: [
        'Exclusive premium member badge',
        'Access to elite leaderboards',
        'Priority in community features',
        'Special recognition & status'
      ]
    }
  ];

  const handleSubscribe = () => {
    const priceId = billingCycle === 'yearly' 
      ? 'price_1SsCqKBzxbKKg1zZ5INp9GWN' 
      : 'price_1SsCGXBzxbKKg1zZT7cHR7uh';
    checkoutMutation.mutate(priceId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-20">
      {/* Hero Section */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-transparent backdrop-blur-md px-4 pt-6 pb-8 border-b border-blue-700/40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white">Go Premium</h1>
          </div>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Unlock advanced AI analysis, 2x challenges, and exclusive features designed to transform your fitness journey
          </p>
        </div>
      </div>

      {/* Pricing Card - Sticky */}
      <div className="sticky top-24 z-30 px-4 py-4 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-transparent backdrop-blur-md border-b border-blue-700/20">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-br from-slate-800/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-purple-600/40 shadow-xl">
            <div className="p-6">
              {/* Billing Toggle */}
              <div className="flex items-center gap-2 mb-6 p-1 bg-slate-700/50 rounded-xl border border-slate-600/30">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                    billingCycle === 'monthly'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 px-4 py-2 rounded-lg font-bold transition-all text-sm ${
                    billingCycle === 'yearly'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    Yearly
                    <Badge className="bg-green-500 text-white text-xs">Save 17%</Badge>
                  </div>
                </button>
              </div>

              {/* Price Display */}
              <div className="bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-600/30">
                {billingCycle === 'monthly' ? (
                  <div>
                    <span className="text-5xl font-black text-white">${monthlyPrice}</span>
                    <span className="text-slate-400 ml-2">/month</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-5xl font-black text-white">${yearlyPrice}</span>
                    <span className="text-slate-400 ml-2">/year</span>
                    <div className="text-sm text-slate-300 mt-2">
                      ${(yearlyPrice / 12).toFixed(2)}/month
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubscribe}
                disabled={checkoutMutation.isPending || hasActiveSub}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-12 rounded-lg flex items-center justify-center gap-2"
              >
                {hasActiveSub ? 'Already Premium' : 'Start Free Trial'} <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-center text-xs text-slate-400 mt-3">
                14 days free, then {billingCycle === 'monthly' ? `$${monthlyPrice}/month` : `$${yearlyPrice}/year`}. Cancel anytime.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        {premiumFeatures.map((featureGroup, idx) => {
          const Icon = featureGroup.icon;
          return (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700/50`}>
                  <Icon className={`w-5 h-5 ${featureGroup.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-white">{featureGroup.category}</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {featureGroup.features.map((feature, i) => (
                  <Card 
                    key={i} 
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 hover:border-purple-500/30 transition-all hover:shadow-lg hover:shadow-purple-500/10 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                      <p className="text-slate-200">{feature}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 border-t border-blue-700/40">
        <h2 className="text-3xl font-black text-white mb-12 text-center">Premium vs Free</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 p-8">
            <h3 className="text-xl font-bold text-white mb-6">Free Member</h3>
            <ul className="space-y-3">
              {[
                'Basic workout logging',
                'Standard leaderboards',
                'Limited challenges',
                'Basic analytics',
                'Single reward tier'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                  <span className="text-slate-400">{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Premium */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/50 p-8 ring-2 ring-purple-500/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Premium Member</h3>
              <Badge className="bg-purple-600">Popular</Badge>
            </div>
            <ul className="space-y-3">
              {[
                'AI-powered form coaching',
                'Elite premium leaderboards',
                '2x exclusive challenges',
                'Advanced AI analysis & guidance',
                'Double reward earnings',
                'Exercise-specific weight trackers',
                'Unlimited analytics access',
                'Priority feature access'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-100 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Social Proof */}
      <div className="max-w-6xl mx-auto px-4 py-16 border-t border-blue-700/40">
        <h2 className="text-3xl font-black text-white mb-12 text-center">Why Members Love Premium</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: '3x More PRs',
              description: 'Premium members hit personal records 3x faster with AI guidance'
            },
            {
              title: '2x Earnings',
              description: 'Double your rewards and unlock exclusive brand partnerships'
            },
            {
              title: 'Elite Status',
              description: 'Stand out with premium badges and priority community placement'
            }
          ].map((item, idx) => (
            <Card 
              key={idx}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/30 p-6 text-center hover:border-purple-500/30 transition-all"
            >
              <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
              <p className="text-slate-400">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/50 p-8 text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Start Your Premium Journey</h3>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Get 14 days free to experience advanced AI coaching, 2x challenges, and comprehensive analytics designed to accelerate your fitness goals.
          </p>
          <Button
            onClick={handleSubscribe}
            disabled={checkoutMutation.isPending || hasActiveSub}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-lg inline-flex items-center gap-2"
          >
            {hasActiveSub ? 'Already Premium' : `Get Premium for $${monthlyPrice}/month`}
            {!hasActiveSub && <ArrowRight className="w-4 h-4" />}
          </Button>
        </Card>
      </div>
    </div>
  );
}