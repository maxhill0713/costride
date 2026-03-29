import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageCircle, ChevronRight, Search, X, Phone, Calendar,
  Dumbbell, TrendingUp, TrendingDown, Minus, Bell,
  Activity, User, Mail, CheckCircle, AlertTriangle, Zap,
  Star, CreditCard, Target, Clock, Send, Edit3,
  UserPlus, Filter, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const D = {
  bgBase:    '#06101c',
  bgSurface: '#0b1524',
  bgCard:    '#0e1d30',
  bgHover:   '#111f35',
  border:    'rgba(255,255,255,0.07)',
  borderHi:  'rgba(255,255,255,0.13)',
  divider:   'rgba(255,255,255,0.045)',
  purple:    '#8b5cf6',
  purpleDim: 'rgba(139,92,246,0.10)',
  purpleBrd: 'rgba(139,92,246,0.25)',
  green:     '#10b981',
  greenDim:  'rgba(16,185,129,0.09)',
  greenBrd:  'rgba(16,185,129,0.22)',
  red:       '#ef4444',
  redDim:    'rgba(239,68,68,0.08)',
  redBrd:    'rgba(239,68,68,0.22)',
  amber:     '#f59e0b',
  amberDim:  'rgba(245,158,11,0.09)',
  amberBrd:  'rgba(245,158,11,0.22)',
  blue:      '#38bdf8',
  blueDim:   'rgba(56,189,248,0.09)',
  blueBrd:   'rgba(56,189,248,0.22)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569', t4: '#2d3f55',
};

