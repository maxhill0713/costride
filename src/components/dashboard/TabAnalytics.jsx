import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, differenceInDays, subDays, isWithinInterval } from 'date-fns';
import {
  Activity, TrendingUp, TrendingDown, Users, Zap, ArrowUpRight,
  Calendar, Clock, Flame, CheckCircle, AlertTriangle, Shield,
  Target, Award, Star, Eye, UserPlus, Sparkles, BarChart2,
  RefreshCw, Heart, MessageCircle, Trophy,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, LineChart, Line,
} from 'recharts';

/* ── Design tokens ────────────────────────────────────────────────────────────
   Single blue accent (#3b82f6). Semantic use only for red (risk) and
   green (success/healthy). Everything else is neutral.
────────────────────────────────────────────────────────────────────────────── */
const C = {
  bg:        '#080e18',
  surface:   '#0c1422',
  surfaceHi: '#101929',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.12)',
  divider:   'rgba(255,255,255,0.05)',
  blue:      '#3b82f6',
  blueDim:   'rgba(59,130,246,0.1)',
  blueBrd:   'rgba(59,130,246,0.22)',
  red:       '#ef4444',
  redDim:    'rgba(239,68,68,0.09)',
  green:     '#10b981',
  greenDim:  'rgba(16,185,129,0.09)',
  t1:        '#f1f5f9',
  t2:        '#94a3b8',
  t3:        '#475569',
  t4:        '#2d3f55',
};

const tick = { fill: C.t3, fontSize: 10, fontFamily: 'Geist, system-ui' };

/* ── Shared primitives ───────────────────────────────────────────────────── */

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 4px rgba(0,0,0,0.4)`,
      overflow: 'hidden', position: 'relative', ...style,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: sub ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function DRow({ label, value, color, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.divider}` }}>
      <div>
        <div style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: color || C.t1 }}>{value}</span>
    </div>
  );
}

function Empty({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8 }}>
      <Icon style={{ width: 22, height: 22, color: C.t3, opacity: 0.4 }} />
      <span style={{ fontSize: 11, color: C.t3, fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.13em', marginBottom: 10 }}>{children}</div>;
}

/* ── Chart tooltip ───────────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#060c18', border: `1px solid ${C.borderHi}`, borderRadius: 9, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.55)' }}>
      <p style={{ color: C.t2, fontSize: 10, fontWeight: 600, margin: '0 0 3px', letterSpacing: '.04em' }}>{label}</p>
      <p style={{ color: C.t1, fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
};

/* ── Inline sparkline ────────────────────────────────────────────────────── */
function Spark({ data = [], color = C.blue, w = 64, h = 26 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0], last = pts.split(' ').slice(-1)[0];
  const area = `${first.split(',')[0]},${h} ${pts} ${last.split(',')[0]},${h}`;
  const uid = color.replace('#', '') + w;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sp-${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── KPI card ────────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, unit, color, trend, footerBar, spark, subContext }) {
  const trendUp = trend > 0, trendDown = trend < 0;
  const trendColor = trendUp ? C.green : trendDown ? C.red : C.t3;
  return (
    <div style={{
      borderRadius: 14, padding: '16px 18px 15px',
      background: C.surface, border: `1px solid ${C.border}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${color}22,transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.t3, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.t1, lineHeight: 1, letterSpacing: '-0.05em' }}>{value}</div>
          {unit && <div style={{ fontSize: 11, color: C.t2, fontWeight: 500, marginTop: 3 }}>{unit}</div>}
        </div>
        {spark && <Spark data={spark} color={color} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
        {trend != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: trendUp ? C.greenDim : trendDown ? C.redDim : C.divider, border: `1px solid ${trendUp ? 'rgba(16,185,129,0.22)' : trendDown ? 'rgba(239,68,68,0.22)' : C.border}` }}>
            {trendUp ? <ArrowUpRight style={{ width: 9, height: 9, color: trendColor }} /> : trendDown ? <TrendingDown style={{ width: 9, height: 9, color: trendColor }} /> : null}
            <span style={{ fontSize: 10, fontWeight: 700, color: trendColor }}>{trendUp ? '+' : ''}{trend}%</span>
          </span>
        )}
        {subContext && <span style={{ fontSize: 10, color: C.t3 }}>{subContext}</span>}
      </div>
      {footerBar != null && (
        <div style={{ height: 2, borderRadius: 99, background: C.divider, overflow: 'hidden', marginTop: 10 }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${Math.min(100, footerBar)}%`, background: color, transition: 'width .8s ease' }} />
        </div>
      )}
    </div>
  );
}

