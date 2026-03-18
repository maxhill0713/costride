import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { format, subMonths } from 'date-fns';

// ─── Muscle group → exercise keyword map ─────────────────────────────────────
const MUSCLE_GROUPS = [
  { id: 'chest',     label: 'Chest',
    keywords: ['bench','chest','fly','flye','flies','pec','push','dip','incline press','decline','cable cross'] },
  { id: 'back',      label: 'Back',
    keywords: ['row','pull','lat','deadlift','pulldown','chin','rdl','cable row','t-bar','back'] },
  { id: 'shoulders', label: 'Shoulders',
    keywords: ['shoulder','press','lateral','front raise','face pull','arnold','overhead','ohp','delt','shrug'] },
  { id: 'arms',      label: 'Arms',
    keywords: ['curl','bicep','hammer','preacher','incline curl','concentration','ez bar curl'] },
  { id: 'triceps',   label: 'Triceps',
    keywords: ['tricep','skull','pushdown','extension','overhead tri','close grip','dip'] },
  { id: 'legs',      label: 'Legs',
    keywords: ['squat','leg','lunge','deadlift','calf','hip thrust','glute','hamstring','quad','rdl','hack'] },
];

const PERIODS = [
  { key: '1m',  label: '1M',  months: 1  },
  { key: '3m',  label: '3M',  months: 3  },
  { key: '6m',  label: '6M',  months: 6  },
  { key: 'all', label: 'All', months: null },
];

// 12 distinct colours for exercise lines
const LINE_COLORS = [
  '#60a5fa','#34d399','#f97316','#f472b6','#a78bfa','#fbbf24',
  '#38bdf8','#fb7185','#4ade80','#facc15','#c084fc','#f87171',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function matchesMuscleGroup(exerciseName, group) {
  if (!exerciseName || !group) return false;
  const lower = exerciseName.toLowerCase();
  return group.keywords.some(kw => lower.includes(kw));
}

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
      borderRadius: 10,
      padding: '10px 14px',
      backdropFilter: 'blur(12px)',
      minWidth: 160,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
      {payload
        .filter(p => p.value !== null && p.value !== undefined)
        .sort((a, b) => b.value - a.value)
        .map(p => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', fontSize: 10, flex: 1, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{p.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 800,
              color: p.value > 0 ? '#34d399' : p.value < 0 ? '#f87171' : '#64748b',
            }}>
              {p.value > 0 ? '+' : ''}{p.value}kg
            </span>
          </div>
        ))}
    </div>
  );
}

