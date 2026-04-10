/**
 * TabOverview — Forge Fitness · Premium Gym Owner Intelligence Dashboard
 *
 * Design Language: Deep Obsidian + Navy Blue + Vibrant Cyan
 * Inspired by: Linear × Stripe × Vercel × Arc
 *
 * Color System:
 *   Background:   #060B14 (obsidian)
 *   Surface:      #0A1628 (deep navy glass)
 *   Card:         rgba(10,22,40,0.85) with glassmorphic border
 *   CTA/Button:   #0F1C3A → #1E3A8A (navy blue gradient)
 *   Accent/Data:  #00E5FF → #67E8F9 (vibrant cyan)
 *   Success:      #00C9A7
 *   Danger:       #FF4D6D
 *   Warning:      #FFB547
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, AreaChart, Area,
  LineChart, Line,
} from 'recharts';
import {
  TrendingDown, TrendingUp, Zap, CheckCircle, Trophy, UserPlus,
  MessageSquarePlus, Calendar, Activity, Users, AlertTriangle,
  ChevronRight, Flame, BarChart2, DollarSign, Bell, Target, Clock,
  Star, Brain, Send, ShieldAlert, Sparkles, ArrowUpRight,
  ArrowDownRight, Eye, Lock, RefreshCw, Cpu, Radio,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */
const T = {
  // Backgrounds
  bg:          '#060B14',
  bgDeep:      '#040810',
  surface:     '#0A1628',
  surfaceEl:   '#0D1E38',
  surfaceHov:  '#112240',
  surfaceGlass:'rgba(10,22,40,0.75)',

  // Borders
  border:      'rgba(0,229,255,0.08)',
  borderEl:    'rgba(0,229,255,0.16)',
  borderGlass: 'rgba(255,255,255,0.06)',
  divider:     'rgba(0,229,255,0.05)',

  // Text
  t1: '#F0F6FF',
  t2: '#8BA8CC',
  t3: '#4A6A8A',
  t4: '#243552',

  // CTA — Navy Blue
  cta:         '#1E3A8A',
  ctaLight:    '#2D4FA8',
  ctaGrad:     'linear-gradient(135deg, #0F1C3A 0%, #1E3A8A 100%)',
  ctaGradHov:  'linear-gradient(135deg, #1a2f5a 0%, #2563EB 100%)',
  ctaBrd:      'rgba(30,58,138,0.6)',

  // Accent — Cyan
  cyan:        '#00E5FF',
  cyanMid:     '#38BDF8',
  cyanSoft:    '#67E8F9',
  cyanSub:     'rgba(0,229,255,0.08)',
  cyanBrd:     'rgba(0,229,255,0.20)',
  cyanGlow:    '0 0 20px rgba(0,229,255,0.25)',

  // Semantic
  success:     '#00C9A7',
  successSub:  'rgba(0,201,167,0.08)',
  successBrd:  'rgba(0,201,167,0.20)',
  danger:      '#FF4D6D',
  dangerSub:   'rgba(255,77,109,0.08)',
  dangerBrd:   'rgba(255,77,109,0.20)',
  warn:        '#FFB547',
  warnSub:     'rgba(255,181,71,0.08)',
  warnBrd:     'rgba(255,181,71,0.20)',
  purple:      '#8B5CF6',
  purpleSub:   'rgba(139,92,246,0.08)',
  purpleBrd:   'rgba(139,92,246,0.20)',
};

const RADIUS = 16;
const GLASS_SHADOW = `
  0 1px 0 rgba(255,255,255,0.05) inset,
  0 4px 24px rgba(0,0,0,0.5),
  0 0 0 1px rgba(0,229,255,0.06)
`;
const CARD_SHADOW = `
  0 2px 0 rgba(255,255,255,0.03) inset,
  0 8px 32px rgba(0,0,0,0.6),
  0 0 0 1px rgba(0,229,255,0.07)
`;

