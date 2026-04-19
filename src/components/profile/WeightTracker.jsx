import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Plus } from 'lucide-react';
import { format, subMonths } from 'date-fns';

const TIMEFRAMES = [
  { key: '2m', label: '2M', months: 2 },
  { key: '6m', label: '6M', months: 6 },
  { key: 'all', label: 'All', months: null },
];

// ── Weight Scroll Picker ──────────────────────────────────────────────────────
function WeightPicker({ value, onChange }) {
  const ITEM_H = 44;
  const VISIBLE = 5;
  const weights = Array.from({ length: 301 }, (_, i) => (30 + i * 0.5));
  const listRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  const initialIdx = useMemo(() => {
    const idx = weights.findIndex(w => w === value);
    return idx >= 0 ? idx : weights.findIndex(w => w === 70);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = initialIdx * ITEM_H;
    }
  }, []);

  const handleScroll = () => {
    if (!listRef.current) return;
    const idx = Math.round(listRef.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(weights.length - 1, idx));
    onChange(weights[clamped]);
  };

  const onMouseDown = (e) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startScrollTop.current = listRef.current.scrollTop;
    e.preventDefault();
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    listRef.current.scrollTop = startScrollTop.current - (e.clientY - startY.current);
  };
  const onMouseUp = () => { isDragging.current = false; };

  return (
    <div
      style={{ position: 'relative', height: ITEM_H * VISIBLE, overflow: 'hidden', cursor: 'ns-resize', userSelect: 'none' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
    >
      <div style={{
        position: 'absolute', left: 0, right: 0, top: ITEM_H * 2, height: ITEM_H,
        background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
        borderRadius: 8, pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,12,28,0.85) 0%, transparent 30%, transparent 70%, rgba(8,12,28,0.85) 100%)', pointerEvents: 'none', zIndex: 2 }} />
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none', paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2,
        }}>
        {weights.map((w) => (
          <div key={w} style={{
            height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
            scrollSnapAlign: 'center',
            fontSize: 22, fontWeight: 700,
            color: w === value ? '#e2e8f0' : 'rgba(148,163,184,0.45)',
            transition: 'color 0.1s',
          }}>
            {w % 1 === 0 ? w.toFixed(0) : w.toFixed(1)}
            <span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3, color: 'rgba(148,163,184,0.5)' }}>kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Update Weight Modal ───────────────────────────────────────────────────────
function UpdateWeightModal({ open, onClose, onSave, currentWeight }) {
  const [weight, setWeight] = useState(currentWeight || 70);
  const [donePresseed, setDonePressed] = useState(false);
  const [cancelPressed, setCancelPressed] = useState(false);

  if (!open) return null;

  return ReactDOM.createPortal(
    <>
      {/* Full-page overlay — above everything */}
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
          {/* Top accent line */}
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
            {/* Cancel — matches logout dialog style */}
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
                boxShadow: cancelPressed
                  ? 'none'
                  : '0 3px 0 #111827, inset 0 1px 0 rgba(255,255,255,0.08)',
                transform: cancelPressed ? 'translateY(3px)' : 'translateY(0)',
                transition: 'transform 0.08s ease, box-shadow 0.08s ease',
              }}
            >
              Cancel
            </button>

            {/* Done — blue, matches app button style */}
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
                  boxShadow: donePresseed ? 'none' : '0 3px 0 #1a3fa8',
                  transform: donePresseed ? 'translateY(3px)' : 'translateY(0)',
                  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
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

// ── Main Component ─────────────────────────────────────────────────────────────
export default function WeightTracker({ currentUser }) {
  const [timeframe, setTimeframe] = useState('2m');
  const [showModal, setShowModal] = useState(false);
  const [addPressed, setAddPressed] = useState(false);
  const toggleRef = useRef(null);
  const pillRef = useRef(null);
  const queryClient = useQueryClient();

  const weightLogs = useMemo(() => {
    return (currentUser?.weight_log || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [currentUser?.weight_log]);

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 70;

  const chartData = useMemo(() => {
    const now = new Date();
    const tf = TIMEFRAMES.find(t => t.key === timeframe);
    const cutoff = tf.months ? subMonths(now, tf.months) : null;
    const filtered = cutoff ? weightLogs.filter(e => new Date(e.date) >= cutoff) : weightLogs;
    return filtered.map(e => ({
      date: format(new Date(e.date), 'MMM d'),
      weight: e.weight,
    }));
  }, [weightLogs, timeframe]);

  const { minW, maxW } = useMemo(() => {
    if (!chartData.length) return { minW: 65, maxW: 95 };
    const vals = chartData.map(d => d.weight);
    const pad = 2;
    return { minW: Math.floor(Math.min(...vals) - pad), maxW: Math.ceil(Math.max(...vals) + pad) };
  }, [chartData]);

  const weightDelta = useMemo(() => {
    if (chartData.length < 2) return null;
    return +(chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1);
  }, [chartData]);

  // ── Sliding pill position ──
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
                  <span style={{ color: weightDelta > 0 ? '#34d399' : weightDelta < 0 ? '#f87171' : '#475569', fontWeight: 700 }}>
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
                position: 'relative', display: 'flex', gap: 0,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, padding: 2,
              }}
            >
              {/* Sliding pill */}
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

            {/* 3D grey Add button */}
            <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 8,
                background: '#0a0f1a', transform: 'translateY(3px)',
              }} />
              <button
                onClick={() => setShowModal(true)}
                onMouseDown={() => setAddPressed(true)}
                onMouseUp={() => { setAddPressed(false); }}
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

        {/* Chart — always shown */}
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
              tickLine={false} axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minW, maxW]}
              tick={{ fill: '#475569', fontSize: 9 }}
              tickLine={false} axisLine={false}
              width={36}
              tickFormatter={v => `${v}kg`}
            />
            <Tooltip content={<WeightTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }} />
            {chartData.length >= 2 && (
              <>
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  fill="url(#weightGrad)"
                  dot={{ r: 2.5, fill: '#60a5fa', stroke: '#0a0e1e', strokeWidth: 1.5 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>

        {chartData.length < 2 && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <p style={{ color: '#334155', fontSize: 11, fontWeight: 600, margin: 0 }}>
              Tap + to log your first entry
            </p>
          </div>
        )}
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