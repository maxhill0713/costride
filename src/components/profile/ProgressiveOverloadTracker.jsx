import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import { format, subMonths, startOfDay } from 'date-fns';

const LINE_COLORS = [
  '#60a5fa','#34d399','#f97316','#f472b6','#a78bfa','#fbbf24',
  '#38bdf8','#fb7185','#4ade80','#facc15','#c084fc','#f87171',
];

const CUTOFF_MONTHS = 2;

function kgDiff(current, baseline) {
  if (baseline === null || baseline === undefined) return 0;
  return +(current - baseline).toFixed(1);
}

function truncateName(name, max = 13) {
  if (!name) return '';
  return name.length > max ? name.slice(0, max).trimEnd() + '…' : name;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(8,12,28,0.97)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 10, padding: '10px 14px',
      backdropFilter: 'blur(12px)', minWidth: 160,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 600,
        letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      {payload
        .filter(p => p.value !== null && p.value !== undefined)
        .sort((a, b) => b.value - a.value)
        .map(p => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', fontSize: 10, flex: 1, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{p.name}</span>
            <span style={{ fontSize: 11, fontWeight: 700,
              color: p.value > 0 ? '#34d399' : p.value < 0 ? '#f87171' : '#64748b' }}>
              {p.value > 0 ? '+' : ''}{p.value}kg
            </span>
          </div>
        ))}
    </div>
  );
}

