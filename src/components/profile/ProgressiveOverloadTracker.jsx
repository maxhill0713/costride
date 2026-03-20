import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { format, subMonths } from 'date-fns';

const LINE_COLORS = [
  '#60a5fa','#34d399','#f97316','#f472b6','#a78bfa','#fbbf24',
  '#38bdf8','#fb7185','#4ade80','#facc15','#c084fc','#f87171',
];

const CUTOFF_MONTHS = 3;

function kgDiff(current, baseline) {
  if (baseline === null || baseline === undefined) return 0;
  return +(current - baseline).toFixed(1);
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
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700,
        letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      {payload
        .filter(p => p.value !== null && p.value !== undefined)
        .sort((a, b) => b.value - a.value)
        .map(p => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', fontSize: 10, flex: 1, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{p.name}</span>
            <span style={{ fontSize: 11, fontWeight: 800,
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
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 10, width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: '#e2e8f0', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          transition: 'border-color 0.15s',
        }}>
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.label ?? 'Select workout'}
        </span>
        <ChevronDown size={13} color="#64748b"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
            background: 'rgba(10,14,30,0.98)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
          }}>
            {options.map(opt => (
              <button
                key={opt.key}
                onClick={() => { onSelect(opt.key); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px',
                  background: selected === opt.key ? 'rgba(96,165,250,0.12)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span style={{ fontSize: 12, fontWeight: 700,
                  color: selected === opt.key ? '#60a5fa' : '#94a3b8' }}>
                  {opt.label}
                </span>
                {selected === opt.key && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6,
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

// ─── Summary badges ───────────────────────────────────────────────────────────
function ExerciseSummaryBadge({ name, diff, color }) {
  const Icon = diff > 0.5 ? TrendingUp : diff < -0.5 ? TrendingDown : Minus;
  const textColor = diff > 0.5 ? '#34d399' : diff < -0.5 ? '#f87171' : '#64748b';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 8,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}30`, flexShrink: 0,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8',
        maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Icon size={10} color={textColor} />
        <span style={{ fontSize: 10, fontWeight: 800, color: textColor }}>
          {diff > 0 ? '+' : ''}{diff}kg
        </span>
      </div>
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
    const cutoff = subMonths(new Date(), CUTOFF_MONTHS);
    const baselines = {};
    allExerciseNames.forEach(name => {
      const series = exerciseSeriesMap[name];
      if (series?.length) baselines[name] = series[0].weight;
    });
    const allPoints = [];
    allExerciseNames.forEach(name => {
      exerciseSeriesMap[name].forEach(({ rawDate, weight }) => {
        if (rawDate < cutoff) return;
        allPoints.push({ rawDate, name, weight });
      });
    });
    allPoints.sort((a, b) => a.rawDate - b.rawDate);
    const dateGroups = {};
    allPoints.forEach(pt => {
      const dateStr = format(pt.rawDate, 'MMM d');
      if (!dateGroups[dateStr]) dateGroups[dateStr] = { pts: [], ts: pt.rawDate.getTime() };
      dateGroups[dateStr].pts.push(pt);
    });
    const sortedDateStrs = Object.keys(dateGroups).sort((a, b) => dateGroups[a].ts - dateGroups[b].ts);
    const rows = sortedDateStrs.map(dateStr => {
      const row = { date: dateStr };
      const { pts, ts } = dateGroups[dateStr];
      const dayTimestamp = new Date(ts);
      allExerciseNames.forEach(name => {
        const baseline = baselines[name];
        const firstEntry = exerciseSeriesMap[name]?.[0];
        const exerciseStarted = firstEntry && firstEntry.rawDate <= dayTimestamp;
        if (!exerciseStarted) {
          row[name] = 0;
        } else {
          const dayEntry = pts.find(pt => pt.name === name);
          row[name] = dayEntry ? kgDiff(dayEntry.weight, baseline) : null;
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
      {/* ── Title ── */}
      <h2 style={{
        fontSize: 18, fontWeight: 900, color: '#f1f5f9',
        letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.2, width: '100%',
      }}>
        Progressive Overload Tracker
      </h2>

      {/* ── Workout selector ── */}
      {workoutOptions.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <WorkoutSelector
            options={workoutOptions}
            selected={validKey}
            onSelect={setSelectedWorkoutKey}
          />
        </div>
      ) : (
        <p style={{ fontSize: 11, color: '#475569', marginBottom: 16 }}>
          No workout split configured yet.
        </p>
      )}

      {/* ── Chart ── */}
      {isLoading ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%',
            border: '2px solid rgba(96,165,250,0.25)', borderTopColor: '#60a5fa',
            animation: 'spin 0.7s linear infinite' }} />
          <span style={{ color: '#475569', fontSize: 12 }}>Loading…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : !hasData ? (
        <div style={{ height: 220, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <p style={{ color: '#475569', fontSize: 13, fontWeight: 700, margin: 0 }}>
            No data for {selectedWorkout?.label ?? 'this workout'} yet
          </p>
          <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center', maxWidth: 220 }}>
            Log this workout to start tracking progressive overload
          </p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.05)"
                tick={{ fill: '#334155', fontSize: 9, fontWeight: 600 }}
                tickLine={false} axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="rgba(255,255,255,0.05)"
                tick={{ fill: '#334155', fontSize: 9, fontWeight: 600 }}
                tickLine={false} axisLine={false}
                width={44}
                domain={yDomain}
                tickFormatter={v => `${v > 0 ? '+' : ''}${v}kg`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
              {exerciseMeta.map(({ name, color }) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: '#0a0e1e', strokeWidth: 2 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* ── Exercise badges ── */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12,
            paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            {exerciseMeta.map(({ name, color, finalDiff }) => (
              <ExerciseSummaryBadge key={name} name={name} diff={finalDiff} color={color} />
            ))}
          </div>

          {/* ── Insight callout ── */}
          {exerciseMeta.length > 1 && (() => {
            const best  = exerciseMeta[0];
            const worst = exerciseMeta[exerciseMeta.length - 1];
            const stalled = exerciseMeta.filter(e => Math.abs(e.finalDiff) < 0.5);
            return (
              <div style={{
                marginTop: 10, padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 11, color: '#64748b', lineHeight: 1.5,
              }}>
                {best.finalDiff > 0.5 && (
                  <span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>↑ {best.name}</span>
                    {' '}is your best gainer (+{best.finalDiff}kg).{' '}
                  </span>
                )}
                {worst.finalDiff < -0.5 && (
                  <span>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>↓ {worst.name}</span>
                    {' '}has regressed ({worst.finalDiff}kg).{' '}
                  </span>
                )}
                {stalled.length > 0 && stalled.length < exerciseMeta.length && (
                  <span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                      {stalled.map(e => e.name).join(', ')}
                    </span>
                    {' '}{stalled.length === 1 ? 'has' : 'have'} plateaued — consider increasing weight.
                  </span>
                )}
                {best.finalDiff <= 0.5 && worst.finalDiff >= -0.5 && (
                  <span>All exercises are holding steady. Push the weight up to drive overload.</span>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}