import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Activity, ChevronRight, MessageSquare, Clock, FileText, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

export default function WorkoutProgressTracker({ currentUser }) {
  const [selectedWorkout, setSelectedWorkout] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [todayWorkoutLogged, setTodayWorkoutLogged] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);

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
          notes: log.notes,
          duration: log.duration
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

  // Calculate workout stats
  const totalWorkouts = filteredLogs.length;
  const workoutsWithNotes = filteredLogs.filter(log => log.notes && log.notes.trim()).length;
  const workoutsWithDuration = filteredLogs.filter(log => log.duration).length;
  
  // Calculate average duration (convert duration strings like "45m" to minutes)
  const avgDuration = workoutsWithDuration > 0 
    ? Math.round(filteredLogs
        .filter(log => log.duration)
        .reduce((sum, log) => {
          const match = log.duration.match(/(\d+)/);
          return sum + (match ? parseInt(match[1]) : 0);
        }, 0) / workoutsWithDuration)
    : 0;

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
    <Card className="bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-slate-950/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl shadow-black/20">
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
                  {(todayWorkoutLogged.duration || todayWorkoutLogged.notes) && (
                    <div className="mt-2 pt-2 border-t border-green-500/20 space-y-1.5">
                      {todayWorkoutLogged.duration && (
                        <div className="flex gap-1.5 items-center">
                          <Activity className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <p className="text-green-200/80 text-[9px] font-semibold">{todayWorkoutLogged.duration}</p>
                        </div>
                      )}
                      {todayWorkoutLogged.notes && (
                        <div className="flex gap-1.5 items-start">
                          <MessageSquare className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                          <p className="text-green-200/80 text-[9px] line-clamp-2">{todayWorkoutLogged.notes}</p>
                        </div>
                      )}
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
          <div className="rounded-lg bg-gradient-to-br from-orange-400/90 to-orange-500/90 w-8 h-8 flex items-center justify-center shadow-md shadow-orange-500/10">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xs font-bold text-slate-100 tracking-tight uppercase">Workout Progress</h3>
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

      {/* Recent Workouts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            Recent Workouts ({filteredLogs.length})
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-4 bg-slate-700/50 rounded-lg text-center">
            <p className="text-slate-400 text-xs">No workouts logged yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.slice(0, 10).map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:border-white/20 transition-all overflow-hidden"
              >
                <div className="p-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white mb-1">{log.workout_name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {new Date(log.completed_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    {log.exercises?.length > 0 && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[9px] px-1.5 py-0.5">
                        {log.exercises.length} exercises
                      </Badge>
                    )}
                  </div>

                  {/* Duration & Notes Buttons */}
                  <div className="flex gap-2">
                    {log.duration && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowWorkoutDetails(true);
                        }}
                        className="flex-1 h-auto py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded-lg transition-all"
                      >
                        <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        <span className="text-[11px] font-semibold">{log.duration}</span>
                      </Button>
                    )}
                    {log.notes && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowWorkoutDetails(true);
                        }}
                        className="flex-1 h-auto py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 rounded-lg transition-all"
                      >
                        <MessageSquare className="w-3 h-3 mr-1.5 flex-shrink-0" />
                        <span className="text-[11px] font-semibold">View Notes</span>
                      </Button>
                    )}
                  </div>

                  {/* Quick Exercise Preview */}
                  {log.exercises?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <div className="flex flex-wrap gap-1">
                        {log.exercises.slice(0, 3).map((exercise, idx) => (
                          <span 
                            key={idx}
                            className="text-[9px] px-1.5 py-0.5 bg-slate-700/50 text-slate-300 rounded-md font-medium"
                          >
                            {exercise.exercise}
                          </span>
                        ))}
                        {log.exercises.length > 3 && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-700/50 text-slate-400 rounded-md">
                            +{log.exercises.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Workout Details Modal */}
      {showWorkoutDetails && selectedLog && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowWorkoutDetails(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{selectedLog.workout_name}</h3>
                  <p className="text-xs text-slate-400">
                    {new Date(selectedLog.completed_date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowWorkoutDetails(false)}
                  className="p-2 -m-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>

              {/* Duration */}
              {selectedLog.duration && (
                <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Duration</span>
                  </div>
                  <p className="text-xl font-black text-blue-200">{selectedLog.duration}</p>
                </div>
              )}

              {/* Notes */}
              {selectedLog.notes && (
                <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Workout Notes</span>
                  </div>
                  <p className="text-sm text-purple-100 leading-relaxed whitespace-pre-wrap">{selectedLog.notes}</p>
                </div>
              )}

              {/* Exercises */}
              {selectedLog.exercises?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-orange-300 uppercase tracking-wider">
                      Exercises ({selectedLog.exercises.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedLog.exercises.map((exercise, idx) => (
                      <div 
                        key={idx}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold text-white">{exercise.exercise}</span>
                          {exercise.weight && (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                              {exercise.weight}kg
                            </Badge>
                          )}
                        </div>
                        {exercise.setsReps && (
                          <p className="text-xs text-slate-400">{exercise.setsReps}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </Card>
  );
}