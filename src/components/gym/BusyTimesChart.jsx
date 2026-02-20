import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function jsDayToBestTime(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function getBusynessLabel(pct, avg, isClosed) {
  if (isClosed) return { label: 'Closed', color: 'bg-slate-700/40', textColor: 'text-slate-500' };
  if (pct === 0 || pct === null) return { label: 'No data', color: 'bg-slate-700/30', textColor: 'text-slate-500' };
  if (pct < avg * 0.5) return { label: 'Quiet', color: 'bg-green-500/70', textColor: 'text-green-300' };
  if (pct > avg * 1.5) return { label: 'Very Busy', color: 'bg-red-500/80', textColor: 'text-red-300' };
  if (pct > avg * 1.1) return { label: 'Busy', color: 'bg-orange-500/70', textColor: 'text-orange-300' };
  return { label: 'Moderate', color: 'bg-yellow-500/60', textColor: 'text-yellow-300' };
}

// Show only hours between 5am and 11pm
const VISIBLE_HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 5..23

export default function BusyTimesChart({ checkIns, gymId }) {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  const bestTimeDayInt = jsDayToBestTime(currentDay);
  const [selectedDay, setSelectedDay] = useState(bestTimeDayInt);

  const { data: bestTimeData, isLoading } = useQuery({
    queryKey: ['bestTimeFootTraffic', gymId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getBestTimeFootTraffic', { gymId });
      return res.data;
    },
    enabled: !!gymId,
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false
  });

  const useBestTime = !!bestTimeData?.weekData;

  const getHourlyData = () => {
    // intensity: null = no BestTime data (not closed, just unknown), -1 = explicitly closed, 0-100 = busyness
    const all24 = Array.from({ length: 24 }, (_, i) => ({ hour: i, percentage: null, isClosed: false }));

    if (useBestTime) {
      const dayData = bestTimeData.weekData.find(d => d.day_int === selectedDay);
      if (dayData) {
        dayData.hours.forEach(h => {
          all24[h.hour].isClosed = h.intensity === -1;
          all24[h.hour].percentage = (h.intensity === -1 || h.intensity === null) ? 0 : h.intensity;
        });
      }
    } else {
      // fallback: count check-ins per hour today
      checkIns?.forEach(checkIn => {
        const date = new Date(checkIn.check_in_date);
        if (date.getDay() === currentDay) all24[date.getHours()].percentage = (all24[date.getHours()].percentage || 0) + 1;
      });
      const max = Math.max(...all24.map(d => d.percentage || 0), 1);
      all24.forEach(d => { d.percentage = ((d.percentage || 0) / max) * 100; });
    }
    return all24;
  };

  const hourlyData = getHourlyData();
  const visibleData = VISIBLE_HOURS.map(h => hourlyData[h]);
  // avg only over hours that have real data
  const openHours = visibleData.filter(d => !d.isClosed && d.percentage > 0);
  const avg = openHours.length > 0 ? openHours.reduce((s, d) => s + d.percentage, 0) / openHours.length : 50;

  const nowData = hourlyData[currentHour];
  const nowStatus = getBusynessLabel(nowData?.percentage ?? 0, avg, nowData?.isClosed);

  const formatHour = (h) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  const isToday = selectedDay === bestTimeDayInt;

  return (
    <Card className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-blue-500/30 p-4 shadow-2xl shadow-blue-900/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Busy Times</h3>
          {useBestTime && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
              Live
            </span>
          )}
        </div>

        {/* Now badge */}
        {isToday && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${nowStatus.color} ${nowStatus.textColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {nowStatus.label} now
          </div>
        )}
      </div>

      {/* Day Selector */}
      <div className="flex gap-1 mb-4">
        {DAYS.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDay(idx)}
            className={`flex-1 py-1 rounded-md text-[11px] font-semibold transition-all ${
              selectedDay === idx
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/60 hover:text-white'
            } ${idx === bestTimeDayInt ? 'ring-1 ring-cyan-400/40' : ''}`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-24 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      ) : (
        <div>
          {/* Bar rows */}
          <div className="flex items-end gap-[3px] h-20">
            {visibleData.map((d, i) => {
              const hour = VISIBLE_HOURS[i];
              const isNow = isToday && hour === currentHour;
              const pct = Math.max(d.percentage || 0, 0);
              const isClosed = d.isClosed;
              const heightPct = pct > 0 ? Math.max((pct / 100) * 100, 8) : 0;
              const { color } = getBusynessLabel(pct, avg, isClosed);

              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                    <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap border border-slate-600 shadow-lg">
                      {formatHour(hour)} — {isClosed ? 'Closed' : pct > 0 ? `${Math.round(pct)}% busy` : 'No data'}
                    </div>
                    <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-1 border-b border-r border-slate-600" />
                  </div>

                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all ${isClosed ? 'bg-slate-700/30' : pct > 0 ? color : 'bg-slate-700/20'} ${isNow ? 'ring-1 ring-white/60' : ''}`}
                    style={{ height: isClosed ? '4px' : pct > 0 ? `${heightPct}%` : '4px' }}
                  />

                  {/* "Now" indicator */}
                  {isNow && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="w-1 h-1 rounded-full bg-white animate-ping" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis labels — show every 3 hours */}
          <div className="flex items-end gap-[3px] mt-1">
            {VISIBLE_HOURS.map((h, i) => (
              <div key={h} className="flex-1 text-center">
                {i % 3 === 0 ? (
                  <span className="text-[9px] text-slate-500">{formatHour(h)}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-slate-700/50">
        {[
          { color: 'bg-green-500/70', label: 'Quiet' },
          { color: 'bg-yellow-500/60', label: 'Moderate' },
          { color: 'bg-orange-500/70', label: 'Busy' },
          { color: 'bg-red-500/80', label: 'Very Busy' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm ${color}`} />
            <span className="text-[10px] text-slate-400">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}