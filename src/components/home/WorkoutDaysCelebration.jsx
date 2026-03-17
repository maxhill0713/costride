import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { startOfWeek } from 'date-fns';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkoutDaysCelebration({ currentUser, weeklyWorkoutLogs, todayDow, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, []);

  const trainingDays = (currentUser?.training_days || []).filter(d => d >= 1 && d <= 7);
  const loggedDays = new Set(weeklyWorkoutLogs.map(l => {
    const d = new Date(l.completed_date).getDay();
    return d === 0 ? 7 : d;
  }));

  const allDays = [1, 2, 3, 4, 5, 6, 7];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onDismiss}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-8 px-6">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-white text-2xl font-black tracking-tight">
        This Week's Progress
      </motion.p>

      <div className="flex items-end justify-center gap-3">
        {allDays.map((day, i) => {
          const done = loggedDays.has(day);
          const isTraining = trainingDays.includes(day);
          const isToday = day === todayDow;

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 300, damping: 18 }}
              className="flex flex-col items-center gap-2">
              <div
                style={{
                  width: isToday ? 48 : 38,
                  height: isToday ? 48 : 38,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done
                    ? 'linear-gradient(to bottom, #60a5fa 0%, #3b82f6 35%, #1d4ed8 100%)'
                    : isTraining
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.04)',
                  border: done
                    ? '1px solid rgba(147,197,253,0.5)'
                    : isToday
                      ? '2px solid rgba(148,163,184,0.5)'
                      : '1px solid rgba(71,85,105,0.5)',
                  boxShadow: done ? '0 4px 0 0 #1a3fa8, 0 7px 18px rgba(0,0,100,0.55)' : 'none',
                }}>
                {done ? (
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M4 10.5l4.5 4.5 7.5-9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: isTraining ? 'rgba(148,163,184,0.4)' : 'transparent', border: '1.5px solid rgba(100,116,139,0.4)' }} />
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? '#fff' : 'rgba(148,163,184,0.7)', letterSpacing: '0.05em' }}>
                {DAY_LABELS[i]}
              </span>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-slate-400 text-sm font-medium">
        Tap to continue
      </motion.p>
    </motion.div>
  );
}