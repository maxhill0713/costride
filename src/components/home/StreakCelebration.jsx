import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ShareWorkoutScreen from '../profile/ShareWorkoutScreen';
import UniqueBadge from '../challenges/UniqueBadge';
import { getSwappedRestDay } from '@/lib/weekSwaps';

const POSE_1_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const POSE_2_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/8d4e06e17_Pose2_V21.png';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Shared AudioContext — created once on first user gesture, reused for all sounds ──
let _sharedCtx = null;

function getAudioCtx() {
  try {
    if (!_sharedCtx || _sharedCtx.state === 'closed') {
      _sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_sharedCtx.state === 'suspended') {
      _sharedCtx.resume();
    }
    return _sharedCtx;
  } catch (_) {
    return null;
  }
}

// Call this on any user gesture to pre-unlock the audio context
function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

// ── Audio ─────────────────────────────────────────────────────────────────────

function playCircleLevelUp() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const t = (freq, start, dur, gain, type = 'sine') => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start); osc.stop(start + dur + 0.05);
    };
    const now = ctx.currentTime;
    t(392,  now,        0.12, 0.22);
    t(523,  now + 0.09, 0.12, 0.22);
    t(659,  now + 0.18, 0.14, 0.26);
    t(784,  now + 0.27, 0.30, 0.30);
    t(1047, now + 0.27, 0.22, 0.12);
    t(110,  now + 0.27, 0.18, 0.14, 'triangle');
    if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
  } catch (_) {}
}

function playStreakAnticipationSound() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.28;

    const bufLen = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(300, now);
    bp.frequency.exponentialRampToValueAtTime(1200, now + dur);
    bp.Q.setValueAtTime(1.5, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0, now);
    nGain.gain.linearRampToValueAtTime(0.10, now + 0.04);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(bp);
    bp.connect(nGain);
    nGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + dur);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0, now);
    oGain.gain.linearRampToValueAtTime(0.14, now + 0.05);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(oGain);
    oGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + dur + 0.05);
    osc.start(now);
    osc.stop(now + dur + 0.05);

    if (navigator.vibrate) navigator.vibrate([15]);
  } catch (_) {}
}

// ── NEW: Duolingo-style layered "unlock" ascending aahhhh ──────────────────
// Three harmonically-related sine voices rise together with a shimmer layer,
// creating that satisfying "you've unlocked the next level" feeling.
// Kept subtle — total gain well below clipping.
function playStreakUnlockSound() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.72;

    // ── Master compressor to keep everything tidy ──
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-18, now);
    comp.knee.setValueAtTime(6, now);
    comp.ratio.setValueAtTime(4, now);
    comp.attack.setValueAtTime(0.003, now);
    comp.release.setValueAtTime(0.15, now);
    comp.connect(ctx.destination);

    const voice = (startFreq, endFreq, startT, voiceDur, gain, type = 'sine') => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, now + startT);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + startT + voiceDur * 0.85);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + startT);
      g.gain.linearRampToValueAtTime(gain, now + startT + 0.03);
      g.gain.setValueAtTime(gain, now + startT + voiceDur * 0.55);
      g.gain.exponentialRampToValueAtTime(0.001, now + startT + voiceDur);

      osc.connect(g);
      g.connect(comp);
      osc.start(now + startT);
      osc.stop(now + startT + voiceDur + 0.06);
    };

    // Layer 1 — root voice, rises from mid to high (the main "aah")
    voice(480,  1520, 0,    dur,        0.22, 'sine');
    // Layer 2 — fifth above root, slight delay, same sweep (warmth)
    voice(720,  2280, 0.03, dur - 0.03, 0.14, 'sine');
    // Layer 3 — octave above root, slightly later (shimmer)
    voice(960,  3040, 0.07, dur - 0.07, 0.09, 'sine');
    // Layer 4 — sub-octave triangle for body (barely audible, just warmth)
    voice(240,  760,  0,    dur,        0.07, 'triangle');
    // Layer 5 — bright triangle shimmer at top end
    voice(1440, 4200, 0.10, dur - 0.10, 0.05, 'triangle');

    // Airy noise whoosh — gives the "woooosh" quality behind the tones
    const bufLen = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(800, now);
    bp.frequency.exponentialRampToValueAtTime(3600, now + dur * 0.8);
    bp.Q.setValueAtTime(0.9, now);

    const hs = ctx.createBiquadFilter();
    hs.type = 'highshelf';
    hs.frequency.setValueAtTime(4000, now);
    hs.gain.setValueAtTime(5, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0, now);
    nGain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(bp);
    bp.connect(hs);
    hs.connect(nGain);
    nGain.connect(comp);

    noise.start(now);
    noise.stop(now + dur + 0.05);

    if (navigator.vibrate) navigator.vibrate([15, 10, 40]);
  } catch (_) {}
}

