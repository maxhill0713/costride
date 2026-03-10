import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import { format, subMonths } from 'date-fns';

const EXERCISES = [
  { key: 'bench_press',     label: 'Bench Press',     color: '#a78bfa' },
  { key: 'squat',           label: 'Squat',            color: '#34d399' },
  { key: 'deadlift',        label: 'Deadlift',         color: '#f97316' },
  { key: 'overhead_press',  label: 'OHP',              color: '#60a5fa' },
  { key: 'barbell_row',     label: 'Barbell Row',      color: '#f472b6' },
  { key: 'power_clean',     label: 'Power Clean',      color: '#fbbf24' },
];

const PERIODS = [
  { key: '3m', label: '3M', months: 3 },
  { key: '6m', label: '6M', months: 6 },
  { key: '1y', label: '1Y', months: 12 },
  { key: 'all', label: 'All', months: null },
];

const CARD = {
  background: 'linear-gradient(135deg, rgba(30,35,60,0.72) 0%, rgba(8,10,20,0.88) 100%)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(10,14,30,0.95)',
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 700 }}>{d.weight} lbs × {d.reps} reps</p>
      {d.is_pr && <p style={{ color: '#fbbf24', fontWeight: 700, marginTop: 2 }}>⭐ Personal Record</p>}
    </div>
  );
}

