/**
 * GymRetentionDashboard.jsx
 * Retention Intelligence — premium redesign.
 *
 * Aesthetic: Obsidian Intelligence.
 * Near-monochrome. Typography carries hierarchy. Color is signal, not decoration.
 * Red appears once (revenue at risk). Amber appears once (retention rate). That's it.
 *
 * Compatible prop interface:
 *   selectedGym, allMemberships, atRisk, retentionRate, classes, isLoading
 */

import { useState } from 'react';
import {
  TrendingDown, TrendingUp, Users, Activity, Zap,
  Target, AlertTriangle, ChevronDown, ChevronUp,
  Calendar, MessageSquare, Bell, ArrowRight, Info,
  MapPin, Star, Award, Edit3,
} from 'lucide-react';
import { AppButton } from '@/components/ui/AppButton';
import { AppProgressBar } from '@/components/ui/AppProgressBar';
import { cn } from '@/lib/utils';

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK = {
  gym: {
    name: 'Iron & Oak Fitness',
    type: 'CrossFit',
    city: 'Manchester',
    founded: '2018',
    rating: 4.8,
    reviewCount: 214,
    tagline: 'Where iron meets intention.',
    heroBg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80&fit=crop',
    profileImg: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&q=80&fit=crop&crop=faces',
  },
  summary: {
    totalMembers: 87, activeMembers: 61, newThisMonth: 9,
    inactiveMembers: 14, atRiskCount: 12, retentionRate: 68,
    engagementRate: 70, pricePerMember: 65, avgCheckInsWeek: 2.3,
  },
  focus: [
    { urgent: true,  headline: "12 members haven't checked in for 14+ days",         sub: '£780 per month currently at risk of cancellation',              cta: 'View members'    },
    { urgent: false, headline: '4 of 9 new members haven\'t returned after Week 1',  sub: 'Early drop-off is the leading churn indicator',                 cta: 'Review segment'  },
    { urgent: false, headline: 'Thursday evening CrossFit is 43% below capacity',    sub: 'Consider promoting to at-risk members as a re-engagement hook', cta: null              },
  ],
  atRiskMembers: [
    { id: 1, name: 'Jamie L.',  initials: 'JL', lastSeen: '21 days', driver: 'No check-ins',           tier: 'Monthly', riskLevel: 'high'   },
    { id: 2, name: 'Priya S.',  initials: 'PS', lastSeen: '18 days', driver: 'Booking frequency drop',  tier: 'Monthly', riskLevel: 'high'   },
    { id: 3, name: 'Marcus D.', initials: 'MD', lastSeen: '17 days', driver: 'No check-ins',           tier: 'Monthly', riskLevel: 'high'   },
    { id: 4, name: 'Ryan W.',   initials: 'RW', lastSeen: '22 days', driver: 'No check-ins',           tier: 'Monthly', riskLevel: 'high'   },
    { id: 5, name: 'Sofia R.',  initials: 'SR', lastSeen: '15 days', driver: 'Streak broken',          tier: 'Monthly', riskLevel: 'medium' },
    { id: 6, name: 'Tom K.',    initials: 'TK', lastSeen: '14 days', driver: 'Only 1 class / week',    tier: 'Monthly', riskLevel: 'medium' },
    { id: 7, name: 'Aisha M.',  initials: 'AM', lastSeen: '14 days', driver: 'Booking frequency drop', tier: 'Monthly', riskLevel: 'medium' },
    { id: 8, name: 'Leila H.',  initials: 'LH', lastSeen: '16 days', driver: 'Streak broken',         tier: 'Monthly', riskLevel: 'medium' },
  ],
  riskDrivers: [
    { label: 'No check-ins (14+ days)',    n: 5, pct: 42 },
    { label: 'Booking frequency declined', n: 4, pct: 33 },
    { label: 'Attendance streak broken',   n: 3, pct: 25 },
  ],
  dropOff: [
    { label: 'Joined',  n: 87, pct: 100 },
    { label: 'Week 1',  n: 79, pct: 91  },
    { label: 'Week 2',  n: 68, pct: 78  },
    { label: 'Month 1', n: 61, pct: 70  },
    { label: 'Month 3', n: 52, pct: 60  },
  ],
  peakHeatmap: {
    days:  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    slots: ['6am', '9am', '12pm', '3pm', '6pm', '8pm'],
    data: [
      [7, 4, 3, 1, 8, 9, 2],
      [5, 3, 2, 1, 4, 7, 3],
      [4, 5, 6, 3, 4, 5, 2],
      [2, 2, 2, 1, 2, 3, 4],
      [9,10, 8, 5,10, 6, 3],
      [3, 4, 3, 2, 3, 2, 1],
    ],
  },
  trends: {
    months:     ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
    members:    [71, 73, 77, 80, 84, 87],
    checkIns:   [138, 130, 155, 148, 162, 158],
    retention:  [72, 71, 69, 70, 69, 68],
    engagement: [73, 71, 70, 71, 70, 70],
  },
  classes: [
    { name: 'Morning WOD',       coach: 'Sam T',  avg: 13, cap: 15, trend:  1 },
    { name: 'Lunchtime HIIT',    coach: 'Sam T',  avg: 8,  cap: 12, trend: -2 },
    { name: 'Evening CrossFit',  coach: 'Alex R', avg: 9,  cap: 16, trend: -3 },
    { name: 'Saturday Open Gym', coach: 'Alex R', avg: 11, cap: 20, trend:  2 },
  ],
  newMembers: [
    { name: 'Nina B.',   initials: 'NB', days: 8,  checkIns: 3, status: 'active'   },
    { name: 'Carl J.',   initials: 'CJ', days: 11, checkIns: 1, status: 'at-risk'  },
    { name: 'Yasmin O.', initials: 'YO', days: 14, checkIns: 0, status: 'inactive' },
    { name: 'Liam P.',   initials: 'LP', days: 6,  checkIns: 2, status: 'active'   },
    { name: 'Rosa T.',   initials: 'RT', days: 9,  checkIns: 0, status: 'inactive' },
    { name: 'Omar F.',   initials: 'OF', days: 5,  checkIns: 4, status: 'active'   },
    { name: 'Ellie V.',  initials: 'EV', days: 12, checkIns: 0, status: 'inactive' },
    { name: 'Ben C.',    initials: 'BC', days: 7,  checkIns: 1, status: 'at-risk'  },
    { name: 'Zoe W.',    initials: 'ZW', days: 3,  checkIns: 2, status: 'active'   },
  ],
};

