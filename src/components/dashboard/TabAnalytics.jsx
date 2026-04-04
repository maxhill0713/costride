/**
 * TabAnalytics — Gym Operating System (Calm Edition)
 *
 * HIERARCHY RULES:
 *  1. Today's Focus — max 3 cards. ONE can be red. Others are neutral/blue.
 *  2. Core KPIs — clean, scan-friendly. No CTAs. No color on values unless threshold.
 *  3. Churn & Revenue Risk — single combined panel. ONE strong CTA.
 *  4. Trends & Analytics — pure insight. Zero alerts.
 *  5. Behaviour & Performance — subtle. No aggressive badges.
 *  6. Action Queue — ONLY 2–3 items. Each with £ impact.
 *
 * COLOR DISCIPLINE:
 *  - Red (danger) → used at most ONCE per viewport. True urgency only.
 *  - Warn (amber) → at most once per section. "Needs attention" not "at risk".
 *  - Accent (blue) → interactive, CTAs, active states only.
 *  - Green (success) → only when a threshold is crossed positively.
 *  - t1/t2/t3 → everything else. Silence = safety.
 *
 * LANGUAGE RULES:
 *  - Never repeat "at risk" more than once per page.
 *  - Use: "needs attention", "low engagement", "opportunity", "drop-off", "quiet members".
 *  - Revenue £ shown ONCE per section — in the combined risk panel only.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, differenceInDays, subDays, isWithinInterval } from 'date-fns';
import {
  Activity, TrendingUp, TrendingDown, Users, Zap, ArrowUpRight,
  Calendar, Clock, AlertTriangle, Shield, Target, Award,
  UserPlus, Sparkles, BarChart2, RefreshCw, CheckCircle,
  Send, ChevronRight, PenSquare,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid,
  XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
} from 'recharts';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const MVM = 40; // Estimated £ monthly value per member

/* ─────────────────────────────────────────────────────────────────
   CHART PRIMITIVES
───────────────────────────────────────────────────────────────── */
const tick = { fill: C.t3, fontSize: 10, fontFamily: 'system-ui, sans-serif' };

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px', boxShadow: '0 6px 20px rgba(0,0,0,.5)' }}>
      <p style={{ color: C.t3, fontSize: 10, margin: '0 0 2px' }}>{label}</p>
      <p style={{ color: C.t1, fontWeight: 700, fontSize: 14, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
};

const AreaGrad = ({ id }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stopColor={C.accent} stopOpacity={0.18} />
      <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
    </linearGradient>
  </defs>
);

function Spark({ data = [], w = 58, h = 24 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 3 - ((v - min) / range) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const firstX = pts.split(' ')[0].split(',')[0];
  const lastX  = pts.split(' ').slice(-1)[0].split(',')[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.accent} stopOpacity=".15" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polygon points={`${firstX},${h} ${pts} ${lastX},${h}`} fill="url(#spk)" />
      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DESIGN PRIMITIVES
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
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function DRow({ label, value, color, sub, last = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: last ? 'none' : `1px solid ${C.divider}` }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: 8 }}>
      <Icon style={{ width: 16, height: 16, color: C.t4 }} />
      <span style={{ fontSize: 11, color: C.t3 }}>{label}</span>
    </div>
  );
}

/** Primary CTA — accent fill. Used sparingly. */
function Cta({ label, icon: Icon, onClick, full = false }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      padding: '7px 14px', borderRadius: 7, background: C.accent, color: '#fff',
      border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
      fontFamily: 'inherit', width: full ? '100%' : undefined, transition: 'opacity .1s',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {Icon && <Icon style={{ width: 10, height: 10 }} />}{label}
    </button>
  );
}

/** Ghost/secondary link — text-only inline action */
function TextLink({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 10.5, fontWeight: 600, color: C.accent, background: 'none',
      border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
    }}>
      {label} <ChevronRight style={{ width: 9, height: 9 }} />
    </button>
  );
}

