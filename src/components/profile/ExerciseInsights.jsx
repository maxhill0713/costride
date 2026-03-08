import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Calendar, Dumbbell, Zap, Target, Award, Activity, Flame, ArrowUp, ArrowDown, Minus, Trophy, Clock, Download, Share2, Settings, BarChart3, Sparkles, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function ExerciseInsights({ workoutLogs = [], workoutSplit, trainingDays = [] }) {
  const navigate = useNavigate();

  const workoutDays = useMemo(() => {
    if (!workoutSplit || typeof workoutSplit !== 'object') return [];
    return Object.entries(workoutSplit).
      filter(([dayNum, workout]) => workout && workout.name).
      map(([dayNum, workout]) => ({
        name: workout.name,
        dayNum: parseInt(dayNum),
        exercises: workout.exercises || []
      })).
      sort((a, b) => a.dayNum - b.dayNum);
  }, [workoutSplit]);

  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [timeRange, setTimeRange] = useState('30');
  const [viewMode, setViewMode] = useState('overview');

  const { exercises } = useMemo(() => {
    const exerciseSet = new Set();
    workoutLogs.forEach((log) => {
      log.exercises?.forEach((ex) => {
        if (ex.name) exerciseSet.add(ex.name);
      });
    });
    return { exercises: Array.from(exerciseSet).sort() };
  }, [workoutLogs]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const daysAgo = parseInt(timeRange);
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return workoutLogs.filter((log) => {
      const logDate = new Date(log.created_date);
      const inTimeRange = logDate >= cutoffDate;
      let matchesWorkoutDay = true;
      if (viewMode === 'exercises' && selectedWorkoutDay && selectedWorkoutDay !== 'all') {
        const workoutDay = workoutDays.find((d) => d.name === selectedWorkoutDay);
        if (workoutDay && workoutDay.exercises && workoutDay.exercises.length > 0) {
          const workoutExerciseNames = workoutDay.exercises.map((e) => e.name || e);
          const hasWorkoutExercise = log.exercises?.some((ex) => workoutExerciseNames.includes(ex.name));
          matchesWorkoutDay = hasWorkoutExercise || log.split_day === selectedWorkoutDay;
        } else {
          matchesWorkoutDay = log.split_day === selectedWorkoutDay;
        }
      }
      if (selectedExercise === 'all') return inTimeRange && matchesWorkoutDay;
      const hasExercise = log.exercises?.some((ex) => ex.name === selectedExercise);
      return inTimeRange && hasExercise && matchesWorkoutDay;
    });
  }, [workoutLogs, selectedExercise, timeRange, selectedWorkoutDay, workoutDays, viewMode]);

  const progressData = useMemo(() => {
    if (selectedExercise === 'all') return [];
    return filteredLogs.
      filter((log) => log.exercises?.some((ex) => (ex.exercise || ex.name) === selectedExercise)).
      map((log, idx) => {
        const exercise = log.exercises.find((ex) => (ex.exercise || ex.name) === selectedExercise);
        const weight = parseFloat(exercise?.weight) || 0;
        const reps = exercise?.setsReps ? parseInt(exercise.setsReps.split('x')[1] || exercise.setsReps) || 1 : 1;
        const sets = exercise?.setsReps ? parseInt(exercise.setsReps.split('x')[0]) || 1 : 1;
        return {
          session: `S${idx + 1}`,
          date: new Date(log.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          maxWeight: weight,
          volume: Math.round(weight * reps * sets)
        };
      }).slice(-10);
  }, [filteredLogs, selectedExercise]);

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

  const volumeProgression = useMemo(() => {
    if (!workoutLogs.length) return [];
    const dailyVolume = {};
    workoutLogs.forEach((log) => {
      const date = new Date(log.completed_date || log.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (!dailyVolume[date]) dailyVolume[date] = 0;
      if (log.exercises && Array.isArray(log.exercises)) {
        log.exercises.forEach((ex) => {
          const weight = parseFloat(ex.weight) || 0;
          const reps = ex.setsReps ? parseInt(ex.setsReps.split('x')[1] || ex.setsReps) || 1 : 1;
          const sets = ex.setsReps ? parseInt(ex.setsReps.split('x')[0]) || 1 : 1;
          dailyVolume[date] += weight * reps * sets;
        });
      }
    });
    return Object.entries(dailyVolume).
      map(([date, volume]) => ({ date, volume: Math.round(volume) })).
      slice(-14);
  }, [workoutLogs]);

  const personalRecords = useMemo(() => {
    const records = {};
    filteredLogs.forEach((log) => {
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
  }, [filteredLogs]);

  const topExercises = useMemo(() => {
    if (!workoutLogs.length) return [];
    const exerciseVolumes = {};
    workoutLogs.forEach((log) => {
      if (log.exercises && Array.isArray(log.exercises)) {
        log.exercises.forEach((ex) => {
          const exerciseName = ex.exercise || ex.name;
          if (!exerciseName) return;
          if (!exerciseVolumes[exerciseName]) exerciseVolumes[exerciseName] = 0;
          const weight = parseFloat(ex.weight) || 0;
          const reps = ex.setsReps ? parseInt(ex.setsReps.split('x')[1] || ex.setsReps) || 1 : 1;
          const sets = ex.setsReps ? parseInt(ex.setsReps.split('x')[0]) || 1 : 1;
          exerciseVolumes[exerciseName] += weight * reps * sets;
        });
      }
    });
    return Object.entries(exerciseVolumes).
      map(([exercise, volume]) => ({ exercise, volume: Math.round(volume) })).
      sort((a, b) => b.volume - a.volume).
      slice(0, 5);
  }, [workoutLogs]);

  // ─── TAB STYLE ────────────────────────────────────────────────────────────────
  const TAB_CLASS = "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3 py-1 font-extrabold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-xs transition-all duration-150 text-slate-400 hover:text-slate-300 data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500 data-[state=active]:via-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-[0_3px_0_0_#1a3fa8,0_6px_20px_rgba(59,130,246,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-[3px] active:scale-95 data-[state=active]:scale-100";

  const CARD_STYLE = {
    background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.90) 100%)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  return (
    <div className="space-y-3">

      {/* ── Filters bar ── */}
      <div className="rounded-2xl p-4" style={CARD_STYLE}>
        {/* Tab row */}
        <Tabs value={viewMode} onValueChange={setViewMode} className="mb-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/80 p-1 rounded-xl border border-slate-700/40">
            <TabsTrigger value="overview"  className={TAB_CLASS}>Overview</TabsTrigger>
            <TabsTrigger value="exercises" className={TAB_CLASS}>Exercises</TabsTrigger>
            <TabsTrigger value="records"   className={TAB_CLASS}>Records</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filter selects */}
        <div className="flex gap-2">
          {workoutDays.length > 0 && (
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Day</label>
              <Select value={selectedWorkoutDay} onValueChange={setSelectedWorkoutDay}>
                <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {workoutDays.map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex-1">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Range</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">3 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exercises.length > 0 && viewMode === 'exercises' && (
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Exercise</label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">All</SelectItem>
                  {exercises.map((ex) => <SelectItem key={ex} value={ex}>{ex}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* ── OVERVIEW ── */}
      {viewMode === 'overview' && (
        <>
          {workoutLogs.length > 0 ? (
            <>
              {/* Volume Progression */}
              {volumeProgression.length > 0 && (
                <div className="rounded-2xl p-4" style={CARD_STYLE}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <h4 className="text-sm font-black text-white">Volume Trend</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last 14 days</span>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={volumeProgression}>
                      <defs>
                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tick={{ fill: '#64748b' }} />
                      <YAxis stroke="#475569" fontSize={10} tick={{ fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                      <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#volGrad)" name="Volume (kg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Volume by Split Day */}
              {volumeByDay.length > 0 && (
                <div className="rounded-2xl p-4" style={CARD_STYLE}>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-black text-white">Volume by Split Day</h4>
                  </div>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={volumeByDay} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#475569" fontSize={10} tick={{ fill: '#64748b' }} />
                        <YAxis type="category" dataKey="day" stroke="#475569" fontSize={10} width={72} tick={{ fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                        <Bar dataKey="volume" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total Volume (kg)" />
                      </BarChart>
                    </ResponsiveContainer>
                    {/* Paywall */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/40 to-black/70 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                        <p className="text-sm font-bold text-white mb-3">Unlock split-specific volume progress</p>
                        <Button onClick={() => navigate(createPageUrl('Premium'))} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 h-auto rounded-lg">
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl p-10 text-center" style={CARD_STYLE}>
              <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <h4 className="text-lg font-black text-white mb-2">No Workout Data</h4>
              <p className="text-slate-500 text-sm">Log your workouts to see detailed insights and track your progress.</p>
            </div>
          )}
        </>
      )}

      {/* ── EXERCISES ── */}
      {viewMode === 'exercises' && (
        <>
          {topExercises.length > 0 ? (
            <div className="rounded-2xl p-4" style={CARD_STYLE}>
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-black text-white">Top Exercises by Volume</h4>
              </div>
              <div className="space-y-3">
                {topExercises.map((ex, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-slate-700/40 text-slate-400'}`}>
                          {idx + 1}
                        </div>
                        <span className="text-sm font-semibold text-white truncate max-w-[180px]">{ex.exercise}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{ex.volume.toLocaleString()}<span className="text-xs text-slate-500 ml-1">kg</span></span>
                    </div>
                    <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        idx === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                        idx === 2 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                        'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                        style={{ width: `${ex.volume / topExercises[0].volume * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={CARD_STYLE}>
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <h4 className="text-base font-black text-white mb-2">No Exercise Data</h4>
              <p className="text-slate-500 text-sm">No exercises found for the selected workout day and time range.</p>
            </div>
          )}

          {selectedExercise !== 'all' && progressData.length > 0 && (
            <div className="rounded-2xl p-4" style={CARD_STYLE}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-orange-400" />
                  <h4 className="text-sm font-black text-white">{selectedExercise}</h4>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last 10 sessions</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-2">Max Weight</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tick={{ fill: '#64748b' }} />
                      <YAxis stroke="#475569" fontSize={10} tick={{ fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="maxWeight" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 3 }} name="Max Weight (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-2">Total Volume</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#475569" fontSize={10} tick={{ fill: '#64748b' }} />
                      <YAxis stroke="#475569" fontSize={10} tick={{ fill: '#64748b' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Volume (kg)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── RECORDS ── */}
      {viewMode === 'records' && (
        <>
          {personalRecords.length > 0 ? (
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
          ) : (
            <div className="rounded-2xl p-8 text-center" style={CARD_STYLE}>
              <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <h4 className="text-base font-black text-white mb-2">No Records Yet</h4>
              <p className="text-slate-500 text-sm">Keep pushing your limits to set your first personal records!</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
