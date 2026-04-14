import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ShareWorkoutScreen from '../profile/ShareWorkoutScreen';
import UniqueBadge from '../challenges/UniqueBadge';
import { getSwappedRestDay } from '@/lib/weekSwaps';

const POSE_1_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const POSE_2_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/8d4e06e17_Pose2_V21.png';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Audio ─────────────────────────────────────────────────────────────────────

function playCircleLevelUp() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
    setTimeout(() => ctx.close(), 1000);
  } catch (_) {}
}

function playDayCircleDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
    setTimeout(() => ctx.close(), 800);
  } catch (_) {}
}

function playCircleTick(seqIndex) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const freq = 520 + seqIndex * 38;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.06);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.13, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now); osc.stop(now + 0.15);
    setTimeout(() => ctx.close(), 300);
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
  `;
  document.head.appendChild(s);
}

// ── Shared 3D button ──────────────────────────────────────────────────────────
// variant: 'blue' | 'green' | 'orange' | 'subtle'
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
        transform: 'translateY(4px)',
        transition: 'background 0.8s ease',
      }} />
      <button
        disabled={!enabled}
        onMouseDown={() => enabled && setPressed(true)}
        onMouseUp={() => { setPressed(false); if (enabled) onClick?.(); }}
        onMouseLeave={() => setPressed(false)}
        onTouchStart={() => enabled && setPressed(true)}
        onTouchEnd={() => { setPressed(false); if (enabled) onClick?.(); }}
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

// Alias kept for streak stage — always blue
function ContinueButton(props) {
  return <StyledButton {...props} label="Continue" variant="blue" />;
}

// ── EmbeddedDayCircles ────────────────────────────────────────────────────────
function EmbeddedDayCircles({ currentUser, weeklyWorkoutLogs, todayDow, startAnimation, onAllVisible, onAnimationComplete }) {
  const [animatedIdx, setAnimatedIdx]           = useState(-1);
  const [animatedColorIdx, setAnimatedColorIdx] = useState(-1);
  const [todayColoured, setTodayColoured]       = useState(false);
  const [colourPopIdx, setColourPopIdx]         = useState(-1);
  const [todayColourPop, setTodayColourPop]     = useState(false);
  const [wiggleActive, setWiggleActive]         = useState(false);
  const todayRef     = useRef(null);
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
      playDayCircleDing();
      setTimeout(() => setTodayColourPop(false), 600);
    }, todayColourAt));

    const nonTodayStartAt = todayColourAt + 400;
    const nonTodayDays = allDays
      .map((day, i) => ({ day, i }))
      .filter(({ day }) => day !== todayDowAdjusted);

    nonTodayDays.forEach(({ i }, seq) => {
      timers.push(setTimeout(() => {
        setAnimatedColorIdx(i);
        setColourPopIdx(i);
        playCircleTick(seq);
      }, nonTodayStartAt + seq * 220));
    });

    const lastAt = nonTodayStartAt + (nonTodayDays.length - 1) * 220 + 380;
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
    const isMissed   = !isRestDay && !doneBase && isPast;
    const isPastRest = isRestDay && isPast;
    const size       = isToday ? 49 : 40;
    const isVisible  = i <= animatedIdx;
    const isColoured = isToday ? todayColoured : i <= animatedColorIdx;
    const isPopping  = isToday ? todayColourPop : (i === colourPopIdx);

    const getBg = () => {
      if (isToday)   return isColoured ? 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)' : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
      if (isRestDay) return (isPastRest && isColoured) ? 'linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)' : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
      if (done)      return isColoured ? 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)' : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
      if (isMissed)  return isColoured ? 'linear-gradient(to bottom, #f87171 0%, #ef4444 35%, #b91c1c 100%)' : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
      return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
    };
    const getBorder = () => {
      if (isToday)   return isColoured ? '1px solid rgba(147,197,253,0.5)' : '1px solid rgba(71,85,105,0.7)';
      if (isRestDay) return (isPastRest && isColoured) ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(71,85,105,0.7)';
      if (done)      return isColoured ? '1px solid rgba(147,197,253,0.5)' : '1px solid rgba(71,85,105,0.7)';
      if (isMissed)  return isColoured ? '1px solid rgba(248,113,113,0.5)' : '1px solid rgba(71,85,105,0.7)';
      return '1px solid rgba(71,85,105,0.7)';
    };
    const getBoxShadow = () => {
      if (isToday)   return isColoured ? '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25)' : '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
      if (isRestDay) return (isPastRest && isColoured) ? '0 3px 0 0 #15803d, 0 5px 12px rgba(0,80,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' : '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
      if (done)      return isColoured ? '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25)' : '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
      if (isMissed)  return isColoured ? '0 4px 0 0 #991b1b, inset 0 1px 0 rgba(255,255,255,0.25)' : '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
      return '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
    };
    const getAnim = () => {
      if (!isVisible) return 'none';
      if (isPopping)  return 'scCircleColourPop 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards';
      if (isColoured) return 'none';
      if (wiggleActive) return `scWiggle 2.4s ease-in-out ${i * 0.09}s infinite`;
      if (isToday)    return 'scCirclePop 0.9s cubic-bezier(0.34,1.3,0.64,1) forwards';
      if (done || isRestDay || isMissed) return 'scCirclePop 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards';
      return 'none';
    };

    return { isToday, done, isRestDay, isMissed, isPastRest, size, isVisible, isColoured, isPopping, getBg, getBorder, getBoxShadow, getAnim };
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
        const { isToday, done, isRestDay, isMissed, isPastRest, size, isVisible, isColoured, getBg, getBorder, getBoxShadow, getAnim } = p;
        const vOffset  = 9 + vertOffset(i) - (isToday ? 4 : 0);
        const iconSize = isToday ? 20 : 16;

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
              ref={isToday ? todayRef : null}
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
                  <svg width={isToday ? 32 : 26} height={isToday ? 32 : 26} viewBox="0 0 100 100" fill="none">
                    <line x1="50" y1="95" x2="50" y2="30" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                    <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                    <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                    <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                    <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                    <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                  </svg>
                ) : (
                  <svg width={isToday ? 32 : 26} height={isToday ? 32 : 26} viewBox="0 0 100 100" fill="none">
                    <line x1="50" y1="95" x2="50" y2="30" stroke="rgba(148,163,184,0.3)" strokeWidth="3" strokeLinecap="round" />
                    <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                    <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                    <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                    <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                    <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill="none" stroke="rgba(148,163,184,0.55)" strokeWidth="1.5" />
                  </svg>
                )
              ) : done ? (
                isColoured ? (
                  <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10.5l4.5 4.5 7.5-9"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="40" strokeDashoffset="40"
                      style={{ animation: 'scTickDraw 0.45s ease 0s forwards' }}
                    />
                  </svg>
                ) : (
                  <div style={{ width: iconSize, height: iconSize }} />
                )
              ) : isMissed ? (
                isColoured ? (
                  <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
                    <path d="M5 5l10 10M15 5L5 15" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <div style={{ width: iconSize, height: iconSize }} />
                )
              ) : (
                <div style={{
                  width: isToday ? 18 : 14, height: isToday ? 18 : 14, borderRadius: '50%',
                  border: isToday ? '2px solid rgba(148,163,184,0.6)' : '2px solid rgba(100,116,139,0.35)',
                  background: isToday ? 'rgba(255,255,255,0.05)' : 'transparent',
                }} />
              )}
            </div>

            <span style={{
              position: 'absolute', top: size + 5, left: '50%',
              transform: 'translateX(-50%)', fontSize: 8,
              fontWeight: isToday ? 900 : 700,
              color: isToday ? '#93c5fd'
                : done     ? 'rgba(147,197,253,0.7)'
                : isMissed ? 'rgba(248,113,113,0.6)'
                : isRestDay && isPastRest ? 'rgba(74,222,128,0.7)'
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
// Button appears much sooner (visible quickly) but only becomes pressable at the same time as before.
function ChallengesStage({ celebrationChallenges, onChallengesContinue, BUTTON_BOTTOM, BUTTON_WIDTH }) {
  const [continueEnabled, setContinueEnabled] = useState(false);
  const [continueOpacity, setContinueOpacity] = useState(0);

  useEffect(() => {
    const lastIdx   = celebrationChallenges.length - 1;
    const barDoneMs = (0.4 + lastIdx * 0.1 + 1.2) * 1000;

    // Button fades in very early — after the first card appears (~350ms)
    const t1 = setTimeout(() => setContinueOpacity(1), 350);
    // Button becomes pressable when the last bar finishes filling
    const t2 = setTimeout(() => setContinueEnabled(true), barDoneMs + 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [celebrationChallenges.length]);

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
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + idx * 0.1, duration: 0.3 }}
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
                      transition={{ delay: 0.4 + idx * 0.1, duration: 1.2, ease: 'easeOut' }}
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
          enabled={continueEnabled}
          opacity={continueOpacity}
          onClick={onChallengesContinue}
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
  // Shared fade-out overlay for the final exit back to home
  const [exitFading, setExitFading]                       = useState(false);
  const [showSharedBackground, setShowSharedBackground]   = useState(false);

  useEffect(() => { injectDayStyles(); }, []);

  useEffect(() => {
    if (showStreakCelebration || showChallengesCelebration || showShareWorkout) {
      setShowSharedBackground(true);
    } else {
      const t = setTimeout(() => setShowSharedBackground(false), 600);
      return () => clearTimeout(t);
    }
  }, [showStreakCelebration, showChallengesCelebration, showShareWorkout]);

  useEffect(() => {
    if (showStreakCelebration) {
      setStreakPhase('animating');
      setStartCircleAnimation(false);
      setContinueButtonVisible(false);
      setContinueButtonEnabled(false);
      setContinueButtonOpacity(0);
    }
  }, [showStreakCelebration]);

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
      }, 1050);

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
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
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

  // ── Gentle fade-out helper ────────────────────────────────────────────────
  // Triggers the shared-background fade then clears the share screen state.
  const handleShareWorkoutComplete = () => {
    setExitFading(true);
    // Give the backdrop a head-start before unmounting everything
    setTimeout(() => {
      setExitFading(false);
      setShowShareWorkout(false);
      setJustLoggedDay(null);
    }, 480);
  };

  const BUTTON_BOTTOM = 'calc(env(safe-area-inset-bottom) + 36px)';
  const BUTTON_WIDTH  = 'min(340px, 88vw)';
  const FINAL_Y       = '-80px';
  const CIRCLES_SLOT_HEIGHT = 110;

  return (
    <>
      {/* Persistent backdrop — fades out gently on exit */}
      {showSharedBackground && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: exitFading ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: exitFading ? 0.48 : 0.45, ease: 'easeOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* STAGE 1 — Streak number + Day Circles */}
      <AnimatePresence>
        {showStreakCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          >
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              transform: (streakPhase === 'final' || streakPhase === 'circles')
                ? `translateY(${FINAL_Y})`
                : 'translateY(0px)',
              transition: streakPhase === 'final'
                ? 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none',
            }}>
              <div id="streak-anim-stage"
                style={{ position: 'relative', width: 180, height: 180, opacity: 0, willChange: 'transform, opacity' }}>
                <img id="streak-anim-p1" src={POSE_1_URL} alt="pose 1"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                <img id="streak-anim-p2" src={POSE_2_URL} alt="pose 2"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'none' }} />
              </div>

              <div id="streak-anim-num" style={{
                fontSize: 96, fontWeight: 900, color: '#fff',
                textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                letterSpacing: '-0.04em', lineHeight: 1,
                opacity: 0, transform: 'scale(0.5)',
              }}>
                {celebrationStreakNum - 1}
              </div>

              {(streakPhase === 'final' || streakPhase === 'circles') && (
                <div style={{
                  width: BUTTON_WIDTH,
                  height: CIRCLES_SLOT_HEIGHT,
                  visibility: streakPhase === 'circles' ? 'visible' : 'hidden',
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

            {continueButtonVisible && (
              <div style={{
                position: 'absolute',
                bottom: BUTTON_BOTTOM,
                width: BUTTON_WIDTH,
                opacity: continueButtonOpacity,
                transform: continueButtonOpacity === 1 ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.9s ease, transform 0.9s ease',
              }}>
                <ContinueButton
                  enabled={continueButtonEnabled}
                  onClick={() => document.dispatchEvent(new CustomEvent('streakCelebrationContinue'))}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 2 — Challenges */}
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

      {/* STAGE 3 — Share Workout */}
      <AnimatePresence>
        {showShareWorkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: exitFading ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: exitFading ? 0.48 : 0.4, ease: 'easeOut' }}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          >
            <ShareWorkoutScreen
              workoutName={celebrationWorkoutName}
              exercises={celebrationExercises}
              previousExercises={celebrationPreviousExercises}
              durationMinutes={celebrationDurationMinutes}
              currentUser={currentUser}
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