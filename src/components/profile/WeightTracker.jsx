import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';
import { format, subMonths, eachDayOfInterval, startOfDay } from 'date-fns';

const TIMEFRAMES = [
  { key: '2m', label: '2M', months: 2 },
  { key: '6m', label: '6M', months: 6 },
  { key: 'all', label: 'All', months: null },
];

// ── Weight Scroll Picker (0.1kg steps, momentum scroll) ──────────────────────
function WeightPicker({ value, onChange }) {
  const ITEM_H = 44;
  const VISIBLE = 5;

  // 0.1kg steps from 30 to 200 = 1701 items
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

  // Find initial index
  const initialIdx = useMemo(() => {
    const rounded = Math.round(value * 10) / 10;
    const idx = weights.findIndex(w => Math.abs(w - rounded) < 0.001);
    return idx >= 0 ? idx : weights.findIndex(w => Math.abs(w - 70) < 0.001);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = initialIdx * ITEM_H;
    }
  }, []);

  // Snap to nearest item
  const snapToNearest = useCallback(() => {
    if (!listRef.current) return;
    const raw = listRef.current.scrollTop;
    const idx = Math.round(raw / ITEM_H);
    const clamped = Math.max(0, Math.min(weights.length - 1, idx));
    listRef.current.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
    onChange(weights[clamped]);
  }, [weights, onChange]);

  // Momentum animation
  const runMomentum = useCallback(() => {
    if (!listRef.current) return;
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

  // Pointer events for cross-device drag + momentum
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
    velocityRef.current = dy / dt * 16; // scale to ~60fps frame
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

  // Update highlighted item on scroll
  const handleScroll = useCallback(() => {
    if (!listRef.current || isPointerDownRef.current || isMomentumRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(weights.length - 1, idx));
    onChange(weights[clamped]);
  }, [weights, onChange]);

  return (
    <div
      style={{
        position: 'relative', height: ITEM_H * VISIBLE,
        overflow: 'hidden', userSelect: 'none', touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Selection highlight */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: ITEM_H * 2, height: ITEM_H,
        background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
        borderRadius: 8, pointerEvents: 'none', zIndex: 1,
      }} />
      {/* Fade top/bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(8,12,28,0.85) 0%, transparent 30%, transparent 70%, rgba(8,12,28,0.85) 100%)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollbarWidth: 'none',
          paddingTop: ITEM_H * 2,
          paddingBottom: ITEM_H * 2,
          // Disable native scroll — we drive it manually
          pointerEvents: 'none',
        }}
      >
        {weights.map((w) => (
          <div key={w} style={{
            height: ITEM_H,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700,
            color: Math.abs(w - value) < 0.001 ? '#e2e8f0' : 'rgba(148,163,184,0.45)',
            transition: 'color 0.08s',
          }}>
            {w.toFixed(1)}
            <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3, color: 'rgba(148,163,184,0.5)' }}>
              kg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Update Weight Modal ───────────────────────────────────────────────────────
function UpdateWeightModal({ open, onClose, onSave, currentWeight }) {
  const [weight, setWeight] = useState(currentWeight || 70);
  const [donePressed, setDonePressed] = useState(false);
  const [cancelPressed, setCancelPressed] = useState(false);

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
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              boxShadow: cancelPressed ? 'none' : '0 3px 0 #111827, inset 0 1px 0 rgba(255,255,255,0.08)',
              transform: cancelPressed ? 'translateY(3px)' : 'translateY(0)',
              transition: 'transform 0.08s ease, box-shadow 0.08s ease',
            }}
          >
            Cancel
          </button>

          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 12,
              background: '#1a3fa8', transform: 'translateY(3px)',
            }} />
            <button
              onClick={() => { onSave(weight); onClose(); }}
              onMouseDown={() => setDonePressed(true)}
              onMouseUp={() => setDonePressed(false)}
              onMouseLeave={() => setDonePressed(false)}
              style={{
                position: 'relative', zIndex: 1, width: '100%',
                padding: '12px 0', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: 'linear-gradient(to bottom, #60a5fa, #3b82f6, #2563eb)',
                border: '1px solid rgba(147,197,253,0.3)',
                color: '#fff',
                boxShadow: donePressed ? 'none' : '0 3px 0 #1a3fa8',
                transform: donePressed ? 'translateY(3px)' : 'translateY(0)',
                transition: 'transform 0.08s ease, box-shadow 0.08s ease',
              }}
            >
              Done
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
      <p style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', margin: 0 }}>
        {payload[0].value} kg
      </p>
    </div>
  );
}

// ── Build a full date-spine so the x-axis is always a fixed window ────────────
function buildChartData(weightLogs, timeframe) {
  const now = startOfDay(new Date());

  // For 'all': span from first log date to today (or show placeholder if no data)
  if (timeframe === 'all') {
    if (!weightLogs.length) {
      // Return a 2-month skeleton so the axes still render
      const start = subMonths(now, 2);
      return eachDayOfInterval({ start, end: now })
        .filter((_, i, arr) => i === 0 || i === arr.length - 1 || i % 7 === 0)
        .map(d => ({ date: format(d, 'MMM d'), weight: null }));
    }
    const firstDate = startOfDay(new Date(weightLogs[0].date));
    const start = firstDate < now ? firstDate : now;
    const days = eachDayOfInterval({ start, end: now });
    const logMap = Object.fromEntries(
      weightLogs.map(e => [format(new Date(e.date), 'yyyy-MM-dd'), e.weight])
    );
    // Sample to keep recharts fast — max ~120 ticks; for longer spans thin out
    const step = Math.max(1, Math.floor(days.length / 120));
    return days
      .filter((_, i) => i % step === 0 || i === days.length - 1)
      .map(d => ({
        date: format(d, 'MMM d'),
        weight: logMap[format(d, 'yyyy-MM-dd')] ?? null,
      }));
  }

  // For '2m' / '6m': fixed window — always start exactly N months ago, end today
  const months = timeframe === '2m' ? 2 : 6;
  const windowStart = startOfDay(subMonths(now, months));

  const days = eachDayOfInterval({ start: windowStart, end: now });
  const logMap = Object.fromEntries(
    weightLogs
      .filter(e => {
        const d = startOfDay(new Date(e.date));
        return d >= windowStart && d <= now;
      })
      .map(e => [format(new Date(e.date), 'yyyy-MM-dd'), e.weight])
  );

  // Thin out for 6m to keep it snappy (~1 point per 1–2 days is fine)
  const step = timeframe === '6m' ? 2 : 1;
  return days
    .filter((_, i) => i % step === 0 || i === days.length - 1)
    .map(d => ({
      date: format(d, 'MMM d'),
      weight: logMap[format(d, 'yyyy-MM-dd')] ?? null,
    }));
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WeightTracker({ currentUser }) {
  const [timeframe, setTimeframe] = useState('2m');
  const [showModal, setShowModal] = useState(false);
  const [addPressed, setAddPressed] = useState(false);
  const toggleRef = useRef(null);
  const pillRef = useRef(null);
  const queryClient = useQueryClient();

  const weightLogs = useMemo(() =>
    (currentUser?.weight_log || []).sort((a, b) => new Date(a.date) - new Date(b.date)),
  [currentUser?.weight_log]);

  const currentWeight = weightLogs.length > 0
    ? weightLogs[weightLogs.length - 1].weight
    : 70;

  const chartData = useMemo(
    () => buildChartData(weightLogs, timeframe),
    [weightLogs, timeframe]
  );

  const { minW, maxW } = useMemo(() => {
    const vals = chartData.map(d => d.weight).filter(v => v != null);
    if (!vals.length) return { minW: 65, maxW: 95 };
    const pad = 2;
    return {
      minW: Math.floor(Math.min(...vals) - pad),
      maxW: Math.ceil(Math.max(...vals) + pad),
    };
  }, [chartData]);

  const weightDelta = useMemo(() => {
    const vals = chartData.filter(d => d.weight != null);
    if (vals.length < 2) return null;
    return +(vals[vals.length - 1].weight - vals[0].weight).toFixed(1);
  }, [chartData]);

  // ── Sliding pill ──
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
      const today = format(new Date(), 'yyyy-MM-dd');
      const updated = existing.filter(e => e.date !== today);
      updated.push({ date: today, weight });
      updated.sort((a, b) => new Date(a.date) - new Date(b.date));
      await base44.auth.updateMe({ weight_log: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  // x-axis tick formatter — fewer labels for 6m/all
  const xTickInterval = timeframe === '2m' ? 'preserveStartEnd' : 'preserveStartEnd';

  return (
    <>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.01em', margin: 0 }}>
              Weight Tracker
            </h2>
            <p style={{ fontSize: 11, color: '#475569', margin: '3px 0 0', fontWeight: 500 }}>
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
                  borderRadius: 6,
                  boxShadow: '0 1px 0 #1a3fa8',
                  transition: 'left 0.22s cubic-bezier(0.34,1.2,0.64,1), width 0.22s cubic-bezier(0.34,1.2,0.64,1)',
                  pointerEvents: 'none',
                  zIndex: 1,
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

            {/* 3D grey add button */}
            <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 8,
                background: '#0a0f1a', transform: 'translateY(3px)',
              }} />
              <button
                onClick={() => setShowModal(true)}
                onMouseDown={() => setAddPressed(true)}
                onMouseUp={() => setAddPressed(false)}
                onMouseLeave={() => setAddPressed(false)}
                onTouchStart={() => setAddPressed(true)}
                onTouchEnd={() => { setAddPressed(false); setShowModal(true); }}
                style={{
                  position: 'relative', zIndex: 1,
                  width: 30, height: 30, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(to bottom, #2d3748 0%, #1e2635 50%, #161e2e 100%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(148,163,184,0.8)',
                  cursor: 'pointer',
                  boxShadow: addPressed ? 'none' : '0 3px 0 #0a0f1a, inset 0 1px 0 rgba(255,255,255,0.07)',
                  transform: addPressed ? 'translateY(3px)' : 'translateY(0)',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Chart — always rendered, data sits right, empty left when new user */}
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
              interval={xTickInterval}
            />
            <YAxis
              domain={[minW, maxW]}
              tick={{ fill: '#475569', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={v => `${v}kg`}
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
              dot={false}
              activeDot={{ r: 4, fill: '#60a5fa', stroke: '#0a0e1e', strokeWidth: 1.5 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <UpdateWeightModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={(w) => saveWeightMutation.mutate(w)}
        currentWeight={currentWeight}
      />
    </>
  );
}