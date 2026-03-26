import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FREEZE_ICON_URL         = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/cc9f0e5b9_ICEP1_V21.png';
const SLIGHTLY_CRACKED_URL    = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/e8b3b08f1_CRACKICEP1_V3.png';
const CRACKED_FREEZE_ICON_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/afee0c524_CRACKICEP1_V4.png';

// Icon size: 180 * 1.2 = 216
const ICON_SIZE = 216;

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
  const startCount = finalFreezeCount + 1;
  const [displayCount, setDisplayCount] = useState(startCount);
  const [animDone, setAnimDone] = useState(false);
  const [pressed, setPressed] = useState(false);
  const iconRef = useRef(null);
  const numRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setAnimDone(false);
      setDisplayCount(finalFreezeCount + 1);
      return;
    }
    injectFreezeStyles();

    // Stage 1: Bounce in intact icon
    if (iconRef.current) {
      iconRef.current.src = FREEZE_ICON_URL;
      trigAnim(iconRef.current, 'freezeBounceIn', 600, 'cubic-bezier(0.34,1.5,0.64,1)');
    }

    // Stage 2: After 1.5s, count down then crack
    const t1 = setTimeout(() => {
      const startCount = finalFreezeCount + 1;
      const steps = freezesLostCount;
      const stepDuration = 700 / Math.max(steps, 1);

      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          const newCount = (finalFreezeCount + 1) - i;
          setDisplayCount(newCount);
          if (numRef.current) {
            trigAnim(numRef.current, 'freezeNumPop', 400, 'cubic-bezier(0.34,1.6,0.64,1)');
          }
        }, i * stepDuration);
      }

      // Step 1: slightly cracked
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = SLIGHTLY_CRACKED_URL;
          trigAnim(iconRef.current, 'freezeIconCrack', 600, 'ease-in-out');
        }
      }, steps * stepDuration + 200);

      // Step 2: fully cracked
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = CRACKED_FREEZE_ICON_URL;
          trigAnim(iconRef.current, 'freezeIconCrack', 600, 'ease-in-out');
        }
        setTimeout(() => setAnimDone(true), 650);
      }, steps * stepDuration + 200 + 900);

    }, 1500);

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
            paddingBottom: 40,
            paddingLeft: 32,
            paddingRight: 32,
          }}>

          {/* Message text — absolutely positioned near the top, independent of icon layout */}
          <AnimatePresence>
            {animDone && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  position: 'absolute',
                  top: '8vh',
                  left: 32,
                  right: 32,
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#5dd9ff',
                  textAlign: 'center',
                  lineHeight: 1.4,
                  maxWidth: 300,
                  margin: '0 auto',
                }}>
                Your streak is safe, but you have used a freeze. Lets get back to crushing it in the gym!
              </motion.p>
            )}
          </AnimatePresence>

          {/* Icon + number — centred on screen, never moves */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}>
            {/* Freeze icon */}
            <div style={{
              position: 'relative',
              width: ICON_SIZE,
              height: ICON_SIZE,
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
                letterSpacing: '-0.04em',
                lineHeight: 1,
                opacity: 1,
              }}>
              {displayCount}
            </div>
          </div>

          {/* Continue button — anchored near bottom */}
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
                    ? 'linear-gradient(to bottom, #3bbfe8, #1aa8d4)'
                    : 'linear-gradient(to bottom, #5dd9ff, #29bce8, #1aa8d4)',
                  borderBottom: pressed ? '2px solid #0e7a9e' : '4px solid #0e7a9e',
                  boxShadow: pressed ? 'none' : '0 3px 0 #0e7a9e',
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