import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Calendar, Target, Users, TrendingUp, Award, Crown, Star, Zap, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const BADGE_LIBRARY = [
  {
    id: '10_visits',
    title: 'Getting Started',
    description: '10 gym check-ins',
    icon: Target,
    color: 'from-blue-400 to-blue-600',
    requirement: (user) => (user.total_check_ins || 0) >= 10
  },
  {
    id: '50_visits',
    title: 'Regular',
    description: '50 gym check-ins',
    icon: Flame,
    color: 'from-orange-400 to-red-500',
    requirement: (user) => (user.total_check_ins || 0) >= 50
  },
  {
    id: '100_visits',
    title: 'Dedicated',
    description: '100 gym check-ins',
    icon: Trophy,
    color: 'from-yellow-400 to-orange-500',
    requirement: (user) => (user.total_check_ins || 0) >= 100
  },
  {
    id: '7_day_streak',
    title: 'Week Warrior',
    description: '7-day streak',
    icon: Zap,
    color: 'from-green-400 to-emerald-500',
    requirement: (user) => (user.longest_streak || 0) >= 7
  },
  {
    id: '30_day_streak',
    title: 'Month Master',
    description: '30-day streak',
    icon: Flame,
    color: 'from-red-400 to-pink-500',
    requirement: (user) => (user.longest_streak || 0) >= 30
  },
  {
    id: '90_day_streak',
    title: 'Consistency King',
    description: '90-day streak',
    icon: Crown,
    color: 'from-purple-400 to-pink-500',
    requirement: (user) => (user.longest_streak || 0) >= 90
  },
  {
    id: '1_year',
    title: 'One Year Strong',
    description: '1 year membership',
    icon: Calendar,
    color: 'from-indigo-400 to-blue-500',
    requirement: (user) => {
      if (!user.gym_join_date) return false;
      const daysSinceJoin = Math.floor((new Date() - new Date(user.gym_join_date)) / (1000 * 60 * 60 * 24));
      return daysSinceJoin >= 365;
    }
  },
  {
    id: 'community_leader',
    title: 'Community Leader',
    description: 'Active community member',
    icon: Users,
    color: 'from-cyan-400 to-blue-500',
    requirement: (user) => (user.total_check_ins || 0) >= 20
  }
];

export default function BadgesDisplay({ user, checkIns = [] }) {
  const { data: achievements = [] } = React.useMemo(() => {
    return { data: [] };
  }, []);
  const [equippedBadges, setEquippedBadges] = React.useState(user?.equipped_badges || []);
  
  // Calculate stats from actual data
  const userStats = {
    total_check_ins: checkIns.length,
    longest_streak: user.longest_streak || 0,
    current_streak: user.current_streak || 0,
    gym_join_date: user.created_date
  };

  const earnedBadges = BADGE_LIBRARY.filter(badge => badge.requirement(userStats));

  const equippedBadgeDetails = earnedBadges.filter(b => equippedBadges.includes(b.id));

  return (
    <div className="space-y-6">
      {/* Equipped Badges Showcase */}
      {equippedBadgeDetails.length > 0 && (
        <Card className="p-3 bg-gradient-to-br from-amber-600/20 via-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-amber-400/40 shadow-lg">
          <h3 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Showcase
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {equippedBadgeDetails.map((badge) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`relative p-2 rounded-lg bg-gradient-to-br ${badge.color} border border-white/30 shadow-md`}
                >
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                    <Check className="w-2 h-2 text-amber-900" strokeWidth={3} />
                  </div>
                  <div className="w-7 h-7 mx-auto mb-1 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Icon className="w-3.5 h-3.5 text-white drop-shadow-lg" strokeWidth={2.5} />
                  </div>
                  <h4 className="font-bold text-white text-[9px] text-center drop-shadow line-clamp-1">{badge.title}</h4>
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}


    </div>
  );
}