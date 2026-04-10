import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TimerContext = createContext(null);

const TIMER_STORAGE_KEY = 'rest_timer_state';

export function TimerProvider({ children }) {
  const [restTimer, setRestTimer]           = useState(90);
  const [isTimerActive, setIsTimerActive]   = useState(false);
  const [initialRestTime, setInitialRestTime] = useState(90);
  const [openTimerBar, setOpenTimerBar]     = useState(false);
  const [timerWorkout, setTimerWorkout]     = useState(null); // today's workout for cardio routines

  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // Load persisted timer state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (stored) {
        const { restTimer: savedTimer, initialRestTime: savedInitial, isTimerActive: wasActive, savedAt } = JSON.parse(stored);
        if (wasActive && savedAt) {
          const elapsedMs = Date.now() - savedAt;
          const elapsedSecs = Math.floor(elapsedMs / 1000);
          const remaining = Math.max(0, savedTimer - elapsedSecs);
          setRestTimer(remaining);
          setInitialRestTime(savedInitial);
          // Auto-resume if timer was active
          if (remaining > 0) {
            setIsTimerActive(true);
          }
        } else if (savedTimer > 0) {
          setRestTimer(savedTimer);
          setInitialRestTime(savedInitial);
        }
      }
    } catch (e) {
      console.error('Failed to load timer state:', e);
    }
  }, []);

  // Persist timer state whenever it changes
  useEffect(() => {
    try {
      const timerState = {
        restTimer: typeof restTimer === 'number' ? restTimer : parseInt(restTimer) || 0,
        initialRestTime: typeof initialRestTime === 'number' ? initialRestTime : parseInt(initialRestTime) || 90,
        isTimerActive,
        savedAt: Date.now()
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } catch (e) {
      console.error('Failed to save timer state:', e);
    }
  }, [restTimer, initialRestTime, isTimerActive]);

  useEffect(() => {
    if (isTimerActive) {
      const current = typeof restTimer === 'number' ? restTimer : parseInt(restTimer) || 0;
      if (current <= 0) return;
      lastUpdateRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          const p = typeof prev === 'number' ? prev : parseInt(prev) || 0;
          if (p <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isTimerActive]);

  return (
    <TimerContext.Provider value={{
      restTimer, setRestTimer,
      isTimerActive, setIsTimerActive,
      initialRestTime, setInitialRestTime,
      openTimerBar, setOpenTimerBar,
      timerWorkout, setTimerWorkout,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within a TimerProvider');
  return ctx;
}