function playIconSlideDownSound() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.38;

    const bufLen = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2200, now);
    bp.frequency.exponentialRampToValueAtTime(500, now + dur);
    bp.Q.setValueAtTime(1.2, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.22, now + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(bp);
    bp.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + dur + 0.05);

    if (navigator.vibrate) navigator.vibrate([10]);
  } catch (_) {}
}

function playChallengeProgressSound(idx = 0) {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 1.1;

    const bufLen = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const nbp = ctx.createBiquadFilter();
    nbp.type = 'bandpass';
    nbp.frequency.setValueAtTime(300 + idx * 80, now);
    nbp.frequency.exponentialRampToValueAtTime(2200 + idx * 200, now + dur * 0.85);
    nbp.Q.setValueAtTime(1.2, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0, now);
    nGain.gain.linearRampToValueAtTime(0.10, now + 0.05);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(nbp);
    nbp.connect(nGain);
    nGain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const startFreq = 160 + idx * 30;
    const endFreq   = 900 + idx * 80;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur * 0.9);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0, now);
    oGain.gain.linearRampToValueAtTime(0.13, now + 0.06);
    oGain.gain.setValueAtTime(0.13, now + dur * 0.75);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(oGain);
    oGain.connect(ctx.destination);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(startFreq * 1.5, now);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.5, now + dur * 0.9);

    const oGain2 = ctx.createGain();
    oGain2.gain.setValueAtTime(0, now);
    oGain2.gain.linearRampToValueAtTime(0.055, now + 0.08);
    oGain2.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.92);

    osc2.connect(oGain2);
    oGain2.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + dur + 0.05);
    osc.start(now);
    osc.stop(now + dur + 0.05);
    osc2.start(now);
    osc2.stop(now + dur + 0.05);

  } catch (_) {}
}

function playTodayCircleFillSound() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const t = (freq, start, dur, gain, type = 'sine') => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start); osc.stop(start + dur + 0.05);
    };
    t(660,  now,        0.22, 0.12);
    t(990,  now + 0.10, 0.30, 0.14);
    t(98,   now,        0.10, 0.06, 'triangle');
    if (navigator.vibrate) navigator.vibrate([20]);
  } catch (_) {}
}

function playDayCircleDing() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    const t = (freq, start, dur, gain, type = 'sine') => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start); osc.stop(start + dur + 0.05);
    };
    t(880,  now,        0.18, 0.28);
    t(1320, now + 0.13, 0.28, 0.32);
    t(1760, now + 0.24, 0.20, 0.16);
    t(130,  now,        0.12, 0.16, 'triangle');
    if (navigator.vibrate) navigator.vibrate([30, 20, 60]);
  } catch (_) {}
}

function injectDayStyles() {
  if (document.getElementById('sc-day-styles')) return;
  const s = document.createElement('style');
  s.id = 'sc-day-styles';
  s.textContent = `
    @keyframes scCirclePop {
      0%   { transform: scale(0.55); }
      55%  { transform: scale(1.18); }
      72%  { transform: scale(0.93); }
      85%  { transform: scale(1.07); }
      100% { transform: scale(1); }
    }
    @keyframes scCircleColourPop {
      0%   { transform: scale(1); }
      35%  { transform: scale(1.22); }
      55%  { transform: scale(0.91); }
      72%  { transform: scale(1.09); }
      85%  { transform: scale(0.97); }
      100% { transform: scale(1); }
    }
    @keyframes scPastCirclePop {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.18); }
      52%  { transform: scale(0.92); }
      70%  { transform: scale(1.08); }
      85%  { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    @keyframes scWiggle {
      0%, 60%, 100% { transform: rotate(0deg); }
      65%           { transform: rotate(-6deg); }
      75%           { transform: rotate(5deg); }
      85%           { transform: rotate(-3deg); }
      92%           { transform: rotate(2deg); }
    }
    @keyframes scTickDraw {
      from { stroke-dashoffset: 40; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes scTodayRingPulse {
      0%, 100% { transform: scale(1);    opacity: 0.55; }
      50%       { transform: scale(1.13); opacity: 0.2;  }
    }
    @keyframes scRowSlideUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes streakIconExpand {
      0%   { transform: scale(1);   opacity: 1;   filter: brightness(1); }
      20%  { transform: scale(1.2); opacity: 1;   filter: brightness(1.15); }
      55%  { transform: scale(2.2); opacity: 0.7; filter: brightness(1.3); }
      80%  { transform: scale(3.6); opacity: 0.25; filter: brightness(1.5); }
      100% { transform: scale(5.0); opacity: 0;   filter: brightness(1.8); }
    }
  `;
  document.head.appendChild(s);
}

