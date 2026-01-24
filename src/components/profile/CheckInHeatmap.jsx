import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, getDay } from 'date-fns';

export default function CheckInHeatmap({ checkIns }) {
  const today = new Date();
  const startDate = startOfMonth(subMonths(today, 12));
  const endDate = endOfMonth(today);
  
  // Get all days in the 13-month range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group days by week
  const weeks = [];
  let currentWeek = [];
  
  allDays.forEach((day) => {
    const dayOfWeek = getDay(day);
    
    // Start a new week on Sunday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentWeek.push(day);
  });
  
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  
  // Check if a day has a check-in
  const hasCheckIn = (day) => {
    return checkIns.some(checkIn => 
      isSameDay(new Date(checkIn.check_in_date), day)
    );
  };
  
  // Get month labels for display
  const monthLabels = [];
  let lastMonth = null;
  
  weeks.forEach((week, weekIndex) => {
    const firstDay = week[0];
    const monthName = format(firstDay, 'MMM');
    const currentMonth = format(firstDay, 'yyyy-MM');
    
    if (currentMonth !== lastMonth && weekIndex % 4 === 0) {
      monthLabels.push({ weekIndex, label: monthName });
      lastMonth = currentMonth;
    }
  });
  
  return (
    <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Check-In Activity</h3>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2 text-xs text-slate-400">
            {monthLabels.map(({ weekIndex, label }) => (
              <div
                key={weekIndex}
                style={{ marginLeft: `${weekIndex * 14}px` }}
                className="absolute"
              >
                {label}
              </div>
            ))}
          </div>
          
          {/* Days grid */}
          <div className="flex gap-1 mt-6">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                  const day = week.find(d => getDay(d) === dayOfWeek);
                  
                  if (!day) {
                    return (
                      <div
                        key={dayOfWeek}
                        className="w-3 h-3 bg-transparent"
                      />
                    );
                  }
                  
                  const isCheckedIn = hasCheckIn(day);
                  const isToday = isSameDay(day, today);
                  
                  return (
                    <div
                      key={dayOfWeek}
                      title={`${format(day, 'MMM d, yyyy')}${isCheckedIn ? ' - Checked In' : ''}`}
                      className={`w-3 h-3 rounded-sm transition-all ${
                        isCheckedIn
                          ? 'bg-green-500 hover:bg-green-400'
                          : 'bg-slate-700/50 hover:bg-slate-600/50'
                      } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-700/50 rounded-sm" />
              <div className="w-3 h-3 bg-green-500/40 rounded-sm" />
              <div className="w-3 h-3 bg-green-500/70 rounded-sm" />
              <div className="w-3 h-3 bg-green-500 rounded-sm" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </Card>
  );
}