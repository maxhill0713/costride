import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

const STREAK_ICON_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694b637358644e1c22c8ec6b/2c931d7ec_STREAKICON1.png';
import confetti from 'canvas-confetti';

export default function WorkoutCelebration({ 
  previousStreak, 
  currentStreak, 
  challenges, 
  onComplete 
}) {
  const [phase, setPhase] = useState('streak'); // 'streak' | 'challenges' | 'complete'
  const [scrollPosition, setScrollPosition] = useState(0);

  // Trigger confetti on streak increase
  useEffect(() => {
    if (phase === 'streak' && currentStreak > previousStreak) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.3 }
      });
    }
  }, [phase, currentStreak, previousStreak]);

  // Auto-scroll to challenges after streak animation
  useEffect(() => {
    if (phase === 'streak') {
      const timer = setTimeout(() => {
        setPhase('challenges');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Auto-complete after challenges animation
  useEffect(() => {
    if (phase === 'challenges') {
      const timer = setTimeout(() => {
        setPhase('complete');
        setTimeout(onComplete, 500);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center"
      >
        {/* Streak Phase */}
        <AnimatePresence>
          {phase === 'streak' && (
            <motion.div
              key="streak"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: 2 }}
                className="mb-6"
              >
                <Flame className="w-24 h-24 text-orange-500 mx-auto" fill="currentColor" />
              </motion.div>

              <h2 className="text-4xl font-bold text-white mb-4">Streak Increased!</h2>

              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold text-slate-400"
                >
                  {previousStreak}
                </motion.div>

                <motion.div
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 0.6 }}
                  className="text-2xl font-bold text-white"
                >
                  →
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-4xl font-bold text-orange-400 bg-orange-500/20 px-6 py-2 rounded-full"
                >
                  {currentStreak}
                </motion.div>
              </div>

              <motion.p
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-slate-300 text-lg"
              >
                Keep it up! 🔥
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Challenges Phase */}
        <AnimatePresence>
          {phase === 'challenges' && (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-md px-6 py-8"
            >
              <h3 className="text-2xl font-bold text-white text-center mb-6">Challenge Progress</h3>

              <div className="space-y-4">
                {challenges.length > 0 ? (
                  challenges.map((challenge, idx) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2, duration: 0.5 }}
                      className="bg-white/10 rounded-lg p-4 backdrop-blur-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          <h4 className="font-semibold text-white text-sm">{challenge.title}</h4>
                        </div>
                        <span className="text-sm font-bold text-yellow-400">
                          {challenge.current_progress}/{challenge.target_value}
                        </span>
                      </div>

                      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: `${(challenge.previous_progress / challenge.target_value) * 100}%` }}
                          animate={{ width: `${(challenge.current_progress / challenge.target_value) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-slate-300 text-center py-8"
                  >
                    No active challenges yet
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}