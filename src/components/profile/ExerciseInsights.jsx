import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Calendar, Dumbbell, Zap, Target, Award, Activity, Flame, ArrowUp, ArrowDown, Minus, Trophy, Clock, Download, Share2, Settings, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ExerciseInsights({ workoutLogs = [], workoutSplit, trainingDays = [] }) {
  // Extract workout days from split using trainingDays and customWorkoutTypes
  const workoutDays = useMemo(() => {
    if (!workoutSplit || typeof workoutSplit !== 'object') return [];
    
    // workoutSplit is object like { 1: { name: 'Push', exercises: [...] }, 3: { name: 'Pull', exercises: [...] } }
    return Object.entries(workoutSplit)
      .filter(([dayNum, workout]) => workout && workout.name)
      .map(([dayNum, workout]) => ({
        name: workout.name,
        dayNum: parseInt(dayNum),
        exercises: workout.exercises || []
      }))
      .sort((a, b) => a.dayNum - b.dayNum);
  }, [workoutSplit]);

  // Get today's workout
  const getTodaysWorkout = () => {
    if (!workoutSplit) return null;
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNum = today === 0 ? 7 : today; // Convert to 1-7 format
    return workoutSplit[dayNum]?.name || null;
  };

  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(getTodaysWorkout() || workoutDays[0]?.name || '');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [timeRange, setTimeRange] = useState('30');
  const [viewMode, setViewMode] = useState('overview');

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
      
      // Filter by workout day ONLY when in Exercises tab
      let matchesWorkoutDay = true;
      if (viewMode === 'exercises' && selectedWorkoutDay) {
        const workoutDay = workoutDays.find(d => d.name === selectedWorkoutDay);
        if (workoutDay) {
          const workoutExercises = workoutDay.exercises.map(e => e.name || e);
          matchesWorkoutDay = log.exercises?.some(ex => workoutExercises.includes(ex.name));
        }
      }
      
      if (selectedExercise === 'all') {
        return inTimeRange && matchesDay && matchesWorkoutDay;
      }
      
      const hasExercise = log.exercises?.some(ex => ex.name === selectedExercise);
      return inTimeRange && matchesDay && hasExercise && matchesWorkoutDay;
    });
  }, [workoutLogs, selectedDay, selectedExercise, timeRange, selectedWorkoutDay, workoutDays, viewMode]);

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

  // Frequency analysis - filtered by workout day selection
  const frequencyData = useMemo(() => {
    if (!filteredLogs.length) return { total: 0, avgPerWeek: 0, mostActiveDay: 'N/A' };

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
  }, [filteredLogs, timeRange]);

  // Personal records - filtered by workout day selection
  const personalRecords = useMemo(() => {
    const records = {};

    filteredLogs.forEach(log => {
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
  }, [filteredLogs]);

  // Volume progression over time
  const volumeProgression = useMemo(() => {
    const dailyVolume = {};

    filteredLogs.forEach(log => {
      const date = new Date(log.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (!dailyVolume[date]) dailyVolume[date] = 0;

      log.exercises?.forEach(ex => {
        const volume = ex.sets?.reduce((sum, set) => {
          return sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }, 0) || 0;
        dailyVolume[date] += volume;
      });
    });

    return Object.entries(dailyVolume)
      .map(([date, volume]) => ({
        date,
        volume: Math.round(volume)
      }))
      .slice(-14); // Last 14 days
  }, [filteredLogs]);

  // Strength trends
  const strengthTrends = useMemo(() => {
    if (!filteredLogs.length) return { improving: 0, maintaining: 0, declining: 0 };

    const exerciseProgress = {};

    filteredLogs.forEach(log => {
      log.exercises?.forEach(ex => {
        if (!ex.name) return;
        if (!exerciseProgress[ex.name]) exerciseProgress[ex.name] = [];
        
        const maxWeight = Math.max(...(ex.sets?.map(s => parseFloat(s.weight) || 0) || [0]));
        exerciseProgress[ex.name].push(maxWeight);
      });
    });

    let improving = 0;
    let maintaining = 0;
    let declining = 0;

    Object.values(exerciseProgress).forEach(weights => {
      if (weights.length < 2) return;
      
      const recent = weights.slice(-3);
      const older = weights.slice(-6, -3);
      
      if (recent.length && older.length) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.05) improving++;
        else if (recentAvg < olderAvg * 0.95) declining++;
        else maintaining++;
      }
    });

    return { improving, maintaining, declining };
  }, [filteredLogs]);

  // Workout consistency - filtered by workout day selection
  const workoutStreak = useMemo(() => {
    if (!filteredLogs.length) return { current: 0, longest: 0 };

    const sortedDates = filteredLogs
      .map(log => new Date(log.created_date).toDateString())
      .filter((date, idx, arr) => arr.indexOf(date) === idx)
      .sort((a, b) => new Date(b) - new Date(a));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i]);
      const next = sortedDates[i + 1] ? new Date(sortedDates[i + 1]) : null;
      
      tempStreak++;
      
      if (next) {
        const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
        if (diffDays > 2) {
          longestStreak = Math.max(longestStreak, tempStreak);
          if (i === 0) currentStreak = tempStreak;
          tempStreak = 0;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        if (i === 0) currentStreak = tempStreak;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }, [filteredLogs]);

  // Top exercises by volume
  const topExercises = useMemo(() => {
    const exerciseVolumes = {};

    filteredLogs.forEach(log => {
      log.exercises?.forEach(ex => {
        if (!ex.name) return;
        if (!exerciseVolumes[ex.name]) exerciseVolumes[ex.name] = 0;
        
        const volume = ex.sets?.reduce((sum, set) => {
          return sum + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
        }, 0) || 0;
        
        exerciseVolumes[ex.name] += volume;
      });
    });

    return Object.entries(exerciseVolumes)
      .map(([exercise, volume]) => ({
        exercise,
        volume: Math.round(volume)
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [filteredLogs]);

  return (
    <div className="space-y-4">
      {/* Header with View Tabs */}
      <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exercise Analytics</h3>
              <p className="text-xs text-slate-400">Track your progress & performance</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{frequencyData.total}</div>
            <p className="text-[10px] text-slate-400">workouts</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Tabs value={viewMode} onValueChange={setViewMode} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 p-1 rounded-lg">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="exercises" className="text-xs">Exercises</TabsTrigger>
              <TabsTrigger value="records" className="text-xs">Records</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white h-9">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700">
              <DropdownMenuItem 
                onClick={() => toast.info('Export feature coming soon!')}
                className="text-white hover:bg-slate-800 cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 text-blue-400" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => toast.info('Share feature coming soon!')}
                className="text-white hover:bg-slate-800 cursor-pointer"
              >
                <Share2 className="w-4 h-4 mr-2 text-green-400" />
                Share Progress
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem 
                onClick={() => toast.info('Detailed stats coming soon!')}
                className="text-white hover:bg-slate-800 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 mr-2 text-purple-400" />
                View Detailed Stats
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {workoutDays.length > 0 && viewMode === 'exercises' && (
            <div>
              <label className="text-xs text-slate-400 font-semibold mb-2 block">Workout Day</label>
              <Select value={selectedWorkoutDay} onValueChange={setSelectedWorkoutDay}>
                <SelectTrigger className="bg-slate-800/60 border-slate-600/40 text-white h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workoutDays.map(day => (
                    <SelectItem key={day.name} value={day.name}>{day.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          {exercises.length > 0 && viewMode === 'exercises' && (
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

      {/* Overview View */}
      {viewMode === 'overview' && (
        <>

          {/* Strength Progress Indicators */}
          <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl shadow-black/20">
            <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              Strength Progress
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                <ArrowUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{strengthTrends.improving}</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Improving</p>
              </div>
              <div className="text-center p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Minus className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{strengthTrends.maintaining}</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Stable</p>
              </div>
              <div className="text-center p-2.5 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <ArrowDown className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{strengthTrends.declining}</div>
                <p className="text-[10px] text-slate-400 mt-0.5">Declining</p>
              </div>
            </div>
          </Card>

          {/* Volume Progression Chart */}
          {volumeProgression.length > 0 && (
            <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  Training Volume Trend
                </h4>
                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                  Last 14 Days
                </Badge>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={volumeProgression}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
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
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    fill="url(#volumeGradient)"
                    name="Volume (kg)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      {/* Exercises View */}
      {viewMode === 'exercises' && (
        <>
          {/* Top Exercises by Volume */}
          {topExercises.length > 0 ? (
            <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-400" />
                Top Exercises by Volume
              </h4>
              <div className="space-y-3">
                {topExercises.map((ex, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-slate-700/40 text-slate-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="text-sm font-semibold text-white truncate max-w-[180px]">{ex.exercise}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{ex.volume.toLocaleString()}<span className="text-xs text-slate-400 ml-1">kg</span></span>
                    </div>
                    <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          idx === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                          idx === 2 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                          'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                        style={{ width: `${(ex.volume / topExercises[0].volume) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border-2 border-dashed border-white/10 p-8 text-center rounded-2xl shadow-2xl shadow-black/20">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <h4 className="text-base font-bold text-white mb-2">No Exercise Data</h4>
              <p className="text-slate-400 text-sm">
                No exercises found for the selected workout day and time range.
              </p>
            </Card>
          )}

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
        </>
      )}

      {/* Records View */}
      {viewMode === 'records' && (
        <>
              {/* Personal Records */}
          {personalRecords.length > 0 ? (
            <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-sm font-bold text-white">Personal Records</h4>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs">
                  Top 5
                </Badge>
              </div>

              <div className="space-y-3">
                {personalRecords.map((pr, idx) => (
                  <div key={idx} className={`relative p-4 rounded-xl border ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' :
                    idx === 1 ? 'bg-gradient-to-r from-slate-400/10 to-slate-500/10 border-slate-400/30' :
                    idx === 2 ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30' :
                    'bg-slate-800/40 border-slate-700/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600 text-white' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-white font-bold text-base truncate max-w-[200px]">{pr.exercise}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-400">
                              {pr.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">{pr.weight}</p>
                        <p className="text-xs text-slate-400 font-semibold">kg</p>
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
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border-2 border-dashed border-white/10 p-8 text-center rounded-2xl shadow-2xl shadow-black/20">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <h4 className="text-base font-bold text-white mb-2">No Records Yet</h4>
              <p className="text-slate-400 text-sm">
                Keep pushing your limits to set your first personal records!
              </p>
            </Card>
          )}
        </>
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