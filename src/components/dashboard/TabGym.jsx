/**
 * GymRetentionDashboard.jsx — Refined · Premium · Calm
 *
 * Same token philosophy as MembersPageAI.jsx:
 *  - Near-monochrome base. Typography carries hierarchy.
 *  - Red:   revenue at risk + high-risk members only
 *  - Amber: retention rate below target only
 *  - Green: live indicator + positive trend only
 *  - Color is a signal, never decoration.
 */

import { useState } from 'react';
import {
  TrendingDown, TrendingUp, Users, Activity, Zap,
  AlertTriangle, ChevronDown, ChevronUp,
  MessageSquare, Bell, ArrowRight, Info,
  MapPin, Star, Award, Edit3, ArrowUpRight,
} from 'lucide-react';

/* ── Design tokens ──────────────────────────────────────────────────
   Identical system to MembersPageAI.jsx — drop-in compatible.
──────────────────────────────────────────────────────────────────── */
const T = {
  bg:          '#08090e',
  surface:     '#0f1016',
  surfaceEl:   '#14151d',
  surfaceHov:  '#191a24',
  surfacePop:  '#1c1d28',
  border:      '#1e2030',
  borderEl:    '#262840',
  borderFoc:   '#383c5c',
  divider:     '#141520',

  t1: '#ededf0',
  t2: '#9191a4',
  t3: '#525266',
  t4: '#2e2e42',

  accent:    '#4c6ef5',
  accentDim: '#1a2048',
  accentBrd: '#263070',

  /* Desaturated — used sparingly */
  red:      '#c0392b',
  redDim:   '#160f0d',
  redBrd:   '#2e1614',

  amber:    '#b07b30',
  amberDim: '#161008',
  amberBrd: '#2a2010',

  green:    '#2d8a62',
  greenDim: '#091912',
  greenBrd: '#132e20',

  r:   '8px',
  rsm: '6px',
  sh:  '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.025)',
  shMd:'0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.025)',
};

const F = "'Geist','DM Sans','Helvetica Neue',Arial,sans-serif";