// ─── Realistic Mock Data ──────────────────────────────────────────────────────
const CLIENTS = [
  {
    id: 1, name: 'Sarah Mitchell', email: 'sarah.m@example.com',
    phone: '+44 7911 123 456', initials: 'SM', color: '#8b5cf6',
    tier: 'Premium', status: 'active', goal: 'Weight Loss',
    retentionScore: 88,
    retentionHistory: [68, 72, 74, 78, 80, 83, 86, 88],
    sessionsThisMonth: 9, sessionsLastMonth: 7,
    attendanceHistory: [2, 3, 2, 3, 2, 3, 3, 3],
    lastVisit: 1, streak: 14, consecutiveMissed: 0,
    joinDate: 'Sep 2023', membership: 'Unlimited Monthly', monthlySpend: 149,
    tags: ['HIIT', 'Yoga'],
    notes: 'Responds exceptionally well to HIIT circuits. Has a minor left-knee sensitivity — avoid high-impact lunges. Prefers early morning slots and positive reinforcement over critique.',
    nextSession: 'Tomorrow, 7:00 AM',
    upcomingClasses: ['HIIT Thursday', 'Yoga Sunday'],
    avatar: null,
  },
  {
    id: 2, name: 'James Chen', email: 'j.chen@example.com',
    phone: '+44 7700 234 567', initials: 'JC', color: '#38bdf8',
    tier: 'Standard', status: 'active', goal: 'Muscle Gain',
    retentionScore: 73,
    retentionHistory: [78, 77, 76, 75, 74, 74, 73, 73],
    sessionsThisMonth: 5, sessionsLastMonth: 7,
    attendanceHistory: [3, 2, 2, 2, 1, 2, 1, 2],
    lastVisit: 4, streak: 2, consecutiveMissed: 0,
    joinDate: 'Feb 2024', membership: '3x Week', monthlySpend: 89,
    tags: ['Strength', 'CrossFit'],
    notes: 'Highly competitive — responds extremely well to performance benchmarks and PRs. Interested in adding a nutrition coaching add-on. Missed 2 sessions this month without notice.',
    nextSession: 'Friday, 6:30 PM',
    upcomingClasses: ['Strength Friday'],
    avatar: null,
  },
  {
    id: 3, name: 'Olivia Hartley', email: 'olivia.h@example.com',
    phone: '+44 7733 345 678', initials: 'OH', color: '#ef4444',
    tier: 'Premium', status: 'at_risk', goal: 'Stress Relief',
    retentionScore: 38,
    retentionHistory: [82, 79, 70, 61, 53, 46, 41, 38],
    sessionsThisMonth: 1, sessionsLastMonth: 5,
    attendanceHistory: [3, 2, 2, 1, 1, 0, 1, 0],
    lastVisit: 18, streak: 0, consecutiveMissed: 3,
    joinDate: 'Jan 2023', membership: 'Unlimited Monthly', monthlySpend: 149,
    tags: ['Yoga', 'Pilates'],
    notes: 'Was one of the most consistent members in the gym. Significant engagement drop over the last 6 weeks. Mentioned work stress in her last session. A warm, personal check-in is strongly recommended — not a sales call.',
    nextSession: null,
    upcomingClasses: [],
    avatar: null,
  },
  {
    id: 4, name: 'Marcus Williams', email: 'marcus.w@example.com',
    phone: '+44 7808 456 789', initials: 'MW', color: '#10b981',
    tier: 'Elite', status: 'active', goal: 'Athletic Performance',
    retentionScore: 96,
    retentionHistory: [88, 89, 91, 92, 93, 94, 95, 96],
    sessionsThisMonth: 12, sessionsLastMonth: 11,
    attendanceHistory: [3, 3, 3, 3, 2, 3, 3, 3],
    lastVisit: 0, streak: 28, consecutiveMissed: 0,
    joinDate: 'Mar 2022', membership: 'Unlimited + PT', monthlySpend: 299,
    tags: ['Strength', 'HIIT', 'Boxing'],
    notes: 'Star client. Exceptional discipline — never misses a session. Ask about marathon prep plans; may want to shift programming toward endurance in Q3. Could be a great brand ambassador.',
    nextSession: 'Today, 5:30 PM',
    upcomingClasses: ['Boxing Today', 'HIIT Wednesday', 'Strength Friday'],
    avatar: null,
  },
  {
    id: 5, name: 'Priya Sharma', email: 'p.sharma@example.com',
    phone: '+44 7912 567 890', initials: 'PS', color: '#f59e0b',
    tier: 'Standard', status: 'paused', goal: 'General Fitness',
    retentionScore: 54,
    retentionHistory: [65, 63, 60, 57, 54, 51, 53, 54],
    sessionsThisMonth: 2, sessionsLastMonth: 4,
    attendanceHistory: [2, 2, 1, 1, 1, 0, 1, 1],
    lastVisit: 9, streak: 1, consecutiveMissed: 2,
    joinDate: 'Nov 2023', membership: 'Pay as You Go', monthlySpend: 55,
    tags: ['Cardio', 'Pilates'],
    notes: 'Membership paused due to travel — returns mid-month. Re-engagement plan needed. She responds well to class recommendations and milestone tracking. Send a welcome-back message.',
    nextSession: 'Returns 15th',
    upcomingClasses: [],
    avatar: null,
  },
  {
    id: 6, name: 'Tom Gallagher', email: 't.gallagher@example.com',
    phone: '+44 7765 678 901', initials: 'TG', color: '#38bdf8',
    tier: 'Standard', status: 'active', goal: 'Weight Loss',
    retentionScore: 67,
    retentionHistory: [55, 57, 60, 62, 64, 65, 66, 67],
    sessionsThisMonth: 4, sessionsLastMonth: 3,
    attendanceHistory: [1, 1, 2, 1, 2, 2, 1, 2],
    lastVisit: 3, streak: 3, consecutiveMissed: 0,
    joinDate: 'Apr 2024', membership: '2x Week', monthlySpend: 69,
    tags: ['Cardio', 'Functional'],
    notes: 'Newer member showing solid upward progress. Could benefit from an upgrade to 3x per week — suggest a trial offer next month. Enjoys friendly competition.',
    nextSession: 'Wednesday, 12:00 PM',
    upcomingClasses: ['Functional Wednesday'],
    avatar: null,
  },
  {
    id: 7, name: 'Aisha Okonkwo', email: 'a.okonkwo@example.com',
    phone: '+44 7890 789 012', initials: 'AO', color: '#8b5cf6',
    tier: 'Elite', status: 'active', goal: 'Endurance & Toning',
    retentionScore: 91,
    retentionHistory: [84, 85, 87, 88, 89, 90, 90, 91],
    sessionsThisMonth: 10, sessionsLastMonth: 10,
    attendanceHistory: [3, 2, 3, 3, 2, 3, 2, 3],
    lastVisit: 1, streak: 21, consecutiveMissed: 0,
    joinDate: 'Jul 2022', membership: 'Unlimited + PT', monthlySpend: 299,
    tags: ['Spin', 'Yoga', 'Pilates'],
    notes: 'Always asks thoughtful questions about form and technique — hugely engaged. Excellent candidate for the upcoming 8-week challenge. Has referred two friends this quarter.',
    nextSession: 'Tomorrow, 9:30 AM',
    upcomingClasses: ['Spin Tuesday', 'Yoga Thursday', 'Pilates Saturday'],
    avatar: null,
  },
  {
    id: 8, name: 'Daniel Foster', email: 'd.foster@example.com',
    phone: '+44 7700 890 123', initials: 'DF', color: '#ef4444',
    tier: 'Standard', status: 'at_risk', goal: 'Strength Building',
    retentionScore: 27,
    retentionHistory: [74, 66, 57, 47, 39, 34, 30, 27],
    sessionsThisMonth: 0, sessionsLastMonth: 3,
    attendanceHistory: [2, 2, 1, 1, 0, 0, 0, 0],
    lastVisit: 31, streak: 0, consecutiveMissed: 5,
    joinDate: 'Aug 2023', membership: '3x Week', monthlySpend: 89,
    tags: ['Strength'],
    notes: 'Has not attended in over a month. Last two messages went unanswered. Risk of churn is very high. Strongly consider a personal phone call rather than a text or push notification.',
    nextSession: null,
    upcomingClasses: [],
    avatar: null,
  },
];

// ─── Color Psychology Helpers — THE FIX ──────────────────────────────────────
// Rule: High scores MUST be green/blue. Low scores MUST be red.
// NEVER render a healthy score (80+) in red. That is a critical UX failure.
function retentionColor(score) {
  if (score >= 80) return D.green;   // Healthy  — reward with green
  if (score >= 60) return D.blue;    // Stable   — calm informational blue
  if (score >= 40) return D.amber;   // Caution  — amber warning
  return D.red;                       // Critical — red ONLY when earned
}

