import React, { useEffect, useState, useRef } from 'react';
import { getSwappedRestDay } from '@/lib/weekSwaps';

// ── Audio ────────────────────────────────────────────────────────────────────
function playCircleLevelUp() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, start, dur, gain, type = 'sine') => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start); osc.stop(start + dur + 0.05);
    };
    const now = ctx.currentTime;
    playTone(392,  now,        0.12, 0.22);
    playTone(523,  now + 0.09, 0.12, 0.22);
    playTone(659,  now + 0.18, 0.14, 0.26);
    playTone(784,  now + 0.27, 0.30, 0.30);
    playTone(1047, now + 0.27, 0.22, 0.12);
    playTone(110,  now + 0.27, 0.18, 0.14, 'triangle');
    if (navigator.vibrate) navigator.vibrate([40, 30, 80]);
    setTimeout(() => ctx.close(), 1000);
  } catch (_) {}
}

// ── Particle burst ───────────────────────────────────────────────────────────
function spawnBlueParticles(originEl) {
  if (!originEl) return;
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;
  const cols = ['#60a5fa', '#93c5fd', '#3b82f6', '#bfdbfe', '#ffffff', '#2563eb'];
  for (let i = 0; i < 20; i++) {
    const p   = document.createElement('div');
    const ang = (i / 20) * 360;
    const d   = 55 + Math.random() * 65;
    const tx  = Math.cos((ang * Math.PI) / 180) * d;
    const ty  = Math.sin((ang * Math.PI) / 180) * d;
    const sz  = 5 + Math.random() * 6;
    p.style.cssText = [
      'position:fixed', 'border-radius:50%', 'pointer-events:none', 'z-index:10000',
      `width:${sz}px`, `height:${sz}px`,
      `left:${cx - sz / 2}px`, `top:${cy - sz / 2}px`,
      `background:${cols[i % cols.length]}`,
      `--tx:${tx}px`, `--ty:${ty}px`,
      `animation:wdcParticleBurst ${0.65 + Math.random() * 0.35}s ease-out forwards`,
      `animation-delay:${Math.random() * 0.04}s`,
    ].join(';');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

// ── Inject keyframes once ────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('wdc-styles')) return;
  const s = document.createElement('style');
  s.id = 'wdc-styles';
  s.textContent = `
    @keyframes wdcCardEnter {
      from { opacity: 0; transform: translateY(20px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes wdcParticleBurst {
      0%   { transform: translate(0,0) scale(1); opacity: 1; }
      100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0; }
    }
    @keyframes wdcTickDraw {
      from { stroke-dashoffset: 40; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes wdcCirclePop {
      0%   { transform: scale(0.55); }
      55%  { transform: scale(1.18); }
      72%  { transform: scale(0.93); }
      85%  { transform: scale(1.07); }
      100% { transform: scale(1); }
    }
    @keyframes wdcWiggle {
      0%, 60%, 100% { transform: rotate(0deg); }
      65%           { transform: rotate(-6deg); }
      75%           { transform: rotate(5deg); }
      85%           { transform: rotate(-3deg); }
      92%           { transform: rotate(2deg); }
    }
    @keyframes todayRingPulse {
      0%, 100% { transform: scale(1);    opacity: 0.55; }
      50%       { transform: scale(1.13); opacity: 0.2;  }
    }
  `;
  document.head.appendChild(s);
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ════════════════════════════════════════════════════════════════════════════
export default function WorkoutDaysCelebration({
  currentUser,
  weeklyWorkoutLogs = [],
  todayDow,
  onDismiss,
}) {
  const [animated, setAnimated] = useState(false);
  const [backdropExiting, setBackdropExiting] = useState(false);
  const [circlesExiting, setCirclesExiting] = useState(false);
  const todayRef = useRef(null);

  const BACKDROP_FADE = 1200;
  const CIRCLES_FADE  = 500;

  useEffect(() => {
    injectStyles();
    const t1 = setTimeout(() => {
      setAnimated(true);
      playCircleLevelUp();
      spawnBlueParticles(todayRef.current);
    }, 1230);
    const t2 = setTimeout(() => setBackdropExiting(true), 2130);
    const t3 = setTimeout(() => setCirclesExiting(true), 2130 + BACKDROP_FADE - 100);
    const t4 = setTimeout(() => { onDismiss?.(); }, 2130 + BACKDROP_FADE + CIRCLES_FADE);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const trainingDays = (currentUser?.training_days || []).filter(d => d >= 1 && d <= 7);
  const allDays = [1, 2, 3, 4, 5, 6, 7];

  const todayDowAdjusted = todayDow || (() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  })();

  const loggedDays = new Set();
  weeklyWorkoutLogs.forEach(l => {
    const d = new Date(l.completed_date).getDay();
    loggedDays.add(d === 0 ? 7 : d);
  });
  loggedDays.add(todayDowAdjusted);
  
  const swappedRestDay = getSwappedRestDay();

  const vertOffset = i => Math.round(Math.sin((i / (allDays.length - 1)) * Math.PI * 2) * 11);

  const getCircleProps = (day, i) => {
    const isToday        = day === todayDowAdjusted;
    const done           = loggedDays.has(day);
    const isRestDay      = trainingDays.length > 0 && !trainingDays.includes(day) && !done && day !== swappedRestDay;
    const isPast         = day < todayDowAdjusted;
    const isMissed       = !isRestDay && !done && isPast;
    const isPastRest     = isRestDay && (isPast || isToday);
    const size           = isToday ? 49 : 40;
    const isTodayPending = isToday && !animated;

    const getBg = () => {
      if (isToday) {
        return isTodayPending
          ? 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)'
          : 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)';
      }
      if (isRestDay) return isPastRest
        ? 'linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)'
        : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
      if (done)     return 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)';
      if (isMissed) return 'linear-gradient(to bottom, #f87171 0%, #ef4444 35%, #b91c1c 100%)';
      return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
    };

    const getBorder = () => {
      if (isToday)  return isTodayPending ? '1px solid rgba(71,85,105,0.7)' : '1px solid rgba(147,197,253,0.5)';
      if (isRestDay) return isPastRest ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(71,85,105,0.7)';
      if (done)     return '1px solid rgba(147,197,253,0.5)';
      if (isMissed) return '1px solid rgba(248,113,113,0.5)';
      return '1px solid rgba(71,85,105,0.7)';
    };

    const getBoxShadow = () => {
      if (isToday) return isTodayPending
        ? '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
        : '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25)';
      if (isRestDay) return isPastRest
        ? '0 3px 0 0 #15803d, 0 5px 12px rgba(0,80,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
        : '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
      if (done)     return '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25)';
      if (isMissed) return '0 4px 0 0 #991b1b, inset 0 1px 0 rgba(255,255,255,0.25)';
      return '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
    };

    const getAnim = () => {
      if (isToday && animated) return 'wdcCirclePop 0.9s cubic-bezier(0.34,1.3,0.64,1) forwards';
      if (isToday || isRestDay || done || isMissed) return 'none';
      return `wdcWiggle 2.4s ease-in-out ${i * 0.18}s infinite`;
    };

    return { isToday, done, isRestDay, isMissed, isPastRest, size, isTodayPending, getBg, getBorder, getBoxShadow, getAnim };
  };

  const CircleIcon = ({ isToday, done, isRestDay, isMissed, isPastRest, size, isTodayPending }) => {
    const iconSize = isToday ? 20 : 16;

    if (isToday) {
      if (isTodayPending) return (
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '2px solid rgba(148,163,184,0.6)',
          background: 'rgba(255,255,255,0.05)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
        }} />
      );
      return (
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
          <path
            d="M4 10.5l4.5 4.5 7.5-9"
            stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="40" strokeDashoffset="40"
            style={{ animation: 'wdcTickDraw 0.57s ease 0.12s forwards' }}
          />
        </svg>
      );
    }

    if (done) return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
        <path d="M4 10.5l4.5 4.5 7.5-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );

    if (isRestDay) {
      const col    = isPastRest ? '#4ade80'             : 'rgba(148,163,184,0.55)';
      const stroke = isPastRest ? '#15803d'             : 'rgba(148,163,184,0.3)';
      return (
        <svg width={isToday ? 32 : 26} height={isToday ? 32 : 26} viewBox="0 0 100 100" fill="none">
          <line x1="50" y1="95" x2="50" y2="30" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z"  fill={isPastRest ? col : 'none'} stroke={col} strokeWidth="1.5" />
          <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill={isPastRest ? col : 'none'} stroke={col} strokeWidth="1.5" />
          <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill={isPastRest ? col : 'none'} stroke={col} strokeWidth="1.5" />
          <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill={isPastRest ? col : 'none'} stroke={col} strokeWidth="1.5" />
          <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill={isPastRest ? col : 'none'} stroke={col} strokeWidth="1.5" />
        </svg>
      );
    }

    if (isMissed) return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
        <path d="M5 5l10 10M15 5L5 15" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );

    return (
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        border: '2px solid rgba(100,116,139,0.35)',
        background: 'transparent',
      }} />
    );
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: `rgba(0,0,0,${backdropExiting ? 0 : 0.8})`,
        backdropFilter: backdropExiting ? 'blur(0px)' : 'blur(4px)',
        WebkitBackdropFilter: backdropExiting ? 'blur(0px)' : 'blur(4px)',
        transition: `background ${BACKDROP_FADE}ms ease-in-out, backdrop-filter ${BACKDROP_FADE}ms ease-in-out`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 'calc(env(safe-area-inset-top) + 375px)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          // ── No top/bottom padding so position is purely driven by paddingTop above ──
          padding: '0 24px 0',
          width: 'min(340px, 90vw)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: !circlesExiting ? 'wdcCardEnter 0.55s cubic-bezier(0.34,1.15,0.64,1) forwards' : 'none',
          opacity: circlesExiting ? 0 : 1,
          transition: circlesExiting ? `opacity ${CIRCLES_FADE}ms ease-in` : 'none',
        }}
      >
          {/* Day circles row */}
          <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 8,
            height: 88,
            width: '100%',
            overflow: 'visible',
            padding: '12px 0',
          }}>
            {allDays.map((day, i) => {
              const p = getCircleProps(day, i);
              const { isToday, done, isRestDay, isMissed, isPastRest, size, isTodayPending, getBg, getBorder, getBoxShadow, getAnim } = p;
              const vOffset = 11 + vertOffset(i) - (isToday ? 4 : 0);

              return (
                <div key={day} style={{
                  position: 'relative', width: size, height: size,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: vOffset,
                  overflow: 'visible', zIndex: isToday ? 2 : 1,
                }}>
                  {isToday && (
                    <div style={{
                      position: 'absolute',
                      width: size + 14, height: size + 14,
                      borderRadius: '50%',
                      border: '3px solid rgba(148,163,184,0.45)',
                      background: 'rgba(148,163,184,0.08)',
                      animation: 'todayRingPulse 2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }} />
                  )}

                  <div
                    ref={isToday ? todayRef : null}
                    style={{
                      width: size, height: size, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: getBg(),
                      border: getBorder(),
                      boxShadow: getBoxShadow(),
                      animation: getAnim(),
                      transition: 'background 0.35s ease, border 0.35s ease, box-shadow 0.35s ease',
                      flexShrink: 0,
                    }}
                  >
                    <CircleIcon
                      isToday={isToday} done={done} isRestDay={isRestDay}
                      isMissed={isMissed} isPastRest={isPastRest} size={size}
                      isTodayPending={isTodayPending}
                    />
                  </div>

                  <span style={{
                    position: 'absolute',
                    top: size + 6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 9,
                    fontWeight: isToday ? 900 : 700,
                    color: isToday
                      ? (animated ? '#93c5fd' : 'rgba(148,163,184,0.5)')
                      : done      ? 'rgba(147,197,253,0.7)'
                      : isMissed  ? 'rgba(248,113,113,0.6)'
                      : isRestDay && isPastRest ? 'rgba(74,222,128,0.7)'
                      : 'rgba(100,116,139,0.5)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    opacity: isToday && !animated ? 0.5 : 1,
                    transition: 'color 0.35s ease',
                    pointerEvents: 'none',
                  }}>
                    {DAY_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}