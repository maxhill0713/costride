import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, Star, Zap } from 'lucide-react';

export default function StatusBadge({ checkIns = [], streak = 0, size = 'md' }) {
  const getTier = () => {
    const totalVisits = checkIns.length;

    if (totalVisits >= 100 || streak >= 90) {
      return {
        name: 'OG',
        color: 'from-purple-500 to-pink-500',
        icon: Crown,
        textColor: 'text-purple-700',
        bgColor: 'bg-purple-100',
        level: 4
      };
    }

    if (totalVisits >= 50 || streak >= 50) {
      return {
        name: 'Veteran',
        color: 'from-orange-500 to-red-500',
        icon: Shield,
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-100',
        level: 3
      };
    }

    if (totalVisits >= 20 || streak >= 20) {
      return {
        name: 'Regular',
        color: 'from-blue-500 to-cyan-500',
        icon: Star,
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-100',
        level: 2
      };
    }

    return {
      name: 'Newcomer',
      color: 'from-gray-400 to-gray-500',
      icon: Zap,
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-100',
      level: 1
    };
  };

  const tier = getTier();

  // Don't show the "Newcomer" badge
  if (tier.level === 1) {
    return null;
  }

  const Icon = tier.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return null;





}

export function getLevel(checkIns = [], streak = 0) {
  const totalVisits = checkIns.length;

  if (totalVisits >= 100 || streak >= 90) return 4;
  if (totalVisits >= 50 || streak >= 50) return 3;
  if (totalVisits >= 20 || streak >= 20) return 2;
  return 1;
}