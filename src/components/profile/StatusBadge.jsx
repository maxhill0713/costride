import React from 'react';
import { Shield, Crown, Star, Zap } from 'lucide-react';

export default function StatusBadge({ checkIns = [], streak = 0, size = 'md' }) {
  const getTier = () => {
    const totalVisits = checkIns.length;
    
    if (totalVisits >= 100 || streak >= 90) {
      return {
        name: 'OG',
        bgGradient: 'from-purple-600 to-pink-600',
        icon: Crown,
        textColor: 'text-white',
        borderColor: 'border-purple-400/50',
        level: 4
      };
    }
    
    if (totalVisits >= 50 || streak >= 50) {
      return {
        name: 'Veteran',
        bgGradient: 'from-orange-600 to-red-600',
        icon: Shield,
        textColor: 'text-white',
        borderColor: 'border-orange-400/50',
        level: 3
      };
    }
    
    if (totalVisits >= 20 || streak >= 20) {
      return {
        name: 'Regular',
        bgGradient: 'from-blue-600 to-cyan-600',
        icon: Star,
        textColor: 'text-white',
        borderColor: 'border-blue-400/50',
        level: 2
      };
    }
    
    return {
      name: 'Newcomer',
      bgGradient: 'from-slate-500 to-slate-600',
      icon: Zap,
      textColor: 'text-white',
      borderColor: 'border-slate-400/50',
      level: 1
    };
  };

  const tier = getTier();
  const Icon = tier.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3.5 py-1.5',
    lg: 'text-base px-4.5 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${tier.bgGradient} rounded-lg border ${tier.borderColor} shadow-lg shadow-black/30 font-semibold flex-shrink-0 ${sizeClasses[size]}`}>
      <Icon className={`${iconSizes[size]} ${tier.textColor}`} />
      <span className={tier.textColor}>{tier.name}</span>
    </div>
  );
}

export function getLevel(checkIns = [], streak = 0) {
  const totalVisits = checkIns.length;
  
  if (totalVisits >= 100 || streak >= 90) return 4;
  if (totalVisits >= 50 || streak >= 50) return 3;
  if (totalVisits >= 20 || streak >= 20) return 2;
  return 1;
}