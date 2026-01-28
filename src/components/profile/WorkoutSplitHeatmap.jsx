import React, { useMemo, useState } from 'react';
import { format, subDays, subWeeks, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

export default function WorkoutSplitHeatmap({ checkIns = [], workoutSplit, weeklyGoal = 3, trainingDays = [], customWorkoutTypes = {} }) {
  const [timeRange, setTimeRange] = useState('weekly'); // 'weekly' or 'monthly'
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

  const { weeks, splitInfo, hasCheckIn, today, customSplitName } = useMemo(() => {
    const today = new Date();
    const weeksToShow = timeRange === 'weekly' ? 4 : 12; // 4 weeks or 12 weeks
    
    // Start from the beginning of the week (Monday)
    const endDate = endOfWeek(today, { weekStartsOn: 1 });
    const startDate = startOfWeek(subWeeks(endDate, weeksToShow - 1), { weekStartsOn: 1 });
    
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
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
    let splitInfo = workoutSplit && splitSchedules[workoutSplit] 
      ? splitSchedules[workoutSplit]
      : null;
    
    // Handle custom split
    let customSplitName = null;
    if (workoutSplit === 'custom') {
      customSplitName = 'Custom Split';

      // Build schedule and colors from custom workout types
      const schedule = [];
      const colors = { 'Rest': 'bg-white/90 shadow-sm' };

      // Color mapping for custom workout types
      const colorGradients = {
        purple: 'from-purple-500 to-purple-600',
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        red: 'from-red-500 to-red-600',
        orange: 'from-orange-500 to-orange-600',
        pink: 'from-pink-500 to-pink-600',
        yellow: 'from-yellow-500 to-yellow-600',
        cyan: 'from-cyan-500 to-cyan-600',
      };

      // If user has custom workout types, use them
      if (trainingDays && trainingDays.length > 0 && Object.keys(customWorkoutTypes).length > 0) {
        for (let i = 1; i <= 7; i++) {
          if (trainingDays.includes(i) && customWorkoutTypes[i]) {
            const workoutName = customWorkoutTypes[i].name || 'Train';
            const workoutColor = customWorkoutTypes[i].color || 'purple';
            schedule.push(workoutName);
            colors[workoutName] = `bg-gradient-to-br ${colorGradients[workoutColor]} shadow-sm`;
          } else if (trainingDays.includes(i)) {
            schedule.push('Train');
            colors['Train'] = 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm';
          } else {
            schedule.push('Rest');
          }
        }
      } else if (trainingDays && trainingDays.length > 0) {
        for (let i = 1; i <= 7; i++) {
          if (trainingDays.includes(i)) {
            schedule.push('Train');
          } else {
            schedule.push('Rest');
          }
        }
        colors['Train'] = 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm';
      } else {
        schedule.push('Train', 'Train', 'Rest', 'Train', 'Train', 'Rest', 'Rest');
        colors['Train'] = 'bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm';
      }

      splitInfo = {
        name: customSplitName,
        schedule,
        colors
      };
    }
    
    return { weeks, splitInfo, hasCheckIn, today, customSplitName };
  }, [checkIns, workoutSplit, timeRange]);
  
  // Calculate expected workout day based on split
  const getExpectedWorkout = (day) => {
    if (!splitInfo) return null;

    // For custom splits, flow continuously across weeks
    if (workoutSplit === 'custom' && trainingDays && trainingDays.length > 0) {
      const firstCheckIn = checkIns.length > 0 
        ? new Date(checkIns[checkIns.length - 1].check_in_date)
        : startOfWeek(today, { weekStartsOn: 1 });

      const daysDiff = Math.floor((day - firstCheckIn) / (1000 * 60 * 60 * 24));
      const workoutTypes = splitInfo.schedule.filter(w => w !== 'Rest');

      // Count how many training days have passed
      let trainingDaysPassed = 0;
      for (let i = 0; i < daysDiff; i++) {
        const checkDay = new Date(firstCheckIn);
        checkDay.setDate(checkDay.getDate() + i);
        const checkDayOfWeek = checkDay.getDay();
        const adjustedCheckDay = checkDayOfWeek === 0 ? 7 : checkDayOfWeek;
        if (trainingDays.includes(adjustedCheckDay)) {
          trainingDaysPassed++;
        }
      }

      const dayOfWeek = day.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (trainingDays.includes(adjustedDay)) {
        // This is a training day - use continuous flow
        return workoutTypes[trainingDaysPassed % workoutTypes.length];
      } else {
        return 'Rest';
      }
    }

    // If custom training days are set (non-custom splits), use them
    if (trainingDays && trainingDays.length > 0) {
      const dayOfWeek = day.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (trainingDays.includes(adjustedDay)) {
        const trainingDayIndex = trainingDays.indexOf(adjustedDay);
        const workoutTypes = splitInfo.schedule.filter(w => w !== 'Rest');
        return workoutTypes[trainingDayIndex % workoutTypes.length];
      } else {
        return 'Rest';
      }
    }

    // Otherwise use default schedule (resets weekly)
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
    <div className="space-y-3">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        {splitInfo && (
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">{splitInfo.name}</h4>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(splitInfo.colors).map(([name, color]) => (
                <div key={name} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className={`w-2.5 h-2.5 rounded ${color}`} />
                  <span className="text-[10px] text-slate-200 font-medium">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Time Range Toggle */}
        <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1 border border-slate-700/40">
          <button
            onClick={() => setTimeRange('weekly')}
            className={`
              px-3 py-1.5 rounded-md text-xs font-bold transition-all
              ${timeRange === 'weekly'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            4W
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`
              px-3 py-1.5 rounded-md text-xs font-bold transition-all
              ${timeRange === 'monthly'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            3M
          </button>
        </div>
      </div>

      {/* Mobile-Optimized Heatmap Grid */}
      <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-700/40">
        {/* Days of week header - Abbreviated for mobile */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[10px] text-slate-400 font-bold">
              {day}
            </div>
          ))}
        </div>

        {/* Week rows - Optimized spacing */}
        <div className="space-y-1.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
              {week.map((day, dayIndex) => {
                const isCheckedIn = hasCheckIn(day);
                const isToday = isSameDay(day, today);
                const isFuture = day > today;
                const expectedWorkout = getExpectedWorkout(day);
                const expectedColor = splitInfo?.colors[expectedWorkout] || 'bg-slate-700/50';
                
                return (
                  <div
                    key={dayIndex}
                    className={`
                      aspect-square rounded-lg relative overflow-hidden
                      transition-all duration-200 active:scale-95
                      ${isFuture ? 'opacity-30' : ''}
                      ${isCheckedIn 
                        ? splitInfo ? `${expectedColor} border border-white/20 shadow-sm` : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md border border-emerald-400/30'
                        : 'bg-slate-800/60 border border-slate-700/40'
                      }
                      ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900/50' : ''}
                    `}
                  >
                    {/* Day number - Better positioned for mobile */}
                    <div className="absolute top-0.5 left-1 text-[8px] font-bold text-white/60">
                      {format(day, 'd')}
                    </div>
                    
                    {isCheckedIn && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {isToday && !isCheckedIn && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile-Optimized Stats Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl p-3 border border-emerald-500/20">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <p className="text-xl font-bold text-emerald-400">{getConsistencyRate()}</p>
            <p className="text-xs text-emerald-300 font-semibold">%</p>
          </div>
          <p className="text-[10px] text-slate-300 font-medium">Consistency</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-3 border border-blue-500/20">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <p className="text-xl font-bold text-blue-400">{getWeeklyAverage()}</p>
            <p className="text-xs text-blue-300 font-semibold">/ {weeklyGoal}</p>
          </div>
          <p className="text-[10px] text-slate-300 font-medium">Per Week</p>
        </div>
      </div>
    </div>
  );
}