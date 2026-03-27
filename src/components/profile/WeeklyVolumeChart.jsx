import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COMPOUND_KEYWORDS = [
  'squat', 'deadlift', 'bench', 'press', 'row', 'pull-up', 'pullup',
  'chin-up', 'chinup', 'lunge', 'clean', 'snatch', 'jerk', 'thruster',
  'hip thrust', 'rdl', 'romanian', 'overhead', 'ohp', 'incline', 'decline',
  'dumbbell press', 'db press', 'barbell', 'weighted',
];

function isCompound(exerciseName = '', weight = 0) {
  const lower = exerciseName.toLowerCase();
  const nameMatch = COMPOUND_KEYWORDS.some(k => lower.includes(k));
  return nameMatch || weight >= 30;
}

const LINE_COLOR = '#818cf8';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, compoundOnly }) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  const isRest = val === 0;
  return (
    <div style={{
      background: 'rgba(8,12,28,0.97)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 10, padding: '10px 14px',
      backdropFilter: 'blur(12px)', minWidth: 140,
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
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: LINE_COLOR, flexShrink: 0 }} />
          <span style={{ color: '#94a3b8', fontSize: 10 }}>
            {compoundOnly ? 'Compound reps' : 'Reps'}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: LINE_COLOR, marginLeft: 'auto' }}>
            {val.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

function CustomDot(props) {
  const { cx, cy, payload } = props;
  if (!payload || payload.totalReps === 0) return null;
  return <circle cx={cx} cy={cy} r={3.5} fill={LINE_COLOR} stroke="#0a0e1e" strokeWidth={2} />;
}

function CustomActiveDot(props) {
  const { cx, cy, payload } = props;
  if (!payload || payload.totalReps === 0) return null;
  return <circle cx={cx} cy={cy} r={5} fill={LINE_COLOR} stroke="#0a0e1e" strokeWidth={2} />;
}

// ─── Compound toggle checkbox ─────────────────────────────────────────────────
function CompoundToggle({ checked, onChange, onToggle = () => {} }) {
  return (
    <button
      onClick={() => {
        onChange(!checked);
        onToggle();
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 9px', borderRadius: 8, flexShrink: 0,
        background: checked ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)',
        border: checked ? '1px solid rgba(129,140,248,0.4)' : '1px solid rgba(255,255,255,0.10)',
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        background: checked ? LINE_COLOR : 'rgba(255,255,255,0.08)',
        border: checked ? `1px solid ${LINE_COLOR}` : '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, border-color 0.15s',
      }}>
        {checked && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{
        fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
        color: checked ? '#a5b4fc' : '#64748b',
        transition: 'color 0.15s',
      }}>
        Compound
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WeeklyVolumeChart({ currentUser, animate = 0 }) {
  const [compoundOnly, setCompoundOnly] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  // animationKey changes when compound toggled OR when parent triggers first-load animation
  const [localKey, setLocalKey] = useState(0);
  const animationKey = localKey + animate;
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => { setMounted(true); }, []);

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
        const weight = parseFloat(ex.weight) || 0;
        const name = ex.exercise || ex.name || '';

        if (compoundOnly && !isCompound(name, weight)) return;
        totalReps += sets * reps;
      });

      return { day: label, totalReps, isRest: false };
    });
  }, [currentUser, compoundOnly]);

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
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: showInfo ? 10 : 16 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h2 style={{
              fontSize: 16, fontWeight: 700, color: '#e2e8f0',
              letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2,
            }}>
              Weekly Rep Volume
            </h2>
            <motion.button
              onClick={() => setShowInfo(v => !v)}
              whileTap={{ scale: 0.78, y: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer',
                color: showInfo ? '#818cf8' : '#475569',
                display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}>
              <Info size={13} />
            </motion.button>
          </div>
          <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0', fontWeight: 500 }}>
            Planned reps · current split
          </p>
        </div>
        <CompoundToggle checked={compoundOnly} onChange={setCompoundOnly} onToggle={() => setLocalKey(k => k + 1)} />
      </div>

      {/* ── Info Box ── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 14 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(129,140,248,0.07) 0%, rgba(99,102,241,0.04) 100%)',
              border: '1px solid rgba(129,140,248,0.16)',
              borderRadius: 10,
              padding: '10px 13px',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.35), transparent)',
              }} />
              <p style={{
                fontSize: 11, lineHeight: 1.65, color: '#94a3b8',
                margin: 0, fontWeight: 500,
              }}>
                <span style={{ color: '#a5b4fc', fontWeight: 700 }}>Volume</span> is the total reps you perform each day — keeping it balanced across your week means no single session overtaxes your body, reducing soreness and improving recovery.{' '}
                <span style={{ color: '#a5b4fc', fontWeight: 700 }}>Compound lifts</span> carry the most load, so their volume matters most — piling too many heavy reps into one day raises your injury and fatigue risk significantly. Use the Compound toggle to check your heaviest work is spread evenly.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!hasAnyData ? (
        <div style={{
          height: 198, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <p style={{ color: '#475569', fontSize: 13, fontWeight: 600, margin: 0 }}>
            {compoundOnly ? 'No compound lifts configured' : 'No workout split configured'}
          </p>
          <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center', maxWidth: 200 }}>
            {compoundOnly ? 'Add weighted compound exercises to your split' : 'Set up your split to see weekly rep volume'}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={198}>
          <LineChart data={chartData} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
            <XAxis
              dataKey="day"
              stroke="rgba(255,255,255,0.04)"
              tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="rgba(255,255,255,0.04)"
              tick={{ fill: '#475569', fontSize: 9, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={32}
              domain={yDomain}
              ticks={yTicks}
              tickFormatter={v => `${v}r`}
            />
            <Tooltip
              content={<CustomTooltip compoundOnly={compoundOnly} />}
              cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="totalReps"
              stroke={LINE_COLOR}
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={<CustomActiveDot />}
              connectNulls={false}
              isAnimationActive={mounted}
              animationDuration={600}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}