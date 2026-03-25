import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STREAK_ICON_URL          = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const SLIGHTLY_CRACKED_URL     = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/ebbdd65ac_CRACKP1_V1.png';
const CRACKED_STREAK_ICON_URL  = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/ac5efbf1a_CRACKP1_V2.png';

const ICON_SIZE = 216; // 180 * 1.2

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

    // Stage 1: Bounce in intact icon
    if (iconRef.current) {
      iconRef.current.src = STREAK_ICON_URL;
      trigAnim(iconRef.current, 'streakLossBounceIn', 600, 'cubic-bezier(0.34,1.5,0.64,1)');
    }

    // Stage 2: After 1.5s (extra second on intact icon), count down then crack
    const t1 = setTimeout(() => {
      const steps = previousStreak;
      // Slower: 700ms total for counting
      const stepDuration = 700 / Math.max(steps, 1);

      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          const newCount = previousStreak - i;
          setDisplayCount(newCount);
          if (numRef.current) {
            trigAnim(numRef.current, 'streakLossNumPop', 400, 'cubic-bezier(0.34,1.6,0.64,1)');
          }
        }, i * stepDuration);
      }

      // Step 1: slightly cracked
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = SLIGHTLY_CRACKED_URL;
          trigAnim(iconRef.current, 'streakLossIconCrack', 600, 'ease-in-out');
        }
      }, steps * stepDuration + 200);

      // Step 2: fully cracked — 900ms after slightly cracked
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = CRACKED_STREAK_ICON_URL;
          trigAnim(iconRef.current, 'streakLossIconCrack', 600, 'ease-in-out');
        }
        setTimeout(() => setAnimDone(true), 650);
      }, steps * stepDuration + 200 + 900);

    }, 1500); // extra second on intact icon

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
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.80)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            paddingTop: '18vh',
            paddingBottom: 40,
            paddingLeft: 32,
            paddingRight: 32,
          }}>

          {/* Content block — positioned near top */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            flex: 1,
          }}>

            {/* Message text — above icon, no glow */}
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
                  }}>
                  You have lost your streak, lock back in and lets start building!
                </motion.p>
              )}
            </AnimatePresence>

            {/* Streak icon — 20% larger */}
            <div style={{
              position: 'relative',
              width: ICON_SIZE,
              height: ICON_SIZE,
              willChange: 'transform, opacity',
              marginTop: 8,
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
                letterSpacing: '-0.04em',
                lineHeight: 1,
                opacity: 1,
              }}>
              {displayCount}
            </div>
          </div>

          {/* Continue button — anchored near bottom, no glow */}
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
                  width: '100%',
                  maxWidth: 360,
                  padding: '16px 0',
                  borderRadius: 16,
                  fontSize: 17,
                  fontWeight: 900,
                  color: '#fff',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  border: 'none',
                  letterSpacing: '-0.01em',
                  textAlign: 'center',
                  background: pressed
                    ? 'linear-gradient(to bottom, #e85520, #d44010)'
                    : 'linear-gradient(to bottom, #ff8c5a, #ff6b35, #e85520)',
                  borderBottom: pressed ? '2px solid #b83a0e' : '4px solid #b83a0e',
                  boxShadow: pressed ? 'none' : '0 3px 0 #b83a0e',
                  transform: pressed ? 'translateY(3px)' : 'translateY(0)',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                  flexShrink: 0,
                  marginBottom: 'env(safe-area-inset-bottom)',
                }}>
                Continue
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}