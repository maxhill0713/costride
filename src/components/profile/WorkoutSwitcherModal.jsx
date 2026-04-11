import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WorkoutSwitcherModal({ open, onClose, currentUser, activeDayKey, onSelect }) {
  // Find first available rest day in the week
  const firstAvailableRestDay = useMemo(() => {
    if (!currentUser?.training_days) return null;
    const trainingDays = currentUser.training_days;
    for (let day = 1; day <= 7; day++) {
      if (!trainingDays.includes(day)) return day;
    }
    return null;
  }, [currentUser?.training_days]);

  const todayIsRestDay = currentUser?.training_days && !currentUser.training_days.includes(activeDayKey);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-slate-900/80 border-slate-700/30">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Switch Workout</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {/* Rest Day Option — only show if today is training day and a rest day exists */}
          {!todayIsRestDay && firstAvailableRestDay && (
            <Button
              onClick={() => {
                onSelect(firstAvailableRestDay);
                onClose();
              }}
              variant="ghost"
              className="w-full justify-start gap-3 h-12 bg-gradient-to-r from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 border border-green-500/30 text-green-300 font-semibold rounded-xl p-3 mb-3">
              <ArrowRightLeft className="w-4 h-4" />
              <div className="flex-1 text-left">
                <div className="font-bold">Rest Day</div>
                <div className="text-xs text-green-400/70">Swap with {DAYS[firstAvailableRestDay]}</div>
              </div>
            </Button>
          )}

          {/* Training Days */}
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isRestDay = !currentUser?.training_days?.includes(day);
            const isToday = day === activeDayKey;
            const workout = currentUser?.custom_workout_types?.[day];
            const workoutName = workout?.name || (isRestDay ? 'Rest Day' : 'Training Day');

            return (
              <Button
                key={day}
                onClick={() => {
                  onSelect(day);
                  onClose();
                }}
                variant="ghost"
                className={`w-full justify-start gap-3 h-12 rounded-xl p-3 font-semibold transition-all ${
                  isToday
                    ? 'bg-blue-500/20 border-blue-500/50 border text-blue-300'
                    : isRestDay
                    ? 'bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/30 text-slate-300'
                    : 'bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/30 text-slate-200'
                }`}>
                <div className="flex-1 text-left">
                  <div className="font-bold">{DAYS[day]}</div>
                  <div className="text-xs text-slate-400">{workoutName}</div>
                </div>
                {isToday && <div className="text-xs bg-blue-500/30 px-2 py-1 rounded text-blue-200">Today</div>}
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}