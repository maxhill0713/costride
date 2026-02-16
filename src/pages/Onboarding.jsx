import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const ACCOUNT_TYPES = [
  {
    id: 'personal',
    title: 'I\'m a Member',
    description: 'Track workouts, join challenges, connect with gyms',
    icon: User,
    color: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'gym_owner',
    title: 'I own a Gym',
    description: 'Register your gym, manage members, create rewards',
    icon: Building2,
    color: 'from-purple-400 to-pink-500'
  }
];

export default function Onboarding() {
  const [selectedType, setSelectedType] = useState(null);
  const navigate = useNavigate();

  const selectAccountTypeMutation = useMutation({
    mutationFn: (accountType) => base44.auth.updateMe({
      account_type: accountType,
      onboarding_completed: true
    })
  });

  const handleSelectType = (typeId) => {
    selectAccountTypeMutation.mutate(typeId);
    // Navigate immediately
    if (typeId === 'gym_owner') {
      navigate(createPageUrl('GymSignup'));
    } else {
      navigate(createPageUrl('MemberSignup'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700/50 rounded-3xl">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">🏋️</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            Welcome to CoStride
          </h1>
          <p className="text-slate-300 text-lg">
            Choose how you want to use the app
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {ACCOUNT_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <Card
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-8 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 bg-slate-700/50 backdrop-blur-sm ${
                  isSelected
                    ? 'border-4 border-blue-500 shadow-lg shadow-blue-500/30 scale-105'
                    : 'border-2 border-slate-600/40 hover:border-blue-400/50'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 mx-auto`}>
                  <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                </div>
                <h3 className="font-bold text-white text-center mb-2 text-lg">{type.title}</h3>
                <p className="text-sm text-slate-300 text-center">{type.description}</p>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => selectedType && handleSelectType(selectedType)}
            disabled={!selectedType || selectAccountTypeMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold px-8 py-6 text-lg rounded-2xl disabled:opacity-50 w-full md:w-auto"
          >
            {selectAccountTypeMutation.isPending ? 'Continue...' : 'Continue'}
          </Button>
        </div>
      </Card>
    </div>
  );
}