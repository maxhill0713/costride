import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Users, Bell, TrendingUp, CheckCircle, ArrowLeft, Zap, Target, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function RetentionPro() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const features = [
    {
      icon: Bell,
      title: 'Automated Re-engagement',
      description: 'Automatic email/SMS campaigns for at-risk members',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Users,
      title: 'Member Segmentation',
      description: 'Advanced analytics to identify engagement patterns',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Target,
      title: 'Smart Triggers',
      description: 'Custom rules for when to reach out to members',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Mail,
      title: 'Email Templates',
      description: 'Pre-built templates for re-engagement campaigns',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: 'Retention Analytics',
      description: 'Track campaign performance and member responses',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Zap,
      title: 'Quick Setup',
      description: 'Get started in minutes with our simple workflow',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  const plans = [
    {
      name: 'Starter',
      price: '£29',
      period: '/month',
      description: 'Perfect for small gyms',
      features: [
        'Up to 100 members',
        'Basic automated campaigns',
        'Email support',
        'Monthly analytics reports'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Professional',
      price: '£79',
      period: '/month',
      description: 'For growing gyms',
      features: [
        'Up to 500 members',
        'Advanced campaign automation',
        'SMS + Email campaigns',
        'Weekly analytics',
        'Priority support',
        'Custom triggers'
      ],
      color: 'from-purple-500 to-pink-500',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '£199',
      period: '/month',
      description: 'For large facilities',
      features: [
        'Unlimited members',
        'Full automation suite',
        'Multi-channel campaigns',
        'Real-time analytics',
        'Dedicated support',
        'Custom integrations',
        'White-label options'
      ],
      color: 'from-indigo-500 to-purple-600'
    }
  ];

  const handleCheckout = async (planName) => {
    if (window.self !== window.top) {
      toast.error('Checkout only works from the published app, not in preview');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('createRetentionProCheckout', { plan: planName });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl('GymOwnerDashboard')} className="inline-block mb-6">
          <Button variant="outline" className="border-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 px-4 py-2 rounded-full mb-4">
            <Award className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Retention Pro</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4">
            Keep Your Members Coming Back
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Automated tools to re-engage at-risk members and boost retention rates by up to 35%
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-slate-600 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </Card>
            );
          })}
        </div>

        {/* Pricing */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-white text-center mb-8">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-2 transition-all hover:scale-105 ${
                  plan.popular ? 'border-purple-500 shadow-xl shadow-purple-500/20' : 'border-slate-700'
                }`}
              >
                {plan.popular && (
                  <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline mb-6">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-slate-400 ml-2">{plan.period}</span>
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => handleCheckout(plan.name)}
                  disabled={isLoading}
                  className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  {isLoading ? 'Loading...' : 'Get Started'}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <Card className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <h3 className="text-2xl font-black text-white text-center mb-8">The Retention Pro Difference</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-black text-green-400 mb-2">+35%</div>
              <p className="text-slate-300">Average retention increase</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-blue-400 mb-2">78%</div>
              <p className="text-slate-300">Response rate to campaigns</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-black text-purple-400 mb-2">2 min</div>
              <p className="text-slate-300">Average setup time</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}