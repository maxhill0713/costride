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
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      if (!open) onCancel();
    }}>
      <AlertDialogContent className="bg-gradient-to-br from-slate-900/60 via-slate-900/50 to-slate-950/60 backdrop-blur-[50px] border-0 rounded-3xl max-w-sm shadow-2xl shadow-black/40">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black bg-gradient-to-r from-orange-300 to-orange-200 bg-clip-text text-transparent tracking-tight text-2xl text-center mb-6">
            {workoutName} workout complete?
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <p className="text-3xl font-black text-white">
              {formatDuration(duration)}
            </p>
          </div>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold shadow-lg shadow-orange-500/30 whitespace-nowrap"
            disabled={isLoading}
          >
            {isLoading ? 'Logging...' : 'Confirm'}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}