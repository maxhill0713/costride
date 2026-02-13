import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, Flame, TrendingUp } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';

export default function WorkoutSummaryModal({ isOpen, duration, onConfirm, onCancel, isLoading }) {
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

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 max-w-md">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4 mb-2">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <Flame className="w-10 h-10 text-white" strokeWidth={2} />
            </motion.div>
            <AlertDialogTitle className="text-3xl font-black text-green-900 text-center">
              Great Workout!
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-center space-y-6 pt-2">
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="bg-white/80 backdrop-blur rounded-2xl p-6 border-2 border-green-200"
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-green-600" />
                <span className="text-green-700 font-semibold">Duration</span>
              </div>
              <p className="text-4xl font-black text-green-900">
                {formatDuration(duration)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 bg-green-100/50 rounded-xl py-3 px-4"
            >
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                Logged to your history
              </span>
            </motion.div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 rounded-xl border-2 border-green-300 text-green-900 hover:bg-green-100"
            disabled={isLoading}
          >
            Close
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold"
            disabled={isLoading}
          >
            {isLoading ? 'Logging...' : 'Confirm'}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}