import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';

export default function PersistentRestTimer({ isActive, restTimer, initialRestTime, onTimerStateChange, onTimerValueChange }) {
  const [showTimerOptions, setShowTimerOptions] = useState(false);

  const timerPresets = [
    { label: '10s', value: 10 },
    { label: '30s', value: 30 },
    { label: '45s', value: 45 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
    { label: '5m', value: 300 },
    { label: '10m', value: 600 }
  ];

  if (!isActive && restTimer === '') return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-24 md:right-4 z-40 bg-gradient-to-r from-blue-700/95 to-blue-900/95 backdrop-blur-2xl border border-blue-600/50 rounded-2xl p-4 shadow-2xl shadow-blue-900/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider">Rest Timer</span>
            <div className="flex items-center gap-2">
              <span className="text-blue-300 font-black text-3xl tabular-nums">{Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>



        <div className="flex items-center gap-2 flex-shrink-0">
          {!isActive && (
            <>
              <button
                onClick={() => setShowTimerOptions(!showTimerOptions)}
                className="relative px-3 py-2 rounded-lg bg-white/5 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 text-xs font-bold transition-all active:scale-95 border border-white/10 hover:border-blue-500/30"
              >
                ⚙️
              </button>
            </>
          )}
          <Button
            onClick={() => {
              if (!isActive) {
                onTimerStateChange(true);
              } else {
                onTimerStateChange(false);
              }
            }}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-blue-700/90 to-blue-900/90 hover:from-blue-800/90 hover:to-slate-950/90 text-white transition-all active:scale-95 shadow-md shadow-blue-900/20"
          >
            {isActive ? 'Stop' : 'Go'}
          </Button>
          {!isActive && (
            <Button
              onClick={() => {
                onTimerValueChange('');
                onTimerStateChange(false);
              }}
              size="icon"
              variant="ghost"
              className="w-6 h-6 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Timer Options Dropdown */}
        {showTimerOptions && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setShowTimerOptions(false)} />
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl shadow-black/20 p-2 z-40">
              <div className="grid grid-cols-3 gap-1.5">
                {timerPresets.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      onTimerValueChange(preset.value);
                      setShowTimerOptions(false);
                    }}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 text-xs font-bold transition-all active:scale-95 border border-white/10 hover:border-blue-500/30"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}