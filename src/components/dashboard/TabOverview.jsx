/**
 * TabOverview — Redesigned Color System & Visual Hierarchy
 *
 * ══════════════════════════════════════════════════════════════════
 * DESIGN SYSTEM — same tokens as TabAnalytics.jsx
 * ══════════════════════════════════════════════════════════════════
 *
 * CORE RULE: "Color = Meaning. Silence = Safety."
 *
 * ── WHAT CHANGED ON THIS PAGE ────────────────────────────────────
 *
 * KPI CARDS
 *   Before: Gradient shimmer line, corner glow, colored icon box,
 *           trend icon inheriting card accent color.
 *           → 4–5 competing colored elements per tiny card.
 *   After:  No shimmer, no glow. Icon glyph is always t3 (muted).
 *           Value is t1 (white). Only the trend badge gets semantic
 *           color. Max 1 colored element per card.
 *
 * ACTION ITEMS / SIGNALS
 *   Before: Each signal had a colored background (`color`07),
 *           a colored icon container, a colored action badge — AND
 *           the title text in T.text1. Three competing colored
 *           surfaces in one small row.
 *   After:  Surface is always neutral (surfaceEl). A 3px left border
 *           is the ONLY color. Icon is the border color. Action badge
 *           is small and uses the border color.
 *           → Eye immediately ranks items by border color intensity.
 *
 * QUICK ACTIONS GRID
 *   Before: Hover state turned button background to `color`10 and
 *           border to `color`30 — 6 different hover colors.
 *   After:  All buttons hover to the same surfaceEl with borderEl.
 *           Icon glyphs retain their semantic color (they're small
 *           enough not to compete). Labels are always t2.
 *
 * ENGAGEMENT SPLIT
 *   Before: Each tier had its own color dot — green, blue, amber, red.
 *           All 4 competed simultaneously.
 *   After:  Strict 3-tier rule:
 *           Super Active → success (positive threshold)
 *           Active + Occasional → t3 (neutral — not alarming)
 *           At Risk → danger (only this one requires action)
 *
 * MEMBER GROWTH CARD
 *   Before: "+N new members" in green, cancelled count in red or grey,
 *           retention badge in green, gradient bar chart fill.
 *   After:  Net is always t1. Only negative net gets danger.
 *           Retention badge uses success only if ≥70% (threshold).
 *           Bar chart uses flat accent color, no gradient.
 *
 * WEEK-1 RETURN
 *   Before: "Came back" box in green-tinted bg, "Didn't return" in
 *           red-tinted bg. Both colored simultaneously.
 *   After:  Both boxes are surfaceEl (neutral). Only the numbers
 *           inside get semantic color if at a threshold.
 *
 * RETENTION BREAKDOWN (DROP-OFF RISK)
 *   Before: Each row value was colored (red/amber/t3) regardless of
 *           whether the count was 0.
 *   After:  Zero counts are always t4 (ghost). Non-zero counts:
 *           only "New went quiet" (week1) gets danger — it's the
 *           most urgent. Others get t2 unless action is needed.
 *
 * STAT NUDGE
 *   Before: Always had a colored background and border.
 *   After:  Always surfaceEl background and neutral border.
 *           Only the icon and stat text carry semantic color.
 *           No colored card surfaces.
 *
 * CHECK-IN CHART
 *   Before: Today's bar used a blue→blue gradient. Tooltip border
 *           turned blue for today. Reference line in blue.
 *   After:  Today's bar is flat accent. Past bars are accent at 30%
 *           opacity. Reference line is t4 (barely visible — it's
 *           supporting data, not primary).
 *
 * ── ELEMENTS THAT MUST NEVER BE COLORED ON THIS PAGE ────────────
 *   - Card backgrounds (always surface/surfaceEl)
 *   - All border lines (border/borderEl — neutral only)
 *   - Icon containers on buttons and cards
 *   - Row label text
 *   - Tick labels on charts
 *   - The Quick Actions grid button backgrounds
 *
 * ── TAILWIND-EQUIVALENT TOKENS ───────────────────────────────────
 *   bg-base:        #090e1a
 *   bg-surface:     #0d1525
 *   bg-surface-el:  #111c2e
 *   border:         rgba(255,255,255,0.065)
 *   border-el:      rgba(255,255,255,0.11)
 *   text-primary:   #dde3ed
 *   text-secondary: #7a8ea8
 *   text-muted:     #3f5068
 *   accent:         #5179ff
 *   danger:         #e0524a
 *   success:        #38b27a
 * ══════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, subDays, startOfDay } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  TrendingDown, ArrowUpRight, Zap,
  CheckCircle, Trophy, UserPlus, QrCode, MessageSquarePlus,
  Pencil, Calendar, Activity, Users, AlertTriangle,
  ChevronRight, Minus, TrendingUp,
  Clock, Flame, BarChart2, Shield,
} from 'lucide-react';
import { RingChart, Avatar } from './DashboardPrimitives';

/* ══════════════════════════════════════════════════════════════════
   DESIGN TOKENS — matches TabAnalytics.jsx exactly
══════════════════════════════════════════════════════════════════ */
const C = {
  bg:         '#090e1a',
  surface:    '#0d1525',
  surfaceEl:  '#111c2e',

  border:     'rgba(255,255,255,0.065)',
  borderEl:   'rgba(255,255,255,0.11)',
  divider:    'rgba(255,255,255,0.038)',

  t1:  '#dde3ed',   // Primary — values, headings
  t2:  '#7a8ea8',   // Secondary — labels
  t3:  '#3f5068',   // Muted — supporting copy, timestamps
  t4:  '#243040',   // Ghost — zero states, rank numbers

  accent:    '#5179ff',
  accentSub: 'rgba(81,121,255,0.08)',
  accentBrd: 'rgba(81,121,255,0.18)',

  danger:    '#e0524a',
  dangerSub: 'rgba(224,82,74,0.07)',
  dangerBrd: 'rgba(224,82,74,0.18)',

  success:    '#38b27a',
  successSub: 'rgba(56,178,122,0.07)',
  successBrd: 'rgba(56,178,122,0.16)',

  warn:    '#d4893a',
  warnSub: 'rgba(212,137,58,0.07)',
  warnBrd: 'rgba(212,137,58,0.18)',
};

