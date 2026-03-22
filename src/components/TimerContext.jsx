import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [restTimer, setRestTimer]           = useState(90);
  const [isTimerActive, setIsTimerActive]   = useState(false);
  const [initialRestTime, setInitialRestTime] = useState(90);
  const [openTimerBar, setOpenTimerBar]     = useState(false);
  const [timerWorkout, setTimerWorkout]     = useState(null); // today's workout for cardio routines

  const intervalRef = useRef(null);

  useEffect(() => {
    if (isTimerActive) {
      const current = typeof restTimer === 'number' ? restTimer : parseInt(restTimer) || 0;
      if (current <= 0) return;
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