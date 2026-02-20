import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Clock, TrendingUp, TrendingDown, Minus, Zap, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// JS getDay(): 0=Sun,1=Mon...6=Sat -> BestTime day_int: 0=Mon...6=Sun
function jsDayToBestTime(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

export default function BusyTimesChart({ checkIns, gymId }) {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  const bestTimeDayInt = jsDayToBestTime(currentDay);

  const [selectedDay, setSelectedDay] = useState(bestTimeDayInt);

  // Fetch BestTime data if gymId is available
  const { data: bestTimeData, isLoading, error: btError } = useQuery({
    queryKey: ['bestTimeFootTraffic', gymId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getBestTimeFootTraffic', { gymId });
      return res.data;
    },
    enabled: !!gymId,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours - foot traffic data doesn't change often
    gcTime: 24 * 60 * 60 * 1000,
    retry: false
  });

  const useBestTime = bestTimeData?.weekData && !btError;

  // Build hourly data from BestTime or fallback to check-ins
  const getHourlyData = () => {
    if (useBestTime) {
      const dayData = bestTimeData.weekData.find(d => d.day_int === selectedDay);
      if (dayData) {
        return dayData.hours.map(h => ({
          hour: h.hour,
          label: h.hour === 0 ? '12am' : h.hour < 12 ? `${h.hour}am` : h.hour === 12 ? '12pm' : `${h.hour - 12}pm`,
          percentage: h.intensity
        }));
      }
    }

    // Fallback: derive from check-ins
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`,
      visits: 0
    }));
    checkIns?.forEach(checkIn => {
      const date = new Date(checkIn.check_in_date);
      if (date.getDay() === currentDay) {
        hourlyData[date.getHours()].visits++;
      }
    });
    const maxVisits = Math.max(...hourlyData.map(d => d.visits), 1);
    return hourlyData.map(d => ({ ...d, percentage: (d.visits / maxVisits) * 100 }));
  };

  const hourlyData = getHourlyData();
  const currentHourData = hourlyData[currentHour] || { percentage: 0 };
  const avgPercentage = hourlyData.reduce((sum, d) => sum + d.percentage, 0) / 24;

  const getStatus = () => {
    const p = currentHourData.percentage;
    if (p < avgPercentage * 0.5) return { text: 'Usually Quiet', icon: TrendingDown, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' };
    if (p > avgPercentage * 1.5) return { text: 'Peak Time', icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' };
    return { text: 'Moderate', icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-blue-500/30 p-4 md:p-6 shadow-2xl shadow-blue-900/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Peak Hours
              {useBestTime && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live Data
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {useBestTime ? 'Real foot traffic via BestTime.app' : 'Based on member check-ins'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${status.bg} ${status.border} backdrop-blur-sm`}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <>
              <StatusIcon className={`w-4 h-4 ${status.color}`} />
              <span className={`text-xs font-semibold ${status.color}`}>{status.text}</span>
            </>
          )}
        </div>
      </div>

      {/* Day Selector (only shown when BestTime data available) */}
      {useBestTime && (
        <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
          {DAYS.map((day, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDay(idx)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedDay === idx
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50'
              } ${idx === bestTimeDayInt ? 'ring-1 ring-cyan-500/50' : ''}`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="mb-4">
        <div className="h-32 -mx-2">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 8, left: -20, bottom: 20 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}
                  formatter={(value) => [`${Math.round(value)}%`, 'Busy']}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#78909c', fontSize: 11, fontWeight: 500 }}
                  interval={3}
                  axisLine={false}
                  tickLine={false}
                  stroke="rgba(100, 116, 139, 0.2)"
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {hourlyData.map((entry, index) => {
                    const isCurrentHour = index === currentHour && selectedDay === bestTimeDayInt;
                    let fill = '#475569';
                    if (isCurrentHour) fill = '#3b82f6';
                    else if (entry.percentage > avgPercentage * 1.3) fill = '#f97316';
                    else if (entry.percentage > avgPercentage) fill = '#06b6d4';
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fill}
                        opacity={isCurrentHour ? 1 : 0.7}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/50">
        <div className="text-center">
          <p className="text-slate-400 text-xs font-medium mb-1">Now</p>
          <p className="text-lg font-bold text-white">{Math.round(currentHourData.percentage)}%</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs font-medium mb-1">Day Avg</p>
          <p className="text-lg font-bold text-cyan-400">{Math.round(avgPercentage)}%</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center mt-3">
        {useBestTime
          ? `Powered by BestTime.app • ${DAYS[selectedDay]}`
          : `Based on activity patterns • ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]}`
        }
      </p>
    </Card>
  );
}