// ── Shared 3D button ──────────────────────────────────────────────────────────
function StyledButton({ enabled, opacity, onClick, label = 'Continue', variant = 'blue' }) {
  const [pressed, setPressed] = useState(false);

  const faceEnabled = {
    blue:   'linear-gradient(to bottom, #60a5fa, #3b82f6 40%, #1d4ed8)',
    green:  'linear-gradient(to bottom, #4ade80, #22c55e 40%, #16a34a)',
    orange: 'linear-gradient(to bottom, #fb923c, #f97316 40%, #ea580c)',
    subtle: 'linear-gradient(to bottom, #334155, #1e293b 40%, #0f172a)',
  }[variant];

  const faceDisabled = 'linear-gradient(to bottom, #2d3748, #1a202c 50%, #0f172a)';

  const shadowEnabled = {
    blue:   '#1a3fa8',
    green:  '#15803d',
    orange: '#c2410c',
    subtle: '#0a0f1a',
  }[variant];

  return (
    <div style={{
      position: 'relative', width: '100%',
      opacity: opacity !== undefined ? opacity : 1,
      transition: 'opacity 0.8s ease',
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16,
        background: enabled ? shadowEnabled : '#111827',
        transform: pressed ? 'translateY(1px)' : 'translateY(4px)',
        transition: 'background 0.8s ease, transform 0.07s ease',
      }} />
      <button
        disabled={!enabled}
        onMouseDown={() => enabled && setPressed(true)}
        onMouseUp={() => { setPressed(false); if (enabled) onClick?.(); }}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => enabled && setPressed(true)}
        onTouchEnd={(e) => { e.preventDefault(); setPressed(false); if (enabled) onClick?.(); }}
        onTouchCancel={() => setPressed(false)}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', padding: '13px 0', borderRadius: 16, border: 'none',
          background: enabled ? faceEnabled : faceDisabled,
          color: enabled ? '#fff' : 'rgba(255,255,255,0.28)',
          fontSize: 16, fontWeight: 900, cursor: enabled ? 'pointer' : 'default',
          letterSpacing: '-0.01em',
          WebkitTapHighlightColor: 'transparent', userSelect: 'none', outline: 'none',
          transform: pressed ? 'translateY(4px)' : 'translateY(0)',
          boxShadow: pressed || !enabled ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.2)',
          transition: 'transform 0.07s ease, box-shadow 0.07s ease, background 0.8s ease, color 0.8s ease',
        }}
      >
        {label}
      </button>
    </div>
  );
}

function ContinueButton(props) {
  return <StyledButton {...props} label="Continue" variant="blue" />;
}