// ─── Precomputed class maps ────────────────────────────────────────────────────
const STATUS_CLS = {
  active:   'text-[#8b95b3]',
  'at-risk':'text-red-500',
  inactive: 'text-[#4b5578]',
};
const STATUS_LABEL = { active: 'Active', 'at-risk': 'At risk', inactive: 'Inactive' };

// ─── Primitives ────────────────────────────────────────────────────────────────

function Label({ children, className }) {
  return (
    <span className={cn('text-[9px] font-bold tracking-[0.13em] uppercase text-[#4b5578]', className)}>
      {children}
    </span>
  );
}

function Avatar({ initials, size = 28 }) {
  return (
    <div
      className="flex items-center justify-center shrink-0 rounded-full bg-[#0d1225] border border-white/[0.04] font-bold text-[#8b95b3] tracking-tight"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {initials}
    </div>
  );
}

function Sparkline({ data, color = '#4b5578', width = 100, height = 32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const id = `sp${color.replace(/[^a-z0-9]/gi, '')}${Math.random().toString(36).slice(2,6)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Hero Section ───────────────────────────────────────────────────────────────
function HeroSection({ gym, summary }) {
  return (
    <div className="relative">
      {/* Banner image */}
      <div className="relative h-[140px] sm:h-[280px] overflow-hidden bg-[#0d1225]">
        <img
          src={gym.heroBg}
          alt="Gym banner"
          className="w-full h-full object-cover object-[center_40%] block brightness-[0.45] saturate-[0.6]"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        {/* Dark gradient vignette */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(8,9,15,0.18) 0%, rgba(8,9,15,0.10) 35%, rgba(8,9,15,0.55) 70%, rgba(8,9,15,0.97) 100%)',
        }} />

        {/* Edit cover button */}
        <button className="absolute top-[18px] right-6 flex items-center gap-1.5 px-[14px] py-[6px] bg-[rgba(8,9,15,0.55)] backdrop-blur-[8px] border border-white/[0.07] rounded-[7px] text-[10px] font-semibold text-[#8b95b3] cursor-pointer tracking-[0.04em]">
          <Edit3 className="w-[10px] h-[10px]" />
          Edit cover
        </button>

        {/* Gym tagline — bottom left of banner */}
        <div className="absolute" style={{ bottom: 44 + 24, left: 24 + 88 + 20 }}>
          <div className="text-[11px] text-[rgba(237,242,255,0.35)] italic tracking-[0.03em]">
            {gym.tagline}
          </div>
        </div>
      </div>

      {/* Profile row — overlaps banner bottom */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-9 relative" style={{ marginTop: -44 }}>
        <div className="flex flex-wrap items-end gap-4 pb-6">

          {/* Profile image ring */}
          <div className="relative shrink-0 z-10">
            <div className="rounded-full p-[3px]" style={{
              width: 94, height: 94,
              background: 'conic-gradient(from 180deg, rgba(237,242,255,0.12), rgba(237,242,255,0.04), rgba(237,242,255,0.12))',
            }}>
              <div className="w-full h-full rounded-full bg-[#0d1225] overflow-hidden border-2 border-[#050810]">
                <img
                  src={gym.profileImg}
                  alt={gym.name}
                  className="w-full h-full object-cover block"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#8b95b3;font-family:system-ui">I&O</div>`;
                  }}
                />
              </div>
            </div>
            {/* Live badge */}
            <div className="absolute bottom-1 right-0 w-[18px] h-[18px] rounded-full bg-emerald-500 border-2 border-[#050810] flex items-center justify-center">
              <div className="w-[5px] h-[5px] rounded-full bg-white" />
            </div>
          </div>

          {/* Name + meta */}
          <div className="flex-1 pb-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-[26px] font-extrabold text-[#eef2ff] tracking-[-0.035em] leading-none m-0">
                {gym.name}
              </h1>
              <span className="text-[10px] font-bold text-[#4b5578] tracking-[0.12em] uppercase px-2 py-[3px] border border-white/[0.04] rounded-[4px]">
                {gym.type}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-[5px]">
                <MapPin className="w-[10px] h-[10px] text-[#4b5578]" />
                <span className="text-[11px] text-[#4b5578]">{gym.city}</span>
              </div>
              <div className="flex items-center gap-[5px]">
                <Star className="w-[10px] h-[10px] text-[#4b5578]" />
                <span className="text-[11px] text-[#8b95b3] font-semibold">{gym.rating}</span>
                <span className="text-[11px] text-[#4b5578]">({gym.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-[5px]">
                <Award className="w-[10px] h-[10px] text-[#4b5578]" />
                <span className="text-[11px] text-[#4b5578]">Est. {gym.founded}</span>
              </div>
            </div>
          </div>

          {/* Quick-stat chips */}
          <div className="flex gap-2 items-end pb-1 flex-wrap justify-end sm:justify-end self-end w-full sm:w-auto">
            {[
              { label: 'Members',   value: summary.totalMembers,       warn: false, danger: false },
              { label: 'Active',    value: summary.activeMembers,       warn: false, danger: false },
              { label: 'Retention', value: `${summary.retentionRate}%`, warn: summary.retentionRate < 75, danger: false },
              { label: 'At risk',   value: summary.atRiskCount,         warn: false, danger: summary.atRiskCount > 0 },
            ].map((chip, i) => (
              <div key={i} className={cn(
                'flex flex-col items-end gap-1 min-w-[70px] px-4 py-[10px] bg-[#0a0f1e] rounded-[10px] border',
                chip.danger ? 'border-red-500/[0.22]' : chip.warn ? 'border-amber-400/[0.22]' : 'border-white/[0.04]',
              )}>
                <span className={cn(
                  'text-[20px] font-extrabold tracking-[-0.04em] leading-none tabular-nums',
                  chip.danger ? 'text-red-500' : chip.warn ? 'text-amber-400' : 'text-[#eef2ff]',
                )}>
                  {chip.value}
                </span>
                <Label>{chip.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/[0.04]" />
      </div>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header({ gym }) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-9 py-[14px] border-b border-white/[0.04] bg-[rgba(8,9,15,0.82)] backdrop-blur-[12px] sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="w-7 h-7 rounded-[7px] bg-[#0d1225] border border-white/[0.04] flex items-center justify-center">
          <Activity className="w-3 h-3 text-[#8b95b3]" />
        </div>
        <div>
          <div className="text-xs font-bold text-[#eef2ff] tracking-[-0.02em]">{gym.name}</div>
          <div className="text-[9px] text-[#4b5578] mt-[1px]">{gym.type} · {gym.city} · Retention dashboard</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-[6px] h-[6px] rounded-full bg-emerald-500" />
        <span className="text-[10px] text-[#4b5578]">Live · updated just now</span>
      </div>
    </div>
  );
}

// ─── Today's Focus ──────────────────────────────────────────────────────────────
function FocusStrip({ items }) {
  return (
    <section className="mb-8">
      <Label className="block mb-3">Today's focus</Label>
      <div className="border border-white/[0.04] rounded-2xl overflow-hidden">
      <div className="grid sm:grid-cols-[5fr_3fr_3fr]">
        {items.map((item, i) => (
          <div key={i} className={cn(
            'flex flex-col gap-[10px] p-[18px_20px] sm:p-[22px_24px] bg-[#0a0f1e]',
            i < items.length - 1 && 'border-b sm:border-b-0 sm:border-r border-white/[0.04]',
            item.urgent ? 'border-l-2 border-l-red-500' : '',
          )}>
            {item.urgent && <Label className="text-red-500">Attention required</Label>}
            <div className="text-[13px] font-semibold text-[#eef2ff] leading-[1.5]">{item.headline}</div>
            <div className="text-[11px] text-[#8b95b3] leading-[1.55] flex-1">{item.sub}</div>
            {item.cta && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#8b95b3] cursor-pointer mt-1">
                {item.cta}
                <ArrowRight className="w-[10px] h-[10px]" />
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

// ─── Core Metrics ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function MetricRow({ s }) {
  const items = [
    { label: 'Total members',  value: s.totalMembers,         sub: `+${s.newThisMonth} this month`,                                              valueCls: 'text-[#eef2ff]' },
    { label: 'Active members', value: s.activeMembers,        sub: `${Math.round(s.activeMembers / s.totalMembers * 100)}% of total`,            valueCls: 'text-[#eef2ff]' },
    { label: 'Engagement',     value: `${s.engagementRate}%`, sub: `${s.avgCheckInsWeek} check-ins / week avg`,                                  valueCls: 'text-[#eef2ff]' },
    { label: 'Retention',      value: `${s.retentionRate}%`,  sub: s.retentionRate >= 75 ? 'On target' : `${75 - s.retentionRate}pt below 75%`,  valueCls: s.retentionRate < 75 ? 'text-amber-400' : 'text-[#eef2ff]' },
    { label: 'At risk',        value: s.atRiskCount,          sub: '14+ days inactive',                                                           valueCls: s.atRiskCount > 0 ? 'text-red-500' : 'text-[#eef2ff]' },
  ];
  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-5 border border-white/[0.04] rounded-2xl overflow-hidden">
        {items.map((m, i) => (
          <div key={i} className={cn(
            'px-4 sm:px-6 py-[16px] sm:py-[22px] bg-[#0a0f1e]',
            i < items.length - 1 && 'sm:border-r sm:border-white/[0.04]',
            i % 2 === 0 && i !== 4 && 'border-r border-white/[0.04]',
            i < 3 && 'border-b border-white/[0.04] sm:border-b-0',
            i === 4 && 'col-span-2 sm:col-span-1',
          )}>
            <Label className="block mb-[10px] sm:mb-[14px]">{m.label}</Label>
            <div className={cn('text-[26px] sm:text-[34px] font-extrabold tracking-[-0.04em] leading-none mb-1.5 tabular-nums', m.valueCls)}>
              {m.value}
            </div>
            <div className="text-[10px] text-[#4b5578]">{m.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Retention Risk Panel ───────────────────────────────────────────────────────
function RetentionRiskPanel({ data, summary }) {
  const revenue = summary.atRiskCount * summary.pricePerMember;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? data.atRiskMembers : data.atRiskMembers.slice(0, 5);

  return (
    <section className="mb-8">
      <Label className="block mb-3">Churn & retention risk</Label>

      <div className="border border-white/[0.04] rounded-2xl bg-[#0a0f1e] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">

          {/* Revenue at risk */}
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-white/[0.04]">
            <Label className="block mb-4 text-red-500">Revenue at risk</Label>
            <div className="text-[40px] sm:text-[60px] font-extrabold text-[#eef2ff] tracking-[-0.05em] leading-none mb-2 tabular-nums">
              £{revenue.toLocaleString()}
            </div>
            <div className="text-xs text-[#8b95b3] mb-7 leading-[1.6]">
              per month · {summary.atRiskCount} members at cancellation risk
            </div>
            <AppButton variant="secondary" size="sm">
              Contact all {summary.atRiskCount}
            </AppButton>
          </div>

          {/* Retention rate */}
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-white/[0.04]">
            <Label className="block mb-4">Retention rate</Label>
            <div className={cn(
              'text-[60px] font-extrabold tracking-[-0.05em] leading-none mb-2 tabular-nums',
              summary.retentionRate < 75 ? 'text-amber-400' : 'text-[#eef2ff]',
            )}>
              {summary.retentionRate}%
            </div>
            <div className="text-xs text-[#8b95b3] mb-6">
              Target 75% · currently {75 - summary.retentionRate}pt below
            </div>
            <div className="relative h-[2px] bg-[#0d1225] rounded-full mb-[10px]">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[#4b5578] transition-[width_0.7s_ease]"
                style={{ width: `${summary.retentionRate}%` }}
              />
              <div className="absolute top-[-4px] w-px h-[10px] bg-[#4b5578]" style={{ left: '75%' }} />
            </div>
            <div className="flex justify-between mb-6">
              <Label>0%</Label>
              <Label>Target 75%</Label>
              <Label>100%</Label>
            </div>
            <div className="flex items-center gap-[5px] text-red-500">
              <TrendingDown className="w-[11px] h-[11px]" />
              <span className="text-[11px] font-semibold">−2% month over month</span>
            </div>
          </div>

          {/* Churn drivers */}
          <div className="p-6 sm:p-8">
            <Label className="block mb-4">Primary churn drivers</Label>
            <div className="flex flex-col gap-5">
              {data.riskDrivers.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-[#eef2ff] font-medium">{d.label}</span>
                    <span className="text-xs font-bold text-[#8b95b3] tabular-nums">{d.n}</span>
                  </div>
                  <div className="h-[2px] rounded-full bg-[#0d1225]">
                    <div
                      className={cn('h-full rounded-full transition-[width_0.5s_ease]', i === 0 ? 'bg-[#8b95b3]' : 'bg-[#4b5578]')}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 px-[14px] py-3 rounded-lg bg-[#0d1225] border border-white/[0.04] flex gap-2 items-start">
              <Info className="w-[11px] h-[11px] text-[#4b5578] shrink-0 mt-[1px]" />
              <span className="text-[10px] text-[#4b5578] leading-[1.6]">
                Members who don't book in their first 14 days have a 3× higher cancellation rate.
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/[0.04]" />

        {/* Member list header */}
        <div className="px-6 py-[13px] flex items-center justify-between border-b border-white/[0.04]">
          <div className="flex items-center gap-[10px]">
            <Label>At-risk members</Label>
            <span className="text-[10px] text-[#4b5578]">— sorted by days since last check-in</span>
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="text-[10px] text-[#4b5578]">
              {data.atRiskMembers.length} members · £{(data.atRiskMembers.length * summary.pricePerMember).toLocaleString()}/mo
            </span>
            <AppButton variant="secondary" size="sm">
              <MessageSquare className="w-[10px] h-[10px]" />
              Message all
            </AppButton>
          </div>
        </div>

        {/* Column headers */}
        <div className="overflow-x-auto">
        <div className="min-w-[560px]">
        <div className="grid px-6 py-2 border-b border-white/[0.03]" style={{ gridTemplateColumns: '3fr 1.5fr 2fr 2fr 100px' }}>
          {['Member', 'Last seen', 'Churn signal', 'Plan', ''].map((h, i) => (
            <Label key={i} className={i === 4 ? 'text-right' : ''}>{h}</Label>
          ))}
        </div>

        {visible.map((m, i) => (
          <div key={m.id}
            className={cn(
              'grid px-6 py-3 items-center hover:bg-[#0d1225] transition-colors',
              i < visible.length - 1 && 'border-b border-white/[0.03]',
            )}
            style={{ gridTemplateColumns: '3fr 1.5fr 2fr 2fr 100px' }}
          >
            <div className="flex items-center gap-[10px]">
              <Avatar initials={m.initials} size={28} />
              <span className="text-xs font-semibold text-[#eef2ff]">{m.name}</span>
            </div>
            <span className={cn('text-xs tabular-nums', m.riskLevel === 'high' ? 'text-red-500 font-medium' : 'text-[#8b95b3]')}>
              {m.lastSeen}
            </span>
            <span className="text-[11px] text-[#8b95b3]">{m.driver}</span>
            <span className="text-[11px] text-[#4b5578]">{m.tier} · £{summary.pricePerMember}/mo</span>
            <div className="flex justify-end">
              <AppButton variant="outline" size="sm">Reach out</AppButton>
            </div>
          </div>
        ))}

        </div>
        </div>
        {data.atRiskMembers.length > 5 && (
          <div
            onClick={() => setExpanded(!expanded)}
            className="px-6 py-3 flex items-center gap-[5px] cursor-pointer border-t border-white/[0.04] text-[11px] font-semibold text-[#4b5578] hover:text-[#8b95b3] transition-colors"
          >
            {expanded
              ? <><ChevronUp className="w-[11px] h-[11px]" /> Show less</>
              : <><ChevronDown className="w-[11px] h-[11px]" /> {data.atRiskMembers.length - 5} more members</>
            }
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Trends ─────────────────────────────────────────────────────────────────────
function TrendsSection({ trends }) {
  const items = [
    { label: 'Members',    data: trends.members,    delta: '+3',   up: true,  color: '#8b95b3' },
    { label: 'Retention',  data: trends.retention,  delta: '−2%',  up: false, color: '#f59e0b' },
    { label: 'Engagement', data: trends.engagement, delta: 'Flat', up: null,  color: '#4b5578' },
    { label: 'Check-ins',  data: trends.checkIns,   delta: '+4%',  up: true,  color: '#8b95b3' },
  ];
  return (
    <section className="mb-8">
      <Label className="block mb-3">Trends — last 6 months</Label>
      <div className="border border-white/[0.04] rounded-2xl overflow-hidden bg-[#0a0f1e]">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {items.map((s, i) => {
            const last = s.data[s.data.length - 1];
            const display = (s.label === 'Retention' || s.label === 'Engagement') ? `${last}%` : last;
            const deltaCls = s.up === true ? 'text-[#8b95b3]' : s.up === false ? 'text-red-500' : 'text-[#4b5578]';
            return (
              <div key={i} className={cn('p-6', i < items.length - 1 && 'border-r border-white/[0.04]')}>
                <div className="flex justify-between items-start mb-4">
                  <Label>{s.label}</Label>
                  <span className={cn('text-[10px] font-bold flex items-center gap-[3px]', deltaCls)}>
                    {s.up === true  && <TrendingUp   className="w-[9px] h-[9px]" />}
                    {s.up === false && <TrendingDown  className="w-[9px] h-[9px]" />}
                    {s.delta}
                  </span>
                </div>
                <div className="text-[28px] font-extrabold text-[#eef2ff] tracking-[-0.04em] leading-none mb-4 tabular-nums">
                  {display}
                </div>
                <Sparkline data={s.data} color={s.color} width={130} height={36} />
                <div className="flex justify-between mt-2">
                  <Label>{trends.months[0]}</Label>
                  <Label>{trends.months[trends.months.length - 1]}</Label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Behaviour Insights ──────────────────────────────────────────────────────────
function BehaviourInsights({ data }) {
  const maxHeat = Math.max(...data.peakHeatmap.data.flat());
  return (
    <section className="mb-8">
      <Label className="block mb-3">Behaviour insights</Label>
      <div className="border border-white/[0.04] rounded-2xl bg-[#0a0f1e] overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* Drop-off */}
        <div className="p-5 sm:p-7 border-b md:border-b-0 md:border-r border-white/[0.04]">
          <Label className="block mb-5">Member drop-off</Label>
          <div className="flex flex-col gap-[14px]">
            {data.dropOff.map((s, i) => {
              const drop = i > 0 ? data.dropOff[i - 1].pct - s.pct : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-baseline mb-[7px]">
                    <span className="text-xs text-[#eef2ff] font-medium">{s.label}</span>
                    <div className="flex items-center gap-3">
                      {drop > 0 && (
                        <span className={cn('text-[10px] font-semibold', drop >= 10 ? 'text-red-500' : 'text-[#4b5578]')}>
                          −{drop}%
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#8b95b3] tabular-nums w-[22px] text-right">{s.n}</span>
                    </div>
                  </div>
                  <div className="h-[2px] rounded-full bg-[#0d1225]">
                    <div
                      className="h-full rounded-full bg-[#4b5578] transition-[width_0.5s_ease]"
                      style={{ width: `${s.pct}%`, opacity: 0.4 + s.pct / 160 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 text-[10px] text-[#4b5578] leading-[1.65] border-t border-white/[0.03] pt-4">
            Week 2 is your highest drop-off point. Members who don't return after their second week have a 68% churn rate within 60 days.
          </div>
        </div>

        {/* Heatmap — cell colors are data-driven opacity calculations, kept inline */}
        <div className="p-5 sm:p-7">
          <Label className="block mb-5">Peak activity times</Label>
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 3 }}>
            <thead>
              <tr>
                <td className="w-8" />
                {data.peakHeatmap.days.map(d => (
                  <td key={d} className="text-[9px] font-bold text-[#4b5578] text-center pb-[6px] uppercase tracking-[0.08em]">
                    {d}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.peakHeatmap.slots.map((slot, si) => (
                <tr key={slot}>
                  <td className="text-[9px] text-[#4b5578] pr-[6px] align-middle tracking-[0.05em] whitespace-nowrap">
                    {slot}
                  </td>
                  {data.peakHeatmap.data[si].map((v, di) => {
                    const opacity = v / maxHeat;
                    return (
                      <td key={di} className="h-[22px] rounded-[3px]" style={{
                        background: opacity < 0.15
                          ? '#0d1225'
                          : `rgba(237,242,255,${(opacity * 0.22).toFixed(2)})`,
                        border: `1px solid rgba(255,255,255,${(opacity * 0.04).toFixed(2)})`,
                      }} />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-[5px] mt-[14px] justify-end">
            <Label>Low</Label>
            {[0.06, 0.10, 0.14, 0.18, 0.22].map((a, i) => (
              <div key={i} className="w-3 h-3 rounded-[2px]" style={{
                background: `rgba(237,242,255,${a})`,
                border: '1px solid rgba(255,255,255,0.05)',
              }} />
            ))}
            <Label>High</Label>
          </div>
        </div>
      </div>
      </div>
    </section>
  );

}

// ─── Class Performance ──────────────────────────────────────────────────────────
function ClassPerformance({ classes }) {
  return (
    <section className="mb-8">
      <Label className="block mb-3">Performance</Label>
      <div className="border border-white/[0.04] rounded-2xl overflow-x-auto bg-[#0a0f1e]">
        <table className="w-full min-w-[500px] border-collapse">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Class', 'Coach', 'Avg attendance', 'Capacity', 'Fill rate', 'Trend'].map((h, i) => (
                <th key={i} className={cn(
                  'px-6 py-3 text-[9px] font-bold text-[#4b5578] uppercase tracking-[0.13em]',
                  i === 0 ? 'text-left' : 'text-right',
                )}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((c, i) => {
              const fill = Math.round(c.avg / c.cap * 100);
              const lowFill = fill < 60;
              return (
                <tr key={i}
                  className={cn('hover:bg-[#0d1225] transition-colors', i < classes.length - 1 && 'border-b border-white/[0.03]')}
                >
                  <td className="px-6 py-[13px] text-xs font-semibold text-[#eef2ff]">{c.name}</td>
                  <td className="px-6 py-[13px] text-right text-[11px] text-[#8b95b3]">{c.coach}</td>
                  <td className="px-6 py-[13px] text-right text-[13px] font-bold text-[#eef2ff] tabular-nums">{c.avg}</td>
                  <td className="px-6 py-[13px] text-right text-[11px] text-[#4b5578] tabular-nums">{c.cap}</td>
                  <td className="px-6 py-[13px] text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-12 h-[2px] rounded-full bg-[#0d1225] overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', lowFill ? 'bg-[#4b5578]' : 'bg-[#8b95b3]')}
                          style={{ width: `${fill}%` }}
                        />
                      </div>
                      <span className={cn('text-[11px] font-bold tabular-nums w-8 text-right', lowFill ? 'text-red-500' : 'text-[#8b95b3]')}>
                        {fill}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-[13px] text-right">
                    <span className={cn(
                      'inline-flex items-center gap-[3px] text-[11px] font-semibold',
                      c.trend > 0 ? 'text-[#8b95b3]' : c.trend < 0 ? 'text-red-500' : 'text-[#4b5578]',
                    )}>
                      {c.trend > 0 && <TrendingUp className="w-[10px] h-[10px]" />}
                      {c.trend < 0 && <TrendingDown className="w-[10px] h-[10px]" />}
                      {c.trend > 0 ? '+' : ''}{c.trend}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Segments ────────────────────────────────────────────────────────────────────
function Segments({ data, summary }) {
  const [tab, setTab] = useState('risk');
  const tabs = [
    { id: 'risk',     label: `At risk (${summary.atRiskCount})`       },
    { id: 'new',      label: `New members (${data.newMembers.length})` },
    { id: 'inactive', label: `Inactive (${summary.inactiveMembers})`   },
  ];

  return (
    <section className="mb-8">
      <Label className="block mb-3">Member segments</Label>
      <div className="border border-white/[0.04] rounded-2xl overflow-hidden bg-[#0a0f1e]">
        <div className="flex px-2 border-b border-white/[0.04]">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-4 py-[13px] bg-transparent border-b-2 text-[11px] cursor-pointer -mb-px transition-colors',
              tab === t.id
                ? 'text-[#eef2ff] font-bold border-[#8b95b3]'
                : 'text-[#4b5578] font-medium border-transparent hover:text-[#8b95b3]',
            )}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
        <div className="min-w-[480px]">
        {(tab === 'risk' || tab === 'new') && (
          <div className="grid px-6 py-[9px] border-b border-white/[0.03]" style={{
            gridTemplateColumns: tab === 'risk' ? '3fr 1.5fr 2fr 1.5fr' : '3fr 1.5fr 1.5fr 1.5fr',
          }}>
            {(tab === 'risk'
              ? ['Member', 'Last seen', 'Churn signal', 'Plan']
              : ['Member', 'Joined', 'Check-ins', 'Status']
            ).map((h, i) => <Label key={i}>{h}</Label>)}
          </div>
        )}

        {tab === 'risk' && data.atRiskMembers.map((m, i) => (
          <div key={m.id}
            className={cn('grid px-6 py-3 items-center hover:bg-[#0d1225] transition-colors', i < data.atRiskMembers.length - 1 && 'border-b border-white/[0.03]')}
            style={{ gridTemplateColumns: '3fr 1.5fr 2fr 1.5fr' }}
          >
            <div className="flex items-center gap-[10px]">
              <Avatar initials={m.initials} size={26} />
              <span className="text-xs font-semibold text-[#eef2ff]">{m.name}</span>
            </div>
            <span className={cn('text-[11px]', m.riskLevel === 'high' ? 'text-red-500 font-medium' : 'text-[#8b95b3]')}>
              {m.lastSeen}
            </span>
            <span className="text-[11px] text-[#8b95b3]">{m.driver}</span>
            <span className="text-[11px] text-[#4b5578]">{m.tier}</span>
          </div>
        ))}

        {tab === 'new' && data.newMembers.map((m, i) => (
          <div key={i}
            className={cn('grid px-6 py-3 items-center hover:bg-[#0d1225] transition-colors', i < data.newMembers.length - 1 && 'border-b border-white/[0.03]')}
            style={{ gridTemplateColumns: '3fr 1.5fr 1.5fr 1.5fr' }}
          >
            <div className="flex items-center gap-[10px]">
              <Avatar initials={m.initials} size={26} />
              <span className="text-xs font-semibold text-[#eef2ff]">{m.name}</span>
            </div>
            <span className="text-[11px] text-[#4b5578] tabular-nums">{m.days}d ago</span>
            <span className="text-[11px] text-[#8b95b3] tabular-nums">{m.checkIns} {m.checkIns === 1 ? 'visit' : 'visits'}</span>
            <span className={cn('text-[10px] font-bold uppercase tracking-[0.08em]', STATUS_CLS[m.status])}>
              {STATUS_LABEL[m.status]}
            </span>
          </div>
        ))}
        </div>
        </div>

        {tab === 'inactive' && (
          <div className="px-6 py-12 text-center">
            <div className="text-[56px] font-extrabold text-[#4b5578] tracking-[-0.05em] mb-[10px] tabular-nums">
              {summary.inactiveMembers}
            </div>
            <div className="text-xs text-[#4b5578] mb-6 leading-[1.6]">
              Members with no recorded activity in the last 30 days
            </div>
            <AppButton variant="secondary" size="sm">
              <Bell className="w-[11px] h-[11px]" />
              Send re-engagement message
            </AppButton>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Root component ────────────────────────────────────────────────────────────
export default function GymRetentionDashboard({
  selectedGym,
  allMemberships = [],
  atRisk         = 0,
  retentionRate  = 0,
  classes        = [],
  isLoading,
}) {
  const gym = selectedGym || MOCK.gym;
  const summary = {
    ...MOCK.summary,
    ...(allMemberships.length > 0 ? { totalMembers: allMemberships.length } : {}),
    ...(atRisk > 0        ? { atRiskCount: atRisk }  : {}),
    ...(retentionRate > 0 ? { retentionRate }          : {}),
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <span className="text-xs text-[#4b5578]">Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] text-[#eef2ff]">
      <Header gym={gym} />
      <HeroSection gym={gym} summary={summary} />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-9 pt-8 pb-20">
        <FocusStrip        items={MOCK.focus} />
        <MetricRow         s={summary} />
        <RetentionRiskPanel data={MOCK} summary={summary} />
        <TrendsSection     trends={MOCK.trends} />
        <BehaviourInsights data={MOCK} />
        <ClassPerformance  classes={MOCK.classes} />
        <Segments          data={MOCK} summary={summary} />
      </main>
    </div>
  );
}
