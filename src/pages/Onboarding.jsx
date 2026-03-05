import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Building2, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const ACCOUNT_TYPES = [
  {
    id: 'personal',
    title: "I'm a Member",
    description: 'Track workouts, join challenges, connect with gyms',
    icon: User,
    color: 'from-blue-400 to-cyan-500',
    shadowColor: 'shadow-blue-500/25'
  },
  {
    id: 'gym_owner',
    title: 'I own a Gym',
    description: 'Register your gym, manage members, create rewards',
    icon: Building2,
    color: 'from-purple-400 to-pink-500',
    shadowColor: 'shadow-purple-500/25'
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
    if (typeId === 'gym_owner') {
      navigate(createPageUrl('GymSignup'));
    } else {
      navigate(createPageUrl('MemberSignup'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-800/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">

        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/b128c437a_Untitleddesign-7.jpg"
            alt="CoStride Logo"
            className="w-16 h-16 rounded-3xl object-cover shadow-2xl shadow-blue-500/40 border border-white/20"
          />

          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-semibold tracking-wider uppercase">Get Started</span>
          </div>

          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              CoStride
            </span>
          </h1>

          <p className="text-slate-400 text-base">
            Choose how you want to use the app
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50">

          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4 text-center">
            Select your account type
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {ACCOUNT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-300 text-left border group ${
                    isSelected
                      ? 'bg-blue-500/15 border-blue-400/50 shadow-xl shadow-blue-500/15 scale-[1.02]'
                      : 'bg-white/5 border-white/8 hover:bg-white/8 hover:border-white/20 hover:scale-[1.01]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    </div>
                  )}

                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 shadow-lg ${type.shadowColor} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>

                  <h3 className="font-bold text-white mb-1.5 text-sm">{type.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{type.description}</p>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-white/8 mb-6" />

          {/* Continue button — Duolingo style */}
          <button
            onClick={() => selectedType && handleSelectType(selectedType)}
            disabled={!selectedType || selectAccountTypeMutation.isPending}
            className={`w-full h-14 rounded-2xl font-bold text-base transition-all duration-100 flex items-center justify-center gap-2 border-b-[5px] ${
              selectedType
                ? 'bg-blue-500 border-blue-700 text-white hover:bg-blue-400 hover:border-blue-600 active:translate-y-1 active:border-b-2 cursor-pointer'
                : 'bg-slate-700 border-slate-800 text-slate-500 cursor-not-allowed opacity-50'
            }`}
          >
            {selectAccountTypeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Setting up...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Continue
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          <p className="text-center text-slate-500 text-xs mt-4">
            You can change this later in settings
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          By continuing you agree to CoStride's Terms & Privacy Policy
        </p>

      </div>
    </div>
  );
}