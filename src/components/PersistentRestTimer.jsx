import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PULSE_CSS = `
  @keyframes timer-red-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.45; }
  }
  @keyframes timer-bar-bg-pulse {
    0%, 100% { background: linear-gradient(90deg, rgba(153,27,27,0.97) 0%, rgba(127,29,29,0.97) 100%); }
    50%       { background: linear-gradient(90deg, rgba(185,28,28,0.97) 0%, rgba(153,27,27,0.97) 100%); }
  }
  @keyframes timer-fullscreen-bg-pulse {
    0%, 100% { background: linear-gradient(to bottom, #1d4ed8, #1e40af, #172554); }
    50%       { background: linear-gradient(to bottom, #7f1d1d, #991b1b, #450a0a); }
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

  useEffect(() => { injectPulseStyles(); }, []);

  useEffect(() => {
    if (!isActive) setExpanded(false);
  }, [isActive]);

  if (!isActive) return null;

  const t     = typeof restTimer === 'number' ? restTimer : 0;
  const total = initialRestTime || 90;
  const progress    = t / total;
  const radius      = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset  = circumference * (1 - progress);
  const formatTime  = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

  const isWarning  = t > 0 && t <= 10;
  const isFinished = t === 0;

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
              // finished → solid red; warning → pulsing between blue and red; normal → blue
              background: isFinished
                ? '#7f1d1d'
                : 'linear-gradient(to bottom, #1d4ed8, #1e40af, #172554)',
              animation: isWarning && !isFinished
                ? 'timer-fullscreen-bg-pulse 1.6s ease-in-out infinite'
                : 'none',
            }}>

            {/* Close chevron — hide when finished (Stop is the only exit) */}
            {!isFinished && (
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-12 right-6 w-10 h-10 flex items-center justify-center text-white">
                <ChevronDown className="w-6 h-6" />
              </button>
            )}

            {/* Title */}
            <p
              className="text-2xl font-bold uppercase tracking-widest mb-10"
              style={{ color: isFinished || isWarning ? 'rgba(252,165,165,0.85)' : 'rgba(147,197,253,0.7)' }}>
              {isFinished ? 'Timer Finished' : 'Rest Timer'}
            </p>

            {/* Circular progress */}
            <div className="relative flex items-center justify-center w-56 h-56">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                <circle
                  cx="100" cy="100" r={radius} fill="none"
                  stroke={isFinished || isWarning ? '#fca5a5' : '#60a5fa'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.4s ease' }} />
              </svg>
              <span
                className="font-black text-6xl tabular-nums z-10"
                style={{
                  color: '#fff',
                  animation: isWarning && !isFinished ? 'timer-red-pulse 1.6s ease-in-out infinite' : 'none',
                }}>
                {formatTime(t)}
              </span>
            </div>

            {/* Stop button */}
            <button
              onClick={() => { onTimerStateChange(false); onTimerValueChange(''); setExpanded(false); }}
              className="mt-14 px-10 py-4 rounded-2xl text-white font-bold text-lg active:translate-y-1 transition-all duration-100"
              style={{
                background: 'linear-gradient(to bottom, #3b82f6, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 0 0 #1a3fa8',
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
            background: isFinished
              ? '#991b1b'
              : 'linear-gradient(90deg, rgba(29,78,216,0.95) 0%, rgba(30,58,138,0.95) 100%)',
            animation: isWarning && !isFinished
              ? 'timer-bar-bg-pulse 1.6s ease-in-out infinite'
              : 'none',
            borderTop: `1px solid ${isFinished || isWarning ? 'rgba(239,68,68,0.5)' : 'rgba(37,99,235,0.5)'}`,
            boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}>
          <div className="flex items-center justify-between gap-4">

            {/* Left label */}
            <span
              className="text-[15px] font-bold uppercase tracking-wider"
              style={{ color: isFinished || isWarning ? 'rgba(252,165,165,0.85)' : 'rgba(147,197,253,0.7)' }}>
              {isFinished ? 'Timer Finished' : 'Rest Timer'}
            </span>

            {/* Centre clock + countdown — hidden when finished */}
            {!isFinished && (
              <div className="flex items-center gap-3">
                <Clock
                  className="w-6 h-6 flex-shrink-0"
                  style={{
                    color: isWarning ? '#fca5a5' : '#60a5fa',
                    animation: isWarning ? 'timer-red-pulse 1.6s ease-in-out infinite' : 'none',
                  }} />
                <span
                  className="font-black text-4xl tabular-nums"
                  style={{
                    color: isWarning ? '#fca5a5' : '#93c5fd',
                    animation: isWarning ? 'timer-red-pulse 1.6s ease-in-out infinite' : 'none',
                  }}>
                  {formatTime(t)}
                </span>
              </div>
            )}

            {/* Stop button — always present */}
            <Button
              onClick={(e) => { e.stopPropagation(); onTimerStateChange(false); onTimerValueChange(''); }}
              className="inline-flex items-center justify-center h-10 text-xs font-bold px-5 py-2 rounded-lg text-white border border-transparent active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu"
              style={{
                background: 'linear-gradient(to bottom, rgba(96,165,250,0.9), rgba(59,130,246,0.9), rgba(37,99,235,0.9))',
                boxShadow: '0 3px 0 0 #1a3fa8, 0 8px 20px rgba(0,0,100,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}>
              Stop
            </Button>
          </div>
        </div>
      )}
    </>
  );
}