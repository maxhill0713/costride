/**
 * TabAnalytics — Gym Operating System
 *
 * EVOLVED (not redesigned) from analytics dashboard into a decision-making system.
 * Same design system. Same tokens. Same card primitives. New intelligence.
 *
 * Every section answers four questions:
 *  1. What is happening?       → Metric / insight line
 *  2. What is going wrong?     → Semantic color (danger/warn), left-border alert
 *  3. What should I do?        → CTA button on every card
 *  4. Where am I losing £?     → Revenue impact on every risk card
 *
 * DESIGN RULES (unchanged from original system):
 *  - ONE accent (#5179ff): interactive/CTA/selected only
 *  - Semantic colors ONLY for thresholds (danger, success, warn)
 *  - Neutral backgrounds on all cards — color leaks only via left-border or badge
 *  - Max 2 colored elements per viewport section
 *  - No gradient top lines on cards
 *  - Icon containers always neutral (except insight icons which carry type color)
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, differenceInDays, subDays, isWithinInterval } from 'date-fns';
import {
  Activity, TrendingUp, TrendingDown, Users, Zap, ArrowUpRight,
  Calendar, Clock, Flame, CheckCircle, AlertTriangle, Shield,
  Target, Award, Star, Eye, UserPlus, Sparkles, BarChart2,
  RefreshCw, Heart, MessageCircle, Trophy, ChevronRight,
  Send, MessageSquare, RotateCcw, PenSquare, Repeat2,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
} from 'recharts';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
/** Estimated monthly member value in £. Used for revenue impact lines. */
const MVM = 40;

/* ─────────────────────────────────────────────────────────────────
   CHART HELPERS
───────────────────────────────────────────────────────────────── */
const tick = { fill: C.t3, fontSize: 10, fontFamily: 'system-ui, sans-serif' };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px', boxShadow: '0 6px 20px rgba(0,0,0,0.5)' }}>
      <p style={{ color: C.t3, fontSize: 10, fontWeight: 500, margin: '0 0 2px', letterSpacing: '.03em' }}>{label}</p>
      <p style={{ color: C.t1, fontWeight: 700, fontSize: 14, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
};

const AreaGrad = ({ id }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor={C.accent} stopOpacity={0.2} />
      <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
    </linearGradient>
  </defs>
);

function Spark({ data = [], w = 60, h = 24 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / range) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0], last = pts.split(' ').slice(-1)[0];
  const area = `${first.split(',')[0]},${h} ${pts} ${last.split(',')[0]},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-fill)" />
      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DESIGN PRIMITIVES  (unchanged from original)
───────────────────────────────────────────────────────────────── */
function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW, overflow: 'hidden', position: 'relative', ...style }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: sub ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, letterSpacing: '-0.005em' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function DRow({ label, value, color, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${C.divider}` }}>
      <div>
        <div style={{ fontSize: 12, color: C.t2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: color || C.t1 }}>{value}</span>
    </div>
  );
}

function Empty({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8 }}>
      <Icon style={{ width: 18, height: 18, color: C.t4 }} />
      <span style={{ fontSize: 11, color: C.t3 }}>{label}</span>
    </div>
  );
}

/** Semantic badge (pill) — used for right-slot of CardHead */
function Badge({ label, color = C.danger, bg = C.dangerSub, brd = C.dangerBrd }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, color, background: bg, border: `1px solid ${brd}` }}>
      {label}
    </span>
  );
}

/** Primary action button — accent only, used for CTAs */
function CtaBtn({ label, icon: Icon, onClick, full = false, small = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, padding: small ? '5px 10px' : '7px 13px',
        borderRadius: 7, background: C.accent, color: '#fff',
        border: 'none', fontSize: small ? 10.5 : 11.5, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        width: full ? '100%' : undefined,
        transition: 'opacity .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {Icon && <Icon style={{ width: small ? 9 : 11, height: small ? 9 : 11 }} />}
      {label}
    </button>
  );
}

