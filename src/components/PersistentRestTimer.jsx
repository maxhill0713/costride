import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersistentRestTimer({ isActive, restTimer, initialRestTime, onTimerStateChange, onTimerValueChange }) {
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const timerPresets = [
    { label: '10s', value: 10 },
    { label: '30s', value: 30 },
    { label: '45s', value: 45 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
    { label: '5m', value: 300 },
    { label: '10m', value: 600 },
  ];

  // Close expanded view when timer stops
  useEffect(() => {
    if (!isActive) setExpanded(false);
  }, [isActive]);

  if (!isActive) return null;

  const total = initialRestTime || 90;
  const progress = typeof restTimer === 'number' ? restTimer / total : 0;

  // SVG circle math
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const formatTime = (t) => `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;

  return (
    <>
      {/* Fullscreen Expanded Timer */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-blue-700 via-blue-800 to-blue-950"
          >
            {/* Close arrow - top right */}
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-12 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <p className="text-blue-300/70 text-sm font-bold uppercase tracking-widest mb-10">Rest Timer</p>

            {/* Circular Progress */}
            <div className="relative flex items-center justify-center w-56 h-56">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                {/* Track */}
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="10"
                />
                {/* Progress */}
                <circle
                  cx="100" cy="100" r={radius}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                />
              </svg>
              <span className="text-white font-black text-6xl tabular-nums z-10">
                {formatTime(restTimer)}
              </span>
            </div>

            {/* Stop Button */}
            <button
              onClick={() => {
                onTimerStateChange(false);
                onTimerValueChange('');
                setExpanded(false);
              }}
              className="mt-14 px-10 py-4 rounded-2xl bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-bold text-lg shadow-[0_4px_0_0_#1a3fa8] active:shadow-none active:translate-y-1 transition-all duration-100"
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Bar */}
      {!expanded && (
        <div
          className="fixed left-0 right-0 z-40 bg-gradient-to-r from-blue-700/95 to-blue-900/95 backdrop-blur-2xl border border-blue-600/50 p-3.5 shadow-2xl shadow-blue-900/20 cursor-pointer"
          style={{
            bottom: 'calc(4rem + env(safe-area-inset-bottom))',
            borderRadius: '0',
          }}
          onClick={() => setExpanded(true)}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-[15px] font-bold text-blue-400/70 uppercase tracking-wider">Rest Timer</span>
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-blue-300 font-black text-4xl tabular-nums">{formatTime(restTimer)}</span>
                <span className="text-blue-300 text-lg font-bold">s</span>
              </div>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onTimerStateChange(false);
                onTimerValueChange('');
              }}
              className="inline-flex items-center justify-center h-9 text-xs font-bold px-4 py-2 rounded-lg bg-gradient-to-b from-blue-500/90 via-blue-600/90 to-blue-700/90 backdrop-blur-md text-white border border-transparent shadow-[0_3px_0_0_#1a3fa8,0_8px_20px_rgba(0,0,100,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] active:shadow-none active:translate-y-[3px] active:scale-95 transition-all duration-100 transform-gpu"
            >
              Stop
            </Button>
          </div>
        </div>
      )}
    </>
  );
}