// ─── Muscle Group Pill Selector ───────────────────────────────────────────────
function MuscleGroupSelector({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const current = MUSCLE_GROUPS.find(g => g.id === selected);
  return (
    <div style={{ position: 'relative' }}>
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
        <span style={{ flex: 1, textAlign: 'left' }}>{current?.label ?? 'Select'}</span>
        <ChevronDown size={13} color="#64748b"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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
            {MUSCLE_GROUPS.map(g => (
              <button
                key={g.id}
                onClick={() => { onSelect(g.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px',
                  background: selected === g.id ? 'rgba(96,165,250,0.12)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: selected === g.id ? '#60a5fa' : '#94a3b8',
                }}>{g.label}</span>
                {selected === g.id && (
                  <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#60a5fa' }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Summary badges below chart ───────────────────────────────────────────────
function ExerciseSummaryBadge({ name, diff, color }) {
  const Icon = diff > 0.5 ? TrendingUp : diff < -0.5 ? TrendingDown : Minus;
  const textColor = diff > 0.5 ? '#34d399' : diff < -0.5 ? '#f87171' : '#64748b';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 8,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}30`,
      flexShrink: 0,
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
  const [period, setPeriod]       = useState('3m');
  const [muscleGroup, setMuscleGroup] = useState('chest');

  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter(
      { user_id: currentUser.id }, '-completed_date', 500
    ),
    enabled: !!currentUser,
    staleTime: 2 * 60 * 1000,
    placeholderData: prev => prev,
  });

  const selectedGroup = MUSCLE_GROUPS.find(g => g.id === muscleGroup);

  // ── Filter logs by period ──────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    const p = PERIODS.find(p => p.key === period);
    const cutoff = p.months ? subMonths(new Date(), p.months) : null;
    return workoutLogs.filter(log => {
      if (!cutoff) return true;
      const d = new Date(log.completed_date || log.created_date);
      return d >= cutoff;
    });
  }, [workoutLogs, period]);

  // ── Build per-exercise time series ────────────────────────────────────────
  // { exerciseName: [ { date, rawDate, weight } ] }
  const exerciseSeriesMap = useMemo(() => {
    if (!selectedGroup) return {};
    const map = {}; // exerciseName → sorted array of { rawDate, weight }

    // Use ALL logs to find exercises that match the muscle group,
    // but only include data points within the period
    workoutLogs.forEach(log => {
      const logDate = new Date(log.completed_date || log.created_date);
      (log.exercises || []).forEach(ex => {
        const name = ex.exercise || ex.name;
        if (!name) return;
        if (!matchesMuscleGroup(name, selectedGroup)) return;
        const w = parseFloat(ex.weight);
        if (!w || w <= 0) return;
        if (!map[name]) map[name] = [];
        map[name].push({ rawDate: logDate, weight: w });
      });
    });

    // Sort each series by date
    Object.values(map).forEach(arr => arr.sort((a, b) => a.rawDate - b.rawDate));
    return map;
  }, [workoutLogs, selectedGroup]);

  // ── All exercise names for this muscle group (from all-time data) ──────────
  const allExerciseNames = useMemo(() => Object.keys(exerciseSeriesMap), [exerciseSeriesMap]);

  // ── Build chart data ───────────────────────────────────────────────────────
  // Each workout log session = one data point (not deduplicated by date).
  // Y axis = kg difference from each exercise's personal baseline.
  // New exercises: show 0kg from period start until their first log.
  const { chartData, exerciseMeta } = useMemo(() => {
    if (!allExerciseNames.length) return { chartData: [], exerciseMeta: [] };

    const p = PERIODS.find(p => p.key === period);
    const cutoff = p.months ? subMonths(new Date(), p.months) : null;
    const periodStart = cutoff || (
      allExerciseNames.reduce((earliest, name) => {
        const first = exerciseSeriesMap[name]?.[0]?.rawDate;
        return first && first < earliest ? first : earliest;
      }, new Date())
    );

    // For each exercise, baseline = first ever data point for that exercise
    // (regardless of period — so "new" exercises added mid-period start at 0)
    const baselines = {};
    allExerciseNames.forEach(name => {
      const series = exerciseSeriesMap[name];
      if (!series.length) return;
      // baseline is the very first logged weight for this exercise
      baselines[name] = series[0].weight;
    });

    // Collect every individual log session as a separate data point
    // Each point: { rawDate, sessionIndex, label, [exerciseName]: kgDiff }
    // We build a flat array of { rawDate, exerciseName, weight } tuples first
    const allPoints = []; // { rawDate, name, weight }
    allExerciseNames.forEach(name => {
      const series = exerciseSeriesMap[name];
      series.forEach(({ rawDate, weight }) => {
        if (cutoff && rawDate < cutoff) return;
        allPoints.push({ rawDate, name, weight });
      });
    });

    // Sort all points by date
    allPoints.sort((a, b) => a.rawDate - b.rawDate);

    // Build unique timeline — each unique (date+session) combo gets a row.
    // We need to know which dates have data for any exercise.
    // Group by date string, keeping all entries
    const dateGroups = {}; // dateStr → [ { name, weight, rawDate } ]
    allPoints.forEach(pt => {
      const dateStr = format(pt.rawDate, 'MMM d');
      if (!dateGroups[dateStr]) dateGroups[dateStr] = [];
      dateGroups[dateStr].push(pt);
    });

    const sortedDateStrs = Object.keys(dateGroups).sort((a, b) => {
      const tA = dateGroups[a][0].rawDate.getTime();
      const tB = dateGroups[b][0].rawDate.getTime();
      return tA - tB;
    });

    // Build rows — one row per date that has any data.
    // For exercises with no data on a given date: null (gap in line).
    // For exercises that haven't started yet: 0 (flat baseline).
    const rows = sortedDateStrs.map(dateStr => {
      const row = { date: dateStr };
      const pointsOnDay = dateGroups[dateStr];
      const dayTimestamp = dateGroups[dateStr][0].rawDate;

      allExerciseNames.forEach(name => {
        const baseline = baselines[name];
        const firstEntry = exerciseSeriesMap[name]?.[0];

        // Has this exercise been logged at all before or on this date?
        const exerciseStarted = firstEntry && firstEntry.rawDate <= dayTimestamp;

        if (!exerciseStarted) {
          // Exercise hasn't been introduced yet — show 0 (flat line at baseline)
          row[name] = 0;
        } else {
          // Find if this exercise was logged on this day
          const dayEntry = pointsOnDay.find(pt => pt.name === name);
          if (dayEntry) {
            row[name] = kgDiff(dayEntry.weight, baseline);
          } else {
            // Exercise exists but not logged today — null (gap, no dot)
            row[name] = null;
          }
        }
      });

      return row;
    });

    // Exercise metadata — final kg diff for badges
    const meta = allExerciseNames.map((name, i) => {
      const lastRow = [...rows].reverse().find(r => r[name] !== null && r[name] !== undefined);
      return {
        name,
        color: LINE_COLORS[i % LINE_COLORS.length],
        finalDiff: lastRow ? lastRow[name] : 0,
      };
    });

    // Sort: biggest gainers first
    meta.sort((a, b) => b.finalDiff - a.finalDiff);

    return { chartData: rows, exerciseMeta: meta };
  }, [allExerciseNames, exerciseSeriesMap, period]);

  // ── Y-axis domain: auto with a bit of padding ──────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      borderRadius: 20,
      overflow: 'hidden',
      background: 'linear-gradient(160deg, rgba(15,20,45,0.88) 0%, rgba(8,11,26,0.96) 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #60a5fa, #a78bfa, transparent)' }} />

      <div style={{ padding: '18px 18px 20px' }}>

        {/* ── Title — full width ────────────────────────────────────────── */}
        <h2 style={{
          fontSize: 18, fontWeight: 900, color: '#f1f5f9',
          letterSpacing: '-0.02em', margin: '0 0 14px', lineHeight: 1.2,
          width: '100%',
        }}>
          Progressive Overload Tracker
        </h2>

        {/* ── Controls row: muscle group selector + period picker ─────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>

          {/* Muscle group dropdown — takes remaining space */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <MuscleGroupSelector selected={muscleGroup} onSelect={setMuscleGroup} />
          </div>

          {/* Period selector — fixed width, compact */}
          <div style={{
            display: 'flex', gap: 2, padding: 3, borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                style={{
                  padding: '4px 8px', borderRadius: 7, border: 'none',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: period === p.key ? 'rgba(255,255,255,0.11)' : 'transparent',
                  color: period === p.key ? '#f1f5f9' : '#475569',
                  transition: 'all 0.15s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chart area ────────────────────────────────────────────────── */}
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
              No {selectedGroup?.label} data yet
            </p>
            <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center', maxWidth: 200 }}>
              Log workouts with {selectedGroup?.label.toLowerCase()} exercises to track progressive overload
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  vertical={false}
                />

                {/* Zero reference line */}
                <ReferenceLine
                  y={0}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={1.5}
                  strokeDasharray="none"
                />

                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.05)"
                  tick={{ fill: '#334155', fontSize: 9, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="rgba(255,255,255,0.05)"
                  tick={{ fill: '#334155', fontSize: 9, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
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

            {/* ── Exercise summary badges ──────────────────────────────── */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12,
              paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              {exerciseMeta.map(({ name, color, finalDiff }) => (
                <ExerciseSummaryBadge key={name} name={name} diff={finalDiff} color={color} />
              ))}
            </div>

            {/* ── Insight callout ─────────────────────────────────────── */}
            {exerciseMeta.length > 1 && (() => {
              const best    = exerciseMeta[0];
              const worst   = exerciseMeta[exerciseMeta.length - 1];
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
                  {best.finalDiff <= 0.5 && worst.finalDiff >= -0.5 && stalled.length === exerciseMeta.length && (
                    <span>All exercises are holding steady. Push the weight up to drive overload.</span>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}