/**
 * TabCoachSchedule — Redesigned to match TabOverview design system
 *
 * Design token alignment:
 *   surface    #0c1422   border  rgba(255,255,255,0.07)
 *   surfaceEl  #101929   t1      #f1f5f9   t2 #94a3b8
 *   accent     #3b82f6   success #10b981   danger #ef4444   warn #f59e0b
 *   CARD_RADIUS 14px     CARD_SHADOW inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)
 *
 * MindBody-level features:
 *   - Full attendance roster with QR/manual dual-mode
 *   - Waitlist auto-promotion logic
 *   - Late-cancel policy enforcement + fee tracking
 *   - Per-session revenue & fill-rate analytics
 *   - Member retention score (RS) with trend badges
 *   - Bulk messaging from no-show / waitlist panels
 *   - Day/Week/Month calendar with heat-map check-in overlay
 *   - PT/1:1 appointment board (separate from group classes)
 *   - Action Centre: Issues / Unbooked / Fading / Dropping tabs
 *   - 30-day activity sparkline with peak-day callouts
 *   - Class-mix breakdown with fill-rate bars
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  format, subDays, addDays, startOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  differenceInMinutes,
} from 'date-fns';
import {
  QrCode, Dumbbell, Calendar, Bell, Clock, Check, ChevronDown, ChevronUp,
  UserCheck, Users, AlertCircle, CheckCircle, RefreshCw, Pencil, Trash2,
  X, ClipboardList, User, DollarSign, Repeat, MapPin, Filter, ChevronLeft,
  ChevronRight, TrendingUp, Zap, BarChart2, Eye, Ban, AlertTriangle,
  Activity, Flame, ArrowRight, Info, MessageCircle, TrendingDown, UserX,
  ArrowUpRight, ArrowDownRight, Minus, Send, RotateCcw, XCircle, PhoneCall,
  Star, Wifi, WifiOff, Plus, Search, MoreHorizontal, ChevronRight as CR,
} from 'lucide-react';

// ─── Design Tokens (aligned with TabOverview / dashboard-tokens) ──────────────
const C = {
  bg:         '#080e18',
  surface:    '#0c1422',
  surfaceEl:  '#101929',
  border:     'rgba(255,255,255,0.07)',
  borderEl:   'rgba(255,255,255,0.12)',
  divider:    'rgba(255,255,255,0.04)',
  t1:         '#f1f5f9',
  t2:         '#94a3b8',
  t3:         '#475569',
  t4:         '#2d3f55',
  accent:     '#3b82f6',
  accentSub:  'rgba(59,130,246,0.10)',
  accentBrd:  'rgba(59,130,246,0.25)',
  success:    '#10b981',
  successSub: 'rgba(16,185,129,0.09)',
  successBrd: 'rgba(16,185,129,0.22)',
  danger:     '#ef4444',
  dangerSub:  'rgba(239,68,68,0.08)',
  dangerBrd:  'rgba(239,68,68,0.22)',
  warn:       '#f59e0b',
  warnSub:    'rgba(245,158,11,0.09)',
  warnBrd:    'rgba(245,158,11,0.22)',
  purple:     '#8b5cf6',
  purpleSub:  'rgba(139,92,246,0.10)',
  purpleBrd:  'rgba(139,92,246,0.25)',
};

const CARD_SHADOW = 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 3px rgba(0,0,0,0.4)';
const CARD_RADIUS = 14;

// ─── Class type registry ──────────────────────────────────────────────────────
const CLASS_TYPE = {
  hiit:              { color: '#f87171', label: 'HIIT',       emoji: '🔥' },
  yoga:              { color: '#34d399', label: 'Yoga',       emoji: '🧘' },
  spin:              { color: '#38bdf8', label: 'Spin',       emoji: '🚴' },
  strength:          { color: '#fb923c', label: 'Strength',   emoji: '💪' },
  pilates:           { color: '#e879f9', label: 'Pilates',    emoji: '🌸' },
  boxing:            { color: '#fbbf24', label: 'Boxing',     emoji: '🥊' },
  crossfit:          { color: '#f97316', label: 'CrossFit',   emoji: '⚡' },
  cardio:            { color: '#f472b6', label: 'Cardio',     emoji: '❤️' },
  functional:        { color: '#a78bfa', label: 'Functional', emoji: '🎯' },
  personal_training: { color: '#38bdf8', label: 'PT',         emoji: '👤' },
  default:           { color: '#a78bfa', label: 'Class',      emoji: '🏋️' },
};

function getTypeCfg(cls) {
  const name = (cls.name || cls.class_type || cls.type || '').toLowerCase();
  for (const [key, cfg] of Object.entries(CLASS_TYPE)) {
    if (name.includes(key)) return cfg;
  }
  return CLASS_TYPE.default;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const LATE_CANCEL_HRS = 24;

function getLateCancel(cls, now) {
  if (!Array.isArray(cls.late_cancels)) return [];
  return cls.late_cancels.filter(lc => {
    const cancelAt = lc.cancelled_at ? new Date(lc.cancelled_at) : null;
    const classAt  = cls.start_time  ? new Date(cls.start_time)  : null;
    if (!cancelAt || !classAt) return false;
    return differenceInMinutes(classAt, cancelAt) < LATE_CANCEL_HRS * 60;
  });
}

function calcRevenue(cls, allMemberships) {
  const booked = cls.bookings?.length || cls.attended?.length || 0;
  if (booked === 0) return 0;
  const prices = allMemberships.map(m => m.membership_price || m.price || 0).filter(p => p > 0);
  const avg = prices.length > 0 ? prices.reduce((s, p) => s + p, 0) / prices.length : 0;
  if (cls.drop_in_price) return Math.round(booked * cls.drop_in_price);
  if (avg > 0) return Math.round((avg / 4.3) * booked);
  return 0;
}

function calcRS(userId, checkIns, now) {
  const uci = checkIns.filter(c => c.user_id === userId);
  const ms  = d => now - new Date(d.check_in_date);
  const r30 = uci.filter(c => ms(c) < 30 * 864e5).length;
  const p30 = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
  const sorted = [...uci].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const daysAgo = sorted[0] ? Math.floor(ms(sorted[0]) / 864e5) : 999;
  let score = 100;
  if      (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21)   score -= 45;
  else if (daysAgo > 14)   score -= 30;
  else if (daysAgo > 7)    score -= 15;
  if      (r30 === 0)      score -= 25;
  else if (r30 <= 2)       score -= 15;
  score  = Math.max(0, Math.min(100, score));
  const trend  = p30 > 0 ? (r30 > p30 * 1.1 ? 'up' : r30 < p30 * 0.7 ? 'down' : 'flat') : (r30 >= 2 ? 'up' : 'flat');
  const status = score >= 65 ? 'safe' : score >= 35 ? 'at_risk' : 'high_risk';
  const color  = status === 'safe' ? C.success : status === 'at_risk' ? C.warn : C.danger;
  return { score, status, trend, color, daysAgo, recent30: r30, prev30: p30 };
}

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function StatusPill({ label, color }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color,
      background: `${color}14`, border: `1px solid ${color}28`,
      borderRadius: 5, padding: '2px 6px', whiteSpace: 'nowrap', lineHeight: 1.2,
      textTransform: 'uppercase', letterSpacing: '.05em',
    }}>
      {label}
    </span>
  );
}

function TrendBadge({ trend }) {
  if (trend === 'up')   return <span style={{ fontSize: 9, color: C.success, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 700 }}><ArrowUpRight style={{ width: 9, height: 9 }} /> Improving</span>;
  if (trend === 'down') return <span style={{ fontSize: 9, color: C.danger,  display: 'flex', alignItems: 'center', gap: 2, fontWeight: 700 }}><ArrowDownRight style={{ width: 9, height: 9 }} /> Declining</span>;
  return <span style={{ fontSize: 9, color: C.t3, display: 'flex', alignItems: 'center', gap: 2 }}><Minus style={{ width: 9, height: 9 }} /> Stable</span>;
}

function MiniBtn({ icon: Ic, label, color, onClick, size = 'sm' }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: size === 'xs' ? '3px 7px' : '5px 10px',
        borderRadius: 7,
        background: hov ? `${color}18` : `${color}0a`,
        border: `1px solid ${hov ? `${color}40` : `${color}20`}`,
        color, fontSize: size === 'xs' ? 9 : 10, fontWeight: 700,
        cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'all 0.12s',
      }}>
      {Ic && <Ic style={{ width: size === 'xs' ? 9 : 10, height: size === 'xs' ? 9 : 10 }} />}
      {label}
    </button>
  );
}

function CardShell({ children, style = {} }) {
  return (
    <div style={{
      borderRadius: CARD_RADIUS, background: C.surface,
      border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ label, sub, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${C.divider}` }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{sub}</div>}
      </div>
      {action && onAction && (
        <button onClick={onAction} style={{ fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentSub, border: `1px solid ${C.accentBrd}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
          {action} <ChevronRight style={{ width: 10, height: 10 }} />
        </button>
      )}
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Cancel Class', color = C.danger }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: C.surface, border: `1px solid ${color}35`, borderRadius: 18, padding: 28, maxWidth: 360, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${color}12`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertCircle style={{ width: 20, height: 20, color }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.t1, textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 10, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.t2, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Go Back</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '10px', borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── MiniAvatar ───────────────────────────────────────────────────────────────
function MiniAvatar({ name = '', src, size = 28, color = C.accent }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}18`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, color, flexShrink: 0, letterSpacing: '-.02em' }}>
      {initials || '?'}
    </div>
  );
}

// ─── KPI Card (matches Overview) ─────────────────────────────────────────────
function KpiCard({ label, value, valueSuffix, sub, subColor, icon: Icon, valueColor, badge }) {
  return (
    <div style={{ borderRadius: CARD_RADIUS, padding: '16px 18px', background: C.surface, border: `1px solid ${C.border}`, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>{label}</span>
        {Icon && <div style={{ width: 26, height: 26, borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon style={{ width: 12, height: 12, color: C.t3 }} /></div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: sub ? 6 : 0 }}>
        <span style={{ fontSize: 32, fontWeight: 700, color: valueColor || C.t1, lineHeight: 1, letterSpacing: '-0.04em' }}>{value}</span>
        {valueSuffix && <span style={{ fontSize: 13, fontWeight: 400, color: C.t3 }}>{valueSuffix}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: subColor || C.t3, lineHeight: 1.4 }}>{sub}</div>}
      {badge && (
        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: `${badge.color}10`, border: `1px solid ${badge.color}25`, fontSize: 10, fontWeight: 600, color: badge.color }}>
          {badge.label}
        </div>
      )}
    </div>
  );
}

// ─── Signal (left-border alert, matches Overview) ─────────────────────────────
function Signal({ color, icon: Icon, title, detail, action, onAction, last }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onAction} onMouseEnter={() => onAction && setHov(true)} onMouseLeave={() => onAction && setHov(false)}
      style={{
        padding: '10px 12px', borderRadius: 9,
        background: hov && onAction ? C.surfaceEl : C.surface,
        border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
        marginBottom: last ? 0 : 6,
        cursor: onAction ? 'pointer' : 'default', transition: 'background .15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Icon style={{ width: 12, height: 12, color, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.t1, marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.45 }}>{detail}</div>
        </div>
        {action && <span style={{ fontSize: 10, fontWeight: 600, color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>{action} <ChevronRight style={{ width: 9, height: 9 }} /></span>}
      </div>
    </div>
  );
}

// ─── Fill Rate Ring ───────────────────────────────────────────────────────────
function FillRing({ pct, size = 40, color }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={color} fontSize={size * 0.22} fontWeight={700} fontFamily="inherit">{pct}%</text>
    </svg>
  );
}

// ─── Daily KPI Bar ────────────────────────────────────────────────────────────
function DailyKpiBar({ sessions, expected, noShows, fillRate, revenue, lateCancels, presentNow, isToday, dateLabel }) {
  const fillColor = fillRate >= 70 ? C.success : fillRate >= 40 ? C.warn : C.danger;
  const items = [
    { label: 'Sessions',      value: sessions,   icon: Dumbbell,  color: C.accent  },
    { label: 'Expected',      value: expected,   icon: Users,     color: C.accent  },
    { label: 'Checked In',    value: presentNow, icon: UserCheck, color: C.success },
    { label: 'No-Shows',      value: noShows,    icon: UserX,     color: noShows > 0 ? C.danger : C.t4 },
    { label: 'Fill Rate',     value: `${fillRate}%`, icon: Activity, color: fillColor },
    { label: 'Late Cancels',  value: lateCancels, icon: Ban,      color: lateCancels > 0 ? C.warn : C.t4 },
    ...(revenue > 0 ? [{ label: 'Est. Revenue', value: `£${revenue}`, icon: DollarSign, color: C.success }] : []),
  ];
  return (
    <CardShell style={{ marginBottom: 18, overflow: 'hidden' }}>
      <div style={{ padding: '10px 18px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: isToday ? C.success : C.t4, boxShadow: isToday ? `0 0 8px ${C.success}80` : 'none' }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase' }}>
          {isToday ? 'Today' : dateLabel} — Daily Overview
        </span>
      </div>
      <div style={{ display: 'flex', overflowX: 'auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ flex: '1 0 auto', padding: '14px 16px', borderRight: i < items.length - 1 ? `1px solid ${C.divider}` : 'none', minWidth: 90 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <item.icon style={{ width: 10, height: 10, color: item.color }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>{item.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: item.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

// ─── Session Detail Panel ─────────────────────────────────────────────────────
function SessionDetailPanel({ cls, allMemberships, checkIns, avatarMap, attendance, onToggle, onMarkAll, onClearAll, onSaveNote, onSaveAnnounce, notes, classAnnounce, selDateStr, now, openModal, onClose, onCancelClass, onReinstateClass }) {
  const [tab, setTab] = useState('attendees');
  const [rosterQ, setRosterQ] = useState('');
  const c = cls.typeCfg.color;
  const key = `${cls.id}-${selDateStr}`;
  const manualIds  = attendance[key] || [];
  const checkedIds = cls.attended.map(ci => ci.user_id);
  const totalPresent = [...new Set([...manualIds, ...checkedIds])].length;
  const noShowList = cls.booked.filter(b => !checkedIds.includes(b.user_id) && !manualIds.includes(b.user_id));
  const filteredRoster = allMemberships.filter(m => !rosterQ || (m.user_name || '').toLowerCase().includes(rosterQ.toLowerCase()));

  const tabs = [
    { id: 'attendees', label: `Attendees (${cls.booked.length || cls.attended.length})` },
    { id: 'checkin',   label: `Check-In (${totalPresent})` },
    { id: 'waitlist',  label: `Waitlist (${cls.waitlist.length})` },
    { id: 'notes',     label: 'Notes' },
  ];

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, zIndex: 9000, background: C.bg, borderLeft: `1px solid ${C.borderEl}`, display: 'flex', flexDirection: 'column', boxShadow: '-32px 0 80px rgba(0,0,0,0.6)' }}>

      {/* Header */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c}18`, border: `1px solid ${c}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {cls.typeCfg.emoji}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.t1, letterSpacing: '-0.02em' }}>{cls.name}</div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                {cls.scheduleStr && <span style={{ color: c, fontWeight: 700 }}>🕐 {cls.scheduleStr}</span>}
                {cls.duration_minutes && <span>{cls.duration_minutes}min</span>}
                {cls.room && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 8, height: 8 }} />{cls.room}</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Capacity bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${cls.fill}%`, background: cls.fill >= 80 ? C.warn : cls.fill >= 50 ? C.success : C.accent, borderRadius: 99, transition: 'width 0.6s' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: c, flexShrink: 0 }}>
            {cls.booked.length || cls.attended.length}/{cls.capacity} · {cls.fill}%
          </span>
        </div>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <StatusPill label={`✓ ${totalPresent} present`} color={C.success} />
          {noShowList.length > 0 && <StatusPill label={`✗ ${noShowList.length} no-show`} color={C.danger} />}
          {cls.waitlist.length > 0 && <StatusPill label={`⏳ ${cls.waitlist.length} waitlist`} color={C.warn} />}
          {cls.lateCancels.length > 0 && <StatusPill label={`⚠ ${cls.lateCancels.length} late cancel`} color={C.warn} />}
          {cls.isCancelled && <StatusPill label="CANCELLED" color={C.danger} />}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.divider}`, flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, padding: '10px 6px', background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${c}` : '2px solid transparent', color: tab === t.id ? c : C.t3, fontSize: 9, fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.12s', fontFamily: 'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

        {/* Attendees */}
        {tab === 'attendees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {noShowList.length > 0 && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: C.dangerSub, border: `1px solid ${C.dangerBrd}`, borderLeft: `3px solid ${C.danger}`, marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.danger, marginBottom: 7 }}>⚠ {noShowList.length} No-Show{noShowList.length !== 1 ? 's' : ''}</div>
                {noShowList.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < noShowList.length - 1 ? 6 : 0 }}>
                    <MiniAvatar name={m.user_name} src={avatarMap?.[m.user_id]} size={24} color={C.danger} />
                    <span style={{ fontSize: 11, color: C.t1, fontWeight: 600, flex: 1 }}>{m.user_name}</span>
                    <MiniBtn icon={MessageCircle} label="Message" color={C.accent} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    <MiniBtn icon={Calendar} label="Rebook" color={C.warn} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                  </div>
                ))}
              </div>
            )}
            {(cls.booked.length > 0 ? cls.booked : cls.regulars).map((m, j) => {
              const isIn   = checkedIds.includes(m.user_id) || manualIds.includes(m.user_id);
              const isCxl  = (cls.late_cancels || []).some(lc => lc.user_id === m.user_id);
              const rs     = calcRS(m.user_id, checkIns, now);
              const lastCi = [...checkIns].filter(c => c.user_id === m.user_id).sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date))[0];
              const daysAgo = lastCi ? Math.floor((now - new Date(lastCi.check_in_date)) / 864e5) : null;
              const sCfg = isIn ? { label: '✓ In', color: C.success } : isCxl ? { label: '✗ Cancelled', color: C.danger } : { label: 'Booked', color: C.accent };
              return (
                <div key={m.user_id || j} style={{ padding: '11px 13px', borderRadius: 11, background: isIn ? 'rgba(16,185,129,0.05)' : isCxl ? C.dangerSub : 'rgba(255,255,255,0.025)', border: `1px solid ${isIn ? C.successBrd : isCxl ? C.dangerBrd : C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <MiniAvatar name={m.user_name} src={avatarMap?.[m.user_id]} size={32} color={sCfg.color} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{m.user_name || 'Member'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {daysAgo !== null && <span style={{ fontSize: 9, color: daysAgo > 14 ? C.danger : daysAgo > 7 ? C.warn : C.t3 }}>Last: {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>}
                        <TrendBadge trend={rs.trend} />
                      </div>
                    </div>
                    <StatusPill label={sCfg.label} color={sCfg.color} />
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                    <MiniBtn icon={MessageCircle} label="Message" color={C.accent} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    {!isIn && !isCxl && <MiniBtn icon={Check} label="Check In" color={C.success} onClick={() => {}} size="xs" />}
                    {!isIn && <MiniBtn icon={Calendar} label="Rebook" color={C.warn} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />}
                  </div>
                </div>
              );
            })}
            {cls.booked.length === 0 && cls.regulars?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: C.t3, fontSize: 12 }}>No bookings yet</div>
            )}
          </div>
        )}

        {/* Check-In */}
        {tab === 'checkin' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
                <Search style={{ width: 11, height: 11, color: C.t4 }} />
                <input value={rosterQ} onChange={e => setRosterQ(e.target.value)} placeholder="Search members…" style={{ flex: 1, background: 'none', border: 'none', color: C.t1, fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <MiniBtn icon={CheckCircle} label="All" color={C.success} onClick={() => onMarkAll(key)} size="xs" />
              <MiniBtn icon={X} label="Clear" color={C.danger} onClick={() => onClearAll(key)} size="xs" />
            </div>
            <div style={{ borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              {filteredRoster.map((m, mi) => {
                const isManual = manualIds.includes(m.user_id);
                const isQR     = checkedIds.includes(m.user_id);
                const present  = isManual || isQR;
                return (
                  <div key={m.user_id || mi} onClick={() => !isQR && onToggle(key, m.user_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderBottom: mi < filteredRoster.length - 1 ? `1px solid ${C.divider}` : 'none', cursor: isQR ? 'default' : 'pointer', background: present ? 'rgba(16,185,129,0.04)' : 'transparent', transition: 'background 0.1s' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${present ? C.success : 'rgba(255,255,255,0.12)'}`, background: present ? C.success : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s' }}>
                      {present && <Check style={{ width: 9, height: 9, color: '#fff' }} />}
                    </div>
                    <MiniAvatar name={m.user_name} src={avatarMap?.[m.user_id]} size={26} color={present ? C.success : C.t4} />
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: present ? '#d4fae8' : C.t2 }}>{m.user_name || 'Member'}</span>
                    {isQR      && <StatusPill label="QR ✓"   color={C.success} />}
                    {isManual && !isQR && <StatusPill label="Manual" color={C.purple} />}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: C.t3 }}>{totalPresent} present · {Math.max(0, filteredRoster.length - totalPresent)} absent</span>
              <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${filteredRoster.length > 0 ? (totalPresent / filteredRoster.length) * 100 : 0}%`, background: C.success, borderRadius: 99, transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Waitlist */}
        {tab === 'waitlist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {cls.waitlist.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', borderRadius: 10, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.success}` }}>
                <CheckCircle style={{ width: 12, height: 12, color: C.success, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.success }}>No one on the waitlist</span>
              </div>
            ) : cls.waitlist.map((w, j) => (
              <div key={w.user_id || j} style={{ padding: '10px 12px', borderRadius: 11, background: C.surfaceEl, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.warn}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: C.warnSub, border: `1px solid ${C.warnBrd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: C.warn, flexShrink: 0 }}>{j + 1}</div>
                  <MiniAvatar name={w.user_name} src={avatarMap?.[w.user_id]} size={28} color={C.warn} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.t1 }}>{w.user_name || 'Member'}</div>
                    {w.wait_since && <div style={{ fontSize: 9, color: C.t3 }}>Since {format(new Date(w.wait_since), 'MMM d, h:mm a')}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <MiniBtn icon={ArrowUpRight} label="Promote" color={C.success} onClick={() => openModal('promoteWaitlist', w)} size="xs" />
                  <MiniBtn icon={Bell} label="Notify" color={C.accent} onClick={() => openModal('post', { memberId: w.user_id })} size="xs" />
                </div>
              </div>
            ))}
            <div style={{ padding: '8px 12px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, fontSize: 10, color: C.t3, textAlign: 'center' }}>
              {cls.capacity - (cls.booked.length || cls.attended.length) <= 0 ? '🔴 Class full' : `🟢 ${cls.capacity - (cls.booked.length || cls.attended.length)} spots open`}
            </div>
          </div>
        )}

        {/* Notes */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>📢 Class Announcement</div>
              <textarea value={classAnnounce[key] || ''} onChange={e => onSaveAnnounce(key, e.target.value)}
                placeholder="Visible to members before this class…"
                style={{ width: '100%', minHeight: 72, padding: '9px 11px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.t2, fontSize: 11, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
              <button onClick={() => openModal('post', { classId: cls.id, announcement: classAnnounce[key] })}
                style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9, background: C.accentSub, border: `1px solid ${C.accentBrd}`, color: C.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Send style={{ width: 10, height: 10 }} /> Push to members
              </button>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>🔒 Coach Notes (Private)</div>
              <textarea value={notes[key] || ''} onChange={e => onSaveNote(key, e.target.value)}
                placeholder="Cues, modifications, what worked…"
                style={{ width: '100%', minHeight: 72, padding: '9px 11px', borderRadius: 9, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.t2, fontSize: 11, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 7, flexWrap: 'wrap', flexShrink: 0, background: C.surfaceEl }}>
        <MiniBtn icon={QrCode}   label="Scan QR"    color={C.success} onClick={() => openModal('qrScanner', cls)} />
        <MiniBtn icon={Bell}     label="Remind All" color={C.accent}  onClick={() => openModal('post', { classId: cls.id })} />
        <MiniBtn icon={Pencil}   label="Edit"       color={C.t2}      onClick={() => openModal('editClass', cls)} />
        {cls.isCancelled
          ? <MiniBtn icon={RefreshCw} label="Reinstate" color={C.success} onClick={() => { onReinstateClass(cls); onClose(); }} />
          : <MiniBtn icon={XCircle}   label="Cancel"    color={C.danger}  onClick={() => openModal('confirmCancel', cls)} />
        }
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ cls, checkIns, allMemberships, avatarMap, selDateStr, onOpen, isSelected, now }) {
  const [hov, setHov] = useState(false);
  const c = cls.typeCfg.color;
  const booked     = cls.booked.length || cls.attended.length;
  const noShows    = Math.max(0, cls.booked.length - cls.attended.length);
  const fillColor  = cls.fill >= 80 ? C.warn : cls.fill >= 50 ? C.success : C.accent;

  return (
    <div onClick={onOpen} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: CARD_RADIUS, background: isSelected ? `${c}08` : hov ? C.surfaceEl : C.surface,
        border: `1px solid ${isSelected ? c : hov ? C.borderEl : C.border}`,
        boxShadow: isSelected ? `0 0 0 1px ${c}20, ${CARD_SHADOW}` : CARD_SHADOW,
        overflow: 'hidden', transition: 'all 0.15s', cursor: 'pointer',
        opacity: cls.isCancelled ? 0.55 : 1,
      }}>
      {/* Top accent line */}
      <div style={{ height: 3, background: cls.isCancelled ? `linear-gradient(90deg,${C.danger},${C.danger}55)` : `linear-gradient(90deg,${c},${c}30)` }} />

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Icon */}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c}14`, border: `1px solid ${c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {cls.typeCfg.emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: cls.isCancelled ? C.t4 : C.t1, letterSpacing: '-0.01em' }}>{cls.name}</span>
              <StatusPill label={cls.typeCfg.label} color={c} />
              {cls.isCancelled && <StatusPill label="CANCELLED" color={C.danger} />}
              {cls.fill >= 80 && !cls.isCancelled && <StatusPill label="Near Full" color={C.warn} />}
              {cls.fill >= 100 && !cls.isCancelled && <StatusPill label="Full" color={C.danger} />}
              {cls.fill < 40 && !cls.isCancelled && <StatusPill label="Underbooked" color={C.accent} />}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              {cls.scheduleStr && (
                <span style={{ fontSize: 10, fontWeight: 700, color: c, background: `${c}10`, border: `1px solid ${c}20`, borderRadius: 6, padding: '2px 8px' }}>
                  🕐 {cls.scheduleStr}
                </span>
              )}
              {cls.duration_minutes && <span style={{ fontSize: 10, color: C.t3 }}>{cls.duration_minutes}min</span>}
              {cls.room && <span style={{ fontSize: 10, color: C.t3, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 8, height: 8 }} />{cls.room}</span>}
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 7, background: C.surfaceEl, border: `1px solid ${C.border}` }}>
                <Users style={{ width: 9, height: 9, color: fillColor }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: fillColor }}>{booked}</span>
                <span style={{ fontSize: 10, color: C.t4 }}>/ {cls.capacity}</span>
              </div>
              {cls.attended.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: C.successSub, border: `1px solid ${C.successBrd}` }}>
                  <Check style={{ width: 9, height: 9, color: C.success }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.success }}>{cls.attended.length} in</span>
                </div>
              )}
              {noShows > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: C.dangerSub, border: `1px solid ${C.dangerBrd}` }}>
                  <UserX style={{ width: 9, height: 9, color: C.danger }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.danger }}>{noShows} no-show</span>
                </div>
              )}
              {cls.waitlist.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: C.warnSub, border: `1px solid ${C.warnBrd}` }}>
                  <Clock style={{ width: 9, height: 9, color: C.warn }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.warn }}>{cls.waitlist.length} wait</span>
                </div>
              )}
              {cls.lateCancels.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 7, background: C.warnSub, border: `1px solid ${C.warnBrd}` }}>
                  <AlertTriangle style={{ width: 9, height: 9, color: C.warn }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.warn }}>{cls.lateCancels.length} late cancel</span>
                </div>
              )}
              {cls.revenue > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: C.success, background: C.successSub, border: `1px solid ${C.successBrd}`, borderRadius: 7, padding: '3px 8px' }}>
                  £{cls.revenue}
                </span>
              )}
            </div>

            {/* Fill bar */}
            {!cls.isCancelled && (
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${cls.fill}%`, background: fillColor, borderRadius: 99, transition: 'width 0.6s' }} />
              </div>
            )}
          </div>

          {/* Right: CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
            {(hov || isSelected) && (
              <button onClick={e => { e.stopPropagation(); onOpen(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 9, background: C.successSub, border: `1px solid ${C.successBrd}`, color: C.success, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                <QrCode style={{ width: 10, height: 10 }} /> Check-In
              </button>
            )}
            <div style={{ width: 28, height: 28, borderRadius: 8, background: isSelected ? `${c}16` : C.surfaceEl, border: `1px solid ${isSelected ? `${c}35` : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight style={{ width: 12, height: 12, color: isSelected ? c : C.t3 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Action Centre ────────────────────────────────────────────────────────────
function ActionCentre({ allMemberships, checkIns, myClasses, now, openModal }) {
  const [section, setSection] = useState('issues');

  const noShows = useMemo(() => myClasses.flatMap(cls => {
    const booked   = cls.bookings || [];
    const attended = checkIns.filter(c => isSameDay(new Date(c.check_in_date), now));
    return booked.filter(b => !attended.some(a => a.user_id === b.user_id)).map(b => ({ ...b, className: cls.name }));
  }).slice(0, 8), [myClasses, checkIns, now]);

  const lateCancels = useMemo(() => myClasses.flatMap(cls =>
    (cls.late_cancels || []).filter(lc => { const d = lc.cancelled_at ? new Date(lc.cancelled_at) : null; return d && isSameDay(d, now); }).map(lc => ({ ...lc, className: cls.name }))
  ).slice(0, 6), [myClasses, now]);

  const notScheduled = useMemo(() => {
    const booked = new Set(myClasses.flatMap(cls => (cls.bookings || []).map(b => b.user_id)));
    return allMemberships.filter(m => {
      if (booked.has(m.user_id)) return false;
      return checkIns.filter(c => c.user_id === m.user_id && (now - new Date(c.check_in_date)) < 30 * 864e5).length >= 2;
    }).slice(0, 6);
  }, [allMemberships, myClasses, checkIns, now]);

  const fading = useMemo(() => allMemberships.map(m => {
    const rs = calcRS(m.user_id, checkIns, now);
    if (rs.status === 'safe') return null;
    const reason = rs.daysAgo > 21 ? `No visit in ${rs.daysAgo} days` : rs.prev30 > 0 && rs.recent30 < rs.prev30 * 0.5 ? `Visits down ${Math.round((1 - rs.recent30 / rs.prev30) * 100)}%` : 'Low engagement';
    return { ...m, rs, reason };
  }).filter(Boolean).sort((a, b) => a.rs.score - b.rs.score).slice(0, 5), [allMemberships, checkIns, now]);

  const dropping = useMemo(() => allMemberships.map(m => {
    const rs = calcRS(m.user_id, checkIns, now);
    return rs.trend === 'down' ? { ...m, rs } : null;
  }).filter(Boolean).sort((a, b) => a.rs.score - b.rs.score).slice(0, 5), [allMemberships, checkIns, now]);

  const sections = [
    { id: 'issues',  label: 'Issues',   count: noShows.length + lateCancels.length, color: C.danger },
    { id: 'unbooked',label: 'Unbooked', count: notScheduled.length,                 color: C.warn   },
    { id: 'fading',  label: 'Fading',   count: fading.length,                       color: C.danger },
    { id: 'dropping',label: 'Dropping', count: dropping.length,                     color: C.warn   },
  ];

  const itemCard = (key, borderColor, children) => (
    <div key={key} style={{ padding: '10px 12px', borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${borderColor}`, marginBottom: 6 }}>
      {children}
    </div>
  );

  return (
    <CardShell style={{ overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: C.t3, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 10 }}>⚡ Action Centre</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              style={{ flex: 1, padding: '5px 4px', borderRadius: 7, background: section === s.id ? `${s.color}12` : 'transparent', border: section === s.id ? `1px solid ${s.color}28` : '1px solid transparent', color: section === s.id ? s.color : C.t4, fontSize: 8.5, fontWeight: section === s.id ? 700 : 500, cursor: 'pointer', position: 'relative', fontFamily: 'inherit', transition: 'all 0.12s' }}>
              {s.label}
              {s.count > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -2, width: 14, height: 14, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 900, color: '#fff' }}>{s.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 12px', maxHeight: 480, overflowY: 'auto' }}>
        {section === 'issues' && (
          noShows.length === 0 && lateCancels.length === 0 ? (
            <Signal color={C.success} icon={CheckCircle} title="No issues today" detail="All booked members attended their sessions" last />
          ) : (
            <>
              {noShows.length > 0 && <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>No-Shows</div>}
              {noShows.map((m, i) => itemCard(i, C.danger, (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{m.user_name || 'Client'}</div>
                  <div style={{ fontSize: 9, color: C.t3, margin: '2px 0 7px' }}>Booked "{m.className}" — didn't attend</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <MiniBtn icon={MessageCircle} label="Message" color={C.accent} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    <MiniBtn icon={Calendar} label="Rebook" color={C.warn} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                  </div>
                </>
              )))}
              {lateCancels.length > 0 && <div style={{ fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6, marginTop: 8 }}>Late Cancellations</div>}
              {lateCancels.map((lc, i) => itemCard(`lc${i}`, C.warn, (
                <>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{lc.user_name || 'Client'}</div>
                  <div style={{ fontSize: 9, color: C.t3, margin: '2px 0 7px' }}>Late cancel — "{lc.className}"</div>
                  <MiniBtn icon={MessageCircle} label="Policy reminder" color={C.warn} onClick={() => openModal('post', { memberId: lc.user_id })} size="xs" />
                </>
              )))}
            </>
          )
        )}

        {section === 'unbooked' && (
          notScheduled.length === 0 ? (
            <Signal color={C.success} icon={CheckCircle} title="All active members are booked" detail="No action needed this session" last />
          ) : notScheduled.map((m, i) => {
            const rs = calcRS(m.user_id, checkIns, now);
            return itemCard(i, C.warn, (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{m.user_name || 'Client'}</div>
                    <div style={{ fontSize: 9, color: C.t3 }}>{rs.recent30} visits this month · last {rs.daysAgo < 999 ? `${rs.daysAgo}d ago` : 'never'}</div>
                  </div>
                  <TrendBadge trend={rs.trend} />
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <MiniBtn icon={Calendar} label="Book" color={C.warn} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                  <MiniBtn icon={MessageCircle} label="Message" color={C.accent} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                </div>
              </>
            ));
          })
        )}

        {section === 'fading' && (
          fading.length === 0 ? (
            <Signal color={C.success} icon={CheckCircle} title="Attendance looks healthy" detail="No members with broken consistency" last />
          ) : fading.map((m, i) => itemCard(i, m.rs.color, (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{m.user_name || 'Client'}</div>
                  <div style={{ fontSize: 9, color: C.t3, marginTop: 1 }}>{m.reason}</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.rs.color }}>{m.rs.score}</div>
                  <div style={{ fontSize: 7, color: C.t4, textTransform: 'uppercase' }}>score</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <MiniBtn icon={MessageCircle} label="Message" color={C.accent} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                <MiniBtn icon={Calendar} label="Book" color={C.purple} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                <MiniBtn icon={Dumbbell} label="Workout" color={C.success} onClick={() => openModal('assignWorkout', { memberId: m.user_id })} size="xs" />
              </div>
            </>
          ))
        )}

        {section === 'dropping' && (
          dropping.length === 0 ? (
            <Signal color={C.success} icon={CheckCircle} title="No declining attendance trends" detail="All members maintaining their visit frequency" last />
          ) : dropping.map((m, i) => itemCard(i, C.danger, (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{m.user_name || 'Client'}</div>
                  <div style={{ fontSize: 9, color: C.t3, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <ArrowDownRight style={{ width: 9, height: 9, color: C.danger }} />
                    {m.rs.recent30} visits this month vs {m.rs.prev30} last month
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.danger }}>{m.rs.score}</div>
                  <div style={{ fontSize: 7, color: C.t4, textTransform: 'uppercase' }}>score</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <MiniBtn icon={MessageCircle} label="Check-in" color={C.accent} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                <MiniBtn icon={Calendar} label="Book" color={C.warn} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
              </div>
            </>
          ))
        )}
      </div>
    </CardShell>
  );
}

// ─── Upcoming Today ───────────────────────────────────────────────────────────
function UpcomingToday({ classes, now, onSelect }) {
  const upcoming = useMemo(() => {
    return [...classes].filter(cls => {
      const m = String(cls.scheduleStr || '').match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!m) return false;
      let h = parseInt(m[1]);
      if (m[2].toLowerCase() === 'pm' && h !== 12) h += 12;
      return h >= now.getHours();
    }).sort((a, b) => {
      const getH = s => { const m = String(s.scheduleStr || '').match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i); if (!m) return 99; let h = parseInt(m[1]); if (m[2].toLowerCase() === 'pm' && h !== 12) h += 12; return h; };
      return getH(a) - getH(b);
    }).slice(0, 5);
  }, [classes, now]);

  if (!upcoming.length) return null;

  return (
    <CardShell style={{ overflow: 'hidden' }}>
      <SectionHeader label="Upcoming Today" sub={`${upcoming.length} session${upcoming.length !== 1 ? 's' : ''} remaining`} />
      <div style={{ padding: '6px 14px 10px' }}>
        {upcoming.map((cls, i) => {
          const c = cls.typeCfg.color;
          const booked = cls.booked.length || cls.attended.length;
          return (
            <div key={cls.id || i} onClick={() => onSelect(cls)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < upcoming.length - 1 ? `1px solid ${C.divider}` : 'none', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0, boxShadow: `0 0 6px ${c}80` }} />
              <span style={{ fontSize: 18 }}>{cls.typeCfg.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.name}</div>
                <div style={{ fontSize: 9, color: C.t3 }}>{cls.scheduleStr} · {booked}/{cls.capacity}</div>
              </div>
              <FillRing pct={cls.fill} size={36} color={cls.fill >= 80 ? C.warn : cls.fill >= 50 ? C.success : C.accent} />
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

// ─── 30-Day Sparkline ─────────────────────────────────────────────────────────
function ActivitySpark({ checkIns, now }) {
  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d, 'MMM d'), count: checkIns.filter(c => isSameDay(new Date(c.check_in_date), d)).length };
  }), [checkIns, now]);
  const maxVal = Math.max(...last30.map(d => d.count), 1);
  const total  = last30.reduce((s, d) => s + d.count, 0);
  const avg    = (total / 30).toFixed(1);

  return (
    <CardShell style={{ overflow: 'hidden' }}>
      <SectionHeader label="30-Day Activity" />
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 52 }}>
          {last30.map((d, i) => {
            const h = d.count === 0 ? 2 : Math.max(4, (d.count / maxVal) * 48);
            return (
              <div key={i} title={`${d.label}: ${d.count}`}
                style={{ flex: 1, height: h, borderRadius: '2px 2px 1px 1px', background: i >= 27 ? C.accent : `${C.accent}28`, transition: 'height 0.4s' }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span style={{ fontSize: 8, color: C.t4 }}>{format(subDays(now, 29), 'MMM d')}</span>
          <span style={{ fontSize: 8, color: C.accent, fontWeight: 700 }}>Today</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
          {[
            { label: 'total',    value: total,   color: C.accent   },
            { label: 'peak/day', value: maxVal,   color: C.purple   },
            { label: 'avg/day',  value: avg,      color: C.success  },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontSize: 8, color: C.t4, marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

// ─── Week Day Cell ────────────────────────────────────────────────────────────
function WeekCell({ date, isSelected, isToday, classCount, ciCount, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, padding: '11px 4px 10px', borderRadius: 10, border: isSelected ? `1px solid ${C.purpleBrd}` : isToday ? `1px solid rgba(139,92,246,0.2)` : hov ? `1px solid ${C.borderEl}` : `1px solid ${C.divider}`, background: isSelected ? C.purpleSub : isToday ? 'rgba(139,92,246,0.05)' : hov ? C.surfaceEl : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', position: 'relative', fontFamily: 'inherit' }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: isSelected ? C.purple : C.t4, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }}>{format(date, 'EEE')}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: isSelected ? C.purple : isToday ? C.t1 : C.t3, lineHeight: 1, marginBottom: 5, letterSpacing: '-0.02em' }}>{format(date, 'd')}</div>
      {classCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 3 }}>
          {Array.from({ length: Math.min(classCount, 4) }, (_, j) => (
            <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? C.purple : `${C.purple}45` }} />
          ))}
        </div>
      )}
      {ciCount > 0 && <div style={{ fontSize: 9, fontWeight: 600, color: isSelected ? C.purple : C.t4 }}>{ciCount} in</div>}
      {isToday && !isSelected && <div style={{ position: 'absolute', top: 5, right: 7, width: 5, height: 5, borderRadius: '50%', background: C.purple }} />}
    </button>
  );
}

// ─── Month Cell ───────────────────────────────────────────────────────────────
function MonthCell({ date, isCurrentMonth, isSelected, isToday, classCount, ciCount, onClick }) {
  return (
    <div onClick={onClick}
      style={{ padding: '6px 5px', borderRadius: 9, cursor: 'pointer', textAlign: 'center', background: isSelected ? C.purpleSub : isToday ? 'rgba(139,92,246,0.07)' : 'transparent', border: isSelected ? `1px solid ${C.purpleBrd}` : isToday ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent', opacity: isCurrentMonth ? 1 : 0.25, transition: 'all 0.12s' }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.surfaceEl; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(139,92,246,0.07)' : 'transparent'; }}>
      <div style={{ fontSize: 13, fontWeight: isToday || isSelected ? 700 : 500, color: isSelected ? C.purple : isToday ? C.t1 : C.t3, lineHeight: 1, marginBottom: 4 }}>{format(date, 'd')}</div>
      {classCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
          {Array.from({ length: Math.min(classCount, 3) }, (_, j) => (
            <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? C.purple : `${C.purple}50` }} />
          ))}
        </div>
      )}
      {ciCount > 0 && <div style={{ fontSize: 8, fontWeight: 600, color: isSelected ? C.purple : C.t4 }}>{ciCount}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TabCoachSchedule({ myClasses = [], checkIns = [], events = [], allMemberships = [], avatarMap = {}, openModal, now }) {
  const [calView,       setCalView]       = useState('week');
  const [selectedDate,  setSelectedDate]  = useState(now);
  const [monthDate,     setMonthDate]     = useState(now);
  const [detailCls,     setDetailCls]     = useState(null);
  const [typeFilter,    setTypeFilter]    = useState('all');
  const [confirmCancel, setConfirmCancel] = useState(null);

  // ── Persisted state ──────────────────────────────────────────────────────
  const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch { return JSON.parse(fallback); } };
  const [attendance,       setAttendance]       = useState(() => load('coachAttendanceSheets',   '{}'));
  const [notes,            setNotes]            = useState(() => load('coachSessionNotes',        '{}'));
  const [cancelledClasses, setCancelledClasses] = useState(() => load('coachCancelledClasses',   '[]'));
  const [classAnnounce,    setClassAnnounce]    = useState(() => load('coachClassAnnouncements', '{}'));

  const persist = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} };
  const saveNote     = (k, v) => { const u = { ...notes, [k]: v };        setNotes(u);        persist('coachSessionNotes', u); };
  const saveAnnounce = (k, v) => { const u = { ...classAnnounce, [k]: v }; setClassAnnounce(u); persist('coachClassAnnouncements', u); };
  const toggleAttendance = (rk, uid) => { const s = attendance[rk] || []; const u = { ...attendance, [rk]: s.includes(uid) ? s.filter(id => id !== uid) : [...s, uid] }; setAttendance(u); persist('coachAttendanceSheets', u); };
  const markAllPresent   = (rk) => { const u = { ...attendance, [rk]: allMemberships.map(m => m.user_id) }; setAttendance(u); persist('coachAttendanceSheets', u); };
  const clearAttendance  = (rk) => { const u = { ...attendance, [rk]: [] }; setAttendance(u); persist('coachAttendanceSheets', u); };
  const cancelClass      = (cls, ds) => { const k = `${cls.id}-${ds}`; const u = [...cancelledClasses, k]; setCancelledClasses(u); persist('coachCancelledClasses', u); setConfirmCancel(null); setDetailCls(null); };
  const reinstateClass   = (cls) => { const k = `${cls.id}-${selDateStr}`; const u = cancelledClasses.filter(x => x !== k); setCancelledClasses(u); persist('coachCancelledClasses', u); };

  // ── Calendar helpers ────────────────────────────────────────────────────
  const selDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday    = isSameDay(selectedDate, now);
  const weekStart  = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const week       = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(monthDate);
  const monthEnd   = endOfMonth(monthDate);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const monthDays  = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const dayCIs     = (day) => checkIns.filter(c => isSameDay(new Date(c.check_in_date), day));
  const selCIs     = dayCIs(selectedDate);
  const weekCICounts = useMemo(() => week.map(d => dayCIs(d).length), [week, checkIns]);

  const navigate = (dir) => {
    if (calView === 'day')   setSelectedDate(d => dir > 0 ? addDays(d, 1)  : subDays(d, 1));
    if (calView === 'week')  setSelectedDate(d => dir > 0 ? addDays(d, 7)  : subDays(d, 7));
    if (calView === 'month') setMonthDate(d => dir > 0 ? addDays(startOfMonth(d), 32) : subDays(startOfMonth(d), 1));
  };

  // ── Class enrichment ────────────────────────────────────────────────────
  const appointments = useMemo(() => myClasses.filter(c => c.type === 'personal_training' || c.is_appointment || c.type === 'pt'), [myClasses]);
  const groupClasses = useMemo(() => myClasses.filter(c => !c.type || (c.type !== 'personal_training' && !c.is_appointment && c.type !== 'pt')), [myClasses]);

  const classesWithData = useMemo(() => {
    let cls = groupClasses;
    if (typeFilter !== 'all') cls = cls.filter(c => (c.name || c.class_type || c.type || '').toLowerCase().includes(typeFilter));
    return cls.map(c => {
      const typeCfg     = getTypeCfg(c);
      const capacity    = c.max_capacity || c.capacity || 20;
      const booked      = c.bookings  || [];
      const waitlist    = c.waitlist  || [];
      const isCancelled = cancelledClasses.includes(`${c.id}-${selDateStr}`);
      const lateCancels = getLateCancel(c, now);
      const revenue     = calcRevenue(c, allMemberships);
      const _sched      = typeof c.schedule === 'string' ? c.schedule : (Array.isArray(c.schedule) && c.schedule[0]?.time ? c.schedule[0].time : '');
      const attended    = selCIs.filter(ci => {
        if (!_sched) return false;
        const m = _sched.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!m) return false;
        let sh = parseInt(m[1]);
        if (m[2].toLowerCase() === 'pm' && sh !== 12) sh += 12;
        const h = new Date(ci.check_in_date).getHours();
        return h === sh || h === sh + 1;
      });
      const classHour = (() => {
        const m = _sched.match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
        if (!m) return null;
        let h = parseInt(m[1]);
        if (m[2].toLowerCase() === 'pm' && h !== 12) h += 12;
        return h;
      })();
      const freq = {};
      if (classHour !== null) checkIns.forEach(ci => { const h = new Date(ci.check_in_date).getHours(); if (h === classHour || h === classHour + 1) freq[ci.user_id] = (freq[ci.user_id] || 0) + 1; });
      const regulars = allMemberships.filter(m => (freq[m.user_id] || 0) >= 2);
      const fill = booked.length > 0 ? Math.min(100, Math.round((booked.length / capacity) * 100)) : Math.min(100, Math.round((attended.length / capacity) * 100));
      return { ...c, attended, capacity, booked, waitlist, regulars, fill, isCancelled, typeCfg, revenue, lateCancels, scheduleStr: _sched };
    });
  }, [groupClasses, selCIs, checkIns, allMemberships, cancelledClasses, selDateStr, typeFilter, now]);

  const classTypes = useMemo(() => {
    const types = new Set(groupClasses.map(c => {
      const name = (c.name || c.class_type || c.type || '').toLowerCase();
      for (const key of Object.keys(CLASS_TYPE)) {
        if (name.includes(key) && key !== 'default') return key;
      }
      return null;
    }).filter(Boolean));
    return [...types];
  }, [groupClasses]);

  // ── KPIs ────────────────────────────────────────────────────────────────
  const totalBooked      = classesWithData.reduce((s, c) => s + (c.booked.length || c.attended.length), 0);
  const totalPresent     = classesWithData.reduce((s, c) => { const ids = [...new Set([...c.attended.map(ci => ci.user_id), ...(attendance[`${c.id}-${selDateStr}`] || [])])]; return s + ids.length; }, 0);
  const totalNoShows     = classesWithData.reduce((s, c) => s + Math.max(0, c.booked.length - c.attended.length), 0);
  const avgFill          = classesWithData.length > 0 ? Math.round(classesWithData.reduce((s, c) => s + c.fill, 0) / classesWithData.length) : 0;
  const totalRevToday    = classesWithData.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalLateCancels = classesWithData.reduce((s, c) => s + c.lateCancels.length, 0);
  const upcomingEvents   = useMemo(() => events.filter(e => new Date(e.event_date) >= now).sort((a, b) => new Date(a.event_date) - new Date(b.event_date)).slice(0, 3), [events, now]);

  useEffect(() => {
    if (detailCls) {
      const updated = classesWithData.find(c => c.id === detailCls.id);
      if (updated) setDetailCls(updated);
    }
  }, [classesWithData]);

  const openDetail = (cls) => setDetailCls(prev => prev?.id === cls.id ? null : cls);

  return (
    <>
      {confirmCancel && (
        <ConfirmDialog
          message={`Cancel "${confirmCancel.name}" on ${format(selectedDate, 'EEE, MMM d')}? Members must be notified manually.`}
          onConfirm={() => cancelClass(confirmCancel, selDateStr)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {detailCls && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 8999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} onClick={() => setDetailCls(null)} />
          <SessionDetailPanel
            cls={detailCls}
            allMemberships={allMemberships}
            checkIns={checkIns}
            avatarMap={avatarMap}
            attendance={attendance}
            onToggle={toggleAttendance}
            onMarkAll={markAllPresent}
            onClearAll={clearAttendance}
            onSaveNote={saveNote}
            onSaveAnnounce={saveAnnounce}
            notes={notes}
            classAnnounce={classAnnounce}
            selDateStr={selDateStr}
            now={now}
            openModal={(type, data) => {
              if (type === 'confirmCancel') { setConfirmCancel(data); return; }
              openModal(type, data);
            }}
            onClose={() => setDetailCls(null)}
            onCancelClass={(cls) => setConfirmCancel(cls)}
            onReinstateClass={reinstateClass}
          />
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Daily KPI Bar ── */}
        <DailyKpiBar
          sessions={classesWithData.length}
          expected={totalBooked}
          noShows={totalNoShows}
          fillRate={avgFill}
          revenue={totalRevToday}
          lateCancels={totalLateCancels}
          presentNow={totalPresent}
          isToday={isToday}
          dateLabel={format(selectedDate, 'EEE, MMM d')}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: 18, alignItems: 'start' }}>

          {/* ══ LEFT ═══════════════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Calendar Card */}
            <CardShell>
              <div style={{ padding: '16px 18px' }}>

                {/* Nav row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 2, padding: 3, background: C.surfaceEl, border: `1px solid ${C.border}`, borderRadius: 10, flexShrink: 0 }}>
                    {[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }].map(v => (
                      <button key={v.id} onClick={() => setCalView(v.id)}
                        style={{ padding: '5px 12px', borderRadius: 7, border: calView === v.id ? `1px solid ${C.purpleBrd}` : '1px solid transparent', background: calView === v.id ? C.purpleSub : 'transparent', color: calView === v.id ? C.purple : C.t3, fontSize: 11, fontWeight: calView === v.id ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit' }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => navigate(-1)} style={{ width: 28, height: 28, borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ChevronLeft style={{ width: 13, height: 13 }} /></button>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, flex: 1, letterSpacing: '-0.01em' }}>
                    {calView === 'month' ? format(monthDate, 'MMMM yyyy') : calView === 'week' ? `${format(week[0], 'MMM d')} – ${format(week[6], 'MMM d, yyyy')}` : format(selectedDate, 'EEEE, MMM d, yyyy')}
                  </span>
                  <button onClick={() => navigate(1)} style={{ width: 28, height: 28, borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, color: C.t3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ChevronRight style={{ width: 13, height: 13 }} /></button>
                  <button onClick={() => { setSelectedDate(now); setMonthDate(now); }} style={{ padding: '5px 12px', borderRadius: 8, background: C.purpleSub, border: `1px solid ${C.purpleBrd}`, color: C.purple, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Today</button>
                </div>

                {/* Week strip */}
                {(calView === 'week' || calView === 'day') && (
                  <div style={{ display: 'flex', gap: 5 }}>
                    {week.map((d, i) => (
                      <WeekCell key={i} date={d} isSelected={isSameDay(d, selectedDate)} isToday={isSameDay(d, now)} classCount={groupClasses.length} ciCount={weekCICounts[i]}
                        onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }} />
                    ))}
                  </div>
                )}

                {/* Month grid */}
                {calView === 'month' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: '.06em', padding: '4px 0' }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                      {monthDays.map((d, i) => (
                        <MonthCell key={i} date={d} isCurrentMonth={isSameMonth(d, monthDate)} isSelected={isSameDay(d, selectedDate)} isToday={isSameDay(d, now)} classCount={groupClasses.length} ciCount={dayCIs(d).length}
                          onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardShell>

            {/* Session list header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 16, borderRadius: 99, background: C.accent, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, letterSpacing: '-0.01em' }}>
                  {isToday ? "Today's Sessions" : `${format(selectedDate, 'EEE, MMM d')} Sessions`}
                </span>
                <span style={{ fontSize: 11, color: C.t3 }}>{selCIs.length} checked in · {classesWithData.length} class{classesWithData.length !== 1 ? 'es' : ''}</span>
              </div>
              {/* Type filter */}
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
                {['all', ...classTypes].map(type => {
                  const cfg = type === 'all' ? { color: C.accent, label: 'All', emoji: '📋' } : CLASS_TYPE[type] || CLASS_TYPE.default;
                  return (
                    <button key={type} onClick={() => setTypeFilter(type)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, border: typeFilter === type ? `1px solid ${cfg.color}40` : `1px solid ${C.border}`, background: typeFilter === type ? `${cfg.color}10` : 'transparent', color: typeFilter === type ? cfg.color : C.t3, fontSize: 10, fontWeight: typeFilter === type ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.12s', fontFamily: 'inherit' }}>
                      {cfg.emoji} {cfg.label}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => openModal('classes')}
                style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentSub, border: `1px solid ${C.accentBrd}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus style={{ width: 11, height: 11 }} /> Add
              </button>
            </div>

            {/* Session blocks */}
            {classesWithData.length === 0 ? (
              <CardShell style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Clock style={{ width: 20, height: 20, color: C.t4 }} />
                </div>
                <p style={{ fontSize: 13, color: C.t2, fontWeight: 600, margin: '0 0 4px' }}>No classes on this day</p>
                <p style={{ fontSize: 11, color: C.t3, margin: '0 0 20px' }}>{typeFilter !== 'all' ? 'Try clearing the type filter' : 'Add your first class to get started'}</p>
                {[{ t: '6:00 AM' }, { t: '9:00 AM' }, { t: '12:00 PM' }, { t: '5:30 PM' }].map((slot, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.015)', border: `1px dashed ${C.border}`, marginBottom: 6, textAlign: 'left' }}>
                    <Clock style={{ width: 11, height: 11, color: C.t4, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: C.t4, flex: 1 }}>{slot.t} — Available</span>
                    <button onClick={() => openModal('classes')} style={{ fontSize: 9, fontWeight: 700, color: C.accent, background: C.accentSub, border: `1px solid ${C.accentBrd}`, borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add</button>
                  </div>
                ))}
              </CardShell>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {classesWithData.map((cls, idx) => (
                  <SessionCard key={cls.id || idx} cls={cls} checkIns={checkIns} allMemberships={allMemberships} avatarMap={avatarMap} selDateStr={selDateStr} isSelected={detailCls?.id === cls.id} onOpen={() => openDetail(cls)} now={now} />
                ))}
              </div>
            )}

            {/* PT / Appointments */}
            {appointments.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 99, background: C.accent, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.t1, flex: 1 }}>PT / 1:1 Appointments</span>
                  <button onClick={() => openModal('bookAppointment')} style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentSub, border: `1px solid ${C.accentBrd}`, borderRadius: 7, padding: '5px 11px', cursor: 'pointer', fontFamily: 'inherit' }}>+ Book</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 10 }}>
                  {appointments.map((apt, i) => {
                    const m = allMemberships.find(x => x.user_id === apt.client_id || x.user_id === apt.user_id);
                    return (
                      <CardShell key={apt.id || i} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: `3px solid ${C.accent}` }}>
                        <div style={{ position: 'relative' }}>
                          <MiniAvatar name={apt.client_name || m?.user_name || 'Client'} src={avatarMap[apt.client_id || apt.user_id]} size={38} color={C.accent} />
                          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: C.success, border: `2px solid ${C.bg}` }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.client_name || m?.user_name || 'Client'}</div>
                          <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>🕐 {apt.schedule || apt.time || 'TBD'} {apt.session_type && `· ${apt.session_type}`} {apt.duration_minutes && `· ${apt.duration_minutes}min`}</div>
                          {apt.notes && <div style={{ fontSize: 9, color: C.t4, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.notes}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                          <MiniBtn icon={QrCode} label="Check In" color={C.success} onClick={() => openModal('qrScanner')} size="xs" />
                          <MiniBtn icon={ClipboardList} label="Note" color={C.purple} onClick={() => openModal('memberNote', m)} size="xs" />
                        </div>
                      </CardShell>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ══ RIGHT SIDEBAR ═══════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Quick Actions */}
            <CardShell style={{ overflow: 'hidden' }}>
              <SectionHeader label="Quick Actions" />
              <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { icon: QrCode,   label: 'Scan Check-In',  sub: 'Start a class',           color: C.success, fn: () => openModal('qrScanner') },
                  { icon: Calendar, label: 'Create Event',   sub: 'Add to calendar',         color: C.accent,  fn: () => openModal('event')     },
                  { icon: Dumbbell, label: 'Manage Classes', sub: 'Edit your timetable',     color: C.purple,  fn: () => openModal('classes')   },
                  { icon: Bell,     label: 'Send Reminder',  sub: 'Post to members',         color: C.accent,  fn: () => openModal('post')      },
                  { icon: Ban,      label: 'Late Cancels',   sub: `${totalLateCancels} flagged`, color: totalLateCancels > 0 ? C.danger : C.t3, fn: () => {} },
                ].map(({ icon: Ic, label, sub, color, fn }, i) => {
                  const [h, setH] = useState(false);
                  return (
                    <button key={i} onClick={fn} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: h ? C.surfaceEl : 'rgba(255,255,255,0.025)', border: `1px solid ${h ? C.borderEl : C.border}`, cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left', width: '100%', fontFamily: 'inherit' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: C.surfaceEl, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ic style={{ width: 12, height: 12, color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: C.t1 }}>{label}</div>
                        <div style={{ fontSize: 9, color: totalLateCancels > 0 && label === 'Late Cancels' ? color : C.t4 }}>{sub}</div>
                      </div>
                      {label === 'Late Cancels' && totalLateCancels > 0 && (
                        <span style={{ fontSize: 9, fontWeight: 700, color: C.danger, background: C.dangerSub, border: `1px solid ${C.dangerBrd}`, borderRadius: 99, padding: '1px 7px' }}>{totalLateCancels}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardShell>

            {/* Action Centre */}
            <ActionCentre allMemberships={allMemberships} checkIns={checkIns} myClasses={myClasses} now={now} openModal={openModal} />

            {/* Upcoming today */}
            <UpcomingToday classes={classesWithData} now={now} onSelect={openDetail} />

            {/* Day Summary */}
            <CardShell style={{ overflow: 'hidden' }}>
              <SectionHeader label="Day Summary" />
              <div style={{ padding: '8px 14px' }}>
                {[
                  { label: 'Sessions',    value: classesWithData.length,                                 color: C.accent  },
                  { label: 'Expected',    value: totalBooked,                                            color: C.accent  },
                  { label: 'Checked In',  value: totalPresent,                                           color: C.success },
                  { label: 'No-Shows',    value: totalNoShows, color: totalNoShows > 0 ? C.danger : C.t3               },
                  { label: 'Avg Fill',    value: `${avgFill}%`, color: avgFill >= 70 ? C.success : avgFill >= 40 ? C.warn : C.danger },
                  { label: 'Est. Revenue',value: totalRevToday > 0 ? `£${totalRevToday}` : '—',          color: C.success },
                  { label: 'PT Sessions', value: appointments.length,                                    color: C.accent  },
                ].map((s, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                    <span style={{ fontSize: 11, color: C.t2 }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </CardShell>

            {/* Class Mix */}
            {classTypes.length > 0 && (
              <CardShell style={{ overflow: 'hidden' }}>
                <SectionHeader label="Class Mix" />
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {classTypes.map(type => {
                    const cfg       = CLASS_TYPE[type] || CLASS_TYPE.default;
                    const count     = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type)).length;
                    const avgFillT  = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type)).reduce((s, c) => s + c.fill, 0) / Math.max(count, 1);
                    return (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                            <span style={{ fontSize: 9, color: C.t3 }}>{count} · {Math.round(avgFillT)}%</span>
                          </div>
                          <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${avgFillT}%`, background: cfg.color, borderRadius: 99 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardShell>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <CardShell style={{ overflow: 'hidden' }}>
                <SectionHeader label="Upcoming Events" action="New" onAction={() => openModal('event')} />
                <div style={{ padding: '7px 14px' }}>
                  {upcomingEvents.map((ev, i) => {
                    const d    = new Date(ev.event_date);
                    const diff = Math.floor((d - now) / 86400000);
                    return (
                      <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < upcomingEvents.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
                        <div style={{ flexShrink: 0, background: C.successSub, border: `1px solid ${C.successBrd}`, borderRadius: 9, padding: '5px 7px', textAlign: 'center', minWidth: 34 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.success, lineHeight: 1 }}>{format(d, 'd')}</div>
                          <div style={{ fontSize: 7, fontWeight: 700, color: C.success, textTransform: 'uppercase', opacity: 0.7 }}>{format(d, 'MMM')}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                          <div style={{ fontSize: 9, color: diff <= 2 ? C.danger : C.t3 }}>{diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff}d away`}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardShell>
            )}

            {/* 30-Day Sparkline */}
            <ActivitySpark checkIns={checkIns} now={now} />

          </div>
        </div>
      </div>
    </>
  );
}
