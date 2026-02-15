import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Dumbbell, Zap, Target, Award, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ExerciseInsights({ workoutLogs = [], workoutSplit, trainingDays = [] }) {
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [timeRange, setTimeRange] = useState('30');

  // Extract unique exercises and split days
  const { exercises, splitDays } = useMemo(() => {
    const exerciseSet = new Set();
    const daySet = new Set();

    workoutLogs.forEach(log => {
      if (log.split_day) daySet.add(log.split_day);
      log.exercises?.forEach(ex => {
        if (ex.name) exerciseSet.add(ex.name);
      });
    });

    return {
      exercises: Array.from(exerciseSet).sort(),
      splitDays: Array.from(daySet).sort()
    };
  }, [workoutLogs]);

  // Filter logs based on selections
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return workoutLogs.filter(log => {
      const logDate = new Date(log.created_date);
      const inTimeRange = logDate >= cutoffDate;
      const matchesDay = selectedDay === 'all' || log.split_day === selectedDay;
      
      if (selectedExercise === 'all') {
        return inTimeRange && matchesDay;
      }
      
      const hasExercise = log.exercises?.some(ex => ex.name === selectedExercise);
      return inTimeRange && matchesDay && hasExercise;
    });
  }, [workoutLogs, selectedDay, selectedExercise, timeRange]);

  // Calculate exercise progress data
  const progressData = useMemo(() => {
    if (selectedExercise === 'all') return [];

    return filteredLogs
      .filter(log => log.exercises?.some(ex => ex.name === selectedExercise))
      .map((log, idx) => {
        const exercise = log.exercises.find(ex => ex.name === selectedExercise);
        const maxWeight = Math.max(...(exercise?.sets?.map(s => parseFloat(s.weight) || 0) || [0]));
        const totalVolume = exercise?.sets?.reduce((sum, set) => {
          return sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }, 0) || 0;

        return {
          session: `S${idx + 1}`,
          date: new Date(log.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          maxWeight: maxWeight,
          volume: Math.round(totalVolume)
        };
      })
      .slice(-10); // Last 10 sessions
  }, [filteredLogs, selectedExercise]);

  // Volume by split day
  const volumeByDay = useMemo(() => {
    const dayVolumes = {};

    filteredLogs.forEach(log => {
      const day = log.split_day || 'Other';
      if (!dayVolumes[day]) dayVolumes[day] = 0;

      log.exercises?.forEach(ex => {
        const volume = ex.sets?.reduce((sum, set) => {
          return sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }, 0) || 0;
        dayVolumes[day] += volume;
      });
    });

    return Object.entries(dayVolumes)
      .map(([day, volume]) => ({
        day: day,
        volume: Math.round(volume)
      }))
      .sort((a, b) => b.volume - a.volume);
  }, [filteredLogs]);

  // Frequency analysis
  const frequencyData = useMemo(() => {
    if (!workoutLogs.length) return { total: 0, avgPerWeek: 0, mostActiveDay: 'N/A' };

    const daysAgo = parseInt(timeRange);
    const weeks = daysAgo / 7;
    const avgPerWeek = Math.round(filteredLogs.length / weeks * 10) / 10;

    const dayCount = {};
    filteredLogs.forEach(log => {
      const day = log.split_day || 'Other';
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      total: filteredLogs.length,
      avgPerWeek,
      mostActiveDay
    };
  }, [filteredLogs, timeRange, workoutLogs.length]);

  // Personal records
  const personalRecords = useMemo(() => {
    const records = {};

    workoutLogs.forEach(log => {
      log.exercises?.forEach(ex => {
        if (!ex.name || !ex.sets) return;
        
        const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.weight) || 0));
        
        if (!records[ex.name] || maxWeight > records[ex.name].weight) {
          records[ex.name] = {
            weight: maxWeight,
            date: new Date(log.created_date)
          };
        }
      });
    });

    return Object.entries(records)
      .map(([exercise, data]) => ({
        exercise,
        weight: data.weight,
        date: data.date
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [workoutLogs]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Exercise Insights</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 font-semibold mb-2 block">Time Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {splitDays.length > 0 && (
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-2 block">Split Day</label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {splitDays.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {exercises.length > 0 && (
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-2 block">Exercise</label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All Exercises</SelectItem>
                  {exercises.map(ex => (
                    <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 backdrop-blur-xl border border-blue-500/30 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400 font-semibold">Sessions</span>
          </div>
          <div className="text-2xl font-bold text-white">{frequencyData.total}</div>
          <p className="text-xs text-blue-300 mt-1">{frequencyData.avgPerWeek}/week avg</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/40 backdrop-blur-xl border border-purple-500/30 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400 font-semibold">Most Active</span>
          </div>
          <div className="text-lg font-bold text-white truncate">{frequencyData.mostActiveDay}</div>
          <p className="text-xs text-purple-300 mt-1">Split day</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/40 to-green-950/40 backdrop-blur-xl border border-green-500/30 p-3 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400 font-semibold">PRs</span>
          </div>
          <div className="text-2xl font-bold text-white">{personalRecords.length}</div>
          <p className="text-xs text-green-300 mt-1">Personal records</p>
        </Card>
      </div>

      {/* Exercise Progress Chart */}
      {selectedExercise !== 'all' && progressData.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm font-bold text-white">{selectedExercise} Progress</h4>
            </div>
            <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs">
              Last 10 Sessions
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Max Weight Chart */}
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-2">Max Weight</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="maxWeight" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    dot={{ fill: '#f97316', r: 4 }}
                    name="Max Weight (kg)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Volume Chart */}
            <div>
              <p className="text-xs text-slate-400 font-semibold mb-2">Total Volume</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="volume" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Volume (kg)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      )}

      {/* Volume by Split Day */}
      {volumeByDay.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-bold text-white">Volume by Split Day</h4>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeByDay} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                type="number" 
                stroke="#94a3b8" 
                fontSize={10}
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                type="category" 
                dataKey="day" 
                stroke="#94a3b8" 
                fontSize={10}
                width={80}
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="volume" 
                fill="#8b5cf6"
                radius={[0, 4, 4, 0]}
                name="Total Volume (kg)"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Personal Records */}
      {personalRecords.length > 0 && (
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-bold text-white">Top Personal Records</h4>
          </div>

          <div className="space-y-2">
            {personalRecords.map((pr, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                    idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                    idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700/40 text-slate-400'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm truncate max-w-[180px]">{pr.exercise}</p>
                    <p className="text-xs text-slate-400">
                      {pr.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{pr.weight}<span className="text-xs text-slate-400 ml-1">kg</span></p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {workoutLogs.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border-2 border-dashed border-white/10 p-10 text-center rounded-2xl shadow-2xl shadow-black/20">
          <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h4 className="text-lg font-bold text-white mb-2">No Workout Data Yet</h4>
          <p className="text-slate-400 text-sm">
            Start logging your workouts to see detailed insights and track your progress over time.
          </p>
        </Card>
      )}
    </div>
  );
}