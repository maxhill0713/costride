import React, { useState } from 'react';
import { Trophy, Star, Crown, Check } from 'lucide-react';
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
      if (newEquipped.length >= 3) newEquipped.shift();
      newEquipped.push(badgeId);
    }
    setEquippedBadges(newEquipped);
    await base44.auth.updateMe({ equipped_badges: newEquipped });
  };

  const equippedBadgeDetails = earnedBadges.filter(b => equippedBadges.includes(b.id));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 10010,
              background: 'rgba(0,0,0,0.82)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              zIndex: 10011,
              display: 'flex', flexDirection: 'column',
              background: 'rgba(10,10,18,0.98)',
              borderTop: '1px solid rgba(255,255,255,0.09)',
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              paddingBottom: 'max(env(safe-area-inset-bottom,0px),12px)',
              fontFamily: "'SF Pro Display',-apple-system,sans-serif",
              overflow: 'hidden',
            }}
          >
            {/* Drag handle */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.22)' }} />
            </div>

            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px 18px 12px', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Your Badges</span>
            </div>

            {/* Content */}
            <div style={{ overflowY: 'auto', padding: '0 18px 24px' }}>

              {/* Equipped showcase */}
              {equippedBadgeDetails.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Crown style={{ width: 13, height: 13, color: '#fbbf24' }} />
                    <span style={{ color: '#fcd34d', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Your Showcase</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {equippedBadgeDetails.map(badge => {
                      const Icon = badge.icon;
                      return (
                        <motion.div
                          key={badge.id}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEquipBadge(badge.id)}
                          style={{
                            position: 'relative', padding: '10px 8px',
                            borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))',
                            border: '1px solid rgba(251,191,36,0.35)',
                          }}
                        >
                          <div style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, background: '#fbbf24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check style={{ width: 8, height: 8, color: '#78350f' }} strokeWidth={3} />
                          </div>
                          {badge.image
                            ? <img src={badge.image} alt={badge.title} style={{ width: 36, height: 36, objectFit: 'contain', margin: '0 auto 6px' }} />
                            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}><Icon style={{ width: 18, height: 18, color: 'white' }} /></div>
                          }
                          <p style={{ color: 'white', fontSize: 9, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.title}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Divider */}
              {equippedBadgeDetails.length > 0 && earnedBadges.length > 0 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 20 }} />
              )}

              {/* Earned badges */}
              {earnedBadges.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <Trophy style={{ width: 13, height: 13, color: '#facc15' }} />
                    <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Earned ({earnedBadges.length})</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {earnedBadges.map((badge, index) => {
                      const Icon = badge.icon;
                      const isEquipped = equippedBadges.includes(badge.id);
                      return (
                        <motion.div
                          key={badge.id}
                          initial={{ opacity: 0, scale: 0.85, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: index * 0.05, type: 'spring' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEquipBadge(badge.id)}
                          style={{
                            position: 'relative', padding: '10px 8px',
                            borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                            background: isEquipped
                              ? 'linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))'
                              : 'rgba(255,255,255,0.05)',
                            border: isEquipped
                              ? '1px solid rgba(251,191,36,0.45)'
                              : '1px solid rgba(255,255,255,0.09)',
                            boxShadow: isEquipped ? '0 0 0 2px rgba(251,191,36,0.18)' : 'none',
                          }}
                        >
                          {isEquipped && (
                            <div style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, background: '#fbbf24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check style={{ width: 8, height: 8, color: '#78350f' }} strokeWidth={3} />
                            </div>
                          )}
                          {badge.image
                            ? <img src={badge.image} alt={badge.title} style={{ width: 36, height: 36, objectFit: 'contain', margin: '0 auto 6px' }} />
                            : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}><Icon style={{ width: 18, height: 18, color: 'white' }} /></div>
                          }
                          <p style={{ color: 'white', fontSize: 9, fontWeight: 700, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.title}</p>
                          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.description}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {earnedBadges.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Check out the monthly challenges to earn some badges!</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}