import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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
  const weights = Array.from({ length: 301 }, (_, i) => (30 + i * 0.5)); // 30kg–180kg in 0.5kg steps
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
    <div style={{ position: 'relative', height: ITEM_H * VISIBLE, overflow: 'hidden', cursor: 'ns-resize', userSelect: 'none' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {/* Selection highlight */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: ITEM_H * 2, height: ITEM_H,
        background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
        borderRadius: 8, pointerEvents: 'none', zIndex: 1,
      }} />
      {/* Fade top/bottom */}
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
            {w % 1 === 0 ? w.toFixed(0) : w.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 3, color: 'rgba(148,163,184,0.5)' }}>kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Update Weight Modal ───────────────────────────────────────────────────────
function UpdateWeightModal({ open, onClose, onSave, currentWeight }) {
  const [weight, setWeight] = useState(currentWeight || 70);

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10005, background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(6px)' }} />
      <div style={{
        position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 10006, width: 'min(88vw, 320px)',
        background: 'linear-gradient(135deg, rgba(15,20,45,0.98) 0%, rgba(8,12,30,0.99) 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>
        {/* Top accent */}
        <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.6), transparent)' }} />
        <div style={{ padding: '20px 24px 0' }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#e2e8f0', margin: 0, letterSpacing: '-0.02em' }}>Update your weight</p>
          <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 20px', fontWeight: 500 }}>Scroll to select your current weight</p>
        </div>
        <div style={{ padding: '0 24px' }}>
          <WeightPicker value={weight} onChange={setWeight} />
        </div>
        <div style={{ padding: '16px 24px 24px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b',
          }}>Cancel</button>
          <button onClick={() => { onSave(weight); onClose(); }} style={{
            flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'linear-gradient(to bottom, #60a5fa, #3b82f6, #2563eb)',
            border: '1px solid rgba(147,197,253,0.3)',
            boxShadow: '0 3px 0 #1a3fa8, 0 6px 20px rgba(59,130,246,0.3)',
            color: '#fff',
          }}>Done</button>
        </div>
      </div>
    </>
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
  const queryClient = useQueryClient();

  const weightLogs = useMemo(() => {
    return (currentUser?.weight_log || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [currentUser?.weight_log]);

  const currentWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 70;

  const chartData = useMemo(() => {
    if (!weightLogs.length) return [];
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
    if (!chartData.length) return { minW: 60, maxW: 90 };
    const vals = chartData.map(d => d.weight);
    const pad = 2;
    return { minW: Math.floor(Math.min(...vals) - pad), maxW: Math.ceil(Math.max(...vals) + pad) };
  }, [chartData]);

  const weightDelta = useMemo(() => {
    if (chartData.length < 2) return null;
    return +(chartData[chartData.length - 1].weight - chartData[0].weight).toFixed(1);
  }, [chartData]);

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
              {currentWeight ? `Current: ${currentWeight} kg` : 'Track your body weight'}
              {weightDelta !== null && (
                <span style={{ marginLeft: 6, color: weightDelta > 0 ? '#34d399' : weightDelta < 0 ? '#f87171' : '#475569', fontWeight: 700 }}>
                  {weightDelta > 0 ? '+' : ''}{weightDelta} kg
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Timeframe toggle */}
            <div style={{
              display: 'flex', gap: 2, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 2,
            }}>
              {TIMEFRAMES.map(tf => (
                <button key={tf.key} onClick={() => setTimeframe(tf.key)} style={{
                  padding: '3px 9px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: timeframe === tf.key ? 'linear-gradient(to bottom, rgba(96,165,250,0.7), rgba(59,130,246,0.8))' : 'transparent',
                  color: timeframe === tf.key ? '#fff' : '#475569',
                  boxShadow: timeframe === tf.key ? '0 1px 0 #1a3fa8' : 'none',
                  transition: 'all 0.12s',
                }}>
                  {tf.label}
                </button>
              ))}
            </div>
            {/* Add button */}
            <button onClick={() => setShowModal(true)} style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(to bottom, rgba(96,165,250,0.25), rgba(59,130,246,0.2))',
              border: '1px solid rgba(96,165,250,0.3)',
              boxShadow: '0 2px 0 rgba(0,0,0,0.4)',
              cursor: 'pointer', color: '#60a5fa',
              flexShrink: 0,
            }}>
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Chart */}
        {chartData.length < 2 ? (
          <div style={{ height: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <p style={{ color: '#475569', fontSize: 13, fontWeight: 600, margin: 0 }}>No weight data yet</p>
            <p style={{ color: '#334155', fontSize: 11, margin: 0, textAlign: 'center' }}>Tap + to log your first weight entry</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 9, fontWeight: 500 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[minW, maxW]} tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} width={36} tickFormatter={v => `${v}kg`} />
              <Tooltip content={<WeightTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.07)', strokeWidth: 1 }} />
              <Line type="monotone" dataKey="weight" stroke="#60a5fa" strokeWidth={2} dot={{ r: 2.5, fill: '#60a5fa', stroke: '#0a0e1e', strokeWidth: 1.5 }} activeDot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
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