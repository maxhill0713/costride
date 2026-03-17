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
  { id: 'chest',     label: 'Chest',     emoji: '💪',
    keywords: ['bench','chest','fly','flye','flies','pec','push','dip','incline press','decline','cable cross'] },
  { id: 'back',      label: 'Back',      emoji: '🏋️',
    keywords: ['row','pull','lat','deadlift','pulldown','chin','rdl','cable row','t-bar','back'] },
  { id: 'shoulders', label: 'Shoulders', emoji: '🔝',
    keywords: ['shoulder','press','lateral','front raise','face pull','arnold','overhead','ohp','delt','shrug'] },
  { id: 'arms',      label: 'Arms',      emoji: '💪',
    keywords: ['curl','bicep','hammer','preacher','incline curl','concentration','ez bar curl'] },
  { id: 'triceps',   label: 'Triceps',   emoji: '🔱',
    keywords: ['tricep','skull','pushdown','extension','overhead tri','close grip','dip'] },
  { id: 'legs',      label: 'Legs',      emoji: '🦵',
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

function pctChange(current, baseline) {
  if (!baseline || baseline === 0) return 0;
  return +((( current - baseline) / baseline) * 100).toFixed(1);
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
              {p.value > 0 ? '+' : ''}{p.value}%
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
          padding: '8px 14px', borderRadius: 12, width: '100%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: '#e2e8f0', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          transition: 'border-color 0.15s',
        }}>
        <span style={{ fontSize: 15 }}>{current?.emoji}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{current?.label ?? 'Select muscle group'}</span>
        <ChevronDown size={14} color="#64748b"
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
                  width: '100%', padding: '11px 14px',
                  background: selected === g.id ? 'rgba(96,165,250,0.12)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                <span style={{ fontSize: 15 }}>{g.emoji}</span>
                <span style={{
                  fontSize: 13, fontWeight: 700,
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
function ExerciseSummaryBadge({ name, pct, color }) {
  const Icon = pct > 2 ? TrendingUp : pct < -2 ? TrendingDown : Minus;
  const textColor = pct > 2 ? '#34d399' : pct < -2 ? '#f87171' : '#64748b';
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
          {pct > 0 ? '+' : ''}{pct}%
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
  // Strategy: for each exercise, compute % change from ITS FIRST data point
  // within (or just before) the selected period. Merge all onto a shared date axis.
  const { chartData, exerciseMeta } = useMemo(() => {
    if (!allExerciseNames.length) return { chartData: [], exerciseMeta: [] };

    const p = PERIODS.find(p => p.key === period);
    const cutoff = p.months ? subMonths(new Date(), p.months) : null;

    // For each exercise, find baseline = last data point AT or BEFORE cutoff
    // (or first data point if all data is after cutoff)
    const baselines = {};
    allExerciseNames.forEach(name => {
      const series = exerciseSeriesMap[name];
      if (!series.length) return;
      if (!cutoff) {
        baselines[name] = series[0].weight;
      } else {
        const before = series.filter(d => d.rawDate <= cutoff);
        baselines[name] = before.length > 0
          ? before[before.length - 1].weight  // last point before period = baseline
          : series[0].weight;                  // first point in period = baseline
      }
    });

    // Collect all data points within the period window
    // Merge into a unified sorted list of dates
    const dateSet = new Set();
    const pointsByNameAndDate = {}; // `${name}__${dateStr}` → pct

    allExerciseNames.forEach(name => {
      const baseline = baselines[name];
      const series = exerciseSeriesMap[name];
      series.forEach(({ rawDate, weight }) => {
        if (cutoff && rawDate < cutoff) return;
        const dateStr = format(rawDate, 'MMM d');
        dateSet.add(dateStr + '__' + rawDate.getTime()); // keep sortable
        const key = `${name}__${dateStr}`;
        // If multiple entries on the same date, take the max weight
        const existing = pointsByNameAndDate[key];
        const pct = pctChange(weight, baseline);
        if (existing === undefined || pct > existing) {
          pointsByNameAndDate[key] = pct;
        }
      });
    });

    // Sort dates
    const sortedDates = Array.from(dateSet)
      .sort((a, b) => parseInt(a.split('__')[1]) - parseInt(b.split('__')[1]))
      .map(d => d.split('__')[0]);

    // Deduplicate date labels (multiple exercises may share a date)
    const uniqueDates = [...new Set(sortedDates)];

    // Build rows
    const rows = uniqueDates.map(dateStr => {
      const row = { date: dateStr };
      allExerciseNames.forEach(name => {
        const key = `${name}__${dateStr}`;
        row[name] = pointsByNameAndDate[key] ?? null; // null = no data that day
      });
      return row;
    });

    // Exercise metadata (name, color, final pct for badges)
    const meta = allExerciseNames.map((name, i) => {
      const lastRow = [...rows].reverse().find(r => r[name] !== null);
      return {
        name,
        color: LINE_COLORS[i % LINE_COLORS.length],
        finalPct: lastRow ? lastRow[name] : 0,
      };
    });

    // Sort meta: biggest gainers first
    meta.sort((a, b) => b.finalPct - a.finalPct);

    return { chartData: rows, exerciseMeta: meta };
  }, [allExerciseNames, exerciseSeriesMap, period]);

  // ── Y-axis domain: auto with a bit of padding ──────────────────────────────
  const yDomain = useMemo(() => {
    if (!chartData.length) return [-20, 20];
    let min = 0, max = 0;
    chartData.forEach(row => {
      allExerciseNames.forEach(name => {
        const v = row[name];
        if (v === null || v === undefined) return;
        if (v < min) min = v;
        if (v > max) max = v;
      });
    });
    const pad = Math.max(5, Math.abs(max - min) * 0.15);
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

        {/* ── Header row ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
              Progressive Overload
            </h2>
            <p style={{ fontSize: 10, color: '#475569', fontWeight: 600, margin: '3px 0 0',
              letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              % weight change from baseline
            </p>
          </div>

          {/* Period selector */}
          <div style={{
            display: 'flex', gap: 2, padding: 3, borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                style={{
                  padding: '4px 9px', borderRadius: 7, border: 'none',
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

        {/* ── Muscle Group selector ──────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#334155',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Muscle Group
          </p>
          <MuscleGroupSelector selected={muscleGroup} onSelect={setMuscleGroup} />
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
            <div style={{ fontSize: 32 }}>{selectedGroup?.emoji}</div>
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
              <LineChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
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
                  width={38}
                  domain={yDomain}
                  tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
                />

                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />

                {exerciseMeta.map(({ name, color }) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: color, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: color, stroke: '#0a0e1e', strokeWidth: 2 }}
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
              {exerciseMeta.map(({ name, color, finalPct }) => (
                <ExerciseSummaryBadge key={name} name={name} pct={finalPct} color={color} />
              ))}
            </div>

            {/* ── Insight callout ─────────────────────────────────────── */}
            {exerciseMeta.length > 1 && (() => {
              const best    = exerciseMeta[0];
              const worst   = exerciseMeta[exerciseMeta.length - 1];
              const stalled = exerciseMeta.filter(e => Math.abs(e.finalPct) < 2);
              return (
                <div style={{
                  marginTop: 10, padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 11, color: '#64748b', lineHeight: 1.5,
                }}>
                  {best.finalPct > 2 && (
                    <span>
                      <span style={{ color: '#34d399', fontWeight: 700 }}>↑ {best.name}</span>
                      {' '}is your best gainer (+{best.finalPct}%).{' '}
                    </span>
                  )}
                  {worst.finalPct < -2 && (
                    <span>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>↓ {worst.name}</span>
                      {' '}has regressed ({worst.finalPct}%).{' '}
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
                  {best.finalPct <= 2 && worst.finalPct >= -2 && stalled.length === exerciseMeta.length && (
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