function retentionMeta(score) {
  if (score >= 80) return { label: 'Healthy',         variant: 'green' };
  if (score >= 60) return { label: 'Stable',          variant: 'blue'  };
  if (score >= 40) return { label: 'Needs Attention', variant: 'amber' };
  return                  { label: 'At Risk',         variant: 'red'   };
}

function scoreTrend(history) {
  if (!history || history.length < 4) return { dir: 'flat', delta: 0, color: D.t3 };
  const delta = history[history.length - 1] - history[history.length - 4];
  if (delta >  4) return { dir: 'up',   delta, color: D.green };
  if (delta < -4) return { dir: 'down', delta, color: D.red   };
  return               { dir: 'flat', delta: 0, color: D.t3  };
}

function tierVariant(tier) {
  if (tier === 'Elite')   return 'purple';
  if (tier === 'Premium') return 'blue';
  return 'neutral';
}

// ─── Spark SVG Sparkline ─────────────────────────────────────────────────────
function Spark({ data = [], color = D.green, height = 28, width = 72 }) {
  const idRef = useRef(`sp${Math.random().toString(36).slice(2)}`);
  if (!data || data.length < 2) return null;
  const min  = Math.min(...data);
  const max  = Math.max(...data);
  const rng  = (max - min) || 1;
  const px   = 2, py = 3;
  const pts  = data.map((v, i) => [
    px + (i / (data.length - 1)) * (width - px * 2),
    py + (1 - (v - min) / rng)   * (height - py * 2),
  ]);
  const poly = pts.map(p => p.join(',')).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={idRef.current} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`${px},${height} ${poly} ${width - px},${height}`} fill={`url(#${idRef.current})`}/>
      <polyline points={poly} stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lx} cy={ly} r="2.5" fill={color}/>
    </svg>
  );
}