/* ── Mock data ──────────────────────────────────────────────────── */
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
    { urgent: true,  headline: "12 members haven't checked in for 14+ days",        sub: '£780 per month currently at risk of cancellation',              cta: 'View members'   },
    { urgent: false, headline: "4 of 9 new members haven't returned after Week 1",  sub: 'Early drop-off is the leading churn indicator.',                cta: 'Review segment' },
    { urgent: false, headline: 'Thursday evening CrossFit is 43% below capacity',   sub: 'Consider promoting to at-risk members as a re-engagement hook.', cta: null             },
  ],
  atRiskMembers: [
    { id:1, name:'Jamie L.',  initials:'JL', lastSeen:'21 days', driver:'No check-ins',            tier:'Monthly', riskLevel:'high'   },
    { id:2, name:'Priya S.',  initials:'PS', lastSeen:'18 days', driver:'Booking frequency drop',  tier:'Monthly', riskLevel:'high'   },
    { id:3, name:'Marcus D.', initials:'MD', lastSeen:'17 days', driver:'No check-ins',            tier:'Monthly', riskLevel:'high'   },
    { id:4, name:'Ryan W.',   initials:'RW', lastSeen:'22 days', driver:'No check-ins',            tier:'Monthly', riskLevel:'high'   },
    { id:5, name:'Sofia R.',  initials:'SR', lastSeen:'15 days', driver:'Streak broken',           tier:'Monthly', riskLevel:'medium' },
    { id:6, name:'Tom K.',    initials:'TK', lastSeen:'14 days', driver:'Only 1 class / week',     tier:'Monthly', riskLevel:'medium' },
    { id:7, name:'Aisha M.',  initials:'AM', lastSeen:'14 days', driver:'Booking frequency drop',  tier:'Monthly', riskLevel:'medium' },
    { id:8, name:'Leila H.',  initials:'LH', lastSeen:'16 days', driver:'Streak broken',          tier:'Monthly', riskLevel:'medium' },
  ],
  riskDrivers: [
    { label:'No check-ins (14+ days)',     n:5, pct:42 },
    { label:'Booking frequency declined',  n:4, pct:33 },
    { label:'Attendance streak broken',    n:3, pct:25 },
  ],
  dropOff: [
    { label:'Joined',  n:87, pct:100 },
    { label:'Week 1',  n:79, pct:91  },
    { label:'Week 2',  n:68, pct:78  },
    { label:'Month 1', n:61, pct:70  },
    { label:'Month 3', n:52, pct:60  },
  ],
  peakHeatmap: {
    days:  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    slots: ['6am','9am','12pm','3pm','6pm','8pm'],
    data: [
      [7,4,3,1,8,9,2],
      [5,3,2,1,4,7,3],
      [4,5,6,3,4,5,2],
      [2,2,2,1,2,3,4],
      [9,10,8,5,10,6,3],
      [3,4,3,2,3,2,1],
    ],
  },
  trends: {
    months:     ['Nov','Dec','Jan','Feb','Mar','Apr'],
    members:    [71,73,77,80,84,87],
    checkIns:   [138,130,155,148,162,158],
    retention:  [72,71,69,70,69,68],
    engagement: [73,71,70,71,70,70],
  },
  classes: [
    { name:'Morning WOD',       coach:'Sam T',  avg:13, cap:15, trend: 1  },
    { name:'Lunchtime HIIT',    coach:'Sam T',  avg:8,  cap:12, trend:-2  },
    { name:'Evening CrossFit',  coach:'Alex R', avg:9,  cap:16, trend:-3  },
    { name:'Saturday Open Gym', coach:'Alex R', avg:11, cap:20, trend: 2  },
  ],
  newMembers: [
    { name:'Nina B.',   initials:'NB', days:8,  checkIns:3, status:'active'   },
    { name:'Carl J.',   initials:'CJ', days:11, checkIns:1, status:'at-risk'  },
    { name:'Yasmin O.', initials:'YO', days:14, checkIns:0, status:'inactive' },
    { name:'Liam P.',   initials:'LP', days:6,  checkIns:2, status:'active'   },
    { name:'Rosa T.',   initials:'RT', days:9,  checkIns:0, status:'inactive' },
    { name:'Omar F.',   initials:'OF', days:5,  checkIns:4, status:'active'   },
    { name:'Ellie V.',  initials:'EV', days:12, checkIns:0, status:'inactive' },
    { name:'Ben C.',    initials:'BC', days:7,  checkIns:1, status:'at-risk'  },
    { name:'Zoe W.',    initials:'ZW', days:3,  checkIns:2, status:'active'   },
  ],
};

/* ── Primitives ─────────────────────────────────────────────────── */

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 600, letterSpacing: '.1em',
      textTransform: 'uppercase', color: T.t3,
      fontFamily: F, marginBottom: 10, ...style,
    }}>
      {children}
    </div>
  );
}

function ThinBar({ pct, color = T.t3, height = 2 }) {
  return (
    <div style={{ height, borderRadius: 99, background: T.divider, width: '100%' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 99, background: color, opacity: 0.75 }} />
    </div>
  );
}

function Dot({ color, glow = false }) {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: color, flexShrink: 0,
      boxShadow: glow ? `0 0 6px ${color}90` : 'none',
    }} />
  );
}

/* Subtle status pill — text + optional dot, no bold fill */
function StatusPill({ status }) {
  const map = {
    active:    { color: T.green, bg: T.greenDim, brd: T.greenBrd, label: 'Active'   },
    'at-risk': { color: T.amber, bg: T.amberDim, brd: T.amberBrd, label: 'At risk'  },
    inactive:  { color: T.t3,   bg: T.surfaceEl, brd: T.border,   label: 'Inactive' },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 500,
      color: s.color, background: s.bg, border: `1px solid ${s.brd}`,
    }}>
      {s.label}
    </span>
  );
}

function Avatar({ initials, size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: T.surfaceEl, border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.31, fontWeight: 600, color: T.t2,
      letterSpacing: '0.02em', flexShrink: 0, fontFamily: 'monospace',
    }}>
      {initials}
    </div>
  );
}

function Sparkline({ data, color = T.t3, width = 100, height = 32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
      {/* End dot */}
      {(() => {
        const lastPt = pts.split(' ').pop().split(',');
        return <circle cx={lastPt[0]} cy={lastPt[1]} r="2.5" fill={color} opacity="0.9" />;
      })()}
    </svg>
  );
}

