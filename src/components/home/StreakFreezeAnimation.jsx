import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FREEZE_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/cc9f0e5b9_ICEP1_V21.png';
const CRACKED_FREEZE_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/afee0c524_CRACKICEP1_V4.png';

const FREEZE_KEYFRAMES = `
  @keyframes freezeBounceIn {
    0%   { transform: scale(0.4) translateY(40px); opacity: 0; }
    55%  { transform: scale(1.12) translateY(-8px); opacity: 1; }
    75%  { transform: scale(0.95) translateY(2px); }
    88%  { transform: scale(1.04) translateY(0); }
    100% { transform: scale(1) translateY(0); opacity: 1; }
  }
  @keyframes freezeNumPop {
    0%   { transform: scale(0.3); opacity: 0; }
    55%  { transform: scale(1.18); opacity: 1; }
    75%  { transform: scale(0.93); }
    88%  { transform: scale(1.06); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes freezeIconCrack {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

function injectFreezeStyles() {
  if (document.getElementById('freeze-keyframes')) return;
  const style = document.createElement('style');
  style.id = 'freeze-keyframes';
  style.textContent = FREEZE_KEYFRAMES;
  document.head.appendChild(style);
}

function trigAnim(el, name, dur, easing) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = `${name} ${dur}ms ${easing} forwards`;
}

export default function StreakFreezeAnimation({
  isOpen,
  freezesLostCount,
  finalFreezeCount,
  onComplete,
}) {
  const [displayCount, setDisplayCount] = useState(finalFreezeCount + freezesLostCount);
  const iconRef = useRef(null);
  const numRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    injectFreezeStyles();
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    
    // Stage 1: Bounce in icon
    if (iconRef.current) {
      trigAnim(iconRef.current, 'freezeBounceIn', 600, 'cubic-bezier(0.34,1.5,0.64,1)');
    }

    // Stage 2: Decrease count (animated)
    const t1 = setTimeout(() => {
      const startCount = finalFreezeCount + freezesLostCount;
      const targetCount = finalFreezeCount;
      const steps = freezesLostCount;
      const stepDuration = 400 / steps;

      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          const newCount = startCount - i;
          setDisplayCount(newCount);
          
          // Pop animation on number
          if (numRef.current) {
            trigAnim(numRef.current, 'freezeNumPop', 300, 'cubic-bezier(0.34,1.6,0.64,1)');
          }
        }, i * stepDuration);
      }

      // Crack icon after last number pop
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = CRACKED_FREEZE_ICON_URL;
          trigAnim(iconRef.current, 'freezeIconCrack', 400, 'ease-in-out');
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
  }, [isOpen, freezesLostCount, finalFreezeCount, onComplete]);

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
            {/* Freeze icon */}
            <div style={{
              position: 'relative',
              width: 180,
              height: 180,
              opacity: 1,
              willChange: 'transform, opacity',
            }}>
              <img
                ref={iconRef}
                src={FREEZE_ICON_URL}
                alt="streak freeze"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>

            {/* Freeze count */}
            <div
              ref={numRef}
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: '#5dd9ff',
                textShadow: '0 4px 12px rgba(93,217,255,0.4)',
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