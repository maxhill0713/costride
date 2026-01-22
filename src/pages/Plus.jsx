import React, { useState } from 'react';
import { Crown, Gift, Award, Sparkles, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const premiumFeatures = [
  'Unlock all exclusive brand discounts',
  'Access premium rewards at all gyms',
  'Priority support',
  'Early access to new challenges',
  'Exclusive achievement badges',
  'Advanced progress tracking'
];

export default function Plus() {
  const [isLoading, setIsLoading] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', currentUser?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        user_id: currentUser.id,
        subscription_type: 'user_premium',
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
      const priceId = 'price_1SrO4zDSt5niTKrsYfmDYKb7'; // Member premium price ID

      const response = await base44.functions.invoke('createSubscriptionCheckout', {
        priceId,
        subscriptionType: 'user_premium'
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

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
            <Crown className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            Go Premium
          </h1>
          <p className="text-lg text-slate-300">Unlock exclusive rewards and features</p>
        </div>

        {/* Premium Card */}
        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 border-0 p-8 text-white shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold">PREMIUM MEMBER</span>
            </div>
            
            <div className="text-5xl font-black mb-2">
              $4.99
              <span className="text-2xl font-normal">/mo</span>
            </div>
            <p className="text-purple-100">Billed monthly • Cancel anytime</p>
          </div>

          <div className="space-y-3 mb-6">
            {premiumFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-lg p-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleSubscribe}
            disabled={isLoading || isSubscribed}
            className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold h-12 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading...
              </>
            ) : isSubscribed ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                You're Premium!
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Premium
              </>
            )}
          </Button>
          
          {!isSubscribed && (
            <p className="text-sm text-purple-100 mt-3 text-center">Secure payment via Stripe</p>
          )}
        </Card>
      </div>
    </div>
  );
}