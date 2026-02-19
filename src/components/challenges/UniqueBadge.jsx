import React from 'react';
import { Trophy, Flame, Award, Zap, Crown, Target, Star, Medal } from 'lucide-react';

export default function UniqueBadge({ reward, size = 'md' }) {
  if (!reward) return null;

  const rewardLower = reward.toLowerCase();
  
  const getBadgeConfig = () => {
    if (rewardLower.includes('consistency')) {
      return {
        outer: 'from-red-600 via-red-700 to-red-800',
        inner: 'from-red-500 via-orange-500 to-red-600',
        icon: Flame,
        accent: 'text-red-300',
        label: 'Consistency'
      };
    }
    if (rewardLower.includes('warrior') || rewardLower.includes('monday')) {
      return {
        outer: 'from-blue-700 via-blue-800 to-indigo-800',
        inner: 'from-blue-600 via-blue-500 to-indigo-600',
        icon: Trophy,
        accent: 'text-blue-300',
        label: 'Warrior'
      };
    }
    if (rewardLower.includes('master') || rewardLower.includes('king')) {
      return {
        outer: 'from-purple-700 via-purple-800 to-violet-800',
        inner: 'from-purple-600 via-purple-500 to-violet-600',
        icon: Crown,
        accent: 'text-purple-300',
        label: 'Master'
      };
    }
    if (rewardLower.includes('power') || rewardLower.includes('strength')) {
      return {
        outer: 'from-amber-700 via-amber-800 to-orange-800',
        inner: 'from-amber-600 via-amber-500 to-orange-600',
        icon: Zap,
        accent: 'text-amber-300',
        label: 'Elite'
      };
    }
    if (rewardLower.includes('excellence') || rewardLower.includes('elite')) {
      return {
        outer: 'from-emerald-700 via-emerald-800 to-teal-800',
        inner: 'from-emerald-600 via-emerald-500 to-teal-600',
        icon: Star,
        accent: 'text-emerald-300',
        label: 'Excellence'
      };
    }
    if (rewardLower.includes('legend')) {
      return {
        outer: 'from-pink-700 via-rose-800 to-red-800',
        inner: 'from-pink-600 via-rose-500 to-red-600',
        icon: Medal,
        accent: 'text-pink-300',
        label: 'Legend'
      };
    }
    return {
      outer: 'from-blue-700 via-cyan-800 to-blue-800',
      inner: 'from-blue-600 via-cyan-500 to-blue-600',
      icon: Award,
      accent: 'text-cyan-300',
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

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} relative group`}>
        {/* Outer dark ring */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.outer} rounded-full shadow-2xl`} style={{ boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.6)' }} />
        
        {/* Middle gradient layer */}
        <div className={`absolute inset-1 bg-gradient-to-br ${config.inner} rounded-full`} />
        
        {/* Reflective shine */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
        
        {/* Icon container */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <Icon className={`${iconSizes[size]} text-white opacity-90 drop-shadow-md`} strokeWidth={1.5} />
        </div>
        
        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
      </div>
      
      {/* Badge label */}
      <div className="mt-2 text-center">
        <p className={`text-xs font-bold ${config.accent}`}>{config.label}</p>
        <p className="text-[10px] text-slate-400 line-clamp-2">{reward}</p>
      </div>
    </div>
  );
}