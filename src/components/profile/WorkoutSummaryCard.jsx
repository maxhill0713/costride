import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { TrendingUp, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function WorkoutSummaryCard({ currentUser }) {
  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser?.id }, '-created_date', 1),
    enabled: !!currentUser
  });

  const lastWorkout = workoutLogs[0];

  if (!lastWorkout) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg shadow-black/30 p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 tracking-tight">Last Workout Summary</h3>
        </div>

        <div className="space-y-2">
          {/* Workout Type & Time */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{lastWorkout.workout_type || 'Workout'}</span>
            <span className="text-slate-500">{formatDistanceToNow(new Date(lastWorkout.created_date), { addSuffix: true })}</span>
          </div>

          {/* Duration */}
          {lastWorkout.duration && (
            <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
              <Clock className="w-4 h-4 text-cyan-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400">Duration</p>
                <p className="text-sm font-semibold text-white">{Math.floor(lastWorkout.duration / 60)} min</p>
              </div>
            </div>
          )}

          {/* Weight Increase */}
          {lastWorkout.total_weight_increase > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <div className="flex-1">
                <p className="text-xs text-slate-400">Weight Increase</p>
                <p className="text-sm font-semibold text-green-400">+{lastWorkout.total_weight_increase} lbs</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {lastWorkout.notes && (
            <div className="p-2 bg-slate-800/50 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">Notes</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{lastWorkout.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}