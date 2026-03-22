import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [restTimer, setRestTimer]           = useState(90);
  const [isTimerActive, setIsTimerActive]   = useState(false);
  const [initialRestTime, setInitialRestTime] = useState(90);
  const [openTimerBar, setOpenTimerBar]     = useState(false); // signal to open the bar

  const intervalRef = useRef(null);

  useEffect(() => {
    if (isTimerActive && restTimer > 0) {
      intervalRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isTimerActive, restTimer > 0]);

  return (
    <TimerContext.Provider value={{
      restTimer, setRestTimer,
      isTimerActive, setIsTimerActive,
      initialRestTime, setInitialRestTime,
      openTimerBar, setOpenTimerBar,
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