/* ══════════════════════════════════════════════════════════════
   MOCK DATA
══════════════════════════════════════════════════════════════ */
const MOCK = {
  gymName:        'Forge Fitness',
  ownerName:      'Max',
  todayCI:        34,
  yesterdayCI:    27,
  todayVsYest:    +24,
  totalMembers:   147,
  activeThisWeek: 42,
  activeLastWeek: 39,
  currentlyInGym: 19,
  peakHours:      '5–7 PM',
  atRisk:         5,
  newSignUps:     3,
  cancelledEst:   1,
  retentionRate:  96,
  mrr:            4820,
  newRevenue:     560,
  lostRevenue:    99,
  week1ReturnRate: 72,

  atRiskMembers: [
    { name: 'Sarah Chen',    lastVisit: '3 days ago',  risk: 'High',   routineStatus: 'Broken Habit',  routineDetail: 'Missed 2 consecutive Monday classes — 6-month habit', revenueAtRisk: 150, ltv: 4200, bestTime: 'Now — active on phone', membership: 'Premium' },
    { name: 'Marcus Reed',   lastVisit: '7 days ago',  risk: 'High',   routineStatus: 'Broken Habit',  routineDetail: 'No Tue/Thu visits for 2 weeks — longest gap ever',  revenueAtRisk: 200, ltv: 6800, bestTime: '6:30 PM — usual app time', membership: 'Premium+PT' },
    { name: 'Priya Patel',   lastVisit: '12 days ago', risk: 'High',   routineStatus: 'Broken Habit',  routineDetail: 'Dropped from 5×/week to 0× — cancelled 3 bookings', revenueAtRisk: 250, ltv: 9100, bestTime: 'Now — active on phone', membership: 'Elite' },
    { name: "James O'Brien", lastVisit: '5 days ago',  risk: 'Medium', routineStatus: 'Standard Gap',  routineDetail: 'Holiday period — likely travel',                    revenueAtRisk: 99,  ltv: 2400, bestTime: 'Tomorrow 9 AM', membership: 'Basic' },
    { name: 'Aisha Moyo',    lastVisit: '9 days ago',  risk: 'High',   routineStatus: 'Broken Habit',  routineDetail: 'Cancelled 3 upcoming bookings — first time ever',   revenueAtRisk: 175, ltv: 5600, bestTime: 'Tomorrow 8 AM', membership: 'Premium' },
  ],

  chartDays: [
    { day: 'Mon', value: 22 }, { day: 'Tue', value: 18 },
    { day: 'Wed', value: 25 }, { day: 'Thu', value: 15 },
    { day: 'Fri', value: 34 }, { day: 'Sat', value: 20 },
    { day: 'Sun', value: 12 },
  ],

  retentionTrend: [
    { m: 'Nov', v: 88 }, { m: 'Dec', v: 90 }, { m: 'Jan', v: 91 },
    { m: 'Feb', v: 93 }, { m: 'Mar', v: 94 }, { m: 'Apr', v: 96 },
  ],

  monthGrowthData: [
    { m: 'Nov', v: 130 }, { m: 'Dec', v: 134 }, { m: 'Jan', v: 138 },
    { m: 'Feb', v: 141 }, { m: 'Mar', v: 144 }, { m: 'Apr', v: 147 },
  ],

  retentionBreakdown: { healthy: 112, stable: 24, atRisk: 5, churned: 6 },

  recentActivity: [
    { type: 'checkin',    name: 'Sarah Chen',    time: 'Just now',  detail: 'Checked in · Studio A' },
    { type: 'email_open', name: 'Marcus Reed',   time: '4m ago',    detail: 'Opened re-engagement email' },
    { type: 'signup',     name: 'Dana K.',        time: '12m ago',   detail: 'New member · Referral from Jake' },
    { type: 'cancel',     name: 'Priya Patel',   time: '18m ago',   detail: 'Cancelled Thursday HIIT class' },
    { type: 'rebook',     name: "James O'Brien",  time: '25m ago',   detail: 'Rebooked Monday PT session' },
    { type: 'view_offer', name: 'Aisha Moyo',    time: '31m ago',   detail: 'Viewed win-back offer (15% off)' },
  ],

  topPosts: [
    { title: 'HIIT Challenge Week 4', likes: 342, comments: 89, correlation: 'Engaged members 20% more likely to renew' },
    { title: 'Nutrition Myth-Busters', likes: 278, comments: 56, correlation: null },
    { title: 'Member Spotlight: Jake R.', likes: 215, comments: 34, correlation: 'Spotlight members retain 35% longer' },
  ],

  nudges: [
    { name: 'Priya Patel',  type: 'Win-back Offer', msg: '15% off PT session',          bestTime: 'Now — active on phone',    urgent: true,  revenueAtRisk: 250 },
    { name: 'Marcus Reed',  type: 'Check-in',       msg: 'Personal message from coach', bestTime: '6:30 PM — usual app time', urgent: true,  revenueAtRisk: 200 },
    { name: 'Aisha Moyo',   type: 'Class Invite',   msg: 'New HIIT schedule drop',      bestTime: 'Tomorrow 8 AM',            urgent: false, revenueAtRisk: 175 },
  ],

  sparkCheckins:  [8, 12, 15, 9, 18, 22, 34],
  sparkActive:    [78, 82, 80, 85, 84, 89, 42],
  sparkAtRisk:    [3, 4, 3, 5, 4, 5, 5],
};

/* ══════════════════════════════════════════════════════════════
   PRIMITIVES
══════════════════════════════════════════════════════════════ */

function Card({ children, style, noPad, glowColor, leftBorder }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.surfaceGlass,
        border: `1px solid ${hov ? (glowColor ? `${glowColor}25` : T.borderEl) : T.border}`,
        borderRadius: RADIUS,
        boxShadow: hov ? `${CARD_SHADOW}, 0 0 30px ${glowColor || T.cyan}12` : CARD_SHADOW,
        backdropFilter: 'blur(20px)',
        transition: 'border-color .25s, box-shadow .25s',
        ...(leftBorder ? { borderLeft: `2px solid ${leftBorder}` } : {}),
        ...style,
      }}
    >
      <div style={noPad ? {} : { padding: 20 }}>{children}</div>
    </div>
  );
}

function SectionLabel({ label, icon: Icon, color, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {Icon && (
          <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color || T.cyan}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ width: 11, height: 11, color: color || T.cyan }} />
          </div>
        )}
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</span>
        {sub && <span style={{ fontSize: 10, color: T.t4, marginLeft: 4 }}>· {sub}</span>}
      </div>
      {action && (
        <button onClick={onAction} style={{
          fontSize: 11, fontWeight: 500, color: T.t3, background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
          fontFamily: 'inherit', transition: 'color .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = T.cyan}
          onMouseLeave={e => e.currentTarget.style.color = T.t3}
        >{action} <ChevronRight style={{ width: 10, height: 10 }} /></button>
      )}
    </div>
  );
}

function Badge({ label, color, sub, brd }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color, background: sub, border: `1px solid ${brd}`,
      borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap', letterSpacing: '.04em',
    }}>{label}</span>
  );
}

function Av({ name, size = 32 }) {
  const ini = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
  const hue = (name?.charCodeAt(0) || 0) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, hsl(${hue},60%,20%), hsl(${hue},80%,35%))`,
      border: `1.5px solid hsl(${hue},70%,45%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color: 'white', flexShrink: 0,
      boxShadow: `0 0 10px hsl(${hue},60%,30%)40`,
    }}>{ini}</div>
  );
}

