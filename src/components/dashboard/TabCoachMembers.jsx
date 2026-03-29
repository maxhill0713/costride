import React, { useState, useMemo, useRef } from 'react';
import {
  Search, X, Phone, Calendar, Dumbbell, TrendingUp, TrendingDown,
  Minus, Activity, Mail, CheckCircle, AlertTriangle, Zap, Star,
  CreditCard, Target, Clock, MessageCircle, User, UserPlus,
  ChevronRight, Bell, Edit3, Filter,
} from 'lucide-react';
import { Avatar } from './DashboardPrimitives';
import { C, CARD_SHADOW, CARD_RADIUS } from '@/lib/dashboard-tokens';

/* ─────────────────────────────────────────────────────────────────
   RESPONSIVE CSS  — Same grid contract as TabContent
───────────────────────────────────────────────────────────────── */
const MOBILE_CSS = `
  .tc-root { display: grid; grid-template-columns: minmax(0,1fr) clamp(280px,28%,320px); gap: 16px; }
  .tc-left  { display: flex; flex-direction: column; height: 100%; overflow: hidden; min-height: 0; }
  .tc-tabs  { display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.07); margin-bottom: 14px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-shrink: 0; }
  .tc-tabs::-webkit-scrollbar { display: none; }
  .tc-tab-btn { padding: 8px 16px; font-size: 12px; font-family: inherit; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.15s; white-space: nowrap; flex-shrink: 0; }
  .tc-feed  { flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
  .tc-feed::-webkit-scrollbar { width: 4px; }
  .tc-feed::-webkit-scrollbar-track { background: transparent; }
  .tc-feed::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  .tc-feed::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.14); }
  .tc-sidebar { display: flex; flex-direction: column; gap: 10px; min-width: 280px; overflow-y: auto; max-height: 100%; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.08) transparent; }
  .tc-sidebar::-webkit-scrollbar { width: 4px; }
  .tc-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
  @media (max-width: 900px) {
    .tc-root    { grid-template-columns: 1fr !important; }
    .tc-left    { height: auto !important; overflow: visible !important; min-height: unset !important; }
    .tc-feed    { overflow: visible !important; min-height: unset !important; flex: unset !important; }
    .tc-sidebar { height: auto !important; overflow: visible !important; min-width: unset !important; max-height: unset !important; }
    .tc-tab-btn { padding: 7px 12px !important; font-size: 11px !important; }
  }
`;