// ─── MiniAvatar ───────────────────────────────────────────────────────────────
function MiniAvatar({ name = '', src, size = 36, color = D.purple }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/>;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}1e`, border: `1.5px solid ${color}3c`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800, color, flexShrink: 0,
      letterSpacing: '-0.01em', userSelect: 'none', lineHeight: 1,
    }}>
      {initials}
    </div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
const PILL_V = {
  green:   { color: D.green,  bg: D.greenDim,  border: D.greenBrd  },
  blue:    { color: D.blue,   bg: D.blueDim,   border: D.blueBrd   },
  red:     { color: D.red,    bg: D.redDim,    border: D.redBrd    },
  amber:   { color: D.amber,  bg: D.amberDim,  border: D.amberBrd  },
  purple:  { color: D.purple, bg: D.purpleDim, border: D.purpleBrd },
  neutral: { color: D.t3,     bg: 'rgba(255,255,255,0.04)', border: D.border },
};
function Pill({ label, variant = 'neutral', size = 'sm' }) {
  const v = PILL_V[variant] || PILL_V.neutral;
  return (
    <span style={{
      fontSize: size === 'xs' ? 8 : 9, fontWeight: 800, color: v.color,
      background: v.bg, border: `1px solid ${v.border}`, borderRadius: 6,
      padding: size === 'xs' ? '1px 5px' : '2px 8px',
      whiteSpace: 'nowrap', lineHeight: 1.35, letterSpacing: '0.025em', display: 'inline-block',
    }}>
      {label}
    </span>
  );
}

// ─── DashCard ─────────────────────────────────────────────────────────────────
function DashCard({ title, children, accentColor, action, onAction }) {
  const accent = accentColor || null;
  return (
    <div style={{
      borderRadius: 12, background: D.bgCard,
      border: `1px solid ${D.border}`,
      borderLeft: accent ? `3px solid ${accent}` : `1px solid ${D.border}`,
      overflow: 'hidden', flexShrink: 0,
    }}>
      {title && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${D.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: D.t3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
          {action && (
            <button onClick={onAction} style={{ fontSize: 9, fontWeight: 700, color: accent || D.t2, background: accent ? `${accent}14` : 'rgba(255,255,255,0.05)', border: `1px solid ${accent ? `${accent}30` : D.border}`, borderRadius: 6, padding: '3px 9px', cursor: 'pointer', fontFamily: 'inherit' }}>
              {action}
            </button>
          )}
        </div>
      )}
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({ icon: Ic, label, color, onClick, size = 'sm' }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: size === 'xs' ? '4px 8px' : '6px 12px',
        borderRadius: 8, background: hov ? `${color}1e` : `${color}0d`,
        border: `1px solid ${color}${hov ? '40' : '22'}`, color,
        fontSize: size === 'xs' ? 9 : 10, fontWeight: 700, cursor: 'pointer',
        whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.12s', flexShrink: 0,
      }}>
      {Ic && <Ic style={{ width: size === 'xs' ? 9 : 11, height: size === 'xs' ? 9 : 11 }}/>}
      {label}
    </button>
  );
}

// ─── Client Row ───────────────────────────────────────────────────────────────
function ClientRow({ client, isSelected, onClick }) {
  const [hov, setHov] = useState(false);
  const score    = client.retentionScore;
  const sColor   = retentionColor(score);  // ← FIXED: color comes from score value
  const trend    = scoreTrend(client.retentionHistory);
  const isAtRisk = client.status === 'at_risk';
  const isPaused = client.status === 'paused';
  const delta    = client.sessionsThisMonth - client.sessionsLastMonth;
  const TrendIc  = trend.dir === 'up' ? ArrowUpRight : trend.dir === 'down' ? ArrowDownRight : Minus;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 12,
        background: isSelected ? `${D.purple}09` : hov ? D.bgHover : D.bgSurface,
        border: `1px solid ${isSelected ? D.purpleBrd : hov ? D.borderHi : D.border}`,
        // .priority-row equivalent: red left accent for at-risk clients
        borderLeft: isAtRisk
          ? `3px solid ${D.red}`
          : isSelected ? `3px solid ${D.purple}` : `3px solid transparent`,
        padding: '13px 15px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: isSelected
          ? `0 0 0 1px ${D.purpleBrd}, 0 6px 24px ${D.purple}10`
          : hov ? '0 4px 16px rgba(0,0,0,0.25)' : 'none',
      }}>

      <MiniAvatar name={client.name} size={40} color={client.color}/>

      {/* Main info block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name + pill row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: D.t1, letterSpacing: '-0.015em' }}>{client.name}</span>
          <Pill label={client.tier} variant={tierVariant(client.tier)} size="xs"/>
          {isAtRisk  && <Pill label="At Risk" variant="red"   size="xs"/>}
          {isPaused  && <Pill label="Paused"  variant="amber" size="xs"/>}
          {client.streak >= 14 && <Pill label={`🔥 ${client.streak}d`} variant="green" size="xs"/>}
        </div>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: D.t3 }}>{client.goal}</span>
          <span style={{ fontSize: 10, color: D.t4 }}>·</span>
          <span style={{ fontSize: 10, color: D.t3 }}>
            {client.sessionsThisMonth} sessions
            {delta !== 0 && (
              <span style={{ color: delta > 0 ? D.green : D.red, fontWeight: 700, marginLeft: 3 }}>
                ({delta > 0 ? '+' : ''}{delta})
              </span>
            )}
          </span>
          <span style={{ fontSize: 10, color: D.t4 }}>·</span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: client.lastVisit === 0 ? D.green
                  : client.lastVisit > 14 ? D.red
                  : client.lastVisit > 7  ? D.amber : D.t3,
          }}>
            {client.lastVisit === 0 ? 'Today' : client.lastVisit === 1 ? 'Yesterday' : `${client.lastVisit}d ago`}
          </span>
        </div>
      </div>

      {/* Right side: sparkline + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ opacity: hov || isSelected ? 1 : 0.65, transition: 'opacity 0.15s' }}>
          <Spark data={client.retentionHistory} color={sColor} height={22} width={54}/>
        </div>
        <div style={{ textAlign: 'right', minWidth: 34 }}>
          {/* ▼ THE COLOR FIX: retentionColor() maps HIGH→green, LOW→red */}
          <div style={{ fontSize: 20, fontWeight: 900, color: sColor, lineHeight: 1, letterSpacing: '-0.04em' }}>
            {score}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
            <TrendIc style={{ width: 9, height: 9, color: trend.color }}/>
            <span style={{ fontSize: 7.5, fontWeight: 700, color: trend.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {trend.dir === 'up' ? 'Up' : trend.dir === 'down' ? 'Down' : 'Flat'}
            </span>
          </div>
        </div>
        <ChevronRight style={{ width: 13, height: 13, color: isSelected ? D.purple : hov ? D.t2 : D.t4, transition: 'color 0.15s', flexShrink: 0 }}/>
      </div>
    </div>
  );
}

// ─── Client Detail Panel ──────────────────────────────────────────────────────
function ClientDetailPanel({ client, onClose, openModal }) {
  const [tab, setTab]       = useState('overview');
  const [noteVal, setNoteVal] = useState(client.notes);
  const score    = client.retentionScore;
  const sColor   = retentionColor(score);
  const rmeta    = retentionMeta(score);
  const trend    = scoreTrend(client.retentionHistory);
  const isAtRisk = client.status === 'at_risk';
  const isPaused = client.status === 'paused';
  const delta    = client.sessionsThisMonth - client.sessionsLastMonth;
  const hasMissed3 = client.consecutiveMissed >= 3;
  const TrendIc  = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus;

  useEffect(() => { setTab('overview'); setNoteVal(client.notes); }, [client.id]);

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 410, zIndex: 9000,
      background: '#070f1e',
      borderLeft: `1px solid ${isAtRisk ? D.redBrd : D.border}`,
      display: 'flex', flexDirection: 'column',
      boxShadow: '-32px 0 80px rgba(0,0,0,0.55)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '20px 22px 16px', flexShrink: 0,
        background: `linear-gradient(145deg, ${client.color}0b 0%, transparent 60%)`,
        borderBottom: `1px solid ${D.divider}`,
      }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13, marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <MiniAvatar name={client.name} size={50} color={client.color}/>
            {client.lastVisit === 0 && (
              <div style={{ position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: '50%', background: D.green, border: `2px solid #070f1e`, boxShadow: `0 0 6px ${D.green}` }}/>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: D.t1, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              {client.name}
            </div>
            <div style={{ fontSize: 10, color: D.t3, marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span>{client.membership}</span>
              <span style={{ color: D.t4 }}>·</span>
              <span>Since {client.joinDate}</span>
              <span style={{ color: D.t4 }}>·</span>
              <span style={{ color: D.green, fontWeight: 700 }}>£{client.monthlySpend}/mo</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}`, color: D.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X style={{ width: 13, height: 13 }}/>
          </button>
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          <Pill label={client.tier} variant={tierVariant(client.tier)}/>
          <Pill label={rmeta.label} variant={rmeta.variant}/>
          {isAtRisk && <Pill label="🔴 Churn Risk" variant="red"/>}
          {isPaused && <Pill label="⏸ Paused" variant="amber"/>}
          {client.streak >= 7 && <Pill label={`🔥 ${client.streak}-day streak`} variant="green"/>}
          {client.tags.map((t, i) => <Pill key={i} label={t} variant="neutral"/>)}
        </div>

        {/* ── Retention Score Hero — FIXED COLOR PSYCHOLOGY ── */}
        {/*
          THE FIX IS HERE:
          - Score 96 (Marcus) → sColor = D.green  → rendered in GREEN ✓
          - Score 88 (Sarah)  → sColor = D.green  → rendered in GREEN ✓
          - Score 38 (Olivia) → sColor = D.red    → rendered in RED   ✓
          - Score 27 (Daniel) → sColor = D.red    → rendered in RED   ✓
          Never confuse high=green with low=red.
        */}
        <div style={{
          display: 'flex', alignItems: 'stretch', gap: 0,
          borderRadius: 12, background: `${sColor}08`, border: `1px solid ${sColor}20`, overflow: 'hidden',
        }}>
          {/* Large score number — color determined by value, not hardcoded */}
          <div style={{ padding: '14px 18px', textAlign: 'center', flexShrink: 0, borderRight: `1px solid ${sColor}1a` }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: sColor, lineHeight: 1, letterSpacing: '-0.05em' }}>
              {score}
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: D.t4, textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 4 }}>
              Retention Score
            </div>
          </div>

          {/* Trend label + sparkline showing the 8-week journey */}
          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <TrendIc style={{ width: 12, height: 12, color: trend.color, flexShrink: 0 }}/>
              <span style={{ fontSize: 10, fontWeight: 700, color: trend.color }}>
                {trend.dir === 'up'   ? `+${trend.delta} pts — Improving`
                : trend.dir === 'down' ? `${trend.delta} pts — Declining`
                : 'Stable — holding steady'}
              </span>
            </div>
            {/* Spark shows context: is that 85 rising from 60 or falling from 95? */}
            <div>
              <Spark data={client.retentionHistory} color={sColor} height={38} width={185}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 8, color: D.t4 }}>8 weeks ago</span>
                <span style={{ fontSize: 8, color: sColor, fontWeight: 700 }}>Now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${D.divider}`, flexShrink: 0, background: D.bgBase }}>
        {[{ id: 'overview', label: 'Overview' }, { id: 'sessions', label: 'Sessions' }, { id: 'notes', label: 'Notes' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '11px 8px', background: 'none', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? client.color : 'transparent'}`,
              color: tab === t.id ? client.color : D.t3,
              fontSize: 10, fontWeight: tab === t.id ? 800 : 600,
              cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit', letterSpacing: '0.015em',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 11 }}>

        {/* ═════ OVERVIEW ═════ */}
        {tab === 'overview' && (
          <>
            {/* DashCard with accentColor={D.amber} when 3+ consecutive missed */}
            {hasMissed3 && (
              <DashCard accentColor={D.amber} title="⚠  Needs Attention" action="Message Now" onAction={() => openModal?.('post', { memberId: client.id })}>
                <p style={{ fontSize: 11, color: D.t2, margin: 0, lineHeight: 1.65 }}>
                  {client.name.split(' ')[0]} has missed{' '}
                  <strong style={{ color: D.amber }}>{client.consecutiveMissed} consecutive sessions</strong>.
                  A personal check-in now can prevent churn before it happens.
                </p>
              </DashCard>
            )}

            {/* DashCard with accentColor={D.red} for at-risk clients */}
            {isAtRisk && !hasMissed3 && (
              <DashCard accentColor={D.red} title="🔴 High Churn Risk" action="Book Session" onAction={() => openModal?.('bookIntoClass', { memberId: client.id })}>
                <p style={{ fontSize: 11, color: D.t2, margin: 0, lineHeight: 1.65 }}>
                  Last visit was <strong style={{ color: D.red }}>{client.lastVisit} days ago</strong>.
                  Retention score has dropped to a critical level. Prioritise direct outreach immediately.
                </p>
              </DashCard>
            )}

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                {
                  label: 'Sessions / Month', icon: Dumbbell,
                  value: client.sessionsThisMonth,
                  sub: delta !== 0 ? `${delta > 0 ? '+' : ''}${delta} vs last month` : 'Same as last month',
                  color: delta >= 0 ? D.green : D.red,
                },
                {
                  label: 'Last Visit', icon: Clock,
                  value: client.lastVisit === 0 ? 'Today' : client.lastVisit === 1 ? 'Yesterday' : `${client.lastVisit}d ago`,
                  sub: client.streak > 0 ? `🔥 ${client.streak}-day streak` : 'Streak broken',
                  color: client.lastVisit > 14 ? D.red : client.lastVisit > 7 ? D.amber : D.green,
                },
                {
                  label: 'Monthly Spend', icon: CreditCard,
                  value: `£${client.monthlySpend}`,
                  sub: client.membership, color: D.blue,
                },
                {
                  label: 'Goal', icon: Target,
                  value: client.goal,
                  sub: client.tags.join(' · '), color: D.purple,
                },
              ].map((s, i) => (
                <div key={i} style={{ padding: '12px 13px', borderRadius: 11, background: D.bgCard, border: `1px solid ${D.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
                    <s.icon style={{ width: 10, height: 10, color: D.t4, flexShrink: 0 }}/>
                    <span style={{ fontSize: 9, color: D.t4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: D.t4, lineHeight: 1.4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Attendance sparkline with visual trend context */}
            <DashCard title="Attendance Pattern — 8 weeks">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Spark data={client.attendanceHistory} color={delta >= 0 ? D.green : D.amber} height={44} width={178}/>
                <div>
                  <div style={{ fontSize: 10, color: D.t3, lineHeight: 1.7 }}>
                    <strong style={{ color: D.t1 }}>{client.sessionsThisMonth}</strong> this month
                  </div>
                  <div style={{ fontSize: 10, color: D.t3, lineHeight: 1.7 }}>
                    <strong style={{ color: D.t2 }}>{client.sessionsLastMonth}</strong> last month
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, marginTop: 3, color: delta > 0 ? D.green : delta < 0 ? D.red : D.t3 }}>
                    {delta > 0 ? `+${delta}` : delta === 0 ? 'No change' : `${delta}`} sessions
                  </div>
                </div>
              </div>
            </DashCard>

            {/* Contact */}
            <DashCard title="Contact">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[{ icon: Mail, value: client.email }, { icon: Phone, value: client.phone }].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <c.icon style={{ width: 11, height: 11, color: D.t4, flexShrink: 0 }}/>
                    <span style={{ fontSize: 11, color: D.t2 }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </DashCard>

            {/* Upcoming */}
            {client.nextSession && (
              <DashCard title="Upcoming">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: client.upcomingClasses.length ? 10 : 0 }}>
                  <Calendar style={{ width: 12, height: 12, color: D.blue, flexShrink: 0 }}/>
                  <span style={{ fontSize: 12, fontWeight: 700, color: D.t1 }}>{client.nextSession}</span>
                </div>
                {client.upcomingClasses.map((cls, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderTop: `1px solid ${D.divider}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: client.color, flexShrink: 0 }}/>
                    <span style={{ fontSize: 10, color: D.t2 }}>{cls}</span>
                  </div>
                ))}
              </DashCard>
            )}
          </>
        )}

        {/* ═════ SESSIONS ═════ */}
        {tab === 'sessions' && (
          <>
            <div style={{ display: 'flex', gap: 0, borderRadius: 12, background: D.bgCard, border: `1px solid ${D.border}`, overflow: 'hidden' }}>
              {[
                { label: 'This Month', value: client.sessionsThisMonth, color: D.t1 },
                { label: 'Last Month', value: client.sessionsLastMonth, color: D.t2 },
                { label: 'Change',     value: `${delta >= 0 ? '+' : ''}${delta}`,   color: delta >= 0 ? D.green : D.red },
              ].map((s, i, arr) => (
                <div key={i} style={{ flex: 1, padding: '12px 13px', borderRight: i < arr.length - 1 ? `1px solid ${D.divider}` : 'none', textAlign: 'center' }}>
                  <div style={{ fontSize: 21, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: D.t4, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <DashCard title="8-Week Attendance">
              <Spark data={client.attendanceHistory} color={D.purple} height={52} width={340}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 8, color: D.t4 }}>8 weeks ago</span>
                <span style={{ fontSize: 8, color: D.purple, fontWeight: 700 }}>This week</span>
              </div>
            </DashCard>

            {client.upcomingClasses.length > 0 ? (
              <DashCard title="Booked Classes">
                {client.upcomingClasses.map((cls, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < client.upcomingClasses.length - 1 ? `1px solid ${D.divider}` : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: client.color, boxShadow: `0 0 5px ${client.color}`, flexShrink: 0 }}/>
                    <span style={{ fontSize: 11, color: D.t1, flex: 1, fontWeight: 600 }}>{cls}</span>
                    <Pill label="Booked" variant="green" size="xs"/>
                  </div>
                ))}
              </DashCard>
            ) : (
              <div style={{ padding: '28px 16px', textAlign: 'center', borderRadius: 12, background: D.bgCard, border: `1px solid ${D.border}` }}>
                <Calendar style={{ width: 20, height: 20, color: D.t4, margin: '0 auto 10px' }}/>
                <p style={{ fontSize: 12, color: D.t2, margin: '0 0 4px', fontWeight: 700 }}>No upcoming sessions</p>
                <p style={{ fontSize: 10, color: D.t3, margin: '0 0 14px' }}>
                  {isPaused ? 'Membership is currently paused.' : 'No classes booked yet.'}
                </p>
                <button onClick={() => openModal?.('bookIntoClass', { memberId: client.id })}
                  style={{ fontSize: 10, fontWeight: 700, color: D.purple, background: D.purpleDim, border: `1px solid ${D.purpleBrd}`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Book a Session
                </button>
              </div>
            )}
          </>
        )}

        {/* ═════ NOTES ═════ */}
        {tab === 'notes' && (
          <>
            <DashCard title="Coach Notes — Private">
              <textarea
                value={noteVal}
                onChange={e => setNoteVal(e.target.value)}
                style={{
                  width: '100%', minHeight: 140, padding: '10px 12px',
                  borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${D.border}`, color: D.t2,
                  fontSize: 11, resize: 'vertical', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.7, boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                placeholder="Add coaching notes, observations, preferences…"
                onFocus={e => e.target.style.borderColor = D.purpleBrd}
                onBlur={e  => e.target.style.borderColor = D.border}
              />
              <button style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 8, background: D.purpleDim, border: `1px solid ${D.purpleBrd}`, color: D.purple, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                <CheckCircle style={{ width: 10, height: 10 }}/> Save Notes
              </button>
            </DashCard>

            <DashCard title="Quick Reference">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Membership', value: client.membership },
                  { label: 'Join Date',  value: client.joinDate   },
                  { label: 'Goal',       value: client.goal       },
                  { label: 'Classes',    value: client.tags.join(', ') },
                  { label: 'Spend',      value: `£${client.monthlySpend}/month` },
                ].map((r, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? `1px solid ${D.divider}` : 'none' }}>
                    <span style={{ fontSize: 10, color: D.t3 }}>{r.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: D.t1 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </DashCard>
          </>
        )}
      </div>

      {/* ── Footer Actions ── */}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${D.divider}`, background: `${client.color}04`, display: 'flex', gap: 7, flexShrink: 0, flexWrap: 'wrap' }}>
        <ActionBtn icon={MessageCircle} label="Message" color={D.blue}   onClick={() => openModal?.('post',          { memberId: client.id })}/>
        <ActionBtn icon={Calendar}      label="Book"    color={D.purple} onClick={() => openModal?.('bookIntoClass', { memberId: client.id })}/>
        <ActionBtn icon={Dumbbell}      label="Workout" color={D.green}  onClick={() => openModal?.('assignWorkout', { memberId: client.id })}/>
        <ActionBtn icon={Phone}         label="Call"    color={D.amber}  onClick={() => {}}/>
      </div>
    </div>
  );
}

// ─── Summary KPI Bar ──────────────────────────────────────────────────────────
function SummaryBar({ clients }) {
  const avgScore = Math.round(clients.reduce((s, c) => s + c.retentionScore, 0) / (clients.length || 1));
  const revenue  = clients.reduce((s, c) => s + c.monthlySpend, 0);
  const atRisk   = clients.filter(c => c.status === 'at_risk').length;
  const active   = clients.filter(c => c.status === 'active').length;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      {[
        { label: 'MRR',           value: `£${revenue.toLocaleString()}`, sub: 'this month',               color: D.green  },
        { label: 'Avg Retention', value: avgScore,                        sub: retentionMeta(avgScore).label, color: retentionColor(avgScore) },
        { label: 'Active',        value: active,                          sub: 'clients',                  color: D.blue   },
        { label: 'Need Outreach', value: atRisk,                          sub: 'at risk',                  color: atRisk > 0 ? D.red : D.t3 },
      ].map((s, i) => (
        <div key={i} style={{ padding: '10px 15px', borderRadius: 11, background: D.bgSurface, border: `1px solid ${D.border}`, flex: '1 1 auto' }}>
          <div style={{ fontSize: 8, color: D.t4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{s.label}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.value}</div>
          <div style={{ fontSize: 9, color: D.t4, marginTop: 4 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ClientsPage ─────────────────────────────────────────────────────────
export default function ClientsPage({ openModal }) {
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [sortBy,   setSortBy]   = useState('name');
  const [selected, setSelected] = useState(null);

  const FILTERS = [
    { id: 'all',     label: 'All',        count: CLIENTS.length },
    { id: 'active',  label: 'Active',     count: CLIENTS.filter(c => c.status === 'active').length },
    { id: 'at_risk', label: 'At Risk',    count: CLIENTS.filter(c => c.status === 'at_risk').length },
    { id: 'paused',  label: 'Paused',     count: CLIENTS.filter(c => c.status === 'paused').length },
    { id: 'elite',   label: 'Elite Only', count: CLIENTS.filter(c => c.tier === 'Elite').length },
  ];

  const visible = useMemo(() => {
    let list = [...CLIENTS];
    if (filter === 'active')  list = list.filter(c => c.status === 'active');
    if (filter === 'at_risk') list = list.filter(c => c.status === 'at_risk');
    if (filter === 'paused')  list = list.filter(c => c.status === 'paused');
    if (filter === 'elite')   list = list.filter(c => c.tier === 'Elite');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.goal.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'score')     list.sort((a, b) => b.retentionScore - a.retentionScore);
    if (sortBy === 'lastVisit') list.sort((a, b) => a.lastVisit - b.lastVisit);
    if (sortBy === 'name')      list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filter, search, sortBy]);

  return (
    <div style={{
      background: D.bgBase, minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      paddingRight: selected ? 426 : 0,
      transition: 'padding-right 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <div style={{ padding: '24px 28px', maxWidth: 860, margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 23, fontWeight: 900, color: D.t1, margin: 0, letterSpacing: '-0.035em' }}>Clients</h1>
            <p style={{ fontSize: 11, color: D.t3, margin: '5px 0 0', fontWeight: 500 }}>
              {CLIENTS.length} total &nbsp;·&nbsp;
              <span style={{ color: CLIENTS.filter(c => c.status === 'at_risk').length > 0 ? D.red : D.t3 }}>
                {CLIENTS.filter(c => c.status === 'at_risk').length} need outreach
              </span>
            </p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: D.purpleDim, border: `1px solid ${D.purpleBrd}`, color: D.purple, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <UserPlus style={{ width: 14, height: 14 }}/> Add Client
          </button>
        </div>

        <SummaryBar clients={CLIENTS}/>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: D.t4, pointerEvents: 'none' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email or goal…"
              style={{ width: '100%', padding: '9px 34px', borderRadius: 10, background: D.bgSurface, border: `1px solid ${D.border}`, color: D.t1, fontSize: 11, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => e.target.style.borderColor = D.purpleBrd}
              onBlur={e  => e.target.style.borderColor = D.border}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: D.t4, display: 'flex', padding: 0 }}>
                <X style={{ width: 12, height: 12 }}/>
              </button>
            )}
          </div>
          {/* Sort tabs */}
          <div style={{ display: 'flex', gap: 3, padding: '3px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${D.border}`, borderRadius: 9 }}>
            {[{ id: 'name', label: 'Name' }, { id: 'score', label: 'Score' }, { id: 'lastVisit', label: 'Last Seen' }].map(s => (
              <button key={s.id} onClick={() => setSortBy(s.id)}
                style={{ padding: '5px 10px', borderRadius: 6, fontSize: 10, fontWeight: sortBy === s.id ? 700 : 500, background: sortBy === s.id ? D.purpleDim : 'transparent', border: `1px solid ${sortBy === s.id ? D.purpleBrd : 'transparent'}`, color: sortBy === s.id ? D.purple : D.t3, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
          {FILTERS.map(f => {
            const active = filter === f.id;
            const isRisk = f.id === 'at_risk' && f.count > 0;
            const fc = isRisk ? D.red : D.purple;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9,
                  whiteSpace: 'nowrap', flexShrink: 0,
                  border: `1px solid ${active ? (isRisk ? D.redBrd : D.purpleBrd) : D.border}`,
                  background: active ? (isRisk ? D.redDim : D.purpleDim) : 'transparent',
                  color: active ? fc : D.t3, fontSize: 11, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.13s', fontFamily: 'inherit',
                }}>
                {f.label}
                <span style={{ fontSize: 9, fontWeight: 800, background: active ? `${fc}20` : 'rgba(255,255,255,0.05)', color: active ? fc : D.t4, padding: '1px 6px', borderRadius: 99 }}>
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Column label */}
        {visible.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 6px', gap: 12 }}>
            <div style={{ width: 40, flexShrink: 0 }}/>
            <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: D.t4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Client</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: D.t4, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, marginRight: 28 }}>8-week trend · Score</span>
          </div>
        )}

        {/* Client List */}
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', borderRadius: 14, background: D.bgSurface, border: `1px solid ${D.border}` }}>
            <Search style={{ width: 26, height: 26, color: D.t4, margin: '0 auto 14px' }}/>
            <p style={{ fontSize: 14, color: D.t2, fontWeight: 700, margin: '0 0 5px' }}>No clients found</p>
            <p style={{ fontSize: 11, color: D.t3, margin: 0 }}>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {visible.map(c => (
              <ClientRow
                key={c.id} client={c}
                isSelected={selected?.id === c.id}
                onClick={() => setSelected(prev => prev?.id === c.id ? null : c)}
              />
            ))}
            <p style={{ textAlign: 'center', fontSize: 10, color: D.t4, marginTop: 4 }}>
              Showing {visible.length} of {CLIENTS.length} clients
            </p>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 8999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }} onClick={() => setSelected(null)}/>
          <ClientDetailPanel client={selected} onClose={() => setSelected(null)} openModal={openModal}/>
        </>
      )}
    </div>
  );
}
