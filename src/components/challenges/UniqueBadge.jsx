import React from 'react';
import { Trophy, Flame, Crown, Zap, Star, Medal } from 'lucide-react';

export default function UniqueBadge({ reward, size = 'md' }) {
  if (!reward) return null;

  const rewardLower = reward.toLowerCase();
  
  const getBadgeConfig = () => {
    if (rewardLower.includes('consistency')) {
      return {
        gradient: 'from-orange-600 to-red-700',
        border: 'border-orange-400',
        glow: 'shadow-orange-500/60',
        icon: Flame,
        label: 'Consistency'
      };
    }
    if (rewardLower.includes('warrior') || rewardLower.includes('monday')) {
      return {
        gradient: 'from-blue-600 to-indigo-700',
        border: 'border-blue-400',
        glow: 'shadow-blue-500/60',
        icon: Trophy,
        label: 'Warrior'
      };
    }
    if (rewardLower.includes('master') || rewardLower.includes('king')) {
      return {
        gradient: 'from-purple-600 to-violet-700',
        border: 'border-purple-400',
        glow: 'shadow-purple-500/60',
        icon: Crown,
        label: 'Master'
      };
    }
    if (rewardLower.includes('power') || rewardLower.includes('strength')) {
      return {
        gradient: 'from-amber-600 to-orange-700',
        border: 'border-amber-400',
        glow: 'shadow-amber-500/60',
        icon: Zap,
        label: 'Elite'
      };
    }
    if (rewardLower.includes('excellence') || rewardLower.includes('elite')) {
      return {
        gradient: 'from-emerald-600 to-teal-700',
        border: 'border-emerald-400',
        glow: 'shadow-emerald-500/60',
        icon: Star,
        label: 'Excellence'
      };
    }
    if (rewardLower.includes('legend')) {
      return {
        gradient: 'from-pink-600 to-rose-700',
        border: 'border-pink-400',
        glow: 'shadow-pink-500/60',
        icon: Medal,
        label: 'Legend'
      };
    }
    return {
      gradient: 'from-blue-600 to-cyan-700',
      border: 'border-cyan-400',
      glow: 'shadow-cyan-500/60',
      icon: Trophy,
      label: 'Achievement'
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.gradient} border-2 ${config.border} ${config.glow} shadow-lg flex items-center justify-center relative overflow-hidden`}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
        <Icon className={`${iconSizes[size]} text-white drop-shadow-md relative z-10`} strokeWidth={1.5} />
      </div>
      <div className="text-center">

      </div>
    </div>
  );
}