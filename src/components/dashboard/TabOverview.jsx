/**
 * TabOverview — Gym Owner Intelligence Dashboard
 *
 * Premium dark-mode dashboard. Stripe × Linear × Notion aesthetic.
 * Philosophy: "What should I do today?" not just "What is happening?"
 *
 * Intelligence Layer:
 *   - Predictive churn (behavioral deviation, not just days-since)
 *   - Revenue-at-risk per member
 *   - Content-to-retention correlation
 *   - Peak flow suggestions
 *   - Best-time-to-send nudges
 *
 * No sidebar / top bar — those live in the parent shell.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  TrendingDown, ArrowUpRight, Zap,
  CheckCircle, Trophy, UserPlus, MessageSquarePlus,
  Pencil, Calendar, Activity, Users, AlertTriangle,
  ChevronRight, Minus, TrendingUp,
  Flame, BarChart2, DollarSign, Bell,
  Target, Clock, Hash, Star, Brain, Send,
  ShieldAlert, Sparkles, Eye,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — unified across all tabs
═══════════════════════════════════════════════════════════════ */
const T = {
  bg:         '#07090f',
  surface:    '#0c1220',
  surfaceEl:  '#111827',
  surfaceHov: '#141f30',
  border:     'rgba(255,255,255,0.07)',
  borderEl:   'rgba(255,255,255,0.12)',
  divider:    'rgba(255,255,255,0.045)',
  t1: '#f0f4fc',
  t2: '#8fa3be',
  t3: '#4d6380',
  t4: '#253045',
  accent:     '#3b82f6',
  accentSub:  'rgba(59,130,246,0.10)',
  accentBrd:  'rgba(59,130,246,0.22)',
  success:    '#10b981',
  successSub: 'rgba(16,185,129,0.08)',
  successBrd: 'rgba(16,185,129,0.18)',
  danger:     '#f43f5e',
  dangerSub:  'rgba(244,63,94,0.08)',
  dangerBrd:  'rgba(244,63,94,0.18)',
  warn:       '#f59e0b',
  warnSub:    'rgba(245,158,11,0.08)',
  warnBrd:    'rgba(245,158,11,0.18)',
  purple:     '#8b5cf6',
};

const RADIUS = 14;
const SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)';

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA — replace with real props in production
═══════════════════════════════════════════════════════════════ */
const MOCK = {
  gymName:        'Foundry Gym',
  ownerName:      'Max',
  todayCI:        12,
  yesterdayCI:    18,
  todayVsYest:    -33,
  totalMembers:   147,
  activeThisWeek: 89,
  activeLastWeek: 84,
  currentlyInGym: 7,
  peakHours:      '5–7 PM',
  atRisk:         5,
  newSignUps:     3,
  cancelledEst:   1,
  retentionRate:  91,
  mrr:            4820,
  newRevenue:     560,
  lostRevenue:    99,
  week1ReturnRate: 72,
  sparkCheckins:  [8, 12, 15, 9, 18, 14, 12],
  sparkActive:    [78, 82, 80, 85, 84, 89],
  sparkAtRisk:    [3, 4, 3, 5, 4, 5],

  atRiskMembers: [
    {
      name: 'Sarah Chen', lastVisit: '3 days ago', risk: 'High',
      routineStatus: 'Broken Habit', routineDetail: 'Missed 2 consecutive Monday classes — 6-month habit',
      revenueAtRisk: 150, ltv: 4200, bestTime: 'Now — active on phone',
      membership: 'Premium',
    },
    {
      name: 'Marcus Reed', lastVisit: '7 days ago', risk: 'High',
      routineStatus: 'Broken Habit', routineDetail: 'No Tue/Thu visits for 2 weeks — longest gap ever',
      revenueAtRisk: 200, ltv: 6800, bestTime: '6:30 PM — usual app time',
      membership: 'Premium+PT',
    },
    {
      name: 'Priya Patel', lastVisit: '12 days ago', risk: 'High',
      routineStatus: 'Broken Habit', routineDetail: 'Dropped from 5×/week to 0× — cancelled 3 bookings',
      revenueAtRisk: 250, ltv: 9100, bestTime: 'Now — active on phone',
      membership: 'Elite',
    },
    {
      name: "James O'Brien", lastVisit: '5 days ago', risk: 'Medium',
      routineStatus: 'Standard Gap', routineDetail: 'Holiday period — likely travel',
      revenueAtRisk: 99, ltv: 2400, bestTime: 'Tomorrow 9 AM',
      membership: 'Basic',
    },
    {
      name: 'Aisha Moyo', lastVisit: '9 days ago', risk: 'High',
      routineStatus: 'Broken Habit', routineDetail: 'Cancelled 3 upcoming bookings — first time ever',
      revenueAtRisk: 175, ltv: 5600, bestTime: 'Tomorrow 8 AM',
      membership: 'Premium',
    },
  ],

  chartDays: [
    { day: 'Mon', value: 22 }, { day: 'Tue', value: 18 },
    { day: 'Wed', value: 25 }, { day: 'Thu', value: 15 },
    { day: 'Fri', value: 28 }, { day: 'Sat', value: 20 },
    { day: 'Sun', value: 12 },
  ],

  monthGrowthData: [
    { m: 'Jan', v: 130 }, { m: 'Feb', v: 134 },
    { m: 'Mar', v: 138 }, { m: 'Apr', v: 141 },
    { m: 'May', v: 144 }, { m: 'Jun', v: 147 },
  ],

  retentionBreakdown: { healthy: 112, stable: 24, atRisk: 5, churned: 6 },

  recentActivity: [
    { type: 'checkin', name: 'Sarah Chen', time: 'Just now' },
    { type: 'email_open', name: 'Marcus Reed', time: '4m ago' },
    { type: 'signup', name: 'Dana K.', time: '12m ago', detail: 'Referral' },
    { type: 'cancel', name: 'Priya Patel', time: '18m ago', detail: 'Cancelled Thursday class' },
    { type: 'rebook', name: "James O'Brien", time: '25m ago', detail: 'Rebooked Mon PT' },
    { type: 'view_offer', name: 'Aisha Moyo', time: '31m ago', detail: 'Viewed win-back offer' },
  ],

  topPosts: [
    { title: 'HIIT Challenge Week 4', likes: 342, comments: 89, correlation: 'Members who engaged are 20% more likely to renew' },
    { title: 'Nutrition Myth-Busters', likes: 278, comments: 56, correlation: null },
    { title: 'Member Spotlight: Jake R.', likes: 215, comments: 34, correlation: 'Spotlight members retain 35% longer' },
  ],

  nudges: [
    { name: 'Priya Patel', type: 'Win-back Offer', msg: '15% off PT session', bestTime: 'Now — active on phone', urgent: true, revenueAtRisk: 250 },
    { name: 'Marcus Reed', type: 'Check-in', msg: 'Personal message from coach', bestTime: '6:30 PM — usual app time', urgent: true, revenueAtRisk: 200 },
    { name: 'Aisha Moyo', type: 'Class Invite', msg: 'New HIIT schedule drop', bestTime: 'Tomorrow 8 AM', urgent: false, revenueAtRisk: 175 },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVE ATOMS
═══════════════════════════════════════════════════════════════ */
function Card({ children, style, noPad, leftBorder }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: RADIUS,
      boxShadow: SHADOW, transition: 'border-color .2s',
      ...(leftBorder ? { borderLeft: `2.5px solid ${leftBorder}` } : {}),
      ...style,
    }}>
      <div style={noPad ? {} : { padding: 18 }}>{children}</div>
    </div>
  );
}

