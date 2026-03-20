import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Target, Clock, Activity } from 'lucide-react';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.90) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)'
};

export default function ExerciseInsights({ workoutLogs = [], workoutSplit, trainingDays = [] }) {

  const volumeByDay = useMemo(() => {
    if (!workoutLogs.length) return [];
    const dayVolumes = {};
    workoutLogs.forEach((log) => {
      const day = log.split_day || log.workout_name || 'Other';
      if (!dayVolumes[day]) dayVolumes[day] = 0;
      if (log.exercises && Array.isArray(log.exercises)) {
        log.exercises.forEach((ex) => {
          const weight = parseFloat(ex.weight) || 0;
          const reps = ex.setsReps ? parseInt(ex.setsReps.split('x')[1] || ex.setsReps) || 1 : 1;
          const sets = ex.setsReps ? parseInt(ex.setsReps.split('x')[0]) || 1 : 1;
          dayVolumes[day] += weight * reps * sets;
        });
      }
    });
    return Object.entries(dayVolumes).
    map(([day, volume]) => ({ day, volume: Math.round(volume) })).
    sort((a, b) => b.volume - a.volume);
  }, [workoutLogs]);

  const personalRecords = useMemo(() => {
    const records = {};
    workoutLogs.forEach((log) => {
      log.exercises?.forEach((ex) => {
        const exerciseName = ex.exercise || ex.name;
        if (!exerciseName) return;
        const weight = parseFloat(ex.weight) || 0;
        if (!records[exerciseName] || weight > records[exerciseName].weight) {
          records[exerciseName] = { weight, date: new Date(log.created_date) };
        }
      });
    });
    return Object.entries(records).
    map(([exercise, data]) => ({ exercise, weight: data.weight, date: data.date })).
    sort((a, b) => b.weight - a.weight).
    slice(0, 5);
  }, [workoutLogs]);

  if (!workoutLogs.length) {
    return (
      <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}>
        <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <h4 className="text-lg font-black text-white mb-2">No Workout Data</h4>
        <p className="text-slate-500 text-sm">Log your workouts to see insights.</p>
      </div>);

  }

  return (
    <div className="space-y-4">

      {/* Personal Records */}
      {personalRecords.length > 0 &&
      <div className="rounded-2xl p-5 relative overflow-hidden" style={CARD_STYLE}>
  {/* Subtle ambient glow at top */}
  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
  
  {/* Header */}
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/25 flex items-center justify-center">
        <Trophy className="w-4 h-4 text-yellow-400" />
      </div>
      <h4 className="text-sm font-black text-white tracking-wide">Personal Records</h4>
    </div>
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 tracking-wider uppercase">
      Top 5
    </span>
  </div>

  {/* Records List */}
  <div className="space-y-2">
    {personalRecords.map((pr, idx) => {
            const rankConfig = [
            { bg: 'from-yellow-500/[0.08] to-orange-500/[0.06]', border: 'border-yellow-500/25', badge: 'from-yellow-400 to-orange-500', text: 'text-yellow-400', label: '🥇' },
            { bg: 'from-slate-400/[0.06] to-slate-600/[0.04]', border: 'border-slate-500/25', badge: 'from-slate-300 to-slate-500', text: 'text-slate-300', label: '🥈' },
            { bg: 'from-orange-600/[0.07] to-amber-700/[0.05]', border: 'border-orange-600/25', badge: 'from-orange-400 to-amber-600', text: 'text-orange-400', label: '🥉' },
            { bg: 'from-slate-700/40 to-slate-800/30', border: 'border-slate-700/40', badge: 'from-slate-600 to-slate-700', text: 'text-slate-400', label: null },
            { bg: 'from-slate-700/40 to-slate-800/30', border: 'border-slate-700/40', badge: 'from-slate-600 to-slate-700', text: 'text-slate-400', label: null }][
            idx] ?? { bg: 'from-slate-700/40 to-slate-800/30', border: 'border-slate-700/40', badge: 'from-slate-600 to-slate-700', text: 'text-slate-400', label: null };

            return (
              <div
                key={idx}
                className={`relative flex items-center gap-3 p-3.5 rounded-xl border bg-gradient-to-r ${rankConfig.bg} ${rankConfig.border} transition-all duration-200 hover:scale-[1.01] hover:brightness-110`}>
                
          {/* Rank Badge */}
          <div className={`shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${rankConfig.badge} flex items-center justify-center shadow-md`}>
            <span className="text-xs font-black text-white">#{idx + 1}</span>
          </div>

          {/* Exercise Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate leading-tight">{pr.exercise}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5 text-slate-600" />
              <p className="text-[10px] text-slate-500 font-medium">
                {pr.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Weight */}
          <div className="shrink-0 text-right">
            <div className="flex items-baseline gap-0.5 justify-end">
              <span className={`text-xl font-black ${rankConfig.text}`}>{pr.weight}</span>
              <span className="text-[10px] text-slate-500 font-bold mb-0.5">kg</span>
            </div>
            {idx === 0 &&
                  <p className="text-[9px] text-yellow-500/70 font-bold uppercase tracking-wider">All Time</p>
                  }
          </div>

          {/* Top separator line for gold record */}
          {idx === 0 &&
                <div className="absolute bottom-0 left-3.5 right-3.5 h-px bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" />
                }
        </div>);

          })}
  </div>
</div>
      }

      {/* Volume by Split Day */}
      















      

    </div>);

}