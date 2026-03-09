import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const mockData = [
  { month: 'Jan', chest: 3200, back: 2500, legs: 2800, arms: 1800, rpe: 8.2 },
  { month: 'Feb', chest: 4100, back: 3200, legs: 3500, arms: 2200, rpe: 8.5 },
  { month: 'Mar', chest: 5200, back: 4100, legs: 4800, arms: 2800, rpe: 8.8 },
  { month: 'Apr', chest: 4500, back: 3600, legs: 4200, arms: 2500, rpe: 8.3 },
  { month: 'May', chest: 5800, back: 4800, legs: 5200, arms: 3200, rpe: 8.9 },
  { month: 'Jun', chest: 5100, back: 4200, legs: 4700, arms: 2900, rpe: 8.6 },
];

export default function TrainingBreakdown() {
  const [period, setPeriod] = useState('6m');

  const colors = {
    chest: '#a855f7',
    back: '#06b6d4',
    legs: '#84cc16',
    arms: '#ec4899',
  };

  return (
    <div className="rounded-3xl p-6" style={{
      background: 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.9) 100%)',
      border: '1.5px solid rgba(34,211,238,0.3)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Advanced Training Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Training Volume (Lbs) by Muscle Group</p>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6 bg-slate-900/40 rounded-xl p-1 w-fit">
        {[
          { value: '6m', label: '6 MONTHS' },
          { value: '1y', label: '1 YEAR' },
          { value: 'all', label: 'ALL TIME' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              period === opt.value
                ? 'bg-slate-800 text-white border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6 -mx-3">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chest-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="back-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="legs-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#84cc16" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="arms-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" stroke="rgba(148,163,184,0.6)" style={{ fontSize: '11px' }} />
            <YAxis stroke="rgba(148,163,184,0.6)" style={{ fontSize: '11px' }} label={{ value: 'Lbs', angle: -90, position: 'insideLeft', offset: 10, style: { fill: 'rgba(148,163,184,0.8)', fontSize: '11px' } }} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: '8px',
                padding: '8px',
              }}
              labelStyle={{ color: '#fff' }}
              cursor={{ stroke: 'rgba(34,211,238,0.2)', strokeWidth: 2 }}
            />
            <Area type="monotone" dataKey="chest" stackId="1" stroke={colors.chest} fill="url(#chest-gradient)" isAnimationActive={true} />
            <Area type="monotone" dataKey="back" stackId="1" stroke={colors.back} fill="url(#back-gradient)" isAnimationActive={true} />
            <Area type="monotone" dataKey="legs" stackId="1" stroke={colors.legs} fill="url(#legs-gradient)" isAnimationActive={true} />
            <Area type="monotone" dataKey="arms" stackId="1" stroke={colors.arms} fill="url(#arms-gradient)" isAnimationActive={true} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-slate-700/50">
        {Object.entries(colors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs text-slate-300 capitalize">{key}</span>
          </div>
        ))}
      </div>

      {/* RPE Trend */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Average RPE by Month</div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={mockData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="month" stroke="rgba(148,163,184,0.4)" style={{ fontSize: '10px' }} />
            <YAxis stroke="rgba(148,163,184,0.4)" style={{ fontSize: '10px' }} domain={[7, 9]} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.95)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: '8px',
                padding: '6px',
              }}
              labelStyle={{ color: '#fff', fontSize: '11px' }}
            />
            <Line type="monotone" dataKey="rpe" stroke="#e879f9" strokeWidth={2} dot={{ fill: '#e879f9', r: 3 }} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
          <p className="text-xs text-cyan-400 font-semibold mb-1">Strength Growth</p>
          <p className="text-sm font-bold text-white">+15% <span className="text-cyan-400">(Chest)</span></p>
          <p className="text-[10px] text-slate-400 mt-1">↗ Peak in May</p>
        </div>
        <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400 font-semibold mb-1">Leg Focus</p>
          <p className="text-sm font-bold text-white">Peak in May</p>
          <p className="text-[10px] text-slate-400 mt-1">🚀 5,200 lbs</p>
        </div>
      </div>

      {/* PR Badge */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl px-3 py-2">
          <span className="text-[10px] font-bold text-cyan-300 uppercase">PR</span>
          <span className="text-xs text-white">Deadlift 405 lbs • Mar 12</span>
        </div>
      </div>
    </div>
  );
}