// ── EmbeddedDayCircles ────────────────────────────────────────────────────────
function EmbeddedDayCircles({ currentUser, weeklyWorkoutLogs, todayDow, startAnimation, onAllVisible, onAnimationComplete }) {
  const [animatedIdx, setAnimatedIdx]         = useState(-1);
  const [todayColoured, setTodayColoured]     = useState(false);
  const [todayColourPop, setTodayColourPop]   = useState(false);
  const [pastCirclePop, setPastCirclePop]     = useState(false);
  const [wiggleActive, setWiggleActive]       = useState(false);
  const hasCompleted = useRef(false);

  const todayDowAdjusted = todayDow || (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();
  const trainingDays     = (currentUser?.training_days || []).filter(d => d >= 1 && d <= 7);
  const allDays          = [1, 2, 3, 4, 5, 6, 7];
  const swappedRestDay   = getSwappedRestDay();

  const loggedDays = new Set();
  weeklyWorkoutLogs.forEach(l => {
    const d = new Date(l.completed_date).getDay();
    loggedDays.add(d === 0 ? 7 : d);
  });

  const vertOffset = i => Math.round(Math.sin((i / (allDays.length - 1)) * Math.PI * 2) * 9);

  useEffect(() => {
    if (!startAnimation) return;
    const timers = [];

    allDays.forEach((_, i) => {
      timers.push(setTimeout(() => setAnimatedIdx(i), i * 90));
    });

    const allVisibleAt = (allDays.length - 1) * 90 + 80;
    timers.push(setTimeout(() => onAllVisible?.(), allVisibleAt));

    timers.push(setTimeout(() => setWiggleActive(true),  allVisibleAt + 80));
    timers.push(setTimeout(() => setWiggleActive(false), allVisibleAt + 80 + 700));

    const todayColourAt = allVisibleAt + 800;
    timers.push(setTimeout(() => {
      setTodayColoured(true);
      setTodayColourPop(true);
      setPastCirclePop(true);
      playTodayCircleFillSound();
      setTimeout(() => playDayCircleDing(), 80);
      setTimeout(() => { setTodayColourPop(false); setPastCirclePop(false); }, 650);
    }, todayColourAt));

    const lastAt = todayColourAt + 500;
    timers.push(setTimeout(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onAnimationComplete?.();
      }
    }, lastAt));

    return () => timers.forEach(clearTimeout);
  }, [startAnimation]);

  const getCircleProps = (day, i) => {
    const isToday    = day === todayDowAdjusted;
    const doneBase   = loggedDays.has(day);
    const done       = isToday ? todayColoured : doneBase;
    const isRestDay  = trainingDays.length > 0 && !trainingDays.includes(day) && !doneBase && !isToday && day !== swappedRestDay;
    const isPast     = day < todayDowAdjusted;
    const isMissed   = !isRestDay && !doneBase && isPast && !isToday;
    const isPastRest = isRestDay && isPast;
    const size       = isToday ? 54 : 44;
    const isVisible  = i <= animatedIdx;
    const isColouringNow = isToday ? todayColourPop : false;

    const isImmediatelyColoured = !isToday && (doneBase || isMissed || isPastRest);
    const isPastPopping = pastCirclePop && isImmediatelyColoured;

    const getBg = () => {
      if (isToday) {
        return done
          ? 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)'
          : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
      }
      if (isRestDay) {
        return isPastRest
          ? 'linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)'
          : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
      }
      if (doneBase) return 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)';
      if (isMissed) return 'linear-gradient(to bottom, #f87171 0%, #ef4444 35%, #b91c1c 100%)';
      return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
    };
    const getBorder = () => {
      if (isToday)   return done ? '1px solid rgba(147,197,253,0.5)' : '1px solid rgba(71,85,105,0.7)';
      if (isRestDay) return isPastRest ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(71,85,105,0.7)';
      if (doneBase)  return '1px solid rgba(147,197,253,0.5)';
      if (isMissed)  return '1px solid rgba(248,113,113,0.5)';
      return '1px solid rgba(71,85,105,0.7)';
    };
    const getBoxShadow = () => {
      if (isToday)   return done ? '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25)' : '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
      if (isRestDay) return isPastRest ? '0 3px 0 0 #15803d, 0 5px 12px rgba(0,80,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
      if (doneBase)  return '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25)';
      if (isMissed)  return '0 4px 0 0 #991b1b, inset 0 1px 0 rgba(255,255,255,0.25)';
      return '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
    };
    const getAnim = () => {
      if (!isVisible) return 'none';
      if (isColouringNow && isToday) return 'scCircleColourPop 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards';
      if (isPastPopping) return 'scPastCirclePop 0.5s cubic-bezier(0.34,1.3,0.64,1) forwards';
      if (wiggleActive && !isImmediatelyColoured && !done) return `scWiggle 2.4s ease-in-out ${i * 0.09}s infinite`;
      return 'scCirclePop 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards';
    };

    return { isToday, done, isRestDay, isMissed, isPastRest, doneBase, size, isVisible, isImmediatelyColoured, isColouringNow, isPastPopping, getBg, getBorder, getBoxShadow, getAnim };
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
      justifyContent: 'center', gap: 8, height: 90, width: '100%',
      overflow: 'visible', padding: '10px 0',
      animation: 'scRowSlideUp 0.45s cubic-bezier(0.34,1.15,0.64,1) forwards',
    }}>
      {allDays.map((day, i) => {
        const p = getCircleProps(day, i);
        const { isToday, done, isRestDay, isMissed, isPastRest, doneBase, size, isVisible, isImmediatelyColoured, getBg, getBorder, getBoxShadow, getAnim } = p;
        const vOffset  = 9 + vertOffset(i) - (isToday ? 4 : 0);
        const iconSize = isToday ? 22 : 18;

        const showIcon = isImmediatelyColoured ? isVisible : (isToday ? done : (doneBase || isMissed || isPastRest));

        return (
          <div key={day} style={{
            position: 'relative', width: size, height: size,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: vOffset,
            overflow: 'visible', zIndex: isToday ? 2 : 1,
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.1s ease',
          }}>
            {isToday && isVisible && (
              <div style={{
                position: 'absolute', width: size + 14, height: size + 14,
                borderRadius: '50%', border: '3px solid rgba(148,163,184,0.45)',
                background: 'rgba(148,163,184,0.08)',
                animation: 'scTodayRingPulse 2s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
            <div
              style={{
                width: size, height: size, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: getBg(), border: getBorder(), boxShadow: getBoxShadow(),
                animation: getAnim(), flexShrink: 0,
                transform: isVisible ? undefined : 'scale(0.3)',
                transition: 'background 0.35s ease, border 0.35s ease, box-shadow 0.35s ease',
              }}
            >
              {isRestDay ? (
                isPastRest ? (
                  <svg width={isToday ? 35 : 28} height={isToday ? 35 : 28} viewBox="0 0 100 100" fill="none">
                    <line x1="50" y1="95" x2="50" y2="30" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                    <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                    <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                    <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                    <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                    <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                  </svg>
                ) : (
                  <svg width={isToday ? 35 : 28} height={isToday ? 35 : 28} viewBox="0 0 100 100" fill="none">
                    <line x1="50" y1="95" x2="50" y2="30" stroke="rgba(148,163,184,0.3)" strokeWidth="3" strokeLinecap="round" />
                    <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                    <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                    <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                    <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                    <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                  </svg>
                )
              ) : done || doneBase ? (
                showIcon ? (
                  <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10.5l4.5 4.5 7.5-9"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="40" strokeDashoffset="40"
                      style={{ animation: isImmediatelyColoured ? 'none' : 'scTickDraw 0.45s ease 0s forwards', strokeDashoffset: isImmediatelyColoured ? 0 : undefined }}
                    />
                  </svg>
                ) : (
                  <div style={{ width: iconSize, height: iconSize }} />
                )
              ) : isMissed ? (
                showIcon ? (
                  <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
                    <path d="M5 5l10 10M15 5L5 15" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <div style={{ width: iconSize, height: iconSize }} />
                )
              ) : (
                <div style={{
                  width: isToday ? 20 : 15, height: isToday ? 20 : 15, borderRadius: '50%',
                  border: isToday ? '2px solid rgba(148,163,184,0.6)' : '2px solid rgba(100,116,139,0.35)',
                  background: isToday ? 'rgba(255,255,255,0.05)' : 'transparent',
                  boxShadow: isToday ? 'inset 0 1px 3px rgba(0,0,0,0.4)' : 'none',
                }} />
              )}
            </div>

            <span style={{
              position: 'absolute', top: size + 5, left: '50%',
              transform: 'translateX(-50%)', fontSize: 8,
              fontWeight: isToday ? 900 : 700,
              color: isToday ? '#93c5fd'
                : doneBase    ? 'rgba(147,197,253,0.7)'
                : isMissed    ? 'rgba(248,113,113,0.6)'
                : isPastRest  ? 'rgba(74,222,128,0.7)'
                : 'rgba(100,116,139,0.5)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              whiteSpace: 'nowrap', pointerEvents: 'none',
              opacity: isVisible ? 1 : 0,
              transition: 'color 0.35s ease, opacity 0.2s ease',
            }}>
              {DAY_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── ChallengesStage ────────────────────────────────────────────────────────────
function ChallengesStage({ celebrationChallenges, onChallengesContinue, BUTTON_BOTTOM, BUTTON_WIDTH }) {
  const [continueEnabled, setContinueEnabled] = useState(false);
  const [continueOpacity, setContinueOpacity] = useState(0);
  const [sliding, setSliding] = useState(false);
  const soundsFired = useRef(new Set());

  useEffect(() => {
    const lastIdx   = celebrationChallenges.length - 1;
    const barDoneMs = (0.6 + lastIdx * 0.12 + 1.2) * 1000;

    celebrationChallenges.forEach((_, idx) => {
      const delay = (0.6 + idx * 0.12) * 1000 + 150;
      const key = `bar-${idx}`;
      setTimeout(() => {
        if (!soundsFired.current.has(key)) {
          soundsFired.current.add(key);
          playChallengeProgressSound(idx);
        }
      }, delay);
    });

    const t1 = setTimeout(() => setContinueOpacity(1), 700);
    const t2 = setTimeout(() => setContinueEnabled(true), barDoneMs + 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [celebrationChallenges.length]);

  const handleContinuePress = () => {
    if (!continueEnabled || sliding) return;
    setSliding(true);
  };

  const handleSlideComplete = () => {
    onChallengesContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4"
    >
      <div style={{
        transform: 'scale(0.9)', transformOrigin: 'top center',
        width: '100%', maxWidth: '24rem',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
      }} className="space-y-3">
        {celebrationChallenges.map((challenge, idx) => {
          const prevPct    = Math.min(100, Math.round((challenge.previous_value / challenge.target_value) * 100));
          const newPct     = Math.min(100, Math.round((challenge.new_value / challenge.target_value) * 100));
          const isComplete = newPct >= 100;
          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={sliding
                ? { opacity: 0, x: '-110%', transition: { duration: 0.55, delay: idx * 0.07, ease: [0.55, 0, 1, 0.45] } }
                : { opacity: 1, scale: 1 }
              }
              transition={{ delay: 0.25 + idx * 0.12, duration: 0.35 }}
              onAnimationComplete={() => {
                if (sliding && idx === celebrationChallenges.length - 1) {
                  handleSlideComplete();
                }
              }}
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(135deg, rgba(16,19,40,0.96) 0%, rgba(6,8,18,0.99) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)' }} />
              <div className="relative p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
                      alt="Challenge" className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-black text-white leading-tight truncate">{challenge.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{challenge.description}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-400">{challenge.new_value} / {challenge.target_value}</span>
                    <span className="text-[11px] font-bold" style={{ color: isComplete ? '#34d399' : '#64748b' }}>
                      {isComplete ? '✓ Complete' : `${newPct}%`}
                    </span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <motion.div
                      initial={{ width: `${prevPct}%` }}
                      animate={{ width: `${newPct}%` }}
                      transition={{ delay: 0.6 + idx * 0.12, duration: 1.2, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: isComplete ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #38bdf8, #60a5fa)' }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <UniqueBadge reward={challenge.reward} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Reward</p>
                    <p className="text-[13px] font-black text-white truncate">{challenge.reward}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', bottom: BUTTON_BOTTOM, width: BUTTON_WIDTH }}>
        <StyledButton
          enabled={continueEnabled && !sliding}
          opacity={continueOpacity}
          onClick={handleContinuePress}
          label="Continue"
          variant="blue"
        />
      </div>
    </motion.div>
  );
}

// ── StreakCelebration ─────────────────────────────────────────────────────────
function StreakCelebration({
  showStreakCelebration,
  celebrationStreakNum,
  showChallengesCelebration,
  celebrationChallenges,
  showShareWorkout,
  celebrationWorkoutName,
  celebrationExercises,
  celebrationPreviousExercises,
  celebrationDurationMinutes,
  currentUser,
  gymId,
  gymName,
  showDaysCelebration,
  weeklyWorkoutLogs,
  todayDowAdjusted,
  setShowShareWorkout,
  setShowDaysCelebration,
  setJustLoggedDay,
  onChallengesContinue,
}) {
  const [streakPhase, setStreakPhase]                     = useState('animating');
  const [startCircleAnimation, setStartCircleAnimation]   = useState(false);
  const [continueButtonVisible, setContinueButtonVisible] = useState(false);
  const [continueButtonEnabled, setContinueButtonEnabled] = useState(false);
  const [continueButtonOpacity, setContinueButtonOpacity] = useState(0);

  // Exit animation state
  // 'idle' → 'fading' (number+circles+button fade) → 'shifting' (icon slides down alone)
  // → 'exploding' (icon expands out) → 'done'
  const [exitPhase, setExitPhase]             = useState('idle');
  const [iconExploding, setIconExploding]     = useState(false);
  const [numberFaded, setNumberFaded]         = useState(false);    // number fades with rest of page
  const [everythingFaded, setEverythingFaded] = useState(false);    // circles + button fade

  // ── FIX: persistent backdrop that NEVER disappears mid-transition ──────────
  // We keep the backdrop mounted for the entire streak → challenges → share flow.
  // It only hides after showShareWorkout has fully closed.
  const [showSharedBackground, setShowSharedBackground] = useState(false);
  // suppressBackdrop makes it visually transparent (for final dismiss), but
  // we do NOT suppress it during the streak→challenges transition.
  const [suppressBackdrop, setSuppressBackdrop] = useState(false);

  useEffect(() => { injectDayStyles(); }, []);

  // Control backdrop lifetime
  useEffect(() => {
    if (showStreakCelebration || showChallengesCelebration || showShareWorkout) {
      // Any stage active → ensure backdrop is up and opaque
      setShowSharedBackground(true);
      setSuppressBackdrop(false);
    } else if (!showStreakCelebration && !showChallengesCelebration && !showShareWorkout) {
      // All stages done → fade backdrop then unmount
      setSuppressBackdrop(true);
      const t = setTimeout(() => setShowSharedBackground(false), 600);
      return () => clearTimeout(t);
    }
  }, [showStreakCelebration, showChallengesCelebration, showShareWorkout]);

  // Reset internal state whenever streak stage opens
  useEffect(() => {
    if (showStreakCelebration) {
      setStreakPhase('animating');
      setStartCircleAnimation(false);
      setContinueButtonVisible(false);
      setContinueButtonEnabled(false);
      setContinueButtonOpacity(0);
      setExitPhase('idle');
      setIconExploding(false);
      setNumberFaded(false);
      setEverythingFaded(false);
    }
  }, [showStreakCelebration]);

  // Main streak entrance animation
  useEffect(() => {
    if (!showStreakCelebration) return;

    const raf = requestAnimationFrame(() => {
      const stage = document.getElementById('streak-anim-stage');
      const numEl = document.getElementById('streak-anim-num');
      const p1    = document.getElementById('streak-anim-p1');
      const p2    = document.getElementById('streak-anim-p2');
      if (!stage || !numEl) return;

      stage.style.transition = 'none';
      stage.style.opacity    = '0';
      stage.style.transform  = 'scale(0.4) translateY(40px)';
      numEl.style.transition = 'none';
      numEl.style.opacity    = '0';
      numEl.style.transform  = 'scale(0.3)';
      numEl.textContent      = String(celebrationStreakNum - 1);
      if (p1) p1.style.display = 'block';
      if (p2) p2.style.display = 'none';

      const t1 = setTimeout(() => {
        stage.style.transition = 'opacity 0.18s ease, transform 0.6s cubic-bezier(0.34,1.6,0.64,1)';
        stage.style.opacity    = '1';
        stage.style.transform  = 'scale(1) translateY(0)';
      }, 600);

      const t2 = setTimeout(() => {
        numEl.style.transition = 'opacity 0.15s ease, transform 0.55s cubic-bezier(0.34,1.8,0.64,1)';
        numEl.style.opacity    = '1';
        numEl.style.transform  = 'scale(1)';
        // After the entrance animation settles, clear the imperative transition
        // so React's numberFaded override (opacity 0 + transition 0.25s ease) can cleanly take over
        setTimeout(() => { numEl.style.transition = ''; }, 700);
      }, 1050);

      const t2b = setTimeout(() => {
        playStreakAnticipationSound();
      }, 1320);

      const t3 = setTimeout(() => {
        if (p1) p1.style.display = 'none';
        if (p2) p2.style.display = 'block';
        numEl.style.transition = 'transform 0.45s cubic-bezier(0.34,1.8,0.64,1)';
        numEl.style.transform  = 'scale(1.25)';
        numEl.textContent      = String(celebrationStreakNum);
        playCircleLevelUp();
        setTimeout(() => { numEl.style.transform = 'scale(1)'; }, 450);
      }, 1450);

      const t4 = setTimeout(() => {
        if (p2) {
          p2.style.transition = 'transform 0.12s ease';
          p2.style.transform  = 'rotate(-6deg) scale(1.05)';
          setTimeout(() => { p2.style.transform = 'rotate(5deg) scale(1.08)';  }, 120);
          setTimeout(() => { p2.style.transform = 'rotate(-3deg) scale(1.04)'; }, 240);
          setTimeout(() => { p2.style.transform = 'rotate(0deg) scale(1)';     }, 360);
        }
      }, 1530);

      const t5 = setTimeout(() => setStreakPhase('final'), 2400);
      const t6 = setTimeout(() => {
        setStreakPhase('circles');
        setStartCircleAnimation(true);
      }, 3500);

      return () => {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t2b); clearTimeout(t3);
        clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
      };
    });

    return () => cancelAnimationFrame(raf);
  }, [showStreakCelebration, celebrationStreakNum]);

  useEffect(() => {
    if (streakPhase === 'circles') {
      const t1 = setTimeout(() => setContinueButtonVisible(true), 400);
      const t2 = setTimeout(() => setContinueButtonOpacity(1),    450);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [streakPhase]);

  const handleCirclesComplete = () => {
    setTimeout(() => setContinueButtonEnabled(true), 300);
  };

  // ── Continue pressed: number fades first, then icon slides alone, then explodes ──
  const handleContinuePress = () => {
    if (exitPhase !== 'idle') return;

    // Unlock the shared AudioContext on this user gesture so all subsequent
    // timed sounds (circles, ding, etc.) play reliably
    unlockAudio();

    // Step 1 — fade number, circles, and button simultaneously
    setExitPhase('fading');
    setEverythingFaded(true);  // circles + button fade out

    // Directly fade the number via JS (it was set imperatively, so React style won't override it)
    const numEl = document.getElementById('streak-anim-num');
    if (numEl) {
      numEl.style.transition = 'opacity 0.25s ease';
      numEl.style.opacity = '0';
    }
    setNumberFaded(true);

    // Step 2 — after fade completes, slide the icon down (alone, number already gone)
    setTimeout(() => {
      setExitPhase('shifting');
      playIconSlideDownSound();
    }, 320);

    // Step 3 — icon expands/explodes; play the new layered unlock sound
    setTimeout(() => {
      setExitPhase('exploding');
      setIconExploding(true);
      playStreakUnlockSound();  // ← replaced with new Duolingo-style ascending aahhhh
    }, 320 + 700 + 500);

    // Step 4 — signal transition to challenges stage
    // The backdrop stays fully opaque throughout — no flash possible
    setTimeout(() => {
      setExitPhase('done');
      document.dispatchEvent(new CustomEvent('streakCelebrationContinue'));
    }, 320 + 700 + 500 + 500);
  };

  const handleShareWorkoutComplete = () => {
    setSuppressBackdrop(true);
    setShowShareWorkout(false);
    setJustLoggedDay(null);
  };

  const BUTTON_BOTTOM = 'calc(env(safe-area-inset-bottom) + 36px)';
  const BUTTON_WIDTH  = 'min(340px, 88vw)';
  const FINAL_Y       = '-65px';
  const CIRCLES_SLOT_HEIGHT = 110;
  const CIRCLES_MARGIN_TOP = 24;

  // ── Icon-only translate during exit (number is already invisible by this point) ──
  const iconShiftY = (exitPhase === 'shifting' || exitPhase === 'exploding' || exitPhase === 'done')
    ? '120px'
    : '0px';

  const expandStyle = iconExploding
    ? { animation: 'streakIconExpand 0.5s ease forwards' }
    : {};

  // The group moves to FINAL_Y when circles appear.
  // During exit the icon continues downward; the number wrapper also moves
  // but is already opacity:0, so only the icon is visible.
  const groupTranslateY = (() => {
    if (exitPhase === 'shifting' || exitPhase === 'exploding' || exitPhase === 'done') {
      return iconShiftY;
    }
    if (streakPhase === 'final' || streakPhase === 'circles') {
      return FINAL_Y;
    }
    return '0px';
  })();

  const groupTransition = (() => {
    if (exitPhase === 'shifting') return 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
    if (exitPhase === 'fading')   return 'none';
    if (streakPhase === 'final')  return 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)';
    return 'none';
  })();

  return (
    <>
      {/* ── Persistent backdrop — stays opaque through ALL stage transitions ── */}
      {showSharedBackground && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: suppressBackdrop ? 'transparent' : 'rgba(0,0,0,0.92)',
            backdropFilter: suppressBackdrop ? 'none' : 'blur(4px)',
            WebkitBackdropFilter: suppressBackdrop ? 'none' : 'blur(4px)',
            transition: 'background 0.45s ease, backdrop-filter 0.45s ease',
            // Pointer events off so taps pass through to stage layers
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── STAGE 1 — Streak number + Day Circles ── */}
      <AnimatePresence>
        {showStreakCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // ← KEY FIX: do NOT fade out on exit — the backdrop keeps the dark overlay.
            // Fading this out would cause a brief flash of the home page underneath.
            exit={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Icon + number group */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              transform: `translateY(${groupTranslateY})`,
              transition: groupTransition,
            }}>
              {/* Streak icon — expands on explosion, but has its own opacity via animation */}
              <div
                id="streak-anim-stage"
                style={{
                  position: 'relative', width: 198, height: 198,
                  opacity: 0, willChange: 'transform, opacity',
                  ...expandStyle,
                }}
              >
                <img id="streak-anim-p1" src={POSE_1_URL} alt="pose 1"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                <img id="streak-anim-p2" src={POSE_2_URL} alt="pose 2"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'none' }} />
              </div>

              {/* Streak number — animated by JS imperative style, fades out with circles/button on exit */}
              <div
                id="streak-anim-num"
                style={{
                  fontSize: 96, fontWeight: 900, color: '#fff',
                  textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                  letterSpacing: '-0.04em', lineHeight: 1,
                  opacity: 0,
                  transform: 'scale(0.3)',
                  pointerEvents: 'none',
                  // When numberFaded flips to true we override with an inline fade-out.
                  // JS animation handles the "fade in + scale up" imperatively before this.
                  ...(numberFaded ? { opacity: 0, transition: 'opacity 0.25s ease' } : {}),
                }}
              >
                {celebrationStreakNum - 1}
              </div>

              {/* Day circles */}
              {(streakPhase === 'final' || streakPhase === 'circles') && (
                <div style={{
                  width: BUTTON_WIDTH,
                  height: CIRCLES_SLOT_HEIGHT,
                  marginTop: CIRCLES_MARGIN_TOP,
                  visibility: streakPhase === 'circles' ? 'visible' : 'hidden',
                  opacity: everythingFaded ? 0 : 1,
                  transition: everythingFaded ? 'opacity 0.25s ease' : 'none',
                }}>
                  <EmbeddedDayCircles
                    currentUser={currentUser}
                    weeklyWorkoutLogs={weeklyWorkoutLogs}
                    todayDow={todayDowAdjusted}
                    startAnimation={startCircleAnimation}
                    onAllVisible={() => {}}
                    onAnimationComplete={handleCirclesComplete}
                  />
                </div>
              )}
            </div>

            {/* Continue button */}
            {continueButtonVisible && (
              <div style={{
                position: 'absolute',
                bottom: BUTTON_BOTTOM,
                width: BUTTON_WIDTH,
                opacity: everythingFaded ? 0 : continueButtonOpacity,
                transform: (everythingFaded || continueButtonOpacity === 0) ? 'translateY(16px)' : 'translateY(0)',
                transition: everythingFaded
                  ? 'opacity 0.25s ease, transform 0.25s ease'
                  : 'opacity 0.9s ease, transform 0.9s ease',
                pointerEvents: everythingFaded ? 'none' : 'auto',
              }}>
                <ContinueButton
                  enabled={continueButtonEnabled && exitPhase === 'idle'}
                  onClick={handleContinuePress}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STAGE 2 — Challenges ── */}
      <AnimatePresence>
        {showChallengesCelebration && celebrationChallenges.length > 0 && (
          <ChallengesStage
            key="challenges-stage"
            celebrationChallenges={celebrationChallenges}
            onChallengesContinue={onChallengesContinue}
            BUTTON_BOTTOM={BUTTON_BOTTOM}
            BUTTON_WIDTH={BUTTON_WIDTH}
          />
        )}
      </AnimatePresence>

      {/* ── STAGE 3 — Share Workout ── */}
      <AnimatePresence>
        {showShareWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          >
            <ShareWorkoutScreen
              workoutName={celebrationWorkoutName}
              exercises={celebrationExercises}
              previousExercises={celebrationPreviousExercises}
              durationMinutes={celebrationDurationMinutes}
              currentUser={currentUser}
              gymId={gymId}
              gymName={gymName}
              onContinue={handleShareWorkoutComplete}
              onShareComplete={handleShareWorkoutComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default React.memo(StreakCelebration);