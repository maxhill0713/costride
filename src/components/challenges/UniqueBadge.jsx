import React from 'react';
import { Trophy, Flame, Award, Zap, Crown, Heart, Target, Star, Medal, Sparkles } from 'lucide-react';

export default function UniqueBadge({ reward, size = 'md' }) {
  if (!reward) return null;

  const rewardLower = reward.toLowerCase();
  
  // Define badge types based on keywords
  const getBadgeConfig = () => {
    if (rewardLower.includes('consistency')) {
      return {
        gradient: 'from-orange-400 via-red-500 to-rose-600',
        icon: Flame,
        glow: 'shadow-orange-500/50',
        sparkle: true,
        label: 'Consistency Champion'
      };
    }
    if (rewardLower.includes('warrior') || rewardLower.includes('monday')) {
      return {
        gradient: 'from-blue-400 via-blue-500 to-indigo-600',
        icon: Trophy,
        glow: 'shadow-blue-500/50',
        sparkle: false,
        label: 'Warrior'
      };
    }
    if (rewardLower.includes('master') || rewardLower.includes('king')) {
      return {
        gradient: 'from-purple-400 via-purple-500 to-violet-600',
        icon: Crown,
        glow: 'shadow-purple-500/50',
        sparkle: true,
        label: 'Master'
      };
    }
    if (rewardLower.includes('power') || rewardLower.includes('strength')) {
      return {
        gradient: 'from-yellow-400 via-amber-500 to-orange-600',
        icon: Zap,
        glow: 'shadow-yellow-500/50',
        sparkle: true,
        label: 'Power Elite'
      };
    }
    if (rewardLower.includes('excellence') || rewardLower.includes('elite')) {
      return {
        gradient: 'from-emerald-400 via-green-500 to-teal-600',
        icon: Star,
        glow: 'shadow-emerald-500/50',
        sparkle: true,
        label: 'Excellence'
      };
    }
    if (rewardLower.includes('legend')) {
      return {
        gradient: 'from-rose-400 via-pink-500 to-red-600',
        icon: Medal,
        glow: 'shadow-pink-500/50',
        sparkle: true,
        label: 'Legend'
      };
    }
    // Default for generic badges
    return {
      gradient: 'from-cyan-400 via-blue-500 to-blue-600',
      icon: Award,
      glow: 'shadow-cyan-500/50',
      sparkle: false,
      label: 'Achievement'
    };
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer glow ring */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full p-1 ${config.glow} shadow-lg`}>
          {/* Inner badge */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full flex items-center justify-center`}>
            <Icon className={`${size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-8 h-8' : 'w-5 h-5'} text-white drop-shadow-lg`} />
          </div>
        </div>
        
        {/* Sparkle animation */}
        {config.sparkle && (
          <>
            <Sparkles className={`absolute -top-1 -right-1 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} text-yellow-300 animate-spin`} style={{ animationDuration: '3s' }} />
            <Sparkles className={`absolute -bottom-1 -left-1 ${size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} text-yellow-200 animate-pulse`} />
          </>
        )}
      </div>
      
      {/* Badge name tooltip */}
      <div className="mt-2 text-center">
        <p className="text-xs font-bold text-white drop-shadow-md">{config.label}</p>
        <p className="text-[10px] text-slate-300 line-clamp-2">{reward}</p>
      </div>
    </div>
  );
}