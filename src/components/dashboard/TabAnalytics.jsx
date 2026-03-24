/**
 * TabAnalytics — Redesigned Color System & Visual Hierarchy
 *
 * ══════════════════════════════════════════════════════════════════
 * DESIGN SYSTEM REFERENCE
 * ══════════════════════════════════════════════════════════════════
 *
 * PHILOSOPHY: "Color = Meaning. Silence = Safety."
 * Inspired by Linear, Stripe Dashboard, Raycast.
 *
 * ── COLOR RULES (non-negotiable) ─────────────────────────────────
 *
 * 1. ONE brand accent (#5179ff). Used ONLY for:
 *    - Interactive / selected states
 *    - Chart primary data series
 *    - Focus rings and active nav items
 *    - CTA buttons
 *    NEVER for decorative purposes.
 *
 * 2. THREE semantic colors:
 *    - danger (#e0524a) → At-risk members, churn signals, drops >10%
 *    - success (#38b27a) → Thresholds crossed (retention ≥70%, 0 at-risk)
 *    - warn (#d4893a) → Caution states (used extremely rarely)
 *    RULE: A metric number gets semantic color ONLY if it requires action.
 *    A 72% retention rate is t1 (neutral) + a success badge. It doesn't
 *    need green text — the number itself communicates the win.
 *
 * 3. FOUR neutral text levels:
 *    t1 (#dde3ed) → Primary content, metric values, headings
 *    t2 (#7a8ea8) → Labels, secondary info, table headers
 *    t3 (#3f5068) → Muted, timestamps, supporting text
 *    t4 (#243040) → Ghost, decorative, disabled
 *
 * ── ELEMENTS THAT MUST NEVER USE COLOR ───────────────────────────
 *    - Card backgrounds (always surface)
 *    - Border lines (always border/divider — neutral only)
 *    - Icon containers on cards (neutral only, no color bg)
 *    - Metric labels / row labels
 *    - Chart axis labels
 *    - Navigation item text (unless active)
 *
 * ── GRADIENT / GLOW RULES ────────────────────────────────────────
 *    REMOVED: Inset top glow lines on cards
 *    REMOVED: Colored box shadows
 *    REMOVED: Gradient top-border accent lines on KPI cards
 *    REMOVED: Colored icon container backgrounds on KPI cards
 *    KEPT: Chart area fill gradients (single color only, opacity decay)
 *    KEPT: Subtle card box-shadow (neutral only, depth only)
 *
 * ── FOCUS-FIRST PRINCIPLE ────────────────────────────────────────
 *    Max 2 colored elements per viewport section.
 *    The churn/risk number is red → everything else is neutral.
 *    The active chart line is blue → axes and labels are grey.
 *    An alert insight has a 2px red left border → no red background.
 *
 * ── BEFORE → AFTER EXAMPLES ──────────────────────────────────────
 *
 *  KPI CARD (before):
 *    - Blue gradient top line
 *    - Blue icon in blue-tinted container
 *    - Large number in blue
 *    - Green/red trend badge
 *    → Result: 4 competing colored elements on 1 small card
 *
 *  KPI CARD (after):
 *    - No top line
 *    - Monochrome icon (t3)
 *    - Large number in t1 (white)
 *    - Only the trend badge uses semantic color
 *    → Result: 1 colored element. Eye goes straight to the trend.
 *
 *  MEMBER TAG (before):
 *    - "Active" → green background, green text
 *    - "Casual" → blue background, blue text
 *    - "At Risk" → red background, red text
 *    → All compete equally
 *
 *  MEMBER TAG (after):
 *    - "Active" → neutral surface, t2 text (not exciting — that's correct)
 *    - "Casual" → neutral surface, t3 text
 *    - "At Risk" → danger tint, danger text (ONLY this one stands out)
 *    → Eye immediately finds the risk. Other states recede.
 *
 * ── TAILWIND-EQUIVALENT TOKENS ───────────────────────────────────
 *    bg-base:       #090e1a    (body background)
 *    bg-surface:    #0d1525    (card background)
 *    bg-surface-el: #111c2e    (hover / elevated)
 *    border:        rgba(255,255,255,0.065)
 *    border-hi:     rgba(255,255,255,0.11)
 *    text-primary:  #dde3ed
 *    text-secondary:#7a8ea8
 *    text-muted:    #3f5068
 *    accent:        #5179ff
 *    danger:        #e0524a
 *    success:       #38b27a
 * ══════════════════════════════════════════════════════════════════
 */

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

/* ══════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   Single source of truth. Every style value comes from here.
   No magic numbers. No inline colors outside this object.
══════════════════════════════════════════════════════════════════ */
const C = {
  // ── Backgrounds ─────────────────────────────────────────────────
  bg:         '#090e1a',          // Page body
  surface:    '#0d1525',          // Cards, panels
  surfaceEl:  '#111c2e',          // Hover, elevated, selected rows

  // ── Borders & dividers (neutral ONLY — never colored) ───────────
  border:     'rgba(255,255,255,0.065)',
  borderEl:   'rgba(255,255,255,0.11)',
  divider:    'rgba(255,255,255,0.038)',

  // ── Text scale (4 levels, no more) ──────────────────────────────
  t1:  '#dde3ed',   // Primary — metric values, headings
  t2:  '#7a8ea8',   // Secondary — labels, descriptions
  t3:  '#3f5068',   // Muted — timestamps, supporting copy
  t4:  '#243040',   // Ghost — decorative, disabled, rank numbers

  // ── Brand accent (1 color — interactive + data only) ────────────
  // Used for: chart lines, active states, CTA, heatmap fills
  // NOT used for: decorative card accents, random labels
  accent:    '#5179ff',
  accentSub: 'rgba(81,121,255,0.08)',
  accentBrd: 'rgba(81,121,255,0.18)',

  // ── Semantic: Danger (action required) ──────────────────────────
  // Used for: at-risk members, churn signals, drops >10%, week-1 low
  danger:    '#e0524a',
  dangerSub: 'rgba(224,82,74,0.07)',
  dangerBrd: 'rgba(224,82,74,0.18)',

  // ── Semantic: Success (threshold crossed) ───────────────────────
  // Used for: retention ≥70%, 0 at-risk, strong return rate
  // NOT used for: routine healthy metrics (use t1 instead)
  success:    '#38b27a',
  successSub: 'rgba(56,178,122,0.07)',
  successBrd: 'rgba(56,178,122,0.16)',

  // ── Semantic: Warn (caution — used sparingly) ────────────────────
  warn:    '#d4893a',
  warnSub: 'rgba(212,137,58,0.07)',
};

