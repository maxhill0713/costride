import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const mockData = [
  { month: 'Jan', chest: 3200, back: 2500, legs: 2800, arms: 1800, rpe: 8.2 },
  { month: 'Feb', chest: 4100, back: 3200, legs: 3500, arms: 2200, rpe: 8.5 },
  { month: 'Mar', chest: 5200, back: 4100, legs: 4800, arms: 2800, rpe: 8.8 },
  { month: 'Apr', chest: 4500, back: 3600, legs: 4200, arms: 2500, rpe: 8.3 },
  { month: 'May', chest: 5800, back: 4800, legs: 5200, arms: 3200, rpe: 8.9 },
  { month: 'Jun', chest: 5100, back: 4200, legs: 4700, arms: 2900, rpe: 8.6 },
];

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const colors = {
  chest: '#a855f7',
  back: '#06b6d4',
  legs: '#84cc16',
  arms: '#ec4899',
};

export default function TrainingBreakdown() {
  const [period, setPeriod] = useState('6m');

  return (
    <div className="rounded-2xl p-4" style={CARD}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center border border-purple-500/30">
          <BarChart3 className="w-4 h-4 text-purple-400" />
        </div>
        <h2 className="text-[15px] font-bold text-white">Advanced Training Breakdown</h2>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-4 bg-slate-800/40 rounded-lg p-1 w-fit">
        {[{ value: '6m', label: '6 MONTHS' }, { value: '1y', label: '1 YEAR' }, { value: 'all', label: 'ALL TIME' }].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all ${
              period === opt.value
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'text-slate-400 hover:text-slate-300'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-3 -mx-3">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={mockData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chest-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="back-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="legs-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#84cc16" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="arms-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ec4899" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="month" stroke="rgba(148,163,184,0.5)" style={{ fontSize: '10px' }} />
            <YAxis stroke="rgba(148,163,184,0.5)" style={{ fontSize: '10px' }} width={35} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: '6px',
                padding: '6px 8px',
              }}
              labelStyle={{ color: '#cbd5e1', fontSize: '10px' }}
              cursor={{ stroke: 'rgba(148,163,184,0.2)' }}
            />
            <Area type="monotone" dataKey="chest" stackId="1" stroke={colors.chest} strokeWidth={1.5} fill="url(#chest-gradient)" />
            <Area type="monotone" dataKey="back" stackId="1" stroke={colors.back} strokeWidth={1.5} fill="url(#back-gradient)" />
            <Area type="monotone" dataKey="legs" stackId="1" stroke={colors.legs} strokeWidth={1.5} fill="url(#legs-gradient)" />
            <Area type="monotone" dataKey="arms" stackId="1" stroke={colors.arms} strokeWidth={1.5} fill="url(#arms-gradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-slate-700/50">
        {Object.entries(colors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-slate-400 capitalize">{key}</span>
          </div>
        ))}
      </div>

      {/* RPE Line */}
      <div className="mb-3">
        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Avg RPE</p>
        <ResponsiveContainer width="100%" height={70}>
          <LineChart data={mockData} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
            <XAxis dataKey="month" stroke="rgba(148,163,184,0.3)" style={{ fontSize: '9px' }} />
            <YAxis stroke="rgba(148,163,184,0.3)" style={{ fontSize: '9px' }} width={30} domain={[7.5, 9.5]} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.9)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: '6px',
                padding: '4px 6px',
              }}
              labelStyle={{ color: '#cbd5e1', fontSize: '9px' }}
            />
            <Line type="monotone" dataKey="rpe" stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg p-3 bg-cyan-500/8 border border-cyan-500/15">
          <p className="text-[10px] text-cyan-400/80 font-semibold mb-0.5">Strength Growth</p>
          <p className="text-xs font-bold text-white">+15% <span className="text-cyan-400">(Chest)</span></p>
        </div>
        <div className="rounded-lg p-3 bg-amber-500/8 border border-amber-500/15">
          <p className="text-[10px] text-amber-400/80 font-semibold mb-0.5">Peak Lift</p>
          <p className="text-xs font-bold text-white">405 lbs PR <span className="text-amber-400">(DL)</span></p>
        </div>
      </div>
    </div>
  );
}