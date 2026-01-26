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
  const [equippedBadges, setEquippedBadges] = React.useState(user?.equipped_badges || []);
  
  // Calculate stats from actual data
  const userStats = {
    total_check_ins: checkIns.length,
    longest_streak: user.longest_streak || 0,
    current_streak: user.current_streak || 0,
    gym_join_date: user.created_date
  };

  const earnedBadges = BADGE_LIBRARY.filter(badge => badge.requirement(userStats));
  const lockedBadges = BADGE_LIBRARY.filter(badge => !badge.requirement(userStats));

  const handleEquipBadge = async (badgeId) => {
    let newEquipped = [...equippedBadges];
    
    if (newEquipped.includes(badgeId)) {
      // Unequip
      newEquipped = newEquipped.filter(id => id !== badgeId);
    } else {
      // Equip (max 3)
      if (newEquipped.length >= 3) {
        newEquipped.shift(); // Remove oldest
      }
      newEquipped.push(badgeId);
    }
    
    setEquippedBadges(newEquipped);
    await base44.auth.updateMe({ equipped_badges: newEquipped });
  };

  const equippedBadgeDetails = earnedBadges.filter(b => equippedBadges.includes(b.id));

  return (
    <div className="space-y-6">
      {/* Equipped Badges Showcase */}
      {equippedBadgeDetails.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-amber-600/20 via-yellow-600/20 to-orange-600/20 backdrop-blur-xl border-2 border-amber-400/50 shadow-2xl">
          <h3 className="text-sm font-black text-amber-300 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            Showcase (Max 3)
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {equippedBadgeDetails.map((badge) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`relative p-3 rounded-xl bg-gradient-to-br ${badge.color} border-2 border-white/40 shadow-xl`}
                >
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                    <Check className="w-3 h-3 text-amber-900" strokeWidth={3} />
                  </div>
                  <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl ring-2 ring-white/40">
                    <Icon className="w-5 h-5 text-white drop-shadow-2xl" strokeWidth={2.5} />
                  </div>
                  <h4 className="font-black text-white text-[10px] text-center drop-shadow-lg line-clamp-1">{badge.title}</h4>
                </motion.div>
              );
            })}
          </div>
          <p className="text-[10px] text-amber-200/80 text-center mt-2 font-medium">
            ✨ Click badges below to equip/unequip them
          </p>
        </Card>
      )}

      {/* Earned Badges */}
      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Earned Badges ({earnedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {earnedBadges.map((badge, index) => {
              const Icon = badge.icon;
              const isEquipped = equippedBadges.includes(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEquipBadge(badge.id)}
                >
                  <Card className={`p-5 text-center bg-gradient-to-br ${badge.color} border-2 ${isEquipped ? 'border-amber-400 ring-4 ring-amber-400/50' : 'border-white/30 hover:border-white/60'} shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden group cursor-pointer`}>
                    {/* Equipped indicator */}
                    {isEquipped && (
                      <div className="absolute top-2 right-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg z-20 animate-pulse">
                        <Check className="w-4 h-4 text-amber-900" strokeWidth={3} />
                      </div>
                    )}
                    
                    {/* Sparkle effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    
                    {/* Badge icon */}
                    <motion.div 
                      className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl ring-4 ring-white/40 relative"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
                      <Icon className="w-10 h-10 text-white drop-shadow-2xl z-10" strokeWidth={2.5} />
                    </motion.div>
                    
                    <h4 className="font-black text-white text-base mb-1 drop-shadow-lg">{badge.title}</h4>
                    <p className="text-xs text-white/90 font-medium drop-shadow">{badge.description}</p>
                    
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 shadow-lg">
                      <span className="text-xs font-bold text-white drop-shadow">{isEquipped ? 'Equipped' : 'Tap to Equip'}</span>
                      <span className="text-sm">{isEquipped ? '⭐' : '✨'}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-slate-400" />
            Locked Badges ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lockedBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="p-5 text-center bg-slate-900/60 backdrop-blur-xl border-2 border-dashed border-slate-600/40 relative overflow-hidden group cursor-not-allowed">
                    {/* Silhouette effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50" />
                    
                    {/* Badge icon */}
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-slate-800/50 flex items-center justify-center shadow-lg ring-2 ring-slate-700/30 relative opacity-50">
                      <Icon className="w-10 h-10 text-slate-500" strokeWidth={2} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl opacity-60">🔒</span>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-400 text-base mb-1 relative z-10">{badge.title}</h4>
                    <p className="text-xs text-slate-500 font-medium relative z-10">{badge.description}</p>
                    
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-lg relative z-10">
                      <span className="text-xs font-semibold text-slate-400">Keep Going</span>
                      <span className="text-sm">💪</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}