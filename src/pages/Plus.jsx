import React, { useState } from 'react';
import { Crown, Zap, TrendingUp, Users, BarChart, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const proFeatures = [
  { icon: BarChart, title: 'Advanced Analytics' },
  { icon: TrendingUp, title: 'Churn Prediction' },
  { icon: Users, title: 'LTV Tracking' },
  { icon: Zap, title: 'ROI Reporting' },
  { icon: Shield, title: 'Auto Re-engagement' },
  { icon: Crown, title: 'Custom Reports' },
  { icon: CheckCircle, title: 'Priority Support' },
  { icon: TrendingUp, title: 'Growth Insights' }
];

const basicFeatures = [
  'Member check-in tracking',
  'Basic attendance reports',
  'Gym profile management',
  'Event creation',
  'Class scheduling',
  'Member directory',
  'Rewards & challenges',
  'Coach management',
  'Community feed'
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
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="max-w-6xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-1">
            {t('plus.title')}
          </h1>
          <p className="text-sm text-slate-300">{t('plus.subtitle')}</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Plan */}
          <Card className="bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600/50 p-4 hover:shadow-xl transition-all">
            <div className="text-center mb-3">
              <h2 className="text-lg font-bold text-white mb-0.5">{t('plus.basic.title')}</h2>
              <div className="text-2xl font-black text-white mb-0.5">{t('plus.basic.price')}</div>
              <p className="text-xs text-slate-300">Essential gym management</p>
            </div>
            
            <div className="space-y-1.5 mb-3">
              {t('plus.basic.features', { returnObjects: true }).slice(0, 6).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span className="text-xs text-slate-200">{feature}</span>
                </div>
              ))}
              <p className="text-xs text-slate-400 pt-0.5">+ more features</p>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-9 rounded-lg font-bold border-2 border-slate-500 text-slate-200 hover:bg-slate-700 text-xs"
              disabled
            >
              {isSubscribed ? t('plus.yourPlan') : t('plus.currentPlan')}
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 border-0 p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <span className="bg-white/20 backdrop-blur px-2 py-1 rounded-full text-xs font-bold">
                {billingCycle === 'yearly' ? '2 MONTHS FREE' : 'POPULAR'}
              </span>
            </div>
            
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold mb-2">{t('plus.pro.title')}</h2>
              
              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    billingCycle === 'monthly' 
                      ? 'bg-white text-purple-600 shadow-lg' 
                      : 'bg-purple-400/30 text-white hover:bg-purple-400/40'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    billingCycle === 'yearly' 
                      ? 'bg-white text-purple-600 shadow-lg' 
                      : 'bg-purple-400/30 text-white hover:bg-purple-400/40'
                  }`}
                >
                  Yearly
                </button>
              </div>

              <div className="text-3xl font-black mb-1">
                ${displayPrice}
                <span className="text-lg font-normal">/{billingCycle === 'yearly' ? 'year' : 'mo'}</span>
              </div>
              {billingCycle === 'yearly' && (
                <p className="text-purple-100 text-xs">Only $41.58/mo - save $89/year!</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {proFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <feature.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-xs leading-tight">{feature.title}</h3>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={handleSubscribe}
              disabled={isLoading || isSubscribed}
              className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold h-10 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {t('common.loading')}
                </>
              ) : isSubscribed ? (
                '✓ Subscribed'
              ) : (
                t('plus.subscribeNow')
              )}
            </Button>
            {!isSubscribed && (
              <p className="text-xs text-purple-100 mt-2 text-center">Cancel anytime • Secure via Stripe</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}