/* ── Axis tick style — always muted, never colored ─────────────── */
const tick = { fill: C.t3, fontSize: 10, fontFamily: 'Geist, system-ui, sans-serif' };

/* ══════════════════════════════════════════════════════════════════
   PRIMITIVE COMPONENTS
   These enforce the design system at the lowest level.
══════════════════════════════════════════════════════════════════ */

/**
 * Card — clean surface, no glows, no gradient highlights.
 * Border is always neutral. Color never leaks in here.
 */
function Card({ children, style = {} }) {
  return (
    <div style={{
      background:   C.surface,
      border:       `1px solid ${C.border}`,
      borderRadius: 12,
      boxShadow:    '0 1px 3px rgba(0,0,0,0.35)',
      overflow:     'hidden',
      position:     'relative',
      ...style,
    }}>
      {children}
    </div>
  );
}

/**
 * CardHead — title is always t1/t2. Never colored.
 * The right-side slot handles optional action elements.
 */
function CardHead({ title, sub, right }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     sub ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      marginBottom:   16,
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, letterSpacing: '-0.005em' }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

/**
 * DRow — data row. Value gets semantic color only if meaning requires it.
 * Labels are always t2 (neutral). Dividers are hairline.
 */
function DRow({ label, value, color, sub }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '8px 0',
      borderBottom:   `1px solid ${C.divider}`,
    }}>
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

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize:      10,
      fontWeight:    600,
      color:         C.t3,
      textTransform: 'uppercase',
      letterSpacing: '.1em',
      marginBottom:  10,
    }}>
      {children}
    </div>
  );
}

/* ── Chart tooltip — always dark, minimal ────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:  '#060c18',
      border:      `1px solid ${C.borderEl}`,
      borderRadius: 8,
      padding:     '7px 11px',
      boxShadow:   '0 6px 20px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: C.t3, fontSize: 10, fontWeight: 500, margin: '0 0 2px', letterSpacing: '.03em' }}>{label}</p>
      <p style={{ color: C.t1, fontWeight: 700, fontSize: 14, margin: 0 }}>{payload[0].value}</p>
    </div>
  );
};

/* ── Sparkline — accent color only ──────────────────────────────── */
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
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-fill)" />
      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KPI CARD
   BEFORE: Gradient top line + colored icon box + colored value + trend badge
           → 4 competing colored elements per card
   AFTER:  No top line. Monochrome icon. t1 value. 1 semantic trend badge.
           → 1 colored element. Attention goes to the number and trend.
