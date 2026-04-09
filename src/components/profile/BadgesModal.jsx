import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Calendar, Target, Users, Crown, Star, Zap, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

const BADGE_LIBRARY = [
  {
    id: 'spartan',
    title: 'Spartan Streak',
    description: 'Witness My Gains',
    icon: Trophy,
    color: 'from-amber-400 to-amber-600',
    image: 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/04f579c72_spartanbadge.png'
  },
  {
    id: 'beach',
    title: 'Beach Day',
    description: 'Discipline Builder',
    icon: Star,
    color: 'from-orange-400 to-orange-600',
    image: 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/9bf9eb25d_beachbadge.png'
  }
];

export default function BadgesModal({ isOpen, onClose, user, checkIns = [] }) {
  const [equippedBadges, setEquippedBadges] = React.useState(user?.equipped_badges || []);

  const unlockedVariants = user?.unlocked_streak_variants || [];
  const earnedBadges = BADGE_LIBRARY.filter(badge => unlockedVariants.includes(badge.id));

  const handleEquipBadge = async (badgeId) => {
    let newEquipped = [...equippedBadges];
    
    if (newEquipped.includes(badgeId)) {
      newEquipped = newEquipped.filter(id => id !== badgeId);
    } else {
      if (newEquipped.length >= 3) {
        newEquipped.shift();
      }
      newEquipped.push(badgeId);
    }
    
    setEquippedBadges(newEquipped);
    await base44.auth.updateMe({ equipped_badges: newEquipped });
  };

  const equippedBadgeDetails = earnedBadges.filter(b => equippedBadges.includes(b.id));

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center"
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-t-3xl border-t border-x border-white/10 shadow-2xl"
        >
          {/* Drag handle bar */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-9 h-1 rounded-full bg-white/25" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-center px-6 pt-2 pb-5">
            <h2 className="text-xl font-bold text-white">Your Badges</h2>
          </div>

          <div className="space-y-6 px-6 pb-8">
            {/* Equipped Badges Showcase */}
            {equippedBadgeDetails.length > 0 && (
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
                        className={`relative p-3 rounded-xl bg-gradient-to-br ${badge.color} border border-white/30 shadow-md cursor-pointer hover:scale-105 transition-transform`}
                      >
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-2 h-2 text-amber-900" strokeWidth={3} />
                        </div>
                        {badge.image ? (
                          <img src={badge.image} alt={badge.title} className="w-8 h-8 mx-auto mb-1 object-contain" />
                        ) : (
                          <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                            <Icon className="w-4 h-4 text-white drop-shadow-lg" strokeWidth={2.5} />
                          </div>
                        )}
                        <h4 className="font-bold text-white text-[9px] text-center drop-shadow line-clamp-1">{badge.title}</h4>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Earned Badges */}
            {earnedBadges.length > 0 && (
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
                        onClick={() => handleEquipBadge(badge.id)}
                      >
                        <Card className={`p-3 text-center bg-gradient-to-br ${badge.color} border ${isEquipped ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-white/20 hover:border-white/40'} shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden group cursor-pointer`}>
                          {isEquipped && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm z-10">
                              <Check className="w-2.5 h-2.5 text-amber-900" strokeWidth={3} />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />

                          {badge.image ? (
                            <img src={badge.image} alt={badge.title} className="w-10 h-10 mx-auto mb-1.5 object-contain relative z-10" />
                          ) : (
                            <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg ring-2 ring-white/30 relative">
                              <Icon className="w-5 h-5 text-white drop-shadow-lg z-10" strokeWidth={2.5} />
                            </div>
                          )}

                          <h4 className="font-bold text-white text-[10px] mb-0.5 drop-shadow line-clamp-1">{badge.title}</h4>
                          <p className="text-[8px] text-white/80 font-medium drop-shadow line-clamp-1">{badge.description}</p>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {earnedBadges.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-400">Check out the monthly challenges to earn some badges!</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}