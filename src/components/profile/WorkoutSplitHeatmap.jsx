import React, { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek } from 'date-fns';

export default function WorkoutSplitHeatmap({ checkIns = [], workoutSplit, weeklyGoal = 3 }) {
  // Define split schedules
  const splitSchedules = {
    ppl: {
      name: 'Push/Pull/Legs',
      schedule: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'],
      colors: {
        'Push': 'bg-red-500',
        'Pull': 'bg-blue-500',
        'Legs': 'bg-green-500',
        'Rest': 'bg-slate-600/40'
      }
    },
    upper_lower: {
      name: 'Upper/Lower',
      schedule: ['Upper', 'Lower', 'Rest', 'Upper', 'Lower', 'Rest', 'Rest'],
      colors: {
        'Upper': 'bg-purple-500',
        'Lower': 'bg-orange-500',
        'Rest': 'bg-slate-600/40'
      }
    },
    full_body: {
      name: 'Full Body',
      schedule: ['Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Rest'],
      colors: {
        'Full Body': 'bg-cyan-500',
        'Rest': 'bg-slate-600/40'
      }
    },
    bro_split: {
      name: 'Bro Split',
      schedule: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Rest', 'Rest'],
      colors: {
        'Chest': 'bg-red-500',
        'Back': 'bg-blue-500',
        'Shoulders': 'bg-yellow-500',
        'Arms': 'bg-pink-500',
        'Legs': 'bg-green-500',
        'Rest': 'bg-slate-600/40'
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
    
    // Find the first check-in to use as reference point
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
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(splitInfo.colors).map(([name, color]) => (
            <div key={name} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded ${color}`} />
              <span className="text-[10px] text-slate-400">{name}</span>
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
              const expectedColor = splitInfo?.colors[expectedWorkout] || 'bg-slate-600/40';
              
              return (
                <div
                  key={dayIndex}
                  title={`${format(day, 'MMM d')}${expectedWorkout ? ` - ${expectedWorkout}` : ''}${isCheckedIn ? ' ✓' : ''}`}
                  className={`
                    aspect-square rounded cursor-pointer relative
                    transition-all duration-200
                    ${isFuture ? 'opacity-20' : ''}
                    ${isCheckedIn 
                      ? splitInfo ? expectedColor : 'bg-emerald-500'
                      : 'bg-slate-700/40 border border-slate-600/30'
                    }
                    ${isToday ? 'ring-1 ring-blue-400' : ''}
                  `}
                >
                  {isCheckedIn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
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