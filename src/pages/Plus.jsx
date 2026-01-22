import React, { useState } from 'react';
import { Crown, Zap, TrendingUp, Users, BarChart, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const proFeatures = [
  {
    icon: BarChart,
    title: 'Advanced Attendance Insights',
    description: 'Track check-ins and engagement trends over time'
  },
  {
    icon: TrendingUp,
    title: 'Retention & Churn Prediction',
    description: 'Identify members at risk of leaving and take action early'
  },
  {
    icon: Users,
    title: 'LTV / ARPM Tracking',
    description: 'Understand how much each member is worth and how revenue changes over time'
  },
  {
    icon: Zap,
    title: 'Revenue & ROI Reporting',
    description: 'See how rewards and campaigns impact your bottom line'
  },
  {
    icon: Shield,
    title: 'Automated Alerts & Re-engagement Actions',
    description: 'Get notified when members become inactive and automatically re-engage them'
  },
  {
    icon: Crown,
    title: 'Custom Reports & Export',
    description: 'Download reports for management and planning'
  }
];

const basicFeatures = [
  'Member check-in tracking',
  'Basic attendance reports',
  'Gym profile management',
  'Event creation',
  'Class scheduling',
  'Member directory'
];

export default function Plus() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' or 'yearly'

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        user_id: currentUser.id,
        subscription_type: 'gym_pro',
        status: 'active'
      });
      return subs[0] || null;
    },
    enabled: !!currentUser
  });

  const handleSubscribe = async () => {
    // Check if running in iframe
    if (window.self !== window.top) {
      toast.error('Checkout only works from published app', {
        description: 'Please open the app in a new tab to subscribe'
      });
      return;
    }

    setIsLoading(true);
    try {
      const priceId = billingCycle === 'yearly' 
        ? 'price_REPLACE_WITH_YEARLY_PRICE_ID' // Replace with your yearly price ID
        : 'price_1SrNwPDSt5niTKrslvTPCEjV';

      const response = await base44.functions.invoke('createSubscriptionCheckout', {
        priceId,
        subscriptionType: 'gym_pro'
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setIsLoading(false);
    }
  };

  const isSubscribed = !!subscription;
  const monthlyPrice = 49.99;
  const yearlyPrice = 499;
  const displayPrice = billingCycle === 'yearly' ? yearlyPrice : monthlyPrice;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12 pt-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            {t('plus.title')}
          </h1>
          <p className="text-lg text-slate-300 font-medium">{t('plus.subtitle')}</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Basic Plan */}
          <Card className="bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600/50 p-8 hover:shadow-xl transition-all">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">{t('plus.basic.title')}</h2>
              <div className="text-4xl font-black text-white mb-2">{t('plus.basic.price')}</div>
              <p className="text-slate-300">Essential gym management</p>
            </div>
            
            <div className="space-y-3 mb-8">
              {t('plus.basic.features', { returnObjects: true }).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-200">{feature}</span>
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full h-12 rounded-2xl font-bold border-2 border-slate-500 text-slate-200 hover:bg-slate-700"
              disabled
            >
              {isSubscribed ? t('plus.yourPlan') : t('plus.currentPlan')}
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 border-0 p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">
                {billingCycle === 'yearly' ? '2 MONTHS FREE' : 'POPULAR'}
              </span>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">{t('plus.pro.title')}</h2>
              
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    billingCycle === 'monthly' 
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/10 text-purple-100'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                    billingCycle === 'yearly' 
                      ? 'bg-white/30 text-white' 
                      : 'bg-white/10 text-purple-100'
                  }`}
                >
                  Yearly
                </button>
              </div>

              <div className="text-4xl font-black mb-2">
                ${displayPrice}
                <span className="text-xl font-normal">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-purple-100 text-sm">That's only $41.58/month - save $89/year!</p>
              )}
              {billingCycle === 'monthly' && (
                <p className="text-purple-100">Premium Analytics Included</p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {proFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm mb-0.5">{feature.title}</h3>
                    <p className="text-purple-100 text-xs">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-purple-100 text-sm mb-8">...and more</p>

            <Button 
              onClick={handleSubscribe}
              disabled={isLoading || isSubscribed}
              className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold h-12 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t('common.loading')}
                </>
              ) : isSubscribed ? (
                '✓ Subscribed'
              ) : (
                t('plus.subscribeNow')
              )}
            </Button>
            {!isSubscribed && (
              <p className="text-sm text-purple-100 mt-4 text-center">Cancel anytime • Secure payment via Stripe</p>
            )}
            {isSubscribed && (
              <p className="text-sm text-purple-100 mt-4 text-center">Manage subscription in your profile settings</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}