function Spark({ data, w = 72, h = 30, color = T.cyan }) {
  if (!data?.length) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`).join(' ');
  const area = `${pts} ${w},${h} 0,${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`sg${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg${color.replace(/[^a-z0-9]/gi,'')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Ring({ pct, size = 52, stroke = 4, color = T.cyan, track = T.border }) {
  const r = (size - stroke * 2) / 2, circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, pct) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)`, transition: 'stroke-dashoffset .9s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
}

function NavyBtn({ label, icon: Icon, onClick, size = 'md', full = false }) {
  const [hov, setHov] = useState(false);
  const pad = size === 'sm' ? '5px 12px' : '8px 16px';
  const fs = size === 'sm' ? 10 : 12;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: pad, borderRadius: 9,
        background: hov ? T.ctaGradHov : T.ctaGrad,
        border: `1px solid ${hov ? 'rgba(37,99,235,0.7)' : T.ctaBrd}`,
        color: '#fff', fontSize: fs, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 5, whiteSpace: 'nowrap',
        width: full ? '100%' : undefined,
        boxShadow: hov ? `0 0 20px rgba(0,229,255,0.2), 0 4px 12px rgba(0,0,0,0.4)` : `0 2px 8px rgba(0,0,0,0.4)`,
        transition: 'all .2s',
      }}>
      {Icon && <Icon style={{ width: fs + 1, height: fs + 1 }} />}
      {label}
    </button>
  );
}

function CyanBtn({ label, icon: Icon, onClick, size = 'sm' }) {
  const [hov, setHov] = useState(false);
  const pad = size === 'sm' ? '5px 12px' : '8px 16px';
  const fs = size === 'sm' ? 10 : 12;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: pad, borderRadius: 8,
        background: hov ? `rgba(0,229,255,0.15)` : T.cyanSub,
        border: `1px solid ${hov ? T.cyan : T.cyanBrd}`,
        color: T.cyan, fontSize: fs, fontWeight: 600, cursor: 'pointer',
        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
        boxShadow: hov ? `0 0 16px rgba(0,229,255,0.2)` : 'none',
        transition: 'all .2s', whiteSpace: 'nowrap',
      }}>
      {Icon && <Icon style={{ width: fs + 1, height: fs + 1 }} />}
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   LIVE TICKER BANNER
══════════════════════════════════════════════════════════════ */
function LiveBanner({ atRisk, peakHours, onView }) {
  const [dot, setDot] = useState(true);
  useEffect(() => { const t = setInterval(() => setDot(d => !d), 1100); return () => clearInterval(t); }, []);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 18px', borderRadius: 12, marginBottom: 18,
      background: `linear-gradient(135deg, rgba(0,229,255,0.05), rgba(30,58,138,0.12))`,
      border: `1px solid ${T.cyanBrd}`,
      boxShadow: `0 0 40px rgba(0,229,255,0.06)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: T.cyan,
            boxShadow: dot ? `0 0 8px ${T.cyan}` : 'none',
            transition: 'box-shadow .4s',
          }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: T.cyan, textTransform: 'uppercase', letterSpacing: '.1em' }}>Live</span>
        </div>
        <div style={{ width: 1, height: 14, background: T.border }} />
        <span style={{ color: T.t1, fontWeight: 600 }}>Peak hours in 18 mins.</span>
        <span style={{ color: T.t3 }}>{atRisk} at-risk members expected · AI predicts 3 potential churns · 4 new community posts today</span>
      </div>
      <CyanBtn label="View" icon={Eye} onClick={onView} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════════════════════════ */
function KpiCard({ icon: Icon, iconColor, title, value, sub, subTrend, subContext,
  sparkData, sparkColor, ringPct, ringColor, cta, onCta, badge, valueColor }) {
  return (
    <Card glowColor={iconColor || T.cyan}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: `${iconColor || T.cyan}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 12, height: 12, color: iconColor || T.cyan }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em' }}>{title}</span>
        {badge && <Badge {...badge} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: valueColor || T.t1, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: subTrend === 'up' ? T.success : subTrend === 'down' ? T.danger : T.t3, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              {subTrend === 'up' && <ArrowUpRight style={{ width: 12, height: 12 }} />}
              {subTrend === 'down' && <ArrowDownRight style={{ width: 12, height: 12 }} />}
              {sub}
            </div>
          )}
          {subContext && <div style={{ fontSize: 10, color: T.t4, marginTop: 3 }}>{subContext}</div>}
        </div>
        {ringPct != null
          ? <Ring pct={ringPct} size={52} stroke={4} color={ringColor || T.cyan} />
          : sparkData ? <Spark data={sparkData} w={72} h={32} color={sparkColor || iconColor || T.cyan} /> : null
        }
      </div>

      {cta && (
        <NavyBtn label={cta} onClick={onCta} size="sm" full />
      )}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   PRIORITY PANEL
