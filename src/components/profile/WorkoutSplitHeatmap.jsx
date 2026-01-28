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
        'Rest': 'bg-gradient-to-br from-amber-500/70 to-orange-500/70'
      }
    },
    upper_lower: {
      name: 'Upper/Lower',
      schedule: ['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest'],
      colors: {
        'Upper': 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm',
        'Lower': 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm',
        'Rest': 'bg-gradient-to-br from-amber-500/70 to-orange-500/70'
      }
    },
    full_body: {
      name: 'Full Body',
      schedule: ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'],
      colors: {
        'Full Body': 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-sm',
        'Rest': 'bg-gradient-to-br from-amber-500/70 to-orange-500/70'
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
        'Rest': 'bg-gradient-to-br from-amber-500/70 to-orange-500/70'
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
    <div className="space-y-3">
      {/* Split Legend - Compact */}
      {splitInfo && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(splitInfo.colors).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-slate-300 font-medium">{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Compact Heatmap Grid */}
      <div className="space-y-1">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-0.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} className="text-center text-[9px] text-slate-500 font-semibold">
              {day}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
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
                    aspect-square rounded-md cursor-pointer relative overflow-hidden
                    transition-all duration-200 hover:scale-105
                    ${isFuture ? 'opacity-20' : ''}
                    ${isCheckedIn 
                      ? splitInfo ? expectedColor : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm'
                      : 'bg-slate-700/30 border border-slate-600/40 hover:bg-slate-600/40'
                    }
                    ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-800' : ''}
                  `}
                >
                  {isCheckedIn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <svg className="w-2.5 h-2.5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/50">
        <div>
          <p className="text-lg font-bold text-emerald-400">{getConsistencyRate()}%</p>
          <p className="text-[10px] text-slate-400">Consistency</p>
        </div>
        <div>
          <p className="text-lg font-bold text-blue-400">{getWeeklyAverage()}/{weeklyGoal}</p>
          <p className="text-[10px] text-slate-400">Avg per week</p>
        </div>
      </div>
    </div>
  );
}