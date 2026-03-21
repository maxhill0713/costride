import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const isRest = val === 0;
  return (
    <div style={{
      background: 'rgba(8,12,28,0.97)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 10, padding: '10px 14px',
      backdropFilter: 'blur(12px)', minWidth: 130,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <p style={{
        color: '#64748b', fontSize: 10, fontWeight: 600,
        letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</p>
      {isRest ? (
        <span style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>Rest day</span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
          <span style={{ color: '#94a3b8', fontSize: 10 }}>Reps</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', marginLeft: 'auto' }}>
            {val.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Custom dot — only on training days ──────────────────────────────────────
function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (!payload || payload.totalReps === 0) return null;
  return <circle cx={cx} cy={cy} r={3.5} fill="#34d399" stroke="#0a0e1e" strokeWidth={2} />;
}

function CustomActiveDot(props) {
  const { cx, cy, payload } = props;
  if (!payload || payload.totalReps === 0) return null;
  return <circle cx={cx} cy={cy} r={5} fill="#34d399" stroke="#0a0e1e" strokeWidth={2} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WeeklyVolumeChart({ currentUser }) {
  const chartData = useMemo(() => {
    const workoutTypes = currentUser?.custom_workout_types;
    const trainingDays = currentUser?.training_days || [];

    return DAY_LABELS.map((label, i) => {
      const dayKey = i + 1;
      const isTrainingDay = trainingDays.includes(dayKey);
      const workout = workoutTypes?.[dayKey];

      if (!isTrainingDay || !workout?.exercises?.length) {
        return { day: label, totalReps: 0, isRest: true };
      }

      let totalReps = 0;
      workout.exercises.forEach(ex => {
        const sets = parseFloat(ex.sets) || 0;
        const reps =
          parseFloat(ex.reps) ||
          parseFloat((ex.setsReps || '').split(/[xX]/)[1]) ||
          0;
        totalReps += sets * reps;
      });

      return { day: label, totalReps, isRest: false };
    });
  }, [currentUser]);

  const hasAnyData = chartData.some(d => d.totalReps > 0);

  const { yDomain, yTicks } = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.totalReps));
    if (max === 0) {
      return { yDomain: [0, 60], yTicks: [0, 15, 30, 45, 60] };
    }
    const domainMax = Math.ceil(max / 15) * 15 + 15;
    const ticks = [];
    for (let v = 0; v <= domainMax; v += 15) ticks.push(v);
    return { yDomain: [0, domainMax], yTicks: ticks };
  }, [chartData]);

  return (
    <div>
      {/* Header — font-bold not font-black, subtitle readable */}
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: '#e2e8f0',
        letterSpacing: '-0.01em', margin: '0 0 3px', lineHeight: 1.2,
      }}>
        Weekly Rep Volume
      </h2>
      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 16px', fontWeight: 500 }}>
        Planned reps · current split
      </p>

      {!hasAnyData ? (
        <div style={{
          height: 198, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <p style={{ color: '#475569', fontSize: 13, fontWeight: 600, margin: 0 }}>
            No workout split configured
          </p>
          <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center', maxWidth: 200 }}>
            Set up your split to see weekly rep volume
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={198}>
          <LineChart data={chartData} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />

            <XAxis
              dataKey="day"
              stroke="rgba(255,255,255,0.04)"
              // Lighter weight so it doesn't compete with data
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.04)"
              tick={{ fill: '#475569', fontSize: 9, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              // Removed rotated label — suffix on tick is cleaner on mobile
              width={32}
              domain={yDomain}
              ticks={yTicks}
              tickFormatter={v => `${v}r`}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }}
            />

            <Line
              type="monotone"
              dataKey="totalReps"
              stroke="#34d399"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={<CustomActiveDot />}
              connectNulls={false}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}