══════════════════════════════════════════════════════════════ */
function PriorityPanel({ atRisk, atRiskMembers, newSignUps, retentionRate, mrr, openModal, setTab }) {
  const totalRev = atRiskMembers?.reduce((s, m) => s + (m.revenueAtRisk || 0), 0) || 0;
  const items = [
    atRisk > 0 && { color: T.danger, icon: ShieldAlert, title: `Nudge ${atRisk} at-risk members`, detail: `$${totalRev}/mo revenue at risk — behavioral deviations detected`, impact: `$${totalRev}/mo`, cta: 'Send messages', fn: () => openModal?.('message'), badge: 'Urgent' },
    { color: T.warn, icon: Bell, title: "Launch 30-Day Strength Surge challenge", detail: 'Members in active challenges churn 40% less — optimal launch window now', impact: 'Run It', cta: 'Start challenge', fn: () => openModal?.('challenge'), badge: 'Run It' },
    { color: T.success, icon: DollarSign, title: `Review April revenue impact`, detail: `$${mrr?.toLocaleString()} MRR · Retention at ${retentionRate}% — elite tier`, impact: 'On track', cta: 'View revenue', fn: () => setTab?.('analytics') },
    newSignUps > 0 && { color: T.cyan, icon: UserPlus, title: `Welcome ${newSignUps} new members`, detail: 'Week-1 welcome message doubles long-term retention probability', impact: `${newSignUps} new`, cta: 'View members', fn: () => setTab?.('members') },
  ].filter(Boolean);

  return (
    <Card glowColor={T.cyan} style={{ marginBottom: 18 }}>
      <SectionLabel label="Today's Priorities" icon={Target} color={T.cyan} sub={`${items.length} actions`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
            background: T.bgDeep, borderRadius: 12,
            border: `1px solid ${i === 0 ? `${T.danger}25` : T.border}`,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${it.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <it.icon style={{ width: 15, height: 15, color: it.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, marginBottom: 2 }}>{it.title}</div>
              <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.4 }}>{it.detail}</div>
            </div>
            <Badge label={it.impact || it.badge} color={it.color} sub={`${it.color}10`} brd={`${it.color}22`} />
            <NavyBtn label={it.cta} onClick={it.fn} size="sm" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   RETENTION TREND CHART (Premium)
══════════════════════════════════════════════════════════════ */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.surfaceEl, border: `1px solid ${T.cyanBrd}`, borderRadius: 10, padding: '8px 14px', fontSize: 12, color: T.t1, boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 20px ${T.cyan}15` }}>
      <div style={{ color: T.t3, fontSize: 10, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: T.cyan }}>{payload[0]?.value}%</div>
    </div>
  );
};

function RetentionChart({ retentionTrend = [], chartRange, setChartRange }) {
  return (
    <Card glowColor={T.cyan}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionLabel label="30-Day Retention Trend" icon={Activity} color={T.cyan} />
        <div style={{ display: 'flex', gap: 4 }}>
          {[7, 14, 30].map(r => (
            <button key={r} onClick={() => setChartRange?.(r)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: chartRange === r ? T.cyanSub : 'transparent',
              color: chartRange === r ? T.cyan : T.t3,
              border: `1px solid ${chartRange === r ? T.cyanBrd : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}>{r === 7 ? 'Week' : r === 14 ? '2W' : 'Month'}</button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Current</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.cyan, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, textShadow: `0 0 20px ${T.cyan}60` }}>96%</div>
          <div style={{ fontSize: 10, color: T.success, display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}><ArrowUpRight style={{ width: 10, height: 10 }} />+4% from last week · Elite Tier</div>
        </div>
        <div style={{ width: 1, background: T.border }} />
        <div>
          <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Peak</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: T.t1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>Apr</div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 4 }}>Best month ever</div>
        </div>
        <div style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 10, background: `${T.cyan}08`, border: `1px solid ${T.cyanBrd}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain style={{ width: 14, height: 14, color: T.cyan }} />
          <div style={{ fontSize: 11 }}>
            <div style={{ color: T.t1, fontWeight: 600 }}>AI Insight</div>
            <div style={{ color: T.t3, fontSize: 10 }}>HIIT cohort is +31% more likely to stay</div>
          </div>
        </div>
      </div>

      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={retentionTrend} margin={{ top: 10, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.cyan} stopOpacity={0.3} />
                <stop offset="100%" stopColor={T.cyan} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
            <XAxis dataKey="m" tick={{ fill: T.t3, fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
            <YAxis domain={[85, 100]} tick={{ fill: T.t3, fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="v" stroke={T.cyan} strokeWidth={2.5} fill="url(#cyanGrad)"
              dot={{ fill: T.cyan, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: T.cyan, strokeWidth: 2, stroke: T.surface, filter: `drop-shadow(0 0 8px ${T.cyan})` }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   CHECK-IN CHART
══════════════════════════════════════════════════════════════ */
function CheckInChart({ chartDays = [] }) {
  const avg = (chartDays.reduce((s, d) => s + d.value, 0) / (chartDays.length || 1)).toFixed(1);
  return (
    <Card glowColor={T.cta}>
      <SectionLabel label="Check-in Activity" icon={BarChart2} color={T.cyanMid} sub="This week" />
      <div style={{ display: 'flex', gap: 28, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Daily avg</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>{avg}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Today</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.cyan, fontVariantNumeric: 'tabular-nums' }}>34</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 2 }}>Peak day</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.t1 }}>Fri</div>
        </div>
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartDays} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke={T.divider} vertical={false} />
            <XAxis dataKey="day" tick={{ fill: T.t3, fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.t3, fontSize: 10, fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={26} />
            <ReferenceLine y={parseFloat(avg)} stroke={T.t4} strokeDasharray="4 4" />
            <Tooltip cursor={{ fill: `${T.cyan}06` }}
              contentStyle={{ background: T.surfaceEl, border: `1px solid ${T.cyanBrd}`, borderRadius: 8, fontSize: 12, color: T.t1 }} />
            <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={28}>
              {chartDays.map((d, i) => (
                <Cell key={i}
                  fill={d.value === 34 ? T.cyan : d.value >= parseFloat(avg) ? `${T.cyan}70` : `${T.cyan}30`}
                  style={d.value === 34 ? { filter: `drop-shadow(0 0 8px ${T.cyan}80)` } : {}}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   AT-RISK TABLE
══════════════════════════════════════════════════════════════ */
function AtRiskPreview({ atRiskMembers = [], openModal, setTab }) {
  const [hovIdx, setHovIdx] = useState(null);
  return (
    <Card leftBorder={T.danger} glowColor={T.danger}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: `${T.danger}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert style={{ width: 12, height: 12, color: T.danger }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em' }}>At-Risk Members — Behavioral Intelligence</span>
        </div>
        <CyanBtn label="View all" onClick={() => setTab?.('members')} />
      </div>

      {/* Headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 110px 150px 100px 110px',
        gap: 8, padding: '0 0 10px', borderBottom: `1px solid ${T.divider}`,
        fontSize: 9, fontWeight: 700, color: T.t4, textTransform: 'uppercase', letterSpacing: '.12em',
      }}>
        <span>Member</span><span>Last Visit</span><span>Routine Status</span>
        <span style={{ textAlign: 'right' }}>At Risk</span><span />
      </div>

      {atRiskMembers.map((m, i) => (
        <div key={i}
          onMouseEnter={() => setHovIdx(i)}
          onMouseLeave={() => setHovIdx(null)}
          style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 150px 100px 110px',
            gap: 8, alignItems: 'center', padding: '12px 8px',
            borderBottom: i < atRiskMembers.length - 1 ? `1px solid ${T.divider}` : 'none',
            background: hovIdx === i ? T.surfaceHov : 'transparent',
            borderRadius: 10, transition: 'background .12s', cursor: 'pointer',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Av name={m.name} size={32} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: T.t4 }}>{m.membership}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.t3 }}>{m.lastVisit}</div>
          <div>
            <Badge label={m.routineStatus}
              color={m.routineStatus === 'Broken Habit' ? T.danger : T.warn}
              sub={m.routineStatus === 'Broken Habit' ? T.dangerSub : T.warnSub}
              brd={m.routineStatus === 'Broken Habit' ? T.dangerBrd : T.warnBrd}
            />
            <div style={{ fontSize: 9, color: T.t4, marginTop: 4, lineHeight: 1.3 }}>{m.routineDetail}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.danger, fontVariantNumeric: 'tabular-nums' }}>${m.revenueAtRisk}/mo</div>
            <div style={{ fontSize: 9, color: T.t4 }}>LTV ${m.ltv?.toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {hovIdx === i ? (
              <>
                <NavyBtn label="Message" onClick={() => openModal?.('message')} size="sm" />
                <CyanBtn label="Profile" onClick={() => openModal?.('profile')} />
              </>
            ) : (
              <Badge label={m.risk}
                color={m.risk === 'High' ? T.danger : T.warn}
                sub={m.risk === 'High' ? T.dangerSub : T.warnSub}
                brd={m.risk === 'High' ? T.dangerBrd : T.warnBrd}
              />
            )}
          </div>
        </div>
      ))}

      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', marginTop: 14,
        background: `${T.danger}06`, border: `1px solid ${T.danger}18`, borderRadius: 12,
      }}>
        <Brain style={{ width: 13, height: 13, color: T.danger, flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 11, lineHeight: 1.5, color: T.t3 }}>
          <span style={{ color: T.t1, fontWeight: 600 }}>Behavioral churn detection active. </span>
          These members broke established routines — not just generic inactivity. Personal outreach doubles re-engagement.
        </div>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   REVENUE
══════════════════════════════════════════════════════════════ */
function RevenueCard({ mrr, newRevenue, lostRevenue, retentionRate }) {
  return (
    <Card glowColor={T.success}>
      <SectionLabel label="Revenue" icon={DollarSign} color={T.success} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {[
          { label: 'MRR', value: `$${mrr?.toLocaleString()}`, color: T.t1, sub: retentionRate >= 85 ? 'Healthy' : 'Moderate', subColor: T.success },
          { label: 'New Revenue', value: `+$${newRevenue}`, color: T.success, sub: 'This month' },
          { label: 'Lost Revenue', value: `-$${lostRevenue}`, color: lostRevenue > 0 ? T.danger : T.t1, sub: 'Churn' },
        ].map((it, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: T.bgDeep, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{it.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: it.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>{it.value}</div>
            {it.subColor
              ? <Badge label={it.sub} color={it.subColor} sub={`${it.subColor}12`} brd={`${it.subColor}25`} />
              : <div style={{ fontSize: 10, color: T.t3 }}>{it.sub}</div>
            }
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   MEMBER GROWTH
══════════════════════════════════════════════════════════════ */
function MemberGrowthCard({ newSignUps, cancelledEst, retentionRate, monthGrowthData }) {
  const net = (newSignUps || 0) - (cancelledEst || 0);
  return (
    <Card glowColor={T.cyan}>
      <SectionLabel label="Member Growth" icon={Users} color={T.cyan} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 700, color: net >= 0 ? T.success : T.danger, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {net >= 0 ? '+' : ''}{net}
          </div>
          <div style={{ fontSize: 10, color: T.t3, marginTop: 4 }}>Net this month</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: T.t3 }}>
          <span><span style={{ color: T.success, fontWeight: 600 }}>+{newSignUps}</span> joined</span>
          <span><span style={{ color: T.danger, fontWeight: 600 }}>-{cancelledEst}</span> cancelled</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Spark data={monthGrowthData?.map(d => d.v) || []} w={90} h={34} color={T.cyan} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, color: T.t4, textTransform: 'uppercase', letterSpacing: '.08em', flexShrink: 0 }}>Retention</span>
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
          <div style={{
            width: `${retentionRate}%`, height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${T.cyanMid}, ${T.cyan})`,
            boxShadow: `0 0 8px ${T.cyan}60`,
          }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.cyan, fontVariantNumeric: 'tabular-nums' }}>{retentionRate}%</span>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   ENGAGEMENT BREAKDOWN
══════════════════════════════════════════════════════════════ */
function EngagementBreakdown({ retentionBreakdown, setTab }) {
  const segs = [
    { label: 'Healthy', count: retentionBreakdown?.healthy || 0, color: T.success },
    { label: 'Stable',  count: retentionBreakdown?.stable  || 0, color: T.cyan },
    { label: 'At Risk', count: retentionBreakdown?.atRisk  || 0, color: T.danger },
    { label: 'Churned', count: retentionBreakdown?.churned || 0, color: T.t4 },
  ];
  const total = segs.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <Card glowColor={T.cyan}>
      <SectionLabel label="Retention Breakdown" icon={Activity} color={T.cyan} action="Details" onAction={() => setTab?.('analytics')} />
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 18, gap: 2 }}>
        {segs.filter(s => s.count > 0).map((s, i) => (
          <div key={i} style={{ flex: s.count, background: s.color, borderRadius: 4, boxShadow: s.color === T.cyan ? `0 0 6px ${T.cyan}60` : undefined }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: T.bgDeep, border: `1px solid ${T.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: s.color !== T.t4 ? `0 0 6px ${s.color}80` : undefined }} />
            <div style={{ flex: 1, fontSize: 11, color: T.t2 }}>{s.label}</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, fontVariantNumeric: 'tabular-nums' }}>{s.count}</span>
            <span style={{ fontSize: 10, color: T.t4 }}>{Math.round((s.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMMUNITY HIGHLIGHTS
══════════════════════════════════════════════════════════════ */
function CommunityHighlights({ posts = [], openModal }) {
  return (
    <Card glowColor={T.purple}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <SectionLabel label="Community Highlights" icon={Sparkles} color={T.purple} sub="Content intelligence" />
        <div style={{ display: 'flex', gap: 6 }}>
          <NavyBtn label="Post Photo" onClick={() => openModal?.('post')} size="sm" />
          <NavyBtn label="Create Challenge" onClick={() => openModal?.('challenge')} size="sm" />
          <NavyBtn label="Schedule Event" onClick={() => openModal?.('event')} size="sm" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {posts.map((p, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: T.bgDeep, border: `1px solid ${T.border}`, cursor: 'pointer', transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.cyanBrd}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, marginBottom: 8, lineHeight: 1.3 }}>{p.title}</div>
            <div style={{ fontSize: 10, color: T.t3, display: 'flex', gap: 12, marginBottom: 8 }}>
              <span>♡ {p.likes}</span><span>💬 {p.comments}</span>
            </div>
            {p.correlation && (
              <div style={{ padding: '6px 10px', borderRadius: 8, background: T.successSub, border: `1px solid ${T.successBrd}`, fontSize: 10, color: T.success, display: 'flex', gap: 6, lineHeight: 1.4 }}>
                <Brain style={{ width: 10, height: 10, flexShrink: 0, marginTop: 1 }} />
                {p.correlation}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   LIVE ACTIVITY FEED
══════════════════════════════════════════════════════════════ */
function ActivityFeed({ recentActivity = [] }) {
  const cfg = {
    checkin:    { color: T.success, dot: true },
    email_open: { color: T.t3 },
    signup:     { color: T.cyan, dot: true },
    cancel:     { color: T.danger },
    rebook:     { color: T.success },
    view_offer: { color: T.warn },
  };
  const [pulse, setPulse] = useState(true);
  useEffect(() => { const t = setInterval(() => setPulse(p => !p), 1400); return () => clearInterval(t); }, []);

  return (
    <Card glowColor={T.success}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.success, boxShadow: pulse ? `0 0 10px ${T.success}` : 'none', transition: 'box-shadow .5s' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em' }}>Live Pulse</span>
      </div>
      {recentActivity.map((ev, i) => {
        const c = cfg[ev.type] || { color: T.t3 };
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 0',
            borderBottom: i < recentActivity.length - 1 ? `1px solid ${T.divider}` : 'none',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0, marginTop: 5, boxShadow: i === 0 ? `0 0 6px ${c.color}` : 'none' }} />
            <Av name={ev.name} size={26} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.t1 }}><span style={{ fontWeight: 600 }}>{ev.name}</span></div>
              <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{ev.detail}</div>
            </div>
            <span style={{ fontSize: 10, color: T.t4, flexShrink: 0 }}>{ev.time}</span>
          </div>
        );
      })}
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR: ACTION ITEMS
══════════════════════════════════════════════════════════════ */
function ActionItemsPanel({ atRisk, atRiskMembers, newSignUps, openModal, setTab, newNoReturnCount }) {
  const totalRev = atRiskMembers?.reduce((s, m) => s + (m.revenueAtRisk || 0), 0) || 0;
  const items = [
    atRisk > 0 && { color: T.danger, icon: ShieldAlert, title: `Nudge ${atRisk} at-risk members`, detail: `${atRiskMembers?.slice(0,2).map(m=>m.name).join(', ')} — $${totalRev}/mo`, cta: 'Send messages', fn: () => openModal?.('message') },
    { color: T.warn, icon: Bell, title: "Remind today's no-shows", detail: 'Gentle nudge to boost weekly check-ins', cta: 'Send reminder', fn: () => openModal?.('reminder') },
    newSignUps > 0 && { color: T.cyan, icon: UserPlus, title: `${newSignUps} trials expiring soon`, detail: 'Follow up before they lapse', cta: 'Follow up', fn: () => setTab?.('members') },
    newNoReturnCount > 0 && { color: T.purple, icon: Star, title: `${newNoReturnCount} new members haven't returned`, detail: 'Week-1 outreach is critical', cta: 'View', fn: () => setTab?.('members') },
  ].filter(Boolean);

  return (
    <Card glowColor={T.warn}>
      <SectionLabel label="Action Items" icon={Zap} color={T.warn} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: T.bgDeep, borderLeft: `2px solid ${it.color}`, border: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <it.icon style={{ width: 12, height: 12, color: it.color, flexShrink: 0 }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: T.t1 }}>{it.title}</div>
            </div>
            <div style={{ fontSize: 10, color: T.t3, marginBottom: 8, paddingLeft: 20 }}>{it.detail}</div>
            <NavyBtn label={it.cta} onClick={it.fn} size="sm" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR: IMMEDIATE NUDGES
══════════════════════════════════════════════════════════════ */
function ImmediateNudges({ nudges = [], openModal }) {
  return (
    <Card glowColor={T.cyan}>
      <SectionLabel label="Immediate Nudges" icon={Send} color={T.cyan} sub="Smart timing" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {nudges.map((n, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: T.bgDeep, border: `1px solid ${n.urgent ? T.dangerBrd : T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{n.name}</div>
                <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>{n.type}: {n.msg}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                {n.urgent && <Badge label="URGENT" color={T.danger} sub={T.dangerSub} brd={T.dangerBrd} />}
                <span style={{ fontSize: 10, color: T.danger, fontWeight: 700 }}>${n.revenueAtRisk}/mo</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.success }}>
                <Clock style={{ width: 10, height: 10 }} />{n.bestTime}
              </div>
              <NavyBtn label="Quick Send" onClick={() => openModal?.('message')} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR: QUICK ACTIONS
══════════════════════════════════════════════════════════════ */
function QuickActions({ openModal }) {
  const actions = [
    { label: '+ New Post',       icon: MessageSquarePlus, fn: () => openModal?.('post') },
    { label: 'Add Member',       icon: UserPlus,          fn: () => openModal?.('addMember') },
    { label: 'Start Challenge',  icon: Trophy,            fn: () => openModal?.('challenge') },
    { label: 'Schedule Event',   icon: Calendar,          fn: () => openModal?.('event') },
  ];
  return (
    <Card>
      <SectionLabel label="Quick Actions" icon={Zap} color={T.cyan} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {actions.map((a, i) => (
          <button key={i} onClick={a.fn} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 12px', borderRadius: 10,
            background: T.bgDeep, border: `1px solid ${T.border}`, color: T.t2, fontSize: 11,
            fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.cyanBrd; e.currentTarget.style.color = T.t1; e.currentTarget.style.background = T.cyanSub; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.t2; e.currentTarget.style.background = T.bgDeep; }}
          >
            <a.icon style={{ width: 13, height: 13 }} />{a.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR: RETENTION
══════════════════════════════════════════════════════════════ */
function RetentionSidebar({ retentionBreakdown, setTab }) {
  const segs = [
    { label: 'Healthy', count: retentionBreakdown?.healthy || 0, color: T.success },
    { label: 'Stable',  count: retentionBreakdown?.stable  || 0, color: T.cyan },
    { label: 'At Risk', count: retentionBreakdown?.atRisk  || 0, color: T.danger },
  ];
  const total = segs.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <Card glowColor={T.success}>
      <SectionLabel label="Retention" icon={ShieldAlert} color={T.success} action="View" onAction={() => setTab?.('analytics')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: T.t3, width: 52, flexShrink: 0 }}>{s.label}</span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: T.border, overflow: 'hidden' }}>
              <div style={{ width: `${(s.count / total) * 100}%`, height: '100%', borderRadius: 3, background: s.color, boxShadow: `0 0 6px ${s.color}60`, transition: 'width .8s ease' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.t1, width: 22, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR: WEEK-1 RETURN
══════════════════════════════════════════════════════════════ */
function WeekOneReturn({ week1ReturnRate }) {
  return (
    <Card glowColor={T.warn}>
      <SectionLabel label="Week-1 Return Rate" icon={Star} color={T.warn} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <Ring pct={week1ReturnRate} size={56} stroke={4.5} color={week1ReturnRate >= 70 ? T.success : T.warn} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: T.t1 }}>{week1ReturnRate}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: T.t3, lineHeight: 1.4 }}>of new members<br />return within 7 days</div>
        </div>
      </div>
      <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: `${T.cyan}07`, border: `1px solid ${T.cyanBrd}`, fontSize: 11, color: T.t3, display: 'flex', gap: 8 }}>
        <Brain style={{ width: 12, height: 12, color: T.cyan, flexShrink: 0, marginTop: 1 }} />
        <span><span style={{ color: T.t1, fontWeight: 600 }}>Insight: </span>Members who return in 7 days are 3× more likely to stay long-term.</span>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════════ */
export default function TabOverview({
  gymName, ownerName, todayCI, yesterdayCI, todayVsYest, totalMembers,
  activeThisWeek, activeLastWeek, currentlyInGym, peakHours,
  atRisk, atRiskMembers, newSignUps, cancelledEst, retentionRate,
  mrr, newRevenue, lostRevenue, week1ReturnRate, retentionBreakdown,
  chartDays, monthGrowthData, recentActivity, topPosts, nudges,
  newNoReturnCount, openModal, setTab,
} = {}) {
  const num = (v, fb) => typeof v === 'number' ? v : fb;
  const str = (v, fb) => typeof v === 'string' ? v : fb;
  const arr = (v, fb) => Array.isArray(v) ? v : fb;
  const obj = (v, fb) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : fb;

  const d = {
    gymName:           str(gymName, MOCK.gymName),
    ownerName:         str(ownerName, MOCK.ownerName),
    todayCI:           num(todayCI, MOCK.todayCI),
    yesterdayCI:       num(yesterdayCI, MOCK.yesterdayCI),
    todayVsYest:       num(todayVsYest, MOCK.todayVsYest),
    totalMembers:      num(totalMembers, MOCK.totalMembers),
    activeThisWeek:    num(activeThisWeek, MOCK.activeThisWeek),
    activeLastWeek:    num(activeLastWeek, MOCK.activeLastWeek),
    currentlyInGym:    num(currentlyInGym, MOCK.currentlyInGym),
    peakHours:         str(peakHours, MOCK.peakHours),
    atRisk:            num(atRisk, MOCK.atRisk),
    atRiskMembers:     arr(atRiskMembers, MOCK.atRiskMembers),
    newSignUps:        num(newSignUps, MOCK.newSignUps),
    cancelledEst:      num(cancelledEst, MOCK.cancelledEst),
    retentionRate:     num(retentionRate, MOCK.retentionRate),
    mrr:               num(mrr, MOCK.mrr),
    newRevenue:        num(newRevenue, MOCK.newRevenue),
    lostRevenue:       num(lostRevenue, MOCK.lostRevenue),
    week1ReturnRate:   num(week1ReturnRate, MOCK.week1ReturnRate),
    retentionBreakdown:obj(retentionBreakdown, MOCK.retentionBreakdown),
    chartDays:         arr(chartDays, MOCK.chartDays),
    monthGrowthData:   arr(monthGrowthData, MOCK.monthGrowthData),
    recentActivity:    arr(recentActivity, MOCK.recentActivity),
    topPosts:          arr(topPosts, MOCK.topPosts),
    nudges:            arr(nudges, MOCK.nudges),
    newNoReturnCount:  num(newNoReturnCount, 2),
  };

  const now = new Date();
  const [chartRange, setChartRange] = useState(30);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const activeVsLast = d.activeLastWeek > 0 ? Math.round(((d.activeThisWeek - d.activeLastWeek) / d.activeLastWeek) * 100) : 0;
  const totalRevAtRisk = d.atRiskMembers.reduce((s, m) => s + (m.revenueAtRisk || 0), 0);

  return (
    <div style={{
      maxWidth: 1400, margin: '0 auto',
      fontFamily: "'DM Sans', 'IBM Plex Sans', -apple-system, sans-serif",
      color: T.t1,
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {greeting}, {d.ownerName}.{' '}
              <span style={{ color: T.cyan, textShadow: `0 0 20px ${T.cyan}50` }}>Your retention pulse is strong today.</span>
            </h1>
            <p style={{ fontSize: 12, color: T.t3, margin: '6px 0 0', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ color: T.t2 }}>{d.activeThisWeek} members active</span>
              <span style={{ color: T.t4 }}>·</span>
              <span style={{ color: T.success }}>{d.retentionRate}% weekly retention</span>
              <span style={{ color: T.t4 }}>·</span>
              <span style={{ color: T.cyan }}>+{activeVsLast}% from last week</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: T.t4 }}>{format(now, 'EEEE d MMMM yyyy')}</span>
            <NavyBtn label="+ New Post" icon={MessageSquarePlus} onClick={() => openModal?.('post')} size="md" />
          </div>
        </div>
      </div>

      {/* ── Live Banner ── */}
      <LiveBanner atRisk={d.atRisk} peakHours={d.peakHours} onView={() => setTab?.('schedule')} />

      {/* ── Priority Panel ── */}
      <PriorityPanel
        atRisk={d.atRisk} atRiskMembers={d.atRiskMembers} newSignUps={d.newSignUps}
        retentionRate={d.retentionRate} mrr={d.mrr} openModal={openModal} setTab={setTab}
      />

      {/* ── Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>

        {/* ─── LEFT ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <KpiCard
              icon={CheckCircle} iconColor={T.cyan} title="Today's Check-ins"
              value={d.todayCI}
              sub={`${d.todayVsYest >= 0 ? '+' : ''}${d.todayVsYest}% vs yesterday`}
              subTrend={d.todayVsYest >= 0 ? 'up' : 'down'}
              sparkData={MOCK.sparkCheckins} sparkColor={T.cyan}
              badge={{ label: d.todayCI < d.yesterdayCI ? 'Quiet' : '+24%', color: d.todayCI < d.yesterdayCI ? T.warn : T.success, sub: d.todayCI < d.yesterdayCI ? T.warnSub : T.successSub, brd: d.todayCI < d.yesterdayCI ? T.warnBrd : T.successBrd }}
              cta="Send reminder" onCta={() => openModal?.('reminder')}
            />
            <KpiCard
              icon={Users} iconColor={T.cyanMid} title="Weekly Active Members"
              value={d.activeThisWeek}
              sub={`${activeVsLast >= 0 ? '+' : ''}${activeVsLast}% vs last week`}
              subTrend={activeVsLast >= 0 ? 'up' : 'down'}
              subContext={`${d.activeThisWeek} of ${d.totalMembers} members`}
              sparkData={MOCK.sparkActive} sparkColor={T.cyanMid}
            />
            <KpiCard
              icon={Flame} iconColor={T.success} title="Live in Gym"
              value={d.currentlyInGym}
              sub={`Peak ${d.peakHours}`}
              ringPct={Math.min(100, (d.currentlyInGym / 25) * 100)}
              ringColor={T.success}
            />
            <KpiCard
              icon={Star} iconColor={T.cyan} title="Retention Score"
              value={`${d.retentionRate}%`}
              sub="Elite Tier · +4% from last week"
              subTrend="up"
              ringPct={d.retentionRate}
              ringColor={T.cyan}
              valueColor={T.cyan}
            />
          </div>

          {/* Retention Trend Chart */}
          <RetentionChart retentionTrend={MOCK.retentionTrend} chartRange={chartRange} setChartRange={setChartRange} />

          {/* At-Risk Table */}
          {d.atRisk > 0 && <AtRiskPreview atRiskMembers={d.atRiskMembers} openModal={openModal} setTab={setTab} />}

          {/* Check-in Chart */}
          <CheckInChart chartDays={d.chartDays} />

          {/* Revenue */}
          <RevenueCard mrr={d.mrr} newRevenue={d.newRevenue} lostRevenue={d.lostRevenue} retentionRate={d.retentionRate} />

          {/* Member Growth */}
          <MemberGrowthCard newSignUps={d.newSignUps} cancelledEst={d.cancelledEst} retentionRate={d.retentionRate} monthGrowthData={d.monthGrowthData} />

          {/* Engagement Breakdown */}
          <EngagementBreakdown retentionBreakdown={d.retentionBreakdown} setTab={setTab} />

          {/* Community Highlights */}
          <CommunityHighlights posts={d.topPosts} openModal={openModal} />

          {/* Live Pulse */}
          <ActivityFeed recentActivity={d.recentActivity} />
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>
          <ActionItemsPanel atRisk={d.atRisk} atRiskMembers={d.atRiskMembers} newSignUps={d.newSignUps} openModal={openModal} setTab={setTab} newNoReturnCount={d.newNoReturnCount} />
          <ImmediateNudges nudges={d.nudges} openModal={openModal} />
          <QuickActions openModal={openModal} />
          <RetentionSidebar retentionBreakdown={d.retentionBreakdown} setTab={setTab} />
          <WeekOneReturn week1ReturnRate={d.week1ReturnRate} />
        </div>
      </div>
    </div>
  );
}
