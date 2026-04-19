import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Check } from 'lucide-react';
import { format, subMonths, eachDayOfInterval, startOfDay } from 'date-fns';

const TIMEFRAMES = [
  { key: '2m', label: '2M', months: 2 },
  { key: '6m', label: '6M', months: 6 },
  { key: 'all', label: 'All', months: null },
];

const TODAY_KEY = format(new Date(), 'yyyy-MM-dd');

// ── Weight Scroll Picker ──────────────────────────────────────────────────────
function WeightPicker({ value, onChange }) {
  const ITEM_H = 44;
  const weights = useMemo(() =>
    Array.from({ length: 1701 }, (_, i) => Math.round((30 + i * 0.1) * 10) / 10),
  []);

  const listRef = useRef(null);
  const rafRef = useRef(null);
  const velocityRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const isMomentumRef = useRef(false);

  const initialIdx = useMemo(() => {
    const rounded = Math.round(value * 10) / 10;
    const idx = weights.findIndex(w => Math.abs(w - rounded) < 0.001);
    return idx >= 0 ? idx : weights.findIndex(w => Math.abs(w - 70) < 0.001);
  }, []);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = initialIdx * ITEM_H;
  }, []);

  const snapToNearest = useCallback(() => {
    if (!listRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(weights.length - 1, idx));
    listRef.current.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
    onChange(weights[clamped]);
  }, [weights, onChange]);

  const runMomentum = useCallback(() => {
    const FRICTION = 0.92;
    const MIN_VEL = 0.3;
    const step = () => {
      if (!listRef.current || !isMomentumRef.current) return;
      velocityRef.current *= FRICTION;
      listRef.current.scrollTop += velocityRef.current;
      if (Math.abs(velocityRef.current) > MIN_VEL) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        isMomentumRef.current = false;
        snapToNearest();
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [snapToNearest]);

  const onPointerDown = useCallback((e) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    isMomentumRef.current = false;
    isPointerDownRef.current = true;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isPointerDownRef.current || !listRef.current) return;
    const now = performance.now();
    const dy = lastYRef.current - e.clientY;
    const dt = Math.max(now - lastTimeRef.current, 1);
    velocityRef.current = dy / dt * 16;
    listRef.current.scrollTop += dy;
    lastYRef.current = e.clientY;
    lastTimeRef.current = now;
    e.preventDefault();
  }, []);

  const onPointerUp = useCallback(() => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    if (Math.abs(velocityRef.current) > 1) {
      isMomentumRef.current = true;
      runMomentum();
    } else {
      snapToNearest();
    }
  }, [runMomentum, snapToNearest]);

  const handleScroll = useCallback(() => {
    if (!listRef.current || isPointerDownRef.current || isMomentumRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(weights.length - 1, idx));
    onChange(weights[clamped]);
  }, [weights, onChange]);

  return (
    <div
      style={{ position: 'relative', height: ITEM_H * 5, overflow: 'hidden', userSelect: 'none', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div style={{
        position: 'absolute', left: 0, right: 0, top: ITEM_H * 2, height: ITEM_H,
        background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
        borderRadius: 8, pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,12,28,0.85) 0%, transparent 30%, transparent 70%, rgba(8,12,28,0.85) 100%)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          height: '100%', overflowY: 'scroll', scrollbarWidth: 'none',
          paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2,
          pointerEvents: 'none',
        }}
      >
        {weights.map((w) => (
          <div key={w} style={{
            height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700,
            color: Math.abs(w - value) < 0.001 ? '#e2e8f0' : 'rgba(148,163,184,0.45)',
            transition: 'color 0.08s',
          }}>
            {w.toFixed(1)}
            <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3, color: 'rgba(148,163,184,0.5)' }}>kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Already Logged Modal ──────────────────────────────────────────────────────
function AlreadyLoggedModal({ open, onClose, onEdit }) {
  const [okPressed, setOkPressed] = useState(false);
  const [editPressed, setEditPressed] = useState(false);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10005,
        background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(88vw, 320px)',
          background: 'linear-gradient(135deg, rgba(15,20,45,0.98) 0%, rgba(8,12,30,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent)' }} />
        <div style={{ padding: '24px 24px 20px' }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#e2e8f0', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Already logged today
          </p>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.55, fontWeight: 500 }}>
            You have already logged your weight today. You can edit the weight you logged if you need to.
          </p>
        </div>
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            onMouseDown={() => setOkPressed(true)}
            onMouseUp={() => setOkPressed(false)}
            onMouseLeave={() => setOkPressed(false)}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'linear-gradient(to bottom, #4b5563, #374151, #1f2937)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1',
              boxShadow: okPressed ? 'none' : '0 3px 0 #111827, inset 0 1px 0 rgba(255,255,255,0.08)',
              transform: okPressed ? 'translateY(3px)' : 'translateY(0)',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease',
            }}
          >
            Okay
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#1a3fa8', transform: 'translateY(3px)' }} />
            <button
              onClick={onEdit}
              onMouseDown={() => setEditPressed(true)}
              onMouseUp={() => setEditPressed(false)}
              onMouseLeave={() => setEditPressed(false)}
              style={{
                position: 'relative', zIndex: 1, width: '100%',
                padding: '12px 0', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(to bottom, #60a5fa, #3b82f6, #2563eb)',
                border: '1px solid rgba(147,197,253,0.3)', color: '#fff',
                boxShadow: editPressed ? 'none' : '0 3px 0 #1a3fa8',
                transform: editPressed ? 'translateY(3px)' : 'translateY(0)',
                transition: 'transform 0.08s ease, box-shadow 0.08s ease',
              }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Log / Edit Weight Modal ───────────────────────────────────────────────────
function LogWeightModal({ open, onClose, onSave, currentWeight }) {
  const [weight, setWeight] = useState(currentWeight || 70);
  const [savePressed, setSavePressed] = useState(false);
  const [cancelPressed, setCancelPressed] = useState(false);

  useEffect(() => {
    if (open) setWeight(currentWeight || 70);
  }, [open, currentWeight]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10005,
        background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(88vw, 320px)',
          background: 'linear-gradient(135deg, rgba(15,20,45,0.98) 0%, rgba(8,12,30,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.4), transparent)' }} />
        <div style={{ padding: '20px 24px 0' }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#e2e8f0', margin: 0, letterSpacing: '-0.02em' }}>
            Update your weight
          </p>
          <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 20px', fontWeight: 500 }}>
            Scroll to select your current weight
          </p>
        </div>
        <div style={{ padding: '0 24px' }}>
          <WeightPicker value={weight} onChange={setWeight} />
        </div>
        <div style={{ padding: '16px 24px 24px', display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            onMouseDown={() => setCancelPressed(true)}
            onMouseUp={() => setCancelPressed(false)}
            onMouseLeave={() => setCancelPressed(false)}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: 'linear-gradient(to bottom, #4b5563, #374151, #1f2937)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1',
              boxShadow: cancelPressed ? 'none' : '0 3px 0 #111827, inset 0 1px 0 rgba(255,255,255,0.08)',
              transform: cancelPressed ? 'translateY(3px)' : 'translateY(0)',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease',
            }}
          >
            Cancel
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: '#1a3fa8', transform: 'translateY(3px)' }} />
            <button
              onClick={() => { onSave(weight); onClose(); }}
              onMouseDown={() => setSavePressed(true)}
              onMouseUp={() => setSavePressed(false)}
              onMouseLeave={() => setSavePressed(false)}
              style={{
                position: 'relative', zIndex: 1, width: '100%',
                padding: '12px 0', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(to bottom, #60a5fa, #3b82f6, #2563eb)',
                border: '1px solid rgba(147,197,253,0.3)', color: '#fff',
                boxShadow: savePressed ? 'none' : '0 3px 0 #1a3fa8',
                transform: savePressed ? 'translateY(3px)' : 'translateY(0)',
                transition: 'transform 0.08s ease, box-shadow 0.08s ease',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function WeightTooltip({ active, payload, label }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div style={{
      background: 'rgba(8,12,28,0.97)', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 10, padding: '8px 12px',
      backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <p style={{ color: '#64748b', fontSize: 10, fontWeight: 600, margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', margin: 0 }}>{payload[0].value} kg</p>
    </div>
  );
}

// ── Custom dot — only on logged days ─────────────────────────────────────────
function WeightDot(props) {
  const { cx, cy, payload } = props;
  if (payload.weight == null) return null;
  return <circle cx={cx} cy={cy} r={3} fill="#60a5fa" stroke="#0a0e1e" strokeWidth={1.5} />;
}

// ── Build fixed-window chart spine ───────────────────────────────────────────
function buildChartData(weightLogs, timeframe) {
  const now = startOfDay(new Date());
  const logMap = Object.fromEntries(
    weightLogs.map(e => [format(new Date(e.date), 'yyyy-MM-dd'), e.weight])
  );

  if (timeframe === 'all') {
    if (!weightLogs.length) {
      const start = subMonths(now, 2);
      const days = eachDayOfInterval({ start, end: now });
      const step = Math.max(1, Math.floor(days.length / 60));
      return days
        .filter((_, i) => i % step === 0 || i === days.length - 1)
        .map(d => ({ date: format(d, 'MMM d'), weight: null }));
    }
    const firstDate = startOfDay(new Date(weightLogs[0].date));
    const start = firstDate < now ? firstDate : now;
    const days = eachDayOfInterval({ start, end: now });
    const step = Math.max(1, Math.floor(days.length / 120));
    return days
      .filter((_, i) => i % step === 0 || i === days.length - 1)
      .map(d => ({ date: format(d, 'MMM d'), weight: logMap[format(d, 'yyyy-MM-dd')] ?? null }));
  }

  const months = timeframe === '2m' ? 2 : 6;
  const windowStart = startOfDay(subMonths(now, months));
  const days = eachDayOfInterval({ start: windowStart, end: now });
  const step = timeframe === '6m' ? 2 : 1;
  return days
    .filter((_, i) => i % step === 0 || i === days.length - 1)
    .map(d => ({ date: format(d, 'MMM d'), weight: logMap[format(d, 'yyyy-MM-dd')] ?? null }));
}

// ── 4 evenly spread x-axis ticks ─────────────────────────────────────────────
function buildXTicks(data) {
  if (data.length < 2) return data.map(d => d.date);
  const indices = [
    0,
    Math.round((data.length - 1) / 3),
    Math.round(2 * (data.length - 1) / 3),
    data.length - 1,
  ];
  return [...new Set(indices)].map(i => data[i].date);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WeightTracker({ currentUser }) {
  const [timeframe, setTimeframe] = useState('2m');
  const [showAlreadyLogged, setShowAlreadyLogged] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [addPressed, setAddPressed] = useState(false);
  const toggleRef = useRef(null);
  const pillRef = useRef(null);
  const queryClient = useQueryClient();

  const weightLogs = useMemo(() =>
    (currentUser?.weight_log || []).sort((a, b) => new Date(a.date) - new Date(b.date)),
  [currentUser?.weight_log]);

  const loggedToday = useMemo(() =>
    weightLogs.find(e => format(new Date(e.date), 'yyyy-MM-dd') === TODAY_KEY),
  [weightLogs]);

  const seedWeight = loggedToday?.weight
    ?? (weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 70);

  const chartData = useMemo(() => buildChartData(weightLogs, timeframe), [weightLogs, timeframe]);
  const xTicks = useMemo(() => buildXTicks(chartData), [chartData]);

  const { minW, maxW } = useMemo(() => {
    const allVals = weightLogs.map(e => e.weight).filter(v => v != null);
    if (!allVals.length) return { minW: 60, maxW: 100 };
    return {
      minW: Math.floor(Math.min(...allVals)) - 10,
      maxW: Math.ceil(Math.max(...allVals)) + 10,
    };
  }, [weightLogs]);

  const weightDelta = useMemo(() => {
    const vals = chartData.filter(d => d.weight != null);
    if (vals.length < 2) return null;
    return +(vals[vals.length - 1].weight - vals[0].weight).toFixed(1);
  }, [chartData]);

  // Sliding pill
  useEffect(() => {
    const toggle = toggleRef.current;
    const pill = pillRef.current;
    if (!toggle || !pill) return;
    const activeBtn = toggle.querySelector(`[data-tf="${timeframe}"]`);
    if (!activeBtn) return;
    const toggleRect = toggle.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    pill.style.left = `${btnRect.left - toggleRect.left + 2}px`;
    pill.style.width = `${btnRect.width - 4}px`;
  }, [timeframe]);

  const saveWeightMutation = useMutation({
    mutationFn: async (weight) => {
      const existing = currentUser?.weight_log || [];
      const updated = existing.filter(e => format(new Date(e.date), 'yyyy-MM-dd') !== TODAY_KEY);
      updated.push({ date: TODAY_KEY, weight });
      updated.sort((a, b) => new Date(a.date) - new Date(b.date));
      await base44.auth.updateMe({ weight_log: updated });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'] }),
  });

  const handleButtonPress = () => {
    if (loggedToday) setShowAlreadyLogged(true);
    else setShowLogModal(true);
  };

  const handleEdit = () => {
    setShowAlreadyLogged(false);
    setShowLogModal(true);
  };

  return (
    <>
      <div>
        {/* ── Header — tightened bottom margin ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 8, marginBottom: 6,          // was 14
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', margin: 0 }}>
              Weight Tracker
            </h2>
            <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0', fontWeight: 500 }}>
              {weightDelta !== null ? (
                <>
                  <span>Change: </span>
                  <span style={{
                    color: weightDelta > 0 ? '#34d399' : weightDelta < 0 ? '#f87171' : '#475569',
                    fontWeight: 700,
                  }}>
                    {weightDelta > 0 ? '+' : ''}{weightDelta} kg
                  </span>
                </>
              ) : 'Log your body weight'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Sliding timeframe toggle */}
            <div
              ref={toggleRef}
              style={{
                position: 'relative', display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: 2,
              }}
            >
              <div
                ref={pillRef}
                style={{
                  position: 'absolute', top: 2, height: 'calc(100% - 4px)',
                  background: 'linear-gradient(to bottom, rgba(96,165,250,0.7), rgba(59,130,246,0.8))',
                  borderRadius: 6, boxShadow: '0 1px 0 #1a3fa8',
                  transition: 'left 0.22s cubic-bezier(0.34,1.2,0.64,1), width 0.22s cubic-bezier(0.34,1.2,0.64,1)',
                  pointerEvents: 'none', zIndex: 1,
                }}
              />
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf.key}
                  data-tf={tf.key}
                  onClick={() => setTimeframe(tf.key)}
                  style={{
                    position: 'relative', zIndex: 2,
                    padding: '3px 9px', borderRadius: 6,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: 'transparent',
                    color: timeframe === tf.key ? '#fff' : '#475569',
                    transition: 'color 0.12s',
                  }}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Plus / tick button */}
            <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
              {loggedToday ? (
                <>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#064e3b', transform: 'translateY(3px)' }} />
                  <button
                    onClick={handleButtonPress}
                    onMouseDown={() => setAddPressed(true)}
                    onMouseUp={() => setAddPressed(false)}
                    onMouseLeave={() => setAddPressed(false)}
                    onTouchStart={() => setAddPressed(true)}
                    onTouchEnd={() => { setAddPressed(false); handleButtonPress(); }}
                    style={{
                      position: 'relative', zIndex: 1,
                      width: 30, height: 30, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(to bottom, #34d399, #10b981, #059669)',
                      border: '1px solid rgba(52,211,153,0.4)', color: '#fff', cursor: 'pointer',
                      boxShadow: addPressed ? 'none' : '0 3px 0 #064e3b, inset 0 1px 0 rgba(255,255,255,0.15)',
                      transform: addPressed ? 'translateY(3px)' : 'translateY(0)',
                      transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Check size={14} strokeWidth={2.5} />
                  </button>
                </>
              ) : (
                <>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#0a0f1a', transform: 'translateY(3px)' }} />
                  <button
                    onClick={handleButtonPress}
                    onMouseDown={() => setAddPressed(true)}
                    onMouseUp={() => setAddPressed(false)}
                    onMouseLeave={() => setAddPressed(false)}
                    onTouchStart={() => setAddPressed(true)}
                    onTouchEnd={() => { setAddPressed(false); handleButtonPress(); }}
                    style={{
                      position: 'relative', zIndex: 1,
                      width: 30, height: 30, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(to bottom, #2d3748 0%, #1e2635 50%, #161e2e 100%)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(148,163,184,0.8)', cursor: 'pointer',
                      boxShadow: addPressed ? 'none' : '0 3px 0 #0a0f1a, inset 0 1px 0 rgba(255,255,255,0.07)',
                      transform: addPressed ? 'translateY(3px)' : 'translateY(0)',
                      transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Chart — reduced height, left-shifted, tight margins ── */}
        <ResponsiveContainer width="100%" height={104}>  {/* was ~130 */}
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}  // left:0 so axis sits at edge
          >
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#475569', fontSize: 9, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              ticks={xTicks}
              height={14}               // trim dead space below x-axis labels
            />
            <YAxis
              domain={[minW, maxW]}
              tick={{ fill: '#475569', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={36}                // enough for "99kg" without clipping
              tickFormatter={v => `${v}kg`}
              tickCount={4}             // fewer ticks so labels don't crowd at reduced height
            />
            <Tooltip
              content={<WeightTooltip />}
              cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#weightGrad)"
              dot={<WeightDot />}
              activeDot={{ r: 4, fill: '#60a5fa', stroke: '#0a0e1e', strokeWidth: 1.5 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <AlreadyLoggedModal
        open={showAlreadyLogged}
        onClose={() => setShowAlreadyLogged(false)}
        onEdit={handleEdit}
      />
      <LogWeightModal
        open={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSave={(w) => saveWeightMutation.mutate(w)}
        currentWeight={seedWeight}
      />
    </>
  );
}