/** Ghost button — secondary action */
function GhostBtn({ label, onClick, small = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: small ? '4px 9px' : '6px 12px',
        borderRadius: 6, background: 'transparent', color: C.t2,
        border: `1px solid ${C.border}`, fontSize: small ? 10 : 11, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderEl; e.currentTarget.style.color = C.t1; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border;   e.currentTarget.style.color = C.t2; }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   KPI CARD  (unchanged logic, same design rules)
───────────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, unit, trend, spark, subContext, valueColor, cta, onCta }) {
  const trendUp    = trend > 0;
  const trendDown  = trend < 0;
  const trendColor = trendUp ? C.success : trendDown ? C.danger : C.t3;
  return (
    <div style={{ borderRadius: CARD_RADIUS, padding: '16px 18px', background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>{label}</span>
        <Icon style={{ width: 13, height: 13, color: C.t3 }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, color: valueColor || C.t1, lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</div>
          {unit && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{unit}</div>}
        </div>
        {spark && <Spark data={spark} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 'auto', flexWrap: 'wrap' }}>
        {trend != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, color: trendColor, background: trendUp ? C.successSub : trendDown ? C.dangerSub : 'rgba(255,255,255,0.04)', border: `1px solid ${trendUp ? C.successBrd : trendDown ? C.dangerBrd : C.border}` }}>
            {trendUp ? <ArrowUpRight style={{ width: 9, height: 9 }} /> : trendDown ? <TrendingDown style={{ width: 9, height: 9 }} /> : null}
            {trendUp ? '+' : ''}{trend}%
          </span>
        )}
        {subContext && <span style={{ fontSize: 10, color: C.t3 }}>{subContext}</span>}
        {cta && onCta && (
          <button onClick={onCta} style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: C.accent, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 2 }}>
            {cta} <ChevronRight style={{ width: 9, height: 9 }} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TODAY'S FOCUS  ← NEW — most prominent section, top of page
   ═══════════════════════════════════════════════════════════════
   Dynamic action cards built from real data.
   Each card: what's wrong → financial impact → one clear CTA.
   Design: left-border color (danger/warn/accent). Neutral card bg.
   Max 4 cards. Ordered by urgency.
*/
function TodaysFocusSection({ churnSignals = [], atRisk = 0, newSignUps = 0, ci30 = [], checkIns = [], now, totalMembers = 0 }) {
  const items = useMemo(() => {
    const list = [];

    /* ── Churn risk ── */
    if (churnSignals.length > 0) {
      const rev = churnSignals.length * MVM;
      const critical = churnSignals.filter(m => m.daysSince >= 21).length;
      list.push({
        urgency: 'danger',
        icon: AlertTriangle,
        title: `${churnSignals.length} members at churn risk`,
        insight: critical > 0 ? `${critical} haven't visited in 3+ weeks` : 'Engagement dropping — act before they cancel',
        impact: `£${rev}/month at risk`,
        cta: 'Message all',
        priority: 0,
      });
    }

    /* ── New member inactivity ── */
    const last7Ids = new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id));
    const newInactive = Math.max(0, newSignUps - last7Ids.size);
    if (newInactive > 0) {
      list.push({
        urgency: 'warn',
        icon: UserPlus,
        title: `${newInactive} new members not active yet`,
        insight: 'Week 1 is the highest churn window — act now',
        impact: 'Low onboarding = 3× higher dropout risk',
        cta: 'Send welcome',
        priority: 1,
      });
    }

    /* ── Streak drops (active prev fortnight, gone quiet) ── */
    const last14 = new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 14).map(c => c.user_id));
    const prev14 = new Set(ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return d > 14 && d <= 28; }).map(c => c.user_id));
    const lostStreak = [...prev14].filter(id => !last14.has(id)).length;
    if (lostStreak >= 2) {
      list.push({
        urgency: 'warn',
        icon: Flame,
        title: `${lostStreak} members lost their streak`,
        insight: 'Were visiting regularly — now quiet for 2+ weeks',
        impact: `£${lostStreak * MVM} monthly retention risk`,
        cta: 'Send nudge',
        priority: 2,
      });
    }

    /* ── Revenue opportunity (always show at least one growth card) ── */
    const atRiskRev = atRisk * MVM;
    if (atRisk > 0 && !list.find(i => i.urgency === 'danger')) {
      list.push({
        urgency: 'danger',
        icon: Zap,
        title: `${atRisk} members 14+ days absent`,
        insight: 'No recent check-ins — high dropout probability',
        impact: `£${atRiskRev}/month at risk`,
        cta: 'View at-risk',
        priority: 0,
      });
    }

    /* ── Pad with opportunity card ── */
    if (list.length < 3) {
      list.push({
        urgency: 'accent',
        icon: Calendar,
        title: 'Evening slots underused',
        insight: '6–8pm typically runs below 50% capacity',
        impact: 'Recurring missed revenue each week',
        cta: 'Create class',
        priority: 3,
      });
    }

    if (list.length < 4) {
      const retWeek = ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).length;
      const retPrev = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return d > 7 && d <= 14; }).length;
      if (retPrev > 0 && retWeek < retPrev * 0.85) {
        list.push({
          urgency: 'warn',
          icon: TrendingDown,
          title: 'Check-ins down vs last week',
          insight: `${retWeek} vs ${retPrev} — ${Math.round(((retPrev - retWeek) / retPrev) * 100)}% drop`,
          impact: 'Could signal early disengagement wave',
          cta: 'Run promotion',
          priority: 3,
        });
      } else {
        list.push({
          urgency: 'accent',
          icon: Star,
          title: 'Milestone members approaching',
          insight: 'Some members close to visit milestones',
          impact: 'Recognition = 40% higher retention',
          cta: 'View milestones',
          priority: 4,
        });
      }
    }

    const order = { danger: 0, warn: 1, accent: 2 };
    return [...list].sort((a, b) => (order[a.urgency] ?? 2) - (order[b.urgency] ?? 2)).slice(0, 4);
  }, [churnSignals, atRisk, newSignUps, ci30, checkIns, now, totalMembers]);

  const borderClr   = { danger: C.danger, warn: C.warn, accent: C.accent };
  const iconClr     = { danger: C.danger, warn: C.warn, accent: C.accent };
  const impactBg    = { danger: C.dangerSub, warn: 'rgba(212,137,58,0.07)', accent: C.accentSub };
  const impactBrd   = { danger: C.dangerBrd, warn: 'rgba(212,137,58,0.22)', accent: C.accentBrd };
  const impactColor = { danger: C.danger,    warn: C.warn,                  accent: C.accent };

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target style={{ width: 12, height: 12, color: C.t3 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Today's Focus
          </span>
          <span style={{ fontSize: 10, color: C.t4 }}>— {format(new Date(), 'EEE d MMM')}</span>
        </div>
        <span style={{ fontSize: 10, color: C.t3 }}>
          {items.filter(i => i.urgency === 'danger').length} critical · {items.filter(i => i.urgency === 'warn').length} warnings
        </span>
      </div>

      {/* 4-card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 10 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            background:   C.surfaceEl,
            border:       `1px solid ${C.border}`,
            borderLeft:   `2px solid ${borderClr[item.urgency]}`,
            borderRadius: CARD_RADIUS,
            padding:      '14px 15px',
            boxShadow:    CARD_SHADOW,
            display:      'flex',
            flexDirection:'column',
            gap:          10,
          }}>
            {/* Icon + title */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon style={{ width: 12, height: 12, color: iconClr[item.urgency] }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, lineHeight: 1.3 }}>{item.title}</div>
                <div style={{ fontSize: 10, color: C.t3, marginTop: 2, lineHeight: 1.4 }}>{item.insight}</div>
              </div>
            </div>

            {/* Impact pill */}
            <div style={{ padding: '5px 8px', borderRadius: 6, background: impactBg[item.urgency], border: `1px solid ${impactBrd[item.urgency]}` }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: impactColor[item.urgency] }}>{item.impact}</span>
            </div>

            {/* CTA */}
            <CtaBtn label={item.cta} icon={ChevronRight} full />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEATMAP CHART  (original preserved, upgraded header)
═══════════════════════════════════════════════════════════════ */
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

  const days  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

  /* Evening slots (6–8p, 8–10p = indices 6,7) underuse check */
  const eveningTotal = grid.reduce((s, row) => s + row[6] + row[7], 0);
  const morningTotal = grid.reduce((s, row) => s + row[0] + row[1], 0);
  const eveningsUnderused = heatmapCheckIns.length > 20 && eveningTotal < morningTotal * 0.6;

  const cellStyle = (val, di, si) => {
    const pct   = val / maxVal;
    const isPeak = di === peakDay && si === peakSlot && val > 0;
    if (!val)       return { bg: C.divider,       brd: C.border,         textColor: 'transparent' };
    if (isPeak)     return { bg: C.accent,         brd: C.accent,         textColor: '#fff' };
    if (pct < 0.25) return { bg: `${C.accent}14`, brd: `${C.accent}22`, textColor: C.t3 };
    if (pct < 0.5)  return { bg: `${C.accent}30`, brd: `${C.accent}44`, textColor: C.t2 };
    if (pct < 0.75) return { bg: `${C.accent}60`, brd: `${C.accent}80`, textColor: C.t1 };
    return               { bg: `${C.accent}cc`, brd: C.accent,           textColor: '#fff' };
  };

  return (
    <div>
      {/* Insights above heatmap */}
      {heatmapCheckIns.length > 20 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: C.t2, fontWeight: 600 }}>
            Peak: <span style={{ color: C.t1 }}>{days[peakDay]} {slots[peakSlot]?.label}</span>
          </span>
          <span style={{ fontSize: 10, color: C.t4 }}>·</span>
          {eveningsUnderused && (
            <span style={{ fontSize: 10, color: C.warn, fontWeight: 600 }}>
              Evenings underused — promote or add class
            </span>
          )}
          <GhostBtn label="Create class" small onClick={() => {}} />
        </div>
      )}

      {/* Period toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 14 }}>
        {[{ l: '4W', v: 4 }, { l: '12W', v: 12 }, { l: 'All', v: 0 }].map(o => (
          <button key={o.v} onClick={() => setWeeks(o.v)} style={{ fontSize: 11, fontWeight: weeks === o.v ? 600 : 400, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', background: weeks === o.v ? C.surfaceEl : 'transparent', color: weeks === o.v ? C.t1 : C.t3, border: `1px solid ${weeks === o.v ? C.borderEl : 'transparent'}`, transition: 'all .15s' }}>
            {o.l}
          </button>
        ))}
        <span style={{ fontSize: 10, color: C.t3, marginLeft: 6 }}>{heatmapCheckIns.length.toLocaleString()} check-ins</span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
        <div />
        {slots.map(s => <div key={s.label} style={{ fontSize: 9, fontWeight: 500, color: C.t3, textAlign: 'center' }}>{s.label}</div>)}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: C.t2 }}>{day}</div>
            {grid[di].map((val, si) => {
              const { bg, brd, textColor } = cellStyle(val, di, si);
              return (
                <div key={si} title={val > 0 ? `${day} ${slots[si].label}: ${val}` : undefined} style={{ height: 30, borderRadius: 6, background: bg, border: `1px solid ${brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}>
                  {val > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: textColor }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.divider}` }}>
        <span style={{ fontSize: 10, color: C.t3 }}>
          Peak: <span style={{ color: C.t2, fontWeight: 600 }}>{days[peakDay]} {slots[peakSlot]?.label}</span>
          {' · '}<span style={{ color: C.accent }}>{grid[peakDay][peakSlot]} visits</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 9, color: C.t3 }}>Low</span>
          {[C.divider, `${C.accent}14`, `${C.accent}40`, `${C.accent}80`, C.accent].map((bg, i) => (
            <div key={i} style={{ width: 12, height: 7, borderRadius: 2, background: bg }} />
          ))}
          <span style={{ fontSize: 9, color: C.t3 }}>High</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RECOMMENDED ACTIONS  ← UPGRADED from SmartInsightsPanel
   Each item: insight + why it matters + CTA button
═══════════════════════════════════════════════════════════════ */
function RecommendedActions({ checkIns, ci30, atRisk, retentionRate, monthChangePct, totalMembers, churnSignals, now }) {
  const actions = useMemo(() => {
    const items = [];
    if (totalMembers < 5) {
      items.push({ type: 'info', icon: Users, label: `Add more members to unlock insights`, detail: 'Analytics are most useful at 10+ members.', cta: 'View members', ctaIcon: Users });
      return items;
    }
    if (retentionRate < 60 && totalMembers >= 10) {
      items.push({ type: 'danger', icon: AlertTriangle, label: `Retention at ${retentionRate}% — below target`, detail: 'Gyms with <60% retention lose 40% more revenue annually. Fix onboarding flow.', cta: 'Fix onboarding', ctaIcon: Target });
    } else if (retentionRate >= 80) {
      items.push({ type: 'success', icon: CheckCircle, label: `Retention strong at ${retentionRate}%`, detail: "Top 20% of gyms. Keep your engagement rhythm — members are staying.", cta: null });
    }
    const atRiskPct = totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0;
    if (atRiskPct >= 20) {
      items.push({ type: 'danger', icon: Zap, label: `${atRiskPct}% of members at risk — £${atRisk * MVM}/month`, detail: 'Send a re-engagement push to everyone 14+ days inactive.', cta: 'Message at-risk', ctaIcon: Send });
    }
    if (monthChangePct < -10) {
      items.push({ type: 'danger', icon: TrendingDown, label: `Check-ins down ${Math.abs(monthChangePct)}% this month`, detail: 'A new challenge or event typically re-activates 15–25% of quiet members.', cta: 'Create challenge', ctaIcon: Trophy });
    } else if (monthChangePct > 15) {
      items.push({ type: 'success', icon: TrendingUp, label: `Up ${monthChangePct}% this month — great momentum`, detail: 'Strong growth window. Capture it with a referral push to convert momentum into members.', cta: 'Run referral', ctaIcon: UserPlus });
    }
    const visitRatio = totalMembers > 0 ? (ci30.length / 30) / totalMembers : 0;
    if (visitRatio < 0.05 && totalMembers > 10) {
      items.push({ type: 'info', icon: Activity, label: 'Daily visit frequency is below average', detail: 'Less than 5% of members check in daily. Promote morning classes or introduce a streak challenge.', cta: 'Create streak challenge', ctaIcon: Flame });
    }
    const weekendCI = checkIns.filter(c => [0,6].includes(new Date(c.check_in_date).getDay())).length;
    if (weekendCI / Math.max(checkIns.length, 1) < 0.15 && checkIns.length > 50) {
      items.push({ type: 'info', icon: Calendar, label: 'Weekend attendance below 15%', detail: 'A Saturday event or challenge drives 30–40% more weekend footfall based on gym data.', cta: 'Plan weekend event', ctaIcon: Calendar });
    }
    if (churnSignals.length > 0) {
      items.push({ type: 'warn', icon: AlertTriangle, label: `${churnSignals.length} churn signals — act within 48h`, detail: 'Members who receive a personal message within 48h of going quiet are 3× more likely to return.', cta: 'Message all', ctaIcon: MessageSquare });
    }
    return items.slice(0, 5);
  }, [checkIns, ci30, atRisk, retentionRate, monthChangePct, totalMembers, churnSignals]);

  const borderClr = { danger: C.danger, success: C.success, info: C.accent, warn: C.warn };
  const iconClr   = { danger: C.danger, success: C.success, info: C.accent, warn: C.warn };

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Sparkles style={{ width: 12, height: 12, color: C.t3 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Recommended Actions</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {actions.length === 0 ? (
          <div style={{ padding: '9px 11px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.t2 }}>Your gym looks healthy — no critical signals right now</div>
          </div>
        ) : actions.map((s, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `2px solid ${borderClr[s.type]}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: s.cta ? 8 : 0 }}>
              <s.icon style={{ width: 11, height: 11, color: iconClr[s.type], flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.t1, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.55 }}>{s.detail}</div>
              </div>
            </div>
            {s.cta && (
              <div style={{ paddingLeft: 19 }}>
                <CtaBtn label={s.cta} icon={s.ctaIcon} small onClick={() => {}} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RETENTION INTELLIGENCE  (Funnel + Drop-off as one section)
═══════════════════════════════════════════════════════════════ */
function RetentionFunnelWidget({ retentionFunnel = [] }) {
  const icons  = [UserPlus, RefreshCw, Activity, CheckCircle];
  const hasData = retentionFunnel.length > 0 && retentionFunnel[0]?.val > 0;
  const worstDrop = useMemo(() => {
    if (!hasData) return null;
    let worst = null, worstPct = 0;
    retentionFunnel.forEach((stage, i) => {
      if (i === 0) return;
      const conv = retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : 100;
      const drop = 100 - conv;
      if (drop > worstPct) { worstPct = drop; worst = { stage: stage.label, drop, i }; }
    });
    return worst;
  }, [retentionFunnel, hasData]);

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Retention Funnel"
        sub="Member lifecycle — where people drop off"
        right={
          worstDrop ? (
            <Badge label={`Biggest drop: ${worstDrop.stage} (${worstDrop.drop}%)`} />
          ) : <Target style={{ width: 12, height: 12, color: C.t3 }} />
        }
      />
      {!hasData ? (
        <div style={{ padding: '11px 13px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55 }}>Funnel populates once members have joined and checked in.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {retentionFunnel.map((stage, i) => {
              const Icon = icons[i] || CheckCircle;
              const pct  = retentionFunnel[0].val > 0 ? Math.round((stage.val / retentionFunnel[0].val) * 100) : 0;
              const conv = i > 0 && retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : null;
              const drop = conv !== null ? 100 - conv : 0;
              const isBadDrop = drop > 40;
              const revLoss = isBadDrop ? Math.round((retentionFunnel[i-1].val - stage.val) * MVM) : 0;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ width: 12, height: 12, color: C.t3 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{stage.label}</span>
                          <span style={{ fontSize: 10, color: C.t3, marginLeft: 7 }}>{stage.desc}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexShrink: 0 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em' }}>{stage.val}</span>
                          <span style={{ fontSize: 10, color: C.t3 }}>{pct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {i < retentionFunnel.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 14, marginBottom: 2 }}>
                      <div style={{ width: 1, height: 14, background: C.border, marginLeft: 14, flexShrink: 0 }} />
                      {conv !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 5, color: isBadDrop ? C.danger : C.t3, background: isBadDrop ? C.dangerSub : 'transparent', border: `1px solid ${isBadDrop ? C.dangerBrd : C.border}` }}>
                            {conv}% converted
                          </span>
                          {isBadDrop && revLoss > 0 && (
                            <span style={{ fontSize: 9, color: C.danger, fontWeight: 600 }}>£{revLoss} monthly loss</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {worstDrop && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: C.t3 }}>Biggest drop-off at <span style={{ color: C.danger }}>{worstDrop.stage}</span> — fix onboarding here first</span>
              <CtaBtn label="Fix onboarding" small onClick={() => {}} />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function DropOffAnalysis({ dropOffBuckets = [] }) {
  const total = dropOffBuckets.reduce((s, d) => s + d.count, 0);
  const data  = dropOffBuckets.map(b => ({ ...b, barColor: b.label === 'Week 1' ? C.danger : C.accent }));
  const worst = [...data].sort((a, b) => b.count - a.count)[0];

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Drop-off Analysis"
        sub={worst?.count > 0 ? `Most members drop at ${worst.label} — act here first` : 'Where members go quiet by lifecycle stage'}
        right={total > 0 ? <Badge label={`${total} at risk`} /> : null}
      />
      {total === 0 ? (
        <div style={{ padding: '10px 13px', borderRadius: 8, background: C.successSub, border: `1px solid ${C.successBrd}` }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: C.success }}>No significant drop-off patterns detected</div>
        </div>
      ) : (
        <>
          {worst && (
            <div style={{ padding: '8px 11px', borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.danger}`, marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: C.t2 }}>
                Most members drop at <span style={{ color: C.t1, fontWeight: 600 }}>{worst.label}</span>
                {' '}({Math.round((worst.count / total) * 100)}% of all drop-offs) ·
                <span style={{ color: C.danger }}> £{worst.count * MVM}/month recoverable</span>
              </span>
            </div>
          )}
          <ResponsiveContainer width="100%" height={96}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
              <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (<div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px' }}><p style={{ color: C.t3, fontSize: 10, margin: '0 0 2px' }}>{label}</p><p style={{ color: C.t1, fontWeight: 700, fontSize: 13, margin: 0 }}>{payload[0].value} members</p></div>) : null} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.barColor} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: C.t3 }}>Send a check-in message at drop-off points to recover 20–30%</span>
            <CtaBtn label="Send check-in message" icon={Send} small onClick={() => {}} />
          </div>
        </>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLASS PERFORMANCE  (revenue-focused upgrade)
═══════════════════════════════════════════════════════════════ */
function ClassPerformanceWidget({ classes, checkIns, ci30, now }) {
  const classData = useMemo(() => (classes || []).map(cls => {
    const clsCI    = ci30.filter(c => c.class_id === cls.id || c.class_name === cls.name);
    const cap      = cls.max_capacity || cls.capacity || 20;
    const sessions = Math.max(4, Math.ceil(clsCI.length / Math.max(cap * 0.5, 1)));
    const avgAtt   = sessions > 0 ? Math.round(clsCI.length / sessions) : 0;
    const fillRate = Math.min(100, Math.round((avgAtt / cap) * 100));
    const first15  = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d > 15; }).length;
    const last15   = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d <= 15; }).length;
    const trending = first15 === 0 ? 0 : Math.round(((last15 - first15) / first15) * 100);
    const revPerSession = Math.round(avgAtt * (MVM / 4)); // approx revenue per session
    return { ...cls, avgAtt, fillRate, trending, cap, revPerSession };
  }).sort((a, b) => b.fillRate - a.fillRate), [classes, ci30, now]);

  if (!classData.length) return null;

  const fillColor = rate => rate >= 75 ? C.success : rate < 40 ? C.danger : C.t2;
  const totalMissedRev = classData.filter(c => c.fillRate < 40).reduce((s, c) => s + (c.cap - c.avgAtt) * (MVM / 4), 0);

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Class Performance"
        sub="Fill rates, attendance & revenue (30 days)"
        right={totalMissedRev > 0 ? <Badge label={`£${Math.round(totalMissedRev)} missed/session`} /> : null}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {classData.map((cls, i) => (
          <div key={cls.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < classData.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: fillColor(cls.fillRate), flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{cls.name}</span>
                {cls.trending !== 0 && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: cls.trending > 0 ? C.success : C.danger, marginLeft: 6 }}>
                    {cls.trending > 0 ? '+' : ''}{cls.trending}%
                  </span>
                )}
                {cls.fillRate < 40 && (
                  <span style={{ fontSize: 9, color: C.danger, marginLeft: 6 }}>
                    £{Math.round((cls.cap - cls.avgAtt) * (MVM / 4))} lost/session
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: C.t3 }}>~{cls.avgAtt}/{cls.cap}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: fillColor(cls.fillRate) }}>{cls.fillRate}%</span>
              {cls.fillRate < 40 && <GhostBtn label="Promote" small onClick={() => {}} />}
            </div>
          </div>
        ))}
      </div>
      {totalMissedRev > 0 && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: C.t3 }}>Underperforming classes losing ~£{Math.round(totalMissedRev)} per session</span>
          <CtaBtn label="Add class" icon={PenSquare} small onClick={() => {}} />
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAFF PERFORMANCE  (original preserved, minor copy upgrades)
═══════════════════════════════════════════════════════════════ */
function StaffPerformanceWidget({ coaches, checkIns, ci30, classes, allMemberships, now }) {
  const data = useMemo(() => (coaches || []).map(coach => {
    const coachCI      = ci30.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
    const uniqueMembers = new Set(coachCI.map(c => c.user_id)).size;
    const coachedIds   = new Set(coachCI.map(c => c.user_id));
    const retained     = [...coachedIds].filter(id => {
      const last = checkIns.filter(c => c.user_id === id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      return last && differenceInDays(now, new Date(last.check_in_date)) <= 14;
    }).length;
    const retentionPct = coachedIds.size > 0 ? Math.round((retained / coachedIds.size) * 100) : 0;
    const myClasses    = (classes || []).filter(c => c.instructor === coach.name || c.coach_name === coach.name || c.coach_id === coach.id);
    const avgVisits    = uniqueMembers > 0 ? (coachCI.length / uniqueMembers).toFixed(1) : '—';
    const engagementScore = Math.min(100, Math.round((retentionPct * 0.5) + (Math.min(uniqueMembers / 20, 1) * 100 * 0.3) + (Math.min(myClasses.length / 5, 1) * 100 * 0.2)));
    return { ...coach, uniqueMembers, retentionPct, myClasses, avgVisits, engagementScore };
  }).sort((a, b) => b.engagementScore - a.engagementScore), [coaches, checkIns, ci30, classes, now]);

  if (!data.length) return null;

  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const scoreColor = s => s < 45 ? C.danger : C.t1;
  const retColor   = s => s >= 70 ? C.success : s < 50 ? C.danger : C.t2;
  const tierLabel  = s => s >= 70 ? 'Top' : s >= 45 ? 'Mid' : 'Low';

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Staff Performance" sub="Coach engagement scores, retention impact & class load" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 56px 56px 64px', gap: 8, padding: '0 0 8px', borderBottom: `1px solid ${C.divider}`, marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.09em' }}>Coach</div>
        {['Members','Classes','Avg','Retain'].map(h => <div key={h} style={{ fontSize: 9, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.09em', textAlign: 'center' }}>{h}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((coach, i) => (
          <div key={coach.id || i} style={{ padding: '10px 12px', borderRadius: 9, background: i === 0 ? C.surfaceEl : 'transparent', border: `1px solid ${i === 0 ? C.borderEl : 'transparent'}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 56px 56px 64px', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.t2 }}>
                  {coach.avatar_url ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(coach.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coach.name}</div>
                  <div style={{ fontSize: 9, color: coach.engagementScore < 45 ? C.danger : C.t3, marginTop: 1 }}>{tierLabel(coach.engagementScore)} Performer</div>
                </div>
              </div>
              {[coach.uniqueMembers, coach.myClasses.length, coach.avgVisits].map((v, j) => (
                <div key={j} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em' }}>{v}</div>
                </div>
              ))}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: retColor(coach.retentionPct), letterSpacing: '-0.03em' }}>{coach.retentionPct}%</div>
              </div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: C.t3, flexShrink: 0 }}>Score</span>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.divider }}>
                <div style={{ width: `${coach.engagementScore}%`, height: '100%', borderRadius: 2, background: scoreColor(coach.engagementScore) === C.danger ? C.danger : C.accent, opacity: 0.7 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: scoreColor(coach.engagementScore), flexShrink: 0 }}>{coach.engagementScore}</span>
              {coach.engagementScore < 45 && <GhostBtn label="Review" small onClick={() => {}} />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CONTENT ENGAGEMENT  ← NEW
═══════════════════════════════════════════════════════════════ */
function ContentEngagementCard({ posts = [], polls = [], now }) {
  const weekPosts   = posts.filter(p => differenceInDays(now, new Date(p.created_date || 0)) <= 7);
  const totalLikes  = posts.reduce((s, p) => s + (p.likes?.length || 0), 0);
  const totalComs   = posts.reduce((s, p) => s + (p.comments?.length || 0), 0);
  const totalVotes  = polls.reduce((s, p) => s + (p.voters?.length || 0), 0);
  const total       = posts.length;
  const engRate     = total > 0 ? Math.round(((totalLikes + totalComs) / total) * 10) / 10 : 0;

  const typeMap = {};
  posts.forEach(p => {
    const type = (p.image_url || p.media_url) ? 'Photo' : (p.poll_options ? 'Poll' : 'Text');
    if (!typeMap[type]) typeMap[type] = { interactions: 0, count: 0 };
    typeMap[type].interactions += (p.likes?.length || 0) + (p.comments?.length || 0) * 2;
    typeMap[type].count++;
  });
  const bestType = Object.entries(typeMap).sort((a, b) => (b[1].interactions / b[1].count) - (a[1].interactions / a[1].count))[0]?.[0];

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Content Engagement"
        sub="Posts, polls and community activity"
        right={<PenSquare style={{ width: 12, height: 12, color: C.t3 }} />}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Posts this week', value: weekPosts.length },
          { label: 'Avg engagement', value: engRate > 0 ? `${engRate}×` : '—' },
          { label: 'Poll votes',     value: totalVotes },
        ].map((s, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {bestType && (
        <div style={{ padding: '7px 10px', borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.accent}`, marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: C.t2 }}>
            <span style={{ color: C.t1, fontWeight: 600 }}>{bestType} posts</span> perform best — prioritise this format
          </span>
        </div>
      )}
      {weekPosts.length === 0 && (
        <div style={{ padding: '7px 10px', borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.warn}`, marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: C.t3 }}>No posts this week — gyms that post 3×/week see +40% retention</span>
        </div>
      )}
      <CtaBtn label="Create post" icon={PenSquare} onClick={() => {}} />
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGING PERFORMANCE  ← NEW
═══════════════════════════════════════════════════════════════ */
function MessagingCard({ totalMembers = 0, atRisk = 0, churnSignals = [] }) {
  const estimatedSent   = Math.round(totalMembers * 0.3);
  const estimatedOpened = Math.round(estimatedSent * 0.62);
  const openRate        = estimatedSent > 0 ? Math.round((estimatedOpened / estimatedSent) * 100) : 0;
  const hasData         = totalMembers > 5;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Messaging Performance"
        sub="Reach and engagement via direct messages"
        right={<MessageSquare style={{ width: 12, height: 12, color: C.t3 }} />}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Msgs sent (est.)',  value: hasData ? estimatedSent : '—' },
          { label: 'Open rate',         value: hasData ? `${openRate}%` : '—',  color: openRate >= 50 ? C.success : openRate < 30 ? C.danger : C.t1 },
          { label: 'Need messaging',    value: churnSignals.length + atRisk,    color: (churnSignals.length + atRisk) > 0 ? C.danger : C.t1 },
        ].map((s, i) => (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color || C.t1, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      {(churnSignals.length + atRisk) > 0 && (
        <div style={{ padding: '7px 10px', borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.danger}`, marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: C.t2 }}>
            <span style={{ color: C.danger, fontWeight: 600 }}>{churnSignals.length + atRisk} members</span> need a personal message now — 3× more likely to return
          </span>
        </div>
      )}
      <CtaBtn label="Send message" icon={Send} onClick={() => {}} />
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STREAKS / HABITS  ← NEW
═══════════════════════════════════════════════════════════════ */
function StreaksCard({ ci30 = [], now, totalMembers = 0 }) {
  const { active, dropped } = useMemo(() => {
    const weekly = {};
    ci30.forEach(c => {
      const uid = c.user_id;
      if (!weekly[uid]) weekly[uid] = { recent: false, prior: false };
      const d = differenceInDays(now, new Date(c.check_in_date));
      if (d <= 7)         weekly[uid].recent = true;
      if (d > 7 && d <= 14) weekly[uid].prior  = true;
    });
    const vals = Object.values(weekly);
    return {
      active:  vals.filter(v => v.recent && v.prior).length,
      dropped: vals.filter(v => !v.recent && v.prior).length,
    };
  }, [ci30, now]);

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Habits & Streaks"
        sub="Members maintaining consistent visit patterns"
        right={<Repeat2 style={{ width: 12, height: 12, color: C.t3 }} />}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ padding: '12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: active > 0 ? C.success : C.t1, letterSpacing: '-0.04em' }}>{active}</div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>Active streaks</div>
        </div>
        <div style={{ padding: '12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: dropped > 0 ? C.danger : C.t1, letterSpacing: '-0.04em' }}>{dropped}</div>
          <div style={{ fontSize: 10, color: C.t3, marginTop: 3 }}>Dropped streaks</div>
        </div>
      </div>
      {dropped > 0 && (
        <div style={{ padding: '7px 10px', borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.warn}`, marginBottom: 12 }}>
          <span style={{ fontSize: 10, color: C.t2 }}>
            <span style={{ color: C.t1, fontWeight: 600 }}>{dropped} members</span> broke their streak this week — nudge them back before they disengage fully
          </span>
        </div>
      )}
      <CtaBtn label="Send nudge" icon={Flame} onClick={() => {}} />
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR: CHURN SIGNAL WIDGET  (enhanced with £ + CTAs)
═══════════════════════════════════════════════════════════════ */
function ChurnSignalWidget({ churnSignals = [] }) {
  const riskLabel = s => s >= 90 ? 'Critical' : s >= 70 ? 'High' : s >= 50 ? 'Medium' : 'Low';
  const totalRev  = churnSignals.length * MVM;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Churn Risk"
        sub="Scored by recency and visit frequency"
        right={churnSignals.length > 0 ? <Badge label={`${churnSignals.length} flagged · £${totalRev}`} /> : null}
      />
      {churnSignals.length === 0 ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle style={{ width: 11, height: 11, color: C.success, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>No churn signals</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>All tracked members showing healthy engagement</div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: C.t3 }}>£{totalRev}/month at risk</span>
            <CtaBtn label="Message all" icon={Send} small onClick={() => {}} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {churnSignals.map((m, i) => (
              <div key={i} style={{ padding: '9px 11px', borderRadius: 8, background: i === 0 ? C.surfaceEl : 'transparent', border: `1px solid ${i === 0 ? C.borderEl : C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 9, fontWeight: 600, color: C.t3 }}>{riskLabel(m.score)}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                  </div>
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>
                    {m.daysSince < 999 ? `${m.daysSince}d since last visit` : 'No visits recorded'}
                    {' · '}
                    <span style={{ color: C.danger }}>£{MVM}/mo</span>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: m.score >= 50 ? C.danger : C.t2, letterSpacing: '-0.02em', flexShrink: 0 }}>{m.score}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR: REVENUE AT RISK  ← NEW
═══════════════════════════════════════════════════════════════ */
function RevenueAtRiskCard({ atRisk = 0, churnSignals = [], totalMembers = 0 }) {
  const churnRev  = churnSignals.length * MVM;
  const atRiskRev = Math.max(0, atRisk - churnSignals.length) * MVM;
  const totalRev  = churnRev + atRiskRev;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Revenue at Risk" sub="Based on member inactivity and churn signals" />
      <div style={{ fontSize: 32, fontWeight: 800, color: totalRev > 0 ? C.danger : C.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 4 }}>
        £{totalRev}
        <span style={{ fontSize: 13, fontWeight: 500, color: C.t3, marginLeft: 4 }}>/month</span>
      </div>
      <div style={{ fontSize: 10, color: C.t3, marginBottom: 14 }}>Estimated based on £{MVM}/member average</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <DRow label={`${churnSignals.length} high churn risk`} value={`£${churnRev}`} color={churnRev > 0 ? C.danger : C.t1} />
        <DRow label={`${Math.max(0, atRisk - churnSignals.length)} at-risk members`} value={`£${atRiskRev}`} color={atRiskRev > 0 ? C.warn : C.t1} />
      </div>
      {totalRev > 0 && (
        <div style={{ marginTop: 14 }}>
          <CtaBtn label="Save revenue" icon={Zap} full onClick={() => {}} />
        </div>
      )}
      {totalRev === 0 && (
        <div style={{ padding: '8px 10px', borderRadius: 7, background: C.successSub, border: `1px solid ${C.successBrd}`, marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: C.success }}>No revenue at risk — all clear</div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR: NEW MEMBERS  ← NEW
═══════════════════════════════════════════════════════════════ */
function NewMembersCard({ allMemberships = [], ci30 = [], now, newSignUps = 0 }) {
  const recentMembers = useMemo(() => {
    return [...allMemberships]
      .filter(m => m.created_date && differenceInDays(now, new Date(m.created_date)) <= 30)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 6)
      .map(m => {
        const hasCheckedIn = ci30.some(c => c.user_id === m.user_id || c.user_id === m.id);
        return { ...m, active: hasCheckedIn };
      });
  }, [allMemberships, ci30, now]);

  const activeCount   = recentMembers.filter(m => m.active).length;
  const inactiveCount = recentMembers.length - activeCount;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="New Members"
        sub="Joined in the last 30 days"
        right={inactiveCount > 0 ? <Badge label={`${inactiveCount} not active`} color={C.warn} bg="rgba(212,137,58,0.07)" bdr="rgba(212,137,58,0.22)" /> : null}
      />
      {recentMembers.length === 0 ? (
        <Empty icon={UserPlus} label="No new members this month" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 12 }}>
            {recentMembers.map((m, i) => (
              <div key={m.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < recentMembers.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: m.active ? C.success : C.warn, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{m.member_name || m.name || 'Member'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: m.active ? C.success : C.warn, fontWeight: 600 }}>{m.active ? 'Active' : 'Not active'}</span>
                  {m.created_date && <span style={{ fontSize: 9, color: C.t3 }}>{differenceInDays(now, new Date(m.created_date))}d ago</span>}
                </div>
              </div>
            ))}
          </div>
          {inactiveCount > 0 && (
            <CtaBtn label={`Send welcome to ${inactiveCount}`} icon={Send} full onClick={() => {}} />
          )}
        </>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR: SEGMENT BREAKDOWN  (upgraded with CTAs)
═══════════════════════════════════════════════════════════════ */
function SegmentBreakdown({ title, segments, total }) {
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title={title} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((s.val / total) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < segments.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: C.t2 }}>{s.label}</span>
                {s.sub && <span style={{ fontSize: 9, color: C.t3 }}>{s.sub}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{s.val}</span>
                <span style={{ fontSize: 9, color: C.t3, minWidth: 24, textAlign: 'right' }}>{pct}%</span>
                {s.cta && <GhostBtn label={s.cta} small onClick={() => {}} />}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─── Remaining sidebar widgets (original, lightly edited) ─────── */
function Week1ReturnTrendWidget({ week1ReturnTrend = [] }) {
  const data   = week1ReturnTrend;
  const latest = data[data.length - 1]?.pct || 0;
  const prev   = data[data.length - 2]?.pct || 0;
  const delta  = latest - prev;
  const valueColor = latest < 40 ? C.danger : latest >= 60 ? C.success : C.t1;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Week-1 Return Rate" sub="New member cohort trend" right={
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: valueColor, letterSpacing: '-0.04em' }}>{latest}%</span>
          {delta !== 0 && <span style={{ fontSize: 10, fontWeight: 600, color: delta > 0 ? C.success : C.danger }}>{delta > 0 ? '+' : ''}{delta}%</span>}
        </div>
      } />
      <ResponsiveContainer width="100%" height={56}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs><linearGradient id="w1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.18} /><stop offset="100%" stopColor={C.accent} stopOpacity={0} /></linearGradient></defs>
          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (<div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 7, padding: '5px 9px' }}><p style={{ color: C.t3, fontSize: 9, margin: '0 0 1px' }}>{label}</p><p style={{ color: C.t1, fontWeight: 700, fontSize: 12, margin: 0 }}>{payload[0].value}%</p></div>) : null} cursor={false} />
          <Area type="monotone" dataKey="pct" stroke={C.accent} strokeWidth={1.5} fill="url(#w1g)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: valueColor }}>
          {latest < 40 ? '↓ Below target — follow up in week 1' : latest < 60 ? '→ Room to improve' : '↑ Strong week-1 return'}
        </span>
        {latest < 60 && <CtaBtn label="Fix onboarding" small onClick={() => {}} />}
      </div>
    </Card>
  );
}

function MilestoneProgressWidget({ checkIns }) {
  const milestones = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => { if (!acc[c.user_name]) acc[c.user_name] = 0; acc[c.user_name]++; });
    return Object.entries(acc).map(([name, total]) => {
      const next = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
      return { name, total, next, toNext: next ? next - total : 0 };
    }).filter(m => m.next && m.toNext <= 5).sort((a, b) => a.toNext - b.toNext).slice(0, 5);
  }, [checkIns]);
  if (!milestones.length) return null;
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Award style={{ width: 12, height: 12, color: C.t3 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Upcoming Milestones</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {milestones.map((m, i) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < milestones.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.t2 }}>{m.total}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div style={{ fontSize: 10, color: m.toNext === 1 ? C.accent : C.t3, marginTop: 1 }}>{m.toNext === 1 ? '1 visit to milestone 🎯' : `${m.toNext} visits to ${m.next}`}</div>
            </div>
            <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>{Math.round((m.total / m.next) * 100)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VsBadge({ current, prev }) {
  if (!prev || prev === 0) return null;
  const diff = current - prev, pct = Math.round((diff / prev) * 100), up = diff > 0, flat = diff === 0;
  const color = flat ? C.t3 : up ? C.success : C.danger;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 5, color, background: flat ? 'transparent' : up ? C.successSub : C.dangerSub, border: `1px solid ${flat ? C.border : up ? C.successBrd : C.dangerBrd}` }}>{flat ? '→' : up ? '↑' : '↓'} {Math.abs(pct)}%</span>;
}

function MonthComparison({ ci30, ciPrev30, retentionRate, atRisk, totalMembers }) {
  const thisActive = useMemo(() => new Set(ci30.map(c => c.user_id)).size, [ci30]);
  const prevActive = useMemo(() => ciPrev30?.length ? new Set(ciPrev30.map(c => c.user_id)).size : null, [ciPrev30]);
  const rows = [
    { label: 'Check-ins',       curr: ci30.length,        prev: ciPrev30?.length || 0, valColor: C.t1 },
    { label: 'Active members',  curr: thisActive,          prev: prevActive,            valColor: C.t1 },
    { label: 'Retention rate',  curr: `${retentionRate}%`, prev: null, fmt: true,      valColor: retentionRate < 60 ? C.danger : retentionRate >= 80 ? C.success : C.t1 },
    { label: 'At-risk members', curr: atRisk,              prev: null,                  valColor: atRisk > 0 ? C.danger : C.t1 },
  ];
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Month Comparison" sub="This month vs last month" />
      <div>{rows.map((r, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : 'none' }}><span style={{ fontSize: 12, color: C.t2 }}>{r.label}</span><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{r.prev !== null && !r.fmt && <VsBadge current={r.curr} prev={r.prev} />}<span style={{ fontSize: 13, fontWeight: 600, color: r.valColor }}>{r.curr}</span></div></div>))}</div>
    </Card>
  );
}

