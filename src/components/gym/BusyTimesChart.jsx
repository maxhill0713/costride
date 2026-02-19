import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Clock, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

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
    <Card className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-950/80 backdrop-blur-xl border border-blue-500/30 p-4 md:p-6 shadow-2xl shadow-blue-900/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Peak Hours</h3>
            <p className="text-xs text-slate-400">Real-time congestion forecast</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${status.bg} ${status.border} backdrop-blur-sm`}>
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className={`text-xs font-semibold ${status.color}`}{status.text}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-4">
        <div className="h-32 -mx-2">
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
                  let fill = '#475569';
                  if (index === currentHour) {
                    fill = '#3b82f6';
                  } else if (entry.percentage > avgPercentage * 1.3) {
                    fill = '#f97316';
                  } else if (entry.percentage > avgPercentage) {
                    fill = '#06b6d4';
                  }
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={fill}
                      opacity={index === currentHour ? 1 : 0.7}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/50">
        <div className="text-center">
          <p className="text-slate-400 text-xs font-medium mb-1">Now</p>
          <p className="text-lg font-bold text-white">{Math.round(currentHourData.percentage)}%</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-xs font-medium mb-1">Average</p>
          <p className="text-lg font-bold text-cyan-400">{Math.round(avgPercentage)}%</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center mt-3">
        Based on activity patterns • {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]}
      </p>
    </Card>
  );
}