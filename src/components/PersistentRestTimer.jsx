import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from './TimerContext';

const PULSE_CSS = `
  @keyframes timer-bg-pulse {
    0%, 100% { background: linear-gradient(to bottom, #7f1d1d, #991b1b, #450a0a); }
    50%       { background: linear-gradient(to bottom, #1d4ed8, #1e40af, #172554); }
  }
  @keyframes timer-bar-bg-pulse {
    0%, 100% { background: linear-gradient(90deg, #7f1d1d 0%, #450a0a 100%); }
    50%       { background: linear-gradient(90deg, #1d4ed8 0%, #172554 100%); }
  }
  @keyframes timer-text-pulse {
    0%, 100% { color: rgba(252,165,165,0.9); }
    50%       { color: rgba(147,197,253,0.75); }
  }
  @keyframes timer-stop-pulse {
    0%, 100% { background: linear-gradient(to bottom, rgba(239,68,68,0.9), rgba(185,28,28,0.9), rgba(153,27,27,0.9)); box-shadow: 0 3px 0 0 #7f1d1d, inset 0 1px 0 rgba(255,255,255,0.15); }
    50%       { background: linear-gradient(to bottom, rgba(96,165,250,0.9), rgba(59,130,246,0.9), rgba(37,99,235,0.9)); box-shadow: 0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15); }
  }
  @keyframes timer-stroke-pulse {
    0%, 100% { stroke: #fca5a5; }
    50%       { stroke: #60a5fa; }
  }
`;
function injectPulseStyles() {
  if (document.getElementById('timer-pulse-css')) return;
  const s = document.createElement('style');
  s.id = 'timer-pulse-css';
  s.textContent = PULSE_CSS;
  document.head.appendChild(s);
}

const fmt = (secs) => `${Math.floor(Math.max(0,secs) / 60)}:${(Math.max(0,secs) % 60).toString().padStart(2, '0')}`;

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

