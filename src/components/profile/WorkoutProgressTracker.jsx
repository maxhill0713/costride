import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Activity, ChevronRight, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

export default function WorkoutProgressTracker({ currentUser }) {
  const [selectedWorkout, setSelectedWorkout] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [todayWorkoutLogged, setTodayWorkoutLogged] = useState(null);

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

  // Subscribe to real-time workout log changes
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = base44.entities.WorkoutLog.subscribe((event) => {
      if (event.data?.user_id === currentUser.id) {
        const today = new Date().toISOString().split('T')[0];
        if (event.data?.completed_date === today) {
          setTodayWorkoutLogged(event.data);
        }
      }
    });

    return unsubscribe;
  }, [currentUser?.id]);

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
          setsReps: exercise.setsReps,
          notes: log.notes
        });
      });
    });

    // Calculate progress for each exercise
    return Array.from(exerciseMap.entries()).map(([exerciseName, records]) => {
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const latest = records[records.length - 1];
      const previous = records[records.length - 2];
      const first = records[0];
      
      let progressFromPrevious = null;
      if (previous && latest) {
        const change = (latest.weight - previous.weight).toFixed(1);
        progressFromPrevious = {
          change,
          percentage: previous.weight > 0 ? (((latest.weight - previous.weight) / previous.weight) * 100).toFixed(1) : 0,
          direction: latest.weight > previous.weight ? 'up' : latest.weight < previous.weight ? 'down' : 'same'
        };
      }

      let progressFromFirst = null;
      if (first && latest && records.length > 1 && first !== latest) {
        const change = latest.weight - first.weight;
        progressFromFirst = {
          change,
          percentage: first.weight > 0 ? ((change / first.weight) * 100).toFixed(1) : 0,
          direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
        };
      }

      return {
        name: exerciseName,
        latest,
        previous,
        first,
        progressFromPrevious,
        progressFromFirst,
        history: records
      };
    }).filter(ex => ex.latest);
  };

  const exerciseProgress = getExerciseProgress();

  if (workoutLogs.length === 0) {
    return (
      <Card className="bg-slate-900/70 border border-purple-500/30 p-6 rounded-2xl text-center">
        <Activity className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No workout logs yet</p>
        <p className="text-slate-500 text-sm mt-1">Complete a workout to track your progress</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/70 border border-purple-500/30 p-3 rounded-2xl">
      {todayWorkoutLogged && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-3 p-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-xl"
        >
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-green-300 font-semibold text-xs mb-1">Today's Workout Logged! ✓</p>
              {todayWorkoutLogged.exercises?.length > 0 && (
                <div className="space-y-1.5">
                  {todayWorkoutLogged.exercises.slice(0, 3).map((exercise, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-[10px] bg-white/5 p-1.5 rounded-lg">
                      <span className="text-green-200 font-medium">{exercise.exercise}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-300 font-bold">{exercise.weight}kg</span>
                        <span className="text-green-400/70">{exercise.setsReps}</span>
                      </div>
                    </div>
                  ))}
                  {todayWorkoutLogged.exercises.length > 3 && (
                    <div className="text-[9px] text-green-400/70 font-medium">
                      +{todayWorkoutLogged.exercises.length - 3} more exercises
                    </div>
                  )}
                  {todayWorkoutLogged.notes && (
                    <div className="mt-2 pt-2 border-t border-green-500/20 flex gap-1.5 items-start">
                      <MessageSquare className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-green-200/80 text-[9px] line-clamp-2">{todayWorkoutLogged.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <h3 className="text-xs font-bold text-white">Workout Progress</h3>
        </div>
        
        {/* Filters */}
        <div className="flex gap-1.5">
          {splitDays.length > 0 && (
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="flex-1 h-6 text-[10px] bg-slate-700/50 border-slate-600/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                {splitDays.map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    {currentUser.custom_workout_types[day]?.name || 'Training'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {workoutNames.length > 1 && (
            <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
              <SelectTrigger className="flex-1 h-6 text-[10px] bg-slate-700/50 border-slate-600/40 text-white">
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
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="bg-slate-700/50 rounded-lg p-1.5 text-center">
          <div className="text-base font-bold text-purple-400">{workoutLogs.length}</div>
          <div className="text-[8px] text-slate-400 font-medium">Logs</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-1.5 text-center">
          <div className="text-base font-bold text-green-400">
            {exerciseProgress.filter(e => e.progressFromPrevious?.direction === 'up').length}
          </div>
          <div className="text-[8px] text-slate-400 font-medium">Up</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-1.5 text-center">
          <div className="text-base font-bold text-blue-400">
            {new Set(filteredLogs.flatMap(log => log.exercises?.map(e => e.exercise) || [])).size}
          </div>
          <div className="text-[8px] text-slate-400 font-medium">Exercises</div>
        </div>
      </div>

      {/* Exercise Progress List */}
      <div className="space-y-1.5">
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Exercises
        </div>
        {exerciseProgress.length === 0 ? (
          <div className="p-2 bg-slate-700/50 rounded-lg text-center">
            <p className="text-slate-400 text-[10px]">No exercises logged yet</p>
          </div>
        ) : (
          exerciseProgress.slice(0, 5).map((exercise, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className="p-2 bg-slate-700/50 rounded-lg border border-slate-600/30 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-semibold text-white">{exercise.name}</span>
                <div className="flex gap-1">
                  {exercise.progressFromPrevious && (
                    <Badge 
                      className={`text-[9px] px-1 py-0 ${
                        exercise.progressFromPrevious.direction === 'up' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : exercise.progressFromPrevious.direction === 'down'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {exercise.progressFromPrevious.direction === 'up' && <TrendingUp className="w-2 h-2 mr-0.5" />}
                      {exercise.progressFromPrevious.direction === 'down' && <TrendingDown className="w-2 h-2 mr-0.5" />}
                      {exercise.progressFromPrevious.change > 0 ? '+' : ''}{exercise.progressFromPrevious.change}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-[10px] mb-1.5">
                {exercise.first && exercise.progressFromFirst && (
                  <div>
                    <div className="text-[8px] text-slate-400 mb-0.5">First Workout</div>
                    <div className="font-semibold text-slate-300 text-sm">
                      {exercise.first.weight}kg
                    </div>
                    <div className="text-[9px] text-slate-400">{exercise.first.setsReps}</div>
                  </div>
                )}
                {exercise.previous && (
                  <div>
                    <div className="text-[8px] text-slate-400 mb-0.5">Previous</div>
                    <div className="font-semibold text-slate-300 text-sm">
                      {exercise.previous.weight}kg
                    </div>
                    <div className="text-[9px] text-slate-400">{exercise.previous.setsReps}</div>
                  </div>
                )}
                <div>
                  <div className="text-[8px] text-slate-400 mb-0.5">Current</div>
                  <div className="font-bold text-white text-sm">
                    {exercise.latest.weight}kg
                  </div>
                  <div className="text-[9px] text-slate-400">{exercise.latest.setsReps}</div>
                </div>
              </div>
              {exercise.latest.notes && (
                <div className="flex gap-1.5 items-start text-[9px] bg-purple-500/10 border border-purple-500/20 rounded-lg p-1.5">
                  <MessageSquare className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-purple-200/80 line-clamp-2">{exercise.latest.notes}</p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </Card>
  );
}