// ─── Workout Selector Dropdown ────────────────────────────────────────────────
function WorkoutSelector({ options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.key === selected);

  return (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: '#cbd5e1', fontSize: 11, fontWeight: 600,
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
          {current?.label ?? 'Select'}
        </span>
        <ChevronDown size={11} color="#64748b"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20,
            background: 'rgba(10,14,30,0.98)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10, overflow: 'hidden', minWidth: 130,
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
          }}>
            {options.map(opt => (
              <button
                key={opt.key}
                onClick={() => { onSelect(opt.key); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '9px 12px',
                  background: selected === opt.key ? 'rgba(96,165,250,0.10)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span style={{ fontSize: 12, fontWeight: selected === opt.key ? 700 : 500,
                  color: selected === opt.key ? '#60a5fa' : '#94a3b8' }}>
                  {opt.label}
                </span>
                {selected === opt.key && (
                  <div style={{ marginLeft: 'auto', width: 5, height: 5,
                    borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProgressiveOverloadTracker({ currentUser }) {
  const workoutOptions = useMemo(() => {
    const types = currentUser?.custom_workout_types;
    if (!types || typeof types !== 'object') return [];
    return Object.entries(types)
      .filter(([, w]) => w?.name && w?.exercises?.length > 0)
      .map(([dayKey, w]) => ({
        key: dayKey,
        label: w.name,
        exercises: (w.exercises || []).map(ex => ex.exercise || ex.name).filter(Boolean),
      }))
      .filter((opt, idx, arr) => arr.findIndex(o => o.label === opt.label) === idx);
  }, [currentUser]);

  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState(() => workoutOptions[0]?.key ?? null);

  const validKey = workoutOptions.find(o => o.key === selectedWorkoutKey)
    ? selectedWorkoutKey
    : workoutOptions[0]?.key ?? null;

  const selectedWorkout = workoutOptions.find(o => o.key === validKey);
  const targetExercises = selectedWorkout?.exercises ?? [];

  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter(
      { user_id: currentUser.id }, '-completed_date', 500
    ),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    placeholderData: prev => prev,
  });

  const exerciseSeriesMap = useMemo(() => {
    if (!targetExercises.length) return {};
    const map = {};
    workoutLogs.forEach(log => {
      const logDate = new Date(log.completed_date || log.created_date);
      (log.exercises || []).forEach(ex => {
        const name = ex.exercise || ex.name;
        if (!name) return;
        const matched = targetExercises.find(t => t.toLowerCase() === name.toLowerCase());
        if (!matched) return;
        const w = parseFloat(ex.weight);
        if (!w || w <= 0) return;
        if (!map[matched]) map[matched] = [];
        map[matched].push({ rawDate: logDate, weight: w });
      });
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.rawDate - b.rawDate));
    return map;
  }, [workoutLogs, targetExercises]);

  const allExerciseNames = useMemo(() => Object.keys(exerciseSeriesMap), [exerciseSeriesMap]);

  const { chartData, exerciseMeta } = useMemo(() => {
    if (!allExerciseNames.length) return { chartData: [], exerciseMeta: [] };

    const now = new Date();
    const cutoff = subMonths(now, CUTOFF_MONTHS);

    const baselines = {};
    allExerciseNames.forEach(name => {
      const series = exerciseSeriesMap[name];
      if (series?.length) baselines[name] = series[0].weight;
    });

    const totalDays = Math.round((now - cutoff) / 86400000);
    const tickCount = Math.min(9, Math.max(5, Math.round(totalDays / 7)));
    const tickDates = Array.from({ length: tickCount }, (_, i) => {
      const t = new Date(cutoff.getTime() + (i / (tickCount - 1)) * (now.getTime() - cutoff.getTime()));
      return startOfDay(t);
    });

    const rows = tickDates.map(tickDate => {
      const row = { date: format(tickDate, 'MMM d') };
      allExerciseNames.forEach(name => {
        const series = exerciseSeriesMap[name] || [];
        const candidates = series.filter(pt => pt.rawDate <= tickDate);
        if (candidates.length === 0) {
          row[name] = null;
        } else {
          const latest = candidates[candidates.length - 1];
          row[name] = kgDiff(latest.weight, baselines[name]);
        }
      });
      return row;
    });

    const meta = allExerciseNames.map((name, i) => {
      const lastRow = [...rows].reverse().find(r => r[name] !== null && r[name] !== undefined);
      return { name, color: LINE_COLORS[i % LINE_COLORS.length], finalDiff: lastRow ? lastRow[name] : 0 };
    });
    meta.sort((a, b) => b.finalDiff - a.finalDiff);
    return { chartData: rows, exerciseMeta: meta };
  }, [allExerciseNames, exerciseSeriesMap]);

  const yDomain = useMemo(() => {
    if (!chartData.length) return [-5, 10];
    let min = 0, max = 0;
    chartData.forEach(row => {
      allExerciseNames.forEach(name => {
        const v = row[name];
        if (v === null || v === undefined) return;
        if (v < min) min = v;
        if (v > max) max = v;
      });
    });
    const pad = Math.max(2, Math.abs(max - min) * 0.15);
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [chartData, allExerciseNames]);

  const hasData = chartData.length > 0 && exerciseMeta.length > 0;

  return (
    <div>
      {/* ── Title left, selector right — with breathing room ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: '#e2e8f0',
            letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2,
          }}>
            Overload Tracker
          </h2>
          <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0', fontWeight: 500 }}>
            Weight change vs. baseline · 2 months
          </p>
        </div>
        {workoutOptions.length > 0 && (
          <WorkoutSelector
            options={workoutOptions}
            selected={validKey}
            onSelect={setSelectedWorkoutKey}
          />
        )}
      </div>

      {/* ── Chart + Legend ── */}
      {isLoading ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%',
            border: '2px solid rgba(96,165,250,0.2)', borderTopColor: '#60a5fa',
            animation: 'spin 0.7s linear infinite' }} />
          <span style={{ color: '#475569', fontSize: 11 }}>Loading…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : !hasData ? (
        <div style={{ height: 200, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <p style={{ color: '#475569', fontSize: 13, fontWeight: 600, margin: 0 }}>
            No data for {selectedWorkout?.label ?? 'this workout'} yet
          </p>
          <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center', maxWidth: 200 }}>
            Log this workout to start tracking overload
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center' }}>

          {/* Chart — 80% width */}
          <div style={{ width: '80%', flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={chartData} margin={{ top: 10, right: 4, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                {/* Zero baseline — solid, readable */}
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.04)"
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 500 }}
                  tickLine={false} axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.04)"
                  // Bumped from #334155 to #475569 so ticks are actually readable
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 500 }}
                  tickLine={false} axisLine={false}
                  width={40}
                  domain={yDomain}
                  tickFormatter={v => `${v > 0 ? '+' : ''}${v}kg`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }} />
                {exerciseMeta.map(({ name, color }) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={color}
                    strokeWidth={1.75}
                    dot={false}
                    activeDot={{ r: 3.5, fill: color, stroke: '#0a0e1e', strokeWidth: 1.5 }}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend — 20% width, dot + truncated name, no extra info */}
          <div style={{
            width: '20%',
            paddingLeft: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}>
            {exerciseMeta.map(({ name, color }) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: color, flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 9.5, fontWeight: 500, color: '#64748b',
                  lineHeight: 1.3,
                }}>{truncateName(name)}</span>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}