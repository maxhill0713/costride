import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Dumbbell } from 'lucide-react';
import { format, subDays, eachDayOfInterval, isSameDay, startOfWeek, addDays } from 'date-fns';

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
    const daysToShow = 56; // 8 weeks
    const startDate = subDays(today, daysToShow - 1);
    
    const allDays = eachDayOfInterval({ start: startDate, end: today });
    
    // Group days by week (starting Monday)
    const weeks = [];
    let currentWeek = [];
    
    allDays.forEach((day, index) => {
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
    <Card className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Training Consistency</h3>
            <p className="text-xs text-slate-400">
              {splitInfo ? `${splitInfo.name} • Last 8 weeks` : 'Last 8 weeks'}
            </p>
          </div>
        </div>
      </div>

      {/* Split Legend */}
      {splitInfo && (
        <div className="mb-4 p-3 bg-slate-700/40 rounded-xl">
          <p className="text-xs font-semibold text-slate-300 mb-2">Your Split Schedule</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(splitInfo.colors).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-xs text-slate-400">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      <div className="space-y-2 mb-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1.5 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-[10px] text-slate-500 font-semibold">
              {day}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
            {week.map((day, dayIndex) => {
              const isCheckedIn = hasCheckIn(day);
              const isToday = isSameDay(day, today);
              const isFuture = day > today;
              const expectedWorkout = getExpectedWorkout(day);
              const expectedColor = splitInfo?.colors[expectedWorkout] || 'bg-slate-600/40';
              
              return (
                <div
                  key={dayIndex}
                  title={`${format(day, 'MMM d, yyyy')}${expectedWorkout ? ` - ${expectedWorkout}` : ''}${isCheckedIn ? ' ✓' : ''}`}
                  className={`
                    aspect-square rounded-lg cursor-pointer relative
                    transition-all duration-200 hover:scale-110
                    ${isFuture ? 'opacity-30' : ''}
                    ${isCheckedIn 
                      ? splitInfo ? expectedColor : 'bg-emerald-500'
                      : 'bg-slate-700/40 border border-slate-600/30'
                    }
                    ${isToday ? 'ring-2 ring-blue-400' : ''}
                  `}
                >
                  {isCheckedIn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!isCheckedIn && !isFuture && splitInfo && (
                    <div className={`absolute inset-0.5 rounded-md ${expectedColor} opacity-20`} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700/50">
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-400">{getConsistencyRate()}%</p>
          <p className="text-xs text-slate-400">Consistency</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">{getWeeklyAverage()}</p>
          <p className="text-xs text-slate-400">Avg/Week</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">{checkIns.length}</p>
          <p className="text-xs text-slate-400">Total Days</p>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      {weeklyGoal && (
        <div className="mt-4 p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-200">Weekly Goal</span>
            <span className="text-xs text-indigo-300">{getWeeklyAverage()} / {weeklyGoal} days</span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                parseFloat(getWeeklyAverage()) >= weeklyGoal 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${Math.min((parseFloat(getWeeklyAverage()) / weeklyGoal) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}