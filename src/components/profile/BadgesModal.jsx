import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Calendar, Target, Users, Crown, Star, Zap, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const BADGE_LIBRARY = [
{
  id: '10_visits',
  title: 'Getting Started',
  description: '10 gym check-ins',
  icon: Target,
  color: 'from-blue-400 to-blue-600',
  requirement: (user) => (user.total_check_ins || 0) >= 10,
  getProgress: (user) => ({ current: Math.min(user.total_check_ins || 0, 10), target: 10, label: 'check-ins' })
},
{
  id: '50_visits',
  title: 'Regular',
  description: '50 gym check-ins',
  icon: Flame,
  color: 'from-orange-400 to-red-500',
  requirement: (user) => (user.total_check_ins || 0) >= 50,
  getProgress: (user) => ({ current: Math.min(user.total_check_ins || 0, 50), target: 50, label: 'check-ins' })
},
{
  id: '100_visits',
  title: 'Dedicated',
  description: '100 gym check-ins',
  icon: Trophy,
  color: 'from-yellow-400 to-orange-500',
  requirement: (user) => (user.total_check_ins || 0) >= 100,
  getProgress: (user) => ({ current: Math.min(user.total_check_ins || 0, 100), target: 100, label: 'check-ins' })
},
{
  id: '7_day_streak',
  title: 'Week Warrior',
  description: '7-day streak',
  icon: Zap,
  color: 'from-green-400 to-emerald-500',
  requirement: (user) => (user.longest_streak || 0) >= 7,
  getProgress: (user) => ({ current: Math.min(user.longest_streak || 0, 7), target: 7, label: 'day streak' })
},
{
  id: '30_day_streak',
  title: 'Month Master',
  description: '30-day streak',
  icon: Flame,
  color: 'from-red-400 to-pink-500',
  requirement: (user) => (user.longest_streak || 0) >= 30,
  getProgress: (user) => ({ current: Math.min(user.longest_streak || 0, 30), target: 30, label: 'day streak' })
},
{
  id: '90_day_streak',
  title: 'Consistency King',
  description: '90-day streak',
  icon: Crown,
  color: 'from-purple-400 to-pink-500',
  requirement: (user) => (user.longest_streak || 0) >= 90,
  getProgress: (user) => ({ current: Math.min(user.longest_streak || 0, 90), target: 90, label: 'day streak' })
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
  },
  getProgress: (user) => {
    const days = user.gym_join_date ? Math.floor((new Date() - new Date(user.gym_join_date)) / (1000 * 60 * 60 * 24)) : 0;
    return { current: Math.min(days, 365), target: 365, label: 'days' };
  }
},
{
  id: 'community_leader',
  title: 'Community Leader',
  description: 'Active community member',
  icon: Users,
  color: 'from-cyan-400 to-blue-500',
  requirement: (user) => (user.total_check_ins || 0) >= 20,
  getProgress: (user) => ({ current: Math.min(user.total_check_ins || 0, 20), target: 20, label: 'check-ins' })
}];


export default function BadgesModal({ isOpen, onClose, user, checkIns = [] }) {
  const [equippedBadges, setEquippedBadges] = React.useState(user?.equipped_badges || []);

  // Calculate stats from actual data
  const userStats = {
    total_check_ins: checkIns.length,
    longest_streak: user.longest_streak || 0,
    current_streak: user.current_streak || 0,
    gym_join_date: user.created_date
  };

  const earnedBadges = BADGE_LIBRARY.filter((badge) => badge.requirement(userStats));
  const lockedBadges = BADGE_LIBRARY.filter((badge) => !badge.requirement(userStats));

  const handleEquipBadge = async (badgeId) => {
    let newEquipped = [...equippedBadges];

    if (newEquipped.includes(badgeId)) {
      newEquipped = newEquipped.filter((id) => id !== badgeId);
    } else {
      if (newEquipped.length >= 3) {
        newEquipped.shift();
      }
      newEquipped.push(badgeId);
    }

    setEquippedBadges(newEquipped);
    await base44.auth.updateMe({ equipped_badges: newEquipped });
  };

  const equippedBadgeDetails = earnedBadges.filter((b) => equippedBadges.includes(b.id));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end md:items-center justify-center p-4">
        
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl border border-white/10 p-6 shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              

              
              <div>
                <h2 className="text-xl font-bold text-white ml-2">Your Badges</h2>
                
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-slate-400 hover:text-white transition-colors">
              
              
            </button>
          </div>

          <div className="space-y-6">
            {/* Equipped Badges Showcase */}
            {equippedBadgeDetails.length > 0 &&
            <div>
                <h3 className="text-xs font-bold text-amber-300 mb-3 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Your Showcase (Equipped)
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {equippedBadgeDetails.map((badge) => {
                  const Icon = badge.icon;
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => handleEquipBadge(badge.id)}
                      className={`relative p-3 rounded-xl bg-gradient-to-br ${badge.color} border border-white/30 shadow-md cursor-pointer hover:scale-105 transition-transform`}>
                      
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-2 h-2 text-amber-900" strokeWidth={3} />
                        </div>
                        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <Icon className="w-4 h-4 text-white drop-shadow-lg" strokeWidth={2.5} />
                        </div>
                        <h4 className="font-bold text-white text-[9px] text-center drop-shadow line-clamp-1">{badge.title}</h4>
                      </motion.div>);

                })}
                </div>
              </div>
            }

            {/* Earned Badges */}
            {earnedBadges.length > 0 &&
            <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  Earned ({earnedBadges.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {earnedBadges.map((badge, index) => {
                  const Icon = badge.icon;
                  const isEquipped = equippedBadges.includes(badge.id);
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3, type: "spring" }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleEquipBadge(badge.id)}>
                      
                        <Card className={`p-3 text-center bg-gradient-to-br ${badge.color} border ${isEquipped ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/20 hover:border-white/40'} shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group cursor-pointer`}>
                          {isEquipped &&
                        <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm z-10">
                              <Check className="w-2.5 h-2.5 text-amber-900" strokeWidth={3} />
                            </div>
                        }
                          
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                          
                          <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30 relative">
                            <Icon className="w-5 h-5 text-white drop-shadow-lg z-10" strokeWidth={2.5} />
                          </div>
                          
                          <h4 className="font-bold text-white text-[10px] mb-0.5 drop-shadow line-clamp-1">{badge.title}</h4>
                          <p className="text-[8px] text-white/80 font-medium drop-shadow line-clamp-1">{badge.description}</p>
                        </Card>
                      </motion.div>);

                })}
                </div>
              </div>
            }

            {/* Locked Badges */}
            {lockedBadges.length > 0 &&
            <div>
                <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-slate-400" />
                  Locked ({lockedBadges.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {lockedBadges.map((badge, index) => {
                  const Icon = badge.icon;
                  const progress = badge.getProgress(userStats);
                  const pct = Math.min(progress.current / progress.target * 100, 100);
                  return (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}>
                      
                        






















                      
                      </motion.div>);

                })}
                </div>
              </div>
            }

            {earnedBadges.length === 0 && lockedBadges.length === 0 &&
            <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">Start working out to earn badges!</p>
              </div>
            }
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

}