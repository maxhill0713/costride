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

// ---------- Sound helpers (Web Audio API, no external files) ----------

function getAudioContext() {
  if (!window._freezeAudioCtx) {
    window._freezeAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._freezeAudioCtx;
}

// Short icy crack — thin noise burst with a quick pitch drop
function playIceCrack() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    // White noise source
    const bufLen = ctx.sampleRate * 0.18;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);

    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Band-pass to make it feel icy/glassy rather than boomy
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3800;
    bp.Q.value = 1.2;

    // High-pass to keep it thin
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    src.connect(bp).connect(hp).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.18);
  } catch (e) { /* audio blocked — silent fallback */ }
}

// Full shatter — two layered noise bursts with a low thud
function playIceShatter() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    // Helper: noise burst
    function noiseBurst(startTime, duration, freq, q, vol, decay) {
      const bufLen = Math.ceil(ctx.sampleRate * duration);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = q;

      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + decay);

      src.connect(bp).connect(g).connect(ctx.destination);
      src.start(startTime);
      src.stop(startTime + duration);
    }

    // Low thud on impact
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.5, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(thudGain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);

    // High glassy burst — main shatter
    noiseBurst(t,        0.28, 5500, 0.9, 0.7,  0.25);
    // Mid crackle — slightly delayed
    noiseBurst(t + 0.03, 0.22, 2800, 1.4, 0.45, 0.20);
    // Tail tinkle — small fragments settling
    noiseBurst(t + 0.10, 0.30, 7000, 0.7, 0.25, 0.28);
    noiseBurst(t + 0.16, 0.20, 6200, 1.0, 0.15, 0.18);

  } catch (e) { /* audio blocked — silent fallback */ }
}

// ---------- End sound helpers ----------

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

    // Stage 1: Bounce in intact icon
    if (iconRef.current) {
      iconRef.current.src = FREEZE_ICON_URL;
      trigAnim(iconRef.current, 'freezeBounceIn', 600, 'cubic-bezier(0.34,1.5,0.64,1)');
    }

    // Stage 2: After 1.5s (extra second on intact icon), count down then crack
    const t1 = setTimeout(() => {
      const startCount = finalFreezeCount + freezesLostCount;
      const steps = freezesLostCount;
      const stepDuration = 700 / Math.max(steps, 1);

      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          const newCount = startCount - i;
          setDisplayCount(newCount);
          if (numRef.current) {
            trigAnim(numRef.current, 'freezeNumPop', 400, 'cubic-bezier(0.34,1.6,0.64,1)');
          }
        }, i * stepDuration);
      }

      // Step 1: slightly cracked + crack sound
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = SLIGHTLY_CRACKED_URL;
          trigAnim(iconRef.current, 'freezeIconCrack', 600, 'ease-in-out');
        }
        playIceCrack();
      }, steps * stepDuration + 200);

      // Step 2: fully cracked + shatter sound
      setTimeout(() => {
        if (iconRef.current) {
          iconRef.current.src = CRACKED_FREEZE_ICON_URL;
          trigAnim(iconRef.current, 'freezeIconCrack', 600, 'ease-in-out');
        }
        playIceShatter();
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