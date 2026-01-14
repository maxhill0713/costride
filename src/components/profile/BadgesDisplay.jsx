import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Calendar, Target, Users, TrendingUp, Award, Crown, Star, Zap } from 'lucide-react';

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
  // Calculate stats from actual data
  const userStats = {
    total_check_ins: checkIns.length,
    longest_streak: user.longest_streak || 0,
    current_streak: user.current_streak || 0,
    gym_join_date: user.created_date
  };

  const earnedBadges = BADGE_LIBRARY.filter(badge => badge.requirement(userStats));
  const lockedBadges = BADGE_LIBRARY.filter(badge => !badge.requirement(userStats));

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Earned Badges ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnedBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <Card key={badge.id} className="p-4 text-center bg-white border-2 border-gray-200 hover:shadow-lg transition-all">
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" strokeWidth={2.5} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{badge.title}</h4>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                  <Badge className="mt-2 bg-green-100 text-green-700 text-xs">
                    Earned ✓
                  </Badge>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-400" />
            Locked Badges ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lockedBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <Card key={badge.id} className="p-4 text-center bg-gray-50 border-2 border-dashed border-gray-300 opacity-60">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-200 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-gray-400" strokeWidth={2} />
                  </div>
                  <h4 className="font-bold text-gray-600 text-sm mb-1">{badge.title}</h4>
                  <p className="text-xs text-gray-500">{badge.description}</p>
                  <Badge className="mt-2 bg-gray-200 text-gray-600 text-xs">
                    Locked 🔒
                  </Badge>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}