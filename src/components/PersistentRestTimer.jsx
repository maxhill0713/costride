import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function PersistentRestTimer({ isActive, restTimer, initialRestTime, onTimerStateChange, onTimerValueChange }) {
  const [expanded, setExpanded] = useState(false);
  const finishedAtRef = useRef(null);
  const [showFinished, setShowFinished] = useState(false);
  const [smoothProgress, setSmoothProgress] = useState(1);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);

  useEffect(() => { injectPulseStyles(); }, []);

  useEffect(() => {
    if (!isActive) {
      setExpanded(false);
      setShowFinished(false);
      finishedAtRef.current = null;
    }
  }, [isActive]);

  const t     = typeof restTimer === 'number' ? restTimer : 0;
  const total = initialRestTime || 90;

  useEffect(() => {
    if (t === 0 && isActive && finishedAtRef.current === null) {
      finishedAtRef.current = Date.now();
      setShowFinished(true);
      const timeout = setTimeout(() => {
        setShowFinished(false);
        onTimerStateChange(false);
        onTimerValueChange('');
        finishedAtRef.current = null;
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [t, isActive]);

  // Smooth circle arc via RAF
  useEffect(() => {
    if (!isActive || t === 0) {
      setSmoothProgress(t / total);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    lastTickRef.current = Date.now();
    const animate = () => {
      if (!lastTickRef.current) return;
      const elapsed = (Date.now() - lastTickRef.current) / 1000;
      const interpolated = Math.max(0, t - elapsed);
      setSmoothProgress(interpolated / total);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [t, isActive, total]);

  if (!isActive && !showFinished) return null;

  const radius        = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset    = circumference * (1 - smoothProgress);
  const formatTime    = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  const isWarning  = t > 0 && t <= 10;
  const isFinished = t === 0;
  const isPulsing  = isWarning || isFinished;

  const PULSE_DURATION = '2.2s ease-in-out infinite';

  // Static (non-pulsing) colours
  const staticBg      = 'linear-gradient(to bottom, #1d4ed8, #1e40af, #172554)';
  const staticBarBg   = 'linear-gradient(90deg, #1d4ed8 0%, #172554 100%)';
  const staticAccent  = '#60a5fa';
  const staticText    = 'rgba(147,197,253,0.75)';
  const staticStroke  = '#60a5fa';

  return (
    <>
      {/* ── Fullscreen expanded timer ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: staticBg,
              animation: isPulsing ? `timer-bg-pulse ${PULSE_DURATION}` : 'none',
            }}>

            {!isFinished && (
              <button
                onClick={() => setExpanded(false)}
                style={{ position: 'absolute', top: 48, right: 24, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
                <ChevronDown style={{ width: 24, height: 24 }} />
              </button>
            )}

            {/* Title */}
            <p style={{
              fontSize: 24, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
              marginBottom: 40, color: staticText,
              animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
            }}>
              {isFinished ? 'Timer Finished' : 'Rest Timer'}
            </p>

            {/* Circle */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 224, height: 224 }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle
                  cx="100" cy="100" r={radius} fill="none"
                  stroke={staticStroke}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition: 'stroke 0.4s ease',
                    animation: isPulsing ? `timer-stroke-pulse ${PULSE_DURATION}` : 'none',
                  }} />
              </svg>
              <span style={{
                color: '#fff', fontWeight: 900, fontSize: 60, fontVariantNumeric: 'tabular-nums',
                position: 'relative', zIndex: 10,
                animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
              }}>
                {formatTime(t)}
              </span>
            </div>

            {/* Stop button — pulses with everything else */}
            <button
              onClick={() => {
                onTimerStateChange(false); onTimerValueChange('');
                setExpanded(false); setShowFinished(false); finishedAtRef.current = null;
              }}
              style={{
                marginTop: 56, padding: '16px 40px', borderRadius: 16,
                color: '#fff', fontWeight: 700, fontSize: 18, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 0 0 #1a3fa8',
                animation: isPulsing ? `timer-stop-pulse ${PULSE_DURATION}` : 'none',
              }}>
              Stop
            </button>
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
            zIndex: 400, borderRadius: 0, padding: '14px 14px', minHeight: 68,
            cursor: isFinished ? 'default' : 'pointer',
            background: staticBarBg,
            animation: isPulsing ? `timer-bar-bg-pulse ${PULSE_DURATION}` : 'none',
            borderTop: `1px solid ${isPulsing ? 'rgba(239,68,68,0.5)' : 'rgba(37,99,235,0.5)'}`,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

            {/* Label */}
            <span style={{
              fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              color: staticText,
              animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
            }}>
              {isFinished ? 'Timer Finished' : 'Rest Timer'}
            </span>

            {/* Clock + countdown */}
            {!isFinished && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Clock style={{
                  width: 24, height: 24, flexShrink: 0, color: staticAccent,
                  animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
                }} />
                <span style={{
                  fontWeight: 900, fontSize: 36, fontVariantNumeric: 'tabular-nums',
                  color: staticAccent,
                  animation: isPulsing ? `timer-text-pulse ${PULSE_DURATION}` : 'none',
                }}>
                  {formatTime(t)}
                </span>
              </div>
            )}

            {/* Stop button — pulses with bar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTimerStateChange(false); onTimerValueChange('');
                setShowFinished(false); finishedAtRef.current = null;
              }}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                height: 40, padding: '8px 20px', borderRadius: 8,
                color: '#fff', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(to bottom, rgba(96,165,250,0.9), rgba(59,130,246,0.9), rgba(37,99,235,0.9))',
                boxShadow: '0 3px 0 0 #1a3fa8, inset 0 1px 0 rgba(255,255,255,0.15)',
                animation: isPulsing ? `timer-stop-pulse ${PULSE_DURATION}` : 'none',
                transition: 'transform 0.1s ease',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'translateY(3px) scale(0.95)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
              onTouchStart={e => e.currentTarget.style.transform = 'translateY(3px) scale(0.95)'}
              onTouchEnd={e => e.currentTarget.style.transform = ''}>
              Stop
            </button>
          </div>
        </div>
      )}
    </>
  );
}