import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Activity, BarChart3, Calendar, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WorkoutProgressTracker({ currentUser }) {
  const [selectedDay, setSelectedDay] = useState('all');

  const { data: workoutLogs = [] } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: async () => {
      const logs = await base44.entities.WorkoutLog.filter({
        user_id: currentUser.id
      });
      return logs.sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date));
    },
    enabled: !!currentUser?.id
  });

  // Get unique days from user's split
  const splitDays = currentUser?.custom_workout_types ? Object.keys(currentUser.custom_workout_types).map(Number).sort() : [];

  // Filter logs based on selection
  let filteredLogs = workoutLogs;
  if (selectedDay !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.day_of_week === parseInt(selectedDay));
  }

  // Calculate comprehensive exercise analytics
  const getExerciseAnalytics = () => {
    const exerciseMap = new Map();

    filteredLogs.forEach(log => {
      log.exercises?.forEach(exercise => {
        if (!exerciseMap.has(exercise.exercise)) {
          exerciseMap.set(exercise.exercise, []);
        }
        exerciseMap.get(exercise.exercise).push({
          weight: parseFloat(exercise.weight) || 0,
          date: log.completed_date,
          setsReps: exercise.setsReps
        });
      });
    });

    // Calculate detailed analytics for each exercise
    return Array.from(exerciseMap.entries()).map(([exerciseName, records]) => {
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const latest = records[records.length - 1];
      const previous = records[records.length - 2];
      const firstRecord = records[0];
      
      // Calculate week-over-week progress
      const lastWeekRecords = records.filter(r => {
        const date = new Date(r.date);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return date >= oneWeekAgo;
      });

      // Overall progress from first to latest
      const totalProgress = latest.weight - firstRecord.weight;
      const totalProgressPercentage = firstRecord.weight > 0 
        ? ((totalProgress / firstRecord.weight) * 100).toFixed(1) 
        : 0;

      // Recent progress (latest vs previous)
      let recentProgress = null;
      if (previous && latest) {
        const change = latest.weight - previous.weight;
        recentProgress = {
          change,
          percentage: previous.weight > 0 ? ((change / previous.weight) * 100).toFixed(1) : 0,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
        };
      }

      // Calculate average weight and consistency
      const avgWeight = records.reduce((sum, r) => sum + r.weight, 0) / records.length;
      const consistency = records.length;
      
      // Peak performance
      const peakWeight = Math.max(...records.map(r => r.weight));
      const peakRecord = records.find(r => r.weight === peakWeight);

      return {
        name: exerciseName,
        latest,
        previous,
        firstRecord,
        recentProgress,
        totalProgress,
        totalProgressPercentage,
        avgWeight: avgWeight.toFixed(1),
        consistency,
        peakWeight,
        peakDate: peakRecord?.date,
        history: records,
        weeklyAverage: lastWeekRecords.length > 0 
          ? (lastWeekRecords.reduce((sum, r) => sum + r.weight, 0) / lastWeekRecords.length).toFixed(1)
          : null
      };
    }).filter(ex => ex.latest).sort((a, b) => b.consistency - a.consistency);
  };

  const exerciseAnalytics = getExerciseAnalytics();

  // Calculate summary statistics
  const totalLifts = filteredLogs.length;
  const exercisesImproving = exerciseAnalytics.filter(e => e.recentProgress?.direction === 'up').length;
  const totalExercises = exerciseAnalytics.length;
  const avgConsistency = totalExercises > 0 
    ? (exerciseAnalytics.reduce((sum, e) => sum + e.consistency, 0) / totalExercises).toFixed(1) 
    : 0;

  if (workoutLogs.length === 0) {
    return (
      <Card className="bg-slate-800/60 border border-slate-600/40 p-6 rounded-2xl text-center">
        <Activity className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No workout data yet</p>
        <p className="text-slate-500 text-sm mt-1">Complete workouts to see detailed analytics</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/60 border border-slate-600/40 p-4 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Performance Analytics</h3>
        </div>
        {splitDays.length > 0 && (
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-36 h-8 text-xs bg-slate-700/50 border-slate-600/40 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workouts</SelectItem>
              {splitDays.map(day => (
                <SelectItem key={day} value={day.toString()}>
                  {currentUser.custom_workout_types[day]?.name || 'Training'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-300">{totalLifts}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">Total Sessions</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-300">{exercisesImproving}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">Improving</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-300">{totalExercises}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">Exercises</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-300">{avgConsistency}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-0.5">Avg Sessions</div>
        </div>
      </div>

      {/* Exercise Analytics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-slate-400" />
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Exercise Breakdown</div>
        </div>
        
        {exerciseAnalytics.length === 0 ? (
          <div className="p-4 bg-slate-700/50 rounded-lg text-center">
            <p className="text-slate-400 text-sm">No exercises tracked yet</p>
          </div>
        ) : (
          exerciseAnalytics.map((exercise, index) => (
            <div key={index} className="bg-slate-700/40 border border-slate-600/30 rounded-xl p-3 hover:bg-slate-700/60 transition-all">
              {/* Exercise Name & Status */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-white mb-1">{exercise.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] px-1.5 py-0 bg-slate-600/50 text-slate-300 border-slate-500/50">
                      <Calendar className="w-2.5 h-2.5 mr-1" />
                      {exercise.consistency} sessions
                    </Badge>
                    {exercise.recentProgress && (
                      <Badge 
                        className={`text-[9px] px-1.5 py-0 ${
                          exercise.recentProgress.direction === 'up' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/40' 
                            : exercise.recentProgress.direction === 'down'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
                        }`}
                      >
                        {exercise.recentProgress.direction === 'up' && <TrendingUp className="w-2.5 h-2.5 mr-1" />}
                        {exercise.recentProgress.direction === 'down' && <TrendingDown className="w-2.5 h-2.5 mr-1" />}
                        {exercise.recentProgress.percentage}%
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Total Progress Badge */}
                {exercise.totalProgress !== 0 && (
                  <div className={`text-right ${exercise.totalProgress > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="text-lg font-bold">
                      {exercise.totalProgress > 0 ? '+' : ''}{exercise.totalProgress}kg
                    </div>
                    <div className="text-[9px] text-slate-400">lifetime</div>
                  </div>
                )}
              </div>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="text-xs font-bold text-white">{exercise.latest.weight}kg</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Current</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="text-xs font-bold text-amber-400">{exercise.peakWeight}kg</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Peak</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="text-xs font-bold text-blue-400">{exercise.avgWeight}kg</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Average</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="text-xs font-bold text-purple-400">{exercise.latest.setsReps}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Volume</div>
                </div>
              </div>

              {/* Progress Comparison */}
              {exercise.previous && (
                <div className="mt-3 pt-3 border-t border-slate-600/30">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="text-slate-400">
                      Previous: <span className="text-slate-300 font-semibold">{exercise.previous.weight}kg × {exercise.previous.setsReps}</span>
                    </div>
                    {exercise.recentProgress && exercise.recentProgress.change !== 0 && (
                      <div className={`font-semibold ${exercise.recentProgress.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {exercise.recentProgress.change > 0 ? '+' : ''}{exercise.recentProgress.change}kg change
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}