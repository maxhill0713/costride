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
  const [animDone, setAnimDone] = useState(false);
  const [pressed, setPressed] = useState(false);
  const iconRef = useRef(null);
  const numRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setAnimDone(false);
      setDisplayCount(previousStreak);
      return;
    }
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
          if (numRef.current) {
            trigAnim(numRef.current, 'streakLossNumPop', 300, 'cubic-bezier(0.34,1.6,0.64,1)');
          }
        }, i * stepDuration);
      }

      // Crack icon after last number pop, then show button
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = CRACKED_STREAK_ICON_URL;
          trigAnim(iconRef.current, 'streakLossIconCrack', 400, 'ease-in-out');
        }
        setTimeout(() => setAnimDone(true), 450);
      }, steps * stepDuration + 100);
    }, 600);

    return () => clearTimeout(t1);
  }, [isOpen, previousStreak]);

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
            padding: '0 32px',
          }}>

            {/* Message text */}
            <AnimatePresence>
              {animDone && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#ff6b35',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    maxWidth: 300,
                    margin: 0,
                    textShadow: '0 2px 8px rgba(255,107,53,0.25)',
                  }}>
                  You have lost your streak, lock back in and lets start building!
                </motion.p>
              )}
            </AnimatePresence>

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

            {/* Continue button */}
            <AnimatePresence>
              {animDone && (
                <motion.button
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                  onMouseDown={() => setPressed(true)}
                  onMouseUp={() => { setPressed(false); onComplete(); }}
                  onMouseLeave={() => setPressed(false)}
                  onTouchStart={() => setPressed(true)}
                  onTouchEnd={() => { setPressed(false); onComplete(); }}
                  style={{
                    marginTop: 8,
                    padding: '14px 48px',
                    borderRadius: 16,
                    fontSize: 16,
                    fontWeight: 900,
                    color: '#fff',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    border: 'none',
                    letterSpacing: '-0.01em',
                    background: 'linear-gradient(to bottom, #ff8c5a, #ff6b35, #e85520)',
                    borderBottom: pressed ? '1px solid rgba(0,0,0,0.4)' : '4px solid #b83a0e',
                    boxShadow: pressed
                      ? 'none'
                      : '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 20px rgba(255,107,53,0.35)',
                    transform: pressed ? 'translateY(3px)' : 'translateY(0)',
                    transition: 'transform 0.08s ease, box-shadow 0.08s ease, border-bottom 0.08s ease',
                  }}>
                  Continue
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}