function GhostBtn({ children, onClick, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 11px', borderRadius: T.rsm, fontSize: 11, fontWeight: 500,
        cursor: 'pointer', fontFamily: F, border: '1px solid',
        background: hov ? T.surfaceHov : T.surfaceEl,
        borderColor: hov ? T.borderEl : T.border,
        color: T.t2, transition: 'all .12s', ...style,
      }}
    >{children}</button>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: T.r, boxShadow: T.sh, overflow: 'hidden', ...style,
    }}>{children}</div>
  );
}

/* ── Sticky header ──────────────────────────────────────────────── */
function Header({ gym }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 32px',
      borderBottom: `1px solid ${T.border}`,
      background: `${T.bg}e0`,
      backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 26, height: 26, borderRadius: T.rsm,
          background: T.surfaceEl, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity size={11} color={T.t3} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, letterSpacing: '-0.02em', fontFamily: F }}>{gym.name}</div>
          <div style={{ fontSize: 9, color: T.t3, fontFamily: F, marginTop: 1, letterSpacing: '.04em' }}>
            {gym.type} · {gym.city} · Retention dashboard
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Dot color={T.green} glow />
        <span style={{ fontSize: 10, color: T.t3, fontFamily: F }}>Live · updated just now</span>
      </div>
    </div>
  );
}

