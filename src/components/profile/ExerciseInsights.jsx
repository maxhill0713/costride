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



      {/* Volume by Split Day */}
      















      

    </div>);

}