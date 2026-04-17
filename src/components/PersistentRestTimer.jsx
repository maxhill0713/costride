import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from './TimerContext';

const PULSE_CSS = `
  @keyframes timer-bg-pulse {
    0%, 100% { background: linear-gradient(to bottom, #7f1d1d, #991b1b, #450a0a); }
    50%       { background: linear-gradient(to bottom, #1e3a8a, #1d4ed8, #172554); }
  }
  @keyframes timer-bar-bg-pulse {
    0%, 100% { background: linear-gradient(90deg, #7f1d1d 0%, #450a0a 100%); }
    50%       { background: linear-gradient(90deg, #1d4ed8 0%, #172554 100%); }
  }
  @keyframes timer-text-pulse {
    0%, 100% { color: rgba(252,165,165,0.9); }
    50%       { color: rgba(147,197,253,0.9); }
  }
  @keyframes timer-stop-pulse {
    0%, 100% { background: linear-gradient(to bottom, rgba(239,68,68,0.9), rgba(185,28,28,0.9), rgba(153,27,27,0.9)); box-shadow: 0 3px 0 0 #7f1d1d, inset 0 1px 0 rgba(255,255,255,0.15); }
    50%       { background: linear-gradient(to bottom, rgba(96,165,250,0.9), rgba(37,99,235,0.9), rgba(29,78,216,0.9)); box-shadow: 0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15); }
  }
  @keyframes timer-stroke-pulse {
    0%, 100% { stroke: #fca5a5; }
    50%       { stroke: #93c5fd; }
  }
  @keyframes completion-fade-in {
    0%   { opacity: 0; transform: translateY(16px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes completion-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  /* Rest-segment warning pulses red <-> green (not blue) */
  @keyframes rest-seg-bg-pulse {
    0%, 100% { background: linear-gradient(to bottom, #7f1d1d, #991b1b, #450a0a); }
    50%       { background: linear-gradient(to bottom, #14532d, #166534, #052e16); }
  }
  @keyframes rest-seg-text-pulse {
    0%, 100% { color: rgba(252,165,165,0.9); }
    50%       { color: rgba(134,239,172,0.85); }
  }
`;

function injectPulseStyles() {
  if (document.getElementById('timer-pulse-css')) return;
  const s = document.createElement('style');
  s.id = 'timer-pulse-css';
  s.textContent = PULSE_CSS;
  document.head.appendChild(s);
}

const fmt = (secs) =>
  `${Math.floor(Math.max(0, secs) / 60)}:${(Math.max(0, secs) % 60).toString().padStart(2, '0')}`;

function parseTimeDigits(raw) {
  if (!raw) return 0;
  const digits = String(raw).replace(/\D/g, '').slice(0, 4);
  if (!digits) return 0;
  const padded = digits.padStart(3, '0');
  const mins = parseInt(padded.slice(0, padded.length - 2), 10);
  const secs = parseInt(padded.slice(-2), 10);
  return mins * 60 + secs;
}

function buildSegments(cardio) {
  const rounds = parseInt(cardio.rounds, 10) || 1;
  const workSecs = parseTimeDigits(cardio.time);
  const restSecs = rounds > 1 ? parseTimeDigits(cardio.rest) : 0;
  const segments = [];
  for (let i = 0; i < rounds; i++) {
    segments.push({ type: 'work', secs: workSecs, label: cardio.exercise || 'Work' });
    if (i < rounds - 1 && restSecs > 0) {
      segments.push({ type: 'rest', secs: restSecs, label: 'Rest' });
    }
  }
  return segments;
}

function calcCardioDuration(cardio) {
  const rounds = parseInt(cardio.rounds, 10) || 1;
  const workSecs = parseTimeDigits(cardio.time);
  const restSecs = rounds > 1 ? parseTimeDigits(cardio.rest) : 0;
  return rounds * workSecs + Math.max(0, rounds - 1) * restSecs;
}

