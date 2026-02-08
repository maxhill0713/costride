import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, ChevronDown, ChevronUp, Clock, FileText } from 'lucide-react';

export default function WorkoutProgressCard({ currentUser, workoutLogs = [] }) {
  const [expanded, setExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  if (!currentUser?.workout_split) {
    return null;
  }

  // Get today's and previous workout logs
  const today = new Date().toDateString();
  const todayLog = workoutLogs.find(log => new Date(log.created_date).toDateString() === today);
  const previousLogs = workoutLogs.filter(log => new Date(log.created_date).toDateString() !== today).slice(0, 3);

  const workoutNotes = currentUser?.workout_notes || {};
  const currentWorkoutName = currentUser?.current_workout_day;

  return (
    <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-sm border border-indigo-500/30 p-4 rounded-2xl overflow-hidden">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Workout Progress</h3>
              <p className="text-xs text-slate-400">Track your training</p>
            </div>
          </div>
          <Button
            onClick={() => setExpanded(!expanded)}
            size="icon"
            variant="ghost"
            className="text-slate-400 hover:text-white"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Today's Workout */}
        {todayLog && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs font-semibold text-green-300">Logged Today</span>
            </div>
            <p className="text-sm font-semibold text-white mb-2">{todayLog.exercise_name || 'Workout Session'}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <p className="text-slate-400">Sets</p>
                <p className="font-bold text-white">{todayLog.sets || '-'}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <p className="text-slate-400">Reps</p>
                <p className="font-bold text-white">{todayLog.reps || '-'}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                <p className="text-slate-400">Weight</p>
                <p className="font-bold text-white">{todayLog.weight || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 w-full mb-2 hover:opacity-80 transition-opacity"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white flex-1 text-left">Workout Notes</span>
            <span className="text-[10px] text-slate-400">{showNotes ? '▼' : '▶'}</span>
          </button>

          {showNotes && (
            <div className="space-y-3 mt-3 pt-3 border-t border-white/10">
              {/* Current Workout Notes */}
              {currentWorkoutName && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-indigo-500/20 text-indigo-300 text-[10px] border-indigo-500/30">Current</Badge>
                    <span className="text-xs font-semibold text-slate-300">{currentWorkoutName}</span>
                  </div>
                  {workoutNotes[currentWorkoutName] ? (
                    <p className="text-xs text-slate-300 bg-slate-800/40 rounded-lg p-2 leading-relaxed">
                      {workoutNotes[currentWorkoutName]}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No notes yet</p>
                  )}
                </div>
              )}

              {/* Previous Notes */}
              {previousLogs.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold text-slate-400 mb-2">Previous Sessions</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {previousLogs.map((log, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-300">{log.exercise_name || 'Workout'}</span>
                          <span className="text-slate-500 text-[10px]">
                            {new Date(log.created_date).toLocaleDateString()}
                          </span>
                        </div>
                        {workoutNotes[log.exercise_name] ? (
                          <p className="text-slate-400 bg-slate-800/40 rounded p-1 leading-relaxed">
                            {workoutNotes[log.exercise_name].substring(0, 100)}...
                          </p>
                        ) : (
                          <p className="text-slate-600 italic text-[10px]">No notes</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Expand for Details */}
        {expanded && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Split</span>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                {currentUser.workout_split}
              </Badge>
            </div>
            {currentUser.training_days && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Training Days</span>
                <span className="text-white font-semibold">{currentUser.training_days}</span>
              </div>
            )}
            {currentUser.weekly_goal && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Weekly Goal</span>
                <span className="text-white font-semibold">{currentUser.weekly_goal}x/week</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}