export default function StrengthProgress({ currentUser }) {
  const [exercise, setExercise] = useState(null);
  const [period, setPeriod]     = useState('6m');
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: lifts = [], isLoading } = useQuery({
    queryKey: ['lifts', currentUser?.id],
    queryFn: () => base44.entities.Lift.filter({ member_id: currentUser.id }, 'lift_date', 500),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Parse split data
  const split = useMemo(() => {
    const s = currentUser?.custom_workout_types || currentUser?.workout_split;
    if (!s || typeof s !== 'object') return {};
    return s;
  }, [currentUser?.custom_workout_types, currentUser?.workout_split]);

  const splitDays = useMemo(() => Object.keys(split).filter((k) => split[k]), [split]);

  // Get exercises for selected day
  const availableExercises = useMemo(() => {
    if (!selectedDay || !split[selectedDay]) return [];
    const dayExercises = split[selectedDay];
    if (Array.isArray(dayExercises)) {
      return dayExercises.map((ex) => EXERCISES.find((e) => e.key === ex)).filter(Boolean);
    }
    if (typeof dayExercises === 'string') {
      return EXERCISES.filter((e) => e.key === dayExercises);
    }
    return [];
  }, [selectedDay, split]);

  // Initialize first exercise when day changes
  React.useEffect(() => {
    if (availableExercises.length > 0) {
      setExercise(availableExercises[0].key);
    } else {
      setExercise(null);
    }
  }, [availableExercises]);

  // Auto-select first day if not selected
  React.useEffect(() => {
    if (!selectedDay && splitDays.length > 0) {
      setSelectedDay(splitDays[0]);
    }
  }, [splitDays, selectedDay]);

  const selectedExercise = EXERCISES.find((e) => e.key === exercise);

  // Which exercises actually have data from split
  const exercisesWithData = useMemo(() => {
    const set = new Set(lifts.map((l) => l.exercise));
    return availableExercises.filter((e) => set.has(e.key));
  }, [lifts, availableExercises]);

  const chartData = useMemo(() => {
    const cutoff = period !== 'all'
      ? subMonths(new Date(), PERIODS.find((p) => p.key === period).months)
      : null;

    return lifts
      .filter((l) => l.exercise === exercise)
      .filter((l) => !cutoff || new Date(l.lift_date || l.created_date) >= cutoff)
      .sort((a, b) => new Date(a.lift_date || a.created_date) - new Date(b.lift_date || b.created_date))
      .map((l) => ({
        date: format(new Date(l.lift_date || l.created_date), 'MMM d'),
        weight: l.weight_lbs,
        reps: l.reps || 1,
        is_pr: l.is_pr,
      }));
  }, [lifts, exercise, period]);

  // Stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const max = Math.max(...chartData.map((d) => d.weight));
    const recent = chartData[chartData.length - 1]?.weight;
    const first = chartData[0]?.weight;
    const change = first ? ((recent - first) / first * 100).toFixed(1) : 0;
    const prs = chartData.filter((d) => d.is_pr).length;
    return { max, recent, change, prs };
  }, [chartData]);

  const color = selectedExercise?.color ?? '#a78bfa';
  const yDomain = chartData.length > 0
    ? [Math.floor(Math.min(...chartData.map((d) => d.weight)) * 0.92 / 5) * 5,
       Math.ceil(Math.max(...chartData.map((d) => d.weight)) * 1.06 / 5) * 5]
    : ['auto', 'auto'];

  return (
    <div className="rounded-2xl p-4 space-y-4" style={CARD}>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center border"
          style={{ background: `${color}22`, borderColor: `${color}55` }}>
          <TrendingUp className="w-4 h-4" style={{ color }} />
        </div>
        <h2 className="text-[15px] font-bold text-white">Strength Progress</h2>
      </div>

      {/* Split day selector */}
      {splitDays.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {splitDays.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all capitalize"
              style={{
                background: selectedDay === day ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)',
                color: selectedDay === day ? '#d8b4fe' : '#94a3b8',
                border: `1px solid ${selectedDay === day ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {/* Exercise pills */}
      {availableExercises.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {availableExercises.map((ex) => {
            const hasData = exercisesWithData.some((e) => e.key === ex.key);
            return (
              <button
                key={ex.key}
                onClick={() => setExercise(ex.key)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  background: exercise === ex.key ? ex.color : 'rgba(255,255,255,0.06)',
                  color: exercise === ex.key ? '#000' : hasData ? ex.color : 'rgba(148,163,184,0.5)',
                  border: `1px solid ${exercise === ex.key ? ex.color : hasData ? `${ex.color}44` : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {ex.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-1 bg-slate-800/40 rounded-lg p-1 w-fit">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className="px-3 py-1 text-[11px] font-semibold rounded-md transition-all"
            style={{
              background: period === p.key ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: period === p.key ? '#fff' : '#94a3b8',
              border: period === p.key ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: color, borderTopColor: 'transparent' }} />
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center gap-2">
          <TrendingUp className="w-8 h-8 text-slate-600" />
          <p className="text-slate-500 text-sm font-semibold">No {selectedExercise?.label} lifts logged yet</p>
          <p className="text-slate-600 text-xs">Log a lift to see your progress here</p>
        </div>
      ) : (
        <>
          {/* Stat pills */}
          {stats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-3 text-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: `${color}bb` }}>Max</p>
                <p className="text-sm font-black text-white">{stats.max}<span className="text-[10px] font-semibold ml-0.5" style={{ color }}>lbs</span></p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: `${color}bb` }}>Latest</p>
                <p className="text-sm font-black text-white">{stats.recent}<span className="text-[10px] font-semibold ml-0.5" style={{ color }}>lbs</span></p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                <p className="text-[10px] font-semibold mb-0.5" style={{ color: `${color}bb` }}>Change</p>
                <p className="text-sm font-black flex items-center justify-center gap-0.5"
                  style={{ color: parseFloat(stats.change) > 0 ? '#34d399' : parseFloat(stats.change) < 0 ? '#f87171' : '#94a3b8' }}>
                  {parseFloat(stats.change) > 0 ? <TrendingUp className="w-3 h-3" /> : parseFloat(stats.change) < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {Math.abs(stats.change)}%
                </p>
              </div>
            </div>
          )}

          <div className="-mx-2">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`sg-${exercise}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(148,163,184,0.4)"
                  style={{ fontSize: 9 }}
                  tick={{ fill: '#94a3b8' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="rgba(148,163,184,0.4)"
                  style={{ fontSize: 9 }}
                  tick={{ fill: '#94a3b8' }}
                  width={38}
                  domain={yDomain}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: `${color}44`, strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload.is_pr) {
                      return (
                        <g key={`pr-${cx}-${cy}`}>
                          <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.2} />
                          <circle cx={cx} cy={cy} r={3.5} fill={color} />
                          <text x={cx} y={cy - 10} textAnchor="middle" fontSize={10}>⭐</text>
                        </g>
                      );
                    }
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={2.5} fill={color} opacity={0.7} />;
                  }}
                  activeDot={{ r: 5, fill: color, stroke: '#0a0e1e', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {stats?.prs > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <p className="text-[11px] text-amber-300 font-semibold">{stats.prs} personal record{stats.prs > 1 ? 's' : ''} set in this period</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}