/* ── Landscape detection hook ── */
function useIsLandscape() {
  const [landscape, setLandscape] = useState(
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );
  useEffect(() => {
    const handler = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);
  return landscape;
}

/* ── Segmented arc ── */
function SegmentedArc({ segments, currentSegIdx, smoothProgress, radius = 90 }) {
  const circumference = 2 * Math.PI * radius;
  const totalSecs = segments.reduce((s, seg) => s + seg.secs, 0);
  if (!totalSecs) return null;
  let cumulative = 0;
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(90deg) scale(-1, 1)', overflow: 'visible' }}
      viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
      {segments.map((seg, i) => {
        const frac = seg.secs / totalSecs;
        const arcLen = circumference * frac;
        const gap = circumference * 0.004;
        const drawLen = Math.max(0, arcLen - gap);
        const color    = seg.type === 'work' ? '#60a5fa' : '#34d399';
        const dimColor = seg.type === 'work' ? 'rgba(96,165,250,0.2)' : 'rgba(52,211,153,0.2)';
        const segDashOffset = -(cumulative);
        cumulative += arcLen;
        const elapsedFrac = i < currentSegIdx ? 1 : i === currentSegIdx ? (1 - smoothProgress) : 0;
        const filledLen = drawLen * elapsedFrac;
        return (
          <g key={i}>
            <circle cx="100" cy="100" r={radius} fill="none"
              stroke={dimColor} strokeWidth="10" strokeLinecap="butt"
              strokeDasharray={`${drawLen} ${circumference - drawLen}`}
              strokeDashoffset={segDashOffset} />
            {filledLen > 0 && (
              <circle cx="100" cy="100" r={radius} fill="none"
                stroke={color} strokeWidth="10"
                strokeLinecap={filledLen >= drawLen - 0.5 ? 'round' : 'butt'}
                strokeDasharray={`${filledLen} ${circumference - filledLen}`}
                strokeDashoffset={segDashOffset}
                style={{ filter: i === currentSegIdx ? `drop-shadow(0 0 5px ${color})` : 'none' }} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Simple arc ── */
function SimpleArc({ smoothProgress, isPulsing, radius = 90 }) {
  const circumference = 2 * Math.PI * radius;
  const filledLen = circumference * (1 - smoothProgress);
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(90deg) scale(-1, 1)', overflow: 'visible' }}
      viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      <circle cx="100" cy="100" r={radius} fill="none" stroke="#60a5fa" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${filledLen} ${circumference - filledLen}`}
        strokeDashoffset={0}
        style={{ animation: isPulsing ? `timer-stroke-pulse 2.2s ease-in-out infinite` : 'none' }} />
    </svg>
  );
}

/* ── 3D press button ── */
function PressBtn({ onClick, children, bg, shadow, style = {} }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ position: 'absolute', inset: 0, background: shadow, transform: 'translateY(3px)', borderRadius: 12 }} />
      <button
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); onClick?.(); }}
        onPointerLeave={() => setPressed(false)}
        style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: 'none', borderRadius: 12, cursor: 'pointer',
          background: bg, color: '#fff', fontWeight: 700, fontSize: 18,
          transform: pressed ? 'translateY(3px)' : 'translateY(0)',
          boxShadow: pressed ? 'none' : `0 3px 0 0 ${shadow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
        }}>
        {children}
      </button>
    </div>
  );
}

/* ── Completion Overlay ── */
function CompletionOverlay({ isCardio, cardioTitle, cardioDurationSecs, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (isCardio) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 10000);
    return () => clearTimeout(timer);
  }, [isCardio]);

  const handleContinue = () => {
    setVisible(false);
    setTimeout(onDismiss, 400);
  };

  const durationMins = Math.floor((cardioDurationSecs || 0) / 60);
  const durationSecs = (cardioDurationSecs || 0) % 60;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(160deg, #0f1a3d 0%, #1a3a8f 40%, #1d4ed8 70%, #1e40af 100%)',
            paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
            paddingTop: 'env(safe-area-inset-top)',
          }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', bottom: '20%', left: '20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.1, 0.64, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, textAlign: 'center', padding: '0 32px', position: 'relative', zIndex: 1 }}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              style={{ fontSize: isCardio ? 26 : 24, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: isCardio ? 16 : 0, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              {isCardio
                ? `Well done, your ${cardioTitle} is finished!!`
                : 'Rest time is up, lock in for your next set'}
            </motion.p>
            {isCardio && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{ fontSize: 16, fontWeight: 600, color: 'rgba(147,197,253,0.9)', letterSpacing: '0.01em', lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
                {durationMins > 0 && durationSecs > 0
                  ? `Your workout lasted ${durationMins} minute${durationMins !== 1 ? 's' : ''} and ${durationSecs} second${durationSecs !== 1 ? 's' : ''}.`
                  : durationMins > 0
                    ? `Your workout lasted ${durationMins} minute${durationMins !== 1 ? 's' : ''}.`
                    : durationSecs > 0
                      ? `Your workout lasted ${durationSecs} second${durationSecs !== 1 ? 's' : ''}.`
                      : null}
              </motion.p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            style={{ position: 'absolute', bottom: 'calc(44px + env(safe-area-inset-bottom))', left: 24, right: 24, zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 16, background: '#1a3fa8', transform: 'translateY(4px)' }} />
              <button
                onClick={handleContinue}
                style={{
                  position: 'relative', zIndex: 1, width: '100%', padding: '17px 24px',
                  borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 40%, #2563eb 100%)',
                  color: '#ffffff', fontWeight: 900, fontSize: 17, letterSpacing: '-0.01em',
                  boxShadow: '0 4px 0 0 #1a3fa8, 0 8px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onPointerDown={e => { e.currentTarget.style.transform = 'translateY(4px)'; e.currentTarget.style.boxShadow = 'none'; }}
                onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 0 0 #1a3fa8, 0 8px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'; }}
                onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 0 0 #1a3fa8, 0 8px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'; }}>
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function PersistentRestTimer({ isActive, restTimer, initialRestTime, onTimerStateChange, onTimerValueChange }) {
  const { openTimerBar, setOpenTimerBar, timerWorkout } = useTimer();
  const todayWorkout = timerWorkout;
  const isLandscape  = useIsLandscape();

  // CHANGED: expanded now starts true when openTimerBar fires (open fullscreen directly)
  const [expanded, setExpanded]             = useState(false);
  const [barVisible, setBarVisible]         = useState(false);
  const [paused, setPaused]                 = useState(false);
  const [cardioMode, setCardioMode]         = useState(false);
  const [cardioSegments, setCardioSegments] = useState([]);
  const [currentSegIdx, setCurrentSegIdx]   = useState(0);
  const [cardioTitle, setCardioTitle]       = useState('');
  const [smoothProgress, setSmoothProgress] = useState(1);
  const [showFinished, setShowFinished]     = useState(false);

  const [showCompletion, setShowCompletion]               = useState(false);
  const [completionIsCardio, setCompletionIsCardio]       = useState(false);
  const [completionCardioTitle, setCompletionCardioTitle] = useState('');
  const [completionCardioDuration, setCompletionCardioDuration] = useState(0);

  const cardioStartTimeRef = useRef(null);
  const cardioDurationRef  = useRef(0);
  const rafRef             = useRef(null);
  const lastTickRef        = useRef(null);
  const finishedAtRef      = useRef(null);

  useEffect(() => { injectPulseStyles(); }, []);

  // CHANGED: openTimerBar now opens fullscreen directly (setExpanded(true)) and shows bar
  useEffect(() => {
    if (openTimerBar) {
      setBarVisible(true);
      setExpanded(true);
      setOpenTimerBar(false);
    }
  }, [openTimerBar]);

  useEffect(() => {
    if (!isActive && !paused) {
      if (!showFinished) finishedAtRef.current = null;
    }
  }, [isActive]);

  const t     = typeof restTimer === 'number' ? restTimer : (restTimer !== '' ? parseInt(restTimer) || 0 : 0);
  const total = initialRestTime || 90;

  // ── Sound helpers ──────────────────────────────────────────────────────────
  const getAudioCtx = () => {
    if (!window._timerAudioCtx) {
      window._timerAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window._timerAudioCtx;
  };

  const playBell = (delay = 0) => {
    try {
      const ctx = getAudioCtx();
      const t0 = ctx.currentTime + delay;
      [1, 2, 3].forEach((harmonic, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880 * harmonic;
        gain.gain.setValueAtTime(0.0, t0);
        gain.gain.linearRampToValueAtTime(0.13 / (i + 1), t0 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.4);
        osc.start(t0);
        osc.stop(t0 + 1.5);
      });
    } catch (e) {}
  };

  const playTripleBell = () => {
    playBell(0);
    playBell(0.55);
    playBell(1.1);
  };

  const playRoundStartBell = () => { playBell(0); };

  const playClap = () => {
    try {
      const ctx = getAudioCtx();
      for (let i = 0; i < 4; i++) {
        const time       = ctx.currentTime + i * 0.22;
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data       = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.3));
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(time);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isActive && !paused && cardioMode) playTripleBell();
  }, [isActive]);

  const prevSegIdxRef = useRef(null);
  const prevTRef      = useRef(null);

  useEffect(() => {
    if (!isActive || !cardioMode) {
      prevTRef.current      = t;
      prevSegIdxRef.current = currentSegIdx;
      return;
    }
    const prevSeg = prevSegIdxRef.current;
    const prev    = prevTRef.current;
    prevTRef.current      = t;
    prevSegIdxRef.current = currentSegIdx;

    if (prevSeg !== null && prevSeg !== currentSegIdx) playRoundStartBell();
    if (prev !== null && prev > 10 && t === 10) playClap();
    if (prev !== null && prev === 1 && t === 0) playBell();
  }, [t, isActive, cardioMode, currentSegIdx]);

  useEffect(() => {
    if (t === 0 && isActive && finishedAtRef.current === null) {
      if (cardioMode && currentSegIdx < cardioSegments.length - 1) {
        const nextIdx = currentSegIdx + 1;
        setCurrentSegIdx(nextIdx);
        onTimerValueChange(cardioSegments[nextIdx].secs);
        onTimerStateChange(false);
        setTimeout(() => onTimerStateChange(true), 50);
        return;
      }

      finishedAtRef.current = Date.now();
      setShowFinished(true);

      let cardioDuration = 0;
      if (cardioMode && cardioStartTimeRef.current) {
        cardioDuration = Math.round((Date.now() - cardioStartTimeRef.current) / 1000);
      }

      setCompletionIsCardio(cardioMode);
      setCompletionCardioTitle(cardioTitle);
      setCompletionCardioDuration(cardioDuration);
      setShowCompletion(true);

      if (!cardioMode) {
        const timeout = setTimeout(() => {
          setShowFinished(false);
          onTimerStateChange(false);
          onTimerValueChange('');
          setCardioMode(false);
          setCurrentSegIdx(0);
          finishedAtRef.current = null;
          cardioStartTimeRef.current = null;
        }, 10000);
        return () => clearTimeout(timeout);
      } else {
        setShowFinished(false);
        onTimerStateChange(false);
        onTimerValueChange('');
        setCurrentSegIdx(0);
        finishedAtRef.current = null;
        cardioStartTimeRef.current = null;
      }
    }
  }, [t, isActive]);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!isActive || t === 0 || paused) {
      const segTotal = cardioMode && cardioSegments[currentSegIdx] ? cardioSegments[currentSegIdx].secs : total;
      setSmoothProgress(segTotal > 0 ? Math.max(0, t / segTotal) : 0);
      return;
    }
    const segTotal = cardioMode && cardioSegments[currentSegIdx] ? cardioSegments[currentSegIdx].secs : total;
    lastTickRef.current = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - lastTickRef.current) / 1000;
      setSmoothProgress(Math.max(0, (t - elapsed) / segTotal));
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [t, isActive, paused, cardioMode, currentSegIdx, cardioSegments, total]);

  const isWarning     = t > 0 && t <= 10 && isActive;
  const isFinished    = t === 0 && isActive;
  const isRestSegment = cardioMode && cardioSegments[currentSegIdx]?.type === 'rest';

  const isRestWarning = isWarning && isRestSegment;
  const isPulsing     = isWarning && !isRestSegment;

  const PULSE_DURATION = '2.2s ease-in-out infinite';

  const staticBarBg = 'linear-gradient(90deg, #1a3470 0%, #172554 100%)';

  const cardioExercises = todayWorkout?.cardio || [];
  const currentSeg      = cardioMode && cardioSegments[currentSegIdx];
  const displayTitle    = cardioMode ? cardioTitle : 'Rest Timer';
  const timerActive     = isActive || paused;

  const staticBg = (() => {
    if (isRestWarning || isPulsing) return undefined;
    if (isRestSegment) return 'linear-gradient(to bottom, #14532d, #166534, #052e16)';
    return 'linear-gradient(to bottom, #1d4ed8, #1e40af, #172554)';
  })();

  const bgAnimation   = isRestWarning ? `rest-seg-bg-pulse ${PULSE_DURATION}` : isPulsing ? `timer-bg-pulse ${PULSE_DURATION}` : 'none';
  const textAnimation = isRestWarning ? `rest-seg-text-pulse ${PULSE_DURATION}` : isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none';

  const staticAccent = isRestSegment ? '#4ade80' : '#60a5fa';
  const staticText   = isRestSegment ? 'rgba(134,239,172,0.85)' : 'rgba(147,197,253,0.75)';

  const roundLabel = (() => {
    if (!cardioMode || !cardioSegments.length) return null;
    if (isFinished) return null;
    if (currentSeg?.type === 'rest') return 'Rest';
    let workCount = 0;
    for (let i = 0; i <= currentSegIdx; i++) {
      if (cardioSegments[i]?.type === 'work') workCount++;
    }
    return `Round ${workCount}`;
  })();

  const handleSelectCardio = (c) => {
    const segs = buildSegments(c);
    setCardioSegments(segs);
    setCurrentSegIdx(0);
    setCardioTitle(c.exercise || 'Cardio');
    setCardioMode(true);
    onTimerValueChange(segs[0]?.secs || 60);
    onTimerStateChange(false);
    setPaused(false);
    cardioDurationRef.current = calcCardioDuration(c);
  };

  const handleCancelCardio = () => {
    setCardioMode(false);
    setCardioSegments([]);
    setCurrentSegIdx(0);
    setCardioTitle('');
    onTimerStateChange(false);
    onTimerValueChange('');
    setPaused(false);
    cardioStartTimeRef.current = null;
  };

  const handleGo = () => {
    const currentVal = typeof restTimer === 'number' ? restTimer : parseInt(restTimer) || 90;
    if (!cardioMode && currentVal !== restTimer) onTimerValueChange(currentVal);
    if (cardioMode && !cardioStartTimeRef.current) cardioStartTimeRef.current = Date.now();
    setPaused(false);
    onTimerStateChange(true);
  };

  // CHANGED: handleCloseAll hides both fullscreen and bar
  const handleCloseAll = () => {
    onTimerStateChange(false);
    onTimerValueChange('');
    setPaused(false);
    setCardioMode(false);
    setCurrentSegIdx(0);
    setShowFinished(false);
    setShowCompletion(false);
    finishedAtRef.current = null;
    cardioStartTimeRef.current = null;
    setBarVisible(false);
    setExpanded(false);
  };

  const handleStop = () => {
    onTimerStateChange(false);
    onTimerValueChange('');
    setPaused(false);
    setCardioMode(false);
    setCurrentSegIdx(0);
    setShowFinished(false);
    setShowCompletion(false);
    finishedAtRef.current = null;
    cardioStartTimeRef.current = null;
    setBarVisible(false);
    setExpanded(false);
  };

  const handlePause = () => {
    if (paused) { setPaused(false); onTimerStateChange(true); }
    else        { setPaused(true);  onTimerStateChange(false); }
  };

  const handleCompletionDismiss = () => {
    setShowCompletion(false);
    setShowFinished(false);
    onTimerStateChange(false);
    onTimerValueChange('');
    setCardioMode(false);
    setCurrentSegIdx(0);
    finishedAtRef.current = null;
    cardioStartTimeRef.current = null;
    setBarVisible(false);
    setExpanded(false);
  };

  if (!barVisible && !isActive && !showFinished && !showCompletion) return null;

  // ── Rest timer controls (time display + −/+ adjusters) used in fullscreen ──
  // CHANGED: moved out of bar into fullscreen, sat between Go button and cardio list
  const RestTimerControls = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
      {/* Minus */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: '#1a3fa8', transform: 'translateY(3px)' }} />
        <button
          onClick={() => onTimerValueChange(Math.max(10, (parseInt(restTimer) || 90) - 10))}
          style={{
            position: 'relative', zIndex: 1,
            width: 44, height: 44, borderRadius: 10,
            border: 'none', cursor: 'pointer',
            fontSize: 22, fontWeight: 700, color: '#fff',
            background: 'linear-gradient(to bottom, #3b82f6, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)',
            transition: 'transform 0.08s, box-shadow 0.08s',
          }}
          onPointerDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
          onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)'; }}
          onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)'; }}>
          −
        </button>
      </div>

      {/* Time display */}
      <span style={{
        fontWeight: 900, fontSize: 32, color: '#e2e8f0',
        minWidth: 72, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        {fmt(parseInt(restTimer) || 90)}
      </span>

      {/* Plus */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: '#1a3fa8', transform: 'translateY(3px)' }} />
        <button
          onClick={() => onTimerValueChange((parseInt(restTimer) || 90) + 10)}
          style={{
            position: 'relative', zIndex: 1,
            width: 44, height: 44, borderRadius: 10,
            border: 'none', cursor: 'pointer',
            fontSize: 22, fontWeight: 700, color: '#fff',
            background: 'linear-gradient(to bottom, #3b82f6, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)',
            transition: 'transform 0.08s, box-shadow 0.08s',
          }}
          onPointerDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
          onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)'; }}
          onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)'; }}>
          +
        </button>
      </div>
    </div>
  );

  // Cardio routines list (reused in both portrait + landscape)
  const CardioRouteList = ({ compact = false }) =>
    cardioExercises.length > 0 && !cardioMode ? (
      <div>
        <p style={{ fontSize: compact ? 11 : 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(147,197,253,0.6)', marginBottom: compact ? 6 : 10, textAlign: compact ? 'center' : 'left' }}>
          {compact ? 'Routines' : 'Workout Routines'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 5 : 7 }}>
          {cardioExercises.map((c, i) => (
            <button key={i} onClick={() => handleSelectCardio(c)}
              style={{ padding: compact ? '7px 11px' : '10px 16px', borderRadius: compact ? 10 : 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: compact ? 12 : 13, fontWeight: 700, textAlign: 'left', background: 'linear-gradient(135deg, rgba(30,35,60,0.8), rgba(8,10,20,0.9))', color: 'rgba(226,232,240,0.85)', boxShadow: '0 3px 0 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', transition: 'all 0.15s ease' }}>
              {c.exercise || 'Cardio'}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <>
      {/* ── Completion Overlay ── */}
      <AnimatePresence>
        {showCompletion && (
          <CompletionOverlay
            isCardio={completionIsCardio}
            cardioTitle={completionCardioTitle}
            cardioDurationSecs={completionCardioDuration}
            onDismiss={handleCompletionDismiss}
          />
        )}
      </AnimatePresence>

      {/* ── Fullscreen timer ── */}
      <AnimatePresence>
        {expanded && !showCompletion && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex',
              flexDirection: isLandscape ? 'row' : 'column',
              alignItems: isLandscape ? 'stretch' : 'center',
              justifyContent: isLandscape ? 'center' : 'flex-start',
              paddingTop: isLandscape ? 0 : '8vh',
              background: staticBg,
              transition: (isRestWarning || isPulsing) ? 'none' : 'background 0.6s ease',
              animation: bgAnimation,
              overflow: 'hidden',
            }}>

            {/* CHANGED: Top-left × — closes everything (fullscreen + bar) */}
            <button
              onClick={handleCloseAll}
              style={{
                position: 'absolute', top: 16, left: 16, zIndex: 10,
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.75)',
                background: 'none',
                border: 'none', borderRadius: 10, cursor: 'pointer',
              }}>
              <X style={{ width: 22, height: 22 }} />
            </button>

            {/* CHANGED: Top-right chevron — collapse to bar only (not close entirely) */}
            <button onClick={() => setExpanded(false)}
              style={{
                position: 'absolute', top: 16, right: 16, zIndex: 10,
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.75)', background: 'none',
                border: 'none', cursor: 'pointer',
              }}>
              <ChevronDown style={{ width: 24, height: 24 }} />
            </button>

            {/* ══ PORTRAIT ═══════════════════════════════════════════════════ */}
            {!isLandscape && (
              <>
                <p style={{ fontSize: cardioMode ? 30 : 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: roundLabel ? 8 : 28, color: staticText, animation: textAnimation }}>
                  {isFinished ? 'Done!' : displayTitle}
                </p>
                {roundLabel && (
                  <p style={{ fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 24, color: 'rgba(255,255,255,0.55)', animation: textAnimation }}>
                    {roundLabel}
                  </p>
                )}
                {/* Circle */}
                <div style={{ position: 'relative', width: 248, height: 248, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                  {cardioMode && cardioSegments.length > 1
                    ? <SegmentedArc segments={cardioSegments} currentSegIdx={currentSegIdx} smoothProgress={smoothProgress} radius={96} />
                    : <SimpleArc smoothProgress={smoothProgress} isPulsing={isPulsing} radius={96} />}
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 68, fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 10, animation: textAnimation }}>
                    {timerActive ? fmt(t) : fmt(typeof restTimer === 'number' ? restTimer : parseInt(restTimer) || 90)}
                  </span>
                </div>

                {/* Buttons — portrait */}
                <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 154 }}>
                  {!timerActive ? (
                    <>
                      <PressBtn onClick={handleGo} bg="linear-gradient(to bottom, #22c55e, #16a34a, #15803d)" shadow="#14532d" style={{ width: '100%', height: 56 }}>
                        Go
                      </PressBtn>
                      {cardioMode && (
                        <PressBtn
                          onClick={handleCancelCardio}
                          bg="linear-gradient(to bottom, #6b7280, #4b5563, #374151)"
                          shadow="#1f2937"
                          style={{ width: '100%', height: 56 }}>
                          Cancel
                        </PressBtn>
                      )}
                    </>
                  ) : (
                    <>
                      <PressBtn onClick={handlePause}
                        bg={paused ? 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)' : 'linear-gradient(to bottom, #f59e0b, #d97706, #b45309)'}
                        shadow={paused ? '#1a3fa8' : '#78350f'}
                        style={{ width: '100%', height: 50 }}>
                        {paused ? 'Resume' : 'Pause'}
                      </PressBtn>
                      <PressBtn onClick={handleStop} bg="linear-gradient(to bottom, rgba(239,68,68,0.9), rgba(185,28,28,0.9), rgba(153,27,27,0.9))" shadow="#7f1d1d" style={{ width: '100%', height: 50 }}>
                        Stop
                      </PressBtn>
                    </>
                  )}
                </div>

                {/* CHANGED: Rest timer time-adjust controls shown between Go button area and cardio list, only when not active and not cardio mode */}
                {!timerActive && !cardioMode && (
                  <RestTimerControls />
                )}

                {/* CHANGED: Cardio routines list below rest timer controls (or below Go if cardio selected) */}
                {!cardioMode && (
                  <div style={{ marginTop: 24, width: '80%', maxWidth: 280 }}>
                    <CardioRouteList />
                  </div>
                )}
              </>
            )}

            {/* ══ LANDSCAPE ══════════════════════════════════════════════════ */}
            {isLandscape && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, position: 'relative' }}>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 8, marginTop: -16 }}>
                  <p style={{ fontSize: cardioMode ? 22 : 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, color: staticText, animation: textAnimation }}>
                    {isFinished ? 'Done!' : displayTitle}
                  </p>
                  {roundLabel && (
                    <p style={{ fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, color: 'rgba(255,255,255,0.55)', animation: textAnimation }}>
                      {roundLabel}
                    </p>
                  )}
                </div>

                {/* Circle */}
                <div style={{ position: 'relative', width: 248, height: 248, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                  {cardioMode && cardioSegments.length > 1
                    ? <SegmentedArc segments={cardioSegments} currentSegIdx={currentSegIdx} smoothProgress={smoothProgress} radius={96} />
                    : <SimpleArc smoothProgress={smoothProgress} isPulsing={isPulsing} radius={96} />}
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 68, fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 10, animation: textAnimation }}>
                    {timerActive ? fmt(t) : fmt(typeof restTimer === 'number' ? restTimer : parseInt(restTimer) || 90)}
                  </span>
                </div>

                {/* CHANGED: Rest controls shown in landscape between circle and bottom-right buttons area when not active */}
                {!timerActive && !cardioMode && (
                  <div style={{ marginTop: 12 }}>
                    <RestTimerControls />
                  </div>
                )}

                {/* Buttons — bottom-right corner */}
                <div style={{
                  position: 'absolute',
                  bottom: 20,
                  right: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 10,
                  width: 148,
                }}>
                  {!timerActive ? (
                    <>
                      <PressBtn onClick={handleGo} bg="linear-gradient(to bottom, #22c55e, #16a34a, #15803d)" shadow="#14532d" style={{ width: '100%', height: 50 }}>
                        Go
                      </PressBtn>
                      {cardioMode ? (
                        <PressBtn
                          onClick={handleCancelCardio}
                          bg="linear-gradient(to bottom, #6b7280, #4b5563, #374151)"
                          shadow="#1f2937"
                          style={{ width: '100%', height: 50 }}>
                          Cancel
                        </PressBtn>
                      ) : (
                        <CardioRouteList compact />
                      )}
                    </>
                  ) : (
                    <>
                      <PressBtn onClick={handlePause}
                        bg={paused ? 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)' : 'linear-gradient(to bottom, #f59e0b, #d97706, #b45309)'}
                        shadow={paused ? '#1a3fa8' : '#78350f'}
                        style={{ width: '100%', height: 46 }}>
                        {paused ? 'Resume' : 'Pause'}
                      </PressBtn>
                      <PressBtn onClick={handleStop} bg="linear-gradient(to bottom, rgba(239,68,68,0.9), rgba(185,28,28,0.9), rgba(153,27,27,0.9))" shadow="#7f1d1d" style={{ width: '100%', height: 46 }}>
                        Stop
                      </PressBtn>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Persistent bar ── */}
      {/* CHANGED: simplified bar — left: ×, centre: "Rest Timer" + countdown, right: ↑ chevron */}
      {!expanded && !showCompletion && (
        <div
          style={{
            position: 'fixed', left: 0, right: 0,
            bottom: 'calc(79px + env(safe-area-inset-bottom))',
            zIndex: 400, padding: '0 14px',
            height: 56,
            display: 'flex', alignItems: 'center',
            background: staticBarBg,
            animation: isPulsing ? `timer-bar-bg-pulse ${PULSE_DURATION}` : 'none',
            borderTop: '1px solid rgba(37,99,235,0.5)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            paddingBottom: 4,
          }}>

          {/* CHANGED: Left side — × closes everything */}
          <button
            onClick={handleCloseAll}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
              width: 36, height: 36,
            }}>
            <X style={{ width: 18, height: 18 }} />
          </button>

          {/* CHANGED: Centre — title + live countdown (tapping expands to fullscreen) */}
          <button
            onClick={() => setExpanded(true)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: isFinished ? 'default' : 'pointer',
              gap: 1,
            }}>
            <span style={{
              fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: staticText,
              animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
              lineHeight: 1,
            }}>
              {isFinished ? 'Done!' : displayTitle}
            </span>
            <span style={{
              fontWeight: 900, fontSize: 22, fontVariantNumeric: 'tabular-nums',
              color: isActive ? staticAccent : '#e2e8f0',
              lineHeight: 1,
              animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
            }}>
              {isActive ? fmt(t) : fmt(parseInt(restTimer) || 90)}
            </span>
          </button>

          {/* CHANGED: Right side — ↑ chevron expands to fullscreen */}
          <button
            onClick={() => setExpanded(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)',
              width: 36, height: 36,
            }}>
            <ChevronUp style={{ width: 20, height: 20 }} />
          </button>
        </div>
      )}
    </>
  );
}