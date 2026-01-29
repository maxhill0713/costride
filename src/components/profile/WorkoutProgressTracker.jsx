import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Activity, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function WorkoutProgressTracker({ currentUser }) {
  const [selectedWorkout, setSelectedWorkout] = useState('all');
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

  // Group logs by workout name
  const workoutGroups = workoutLogs.reduce((acc, log) => {
    if (!acc[log.workout_name]) {
      acc[log.workout_name] = [];
    }
    acc[log.workout_name].push(log);
    return acc;
  }, {});

  const workoutNames = Object.keys(workoutGroups);

  // Get unique days from user's split
  const splitDays = currentUser?.custom_workout_types ? Object.keys(currentUser.custom_workout_types).map(Number).sort() : [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Filter logs based on selection
  let filteredLogs = workoutLogs;
  if (selectedWorkout !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.workout_name === selectedWorkout);
  }
  if (selectedDay !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.day_of_week === parseInt(selectedDay));
  }

  // Calculate progress for each exercise
  const getExerciseProgress = () => {
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

    // Calculate progress for each exercise
    return Array.from(exerciseMap.entries()).map(([exerciseName, records]) => {
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const latest = records[records.length - 1];
      const previous = records[records.length - 2];
      
      let progress = null;
      if (previous && latest) {
        const change = latest.weight - previous.weight;
        progress = {
          change,
          percentage: previous.weight > 0 ? ((change / previous.weight) * 100).toFixed(1) : 0,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
        };
      }

      return {
        name: exerciseName,
        latest,
        previous,
        progress,
        history: records
      };
    }).filter(ex => ex.latest);
  };

  const exerciseProgress = getExerciseProgress();

  if (workoutLogs.length === 0) {
    return (
      <Card className="bg-slate-800/60 border border-slate-600/40 p-6 rounded-2xl text-center">
        <Activity className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No workout logs yet</p>
        <p className="text-slate-500 text-sm mt-1">Complete a workout to track your progress</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/60 border border-slate-600/40 p-4 rounded-2xl">
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Workout Progress</h3>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2">
          {splitDays.length > 0 && (
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="flex-1 h-7 text-xs bg-slate-700/50 border-slate-600/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {splitDays.map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    {dayNames[day - 1]} - {currentUser.custom_workout_types[day]?.name || 'Training'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {workoutNames.length > 1 && (
            <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
              <SelectTrigger className="flex-1 h-7 text-xs bg-slate-700/50 border-slate-600/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workouts</SelectItem>
                {workoutNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-purple-400">{workoutLogs.length}</div>
          <div className="text-[9px] text-slate-400 font-medium">Total Logs</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-green-400">
            {exerciseProgress.filter(e => e.progress?.direction === 'up').length}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">Improved</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-2 text-center">
          <div className="text-xl font-bold text-blue-400">
            {new Set(filteredLogs.flatMap(log => log.exercises?.map(e => e.exercise) || [])).size}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">Exercises</div>
        </div>
      </div>

      {/* Exercise Progress List */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Exercise Progress
        </div>
        {exerciseProgress.length === 0 ? (
          <div className="p-3 bg-slate-700/50 rounded-lg text-center">
            <p className="text-slate-400 text-xs">No exercises logged yet</p>
          </div>
        ) : (
          exerciseProgress.map((exercise, index) => (
            <div key={index} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/30">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-white">{exercise.name}</span>
                {exercise.progress && (
                  <Badge 
                    className={`text-[10px] px-1.5 py-0 ${
                      exercise.progress.direction === 'up' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : exercise.progress.direction === 'down'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {exercise.progress.direction === 'up' && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
                    {exercise.progress.direction === 'down' && <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                    {exercise.progress.change > 0 ? '+' : ''}{exercise.progress.change}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">Current</div>
                  <div className="font-semibold text-slate-200">
                    {exercise.latest.weight} × {exercise.latest.setsReps}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {new Date(exercise.latest.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                {exercise.previous && (
                  <div>
                    <div className="text-[10px] text-slate-400 mb-0.5">Previous</div>
                    <div className="font-medium text-slate-300">
                      {exercise.previous.weight} × {exercise.previous.setsReps}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {new Date(exercise.previous.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                )}
              </div>

              {/* History indicator */}
              {exercise.history.length > 2 && (
                <div className="mt-2 pt-2 border-t border-slate-600/30">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{exercise.history.length} sessions tracked</span>
                    <div className="flex items-center gap-1">
                      <span>View history</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
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