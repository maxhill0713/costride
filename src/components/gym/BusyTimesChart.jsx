import React, { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function jsDayToBestTime(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function getBusynessLabel(pct, avg, isClosed) {
  if (isClosed) return { label: 'Closed', color: 'rgba(100,120,160,0.5)', textColor: 'rgba(140,160,200,0.7)', barClass: 'closed' };
  if (pct === 0 || pct === null) return { label: 'No data', color: 'rgba(255,255,255,0.04)', textColor: 'rgba(140,160,200,0.6)', barClass: 'empty' };
  if (pct < avg * 0.6) return { label: 'Plenty of space', color: 'rgba(100,140,255,0.15)', textColor: 'rgba(140,170,255,0.85)', barClass: 'low' };
  if (pct > avg * 1.45) return { label: 'Peak hours', color: 'rgba(220,40,140,0.2)', textColor: 'rgba(255,140,190,0.95)', barClass: 'peak' };
  if (pct > avg * 1.12) return { label: 'High energy', color: 'rgba(180,50,220,0.2)', textColor: 'rgba(220,140,255,0.9)', barClass: 'high' };
  return { label: 'Active', color: 'rgba(120,80,240,0.22)', textColor: 'rgba(170,140,255,0.9)', barClass: 'mid' };
}

const VISIBLE_HOURS = Array.from({ length: 19 }, (_, i) => i + 5);

const BAR_STYLES = {
  low:    { background: 'rgba(130,160,255,0.22)' },
  mid:    { background: 'linear-gradient(to top, rgba(120,80,240,0.6), rgba(160,120,255,0.5))' },
  high:   { background: 'linear-gradient(to top, rgba(180,60,200,0.7), rgba(220,100,255,0.65))' },
  peak:   { background: 'linear-gradient(to top, rgba(220,50,160,0.85), rgba(255,100,160,0.8))' },
  closed: { background: 'rgba(255,255,255,0.05)' },
  empty:  { background: 'rgba(255,255,255,0.05)' },
};

export default function BusyTimesChart({ checkIns, gymId }) {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  const bestTimeDayInt = jsDayToBestTime(currentDay);
  const [selectedDay, setSelectedDay] = useState(bestTimeDayInt);
  const [hoveredHour, setHoveredHour] = useState(null);

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
    const all24 = Array.from({ length: 24 }, (_, i) => ({ hour: i, percentage: null, isClosed: false }));
    if (useBestTime) {
      const dayData = bestTimeData.weekData.find((d) => d.day_int === selectedDay);
      if (dayData) {
        dayData.hours.forEach((h) => {
          all24[h.hour].isClosed = h.percentage === -1;
          all24[h.hour].percentage = h.percentage === -1 || h.percentage === null ? 0 : h.percentage;
        });
      }
    } else {
      checkIns?.forEach((checkIn) => {
        const date = new Date(checkIn.check_in_date);
        if (date.getDay() === currentDay) all24[date.getHours()].percentage = (all24[date.getHours()].percentage || 0) + 1;
      });
      const max = Math.max(...all24.map((d) => d.percentage || 0), 1);
      all24.forEach((d) => { d.percentage = (d.percentage || 0) / max * 100; });
    }
    return all24;
  };

  const hourlyData = getHourlyData();
  const visibleData = VISIBLE_HOURS.map((h) => hourlyData[h]);
  const openHours = visibleData.filter((d) => !d.isClosed && d.percentage > 0);
  const avg = openHours.length > 0 ? openHours.reduce((s, d) => s + d.percentage, 0) / openHours.length : 50;

  const isToday = selectedDay === bestTimeDayInt;

  const formatHour = (h) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  const getOpeningHours = () => {
    if (!useBestTime) return null;
    const dayData = bestTimeData.weekData.find((d) => d.day_int === selectedDay);
    if (!dayData) return null;
    const openHoursList = dayData.hours
      .filter((h) => h.percentage !== -1 && h.percentage !== null)
      .map((h) => h.hour)
      .sort((a, b) => a - b);
    if (openHoursList.length === 0) return 'Closed';
    const first = openHoursList[0];
    const last = openHoursList[openHoursList.length - 1];
    return `${formatHour(first)} – ${formatHour(last + 1)}`;
  };
  const openingHours = getOpeningHours();

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30,35,60,0.82) 0%, rgba(8,10,20,0.96) 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 20,
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Clock style={{ width: 15, height: 15, color: '#fff', flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>
            Busy Times
          </span>
        </div>
        {openingHours && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(160,180,220,0.7)' }}>Opening Hours</span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: openingHours === 'Closed' ? 'rgba(248,113,113,0.85)' : 'rgba(200,220,255,0.9)',
            }}>
              {openingHours}
            </span>
          </div>
        )}
      </div>

      {/* Day selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {DAYS.map((day, idx) => {
          const active = idx === selectedDay;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(idx)}
              style={{
                flex: 1, padding: '5px 0', borderRadius: 7,
                fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none',
                transition: 'all 0.12s ease',
                color: active ? 'rgba(220,230,255,0.95)' : 'rgba(200,210,240,0.65)',
                background: active
                  ? 'linear-gradient(to bottom, rgba(90,110,255,0.7), rgba(60,80,220,0.85))'
                  : 'linear-gradient(to bottom, rgba(60,70,110,0.6), rgba(30,38,70,0.8))',
                boxShadow: active
                  ? '0 2px 0 rgba(30,50,180,0.6), 0 4px 12px rgba(80,100,255,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
                  : '0 2px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
                letterSpacing: '0.01em',
                WebkitTapHighlightColor: 'transparent',
              }}>
              {day}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 style={{ width: 18, height: 18, color: 'rgba(130,160,255,0.7)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 72 }}>
            {visibleData.map((d, i) => {
              const hour = VISIBLE_HOURS[i];
              const isNow = isToday && hour === currentHour;
              const pct = Math.max(d.percentage || 0, 0);
              const { barClass } = getBusynessLabel(pct, avg, d.isClosed);
              const heightPx = pct > 0 ? Math.max(pct * 0.72, 5) : 3;
              const isHovered = hoveredHour === hour;

              return (
                <div
                  key={hour}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' }}
                  onMouseEnter={() => setHoveredHour(hour)}
                  onMouseLeave={() => setHoveredHour(null)}>

                  {/* Tooltip */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(12,16,42,0.97)',
                      border: '1px solid rgba(100,120,255,0.25)',
                      borderRadius: 8, padding: '5px 8px',
                      fontSize: 10, fontWeight: 600, color: 'rgba(210,220,255,0.95)',
                      whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 10,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                    }}>
                      {formatHour(hour)} — {d.isClosed ? 'Closed' : pct > 0 ? `${Math.round(pct)}% busy` : 'No data'}
                    </div>
                  )}

                  {/* Now pip */}
                  {isNow && (
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      width: 5, height: 5, borderRadius: '50%', background: 'white',
                      animation: 'cosBusyPing 1.5s ease-in-out infinite',
                    }} />
                  )}

                  {/* Bar */}
                  <div style={{
                    width: '100%',
                    height: heightPx,
                    borderRadius: '3px 3px 1px 1px',
                    transition: 'height 0.35s cubic-bezier(0.34,1.2,0.64,1)',
                    outline: isNow ? '1.5px solid rgba(255,255,255,0.55)' : 'none',
                    outlineOffset: 1,
                    ...BAR_STYLES[barClass],
                  }} />
                </div>
              );
            })}
          </div>

          {/* X axis labels */}
          <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
            {VISIBLE_HOURS.map((h, i) => (
              <div key={h} style={{ flex: 1, textAlign: 'center' }}>
                {i % 3 === 0 && (
                  <span style={{ fontSize: 8.5, color: 'rgba(100,120,160,0.7)', fontWeight: 600 }}>
                    {formatHour(h)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes cosBusyPing {
          0%,100% { transform:translateX(-50%) scale(1); opacity:1; }
          50% { transform:translateX(-50%) scale(1.7); opacity:0.25; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}