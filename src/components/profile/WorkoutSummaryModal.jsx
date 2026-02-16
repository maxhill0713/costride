import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, Dumbbell, BookOpen } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';

export default function WorkoutSummaryModal({ isOpen, duration, workoutName, onConfirm, onCancel, isLoading }) {
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
      <AlertDialogContent className="bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-500/30 max-w-sm shadow-2xl shadow-black/40">
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4">
            <AlertDialogTitle className="text-2xl font-black text-white text-center">
              {workoutName} workout complete?
            </AlertDialogTitle>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-blue-500/20 w-full">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <p className="text-3xl font-black text-white">
                  {formatDuration(duration)}
                </p>
              </div>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800/50"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30"
            disabled={isLoading}
          >
            {isLoading ? 'Logging...' : 'Confirm'}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}