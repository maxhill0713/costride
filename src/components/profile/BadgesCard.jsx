import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Award, Star, Flame, Zap, Trophy, Target } from 'lucide-react';

const BADGE_ICONS = {
  'first_pr': Star,
  'streak_7': Flame,
  'streak_30': Flame,
  'challenge_winner': Trophy,
  'top_3_leaderboard': Trophy,
  '100_lifts': Zap,
  '500_lifts': Zap,
  'community_leader': Star,
  'referral_5': Target,
  'referral_25': Target,
};

const BADGE_COLORS = {
  'first_pr': { bg: 'rgba(168,85,247,0.15)', text: '#d8b4fe', border: 'rgba(168,85,247,0.3)' },
  'streak_7': { bg: 'rgba(249,115,22,0.15)', text: '#fed7aa', border: 'rgba(249,115,22,0.3)' },
  'streak_30': { bg: 'rgba(249,115,22,0.15)', text: '#fed7aa', border: 'rgba(249,115,22,0.3)' },
  'challenge_winner': { bg: 'rgba(34,197,94,0.15)', text: '#bbf7d0', border: 'rgba(34,197,94,0.3)' },
  'top_3_leaderboard': { bg: 'rgba(59,130,246,0.15)', text: '#bfdbfe', border: 'rgba(59,130,246,0.3)' },
  '100_lifts': { bg: 'rgba(236,72,153,0.15)', text: '#fbcfe8', border: 'rgba(236,72,153,0.3)' },
  '500_lifts': { bg: 'rgba(236,72,153,0.15)', text: '#fbcfe8', border: 'rgba(236,72,153,0.3)' },
  'community_leader': { bg: 'rgba(168,85,247,0.15)', text: '#d8b4fe', border: 'rgba(168,85,247,0.3)' },
  'referral_5': { bg: 'rgba(251,191,36,0.15)', text: '#fef3c7', border: 'rgba(251,191,36,0.3)' },
  'referral_25': { bg: 'rgba(251,191,36,0.15)', text: '#fef3c7', border: 'rgba(251,191,36,0.3)' },
};

export default function BadgesCard({ currentUser }) {
  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements', currentUser?.id],
    queryFn: () => base44.entities.Achievement.filter({ user_id: currentUser.id }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  if (achievements.length === 0) {
    return (
      <div className="rounded-2xl p-6" style={{
        background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.18)' }}>
            <Award className="w-4 h-4" style={{ color: '#d8b4fe' }} />
          </div>
          <h3 className="text-[15px] font-black text-white">Badges</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Award className="w-8 h-8 text-slate-600 mb-3" />
          <p className="text-sm font-semibold text-slate-400">No badges yet</p>
          <p className="text-xs text-slate-500 mt-1">Complete achievements to unlock badges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6" style={{
      background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.18)' }}>
          <Award className="w-4 h-4" style={{ color: '#d8b4fe' }} />
        </div>
        <h3 className="text-[15px] font-black text-white">Badges</h3>
        <span className="text-xs font-bold text-slate-400 ml-auto">{achievements.length} unlocked</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {achievements.map((badge) => {
          const Icon = BADGE_ICONS[badge.achievement_type] || Award;
          const colors = BADGE_COLORS[badge.achievement_type] || BADGE_COLORS['first_pr'];

          return (
            <div
              key={badge.id}
              className="rounded-xl p-3 flex flex-col items-center text-center transition-all hover:scale-105"
              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
              title={badge.description}
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: colors.text }} />
              <p className="text-[11px] font-bold" style={{ color: colors.text }}>
                {badge.title}
              </p>
              {badge.points && (
                <p className="text-[9px] mt-1" style={{ color: colors.text, opacity: 0.8 }}>
                  +{badge.points} pts
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}