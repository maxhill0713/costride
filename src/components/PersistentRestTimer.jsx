import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../TimerContext';

/* ─── CSS animations ─────────────────────────────────────────────────────── */
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

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

// Parse "M:SS" digit string (as stored in cardio) to total seconds
function parseTimeDigits(raw) {
  if (!raw) return 0;
  const digits = String(raw).replace(/\D/g, '').slice(0, 4);
  if (!digits) return 0;
  const padded = digits.padStart(3, '0');
  const mins = parseInt(padded.slice(0, padded.length - 2), 10);
  const secs = parseInt(padded.slice(-2), 10);
  return mins * 60 + secs;
}

// Build segments array for a cardio exercise
// e.g. 3 rounds × 180s work + 60s rest → [work, rest, work, rest, work]
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

/* ─── Segmented SVG arc ──────────────────────────────────────────────────── */
function SegmentedArc({ segments, currentSegIdx, smoothProgress, radius = 90 }) {
  const circumference = 2 * Math.PI * radius;
  const totalSecs = segments.reduce((s, seg) => s + seg.secs, 0);
  if (!totalSecs) return null;

  // Build per-segment arc slices
  let offset = 0;
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
      viewBox="0 0 200 200">
      {/* Track */}
      <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />

      {segments.map((seg, i) => {
        const frac = seg.secs / totalSecs;
        const arcLen = circumference * frac;
        const gap = circumference * 0.003; // tiny gap between segments
        const drawLen = Math.max(0, arcLen - gap);
        const color = seg.type === 'work' ? '#60a5fa' : '#34d399';
        const dimColor = seg.type === 'work' ? 'rgba(96,165,250,0.25)' : 'rgba(52,211,153,0.25)';

        // How much of this segment is filled
        let fillFrac = 0;
        if (i < currentSegIdx) {
          fillFrac = 1; // past segment — fully "done" but show dimmed
        } else if (i === currentSegIdx) {
          fillFrac = smoothProgress; // current segment — smooth progress
        }
        // future segments: fillFrac = 0

        const segOffset = circumference - offset;

        offset += arcLen;

        return (
          <g key={i}>
            {/* Dim background for segment */}
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke={dimColor}
              strokeWidth="10"
              strokeLinecap="butt"
              strokeDasharray={`${drawLen} ${circumference - drawLen}`}
              strokeDashoffset={segOffset}
            />
            {/* Filled portion */}
            {fillFrac > 0 && (
              <circle
                cx="100" cy="100" r={radius}
                fill="none"
                stroke={i < currentSegIdx ? dimColor : color}
                strokeWidth="10"
                strokeLinecap={i === segments.length - 1 ? 'round' : 'butt'}
                strokeDasharray={`${drawLen * fillFrac} ${circumference - drawLen * fillFrac}`}
                strokeDashoffset={segOffset}
                style={{ filter: i === currentSegIdx ? `drop-shadow(0 0 6px ${color})` : 'none' }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── Simple single-colour arc (rest timer mode) ─────────────────────────── */
function SimpleArc({ smoothProgress, isPulsing, radius = 90 }) {
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - smoothProgress);
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
      viewBox="0 0 200 200">
      <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      <circle
        cx="100" cy="100" r={radius} fill="none"
        stroke="#60a5fa"
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{
          animation: isPulsing ? `timer-stroke-pulse 2.2s ease-in-out infinite` : 'none',
        }} />
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function PersistentRestTimer({
  isActive, restTimer, initialRestTime,
  onTimerStateChange, onTimerValueChange,
  todayWorkout,   // passed in so we can read cardio exercises
}) {
  const { openTimerBar, setOpenTimerBar } = useTimer();
  const [expanded, setExpanded] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  // Open bar when context signals
  useEffect(() => {
    if (openTimerBar) {
      setBarVisible(true);
      setOpenTimerBar(false); // reset after consuming
    }
  }, [openTimerBar]);

  // Cardio mode state
  const [cardioMode, setCardioMode] = useState(false);
  const [cardioSegments, setCardioSegments] = useState([]);
  const [currentSegIdx, setCurrentSegIdx] = useState(0);
  const [cardioTitle, setCardioTitle] = useState('');

  // Smooth arc
  const [smoothProgress, setSmoothProgress] = useState(1);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);

  const finishedAtRef = useRef(null);
  const [showFinished, setShowFinished] = useState(false);

  useEffect(() => { injectPulseStyles(); }, []);

  // When timer stops externally (not via Stop button), keep bar open but reset state
  useEffect(() => {
    if (!isActive && !showFinished) {
      setExpanded(false);
      setPaused(false);
      setCardioMode(false);
      setCurrentSegIdx(0);
      finishedAtRef.current = null;
      // Don't close barVisible — user may want to restart
    }
  }, [isActive]);

  const t     = typeof restTimer === 'number' ? restTimer : (typeof restTimer === 'string' && restTimer !== '' ? parseInt(restTimer) || 0 : 0);
  const total = initialRestTime || 90;

  // Detect finish
  useEffect(() => {
    if (t === 0 && isActive && finishedAtRef.current === null) {
      // In cardio mode, advance to next segment
      if (cardioMode && currentSegIdx < cardioSegments.length - 1) {
        const nextIdx = currentSegIdx + 1;
        setCurrentSegIdx(nextIdx);
        const nextSeg = cardioSegments[nextIdx];
        onTimerValueChange(nextSeg.secs);
        return;
      }
      // Otherwise finished
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
  }, [t, isActive, cardioMode, currentSegIdx, cardioSegments]);

  // Smooth progress arc
  useEffect(() => {
    if (!isActive || t === 0 || paused) {
      const segTotal = cardioMode && cardioSegments[currentSegIdx] ? cardioSegments[currentSegIdx].secs : total;
      setSmoothProgress(Math.max(0, t / segTotal));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    lastTickRef.current = Date.now();
    const segTotal = cardioMode && cardioSegments[currentSegIdx] ? cardioSegments[currentSegIdx].secs : total;
    const animate = () => {
      if (!lastTickRef.current) return;
      const elapsed = (Date.now() - lastTickRef.current) / 1000;
      const interpolated = Math.max(0, t - elapsed);
      setSmoothProgress(interpolated / segTotal);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [t, isActive, total, paused, cardioMode, currentSegIdx, cardioSegments]);

  const isWarning  = t > 0 && t <= 10 && isActive;
  const isFinished = t === 0 && isActive;
  const isPulsing  = isWarning || isFinished;

  const PULSE_DURATION = '2.2s ease-in-out infinite';
  const staticBg    = 'linear-gradient(to bottom, #1d4ed8, #1e40af, #172554)';
  const staticBarBg = 'linear-gradient(90deg, #1d4ed8 0%, #172554 100%)';
  const staticAccent = '#60a5fa';
  const staticText   = 'rgba(147,197,253,0.75)';

  const cardioExercises = todayWorkout?.cardio || [];

  // Select a cardio exercise
  const handleSelectCardio = (c) => {
    const segs = buildSegments(c);
    setCardioSegments(segs);
    setCurrentSegIdx(0);
    setCardioTitle(c.exercise || 'Cardio');
    setCardioMode(true);
    // Don't start yet — just pre-set the time
    onTimerValueChange(segs[0]?.secs || 60);
    onTimerStateChange(false); // ensure stopped
    setPaused(false);
  };

  // Go button
  const handleGo = () => {
    setPaused(false);
    onTimerStateChange(true);
  };

  // Stop button
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

  // Pause/resume
  const handlePause = () => {
    if (paused) {
      setPaused(false);
      onTimerStateChange(true);
    } else {
      setPaused(true);
      onTimerStateChange(false);
    }
  };

  // Current segment info (for cardio title on fullscreen)
  const currentSeg = cardioMode && cardioSegments[currentSegIdx];
  const displayTitle = cardioMode
    ? (currentSeg?.type === 'rest' ? 'Rest' : cardioTitle)
    : 'Timer';

  // If neither bar nor active — hide everything
  if (!barVisible && !isActive && !showFinished) return null;

  /* ── Fullscreen ─────────────────────────────────────────────────────────── */
  return (
    <>
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
              justifyContent: 'flex-start', paddingTop: '10vh',
              background: staticBg,
              animation: isPulsing ? `timer-bg-pulse ${PULSE_DURATION}` : 'none',
            }}>

            {/* Collapse chevron */}
            {!isFinished && (
              <button
                onClick={() => setExpanded(false)}
                style={{ position: 'absolute', top: 48, right: 24, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
                <ChevronDown style={{ width: 24, height: 24 }} />
              </button>
            )}

            {/* Title */}
            <p style={{
              fontSize: 22, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              marginBottom: 28, color: staticText,
              animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
            }}>
              {isFinished ? 'Done!' : displayTitle}
            </p>

            {/* Circle */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 224, height: 224 }}>
              {cardioMode && cardioSegments.length > 1
                ? <SegmentedArc segments={cardioSegments} currentSegIdx={currentSegIdx} smoothProgress={smoothProgress} />
                : <SimpleArc smoothProgress={smoothProgress} isPulsing={isPulsing} />
              }
              <span style={{
                color: '#fff', fontWeight: 900, fontSize: 60, fontVariantNumeric: 'tabular-nums',
                position: 'relative', zIndex: 10,
                animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
              }}>
                {fmt(t)}
              </span>
            </div>

            {/* Go / Pause+Stop buttons */}
            <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 220 }}>
              {!isActive && !paused ? (
                /* Go */
                <button
                  onClick={handleGo}
                  style={{
                    width: '100%', padding: '16px 0', borderRadius: 16,
                    color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
                    boxShadow: '0 4px 0 0 #1a3fa8',
                  }}>
                  Go
                </button>
              ) : (
                <>
                  {/* Pause / Resume */}
                  <button
                    onClick={handlePause}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 14,
                      color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer',
                      background: paused
                        ? 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)'
                        : 'linear-gradient(to bottom, #f59e0b, #d97706, #b45309)',
                      boxShadow: paused ? '0 3px 0 0 #1a3fa8' : '0 3px 0 0 #78350f',
                    }}>
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                  {/* Stop */}
                  <button
                    onClick={handleStop}
                    style={{
                      width: '100%', padding: '13px 0', borderRadius: 14,
                      color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(to bottom, rgba(239,68,68,0.9), rgba(185,28,28,0.9), rgba(153,27,27,0.9))',
                      boxShadow: '0 3px 0 0 #7f1d1d',
                      animation: isPulsing ? `timer-stop-pulse ${PULSE_DURATION}` : 'none',
                    }}>
                    Stop
                  </button>
                </>
              )}
            </div>

            {/* Cardio routines — bottom-left, only if cardio exercises exist */}
            {cardioExercises.length > 0 && (
              <div style={{
                position: 'absolute', bottom: 40, left: 24, maxWidth: '45%',
              }}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(147,197,253,0.5)', marginBottom: 8 }}>
                  Workout Routines
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cardioExercises.map((c, i) => {
                    const isSelected = cardioMode && cardioTitle === (c.exercise || 'Cardio');
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectCardio(c)}
                        style={{
                          padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                          fontSize: 12, fontWeight: 700, textAlign: 'left',
                          background: isSelected
                            ? 'rgba(96,165,250,0.25)'
                            : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#60a5fa' : 'rgba(255,255,255,0.7)',
                          outline: isSelected ? '1px solid rgba(96,165,250,0.4)' : 'none',
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
          style={{
            position: 'fixed', left: 0, right: 0,
            bottom: 'calc(79px + env(safe-area-inset-bottom))',
            zIndex: 400, padding: '10px 14px', minHeight: 62,
            background: isActive ? staticBarBg : 'linear-gradient(90deg, rgba(15,23,42,0.97) 0%, rgba(8,12,28,0.99) 100%)',
            animation: isPulsing ? `timer-bar-bg-pulse ${PULSE_DURATION}` : 'none',
            borderTop: `1px solid ${isPulsing ? 'rgba(239,68,68,0.5)' : isActive ? 'rgba(37,99,235,0.5)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.35)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

            {/* Up chevron — tap to expand */}
            <button
              onClick={() => setExpanded(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              <ChevronUp style={{ width: 20, height: 20, color: isActive ? staticText : 'rgba(148,163,184,0.6)' }} />
            </button>

            {/* Label */}
            <span style={{
              fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: isActive ? staticText : 'rgba(148,163,184,0.8)',
              animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
              flexShrink: 0,
            }}>
              {isFinished ? 'Done!' : 'Timer'}
            </span>

            {/* Centre: countdown (active) or −/time/+ (pre-go) */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {isActive ? (
                /* Countdown */
                <span style={{
                  fontWeight: 900, fontSize: 30, fontVariantNumeric: 'tabular-nums',
                  color: staticAccent,
                  animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
                }}>
                  {fmt(t)}
                </span>
              ) : (
                /* Time adjuster */
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => onTimerValueChange(Math.max(10, (parseInt(restTimer) || 90) - 10))}
                    style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#fff', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    −
                  </button>
                  <span style={{ fontWeight: 900, fontSize: 26, color: '#e2e8f0', minWidth: 52, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(parseInt(restTimer) || 90)}
                  </span>
                  <button
                    onClick={() => onTimerValueChange((parseInt(restTimer) || 90) + 10)}
                    style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#fff', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Go / Stop button */}
            <button
              onClick={isActive ? handleStop : handleGo}
              style={{
                height: 38, padding: '0 18px', borderRadius: 10,
                color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                background: isActive
                  ? 'linear-gradient(to bottom, rgba(239,68,68,0.9), rgba(185,28,28,0.9))'
                  : 'linear-gradient(to bottom, #3b82f6, #2563eb)',
                boxShadow: isActive ? '0 3px 0 0 #7f1d1d' : '0 3px 0 0 #1a3fa8',
                animation: isPulsing ? `timer-stop-pulse ${PULSE_DURATION}` : 'none',
                flexShrink: 0,
                transition: 'transform 0.1s ease',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(3px) scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
              onTouchStart={e => e.currentTarget.style.transform = 'translateY(3px) scale(0.95)'}
              onTouchEnd={e => e.currentTarget.style.transform = ''}>
              {isActive ? 'Stop' : 'Go'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Export a small hook so TodayWorkout can open the bar ────────────────── */
// The "Timer" button in TodayWorkout should call openTimerBar() from props.
// We expose setBarVisible via a ref callback — TodayWorkout passes onOpenTimer prop.