import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Star, Dumbbell, Zap, Award, ChevronDown } from 'lucide-react';
import { format, subMonths } from 'date-fns';

// ─── Config ──────────────────────────────────────────────────────────────────
const EXERCISE_COLORS = [
  '#a78bfa', '#34d399', '#f97316', '#60a5fa', '#f472b6', '#fbbf24',
  '#38bdf8', '#fb7185', '#4ade80', '#facc15', '#c084fc', '#f87171',
];
const EXERCISE_GLOWS = [
  'rgba(167,139,250,0.35)', 'rgba(52,211,153,0.35)', 'rgba(249,115,22,0.35)',
  'rgba(96,165,250,0.35)', 'rgba(244,114,182,0.35)', 'rgba(251,191,36,0.35)',
  'rgba(56,189,248,0.35)', 'rgba(251,113,133,0.35)', 'rgba(74,222,128,0.35)',
  'rgba(250,204,21,0.35)', 'rgba(192,132,252,0.35)', 'rgba(248,113,113,0.35)',
];

const PERIODS = [
  { key: '3m',  label: '3M',  months: 3  },
  { key: '6m',  label: '6M',  months: 6  },
  { key: '1y',  label: '1Y',  months: 12 },
  { key: 'all', label: 'All', months: null },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, color }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(8,12,28,0.96)',
      border: `1px solid ${color}44`,
      borderRadius: 10,
      padding: '10px 14px',
      backdropFilter: 'blur(12px)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}22`,
      minWidth: 130,
    }}>
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{d.date}</p>
      <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, lineHeight: 1, marginBottom: 2 }}>
        {d.weight}<span style={{ color, fontSize: 11, fontWeight: 600, marginLeft: 3 }}>lbs</span>
      </p>
      <p style={{ color: '#64748b', fontSize: 11 }}>{d.reps} rep{d.reps !== 1 ? 's' : ''}</p>
      {d.is_pr && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '3px 6px', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6 }}>
          <span style={{ fontSize: 10 }}>⭐</span>
          <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700 }}>Personal Record</span>
        </div>
      )}
    </div>
  );
}

