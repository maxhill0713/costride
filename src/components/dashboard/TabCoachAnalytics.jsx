import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Activity, TrendingUp, TrendingDown, Users, AlertCircle, Flame,
  Clock, Calendar, BarChart2, Star, Award, Zap, CheckCircle,
  RefreshCw, DollarSign, Target, GitBranch, UserCheck,
  AlertTriangle, BarChart, Layers, Percent,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart as RBarChart, Bar, Cell,
  LineChart, Line, ComposedChart,
} from 'recharts';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#060d18',
  surface: '#0c1422',
  card:    '#0f1928',
  border:  'rgba(255,255,255,0.07)',
  b2:      'rgba(255,255,255,0.04)',
  t1: '#f0f4f8',
  t2: '#94a3b8',
  t3: '#64748b',
  t4: '#3a5070',
  red:    '#ef4444',
  amber:  '#f59e0b',
  green:  '#10b981',
  blue:   '#38bdf8',
  purple: '#a78bfa',
  pink:   '#f472b6',
  teal:   '#2dd4bf',
  orange: '#f97316',
};

const card = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  position: 'relative',
  overflow: 'hidden',
};

const tick = { fill: C.t3, fontSize: 10, fontFamily: 'DM Sans, system-ui' };

const fmt$ = v => v >= 1000 ? `£${(v / 1000).toFixed(1)}k` : `£${Math.round(v)}`;

// ─── Shared primitives ────────────────────────────────────────────────────────
function ChartTip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(6,12,24,0.97)', border: `1px solid ${C.purple}33`, borderRadius: 10, padding: '9px 13px' }}>
      <p style={{ color: C.t3, marginBottom: 3, fontSize: 10, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || C.purple, fontWeight: 800, fontSize: 13, margin: '2px 0' }}>
          {p.name}: {prefix}{p.value}{suffix}
        </p>
      ))}
    </div>
  );
}

function SectionLabel({ children, accent = C.purple, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      {Icon ? (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 13, height: 13, color: accent }} />
        </div>
      ) : (
        <div style={{ width: 3, height: 14, borderRadius: 99, background: accent, flexShrink: 0 }} />
      )}
      <span style={{ fontSize: 14, fontWeight: 800, color: C.t1, letterSpacing: '-0.01em' }}>{children}</span>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, trend, bar }) {
  return (
    <div style={{ ...card, padding: '16px 18px' }}>
      <div style={{ position: 'absolute', bottom: -18, right: -18, width: 72, height: 72, borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(24px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: `linear-gradient(90deg,transparent,${color}55,transparent)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 13, height: 13, color }} />
        </div>
        {trend != null && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 5, background: trend > 0 ? 'rgba(16,185,129,0.1)' : trend < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)', color: trend > 0 ? C.green : trend < 0 ? C.red : C.t3 }}>
            {trend > 0 ? `↑${trend}%` : trend < 0 ? `↓${Math.abs(trend)}%` : '→'}
          </span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: C.t1, lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 10, color: C.t3, fontWeight: 500 }}>{sub}</div>
      {bar != null && (
        <div style={{ marginTop: 10, height: 3, borderRadius: 99, background: `${color}14`, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, bar)}%`, background: `linear-gradient(90deg,${color},${color}bb)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
      )}
    </div>
  );
}

function MiniBar({ pct, color }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: C.b2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
    </div>
  );
}

function StatRow({ label, value, color, pct, sub }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: C.t2 }}>{label}{sub && <span style={{ color: C.t3, fontWeight: 400 }}> · {sub}</span>}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{value}</span>
      </div>
      {pct != null && <MiniBar pct={pct} color={color} />}
    </div>
  );
}

// ─── Dumbbell icon ────────────────────────────────────────────────────────────
function DumbbellIcon({ style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M6 5h2M16 5h2M4 7h2M18 7h2M7 5v14M17 5v14M5 7v10M19 7v10M7 9h10M7 15h10" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — REVENUE DASHBOARD
// payments: { id, user_id, amount, type:'membership'|'pt'|'class', date, refund? }[]
// ═══════════════════════════════════════════════════════════════════════════════
function RevenueDashboard({ payments = [], now }) {
  const data = useMemo(() => {
    const thisMonth = payments.filter(p => !p.refund && (now - new Date(p.date)) < 30 * 86400000);
    const lastMonth = payments.filter(p => !p.refund && (now - new Date(p.date)) >= 30 * 86400000 && (now - new Date(p.date)) < 60 * 86400000);
    const mrr = thisMonth.reduce((s, p) => s + p.amount, 0);
    const prevMrr = lastMonth.reduce((s, p) => s + p.amount, 0);
    const mrrChange = prevMrr ? Math.round(((mrr - prevMrr) / prevMrr) * 100) : 0;
    const refunds = payments.filter(p => p.refund && (now - new Date(p.date)) < 30 * 86400000).reduce((s, p) => s + p.amount, 0);
    const byType = [
      { name: 'Memberships', key: 'membership', color: C.blue },
      { name: 'Personal Training', key: 'pt', color: C.purple },
      { name: 'Classes', key: 'class', color: C.teal },
    ].map(t => ({ ...t, value: thisMonth.filter(p => p.type === t.key).reduce((s, p) => s + p.amount, 0) }));
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const wEnd = new Date(now - i * 7 * 86400000);
      const wStart = new Date(+wEnd - 7 * 86400000);
      const rev = payments.filter(p => !p.refund && new Date(p.date) >= wStart && new Date(p.date) < wEnd).reduce((s, p) => s + p.amount, 0);
      return { label: `W${8 - i}`, rev };
    }).reverse();
    return { mrr, mrrChange, refunds, byType, weeks };
  }, [payments, now]);

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${C.green},${C.teal})`, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.green}18`, border: `1px solid ${C.green}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign style={{ width: 13, height: 13, color: C.green }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Revenue Dashboard</div>
          <div style={{ fontSize: 10, color: C.t3 }}>Current billing period</div>
        </div>
      </div>

      {/* MRR hero */}
      <div style={{ padding: '14px 16px', borderRadius: 12, background: `${C.green}0d`, border: `1px solid ${C.green}22`, marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: C.green, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Monthly Recurring Revenue</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: C.green, letterSpacing: '-0.04em' }}>{fmt$(data.mrr)}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: data.mrrChange >= 0 ? C.green : C.red }}>
            {data.mrrChange >= 0 ? '▲' : '▼'} {Math.abs(data.mrrChange)}% vs last month
          </span>
        </div>
      </div>

      {/* Service mix */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {data.byType.map(t => {
          const pct = data.mrr > 0 ? Math.round((t.value / data.mrr) * 100) : 0;
          return (
            <div key={t.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: C.t2 }}>{t.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.color }}>{pct}% · {fmt$(t.value)}</span>
              </div>
              <MiniBar pct={pct} color={t.color} />
            </div>
          );
        })}
      </div>

      {/* 8-week trend */}
      <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>8-week revenue trend</div>
      <ResponsiveContainer width="100%" height={65}>
        <AreaChart data={data.weeks}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.green} stopOpacity={0.3} />
              <stop offset="100%" stopColor={C.green} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTip prefix="£" />} />
          <Area type="monotone" dataKey="rev" name="Revenue" stroke={C.green} strokeWidth={2} fill="url(#revGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      {data.refunds > 0 && (
        <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 8, background: `${C.red}0a`, border: `1px solid ${C.red}18`, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: C.red }}>Refunds this month</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.red }}>–{fmt$(data.refunds)}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — REVENUE FORECAST