/* ═══════════════════════════════════════════════════════════════════
   PRIMITIVES — exact mirror of TabContent
═══════════════════════════════════════════════════════════════════ */
function Card({ children, style = {}, highlight = false }) {
  return (
    <div style={{
      background:   C.surface,
      border:       `1px solid ${highlight ? `${C.accent}50` : C.border}`,
      borderRadius: CARD_RADIUS,
      boxShadow:    highlight ? `0 0 0 1px ${C.accent}18, ${CARD_SHADOW}` : CARD_SHADOW,
      overflow:     'hidden',
      position:     'relative',
      flexShrink:   0,
      transition:   'border-color 0.15s, box-shadow 0.15s',
      ...style,
    }}>
      {highlight && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg,${C.accent}70 0%,${C.accent}18 55%,transparent 100%)`,
          pointerEvents: 'none',
        }} />
      )}
      {children}
    </div>
  );
}

function CardBody({ children, style = {} }) {
  return <div style={{ padding: 16, ...style }}>{children}</div>;
}

/* Single unified accent pill — membership tier label */
function Pill({ label, muted = false }) {
  const color = muted ? C.t3 : C.accent;
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, color,
      background: `${color}12`, border: `1px solid ${color}24`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

/* Urgency pill — amber for warnings, muted otherwise */
function UrgencyPill({ label, urgent }) {
  const color = urgent ? C.warn : C.t3;
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, color,
      background: `${color}10`, border: `1px solid ${color}20`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

/* Danger pill — red, reserved exclusively for at-risk churn label */
function DangerPill({ label }) {
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, color: C.danger,
      background: `${C.danger}10`, border: `1px solid ${C.danger}22`,
      borderRadius: 5, padding: '2px 7px', flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

function Chip({ val, label }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700,
      padding: '3px 8px', borderRadius: 6,
      background: `${C.accent}10`, border: `1px solid ${C.accent}20`,
      color: C.t2,
    }}>
      <span style={{ color: C.t1 }}>{val}</span> {label}
    </div>
  );
}

function IconBadge({ icon: Icon, size = 26, tint }) {
  const ic = tint || C.accent;
  return (
    <div style={{
      width: size, height: size, borderRadius: 7,
      background: C.surfaceEl, border: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon style={{ width: size * 0.46, height: size * 0.46, color: ic }} />
    </div>
  );
}

function StatNudge({ positive = true, icon: Icon, stat, detail, action, onAction }) {
  const color = positive ? C.success : C.warn;
  return (
    <div style={{
      marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '9px 11px', borderRadius: 8,
      background: C.surfaceEl, border: `1px solid ${C.border}`,
      borderLeft: `2px solid ${color}`,
    }}>
      {Icon && <Icon style={{ width: 11, height: 11, color, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {stat && <span style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{stat} </span>}
        <span style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</span>
      </div>
      {action && onAction && (
        <button onClick={e => { e.stopPropagation(); onAction(); }} style={{
          flexShrink: 0, fontSize: 10, fontWeight: 600, color: C.accent,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 2, padding: 0,
        }}>
          {action} <ChevronRight style={{ width: 9, height: 9 }} />
        </button>
      )}
    </div>
  );
}

function SideCard({ children, style = {} }) {
  return (
    <div style={{
      padding: 16, borderRadius: CARD_RADIUS,
      background: C.surface, border: `1px solid ${C.border}`,
      boxShadow: CARD_SHADOW, flexShrink: 0,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SideLabel({ children }) {
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, color: C.t3,
      textTransform: 'uppercase', letterSpacing: '.13em',
    }}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SPARKLINE — 8-week retention trajectory
═══════════════════════════════════════════════════════════════════ */
function Sparkline({ data = [], color, width = 68, height = 26 }) {
  const idRef = useRef(`spk-${Math.random().toString(36).slice(2)}`);
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = (max - min) || 1;
  const px = 2, py = 3;
  const pts = data.map((v, i) => [
    px + (i / (data.length - 1)) * (width - px * 2),
    py + (1 - (v - min) / rng) * (height - py * 2),
  ]);
  const poly = pts.map(p => p.join(',')).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  const c = color || C.accent;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={idRef.current} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={c} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${px},${height} ${poly} ${width - px},${height}`} fill={`url(#${idRef.current})`} />
      <polyline points={poly} stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.2" fill={c} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COLOR PSYCHOLOGY HELPERS
   HIGH score → C.success (green)   LOW score → C.danger (red)
   Never render a healthy score in a warning or danger colour.
═══════════════════════════════════════════════════════════════════ */
function retentionColor(score) {
  if (score >= 80) return C.success;   // Healthy  → green reward
  if (score >= 60) return C.t1;        // Stable   → neutral white
  if (score >= 40) return C.warn;      // Caution  → amber
  return C.danger;                      // Critical → red ONLY when earned
}

function retentionMeta(score) {
  if (score >= 80) return { label: 'Healthy',         color: C.success };
  if (score >= 60) return { label: 'Stable',          color: C.t1     };
  if (score >= 40) return { label: 'Needs Attention', color: C.warn   };
  return                  { label: 'At Risk',         color: C.danger  };
}

function scoreTrend(history) {
  if (!history || history.length < 4) return { dir: 'flat', delta: 0 };
  const delta = history[history.length - 1] - history[history.length - 4];
  if (delta > 4)  return { dir: 'up',   delta };
  if (delta < -4) return { dir: 'down', delta };
  return               { dir: 'flat', delta: 0 };
}

/* ═══════════════════════════════════════════════════════════════════
   MOCK DATA — realistic, properly capitalised
═══════════════════════════════════════════════════════════════════ */
const CLIENTS = [
  {
    id: 1, name: 'Sarah Mitchell', email: 'sarah.m@example.com',
    phone: '+44 7911 123 456',
    tier: 'Premium', status: 'active', goal: 'Weight Loss',
    retentionScore: 88,
    retentionHistory: [68, 72, 74, 78, 80, 83, 86, 88],
    sessionsThisMonth: 9, sessionsLastMonth: 7,
    attendanceHistory: [2, 3, 2, 3, 2, 3, 3, 3],
    lastVisit: 1, streak: 14, consecutiveMissed: 0,
    joinDate: 'Sep 2023', membership: 'Unlimited Monthly', monthlySpend: 149,
    tags: ['HIIT', 'Yoga'],
    notes: 'Responds exceptionally well to HIIT circuits. Minor left-knee sensitivity — avoid high-impact lunges. Prefers early morning slots and positive reinforcement over critique.',
    nextSession: 'Tomorrow, 7:00 AM',
    upcomingClasses: ['HIIT Thursday', 'Yoga Sunday'],
  },
  {
    id: 2, name: 'James Chen', email: 'j.chen@example.com',
    phone: '+44 7700 234 567',
    tier: 'Standard', status: 'active', goal: 'Muscle Gain',
    retentionScore: 73,
    retentionHistory: [78, 77, 76, 75, 74, 74, 73, 73],
    sessionsThisMonth: 5, sessionsLastMonth: 7,
    attendanceHistory: [3, 2, 2, 2, 1, 2, 1, 2],
    lastVisit: 4, streak: 2, consecutiveMissed: 0,
    joinDate: 'Feb 2024', membership: '3× Week', monthlySpend: 89,
    tags: ['Strength', 'CrossFit'],
    notes: 'Highly competitive — responds extremely well to performance benchmarks. Interested in adding nutrition coaching. Missed 2 sessions this month without notice.',
    nextSession: 'Friday, 6:30 PM',
    upcomingClasses: ['Strength Friday'],
  },
  {
    id: 3, name: 'Olivia Hartley', email: 'olivia.h@example.com',
    phone: '+44 7733 345 678',
    tier: 'Premium', status: 'at_risk', goal: 'Stress Relief',
    retentionScore: 38,
    retentionHistory: [82, 79, 70, 61, 53, 46, 41, 38],
    sessionsThisMonth: 1, sessionsLastMonth: 5,
    attendanceHistory: [3, 2, 2, 1, 1, 0, 1, 0],
    lastVisit: 18, streak: 0, consecutiveMissed: 3,
    joinDate: 'Jan 2023', membership: 'Unlimited Monthly', monthlySpend: 149,
    tags: ['Yoga', 'Pilates'],
    notes: 'Was one of the most consistent members in the gym. Significant engagement drop over the last 6 weeks. Mentioned work stress in her last session. A warm, personal check-in is strongly recommended.',
    nextSession: null,
    upcomingClasses: [],
  },
  {
    id: 4, name: 'Marcus Williams', email: 'marcus.w@example.com',
    phone: '+44 7808 456 789',
    tier: 'Elite', status: 'active', goal: 'Athletic Performance',
    retentionScore: 96,
    retentionHistory: [88, 89, 91, 92, 93, 94, 95, 96],
    sessionsThisMonth: 12, sessionsLastMonth: 11,
    attendanceHistory: [3, 3, 3, 3, 2, 3, 3, 3],
    lastVisit: 0, streak: 28, consecutiveMissed: 0,
    joinDate: 'Mar 2022', membership: 'Unlimited + PT', monthlySpend: 299,
    tags: ['Strength', 'HIIT', 'Boxing'],
    notes: 'Star client. Exceptional discipline — never misses a session. Ask about marathon prep; may want to shift programming toward endurance in Q3. Could be a great brand ambassador.',
    nextSession: 'Today, 5:30 PM',
    upcomingClasses: ['Boxing Today', 'HIIT Wednesday', 'Strength Friday'],
  },
  {
    id: 5, name: 'Priya Sharma', email: 'p.sharma@example.com',
    phone: '+44 7912 567 890',
    tier: 'Standard', status: 'paused', goal: 'General Fitness',
    retentionScore: 54,
    retentionHistory: [65, 63, 60, 57, 54, 51, 53, 54],
    sessionsThisMonth: 2, sessionsLastMonth: 4,
    attendanceHistory: [2, 2, 1, 1, 1, 0, 1, 1],
    lastVisit: 9, streak: 1, consecutiveMissed: 2,
    joinDate: 'Nov 2023', membership: 'Pay As You Go', monthlySpend: 55,
    tags: ['Cardio', 'Pilates'],
    notes: 'Membership paused due to travel — returns mid-month. Send a personalised welcome-back message before she returns. Responds well to class recommendations and milestone tracking.',
    nextSession: 'Returns 15th',
    upcomingClasses: [],
  },
  {
    id: 6, name: 'Tom Gallagher', email: 't.gallagher@example.com',
    phone: '+44 7765 678 901',
    tier: 'Standard', status: 'active', goal: 'Weight Loss',
    retentionScore: 67,
    retentionHistory: [55, 57, 60, 62, 64, 65, 66, 67],
    sessionsThisMonth: 4, sessionsLastMonth: 3,
    attendanceHistory: [1, 1, 2, 1, 2, 2, 1, 2],
    lastVisit: 3, streak: 3, consecutiveMissed: 0,
    joinDate: 'Apr 2024', membership: '2× Week', monthlySpend: 69,
    tags: ['Cardio', 'Functional'],
    notes: 'Newer member with solid upward progress. Consider suggesting a trial upgrade to 3× per week next month. Enjoys friendly competition and benchmarks.',
    nextSession: 'Wednesday, 12:00 PM',
    upcomingClasses: ['Functional Wednesday'],
  },
  {
    id: 7, name: 'Aisha Okonkwo', email: 'a.okonkwo@example.com',
    phone: '+44 7890 789 012',
    tier: 'Elite', status: 'active', goal: 'Endurance & Toning',
    retentionScore: 91,
    retentionHistory: [84, 85, 87, 88, 89, 90, 90, 91],
    sessionsThisMonth: 10, sessionsLastMonth: 10,
    attendanceHistory: [3, 2, 3, 3, 2, 3, 2, 3],
    lastVisit: 1, streak: 21, consecutiveMissed: 0,
    joinDate: 'Jul 2022', membership: 'Unlimited + PT', monthlySpend: 299,
    tags: ['Spin', 'Yoga', 'Pilates'],
    notes: 'Always asks thoughtful questions about form and technique. Excellent candidate for the upcoming 8-week challenge. Has referred two friends this quarter.',
    nextSession: 'Tomorrow, 9:30 AM',
    upcomingClasses: ['Spin Tuesday', 'Yoga Thursday', 'Pilates Saturday'],
  },
  {
    id: 8, name: 'Daniel Foster', email: 'd.foster@example.com',
    phone: '+44 7700 890 123',
    tier: 'Standard', status: 'at_risk', goal: 'Strength Building',
    retentionScore: 27,
    retentionHistory: [74, 66, 57, 47, 39, 34, 30, 27],
    sessionsThisMonth: 0, sessionsLastMonth: 3,
    attendanceHistory: [2, 2, 1, 1, 0, 0, 0, 0],
    lastVisit: 31, streak: 0, consecutiveMissed: 5,
    joinDate: 'Aug 2023', membership: '3× Week', monthlySpend: 89,
    tags: ['Strength'],
    notes: 'Has not attended in over a month. Last two messages went unanswered. Risk of churn is very high. Consider a personal phone call rather than a text or push notification.',
    nextSession: null,
    upcomingClasses: [],
  },
];

/* ═══════════════════════════════════════════════════════════════════
   SUMMARY KPI BAR
═══════════════════════════════════════════════════════════════════ */
function SummaryBar({ clients }) {
  const mrr      = clients.reduce((s, c) => s + c.monthlySpend, 0);
  const avgScore = Math.round(clients.reduce((s, c) => s + c.retentionScore, 0) / (clients.length || 1));
  const active   = clients.filter(c => c.status === 'active').length;
  const atRisk   = clients.filter(c => c.status === 'at_risk').length;
  const avgMeta  = retentionMeta(avgScore);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
      {[
        { label: 'Monthly Revenue', value: `£${mrr.toLocaleString()}`, sub: 'MRR across all clients', color: C.success },
        { label: 'Avg Retention',   value: avgScore,                    sub: avgMeta.label,            color: avgMeta.color },
        { label: 'Active Clients',  value: active,                      sub: 'attending regularly',    color: C.accent },
        { label: 'Need Outreach',   value: atRisk,                      sub: 'at risk of churn',       color: atRisk > 0 ? C.danger : C.t3 },
      ].map((s, i) => (
        <div key={i} style={{
          padding: '12px 15px', borderRadius: CARD_RADIUS,
          background: C.surface, border: `1px solid ${C.border}`,
          boxShadow: CARD_SHADOW,
        }}>
          <div style={{ fontSize: 9, color: C.t3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 4 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 9.5, color: C.t3 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CLIENT LIST CARD
═══════════════════════════════════════════════════════════════════ */
function ClientCard({ client, isSelected, onClick, onAction }) {
  const [hov, setHov] = useState(false);
  const score   = client.retentionScore;
  const sColor  = retentionColor(score);
  const trend   = scoreTrend(client.retentionHistory);
  const isRisk  = client.status === 'at_risk';
  const isPaused = client.status === 'paused';
  const delta   = client.sessionsThisMonth - client.sessionsLastMonth;
  const TrendIc = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus;

  const cardExtra = {
    cursor: 'pointer',
    /* Red left-border accent reserved exclusively for churn-risk clients */
    borderLeft: isRisk && !isSelected
      ? `3px solid ${C.danger}`
      : isSelected
        ? undefined   /* highlight prop handles selected border */
        : `3px solid transparent`,
    transition: 'all 0.15s',
  };

  if (hov && !isSelected) cardExtra.borderColor = `${C.accent}30`;

  return (
    <Card highlight={isSelected} style={cardExtra}>
      <CardBody
        style={{ padding: '13px 15px' }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={onClick}
      >
        {/* ── Row 1: Avatar · Name · Pills · Score ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
          <Avatar name={client.name} size={38} />

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + tier/status pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.t1, letterSpacing: '-0.015em' }}>
                {client.name}
              </span>
              <Pill label={client.tier} />
              {isRisk   && <DangerPill label="At Risk" />}
              {isPaused && <UrgencyPill label="Paused" urgent={false} />}
              {client.streak >= 14 && <UrgencyPill label={`🔥 ${client.streak}d`} urgent={false} />}
            </div>
            {/* Goal · Last visit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: C.t3 }}>{client.goal}</span>
              <span style={{ fontSize: 10, color: C.border }}>·</span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: client.lastVisit === 0  ? C.success
                     : client.lastVisit > 14   ? C.danger
                     : client.lastVisit > 7    ? C.warn
                     : C.t3,
              }}>
                {client.lastVisit === 0 ? 'Seen today'
                 : client.lastVisit === 1 ? 'Yesterday'
                 : `${client.lastVisit}d ago`}
              </span>
            </div>
          </div>

          {/* Sparkline + Score — color maps to VALUE not label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div style={{ opacity: hov || isSelected ? 1 : 0.6, transition: 'opacity 0.15s' }}>
              <Sparkline data={client.retentionHistory} color={sColor} />
            </div>
            <div style={{ textAlign: 'right', minWidth: 32 }}>
              {/* ▸ THE FIX: sColor is C.success for high scores, C.danger only for low */}
              <div style={{ fontSize: 22, fontWeight: 900, color: sColor, lineHeight: 1, letterSpacing: '-0.04em' }}>
                {score}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 2 }}>
                <TrendIc style={{
                  width: 8, height: 8,
                  color: trend.dir === 'up' ? C.success : trend.dir === 'down' ? C.danger : C.t3,
                }} />
                <span style={{ fontSize: 7.5, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {trend.dir === 'up' ? 'Up' : trend.dir === 'down' ? 'Down' : 'Flat'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Chips ── */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <Chip val={client.sessionsThisMonth} label="sessions" />
          <Chip val={`£${client.monthlySpend}`} label="/ mo" />
          {delta !== 0 && (
            <div style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: delta > 0 ? `${C.success}10` : `${C.danger}10`,
              border: `1px solid ${delta > 0 ? `${C.success}22` : `${C.danger}22`}`,
              color: delta > 0 ? C.success : C.danger,
            }}>
              {delta > 0 ? `+${delta}` : delta} vs last month
            </div>
          )}
          {client.consecutiveMissed >= 3 && (
            <div style={{
              fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: `${C.warn}10`, border: `1px solid ${C.warn}22`, color: C.warn,
            }}>
              ⚠ {client.consecutiveMissed} missed
            </div>
          )}
        </div>

        {/* ── StatNudge — one targeted insight per card, only when urgent ── */}
        {isRisk && client.lastVisit > 14 && (
          <StatNudge
            positive={false}
            icon={AlertTriangle}
            stat={`${client.lastVisit} days since last visit.`}
            detail="Personal outreach now is the most effective way to prevent churn."
            action="Message"
            onAction={e => { onAction('message', client); }}
          />
        )}
        {client.consecutiveMissed >= 3 && !isRisk && (
          <StatNudge
            positive={false}
            icon={Bell}
            stat={`${client.consecutiveMissed} sessions missed in a row.`}
            detail="A check-in message keeps them accountable without pressure."
            action="Reach out"
            onAction={() => onAction('message', client)}
          />
        )}
        {client.streak >= 21 && (
          <StatNudge
            positive
            icon={Zap}
            stat={`${client.streak}-day streak.`}
            detail="Acknowledge this milestone — recognition drives long-term loyalty."
          />
        )}
      </CardBody>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EMPTY DETAIL STATE
═══════════════════════════════════════════════════════════════════ */
function EmptyDetailState() {
  return (
    <div className="tc-sidebar" style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: CARD_RADIUS,
          background: `${C.accent}14`, border: `1px solid ${C.accent}24`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
        }}>
          <User style={{ width: 18, height: 18, color: C.accent, opacity: 0.6 }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.t2, margin: '0 0 6px' }}>Select a client</p>
        <p style={{ fontSize: 11, color: C.t3, margin: 0, lineHeight: 1.55 }}>
          Click any row to view retention data, session history, and actionable insights.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CLIENT DETAIL SIDEBAR
═══════════════════════════════════════════════════════════════════ */
function ClientDetailSidebar({ client, openModal }) {
  const score   = client.retentionScore;
  const sColor  = retentionColor(score);
  const rmeta   = retentionMeta(score);
  const trend   = scoreTrend(client.retentionHistory);
  const isRisk  = client.status === 'at_risk';
  const isPaused = client.status === 'paused';
  const delta   = client.sessionsThisMonth - client.sessionsLastMonth;
  const hasMissed = client.consecutiveMissed >= 3;
  const TrendIc = trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus;

  const trendColor = trend.dir === 'up' ? C.success : trend.dir === 'down' ? C.danger : C.t3;

  return (
    <div className="tc-sidebar">

      {/* ── Identity ── */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={client.name} size={44} />
            {client.lastVisit === 0 && (
              <div style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 10, height: 10, borderRadius: '50%',
                background: C.success, border: `2px solid ${C.surface}`,
                boxShadow: `0 0 6px ${C.success}`,
              }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: C.t1, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 6 }}>
              {client.name}
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <Pill label={client.tier} />
              <Pill label={rmeta.label} muted />
              {isRisk && <DangerPill label="At Risk" />}
              {isPaused && <UrgencyPill label="Paused" urgent={false} />}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.t3, lineHeight: 1.6 }}>
          Since {client.joinDate} &nbsp;·&nbsp; {client.membership} &nbsp;·&nbsp;
          <span style={{ color: C.success, fontWeight: 700 }}>£{client.monthlySpend}/mo</span>
        </div>
      </SideCard>

      {/* ── Retention Score — hero widget ── */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <IconBadge icon={Activity} />
          <SideLabel>Retention Score</SideLabel>
        </div>
        {/*
          COLOR RULE ENFORCED HERE:
          sColor = retentionColor(score) = C.success when score ≥ 80
          A score of 96 renders in GREEN. A score of 27 renders in RED.
          The number's colour communicates health — never invert this.
        */}
        <div style={{
          display: 'flex', alignItems: 'stretch', borderRadius: 10, overflow: 'hidden',
          background: `${sColor}08`, border: `1px solid ${sColor}20`,
        }}>
          <div style={{
            padding: '14px 16px', textAlign: 'center', flexShrink: 0,
            borderRight: `1px solid ${sColor}18`,
          }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: sColor, lineHeight: 1, letterSpacing: '-0.05em' }}>
              {score}
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.09em', marginTop: 4 }}>
              {rmeta.label}
            </div>
          </div>
          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <TrendIc style={{ width: 11, height: 11, color: trendColor, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: trendColor }}>
                {trend.dir === 'up'
                  ? `+${trend.delta} pts — Improving`
                  : trend.dir === 'down'
                    ? `${trend.delta} pts — Declining`
                    : 'Stable — holding steady'}
              </span>
            </div>
            <div>
              <Sparkline data={client.retentionHistory} color={sColor} width={148} height={38} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontSize: 8, color: C.t3 }}>8 wks ago</span>
                <span style={{ fontSize: 8, color: sColor, fontWeight: 700 }}>Now</span>
              </div>
            </div>
          </div>
        </div>
      </SideCard>

      {/* ── Key Stats ── */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <IconBadge icon={Zap} />
          <SideLabel>Key Stats</SideLabel>
        </div>
        {/* Chip row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip val={client.sessionsThisMonth} label="sessions" />
          <Chip val={`£${client.monthlySpend}`} label="/mo" />
          <Chip val={client.streak > 0 ? `${client.streak}d` : '—'} label="streak" />
        </div>
        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {[
            {
              label: 'This Month', icon: Dumbbell,
              value: client.sessionsThisMonth,
              sub: delta !== 0 ? `${delta > 0 ? '+' : ''}${delta} vs last month` : 'Same as last month',
              color: delta > 0 ? C.success : delta < 0 ? C.danger : C.t2,
            },
            {
              label: 'Last Visit', icon: Clock,
              value: client.lastVisit === 0 ? 'Today' : client.lastVisit === 1 ? 'Yesterday' : `${client.lastVisit}d ago`,
              sub: client.streak > 0 ? `🔥 ${client.streak}-day streak` : 'No active streak',
              color: client.lastVisit > 14 ? C.danger : client.lastVisit > 7 ? C.warn : C.success,
            },
            {
              label: 'Monthly Spend', icon: CreditCard,
              value: `£${client.monthlySpend}`,
              sub: client.membership,
              color: C.accent,
            },
            {
              label: 'Goal', icon: Target,
              value: client.goal.split(' ')[0],
              sub: client.tags.join(' · '),
              color: C.t1,
            },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '10px 11px', borderRadius: 9,
              background: C.surfaceEl, border: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <s.icon style={{ width: 9, height: 9, color: C.t3, flexShrink: 0 }} />
                <span style={{ fontSize: 8.5, color: C.t3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 3, letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, color: C.t3, lineHeight: 1.4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </SideCard>

      {/* ── Actionable Insights ── */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <IconBadge icon={AlertTriangle} tint={isRisk || hasMissed ? C.warn : C.accent} />
          <SideLabel>Insights</SideLabel>
        </div>

        {/* At-risk nudge */}
        {isRisk && (
          <StatNudge
            positive={false}
            icon={AlertTriangle}
            stat="High churn risk."
            detail={`Last visit was ${client.lastVisit} days ago. Prioritise a personal call over a push notification.`}
            action="Message"
            onAction={() => openModal?.('message', { memberId: client.id })}
          />
        )}

        {/* Consecutive missed sessions */}
        {hasMissed && (
          <StatNudge
            positive={false}
            icon={Bell}
            stat={`${client.consecutiveMissed} consecutive sessions missed.`}
            detail="A warm check-in is more effective than a promotional offer right now."
            action="Reach out"
            onAction={() => openModal?.('message', { memberId: client.id })}
          />
        )}

        {/* Paused membership */}
        {isPaused && (
          <StatNudge
            positive={false}
            icon={Clock}
            stat="Membership paused."
            detail="Send a personalised welcome-back message before they return to re-engage early."
            action="Welcome back"
            onAction={() => openModal?.('message', { memberId: client.id })}
          />
        )}

        {/* Streak celebration */}
        {client.streak >= 21 && (
          <StatNudge
            positive
            icon={Zap}
            stat={`${client.streak}-day streak.`}
            detail="Acknowledge this publicly or with a personal note — recognition drives loyalty."
          />
        )}

        {/* Upgrade candidate */}
        {client.tier === 'Standard' && score >= 70 && delta >= 0 && (
          <StatNudge
            positive
            icon={Star}
            stat="Upgrade candidate."
            detail="Strong engagement and upward trend. A well-timed tier offer could convert."
            action="Suggest upgrade"
            onAction={() => openModal?.('message', { memberId: client.id })}
          />
        )}

        {/* All clear state */}
        {!isRisk && !isPaused && !hasMissed && client.streak < 21 && !(client.tier === 'Standard' && score >= 70 && delta >= 0) && (
          <div style={{
            marginTop: 10, padding: '9px 11px', borderRadius: 8,
            background: C.surfaceEl, border: `1px solid ${C.border}`,
            borderLeft: `2px solid ${C.success}`,
            display: 'flex', alignItems: 'flex-start', gap: 9,
          }}>
            <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>No action needed.</div>
              <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>This client is tracking well. Keep the cadence going.</div>
            </div>
          </div>
        )}
      </SideCard>

      {/* ── Upcoming Sessions ── */}
      {(client.nextSession || client.upcomingClasses?.length > 0) && (
        <SideCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <IconBadge icon={Calendar} />
            <SideLabel>Upcoming</SideLabel>
          </div>
          {client.nextSession && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Calendar style={{ width: 11, height: 11, color: C.accent, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>{client.nextSession}</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {client.upcomingClasses?.map((cls, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 0',
                borderTop: `1px solid ${C.border}`,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: C.t2 }}>{cls}</span>
                <Pill label="Booked" muted />
              </div>
            ))}
          </div>
        </SideCard>
      )}

      {/* ── No upcoming sessions ── */}
      {!client.nextSession && (!client.upcomingClasses || client.upcomingClasses.length === 0) && (
        <SideCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <IconBadge icon={Calendar} />
            <SideLabel>Upcoming</SideLabel>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
            <p style={{ fontSize: 12, color: C.t2, margin: '0 0 4px', fontWeight: 600 }}>No sessions booked</p>
            <p style={{ fontSize: 10, color: C.t3, margin: '0 0 12px' }}>
              {isPaused ? 'Membership is currently paused.' : 'No upcoming classes booked.'}
            </p>
            <button
              onClick={() => openModal?.('bookIntoClass', { memberId: client.id })}
              style={{
                fontSize: 11, fontWeight: 700, color: C.accent,
                background: `${C.accent}10`, border: `1px solid ${C.accent}24`,
                borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
              Book a Session
            </button>
          </div>
        </SideCard>
      )}

      {/* ── Goal & Classes ── */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <IconBadge icon={Target} />
          <SideLabel>Goal & Classes</SideLabel>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, marginBottom: 9 }}>{client.goal}</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {client.tags.map((t, i) => <Pill key={i} label={t} muted />)}
        </div>
      </SideCard>

      {/* ── Contact ── */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <IconBadge icon={User} />
          <SideLabel>Contact</SideLabel>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            { icon: Mail,  value: client.email },
            { icon: Phone, value: client.phone },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <c.icon style={{ width: 11, height: 11, color: C.t3, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.t2 }}>{c.value}</span>
            </div>
          ))}
        </div>
      </SideCard>

      {/* ── Coach Notes ── */}
      <SideCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <IconBadge icon={Edit3} />
          <SideLabel>Coach Notes</SideLabel>
        </div>
        <p style={{ fontSize: 11, color: C.t2, lineHeight: 1.68, margin: 0 }}>
          {client.notes}
        </p>
      </SideCard>

      {/* ── Footer Actions ── */}
      <SideCard style={{ background: C.surfaceEl }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {[
            { icon: MessageCircle, label: 'Message', fn: () => openModal?.('message',       { memberId: client.id }) },
            { icon: Calendar,      label: 'Book',    fn: () => openModal?.('bookIntoClass', { memberId: client.id }) },
            { icon: Dumbbell,      label: 'Workout', fn: () => openModal?.('assignWorkout', { memberId: client.id }) },
            { icon: Phone,         label: 'Call',    fn: () => {} },
          ].map(({ icon: Icon, label, fn }, i) => (
            <button key={i} onClick={fn} style={{
              flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '8px 10px', borderRadius: 8,
              background: C.surface, border: `1px solid ${C.border}`,
              color: C.t2, fontSize: 10, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.accent}40`; e.currentTarget.style.color = C.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border;         e.currentTarget.style.color = C.t2;    }}>
              <Icon style={{ width: 11, height: 11 }} />
              {label}
            </button>
          ))}
        </div>
      </SideCard>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */
export default function TabCoachMembers({ openModal = () => {} }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('risk');
  const [selected,     setSelected]     = useState(null);

  const atRiskCount = CLIENTS.filter(c => c.status === 'at_risk').length;

  const FILTERS = [
    { id: 'all',     label: 'All Clients', count: CLIENTS.length },
    { id: 'active',  label: 'Active',      count: CLIENTS.filter(c => c.status === 'active').length },
    { id: 'at_risk', label: 'At Risk',     count: atRiskCount,  urgent: true },
    { id: 'paused',  label: 'Paused',      count: CLIENTS.filter(c => c.status === 'paused').length },
    { id: 'elite',   label: 'Elite',       count: CLIENTS.filter(c => c.tier === 'Elite').length },
  ];

  const visible = useMemo(() => {
    let list = [...CLIENTS];
    if (activeFilter === 'active')  list = list.filter(c => c.status === 'active');
    if (activeFilter === 'at_risk') list = list.filter(c => c.status === 'at_risk');
    if (activeFilter === 'paused')  list = list.filter(c => c.status === 'paused');
    if (activeFilter === 'elite')   list = list.filter(c => c.tier === 'Elite');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.goal.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'risk')      list.sort((a, b) => a.retentionScore - b.retentionScore); // lowest first
    if (sortBy === 'score')     list.sort((a, b) => b.retentionScore - a.retentionScore);
    if (sortBy === 'lastVisit') list.sort((a, b) => b.lastVisit - a.lastVisit);
    if (sortBy === 'name')      list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [activeFilter, search, sortBy]);

  function handleAction(type, client) {
    openModal?.(type, { memberId: client.id });
  }

  return (
    <>
      <style>{MOBILE_CSS}</style>

      {/* ── Summary Bar ── */}
      <SummaryBar clients={CLIENTS} />

      {/* ── Controls: search + sort ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            width: 13, height: 13, color: C.t3, pointerEvents: 'none',
          }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or goal…"
            style={{
              width: '100%', padding: '9px 34px', borderRadius: 10,
              background: C.surface, border: `1px solid ${C.border}`,
              color: C.t1, fontSize: 11, outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = `${C.accent}50`}
            onBlur={e  => e.target.style.borderColor = C.border}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: C.t3,
                display: 'flex', padding: 0,
              }}>
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        {/* Sort tabs */}
        <div style={{
          display: 'flex', gap: 3, padding: '3px',
          background: `rgba(255,255,255,0.02)`,
          border: `1px solid ${C.border}`, borderRadius: 9,
        }}>
          {[
            { id: 'risk',      label: 'Priority'  },
            { id: 'score',     label: 'Score'     },
            { id: 'lastVisit', label: 'Last Seen' },
            { id: 'name',      label: 'Name'      },
          ].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)} style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 10,
              fontWeight: sortBy === s.id ? 700 : 500,
              background: sortBy === s.id ? `${C.accent}10` : 'transparent',
              border: `1px solid ${sortBy === s.id ? `${C.accent}24` : 'transparent'}`,
              color: sortBy === s.id ? C.accent : C.t3,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.12s',
            }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Add client */}
        <button
          onClick={() => openModal?.('addClient')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 14px', borderRadius: 10,
            background: C.accent, border: 'none',
            color: '#fff', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            boxShadow: `0 0 0 1px ${C.accent}60, 0 4px 14px ${C.accent}30`,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <UserPlus style={{ width: 12, height: 12 }} />
          Add Client
        </button>
      </div>

      {/* ── Main grid ── */}
      <div className="tc-root">

        {/* ── LEFT: filter tabs + client list ── */}
        <div className="tc-left">

          {/* Filter tabs */}
          <div className="tc-tabs">
            <span style={{
              fontSize: 10.5, fontWeight: 700, color: C.t3,
              textTransform: 'uppercase', letterSpacing: '.13em',
              padding: '8px 14px 8px 0', marginBottom: -1, flexShrink: 0,
            }}>
              Clients
            </span>
            {FILTERS.map(f => {
              const isActive  = activeFilter === f.id;
              const isUrgent  = f.urgent && f.count > 0;
              const tabColor  = isActive
                ? isUrgent ? C.danger : C.accent
                : C.t3;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="tc-tab-btn"
                  style={{
                    fontWeight:   isActive ? 700 : 500,
                    color:        tabColor,
                    borderBottom: `2px solid ${isActive ? tabColor : 'transparent'}`,
                    marginBottom: -1,
                    display:      'flex',
                    alignItems:   'center',
                    gap:          5,
                  }}>
                  {f.label}
                  {f.count > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 800,
                      background: isActive
                        ? (isUrgent ? `${C.danger}18` : `${C.accent}18`)
                        : 'rgba(255,255,255,0.05)',
                      color: isActive ? tabColor : C.t3,
                      padding: '1px 5px', borderRadius: 99,
                    }}>
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Column header */}
          {visible.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '0 15px 8px', gap: 12, flexShrink: 0,
            }}>
              <div style={{ width: 38, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Client
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0, marginRight: 14 }}>
                8-week trend · Score
              </span>
            </div>
          )}

          {/* Scrollable list */}
          <div className="tc-feed">
            {visible.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '56px 24px', gap: 12,
                borderRadius: CARD_RADIUS, background: C.surface, border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: CARD_RADIUS,
                  background: `${C.accent}14`, border: `1px solid ${C.accent}24`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Search style={{ width: 18, height: 18, color: C.accent, opacity: 0.6 }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.t2, margin: 0 }}>No clients found</p>
                <p style={{ fontSize: 11, color: C.t3, margin: 0 }}>Try adjusting your search or filter</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 28, paddingRight: 4 }}>
                {visible.map(c => (
                  <ClientCard
                    key={c.id}
                    client={c}
                    isSelected={selected?.id === c.id}
                    onClick={() => setSelected(prev => prev?.id === c.id ? null : c)}
                    onAction={handleAction}
                  />
                ))}
                <p style={{ textAlign: 'center', fontSize: 10, color: C.t3, margin: 0 }}>
                  Showing {visible.length} of {CLIENTS.length} clients
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ── SIDEBAR: detail panel or empty state ── */}
        {selected
          ? <ClientDetailSidebar client={selected} openModal={openModal} />
          : <EmptyDetailState />
        }

      </div>
    </>
  );
}
