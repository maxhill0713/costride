import React, { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek } from 'date-fns';

export default function WorkoutSplitHeatmap({ checkIns = [], workoutSplit, weeklyGoal = 3, trainingDays = [] }) {
  // Define split schedules
  const splitSchedules = {
    ppl: {
      name: 'Push/Pull/Legs',
      schedule: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'],
      colors: {
        'Push': 'bg-gradient-to-br from-red-500 to-red-600 shadow-sm',
        'Pull': 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm',
        'Legs': 'bg-gradient-to-br from-green-500 to-green-600 shadow-sm',
        'Rest': 'bg-white/90 shadow-sm'
      }
    },
    upper_lower: {
      name: 'Upper/Lower',
      schedule: ['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest'],
      colors: {
        'Upper': 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm',
        'Lower': 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm',
        'Rest': 'bg-white/90 shadow-sm'
      }
    },
    full_body: {
      name: 'Full Body',
      schedule: ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'],
      colors: {
        'Full Body': 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-sm',
        'Rest': 'bg-white/90 shadow-sm'
      }
    },
    bro_split: {
      name: 'Bro Split',
      schedule: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Rest', 'Rest'],
      colors: {
        'Chest': 'bg-gradient-to-br from-red-500 to-red-600 shadow-sm',
        'Back': 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm',
        'Shoulders': 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-sm',
        'Arms': 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-sm',
        'Legs': 'bg-gradient-to-br from-green-500 to-green-600 shadow-sm',
        'Rest': 'bg-white/90 shadow-sm'
      }
    }
  };

  const { weeks, splitInfo, hasCheckIn, today } = useMemo(() => {
    const today = new Date();
    const daysToShow = 28; // 4 weeks for compact view
    const startDate = subDays(today, daysToShow - 1);
    
    const allDays = eachDayOfInterval({ start: startDate, end: today });
    
    // Group days by week (starting Monday)
    const weeks = [];
    let currentWeek = [];
    
    allDays.forEach((day) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    const hasCheckIn = (day) => {
      return checkIns.some(checkIn => 
        isSameDay(new Date(checkIn.check_in_date), day)
      );
    };
    
    // Get split info
    const splitInfo = workoutSplit && splitSchedules[workoutSplit] 
      ? splitSchedules[workoutSplit]
      : null;
    
    return { weeks, splitInfo, hasCheckIn, today };
  }, [checkIns, workoutSplit]);
  
  // Calculate expected workout day based on split
  const getExpectedWorkout = (day) => {
    if (!splitInfo) return null;
    
    // If custom training days are set, use them
    if (trainingDays && trainingDays.length > 0) {
      const dayOfWeek = day.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
      
      if (trainingDays.includes(adjustedDay)) {
        // This is a training day - assign a workout type
        const trainingDayIndex = trainingDays.indexOf(adjustedDay);
        const workoutTypes = splitInfo.schedule.filter(w => w !== 'Rest');
        return workoutTypes[trainingDayIndex % workoutTypes.length];
      } else {
        return 'Rest';
      }
    }
    
    // Otherwise use default schedule
    const firstCheckIn = checkIns.length > 0 
      ? new Date(checkIns[checkIns.length - 1].check_in_date)
      : startOfWeek(today, { weekStartsOn: 1 });
    
    const daysDiff = Math.floor((day - firstCheckIn) / (1000 * 60 * 60 * 24));
    const scheduleIndex = ((daysDiff % 7) + 7) % 7;
    
    return splitInfo.schedule[scheduleIndex];
  };

  const getConsistencyRate = () => {
    const totalDays = weeks.flat().length;
    const checkedInDays = weeks.flat().filter(day => hasCheckIn(day)).length;
    return Math.round((checkedInDays / totalDays) * 100);
  };

  const getWeeklyAverage = () => {
    const weekCounts = weeks.map(week => 
      week.filter(day => hasCheckIn(day) && day <= today).length
    );
    const avg = weekCounts.reduce((sum, count) => sum + count, 0) / weeks.length;
    return avg.toFixed(1);
  };

  return (
    <div className="space-y-4">
      {/* Split Info Header */}
      {splitInfo && (
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">{splitInfo.name}</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(splitInfo.colors).map(([name, color]) => (
                <div key={name} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700/30">
                  <div className={`w-3 h-3 rounded ${color}`} />
                  <span className="text-xs text-slate-200 font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Professional Heatmap Grid */}
      <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-700/50">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div key={i} className="text-center text-xs text-slate-400 font-semibold">
              {day}
            </div>
          ))}
        </div>

        {/* Week rows */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIndex) => {
                const isCheckedIn = hasCheckIn(day);
                const isToday = isSameDay(day, today);
                const isFuture = day > today;
                const expectedWorkout = getExpectedWorkout(day);
                const expectedColor = splitInfo?.colors[expectedWorkout] || 'bg-slate-700/50';
                
                return (
                  <div
                    key={dayIndex}
                    title={`${format(day, 'MMM d')}${expectedWorkout ? ` - ${expectedWorkout}` : ''}${isCheckedIn ? ' ✓' : ''}`}
                    className={`
                      aspect-square rounded-lg cursor-pointer relative overflow-hidden
                      transition-all duration-200 hover:scale-105 hover:shadow-lg
                      ${isFuture ? 'opacity-30' : ''}
                      ${isCheckedIn 
                        ? splitInfo ? `${expectedColor} border-2 border-white/20` : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md border-2 border-emerald-400/30'
                        : 'bg-slate-800/50 border-2 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50'
                      }
                      ${isToday ? 'ring-3 ring-blue-400/80 ring-offset-2 ring-offset-slate-900' : ''}
                    `}
                  >
                    {/* Day number */}
                    <div className="absolute top-0.5 left-0.5 text-[9px] font-semibold text-white/70 px-1">
                      {format(day, 'd')}
                    </div>
                    
                    {isCheckedIn && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {isToday && !isCheckedIn && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-2xl font-bold text-emerald-400">{getConsistencyRate()}</p>
            <p className="text-sm text-emerald-300">%</p>
          </div>
          <p className="text-xs text-slate-300 font-medium">Consistency Rate</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-2xl font-bold text-blue-400">{getWeeklyAverage()}</p>
            <p className="text-sm text-blue-300">/ {weeklyGoal}</p>
          </div>
          <p className="text-xs text-slate-300 font-medium">Weekly Average</p>
        </div>
      </div>
    </div>
  );
}