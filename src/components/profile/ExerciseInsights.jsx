import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Target, Clock, Activity } from 'lucide-react';

const CARD_STYLE = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.90) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
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
    return Object.entries(dayVolumes)
      .map(([day, volume]) => ({ day, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume);
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
    return Object.entries(records)
      .map(([exercise, data]) => ({ exercise, weight: data.weight, date: data.date }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [workoutLogs]);

  if (!workoutLogs.length) {
    return (
      <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}>
        <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <h4 className="text-lg font-black text-white mb-2">No Workout Data</h4>
        <p className="text-slate-500 text-sm">Log your workouts to see insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <div className="rounded-2xl p-4 relative overflow-hidden" style={CARD_STYLE}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <h4 className="text-sm font-black text-white">Personal Records</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">Top 5</span>
          </div>
          <div className="space-y-3">
            {personalRecords.map((pr, idx) => (
              <div key={idx} className={`relative p-4 rounded-xl border ${
                idx === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' :
                idx === 1 ? 'bg-gradient-to-r from-slate-400/10 to-slate-500/10 border-slate-400/30' :
                idx === 2 ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30' :
                'bg-slate-800/40 border-slate-700/40'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg ${
                      idx === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600 text-white' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' :
                      'bg-slate-700 text-slate-300'}`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-white font-black text-sm truncate max-w-[180px]">{pr.exercise}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <p className="text-[10px] text-slate-500">{pr.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{pr.weight}</p>
                    <p className="text-xs text-slate-500 font-semibold">kg</p>
                  </div>
                </div>
                {idx === 0 && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volume by Split Day */}
      {volumeByDay.length > 0 && (
        <div className="rounded-2xl p-4" style={CARD_STYLE}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-black text-white">Volume by Split Day</h4>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volumeByDay} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#475569" fontSize={10} tick={{ fill: '#64748b' }} />
              <YAxis type="category" dataKey="day" stroke="#475569" fontSize={10} width={72} tick={{ fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="volume" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total Volume (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}