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
      onboarding_completed: false
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-2xl shadow-blue-500/30">
            <span className="text-3xl">🏋️</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Welcome to CoStride
          </h1>
          <p className="text-blue-200/70 text-lg">
            Choose how you want to use the app
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {ACCOUNT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-8 rounded-2xl cursor-pointer transition-all duration-300 text-left border ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-400/60 shadow-lg shadow-blue-500/20 scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-lg">{type.title}</h3>
                  <p className="text-sm text-blue-200/60">{type.description}</p>
                </button>
              );
            })}
          </div>

          <Button
            onClick={() => selectedType && handleSelectType(selectedType)}
            disabled={!selectedType || selectAccountTypeMutation.isPending}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold h-13 text-base rounded-2xl disabled:opacity-40 shadow-lg shadow-blue-500/25 transition-all"
          >
            {selectAccountTypeMutation.isPending ? 'Continue...' : 'Continue →'}
          </Button>
        </div>
      </div>
    </div>
  );
}