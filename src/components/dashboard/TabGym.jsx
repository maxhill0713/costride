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

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#050810',
  surface:   '#0a0f1e',
  raised:    '#0d1225',
  elevated:  '#101929',
  border:    'rgba(255,255,255,0.04)',
  borderSub: 'rgba(255,255,255,0.03)',
  borderHi:  'rgba(255,255,255,0.07)',
  t1:  '#eef2ff',
  t2:  '#8b95b3',
  t3:  '#4b5578',
  danger:  '#ef4444',
  warn:    '#f59e0b',
  ok:      '#10b981',
  divider: 'rgba(255,255,255,0.03)',
};

const F = "'Manrope', 'DM Sans', system-ui, sans-serif";

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

// ─── Primitives ─────────────────────────────────────────────────────────────────

function Label({ children, style = {} }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.13em',
      textTransform: 'uppercase', color: C.t3, fontFamily: F, ...style,
    }}>
      {children}
    </span>
  );
}

function Divider({ style = {} }) {
  return <div style={{ height: 1, background: C.border, ...style }} />;
}

function Avatar({ initials, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C.raised, border: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: C.t2,
      letterSpacing: '-0.01em', flexShrink: 0, fontFamily: F,
    }}>
      {initials}
    </div>
  );
}

function Sparkline({ data, color = C.t3, width = 100, height = 32 }) {
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
  const HERO_H = 280;
  const PROFILE_SIZE = 88;
  const PROFILE_OFFSET = PROFILE_SIZE / 2;

  return (
    <div style={{ position: 'relative', marginBottom: 0 }}>

      {/* ── Banner image ── */}
      <div style={{
        position: 'relative',
        height: HERO_H,
        overflow: 'hidden',
        background: C.raised,
      }}>
        <img
          src={gym.heroBg}
          alt="Gym banner"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center 40%',
            display: 'block',
            filter: 'brightness(0.45) saturate(0.6)',
          }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />

        {/* Dark gradient vignette — bottom fade into bg */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(
            to bottom,
            rgba(8,9,15,0.18) 0%,
            rgba(8,9,15,0.10) 35%,
            rgba(8,9,15,0.55) 70%,
            rgba(8,9,15,0.97) 100%
          )`,
        }} />

        {/* Edit cover button — top right */}
        <button style={{
          position: 'absolute', top: 18, right: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px',
          background: 'rgba(8,9,15,0.55)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${C.borderHi}`,
          borderRadius: 7,
          fontSize: 10, fontWeight: 600, color: C.t2,
          cursor: 'pointer', fontFamily: F,
          letterSpacing: '0.04em',
        }}>
          <Edit3 style={{ width: 10, height: 10 }} />
          Edit cover
        </button>

        {/* Gym tagline — bottom left of banner */}
        <div style={{
          position: 'absolute', bottom: PROFILE_OFFSET + 24, left: 24 + PROFILE_SIZE + 20,
        }}>
          <div style={{
            fontSize: 11, color: 'rgba(237,242,255,0.35)',
            fontFamily: F, fontStyle: 'italic', letterSpacing: '0.03em',
          }}>
            {gym.tagline}
          </div>
        </div>
      </div>

      {/* ── Profile row — overlaps banner bottom ── */}
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 36px',
        position: 'relative',
        marginTop: -(PROFILE_OFFSET),
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 20,
          paddingBottom: 24,
        }}>

          {/* Profile image ring */}
          <div style={{
            position: 'relative',
            flexShrink: 0,
            zIndex: 10,
          }}>
            {/* Outer glow ring */}
            <div style={{
              width: PROFILE_SIZE + 6,
              height: PROFILE_SIZE + 6,
              borderRadius: '50%',
              background: `conic-gradient(from 180deg, rgba(237,242,255,0.12), rgba(237,242,255,0.04), rgba(237,242,255,0.12))`,
              padding: 3,
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '100%', height: '100%',
                borderRadius: '50%',
                background: C.raised,
                overflow: 'hidden',
                border: `2px solid ${C.bg}`,
              }}>
                <img
                  src={gym.profileImg}
                  alt={gym.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#8b95b3;font-family:Manrope,system-ui">I&O</div>`;
                  }}
                />
              </div>
            </div>

            {/* Verified / live badge */}
            <div style={{
              position: 'absolute', bottom: 4, right: 0,
              width: 18, height: 18, borderRadius: '50%',
              background: C.ok,
              border: `2px solid ${C.bg}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
            </div>
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{
                fontSize: 26, fontWeight: 800, color: C.t1,
                letterSpacing: '-0.035em', lineHeight: 1, fontFamily: F,
                margin: 0,
              }}>
                {gym.name}
              </h1>
              <span style={{
                fontSize: 10, fontWeight: 700, color: C.t3,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontFamily: F,
                padding: '3px 8px',
                border: `1px solid ${C.border}`,
                borderRadius: 4,
              }}>
                {gym.type}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin style={{ width: 10, height: 10, color: C.t3 }} />
                <span style={{ fontSize: 11, color: C.t3, fontFamily: F }}>{gym.city}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Star style={{ width: 10, height: 10, color: C.t3 }} />
                <span style={{ fontSize: 11, color: C.t2, fontFamily: F, fontWeight: 600 }}>{gym.rating}</span>
                <span style={{ fontSize: 11, color: C.t3, fontFamily: F }}>({gym.reviewCount} reviews)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Award style={{ width: 10, height: 10, color: C.t3 }} />
                <span style={{ fontSize: 11, color: C.t3, fontFamily: F }}>Est. {gym.founded}</span>
              </div>
            </div>
          </div>

          {/* Quick-stat chips — right side */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {[
              { label: 'Members',    value: summary.totalMembers,          suffix: '' },
              { label: 'Active',     value: summary.activeMembers,          suffix: '' },
              { label: 'Retention',  value: `${summary.retentionRate}%`,    suffix: '', warn: summary.retentionRate < 75 },
              { label: 'At risk',    value: summary.atRiskCount,            suffix: '', danger: summary.atRiskCount > 0 },
            ].map((chip, i) => (
              <div key={i} style={{
                padding: '10px 16px',
                background: C.surface,
                border: `1px solid ${chip.danger ? 'rgba(239,68,68,0.22)' : chip.warn ? 'rgba(245,158,11,0.22)' : C.border}`,
                borderRadius: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4,
                minWidth: 70,
              }}>
                <span style={{
                  fontSize: 20, fontWeight: 800, color: chip.danger ? C.danger : chip.warn ? C.warn : C.t1,
                  letterSpacing: '-0.04em', lineHeight: 1, fontFamily: F,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {chip.value}
                </span>
                <Label style={{ color: C.t3 }}>{chip.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Thin separator */}
        <div style={{ height: 1, background: C.border }} />
      </div>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────
function Header({ gym }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 36px',
      borderBottom: `1px solid ${C.border}`,
      background: 'rgba(8,9,15,0.82)',
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: C.raised, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity style={{ width: 12, height: 12, color: C.t2 }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em', fontFamily: F }}>
            {gym.name}
          </div>
          <div style={{ fontSize: 9, color: C.t3, fontFamily: F, marginTop: 1 }}>
            {gym.type} · {gym.city} · Retention dashboard
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.ok }} />
        <span style={{ fontSize: 10, color: C.t3, fontFamily: F }}>Live · updated just now</span>
      </div>
    </div>
  );
}

// ─── Today's Focus ──────────────────────────────────────────────────────────────
function FocusStrip({ items }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <Label style={{ display: 'block', marginBottom: 12 }}>Today's focus</Label>
      <div style={{
        display: 'grid', gridTemplateColumns: '5fr 3fr 3fr',
        border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            padding: '22px 24px',
            background: C.surface,
            borderRight: i < items.length - 1 ? `1px solid ${C.border}` : 'none',
            borderLeft: item.urgent ? `2px solid ${C.danger}` : 'none',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {item.urgent && (
              <Label style={{ color: C.danger }}>Attention required</Label>
            )}
            <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, lineHeight: 1.5, fontFamily: F }}>
              {item.headline}
            </div>
            <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.55, fontFamily: F, flex: 1 }}>
              {item.sub}
            </div>
            {item.cta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: C.t2, fontFamily: F, cursor: 'pointer', marginTop: 4 }}>
                {item.cta}
                <ArrowRight style={{ width: 10, height: 10 }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Core Metrics ───────────────────────────────────────────────────────────────
function MetricRow({ s }) {
  const items = [
    { label: 'Total members',  value: s.totalMembers,         sub: `+${s.newThisMonth} this month`,                                              color: C.t1  },
    { label: 'Active members', value: s.activeMembers,        sub: `${Math.round(s.activeMembers / s.totalMembers * 100)}% of total`,            color: C.t1  },
    { label: 'Engagement',     value: `${s.engagementRate}%`,  sub: `${s.avgCheckInsWeek} check-ins / week avg`,                                 color: C.t1  },
    { label: 'Retention',      value: `${s.retentionRate}%`,   sub: s.retentionRate >= 75 ? 'On target' : `${75 - s.retentionRate}pt below 75%`, color: s.retentionRate < 75 ? C.warn : C.t1 },
    { label: 'At risk',        value: s.atRiskCount,           sub: '14+ days inactive',                                                          color: s.atRiskCount > 0 ? C.danger : C.t1  },
  ];
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
        border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden',
      }}>
        {items.map((m, i) => (
          <div key={i} style={{
            padding: '22px 24px', background: C.surface,
            borderRight: i < items.length - 1 ? `1px solid ${C.border}` : 'none',
          }}>
            <Label style={{ display: 'block', marginBottom: 14 }}>{m.label}</Label>
            <div style={{
              fontSize: 34, fontWeight: 800, color: m.color,
              letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8,
              fontFamily: F, fontVariantNumeric: 'tabular-nums',
            }}>
              {m.value}
            </div>
            <div style={{ fontSize: 10, color: C.t3, fontFamily: F }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Retention Risk Panel (Primary) ────────────────────────────────────────────
function RetentionRiskPanel({ data, summary }) {
  const revenue = summary.atRiskCount * summary.pricePerMember;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? data.atRiskMembers : data.atRiskMembers.slice(0, 5);

  return (
    <section style={{ marginBottom: 32 }}>
      <Label style={{ display: 'block', marginBottom: 12 }}>Churn & retention risk</Label>

      <div style={{
        border: `1px solid ${C.border}`, borderRadius: 16,
        overflow: 'hidden', background: C.surface,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

          {/* Revenue at risk */}
          <div style={{ padding: '32px', borderRight: `1px solid ${C.border}` }}>
            <Label style={{ display: 'block', marginBottom: 16, color: C.danger }}>Revenue at risk</Label>
            <div style={{
              fontSize: 60, fontWeight: 800, color: C.t1,
              letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8,
              fontFamily: F, fontVariantNumeric: 'tabular-nums',
            }}>
              £{revenue.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: C.t2, marginBottom: 28, fontFamily: F, lineHeight: 1.6 }}>
              per month · {summary.atRiskCount} members at cancellation risk
            </div>
            <button style={{
              padding: '9px 18px', borderRadius: 8,
              background: C.raised, border: `1px solid ${C.borderHi}`,
              fontSize: 11, fontWeight: 700, color: C.t1,
              cursor: 'pointer', fontFamily: F,
            }}>
              Contact all {summary.atRiskCount}
            </button>
          </div>

          {/* Retention rate */}
          <div style={{ padding: '32px', borderRight: `1px solid ${C.border}` }}>
            <Label style={{ display: 'block', marginBottom: 16 }}>Retention rate</Label>
            <div style={{
              fontSize: 60, fontWeight: 800,
              color: summary.retentionRate < 75 ? C.warn : C.t1,
              letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8,
              fontFamily: F, fontVariantNumeric: 'tabular-nums',
            }}>
              {summary.retentionRate}%
            </div>
            <div style={{ fontSize: 12, color: C.t2, marginBottom: 24, fontFamily: F }}>
              Target 75% · currently {75 - summary.retentionRate}pt below
            </div>
            <div style={{ position: 'relative', height: 2, background: C.raised, borderRadius: 99, marginBottom: 10 }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${summary.retentionRate}%`, borderRadius: 99,
                background: C.t3, transition: 'width 0.7s ease',
              }} />
              <div style={{
                position: 'absolute', top: -4, left: '75%',
                width: 1, height: 10, background: C.t3,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <Label>0%</Label>
              <Label style={{ color: C.t3 }}>Target 75%</Label>
              <Label>100%</Label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.danger }}>
              <TrendingDown style={{ width: 11, height: 11 }} />
              <span style={{ fontSize: 11, fontWeight: 600, fontFamily: F }}>−2% month over month</span>
            </div>
          </div>

          {/* Churn drivers */}
          <div style={{ padding: '32px' }}>
            <Label style={{ display: 'block', marginBottom: 16 }}>Primary churn drivers</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {data.riskDrivers.map((d, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: C.t1, fontFamily: F, fontWeight: 500 }}>{d.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.t2, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>
                      {d.n}
                    </span>
                  </div>
                  <div style={{ height: 2, borderRadius: 99, background: C.raised }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${d.pct}%`,
                      background: i === 0 ? C.t2 : C.t3,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 28, padding: '12px 14px', borderRadius: 8,
              background: C.raised, border: `1px solid ${C.border}`,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <Info style={{ width: 11, height: 11, color: C.t3, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 10, color: C.t3, fontFamily: F, lineHeight: 1.6 }}>
                Members who don't book in their first 14 days have a 3× higher cancellation rate.
              </span>
            </div>
          </div>
        </div>

        <Divider />

        {/* Member list header */}
        <div style={{
          padding: '13px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Label>At-risk members</Label>
            <span style={{ fontSize: 10, color: C.t3, fontFamily: F }}>
              — sorted by days since last check-in
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: C.t3, fontFamily: F }}>
              {data.atRiskMembers.length} members · £{(data.atRiskMembers.length * summary.pricePerMember).toLocaleString()}/mo
            </span>
            <button style={{
              padding: '5px 12px', borderRadius: 7,
              background: C.raised, border: `1px solid ${C.border}`,
              fontSize: 10, fontWeight: 600, color: C.t2,
              cursor: 'pointer', fontFamily: F,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <MessageSquare style={{ width: 10, height: 10 }} />
              Message all
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr 2fr 100px',
          padding: '8px 24px', borderBottom: `1px solid ${C.borderSub}`,
        }}>
          {['Member', 'Last seen', 'Churn signal', 'Plan', ''].map((h, i) => (
            <Label key={i} style={{ textAlign: i === 4 ? 'right' : 'left' }}>{h}</Label>
          ))}
        </div>

        {visible.map((m, i) => (
          <div key={m.id} style={{
            display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr 2fr 100px',
            padding: '12px 24px', alignItems: 'center',
            borderBottom: i < visible.length - 1 ? `1px solid ${C.borderSub}` : 'none',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.raised}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={m.initials} size={28} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, fontFamily: F }}>{m.name}</span>
            </div>
            <span style={{
              fontSize: 12, fontFamily: F,
              color: m.riskLevel === 'high' ? C.danger : C.t2,
              fontWeight: m.riskLevel === 'high' ? 500 : 400,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {m.lastSeen}
            </span>
            <span style={{ fontSize: 11, color: C.t2, fontFamily: F }}>{m.driver}</span>
            <span style={{ fontSize: 11, color: C.t3, fontFamily: F }}>{m.tier} · £{summary.pricePerMember}/mo</span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{
                padding: '5px 12px', borderRadius: 6,
                background: 'transparent', border: `1px solid ${C.border}`,
                fontSize: 10, fontWeight: 600, color: C.t2,
                cursor: 'pointer', fontFamily: F,
              }}>
                Reach out
              </button>
            </div>
          </div>
        ))}

        {data.atRiskMembers.length > 5 && (
          <div
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '12px 24px', display: 'flex', alignItems: 'center',
              gap: 5, cursor: 'pointer',
              borderTop: `1px solid ${C.border}`,
              fontSize: 11, fontWeight: 600, color: C.t3, fontFamily: F,
            }}
          >
            {expanded
              ? <><ChevronUp style={{ width: 11, height: 11 }} /> Show less</>
              : <><ChevronDown style={{ width: 11, height: 11 }} /> {data.atRiskMembers.length - 5} more members</>
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
    { label: 'Members',    data: trends.members,    delta: '+3',   up: true,  color: C.t2 },
    { label: 'Retention',  data: trends.retention,  delta: '−2%',  up: false, color: C.warn },
    { label: 'Engagement', data: trends.engagement, delta: 'Flat', up: null,  color: C.t3 },
    { label: 'Check-ins',  data: trends.checkIns,   delta: '+4%',  up: true,  color: C.t2 },
  ];
  return (
    <section style={{ marginBottom: 32 }}>
      <Label style={{ display: 'block', marginBottom: 12 }}>Trends — last 6 months</Label>
      <div style={{
        border: `1px solid ${C.border}`, borderRadius: 16,
        overflow: 'hidden', background: C.surface,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {items.map((s, i) => {
            const last = s.data[s.data.length - 1];
            const display = (s.label === 'Retention' || s.label === 'Engagement') ? `${last}%` : last;
            return (
              <div key={i} style={{
                padding: '24px',
                borderRight: i < items.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <Label>{s.label}</Label>
                  <span style={{
                    fontSize: 10, fontWeight: 700, fontFamily: F,
                    display: 'flex', alignItems: 'center', gap: 3,
                    color: s.up === true ? C.t2 : s.up === false ? C.danger : C.t3,
                  }}>
                    {s.up === true  && <TrendingUp   style={{ width: 9, height: 9 }} />}
                    {s.up === false && <TrendingDown  style={{ width: 9, height: 9 }} />}
                    {s.delta}
                  </span>
                </div>
                <div style={{
                  fontSize: 28, fontWeight: 800, color: C.t1,
                  letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 16,
                  fontFamily: F, fontVariantNumeric: 'tabular-nums',
                }}>
                  {display}
                </div>
                <Sparkline data={s.data} color={s.color} width={130} height={36} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <Label style={{ color: C.t3 }}>{trends.months[0]}</Label>
                  <Label style={{ color: C.t3 }}>{trends.months[trends.months.length - 1]}</Label>
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
    <section style={{ marginBottom: 32 }}>
      <Label style={{ display: 'block', marginBottom: 12 }}>Behaviour insights</Label>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        border: `1px solid ${C.border}`, borderRadius: 16,
        overflow: 'hidden', background: C.surface,
      }}>
        {/* Drop-off */}
        <div style={{ padding: '28px', borderRight: `1px solid ${C.border}` }}>
          <Label style={{ display: 'block', marginBottom: 20 }}>Member drop-off</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {data.dropOff.map((s, i) => {
              const drop = i > 0 ? data.dropOff[i - 1].pct - s.pct : 0;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <span style={{ fontSize: 12, color: C.t1, fontFamily: F, fontWeight: 500 }}>{s.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {drop > 0 && (
                        <span style={{ fontSize: 10, color: drop >= 10 ? C.danger : C.t3, fontWeight: 600, fontFamily: F }}>
                          −{drop}%
                        </span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.t2, fontFamily: F, fontVariantNumeric: 'tabular-nums', width: 22, textAlign: 'right' }}>
                        {s.n}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 2, borderRadius: 99, background: C.raised }}>
                    <div style={{
                      height: '100%', borderRadius: 99, width: `${s.pct}%`,
                      background: C.t3, opacity: 0.4 + s.pct / 160,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, fontSize: 10, color: C.t3, fontFamily: F, lineHeight: 1.65, borderTop: `1px solid ${C.borderSub}`, paddingTop: 16 }}>
            Week 2 is your highest drop-off point. Members who don't return after their second week have a 68% churn rate within 60 days.
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ padding: '28px' }}>
          <Label style={{ display: 'block', marginBottom: 20 }}>Peak activity times</Label>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }}>
            <thead>
              <tr>
                <td style={{ width: 32 }} />
                {data.peakHeatmap.days.map(d => (
                  <td key={d} style={{
                    fontSize: 9, fontWeight: 700, color: C.t3,
                    textAlign: 'center', paddingBottom: 6, fontFamily: F,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {d}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.peakHeatmap.slots.map((slot, si) => (
                <tr key={slot}>
                  <td style={{ fontSize: 9, color: C.t3, paddingRight: 6, fontFamily: F, verticalAlign: 'middle', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {slot}
                  </td>
                  {data.peakHeatmap.data[si].map((v, di) => {
                    const opacity = v / maxHeat;
                    return (
                      <td key={di} style={{
                        height: 22, borderRadius: 3,
                        background: opacity < 0.15
                          ? C.raised
                          : `rgba(237,242,255,${(opacity * 0.22).toFixed(2)})`,
                        border: `1px solid rgba(255,255,255,${(opacity * 0.04).toFixed(2)})`,
                      }} />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 14, justifyContent: 'flex-end' }}>
            <Label style={{ color: C.t3 }}>Low</Label>
            {[0.06, 0.10, 0.14, 0.18, 0.22].map((a, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: `rgba(237,242,255,${a})`, border: `1px solid rgba(255,255,255,0.05)` }} />
            ))}
            <Label style={{ color: C.t3 }}>High</Label>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Class Performance ──────────────────────────────────────────────────────────
function ClassPerformance({ classes }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <Label style={{ display: 'block', marginBottom: 12 }}>Performance</Label>
      <div style={{
        border: `1px solid ${C.border}`, borderRadius: 16,
        overflow: 'hidden', background: C.surface,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Class', 'Coach', 'Avg attendance', 'Capacity', 'Fill rate', 'Trend'].map((h, i) => (
                <th key={i} style={{
                  padding: '12px 24px', textAlign: i === 0 ? 'left' : 'right',
                  fontSize: 9, fontWeight: 700, color: C.t3,
                  textTransform: 'uppercase', letterSpacing: '0.13em', fontFamily: F,
                }}>
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
                  style={{ borderBottom: i < classes.length - 1 ? `1px solid ${C.borderSub}` : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.raised}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 24px', fontSize: 12, fontWeight: 600, color: C.t1, fontFamily: F }}>{c.name}</td>
                  <td style={{ padding: '13px 24px', textAlign: 'right', fontSize: 11, color: C.t2, fontFamily: F }}>{c.coach}</td>
                  <td style={{ padding: '13px 24px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.t1, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{c.avg}</td>
                  <td style={{ padding: '13px 24px', textAlign: 'right', fontSize: 11, color: C.t3, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{c.cap}</td>
                  <td style={{ padding: '13px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <div style={{ width: 48, height: 2, borderRadius: 99, background: C.raised, overflow: 'hidden' }}>
                        <div style={{ width: `${fill}%`, height: '100%', background: lowFill ? C.t3 : C.t2, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: lowFill ? C.danger : C.t2, fontFamily: F, fontVariantNumeric: 'tabular-nums', width: 32, textAlign: 'right' }}>
                        {fill}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 24px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
                      color: c.trend > 0 ? C.t2 : c.trend < 0 ? C.danger : C.t3, fontFamily: F,
                    }}>
                      {c.trend > 0 && <TrendingUp style={{ width: 10, height: 10 }} />}
                      {c.trend < 0 && <TrendingDown style={{ width: 10, height: 10 }} />}
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
const STATUS_COLOR = { active: C.t2, 'at-risk': C.danger, inactive: C.t3 };
const STATUS_LABEL = { active: 'Active', 'at-risk': 'At risk', inactive: 'Inactive' };

function Segments({ data, summary }) {
  const [tab, setTab] = useState('risk');
  const tabs = [
    { id: 'risk',     label: `At risk (${summary.atRiskCount})`       },
    { id: 'new',      label: `New members (${data.newMembers.length})` },
    { id: 'inactive', label: `Inactive (${summary.inactiveMembers})`   },
  ];

  return (
    <section style={{ marginBottom: 32 }}>
      <Label style={{ display: 'block', marginBottom: 12 }}>Member segments</Label>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', background: C.surface }}>
        <div style={{
          display: 'flex', gap: 0, padding: '0 8px',
          borderBottom: `1px solid ${C.border}`,
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '13px 16px', background: 'transparent', border: 'none',
              borderBottom: tab === t.id ? `1px solid ${C.t2}` : '1px solid transparent',
              fontSize: 11, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? C.t1 : C.t3,
              cursor: 'pointer', fontFamily: F, marginBottom: -1,
              transition: 'color 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {(tab === 'risk' || tab === 'new') && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: tab === 'risk' ? '3fr 1.5fr 2fr 1.5fr' : '3fr 1.5fr 1.5fr 1.5fr',
            padding: '9px 24px', borderBottom: `1px solid ${C.borderSub}`,
          }}>
            {(tab === 'risk'
              ? ['Member', 'Last seen', 'Churn signal', 'Plan']
              : ['Member', 'Joined', 'Check-ins', 'Status']
            ).map((h, i) => <Label key={i}>{h}</Label>)}
          </div>
        )}

        {tab === 'risk' && data.atRiskMembers.map((m, i) => (
          <div key={m.id} style={{
            display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr 1.5fr',
            padding: '12px 24px', alignItems: 'center',
            borderBottom: i < data.atRiskMembers.length - 1 ? `1px solid ${C.borderSub}` : 'none',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.raised}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={m.initials} size={26} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, fontFamily: F }}>{m.name}</span>
            </div>
            <span style={{ fontSize: 11, color: m.riskLevel === 'high' ? C.danger : C.t2, fontFamily: F, fontWeight: m.riskLevel === 'high' ? 500 : 400 }}>
              {m.lastSeen}
            </span>
            <span style={{ fontSize: 11, color: C.t2, fontFamily: F }}>{m.driver}</span>
            <span style={{ fontSize: 11, color: C.t3, fontFamily: F }}>{m.tier}</span>
          </div>
        ))}

        {tab === 'new' && data.newMembers.map((m, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '3fr 1.5fr 1.5fr 1.5fr',
            padding: '12px 24px', alignItems: 'center',
            borderBottom: i < data.newMembers.length - 1 ? `1px solid ${C.borderSub}` : 'none',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = C.raised}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar initials={m.initials} size={26} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.t1, fontFamily: F }}>{m.name}</span>
            </div>
            <span style={{ fontSize: 11, color: C.t3, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{m.days}d ago</span>
            <span style={{ fontSize: 11, color: C.t2, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{m.checkIns} {m.checkIns === 1 ? 'visit' : 'visits'}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLOR[m.status], fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {STATUS_LABEL[m.status]}
            </span>
          </div>
        ))}

        {tab === 'inactive' && (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: C.t3, fontFamily: F, letterSpacing: '-0.05em', marginBottom: 10, fontVariantNumeric: 'tabular-nums' }}>
              {summary.inactiveMembers}
            </div>
            <div style={{ fontSize: 12, color: C.t3, fontFamily: F, marginBottom: 24, lineHeight: 1.6 }}>
              Members with no recorded activity in the last 30 days
            </div>
            <button style={{
              padding: '9px 20px', borderRadius: 8,
              background: C.raised, border: `1px solid ${C.border}`,
              fontSize: 11, fontWeight: 600, color: C.t2,
              cursor: 'pointer', fontFamily: F,
              display: 'inline-flex', alignItems: 'center', gap: 7,
            }}>
              <Bell style={{ width: 11, height: 11 }} />
              Send re-engagement message
            </button>
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
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: C.t3, fontFamily: F }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F, color: C.t1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        button { font-family: inherit; }
        button:hover { opacity: 0.75; }
        td, th { font-family: 'Manrope', system-ui, sans-serif; }
      `}</style>

      {/* Sticky top nav bar */}
      <Header gym={gym} />

      {/* Hero — full-bleed banner + profile */}
      <HeroSection gym={gym} summary={summary} />

      {/* Dashboard body */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 36px 80px' }}>
        <FocusStrip       items={MOCK.focus} />
        <MetricRow        s={summary} />
        <RetentionRiskPanel data={MOCK} summary={summary} />
        <TrendsSection    trends={MOCK.trends} />
        <BehaviourInsights data={MOCK} />
        <ClassPerformance  classes={MOCK.classes} />
        <Segments         data={MOCK} summary={summary} />
      </main>
    </div>
  );
}