/* ── Axis tick — always muted ──────────────────────────────────── */
const tick = { fill: C.t3, fontSize: 10, fontFamily: 'Geist, system-ui, sans-serif' };

/* ══════════════════════════════════════════════════════════════════
   CHART TOOLTIP
   Dark, minimal. No colored borders.
══════════════════════════════════════════════════════════════════ */
function Tip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   '#060c18',
      border:       `1px solid ${C.borderEl}`,
      borderRadius: 8,
      padding:      '7px 11px',
      boxShadow:    '0 6px 20px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: C.t3, fontSize: 10, fontWeight: 500, margin: '0 0 2px', letterSpacing: '.03em' }}>{label}</p>
      <p style={{ color: C.t1, fontWeight: 700, fontSize: 14, margin: 0 }}>{payload[0].value}{unit}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MINI SPARKLINE — accent color only
══════════════════════════════════════════════════════════════════ */
function MiniSpark({ data = [], width = 64, height = 26 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const first = pts.split(' ')[0], last = pts.split(' ').slice(-1)[0];
  const area = `${first.split(',')[0]},${height} ${pts} ${last.split(',')[0]},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', flexShrink: 0 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-ov" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-ov)" />
      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   KPI CARD
   BEFORE: shimmer line + corner glow + colored icon box + colored
           value + trend badge = 5 competing colored elements.
   AFTER:  No shimmer. No glow. Icon is always t3.
           Value is always t1 (pass valueColor only at a threshold).
           Only the trend badge gets semantic color (1 element total).
══════════════════════════════════════════════════════════════════ */
function KpiCard({ label, value, valueSuffix, sub, subTrend, subContext, sparkData, ring, ringColor, icon: Icon, valueColor, cta, onCta }) {
  const trendColor = subTrend === 'up' ? C.success : subTrend === 'down' ? C.danger : C.t3;
  const TrendIcon  = subTrend === 'up' ? ArrowUpRight : subTrend === 'down' ? TrendingDown : Minus;
  const showRing   = ring != null && ring > 5 && ring < 98;

  return (
    <div style={{
      borderRadius:  12,
      padding:       '16px 18px',
      background:    C.surface,
      border:        `1px solid ${C.border}`,
      boxShadow:     '0 1px 3px rgba(0,0,0,0.35)',
      display:       'flex',
      flexDirection: 'column',
      // NO shimmer line. NO corner glow. NO colored border.
    }}>
      {/* Label + icon — icon is always t3, no colored container */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: C.t3, letterSpacing: '.04em' }}>{label}</span>
        {Icon && <Icon style={{ width: 13, height: 13, color: C.t3 }} />}
      </div>

      {/* Value + ring/spark */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            {/* Value: t1 by default. valueColor only when threshold is crossed. */}
            <span style={{ fontSize: 34, fontWeight: 700, color: valueColor || C.t1, lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</span>
            {valueSuffix && <span style={{ fontSize: 13, fontWeight: 400, color: C.t3 }}>{valueSuffix}</span>}
          </div>
          {/* Trend sub — semantic color only on badge, not on icon */}
          {sub && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <TrendIcon style={{ width: 10, height: 10, color: trendColor, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: trendColor, lineHeight: 1.3 }}>{sub}</span>
            </div>
          )}
          {subContext && (
            <div style={{ fontSize: 10, color: C.t3, marginTop: 3, lineHeight: 1.4 }}>{subContext}</div>
          )}
        </div>
        {showRing
          ? <RingChart pct={ring} size={44} stroke={3.5} color={ringColor || C.accent} />
          : sparkData && sparkData.some(v => v > 0)
          ? <MiniSpark data={sparkData} />
          : null
        }
      </div>

      {/* CTA button — only for at-risk card */}
      {cta && onCta && (
        <button
          onClick={onCta}
          style={{
            marginTop:      8,
            width:          '100%',
            padding:        '6px 10px',
            borderRadius:   7,
            // Neutral button — no colored background
            background:     C.surfaceEl,
            border:         `1px solid ${C.borderEl}`,
            color:          C.t1,
            fontSize:       11,
            fontWeight:     600,
            cursor:         'pointer',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            5,
            fontFamily:     'inherit',
            transition:     'border-color .12s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.danger + '60'}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.borderEl}
        >
          {cta} <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT ROW — label always t2, value gets color only at threshold
══════════════════════════════════════════════════════════════════ */
function StatRow({ label, value, valueColor, last, badge }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '8px 0',
      borderBottom:   last ? 'none' : `1px solid ${C.divider}`,
    }}>
      <span style={{ fontSize: 12, color: C.t2 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {badge && (
          <span style={{
            fontSize:    9,
            fontWeight:  600,
            color:       badge.color,
            background:  `${badge.color}10`,
            border:      `1px solid ${badge.color}22`,
            borderRadius: 5,
            padding:     '1px 6px',
          }}>
            {badge.label}
          </span>
        )}
        <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || C.t1 }}>{value}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ACTION ROW
   BEFORE: Colored icon container on every row.
   AFTER:  Icon container is surfaceEl (neutral).
           Icon glyph carries the semantic color — small enough
           not to compete but still scannable.
══════════════════════════════════════════════════════════════════ */
function ActionRow({ icon: Icon, label, action, color, onClick, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     '9px 0',
        borderBottom: last ? 'none' : `1px solid ${C.divider}`,
        cursor:      'pointer',
      }}
    >
      {/* Icon container: always neutral */}
      <div style={{
        width:          28,
        height:         28,
        borderRadius:   7,
        background:     C.surfaceEl,
        border:         `1px solid ${C.border}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}>
        <Icon style={{ width: 12, height: 12, color }} />
      </div>
      <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: hov ? C.t1 : C.t2, lineHeight: 1.4, transition: 'color .12s' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: hov ? C.t1 : C.t3, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, transition: 'color .12s' }}>
        {action}<ChevronRight style={{ width: 10, height: 10 }} />
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIGNAL — action item row
   BEFORE: `${color}07` background, colored icon container, colored
           action badge, colored title = 4 competing surfaces.
   AFTER:  Surface is always surfaceEl (neutral).
           A 3px left border is the ONLY color signal.
           Icon glyph is the border color (small — doesn't compete).
           Action badge: small accent-colored text, no bg.
══════════════════════════════════════════════════════════════════ */
function Signal({ color, icon: Icon, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        padding:      '10px 12px',
        borderRadius: 8,
        background:   hov && onAction ? C.surfaceEl : C.surface,
        border:       `1px solid ${C.border}`,
        // 3px left border is the ONLY color on this component
        borderLeft:   `3px solid ${color}`,
        marginBottom: last ? 0 : 6,
        cursor:       onAction ? 'pointer' : 'default',
        transition:   'background .12s',
      }}
      onClick={onAction}
      onMouseEnter={() => onAction && setHov(true)}
      onMouseLeave={() => onAction && setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Icon: no container, just the glyph in border color */}
        <Icon style={{ width: 12, height: 12, color, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, lineHeight: 1.3, marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</div>
        </div>
        {/* Action: text-only badge, no background */}
        {action && (
          <span style={{
            fontSize:    10,
            fontWeight:  600,
            color,
            flexShrink:  0,
            whiteSpace:  'nowrap',
            marginTop:   1,
            display:     'flex',
            alignItems:  'center',
            gap:         2,
          }}>
            {action} <ChevronRight style={{ width: 9, height: 9 }} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STAT NUDGE — inline contextual note inside cards
   BEFORE: Colored background + colored border = two surfaces.
   AFTER:  Always surfaceEl + neutral border.
           Icon and stat text carry semantic color.
           No colored card surface.
══════════════════════════════════════════════════════════════════ */
function StatNudge({ color = C.accent, icon: Icon, stat, detail, action, onAction }) {
  return (
    <div style={{
      marginTop:   12,
      display:     'flex',
      alignItems:  'flex-start',
      gap:         9,
      padding:     '9px 11px',
      borderRadius: 8,
      // Neutral surface — no colored bg
      background:  C.surfaceEl,
      border:      `1px solid ${C.border}`,
      // 2px left border is the only color
      borderLeft:  `2px solid ${color}`,
    }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{stat} </span>
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          style={{
            flexShrink:  0,
            fontSize:    10,
            fontWeight:  600,
            color,
            background:  'transparent',
            border:      'none',
            cursor:      'pointer',
            fontFamily:  'inherit',
            whiteSpace:  'nowrap',
            display:     'flex',
            alignItems:  'center',
            gap:         2,
            padding:     0,
          }}
        >
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ACTION ITEMS (signals panel)
   BEFORE: Each signal had full colored backgrounds. The pending badge
           inherited signal[0]'s color. Header had a shimmer line.
   AFTER:  Signals use left-border-only color. Pending count badge
           is a simple neutral tag — the signal borders already
           communicate urgency without a badge repeating it.
══════════════════════════════════════════════════════════════════ */
function TodayActions({ atRisk, checkIns, allMemberships, posts, challenges, now, openModal, setTab, newNoReturnCount = 0 }) {
  const signals = useMemo(() => {
    const items = [];
    if (newNoReturnCount > 0) {
      items.push({ priority: 1, color: C.danger, icon: UserPlus, title: `${newNoReturnCount} new member${newNoReturnCount > 1 ? 's' : ''} haven't returned`, detail: 'Joined 1–2 weeks ago, no second visit yet. Week-1 follow-up has the highest retention impact.', action: 'Follow up', fn: () => openModal('message') });
    }
    if (atRisk > 0) {
      const pct = allMemberships.length > 0 ? Math.round((atRisk / allMemberships.length) * 100) : 0;
      items.push({ priority: 2, color: atRisk >= 5 ? C.danger : C.warn, icon: AlertTriangle, title: `${atRisk} member${atRisk > 1 ? 's' : ''} inactive for 14+ days`, detail: `${pct}% of your gym. Direct outreach is the most effective re-engagement method.`, action: 'View & message', fn: () => setTab('members') });
    }
    const hasChallenge = (challenges || []).some(c => !c.ended_at);
    if (!hasChallenge) {
      items.push({ priority: 3, color: C.warn, icon: Trophy, title: 'No active challenge', detail: 'Members with an active goal tend to visit more consistently — give them something to compete for.', action: 'Create one', fn: () => openModal('challenge') });
    }
    const recentPost = (posts || []).find(p => differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 7);
    if (!recentPost) {
      const daysSince = posts?.length > 0 ? differenceInDays(now, new Date(posts[0].created_at || posts[0].created_date || now)) : null;
      items.push({ priority: 4, color: C.warn, icon: MessageSquarePlus, title: daysSince ? `No post in ${daysSince} days` : 'No community posts yet', detail: 'Regular posts lift engagement scores. Try a motivational post or a poll.', action: 'Post now', fn: () => openModal('post') });
    }
    const todayCount = checkIns.filter(c => {
      const d = new Date(c.check_in_date), t = now;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
    }).length;
    if (todayCount === 0 && now.getHours() >= 10) {
      items.push({ priority: 5, color: C.accent, icon: QrCode, title: 'No check-ins recorded today', detail: 'Check-ins usually start arriving by 9–10am. Scanner issue?', action: 'Check scanner', fn: () => openModal('qrScanner') });
    }
    const dayOfWeek = now.getDay();
    if ((dayOfWeek === 4 || dayOfWeek === 5) && !recentPost) {
      items.push({ priority: 6, color: C.accent, icon: Calendar, title: 'Thursday/Friday — prime time to promote weekend classes', detail: 'Promoting weekend classes on Thursday or Friday gives members time to plan ahead.', action: 'Post promo', fn: () => openModal('post') });
    }
    const recentPoll = (posts || []).find(p => (p.type === 'poll' || p.category === 'poll') && differenceInDays(now, new Date(p.created_at || p.created_date || now)) <= 14);
    if (!recentPoll && allMemberships.length >= 5) {
      items.push({ priority: 7, color: C.accent, icon: BarChart2, title: 'No poll in the last 2 weeks', detail: 'Polls invite participation and show members their opinion counts.', action: 'Run a poll', fn: () => openModal('poll') });
    }
    return items.sort((a, b) => a.priority - b.priority).slice(0, 5);
  }, [atRisk, checkIns, allMemberships, posts, challenges, now]);

  const positives = useMemo(() => {
    const items = [];
    if (atRisk === 0) items.push('All members active');
    if ((challenges || []).some(c => !c.ended_at)) items.push('Active challenge running');
    return items.slice(0, 2);
  }, [atRisk, challenges]);

  const urgentCount = signals.filter(s => s.color === C.danger).length;

  return (
    <div style={{
      padding:      20,
      borderRadius: 12,
      background:   C.surface,
      border:       `1px solid ${C.border}`,
      boxShadow:    '0 1px 3px rgba(0,0,0,0.35)',
      // NO shimmer line
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Action Items</div>
        {/* Badge: neutral, not colored — the signal borders communicate urgency */}
        {signals.length > 0 && (
          <span style={{
            fontSize:    10,
            fontWeight:  600,
            color:       urgentCount > 0 ? C.danger : C.t3,
            background:  urgentCount > 0 ? C.dangerSub : 'transparent',
            border:      `1px solid ${urgentCount > 0 ? C.dangerBrd : C.border}`,
            borderRadius: 6,
            padding:     '1px 7px',
          }}>
            {signals.length} pending
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: C.t3, marginBottom: 14 }}>Sorted by urgency</div>

      {signals.length === 0 ? (
        <div style={{
          padding:      '11px 13px',
          borderRadius: 8,
          background:   C.surfaceEl,
          border:       `1px solid ${C.border}`,
          borderLeft:   `3px solid ${C.success}`,
          display:      'flex',
          alignItems:   'center',
          gap:          8,
        }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>All clear today</div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 1 }}>No immediate actions needed</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {signals.map((s, i) => (
            <Signal key={i} color={s.color} icon={s.icon} title={s.title} detail={s.detail} action={s.action} onAction={s.fn} last={i === signals.length - 1} />
          ))}
        </div>
      )}

      {positives.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
          {positives.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < positives.length - 1 ? 4 : 0 }}>
              <CheckCircle style={{ width: 10, height: 10, color: C.success, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.success }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RETENTION BREAKDOWN (DROP-OFF RISK)
   BEFORE: Every non-zero row had a unique color (red/amber/t3).
   AFTER:  Only week1 (most urgent) gets danger.
           week2to4 and month2to3 get warn only if > 0.
           "Beyond" is always t3 (it's stale risk, not urgent).
           Zero values are always t4 (ghost).
══════════════════════════════════════════════════════════════════ */
function RetentionBreakdown({ retentionBreakdown: risks = {}, setTab }) {
  const computed = {
    week1:     risks.week1     || 0,
    week2to4:  risks.week2to4  || 0,
    month2to3: risks.month2to3 || 0,
    beyond:    risks.beyond    || 0,
  };

  const rows = [
    { label: 'New — went quiet', sub: 'Joined < 2 wks, no return', val: computed.week1,     urgentColor: C.danger },
    { label: 'Early drop-off',   sub: 'Weeks 2–4 inactivity',      val: computed.week2to4,  urgentColor: C.warn   },
    { label: 'Month 2–3 slip',   sub: 'Common churn window',       val: computed.month2to3, urgentColor: C.warn   },
    { label: 'Long inactive',    sub: '21+ days absent',           val: computed.beyond,    urgentColor: C.t3     },
  ];
  const total = rows.reduce((s, r) => s + r.val, 0);

  return (
    <div style={{ padding: 20, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 2 }}>Drop-off Risk</div>
          <div style={{ fontSize: 11, color: C.t3 }}>Where members go quiet</div>
        </div>
        <button
          onClick={() => setTab && setTab('members')}
          style={{ fontSize: 11, fontWeight: 500, color: C.t3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}
        >
          View all <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {total === 0 ? (
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          padding:      '10px 12px',
          borderRadius: 8,
          background:   C.surfaceEl,
          border:       `1px solid ${C.border}`,
          borderLeft:   `3px solid ${C.success}`,
        }}>
          <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: C.t2 }}>No drop-off risks detected</span>
        </div>
      ) : rows.map((r, i) => (
        <div key={i} style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          padding:        '8px 0',
          borderBottom:   i < rows.length - 1 ? `1px solid ${C.divider}` : 'none',
        }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 500, color: r.val > 0 ? C.t1 : C.t3 }}>{r.label}</span>
            <span style={{ fontSize: 10, color: C.t3, marginLeft: 7 }}>{r.sub}</span>
          </div>
          {/* Value: semantic color only if > 0. Zero values are ghost. */}
          <span style={{
            fontSize:  13,
            fontWeight: 700,
            color:      r.val > 0 ? r.urgentColor : C.t4,
          }}>
            {r.val}
          </span>
        </div>
      ))}

      {computed.week1 > 0 && (
        <StatNudge
          color={C.danger}
          icon={AlertTriangle}
          stat={`${computed.week1} new member${computed.week1 > 1 ? 's' : ''} went quiet immediately.`}
          detail="The first 7 days are critical — members who don't return in week 1 are far less likely to become regulars."
          action="Follow up"
          onAction={() => setTab && setTab('members')}
        />
      )}
      {computed.week1 === 0 && total > 0 && (
        <StatNudge
          color={C.success}
          icon={CheckCircle}
          stat="No immediate drop-offs."
          detail="Keep it up — the month 2–3 window is the next common drop-off point to watch."
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   WEEK-1 RETURN RATE
   BEFORE: "Came back" grid cell green-tinted bg. "Didn't return"
           red-tinted bg. Both colored simultaneously.
   AFTER:  Both cells are surfaceEl (neutral bg).
           Numbers inside get semantic color at their threshold.
           The overall % heading gets semantic color (it's 1 number,
           it earns the color — it's the key signal on this card).
══════════════════════════════════════════════════════════════════ */
function WeekOneReturn({ week1ReturnRate = {}, openModal }) {
  const { returned = 0, didnt = 0, names = [] } = week1ReturnRate;
  const total = returned + didnt;
  const pct   = total > 0 ? Math.round((returned / total) * 100) : 0;
  // Only the headline % earns semantic color — it's the primary signal
  const pctColor = total === 0 ? C.t3 : pct >= 60 ? C.success : pct >= 40 ? C.t1 : C.danger;

  return (
    <div style={{ padding: 20, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 2 }}>Week-1 Return Rate</div>
          <div style={{ fontSize: 11, color: C.t3 }}>New members, joined 1–3 weeks ago</div>
        </div>
        {/* Headline metric: 1 colored number, earns its color */}
        <div style={{ fontSize: 28, fontWeight: 700, color: pctColor, letterSpacing: '-0.04em', lineHeight: 1 }}>
          {total === 0 ? '—' : `${pct}%`}
        </div>
      </div>

      {total === 0 ? (
        <p style={{ fontSize: 12, color: C.t3, margin: 0 }}>No members in the 1–3 week window yet.</p>
      ) : (
        <>
          {/* Cells: neutral surface — values inside get color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div style={{
              padding:      '10px 12px',
              borderRadius: 8,
              background:   C.surfaceEl,
              border:       `1px solid ${C.border}`,
              textAlign:    'center',
            }}>
              {/* Number: success if > 0 — a good thing happened */}
              <div style={{ fontSize: 20, fontWeight: 700, color: returned > 0 ? C.success : C.t4, letterSpacing: '-0.03em' }}>{returned}</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>Came back</div>
            </div>
            <div style={{
              padding:      '10px 12px',
              borderRadius: 8,
              background:   C.surfaceEl,
              border:       `1px solid ${C.border}`,
              textAlign:    'center',
            }}>
              {/* Number: danger only if > 0 — something needs attention */}
              <div style={{ fontSize: 20, fontWeight: 700, color: didnt > 0 ? C.danger : C.t4, letterSpacing: '-0.03em' }}>{didnt}</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>Didn't return</div>
            </div>
          </div>

          {didnt > 0 && names.length > 0 && (
            <div style={{
              marginBottom: 0,
              padding:      '9px 11px',
              borderRadius: 8,
              background:   C.surfaceEl,
              border:       `1px solid ${C.border}`,
              // Left border: only color on this element
              borderLeft:   `3px solid ${C.danger}`,
            }}>
              <div style={{ fontSize: 11, color: C.t2, marginBottom: 5, lineHeight: 1.5 }}>
                {names.join(', ')}{didnt > 3 ? ` +${didnt - 3} more` : ''} — no return visit yet
              </div>
              <button
                onClick={() => openModal('message')}
                style={{ fontSize: 11, fontWeight: 600, color: C.danger, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}
              >
                Send follow-up <ChevronRight style={{ width: 10, height: 10 }} />
              </button>
            </div>
          )}

          <StatNudge
            color={pct >= 60 ? C.success : C.danger}
            icon={pct >= 60 ? CheckCircle : AlertTriangle}
            stat={pct >= 60 ? 'Strong week-1 retention.' : 'Week-1 follow-ups work.'}
            detail={pct >= 60
              ? 'Members who return in week 1 are significantly more likely to become long-term regulars.'
              : 'A personal message in the first week is the single highest-impact action for week-1 retention.'
            }
            action={didnt > 0 ? 'Message now' : undefined}
            onAction={didnt > 0 ? () => openModal('message') : undefined}
          />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ENGAGEMENT BREAKDOWN
   BEFORE: 4 different colored dots simultaneously (green/blue/amber/red).
   AFTER:  Strict 3-tier:
           Super Active → success (earned it)
           Active + Occasional → t3 (neutral — they're fine)
           At Risk → danger (requires action)
══════════════════════════════════════════════════════════════════ */
function EngagementBreakdown({ monthCiPer, totalMembers, atRisk, setTab }) {
  const rows = [
    { label: 'Super active', sub: '12+ visits/mo', val: (monthCiPer || []).filter(v => v >= 12).length,          dotColor: C.success },
    { label: 'Active',       sub: '4–11 visits',   val: (monthCiPer || []).filter(v => v >= 4 && v < 12).length, dotColor: C.t3 },
    { label: 'Occasional',   sub: '1–3 visits',    val: (monthCiPer || []).filter(v => v >= 1 && v < 4).length,  dotColor: C.t3 },
    { label: 'At risk',      sub: '14+ days away', val: atRisk,                                                   dotColor: C.danger },
  ];

  return (
    <div style={{ padding: 20, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Engagement Split</div>
        <button
          onClick={() => setTab('members')}
          style={{ fontSize: 11, fontWeight: 500, color: C.t3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}
        >
          Members <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {rows.map((r, i) => {
        const pct = totalMembers > 0 ? Math.round((r.val / totalMembers) * 100) : 0;
        return (
          <div key={i} style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            padding:      '8px 0',
            borderBottom: i < rows.length - 1 ? `1px solid ${C.divider}` : 'none',
          }}>
            {/* Dot: semantic only for success/danger tiers */}
            <div style={{
              width:        5,
              height:       5,
              borderRadius: '50%',
              background:   r.val > 0 ? r.dotColor : C.t4,
              flexShrink:   0,
            }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: r.val > 0 ? C.t1 : C.t3, flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 11, color: C.t3, marginRight: 8 }}>{r.sub}</span>
            {/* Value: semantic color at tier extremes, t2 for middle tiers */}
            <span style={{
              fontSize:  13,
              fontWeight: 700,
              color:      r.val > 0 ? r.dotColor : C.t4,
              minWidth:  20,
              textAlign: 'right',
            }}>
              {r.val}
            </span>
            <span style={{ fontSize: 10, color: C.t3, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}

      {atRisk > 0 && (
        <StatNudge
          color={C.danger}
          icon={AlertTriangle}
          stat={`${atRisk} member${atRisk > 1 ? 's' : ''} at risk.`}
          detail="Early outreach is most effective — the longer a lapsed member waits, the harder it is to re-engage."
          action="View members"
          onAction={() => setTab('members')}
        />
      )}
      {atRisk === 0 && totalMembers >= 5 && (
        <StatNudge
          color={C.success}
          icon={CheckCircle}
          stat="All members active."
          detail="Active gyms maintain this by running a challenge every 6–8 weeks."
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   RECENT ACTIVITY FEED
   Unchanged structure, updated to C tokens.
══════════════════════════════════════════════════════════════════ */
function ActivityFeed({ recentActivity, now, avatarMap }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 16 }}>Recent Activity</div>
      {!recentActivity || recentActivity.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <Activity style={{ width: 18, height: 18, color: C.t3, margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontSize: 12, color: C.t3, margin: '0 0 3px', fontWeight: 500 }}>No activity yet today</p>
          <p style={{ fontSize: 11, color: C.t3, margin: 0, opacity: 0.7 }}>Typical peak is 5–7pm</p>
        </div>
      ) : recentActivity.slice(0, 6).map((a, i) => {
        const minsAgo = Math.floor((now - new Date(a.time)) / 60000);
        const timeStr = minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo / 60)}h ago` : `${Math.floor(minsAgo / 1440)}d ago`;
        return (
          <div key={i} style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            padding:      '8px 0',
            borderBottom: i < Math.min(recentActivity.length, 6) - 1 ? `1px solid ${C.divider}` : 'none',
          }}>
            <Avatar name={a.name} size={26} src={avatarMap?.[a.user_id] || null} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.t1, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{a.name}</span>
                <span style={{ color: C.t2 }}> {a.action}</span>
              </div>
            </div>
            <span style={{ fontSize: 10, color: C.t3, flexShrink: 0 }}>{timeStr}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MEMBER GROWTH CARD
   BEFORE: "+N" in green, gradient bar fill, both badges colored.
   AFTER:  "+N" in t1. Net negative gets danger. Net positive t1.
           Bar chart: flat accent. No gradient.
           Retention badge: success only if ≥70% (threshold).
           Cancelled badge: danger only if cancelled > 0.
══════════════════════════════════════════════════════════════════ */
function MemberGrowthCard({ newSignUps, cancelledEst, retentionRate, monthGrowthData }) {
  const hasEnoughData = (monthGrowthData || []).filter(d => d.value > 0).length >= 2;
  const net           = newSignUps - cancelledEst;
  const netColor      = net < 0 ? C.danger : C.t1;
  const retColor      = retentionRate >= 70 ? C.success : retentionRate < 50 ? C.danger : C.t2;

  return (
    <div style={{ padding: 20, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 4 }}>Member Growth</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            {/* Value: t1 — the chart communicates growth, not the color */}
            <span style={{ fontSize: 26, fontWeight: 700, color: C.t1, letterSpacing: '-0.04em' }}>
              {newSignUps > 0 ? `+${newSignUps}` : newSignUps}
            </span>
            <span style={{ fontSize: 12, color: C.t3 }}>this month</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Retention badge: success only at threshold */}
          <div style={{
            padding:      '3px 9px',
            borderRadius: 6,
            background:   retentionRate >= 70 ? C.successSub : C.surfaceEl,
            border:       `1px solid ${retentionRate >= 70 ? C.successBrd : C.border}`,
            fontSize:     11,
            fontWeight:   600,
            color:        retColor,
          }}>
            {retentionRate}% retained
          </div>
          {/* Cancelled: danger only if > 0 */}
          {cancelledEst > 0 && (
            <div style={{
              padding:      '3px 9px',
              borderRadius: 6,
              background:   C.dangerSub,
              border:       `1px solid ${C.dangerBrd}`,
              fontSize:     11,
              fontWeight:   600,
              color:        C.danger,
            }}>
              {cancelledEst} left
            </div>
          )}
        </div>
      </div>

      {hasEnoughData ? (
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={monthGrowthData} barSize={18} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            {/* No gradient — flat accent fill */}
            <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
            <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
            <YAxis tick={tick} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip content={<Tip unit=" members" />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" fill={C.accent} fillOpacity={0.75} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: C.surfaceEl, gap: 5 }}>
          <div style={{ fontSize: 12, color: C.t3 }}>Chart populates as data grows</div>
          <div style={{ fontSize: 11, color: C.t3, opacity: 0.7 }}>Check back next month for trends</div>
        </div>
      )}

      {/* Net summary row — minimal, no excessive color */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.divider}` }}>
        {[
          { label: 'New',       value: newSignUps,   color: C.t1 },
          { label: 'Cancelled', value: cancelledEst, color: cancelledEst > 0 ? C.danger : C.t4 },
          { label: 'Net',       value: `${net >= 0 ? '+' : ''}${net}`, color: netColor },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 2 ? `1px solid ${C.divider}` : 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, letterSpacing: '-0.03em' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {retentionRate < 70 ? (
        <StatNudge
          color={C.danger}
          icon={TrendingDown}
          stat={`${retentionRate}% retention — below the 70% healthy threshold.`}
          detail="70% is the healthy baseline. The highest-impact habit: personally welcoming every new member in their first week."
        />
      ) : cancelledEst > newSignUps ? (
        <StatNudge
          color={C.danger}
          icon={AlertTriangle}
          stat="More cancellations than sign-ups this month."
          detail="Run a referral incentive or re-engagement challenge to reverse the trend."
        />
      ) : newSignUps > 0 ? (
        <StatNudge
          color={C.success}
          icon={TrendingUp}
          stat={`+${newSignUps} new member${newSignUps > 1 ? 's' : ''} this month.`}
          detail="Early habit formation matters — new members who visit frequently in their first weeks are far more likely to stick."
        />
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   CHECK-IN ACTIVITY CHART
   BEFORE: Today bar gradient (blue→blue). Tooltip border turned blue
           for today. Reference line in blue. Range toggle buttons
           had blue bg + blue border when active.
   AFTER:  Today bar: flat accent (no gradient — the full opacity
           vs 30% already distinguishes today vs past).
           Tooltip: never colored border — always borderEl.
           Reference line: t4 (supporting data, barely visible).
           Range toggles: active = surfaceEl + borderEl (neutral tab).
══════════════════════════════════════════════════════════════════ */
function CheckInChart({ chartDays, chartRange, setChartRange, now, activeThisWeek }) {
  const todayLabel = format(now, chartRange <= 7 ? 'EEE' : 'MMM d');

  const weeklyAvg = useMemo(() => {
    if (!chartDays?.length) return 0;
    const vals = chartDays.map(d => d.value);
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [chartDays]);

  const todayVal = (chartDays || []).find(d => d.day === todayLabel)?.value ?? 0;
  const chartMax = Math.max(...(chartDays || []).map(d => d.value), 1);

  const RANGES = [{ val: 7, label: '7D' }, { val: 30, label: '30D' }];

  return (
    <div style={{ padding: '20px 20px 16px', borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t2 }}>Check-in Activity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: C.t3 }}>
              Daily avg <span style={{ fontWeight: 600, color: C.t2 }}>{weeklyAvg}</span>
            </div>
            {todayVal > 0 && (
              <>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: C.t4 }} />
                <div style={{ fontSize: 11, color: C.t3 }}>
                  Today <span style={{ fontWeight: 600, color: C.accent }}>{todayVal}</span>
                </div>
              </>
            )}
            {todayVal === 0 && now.getHours() < 10 && (
              <div style={{ fontSize: 10, color: C.t3, fontStyle: 'italic' }}>Peak usually 5–7pm</div>
            )}
          </div>
        </div>

        {/* Range toggle: neutral tab style */}
        <div style={{ display: 'flex', gap: 2 }}>
          {RANGES.map(r => (
            <button
              key={r.val}
              onClick={() => setChartRange(r.val)}
              style={{
                fontSize:    11,
                fontWeight:  chartRange === r.val ? 600 : 400,
                padding:     '4px 10px',
                borderRadius: 6,
                cursor:      'pointer',
                background:  chartRange === r.val ? C.surfaceEl : 'transparent',
                color:       chartRange === r.val ? C.t1 : C.t3,
                border:      `1px solid ${chartRange === r.val ? C.borderEl : 'transparent'}`,
                fontFamily:  'inherit',
                transition:  'all .12s',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={184}>
        <BarChart
          data={chartDays || []}
          margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
          barSize={chartRange <= 7 ? 20 : 8}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
          <XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} interval={chartRange <= 7 ? 0 : 4} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={28} allowDecimals={false} domain={[0, Math.max(chartMax + 1, 5)]} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const isToday = label === todayLabel;
              const val     = payload[0].value;
              const avg     = parseFloat(weeklyAvg);
              const vsAvg   = avg > 0 ? Math.round(((val - avg) / avg) * 100) : 0;
              return (
                <div style={{
                  background:   '#060c18',
                  // Tooltip border never changes color — always neutral
                  border:       `1px solid ${C.borderEl}`,
                  borderRadius: 9,
                  padding:      '8px 12px',
                  boxShadow:    '0 8px 24px rgba(0,0,0,0.5)',
                  minWidth:     120,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? C.accent : C.t3, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {isToday ? 'Today' : label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.t1, letterSpacing: '-0.03em', marginBottom: 3 }}>
                    {val} <span style={{ fontSize: 10, fontWeight: 400, color: C.t3 }}>check-ins</span>
                  </div>
                  {avg > 0 && val > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {vsAvg >= 0
                        ? <TrendingUp style={{ width: 9, height: 9, color: C.success }} />
                        : <TrendingDown style={{ width: 9, height: 9, color: C.danger }} />
                      }
                      <span style={{ fontSize: 10, fontWeight: 600, color: vsAvg >= 0 ? C.success : C.danger }}>
                        {vsAvg >= 0 ? '+' : ''}{vsAvg}% vs avg
                      </span>
                    </div>
                  )}
                  {val === 0 && now.getHours() < 18 && isToday && (
                    <div style={{ fontSize: 10, color: C.t3 }}>Peak hours: 5–7pm</div>
                  )}
                </div>
              );
            }}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {(chartDays || []).map((entry, i) => (
              /* Today: full accent. Past: 30% opacity. Opacity alone is enough. */
              <Cell key={i} fill={C.accent} fillOpacity={entry.day === todayLabel ? 0.85 : 0.3} />
            ))}
          </Bar>
          {/* Reference line: t4 (supporting data, whisper-level) */}
          {parseFloat(weeklyAvg) > 0 && (
            <ReferenceLine
              y={parseFloat(weeklyAvg)}
              stroke={C.t4}
              strokeDasharray="4 4"
              label={{ value: `avg ${weeklyAvg}`, position: 'insideTopRight', fill: C.t3, fontSize: 9, fontFamily: 'Geist, system-ui' }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend — minimal, informational only */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: C.accent, opacity: 0.85 }} />
          <span style={{ fontSize: 10, color: C.t3 }}>Today</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: C.accent, opacity: 0.3 }} />
          <span style={{ fontSize: 10, color: C.t3 }}>Past days</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 14, height: 1, borderTop: `2px dashed ${C.t4}` }} />
          <span style={{ fontSize: 10, color: C.t3 }}>Daily avg</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   QUICK ACTIONS GRID
   BEFORE: Hover state turned button to `color`10 bg and `color`30
           border — 6 different hover colors firing independently.
   AFTER:  All hover states go to the same surfaceEl + borderEl.
           Icon glyphs keep their semantic color (small, scannable).
           Labels are always t2 on hover too — clean grid.
══════════════════════════════════════════════════════════════════ */
function QuickActionsGrid({ openModal }) {
  const actions = [
    { icon: UserPlus,          label: 'Add Member',    color: C.success, fn: () => openModal('members')   },
    { icon: QrCode,            label: 'Scan Check-in', color: C.accent,  fn: () => openModal('qrScanner') },
    { icon: Trophy,            label: 'New Challenge', color: C.warn,    fn: () => openModal('challenge') },
    { icon: Calendar,          label: 'New Event',     color: C.success, fn: () => openModal('event')     },
    { icon: MessageSquarePlus, label: 'Post Update',   color: C.accent,  fn: () => openModal('post')      },
    { icon: Pencil,            label: 'New Poll',      color: C.t2,      fn: () => openModal('poll')      },
  ];

  return (
    <div style={{ padding: 20, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.t2, marginBottom: 14 }}>Quick Actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {actions.map(({ icon: Icon, label, color, fn }, i) => (
          <QuickActionButton key={i} icon={Icon} label={label} color={color} onClick={fn} />
        ))}
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         8,
        padding:     '8px 10px',
        borderRadius: 8,
        // All buttons: same neutral hover state — no per-button color
        background:  hov ? C.surfaceEl : 'transparent',
        border:      `1px solid ${hov ? C.borderEl : C.border}`,
        cursor:      'pointer',
        transition:  'all .12s',
        fontFamily:  'inherit',
      }}
    >
      {/* Icon glyph: semantic color. Container: no color. */}
      <Icon style={{ width: 13, height: 13, color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 500, color: hov ? C.t1 : C.t2, transition: 'color .12s' }}>{label}</span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════════ */
export default function TabOverview({
  todayCI, yesterdayCI, todayVsYest, activeThisWeek, totalMembers, retentionRate,
  newSignUps, monthChangePct, ciPrev30, atRisk, sparkData, monthGrowthData,
  cancelledEst, monthCiPer,
  checkIns, allMemberships, challenges, posts, polls, classes, coaches,
  recentActivity, chartDays, chartRange, setChartRange, avatarMap,
  priorities, selectedGym, now,
  openModal, setTab,
  retentionBreakdown = {}, week1ReturnRate = {}, newNoReturnCount = 0,
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const inGymNow = checkIns.filter(c => {
    const diff = (now - new Date(c.check_in_date)) / 60000;
    return diff >= 0 && diff <= 120;
  }).length;

  const ciSub = useMemo(() => {
    if (yesterdayCI === 0) return todayCI > 0 ? 'No data for yesterday' : 'No check-ins yet today';
    if (todayVsYest > 0)  return `↑ ${todayVsYest}% vs yesterday`;
    if (todayVsYest < 0)  return `↓ ${Math.abs(todayVsYest)}% vs yesterday`;
    return 'Same as yesterday';
  }, [todayCI, yesterdayCI, todayVsYest]);

  const weeklyAvgCI = useMemo(() => {
    if (!chartDays?.length) return null;
    return (chartDays.reduce((a, b) => a + b.value, 0) / chartDays.length).toFixed(1);
  }, [chartDays]);

  const ciTrend    = yesterdayCI > 0 && todayVsYest > 0 ? 'up' : yesterdayCI > 0 && todayVsYest < 0 ? 'down' : null;
  const showRing   = retentionRate > 5 && retentionRate < 98;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 292px', gap: 20, alignItems: 'start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12 }}>
          {/*
            KPI color rules applied:
            - Today's Check-ins: t1 value, trend only colors badge
            - Active Members: ring gets semantic color (retention threshold)
            - In Gym Now: t1 value always
            - At-Risk: value gets danger if > 0 (threshold crossed)
          */}
          <KpiCard
            label="Today's Check-ins"
            value={todayCI}
            sub={ciSub}
            subTrend={ciTrend}
            subContext={weeklyAvgCI ? `Avg: ${weeklyAvgCI}/day` : undefined}
            sparkData={sparkData}
            icon={Activity}
          />
          <KpiCard
            label="Active Members"
            value={activeThisWeek}
            valueSuffix={`/ ${totalMembers}`}
            sub={`${retentionRate}% retention`}
            subTrend={retentionRate >= 70 ? 'up' : retentionRate < 50 ? 'down' : null}
            subContext={retentionRate < 60 ? 'Below 70% target' : retentionRate >= 80 ? 'Top 20% — excellent' : undefined}
            ring={showRing ? retentionRate : null}
            ringColor={retentionRate >= 70 ? C.success : retentionRate >= 50 ? C.warn : C.danger}
            sparkData={!showRing ? sparkData : null}
            icon={UserPlus}
          />
          <KpiCard
            label="In Gym Now"
            value={inGymNow}
            sub={inGymNow === 0
              ? (now.getHours() < 10 ? 'Early — peak at 5–7pm' : now.getHours() < 17 ? 'Quiet midday period' : 'No recent check-ins')
              : `${inGymNow === 1 ? 'Member' : 'Members'} in last 2h`}
            subTrend={inGymNow > 0 ? 'up' : null}
            sparkData={sparkData}
            icon={Users}
          />
          <KpiCard
            label="At-Risk Members"
            value={atRisk}
            sub={atRisk > 0
              ? `${Math.round((atRisk / Math.max(totalMembers, 1)) * 100)}% of gym inactive`
              : 'All members active'}
            subTrend={atRisk > 0 ? 'down' : 'up'}
            subContext={atRisk > 0 ? '14+ days without a visit' : undefined}
            sparkData={sparkData}
            icon={Zap}
            /* Value gets danger only when threshold is crossed */
            valueColor={atRisk > 0 ? C.danger : undefined}
            cta={atRisk > 0 ? 'View & message' : undefined}
            onCta={atRisk > 0 ? () => setTab('members') : undefined}
          />
        </div>

        <CheckInChart
          chartDays={chartDays}
          chartRange={chartRange}
          setChartRange={setChartRange}
          now={now}
          activeThisWeek={activeThisWeek}
        />

        <MemberGrowthCard
          newSignUps={newSignUps}
          cancelledEst={cancelledEst}
          retentionRate={retentionRate}
          monthGrowthData={monthGrowthData}
        />

        <EngagementBreakdown
          monthCiPer={monthCiPer}
          totalMembers={totalMembers}
          atRisk={atRisk}
          setTab={setTab}
        />

        <ActivityFeed
          recentActivity={recentActivity}
          now={now}
          avatarMap={avatarMap}
        />
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TodayActions
          atRisk={atRisk}
          checkIns={checkIns}
          allMemberships={allMemberships}
          posts={posts}
          challenges={challenges}
          now={now}
          openModal={openModal}
          setTab={setTab}
          newNoReturnCount={newNoReturnCount}
        />
        <QuickActionsGrid openModal={openModal} />
        <RetentionBreakdown retentionBreakdown={retentionBreakdown} setTab={setTab} />
        <WeekOneReturn week1ReturnRate={week1ReturnRate} openModal={openModal} />
      </div>
    </div>
  );
}