══════════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, label, value, unit, trend, spark, subContext, valueColor }) {
  const trendUp   = trend > 0;
  const trendDown = trend < 0;
  const trendColor = trendUp ? C.success : trendDown ? C.danger : C.t3;

  return (
    <div style={{
      borderRadius: 12,
      padding:      '16px 18px',
      background:   C.surface,
      border:       `1px solid ${C.border}`,
      boxShadow:    '0 1px 3px rgba(0,0,0,0.35)',
      display:      'flex',
      flexDirection: 'column',
      // NO gradient top line. NO colored border.
    }}>
      {/* Label row — icon is always muted, never colored */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.t3, letterSpacing: '.04em' }}>{label}</span>
        {/* Icon: no colored container, just the glyph at t3 */}
        <Icon style={{ width: 13, height: 13, color: C.t3 }} />
      </div>

      {/* Value + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          {/* Value is t1 by default. Pass valueColor only for danger/success thresholds. */}
          <div style={{
            fontSize:      30,
            fontWeight:    700,
            color:         valueColor || C.t1,
            lineHeight:    1,
            letterSpacing: '-0.04em',
          }}>
            {value}
          </div>
          {unit && <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>{unit}</div>}
        </div>
        {spark && <Spark data={spark} />}
      </div>

      {/* Footer — only the trend badge carries color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 'auto' }}>
        {trend != null && (
          <span style={{
            display:    'inline-flex',
            alignItems: 'center',
            gap:        3,
            padding:    '2px 6px',
            borderRadius: 6,
            fontSize:   10,
            fontWeight: 600,
            color:      trendColor,
            background: trendUp ? C.successSub : trendDown ? C.dangerSub : 'rgba(255,255,255,0.04)',
            border:     `1px solid ${trendUp ? C.successBrd : trendDown ? C.dangerBrd : C.border}`,
          }}>
            {trendUp
              ? <ArrowUpRight style={{ width: 9, height: 9 }} />
              : trendDown
              ? <TrendingDown style={{ width: 9, height: 9 }} />
              : null}
            {trendUp ? '+' : ''}{trend}%
          </span>
        )}
        {subContext && <span style={{ fontSize: 10, color: C.t3 }}>{subContext}</span>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HEATMAP CHART
   BEFORE: Period buttons used accent bg/border. Peak cell was red (danger color
           used decoratively). Five color stops competed visually.
   AFTER:  Period buttons are plain text tabs. Peak cell is accent at full
           intensity (still distinct but not semantically alarming).
           Gradient uses accent only.
══════════════════════════════════════════════════════════════════ */
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
    { label: '6–8a',  hours: [6,7]   }, { label: '8–10a',  hours: [8,9]   },
    { label: '10–12', hours: [10,11] }, { label: '12–2p',  hours: [12,13] },
    { label: '2–4p',  hours: [14,15] }, { label: '4–6p',   hours: [16,17] },
    { label: '6–8p',  hours: [18,19] }, { label: '8–10p',  hours: [20,21] },
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

  /**
   * Cell color logic: single-hue accent gradient.
   * Peak gets full accent (not red — red = danger, not "most popular").
   * Empty cells get the divider color.
   */
  const cellStyle = (val, di, si) => {
    const pct = val / maxVal;
    const isPeak = di === peakDay && si === peakSlot && val > 0;
    if (!val)     return { bg: C.divider,       brd: C.border,               textColor: 'transparent' };
    if (isPeak)   return { bg: C.accent,         brd: C.accent,               textColor: '#fff' };
    if (pct < 0.25) return { bg: `${C.accent}14`, brd: `${C.accent}22`,       textColor: C.t3 };
    if (pct < 0.5)  return { bg: `${C.accent}30`, brd: `${C.accent}44`,       textColor: C.t2 };
    if (pct < 0.75) return { bg: `${C.accent}60`, brd: `${C.accent}80`,       textColor: C.t1 };
    return                 { bg: `${C.accent}cc`, brd: C.accent,               textColor: '#fff' };
  };

  return (
    <div>
      {/* Period toggle — plain tab style, not colored pill buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 14 }}>
        {[{ l: '4W', v: 4 }, { l: '12W', v: 12 }, { l: 'All', v: 0 }].map(o => (
          <button
            key={o.v}
            onClick={() => setWeeks(o.v)}
            style={{
              fontSize:    11,
              fontWeight:  weeks === o.v ? 600 : 400,
              padding:     '4px 10px',
              borderRadius: 6,
              cursor:      'pointer',
              fontFamily:  'inherit',
              background:  weeks === o.v ? C.surfaceEl : 'transparent',
              color:       weeks === o.v ? C.t1 : C.t3,
              border:      `1px solid ${weeks === o.v ? C.borderEl : 'transparent'}`,
              transition:  'all .12s',
            }}
          >
            {o.l}
          </button>
        ))}
        <span style={{ fontSize: 10, color: C.t3, marginLeft: 6 }}>{heatmapCheckIns.length.toLocaleString()} check-ins</span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, marginBottom: 4 }}>
        <div />
        {slots.map(s => (
          <div key={s.label} style={{ fontSize: 9, fontWeight: 500, color: C.t3, textAlign: 'center' }}>{s.label}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {days.map((day, di) => (
          <div
            key={day}
            style={{ display: 'grid', gridTemplateColumns: `44px repeat(${slots.length}, 1fr)`, gap: 3, alignItems: 'center' }}
          >
            <div style={{ fontSize: 11, fontWeight: 500, color: C.t2 }}>{day}</div>
            {grid[di].map((val, si) => {
              const { bg, brd, textColor } = cellStyle(val, di, si);
              return (
                <div
                  key={si}
                  title={val > 0 ? `${day} ${slots[si].label}: ${val}` : undefined}
                  style={{
                    height:         30,
                    borderRadius:   6,
                    background:     bg,
                    border:         `1px solid ${brd}`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    transition:     'background .12s',
                  }}
                >
                  {val > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: textColor }}>{val}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer — peak info in muted accent, gradient legend */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        marginTop:      12,
        paddingTop:     12,
        borderTop:      `1px solid ${C.divider}`,
      }}>
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

/* ══════════════════════════════════════════════════════════════════
   RETENTION FUNNEL
   BEFORE: Every icon in a blue-tinted container. Conversion badges colored.
   AFTER:  Icons are neutral. Only drop-off > 40% gets a danger badge.
           Everything else: neutral text.
══════════════════════════════════════════════════════════════════ */
function RetentionFunnelWidget({ retentionFunnel = [] }) {
  const icons  = [UserPlus, RefreshCw, Activity, CheckCircle];
  const hasData = retentionFunnel.length > 0 && retentionFunnel[0]?.val > 0;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Retention Funnel"
        sub="Member lifecycle — where people drop off"
        right={<Target style={{ width: 12, height: 12, color: C.t3 }} />}
      />
      {!hasData ? (
        <div style={{ padding: '11px 13px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55 }}>
            Funnel populates once members have joined and checked in.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {retentionFunnel.map((stage, i) => {
            const Icon = icons[i] || CheckCircle;
            const pct  = retentionFunnel[0].val > 0 ? Math.round((stage.val / retentionFunnel[0].val) * 100) : 0;
            const conv = i > 0 && retentionFunnel[i-1].val > 0
              ? Math.round((stage.val / retentionFunnel[i-1].val) * 100) : null;
            const drop = conv !== null ? 100 - conv : 0;
            const isBadDrop = drop > 40;

            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                  {/* Icon — always neutral, no color container */}
                  <div style={{
                    width:          30,
                    height:         30,
                    borderRadius:   8,
                    flexShrink:     0,
                    background:     C.surfaceEl,
                    border:         `1px solid ${C.border}`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                  }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 8 }}>
                        {/* Only bad drop-offs get semantic color */}
                        <span style={{
                          fontSize:   9,
                          fontWeight: 600,
                          padding:    '1px 6px',
                          borderRadius: 5,
                          color:      isBadDrop ? C.danger : C.t3,
                          background: isBadDrop ? C.dangerSub : 'transparent',
                          border:     `1px solid ${isBadDrop ? C.dangerBrd : C.border}`,
                        }}>
                          {conv}% converted
                        </span>
                        {drop > 0 && (
                          <span style={{ fontSize: 9, color: C.t3 }}>{drop}% lost</span>
                        )}
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

/* ══════════════════════════════════════════════════════════════════
   DROP-OFF ANALYSIS
   BEFORE: Bars in 3 different colors (red/blue/t3). "Highest" badge.
   AFTER:  All bars in accent. Only Week 1 (most critical) gets danger.
           Removes the "Highest" badge — the bar height already communicates rank.
══════════════════════════════════════════════════════════════════ */
function DropOffAnalysis({ dropOffBuckets = [] }) {
  const total = dropOffBuckets.reduce((s, d) => s + d.count, 0);

  // Chart data: accent for all, danger only for Week 1 (critical early churn)
  const data = dropOffBuckets.map(b => ({
    ...b,
    barColor: b.label === 'Week 1' ? C.danger : C.accent,
  }));

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Drop-off Analysis"
        sub="Where members go quiet by lifecycle stage"
        right={
          total > 0 ? (
            <span style={{
              fontSize:   11,
              fontWeight: 600,
              padding:    '2px 8px',
              borderRadius: 6,
              color:      C.danger,
              background: C.dangerSub,
              border:     `1px solid ${C.dangerBrd}`,
            }}>
              {total} at risk
            </span>
          ) : null
        }
      />
      {total === 0 ? (
        <div style={{ padding: '10px 13px', borderRadius: 8, background: C.successSub, border: `1px solid ${C.successBrd}` }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: C.success }}>No significant drop-off patterns detected</div>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={96}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
              <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={tick} axisLine={false} tickLine={false} width={22} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px' }}>
                      <p style={{ color: C.t3, fontSize: 10, margin: '0 0 2px' }}>{label}</p>
                      <p style={{ color: C.t1, fontWeight: 700, fontSize: 13, margin: 0 }}>{payload[0].value} members</p>
                    </div>
                  ) : null
                }
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {data.map((d, i) => <Cell key={i} fill={d.barColor} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...data].filter(d => d.count > 0).sort((a, b) => b.count - a.count).map((d, i) => {
              const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
              return (
                <div key={i} style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         8,
                  padding:     '6px 10px',
                  borderRadius: 8,
                  // No colored backgrounds — neutral rows
                  background:  i === 0 ? C.surfaceEl : 'transparent',
                  border:      `1px solid ${i === 0 ? C.borderEl : 'transparent'}`,
                }}>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? C.t1 : C.t2 }}>
                    {d.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: d.barColor }}>{d.count}</span>
                  <span style={{ fontSize: 10, color: C.t3, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHURN SIGNAL TRACKER
   BEFORE: Per-row colored borders (red-ish for high risk, neutral for low).
           Risk label in colored pill. Score in colored text.
   AFTER:  All rows identical neutral border.
           Only the score number uses danger color for high-risk members.
           Risk label is a plain text tag (no background).
           RULE: tags like "Critical" / "High" / "Medium" → neutral.
                 Only the score number gets danger color.
══════════════════════════════════════════════════════════════════ */
function ChurnSignalWidget({ churnSignals = [] }) {
  const riskLabel = s => s >= 90 ? 'Critical' : s >= 70 ? 'High' : s >= 50 ? 'Medium' : 'Low';

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Churn Risk"
        sub="Scored by recency and visit frequency"
        right={
          churnSignals.length > 0 ? (
            <span style={{
              fontSize:   10,
              fontWeight: 600,
              padding:    '2px 8px',
              borderRadius: 6,
              color:      C.danger,
              background: C.dangerSub,
              border:     `1px solid ${C.dangerBrd}`,
            }}>
              {churnSignals.length} flagged
            </span>
          ) : null
        }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {churnSignals.map((m, i) => (
            /* All rows: same neutral border — no per-row risk-color leakage */
            <div key={i} style={{
              padding:      '9px 11px',
              borderRadius: 8,
              background:   i === 0 ? C.surfaceEl : 'transparent',
              border:       `1px solid ${i === 0 ? C.borderEl : C.divider}`,
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {/* Risk label: plain text, not a colored pill */}
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.t3 }}>{riskLabel(m.score)}</span>
                  <span style={{
                    fontSize:      11,
                    fontWeight:    600,
                    color:         C.t1,
                    overflow:      'hidden',
                    textOverflow:  'ellipsis',
                    whiteSpace:    'nowrap',
                  }}>
                    {m.name}
                  </span>
                </div>
                {m.freqDrop && m.prev30 > 0 && (
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>
                    {m.last30} vs {m.prev30} visits last month
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: C.t3 }}>
                  {m.daysSince < 999 ? `${m.daysSince}d ago` : 'No visits'}
                </span>
                {/* Score: danger color because it requires action */}
                <span style={{
                  fontSize:   13,
                  fontWeight: 700,
                  color:      m.score >= 50 ? C.danger : C.t2,
                  letterSpacing: '-0.02em',
                }}>
                  {m.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── Week-1 Return Trend ─────────────────────────────────────────── */
function Week1ReturnTrendWidget({ week1ReturnTrend = [] }) {
  const data   = week1ReturnTrend;
  const latest = data[data.length - 1]?.pct || 0;
  const prev   = data[data.length - 2]?.pct || 0;
  const delta  = latest - prev;

  // Only assign danger/success if threshold is crossed — otherwise t1
  const valueColor = latest < 40 ? C.danger : latest >= 60 ? C.success : C.t1;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead
        title="Week-1 Return Rate"
        sub="New member cohort trend"
        right={
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: valueColor, letterSpacing: '-0.04em' }}>{latest}%</span>
            {delta !== 0 && (
              <span style={{ fontSize: 10, fontWeight: 600, color: delta > 0 ? C.success : C.danger }}>
                {delta > 0 ? '+' : ''}{delta}%
              </span>
            )}
          </div>
        }
      />
      <ResponsiveContainer width="100%" height={56}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="w1g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accent} stopOpacity={0.18} />
              <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 7, padding: '5px 9px' }}>
                  <p style={{ color: C.t3, fontSize: 9, margin: '0 0 1px' }}>{label}</p>
                  <p style={{ color: C.t1, fontWeight: 700, fontSize: 12, margin: 0 }}>{payload[0].value}%</p>
                </div>
              ) : null
            }
            cursor={false}
          />
          <Area type="monotone" dataKey="pct" stroke={C.accent} strokeWidth={1.5} fill="url(#w1g)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      {/* Status note: plain text, no colored background box */}
      <div style={{ marginTop: 10 }}>
        <span style={{ fontSize: 10, color: valueColor }}>
          {latest < 40 ? '↓ Below target — follow up with new members in week 1'
            : latest < 60 ? '→ Room to improve — a personal welcome message helps'
            : '↑ Strong week-1 return rate'}
        </span>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SMART INSIGHTS
   BEFORE: Colored backgrounds on every insight card. Info insights in blue,
           danger in red, success in green — 3 colors at once.
   AFTER:  All insights have a neutral surface background.
           A 2px left border is the ONLY color signal.
           Info insights → no color at all (t3 left border).
           Danger insights → danger left border.
           Success → success left border.
           ONE color at a time. Eye is drawn to danger first.
══════════════════════════════════════════════════════════════════ */
function SmartInsightsPanel({ checkIns, ci30, allMemberships, atRisk, retentionRate, monthChangePct, totalMembers, now }) {
  const insights = useMemo(() => {
    const items = [];
    if (totalMembers < 5) {
      items.push({ type: 'info', icon: Users, label: `Only ${totalMembers} member${totalMembers === 1 ? '' : 's'} so far`, detail: `Analytics become meaningful at 10+ members.` });
      return items;
    }
    if (totalMembers < 10) {
      items.push({ type: 'info', icon: Users, label: `${totalMembers} members — growing`, detail: `Retention data becomes reliable at 10+ members.` });
    }
    if (totalMembers >= 10) {
      if (retentionRate < 60) {
        items.push({ type: 'danger', icon: AlertTriangle, label: `Retention at ${retentionRate}% — below 70% threshold`, detail: 'Focus on week-1 follow-ups and streak recovery messages.' });
      } else if (retentionRate >= 80) {
        items.push({ type: 'success', icon: CheckCircle, label: `Retention strong at ${retentionRate}%`, detail: "You're in the top 20% of gyms — keep your current engagement rhythm." });
      }
    }
    const atRiskPct = totalMembers > 0 ? Math.round((atRisk / totalMembers) * 100) : 0;
    if (atRiskPct >= 20) {
      items.push({ type: 'danger', icon: Zap, label: `${atRiskPct}% of members are at risk`, detail: 'Send a re-engagement push to everyone 14+ days inactive.' });
    }
    if (checkIns.length < 20) {
      items.push({ type: 'info', icon: Activity, label: 'Not enough check-in data yet', detail: 'Month-over-month comparisons populate after 7+ days of check-ins.' });
    } else if (monthChangePct < -10) {
      items.push({ type: 'danger', icon: TrendingDown, label: `Check-ins down ${Math.abs(monthChangePct)}% vs last month`, detail: 'Consider a new challenge or event to re-activate attendance.' });
    } else if (monthChangePct > 15) {
      items.push({ type: 'success', icon: TrendingUp, label: `Strong growth — up ${monthChangePct}% this month`, detail: 'Great momentum. Make sure your schedule can handle demand.' });
    }
    const visitRatio = totalMembers > 0 ? (ci30.length / 30) / totalMembers : 0;
    if (visitRatio < 0.05 && totalMembers > 10) {
      items.push({ type: 'info', icon: Activity, label: 'Visit frequency is low', detail: 'Less than 5% of members check in per day. Try promoting morning classes.' });
    }
    const weekendCI = checkIns.filter(c => [0,6].includes(new Date(c.check_in_date).getDay())).length;
    if (weekendCI / Math.max(checkIns.length,1) < 0.15 && checkIns.length > 50) {
      items.push({ type: 'info', icon: Calendar, label: 'Weekend attendance is low (<15% of visits)', detail: 'A weekend challenge or Saturday event could drive more footfall.' });
    }
    return items.slice(0, 4);
  }, [checkIns, ci30, atRisk, retentionRate, monthChangePct, totalMembers]);

  /* Color per insight type — border only, no background tint */
  const borderColor = { danger: C.danger, success: C.success, info: C.t4 };
  const iconColor   = { danger: C.danger, success: C.success, info: C.t3 };
  const labelColor  = { danger: C.t1,     success: C.t1,      info: C.t2 };

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <Sparkles style={{ width: 12, height: 12, color: C.t3 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Smart Insights</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {insights.length === 0 ? (
          <div style={{ padding: '9px 11px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.t2 }}>Your gym looks healthy — no critical signals</div>
          </div>
        ) : insights.map((s, i) => (
          <div key={i} style={{
            padding:      '9px 12px',
            borderRadius: 8,
            background:   C.surfaceEl,
            border:       `1px solid ${C.border}`,
            // 2px left border is the ONLY color on insight cards
            borderLeft:   `2px solid ${borderColor[s.type]}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
              <s.icon style={{ width: 11, height: 11, color: iconColor[s.type], flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: labelColor[s.type] }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 10, color: C.t3, paddingLeft: 18, lineHeight: 1.55 }}>{s.detail}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Class Performance ───────────────────────────────────────────── */
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
    return { ...cls, avgAtt, fillRate, trending, cap };
  }).sort((a, b) => b.fillRate - a.fillRate), [classes, ci30, now]);

  if (!classData.length) return null;

  // Fill rate: danger if < 40%, success if ≥ 75%, t2 otherwise
  const fillColor = rate => rate >= 75 ? C.success : rate < 40 ? C.danger : C.t2;

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Class Performance" sub="Fill rates and attendance (30 days)" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {classData.map((cls, i) => (
          <div key={cls.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < classData.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Status dot — neutral, not colored unless at a threshold */}
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: fillColor(cls.fillRate), flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{cls.name}</span>
              {cls.trending !== 0 && (
                <span style={{ fontSize: 9, fontWeight: 600, color: cls.trending > 0 ? C.success : C.danger }}>
                  {cls.trending > 0 ? '+' : ''}{cls.trending}%
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 10, color: C.t3 }}>~{cls.avgAtt} avg · cap {cls.cap}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: fillColor(cls.fillRate) }}>{cls.fillRate}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAFF PERFORMANCE
   BEFORE: Each coach card had a 3px left colored rank line. Gradient avatar
           background. "Top/Mid/Low Performer" badge in green/blue/red.
           Score displayed in colored text. → Massive color noise.
   AFTER:  No rank accent line. Plain circular avatar initial.
           Performer tier: neutral text, no badge colors.
           Score colored only for low performers (action required).
           High/mid performers: t1 score text (neutral — they're fine).
══════════════════════════════════════════════════════════════════ */
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
    const myClasses    = (classes || []).filter(c =>
      c.instructor === coach.name || c.instructor === coach.user_email ||
      c.coach_name === coach.name || c.coach_id === coach.id
    );
    const avgVisits    = uniqueMembers > 0 ? (coachCI.length / uniqueMembers).toFixed(1) : '—';
    const engagementScore = Math.min(100, Math.round(
      (retentionPct * 0.5) +
      (Math.min(uniqueMembers / 20, 1) * 100 * 0.3) +
      (Math.min(myClasses.length / 5, 1) * 100 * 0.2)
    ));
    return { ...coach, uniqueMembers, retentionPct, myClasses, avgVisits, engagementScore };
  }).sort((a, b) => b.engagementScore - a.engagementScore), [coaches, checkIns, ci30, classes, now]);

  if (!data.length) return null;

  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  // Score color: only low performers get danger. Others: t1.
  const scoreColor = s => s < 45 ? C.danger : C.t1;
  const retColor   = s => s >= 70 ? C.success : s < 50 ? C.danger : C.t2;
  const tierLabel  = s => s >= 70 ? 'Top' : s >= 45 ? 'Mid' : 'Low';

  return (
    <Card style={{ padding: 20 }}>
      <CardHead title="Staff Performance" sub="Coach engagement scores, retention impact & class load" />

      {/* Column headers */}
      <div style={{
        display:       'grid',
        gridTemplateColumns: '1fr 56px 56px 56px 64px',
        gap:           8,
        padding:       '0 0 8px',
        borderBottom:  `1px solid ${C.divider}`,
        marginBottom:  8,
      }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.09em' }}>Coach</div>
        {['Members','Classes','Avg','Retain'].map(h => (
          <div key={h} style={{ fontSize: 9, fontWeight: 600, color: C.t3, textTransform: 'uppercase', letterSpacing: '.09em', textAlign: 'center' }}>{h}</div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {data.map((coach, i) => (
          <div key={coach.id || i} style={{
            padding:      '10px 12px',
            borderRadius: 9,
            // NO left rank line. NO gradient. Top row: slightly elevated surface.
            background:   i === 0 ? C.surfaceEl : 'transparent',
            border:       `1px solid ${i === 0 ? C.borderEl : 'transparent'}`,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 56px 56px 64px', gap: 8, alignItems: 'center' }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <div style={{
                  width:          30,
                  height:         30,
                  borderRadius:   '50%',
                  flexShrink:     0,
                  overflow:       'hidden',
                  // Neutral avatar — no gradient, no color
                  background:     C.surfaceEl,
                  border:         `1px solid ${C.border}`,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:       10,
                  fontWeight:     700,
                  color:          C.t2,
                }}>
                  {coach.avatar_url
                    ? <img src={coach.avatar_url} alt={coach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : ini(coach.name)
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {coach.name}
                  </div>
                  {/* Tier: plain muted text, no badge */}
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>{tierLabel(coach.engagementScore)} Performer</div>
                </div>
              </div>

              {/* Members */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em' }}>{coach.uniqueMembers}</div>
              </div>

              {/* Classes */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em' }}>{coach.myClasses.length}</div>
              </div>

              {/* Avg visits */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em' }}>{coach.avgVisits}</div>
              </div>

              {/* Retention — semantic only when threshold crossed */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: retColor(coach.retentionPct), letterSpacing: '-0.03em' }}>
                  {coach.retentionPct}%
                </div>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: C.t3, flexShrink: 0 }}>Score</span>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: C.divider }}>
                <div style={{
                  width:        `${coach.engagementScore}%`,
                  height:       '100%',
                  borderRadius: 2,
                  // Bar color: only red if low performer
                  background:   scoreColor(coach.engagementScore) === C.danger ? C.danger : C.accent,
                  opacity:      0.7,
                }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: scoreColor(coach.engagementScore), flexShrink: 0 }}>
                {coach.engagementScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Coach Impact (sidebar compact) ─────────────────────────────── */
function CoachImpactWidget({ coaches, checkIns, ci30, allMemberships, now }) {
  const data = useMemo(() => (coaches || []).map(coach => {
    const coachCI       = ci30.filter(c => c.coach_id === coach.id || c.coach_name === coach.name);
    const uniqueMembers = new Set(coachCI.map(c => c.user_id)).size;
    const coachedIds    = new Set(coachCI.map(c => c.user_id));
    const retained      = [...coachedIds].filter(id => {
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {data.slice(0, 5).map((coach, i) => {
          const retColor = coach.retentionImpact >= 70 ? C.success : coach.retentionImpact < 50 ? C.danger : C.t2;
          return (
            <div key={coach.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < Math.min(data.length, 5) - 1 ? `1px solid ${C.divider}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.t4, width: 14, textAlign: 'right' }}>#{i+1}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{coach.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, color: C.t3 }}>{coach.uniqueMembers} members</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: retColor }}>{coach.retentionImpact}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Milestone Progress ──────────────────────────────────────────── */
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
            <div style={{
              width:          28,
              height:         28,
              borderRadius:   7,
              flexShrink:     0,
              background:     C.surfaceEl,
              border:         `1px solid ${C.border}`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       10,
              fontWeight:     700,
              color:          C.t2,
            }}>
              {m.total}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.name}
              </div>
              <div style={{ fontSize: 10, color: m.toNext === 1 ? C.accent : C.t3, marginTop: 1 }}>
                {m.toNext === 1 ? '1 visit to milestone 🎯' : `${m.toNext} visits to ${m.next}`}
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>{Math.round((m.total / m.next) * 100)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SEGMENT BREAKDOWN
   BEFORE: "Active" = green dot, "Casual" = blue dot, "Inactive" = red dot,
           "Super Active" = cyan dot → 4 competing colors in one small card.
   AFTER:  Strict 3-tier color rule:
           - Inactive → danger (requires action)
           - Frequent/Active → success (positive threshold)
           - Casual/Rare → t3 (neutral — not alarming, not exciting)
══════════════════════════════════════════════════════════════════ */
function SegmentBreakdown({ title, segments, total }) {
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title={title} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {segments.map((s, i) => {
          const pct = total > 0 ? Math.round((s.val / total) * 100) : 0;
          return (
            <div key={i} style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              padding:        '7px 0',
              borderBottom:   i < segments.length - 1 ? `1px solid ${C.divider}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {/* Semantic dot: danger only for inactive, success for frequent, t3 for others */}
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: C.t2 }}>{s.label}</span>
                {s.sub && <span style={{ fontSize: 9, color: C.t3 }}>{s.sub}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: 9, color: C.t3, minWidth: 24, textAlign: 'right' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── Ranked List (busiest days, peak hours) ──────────────────────── */
function RankedBarList({ title, icon: Icon, items, emptyLabel }) {
  return (
    <Card style={{ padding: 20 }}>
      <CardHead title={title} right={<Icon style={{ width: 12, height: 12, color: C.t3 }} />} />
      {items.every(d => !d.count)
        ? <Empty icon={Icon} label={emptyLabel || 'No data yet'} />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {items.map((h, i) => (
              <div key={h.label || h.name} style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '7px 0',
                borderBottom:   i < items.length - 1 ? `1px solid ${C.divider}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.t4, width: 14, textAlign: 'right', flexShrink: 0 }}>#{i+1}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>{h.label || h.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>{h.count}</span>
              </div>
            ))}
          </div>
        )
      }
    </Card>
  );
}

/* ── Vs-last-month badge ─────────────────────────────────────────── */
function VsBadge({ current, prev }) {
  if (!prev || prev === 0) return null;
  const diff = current - prev, pct = Math.round((diff / prev) * 100), up = diff > 0, flat = diff === 0;
  const color = flat ? C.t3 : up ? C.success : C.danger;
  return (
    <span style={{
      display:    'inline-flex',
      alignItems: 'center',
      gap:        3,
      fontSize:   9,
      fontWeight: 600,
      padding:    '2px 6px',
      borderRadius: 5,
      color,
      background: flat ? 'transparent' : up ? C.successSub : C.dangerSub,
      border:     `1px solid ${flat ? C.border : up ? C.successBrd : C.dangerBrd}`,
    }}>
      {flat ? '→' : up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

/* ── Month Comparison ────────────────────────────────────────────── */
function MonthComparison({ ci30, ciPrev30, retentionRate, atRisk, monthChangePct, totalMembers, now }) {
  const prevActive  = useMemo(() => ciPrev30?.length ? new Set(ciPrev30.map(c => c.user_id)).size : null, [ciPrev30]);
  const thisActive  = useMemo(() => new Set(ci30.map(c => c.user_id)).size, [ci30]);

  const rows = [
    { label: 'Check-ins',      curr: ci30.length,        prev: ciPrev30?.length || 0, valColor: C.t1 },
    { label: 'Active members', curr: thisActive,          prev: prevActive,            valColor: C.t1 },
    { label: 'Retention rate', curr: `${retentionRate}%`, prev: null, fmt: true,      valColor: retentionRate < 60 ? C.danger : retentionRate >= 80 ? C.success : C.t1 },
    { label: 'At-risk members',curr: atRisk,              prev: null,                  valColor: atRisk > 0 ? C.danger : C.t1 },
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
              <span style={{ fontSize: 13, fontWeight: 600, color: r.valColor }}>{r.curr}</span>
            </div>
          </div>
        ))}
      </div>
      {!ciPrev30?.length && (
        <div style={{ marginTop: 11, padding: '8px 10px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.5 }}>Comparison data populates after your first full month of check-ins.</div>
        </div>
      )}
    </Card>
  );
}

/* ── Chart gradient (shared) ─────────────────────────────────────── */
const AreaGrad = ({ id }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={C.accent} stopOpacity={0.2} />
      <stop offset="100%" stopColor={C.accent} stopOpacity={0} />
    </linearGradient>
  </defs>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT — TabAnalytics
══════════════════════════════════════════════════════════════════ */
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
  const dailyAvg    = dailyAvgProp || Math.round(ci30.length / 30);
  const returnRate  = returnRateProp || 0;
  const avgPerMem   = totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—';

  // Engagement segments
  const superActive = engagementSegments.superActive ?? (monthCiPer || []).filter(v => v >= 15).length;
  const active      = engagementSegments.active      ?? (monthCiPer || []).filter(v => v >= 8 && v < 15).length;
  const casual      = engagementSegments.casual      ?? (monthCiPer || []).filter(v => v >= 1 && v < 8).length;
  const inactive    = engagementSegments.inactive    ?? Math.max(0, totalMembers - (monthCiPer || []).length);

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
    return {
      frequent:   vals.filter(v => v >= 12).length,
      occasional: vals.filter(v => v >= 4 && v < 12).length,
      rare:       vals.filter(v => v >= 1 && v < 4).length,
      inactive:   Math.max(0, totalMembers - vals.length),
    };
  }, [isCoach, ci30, totalMembers]);

  /* ════════════════════════════════════════════════════════════════
     COACH VIEW
  ════════════════════════════════════════════════════════════════ */
  if (isCoach) return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 272px', gap: 18, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          <KpiCard icon={Activity}   label="Monthly Check-ins" value={ci30.length}     unit="this month"           trend={monthChangePct} />
          <KpiCard icon={Users}      label="Active Members"    value={activeThisMonth} unit={`of ${totalMembers}`} />
          <KpiCard icon={TrendingUp} label="Avg Visits/Member" value={avgPerMem}       unit="this month"           />
          <KpiCard icon={Zap}        label="At Risk"           value={atRisk}          unit="14+ days absent"      valueColor={atRisk > 0 ? C.danger : undefined} />
        </div>

        {classAttendance.length > 0 && (
          <Card style={{ padding: 20 }}>
            <CardHead title="My Class Attendance (30 days)" sub="Estimated from check-in time slots" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {classAttendance.map((cls, i) => {
                const fillColor = cls.fill >= 75 ? C.success : cls.fill < 40 ? C.danger : C.t2;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < classAttendance.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{cls.name}</span>
                      {cls.schedule && <span style={{ fontSize: 10, color: C.t3, marginLeft: 8 }}>{cls.schedule}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: fillColor }}>{cls.attended}</span>
                      <span style={{ fontSize: 9, color: C.t3 }}>/ {cls.capacity}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: fillColor }}>{cls.fill}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card style={{ padding: 20 }}>
          <SectionLabel>30-Day Snapshot</SectionLabel>
          <DRow label="Total check-ins"   value={ci30.length}       color={C.t1} />
          <DRow label="Active members"    value={activeThisMonth}   color={C.t1} />
          <DRow label="At-risk members"   value={atRisk}            color={atRisk > 0 ? C.danger : C.t1} />
          <DRow label="My classes"        value={myClasses.length}  color={C.t1} />
          <DRow label="Avg visits/member" value={totalMembers > 0 ? (ci30.length / totalMembers).toFixed(1) : '—'} color={C.t1} />
        </Card>

        {/* Segment: strict 3-tier colors */}
        <SegmentBreakdown title="Member Frequency" total={totalMembers} segments={[
          { label: 'Frequent',   sub: '12+/mo', val: memberFrequency.frequent,   color: C.success },
          { label: 'Occasional', sub: '4–11',   val: memberFrequency.occasional, color: C.t3 },
          { label: 'Rare',       sub: '1–3',    val: memberFrequency.rare,       color: C.t3 },
          { label: 'Inactive',   sub: '0',      val: memberFrequency.inactive,   color: C.danger },
        ]} />

        <RankedBarList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
        <RankedBarList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)}                            emptyLabel="No check-in data yet" />
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════
     GYM OWNER VIEW
  ════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 18, alignItems: 'start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* KPI cards */}
        {checkIns.length < 3 ? (
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Activity style={{ width: 14, height: 14, color: C.t3, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>Analytics data loading</div>
                <div style={{ fontSize: 11, color: C.t3, marginTop: 3, lineHeight: 1.55 }}>
                  KPIs and trends populate after your first 7 days of check-ins. Start by scanning member QR codes.
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
            {/*
              KPI color rules:
              - Daily avg: t1 (neutral, informational)
              - Monthly change: danger if <-5%, success if >+10%, neutral otherwise
              - Avg/member: always t1
              - Return rate: danger if <50%, success if >70%
            */}
            <KpiCard
              icon={Activity}
              label="Daily Avg"
              value={dailyAvg}
              unit="check-ins / day"
              trend={monthChangePct}
              spark={weekTrend.slice(-7).map(d => d.value)}
              subContext={`${weekTrend.reduce((a,d)=>a+d.value,0)} in 12w`}
            />
            <KpiCard
              icon={TrendingUp}
              label="Monthly Change"
              value={`${monthChangePct >= 0 ? '+' : ''}${monthChangePct}%`}
              unit="vs last month"
              trend={monthChangePct}
              valueColor={monthChangePct < -5 ? C.danger : monthChangePct > 10 ? C.success : undefined}
              subContext={monthChangePct > 0 ? 'Growing' : monthChangePct < 0 ? 'Declining' : 'Flat'}
            />
            <KpiCard
              icon={Users}
              label="Avg / Member"
              value={avgPerMem}
              unit="visits this month"
              subContext={`${superActive} at 15+/mo`}
            />
            <KpiCard
              icon={Zap}
              label="Return Rate"
              value={`${returnRate}%`}
              unit="repeat check-ins"
              valueColor={returnRate < 50 ? C.danger : returnRate >= 70 ? C.success : undefined}
              subContext={returnRate >= 70 ? 'Strong loyalty' : returnRate < 50 ? 'Needs attention' : ''}
            />
          </div>
        )}

        <SmartInsightsPanel
          checkIns={checkIns} ci30={ci30} allMemberships={allMemberships}
          atRisk={atRisk} retentionRate={retentionRate} monthChangePct={monthChangePct}
          totalMembers={totalMembers} now={now}
        />
        <RetentionFunnelWidget retentionFunnel={retentionFunnelProp} />
        <DropOffAnalysis dropOffBuckets={dropOffBucketsProp} />

        {/* Weekly Trend chart */}
        {weekTrend.some(d => d.value > 0) ? (
          <Card style={{ padding: 20 }}>
            <CardHead
              title="Weekly Check-in Trend"
              sub="12-week rolling view"
              right={
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.accent,
                  background: C.accentSub,
                  border: `1px solid ${C.accentBrd}`,
                  borderRadius: 6,
                  padding: '2px 8px',
                }}>
                  {weekTrend.reduce((s,d)=>s+d.value,0)} total
                </span>
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

        <ClassPerformanceWidget classes={classes} checkIns={checkIns} ci30={ci30} now={now} />
        <StaffPerformanceWidget coaches={coaches} checkIns={checkIns} ci30={ci30} classes={classes} allMemberships={allMemberships} now={now} />

        {/* Member Growth chart */}
        <Card style={{ padding: 20 }}>
          <CardHead
            title="Member Growth"
            sub="Monthly new sign-up trend"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.success, background: C.successSub, border: `1px solid ${C.successBrd}`, borderRadius: 6, padding: '2px 8px' }}>
                  +{newSignUps} this month
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.t2, background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 6, padding: '2px 8px' }}>
                  {retentionRate}% retained
                </span>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={124}>
            <BarChart data={monthGrowthData} barSize={16} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
              <XAxis dataKey="label" tick={tick} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={tick} axisLine={{ stroke: C.border }} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div style={{ background: '#060c18', border: `1px solid ${C.borderEl}`, borderRadius: 8, padding: '7px 11px' }}>
                      <p style={{ color: C.t3, fontSize: 10, margin: '0 0 2px' }}>{label}</p>
                      <p style={{ color: C.t1, fontWeight: 700, fontSize: 13, margin: 0 }}>{payload[0].value} active</p>
                    </div>
                  ) : null
                }
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
              />
              <Bar dataKey="value" fill={C.accent} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Heatmap */}
        <Card style={{ padding: 20 }}>
          <CardHead title="Member Traffic Heatmap" sub="Check-in density by day and time" />
          <HeatmapChart gymId={gymId} />
        </Card>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Week1ReturnTrendWidget week1ReturnTrend={week1ReturnTrendProp} />
        <ChurnSignalWidget churnSignals={churnSignalsProp} />
        <MilestoneProgressWidget checkIns={checkIns} />

        {/* Segment breakdown — strict 3-tier color rule */}
        <SegmentBreakdown title="Member Segments" total={totalMembers} segments={[
          { label: 'Super Active', sub: '15+/mo', val: superActive, color: C.success },
          { label: 'Active',       sub: '8–14',   val: active,      color: C.t2 },
          { label: 'Casual',       sub: '1–7',    val: casual,      color: C.t3 },
          { label: 'Inactive',     sub: '0',       val: inactive,    color: C.danger },
        ]} />

        <MonthComparison ci30={ci30} ciPrev30={ciPrev30} retentionRate={retentionRate} atRisk={atRisk} monthChangePct={monthChangePct} totalMembers={totalMembers} now={now} />
        <RankedBarList title="Busiest Days" icon={Calendar} items={busiestDays.map(d => ({ ...d, label: d.name }))} emptyLabel="No data yet" />
        <RankedBarList title="Peak Hours"   icon={Clock}    items={peakHours.slice(0, 5)}                            emptyLabel="No check-in data yet" />
      </div>
    </div>
  );
}
