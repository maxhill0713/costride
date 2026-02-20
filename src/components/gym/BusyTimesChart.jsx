import React, { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function jsDayToBestTime(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Show hours 6am–11pm like Google
const VISIBLE_HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6..23

const formatHour = (h) => {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
};

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
    const all24 = Array.from({ length: 24 }, (_, i) => ({ hour: i, percentage: 0, isClosed: false }));

    if (useBestTime) {
      const dayData = bestTimeData.weekData.find(d => d.day_int === selectedDay);
      if (dayData) {
        dayData.hours.forEach(h => {
          all24[h.hour].isClosed = h.intensity === -1;
          all24[h.hour].percentage = (h.intensity === -1 || h.intensity === null) ? 0 : h.intensity;
        });
      }
    } else {
      checkIns?.forEach(checkIn => {
        const date = new Date(checkIn.check_in_date);
        if (date.getDay() === currentDay) all24[date.getHours()].percentage++;
      });
      const max = Math.max(...all24.map(d => d.percentage), 1);
      all24.forEach(d => { d.percentage = (d.percentage / max) * 100; });
    }
    return all24;
  };

  const hourlyData = getHourlyData();
  const visibleData = VISIBLE_HOURS.map(h => hourlyData[h]);

  const isToday = selectedDay === bestTimeDayInt;

  // Current hour status text (like Google's "Usually not too busy")
  const nowPct = isToday ? (hourlyData[currentHour]?.percentage ?? 0) : null;
  const getNowText = (pct) => {
    if (pct === null) return null;
    if (pct === 0) return 'Not busy right now';
    if (pct < 25) return 'Not too busy right now';
    if (pct < 50) return 'A little busy right now';
    if (pct < 75) return 'As busy as it gets';
    return 'Usually as busy as it gets';
  };

  return (
    <div className="bg-slate-800/60 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Popular times</h3>
          {useBestTime && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
              Live data
            </span>
          )}
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-1 mb-4">
        {DAYS.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDay(idx)}
            className={`flex-1 py-1 rounded text-[11px] font-medium transition-all min-h-0 ${
              selectedDay === idx
                ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                : 'text-slate-400 hover:text-slate-200'
            } ${idx === bestTimeDayInt ? 'underline underline-offset-2' : ''}`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Now text (like Google's summary line) */}
      {isToday && nowPct !== null && (
        <p className="text-xs text-slate-300 mb-3">
          {getNowText(nowPct)}
          {nowPct > 0 && (
            <span className="text-slate-500 ml-1">· {Math.round(nowPct)}% capacity</span>
          )}
        </p>
      )}

      {/* Chart */}
      {isLoading ? (
        <div className="h-20 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      ) : (
        <div>
          <div className="flex items-end gap-[2px] h-16">
            {visibleData.map((d, i) => {
              const hour = VISIBLE_HOURS[i];
              const isNow = isToday && hour === currentHour;
              const pct = d.percentage || 0;
              const isClosed = d.isClosed;
              // height as % of container, minimum stub for zero
              const heightPct = isClosed ? 0 : pct > 0 ? Math.max((pct / 100) * 100, 10) : 0;

              return (
                <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                    <div className="bg-slate-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl border border-slate-700">
                      <div className="font-medium">{formatHour(hour)}</div>
                      <div className="text-slate-400 text-[10px]">
                        {isClosed ? 'Closed' : pct > 0 ? `${Math.round(pct)}% busy` : 'Not busy'}
                      </div>
                    </div>
                    <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-[3px] border-b border-r border-slate-700" />
                  </div>

                  {/* Bar — Google uses a single solid colour, darker for "now" */}
                  {heightPct > 0 && (
                    <div
                      className={`w-full rounded-sm transition-all duration-200 ${
                        isNow
                          ? 'bg-orange-400'
                          : 'bg-blue-400/70 group-hover:bg-blue-300/80'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  )}

                  {/* "Now" tick line */}
                  {isNow && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <div className="w-[1px] h-2 bg-orange-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex items-center gap-[2px] mt-4">
            {VISIBLE_HOURS.map((h, i) => (
              <div key={h} className="flex-1 text-center">
                {(h === 6 || h === 9 || h === 12 || h === 15 || h === 18 || h === 21) ? (
                  <span className={`text-[9px] ${isToday && h === currentHour ? 'text-orange-400 font-semibold' : 'text-slate-500'}`}>
                    {formatHour(h)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}