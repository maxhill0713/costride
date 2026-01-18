import React from 'react';
import { Crown, Zap, TrendingUp, Users, BarChart, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12 pt-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 font-medium">Select the plan that fits your gym's needs</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Basic Plan */}
          <Card className="bg-white border-2 border-gray-200 p-8 hover:shadow-xl transition-all">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic</h2>
              <div className="text-4xl font-black text-gray-900 mb-2">Free</div>
              <p className="text-gray-600">Essential gym management</p>
            </div>
            
            <div className="space-y-3 mb-8">
              {basicFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full h-12 rounded-2xl font-bold border-2">
              Current Plan
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 border-0 p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">POPULAR</span>
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Retention Pro</h2>
              <div className="text-4xl font-black mb-2">£49.99/month</div>
              <p className="text-purple-100">Premium Analytics Included</p>
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

            <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold h-12 rounded-2xl shadow-lg">
              Start Free Trial
            </Button>
            <p className="text-sm text-purple-100 mt-4 text-center">7-day free trial • Cancel anytime</p>
          </Card>
        </div>
      </div>
    </div>
  );
}