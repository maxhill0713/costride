import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, BarChart3, Check, Brain, TrendingUp, Target, Award, Sparkles, Flame, ArrowRight, Lightbulb, Users, Shield, Bolt } from 'lucide-react';
import { toast } from 'sonner';

export default function Premium() {
  const [billingCycle, setBillingCycle] = useState('monthly');

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
    onError: () => {
      toast.error('Failed to start checkout. Please try again.');
    }
  });

  const monthlyPrice = 7.99;
  const yearlyPrice = 79.99;

  const mainFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced workout analysis with AI-powered insights and personalized guidance based on your performance'
    },
    {
      icon: BarChart3,
      title: 'Advanced Metrics',
      description: 'Exercise-specific trackers, body part intensity maps, and detailed performance history'
    },
    {
      icon: Zap,
      title: '2x More Challenges',
      description: 'Double the challenges, double the rewards. Access exclusive challenge categories'
    },
    {
      icon: TrendingUp,
      title: 'Performance Insights',
      description: 'Peak performance time analysis, progression tracking, and muscle group optimization'
    },
    {
      icon: Target,
      title: 'Double Rewards',
      description: 'Earn 2x brand rewards and get priority leaderboard placement'
    },
    {
      icon: Crown,
      title: 'Exclusive Features',
      description: 'Advanced split customization, unlimited notes, and premium community access'
    }
  ];

  const detailedFeatures = [
    {
      category: 'Analytics & Intelligence',
      color: 'from-blue-500/20 via-cyan-500/20 to-blue-500/10',
      borderColor: 'border-blue-500/30',
      items: [
        'AI-powered workout analysis and personalized guidance',
        'Real-time form improvement suggestions',
        'Advanced exercise metrics and body part tracking',
        'Weekly AI fitness recommendations'
      ]
    },
    {
      category: 'Performance Tracking',
      color: 'from-green-500/20 via-emerald-500/20 to-green-500/10',
      borderColor: 'border-green-500/30',
      items: [
        'Exercise-specific weight progression trackers',
        'Personal records with detailed history',
        'Muscle group intensity heatmaps',
        'Peak performance time analysis'
      ]
    },
    {
      category: 'Challenges & Rewards',
      color: 'from-purple-500/20 via-violet-500/20 to-purple-500/10',
      borderColor: 'border-purple-500/30',
      items: [
        'Access to 2x more exclusive challenges',
        'Premium challenge categories',
        'Double reward points on all challenges',
        'Priority leaderboard placement'
      ]
    },
    {
      category: 'Premium Access',
      color: 'from-amber-500/20 via-orange-500/20 to-amber-500/10',
      borderColor: 'border-amber-500/30',
      items: [
        'Advanced split day volume progress',
        'Workout program customization AI',
        'Unlimited workout notes and analytics',
        'Premium community access'
      ]
    },
    {
      category: 'Brand & Earnings',
      color: 'from-pink-500/20 via-rose-500/20 to-pink-500/10',
      borderColor: 'border-pink-500/30',
      items: [
        'Double brand rewards earnings',
        'Exclusive brand partnerships',
        'Early access to limited drops',
        'Ad-free experience everywhere'
      ]
    },
    {
      category: 'Community & Status',
      color: 'from-orange-500/20 via-red-500/20 to-orange-500/10',
      borderColor: 'border-orange-500/30',
      items: [
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden px-4 py-20 sm:py-28">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 mb-8">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Unlock Your Full Potential</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white via-blue-200 to-blue-400 mb-6 leading-tight">
            Elevate Your Fitness
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Get AI-powered insights, exclusive challenges, and unlock advanced analytics to transform your training
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge className="bg-green-500/20 text-green-300 border-green-500/50 text-sm px-4 py-2">
              <Check className="w-4 h-4 mr-2" /> 14-day free trial
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 text-sm px-4 py-2">
              <Zap className="w-4 h-4 mr-2" /> Cancel anytime
            </Badge>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Choose the plan that works for you</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-1 p-2 bg-slate-800/50 rounded-full border border-slate-700/50 backdrop-blur-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3 rounded-full font-bold transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Yearly
                {billingCycle === 'yearly' && (
                  <Badge className="absolute -top-2 -right-4 bg-green-500 text-white text-xs px-2 py-1">
                    Save 17%
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Price Card */}
          <Card className="bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-purple-500/30 shadow-2xl max-w-xl mx-auto overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none"></div>

            <div className="relative p-8 md:p-10">
              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
                    ${billingCycle === 'monthly' ? monthlyPrice.toFixed(2) : yearlyPrice.toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-lg font-semibold">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-slate-400 text-sm">
                    ${(yearlyPrice / 12).toFixed(2)} per month
                  </p>
                )}
              </div>

              {/* Offer Banner */}
              <div className="mb-8 p-4 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <p className="text-center">
                  <span className="text-white font-bold">14 days free</span>
                  <span className="text-slate-300 ml-2">then {billingCycle === 'monthly' ? `$${monthlyPrice}/month` : `$${yearlyPrice}/year`}</span>
                </p>
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleSubscribe}
                disabled={checkoutMutation.isPending || hasActiveSub}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-14 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasActiveSub ? (
                  <>
                    <Crown className="w-5 h-5" />
                    Already Premium
                  </>
                ) : (
                  <>
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-slate-400 mt-4">
                No credit card required. Cancel anytime, no questions asked.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Features Grid */}
      <div className="px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-xl text-slate-400">All the premium features designed to level up your fitness</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={idx} 
                  className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 hover:border-purple-500/50 transition-all hover:shadow-xl group p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Features Section */}
      <div className="px-4 py-20 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Premium Features</h2>
            <p className="text-xl text-slate-400">Comprehensive tools for serious fitness enthusiasts</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {detailedFeatures.map((group, idx) => (
              <Card 
                key={idx}
                className={`bg-gradient-to-br ${group.color} backdrop-blur-sm border ${group.borderColor} p-6 hover:shadow-xl transition-all`}
              >
                <h3 className="text-xl font-bold text-white mb-6">{group.category}</h3>
                <ul className="space-y-4">
                  {group.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <Card className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-purple-900/40 backdrop-blur-xl border border-purple-500/30 p-12 text-center">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none"></div>

            <div className="relative">
              <Crown className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Go Premium?</h2>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                Join thousands of fitness enthusiasts who are using Premium to achieve their goals faster
              </p>
              
              <Button
                onClick={handleSubscribe}
                disabled={checkoutMutation.isPending || hasActiveSub}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-12 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all"
              >
                {hasActiveSub ? 'Already Premium' : 'Start Your Free Trial'}
                {!hasActiveSub && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-12 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto text-center text-slate-400 text-sm">
          <p>All prices are in USD. Billing occurs every month or year depending on your plan.</p>
          <p className="mt-2">Have questions? Contact our support team for assistance.</p>
        </div>
      </div>
    </div>
  );
}