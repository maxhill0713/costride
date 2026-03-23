import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STREAK_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const CRACKED_STREAK_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/ac5efbf1a_CRACKP1_V2.png';

const STREAK_LOSS_KEYFRAMES = `
  @keyframes streakLossBounceIn {
    0%   { transform: scale(0.4) translateY(40px); opacity: 0; }
    55%  { transform: scale(1.12) translateY(-8px); opacity: 1; }
    75%  { transform: scale(0.95) translateY(2px); }
    88%  { transform: scale(1.04) translateY(0); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes streakLossNumPop {
    0%   { transform: scale(0.3); opacity: 0; }
    55%  { transform: scale(1.18); opacity: 1; }
    75%  { transform: scale(0.93); }
    88%  { transform: scale(1.06); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes streakLossIconCrack {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

function injectStreakLossStyles() {
  if (document.getElementById('streak-loss-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'streak-loss-keyframes';
  style.textContent = STREAK_LOSS_KEYFRAMES;
  document.head.appendChild(style);
}

function trigAnim(el, name, dur, easing) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = `${name} ${dur}ms ${easing} forwards`;
}

export default function StreakLossAnimation({
  isOpen,
  previousStreak,
  onComplete,
}) {
  const [displayCount, setDisplayCount] = useState(previousStreak);
  const iconRef = useRef(null);
  const numRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    injectStreakLossStyles();
    
    // Stage 1: Bounce in icon
    if (iconRef.current) {
      trigAnim(iconRef.current, 'streakLossBounceIn', 600, 'cubic-bezier(0.34,1.5,0.64,1)');
    }

    // Stage 2: Decrease count (animated) from previousStreak to 0
    const t1 = setTimeout(() => {
      const steps = previousStreak;
      const stepDuration = 400 / Math.max(steps, 1);

      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          const newCount = previousStreak - i;
          setDisplayCount(newCount);
          
          // Pop animation on number
          if (numRef.current) {
            trigAnim(numRef.current, 'streakLossNumPop', 300, 'cubic-bezier(0.34,1.6,0.64,1)');
          }
        }, i * stepDuration);
      }

      // Crack icon after last number pop
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = CRACKED_STREAK_ICON_URL;
          trigAnim(iconRef.current, 'streakLossIconCrack', 400, 'ease-in-out');
        }
      }, steps * stepDuration + 100);
    }, 600);

    // Stage 3: Fade out
    const t2 = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen, previousStreak, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center overflow-hidden">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}>
            {/* Streak icon */}
            <div style={{
              position: 'relative',
              width: 180,
              height: 180,
              opacity: 1,
              willChange: 'transform, opacity',
            }}>
              <img
                ref={iconRef}
                src={STREAK_ICON_URL}
                alt="streak loss"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Streak count */}
            <div
              ref={numRef}
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: '#ff6b35',
                textShadow: '0 4px 12px rgba(255,107,53,0.4)',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                opacity: 1,
              }}>
              {displayCount}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}