/* ── Heatmap ─────────────────────────────────────────────────────────────── */
function HeatmapChart({ gymId }) {
  const [weeks, setWeeks] = React.useState(4);
  const { data: heatmapCheckIns = [] } = useQuery({
    queryKey: ['heatmapCheckIns', gymId, weeks],
    queryFn: () => {
      if (weeks === 0) return base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - weeks * 7);
      return base44.entities.CheckIn.filter({ gym_id: gymId, check_in_date: { $gte: cutoff.toISOString() } }, '-check_in_date', 5000);
    },
    enabled: !!gymId, staleTime: 5 * 60 * 1000,
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = [
    { label: '6–8a', hours: [6,7] }, { label: '8–10a', hours: [8,9] },
    { label: '10–12', hours: [10,11] }, { label: '12–2p', hours: [12,13] },
    { label: '2–4p', hours: [14,15] }, { label: '4–6p', hours: [16,17] },
    { label: '6–8p', hours: [18,19] }, { label: '8–10p', hours: [20,21] },
  ];

  const grid = useMemo(() => {
    const mat = Array.from({ length: 7 }, () => Array(slots.length).fill(0));
    heatmapCheckIns.forEach(c => {
      const d = new Date(c.check_in_date), dow = (d.getDay() + 6) % 7, h = d.getHours();
      const si = slots.findIndex(s => s.hours.includes(h));
      if (si >= 0) mat[dow][si]++;
    });
    return mat;
  }, [heatmapCheckIns]);

  const maxVal = Math.max(...grid.flat(), 1);
  let peakDay = 0, peakSlot = 0;
  grid.forEach((row, di) => row.forEach((val, si) => { if (val > grid[peakDay][peakSlot]) { peakDay = di; peakSlot = si; } }));

  const cellBg = (val, di, si) => {
    const pct = val / maxVal, isPeak = di === peakDay && si === peakSlot && val > 0;
    if (isPeak) return { bg: C.red, brd: `${C.red}aa` };
    if (!val) return { bg: C.divider, brd: C.border };
    if (pct < 0.25) return { bg: `${C.blue}18`, brd: `${C.blue}28` };
    if (pct < 0.5)  return { bg: `${C.blue}40`, brd: `${C.blue}55` };
    if (pct < 0.75) return { bg: `${C.blue}70`, brd: `${C.blue}88` };
    return { bg: C.blue, brd: C.blue };
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        {[{ l: '4W', v: 4 }, { l: '12W', v: 12 }, { l: 'All', v: 0 }].map(o => (
          <button key={o.v} onClick={() => setWeeks(o.v)}
            style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
              background: weeks === o.v ? C.blueDim : 'rgba(255,255,255,0.03)',
              color: weeks === o.v ? C.blue : C.t3,
              border: `1px solid ${weeks === o.v ? C.blueBrd : C.border}`, transition: 'all .14s' }}>
            {o.l}
          </button>
        ))}
        <span style={{ fontSize: 10, color: C.t3, marginLeft: 4 }}>{heatmapCheckIns.length} check-ins</span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
        <div />
        {slots.map(s => <div key={s.label} style={{ fontSize: 9, fontWeight: 700, color: C.t3, textAlign: 'center' }}>{s.label}</div>)}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.t2 }}>{day}</div>
            {grid[di].map((val, si) => {
              const { bg, brd } = cellBg(val, di, si);
              const isPeak = di === peakDay && si === peakSlot && val > 0;
              return (
                <div key={si} title={val > 0 ? `${day} ${slots[si].label}: ${val}` : undefined}
                  style={{ height: 32, borderRadius: 7, background: bg, border: `1px solid ${brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: isPeak ? '#fff' : val / maxVal > 0.4 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)' }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: C.redDim, border: `1px solid rgba(239,68,68,0.22)` }}>
          <Flame style={{ width: 10, height: 10, color: C.red }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: C.red }}>Peak: {days[peakDay]} {slots[peakSlot]?.label} · {grid[peakDay][peakSlot]} visits</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: C.t3 }}>Low</span>
          {[C.divider, `${C.blue}18`, `${C.blue}40`, `${C.blue}70`, C.blue].map((bg, i) => (
            <div key={i} style={{ width: 14, height: 8, borderRadius: 3, background: bg, border: `1px solid ${C.border}` }} />
          ))}
          <span style={{ fontSize: 9, color: C.t3 }}>High</span>
        </div>
      </div>
    </div>
  );
}

/* ── Retention Funnel ────────────────────────────────────────────────────── */
function RetentionFunnelWidget({ retentionFunnel = [] }) {
  const icons = [UserPlus, RefreshCw, Activity, CheckCircle];
  const hasData = retentionFunnel.length > 0 && retentionFunnel[0]?.val > 0;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Retention Funnel" sub="Member lifecycle — where people drop off"
        right={<div style={{ width: 28, height: 28, borderRadius: 7, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Target style={{ width: 12, height: 12, color: C.blue }} /></div>}
      />
      {!hasData ? (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: C.blueDim, border: `1px solid ${C.blueBrd}` }}>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>Funnel populates once members have joined and checked in.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {retentionFunnel.map((stage, i) => {
            const Icon = icons[i] || CheckCircle;
            const pct = retentionFunnel[0].val > 0 ? Math.round((stage.val / retentionFunnel[0].val) * 100) : 0;
            const conv = i > 0 && retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : null;
            const drop = conv !== null ? 100 - conv : 0;
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 13, height: 13, color: C.blue }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{stage.label}</span>
                        <span style={{ fontSize: 10, color: C.t3, marginLeft: 7 }}>{stage.desc}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 17, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em' }}>{stage.val}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: C.t3 }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: C.divider, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: C.blue, transition: 'width .8s ease' }} />
                    </div>
                  </div>
                </div>
                {i < retentionFunnel.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 14, marginBottom: 2 }}>
                    <div style={{ width: 1, height: 16, background: C.border, marginLeft: 15, flexShrink: 0 }} />
                    {conv !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 5,
                          color: drop > 40 ? C.red : C.t2,
                          background: drop > 40 ? C.redDim : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${drop > 40 ? 'rgba(239,68,68,0.22)' : C.border}` }}>
                          {conv}% converted
                        </span>
                        {drop > 0 && <span style={{ fontSize: 9, color: C.t3 }}>{drop}% lost</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── Drop-off Analysis ───────────────────────────────────────────────────── */
function DropOffAnalysis({ dropOffBuckets = [] }) {
  const data = dropOffBuckets.map(b => ({
    ...b, color: b.label === 'Week 1' ? C.red : b.label.includes('3+') ? C.t3 : C.blue,
  }));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Drop-off Analysis" sub="Where members go quiet by lifecycle stage"
        right={
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 7,
            color: total > 0 ? C.red : C.green,
            background: total > 0 ? C.redDim : C.greenDim,
            border: `1px solid ${total > 0 ? 'rgba(239,68,68,0.22)' : 'rgba(16,185,129,0.2)'}` }}>
            {total} at risk
          </span>
        }
      />
      {total === 0 ? (
        <div style={{ padding: '11px 14px', borderRadius: 9, background: C.greenDim, border: '1px solid rgba(16,185,129,0.18)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.green }}>No significant drop-off patterns detected</div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
              <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length
                ? <div style={{ background: '#060c18', border: `1px solid ${C.borderHi}`, borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ color: C.t2, fontSize: 10, margin: '0 0 3px' }}>{label}</p>
                    <p style={{ color: C.red, fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value} members</p>
                  </div> : null} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.82} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[...data].filter(d => d.count > 0).sort((a, b) => b.count - a.count).map((d, i) => {
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9,
                  background: i === 0 ? `${d.color}0a` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? d.color + '1e' : C.border}` }}>
                  {i === 0 && <span style={{ fontSize: 8, fontWeight: 800, color: d.color, background: `${d.color}18`, border: `1px solid ${d.color}28`, borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '.05em', flexShrink: 0 }}>Highest</span>}
                  <span style={{ flex: 1, fontSize: 11, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? C.t1 : C.t2 }}>{d.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: d.color }}>{d.count}</span>
                  <span style={{ fontSize: 10, color: C.t3, minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

/* ── Churn Signal Tracker ────────────────────────────────────────────────── */
function ChurnSignalWidget({ churnSignals = [] }) {
  const riskLabel = s => s >= 90 ? 'Critical' : s >= 70 ? 'High' : s >= 50 ? 'Medium' : 'Low';
  const riskColor = s => s >= 50 ? C.red : C.blue;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Churn Risk Tracker" sub="Scored by recency and visit frequency"
        right={
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 6,
            color: churnSignals.length > 0 ? C.red : C.green,
            background: churnSignals.length > 0 ? C.redDim : C.greenDim,
            border: `1px solid ${churnSignals.length > 0 ? 'rgba(239,68,68,0.22)' : 'rgba(16,185,129,0.2)'}` }}>
            {churnSignals.length > 0 ? `${churnSignals.length} flagged` : 'Clear'}
          </span>
        }
      />
      {churnSignals.length === 0 ? (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: C.greenDim, border: '1px solid rgba(16,185,129,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.green, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>No churn signals detected</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>All tracked members showing healthy engagement</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {churnSignals.map((m, i) => {
            const color = riskColor(m.score);
            return (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.022)', border: `1px solid ${m.score >= 80 ? 'rgba(239,68,68,0.18)' : C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 8, fontWeight: 800, color, background: `${color}14`, border: `1px solid ${color}28`, borderRadius: 4, padding: '1.5px 6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>{riskLabel(m.score)}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                  </div>
                  <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>{m.daysSince < 999 ? `${m.daysSince}d absent` : 'No visits'}</span>
                </div>
                <div style={{ height: 2.5, borderRadius: 99, background: C.divider, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${m.score}%`, borderRadius: 99, background: `linear-gradient(90deg,${color}60,${color})`, transition: 'width .6s ease' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 9, color: C.t3 }}>Score <span style={{ fontWeight: 700, color }}>{m.score}</span>/100</span>
                  {m.freqDrop && m.prev30 > 0 && <span style={{ fontSize: 9, color: C.t2 }}>{m.last30} vs {m.prev30} visits last month</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ── Week-1 Return Trend ─────────────────────────────────────────────────── */
function Week1ReturnTrendWidget({ week1ReturnTrend = [] }) {
  const data = week1ReturnTrend;
  const latest = data[data.length - 1]?.pct || 0;
  const prev   = data[data.length - 2]?.pct || 0;
  const delta  = latest - prev;
  const statusColor = latest >= 60 ? C.green : latest >= 40 ? C.blue : C.red;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Week-1 Return Rate" sub="New member cohort trend"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: statusColor, letterSpacing: '-0.04em' }}>{latest}%</span>
            {delta !== 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: delta > 0 ? C.green : C.red }}>
                {delta > 0 ? '+' : ''}{delta}%
              </span>
            )}
          </div>
        }
      />
      <ResponsiveContainer width="100%" height={64}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="w1g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.blue} stopOpacity={0.2} />
              <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={({ active, payload, label }) => active && payload?.length
            ? <div style={{ background: '#060c18', border: `1px solid ${C.borderHi}`, borderRadius: 8, padding: '6px 10px' }}>
                <p style={{ color: C.t2, fontSize: 9, margin: '0 0 2px' }}>{label}</p>
                <p style={{ color: C.blue, fontWeight: 800, fontSize: 13, margin: 0 }}>{payload[0].value}%</p>
              </div> : null} cursor={false} />
          <Area type="monotone" dataKey="pct" stroke={C.blue} strokeWidth={1.8} fill="url(#w1g)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8,
        background: latest < 40 ? C.redDim : C.greenDim,
        border: `1px solid ${latest < 40 ? 'rgba(239,68,68,0.18)' : 'rgba(16,185,129,0.16)'}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: statusColor, lineHeight: 1.5 }}>
          {latest < 40 ? 'Below target — follow up with new members in week 1' : latest < 60 ? 'Room to improve — a personal welcome message helps' : 'Strong week-1 return rate'}
        </div>
      </div>
    </Card>
  );
}

/* ── Smart Insights ──────────────────────────────────────────────────────── */
function SmartInsightsPanel({ checkIns, ci30, allMemberships, atRisk, retentionRate, monthChangePct, totalMembers, now }) {
  const insights = useMemo(() => {
    const items = [];
    if (totalMembers < 5) {
      items.push({ color: C.blue, icon: Users, label: `Only ${totalMembers} member${totalMembers === 1 ? '' : 's'} so far`, detail: `Analytics become meaningful at 10+ members. Add ${10 - totalMembers} more to unlock trend insights.`, info: true });
      return items;
    }
    if (totalMembers < 10) items.push({ color: C.blue, icon: Users, label: `${totalMembers} members — growing`, detail: `Retention data becomes reliable at 10+ members.`, info: true });
    if (totalMembers >= 10) {
      if (retentionRate < 60) items.push({ color: C.red, icon: AlertTriangle, label: `Retention at ${retentionRate}% — below 70% healthy threshold`, detail: 'Focus on week-1 follow-ups and streak recovery messages.' });
      else if (retentionRate >= 80) items.push({ color: C.green, icon: CheckCircle, label: `Retention strong at ${retentionRate}%`, detail: "You're in the top 20% of gyms — keep your current engagement rhythm." });
    }
    const atRiskPct = totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0;
    if (atRiskPct >= 20) items.push({ color: C.red, icon: Zap, label: `${atRiskPct}% of members are at risk`, detail: 'Send a re-engagement push to everyone 14+ days inactive.' });
    if (checkIns.length < 20) {
      items.push({ color: C.blue, icon: Activity, label: 'Not enough check-in data yet', detail: 'Month-over-month comparisons populate after 7+ days of check-ins.', info: true });
    } else if (monthChangePct < -10) {
      items.push({ color: C.red, icon: TrendingDown, label: `Check-ins down ${Math.abs(monthChangePct)}% vs last month`, detail: 'Consider a new challenge or event to re-activate attendance.' });
    } else if (monthChangePct > 15) {
      items.push({ color: C.green, icon: TrendingUp, label: `Strong growth — up ${monthChangePct}% this month`, detail: 'Great momentum. Make sure your schedule can handle demand.' });
    }
    const visitRatio = totalMembers > 0 ? (ci30.length / 30) / totalMembers : 0;
    if (visitRatio < 0.05 && totalMembers > 10) items.push({ color: C.blue, icon: Activity, label: 'Visit frequency is low', detail: 'Less than 5% of members check in per day. Try promoting morning classes.' });
    const weekendCI = checkIns.filter(c => [0, 6].includes(new Date(c.check_in_date).getDay())).length;
    if (weekendCI / Math.max(checkIns.length, 1) < 0.15 && checkIns.length > 50) items.push({ color: C.blue, icon: Calendar, label: 'Weekend attendance is low (<15% of visits)', detail: 'A weekend challenge or Saturday event could drive more footfall.' });
    return items.slice(0, 4);
  }, [checkIns, ci30, atRisk, retentionRate, monthChangePct, totalMembers]);

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Sparkles style={{ width: 13, height: 13, color: C.blue }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Smart Insights</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {insights.length === 0 ? (
          <div style={{ padding: '10px 12px', borderRadius: 9, background: C.greenDim, border: '1px solid rgba(16,185,129,0.18)' }}>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Your gym looks healthy — no critical signals</div>
          </div>
        ) : insights.map((s, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 10,
            background: `${s.color}${s.info ? '07' : '09'}`,
            border: `1px solid ${s.color}${s.info ? '18' : '22'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <s.icon style={{ width: 11, height: 11, color: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: s.info ? C.t2 : C.t1 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 10, color: C.t3, paddingLeft: 18, lineHeight: 1.55 }}>{s.detail}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Class Performance ───────────────────────────────────────────────────── */
function ClassPerformanceWidget({ classes, checkIns, ci30, now }) {
  const classData = useMemo(() => (classes || []).map(cls => {
    const clsCI = ci30.filter(c => c.class_id === cls.id || c.class_name === cls.name);
    const cap = cls.max_capacity || cls.capacity || 20;
    const sessions = Math.max(4, Math.ceil(clsCI.length / Math.max(cap * 0.5, 1)));
    const avgAtt = sessions > 0 ? Math.round(clsCI.length / sessions) : 0;
    const fillRate = Math.min(100, Math.round((avgAtt / cap) * 100));
    const first15 = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d > 15; }).length;
    const last15 = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d <= 15; }).length;
    const trending = first15 === 0 ? 0 : Math.round(((last15 - first15) / first15) * 100);
    return { ...cls, avgAtt, fillRate, trending, cap };
  }).sort((a, b) => b.fillRate - a.fillRate), [classes, ci30, now]);

  if (!classData.length) return null;

  const statusColor = rate => rate >= 75 ? C.green : rate >= 40 ? C.blue : C.red;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Class Performance" sub="Fill rates and attendance (30 days)"
        right={<Trophy style={{ width: 13, height: 13, color: C.t3 }} />}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {classData.map((cls, i) => (
          <div key={cls.id || i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(cls.fillRate), flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{cls.name}</span>
                {cls.trending !== 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: cls.trending > 0 ? C.green : C.red }}>
                    {cls.trending > 0 ? '+' : ''}{cls.trending}%
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: statusColor(cls.fillRate) }}>{cls.fillRate}%</span>
                <span style={{ fontSize: 10, color: C.t3 }}>fill</span>
              </div>
            </div>
            <div style={{ height: 3, borderRadius: 99, background: C.divider, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${cls.fillRate}%`, borderRadius: 99, background: statusColor(cls.fillRate), transition: 'width .8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: C.t3 }}>~{cls.avgAtt} avg / session</span>
              <span style={{ fontSize: 9, color: C.t3 }}>cap {cls.cap}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Staff Performance (full) ────────────────────────────────────────────── */
function StaffPerformanceWidget({ coaches, checkIns, ci30, classes, allMemberships, now }) {
  const data = useMemo(() => (coaches || []).map(coach => {
    // Members this coach coached (via check-in metadata or class overlap)
    const coachCI = ci30.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
    const uniqueMembers = new Set(coachCI.map(c => c.user_id)).size;

    // Retention: coached members who checked in in last 14 days
    const coachedIds = new Set(coachCI.map(c => c.user_id));
    const retained = [...coachedIds].filter(id => {
      const last = checkIns.filter(c => c.user_id === id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      return last && differenceInDays(now, new Date(last.check_in_date)) <= 14;
    }).length;
    const retentionPct = coachedIds.size > 0 ? Math.round((retained / coachedIds.size) * 100) : 0;

    // Classes this coach teaches
    const myClasses = (classes || []).filter(c =>
      c.instructor === coach.name || c.instructor === coach.user_email ||
      c.coach_name === coach.name || c.coach_id === coach.id
    );

    // Avg check-ins per coached member
    const avgVisits = uniqueMembers > 0 ? (coachCI.length / uniqueMembers).toFixed(1) : '—';

    // Engagement score (0–100): weighted blend
    const engagementScore = Math.min(100, Math.round(
      (retentionPct * 0.5) +
      (Math.min(uniqueMembers / 20, 1) * 100 * 0.3) +
      (Math.min(myClasses.length / 5, 1) * 100 * 0.2)
    ));

    return { ...coach, uniqueMembers, retentionPct, myClasses, avgVisits, engagementScore };
  }).sort((a, b) => b.engagementScore - a.engagementScore), [coaches, checkIns, ci30, classes, now]);

  if (!data.length) return null;

  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Staff Performance"
        sub="Coach engagement scores, retention impact & class load"
        right={
          <div style={{ width: 28, height: 28, borderRadius: 7, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star style={{ width: 12, height: 12, color: C.blue }} />
          </div>
        }
      />

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 64px 64px 72px', gap: 8, padding: '0 0 8px', borderBottom: `1px solid ${C.divider}`, marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.1em' }}>Coach</div>
        {['Members', 'Classes', 'Avg Visits', 'Retention'].map(h => (
          <div key={h} style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.1em', textAlign: 'center' }}>{h}</div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((coach, i) => {
          const retColor = coach.retentionPct >= 70 ? C.green : coach.retentionPct >= 50 ? C.blue : C.red;
          const scoreColor = coach.engagementScore >= 70 ? C.green : coach.engagementScore >= 45 ? C.blue : C.red;
          const tier = coach.engagementScore >= 70 ? 'Top' : coach.engagementScore >= 45 ? 'Mid' : 'Low';
          return (
            <div key={coach.id || i} style={{ padding: '12px 14px', borderRadius: 11, background: i === 0 ? `${C.green}07` : 'rgba(255,255,255,0.02)', border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.14)' : C.border}`, position: 'relative', overflow: 'hidden' }}>
              {/* Rank accent line */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '11px 0 0 11px', background: scoreColor, opacity: 0.7 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 64px 64px 72px', gap: 8, alignItems: 'center' }}>
                {/* Name + avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: `linear-gradient(135deg,${scoreColor}40,${scoreColor}18)`, border: `1.5px solid ${scoreColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: scoreColor }}>
                    {coach.avatar_url
                      ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : ini(coach.name)
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coach.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: scoreColor, background: `${scoreColor}12`, border: `1px solid ${scoreColor}28`, borderRadius: 4, padding: '1px 5px' }}>{tier} Performer</span>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em' }}>{coach.uniqueMembers}</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>coached</div>
                </div>

                {/* Classes */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.blue, letterSpacing: '-0.03em' }}>{coach.myClasses.length}</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>classes</div>
                </div>

                {/* Avg visits */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: C.t1, letterSpacing: '-0.03em' }}>{coach.avgVisits}</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>avg/mem</div>
                </div>

                {/* Retention */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: retColor, letterSpacing: '-0.03em' }}>{coach.retentionPct}%</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>retention</div>
                </div>
              </div>

              {/* Engagement score bar */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, whiteSpace: 'nowrap' }}>Engagement score</span>
                <div style={{ flex: 1, height: 3, borderRadius: 99, background: C.divider, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${coach.engagementScore}%`, background: `linear-gradient(90deg,${scoreColor}88,${scoreColor})`, borderRadius: 99, transition: 'width .8s ease' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor, minWidth: 28, textAlign: 'right' }}>{coach.engagementScore}</span>
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: C.t3, fontSize: 11 }}>No coaches added yet</div>
      )}
    </Card>
  );
}

/* ── Coach Impact (sidebar compact) ─────────────────────────────────────── */
function CoachImpactWidget({ coaches, checkIns, ci30, allMemberships, now }) {
  const data = useMemo(() => (coaches || []).map(coach => {
    const coachCI = ci30.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
    const uniqueMembers = new Set(coachCI.map(c => c.user_id)).size;
    const coachedIds = new Set(coachCI.map(c => c.user_id));
    const retained = [...coachedIds].filter(id => {
      const last = checkIns.filter(c => c.user_id === id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      return last && differenceInDays(now, new Date(last.check_in_date)) <= 14;
    }).length;
    const retentionImpact = coachedIds.size > 0 ? Math.round((retained / coachedIds.size) * 100) : 0;
    return { ...coach, uniqueMembers, retentionImpact };
  }).sort((a, b) => b.retentionImpact - a.retentionImpact), [coaches, checkIns, ci30, now]);

  if (!data.length) return null;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Coach Retention Impact" sub="Retention of members they coached (30d)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.slice(0, 5).map((coach, i) => {
          const color = coach.retentionImpact >= 70 ? C.green : coach.retentionImpact >= 50 ? C.blue : C.red;
          return (
            <div key={coach.id || i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: i === 0 ? C.greenDim : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.22)' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i === 0 ? C.green : C.t3 }}>{i + 1}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{coach.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: C.t3 }}>{coach.uniqueMembers} members</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{coach.retentionImpact}%</span>
                </div>
              </div>
              <div style={{ height: 2.5, borderRadius: 99, background: C.divider, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${coach.retentionImpact}%`, borderRadius: 99, background: color, transition: 'width .8s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Milestone Progress ──────────────────────────────────────────────────── */
function MilestoneProgressWidget({ checkIns }) {
  const milestones = useMemo(() => {
    const acc = {}, uid = {};
    checkIns.forEach(c => { if (!acc[c.user_name]) acc[c.user_name] = 0; acc[c.user_name]++; if (c.user_id) uid[c.user_name] = c.user_id; });
    return Object.entries(acc).map(([name, total]) => {
      const next = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
      return { name, total, next, toNext: next ? next - total : 0 };
    }).filter(m => m.next && m.toNext <= 5).sort((a, b) => a.toNext - b.toNext).slice(0, 5);
  }, [checkIns]);

  if (!milestones.length) return null;

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Award style={{ width: 13, height: 13, color: C.blue }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Upcoming Milestones</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {milestones.map((m, i) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < milestones.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: m.toNext === 1 ? C.blueDim : 'rgba(255,255,255,0.04)', border: `1px solid ${m.toNext === 1 ? C.blueBrd : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: m.toNext === 1 ? C.blue : C.t3 }}>
              {m.total}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: m.toNext === 1 ? C.green : C.t3, marginTop: 1 }}>
                {m.toNext === 1 ? '1 visit to milestone' : `${m.toNext} visits to ${m.next}`}
              </div>
            </div>
            {/* Mini ring */}
            <svg width={28} height={28} viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
              <circle cx={14} cy={14} r={11} fill="none" stroke={C.divider} strokeWidth={2.5} />
              <circle cx={14} cy={14} r={11} fill="none" stroke={C.blue} strokeWidth={2.5}
                strokeDasharray={`${(m.total / m.next) * 69.1} 69.1`}
                strokeLinecap="round" transform="rotate(-90 14 14)" />
            </svg>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Segment Breakdown ───────────────────────────────────────────────────── */
function SegmentBreakdown({ title, segments, total }) {
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title={title} />
      {total > 0 && (
        <div style={{ height: 4, borderRadius: 99, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 16 }}>
          {segments.filter(s => s.val > 0).map((s, i, arr) => (
            <div key={i} style={{ flex: s.val, background: s.color, opacity: 0.85,
              borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0 }} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((s.val / total) * 100) : 0;
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>{s.label}</span>
                  {s.sub && <span style={{ fontSize: 9, color: C.t3 }}>{s.sub}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.val}</span>
                  <span style={{ fontSize: 9, color: C.t3, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 2.5, borderRadius: 99, background: C.divider, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 99, transition: 'width .8s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Ranked Bar List ─────────────────────────────────────────────────────── */
function RankedBarList({ title, icon: Icon, items, emptyLabel }) {
  const max = Math.max(...items.map(d => d.count || 0), 1);
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title={title} right={<Icon style={{ width: 13, height: 13, color: C.t3 }} />} />
      {items.every(d => !d.count) ? <Empty icon={Icon} label={emptyLabel || 'No data yet'} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {items.map((h, i) => (
            <div key={h.label || h.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: C.t4, width: 16, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.t1, width: 36, flexShrink: 0 }}>{h.label || h.name}</span>
              <div style={{ flex: 1, height: 4, borderRadius: 99, overflow: 'hidden', background: C.divider }}>
                <div style={{ height: '100%', width: `${(h.count / max) * 100}%`, borderRadius: 99, background: C.blue, transition: 'width .7s ease' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.t2, width: 22, textAlign: 'right', flexShrink: 0 }}>{h.count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Vs-last-month badge ─────────────────────────────────────────────────── */
function VsBadge({ current, prev }) {
  if (!prev || prev === 0) return null;
  const diff = current - prev, pct = Math.round((diff / prev) * 100), up = diff > 0, flat = diff === 0;
  const color = flat ? C.t3 : up ? C.green : C.red;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
      color, background: flat ? C.divider : up ? C.greenDim : C.redDim,
      border: `1px solid ${flat ? C.border : up ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}` }}>
      {flat ? '→' : up ? '↑' : '↓'} {Math.abs(pct)}% vs last month
    </span>
  );
}

/* ── Month Comparison ────────────────────────────────────────────────────── */
function MonthComparison({ ci30, ciPrev30, retentionRate, atRisk, monthChangePct, totalMembers, now }) {
  const prevActive = useMemo(() => ciPrev30?.length ? new Set(ciPrev30.map(c => c.user_id)).size : null, [ciPrev30]);
  const thisActive = useMemo(() => new Set(ci30.map(c => c.user_id)).size, [ci30]);
  const prevRetention = prevActive !== null && totalMembers > 0 ? Math.round((prevActive / totalMembers) * 100) : null;
  const rows = [
    { label: 'Check-ins',      curr: ci30.length, prev: ciPrev30?.length || 0, color: C.blue  },
    { label: 'Active members', curr: thisActive,   prev: prevActive,            color: C.green },
    { label: 'Retention rate', curr: `${retentionRate}%`, prev: prevRetention ? prevRetention : null, fmt: true, color: retentionRate >= 70 ? C.green : C.blue },
    { label: 'At-risk members',curr: atRisk,       prev: null,                  color: atRisk > 0 ? C.red : C.green },
  ];
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Month Comparison" sub="This month vs last month" />
      <div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <span style={{ fontSize: 12, color: C.t2 }}>{r.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {r.prev !== null && !r.fmt && <VsBadge current={r.curr} prev={r.prev} />}
              <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.curr}</span>
            </div>
          </div>
        ))}
      </div>
      {(!ciPrev30?.length) && (
        <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: C.blueDim, border: `1px solid ${C.blueBrd}` }}>
          <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.5 }}>Comparison data populates after your first full month of check-ins.</div>
        </div>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════════════ */
export default function TabAnalytics({
  checkIns, ci30, ciPrev30 = [], totalMembers, monthCiPer, monthChangePct,
  monthGrowthData, retentionRate, activeThisMonth, newSignUps, atRisk, gymId,
  allMemberships = [], classes = [], coaches = [], avatarMap = {},
  isCoach = false, myClasses = [],
  weekTrend: weekTrendProp = [], peakHours: peakHoursProp = [], busiestDays: busiestDaysProp = [],
  returnRate: returnRateProp = 0, dailyAvg: dailyAvgProp = 0, engagementSegments = {},
  retentionFunnel: retentionFunnelProp = [], dropOffBuckets: dropOffBucketsProp = [],
  churnSignals: churnSignalsProp = [], week1ReturnTrend: week1ReturnTrendProp = [],
}) {
  const now = new Date();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn);
  }, []);

  const weekTrend   = weekTrendProp.length  > 0 ? weekTrendProp   : [];
  const peakHours   = peakHoursProp.length  > 0 ? peakHoursProp   : [];
  const busiestDays = busiestDaysProp.length > 0 ? busiestDaysProp : [];
  const dayMax      = Math.max(...busiestDays.map(d => d.count || 0), 1);
  const dailyAvg    = dailyAvgProp || Math.round(ci30.length / 30);
  const returnRate  = returnRateProp || 0;
  const avgPerMem   = totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—';

  const superActive = engagementSegments.superActive ?? (monthCiPer || []).filter(v => v >= 15).length;
  const active      = engagementSegments.active      ?? (monthCiPer || []).filter(v => v >= 8 && v < 15).length;
  const casual      = engagementSegments.casual      ?? (monthCiPer || []).filter(v => v >= 1 && v < 8).length;
  const inactive    = engagementSegments.inactive    ?? Math.max(0, totalMembers - (monthCiPer || []).length);

  const trendColor = monthChangePct > 0 ? C.green : monthChangePct < 0 ? C.red : C.t3;

  /* ── Gradient shared by area charts ── */
  const AreaGrad = ({ id }) => (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.blue} stopOpacity={0.28} />
        <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
      </linearGradient>
    </defs>
  );

  /* ── Coach analytics ── */
  const classAttendance = useMemo(() => {
    if (!isCoach || !myClasses.length) return [];
    return myClasses.map(cls => {
      const clsCI = ci30.filter(c => {
        if (!cls.schedule) return false;
        const match = cls.schedule.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!match) return false;
        let h = parseInt(match[1]); if (match[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        const ch = new Date(c.check_in_date).getHours(); return ch === h || ch === h + 1;
      }).length;
      const cap = cls.max_capacity || 20;
      return { name: cls.name, schedule: cls.schedule, capacity: cap, attended: clsCI, fill: Math.min(100, Math.round((clsCI / cap) * 100)) };
    });
  }, [isCoach, myClasses, ci30]);

  const classWeeklyTrend = useMemo(() => {
    if (!isCoach) return [];
    return Array.from({ length: 8 }, (_, i) => {
      const s = subDays(now, (7 - i) * 7), e = subDays(now, (6 - i) * 7);
      return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
    });
  }, [isCoach, checkIns]);

  const memberFrequency = useMemo(() => {
    if (!isCoach) return { frequent: 0, occasional: 0, rare: 0, inactive: 0 };
    const freq = {};
    ci30.forEach(c => { freq[c.user_id] = (freq[c.user_id] || 0) + 1; });
    const vals = Object.values(freq);
    return { frequent: vals.filter(v => v >= 12).length, occasional: vals.filter(v => v >= 4 && v < 12).length, rare: vals.filter(v => v >= 1 && v < 4).length, inactive: Math.max(0, totalMembers - vals.length) };
  }, [isCoach, ci30, totalMembers]);

  /* ── Snapshot items for sidebar ── */
  const snapshotItems = [
    { label: 'Check-ins',      value: ci30.length,           sub: `${dailyAvg}/day avg`,                    color: C.blue,  icon: Activity      },
    { label: 'New sign-ups',   value: newSignUps,             sub: `+${newSignUps} joined`,                  color: C.green, icon: UserPlus      },
    { label: 'Retention',      value: `${retentionRate}%`,    sub: retentionRate >= 70 ? 'Healthy' : 'Below target', color: retentionRate >= 70 ? C.green : C.blue, icon: Shield },
    { label: 'At risk',        value: atRisk,                 sub: atRisk > 0 ? `${Math.round((atRisk / Math.max(totalMembers,1)) * 100)}% of gym` : 'None', color: atRisk > 0 ? C.red : C.green, icon: AlertTriangle },
    { label: 'Active classes', value: (classes||[]).length,  sub: 'on schedule',                            color: C.blue,  icon: Calendar      },
    { label: 'Avg visits/mem', value: avgPerMem,              sub: 'this month',                             color: C.blue,  icon: BarChart2     },
  ];

  /* ════════════════════════════════════════════════════════════════════
     COACH VIEW
  ════════════════════════════════════════════════════════════════════ */
  if (isCoach) return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={Activity}   label="Monthly Check-ins" value={ci30.length}     unit="this month"           color={C.blue}  trend={monthChangePct} footerBar={totalMembers > 0 ? (ci30.length / (totalMembers * 4)) * 100 : 0} />
          <KpiCard icon={Users}      label="Active Members"    value={activeThisMonth} unit={`of ${totalMembers}`} color={C.green} footerBar={totalMembers > 0 ? (activeThisMonth / totalMembers) * 100 : 0} />
          <KpiCard icon={TrendingUp} label="Avg Visits/Member" value={avgPerMem}       unit="this month"           color={C.blue} />
          <KpiCard icon={Zap}        label="At Risk"           value={atRisk}          unit="14+ days absent"      color={atRisk > 0 ? C.red : C.green} />
        </div>

        {classAttendance.length > 0 && (
          <Card style={{ padding: 20 }}>
            <CardHead title="My Class Attendance (30 days)" sub="Estimated from check-in time slots" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {classAttendance.map((cls, i) => {
                const color = cls.fill >= 75 ? C.green : cls.fill >= 40 ? C.blue : C.red;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{cls.name}</span>
                        {cls.schedule && <span style={{ fontSize: 10, color: C.t3, marginLeft: 8 }}>{cls.schedule}</span>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color }}>{cls.attended}</span>
                        <span style={{ fontSize: 9, color: C.t3, marginLeft: 4 }}>/ {cls.capacity} cap</span>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: C.divider, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${cls.fill}%`, background: color, borderRadius: 99, transition: 'width .8s ease' }} />
                    </div>
                    <div style={{ fontSize: 9, color: C.t3, marginTop: 3, textAlign: 'right' }}>{cls.fill}% fill rate</div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card style={{ padding: 20 }}>
          <CardHead title="Class Attendance Trend" sub="8-week rolling view" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={classWeeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <AreaGrad id="coachGrad" />
              <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
              <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} interval={1} />
              <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: `${C.blue}20`, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="value" stroke={C.blue} strokeWidth={1.8} fill="url(#coachGrad)" dot={false} activeDot={{ r: 3, fill: C.blue, stroke: C.t1, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 20 }}>
          <CardHead title="Member Traffic Heatmap" sub="Check-in density by day and time"
            right={<Flame style={{ width: 13, height: 13, color: C.t3 }} />} />
          <HeatmapChart gymId={gymId} />
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card style={{ padding: 20 }}>
          <Label>30-Day Snapshot</Label>
          <DRow label="Total check-ins"   value={ci30.length}                               color={C.blue}  />
          <DRow label="Active members"    value={activeThisMonth}                            color={C.green} />
          <DRow label="At-risk members"   value={atRisk}                                     color={atRisk > 0 ? C.red : C.green} />
          <DRow label="My classes"        value={myClasses.length}                           color={C.blue}  />
          <DRow label="Avg visits/member" value={totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—'} color={C.blue} />
        </Card>

        <SegmentBreakdown title="Member Frequency" total={totalMembers} segments={[
          { label: 'Frequent',   sub: '12+/mo', val: memberFrequency.frequent,   color: C.green },
          { label: 'Occasional', sub: '4–11',   val: memberFrequency.occasional, color: C.blue  },
          { label: 'Rare',       sub: '1–3',    val: memberFrequency.rare,       color: `${C.blue}88` },
          { label: 'Inactive',   sub: '0',      val: memberFrequency.inactive,   color: C.red   },
        ]} />

        <RankedBarList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
        <RankedBarList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)}                            emptyLabel="No check-in data yet" />
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════
     GYM OWNER VIEW
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 292px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* KPIs */}
        {checkIns.length < 3 ? (
          <Card style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.blueDim, border: `1px solid ${C.blueBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Activity style={{ width: 15, height: 15, color: C.blue }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>Analytics data loading</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 3, lineHeight: 1.55 }}>KPIs and trends populate after your first 7 days of check-ins. Start by scanning member QR codes.</div>
              </div>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
            <KpiCard icon={Activity}   label="Daily Avg"      value={dailyAvg}   unit="check-ins / day"   color={C.blue}  trend={monthChangePct} footerBar={totalMembers > 0 ? (dailyAvg / totalMembers) * 100 : 0} spark={weekTrend.slice(-7).map(d => d.value)} subContext={`${weekTrend.reduce((a,d)=>a+d.value,0)} in 12w`} />
            <KpiCard icon={TrendingUp} label="Monthly Change" value={`${monthChangePct >= 0 ? '+' : ''}${monthChangePct}%`} unit="vs last month" color={trendColor} trend={monthChangePct} subContext={monthChangePct > 0 ? 'Growing' : monthChangePct < 0 ? 'Declining' : 'Flat'} />
            <KpiCard icon={Users}      label="Avg / Member"   value={avgPerMem}  unit="visits this month" color={C.blue}  footerBar={totalMembers > 0 ? Math.min(100, (parseFloat(avgPerMem) / 20) * 100) : 0} subContext={`${superActive} members at 15+`} />
            <KpiCard icon={Zap}        label="Return Rate"    value={`${returnRate}%`} unit="repeat check-ins" color={C.blue} footerBar={returnRate} subContext={returnRate >= 70 ? 'Strong loyalty' : 'Needs work'} />
          </div>
        )}

        <SmartInsightsPanel checkIns={checkIns} ci30={ci30} allMemberships={allMemberships} atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct} totalMembers={totalMembers} now={now} />
        <RetentionFunnelWidget retentionFunnel={retentionFunnelProp} />
        <DropOffAnalysis dropOffBuckets={dropOffBucketsProp} />

        {/* Weekly Trend */}
        {weekTrend.some(d => d.value > 0) ? (
          <Card style={{ padding: 20 }}>
            <CardHead title="Weekly Check-in Trend" sub="12-week rolling view"
              right={<span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.blueDim, border: `1px solid ${C.blueBrd}`, borderRadius: 7, padding: '2px 9px' }}>{weekTrend.reduce((s,d)=>s+d.value,0)} total</span>}
            />
            <ResponsiveContainer width="100%" height={188}>
              <AreaChart data={weekTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <AreaGrad id="wtGrad" />
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} interval={2} />
                <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ stroke: `${C.blue}20`, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="value" stroke={C.blue} strokeWidth={1.8} fill="url(#wtGrad)" dot={false} activeDot={{ r: 3, fill: C.blue, stroke: C.t1, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Activity style={{ width: 13, height: 13, color: C.t3 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Weekly trend chart</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Populates after 7+ days of check-in data</div>
              </div>
            </div>
          </Card>
        )}

        <ClassPerformanceWidget classes={classes} checkIns={checkIns} ci30={ci30} now={now} />
        <StaffPerformanceWidget coaches={coaches} checkIns={checkIns} ci30={ci30} classes={classes} allMemberships={allMemberships} now={now} />

        {/* Member Growth */}
        <Card style={{ padding: 20 }}>
          <CardHead title="Member Growth" sub="Monthly new sign-up trend"
            right={
              <div style={{ display: 'flex', gap: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.green, background: C.greenDim, border: 'solid 1px rgba(16,185,129,0.2)', borderRadius: 7, padding: '2px 9px' }}>+{newSignUps} this month</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.blueDim, border: `solid 1px ${C.blueBrd}`, borderRadius: 7, padding: '2px 9px' }}>{retentionRate}% retention</span>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={monthGrowthData} barSize={18} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
              <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length
                ? <div style={{ background: '#060c18', border: `1px solid ${C.borderHi}`, borderRadius: 8, padding: '8px 12px' }}>
                    <p style={{ color: C.t2, fontSize: 10, margin: '0 0 3px' }}>{label}</p>
                    <p style={{ color: C.blue, fontWeight: 800, fontSize: 14, margin: 0 }}>{payload[0].value} active</p>
                  </div> : null} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="value" fill={C.blue} fillOpacity={0.82} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Heatmap */}
        <Card style={{ padding: 20 }}>
          <CardHead title="Member Traffic Heatmap" sub="Check-in density by day and time"
            right={<Flame style={{ width: 13, height: 13, color: C.t3 }} />} />
          <HeatmapChart gymId={gymId} />
        </Card>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* 30-day snapshot */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>30-Day Snapshot</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>{format(now, 'MMM d')} rolling window</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.blue, background: C.blueDim, border: `1px solid ${C.blueBrd}`, borderRadius: 7, padding: '3px 9px' }}>Live</span>
          </div>
          {snapshotItems.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < snapshotItems.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${s.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: 10, height: 10, color: s.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.t2 }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>{s.sub}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</span>
              </div>
            );
          })}
        </Card>

        <MonthComparison ci30={ci30} ciPrev30={ciPrev30} retentionRate={retentionRate} atRisk={atRisk} monthChangePct={monthChangePct} totalMembers={totalMembers} now={now} />
        <Week1ReturnTrendWidget week1ReturnTrend={week1ReturnTrendProp} />
        <ChurnSignalWidget churnSignals={churnSignalsProp} />
        <MilestoneProgressWidget checkIns={checkIns} />
        <CoachImpactWidget coaches={coaches} checkIns={checkIns} ci30={ci30} allMemberships={allMemberships} now={now} />
        <RankedBarList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
        <RankedBarList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)}                            emptyLabel="No check-in data yet" />

        <SegmentBreakdown title="Engagement Breakdown" total={totalMembers} segments={[
          { label: 'Super Active', sub: '15+ visits', val: superActive, color: C.green          },
          { label: 'Active',       sub: '8–14',       val: active,      color: C.blue           },
          { label: 'Casual',       sub: '1–7',        val: casual,      color: `${C.blue}88`   },
          { label: 'Inactive',     sub: '0 visits',   val: inactive,    color: C.red            },
        ]} />
      </div>
    </div>
  );
}