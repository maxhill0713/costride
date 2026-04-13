import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ShareWorkoutScreen from '../profile/ShareWorkoutScreen';
import UniqueBadge from '../challenges/UniqueBadge';
import { getSwappedRestDay } from '@/lib/weekSwaps';

const POSE_1_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/5688f98be_Pose1_V2.png';
const POSE_2_URL = 'https://media.base44.com/images/public/694b637358644e1c22c8ec6b/8d4e06e17_Pose2_V21.png';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Inject day-circle keyframes ───────────────────────────────────────────────
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
    @keyframes scIconShiftUp {
      from { transform: translateY(0); }
      to   { transform: translateY(-48px); }
    }
    @keyframes scNumShiftUp {
      from { transform: translateY(0) scale(1); }
      to   { transform: translateY(-48px) scale(0.82); }
    }
    @keyframes scParticleBurst {
      0%   { transform: translate(0,0) scale(1); opacity: 1; }
      100% { transform: translate(var(--tx),var(--ty)) scale(0); opacity: 0; }
    }
  `;
  document.head.appendChild(s);
}

// ── Particle burst around today's circle ──────────────────────────────────────
function spawnParticles(originEl) {
  if (!originEl) return;
  const rect = originEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const cols = ['#60a5fa', '#93c5fd', '#3b82f6', '#bfdbfe', '#ffffff', '#2563eb'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    const ang = (i / 18) * 360;
    const d = 45 + Math.random() * 55;
    const tx = Math.cos((ang * Math.PI) / 180) * d;
    const ty = Math.sin((ang * Math.PI) / 180) * d;
    const sz = 4 + Math.random() * 5;
    p.style.cssText = [
      'position:fixed', 'border-radius:50%', 'pointer-events:none', 'z-index:10001',
      `width:${sz}px`, `height:${sz}px`,
      `left:${cx - sz / 2}px`, `top:${cy - sz / 2}px`,
      `background:${cols[i % cols.length]}`,
      `--tx:${tx}px`, `--ty:${ty}px`,
      `animation:scParticleBurst ${0.6 + Math.random() * 0.3}s ease-out forwards`,
      `animation-delay:${Math.random() * 0.04}s`,
    ].join(';');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}

// ── Day-circles row (embedded in streak stage) ────────────────────────────────
function EmbeddedDayCircles({ currentUser, weeklyWorkoutLogs, todayDow, onAnimationComplete }) {
  const [animatedIdx, setAnimatedIdx] = useState(-1);
  const todayRef = useRef(null);
  const hasCompleted = useRef(false);

  const todayDowAdjusted = todayDow || (() => { const d = new Date().getDay(); return d === 0 ? 7 : d; })();
  const trainingDays = (currentUser?.training_days || []).filter(d => d >= 1 && d <= 7);
  const allDays = [1, 2, 3, 4, 5, 6, 7];
  const swappedRestDay = getSwappedRestDay();

  const loggedDays = new Set();
  weeklyWorkoutLogs.forEach(l => {
    const d = new Date(l.completed_date).getDay();
    loggedDays.add(d === 0 ? 7 : d);
  });
  loggedDays.add(todayDowAdjusted);

  const vertOffset = i => Math.round(Math.sin((i / (allDays.length - 1)) * Math.PI * 2) * 9);

  useEffect(() => {
    // Stagger-animate each circle in, then fire complete
    const timers = [];
    allDays.forEach((_, i) => {
      timers.push(setTimeout(() => setAnimatedIdx(i), i * 80));
    });
    // After last circle + pop animation, spawn particles and notify complete
    const lastDelay = (allDays.length - 1) * 80 + 500;
    timers.push(setTimeout(() => {
      spawnParticles(todayRef.current);
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        onAnimationComplete?.();
      }
    }, lastDelay));

    return () => timers.forEach(clearTimeout);
  }, []);

  const getCircleProps = (day, i) => {
    const isToday = day === todayDowAdjusted;
    const done = loggedDays.has(day);
    const isRestDay = trainingDays.length > 0 && !trainingDays.includes(day) && !done && day !== swappedRestDay;
    const isPast = day < todayDowAdjusted;
    const isMissed = !isRestDay && !done && isPast;
    const isPastRest = isRestDay && (isPast || isToday);
    const size = isToday ? 44 : 36;
    const isVisible = i <= animatedIdx;

    const getBg = () => {
      if (isToday) return 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)';
      if (isRestDay) return isPastRest
        ? 'linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)'
        : 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
      if (done) return 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)';
      if (isMissed) return 'linear-gradient(to bottom, #f87171 0%, #ef4444 35%, #b91c1c 100%)';
      return 'linear-gradient(to bottom, #2d3748 0%, #1a202c 50%, #0f172a 100%)';
    };

    const getBorder = () => {
      if (isToday) return '1px solid rgba(147,197,253,0.5)';
      if (isRestDay) return isPastRest ? '1px solid rgba(74,222,128,0.5)' : '1px solid rgba(71,85,105,0.7)';
      if (done) return '1px solid rgba(147,197,253,0.5)';
      if (isMissed) return '1px solid rgba(248,113,113,0.5)';
      return '1px solid rgba(71,85,105,0.7)';
    };

    const getBoxShadow = () => {
      if (isToday) return '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25)';
      if (isRestDay) return isPastRest
        ? '0 3px 0 0 #15803d, 0 5px 12px rgba(0,80,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
        : '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
      if (done) return '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55), inset 0 1px 0 rgba(255,255,255,0.25)';
      if (isMissed) return '0 4px 0 0 #991b1b, inset 0 1px 0 rgba(255,255,255,0.25)';
      return '0 4px 0 0 #111827, 0 6px 14px rgba(15,20,35,0.5), inset 0 1px 0 rgba(255,255,255,0.1)';
    };

    const getAnim = () => {
      if (!isVisible) return 'none';
      if (isToday) return 'scCirclePop 0.9s cubic-bezier(0.34,1.3,0.64,1) forwards';
      if (done || isRestDay || isMissed) return 'scCirclePop 0.55s cubic-bezier(0.34,1.3,0.64,1) forwards';
      return `scWiggle 2.4s ease-in-out ${i * 0.18}s infinite`;
    };

    return { isToday, done, isRestDay, isMissed, isPastRest, size, isVisible, getBg, getBorder, getBoxShadow, getAnim };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: 7,
      height: 80,
      width: '100%',
      overflow: 'visible',
      padding: '10px 0',
      animation: 'scRowSlideUp 0.45s cubic-bezier(0.34,1.15,0.64,1) forwards',
    }}>
      {allDays.map((day, i) => {
        const p = getCircleProps(day, i);
        const { isToday, done, isRestDay, isMissed, isPastRest, size, isVisible, getBg, getBorder, getBoxShadow, getAnim } = p;
        const vOffset = 9 + vertOffset(i) - (isToday ? 3 : 0);
        const iconSize = isToday ? 18 : 14;

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
                position: 'absolute',
                width: size + 12, height: size + 12,
                borderRadius: '50%',
                border: '2.5px solid rgba(148,163,184,0.45)',
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
                background: getBg(),
                border: getBorder(),
                boxShadow: getBoxShadow(),
                animation: getAnim(),
                flexShrink: 0,
                transform: isVisible ? undefined : 'scale(0.3)',
              }}
            >
              {isRestDay ? (
                <svg width={isToday ? 28 : 22} height={isToday ? 28 : 22} viewBox="0 0 100 100" fill="none">
                  <line x1="50" y1="95" x2="50" y2="30" stroke={isPastRest ? '#15803d' : 'rgba(148,163,184,0.3)'} strokeWidth="3" strokeLinecap="round" />
                  <path d="M50 8 C44 20 40 28 42 36 C45 40 55 40 58 36 C60 28 56 20 50 8Z" fill={isPastRest ? '#4ade80' : 'none'} stroke={isPastRest ? '#4ade80' : 'rgba(148,163,184,0.55)'} strokeWidth="1.5" />
                  <path d="M50 30 C42 22 32 18 22 22 C20 28 24 36 32 38 C40 40 48 36 50 30Z" fill={isPastRest ? '#4ade80' : 'none'} stroke={isPastRest ? '#4ade80' : 'rgba(148,163,184,0.55)'} strokeWidth="1.5" />
                  <path d="M50 30 C58 22 68 18 78 22 C80 28 76 36 68 38 C60 40 52 36 50 30Z" fill={isPastRest ? '#4ade80' : 'none'} stroke={isPastRest ? '#4ade80' : 'rgba(148,163,184,0.55)'} strokeWidth="1.5" />
                  <path d="M50 50 C40 42 28 40 16 46 C16 52 22 60 32 60 C42 60 50 54 50 50Z" fill={isPastRest ? '#4ade80' : 'none'} stroke={isPastRest ? '#4ade80' : 'rgba(148,163,184,0.55)'} strokeWidth="1.5" />
                  <path d="M50 50 C60 42 72 40 84 46 C84 52 78 60 68 60 C58 60 50 54 50 50Z" fill={isPastRest ? '#4ade80' : 'none'} stroke={isPastRest ? '#4ade80' : 'rgba(148,163,184,0.55)'} strokeWidth="1.5" />
                </svg>
              ) : done ? (
                isToday ? (
                  <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10.5l4.5 4.5 7.5-9"
                      stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      strokeDasharray="40" strokeDashoffset="40"
                      style={{ animation: 'scTickDraw 0.57s ease 0.12s forwards' }}
                    />
                  </svg>
                ) : (
                  <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
                    <path d="M4 10.5l4.5 4.5 7.5-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              ) : isMissed ? (
                <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="rgba(255,255,255,0.85)" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              ) : (
                <div style={{
                  width: isToday ? 16 : 12, height: isToday ? 16 : 12, borderRadius: '50%',
                  border: '2px solid rgba(100,116,139,0.35)',
                  background: 'transparent',
                }} />
              )}
            </div>

            <span style={{
              position: 'absolute',
              top: size + 5,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 8,
              fontWeight: isToday ? 900 : 700,
              color: isToday ? '#93c5fd'
                : done ? 'rgba(147,197,253,0.7)'
                : isMissed ? 'rgba(248,113,113,0.6)'
                : isRestDay && isPastRest ? 'rgba(74,222,128,0.7)'
                : 'rgba(100,116,139,0.5)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
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

// ── Main component ────────────────────────────────────────────────────────────
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
  // Phase within the streak screen:
  // 'animating' → streak bounces in, number pops
  // 'shifted'   → icon+number shift up, day circles appear below
  // 'circles_done' → continue button becomes pressable
  const [streakPhase, setStreakPhase] = useState('animating');
  const [continueButtonVisible, setContinueButtonVisible] = useState(false);
  const [continueButtonEnabled, setContinueButtonEnabled] = useState(false);

  // For fading out the share workout screen back to home
  const [shareWorkoutExiting, setShareWorkoutExiting] = useState(false);

  useEffect(() => {
    injectDayStyles();
  }, []);

  // Reset phase whenever the streak screen opens
  useEffect(() => {
    if (showStreakCelebration) {
      setStreakPhase('animating');
      setContinueButtonVisible(false);
      setContinueButtonEnabled(false);
    }
  }, [showStreakCelebration]);

  useEffect(() => {
    if (!showStreakCelebration) return;

    const raf = requestAnimationFrame(() => {
      const stage = document.getElementById('streak-anim-stage');
      const numEl = document.getElementById('streak-anim-num');
      const p1 = document.getElementById('streak-anim-p1');
      const p2 = document.getElementById('streak-anim-p2');
      if (!stage || !numEl) return;

      // Reset
      stage.style.transition = 'none';
      stage.style.opacity = '0';
      stage.style.transform = 'scale(0.4) translateY(40px)';
      stage.style.filter = 'none';
      numEl.style.transition = 'none';
      numEl.style.opacity = '0';
      numEl.style.transform = 'scale(0.3)';
      numEl.textContent = String(celebrationStreakNum);
      if (p1) p1.style.display = 'block';
      if (p2) p2.style.display = 'none';

      // Bounce in icon
      const t1 = setTimeout(() => {
        stage.style.transition = 'opacity 0.18s ease, transform 0.55s cubic-bezier(0.34,1.6,0.64,1)';
        stage.style.opacity = '1';
        stage.style.transform = 'scale(1) translateY(0)';
      }, 60);

      // Pop in number — button becomes visible (disabled) at this point
      const t2 = setTimeout(() => {
        numEl.style.transition = 'opacity 0.15s ease, transform 0.5s cubic-bezier(0.34,1.8,0.64,1)';
        numEl.style.opacity = '1';
        numEl.style.transform = 'scale(1)';
        setContinueButtonVisible(true); // button appears but stays disabled
      }, 480);

      // Swap to pose 2
      const t3 = setTimeout(() => {
        if (p1) p1.style.display = 'none';
        if (p2) p2.style.display = 'block';
      }, 880);

      // Wiggle pose 2
      const t4 = setTimeout(() => {
        if (p2) {
          p2.style.transition = 'transform 0.12s ease';
          p2.style.transform = 'rotate(-6deg) scale(1.05)';
          setTimeout(() => { p2.style.transform = 'rotate(5deg) scale(1.08)'; }, 120);
          setTimeout(() => { p2.style.transform = 'rotate(-3deg) scale(1.04)'; }, 240);
          setTimeout(() => { p2.style.transform = 'rotate(0deg) scale(1)'; }, 360);
        }
      }, 960);

      // Shift icon+number up, reveal day circles
      const t5 = setTimeout(() => {
        setStreakPhase('shifted');
      }, 1400);

      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
    });

    return () => cancelAnimationFrame(raf);
  }, [showStreakCelebration, celebrationStreakNum]);

  const handleShareWorkoutContinue = () => {
    setShareWorkoutExiting(true);
    setTimeout(() => {
      setShareWorkoutExiting(false);
      setShowShareWorkout(false);
      setJustLoggedDay(null);
    }, 500);
  };

  return (
    <>
      {/* STAGE 1 — Streak + Day Circles */}
      <AnimatePresence>
        {showStreakCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} // faster fade-in for darker feel
            className="fixed inset-0 z-[100] backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden"
            style={{ background: 'rgba(0,0,0,0.92)' }} // much darker
          >
            {/* Icon + Number wrapper — shifts up when phase === 'shifted' */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              transform: streakPhase === 'shifted' ? 'translateY(-48px)' : 'translateY(0)',
              transition: 'transform 0.55s cubic-bezier(0.34,1.2,0.64,1)',
            }}>
              <div
                id="streak-anim-stage"
                style={{ position: 'relative', width: 180, height: 180, opacity: 0, willChange: 'transform, opacity' }}
              >
                <img id="streak-anim-p1" src={POSE_1_URL} alt="streak pose 1"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
                <img id="streak-anim-p2" src={POSE_2_URL} alt="streak pose 2"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'none' }} />
              </div>

              <div
                id="streak-anim-num"
                style={{
                  fontSize: streakPhase === 'shifted' ? 72 : 96,
                  fontWeight: 900,
                  color: '#fff',
                  textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  opacity: 0,
                  transform: 'scale(0.5)',
                  transition: 'font-size 0.55s cubic-bezier(0.34,1.2,0.64,1)',
                }}
              >
                {celebrationStreakNum - 1}
              </div>

              {/* Day circles — only rendered once shifted */}
              {streakPhase === 'shifted' && (
                <div style={{ width: 'min(340px, 88vw)' }}>
                  <EmbeddedDayCircles
                    currentUser={currentUser}
                    weeklyWorkoutLogs={weeklyWorkoutLogs}
                    todayDow={todayDowAdjusted}
                    onAnimationComplete={() => setContinueButtonEnabled(true)}
                  />
                </div>
              )}
            </div>

            {/* Continue button — appears when number pops, enabled after circles finish */}
            <AnimatePresence>
              {continueButtonVisible && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(env(safe-area-inset-bottom) + 40px)',
                    width: 'min(340px, 88vw)',
                  }}
                >
                  <button
                    disabled={!continueButtonEnabled}
                    onClick={() => {
                      // This is handled by the parent — StreakCelebration doesn't own the timing
                      // We just need to signal the parent via the existing prop flow
                      // Parent's setTimeout already handles the transition after 3500ms,
                      // but now we want the button to drive it instead.
                      // We'll dispatch a custom event the parent can listen to,
                      // OR we accept an onStreakContinue prop. For now use the ref trick:
                      document.dispatchEvent(new CustomEvent('streakCelebrationContinue'));
                    }}
                    style={{
                      width: '100%',
                      padding: '14px 0',
                      borderRadius: 16,
                      background: continueButtonEnabled
                        ? 'linear-gradient(to bottom, #60a5fa, #3b82f6, #1d4ed8)'
                        : 'rgba(40,50,80,0.7)',
                      border: 'none',
                      borderBottom: continueButtonEnabled ? '4px solid #1a3fa8' : '4px solid rgba(0,0,0,0.3)',
                      boxShadow: continueButtonEnabled
                        ? '0 4px 0 0 #1e40af, inset 0 1px 0 rgba(255,255,255,0.2)'
                        : 'none',
                      color: continueButtonEnabled ? '#fff' : 'rgba(255,255,255,0.3)',
                      fontSize: 16,
                      fontWeight: 900,
                      cursor: continueButtonEnabled ? 'pointer' : 'default',
                      letterSpacing: '-0.01em',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'background 0.4s ease, color 0.4s ease, border-bottom 0.4s ease, box-shadow 0.4s ease',
                    }}
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 2 — Challenges */}
      <AnimatePresence>
        {showChallengesCelebration && celebrationChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] backdrop-blur-md flex flex-col items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.92)' }}>

            <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center', width: '100%', maxWidth: '24rem' }} className="space-y-3 mb-4">
              {celebrationChallenges.map((challenge, idx) => {
                const prevPct = Math.min(100, Math.round((challenge.previous_value / challenge.target_value) * 100));
                const newPct = Math.min(100, Math.round((challenge.new_value / challenge.target_value) * 100));
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
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                    }}>
                    <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.08) 50%, transparent 90%)' }} />

                    <div className="relative p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
                          style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                          <img
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/5a4c7be8b_Untitleddesign-7.jpg"
                            alt="Challenge"
                            className="w-full h-full object-cover"
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

            <button
              onClick={onChallengesContinue}
              className="w-full max-w-sm"
              style={{
                padding: '14px 0', borderRadius: 16,
                background: 'linear-gradient(to bottom, #60a5fa, #3b82f6, #1d4ed8)',
                border: 'none',
                borderBottom: '4px solid #1a3fa8',
                boxShadow: '0 4px 0 0 #1e40af, inset 0 1px 0 rgba(255,255,255,0.2)',
                color: '#fff', fontSize: 16, fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Continue
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STAGE 3 — Share Workout */}
      <AnimatePresence>
        {showShareWorkout && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: shareWorkoutExiting ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          >
            <ShareWorkoutScreen
              workoutName={celebrationWorkoutName}
              exercises={celebrationExercises}
              previousExercises={celebrationPreviousExercises}
              durationMinutes={celebrationDurationMinutes}
              currentUser={currentUser}
              onContinue={handleShareWorkoutContinue}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default React.memo(StreakCelebration);