/** Muted status pill — never colored, just informational */
function MutedPill({ label }) {
  return (
    <span style={{ fontSize: 9.5, fontWeight: 600, padding: '2px 7px', borderRadius: 5, color: C.t3, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TODAY'S FOCUS
   ─────────────────────────────────────────────────────────────
   Rules:
   - Max 3 cards.
   - EXACTLY ONE card may use danger (red). The rest use neutral/accent.
   - No impact pill — one short insight line is enough.
   - CTA only on the danger card and the most actionable neutral card.
   - Language: no "at risk" — use "needs attention", "quiet members", etc.
═══════════════════════════════════════════════════════════════ */
function TodaysFocus({ churnSignals = [], atRisk = 0, newSignUps = 0, ci30 = [], now, totalMembers = 0 }) {
  const cards = useMemo(() => {
    const list = [];
    let dangerUsed = false;

    /* ── 1. Most critical: churn or high inactivity ── */
    if (churnSignals.length > 0) {
      const weeks3 = churnSignals.filter(m => m.daysSince >= 21).length;
      list.push({
        slot: 'danger',
        icon: AlertTriangle,
        title: `${churnSignals.length} quiet members`,
        insight: weeks3 > 0
          ? `${weeks3} haven't visited in 3+ weeks — worth a personal message`
          : 'Engagement has dropped — a check-in usually brings half back',
        cta: 'Message now',
        rev: churnSignals.length * MVM,
      });
      dangerUsed = true;
    } else if (atRisk > 0) {
      list.push({
        slot: 'danger',
        icon: AlertTriangle,
        title: `${atRisk} members need attention`,
        insight: 'No check-in in 14+ days — drop-off risk increases after 3 weeks',
        cta: 'Review',
        rev: atRisk * MVM,
      });
      dangerUsed = true;
    }

    /* ── 2. New member engagement ── */
    const activeThisWeek = new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id));
    const newInactive = Math.max(0, newSignUps - activeThisWeek.size);
    if (newInactive > 0) {
      list.push({
        slot: 'neutral',
        icon: UserPlus,
        title: `${newInactive} new members not active yet`,
        insight: 'First visit within 7 days doubles week-4 retention',
        cta: 'Send welcome',
      });
    }

    /* ── 3. Positive or opportunity card ── */
    const retWeek = ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).length;
    const prevWeek = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return d > 7 && d <= 14; }).length;
    if (prevWeek > 0 && retWeek >= prevWeek * 1.1) {
      list.push({
        slot: 'positive',
        icon: TrendingUp,
        title: 'Check-ins up this week',
        insight: `${retWeek} visits vs ${prevWeek} last week — good momentum`,
        cta: null,
      });
    } else {
      list.push({
        slot: 'neutral',
        icon: Calendar,
        title: 'Evening slots have capacity',
        insight: '6–8pm is typically underused — a targeted post or promotion can fill it',
        cta: null,
      });
    }

    return list.slice(0, 3);
  }, [churnSignals, atRisk, newSignUps, ci30, now, totalMembers]);

  /* Visual treatment per slot */
  const slotStyle = {
    danger:   { border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.danger}`,   iconColor: C.danger },
    warn:     { border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.warn}`,     iconColor: C.warn   },
    neutral:  { border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.borderEl}`, iconColor: C.t3     },
    positive: { border: `1px solid ${C.border}`, borderLeft: `2px solid ${C.success}`,  iconColor: C.success},
  };

  if (!cards.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          Today's Focus
        </span>
        <span style={{ fontSize: 10, color: C.t4 }}>· {format(new Date(), 'EEE d MMM')}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: 10 }}>
        {cards.map((card, i) => {
          const s = slotStyle[card.slot] || slotStyle.neutral;
          return (
            <div key={i} style={{ ...s, background: C.surfaceEl, borderRadius: CARD_RADIUS, padding: '14px 16px', boxShadow: CARD_SHADOW }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: card.cta ? 12 : 0 }}>
                {/* Icon — no colored container, just the glyph */}
                <card.icon style={{ width: 13, height: 13, color: s.iconColor, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1, marginBottom: 4 }}>{card.title}</div>
                  <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>{card.insight}</div>
                  {/* Revenue footnote — only on the danger card, small and muted */}
                  {card.slot === 'danger' && card.rev > 0 && (
                    <div style={{ fontSize: 10, color: C.t3, marginTop: 5 }}>
                      ~£{card.rev}/month if unaddressed
                    </div>
                  )}
                </div>
              </div>
              {card.cta && <Cta label={card.cta} onClick={() => {}} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CORE KPI STRIP
   Rules:
   - Clean and scannable — no CTAs, no colored values unless threshold.
   - Trend badge is the ONLY color element per card.
   - Spark chart for context, not alarm.
═══════════════════════════════════════════════════════════════ */
function KpiStrip({ totalMembers, activeThisMonth, atRisk, retentionRate, monthChangePct, ci30, now, weekTrend }) {
  const active7d = useMemo(() =>
    new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id)).size
  , [ci30, now]);

  const engagePct = totalMembers > 0 ? Math.round((activeThisMonth / totalMembers) * 100) : 0;
  const sparkData = weekTrend.slice(-7).map(d => d.value);

  const kpis = [
    {
      icon: Users,
      label: 'Active members (7d)',
      value: active7d,
      unit: `of ${totalMembers} total`,
      spark: sparkData,
      trend: null,
      sub: active7d > 0 ? `${Math.round((active7d / Math.max(totalMembers, 1)) * 100)}% of members` : null,
    },
    {
      icon: Activity,
      label: 'Engagement rate',
      value: `${engagePct}%`,
      unit: 'active this month',
      trend: monthChangePct,
      sub: monthChangePct > 0 ? 'Growing' : monthChangePct < 0 ? 'Declining' : 'Flat',
    },
    {
      icon: Shield,
      label: 'Retention rate',
      value: `${retentionRate}%`,
      unit: '30-day cohort',
      trend: null,
      valueColor: retentionRate >= 80 ? C.success : retentionRate < 60 ? C.danger : undefined,
      sub: retentionRate >= 80 ? 'Strong' : retentionRate < 60 ? 'Needs attention' : 'Average',
    },
    {
      icon: AlertTriangle,
      label: 'Inactive members',
      value: atRisk,
      unit: '14+ days absent',
      trend: null,
      /* Only color the value if it represents a meaningful share of membership */
      valueColor: atRisk > totalMembers * 0.2 ? C.danger : undefined,
      sub: atRisk > 0 ? `${Math.round((atRisk / Math.max(totalMembers, 1)) * 100)}% of members` : 'All clear',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 10 }}>
      {kpis.map((k, i) => {
        const trendUp   = k.trend > 0;
        const trendDown = k.trend < 0;
        const tColor    = trendUp ? C.success : trendDown ? C.danger : C.t3;
        return (
          <div key={i} style={{ borderRadius: CARD_RADIUS, padding: '16px 18px', background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.12em', textTransform: 'uppercase' }}>{k.label}</span>
              <k.icon style={{ width: 12, height: 12, color: C.t3 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: k.valueColor || C.t1, lineHeight: 1, letterSpacing: '-0.04em' }}>{k.value}</div>
                {k.unit && <div style={{ fontSize: 10.5, color: C.t3, marginTop: 4 }}>{k.unit}</div>}
              </div>
              {k.spark && <Spark data={k.spark} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {k.trend != null && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 5, fontSize: 9.5, fontWeight: 600, color: tColor, background: trendUp ? C.successSub : trendDown ? C.dangerSub : 'rgba(255,255,255,.04)', border: `1px solid ${trendUp ? C.successBrd : trendDown ? C.dangerBrd : C.border}` }}>
                  {trendUp ? <ArrowUpRight style={{ width: 8, height: 8 }} /> : trendDown ? <TrendingDown style={{ width: 8, height: 8 }} /> : null}
                  {trendUp ? '+' : ''}{k.trend}%
                </span>
              )}
              {k.sub && <span style={{ fontSize: 10, color: C.t3 }}>{k.sub}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHURN & REVENUE RISK  — single combined panel
   Rules:
   - ONE card for churn + revenue, not two separate ones.
   - £ figure shown here and NOWHERE else on the page.
   - ONE strong CTA: "Review members"
   - Member list is compact, not alarming.
═══════════════════════════════════════════════════════════════ */
function ChurnRevenuePanel({ churnSignals = [], atRisk = 0, totalMembers = 0 }) {
  const totalRev      = churnSignals.length * MVM;
  const churnCount    = churnSignals.length;
  const riskLabel     = s => s >= 90 ? 'Critical' : s >= 70 ? 'High' : s >= 50 ? 'Medium' : 'Low';
  const hasData       = churnCount > 0;

  return (
    <Card style={{ padding: 20 }}>
      {/* Header — revenue shown once, small */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Churn & Revenue Risk</div>
          <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>Members showing low engagement patterns</div>
        </div>
        {hasData && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.danger, letterSpacing: '-0.03em', lineHeight: 1 }}>
              £{totalRev}
            </div>
            <div style={{ fontSize: 9.5, color: C.t3, marginTop: 2 }}>est. monthly exposure</div>
          </div>
        )}
      </div>

      {!hasData ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
          <CheckCircle style={{ width: 11, height: 11, color: C.success, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>No churn signals detected</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>All tracked members showing healthy engagement</div>
          </div>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.danger, letterSpacing: '-0.03em' }}>{churnCount}</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>quiet members</div>
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em' }}>
                {totalMembers > 0 ? `${Math.round((churnCount / totalMembers) * 100)}%` : '—'}
              </div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>of membership</div>
            </div>
          </div>

          {/* Member list — compact, no per-row color */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 16 }}>
            {churnSignals.slice(0, 5).map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < Math.min(churnSignals.length, 5) - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.t4, width: 40 }}>{riskLabel(m.score)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{m.name}</span>
                </div>
                <span style={{ fontSize: 10, color: C.t3 }}>
                  {m.daysSince < 999 ? `${m.daysSince}d ago` : 'No visits'}
                </span>
              </div>
            ))}
          </div>

          {/* Single strong CTA */}
          <Cta label="Review members" icon={ChevronRight} full onClick={() => {}} />
        </>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEATMAP  (original logic, calmer header)
═══════════════════════════════════════════════════════════════ */
function HeatmapChart({ gymId }) {
  const [weeks, setWeeks] = React.useState(4);
  const { data: raw = [] } = useQuery({
    queryKey: ['heatmapCI', gymId, weeks],
    queryFn: () => {
      if (weeks === 0) return base44.entities.CheckIn.filter({ gym_id: gymId }, '-check_in_date', 5000);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - weeks * 7);
      return base44.entities.CheckIn.filter({ gym_id: gymId, check_in_date: { $gte: cutoff.toISOString() } }, '-check_in_date', 5000);
    },
    enabled: !!gymId, staleTime: 5 * 60 * 1000,
  });

  const days  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = [
    { label: '6–8a',  hours: [6,7]   }, { label: '8–10a',  hours: [8,9]   },
    { label: '10–12', hours: [10,11] }, { label: '12–2p',  hours: [12,13] },
    { label: '2–4p',  hours: [14,15] }, { label: '4–6p',   hours: [16,17] },
    { label: '6–8p',  hours: [18,19] }, { label: '8–10p',  hours: [20,21] },
  ];

  const grid = useMemo(() => {
    const mat = Array.from({ length: 7 }, () => Array(slots.length).fill(0));
    raw.forEach(c => {
      const d = new Date(c.check_in_date), dow = (d.getDay() + 6) % 7, h = d.getHours();
      const si = slots.findIndex(s => s.hours.includes(h));
      if (si >= 0) mat[dow][si]++;
    });
    return mat;
  }, [raw]);

  const maxVal = Math.max(...grid.flat(), 1);
  let peakDay = 0, peakSlot = 0;
  grid.forEach((row, di) => row.forEach((val, si) => { if (val > grid[peakDay][peakSlot]) { peakDay = di; peakSlot = si; } }));

  const cell = (val, di, si) => {
    const pct    = val / maxVal;
    const isPeak = di === peakDay && si === peakSlot && val > 0;
    if (!val)       return { bg: C.divider,       brd: C.border,         txt: 'transparent' };
    if (isPeak)     return { bg: C.accent,         brd: C.accent,         txt: '#fff' };
    if (pct < 0.25) return { bg: `${C.accent}14`, brd: `${C.accent}22`, txt: C.t3 };
    if (pct < 0.5)  return { bg: `${C.accent}30`, brd: `${C.accent}44`, txt: C.t2 };
    if (pct < 0.75) return { bg: `${C.accent}60`, brd: `${C.accent}80`, txt: C.t1 };
    return               { bg: `${C.accent}cc`, brd: C.accent,           txt: '#fff' };
  };

  /* Evening usage check — informational only, no alert language */
  const eveningTotal = grid.reduce((s, row) => s + row[6] + row[7], 0);
  const morningTotal = grid.reduce((s, row) => s + row[0] + row[1], 0);
  const eveningNote  = raw.length > 20 && eveningTotal < morningTotal * 0.6;

  return (
    <div>
      {/* Soft insight line above grid */}
      {raw.length > 20 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 10.5, color: C.t2 }}>
            Peak: <span style={{ color: C.t1, fontWeight: 600 }}>{days[peakDay]} {slots[peakSlot]?.label}</span>
          </span>
          {eveningNote && (
            <span style={{ fontSize: 10, color: C.t3 }}>· Evenings have capacity to fill</span>
          )}
        </div>
      )}

      {/* Period tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 12 }}>
        {[{ l: '4W', v: 4 }, { l: '12W', v: 12 }, { l: 'All', v: 0 }].map(o => (
          <button key={o.v} onClick={() => setWeeks(o.v)} style={{ fontSize: 10.5, fontWeight: weeks === o.v ? 600 : 400, padding: '4px 10px', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', background: weeks === o.v ? C.surfaceEl : 'transparent', color: weeks === o.v ? C.t1 : C.t3, border: `1px solid ${weeks === o.v ? C.borderEl : 'transparent'}`, transition: 'all .1s' }}>
            {o.l}
          </button>
        ))}
        <span style={{ fontSize: 10, color: C.t3, marginLeft: 6 }}>{raw.length.toLocaleString()} check-ins</span>
      </div>

      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, marginBottom: 3 }}>
        <div />
        {slots.map(s => <div key={s.label} style={{ fontSize: 9, color: C.t3, textAlign: 'center' }}>{s.label}</div>)}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {days.map((day, di) => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: C.t2 }}>{day}</div>
            {grid[di].map((val, si) => {
              const { bg, brd, txt } = cell(val, di, si);
              return (
                <div key={si} title={val > 0 ? `${day} ${slots[si].label}: ${val}` : undefined} style={{ height: 28, borderRadius: 5, background: bg, border: `1px solid ${brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {val > 0 && <span style={{ fontSize: 9, fontWeight: 600, color: txt }}>{val}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 10 }}>
        <span style={{ fontSize: 9, color: C.t3 }}>Low</span>
        {[C.divider, `${C.accent}14`, `${C.accent}40`, `${C.accent}80`, C.accent].map((bg, i) => (
          <div key={i} style={{ width: 11, height: 6, borderRadius: 2, background: bg }} />
        ))}
        <span style={{ fontSize: 9, color: C.t3 }}>High</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RETENTION FUNNEL  — calm, analytical