function CardHead({ label, icon: Icon, iconColor, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {Icon && <Icon style={{ width: 13, height: 13, color: iconColor || T.t3, strokeWidth: 2.2 }} />}
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
      </div>
      {sub && <span style={{ fontSize: 10, color: T.t4 }}>{sub}</span>}
      {action && (
        <button onClick={onAction} style={{
          fontSize: 11, fontWeight: 500, color: T.t3, background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit',
        }}>
          {action} <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      )}
    </div>
  );
}

function Badge({ label, color, sub, brd }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color, background: sub, border: `1px solid ${brd}`,
      borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap', letterSpacing: '.03em',
    }}>{label}</span>
  );
}

function Av({ name, size = 30 }) {
  const ini = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: `${T.accent}18`,
      border: `1.5px solid ${T.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: T.accent, flexShrink: 0,
    }}>{ini}</div>
  );
}

function Spark({ data, w = 64, h = 28, color = T.accent }) {
  if (!data?.length) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Ring({ pct, size = 46, stroke = 3.5, color = T.accent }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset .8s ease' }} />
    </svg>
  );
}

function Nudge({ color, icon: Icon, bold, detail }) {
  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', marginTop: 10,
      background: `${color}08`, border: `1px solid ${color}18`, borderRadius: 10,
    }}>
      <Icon style={{ width: 13, height: 13, color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: 11, lineHeight: 1.5 }}>
        <span style={{ color: T.t1, fontWeight: 600 }}>{bold} </span>
        <span style={{ color: T.t3 }}>{detail}</span>
      </div>
    </div>
  );
}

function MiniBtn({ label, onClick, color = T.t2 }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 10px', borderRadius: 6, background: T.surfaceEl,
      border: `1px solid ${T.borderEl}`, color, fontSize: 10, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'inherit', transition: 'color .15s',
    }}>{label}</button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, iconColor, title, value, sub, subTrend, subContext, sparkData,
  ringPct, ringColor, valueColor, cta, onCta, tagLabel, tagColor, tagSub, tagBrd }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {Icon && <Icon style={{ width: 13, height: 13, color: iconColor || T.t3, strokeWidth: 2.2 }} />}
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>{title}</span>
        {tagLabel && <Badge label={tagLabel} color={tagColor || T.t3} sub={tagSub || T.surfaceEl} brd={tagBrd || T.borderEl} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, color: valueColor || T.t1, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          {sub && (
            <div style={{ fontSize: 11, color: subTrend === 'up' ? T.success : subTrend === 'down' ? T.danger : T.t3, marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
              {subTrend === 'up' && <TrendingUp style={{ width: 11, height: 11 }} />}
              {subTrend === 'down' && <TrendingDown style={{ width: 11, height: 11 }} />}
              {sub}
            </div>
          )}
          {subContext && <div style={{ fontSize: 10, color: T.t4, marginTop: 3 }}>{subContext}</div>}
        </div>
        {ringPct != null
          ? <Ring pct={ringPct} size={46} stroke={3.5} color={ringColor || T.accent} />
          : sparkData?.some(v => v > 0) ? <Spark data={sparkData} w={64} h={28} color={valueColor || T.accent} /> : null
        }
      </div>
      {cta && onCta && (
        <button onClick={onCta} style={{
          marginTop: 8, width: '100%', padding: '7px 12px', borderRadius: 9,
          background: T.surfaceEl, border: `1px solid ${T.borderEl}`, color: T.t2,
          fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 5, fontFamily: 'inherit', transition: 'color .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = T.t1; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.t2; }}
        >{cta} <ChevronRight style={{ width: 10, height: 10 }} /></button>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PEAK FLOW BANNER (Intelligence)
═══════════════════════════════════════════════════════════════ */
function PeakFlowBanner({ peakHours, atRiskExpected = 4, onViewSchedule }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 16px', borderRadius: 10, marginBottom: 16,
      background: `linear-gradient(135deg, ${T.accentSub}, transparent)`,
      border: `1px solid ${T.accentBrd}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12 }}>
        <Zap style={{ width: 14, height: 14, color: T.accent }} />
        <span>
          <span style={{ color: T.t1, fontWeight: 600 }}>Peak hours starting in 30 mins.</span>{' '}
          <span style={{ color: T.t3 }}>{atRiskExpected} at-risk members expected. Great time for a 1-on-1 check-in.</span>
        </span>
      </div>
      <button onClick={onViewSchedule} style={{
        padding: '5px 12px', borderRadius: 7, background: `${T.accent}14`,
        border: `1px solid ${T.accentBrd}`, color: T.accent, fontSize: 11,
        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}>View schedule</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRIORITY ACTION PANEL
═══════════════════════════════════════════════════════════════ */
function PriorityPanel({ atRisk, atRiskMembers, newSignUps, retentionRate, mrr, openModal, setTab }) {
  const totalRevenueAtRisk = atRiskMembers?.reduce((s, m) => s + (m.revenueAtRisk || 0), 0) || 0;

  const items = useMemo(() => {
    const list = [];
    if (atRisk > 0) {
      list.push({
        color: T.danger, icon: ShieldAlert,
        title: `Message ${atRisk} at-risk members`,
        detail: `$${totalRevenueAtRisk}/mo revenue at risk — behavioral deviations detected`,
        impact: `$${totalRevenueAtRisk}/mo`,
        cta: 'Send messages', fn: () => openModal?.('message'),
      });
    }
    list.push({
      color: T.warn, icon: Bell,
      title: "Remind today's no-shows",
      detail: "Boost this week's check-ins with a gentle nudge",
      impact: 'Boost check-ins', cta: 'Send reminder', fn: () => openModal?.('reminder'),
    });
    list.push({
      color: T.success, icon: DollarSign,
      title: `Review revenue — $${mrr?.toLocaleString()} MRR`,
      detail: retentionRate >= 70 ? 'Healthy and on track this month' : 'Retention below target — affects MRR',
      impact: retentionRate >= 70 ? 'On track' : 'Action needed',
      cta: 'View revenue', fn: () => setTab?.('analytics'),
    });
    if (newSignUps > 0) {
      list.push({
        color: T.accent, icon: UserPlus,
        title: `Welcome ${newSignUps} new member${newSignUps > 1 ? 's' : ''}`,
        detail: 'Week-1 welcome doubles long-term retention',
        impact: `${newSignUps} new`, cta: 'View members', fn: () => setTab?.('members'),
      });
    }
    return list;
  }, [atRisk, newSignUps, retentionRate, mrr, totalRevenueAtRisk, openModal, setTab]);

  return (
    <Card style={{ background: `linear-gradient(135deg, ${T.surface}, ${T.surfaceEl})` }}>
      <CardHead label="Today's Priorities" icon={Target} iconColor={T.accent} sub={`${items.length} actions`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${it.color}14`, flexShrink: 0,
            }}>
              <it.icon style={{ width: 14, height: 14, color: it.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{it.title}</div>
              <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{it.detail}</div>
            </div>
            <Badge label={it.impact} color={it.color} sub={`${it.color}12`} brd={`${it.color}25`} />
            <button onClick={it.fn} style={{
              padding: '6px 12px', borderRadius: 7, background: `${it.color}14`,
              border: `1px solid ${it.color}25`, color: it.color, fontSize: 10,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>{it.cta}</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AT-RISK PREVIEW (Intelligence-Enhanced)
═══════════════════════════════════════════════════════════════ */
function AtRiskPreview({ atRiskMembers = [], openModal, setTab }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <Card leftBorder={T.danger}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <ShieldAlert style={{ width: 13, height: 13, color: T.danger }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>At-Risk Members — Behavioral Intelligence</span>
        </div>
        <button onClick={() => setTab?.('members')} style={{ fontSize: 11, fontWeight: 500, color: T.t3, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
          View all <ChevronRight style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 100px 130px 90px 90px',
        gap: 8, padding: '0 0 8px', borderBottom: `1px solid ${T.divider}`,
        fontSize: 9, fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '.1em',
      }}>
        <span>Member</span><span>Last Visit</span><span>Routine Status</span><span style={{ textAlign: 'right' }}>Revenue at Risk</span><span />
      </div>

      {atRiskMembers.map((m, i) => (
        <div key={i}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 100px 130px 90px 90px',
            gap: 8, alignItems: 'center', padding: '10px 0',
            borderBottom: i < atRiskMembers.length - 1 ? `1px solid ${T.divider}` : 'none',
            background: hoveredIdx === i ? T.surfaceHov : 'transparent',
            borderRadius: 6, transition: 'background .12s', cursor: 'pointer',
          }}>
          {/* Name + membership */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Av name={m.name} size={30} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: T.t4 }}>{m.membership}</div>
            </div>
          </div>

          {/* Last visit */}
          <div style={{ fontSize: 11, color: T.t3 }}>{m.lastVisit}</div>

          {/* Routine status */}
          <div>
            <Badge
              label={m.routineStatus}
              color={m.routineStatus === 'Broken Habit' ? T.danger : T.warn}
              sub={m.routineStatus === 'Broken Habit' ? T.dangerSub : T.warnSub}
              brd={m.routineStatus === 'Broken Habit' ? T.dangerBrd : T.warnBrd}
            />
            <div style={{ fontSize: 9, color: T.t4, marginTop: 3, lineHeight: 1.3 }}>{m.routineDetail}</div>
          </div>

          {/* Revenue at risk */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.danger, fontVariantNumeric: 'tabular-nums' }}>${m.revenueAtRisk}/mo</div>
            <div style={{ fontSize: 9, color: T.t4 }}>LTV ${m.ltv?.toLocaleString()}</div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
            {hoveredIdx === i ? (
              <>
                <MiniBtn label="Message" onClick={() => openModal?.('message')} />
                <MiniBtn label="Profile" onClick={() => openModal?.('profile')} color={T.accent} />
              </>
            ) : (
              <Badge
                label={m.risk}
                color={m.risk === 'High' ? T.danger : T.warn}
                sub={m.risk === 'High' ? T.dangerSub : T.warnSub}
                brd={m.risk === 'High' ? T.dangerBrd : T.warnBrd}
              />
            )}
          </div>
        </div>
      ))}

      <Nudge color={T.danger} icon={Brain}
        bold="Behavioral churn detection active."
        detail="These members broke established routines — not just generic inactivity. Personal outreach doubles re-engagement." />
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   IMMEDIATE NUDGES (with Best Time to Send)
═══════════════════════════════════════════════════════════════ */
function ImmediateNudges({ nudges = [], openModal }) {
  return (
    <Card>
      <CardHead label="Immediate Nudges" icon={Send} iconColor={T.accent} sub="Smart timing" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nudges.map((n, i) => (
          <div key={i} style={{
            padding: '12px 14px', borderRadius: 10, background: T.bg,
            border: n.urgent ? `1px solid ${T.dangerBrd}` : `1px solid ${T.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{n.name}</div>
                <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{n.type}: {n.msg}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {n.urgent && <Badge label="URGENT" color={T.danger} sub={T.dangerSub} brd={T.dangerBrd} />}
                <span style={{ fontSize: 10, color: T.danger, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>${n.revenueAtRisk}/mo</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.success }}>
                <Clock style={{ width: 10, height: 10 }} />
                <span>{n.bestTime}</span>
              </div>
              <button onClick={() => openModal?.('message')} style={{
                padding: '5px 12px', borderRadius: 7, background: `${T.accent}18`,
                border: `1px solid ${T.accentBrd}`, color: T.accent, fontSize: 10,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>Quick Send</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHECK-IN CHART
═══════════════════════════════════════════════════════════════ */
const axTick = { fill: T.t3, fontSize: 10, fontFamily: 'inherit' };

function CheckInChart({ chartDays = [], chartRange, setChartRange }) {
  const values = chartDays.map(d => d.value);
  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0';
  const maxVal = Math.max(...values, 1);

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <CardHead label="Check-in Activity" icon={BarChart2} iconColor={T.accent} />
        <div style={{ display: 'flex', gap: 4 }}>
          {[7, 14, 30].map(r => (
            <button key={r} onClick={() => setChartRange?.(r)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: chartRange === r ? T.accentSub : 'transparent',
              color: chartRange === r ? T.accent : T.t3,
              border: `1px solid ${chartRange === r ? T.accentBrd : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{r === 7 ? 'Week' : r === 14 ? '2 Weeks' : 'Month'}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div><span style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Daily avg</span><div style={{ fontSize: 18, fontWeight: 600, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>{avg}</div></div>
        <div><span style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Peak</span><div style={{ fontSize: 18, fontWeight: 600, color: T.t1 }}>Fri</div></div>
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartDays} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
            <XAxis dataKey="day" tick={axTick} axisLine={false} tickLine={false} />
            <YAxis tick={axTick} axisLine={false} tickLine={false} width={28} />
            <ReferenceLine y={parseFloat(avg)} stroke={T.t4} strokeDasharray="4 4" />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {chartDays.map((d, i) => (
                <Cell key={i} fill={d.value >= parseFloat(avg) ? T.accent : `${T.accent}50`} />
              ))}
            </Bar>
            <Tooltip
              cursor={{ fill: `${T.accent}08` }}
              contentStyle={{ background: T.surfaceEl, border: `1px solid ${T.borderEl}`, borderRadius: 8, fontSize: 12, color: T.t1 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVENUE CARD
═══════════════════════════════════════════════════════════════ */
function RevenueCard({ mrr, newRevenue, lostRevenue, retentionRate }) {
  const health = retentionRate >= 85 ? 'Healthy' : retentionRate >= 70 ? 'Moderate' : 'At Risk';
  const healthColor = retentionRate >= 85 ? T.success : retentionRate >= 70 ? T.warn : T.danger;

  return (
    <Card>
      <CardHead label="Revenue" icon={DollarSign} iconColor={T.success} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>MRR</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>${mrr?.toLocaleString()}</div>
          <Badge label={health} color={healthColor} sub={`${healthColor}12`} brd={`${healthColor}25`} />
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>New Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: T.success, fontVariantNumeric: 'tabular-nums' }}>+${newRevenue}</div>
          <div style={{ fontSize: 10, color: T.t3 }}>This month</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Lost Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: lostRevenue > 0 ? T.danger : T.t1, fontVariantNumeric: 'tabular-nums' }}>-${lostRevenue}</div>
          <div style={{ fontSize: 10, color: T.t3 }}>Churn</div>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MEMBER GROWTH
═══════════════════════════════════════════════════════════════ */
function MemberGrowthCard({ newSignUps, cancelledEst, retentionRate, monthGrowthData }) {
  const net = (newSignUps || 0) - (cancelledEst || 0);
  return (
    <Card>
      <CardHead label="Member Growth" icon={Users} iconColor={T.accent} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 600, color: net >= 0 ? T.success : T.danger, fontVariantNumeric: 'tabular-nums' }}>
            {net >= 0 ? '+' : ''}{net}
          </div>
          <div style={{ fontSize: 10, color: T.t3 }}>Net this month</div>
        </div>
        <div style={{ fontSize: 11, color: T.t3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span><span style={{ color: T.success }}>+{newSignUps}</span> joined</span>
          <span><span style={{ color: T.danger }}>-{cancelledEst}</span> cancelled</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Spark data={monthGrowthData?.map(d => d.v) || []} w={80} h={30} color={T.accent} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em' }}>Retention</div>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.border, overflow: 'hidden' }}>
          <div style={{ width: `${retentionRate}%`, height: '100%', borderRadius: 2, background: retentionRate >= 85 ? T.success : T.warn }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>{retentionRate}%</span>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ENGAGEMENT BREAKDOWN
═══════════════════════════════════════════════════════════════ */
function EngagementBreakdown({ totalMembers, atRisk, setTab, retentionBreakdown }) {
  const segments = [
    { label: 'Healthy', count: retentionBreakdown?.healthy || 0, color: T.success },
    { label: 'Stable', count: retentionBreakdown?.stable || 0, color: T.accent },
    { label: 'At Risk', count: retentionBreakdown?.atRisk || 0, color: T.danger },
    { label: 'Churned', count: retentionBreakdown?.churned || 0, color: T.t4 },
  ];
  const total = segments.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <Card>
      <CardHead label="Retention Breakdown" icon={Activity} iconColor={T.accent} action="Details" onAction={() => setTab?.('analytics')} />
      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14, gap: 2 }}>
        {segments.filter(s => s.count > 0).map((s, i) => (
          <div key={i} style={{ flex: s.count, background: s.color, borderRadius: 3 }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.t2 }}>{s.label}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>{s.count}</span>
            <span style={{ fontSize: 10, color: T.t4 }}>{Math.round((s.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOP POSTS (with Content-to-Retention Correlation)
═══════════════════════════════════════════════════════════════ */
function TopPostsCard({ posts = [] }) {
  return (
    <Card>
      <CardHead label="Top Performing Posts" icon={Sparkles} iconColor={T.purple} sub="Content intelligence" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {posts.map((p, i) => (
          <div key={i} style={{
            padding: '10px 12px', borderRadius: 8, background: T.bg,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{p.title}</div>
            <div style={{ fontSize: 10, color: T.t3, marginTop: 3, display: 'flex', gap: 12 }}>
              <span>♡ {p.likes}</span>
              <span>💬 {p.comments}</span>
            </div>
            {p.correlation && (
              <div style={{
                marginTop: 7, padding: '6px 10px', borderRadius: 6,
                background: T.successSub, border: `1px solid ${T.successBrd}`,
                fontSize: 10, color: T.success, display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.4,
              }}>
                <Brain style={{ width: 11, height: 11, flexShrink: 0 }} />
                {p.correlation}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY FEED (Live Pulse)
═══════════════════════════════════════════════════════════════ */
function ActivityFeed({ recentActivity = [] }) {
  const typeConfig = {
    checkin:    { color: T.success, label: 'checked in' },
    email_open: { color: T.t3, label: 'opened your email' },
    signup:     { color: T.accent, label: 'signed up' },
    cancel:     { color: T.danger, label: '' },
    rebook:     { color: T.success, label: '' },
    view_offer: { color: T.warn, label: '' },
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, boxShadow: `0 0 6px ${T.success}60` }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em' }}>Live Pulse</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {recentActivity.map((ev, i) => {
          const cfg = typeConfig[ev.type] || { color: T.t3, label: '' };
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'start', gap: 10, padding: '7px 0',
              borderBottom: i < recentActivity.length - 1 ? `1px solid ${T.divider}` : 'none',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.t1 }}>
                  <span style={{ fontWeight: 600 }}>{ev.name}</span>{' '}
                  <span style={{ color: T.t3 }}>{cfg.label || ev.detail}</span>
                </div>
                {ev.detail && cfg.label && <div style={{ fontSize: 10, color: T.t4, marginTop: 1 }}>{ev.detail}</div>}
              </div>
              <span style={{ fontSize: 10, color: T.t4, whiteSpace: 'nowrap', flexShrink: 0 }}>{ev.time}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT SIDEBAR: ACTION ITEMS
═══════════════════════════════════════════════════════════════ */
function ActionItemsPanel({ atRisk, atRiskMembers, newSignUps, openModal, setTab, newNoReturnCount }) {
  const items = [];
  if (atRisk > 0) {
    const names = atRiskMembers?.slice(0, 2).map(m => m.name).join(', ') || '';
    const totalRev = atRiskMembers?.reduce((s, m) => s + (m.revenueAtRisk || 0), 0) || 0;
    items.push({
      color: T.danger, title: `Message ${atRisk} at-risk members`,
      detail: `${names} — $${totalRev}/mo at risk`,
      cta: 'Send messages', fn: () => openModal?.('message'),
    });
  }
  items.push({
    color: T.warn, title: "Remind today's no-shows",
    detail: 'Send a gentle nudge to boost weekly check-ins',
    cta: 'Send reminder', fn: () => openModal?.('reminder'),
  });
  if (newSignUps > 0) {
    items.push({
      color: T.accent, title: `${newSignUps} trial sign-ups expiring soon`,
      detail: 'Follow up before they lapse',
      cta: 'Follow up', fn: () => setTab?.('members'),
    });
  }
  if (newNoReturnCount > 0) {
    items.push({
      color: T.purple, title: `${newNoReturnCount} new members haven't returned`,
      detail: 'Week-1 outreach is critical for retention',
      cta: 'View', fn: () => setTab?.('members'),
    });
  }

  return (
    <Card>
      <CardHead label="Action Items" icon={Zap} iconColor={T.warn} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            padding: '10px 12px', borderRadius: 8, background: T.bg,
            borderLeft: `2.5px solid ${it.color}`, border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>{it.title}</div>
            <div style={{ fontSize: 10, color: T.t3, marginTop: 3 }}>{it.detail}</div>
            <button onClick={it.fn} style={{
              marginTop: 7, padding: '5px 10px', borderRadius: 6, background: T.surfaceEl,
              border: `1px solid ${T.borderEl}`, color: T.t2, fontSize: 10, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{it.cta}</button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT SIDEBAR: QUICK ACTIONS
═══════════════════════════════════════════════════════════════ */
function QuickActions({ openModal }) {
  const actions = [
    { label: 'Create Post', icon: MessageSquarePlus, fn: () => openModal?.('post') },
    { label: 'Add Member', icon: UserPlus, fn: () => openModal?.('addMember') },
    { label: 'Start Challenge', icon: Trophy, fn: () => openModal?.('challenge') },
    { label: 'Create Event', icon: Calendar, fn: () => openModal?.('event') },
  ];
  return (
    <Card>
      <CardHead label="Quick Actions" icon={Zap} iconColor={T.accent} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {actions.map((a, i) => (
          <button key={i} onClick={a.fn} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 8,
            background: T.bg, border: `1px solid ${T.border}`, color: T.t2, fontSize: 11,
            fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s, color .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderEl; e.currentTarget.style.color = T.t1; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.t2; }}
          >
            <a.icon style={{ width: 13, height: 13, strokeWidth: 2 }} />
            {a.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT SIDEBAR: RETENTION BREAKDOWN
═══════════════════════════════════════════════════════════════ */
function RetentionSidebar({ retentionBreakdown, setTab }) {
  const segments = [
    { label: 'Healthy', count: retentionBreakdown?.healthy || 0, color: T.success },
    { label: 'Stable', count: retentionBreakdown?.stable || 0, color: T.accent },
    { label: 'At Risk', count: retentionBreakdown?.atRisk || 0, color: T.danger },
  ];
  return (
    <Card>
      <CardHead label="Retention" icon={ShieldAlert} iconColor={T.success} action="View" onAction={() => setTab?.('analytics')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: T.t3, width: 55 }}>{s.label}</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
              <div style={{ width: `${(s.count / (retentionBreakdown?.healthy + retentionBreakdown?.stable + retentionBreakdown?.atRisk || 1)) * 100}%`, height: '100%', borderRadius: 3, background: s.color }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.t1, fontVariantNumeric: 'tabular-nums', width: 24, textAlign: 'right' }}>{s.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT SIDEBAR: WEEK-1 RETURN
═══════════════════════════════════════════════════════════════ */
function WeekOneReturn({ week1ReturnRate, openModal }) {
  return (
    <Card>
      <CardHead label="Week-1 Return Rate" icon={Star} iconColor={T.warn} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Ring pct={week1ReturnRate} size={50} stroke={4} color={week1ReturnRate >= 70 ? T.success : T.warn} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 600, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>{week1ReturnRate}%</div>
          <div style={{ fontSize: 10, color: T.t3 }}>of new members return within 7 days</div>
        </div>
      </div>
      <Nudge color={T.accent} icon={Brain}
        bold="Insight:"
        detail="Members who return within 7 days are 3× more likely to stay long-term." />
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════ */
export default function TabOverview({
  gymName, ownerName, todayCI, yesterdayCI, todayVsYest, totalMembers,
  activeThisWeek, activeLastWeek, currentlyInGym, peakHours,
  atRisk, atRiskMembers, newSignUps, cancelledEst, retentionRate,
  mrr, newRevenue, lostRevenue, week1ReturnRate, retentionBreakdown,
  chartDays, monthGrowthData, recentActivity, challenges, posts, checkIns,
  newNoReturnCount, topPosts, nudges,
  openModal, setTab,
  ...rest
} = {}) {
  /* Fallback to mock data */
  const d = {
    gymName: gymName ?? MOCK.gymName,
    ownerName: ownerName ?? MOCK.ownerName,
    todayCI: todayCI ?? MOCK.todayCI,
    yesterdayCI: yesterdayCI ?? MOCK.yesterdayCI,
    todayVsYest: todayVsYest ?? MOCK.todayVsYest,
    totalMembers: totalMembers ?? MOCK.totalMembers,
    activeThisWeek: activeThisWeek ?? MOCK.activeThisWeek,
    activeLastWeek: activeLastWeek ?? MOCK.activeLastWeek,
    currentlyInGym: currentlyInGym ?? MOCK.currentlyInGym,
    peakHours: peakHours ?? MOCK.peakHours,
    atRisk: atRisk ?? MOCK.atRisk,
    atRiskMembers: atRiskMembers ?? MOCK.atRiskMembers,
    newSignUps: newSignUps ?? MOCK.newSignUps,
    cancelledEst: cancelledEst ?? MOCK.cancelledEst,
    retentionRate: retentionRate ?? MOCK.retentionRate,
    mrr: mrr ?? MOCK.mrr,
    newRevenue: newRevenue ?? MOCK.newRevenue,
    lostRevenue: lostRevenue ?? MOCK.lostRevenue,
    week1ReturnRate: week1ReturnRate ?? MOCK.week1ReturnRate,
    retentionBreakdown: retentionBreakdown ?? MOCK.retentionBreakdown,
    chartDays: chartDays ?? MOCK.chartDays,
    monthGrowthData: monthGrowthData ?? MOCK.monthGrowthData,
    recentActivity: recentActivity ?? MOCK.recentActivity,
    topPosts: topPosts ?? MOCK.topPosts,
    nudges: nudges ?? MOCK.nudges,
    newNoReturnCount: newNoReturnCount ?? 2,
  };

  const now = new Date();
  const [chartRange, setChartRange] = useState(7);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const activeVsLast = d.activeLastWeek > 0
    ? Math.round(((d.activeThisWeek - d.activeLastWeek) / d.activeLastWeek) * 100)
    : 0;

  const sparkData = MOCK.sparkCheckins;
  const totalRevAtRisk = d.atRiskMembers.reduce((s, m) => s + (m.revenueAtRisk || 0), 0);

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: T.t1, margin: 0, letterSpacing: '-0.01em' }}>
          {greeting}, {d.ownerName} — <span style={{ color: T.t3, fontWeight: 400 }}>here's what to focus on today</span>
        </h1>
        <p style={{ fontSize: 12, color: T.t4, margin: '4px 0 0' }}>
          {format(now, 'EEEE, MMMM d, yyyy')} · {d.totalMembers} members · Last sync 2m ago
        </p>
      </div>

      {/* Peak Flow Banner */}
      <PeakFlowBanner peakHours={d.peakHours} atRiskExpected={4} onViewSchedule={() => setTab?.('schedule')} />

      {/* Priority Panel */}
      <div style={{ marginBottom: 16 }}>
        <PriorityPanel
          atRisk={d.atRisk} atRiskMembers={d.atRiskMembers} newSignUps={d.newSignUps}
          retentionRate={d.retentionRate} mrr={d.mrr} openModal={openModal} setTab={setTab}
        />
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

        {/* ─── LEFT MAIN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KpiCard
              icon={CheckCircle} iconColor={T.accent} title="Today's Check-ins"
              value={d.todayCI}
              sub={`${d.todayVsYest >= 0 ? '+' : ''}${d.todayVsYest}% vs yesterday`}
              subTrend={d.todayVsYest >= 0 ? 'up' : 'down'}
              tagLabel={d.todayCI < d.yesterdayCI ? 'Quiet' : 'Above avg'}
              tagColor={d.todayCI < d.yesterdayCI ? T.warn : T.success}
              tagSub={d.todayCI < d.yesterdayCI ? T.warnSub : T.successSub}
              tagBrd={d.todayCI < d.yesterdayCI ? T.warnBrd : T.successBrd}
              sparkData={sparkData}
              cta="Send reminder" onCta={() => openModal?.('reminder')}
            />
            <KpiCard
              icon={Users} iconColor={T.accent} title="Active This Week"
              value={`${d.activeThisWeek}`}
              sub={`${activeVsLast >= 0 ? '+' : ''}${activeVsLast}% vs last week`}
              subTrend={activeVsLast >= 0 ? 'up' : 'down'}
              subContext={`${d.activeThisWeek} of ${d.totalMembers} members`}
              sparkData={MOCK.sparkActive}
            />
            <KpiCard
              icon={Flame} iconColor={T.success} title="Currently In Gym"
              value={d.currentlyInGym}
              sub={`Peak usually ${d.peakHours}`}
              ringPct={Math.min(100, (d.currentlyInGym / 20) * 100)}
              ringColor={T.success}
            />
            <KpiCard
              icon={AlertTriangle} iconColor={T.danger} title="At-Risk Members"
              value={d.atRisk}
              sub={d.atRisk > 0
                ? `${Math.round((d.atRisk / d.totalMembers) * 100)}% of gym · $${totalRevAtRisk}/mo at risk`
                : 'All members active'
              }
              subTrend={d.atRisk > 0 ? 'down' : 'up'}
              sparkData={MOCK.sparkAtRisk}
              valueColor={d.atRisk > 0 ? T.danger : undefined}
              cta={d.atRisk > 0 ? 'View & message' : undefined}
              onCta={d.atRisk > 0 ? () => setTab?.('members') : undefined}
            />
          </div>

          {/* At-Risk Preview (Intelligence Enhanced) */}
          {d.atRisk > 0 && (
            <AtRiskPreview atRiskMembers={d.atRiskMembers} openModal={openModal} setTab={setTab} />
          )}

          {/* Check-in Chart */}
          <CheckInChart chartDays={d.chartDays} chartRange={chartRange} setChartRange={setChartRange} />

          {/* Revenue */}
          <RevenueCard mrr={d.mrr} newRevenue={d.newRevenue} lostRevenue={d.lostRevenue} retentionRate={d.retentionRate} />

          {/* Member Growth */}
          <MemberGrowthCard newSignUps={d.newSignUps} cancelledEst={d.cancelledEst} retentionRate={d.retentionRate} monthGrowthData={d.monthGrowthData} />

          {/* Engagement / Retention Breakdown */}
          <EngagementBreakdown totalMembers={d.totalMembers} atRisk={d.atRisk} setTab={setTab} retentionBreakdown={d.retentionBreakdown} />

          {/* Top Posts with Correlation Intelligence */}
          <TopPostsCard posts={d.topPosts} />

          {/* Activity Feed */}
          <ActivityFeed recentActivity={d.recentActivity} />
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>
          <ActionItemsPanel
            atRisk={d.atRisk} atRiskMembers={d.atRiskMembers} newSignUps={d.newSignUps}
            openModal={openModal} setTab={setTab} newNoReturnCount={d.newNoReturnCount}
          />
          <ImmediateNudges nudges={d.nudges} openModal={openModal} />
          <QuickActions openModal={openModal} />
          <RetentionSidebar retentionBreakdown={d.retentionBreakdown} setTab={setTab} />
          <WeekOneReturn week1ReturnRate={d.week1ReturnRate} openModal={openModal} />
        </div>
      </div>
    </div>
  );
}
