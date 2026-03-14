import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PULSE_CSS = `
  @keyframes timer-pulse {
    0%   { opacity: 1; }
    50%  { opacity: 0.35; }
    100% { opacity: 1; }
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
  // Track when timer hit 0 so we can hold the finished state for 10s
  const finishedAtRef = useRef(null);
  const [showFinished, setShowFinished] = useState(false);
  // Sub-second progress for smooth circle animation
  const [smoothProgress, setSmoothProgress] = useState(1);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);

  useEffect(() => { injectPulseStyles(); }, []);

  // When isActive goes false (timer stopped by user) clear finished hold too
  useEffect(() => {
    if (!isActive) {
      setExpanded(false);
      setShowFinished(false);
      finishedAtRef.current = null;
    }
  }, [isActive]);

  // Detect when restTimer reaches 0 and start the 10s hold
  const t = typeof restTimer === 'number' ? restTimer : 0;
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

  // Smooth sub-second circle progress via requestAnimationFrame
  useEffect(() => {
    if (!isActive || t === 0) {
      // Snap to current value when stopped or finished
      setSmoothProgress(t / total);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    // Each time restTimer ticks down, record the wall-clock time of that tick
    lastTickRef.current = Date.now();

    const animate = () => {
      if (!lastTickRef.current) return;
      const elapsed = (Date.now() - lastTickRef.current) / 1000; // seconds since last tick
      // interpolate from t towards t-1 as elapsed goes 0→1
      const interpolated = Math.max(0, t - elapsed);
      setSmoothProgress(interpolated / total);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [t, isActive, total]);

  if (!isActive && !showFinished) return null;

  const radius       = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset   = circumference * (1 - smoothProgress);
  const formatTime   = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  const isWarning  = t > 0 && t <= 10;
  const isFinished = t === 0;

  // Pulse style — same timing/feel for both bar and fullscreen
  const pulseStyle = (isWarning || isFinished)
    ? { animation: 'timer-pulse 2.2s ease-in-out infinite' }
    : {};

  // Background colours
  const bgBlue = 'linear-gradient(to bottom, #1d4ed8, #1e40af, #172554)';
  const bgRed  = 'linear-gradient(to bottom, #7f1d1d, #991b1b, #450a0a)';
  const bgNormal = (isWarning || isFinished) ? bgRed : bgBlue;

  const accentColour = (isWarning || isFinished) ? '#fca5a5' : '#60a5fa';
  const textColour   = (isWarning || isFinished) ? 'rgba(252,165,165,0.85)' : 'rgba(147,197,253,0.7)';

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
              background: bgNormal,
              ...pulseStyle,
            }}>

            {/* Close chevron — only while timer is running */}
            {!isFinished && (
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-12 right-6 w-10 h-10 flex items-center justify-center text-white"
                style={{ animation: 'none', opacity: 1 }}>
                <ChevronDown className="w-6 h-6" />
              </button>
            )}

            {/* Title */}
            <p
              className="text-2xl font-bold uppercase tracking-widest mb-10"
              style={{ color: textColour, ...pulseStyle }}>
              {isFinished ? 'Timer Finished' : 'Rest Timer'}
            </p>

            {/* Circle — uses smoothProgress for continuous arc movement */}
            <div className="relative flex items-center justify-center w-56 h-56">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none"
                  stroke={accentColour}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  /* No CSS transition — RAF handles smoothness */
                  style={{ transition: 'stroke 0.4s ease' }} />
              </svg>
              <span
                className="font-black text-6xl tabular-nums z-10"
                style={{ color: '#fff', ...pulseStyle }}>
                {formatTime(t)}
              </span>
            </div>

            {/* Stop button — never pulses */}
            <button
              onClick={() => {
                onTimerStateChange(false);
                onTimerValueChange('');
                setExpanded(false);
                setShowFinished(false);
                finishedAtRef.current = null;
              }}
              className="mt-14 px-10 py-4 rounded-2xl text-white font-bold text-lg active:translate-y-1 transition-all duration-100"
              style={{
                background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 0 0 #1a3fa8',
                animation: 'none',
                opacity: 1,
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
            position: 'fixed',
            left: 0, right: 0,
            bottom: 'calc(79px + env(safe-area-inset-bottom))',
            zIndex: 400,
            borderRadius: 0,
            padding: '14px 14px',
            minHeight: 68,
            cursor: isFinished ? 'default' : 'pointer',
            // Same gradient treatment as fullscreen
            background: bgNormal,
            ...pulseStyle,
            borderTop: `1px solid ${(isWarning || isFinished) ? 'rgba(239,68,68,0.5)' : 'rgba(37,99,235,0.5)'}`,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}>
          <div className="flex items-center justify-between gap-4">

            {/* Label */}
            <span
              className="text-[15px] font-bold uppercase tracking-wider"
              style={{ color: textColour, ...pulseStyle }}>
              {isFinished ? 'Timer Finished' : 'Rest Timer'}
            </span>

            {/* Clock + countdown — hidden when finished */}
            {!isFinished && (
              <div className="flex items-center gap-3" style={pulseStyle}>
                <Clock className="w-6 h-6 flex-shrink-0" style={{ color: accentColour }} />
                <span className="font-black text-4xl tabular-nums" style={{ color: accentColour }}>
                  {formatTime(t)}
                </span>
              </div>
            )}

            {/* Stop button — never pulses */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onTimerStateChange(false);
                onTimerValueChange('');
                setShowFinished(false);
                finishedAtRef.current = null;
              }}
              className="inline-flex items-center justify-center h-10 text-xs font-bold px-5 py-2 rounded-lg text-white border border-transparent active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu"
              style={{
                background: 'linear-gradient(to bottom, rgba(96,165,250,0.9), rgba(59,130,246,0.9), rgba(37,99,235,0.9))',
                boxShadow: '0 3px 0 0 #1a3fa8, 0 8px 20px rgba(0,0,100,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                animation: 'none',
                opacity: 1,
              }}>
              Stop
            </Button>
          </div>
        </div>
      )}
    </>
  );
}