// ─── PR Dot renderer ─────────────────────────────────────────────────────────
function renderDot(props, color) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  if (payload?.is_pr) {
    return (
      <g key={`pr-${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.12} />
        <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.22} />
        <circle cx={cx} cy={cy} r={3.5} fill={color} />
        <circle cx={cx} cy={cy} r={3.5} fill="none" stroke={color} strokeWidth={1.5} opacity={0.7} />
      </g>
    );
  }
  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={2.5} fill={color} opacity={0.6} />;
}

// ─── Sparkline (mini inline chart) ───────────────────────────────────────────
function Sparkline({ data, color, width = 44, height = 18 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const vals = data.map(d => d.weight);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
    </svg>
  );
}

// ─── Animated count-up number ────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 0 }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    const end = value;
    const duration = 400;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(+(start + (end - start) * eased).toFixed(decimals));
      if (t < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}</>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StrengthProgress({ currentUser }) {
  const [exercise, setExercise]   = useState(null);
  const [period, setPeriod]       = useState('6m');
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDropdownOpen, setDayDropdownOpen] = useState(false);
  const [chartKey, setChartKey]   = useState(0);
  const queryClient = useQueryClient();

  const { data: workoutLogs = [], isLoading } = useQuery({
    queryKey: ['workoutLogs', currentUser?.id],
    queryFn: () => base44.entities.WorkoutLog.filter({ user_id: currentUser.id }, '-created_date', 500),
    enabled: !!currentUser,
    staleTime: 1 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Fetch primary gym membership to know which gym community to compare against
  const { data: gymMemberships = [] } = useQuery({
    queryKey: ['gymMemberships', currentUser?.id],
    queryFn: () => base44.entities.GymMembership.filter({ user_id: currentUser.id, status: 'active' }),
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const primaryGymId = currentUser?.primary_gym_id || gymMemberships[0]?.gym_id;

  // Fetch all gym members' workout logs for the same gym (to compute community ranking)
  const { data: gymMemberIds = [] } = useQuery({
    queryKey: ['gymMemberIds', primaryGymId],
    queryFn: async () => {
      const memberships = await base44.entities.GymMembership.filter({ gym_id: primaryGymId, status: 'active' });
      return memberships.map(m => m.user_id).filter(id => id !== currentUser.id);
    },
    enabled: !!primaryGymId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: communityLogs = [] } = useQuery({
    queryKey: ['communityLogs', primaryGymId],
    queryFn: () => base44.entities.WorkoutLog.filter({ gym_id: primaryGymId }, '-completed_date', 500),
    enabled: !!primaryGymId,
    staleTime: 5 * 60 * 1000,
    placeholderData: prev => prev,
  });

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubscribe = base44.entities.WorkoutLog.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_id === currentUser.id) {
        queryClient.invalidateQueries({ queryKey: ['workoutLogs', currentUser.id] });
      }
    });
    return unsubscribe;
  }, [currentUser?.id, queryClient]);

  // Derive split days from user profile
  const splitDays = useMemo(() => {
    const split = currentUser?.custom_workout_types || currentUser?.workout_split;
    if (!split || typeof split !== 'object') return [];
    return Object.keys(split).filter(k => split[k]);
  }, [currentUser]);

  // Map split day → exercise names logged on days with that label
  const exercisesByDay = useMemo(() => {
    const map = {};
    workoutLogs.forEach(log => {
      const day = log.workout_type || log.split_day;
      if (!day) return;
      if (!map[day]) map[day] = new Set();
      (log.exercises || []).forEach(ex => {
        const name = ex.exercise || ex.name;
        if (name) map[day].add(name);
      });
    });
    return map;
  }, [workoutLogs]);

  // All unique exercise names across all logs
  const allExerciseNames = useMemo(() => {
    const names = new Set();
    workoutLogs.forEach(log => {
      (log.exercises || []).forEach(ex => {
        const name = ex.exercise || ex.name;
        if (name) names.add(name);
      });
    });
    return Array.from(names);
  }, [workoutLogs]);

  // Exercises visible given selected day filter
  const availableExercises = useMemo(() => {
    const names = selectedDay && exercisesByDay[selectedDay]
      ? Array.from(exercisesByDay[selectedDay])
      : allExerciseNames;
    return names.map((name, i) => ({
      key: name,
      label: name,
      color: EXERCISE_COLORS[i % EXERCISE_COLORS.length],
      glow: EXERCISE_GLOWS[i % EXERCISE_GLOWS.length],
    }));
  }, [selectedDay, exercisesByDay, allExerciseNames]);

  // Auto-select first day and first exercise when data loads
  useEffect(() => {
    if (splitDays.length > 0 && !selectedDay) {
      setSelectedDay(splitDays[0]);
    }
  }, [splitDays]);

  // Auto-select first exercise when filtered list changes
  useEffect(() => {
    if (availableExercises.length > 0) {
      setExercise(availableExercises[0].key);
      setChartKey(k => k + 1);
    } else {
      setExercise(null);
    }
  }, [selectedDay, availableExercises.map(e => e.key).join(',')]); // eslint-disable-line

  const handleExerciseChange = (key) => {
    setExercise(key);
    setChartKey(k => k + 1);
  };

  const selectedExercise = availableExercises.find(e => e.key === exercise);
  const color = selectedExercise?.color ?? '#a78bfa';
  const glow  = selectedExercise?.glow  ?? 'rgba(167,139,250,0.35)';

  // All-time data per exercise (for sparklines)
  const allTimeByExercise = useMemo(() => {
    const map = {};
    for (const ex of availableExercises) {
      map[ex.key] = workoutLogs
        .flatMap(log => log.exercises?.filter(e => (e.exercise || e.name) === ex.key) || [])
        .map(e => ({ weight: parseFloat(e.weight) || 0 }))
        .filter(e => e.weight > 0)
        .sort((a, b) => a.weight - b.weight);
    }
    return map;
  }, [workoutLogs, availableExercises]);

  const chartData = useMemo(() => {
    const cutoff = period !== 'all'
      ? subMonths(new Date(), PERIODS.find(p => p.key === period).months)
      : null;
    const data = [];
    workoutLogs.forEach(log => {
      const logDate = new Date(log.created_date || log.completed_date);
      if (cutoff && logDate < cutoff) return;
      (log.exercises || []).forEach(ex => {
        const exName = ex.exercise || ex.name;
        if (exName === exercise) {
          const w = parseFloat(ex.weight) || 0;
          if (w > 0) {
            data.push({
              date: format(logDate, 'MMM d'),
              rawDate: logDate,
              weight: w,
              reps: parseInt(ex.setsReps?.split('x')[1] || ex.reps) || 1,
              is_pr: ex.is_pr || false,
            });
          }
        }
      });
    });
    return data.sort((a, b) => a.rawDate - b.rawDate);
  }, [workoutLogs, exercise, period]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const weights = chartData.map(d => d.weight);
    const max     = Math.max(...weights);
    const min     = Math.min(...weights);
    const recent  = chartData[chartData.length - 1]?.weight;
    const previous = chartData.length > 1 ? chartData[chartData.length - 2]?.weight : recent;
    const first   = chartData[0]?.weight;
    const change  = first ? +((recent - first) / first * 100).toFixed(1) : 0;
    const sessionIncrease = previous ? +(recent - previous).toFixed(1) : 0;
    const avg     = +(weights.reduce((s, v) => s + v, 0) / weights.length).toFixed(1);
    const prs     = chartData.filter(d => d.is_pr).length;
    const prEntry = chartData.filter(d => d.is_pr).at(-1);
    return { max, min, recent, change, sessionIncrease, avg, prs, prEntry };
  }, [chartData]);

  const yDomain = chartData.length > 0
    ? [Math.floor(Math.min(...chartData.map(d => d.weight)) * 0.90 / 5) * 5,
       Math.ceil(Math.max(...chartData.map(d => d.weight)) * 1.08 / 5) * 5]
    : ['auto', 'auto'];

  // Progress % toward PR
  const prPct = stats && stats.max > 0
    ? Math.round((stats.recent / stats.max) * 100)
    : 0;
  const isAtPR = prPct === 100;

  const gradId = `sg-${exercise ?? 'default'}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(160deg, rgba(15,20,45,0.82) 0%, rgba(8,11,26,0.94) 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: `0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
    }}>

      {/* ── Top accent bar (exercise color) */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}00)`, transition: 'background 0.4s ease' }} />

      <div className="p-5 space-y-4">

        {/* ── Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30`, boxShadow: `0 0 12px ${glow}` }}>
              <TrendingUp className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-white leading-none">Strength Progress</h2>
              <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#475569' }}>
                {selectedExercise ? selectedExercise.label : 'Select an exercise'}
              </p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex gap-0.5 p-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all"
                style={{
                  background: period === p.key ? 'rgba(255,255,255,0.10)' : 'transparent',
                  color: period === p.key ? '#fff' : '#475569',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="h-8 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
            <span className="text-[11px] text-slate-500">Loading workout data…</span>
          </div>
        )}

        {/* ── Split day dropdown */}
        {splitDays.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setDayDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl w-full text-left transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${selectedDay ? `${color}35` : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <Dumbbell className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selectedDay ? color : '#475569' }} />
              <span className="flex-1 text-[12px] font-semibold capitalize" style={{ color: selectedDay ? '#e2e8f0' : '#475569' }}>
                {selectedDay || 'All Days'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform" style={{ color: '#475569', transform: dayDropdownOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {dayDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDayDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl overflow-hidden"
                  style={{ background: 'rgba(12,16,32,0.98)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(20px)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
                  <button
                    onClick={() => { setSelectedDay(null); setDayDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors"
                    style={{ color: !selectedDay ? color : '#64748b', background: !selectedDay ? `${color}12` : 'transparent' }}
                  >
                    All Days
                  </button>
                  {splitDays.map(day => (
                    <button key={day}
                      onClick={() => { setSelectedDay(day); setDayDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-[12px] font-semibold capitalize transition-colors"
                      style={{ color: selectedDay === day ? color : '#64748b', background: selectedDay === day ? `${color}12` : 'transparent' }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Exercise selector — card style with sparkline */}
        {availableExercises.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {availableExercises.map(ex => {
              const exData = allTimeByExercise[ex.key] || [];
              const exMax  = exData.length > 0 ? Math.max(...exData.map(d => d.weight)) : null;
              const active = exercise === ex.key;
              return (
                <button key={ex.key} onClick={() => handleExerciseChange(ex.key)}
                  className="flex-shrink-0 flex flex-col gap-1.5 px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: active ? `${ex.color}14` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? `${ex.color}35` : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: active ? `0 0 16px ${ex.glow}` : 'none',
                    minWidth: 88,
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold" style={{ color: active ? ex.color : '#64748b' }}>{ex.label}</span>
                    {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: ex.color, boxShadow: `0 0 6px ${ex.color}` }} />}
                  </div>
                  <Sparkline data={exData} color={ex.color} />
                  {exMax && (
                    <span className="text-[10px] font-semibold" style={{ color: active ? ex.color : '#334155' }}>{exMax} lbs</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty states */}
        {!isLoading && availableExercises.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Dumbbell className="w-6 h-6" style={{ color: '#334155' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#475569' }}>No workout logs yet</p>
              <p className="text-xs mt-0.5" style={{ color: '#334155' }}>Log a workout to start tracking progress</p>
            </div>
          </div>
        ) : !exercise || chartData.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}0f`, border: `1px solid ${color}20` }}>
              <TrendingUp className="w-6 h-6" style={{ color: `${color}60` }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#475569' }}>
                {!exercise ? 'Select an exercise' : `No weight data for ${selectedExercise?.label}`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#334155' }}>Log a lift to start tracking progress</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Hero stats */}
            <div className="grid grid-cols-3 gap-2">
              {/* Current weight — large hero */}
              <div className="col-span-1 rounded-xl p-3.5 flex flex-col justify-between"
                style={{ background: `${color}0e`, border: `1px solid ${color}22` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${color}88` }}>Latest</p>
                <div>
                  <p className="text-2xl font-black text-white leading-none">
                    <AnimatedNumber value={stats.recent} />
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <p className="text-[11px] font-semibold" style={{ color }}>lbs</p>
                    {stats.sessionIncrease !== 0 && (
                      <span className={`text-[10px] font-bold ${stats.sessionIncrease > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stats.sessionIncrease > 0 ? '+' : ''}<AnimatedNumber value={stats.sessionIncrease} decimals={1} />kg
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PR */}
              <div className="col-span-1 rounded-xl p-3.5 flex flex-col justify-between"
                style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(251,191,36,0.6)' }}>PR</p>
                  <Star className="w-3 h-3 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white leading-none">
                    <AnimatedNumber value={stats.max} />
                  </p>
                  <p className="text-[11px] font-semibold mt-0.5 text-amber-400">lbs</p>
                </div>
              </div>

              {/* Change */}
              <div className="col-span-1 rounded-xl p-3.5 flex flex-col justify-between"
                style={{
                  background: stats.change > 0 ? 'rgba(52,211,153,0.07)' : stats.change < 0 ? 'rgba(248,113,113,0.07)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${stats.change > 0 ? 'rgba(52,211,153,0.20)' : stats.change < 0 ? 'rgba(248,113,113,0.20)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: stats.change > 0 ? 'rgba(52,211,153,0.6)' : stats.change < 0 ? 'rgba(248,113,113,0.6)' : '#475569' }}>
                    Change
                  </p>
                  {stats.change > 0
                    ? <TrendingUp className="w-3 h-3 text-emerald-400" />
                    : stats.change < 0
                      ? <TrendingDown className="w-3 h-3 text-red-400" />
                      : <Minus className="w-3 h-3 text-slate-500" />}
                </div>
                <div>
                  <p className="text-2xl font-black leading-none"
                    style={{ color: stats.change > 0 ? '#34d399' : stats.change < 0 ? '#f87171' : '#64748b' }}>
                    <AnimatedNumber value={Math.abs(stats.change)} decimals={1} />%
                  </p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: '#334155' }}>
                    {period === 'all' ? 'all time' : `last ${PERIODS.find(p => p.key === period)?.label}`}
                  </p>
                </div>
              </div>
            </div>

            {/* ── PR progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#334155' }}>
                  Progress to PR
                </p>
                <p className="text-[11px] font-bold" style={{ color: isAtPR ? '#fbbf24' : color }}>
                  {isAtPR ? '⭐ At PR' : `${prPct}%`}
                </p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${prPct}%`,
                    background: isAtPR
                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : `linear-gradient(90deg, ${color}88, ${color})`,
                    boxShadow: isAtPR ? '0 0 8px rgba(251,191,36,0.6)' : `0 0 8px ${glow}`,
                  }} />
              </div>
            </div>

            {/* ── Chart */}
            <div className="-mx-1" key={chartKey} style={{ animation: 'fadeInUp 0.4s ease both' }}>
              <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={color} stopOpacity={0.30} />
                      <stop offset="60%"  stopColor={color} stopOpacity={0.08} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.00} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

                  {/* PR reference line */}
                  {stats?.prEntry && (
                    <ReferenceLine
                      y={stats.max}
                      stroke="rgba(251,191,36,0.25)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{ value: `PR ${stats.max}`, position: 'insideTopRight', fontSize: 9, fill: 'rgba(251,191,36,0.5)', fontWeight: 700 }}
                    />
                  )}

                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.06)"
                    tick={{ fill: '#334155', fontSize: 9, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.06)"
                    tick={{ fill: '#334155', fontSize: 9, fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                    domain={yDomain}
                    tickFormatter={v => `${v}`}
                  />

                  <Tooltip
                    content={<CustomTooltip color={color} />}
                    cursor={{ stroke: `${color}30`, strokeWidth: 1, strokeDasharray: '3 3' }}
                  />

                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#${gradId})`}
                    filter="url(#glow)"
                    activeDot={{ r: 5, fill: color, stroke: '#0a0e1e', strokeWidth: 2, filter: `drop-shadow(0 0 4px ${color})` }}
                    dot={(props) => renderDot(props, color)}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Bottom stat row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>Sessions</p>
                <p className="text-sm font-bold text-white">{chartData.length}</p>
              </div>
              <div className="text-center border-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>Avg Weight</p>
                <p className="text-sm font-bold text-white">{stats.avg} <span style={{ color: '#334155', fontSize: 10 }}>lbs</span></p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#334155' }}>PRs Set</p>
                <p className="text-sm font-bold" style={{ color: stats.prs > 0 ? '#fbbf24' : '#334155' }}>
                  {stats.prs > 0 ? `⭐ ${stats.prs}` : '—'}
                </p>
              </div>
            </div>

            {/* ── PR banner */}
            {stats.prs > 0 && (
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                style={{ background: 'linear-gradient(90deg, rgba(251,191,36,0.10), rgba(251,191,36,0.04))', border: '1px solid rgba(251,191,36,0.20)' }}>
                <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-[12px] font-bold text-amber-200">
                    {stats.prs} personal record{stats.prs > 1 ? 's' : ''} in this period
                  </p>
                  {stats.prEntry && (
                    <p className="text-[10px]" style={{ color: '#78716c' }}>Last PR: {stats.max} lbs on {stats.prEntry.date}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}