/* ── Segmented arc ── */
function SegmentedArc({ segments, currentSegIdx, smoothProgress, radius = 90 }) {
  const circumference = 2 * Math.PI * radius;
  const totalSecs = segments.reduce((s, seg) => s + seg.secs, 0);
  if (!totalSecs) return null;

  // SVG transform: rotate(90deg) puts 0° at top, scale(-1,1) makes it go anticlockwise
  const svgTransform = 'rotate(90deg) scale(-1, 1)';

  let cumulative = 0;
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: svgTransform }} viewBox="0 0 200 200">
      {/* Track */}
      <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />

      {segments.map((seg, i) => {
        const frac = seg.secs / totalSecs;
        const arcLen = circumference * frac;
        const gap = circumference * 0.004;
        const drawLen = Math.max(0, arcLen - gap);
        const workColor  = '#60a5fa';
        const restColor  = '#34d399';
        const color    = seg.type === 'work' ? workColor  : restColor;
        const dimColor = seg.type === 'work' ? 'rgba(96,165,250,0.2)' : 'rgba(52,211,153,0.2)';

        // dashOffset positions each segment around the circle
        const segDashOffset = -(cumulative);
        cumulative += arcLen;

        // Elapsed fraction within this segment (0 = none filled, 1 = fully filled)
        const elapsedFrac = i < currentSegIdx ? 1 : i === currentSegIdx ? (1 - smoothProgress) : 0;
        const filledLen = drawLen * elapsedFrac;

        return (
          <g key={i}>
            {/* Dim background track for this segment */}
            <circle cx="100" cy="100" r={radius} fill="none"
              stroke={dimColor} strokeWidth="10" strokeLinecap="butt"
              strokeDasharray={`${drawLen} ${circumference - drawLen}`}
              strokeDashoffset={segDashOffset} />
            {/* Filled portion — grows from 0 */}
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

/* ── Simple arc — starts empty at top, fills anticlockwise as time passes ── */
function SimpleArc({ smoothProgress, isPulsing, radius = 90 }) {
  const circumference = 2 * Math.PI * radius;
  // smoothProgress goes 1→0 as time counts down
  // filled = elapsed = 1 - smoothProgress
  const filledLen = circumference * (1 - smoothProgress);
  return (
    <svg
      // rotate(90deg) puts start point at top; scale(-1,1) makes it go anticlockwise
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(90deg) scale(-1, 1)' }}
      viewBox="0 0 200 200">
      {/* Track */}
      <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      {/* Filled arc — grows from 0 as time elapses */}
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
      <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: shadow, transform: 'translateY(3px)', borderRadius: 12 }} />
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

export default function PersistentRestTimer({ isActive, restTimer, initialRestTime, onTimerStateChange, onTimerValueChange }) {
  const { openTimerBar, setOpenTimerBar, timerWorkout } = useTimer();
  const todayWorkout = timerWorkout;

  const [expanded, setExpanded]       = useState(false);
  const [barVisible, setBarVisible]   = useState(false);
  const [paused, setPaused]           = useState(false);
  const [cardioMode, setCardioMode]   = useState(false);
  const [cardioSegments, setCardioSegments] = useState([]);
  const [currentSegIdx, setCurrentSegIdx]   = useState(0);
  const [cardioTitle, setCardioTitle] = useState('');
  const [smoothProgress, setSmoothProgress] = useState(1);
  const [showFinished, setShowFinished]     = useState(false);

  const rafRef        = useRef(null);
  const lastTickRef   = useRef(null);
  const finishedAtRef = useRef(null);

  useEffect(() => { injectPulseStyles(); }, []);

  // Open bar when context signals; if already visible, close it (toggle)
  useEffect(() => {
    if (openTimerBar) {
      setBarVisible(v => !v);
      setOpenTimerBar(false);
    }
  }, [openTimerBar]);

  // When isActive turns false externally (not from Stop), don't close bar
  useEffect(() => {
    if (!isActive && !paused) {
      if (!showFinished) finishedAtRef.current = null;
    }
  }, [isActive]);

  const t     = typeof restTimer === 'number' ? restTimer : (restTimer !== '' ? parseInt(restTimer) || 0 : 0);
  const total = initialRestTime || 90;

  // Detect segment finish / overall finish
  useEffect(() => {
    if (t === 0 && isActive && finishedAtRef.current === null) {
      if (cardioMode && currentSegIdx < cardioSegments.length - 1) {
        const nextIdx = currentSegIdx + 1;
        setCurrentSegIdx(nextIdx);
        onTimerValueChange(cardioSegments[nextIdx].secs);
        // Keep timer running — restart it after value is set
        onTimerStateChange(false);
        setTimeout(() => onTimerStateChange(true), 50);
        return;
      }
      finishedAtRef.current = Date.now();
      setShowFinished(true);
      const timeout = setTimeout(() => {
        setShowFinished(false);
        onTimerStateChange(false);
        onTimerValueChange('');
        setCardioMode(false);
        setCurrentSegIdx(0);
        finishedAtRef.current = null;
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [t, isActive]);

  // Smooth arc via RAF
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

  const isWarning  = t > 0 && t <= 10 && isActive;
  const isFinished = t === 0 && isActive;
  const isPulsing  = isWarning || isFinished;
  const PULSE_DURATION = '2.2s ease-in-out infinite';

  const staticBarBg = 'linear-gradient(90deg, #1d4ed8 0%, #172554 100%)';

  // ── Sound helpers (Web Audio API — no external deps) ─────────────────────
  const playBell = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Bell: sine + harmonics with exponential decay
      [1, 2, 3, 4].forEach((harmonic, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 880 * harmonic;
        gain.gain.setValueAtTime(0.35 / (i + 1), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2.5);
      });
      // Add a brief metallic transient
      const noise = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.type = 'square';
      noise.frequency.value = 1200;
      noiseGain.gain.setValueAtTime(0.15, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 0.08);
    } catch (e) { /* audio not available */ }
  };

  const playClap = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Rhythmic clapping: 4 claps spaced ~0.22s apart
      for (let i = 0; i < 4; i++) {
        const time = ctx.currentTime + i * 0.22;
        const bufferSize = ctx.sampleRate * 0.05;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
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
    } catch (e) { /* audio not available */ }
  };

  // ── Fire bell on Go ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive && !paused) playBell();
  }, [isActive]);

  // ── Fire claps at 10s warning, bell when segment ends ─────────────────────
  const prevTRef = useRef(null);
  useEffect(() => {
    if (!isActive || !cardioMode) { prevTRef.current = t; return; }
    const prev = prevTRef.current;
    prevTRef.current = t;
    // Claps: crossing from 11→10
    if (prev !== null && prev > 10 && t === 10) playClap();
    // Bell: crossing from 1→0 (segment end handled by advance effect)
    if (prev !== null && prev === 1 && t === 0) playBell();
  }, [t, isActive, cardioMode]);

  const cardioExercises = todayWorkout?.cardio || [];
  const currentSeg = cardioMode && cardioSegments[currentSegIdx];
  const displayTitle = cardioMode ? cardioTitle : 'Timer';

  const isRestSegment = cardioMode && currentSeg?.type === 'rest';
  const staticBg     = isRestSegment
    ? 'linear-gradient(to bottom, #14532d, #166534, #052e16)'
    : 'linear-gradient(to bottom, #1d4ed8, #1e40af, #172554)';
  const staticAccent = isRestSegment ? '#4ade80' : '#60a5fa';
  const staticText   = isRestSegment ? 'rgba(134,239,172,0.85)' : 'rgba(147,197,253,0.75)';

  // Compute round label — count how many work segments have started up to currentSegIdx
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
  };

  const handleGo = () => {
    // Ensure restTimer is a clean integer — fixes the default 90s skipping to 0
    const currentVal = typeof restTimer === 'number' ? restTimer : parseInt(restTimer) || 90;
    if (!cardioMode && currentVal !== restTimer) {
      onTimerValueChange(currentVal);
    }
    setPaused(false);
    onTimerStateChange(true);
  };

  const handleStop = () => {
    onTimerStateChange(false);
    onTimerValueChange('');
    setPaused(false);
    setCardioMode(false);
    setCurrentSegIdx(0);
    setShowFinished(false);
    finishedAtRef.current = null;
    setBarVisible(false);
    setExpanded(false);
  };

  const handlePause = () => {
    if (paused) {
      setPaused(false);
      onTimerStateChange(true);
    } else {
      setPaused(true);
      onTimerStateChange(false);
    }
    // Do NOT close fullscreen on pause
  };

  if (!barVisible && !isActive && !showFinished) return null;

  return (
    <>
      {/* ── Fullscreen ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'flex-start', paddingTop: '8vh',
              background: staticBg,
              transition: 'background 0.6s ease',
              animation: isPulsing ? `timer-bg-pulse ${PULSE_DURATION}` : 'none',
            }}>

            {/* Collapse */}
            <button onClick={() => setExpanded(false)}
              style={{ position: 'absolute', top: 48, right: 24, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
              <ChevronDown style={{ width: 24, height: 24 }} />
            </button>

            {/* Title */}
            <p style={{ fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: roundLabel ? 6 : 24, color: staticText, animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none' }}>
              {isFinished ? 'Done!' : displayTitle}
            </p>

            {/* Round label */}
            {roundLabel && (
              <p style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 18, color: 'rgba(255,255,255,0.45)', animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none' }}>
                {roundLabel}
              </p>
            )}

            {/* Circle */}
            <div style={{ position: 'relative', width: 224, height: 224, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cardioMode && cardioSegments.length > 1
                ? <SegmentedArc segments={cardioSegments} currentSegIdx={currentSegIdx} smoothProgress={smoothProgress} />
                : <SimpleArc smoothProgress={smoothProgress} isPulsing={isPulsing} />
              }
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 60, fontVariantNumeric: 'tabular-nums', position: 'relative', zIndex: 10, animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none' }}>
                {isActive || paused ? fmt(t) : fmt(typeof restTimer === 'number' ? restTimer : parseInt(restTimer) || 90)}
              </span>
            </div>

            {/* Buttons */}
            <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 154 }}>
              {!isActive && !paused ? (
                <PressBtn onClick={handleGo} bg="linear-gradient(to bottom, #22c55e, #16a34a, #15803d)" shadow="#14532d" style={{ width: '100%', height: 56 }}>
                  Go
                </PressBtn>
              ) : (
                <>
                  <PressBtn
                    onClick={handlePause}
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

            {/* Cardio routines */}
            {cardioExercises.length > 0 && (
              <div style={{ position: 'absolute', bottom: 44, left: 24, maxWidth: '44%' }}>
                <p style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(147,197,253,0.6)', marginBottom: 10 }}>
                  Workout Routines
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {cardioExercises.map((c, i) => {
                    const isSelected = cardioMode && cardioTitle === (c.exercise || 'Cardio');
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectCardio(c)}
                        style={{
                          padding: '10px 16px', borderRadius: 14,
                          border: isSelected ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer', fontSize: 13, fontWeight: 700, textAlign: 'left',
                          background: isSelected
                            ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(29,78,216,0.2))'
                            : 'linear-gradient(135deg, rgba(30,35,60,0.8), rgba(8,10,20,0.9))',
                          color: isSelected ? '#93c5fd' : 'rgba(226,232,240,0.85)',
                          boxShadow: isSelected
                            ? '0 3px 0 0 rgba(29,78,216,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
                            : '0 3px 0 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
                          backdropFilter: 'blur(12px)',
                          transition: 'all 0.15s ease',
                        }}>
                        {c.exercise || 'Cardio'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Persistent bar ── */}
      {!expanded && (
        <div
          onClick={() => { if (!isFinished) setExpanded(true); }}
          style={{
            position: 'fixed', left: 0, right: 0,
            bottom: 'calc(79px + env(safe-area-inset-bottom))',
            zIndex: 400, padding: '0 14px',
            height: 62, // fixed — never changes
            display: 'flex', alignItems: 'center',
            background: staticBarBg,
            animation: isPulsing ? `timer-bar-bg-pulse ${PULSE_DURATION}` : 'none',
            borderTop: `1px solid ${isPulsing ? 'rgba(239,68,68,0.5)' : 'rgba(37,99,235,0.5)'}`,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            cursor: isFinished ? 'default' : 'pointer',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>

            {/* Up chevron */}
            <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <ChevronUp style={{ width: 20, height: 20, color: staticText }} />
            </button>

            {/* Label */}
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: staticText, animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none', flexShrink: 0 }}>
              {isFinished ? 'Done!' : 'Timer'}
            </span>

            {/* Centre: countdown or adjuster */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
              {isActive ? (
                <span style={{ fontWeight: 900, fontSize: 26, fontVariantNumeric: 'tabular-nums', color: staticAccent, lineHeight: '36px', animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none' }}>
                  {fmt(t)}
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* − button with 3D press effect */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: '#1a3fa8', transform: 'translateY(3px)' }} />
                    <button
                      onClick={() => onTimerValueChange(Math.max(10, (parseInt(restTimer) || 90) - 10))}
                      style={{ position: 'relative', zIndex: 1, width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: '#fff', background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)', transition: 'transform 0.08s, box-shadow 0.08s' }}
                      onPointerDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
                      onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                      onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)'; }}>
                      −
                    </button>
                  </div>

                  <span style={{ fontWeight: 900, fontSize: 26, color: '#e2e8f0', minWidth: 52, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(parseInt(restTimer) || 90)}
                  </span>

                  {/* + button with 3D press effect */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: '#1a3fa8', transform: 'translateY(3px)' }} />
                    <button
                      onClick={() => onTimerValueChange((parseInt(restTimer) || 90) + 10)}
                      style={{ position: 'relative', zIndex: 1, width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: '#fff', background: 'linear-gradient(to bottom, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)', transition: 'transform 0.08s, box-shadow 0.08s' }}
                      onPointerDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
                      onPointerUp={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                      onPointerLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)'; }}>
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Go / Stop */}
            <button
              onClick={(e) => { e.stopPropagation(); isActive ? handleStop() : handleGo(); }}
              style={{ height: 38, padding: '0 18px', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', background: isActive ? 'linear-gradient(to bottom, rgba(239,68,68,0.9), rgba(185,28,28,0.9))' : 'linear-gradient(to bottom, #22c55e, #16a34a)', boxShadow: isActive ? '0 3px 0 0 #7f1d1d' : '0 3px 0 0 #14532d', animation: isPulsing ? `timer-stop-pulse ${PULSE_DURATION}` : 'none', flexShrink: 0, transition: 'transform 0.08s ease, box-shadow 0.08s ease' }}
              onPointerDown={e => { e.currentTarget.style.transform = 'translateY(3px)'; e.currentTarget.style.boxShadow = 'none'; }}
              onPointerUp={e => { e.currentTarget.style.transform = ''; }}
              onPointerLeave={e => { e.currentTarget.style.transform = ''; }}>
              {isActive ? 'Stop' : 'Go'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}