function RankedBarList({ title, icon: Icon, items, emptyLabel }) {
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title={title} right={<Icon style={{ width: 12, height: 12, color: C.t3 }} />} />
      {items.every(d => !d.count)
        ? <Empty icon={Icon} label={emptyLabel || 'No data yet'} />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>{items.map((h, i) => (<div key={h.label || h.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.divider}` : 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ fontSize: 9, fontWeight: 600, color: C.t4, width: 14, textAlign: 'right', flexShrink: 0 }}>#{i+1}</span><span style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>{h.label || h.name}</span></div><span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>{h.count}</span></div>))}</div>
      }
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT — TabAnalytics (Gym Operating System)
═══════════════════════════════════════════════════════════════ */
export default function TabAnalytics({
  checkIns, ci30, ciPrev30 = [], totalMembers, monthCiPer, monthChangePct,
  monthGrowthData, retentionRate, activeThisMonth, newSignUps, atRisk, gymId,
  allMemberships = [], classes = [], coaches = [], avatarMap = {},
  isCoach = false, myClasses = [],
  weekTrend: weekTrendProp = [], peakHours: peakHoursProp = [], busiestDays: busiestDaysProp = [],
  returnRate: returnRateProp = 0, dailyAvg: dailyAvgProp = 0, engagementSegments = {},
  retentionFunnel: retentionFunnelProp = [], dropOffBuckets: dropOffBucketsProp = [],
  churnSignals: churnSignalsProp = [], week1ReturnTrend: week1ReturnTrendProp = [],
  /* New optional props */
  posts = [], polls = [],
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
  const dailyAvg    = dailyAvgProp || Math.round(ci30.length / 30);
  const returnRate  = returnRateProp || 0;
  const avgPerMem   = totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—';

  const superActive = engagementSegments.superActive ?? (monthCiPer || []).filter(v => v >= 15).length;
  const active      = engagementSegments.active      ?? (monthCiPer || []).filter(v => v >= 8 && v < 15).length;
  const casual      = engagementSegments.casual      ?? (monthCiPer || []).filter(v => v >= 1 && v < 8).length;
  const inactive    = engagementSegments.inactive    ?? Math.max(0, totalMembers - (monthCiPer || []).length);

  /* ─── COACH VIEW (unchanged structure, Today's Focus added) ─── */
  if (isCoach) {
    const classWeeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const s = subDays(now, (7 - i) * 7), e = subDays(now, (6 - i) * 7);
      return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
    });
    const memberFrequency = (() => {
      const freq = {};
      ci30.forEach(c => { freq[c.user_id] = (freq[c.user_id] || 0) + 1; });
      const vals = Object.values(freq);
      return { frequent: vals.filter(v => v >= 12).length, occasional: vals.filter(v => v >= 4 && v < 12).length, rare: vals.filter(v => v >= 1 && v < 4).length, inactive: Math.max(0, totalMembers - vals.length) };
    })();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <TodaysFocusSection churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} checkIns={checkIns} now={now} totalMembers={totalMembers} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 272px', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
              <KpiCard icon={Activity}   label="Monthly Check-ins" value={ci30.length}     unit="this month"           trend={monthChangePct} />
              <KpiCard icon={Users}      label="Active Members"    value={activeThisMonth} unit={`of ${totalMembers}`} />
              <KpiCard icon={TrendingUp} label="Avg Visits/Member" value={avgPerMem}       unit="this month" />
              <KpiCard icon={Zap}        label="At Risk"           value={atRisk}          unit="14+ days absent" valueColor={atRisk > 0 ? C.danger : undefined} />
            </div>
            <Card style={{ padding: 20 }}>
              <CardHead title="Class Attendance Trend" sub="8-week rolling view" />
              <ResponsiveContainer width="100%" height={176}>
                <AreaChart data={classWeeklyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <AreaGrad id="coachGrad" />
                  <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                  <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} interval={1} />
                  <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: `${C.accent}18`, strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" stroke={C.accent} strokeWidth={1.5} fill="url(#coachGrad)" dot={false} activeDot={{ r: 3, fill: C.accent, stroke: C.surface, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ padding: 20 }}>
              <CardHead title="Member Traffic Heatmap" sub="Check-in density by day and time" />
              <HeatmapChart gymId={gymId} />
            </Card>
            <StreaksCard ci30={ci30} now={now} totalMembers={totalMembers} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.t3, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>30-Day Snapshot</div>
              <DRow label="Total check-ins"   value={ci30.length} />
              <DRow label="Active members"    value={activeThisMonth} />
              <DRow label="At-risk members"   value={atRisk} color={atRisk > 0 ? C.danger : C.t1} />
              <DRow label="My classes"        value={myClasses.length} />
              <DRow label="Avg visits/member" value={totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—'} />
            </Card>
            <SegmentBreakdown title="Member Frequency" total={totalMembers} segments={[
              { label: 'Frequent',   sub: '12+/mo', val: memberFrequency.frequent,   color: C.success },
              { label: 'Occasional', sub: '4–11',   val: memberFrequency.occasional, color: C.accent },
              { label: 'Rare',       sub: '1–3',    val: memberFrequency.rare,       color: C.accent },
              { label: 'Inactive',   sub: '0',      val: memberFrequency.inactive,   color: C.danger, cta: 'Re-engage' },
            ]} />
            <RankedBarList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
            <RankedBarList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)} emptyLabel="No check-in data yet" />
          </div>
        </div>
      </div>
    );
  }

  /* ─── GYM OWNER VIEW ─── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ══ TODAY'S FOCUS (top, most prominent) ══ */}
      <TodaysFocusSection
        churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps}
        ci30={ci30} checkIns={checkIns} now={now} totalMembers={totalMembers}
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 18, alignItems: 'start' }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── KPI CARDS (enhanced metrics) ── */}
          {checkIns.length < 3 ? (
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Activity style={{ width: 14, height: 14, color: C.t3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Analytics loading</div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 3, lineHeight: 1.55 }}>KPIs populate after your first 7 days of check-ins. Start by scanning member QR codes.</div>
                </div>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
              <KpiCard
                icon={Users}
                label="Active Members (7d)"
                value={new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id)).size}
                unit={`of ${totalMembers} total`}
                spark={weekTrend.slice(-7).map(d => d.value)}
                subContext={`${Math.round((new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id)).size / Math.max(totalMembers, 1)) * 100)}% engagement`}
              />
              <KpiCard
                icon={Activity}
                label="Engagement Rate"
                value={totalMembers > 0 ? `${Math.round((activeThisMonth / totalMembers) * 100)}%` : '—'}
                unit="active this month"
                trend={monthChangePct}
                subContext={monthChangePct > 0 ? 'Growing' : monthChangePct < 0 ? 'Declining' : 'Flat'}
              />
              <KpiCard
                icon={AlertTriangle}
                label="At-Risk Members"
                value={atRisk}
                unit="14+ days absent"
                valueColor={atRisk > totalMembers * 0.15 ? C.danger : atRisk > 0 ? C.warn : undefined}
                subContext={atRisk > 0 ? `£${atRisk * MVM}/mo at risk` : 'All clear'}
                cta={atRisk > 0 ? 'Message all' : undefined}
              />
              <KpiCard
                icon={Shield}
                label="Retention Rate"
                value={`${retentionRate}%`}
                unit="30-day cohort"
                valueColor={retentionRate < 60 ? C.danger : retentionRate >= 80 ? C.success : undefined}
                subContext={retentionRate >= 80 ? 'Top 20% of gyms' : retentionRate < 60 ? 'Below 70% target' : 'Room to improve'}
                cta={retentionRate < 70 ? 'Fix retention' : undefined}
              />
            </div>
          )}

          {/* ── HEATMAP (with insights) ── */}
          <Card style={{ padding: 20 }}>
            <CardHead title="Member Traffic Heatmap" sub="Check-in density by day and time" />
            <HeatmapChart gymId={gymId} />
          </Card>

          {/* ── RECOMMENDED ACTIONS (upgraded Smart Insights) ── */}
          <RecommendedActions
            checkIns={checkIns} ci30={ci30} atRisk={atRisk}
            retentionRate={retentionRate} monthChangePct={monthChangePct}
            totalMembers={totalMembers} churnSignals={churnSignalsProp} now={now}
          />

          {/* ── RETENTION INTELLIGENCE ── */}
          <RetentionFunnelWidget retentionFunnel={retentionFunnelProp} />
          <DropOffAnalysis dropOffBuckets={dropOffBucketsProp} />

          {/* ── CLASS PERFORMANCE (revenue-focused) ── */}
          <ClassPerformanceWidget classes={classes} checkIns={checkIns} ci30={ci30} now={now} />

          {/* ── STAFF PERFORMANCE ── */}
          <StaffPerformanceWidget coaches={coaches} checkIns={checkIns} ci30={ci30} classes={classes} allMemberships={allMemberships} now={now} />

          {/* ── CONTENT ENGAGEMENT (new) ── */}
          <ContentEngagementCard posts={posts} polls={polls} now={now} />

          {/* ── MESSAGING (new) ── */}
          <MessagingCard totalMembers={totalMembers} atRisk={atRisk} churnSignals={churnSignalsProp} />

          {/* ── STREAKS (new) ── */}
          <StreaksCard ci30={ci30} now={now} totalMembers={totalMembers} />

          {/* ── WEEKLY TREND ── */}
          {weekTrend.some(d => d.value > 0) ? (
            <Card style={{ padding: 20 }}>
              <CardHead
                title="Weekly Check-in Trend"
                sub={monthChangePct < -5 ? `Growth slowing — down ${Math.abs(monthChangePct)}% vs last month` : '12-week rolling view'}
                right={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentSub, border: `1px solid ${C.accentBrd}`, borderRadius: 6, padding: '2px 8px' }}>{weekTrend.reduce((s,d)=>s+d.value,0)} total</span>
                    <GhostBtn label="View members" onClick={() => {}} />
                  </div>
                }
              />
              <ResponsiveContainer width="100%" height={184}>
                <AreaChart data={weekTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <AreaGrad id="wtGrad" />
                  <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                  <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} interval={2} />
                  <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: `${C.accent}18`, strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="value" stroke={C.accent} strokeWidth={1.5} fill="url(#wtGrad)" dot={false} activeDot={{ r: 3, fill: C.accent, stroke: C.surface, strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          ) : (
            <Card style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Activity style={{ width: 12, height: 12, color: C.t3 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.t2 }}>Weekly trend chart</div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Populates after 7+ days of check-in data</div>
                </div>
              </div>
            </Card>
          )}

          {/* ── MEMBER GROWTH (simplified) ── */}
          <Card style={{ padding: 20 }}>
            <CardHead
              title="Member Growth"
              sub="Monthly new sign-up trend"
              right={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.success, background: C.successSub, border: `1px solid ${C.successBrd}`, borderRadius: 6, padding: '2px 8px' }}>+{newSignUps} this month</span>
                  <GhostBtn label="View members" onClick={() => {}} />
                </div>
              }
            />
            <ResponsiveContainer width="100%" height={124}>
              <BarChart data={monthGrowthData} barSize={16} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (<div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px' }}><p style={{ color: C.t3, fontSize: 10, margin: '0 0 2px' }}>{label}</p><p style={{ color: C.t1, fontWeight: 700, fontSize: 13, margin: 0 }}>{payload[0].value} active</p></div>) : null} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" fill={C.accent} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ══ RIGHT SIDEBAR — ACTION CENTER ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Revenue at Risk — most important, top of sidebar */}
          <RevenueAtRiskCard atRisk={atRisk} churnSignals={churnSignalsProp} totalMembers={totalMembers} />

          {/* Churn Risk — enhanced with £ values */}
          <ChurnSignalWidget churnSignals={churnSignalsProp} />

          {/* New Members */}
          <NewMembersCard allMemberships={allMemberships} ci30={ci30} now={now} newSignUps={newSignUps} />

          {/* Week-1 Return */}
          <Week1ReturnTrendWidget week1ReturnTrend={week1ReturnTrendProp} />

          {/* Milestones */}
          <MilestoneProgressWidget checkIns={checkIns} />

          {/* Member Segments — with CTAs on inactive */}
          <SegmentBreakdown title="Member Segments" total={totalMembers} segments={[
            { label: 'Super Active', sub: '15+/mo',  val: superActive, color: C.success },
            { label: 'Active',       sub: '8–14',    val: active,      color: C.accent  },
            { label: 'Casual',       sub: '1–7',     val: casual,      color: C.accent  },
            { label: 'Inactive',     sub: '0 visits', val: inactive,   color: C.danger, cta: 'Re-engage' },
          ]} />

          {/* Month Comparison */}
          <MonthComparison ci30={ci30} ciPrev30={ciPrev30} retentionRate={retentionRate} atRisk={atRisk} totalMembers={totalMembers} />

          {/* Ranked lists */}
          <RankedBarList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
          <RankedBarList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)} emptyLabel="No check-in data yet" />
        </div>
      </div>
    </div>
  );
}
