import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay, getDay } from 'date-fns';

export default function CheckInHeatmap({ checkIns = [] }) {
  const { weeks, monthLabels, hasCheckIn, today } = useMemo(() => {
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

    return { weeks, monthLabels, hasCheckIn, today };
  }, [checkIns]);
  
  return (
    <Card className="bg-gradient-to-br from-slate-700/90 via-slate-800/95 to-slate-900/90 backdrop-blur-sm border border-slate-600/40 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Check-In Activity</h3>
            <p className="text-xs text-slate-400">Last 13 months</p>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto scrollbar-thin">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="relative h-5 mb-2">
            {monthLabels.map(({ weekIndex, label }) => (
              <div
                key={weekIndex}
                style={{ left: `${weekIndex * 16}px` }}
                className="absolute text-xs font-medium text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>
          
          {/* Days of week labels */}
          <div className="flex gap-2 mb-2">
            <div className="flex flex-col gap-1 text-[10px] text-slate-500 pr-2">
              <div className="h-3.5 flex items-center">Mon</div>
              <div className="h-3.5" />
              <div className="h-3.5 flex items-center">Wed</div>
              <div className="h-3.5" />
              <div className="h-3.5 flex items-center">Fri</div>
              <div className="h-3.5" />
            </div>
            
            {/* Days grid */}
            <div className="flex gap-1.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                    const day = week.find(d => getDay(d) === dayOfWeek);
                    
                    if (!day) {
                      return (
                        <div
                          key={dayOfWeek}
                          className="w-3.5 h-3.5 bg-transparent"
                        />
                      );
                    }
                    
                    const isCheckedIn = hasCheckIn(day);
                    const isToday = isSameDay(day, today);
                    
                    return (
                      <div
                        key={dayOfWeek}
                        title={`${format(day, 'MMM d, yyyy')}${isCheckedIn ? ' ✓ Checked In' : ''}`}
                        className={`w-3.5 h-3.5 rounded-sm transition-colors duration-200 cursor-pointer ${
                          isCheckedIn
                            ? 'bg-emerald-500 hover:bg-emerald-400 shadow-sm'
                            : 'bg-slate-700/40 hover:bg-slate-600/60'
                        } ${isToday ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-800' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-medium">Less</span>
              <div className="flex gap-1.5">
                <div className="w-3.5 h-3.5 bg-slate-700/40 rounded-sm" />
                <div className="w-3.5 h-3.5 bg-emerald-500/30 rounded-sm" />
                <div className="w-3.5 h-3.5 bg-emerald-500/60 rounded-sm" />
                <div className="w-3.5 h-3.5 bg-emerald-500 rounded-sm" />
              </div>
              <span className="font-medium">More</span>
            </div>
            <div className="text-xs text-slate-500">
              {checkIns.length} total check-ins
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}