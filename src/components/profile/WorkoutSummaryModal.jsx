import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, Dumbbell, BookOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

export default function WorkoutSummaryModal({ isOpen, duration, workoutName, exercises, lastWorkout, notes, onConfirm, onCancel, isLoading }) {
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  // Calculate weight increases
  const weightIncreases = exercises && lastWorkout?.exercises ? exercises
    .map((exercise, index) => {
      const lastExercise = lastWorkout.exercises[index];
      if (!lastExercise) return null;
      
      const currentWeight = parseFloat(exercise.weight) || 0;
      const lastWeight = parseFloat(lastExercise.weight) || 0;
      
      if (currentWeight > lastWeight) {
        return {
          exercise: exercise.exercise,
          increase: currentWeight - lastWeight
        };
      }
      return null;
    })
    .filter(Boolean) : [];

  const motivationalTexts = [
    "You're getting stronger every day! 💪",
    "Keep crushing those goals! 🔥",
    "That's what consistency looks like! 🎯",
    "You're on fire! Keep it up! 🚀",
    "Building your best self! 💎",
    "That's a personal record mindset! 🏆",
    "Your dedication is paying off! ⭐",
    "Unstoppable momentum! 💥"
  ];

  const motivationalText = motivationalTexts[Math.floor(Math.random() * motivationalTexts.length)];

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <AlertDialogContent className="bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-950 border border-blue-500/30 max-w-md shadow-2xl shadow-black/40">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-3 mb-2">

            <AlertDialogTitle className="text-2xl font-black bg-gradient-to-r from-orange-300 to-orange-200 bg-clip-text text-transparent text-center">
             Workout Complete?
            </AlertDialogTitle>

          </div>
          <AlertDialogDescription className="text-center space-y-3 pt-2">
            {/* Duration and Button Row */}
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="flex items-center justify-between gap-4"
            >
              <p className="text-3xl font-black text-white">
                {formatDuration(duration)}
              </p>
              <Button
                onClick={onConfirm}
                className="w-32 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30"
                disabled={isLoading}
              >
                {isLoading ? 'Logging...' : 'Confirm'}
              </Button>
            </motion.div>

            {/* Weight Increases */}
            {weightIncreases.length > 0 && (
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="bg-green-500/10 backdrop-blur rounded-2xl p-4 border border-green-500/30"
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold text-sm">Weight Increases</span>
                </div>
                <div className="space-y-2">
                  {weightIncreases.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-sm text-slate-300">{item.exercise}</span>
                      <span className="text-sm font-bold text-green-400">+{item.increase.toFixed(1)}kg</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Notes */}
            {notes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-slate-500/20"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300 font-semibold text-sm">Notes</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{notes}</p>
              </motion.div>
            )}


          </AlertDialogDescription>
          </AlertDialogHeader>
          </AlertDialogContent>
          </AlertDialog>
  );
}