// ═══════════════════════════════════════════════════════════════════════════════
function RevenueForecast({ payments = [], now }) {
  const data = useMemo(() => {
    const months = Array.from({ length: 3 }, (_, i) => {
      const mEnd = new Date(now); mEnd.setMonth(mEnd.getMonth() - i);
      const mStart = new Date(mEnd); mStart.setMonth(mStart.getMonth() - 1);
      return payments.filter(p => !p.refund && new Date(p.date) >= mStart && new Date(p.date) < mEnd).reduce((s, p) => s + p.amount, 0);
    });
    const avgMonthly = months.reduce((s, m) => s + m, 0) / 3;
    const trend = months[2] > 0 ? (months[0] / months[2] - 1) : 0;
    const chart = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(now); d.setMonth(d.getMonth() + i);
      const label = d.toLocaleString('default', { month: 'short' });
      if (i <= 0) {
        const mEnd = new Date(now); mEnd.setMonth(mEnd.getMonth() + i + 1);
        const mStart = new Date(mEnd); mStart.setMonth(mStart.getMonth() - 1);
        const actual = payments.filter(p => !p.refund && new Date(p.date) >= mStart && new Date(p.date) < mEnd).reduce((s, p) => s + p.amount, 0);
        chart.push({ label, actual: Math.round(actual), forecast: null });
      } else {
        chart.push({ label, actual: null, forecast: Math.round(avgMonthly * (1 + trend * i * 0.4)) });
      }
    }
    const f30 = chart[4]?.forecast || 0;
    const f90 = [chart[4], chart[5], chart[6]].reduce((s, c) => s + (c?.forecast || 0), 0);
    return { chart, f30, f90 };
  }, [payments, now]);

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.purple}18`, border: `1px solid ${C.purple}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TrendingUp style={{ width: 13, height: 13, color: C.purple }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Revenue Forecast</div>
          <div style={{ fontSize: 10, color: C.t3 }}>Projected from renewal & trend data</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[{ label: 'Next 30 days', value: fmt$(data.f30), color: C.purple }, { label: 'Next 90 days', value: fmt$(data.f90), color: C.blue }].map(s => (
          <div key={s.label} style={{ padding: '10px 12px', borderRadius: 10, background: C.card, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <ComposedChart data={data.chart}>
          <defs>
            <linearGradient id="actGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.blue} stopOpacity={0.25} />
              <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.purple} stopOpacity={0.2} />
              <stop offset="100%" stopColor={C.purple} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={28} tickFormatter={v => `£${v > 999 ? (v / 1000).toFixed(0) + 'k' : v}`} />
          <Tooltip content={<ChartTip prefix="£" />} />
          <Area type="monotone" dataKey="actual" name="Actual" stroke={C.blue} strokeWidth={2} fill="url(#actGrad2)" dot={false} connectNulls={false} />
          <Area type="monotone" dataKey="forecast" name="Forecast" stroke={C.purple} strokeWidth={2} strokeDasharray="4 2" fill="url(#fGrad2)" dot={false} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
        {[['Actual', C.blue, ''], ['Forecast', C.purple, '4 2']].map(([l, c, d]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width={16} height={4}><line x1="0" y1="2" x2="16" y2="2" stroke={c} strokeWidth={2} strokeDasharray={d} /></svg>
            <span style={{ fontSize: 9, color: C.t3 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — MEMBERSHIP GROWTH
// membershipEvents: { user_id, type:'join'|'churn', date }[]
// ═══════════════════════════════════════════════════════════════════════════════
function MembershipGrowth({ membershipEvents = [], totalMembers = 0, now }) {
  const data = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const mEnd = new Date(now); mEnd.setMonth(mEnd.getMonth() - i);
      const mStart = new Date(mEnd); mStart.setMonth(mStart.getMonth() - 1);
      const joined = membershipEvents.filter(e => e.type === 'join' && new Date(e.date) >= mStart && new Date(e.date) < mEnd).length;
      const churned = membershipEvents.filter(e => e.type === 'churn' && new Date(e.date) >= mStart && new Date(e.date) < mEnd).length;
      return { label: mStart.toLocaleString('default', { month: 'short' }), joined, churned, net: joined - churned };
    }).reverse();
    return { months, thisMonth: months[months.length - 1] || {} };
  }, [membershipEvents, now]);

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}18`, border: `1px solid ${C.blue}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users style={{ width: 13, height: 13, color: C.blue }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Membership Growth</div>
          <div style={{ fontSize: 10, color: C.t3 }}>New vs churned vs net</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Total', value: totalMembers, color: C.t1 },
          { label: `Joined`, value: `+${data.thisMonth.joined || 0}`, color: C.green },
          { label: `Churned`, value: `-${data.thisMonth.churned || 0}`, color: C.red },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px', borderRadius: 9, background: C.card, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>6-month new vs churned</div>
      <ResponsiveContainer width="100%" height={80}>
        <RBarChart data={data.months} barGap={2}>
          <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="joined" name="Joined" fill={C.green} radius={[3, 3, 0, 0]} maxBarSize={12} />
          <Bar dataKey="churned" name="Churned" fill={C.red} radius={[3, 3, 0, 0]} maxBarSize={12} />
        </RBarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, marginTop: 10 }}>Net growth</div>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data.months}>
          <defs>
            <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.blue} stopOpacity={0.25} />
              <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<ChartTip />} />
          <Area type="monotone" dataKey="net" name="Net" stroke={C.blue} strokeWidth={1.5} fill="url(#netGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — RETENTION COHORTS
// ═══════════════════════════════════════════════════════════════════════════════
function RetentionCohorts({ membershipEvents = [], now }) {
  const cohorts = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const mEnd = new Date(now); mEnd.setMonth(mEnd.getMonth() - i);
      const mStart = new Date(mEnd); mStart.setMonth(mStart.getMonth() - 1);
      const joined = membershipEvents.filter(e => e.type === 'join' && new Date(e.date) >= mStart && new Date(e.date) < mEnd);
      const retention = Array.from({ length: 5 - i }, (_, j) => {
        if (j === 0) return 100;
        const cutoff = new Date(mEnd); cutoff.setMonth(cutoff.getMonth() + j);
        if (cutoff > now) return null;
        const active = joined.filter(e => !membershipEvents.find(ce => ce.user_id === e.user_id && ce.type === 'churn' && new Date(ce.date) < cutoff)).length;
        return joined.length > 0 ? Math.round((active / joined.length) * 100) : 0;
      });
      return { label: mStart.toLocaleString('default', { month: 'short', year: '2-digit' }), size: joined.length, retention };
    }).reverse();
  }, [membershipEvents, now]);

  const getColor = pct => {
    if (pct === null) return 'transparent';
    if (pct >= 80) return C.green;
    if (pct >= 60) return C.teal;
    if (pct >= 40) return C.amber;
    return C.red;
  };

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.teal}18`, border: `1px solid ${C.teal}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers style={{ width: 13, height: 13, color: C.teal }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Retention Cohorts</div>
          <div style={{ fontSize: 10, color: C.t3 }}>% of each cohort still active by month</div>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ fontSize: 9, color: C.t3, textAlign: 'left', paddingBottom: 8, fontWeight: 600 }}>Cohort</th>
              <th style={{ fontSize: 9, color: C.t3, textAlign: 'center', paddingBottom: 8, fontWeight: 600 }}>Size</th>
              {['M0', 'M1', 'M2', 'M3', 'M4'].map(m => (
                <th key={m} style={{ fontSize: 9, color: C.t3, textAlign: 'center', paddingBottom: 8, fontWeight: 600 }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map(c => (
              <tr key={c.label}>
                <td style={{ fontSize: 10, color: C.t2, paddingBottom: 6, paddingRight: 10 }}>{c.label}</td>
                <td style={{ fontSize: 10, color: C.t3, textAlign: 'center', paddingBottom: 6 }}>{c.size}</td>
                {Array.from({ length: 5 }, (_, j) => {
                  const pct = c.retention[j] ?? null;
                  return (
                    <td key={j} style={{ textAlign: 'center', paddingBottom: 6 }}>
                      {pct !== null ? (
                        <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: getColor(pct), background: `${getColor(pct)}18`, borderRadius: 4, padding: '1px 5px', minWidth: 32 }}>{pct}%</span>
                      ) : (
                        <span style={{ fontSize: 9, color: C.t4 }}>–</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
        {[['≥80%', C.green], ['60–79%', C.teal], ['40–59%', C.amber], ['<40%', C.red]].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 9, color: C.t3 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — CHECK-IN TRENDS (replaces weekly/monthly split — unified)
// ═══════════════════════════════════════════════════════════════════════════════
function CheckInTrends({ checkIns = [], ci7Count = 0, ci7pCount = 0, ci30Count = 0, weeklyTrend = 0, monthlyTrend = 0, weeklyChart = [], monthlyChart = [], now }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Weekly */}
      <div style={{ ...card, padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Weekly Check-ins</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>8-week rolling view</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: weeklyTrend > 0 ? `${C.green}18` : weeklyTrend < 0 ? `${C.red}18` : `${C.t3}18`, color: weeklyTrend > 0 ? C.green : weeklyTrend < 0 ? C.red : C.t3 }}>
            {weeklyTrend > 0 ? `↑${weeklyTrend}%` : weeklyTrend < 0 ? `↓${Math.abs(weeklyTrend)}%` : '→'} vs prior wk
          </span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={weeklyChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.b2} vertical={false} />
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
            <Tooltip content={<ChartTip />} cursor={{ stroke: `${C.blue}33`, strokeWidth: 1 }} />
            <Area type="monotone" dataKey="value" stroke={C.blue} strokeWidth={2.5} fill="url(#weekGrad)" dot={false} activeDot={{ r: 5, fill: C.blue, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 18, paddingTop: 10, borderTop: `1px solid ${C.b2}`, marginTop: 8 }}>
          {[
            { label: 'This week', value: ci7Count, color: C.blue },
            { label: 'Last week', value: ci7pCount, color: C.t3 },
            { label: 'Avg/week', value: weeklyChart.length ? Math.round(weeklyChart.reduce((s, d) => s + d.value, 0) / weeklyChart.length) : 0, color: C.purple },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 17, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Monthly */}
      <div style={{ ...card, padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Monthly Check-ins</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Last 6 months</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: monthlyTrend > 0 ? `${C.green}18` : monthlyTrend < 0 ? `${C.red}18` : `${C.t3}18`, color: monthlyTrend > 0 ? C.green : monthlyTrend < 0 ? C.red : C.t3 }}>
            {monthlyTrend > 0 ? `↑${monthlyTrend}%` : monthlyTrend < 0 ? `↓${Math.abs(monthlyTrend)}%` : '→'} vs prior mo
          </span>
        </div>
        <ResponsiveContainer width="100%" height={130}>
          <RBarChart data={monthlyChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.b2} vertical={false} />
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
            <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" radius={[5, 5, 2, 2]}>
              {monthlyChart.map((_, i) => (
                <Cell key={i} fill={i === monthlyChart.length - 1 ? C.purple : 'rgba(167,139,250,0.35)'} />
              ))}
            </Bar>
          </RBarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 18, paddingTop: 10, borderTop: `1px solid ${C.b2}`, marginTop: 8 }}>
          {[
            { label: 'This month', value: ci30Count, color: C.purple },
            { label: 'Last month', value: monthlyChart[monthlyChart.length - 2]?.value ?? 0, color: C.t3 },
            { label: 'Avg/day', value: Math.round(ci30Count / 30), color: C.blue },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 17, fontWeight: 900, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — TRAFFIC HEATMAP
// ═══════════════════════════════════════════════════════════════════════════════
function HeatmapChart({ gymId }) {
  const [weeks, setWeeks] = useState(4);
  const { data: hmCIs = [] } = useQuery({
    queryKey: ['heatmapCIs', gymId, weeks],
    queryFn: () => base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
  });
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = [
    { label: '6–8a', hours: [6, 7] },
    { label: '8–10a', hours: [8, 9] },
    { label: '10–12', hours: [10, 11] },
    { label: '12–2p', hours: [12, 13] },
    { label: '4–6p', hours: [16, 17] },
    { label: '6–8p', hours: [18, 19] },
  ];
  const grid = useMemo(() => {
    const mat = Array.from({ length: 7 }, () => Array(slots.length).fill(0));
    hmCIs.forEach(c => {
      const d = new Date(c.check_in_date);
      const dow = (d.getDay() + 6) % 7;
      const si = slots.findIndex(s => s.hours.includes(d.getHours()));
      if (si >= 0) mat[dow][si]++;
    });
    return mat;
  }, [hmCIs]);
  const maxVal = Math.max(...grid.flat(), 1);
  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Client Traffic Heatmap</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Check-in density by day & time slot</div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[{ label: '4W', val: 4 }, { label: '12W', val: 12 }, { label: 'All', val: 0 }].map(o => (
            <button key={o.val} onClick={() => setWeeks(o.val)} style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99, cursor: 'pointer', background: weeks === o.val ? `${C.purple}22` : C.b2, color: weeks === o.val ? C.purple : C.t3, border: `1px solid ${weeks === o.val ? `${C.purple}44` : C.border}`, transition: 'all 0.15s' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length},1fr)`, gap: 3, marginBottom: 5 }}>
        <div />
        {slots.map(s => <div key={s.label} style={{ fontSize: 9, fontWeight: 700, color: C.t3, textAlign: 'center' }}>{s.label}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length},1fr)`, gap: 3, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.t2 }}>{day}</div>
            {grid[di].map((val, si) => {
              const p = val / maxVal;
              const bg = val === 0 ? C.b2 : p < 0.25 ? `${C.purple}22` : p < 0.5 ? `${C.purple}44` : p < 0.75 ? `${C.purple}70` : `${C.purple}cc`;
              return (
                <div key={si} title={val > 0 ? `${day} ${slots[si].label}: ${val}` : undefined}
                  style={{ height: 30, borderRadius: 6, background: bg, border: `1px solid ${C.b2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.85)' }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: C.t4 }}>Low</span>
        {[0.07, 0.22, 0.44, 0.7, 0.88].map((o, i) => (
          <div key={i} style={{ width: 14, height: 8, borderRadius: 2, background: `rgba(167,139,250,${o})` }} />
        ))}
        <span style={{ fontSize: 9, color: C.t4 }}>High</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — CLASS PERFORMANCE + NO-SHOW RATE
// ═══════════════════════════════════════════════════════════════════════════════
function ClassPerformance({ classPerf = [], bookings = [], classes = [] }) {
  const noShowData = useMemo(() => {
    const total = bookings.length;
    const noShows = bookings.filter(b => b.no_show).length;
    const rate = total > 0 ? Math.round((noShows / total) * 100) : 0;
    return { rate, noShows, total };
  }, [bookings]);

  const fillColor = f => f >= 80 ? C.green : f >= 60 ? C.amber : f >= 40 ? C.orange : C.red;
  const fillLabel = f => f >= 80 ? 'Excellent' : f >= 60 ? 'Good' : f >= 40 ? 'Fair' : 'Low';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* No-show callout */}
      <div style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.amber}18`, border: `1px solid ${C.amber}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle style={{ width: 13, height: 13, color: C.amber }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.t1 }}>No-show Rate</div>
            <div style={{ fontSize: 10, color: C.t3 }}>{noShowData.noShows} no-shows from {noShowData.total} bookings</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: noShowData.rate > 20 ? C.red : noShowData.rate > 10 ? C.amber : C.green, letterSpacing: '-0.04em' }}>{noShowData.rate}%</div>
          <div style={{ fontSize: 9, color: C.t3 }}>{noShowData.rate <= 10 ? '✅ Healthy' : noShowData.rate <= 20 ? '⚠️ Monitor' : '🚨 Action needed'}</div>
        </div>
      </div>

      {classPerf.length === 0 ? (
        <div style={{ ...card, padding: '28px', textAlign: 'center' }}>
          <DumbbellIcon style={{ width: 24, height: 24, color: C.t4, margin: '0 auto 10px' }} />
          <p style={{ fontSize: 12, color: C.t4, fontWeight: 600, margin: 0 }}>No classes to analyse yet</p>
        </div>
      ) : (
        <>
          {classPerf.map((cls, i) => {
            const fc = fillColor(cls.fill);
            return (
              <div key={i} style={{ ...card, padding: '14px 18px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${fc},${fc}66)`, borderRadius: '16px 16px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${fc}14`, border: `1px solid ${fc}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DumbbellIcon style={{ width: 13, height: 13, color: fc }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: C.t1 }}>{cls.name}</div>
                      {cls.schedule && <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>🕐 {cls.schedule}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: fc, letterSpacing: '-0.04em' }}>{cls.fill}%</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: fc, background: `${fc}12`, border: `1px solid ${fc}25`, borderRadius: 5, padding: '1px 7px', marginTop: 3 }}>{fillLabel(cls.fill)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 99, background: C.b2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cls.fill}%`, background: `linear-gradient(90deg,${fc},${fc}88)`, borderRadius: 99, transition: 'width 0.8s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>{cls.attended}/{cls.capacity}</span>
                </div>
                {i === 0 && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: C.amber, background: `${C.amber}12`, border: `1px solid ${C.amber}25`, borderRadius: 6, padding: '2px 9px' }}>
                    <Star style={{ width: 9, height: 9 }} /> Most Popular
                  </div>
                )}
              </div>
            );
          })}
          {classPerf.length > 1 && (
            <div style={{ ...card, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.t1, marginBottom: 12 }}>Fill Rate Comparison</div>
              <ResponsiveContainer width="100%" height={100}>
                <RBarChart data={classPerf} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.b2} vertical={false} />
                  <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                  <YAxis tick={tick} axisLine={false} tickLine={false} width={24} domain={[0, 100]} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'Fill rate']} contentStyle={{ background: 'rgba(6,12,24,0.97)', border: `1px solid ${C.purple}33`, borderRadius: 10, fontSize: 12 }} labelStyle={{ color: C.t3 }} />
                  <Bar dataKey="fill" radius={[5, 5, 2, 2]}>
                    {classPerf.map((cls, i) => <Cell key={i} fill={fillColor(cls.fill)} />)}
                  </Bar>
                </RBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — MEMBER ENGAGEMENT (segments + ring)
// ═══════════════════════════════════════════════════════════════════════════════
function MemberEngagement({ totalMembers, superActive, active, casual, inactive, engRate, ci30Count }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {/* Breakdown */}
      <div style={{ ...card, padding: '18px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.t1, marginBottom: 4 }}>Engagement Breakdown</div>
        <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>{engRate}% engaged this month</div>
        <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 1, marginBottom: 16 }}>
          {totalMembers > 0 && [
            { val: superActive, color: C.green },
            { val: active, color: C.blue },
            { val: casual, color: C.purple },
            { val: inactive, color: '#334155' },
          ].filter(t => t.val > 0).map((t, i, arr) => (
            <div key={i} style={{ flex: t.val, background: t.color, opacity: 0.85, borderRadius: i === 0 ? '99px 0 0 99px' : i === arr.length - 1 ? '0 99px 99px 0' : 0 }} />
          ))}
        </div>
        {[
          { label: 'Super Active', sub: '12+ visits/mo', val: superActive, color: C.green },
          { label: 'Active', sub: '4–11/mo', val: active, color: C.blue },
          { label: 'Casual', sub: '1–3/mo', val: casual, color: C.purple },
          { label: 'Inactive', sub: '0 visits', val: inactive, color: '#475569' },
        ].map((t, i) => {
          const pct = totalMembers > 0 ? Math.round((t.val / totalMembers) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#d4e4f4' }}>{t.label} <span style={{ fontSize: 9, color: C.t3, fontWeight: 400 }}>{t.sub}</span></span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: t.color }}>{t.val}</span>
                </div>
                <MiniBar pct={pct} color={t.color} />
              </div>
              <span style={{ fontSize: 9, color: C.t3, width: 24, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
            </div>
          );
        })}
      </div>
      {/* Ring */}
      <div style={{ ...card, padding: '18px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.t1, marginBottom: 14 }}>Active vs Inactive</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
              <circle cx={50} cy={50} r={40} fill="none" stroke={C.green} strokeWidth={10}
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - (superActive + active) / Math.max(totalMembers, 1))}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.t1, lineHeight: 1 }}>{engRate}%</div>
              <div style={{ fontSize: 8, color: C.t4, fontWeight: 600 }}>engaged</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {[
              { label: 'Active', value: superActive + active, color: C.green, pct: totalMembers > 0 ? Math.round(((superActive + active) / totalMembers) * 100) : 0 },
              { label: 'Casual', value: casual, color: C.purple, pct: totalMembers > 0 ? Math.round((casual / totalMembers) * 100) : 0 },
              { label: 'Inactive', value: inactive, color: '#475569', pct: totalMembers > 0 ? Math.round((inactive / totalMembers) * 100) : 0 },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 2 ? `1px solid ${C.b2}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 11, color: C.t2, fontWeight: 500 }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</span>
                  <span style={{ fontSize: 10, color: '#475569' }}>{s.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '10px 12px', borderRadius: 10, background: C.b2, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.t2 }}>Avg visits / member (30d)</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.purple }}>{totalMembers > 0 ? (ci30Count / totalMembers).toFixed(1) : '—'}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — CHURN RISK FORECAST
// memberships: { user_id, user_name }[]
// checkIns: { user_id, check_in_date }[]
// ═══════════════════════════════════════════════════════════════════════════════
function ChurnRiskScorer({ memberships = [], checkIns = [], now }) {
  const risks = useMemo(() => {
    return memberships.map(m => {
      let score = 0;
      const sorted = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
      const last = sorted[0];
      const daysAgo = last ? Math.floor((now - new Date(last.check_in_date)) / 86400000) : 999;
      const recent30 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 86400000).length;
      const recent90 = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 90 * 86400000).length;
      if (daysAgo > 21) score += 40; else if (daysAgo > 14) score += 25; else if (daysAgo > 7) score += 10;
      if (recent30 < 2) score += 20;
      if (recent90 < 8) score += 15;
      if (recent30 < recent90 / 3) score += 20;
      return {
        user_id: m.user_id, user_name: m.user_name,
        score: Math.min(100, score), daysAgo, recent30,
        reason: daysAgo > 14 ? 'Inactivity' : recent30 < 2 ? 'Low engagement' : 'Declining visits',
      };
    }).filter(r => r.score >= 40).sort((a, b) => b.score - a.score);
  }, [memberships, checkIns, now]);

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.red}18`, border: `1px solid ${C.red}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle style={{ width: 13, height: 13, color: C.red }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Churn Risk Forecast</div>
          <div style={{ fontSize: 10, color: C.t3 }}>{risks.length} members at risk of leaving</div>
        </div>
      </div>
      {risks.length === 0 ? (
        <div style={{ padding: '12px', borderRadius: 9, background: `${C.green}0d`, border: `1px solid ${C.green}20`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.green }} />
          <span style={{ fontSize: 11, color: C.green }}>All member engagement is healthy</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {risks.slice(0, 6).map(r => (
            <div key={r.user_id} style={{ padding: '9px 11px', borderRadius: 8, background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${r.score > 75 ? C.red : C.amber}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>{r.user_name}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: r.score > 75 ? C.red : C.amber, background: r.score > 75 ? `${C.red}15` : `${C.amber}15`, borderRadius: 5, padding: '1px 7px' }}>{r.score}%</span>
              </div>
              <div style={{ fontSize: 9, color: C.t3 }}>
                {r.reason} · {r.daysAgo === 999 ? 'never visited' : `${r.daysAgo}d since last visit`} · {r.recent30} visits/mo
              </div>
            </div>
          ))}
          {risks.length > 6 && <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>+{risks.length - 6} more at risk</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — TOP CLIENTS LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function TopClientsLeaderboard({ memberships = [], checkIns = [], now }) {
  const leaders = useMemo(() => {
    return memberships.map(m => {
      const month = checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 86400000).length;
      const sorted = checkIns.filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
      let streak = 0, prev = new Date(now);
      for (const ci of sorted) {
        const diff = Math.floor((prev - new Date(ci.check_in_date)) / 86400000);
        if (diff <= 2) { streak++; prev = new Date(ci.check_in_date); } else break;
      }
      return { ...m, month, streak };
    }).sort((a, b) => b.month - a.month).slice(0, 8);
  }, [memberships, checkIns, now]);

  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.amber}18`, border: `1px solid ${C.amber}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Award style={{ width: 13, height: 13, color: C.amber }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Top Clients</div>
          <div style={{ fontSize: 10, color: C.t3 }}>Most check-ins this month</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {leaders.map((m, i) => (
          <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: i === 0 ? `${C.amber}0a` : C.card, border: `1px solid ${i === 0 ? `${C.amber}22` : C.border}` }}>
            <span style={{ fontSize: 12, width: 20, textAlign: 'center' }}>{medals[i] || i + 1}</span>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: C.t1 }}>{m.user_name}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: i < 3 ? C.amber : C.t2, letterSpacing: '-0.02em' }}>{m.month}</div>
              <div style={{ fontSize: 8, color: C.t3 }}>🔥 {m.streak}d streak</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11 — CLIENT LIFETIME VALUE
// ═══════════════════════════════════════════════════════════════════════════════
function ClientLifetimeValue({ memberships = [], payments = [], now }) {
  const data = useMemo(() => {
    const clvs = memberships.map(m => {
      const first = [...payments.filter(p => p.user_id === m.user_id)].sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      const total = payments.filter(p => p.user_id === m.user_id && !p.refund).reduce((s, p) => s + p.amount, 0);
      const tenure = first ? Math.max(1, Math.ceil((now - new Date(first.date)) / (30 * 86400000))) : 1;
      return { total, tenure, monthly: total / tenure };
    }).filter(c => c.total > 0);
    const avg = n => clvs.length > 0 ? clvs.reduce((s, c) => s + c[n], 0) / clvs.length : 0;
    const buckets = [
      { label: '<£100', min: 0, max: 100, color: C.t3 },
      { label: '£100–300', min: 100, max: 300, color: C.blue },
      { label: '£300–600', min: 300, max: 600, color: C.purple },
      { label: '£600–1k', min: 600, max: 1000, color: C.amber },
      { label: '>£1k', min: 1000, max: Infinity, color: C.green },
    ].map(b => ({ ...b, count: clvs.filter(c => c.total >= b.min && c.total < b.max).length }));
    return { avgClv: avg('total'), avgTenure: avg('tenure'), avgMonthly: avg('monthly'), buckets, total: clvs.length };
  }, [memberships, payments, now]);

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.amber}18`, border: `1px solid ${C.amber}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign style={{ width: 13, height: 13, color: C.amber }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Client Lifetime Value</div>
          <div style={{ fontSize: 10, color: C.t3 }}>Average revenue per client over their tenure</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Avg CLV', value: fmt$(data.avgClv), color: C.amber },
          { label: 'Avg Tenure', value: `${Math.round(data.avgTenure)}mo`, color: C.blue },
          { label: 'Avg MRR/Client', value: fmt$(data.avgMonthly), color: C.purple },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px', borderRadius: 9, background: C.card, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>CLV distribution ({data.total} clients)</div>
      {data.buckets.map(b => {
        const pct = data.total > 0 ? Math.round((b.count / data.total) * 100) : 0;
        return (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: C.t3, width: 58, flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 99, background: C.b2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: b.color, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 9, color: b.color, width: 20, textAlign: 'right' }}>{b.count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12 — LEAD FUNNEL
// leads: { id, status:'prospect'|'trial'|'paid', referral_source }[]
// ═══════════════════════════════════════════════════════════════════════════════
function LeadFunnel({ leads = [] }) {
  const stages = useMemo(() => {
    const prospects = leads.length;
    const trials = leads.filter(l => ['trial', 'paid'].includes(l.status)).length;
    const paid = leads.filter(l => l.status === 'paid').length;
    return [
      { label: 'Prospects', count: prospects, color: C.blue, pct: 100 },
      { label: 'Trials', count: trials, color: C.purple, pct: prospects > 0 ? Math.round((trials / prospects) * 100) : 0 },
      { label: 'Paid Members', count: paid, color: C.green, pct: prospects > 0 ? Math.round((paid / prospects) * 100) : 0 },
    ];
  }, [leads]);
  const overall = stages[0].count > 0 ? Math.round((stages[2].count / stages[0].count) * 100) : 0;
  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}18`, border: `1px solid ${C.blue}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap style={{ width: 13, height: 13, color: C.blue }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Lead Funnel</div>
          <div style={{ fontSize: 10, color: C.t3 }}>Prospects → Trials → Paid</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {stages.map((s, i) => (
          <div key={s.label} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: `${100 - i * 14}%`, padding: '9px 14px', borderRadius: 9, background: `${s.color}12`, border: `1px solid ${s.color}28`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: C.t1 }}>{s.count}</span>
                {i > 0 && <span style={{ fontSize: 9, color: C.t3, display: 'block' }}>{s.pct}% conv.</span>}
              </div>
            </div>
            {i < stages.length - 1 && <div style={{ fontSize: 14, color: C.t4, margin: '1px 0' }}>▼</div>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: `${C.green}0d`, border: `1px solid ${C.green}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: C.t2 }}>Overall conversion</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.green }}>{overall}%</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 13 — REFERRAL ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
function ReferralAnalytics({ leads = [] }) {
  const data = useMemo(() => {
    const sources = [
      { name: 'Friend referral', key: 'friend', color: C.green },
      { name: 'Social media', key: 'social', color: C.blue },
      { name: 'Google / search', key: 'google', color: C.amber },
      { name: 'Walk-in', key: 'walk-in', color: C.purple },
      { name: 'Other', key: 'other', color: C.t3 },
    ].map(s => ({
      ...s,
      count: leads.filter(l => l.referral_source === s.key).length,
      paid: leads.filter(l => l.referral_source === s.key && l.status === 'paid').length,
    })).sort((a, b) => b.count - a.count);
    const referred = leads.filter(l => l.referral_source === 'friend');
    const refConvRate = referred.length > 0 ? Math.round((referred.filter(l => l.status === 'paid').length / referred.length) * 100) : 0;
    return { sources, refRate: leads.length > 0 ? Math.round((referred.length / leads.length) * 100) : 0, refConvRate, total: leads.length };
  }, [leads]);

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.green}18`, border: `1px solid ${C.green}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitBranch style={{ width: 13, height: 13, color: C.green }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Referral Analytics</div>
          <div style={{ fontSize: 10, color: C.t3 }}>Lead source breakdown & conversion</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[{ label: 'Referral Rate', value: `${data.refRate}%`, color: C.green }, { label: 'Ref. Conv.', value: `${data.refConvRate}%`, color: C.teal }].map(s => (
          <div key={s.label} style={{ padding: '10px', borderRadius: 9, background: C.card, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {data.sources.map(s => {
          const pct = data.total > 0 ? Math.round((s.count / data.total) * 100) : 0;
          const convPct = s.count > 0 ? Math.round((s.paid / s.count) * 100) : 0;
          return (
            <div key={s.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: C.t2, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: s.color }} />
                  {s.name}
                </span>
                <span style={{ fontSize: 10, color: C.t3 }}>{s.count} <span style={{ color: s.color, fontWeight: 700 }}>({convPct}%)</span></span>
              </div>
              <MiniBar pct={pct} color={s.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 14 — PT UTILISATION
// ptSlots: { id, coach_name, datetime, booked, attended }[]
// ═══════════════════════════════════════════════════════════════════════════════
function PTUtilisation({ ptSlots = [], now }) {
  const data = useMemo(() => {
    const past = ptSlots.filter(s => new Date(s.datetime) < now);
    const booked = past.filter(s => s.booked).length;
    const attended = past.filter(s => s.attended).length;
    const utilRate = past.length > 0 ? Math.round((booked / past.length) * 100) : 0;
    const showRate = booked > 0 ? Math.round((attended / booked) * 100) : 0;
    const byCoach = [...new Set(ptSlots.map(s => s.coach_name))].map(name => {
      const slots = ptSlots.filter(s => s.coach_name === name && new Date(s.datetime) < now);
      const b = slots.filter(s => s.booked).length;
      return { name, util: slots.length > 0 ? Math.round((b / slots.length) * 100) : 0, slots: slots.length };
    }).sort((a, b) => b.util - a.util);
    const upcoming = ptSlots.filter(s => { const d = new Date(s.datetime); return d >= now && d < new Date(+now + 7 * 86400000); });
    return { utilRate, showRate, byCoach, availableNext7: upcoming.filter(s => !s.booked).length, upcoming: upcoming.length };
  }, [ptSlots, now]);

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.pink}18`, border: `1px solid ${C.pink}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UserCheck style={{ width: 13, height: 13, color: C.pink }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>PT Utilisation</div>
          <div style={{ fontSize: 10, color: C.t3 }}>Calendar fill rate vs available slots</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Utilisation', value: `${data.utilRate}%`, color: data.utilRate > 70 ? C.green : data.utilRate > 40 ? C.amber : C.red },
          { label: 'Show Rate', value: `${data.showRate}%`, color: C.pink },
          { label: 'Free Next 7d', value: data.availableNext7, color: C.t2 },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px', borderRadius: 9, background: C.card, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>By coach</div>
      {data.byCoach.map(c => (
        <div key={c.name} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: C.t2 }}>{c.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: c.util > 70 ? C.green : c.util > 40 ? C.amber : C.red }}>{c.util}% · {c.slots} slots</span>
          </div>
          <MiniBar pct={c.util} color={c.util > 70 ? C.green : c.util > 40 ? C.amber : C.red} />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 15 — GOAL COMPLETION
// goals: { user_id, user_name, type, target, current }[]
// ═══════════════════════════════════════════════════════════════════════════════
function GoalCompletion({ goals = [] }) {
  const data = useMemo(() => {
    const completed = goals.filter(g => g.current >= g.target).length;
    const rate = goals.length > 0 ? Math.round((completed / goals.length) * 100) : 0;
    const top = goals.map(g => ({ ...g, pct: Math.min(100, Math.round((g.current / g.target) * 100)) })).sort((a, b) => b.pct - a.pct).slice(0, 5);
    return { rate, completed, total: goals.length, top };
  }, [goals]);

  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.green}18`, border: `1px solid ${C.green}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target style={{ width: 13, height: 13, color: C.green }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1 }}>Goal Completion</div>
          <div style={{ fontSize: 10, color: C.t3 }}>% of clients hitting their set goals</div>
        </div>
      </div>
      <div style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 14, background: `${C.green}0d`, border: `1px solid ${C.green}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.green, letterSpacing: '-0.04em' }}>{data.rate}%</div>
          <div style={{ fontSize: 9, color: C.t3 }}>{data.completed}/{data.total} goals achieved</div>
        </div>
        <svg viewBox="0 0 52 52" width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="26" cy="26" r="22" fill="none" stroke={`${C.green}18`} strokeWidth="5" />
          <circle cx="26" cy="26" r="22" fill="none" stroke={C.green} strokeWidth="5"
            strokeDasharray={2 * Math.PI * 22}
            strokeDashoffset={2 * Math.PI * 22 * (1 - data.rate / 100)}
            strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Top progress</div>
      {data.top.map((g, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: C.t2 }}>{g.user_name} <span style={{ color: C.t3 }}>· {g.type}</span></span>
            <span style={{ fontSize: 10, fontWeight: 700, color: g.pct >= 100 ? C.green : C.blue }}>{g.pct}%</span>
          </div>
          <MiniBar pct={g.pct} color={g.pct >= 100 ? C.green : C.blue} />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function TabCoachAnalytics({
  // Core counts (pre-computed)
  ci30Count = 0, totalMembers = 0, myClasses = [],
  ci7Count = 0, ci7pCount = 0,
  weeklyTrendCoach = 0, monthlyTrendCoach = 0,
  returningCount = 0, newMembersThis30 = 0,
  weeklyChart = [], monthlyChart = [],
  engagementSegmentsCoach = {},
  peakHours = [], busiestDays = [],
  activeThisMonth = 0, atRisk = 0,
  gymId,
  // Rich data arrays (passed from parent or fetched)
  payments = [],       // { id, user_id, amount, type, date, refund? }
  membershipEvents = [], // { user_id, type:'join'|'churn', date }
  memberships = [],    // { user_id, user_name }
  checkIns = [],       // { user_id, check_in_date }
  leads = [],          // { id, status, referral_source }
  goals = [],          // { user_id, user_name, type, target, current }
  ptSlots = [],        // { id, coach_name, datetime, booked, attended }
  bookings = [],       // { class_id, user_id, attended, no_show }
  now = new Date(),
}) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const nowMs = useMemo(() => +new Date(now), [now]);

  // Derived values from engagement segments
  const superActive = engagementSegmentsCoach.superActive ?? 0;
  const active      = engagementSegmentsCoach.active      ?? 0;
  const casual      = engagementSegmentsCoach.casual      ?? 0;
  const inactive    = engagementSegmentsCoach.inactive    ?? 0;
  const engRate     = engagementSegmentsCoach.engRate     ?? 0;
  const churnRate   = totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0;
  const dayMax      = Math.max(...busiestDays.map(d => d.count), 1);

  // Class performance (fills from myClasses + estimated attendance)
  const classPerf = useMemo(() => myClasses.map(cls => {
    const capacity = cls.max_capacity || cls.capacity || 20;
    const attended = cls.estimated_attendance ?? Math.round(ci30Count / Math.max(myClasses.length * 30, 1));
    return { name: cls.name, schedule: cls.schedule, capacity, attended, fill: Math.min(100, Math.round((attended / capacity) * 100)) };
  }).sort((a, b) => b.fill - a.fill), [myClasses, ci30Count]);

  const avgFill = classPerf.length > 0 ? Math.round(classPerf.reduce((s, c) => s + c.fill, 0) / classPerf.length) : 0;
  const engagementScore = Math.round((engRate + Math.min(100, avgFill) + Math.min(100, (returningCount / Math.max(totalMembers, 1)) * 100)) / 3);

  const col2 = mobile ? '1fr' : '1fr 1fr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ══ 1. FINANCIAL OVERVIEW ═══════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.green} icon={DollarSign}>Financial Overview</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 14 }}>
          <RevenueDashboard payments={payments} now={nowMs} />
          <RevenueForecast payments={payments} now={nowMs} />
        </div>
      </section>

      {/* ══ 2. MEMBERSHIP ═══════════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.blue} icon={Users}>Membership</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 14 }}>
          <MembershipGrowth membershipEvents={membershipEvents} totalMembers={totalMembers} now={nowMs} />
          <RetentionCohorts membershipEvents={membershipEvents} now={nowMs} />
        </div>
      </section>

      {/* ══ 3. COACH STATS ══════════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.purple} icon={Award}>Coach Stats</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={DumbbellIcon} label="Classes This Week"  value={myClasses.length}   sub="assigned to you"           color={C.purple} />
          <KpiCard icon={Users}        label="Avg Attendance"      value={classPerf.length > 0 ? Math.round(classPerf.reduce((s, c) => s + c.attended, 0) / classPerf.length) : 0} sub="per class / 30d"  color={C.blue}   bar={avgFill} />
          <KpiCard icon={Activity}     label="Avg Fill Rate"       value={`${avgFill}%`}      sub="across all classes"        color={avgFill >= 70 ? C.green : avgFill >= 40 ? C.amber : C.red} bar={avgFill} />
          <KpiCard icon={Zap}          label="Engagement Score"    value={engagementScore}    sub="coach performance index"   color={C.amber}  bar={engagementScore} />
        </div>
      </section>

      {/* ══ 4. CHECK-IN TRENDS ══════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.blue} icon={TrendingUp}>Check-in Trends</SectionLabel>
        <CheckInTrends
          ci7Count={ci7Count} ci7pCount={ci7pCount} ci30Count={ci30Count}
          weeklyTrend={weeklyTrendCoach} monthlyTrend={monthlyTrendCoach}
          weeklyChart={weeklyChart} monthlyChart={monthlyChart}
          now={nowMs}
        />
      </section>

      {/* ══ 5. TRAFFIC HEATMAP ══════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.purple} icon={Flame}>Client Traffic Heatmap</SectionLabel>
        <HeatmapChart gymId={gymId} />
      </section>

      {/* ══ 6. CLASS PERFORMANCE ════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.amber} icon={BarChart2}>Class Performance</SectionLabel>
        <ClassPerformance classPerf={classPerf} bookings={bookings} classes={myClasses} />
      </section>

      {/* ══ 7. MEMBER ENGAGEMENT ════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.green} icon={Users}>Member Engagement</SectionLabel>
        <MemberEngagement
          totalMembers={totalMembers} superActive={superActive} active={active}
          casual={casual} inactive={inactive} engRate={engRate} ci30Count={ci30Count}
        />
      </section>

      {/* ══ 8. RETENTION & CHURN ════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.red} icon={RefreshCw}>Retention & Churn</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
          <KpiCard icon={AlertCircle}  label="Members at Risk"   value={atRisk}          sub="14+ days absent"                             color={atRisk > 0 ? C.red : C.green} />
          <KpiCard icon={TrendingDown} label="Est. Churn Rate"   value={`${churnRate}%`} sub={`${atRisk} of ${totalMembers}`}              color={churnRate > 15 ? C.red : churnRate > 8 ? C.orange : C.green} />
          <KpiCard icon={CheckCircle}  label="Returning Members" value={returningCount}  sub="visited again in 30d"                        color={C.green} bar={totalMembers > 0 ? (returningCount / totalMembers) * 100 : 0} />
          <KpiCard icon={Users}        label="New This Month"    value={newMembersThis30} sub="recently joined"                            color={C.blue} />
        </div>

        {/* Retention funnel + peak hours */}
        <div style={{ ...card, padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.t1, marginBottom: 16 }}>Retention Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 18 }}>
            <div>
              {[
                { label: 'Total Members',      value: totalMembers,    color: C.blue,   pct: 100 },
                { label: 'Active This Month',  value: activeThisMonth, color: C.green,  pct: totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0 },
                { label: 'Returning Members',  value: returningCount,  color: C.purple, pct: totalMembers > 0 ? Math.round((returningCount / totalMembers) * 100) : 0 },
                { label: 'New Members (30d)',   value: newMembersThis30, color: C.amber, pct: totalMembers > 0 ? Math.round((newMembersThis30 / totalMembers) * 100) : 0 },
                { label: 'At Risk',            value: atRisk,          color: C.red,    pct: totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0 },
              ].map((s, i) => <StatRow key={i} label={s.label} value={s.value} color={s.color} pct={s.pct} />)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.t1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar style={{ width: 11, height: 11, color: C.green }} /> Busiest Days
                </div>
                {busiestDays.slice(0, 5).map(({ name, count }, rank) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: rank === 0 ? C.amber : C.t3, width: 16, textAlign: 'center', flexShrink: 0 }}>#{rank + 1}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.t1, width: 28, flexShrink: 0 }}>{name}</span>
                    <div style={{ flex: 1, height: 5, borderRadius: 99, background: C.b2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(count / dayMax) * 100}%`, borderRadius: 99, background: rank === 0 ? `linear-gradient(90deg,${C.amber},${C.red})` : `linear-gradient(90deg,${C.blue},${C.teal})` }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: rank === 0 ? C.amber : C.t2, width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ChurnRiskScorer memberships={memberships} checkIns={checkIns} now={nowMs} />
      </section>

      {/* ══ 9. LEADS & REFERRALS ════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.teal} icon={GitBranch}>Leads & Referrals</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 14 }}>
          <LeadFunnel leads={leads} />
          <ReferralAnalytics leads={leads} />
        </div>
      </section>

      {/* ══ 10. CLIENT INSIGHTS ═════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.amber} icon={Star}>Client Insights</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: col2, gap: 14, marginBottom: 14 }}>
          <TopClientsLeaderboard memberships={memberships} checkIns={checkIns} now={nowMs} />
          <ClientLifetimeValue memberships={memberships} payments={payments} now={nowMs} />
        </div>
        <GoalCompletion goals={goals} />
      </section>

      {/* ══ 11. PT UTILISATION ══════════════════════════════════════════════ */}
      <section>
        <SectionLabel accent={C.pink} icon={UserCheck}>PT Utilisation</SectionLabel>
        <PTUtilisation ptSlots={ptSlots} now={nowMs} />
      </section>

    </div>
  );
}
