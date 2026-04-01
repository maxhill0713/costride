import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Minus, Dumbbell, Scale, Calendar, BarChart3, Activity } from 'lucide-react';

const T = {
  bg:       '#06090f',
  surface:  '#0b1121',
  card:     '#0d1424',
  border:   'rgba(255,255,255,.05)',
  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  emerald:    '#10b981',
  emeraldDim: 'rgba(16,185,129,.08)',
  emeraldBdr: 'rgba(16,185,129,.18)',
  indigo:    '#6366f1',
  indigoDim: 'rgba(99,102,241,.08)',
  indigoBdr: 'rgba(99,102,241,.18)',
  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,.07)',
  amberBdr: 'rgba(245,158,11,.16)',
  red:      '#ef4444',
  redDim:   'rgba(239,68,68,.07)',
  redBdr:   'rgba(239,68,68,.16)',
  mono: "'JetBrains Mono', monospace",
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
function MiniBarChart({ data, color, maxVal, height = 40 }) {
  if (!data || data.length === 0) return null;
  const max = maxVal || Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${Math.max(4, (v / max) * 100)}%`,
          background: i === data.length - 1 ? color : `${color}50`,
          borderRadius: 3,
          transition: 'height .4s cubic-bezier(.4,0,.2,1)',
        }} />
      ))}
    </div>
  );
}

// ─── MINI LINE CHART ──────────────────────────────────────────────────────────
function MiniLineChart({ data, color, w = 160, h = 40 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    4 + (1 - (v - min) / rng) * (h - 8),
  ]);
  const line = pts.map(p => p.join(',')).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ display: 'block', overflow: 'visible' }}>
      <polygon points={area} fill={`${color}10`} />
      <polyline points={line} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  );
}

// ─── EXERCISE NAME FORMATTER ──────────────────────────────────────────────────
function fmtExercise(name) {
  return (name || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ClientPerformancePanel({ clientId, clientName }) {
  // Fetch workout logs for this client
  const { data: workoutLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['clientWorkoutLogs', clientId],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: clientId }, '-completed_date', 100),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch check-ins for class frequency
  const { data: checkIns = [], isLoading: ciLoading } = useQuery({
    queryKey: ['clientCheckIns', clientId],
    queryFn: () => base44.entities.CheckIn.filter({ user_id: clientId }, '-check_in_date', 120),
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = logsLoading || ciLoading;

  // ── Class Frequency: sessions per week over last 8 weeks ────────────────────
  const classFrequency = useMemo(() => {
    const now = Date.now();
    const msWeek = 7 * 86400000;
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = now - (7 - i) * msWeek;
      const weekEnd   = weekStart + msWeek;
      return checkIns.filter(c => {
        const t = new Date(c.check_in_date).getTime();
        return t >= weekStart && t < weekEnd;
      }).length;
    });
  }, [checkIns]);

  const totalClassesThisMonth = useMemo(() => {
    const now = Date.now();
    const msMonth = 30 * 86400000;
    return checkIns.filter(c => now - new Date(c.check_in_date).getTime() < msMonth).length;
  }, [checkIns]);

  const avgClassesPerWeek = useMemo(() => {
    if (classFrequency.length === 0) return 0;
    const sum = classFrequency.reduce((a, b) => a + b, 0);
    return (sum / classFrequency.length).toFixed(1);
  }, [classFrequency]);

  const freqTrend = useMemo(() => {
    if (classFrequency.length < 4) return 'flat';
    const recent = classFrequency.slice(-2).reduce((a, b) => a + b, 0);
    const prev   = classFrequency.slice(-4, -2).reduce((a, b) => a + b, 0);
    if (recent > prev + 0.5) return 'up';
    if (recent < prev - 0.5) return 'down';
    return 'flat';
  }, [classFrequency]);

  // ── Strength Gains: best weight per exercise over time ──────────────────────
  const strengthData = useMemo(() => {
    // Collect all exercises across all logs
    const exerciseMap = {}; // exerciseName -> [{date, weight}]
    workoutLogs.forEach(log => {
      (log.exercises || []).forEach(ex => {
        const name = ex.exercise || ex.name || '';
        if (!name) return;
        const weight = parseFloat(ex.weight) || 0;
        if (weight <= 0) return;
        if (!exerciseMap[name]) exerciseMap[name] = [];
        exerciseMap[name].push({ date: log.completed_date, weight });
      });
    });

    // For each exercise, get sorted entries and compute trend
    return Object.entries(exerciseMap)
      .map(([name, entries]) => {
        const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
        const weights = sorted.map(e => e.weight);
        const latest  = weights[weights.length - 1];
        const first   = weights[0];
        const gain    = latest - first;
        const pct     = first > 0 ? ((gain / first) * 100).toFixed(0) : 0;
        // Last 6 data points for sparkline
        const spark   = weights.slice(-6);
        return { name, latest, first, gain, pct: Number(pct), spark, count: sorted.length };
      })
      .filter(e => e.count >= 2) // need at least 2 sessions to show a trend
      .sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain))
      .slice(0, 5);
  }, [workoutLogs]);

  // ── Total Volume trend: weekly total kg lifted ───────────────────────────────
  const volumeData = useMemo(() => {
    const now = Date.now();
    const msWeek = 7 * 86400000;
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = now - (7 - i) * msWeek;
      const weekEnd   = weekStart + msWeek;
      const weekLogs  = workoutLogs.filter(log => {
        const t = new Date(log.completed_date).getTime();
        return t >= weekStart && t < weekEnd;
      });
      return weekLogs.reduce((sum, log) => {
        return sum + (log.exercises || []).reduce((s, ex) => {
          const w = parseFloat(ex.weight) || 0;
          const setsReps = ex.setsReps || '';
          const sets = parseInt(setsReps.split('x')[0]) || 1;
          const reps = parseInt(setsReps.split('x')[1]) || 1;
          return s + w * sets * reps;
        }, 0);
      }, 0);
    });
  }, [workoutLogs]);

  const latestVolume = volumeData[volumeData.length - 1] || 0;
  const prevVolume   = volumeData[volumeData.length - 2] || 0;
  const volumeDelta  = latestVolume - prevVolume;

  // ── Workout frequency (workouts logged per week) ─────────────────────────────
  const workoutFreq = useMemo(() => {
    const now = Date.now();
    const msWeek = 7 * 86400000;
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = now - (7 - i) * msWeek;
      const weekEnd   = weekStart + msWeek;
      return workoutLogs.filter(log => {
        const t = new Date(log.completed_date).getTime();
        return t >= weekStart && t < weekEnd;
      }).length;
    });
  }, [workoutLogs]);

  const totalWorkouts = workoutLogs.length;

  if (isLoading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <div style={{ width: 20, height: 20, border: `2px solid ${T.indigo}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 8px' }} />
        <span style={{ fontSize: 12, color: T.t3 }}>Loading performance data…</span>
      </div>
    );
  }

  const hasData = workoutLogs.length > 0 || checkIns.length > 0;

  if (!hasData) {
    return (
      <div style={{
        padding: 32, textAlign: 'center', borderRadius: 12,
        background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
      }}>
        <Activity style={{ width: 22, height: 22, color: T.t3, margin: '0 auto 10px' }} />
        <p style={{ fontSize: 13, fontWeight: 600, color: T.t2, margin: '0 0 4px' }}>No performance data yet</p>
        <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>
          {clientName?.split(' ')[0] || 'This client'} hasn't logged any workouts or check-ins yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── ROW 1: Class Frequency + Workout Volume ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Class Frequency */}
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Calendar style={{ width: 11, height: 11, color: T.indigo }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>Class Frequency</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 700, color: T.t1, lineHeight: 1, letterSpacing: '-.03em' }}>
              {avgClassesPerWeek}
            </span>
            <span style={{ fontSize: 11, color: T.t3 }}>/ week</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
              {freqTrend === 'up'   && <TrendingUp   style={{ width: 12, height: 12, color: T.emerald }} />}
              {freqTrend === 'down' && <TrendingDown  style={{ width: 12, height: 12, color: T.red }} />}
              {freqTrend === 'flat' && <Minus         style={{ width: 12, height: 12, color: T.t3 }} />}
              <span style={{ fontSize: 10, fontWeight: 700,
                color: freqTrend === 'up' ? T.emerald : freqTrend === 'down' ? T.red : T.t3 }}>
                {freqTrend === 'up' ? 'Rising' : freqTrend === 'down' ? 'Falling' : 'Steady'}
              </span>
            </div>
          </div>
          <MiniBarChart data={classFrequency} color={T.indigo} height={36} />
          <div style={{ fontSize: 10, color: T.t3, marginTop: 6 }}>{totalClassesThisMonth} classes this month</div>
        </div>

        {/* Workout Volume */}
        <div style={{
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BarChart3 style={{ width: 11, height: 11, color: T.amber }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>Weekly Volume</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: T.t1, lineHeight: 1, letterSpacing: '-.03em' }}>
              {latestVolume > 0 ? `${(latestVolume / 1000).toFixed(1)}t` : '—'}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
              {volumeDelta > 0 && <TrendingUp   style={{ width: 12, height: 12, color: T.emerald }} />}
              {volumeDelta < 0 && <TrendingDown  style={{ width: 12, height: 12, color: T.red }} />}
              {volumeDelta === 0 && <Minus       style={{ width: 12, height: 12, color: T.t3 }} />}
              <span style={{ fontSize: 10, fontWeight: 700,
                color: volumeDelta > 0 ? T.emerald : volumeDelta < 0 ? T.red : T.t3 }}>
                {volumeDelta > 0 ? `+${(volumeDelta/1000).toFixed(1)}t` : volumeDelta < 0 ? `${(volumeDelta/1000).toFixed(1)}t` : 'No change'}
              </span>
            </div>
          </div>
          <MiniBarChart data={volumeData.map(v => v / 1000)} color={T.amber} height={36} />
          <div style={{ fontSize: 10, color: T.t3, marginTop: 6 }}>{totalWorkouts} total workouts logged</div>
        </div>
      </div>

      {/* ── ROW 2: Workout Frequency (logged sessions) ── */}
      <div style={{
        padding: '14px 16px', borderRadius: 12,
        background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Dumbbell style={{ width: 11, height: 11, color: T.emerald }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>Workouts Logged — Last 8 Weeks</span>
          </div>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.t2 }}>
            {workoutFreq.reduce((a, b) => a + b, 0)} total
          </span>
        </div>
        <MiniBarChart data={workoutFreq} color={T.emerald} height={44} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 9, color: T.t3 }}>8 weeks ago</span>
          <span style={{ fontSize: 9, color: T.t3 }}>This week</span>
        </div>
      </div>

      {/* ── ROW 3: Strength Gains ── */}
      {strengthData.length > 0 && (
        <div style={{
          borderRadius: 12, background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <TrendingUp style={{ width: 11, height: 11, color: T.emerald }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Strength Gains
            </span>
            <span style={{ fontSize: 9, color: T.t3, marginLeft: 4 }}>from first to latest session</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {strengthData.map((ex, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                borderBottom: i < strengthData.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fmtExercise(ex.name)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t3 }}>{ex.first}kg</span>
                    <span style={{ fontSize: 9, color: T.t3 }}>→</span>
                    <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                      color: ex.gain >= 0 ? T.emerald : T.red }}>{ex.latest}kg</span>
                  </div>
                </div>
                <MiniLineChart data={ex.spark} color={ex.gain >= 0 ? T.emerald : T.red} w={80} h={28} />
                <div style={{ textAlign: 'right', minWidth: 52, flexShrink: 0 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, lineHeight: 1,
                    color: ex.gain >= 0 ? T.emerald : T.red }}>
                    {ex.gain >= 0 ? '+' : ''}{ex.gain}kg
                  </div>
                  <div style={{ fontSize: 9, color: T.t3, marginTop: 2 }}>
                    {ex.pct >= 0 ? '+' : ''}{ex.pct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {strengthData.length === 0 && workoutLogs.length > 0 && (
        <div style={{
          padding: '16px', borderRadius: 12, textAlign: 'center',
          background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
        }}>
          <Dumbbell style={{ width: 16, height: 16, color: T.t3, margin: '0 auto 6px' }} />
          <p style={{ fontSize: 12, color: T.t3, margin: 0 }}>
            Need at least 2 logged workouts with the same exercise to show strength trends.
          </p>
        </div>
      )}
    </div>
  );
}