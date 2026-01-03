import React from 'react';
import { Crown, Zap, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PremiumBadge({ type = 'user', size = 'sm' }) {
  const configs = {
    user: {
      icon: Crown,
      text: 'Premium',
      className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    },
    gym_pro: {
      icon: Zap,
      text: 'Pro',
      className: 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
    },
    gym_enterprise: {
      icon: Star,
      text: 'Enterprise',
      className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
    }
  };

  const config = configs[type] || configs.user;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-3',
    lg: 'text-base py-1.5 px-4'
  };

  return (
    <Badge className={`${config.className} ${sizeClasses[size]} flex items-center gap-1 font-bold`}>
      <Icon className="w-3 h-3" />
      {config.text}
    </Badge>
  );
}