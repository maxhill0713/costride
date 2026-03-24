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
  const [animDone, setAnimDone] = useState(false);
  const [pressed, setPressed] = useState(false);
  const iconRef = useRef(null);
  const numRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setAnimDone(false);
      setDisplayCount(finalFreezeCount + freezesLostCount);
      return;
    }
    injectFreezeStyles();

    // Stage 1: Bounce in icon
    if (iconRef.current) {
      trigAnim(iconRef.current, 'freezeBounceIn', 600, 'cubic-bezier(0.34,1.5,0.64,1)');
    }

    // Stage 2: Decrease count (animated)
    const t1 = setTimeout(() => {
      const startCount = finalFreezeCount + freezesLostCount;
      const steps = freezesLostCount;
      const stepDuration = 400 / steps;

      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          const newCount = startCount - i;
          setDisplayCount(newCount);
          if (numRef.current) {
            trigAnim(numRef.current, 'freezeNumPop', 300, 'cubic-bezier(0.34,1.6,0.64,1)');
          }
        }, i * stepDuration);
      }

      // Crack icon after last number pop, then show button
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = CRACKED_FREEZE_ICON_URL;
          trigAnim(iconRef.current, 'freezeIconCrack', 400, 'ease-in-out');
        }
        setTimeout(() => setAnimDone(true), 450);
      }, steps * stepDuration + 100);
    }, 600);

    return () => clearTimeout(t1);
  }, [isOpen, freezesLostCount, finalFreezeCount]);

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
                    color: '#5dd9ff',
                    textAlign: 'center',
                    lineHeight: 1.4,
                    maxWidth: 300,
                    margin: 0,
                    textShadow: '0 2px 8px rgba(93,217,255,0.25)',
                  }}>
                  Your streak is safe, but you have used a freeze. Lets get back to crushing it in the gym!
                </motion.p>
              )}
            </AnimatePresence>

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
                    background: 'linear-gradient(to bottom, #5dd9ff, #29bce8, #1aa8d4)',
                    borderBottom: pressed ? '1px solid rgba(0,0,0,0.4)' : '4px solid #0e7a9e',
                    boxShadow: pressed
                      ? 'none'
                      : '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 20px rgba(93,217,255,0.35)',
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