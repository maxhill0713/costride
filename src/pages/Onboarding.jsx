import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp, Dumbbell, Target, Zap, Heart, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const FITNESS_GOALS = [
  {
    id: 'lose_weight',
    title: 'Lose Weight',
    description: 'Burn fat and get lean',
    icon: TrendingDown,
    color: 'from-red-400 to-pink-500'
  },
  {
    id: 'gain_weight',
    title: 'Gain Weight',
    description: 'Bulk up and build mass',
    icon: TrendingUp,
    color: 'from-orange-400 to-red-500'
  },
  {
    id: 'gain_muscle',
    title: 'Build Muscle',
    description: 'Increase muscle definition',
    icon: Dumbbell,
    color: 'from-purple-400 to-pink-500'
  },
  {
    id: 'strength',
    title: 'Get Stronger',
    description: 'Increase strength and power',
    icon: Zap,
    color: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'endurance',
    title: 'Build Endurance',
    description: 'Improve stamina and cardio',
    icon: Activity,
    color: 'from-green-400 to-emerald-500'
  },
  {
    id: 'maintain',
    title: 'Stay Fit',
    description: 'Maintain current fitness',
    icon: Target,
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'flexibility',
    title: 'Improve Flexibility',
    description: 'Increase mobility and flexibility',
    icon: Heart,
    color: 'from-pink-400 to-purple-500'
  }
];

export default function Onboarding() {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: (goal) => base44.auth.updateMe({
      fitness_goal: goal,
      onboarding_completed: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      navigate(createPageUrl('Home'));
    }
  });

  const handleContinue = () => {
    if (selectedGoal) {
      completeOnboardingMutation.mutate(selectedGoal);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full p-8 md:p-12 bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-3xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl mx-auto mb-4 flex items-center justify-center">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
            Welcome{currentUser ? `, ${currentUser.full_name?.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            What's your main fitness goal?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {FITNESS_GOALS.map((goal) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;
            return (
              <Card
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  isSelected
                    ? 'border-4 border-blue-500 shadow-lg scale-105'
                    : 'border-2 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-4 mx-auto`}>
                  <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-gray-900 text-center mb-2">{goal.title}</h3>
                <p className="text-sm text-gray-600 text-center">{goal.description}</p>
                {isSelected && (
                  <div className="mt-3 flex justify-center">
                    <Badge className="bg-blue-500 text-white">Selected ✓</Badge>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={handleContinue}
            disabled={!selectedGoal || completeOnboardingMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-8 py-6 text-lg rounded-2xl disabled:opacity-50"
          >
            {completeOnboardingMutation.isPending ? 'Starting...' : 'Continue'}
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            className="px-8 py-6 text-lg rounded-2xl border-2"
          >
            Skip for now
          </Button>
        </div>
      </Card>
    </div>
  );
}