/* ── Hero section ───────────────────────────────────────────────── */
function HeroSection({ gym, summary }) {
  const HERO_H = 260;
  const PROFILE_SIZE = 84;

  return (
    <div style={{ position: 'relative', marginBottom: 0 }}>
      {/* Banner */}
      <div style={{ position: 'relative', height: HERO_H, overflow: 'hidden', background: T.surfaceEl }}>
        <img
          src={gym.heroBg} alt="Gym banner"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block', filter: 'brightness(0.35) saturate(0.5)' }}
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        {/* Bottom fade */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, transparent 40%, ${T.bg} 100%)`,
        }} />
        {/* Edit button */}
        <button style={{
          position: 'absolute', top: 16, right: 24,
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
          background: 'rgba(8,9,14,0.55)', border: `1px solid ${T.borderEl}`,
          borderRadius: T.rsm, fontSize: 10, fontWeight: 500, color: T.t2,
          cursor: 'pointer', fontFamily: F,
        }}>
          <Edit3 size={9} /> Edit cover
        </button>
        {/* Tagline */}
        <div style={{
          position: 'absolute', bottom: PROFILE_SIZE / 2 + 22, left: 32 + PROFILE_SIZE + 18,
          fontSize: 11, color: 'rgba(237,242,255,0.3)', fontFamily: F, fontStyle: 'italic', letterSpacing: '.03em',
        }}>
          {gym.tagline}
        </div>
      </div>

      {/* Profile row — overlaps banner */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', position: 'relative', marginTop: -(PROFILE_SIZE / 2) }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, paddingBottom: 20 }}>

          {/* Profile image */}
          <div style={{ flexShrink: 0, zIndex: 10, position: 'relative' }}>
            <div style={{
              width: PROFILE_SIZE + 4, height: PROFILE_SIZE + 4, borderRadius: '50%',
              background: T.surfaceEl, padding: 2,
              border: `2px solid ${T.bg}`,
              boxSizing: 'border-box',
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: T.surfaceEl }}>
                <img
                  src={gym.profileImg} alt={gym.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            </div>
            {/* Live dot */}
            <div style={{
              position: 'absolute', bottom: 4, right: 2,
              width: 14, height: 14, borderRadius: '50%',
              background: T.green, border: `2px solid ${T.bg}`,
            }} />
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: T.t1, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: F, margin: 0 }}>
                {gym.name}
              </h1>
              <span style={{
                fontSize: 9, fontWeight: 600, color: T.t3, letterSpacing: '.1em', textTransform: 'uppercase',
                padding: '2px 7px', border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: F,
              }}>
                {gym.type}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 7, flexWrap: 'wrap' }}>
              {[
                { icon: MapPin, text: gym.city },
                { icon: Star,   text: `${gym.rating} (${gym.reviewCount} reviews)` },
                { icon: Award,  text: `Est. ${gym.founded}` },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <m.icon size={9} color={T.t4} />
                  <span style={{ fontSize: 11, color: T.t3, fontFamily: F }}>{m.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stat chips */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', paddingBottom: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {[
              { label: 'Members',   value: summary.totalMembers,          highlight: false },
              { label: 'Active',    value: summary.activeMembers,          highlight: false },
              { label: 'Retention', value: `${summary.retentionRate}%`,    highlight: summary.retentionRate < 75, amber: true },
              { label: 'At risk',   value: summary.atRiskCount,            highlight: summary.atRiskCount > 0,   danger: true },
            ].map((chip, i) => (
              <div key={i} style={{
                padding: '10px 14px', background: T.surface,
                border: `1px solid ${chip.danger && chip.highlight ? T.redBrd : chip.amber && chip.highlight ? T.amberBrd : T.border}`,
                borderRadius: T.r,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 64,
              }}>
                <span style={{
                  fontSize: 20, fontWeight: 700, lineHeight: 1, fontFamily: F, fontVariantNumeric: 'tabular-nums',
                  color: chip.danger && chip.highlight ? T.red : chip.amber && chip.highlight ? T.amber : T.t1,
                  letterSpacing: '-0.03em',
                }}>
                  {chip.value}
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.09em', fontFamily: F }}>
                  {chip.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: T.border }} />
      </div>
    </div>
  );
}

/* ── Today's focus strip ────────────────────────────────────────── */
function FocusStrip({ items }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <SectionLabel>Today's focus</SectionLabel>
      <div style={{
        display: 'grid', gridTemplateColumns: '5fr 3fr 3fr',
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.r, overflow: 'hidden',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            padding: '20px 22px',
            borderRight: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
            /* Urgent: thin left accent only */
            borderLeft: item.urgent ? `2px solid ${T.red}` : '2px solid transparent',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {item.urgent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Dot color={T.red} />
                <span style={{ fontSize: 9, fontWeight: 600, color: T.red, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: F }}>
                  Attention required
                </span>
              </div>
            )}
            <div style={{ fontSize: 12, fontWeight: 600, color: T.t1, lineHeight: 1.55, fontFamily: F }}>
              {item.headline}
            </div>
            <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.6, fontFamily: F, flex: 1 }}>
              {item.sub}
            </div>
            {item.cta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 500, color: T.t2, fontFamily: F, cursor: 'pointer', marginTop: 2 }}>
                {item.cta} <ArrowRight size={9} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Core metrics row ───────────────────────────────────────────── */
function MetricRow({ s }) {
  const items = [
    { label: 'Total members',  value: s.totalMembers,          sub: `+${s.newThisMonth} this month`                                                },
    { label: 'Active members', value: s.activeMembers,          sub: `${Math.round(s.activeMembers / s.totalMembers * 100)}% of total`             },
    { label: 'Engagement',     value: `${s.engagementRate}%`,   sub: `${s.avgCheckInsWeek} check-ins/week avg`                                     },
    { label: 'Retention',      value: `${s.retentionRate}%`,    sub: s.retentionRate >= 75 ? 'On target' : `${75 - s.retentionRate}pt below 75%`,   amber: s.retentionRate < 75 },
    { label: 'At risk',        value: s.atRiskCount,            sub: '14+ days inactive',                                                           danger: s.atRiskCount > 0   },
  ];
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5,1fr)',
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.r, overflow: 'hidden',
      }}>
        {items.map((m, i) => (
          <div key={i} style={{
            padding: '20px 22px',
            borderRight: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12, fontFamily: F }}>
              {m.label}
            </div>
            <div style={{
              fontSize: 30, fontWeight: 700, lineHeight: 1, marginBottom: 7, fontFamily: F,
              letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
              color: m.danger ? T.red : m.amber ? T.amber : T.t1,
            }}>
              {m.value}
            </div>
            <div style={{ fontSize: 10, color: T.t3, fontFamily: F }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Retention risk panel ───────────────────────────────────────── */
function RetentionRiskPanel({ data, summary }) {
  const revenue = summary.atRiskCount * summary.pricePerMember;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? data.atRiskMembers : data.atRiskMembers.slice(0, 5);

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionLabel>Churn & retention risk</SectionLabel>
      <Card>
        {/* Top three-column panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>

          {/* Revenue at risk — only place red is used large */}
          <div style={{ padding: '28px 28px', borderRight: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: T.red, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16, fontFamily: F }}>
              Revenue at risk
            </div>
            {/* Large number — no color fill, just text */}
            <div style={{ fontSize: 52, fontWeight: 700, color: T.t1, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>
              £{revenue.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 24, fontFamily: F, lineHeight: 1.6 }}>
              per month · {summary.atRiskCount} members at risk
            </div>
            <GhostBtn>
              <MessageSquare size={10} /> Contact all {summary.atRiskCount}
            </GhostBtn>
          </div>

          {/* Retention rate */}
          <div style={{ padding: '28px 28px', borderRight: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16, fontFamily: F }}>
              Retention rate
            </div>
            <div style={{
              fontSize: 52, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 8, fontFamily: F, fontVariantNumeric: 'tabular-nums',
              /* Amber only when below target */
              color: summary.retentionRate < 75 ? T.amber : T.t1,
            }}>
              {summary.retentionRate}%
            </div>
            <div style={{ fontSize: 11, color: T.t3, marginBottom: 20, fontFamily: F }}>
              Target 75% · {75 - summary.retentionRate}pt below
            </div>
            {/* Target bar */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <ThinBar pct={summary.retentionRate} color={T.t3} height={3} />
              {/* Target marker */}
              <div style={{ position: 'absolute', top: -4, left: '75%', width: 1, height: 11, background: T.t4 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 9, color: T.t4, fontFamily: F }}>0%</span>
              <span style={{ fontSize: 9, color: T.t4, fontFamily: F }}>Target 75%</span>
              <span style={{ fontSize: 9, color: T.t4, fontFamily: F }}>100%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <TrendingDown size={11} color={T.red} />
              <span style={{ fontSize: 11, color: T.red, fontWeight: 500, fontFamily: F }}>−2% month over month</span>
            </div>
          </div>

          {/* Churn drivers */}
          <div style={{ padding: '28px 28px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16, fontFamily: F }}>
              Primary churn drivers
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {data.riskDrivers.map((d, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <span style={{ fontSize: 12, color: T.t1, fontFamily: F, fontWeight: 500 }}>{d.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.t2, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{d.n}</span>
                  </div>
                  <ThinBar pct={d.pct} color={i === 0 ? T.t2 : T.t3} />
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 24, padding: '11px 13px', borderRadius: T.rsm,
              background: T.surfaceEl, border: `1px solid ${T.border}`,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <Info size={10} color={T.t4} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 10, color: T.t3, fontFamily: F, lineHeight: 1.6 }}>
                Members who don't book in their first 14 days have a 3× higher cancellation rate.
              </span>
            </div>
          </div>
        </div>

        {/* Member table */}
        <div style={{ borderTop: `1px solid ${T.border}` }}>
          {/* Table header */}
          <div style={{
            padding: '10px 20px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.t2, fontFamily: F }}>At-risk members</span>
              <span style={{ fontSize: 10, color: T.t3, fontFamily: F }}>sorted by days since last check-in</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: T.t3, fontFamily: F }}>
                {data.atRiskMembers.length} members · £{(data.atRiskMembers.length * summary.pricePerMember).toLocaleString()}/mo
              </span>
              <GhostBtn><MessageSquare size={9} /> Message all</GhostBtn>
            </div>
          </div>

          {/* Column labels */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr 2fr 90px', padding: '7px 20px', borderBottom: `1px solid ${T.divider}` }}>
            {['Member', 'Last seen', 'Churn signal', 'Plan', ''].map((h, i) => (
              <span key={i} style={{
                fontSize: 9, fontWeight: 600, color: T.t4, textTransform: 'uppercase',
                letterSpacing: '.09em', fontFamily: F, textAlign: i === 4 ? 'right' : 'left',
              }}>{h}</span>
            ))}
          </div>

          {visible.map((m, i) => (
            <div key={m.id}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{
                display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr 2fr 90px',
                padding: '10px 20px', alignItems: 'center', cursor: 'pointer',
                borderBottom: i < visible.length - 1 ? `1px solid ${T.divider}` : 'none',
                transition: 'background .1s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Avatar initials={m.initials} size={26} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.t1, fontFamily: F }}>{m.name}</span>
              </div>
              {/* Last seen — red text for high risk, muted for medium */}
              <span style={{
                fontSize: 12, fontFamily: F, fontVariantNumeric: 'tabular-nums',
                color: m.riskLevel === 'high' ? T.red : T.t2,
                fontWeight: m.riskLevel === 'high' ? 500 : 400,
              }}>
                {m.lastSeen}
              </span>
              <span style={{ fontSize: 11, color: T.t2, fontFamily: F }}>{m.driver}</span>
              <span style={{ fontSize: 11, color: T.t3, fontFamily: F }}>{m.tier} · £{summary.pricePerMember}/mo</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <GhostBtn style={{ fontSize: 10, padding: '3px 9px' }}>Reach out</GhostBtn>
              </div>
            </div>
          ))}

          {data.atRiskMembers.length > 5 && (
            <div
              onClick={() => setExpanded(!expanded)}
              style={{
                padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 5,
                cursor: 'pointer', borderTop: `1px solid ${T.border}`,
                fontSize: 11, color: T.t3, fontFamily: F, fontWeight: 500,
                transition: 'background .1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {expanded
                ? <><ChevronUp size={10} /> Show less</>
                : <><ChevronDown size={10} /> {data.atRiskMembers.length - 5} more members</>
              }
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

/* ── Trends ─────────────────────────────────────────────────────── */
function TrendsSection({ trends }) {
  const items = [
    { label: 'Members',    data: trends.members,    delta: '+3',   up: true,  isAmt: false },
    { label: 'Retention',  data: trends.retention,  delta: '−2%',  up: false, isAmt: false, isPct: true },
    { label: 'Engagement', data: trends.engagement, delta: 'Flat', up: null,  isAmt: false, isPct: true },
    { label: 'Check-ins',  data: trends.checkIns,   delta: '+4%',  up: true,  isAmt: false },
  ];

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionLabel>Trends — last 6 months</SectionLabel>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {items.map((s, i) => {
            const last = s.data[s.data.length - 1];
            const display = s.isPct ? `${last}%` : last;
            const deltaColor = s.up === true ? T.t2 : s.up === false ? T.red : T.t3;
            return (
              <div key={i} style={{ padding: '22px', borderRight: i < items.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: F }}>
                    {s.label}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 500, fontFamily: F, display: 'flex', alignItems: 'center', gap: 3, color: deltaColor }}>
                    {s.up === true  && <TrendingUp  size={9} />}
                    {s.up === false && <TrendingDown size={9} />}
                    {s.delta}
                  </span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: T.t1, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 14, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>
                  {display}
                </div>
                <Sparkline data={s.data} color={s.up === false ? T.red : T.t2} width={120} height={34} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
                  <span style={{ fontSize: 9, color: T.t4, fontFamily: F }}>{trends.months[0]}</span>
                  <span style={{ fontSize: 9, color: T.t4, fontFamily: F }}>{trends.months[trends.months.length - 1]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}

/* ── Behaviour insights ─────────────────────────────────────────── */
function BehaviourInsights({ data }) {
  const maxHeat = Math.max(...data.peakHeatmap.data.flat());

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionLabel>Behaviour insights</SectionLabel>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.r, overflow: 'hidden',
      }}>
        {/* Drop-off funnel */}
        <div style={{ padding: '24px', borderRight: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 18, fontFamily: F }}>
            Member drop-off
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {data.dropOff.map((s, i) => {
              const drop = i > 0 ? data.dropOff[i - 1].pct - s.pct : 0;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: T.t1, fontFamily: F, fontWeight: 500 }}>{s.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {drop > 0 && (
                        <span style={{ fontSize: 10, color: drop >= 10 ? T.red : T.t3, fontWeight: 500, fontFamily: F }}>
                          −{drop}%
                        </span>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.t2, fontFamily: F, fontVariantNumeric: 'tabular-nums', width: 22, textAlign: 'right' }}>
                        {s.n}
                      </span>
                    </div>
                  </div>
                  <ThinBar pct={s.pct} color={T.t3} />
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 18, fontSize: 10, color: T.t3, fontFamily: F, lineHeight: 1.65, borderTop: `1px solid ${T.divider}`, paddingTop: 14 }}>
            Week 2 is your highest drop-off point. Members who don't return after their second week have a 68% churn rate within 60 days.
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: T.t3, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 18, fontFamily: F }}>
            Peak activity times
          </div>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px' }}>
            <thead>
              <tr>
                <td style={{ width: 30 }} />
                {data.peakHeatmap.days.map(d => (
                  <td key={d} style={{ fontSize: 9, fontWeight: 600, color: T.t4, textAlign: 'center', paddingBottom: 6, fontFamily: F, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    {d}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.peakHeatmap.slots.map((slot, si) => (
                <tr key={slot}>
                  <td style={{ fontSize: 9, color: T.t3, paddingRight: 5, fontFamily: F, verticalAlign: 'middle', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{slot}</td>
                  {data.peakHeatmap.data[si].map((v, di) => {
                    const opacity = v / maxHeat;
                    return (
                      <td key={di} style={{
                        height: 20, borderRadius: 3,
                        background: opacity < 0.15 ? T.surfaceEl : `rgba(237,242,255,${(opacity * 0.18).toFixed(2)})`,
                        border: `1px solid rgba(255,255,255,${(opacity * 0.04).toFixed(2)})`,
                      }} />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 9, color: T.t4, fontFamily: F }}>Low</span>
            {[0.04, 0.07, 0.10, 0.14, 0.18].map((a, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: `rgba(237,242,255,${a})`, border: `1px solid rgba(255,255,255,0.04)` }} />
            ))}
            <span style={{ fontSize: 9, color: T.t4, fontFamily: F }}>High</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Class performance table ────────────────────────────────────── */
function ClassPerformance({ classes }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <SectionLabel>Class performance</SectionLabel>
      <Card>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {['Class', 'Coach', 'Avg attendance', 'Capacity', 'Fill rate', 'Trend'].map((h, i) => (
                <th key={i} style={{
                  padding: '10px 20px', textAlign: i === 0 ? 'left' : 'right',
                  fontSize: 9, fontWeight: 600, color: T.t4,
                  textTransform: 'uppercase', letterSpacing: '.09em', fontFamily: F,
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
                  style={{ borderBottom: i < classes.length - 1 ? `1px solid ${T.divider}` : 'none', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 20px', fontSize: 12, fontWeight: 600, color: T.t1, fontFamily: F }}>{c.name}</td>
                  <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 11, color: T.t2, fontFamily: F }}>{c.coach}</td>
                  <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.t1, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{c.avg}</td>
                  <td style={{ padding: '11px 20px', textAlign: 'right', fontSize: 11, color: T.t3, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{c.cap}</td>
                  <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <div style={{ width: 44, height: 2, borderRadius: 99, background: T.divider, overflow: 'hidden' }}>
                        <div style={{ width: `${fill}%`, height: '100%', background: lowFill ? T.t4 : T.t3, borderRadius: 99 }} />
                      </div>
                      {/* fill % — red only for seriously low */}
                      <span style={{ fontSize: 11, fontWeight: 600, color: lowFill ? T.red : T.t2, fontFamily: F, fontVariantNumeric: 'tabular-nums', width: 30, textAlign: 'right' }}>
                        {fill}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500,
                      color: c.trend > 0 ? T.green : c.trend < 0 ? T.red : T.t3, fontFamily: F,
                    }}>
                      {c.trend > 0 && <TrendingUp  size={10} />}
                      {c.trend < 0 && <TrendingDown size={10} />}
                      {c.trend > 0 ? '+' : ''}{c.trend}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

/* ── Member segments ────────────────────────────────────────────── */
function Segments({ data, summary }) {
  const [tab, setTab] = useState('risk');
  const tabs = [
    { id: 'risk',     label: `At risk (${summary.atRiskCount})`       },
    { id: 'new',      label: `New members (${data.newMembers.length})` },
    { id: 'inactive', label: `Inactive (${summary.inactiveMembers})`   },
  ];

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionLabel>Member segments</SectionLabel>
      <Card>
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 6px', borderBottom: `1px solid ${T.border}` }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '11px 14px', background: 'transparent', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? T.t2 : 'transparent'}`,
              fontSize: 11, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? T.t1 : T.t3,
              cursor: 'pointer', fontFamily: F, marginBottom: -1, transition: 'color .12s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Column headers — risk + new tabs */}
        {(tab === 'risk' || tab === 'new') && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: tab === 'risk' ? '3fr 1.5fr 2fr 1.5fr' : '3fr 1.5fr 1.5fr 1.5fr',
            padding: '7px 20px', borderBottom: `1px solid ${T.divider}`,
          }}>
            {(tab === 'risk'
              ? ['Member', 'Last seen', 'Churn signal', 'Plan']
              : ['Member', 'Joined', 'Check-ins', 'Status']
            ).map((h, i) => (
              <span key={i} style={{ fontSize: 9, fontWeight: 600, color: T.t4, textTransform: 'uppercase', letterSpacing: '.09em', fontFamily: F }}>{h}</span>
            ))}
          </div>
        )}

        {/* Risk rows */}
        {tab === 'risk' && data.atRiskMembers.map((m, i) => (
          <div key={m.id}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{
              display: 'grid', gridTemplateColumns: '3fr 1.5fr 2fr 1.5fr',
              padding: '10px 20px', alignItems: 'center', cursor: 'pointer',
              borderBottom: i < data.atRiskMembers.length - 1 ? `1px solid ${T.divider}` : 'none',
              transition: 'background .1s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Avatar initials={m.initials} size={26} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.t1, fontFamily: F }}>{m.name}</span>
            </div>
            <span style={{ fontSize: 11, color: m.riskLevel === 'high' ? T.red : T.t2, fontFamily: F, fontWeight: m.riskLevel === 'high' ? 500 : 400 }}>
              {m.lastSeen}
            </span>
            <span style={{ fontSize: 11, color: T.t2, fontFamily: F }}>{m.driver}</span>
            <span style={{ fontSize: 11, color: T.t3, fontFamily: F }}>{m.tier}</span>
          </div>
        ))}

        {/* New member rows */}
        {tab === 'new' && data.newMembers.map((m, i) => (
          <div key={i}
            onMouseEnter={e => e.currentTarget.style.background = T.surfaceHov}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{
              display: 'grid', gridTemplateColumns: '3fr 1.5fr 1.5fr 1.5fr',
              padding: '10px 20px', alignItems: 'center', cursor: 'pointer',
              borderBottom: i < data.newMembers.length - 1 ? `1px solid ${T.divider}` : 'none',
              transition: 'background .1s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Avatar initials={m.initials} size={26} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.t1, fontFamily: F }}>{m.name}</span>
            </div>
            <span style={{ fontSize: 11, color: T.t3, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>{m.days}d ago</span>
            <span style={{ fontSize: 11, color: T.t2, fontFamily: F, fontVariantNumeric: 'tabular-nums' }}>
              {m.checkIns} {m.checkIns === 1 ? 'visit' : 'visits'}
            </span>
            <StatusPill status={m.status} />
          </div>
        ))}

        {/* Inactive empty state */}
        {tab === 'inactive' && (
          <div style={{ padding: '44px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 700, color: T.t4, fontFamily: F, letterSpacing: '-0.05em', marginBottom: 10, fontVariantNumeric: 'tabular-nums' }}>
              {summary.inactiveMembers}
            </div>
            <div style={{ fontSize: 12, color: T.t3, fontFamily: F, marginBottom: 20, lineHeight: 1.6 }}>
              Members with no recorded activity in the last 30 days
            </div>
            <GhostBtn style={{ margin: '0 auto' }}>
              <Bell size={10} /> Send re-engagement message
            </GhostBtn>
          </div>
        )}
      </Card>
    </section>
  );
}

/* ── Root component ─────────────────────────────────────────────── */
export default function GymRetentionDashboard({
  selectedGym,
  allMemberships = [],
  atRisk = 0,
  retentionRate = 0,
  classes = [],
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
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: T.t3, fontFamily: F }}>Loading…</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: F, color: T.t1 }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
        button { font-family: inherit; }
        td, th { font-family: '${F}'; }
      `}</style>

      <Header gym={gym} />
      <HeroSection gym={gym} summary={summary} />

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 32px 80px' }}>
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
