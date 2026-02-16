import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, Flame } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function ChallengeProgressScreen({ isOpen, challenges, onContinue }) {
  const [showContinue, setShowContinue] = useState(false);

  useEffect(() => {
    if (isOpen && challenges.length > 0) {
      // Wait for animations to complete (0.5s delay + 0.8s animation = 1.3s, round up to 1.5s for safety)
      const timer = setTimeout(() => {
        setShowContinue(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, challenges.length]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40" />}
      <Dialog open={isOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border border-green-500/30 max-w-md shadow-2xl shadow-black/40 [&>button]:hidden relative z-50">
        <div className="flex flex-col items-center gap-4 py-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
          >
            <Trophy className="w-7 h-7 text-white" strokeWidth={2} />
          </motion.div>
          
          <h2 className="text-2xl font-black text-white text-center">Progress on Challenges</h2>
          
          <div className="w-full space-y-3 max-h-64 overflow-y-auto">
            {challenges.map((challenge, idx) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur rounded-xl p-3 border border-green-500/20"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{challenge.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{challenge.current_value || 0} / {challenge.target_value}</p>
                  </div>
                  {challenge.current_value >= challenge.target_value && (
                    <div className="text-lg">🏆</div>
                  )}
                </div>
                
                <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min((challenge.current_value / challenge.target_value) * 100, 100)}%` }}
                    transition={{ delay: idx * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {showContinue && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Button
                onClick={onContinue}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-bold shadow-lg shadow-green-500/30"
              >
                Continue
              </Button>
            </motion.div>
          )}
        </div>
        </DialogContent>
        </Dialog>
        </>
        );
        }