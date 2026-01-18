import React from 'react';
import { Crown, Zap, TrendingUp, Users, BarChart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const features = [
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

export default function Plus() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12 pt-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
            Fattie <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Plus</span>
          </h1>
          <p className="text-lg text-gray-600 font-medium">Premium Analytics Includes</p>
        </div>

        {/* Features */}
        <div className="space-y-4 mb-8">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-white border-2 border-gray-100 p-5 hover:border-purple-200 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pricing */}
        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 border-0 p-8 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-black mb-2">£49.99/month</h2>
          <p className="text-purple-100 mb-6">Start your 7-day free trial</p>
          <Button className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold h-14 rounded-2xl text-lg shadow-lg">
            Start Free Trial
          </Button>
          <p className="text-sm text-purple-100 mt-4">Cancel anytime. No commitment required.</p>
        </Card>
      </div>
    </div>
  );
}