═══════════════════════════════════════════════════════════════ */
function RetentionFunnel({ retentionFunnel = [] }) {
  const icons   = [UserPlus, RefreshCw, Activity, CheckCircle];
  const hasData = retentionFunnel.length > 0 && retentionFunnel[0]?.val > 0;

  const worstDrop = useMemo(() => {
    if (!hasData) return null;
    let worst = null, worstPct = 0;
    retentionFunnel.forEach((stage, i) => {
      if (i === 0) return;
      const conv = retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : 100;
      const drop = 100 - conv;
      if (drop > worstPct) { worstPct = drop; worst = { label: stage.label, drop }; }
    });
    return worst;
  }, [retentionFunnel, hasData]);

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Retention Funnel"
        sub={worstDrop ? `Biggest drop-off: ${worstDrop.label} (${worstDrop.drop}% lost)` : 'Member lifecycle progression'}
        right={<Target style={{ width: 12, height: 12, color: C.t3 }} />}
      />
      {!hasData ? (
        <div style={{ padding: '10px 12px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.t3 }}>Populates after members have joined and checked in.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {retentionFunnel.map((stage, i) => {
            const Icon  = icons[i] || CheckCircle;
            const pct   = retentionFunnel[0].val > 0 ? Math.round((stage.val / retentionFunnel[0].val) * 100) : 0;
            const conv  = i > 0 && retentionFunnel[i-1].val > 0 ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : null;
            const isWorst = conv !== null && worstDrop?.label === stage.label;
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: 11, height: 11, color: C.t3 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{stage.label}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em' }}>{stage.val}</span>
                        <span style={{ fontSize: 10, color: C.t3 }}>{pct}%</span>
                      </div>
                    </div>
                    {stage.desc && <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{stage.desc}</div>}
                  </div>
                </div>
                {i < retentionFunnel.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 42, marginBottom: 2 }}>
                    <div style={{ width: 1, height: 12, background: C.border }} />
                    {conv !== null && (
                      <span style={{ fontSize: 9, color: isWorst ? C.warn : C.t3, fontWeight: isWorst ? 600 : 400 }}>
                        {conv}% continued · {100 - conv}% dropped{isWorst ? ' ← biggest gap' : ''}
                      </span>
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

/* ═══════════════════════════════════════════════════════════════
   DROP-OFF ANALYSIS  — analytical, no alarm
═══════════════════════════════════════════════════════════════ */
function DropOffChart({ dropOffBuckets = [] }) {
  const total = dropOffBuckets.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  const worst = [...dropOffBuckets].sort((a, b) => b.count - a.count)[0];

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Drop-off Pattern"
        sub={`Most members go quiet at ${worst?.label || '—'} — a well-timed message recovers ~30%`}
      />
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={dropOffBuckets} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={22}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (<div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px' }}><p style={{ color: C.t3, fontSize: 10, margin: '0 0 2px' }}>{label}</p><p style={{ color: C.t1, fontWeight: 700, fontSize: 13, margin: 0 }}>{payload[0].value}</p></div>) : null} cursor={{ fill: 'rgba(255,255,255,.02)' }} />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {dropOffBuckets.map((d, i) => (
              <Cell key={i} fill={d.label === worst?.label ? C.accent : `${C.accent}50`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {dropOffBuckets.filter(d => d.count > 0).sort((a, b) => b.count - a.count).map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < dropOffBuckets.filter(x => x.count > 0).length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <span style={{ flex: 1, fontSize: 11, color: i === 0 ? C.t1 : C.t2, fontWeight: i === 0 ? 600 : 400 }}>{d.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: i === 0 ? C.accent : C.t3 }}>{d.count}</span>
            <span style={{ fontSize: 10, color: C.t3, minWidth: 28, textAlign: 'right' }}>{Math.round((d.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WEEKLY TREND  — pure analytics, no alerts
═══════════════════════════════════════════════════════════════ */
function WeeklyTrendChart({ weekTrend = [], monthChangePct = 0, newSignUps = 0, monthGrowthData = [] }) {
  if (!weekTrend.some(d => d.value > 0)) return null;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Check-in Trend"
        sub="12-week rolling view"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MutedPill label={`${weekTrend.reduce((s,d)=>s+d.value,0)} total`} />
            {monthChangePct !== 0 && (
              <span style={{ fontSize: 10, fontWeight: 600, color: monthChangePct > 0 ? C.success : C.danger }}>
                {monthChangePct > 0 ? '+' : ''}{monthChangePct}% vs last month
              </span>
            )}
          </div>
        }
      />
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={weekTrend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <AreaGrad id="wtg" />
          <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} interval={2} />
          <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={26} allowDecimals={false} />
          <Tooltip content={<ChartTip />} cursor={{ stroke: `${C.accent}18`, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Area type="monotone" dataKey="value" stroke={C.accent} strokeWidth={1.5} fill="url(#wtg)" dot={false} activeDot={{ r: 3, fill: C.accent, stroke: C.surface, strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* Member Growth */
function MemberGrowthChart({ monthGrowthData = [], newSignUps = 0, retentionRate = 0 }) {
  if (!monthGrowthData?.length) return null;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Member Growth"
        sub="Monthly sign-ups"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.success, background: C.successSub, border: `1px solid ${C.successBrd}`, borderRadius: 5, padding: '2px 7px' }}>+{newSignUps} this month</span>
          </div>
        }
      />
      <ResponsiveContainer width="100%" height={110}>
        <BarChart data={monthGrowthData} barSize={14} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
          <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} />
          <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={26} allowDecimals={false} />
          <Tooltip content={({ active, payload, label }) => active && payload?.length ? (<div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px' }}><p style={{ color: C.t3, fontSize: 10, margin: '0 0 2px' }}>{label}</p><p style={{ color: C.t1, fontWeight: 700, fontSize: 13, margin: 0 }}>{payload[0].value}</p></div>) : null} cursor={{ fill: 'rgba(255,255,255,.02)' }} />
          <Bar dataKey="value" fill={C.accent} fillOpacity={0.7} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CLASS PERFORMANCE  — subtle, no badges
═══════════════════════════════════════════════════════════════ */
function ClassPerformance({ classes, ci30, now }) {
  const data = useMemo(() => (classes || []).map(cls => {
    const clsCI    = ci30.filter(c => c.class_id === cls.id || c.class_name === cls.name);
    const cap      = cls.max_capacity || cls.capacity || 20;
    const sessions = Math.max(4, Math.ceil(clsCI.length / Math.max(cap * 0.5, 1)));
    const avgAtt   = sessions > 0 ? Math.round(clsCI.length / sessions) : 0;
    const fillRate = Math.min(100, Math.round((avgAtt / cap) * 100));
    const first15  = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d > 15; }).length;
    const last15   = ci30.filter(c => { const d = differenceInDays(now, new Date(c.check_in_date)); return (c.class_id === cls.id || c.class_name === cls.name) && d <= 15; }).length;
    const trend    = first15 === 0 ? 0 : Math.round(((last15 - first15) / first15) * 100);
    return { ...cls, avgAtt, fillRate, trend, cap };
  }).sort((a, b) => b.fillRate - a.fillRate), [classes, ci30, now]);

  if (!data.length) return null;

  /* Color only at meaningful thresholds — no intermediate coloring */
  const fillColor = r => r >= 75 ? C.success : r < 35 ? C.danger : C.t2;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Class Performance" sub="Fill rates and attendance · last 30 days" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {data.map((cls, i) => (
          <div key={cls.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: fillColor(cls.fillRate), flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{cls.name}</span>
              {cls.trend !== 0 && (
                <span style={{ fontSize: 9, fontWeight: 600, color: cls.trend > 0 ? C.success : C.t3 }}>
                  {cls.trend > 0 ? '+' : ''}{cls.trend}%
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 10, color: C.t3 }}>~{cls.avgAtt}/{cls.cap}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: fillColor(cls.fillRate) }}>{cls.fillRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAFF PERFORMANCE  — clean table, no per-row color noise
═══════════════════════════════════════════════════════════════ */
function StaffPerformance({ coaches, checkIns, ci30, classes, now }) {
  const data = useMemo(() => (coaches || []).map(coach => {
    const coachCI      = ci30.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
    const uniqueMembers = new Set(coachCI.map(c => c.user_id)).size;
    const coachedIds   = new Set(coachCI.map(c => c.user_id));
    const retained     = [...coachedIds].filter(id => {
      const last = checkIns.filter(c => c.user_id === id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
      return last && differenceInDays(now, new Date(last.check_in_date)) <= 14;
    }).length;
    const retentionPct = coachedIds.size > 0 ? Math.round((retained / coachedIds.size) * 100) : 0;
    const myClasses    = (classes || []).filter(c => c.instructor === coach.name || c.coach_id === coach.id);
    const score        = Math.min(100, Math.round((retentionPct * 0.5) + (Math.min(uniqueMembers / 20, 1) * 100 * 0.3) + (Math.min(myClasses.length / 5, 1) * 100 * 0.2)));
    return { ...coach, uniqueMembers, retentionPct, myClasses, score };
  }).sort((a, b) => b.score - a.score), [coaches, checkIns, ci30, classes, now]);

  if (!data.length) return null;

  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const retColor = s => s >= 70 ? C.success : s < 45 ? C.danger : C.t2;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Staff Performance" sub="Engagement score, members coached and retention" />

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px', gap: 8, padding: '0 0 6px', borderBottom: `1px solid ${C.divider}`, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>Coach</div>
        {['Members','Classes','Retain'].map(h => <div key={h} style={{ fontSize: 9, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'center' }}>{h}</div>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((coach, i) => (
          <div key={coach.id || i} style={{ padding: '9px 10px', borderRadius: 8, background: i === 0 ? C.surfaceEl : 'transparent', border: `1px solid ${i === 0 ? C.borderEl : 'transparent'}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 52px 52px', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, color: C.t2, overflow: 'hidden' }}>
                  {coach.avatar_url ? <img src={coach.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini(coach.name)}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{coach.name}</div>
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>Score {coach.score}</div>
                </div>
              </div>
              {[coach.uniqueMembers, coach.myClasses.length].map((v, j) => (
                <div key={j} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: C.t1 }}>{v}</div>
              ))}
              <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: retColor(coach.retentionPct) }}>
                {coach.retentionPct}%
              </div>
            </div>
            <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: C.t3 }}>Score</span>
              <div style={{ flex: 1, height: 2, borderRadius: 2, background: C.divider }}>
                <div style={{ width: `${coach.score}%`, height: '100%', borderRadius: 2, background: coach.score < 45 ? C.danger : C.accent, opacity: 0.65 }} />
              </div>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: coach.score < 45 ? C.danger : C.t2 }}>{coach.score}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER SEGMENTS  — calm breakdown
═══════════════════════════════════════════════════════════════ */
function MemberSegments({ totalMembers, superActive, active, casual, inactive }) {
  const segs = [
    { label: 'Super active',  sub: '15+/mo',  val: superActive, color: C.success },
    { label: 'Active',        sub: '8–14',    val: active,      color: C.accent  },
    { label: 'Casual',        sub: '1–7',     val: casual,      color: C.t3      },
    { label: 'Disengaged',    sub: '0 visits', val: inactive,    color: inactive > totalMembers * 0.25 ? C.danger : C.t3 },
  ];
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Member Segments" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {segs.map((s, i) => {
          const pct = totalMembers > 0 ? Math.round((s.val / totalMembers) * 100) : 0;
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < segs.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: C.t2 }}>{s.label}</span>
                <span style={{ fontSize: 9.5, color: C.t3 }}>{s.sub}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{s.val}</span>
                <span style={{ fontSize: 9.5, color: C.t3, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACTION QUEUE  — sidebar, max 3 items
   Rules:
   - ONLY 2–3 items.
   - Each explains what to do + why (impact).
   - No repeated revenue numbers — just brief context.
═══════════════════════════════════════════════════════════════ */
function ActionQueue({ churnSignals = [], atRisk = 0, newSignUps = 0, ci30 = [], now, retentionRate = 0 }) {
  const actions = useMemo(() => {
    const list = [];

    if (churnSignals.length > 0) {
      list.push({
        icon: Send,
        title: `Message ${churnSignals.length} quiet members`,
        impact: `Save ~£${churnSignals.length * MVM}/month`,
        cta: 'Message all',
      });
    } else if (atRisk > 0) {
      list.push({
        icon: Send,
        title: `Reach out to ${atRisk} inactive members`,
        impact: `Personal messages recover 30–40%`,
        cta: 'Message now',
      });
    }

    const newInactive = Math.max(0, newSignUps - new Set(ci30.filter(c => differenceInDays(now, new Date(c.check_in_date)) <= 7).map(c => c.user_id)).size);
    if (newInactive > 0) {
      list.push({
        icon: UserPlus,
        title: `Welcome ${newInactive} new members`,
        impact: 'Week-1 contact doubles month-1 retention',
        cta: 'Send welcome',
      });
    }

    if (retentionRate < 65) {
      list.push({
        icon: Target,
        title: 'Fix onboarding flow',
        impact: `Retention at ${retentionRate}% — target is 70%+`,
        cta: 'Review funnel',
      });
    }

    return list.slice(0, 3);
  }, [churnSignals, atRisk, newSignUps, ci30, now, retentionRate]);

  if (!actions.length) return null;

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Zap style={{ width: 11, height: 11, color: C.t3 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Action Queue</span>
        <span style={{ fontSize: 10, color: C.t4, marginLeft: 'auto' }}>{actions.length} item{actions.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {actions.map((a, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, ...(i === 0 ? { borderLeft: `2px solid ${C.accent}` } : {}) }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 10 }}>
              <a.icon style={{ width: 11, height: 11, color: i === 0 ? C.accent : C.t3, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: C.t1, marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.45 }}>{a.impact}</div>
              </div>
            </div>
            <Cta label={a.cta} full onClick={() => {}} />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Remaining sidebar helpers ─────────────────────────────── */
function Week1ReturnCard({ week1ReturnTrend = [] }) {
  const data   = week1ReturnTrend;
  const latest = data[data.length - 1]?.pct || 0;
  const prev   = data[data.length - 2]?.pct  || 0;
  const delta  = latest - prev;
  const vColor = latest < 40 ? C.danger : latest >= 60 ? C.success : C.t1;
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Week-1 Return Rate" sub="New member cohort" right={
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: vColor, letterSpacing: '-0.03em' }}>{latest}%</span>
          {delta !== 0 && <span style={{ fontSize: 9.5, fontWeight: 600, color: delta > 0 ? C.success : C.danger }}>{delta > 0 ? '+' : ''}{delta}%</span>}
        </div>
      } />
      {data.length >= 2 && (
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs><linearGradient id="w1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={0.15} /><stop offset="100%" stopColor={C.accent} stopOpacity={0} /></linearGradient></defs>
            <Area type="monotone" dataKey="pct" stroke={C.accent} strokeWidth={1.5} fill="url(#w1g)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
      <div style={{ marginTop: 8, fontSize: 10, color: vColor, lineHeight: 1.45 }}>
        {latest < 40 ? 'Below target — follow up with new members in week 1'
          : latest < 60 ? 'Room to improve — a personal welcome message helps'
          : 'Strong week-1 return'}
      </div>
    </Card>
  );
}

function MilestoneCard({ checkIns }) {
  const milestones = useMemo(() => {
    const acc = {};
    checkIns.forEach(c => { if (!acc[c.user_name]) acc[c.user_name] = 0; acc[c.user_name]++; });
    return Object.entries(acc).map(([name, total]) => {
      const next = [10, 25, 50, 100, 200, 500].find(n => n > total) || null;
      return { name, total, next, toNext: next ? next - total : 0 };
    }).filter(m => m.next && m.toNext <= 5).sort((a, b) => a.toNext - b.toNext).slice(0, 4);
  }, [checkIns]);
  if (!milestones.length) return null;
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Award style={{ width: 11, height: 11, color: C.t3 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Upcoming Milestones</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {milestones.map((m, i) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < milestones.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, color: C.t2 }}>{m.total}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
              <div style={{ fontSize: 9.5, color: m.toNext === 1 ? C.accent : C.t3, marginTop: 1 }}>{m.toNext === 1 ? '1 visit away 🎯' : `${m.toNext} to ${m.next}`}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RankedList({ title, icon: Icon, items, emptyLabel }) {
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title={title} right={<Icon style={{ width: 11, height: 11, color: C.t3 }} />} />
      {items.every(d => !d.count)
        ? <Empty icon={Icon} label={emptyLabel || 'No data yet'} />
        : <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((h, i) => (
              <div key={h.label || h.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.t4, width: 13, textAlign: 'right', flexShrink: 0 }}>#{i+1}</span>
                  <span style={{ fontSize: 12, color: C.t1 }}>{h.label || h.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>{h.count}</span>
              </div>
            ))}
          </div>
      }
    </Card>
  );
}

function MonthCompare({ ci30, ciPrev30, retentionRate, atRisk }) {
  const thisActive = useMemo(() => new Set(ci30.map(c => c.user_id)).size, [ci30]);
  const prevActive = useMemo(() => ciPrev30?.length ? new Set(ciPrev30.map(c => c.user_id)).size : null, [ciPrev30]);
  const rows = [
    { label: 'Check-ins',      curr: ci30.length,        prev: ciPrev30?.length || 0, vColor: C.t1 },
    { label: 'Active members', curr: thisActive,          prev: prevActive,            vColor: C.t1 },
    { label: 'Retention',      curr: `${retentionRate}%`, prev: null,                  vColor: retentionRate < 60 ? C.danger : retentionRate >= 80 ? C.success : C.t1 },
    { label: 'Low engagement', curr: atRisk,              prev: null,                  vColor: atRisk > 0 ? C.warn : C.t1 },
  ];
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Month Comparison" sub="This vs last month" />
      {rows.map((r, i) => {
        const diff = r.prev !== null && typeof r.curr === 'number' ? r.curr - r.prev : null;
        const up   = diff > 0, dn = diff < 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <span style={{ fontSize: 12, color: C.t2 }}>{r.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {diff !== null && diff !== 0 && (
                <span style={{ fontSize: 9, fontWeight: 600, color: up ? C.success : C.danger, background: up ? C.successSub : C.dangerSub, border: `1px solid ${up ? C.successBrd : C.dangerBrd}`, padding: '1px 5px', borderRadius: 4 }}>
                  {up ? '+' : ''}{diff}
                </span>
              )}
              <span style={{ fontSize: 13, fontWeight: 600, color: r.vColor }}>{r.curr}</span>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
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
  posts = [], polls = [],
}) {
  const now = new Date();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn);
  }, []);

  const weekTrend   = weekTrendProp.length  > 0 ? weekTrendProp   : [];
  const busiestDays = busiestDaysProp.length > 0 ? busiestDaysProp : [];
  const peakHours   = peakHoursProp.length  > 0 ? peakHoursProp   : [];

  const superActive = engagementSegments.superActive ?? (monthCiPer || []).filter(v => v >= 15).length;
  const active      = engagementSegments.active      ?? (monthCiPer || []).filter(v => v >= 8 && v < 15).length;
  const casual      = engagementSegments.casual      ?? (monthCiPer || []).filter(v => v >= 1 && v < 8).length;
  const inactive    = engagementSegments.inactive    ?? Math.max(0, totalMembers - (monthCiPer || []).length);

  /* ── Coach view ── */
  if (isCoach) {
    const classWeeklyTrend = Array.from({ length: 8 }, (_, i) => {
      const s = subDays(now, (7 - i) * 7), e = subDays(now, (6 - i) * 7);
      return { label: format(s, 'MMM d'), value: checkIns.filter(c => isWithinInterval(new Date(c.check_in_date), { start: s, end: e })).length };
    });
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <TodaysFocus churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} totalMembers={totalMembers} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 264px', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <KpiStrip totalMembers={totalMembers} activeThisMonth={activeThisMonth} atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct} ci30={ci30} now={now} weekTrend={weekTrend} />
            <Card style={{ padding: 20 }}>
              <CardHead title="Class Attendance Trend" sub="8-week view" />
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={classWeeklyTrend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <AreaGrad id="cag" />
                  <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                  <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} interval={1} />
                  <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={26} allowDecimals={false} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="value" stroke={C.accent} strokeWidth={1.5} fill="url(#cag)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ padding: 20 }}>
              <CardHead title="Traffic Heatmap" sub="Check-in density by time and day" />
              <HeatmapChart gymId={gymId} />
            </Card>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ActionQueue churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps} ci30={ci30} now={now} retentionRate={retentionRate} />
            <MemberSegments totalMembers={totalMembers} superActive={superActive} active={active} casual={casual} inactive={inactive} />
            <RankedList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
            <RankedList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)} emptyLabel="No check-in data yet" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Gym owner view ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── 1. TODAY'S FOCUS ── */}
      <TodaysFocus
        churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps}
        ci30={ci30} now={now} totalMembers={totalMembers}
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 272px', gap: 18, alignItems: 'start' }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── 2. CORE KPI STRIP ── */}
          {checkIns.length >= 3 ? (
            <KpiStrip
              totalMembers={totalMembers} activeThisMonth={activeThisMonth}
              atRisk={atRisk} retentionRate={retentionRate}
              monthChangePct={monthChangePct} ci30={ci30} now={now} weekTrend={weekTrend}
            />
          ) : (
            <Card style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity style={{ width: 13, height: 13, color: C.t3, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>KPIs loading</div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 2, lineHeight: 1.5 }}>Metrics populate after your first 7 days of check-ins.</div>
                </div>
              </div>
            </Card>
          )}

          {/* ── 3. CHURN & REVENUE RISK (single combined panel) ── */}
          <ChurnRevenuePanel churnSignals={churnSignalsProp} atRisk={atRisk} totalMembers={totalMembers} />

          {/* ── 4. TRENDS & ANALYTICS (calm zone — no alerts) ── */}
          <WeeklyTrendChart weekTrend={weekTrend} monthChangePct={monthChangePct} newSignUps={newSignUps} />
          <MemberGrowthChart monthGrowthData={monthGrowthData} newSignUps={newSignUps} retentionRate={retentionRate} />
          <RetentionFunnel retentionFunnel={retentionFunnelProp} />
          <DropOffChart dropOffBuckets={dropOffBucketsProp} />

          {/* ── 5. BEHAVIOUR ── */}
          <Card style={{ padding: 20 }}>
            <CardHead title="Traffic Heatmap" sub="Check-in density by day and time" />
            <HeatmapChart gymId={gymId} />
          </Card>

          {/* ── 6. PERFORMANCE ── */}
          <ClassPerformance classes={classes} ci30={ci30} now={now} />
          <StaffPerformance coaches={coaches} checkIns={checkIns} ci30={ci30} classes={classes} now={now} />

        </div>

        {/* ══ RIGHT SIDEBAR ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── 7. ACTION QUEUE — top of sidebar, max 3 ── */}
          <ActionQueue
            churnSignals={churnSignalsProp} atRisk={atRisk} newSignUps={newSignUps}
            ci30={ci30} now={now} retentionRate={retentionRate}
          />

          <Week1ReturnCard week1ReturnTrend={week1ReturnTrendProp} />
          <MilestoneCard checkIns={checkIns} />
          <MemberSegments totalMembers={totalMembers} superActive={superActive} active={active} casual={casual} inactive={inactive} />
          <MonthCompare ci30={ci30} ciPrev30={ciPrev30} retentionRate={retentionRate} atRisk={atRisk} />
          <RankedList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
          <RankedList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)} emptyLabel="No check-in data" />

        </div>
      </div>
    </div>
  );
}
