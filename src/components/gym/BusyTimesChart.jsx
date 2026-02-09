import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function BusyTimesChart({ checkIns }) {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();

  // Generate hourly data from check-ins
  const generateHourlyData = () => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      visits: 0,
      label: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`
    }));

    // Count check-ins per hour for the same day of week
    checkIns.forEach(checkIn => {
      const date = new Date(checkIn.check_in_date);
      if (date.getDay() === currentDay) {
        const hour = date.getHours();
        hourlyData[hour].visits++;
      }
    });

    // Normalize to 0-100 scale
    const maxVisits = Math.max(...hourlyData.map(d => d.visits), 1);
    return hourlyData.map(d => ({
      ...d,
      percentage: (d.visits / maxVisits) * 100
    }));
  };

  const hourlyData = generateHourlyData();
  const currentHourData = hourlyData[currentHour];
  const avgPercentage = hourlyData.reduce((sum, d) => sum + d.percentage, 0) / 24;

  // Determine status
  const getStatus = () => {
    if (currentHourData.percentage < avgPercentage * 0.5) {
      return { text: 'Usually Quiet', icon: TrendingDown, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' };
    } else if (currentHourData.percentage > avgPercentage * 1.5) {
      return { text: 'Peak Time', icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' };
    } else {
      return { text: 'Moderate', icon: Minus, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40' };
    }
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="bg-slate-900/60 backdrop-blur-3xl border border-white/30 p-3 md:p-4 shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm md:text-base font-bold text-slate-100">Busy Times</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${status.bg} ${status.border}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
          <span className={`text-xs font-bold ${status.color}`}>Now: {status.text}</span>
        </div>
      </div>

      <div className="h-24 mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="label" 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval={3}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
              {hourlyData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === currentHour ? '#3b82f6' : '#475569'}
                  opacity={index === currentHour ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-400 text-center">
        Based on typical activity for {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]}s
      </p>
    </Card>
  );
}