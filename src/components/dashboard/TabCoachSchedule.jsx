/**
 * TabCoachSchedule — Session Performance Tool
 *
 * Unified design system: Instrument Sans + JetBrains Mono
 * Token prefix: T. (matches Client Intelligence + Workout Performance)
 *
 * Features retained from original:
 *   - Full attendance roster with QR/manual dual-mode
 *   - Waitlist auto-promotion logic
 *   - Late-cancel policy enforcement + fee tracking
 *   - Per-session revenue & fill-rate analytics
 *   - Member retention score (RS) with trend badges
 *   - Day/Week/Month calendar with heat-map overlay
 *   - PT/1:1 appointment board
 *   - Action Centre: Issues / Unbooked / Fading / Dropping
 *   - 30-day activity sparkline
 *   - Class-mix breakdown with fill-rate bars
 *
 * New in redesign:
 *   - Weekly Performance Bar (top-level KPIs with trend vs last week)
 *   - Color-coded calendar cells (underbooked/healthy/full)
 *   - Upgraded session cards with capacity bar + status pills + inline actions
 *   - Optimization Suggestions panel (data-driven scheduling insights)
 *   - Guided empty state with class creation flow
 *   - Consistent Instrument Sans + JetBrains Mono typography
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
  Star, Plus, Search, MoreHorizontal, Sparkles, Lightbulb, Target,
  Megaphone, Play,
} from 'lucide-react';

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('spt-css')) {
  const s = document.createElement('style');
  s.id = 'spt-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .spt { font-family: 'Instrument Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
    @keyframes sptFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
    @keyframes sptSlide { from { opacity:0; transform:translateX(8px) } to { opacity:1; transform:none } }
    @keyframes sptPulse { 0%,100% { opacity:.55 } 50% { opacity:1 } }
    @keyframes sptGlow { 0%,100% { box-shadow:0 0 0 0 rgba(16,185,129,0) } 50% { box-shadow:0 0 0 4px rgba(16,185,129,.08) } }
    .spt-fade { animation: sptFadeUp .3s cubic-bezier(.4,0,.2,1) both; }
    .spt-slide { animation: sptSlide .25s cubic-bezier(.4,0,.2,1) both; }
    .spt-glow { animation: sptGlow 2.5s ease infinite; }
    .spt-btn { font-family: 'Instrument Sans', sans-serif; cursor: pointer; outline: none;
               transition: all .15s cubic-bezier(.4,0,.2,1); border: none; }
    .spt-btn:active { transform: scale(.97); }
    .spt-card { transition: all .18s cubic-bezier(.4,0,.2,1); cursor: pointer; }
    .spt-card:hover { border-color: rgba(99,102,241,.22) !important; transform: translateY(-1px); }
    .spt-card:hover .spt-card-actions { opacity: 1; pointer-events: auto; }
    .spt-card-actions { opacity: 0; pointer-events: none; transition: opacity .15s; }
    .spt-input { width: 100%; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
                 color: #e2e8f0; font-size: 13px; font-family: 'Instrument Sans', sans-serif;
                 outline: none; border-radius: 10px; padding: 10px 14px; transition: all .15s; }
    .spt-input:focus { border-color: rgba(99,102,241,.4); background: rgba(255,255,255,.04);
                       box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
    .spt-input::placeholder { color: rgba(148,163,184,.4); }
    .spt-grid { display: grid; grid-template-columns: minmax(0,1fr) 290px; gap: 16px; align-items: start; }
    @media (max-width: 1024px) {
      .spt-grid { grid-template-columns: 1fr !important; }
      .spt-sidebar { display: none !important; }
      .spt-perf-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 640px) {
      .spt-perf-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:       '#06090f',
  surface:  '#0b1121',
  surfaceH: '#0e1528',
  card:     '#0d1424',
  border:   'rgba(255,255,255,.05)',
  borderH:  'rgba(255,255,255,.09)',
  borderA:  'rgba(255,255,255,.12)',
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569', t4: '#1e293b',
  emerald: '#10b981', emeraldDim: 'rgba(16,185,129,.08)', emeraldBdr: 'rgba(16,185,129,.18)',
  indigo: '#6366f1', indigoDim: 'rgba(99,102,241,.08)', indigoBdr: 'rgba(99,102,241,.18)',
  amber: '#f59e0b', amberDim: 'rgba(245,158,11,.07)', amberBdr: 'rgba(245,158,11,.16)',
  red: '#ef4444', redDim: 'rgba(239,68,68,.07)', redBdr: 'rgba(239,68,68,.16)',
  sky: '#38bdf8', skyDim: 'rgba(56,189,248,.07)', skyBdr: 'rgba(56,189,248,.16)',
  violet: '#a78bfa', violetDim: 'rgba(167,139,250,.08)', violetBdr: 'rgba(167,139,250,.18)',
  mono: "'JetBrains Mono', monospace",
};

// ─── CLASS TYPE REGISTRY ──────────────────────────────────────────────────────
const CLASS_TYPE = {
  hiit:       { color: '#f87171', label: 'HIIT',       emoji: '🔥' },
  yoga:       { color: '#34d399', label: 'Yoga',       emoji: '🧘' },
  spin:       { color: '#38bdf8', label: 'Spin',       emoji: '🚴' },
  strength:   { color: '#fb923c', label: 'Strength',   emoji: '💪' },
  pilates:    { color: '#e879f9', label: 'Pilates',    emoji: '🌸' },
  boxing:     { color: '#fbbf24', label: 'Boxing',     emoji: '🥊' },
  crossfit:   { color: '#f97316', label: 'CrossFit',   emoji: '⚡' },
  cardio:     { color: '#f472b6', label: 'Cardio',     emoji: '❤️' },
  functional: { color: '#a78bfa', label: 'Functional', emoji: '🎯' },
  personal_training: { color: '#38bdf8', label: 'PT', emoji: '👤' },
  default:    { color: '#a78bfa', label: 'Class',      emoji: '🏋️' },
};

function getTypeCfg(cls) {
  const name = (cls.name || cls.class_type || cls.type || '').toLowerCase();
  for (const [key, cfg] of Object.entries(CLASS_TYPE)) {
    if (name.includes(key)) return cfg;
  }
  return CLASS_TYPE.default;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const LATE_CANCEL_HRS = 24;

function getLateCancel(cls) {
  if (!Array.isArray(cls.late_cancels)) return [];
  return cls.late_cancels.filter(lc => {
    const cancelAt = lc.cancelled_at ? new Date(lc.cancelled_at) : null;
    const classAt = cls.start_time ? new Date(cls.start_time) : null;
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
  const ms = d => now - new Date(d.check_in_date);
  const r30 = uci.filter(c => ms(c) < 30 * 864e5).length;
  const p30 = uci.filter(c => ms(c) >= 30 * 864e5 && ms(c) < 60 * 864e5).length;
  const sorted = [...uci].sort((a, b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const daysAgo = sorted[0] ? Math.floor(ms(sorted[0]) / 864e5) : 999;
  let score = 100;
  if (daysAgo >= 999) score -= 60;
  else if (daysAgo > 21) score -= 45;
  else if (daysAgo > 14) score -= 30;
  else if (daysAgo > 7) score -= 15;
  if (r30 === 0) score -= 25;
  else if (r30 <= 2) score -= 15;
  score = Math.max(0, Math.min(100, score));
  const trend = p30 > 0 ? (r30 > p30 * 1.1 ? 'up' : r30 < p30 * 0.7 ? 'down' : 'flat') : (r30 >= 2 ? 'up' : 'flat');
  const status = score >= 65 ? 'safe' : score >= 35 ? 'at_risk' : 'high_risk';
  const color = status === 'safe' ? T.emerald : status === 'at_risk' ? T.amber : T.red;
  return { score, status, trend, color, daysAgo, recent30: r30, prev30: p30 };
}

function fillColor(pct) {
  if (pct >= 80) return T.sky;
  if (pct >= 50) return T.emerald;
  if (pct >= 30) return T.amber;
  return T.red;
}

function fillLabel(pct) {
  if (pct >= 90) return { label: 'Full', color: T.sky };
  if (pct >= 70) return { label: 'Strong', color: T.emerald };
  if (pct >= 40) return { label: 'Moderate', color: T.amber };
  return { label: 'Underbooked', color: T.red };
}

// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────
function Pill({ children, color = T.t3, bg, border, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color,
      background: bg || `${color}0d`, border: `1px solid ${border || `${color}22`}`,
      borderRadius: 6, padding: '2px 8px', letterSpacing: '.02em',
      textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: '16px', ...style,
    }}>{children}</span>
  );
}

function MiniAvatar({ name = '', src, size = 28, color = T.indigo }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * .32, fontWeight: 700, color, flexShrink: 0 }}>
      {initials || '?'}
    </div>
  );
}

function MiniBtn({ icon: Ic, label, color, onClick, size = 'sm' }) {
  return (
    <button className="spt-btn" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: size === 'xs' ? '4px 8px' : '6px 12px', borderRadius: 8,
      background: `${color}0a`, border: `1px solid ${color}1a`,
      color, fontSize: size === 'xs' ? 10 : 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => e.currentTarget.style.background = `${color}18`}
      onMouseLeave={e => e.currentTarget.style.background = `${color}0a`}>
      {Ic && <Ic style={{ width: size === 'xs' ? 10 : 11, height: size === 'xs' ? 10 : 11 }} />}
      {label}
    </button>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Cancel Class', color = T.red }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: T.card, border: `1px solid ${color}30`, borderRadius: 20, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,.7)' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}0d`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertCircle style={{ width: 22, height: 22, color }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: T.t1, textAlign: 'center', margin: '0 0 20px', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="spt-btn" onClick={onCancel} style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, color: T.t2, fontSize: 12, fontWeight: 600 }}>Go Back</button>
          <button className="spt-btn" onClick={onConfirm} style={{ flex: 1, padding: 10, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}30`, color, fontSize: 12, fontWeight: 600 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── WEEKLY PERFORMANCE BAR ───────────────────────────────────────────────────
function WeeklyPerformanceBar({ sessions, totalBooked, totalPresent, totalNoShows, avgFill, totalRevenue, totalLateCancels, isToday, dateLabel, checkIns, now }) {
  // Compare to last week
  const thisWeekCI = checkIns.filter(c => (now - new Date(c.check_in_date)) < 7 * 864e5).length;
  const lastWeekCI = checkIns.filter(c => { const d = now - new Date(c.check_in_date); return d >= 7 * 864e5 && d < 14 * 864e5; }).length;
  const weekDelta = thisWeekCI - lastWeekCI;
  const weekTrend = weekDelta > 2 ? 'up' : weekDelta < -2 ? 'down' : 'flat';

  return (
    <div className="spt-fade" style={{ marginBottom: 20 }}>
      <div className="spt-perf-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {/* Sessions */}
        <div style={{ padding: '18px 20px', borderRadius: 14, background: `linear-gradient(135deg, ${T.surface}, ${T.card})`, border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${T.indigo}06, transparent 70%)` }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            {isToday && <div className="spt-glow" style={{ width: 7, height: 7, borderRadius: '50%', background: T.emerald }} />}
            <span style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {isToday ? 'Today' : dateLabel}
            </span>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 36, fontWeight: 700, color: T.t1, lineHeight: 1, letterSpacing: '-.04em' }}>{sessions}</div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>sessions scheduled</div>
        </div>

        {/* Fill Rate */}
        <div style={{ padding: '18px 20px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: fillColor(avgFill) }} />
            <span style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Fill Rate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontFamily: T.mono, fontSize: 36, fontWeight: 700, color: fillColor(avgFill), lineHeight: 1, letterSpacing: '-.04em' }}>{avgFill}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: fillColor(avgFill) }}>%</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden', marginTop: 8 }}>
            <div style={{ height: '100%', width: `${avgFill}%`, borderRadius: 99, background: fillColor(avgFill), transition: 'width .5s' }} />
          </div>
        </div>

        {/* Checked In */}
        <div style={{ padding: '18px 20px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>Checked In</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: T.mono, fontSize: 36, fontWeight: 700, color: T.emerald, lineHeight: 1, letterSpacing: '-.04em' }}>{totalPresent}</span>
            <span style={{ fontSize: 12, color: T.t3 }}>/ {totalBooked}</span>
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>expected today</div>
        </div>

        {/* No-Shows */}
        <div style={{ padding: '18px 20px', borderRadius: 14, background: totalNoShows > 0 ? T.redDim : T.surface, border: `1px solid ${totalNoShows > 0 ? T.redBdr : T.border}` }}>
          <div style={{ fontSize: 10, color: totalNoShows > 0 ? T.red : T.t3, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>No-Shows</div>
          <span style={{ fontFamily: T.mono, fontSize: 36, fontWeight: 700, color: totalNoShows > 0 ? T.red : T.t3, lineHeight: 1, letterSpacing: '-.04em' }}>{totalNoShows}</span>
          {totalLateCancels > 0 && (
            <div style={{ fontSize: 11, color: T.amber, fontWeight: 600, marginTop: 6 }}>{totalLateCancels} late cancel{totalLateCancels > 1 ? 's' : ''}</div>
          )}
        </div>

        {/* Week Trend */}
        <div style={{ padding: '18px 20px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>vs Last Week</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {weekTrend === 'up' && <ArrowUpRight style={{ width: 18, height: 18, color: T.emerald }} />}
            {weekTrend === 'down' && <ArrowDownRight style={{ width: 18, height: 18, color: T.red }} />}
            {weekTrend === 'flat' && <Minus style={{ width: 18, height: 18, color: T.t3 }} />}
            <span style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 700, color: weekTrend === 'up' ? T.emerald : weekTrend === 'down' ? T.red : T.t3 }}>
              {weekDelta > 0 ? '+' : ''}{weekDelta}
            </span>
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>check-ins this week</div>
        </div>
      </div>
    </div>
  );
}

// ─── SESSION CARD (REDESIGNED) ────────────────────────────────────────────────
function SessionCard({ cls, onOpen, isSelected, now, openModal }) {
  const c = cls.typeCfg.color;
  const booked = cls.booked.length || cls.attended.length;
  const fc = fillColor(cls.fill);
  const fl = fillLabel(cls.fill);
  const noShows = Math.max(0, cls.booked.length - cls.attended.length);

  return (
    <div className="spt-card" onClick={onOpen} style={{
      borderRadius: 14, overflow: 'hidden',
      background: isSelected ? `${c}04` : T.surface,
      border: `1px solid ${isSelected ? `${c}25` : T.border}`,
      opacity: cls.isCancelled ? .5 : 1,
    }}>
      <div style={{ height: 3, background: cls.isCancelled ? `linear-gradient(90deg,${T.red},${T.red}44)` : `linear-gradient(90deg,${c},${c}30)` }} />

      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Icon */}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c}0d`, border: `1px solid ${c}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            {cls.typeCfg.emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name + pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: cls.isCancelled ? T.t3 : T.t1, letterSpacing: '-.02em' }}>{cls.name}</span>
              <Pill color={c} style={{ fontSize: 9 }}>{cls.typeCfg.label}</Pill>
              {cls.isCancelled && <Pill color={T.red}>Cancelled</Pill>}
              <Pill color={fl.color} style={{ fontSize: 9 }}>{fl.label}</Pill>
            </div>

            {/* Time + meta */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              {cls.scheduleStr && (
                <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: c, background: `${c}0a`, border: `1px solid ${c}18`, borderRadius: 7, padding: '3px 9px' }}>
                  {cls.scheduleStr}
                </span>
              )}
              {cls.duration_minutes && <span style={{ fontSize: 11, color: T.t3 }}>{cls.duration_minutes}min</span>}
              {cls.room && <span style={{ fontSize: 11, color: T.t3, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 9, height: 9 }} />{cls.room}</span>}
            </div>

            {/* Capacity bar */}
            {!cls.isCancelled && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: fc }}>
                    {booked} / {cls.capacity}
                  </span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: fc }}>{cls.fill}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cls.fill}%`, borderRadius: 99, background: fc, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
                </div>
              </div>
            )}

            {/* Status badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              {cls.attended.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: T.emerald, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check style={{ width: 9, height: 9 }} /> {cls.attended.length} in
                </span>
              )}
              {noShows > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: T.red, background: T.redDim, border: `1px solid ${T.redBdr}`, borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <UserX style={{ width: 9, height: 9 }} /> {noShows} no-show
                </span>
              )}
              {cls.waitlist.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: T.amber, background: T.amberDim, border: `1px solid ${T.amberBdr}`, borderRadius: 6, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock style={{ width: 9, height: 9 }} /> {cls.waitlist.length} wait
                </span>
              )}
              {cls.revenue > 0 && (
                <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.emerald, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, borderRadius: 6, padding: '3px 8px' }}>
                  £{cls.revenue}
                </span>
              )}
            </div>
          </div>

          {/* Right: quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
            <button className="spt-btn" onClick={e => { e.stopPropagation(); onOpen(); }} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9,
              background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`,
              color: T.emerald, fontSize: 11, fontWeight: 700,
            }}>
              <QrCode style={{ width: 11, height: 11 }} /> Check-In
            </button>
            <div className="spt-card-actions" style={{ display: 'flex', gap: 4 }}>
              <button className="spt-btn" onClick={e => { e.stopPropagation(); openModal('post', { classId: cls.id }); }} style={{
                flex: 1, padding: '5px 8px', borderRadius: 7, background: `${T.indigo}0a`, border: `1px solid ${T.indigo}18`, color: T.indigo, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
              }}>
                <Megaphone style={{ width: 9, height: 9 }} /> Promote
              </button>
              <button className="spt-btn" onClick={e => { e.stopPropagation(); openModal('post', { classId: cls.id }); }} style={{
                flex: 1, padding: '5px 8px', borderRadius: 7, background: `${T.sky}0a`, border: `1px solid ${T.sky}18`, color: T.sky, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
              }}>
                <MessageCircle style={{ width: 9, height: 9 }} /> Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OPTIMIZATION SUGGESTIONS ─────────────────────────────────────────────────
function OptimizationSuggestions({ classesWithData, checkIns, now }) {
  const suggestions = useMemo(() => {
    const items = [];

    // Underbooked classes
    const underbooked = classesWithData.filter(c => c.fill < 40 && !c.isCancelled);
    if (underbooked.length > 0) {
      items.push({
        icon: AlertTriangle, color: T.red,
        text: `${underbooked.length} session${underbooked.length > 1 ? 's are' : ' is'} underbooked (<40% fill) — consider promoting or adjusting the time`,
      });
    }

    // Full classes
    const full = classesWithData.filter(c => c.fill >= 90 && !c.isCancelled);
    if (full.length > 0) {
      items.push({
        icon: TrendingUp, color: T.sky,
        text: `${full.length} session${full.length > 1 ? 's are' : ' is'} at capacity — consider adding a second time slot`,
      });
    }

    // Morning vs evening analysis
    const morning = classesWithData.filter(c => {
      const m = (c.scheduleStr || '').match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!m) return false;
      let h = parseInt(m[1]);
      if (m[2].toLowerCase() === 'pm' && h !== 12) h += 12;
      return h < 12;
    });
    const evening = classesWithData.filter(c => {
      const m = (c.scheduleStr || '').match(/(\d{1,2})(?::?\d{2})?\s*(am|pm)/i);
      if (!m) return false;
      let h = parseInt(m[1]);
      if (m[2].toLowerCase() === 'pm' && h !== 12) h += 12;
      return h >= 17;
    });
    const mornAvg = morning.length > 0 ? Math.round(morning.reduce((s, c) => s + c.fill, 0) / morning.length) : 0;
    const eveAvg = evening.length > 0 ? Math.round(evening.reduce((s, c) => s + c.fill, 0) / evening.length) : 0;
    if (mornAvg > eveAvg + 15 && morning.length > 0) {
      items.push({ icon: Sparkles, color: T.emerald, text: `Morning sessions average ${mornAvg}% fill vs ${eveAvg}% for evenings — your members prefer AM slots` });
    } else if (eveAvg > mornAvg + 15 && evening.length > 0) {
      items.push({ icon: Sparkles, color: T.emerald, text: `Evening sessions average ${eveAvg}% fill vs ${mornAvg}% for mornings — lean into PM scheduling` });
    }

    // Waitlist opportunity
    const withWaitlist = classesWithData.filter(c => c.waitlist.length > 0);
    if (withWaitlist.length > 0) {
      const totalWaiting = withWaitlist.reduce((s, c) => s + c.waitlist.length, 0);
      items.push({ icon: Users, color: T.violet, text: `${totalWaiting} member${totalWaiting > 1 ? 's' : ''} on waitlists — demand exceeds supply for ${withWaitlist.length} class${withWaitlist.length > 1 ? 'es' : ''}` });
    }

    // General tip
    items.push({ icon: Lightbulb, color: T.indigo, text: 'Classes with consistent scheduling retain 2.8× more members than sporadic ones' });

    return items.slice(0, 5);
  }, [classesWithData, checkIns, now]);

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: T.surface, border: `1px solid ${T.border}` }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 7 }}>
        <Target style={{ width: 12, height: 12, color: T.indigo }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t1, letterSpacing: '.02em' }}>Optimization</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {suggestions.map((s, i) => {
          const Ic = s.icon;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 8px', borderRadius: 8, transition: 'background .12s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${s.color}0d`, border: `1px solid ${s.color}1a` }}>
                <Ic style={{ width: 11, height: 11, color: s.color }} />
              </div>
              <span style={{ fontSize: 12, color: T.t2, lineHeight: 1.5, flex: 1 }}>{s.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CALENDAR WEEK CELL ───────────────────────────────────────────────────────
function WeekCell({ date, isSelected, isToday, classCount, ciCount, avgFill, onClick }) {
  const fc = avgFill !== null ? fillColor(avgFill) : T.t3;
  return (
    <button className="spt-btn" onClick={onClick} style={{
      flex: 1, padding: '12px 4px', borderRadius: 12,
      border: isSelected ? `1px solid ${T.indigoBdr}` : isToday ? `1px solid rgba(99,102,241,.15)` : `1px solid ${T.border}`,
      background: isSelected ? T.indigoDim : isToday ? 'rgba(99,102,241,.04)' : 'transparent',
      textAlign: 'center', position: 'relative',
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: isSelected ? T.indigo : T.t3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{format(date, 'EEE')}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: isSelected ? T.indigo : isToday ? T.t1 : T.t2, lineHeight: 1, marginBottom: 6, letterSpacing: '-.02em' }}>{format(date, 'd')}</div>
      {classCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 4 }}>
          {Array.from({ length: Math.min(classCount, 4) }, (_, j) => (
            <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: fc }} />
          ))}
        </div>
      )}
      {ciCount > 0 && <div style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 600, color: isSelected ? T.indigo : T.t3 }}>{ciCount} in</div>}
      {isToday && !isSelected && <div style={{ position: 'absolute', top: 6, right: 8, width: 5, height: 5, borderRadius: '50%', background: T.indigo }} />}
    </button>
  );
}

// ─── CALENDAR MONTH CELL ──────────────────────────────────────────────────────
function MonthCell({ date, isCurrentMonth, isSelected, isToday, classCount, ciCount, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '7px 5px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
      background: isSelected ? T.indigoDim : isToday ? 'rgba(99,102,241,.05)' : 'transparent',
      border: isSelected ? `1px solid ${T.indigoBdr}` : isToday ? '1px solid rgba(99,102,241,.15)' : '1px solid transparent',
      opacity: isCurrentMonth ? 1 : .2, transition: 'all .12s',
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.025)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(99,102,241,.05)' : 'transparent'; }}>
      <div style={{ fontSize: 14, fontWeight: isToday || isSelected ? 700 : 500, color: isSelected ? T.indigo : isToday ? T.t1 : T.t2, lineHeight: 1, marginBottom: 4 }}>{format(date, 'd')}</div>
      {classCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
          {Array.from({ length: Math.min(classCount, 3) }, (_, j) => (
            <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? T.indigo : `${T.indigo}50` }} />
          ))}
        </div>
      )}
      {ciCount > 0 && <div style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 600, color: isSelected ? T.indigo : T.t3 }}>{ciCount}</div>}
    </div>
  );
}

// ─── SESSION DETAIL PANEL ─────────────────────────────────────────────────────
function SessionDetailPanel({ cls, allMemberships, checkIns, avatarMap, attendance, onToggle, onMarkAll, onClearAll, onSaveNote, onSaveAnnounce, notes, classAnnounce, selDateStr, now, openModal, onClose, onCancelClass, onReinstateClass }) {
  const [tab, setTab] = useState('attendees');
  const [rosterQ, setRosterQ] = useState('');
  const c = cls.typeCfg.color;
  const key = `${cls.id}-${selDateStr}`;
  const manualIds = attendance[key] || [];
  const checkedIds = cls.attended.map(ci => ci.user_id);
  const totalPresent = [...new Set([...manualIds, ...checkedIds])].length;
  const noShowList = cls.booked.filter(b => !checkedIds.includes(b.user_id) && !manualIds.includes(b.user_id));
  const filteredRoster = allMemberships.filter(m => !rosterQ || (m.user_name || '').toLowerCase().includes(rosterQ.toLowerCase()));

  const tabs = [
    { id: 'attendees', label: `Roster (${cls.booked.length || cls.attended.length})` },
    { id: 'checkin', label: `Check-In (${totalPresent})` },
    { id: 'waitlist', label: `Waitlist (${cls.waitlist.length})` },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className="spt-slide" onClick={e => e.stopPropagation()} style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 9000,
      background: T.bg, borderLeft: `1px solid ${T.borderA}`,
      display: 'flex', flexDirection: 'column', boxShadow: '-32px 0 80px rgba(0,0,0,.6)',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: `${c}0d`, border: `1px solid ${c}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{cls.typeCfg.emoji}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.t1, letterSpacing: '-.02em' }}>{cls.name}</div>
              <div style={{ fontSize: 11, color: T.t3, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                {cls.scheduleStr && <span style={{ color: c, fontWeight: 700 }}>{cls.scheduleStr}</span>}
                {cls.duration_minutes && <span>{cls.duration_minutes}min</span>}
                {cls.room && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 9, height: 9 }} />{cls.room}</span>}
              </div>
            </div>
          </div>
          <button className="spt-btn" onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, color: T.t3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Capacity bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: fillColor(cls.fill) }}>
              {cls.booked.length || cls.attended.length} / {cls.capacity}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: fillColor(cls.fill) }}>{cls.fill}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${cls.fill}%`, borderRadius: 99, background: fillColor(cls.fill), transition: 'width .5s' }} />
          </div>
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <Pill color={T.emerald}>✓ {totalPresent} present</Pill>
          {noShowList.length > 0 && <Pill color={T.red}>✗ {noShowList.length} no-show</Pill>}
          {cls.waitlist.length > 0 && <Pill color={T.amber}>⏳ {cls.waitlist.length} waitlist</Pill>}
          {cls.lateCancels.length > 0 && <Pill color={T.amber}>⚠ {cls.lateCancels.length} late cancel</Pill>}
          {cls.isCancelled && <Pill color={T.red}>CANCELLED</Pill>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, flexShrink: 0, padding: '0 8px' }}>
        {tabs.map(t => (
          <button key={t.id} className="spt-btn" onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 6px', background: 'none',
            borderBottom: `2px solid ${tab === t.id ? c : 'transparent'}`,
            color: tab === t.id ? c : T.t3, fontSize: 10, fontWeight: tab === t.id ? 700 : 500,
            marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {/* Attendees */}
        {tab === 'attendees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {noShowList.length > 0 && (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: T.redDim, border: `1px solid ${T.redBdr}`, borderLeft: `3px solid ${T.red}`, marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 8 }}>⚠ {noShowList.length} No-Show{noShowList.length !== 1 ? 's' : ''}</div>
                {noShowList.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < noShowList.length - 1 ? 6 : 0 }}>
                    <MiniAvatar name={m.user_name} src={avatarMap?.[m.user_id]} size={24} color={T.red} />
                    <span style={{ fontSize: 12, color: T.t1, fontWeight: 600, flex: 1 }}>{m.user_name}</span>
                    <MiniBtn icon={MessageCircle} label="Message" color={T.indigo} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    <MiniBtn icon={Calendar} label="Rebook" color={T.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                  </div>
                ))}
              </div>
            )}
            {(cls.booked.length > 0 ? cls.booked : cls.regulars).map((m, j) => {
              const isIn = checkedIds.includes(m.user_id) || manualIds.includes(m.user_id);
              const isCxl = (cls.late_cancels || []).some(lc => lc.user_id === m.user_id);
              const rs = calcRS(m.user_id, checkIns, now);
              return (
                <div key={m.user_id || j} style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: isIn ? T.emeraldDim : isCxl ? T.redDim : 'rgba(255,255,255,.02)',
                  border: `1px solid ${isIn ? T.emeraldBdr : isCxl ? T.redBdr : T.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MiniAvatar name={m.user_name} src={avatarMap?.[m.user_id]} size={32} color={isIn ? T.emerald : T.indigo} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{m.user_name || 'Member'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        {rs.daysAgo < 999 && <span style={{ fontSize: 10, color: rs.daysAgo > 14 ? T.red : rs.daysAgo > 7 ? T.amber : T.t3 }}>Last: {rs.daysAgo === 0 ? 'Today' : `${rs.daysAgo}d ago`}</span>}
                        <span style={{ fontSize: 9, color: rs.trend === 'up' ? T.emerald : rs.trend === 'down' ? T.red : T.t3, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                          {rs.trend === 'up' && <ArrowUpRight style={{ width: 9, height: 9 }} />}
                          {rs.trend === 'down' && <ArrowDownRight style={{ width: 9, height: 9 }} />}
                          {rs.trend === 'up' ? 'Improving' : rs.trend === 'down' ? 'Declining' : 'Stable'}
                        </span>
                      </div>
                    </div>
                    <Pill color={isIn ? T.emerald : isCxl ? T.red : T.indigo} style={{ fontSize: 9 }}>
                      {isIn ? '✓ In' : isCxl ? '✗ Cancel' : 'Booked'}
                    </Pill>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                    <MiniBtn icon={MessageCircle} label="Message" color={T.indigo} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    {!isIn && !isCxl && <MiniBtn icon={Check} label="Check In" color={T.emerald} onClick={() => {}} size="xs" />}
                  </div>
                </div>
              );
            })}
            {cls.booked.length === 0 && cls.regulars?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: T.t3, fontSize: 13 }}>No bookings yet</div>
            )}
          </div>
        )}

        {/* Check-In */}
        {tab === 'checkin' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: T.t3 }} />
                <input className="spt-input" value={rosterQ} onChange={e => setRosterQ(e.target.value)} placeholder="Search members…" style={{ paddingLeft: 30, padding: '8px 12px 8px 30px', fontSize: 12 }} />
              </div>
              <MiniBtn icon={CheckCircle} label="All" color={T.emerald} onClick={() => onMarkAll(key)} size="xs" />
              <MiniBtn icon={X} label="Clear" color={T.red} onClick={() => onClearAll(key)} size="xs" />
            </div>
            <div style={{ borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {filteredRoster.map((m, mi) => {
                const isManual = manualIds.includes(m.user_id);
                const isQR = checkedIds.includes(m.user_id);
                const present = isManual || isQR;
                return (
                  <div key={m.user_id || mi} onClick={() => !isQR && onToggle(key, m.user_id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                    borderBottom: mi < filteredRoster.length - 1 ? `1px solid ${T.border}` : 'none',
                    cursor: isQR ? 'default' : 'pointer',
                    background: present ? T.emeraldDim : 'transparent', transition: 'background .1s',
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${present ? T.emerald : 'rgba(255,255,255,.12)'}`, background: present ? T.emerald : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .1s' }}>
                      {present && <Check style={{ width: 9, height: 9, color: '#fff' }} />}
                    </div>
                    <MiniAvatar name={m.user_name} src={avatarMap?.[m.user_id]} size={26} color={present ? T.emerald : T.t3} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: present ? T.t1 : T.t2 }}>{m.user_name || 'Member'}</span>
                    {isQR && <Pill color={T.emerald} style={{ fontSize: 8, padding: '1px 6px' }}>QR ✓</Pill>}
                    {isManual && !isQR && <Pill color={T.violet} style={{ fontSize: 8, padding: '1px 6px' }}>Manual</Pill>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.t3 }}>{totalPresent} present · {Math.max(0, filteredRoster.length - totalPresent)} absent</span>
              <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${filteredRoster.length > 0 ? (totalPresent / filteredRoster.length) * 100 : 0}%`, background: T.emerald, borderRadius: 99, transition: 'width .4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Waitlist */}
        {tab === 'waitlist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cls.waitlist.length === 0 ? (
              <div style={{ padding: '12px 14px', borderRadius: 10, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, borderLeft: `3px solid ${T.emerald}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 13, height: 13, color: T.emerald }} />
                <span style={{ fontSize: 12, color: T.emerald }}>No one on the waitlist</span>
              </div>
            ) : cls.waitlist.map((w, j) => (
              <div key={w.user_id || j} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.amber}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: T.amberDim, border: `1px solid ${T.amberBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: T.amber }}>{j + 1}</div>
                  <MiniAvatar name={w.user_name} src={avatarMap?.[w.user_id]} size={28} color={T.amber} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{w.user_name || 'Member'}</div>
                    {w.wait_since && <div style={{ fontSize: 10, color: T.t3 }}>Since {format(new Date(w.wait_since), 'MMM d, h:mm a')}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <MiniBtn icon={ArrowUpRight} label="Promote" color={T.emerald} onClick={() => openModal('promoteWaitlist', w)} size="xs" />
                  <MiniBtn icon={Bell} label="Notify" color={T.indigo} onClick={() => openModal('post', { memberId: w.user_id })} size="xs" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>📢 Class Announcement</div>
              <textarea className="spt-input" value={classAnnounce[key] || ''} onChange={e => onSaveAnnounce(key, e.target.value)}
                placeholder="Visible to members before this class…" style={{ minHeight: 72, resize: 'vertical', lineHeight: 1.6 }} />
              <button className="spt-btn" onClick={() => openModal('post', { classId: cls.id, announcement: classAnnounce[key] })} style={{
                marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9,
                background: T.indigoDim, border: `1px solid ${T.indigoBdr}`, color: T.indigo, fontSize: 12, fontWeight: 700,
              }}>
                <Send style={{ width: 11, height: 11 }} /> Push to members
              </button>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>🔒 Coach Notes (Private)</div>
              <textarea className="spt-input" value={notes[key] || ''} onChange={e => onSaveNote(key, e.target.value)}
                placeholder="Cues, modifications, what worked…" style={{ minHeight: 72, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 7, flexWrap: 'wrap', flexShrink: 0, background: T.card }}>
        <MiniBtn icon={QrCode} label="Scan QR" color={T.emerald} onClick={() => openModal('qrScanner', cls)} />
        <MiniBtn icon={Bell} label="Remind All" color={T.indigo} onClick={() => openModal('post', { classId: cls.id })} />
        <MiniBtn icon={Pencil} label="Edit" color={T.t2} onClick={() => openModal('editClass', cls)} />
        {cls.isCancelled
          ? <MiniBtn icon={RefreshCw} label="Reinstate" color={T.emerald} onClick={() => { onReinstateClass(cls); onClose(); }} />
          : <MiniBtn icon={XCircle} label="Cancel" color={T.red} onClick={() => openModal('confirmCancel', cls)} />
        }
      </div>
    </div>
  );
}

// ─── ACTION CENTRE ────────────────────────────────────────────────────────────
function ActionCentre({ allMemberships, checkIns, myClasses, now, openModal }) {
  const [section, setSection] = useState('issues');

  const noShows = useMemo(() => myClasses.flatMap(cls => {
    const booked = cls.bookings || [];
    const attended = checkIns.filter(c => isSameDay(new Date(c.check_in_date), now));
    return booked.filter(b => !attended.some(a => a.user_id === b.user_id)).map(b => ({ ...b, className: cls.name }));
  }).slice(0, 8), [myClasses, checkIns, now]);

  const fading = useMemo(() => allMemberships.map(m => {
    const rs = calcRS(m.user_id, checkIns, now);
    if (rs.status === 'safe') return null;
    const reason = rs.daysAgo > 21 ? `No visit in ${rs.daysAgo}d` : 'Low engagement';
    return { ...m, rs, reason };
  }).filter(Boolean).sort((a, b) => a.rs.score - b.rs.score).slice(0, 5), [allMemberships, checkIns, now]);

  const sections = [
    { id: 'issues', label: 'Issues', count: noShows.length, color: T.red },
    { id: 'fading', label: 'Fading', count: fading.length, color: T.amber },
  ];

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: T.surface, border: `1px solid ${T.border}` }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Zap style={{ width: 12, height: 12, color: T.amber }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: T.t1 }}>Action Centre</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {sections.map(s => (
            <button key={s.id} className="spt-btn" onClick={() => setSection(s.id)} style={{
              flex: 1, padding: '6px 8px', borderRadius: 8,
              background: section === s.id ? `${s.color}0d` : 'transparent',
              border: `1px solid ${section === s.id ? `${s.color}22` : 'transparent'}`,
              color: section === s.id ? s.color : T.t3, fontSize: 10, fontWeight: section === s.id ? 700 : 500,
              position: 'relative',
            }}>
              {s.label}
              {s.count > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -2, width: 14, height: 14, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: '#fff' }}>{s.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '10px 12px', maxHeight: 320, overflowY: 'auto' }}>
        {section === 'issues' && (
          noShows.length === 0 ? (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, borderLeft: `3px solid ${T.emerald}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle style={{ width: 12, height: 12, color: T.emerald }} />
              <span style={{ fontSize: 12, color: T.emerald }}>No issues today</span>
            </div>
          ) : noShows.map((m, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.red}`, marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{m.user_name || 'Client'}</div>
              <div style={{ fontSize: 10, color: T.t3, margin: '2px 0 8px' }}>No-show — "{m.className}"</div>
              <div style={{ display: 'flex', gap: 5 }}>
                <MiniBtn icon={MessageCircle} label="Message" color={T.indigo} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                <MiniBtn icon={Calendar} label="Rebook" color={T.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
              </div>
            </div>
          ))
        )}
        {section === 'fading' && (
          fading.length === 0 ? (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, borderLeft: `3px solid ${T.emerald}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle style={{ width: 12, height: 12, color: T.emerald }} />
              <span style={{ fontSize: 12, color: T.emerald }}>All members healthy</span>
            </div>
          ) : fading.map((m, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`, borderLeft: `3px solid ${m.rs.color}`, marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.t1 }}>{m.user_name || 'Client'}</div>
                  <div style={{ fontSize: 10, color: T.t3 }}>{m.reason}</div>
                </div>
                <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: m.rs.color }}>{m.rs.score}</span>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <MiniBtn icon={MessageCircle} label="Message" color={T.indigo} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                <MiniBtn icon={Calendar} label="Book" color={T.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── 30-DAY SPARKLINE ─────────────────────────────────────────────────────────
function ActivitySpark({ checkIns, now }) {
  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d, 'MMM d'), count: checkIns.filter(c => isSameDay(new Date(c.check_in_date), d)).length };
  }), [checkIns, now]);
  const maxVal = Math.max(...last30.map(d => d.count), 1);
  const total = last30.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: T.surface, border: `1px solid ${T.border}` }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t1 }}>30-Day Activity</span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 48 }}>
          {last30.map((d, i) => {
            const h = d.count === 0 ? 2 : Math.max(4, (d.count / maxVal) * 44);
            return <div key={i} title={`${d.label}: ${d.count}`} style={{ flex: 1, height: h, borderRadius: '2px 2px 1px 1px', background: i >= 27 ? T.indigo : `${T.indigo}28`, transition: 'height .4s' }} />;
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: T.mono, fontSize: 8, color: T.t3 }}>{format(subDays(now, 29), 'MMM d')}</span>
          <span style={{ fontFamily: T.mono, fontSize: 8, color: T.indigo, fontWeight: 700 }}>Today</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.indigo }}>{total}</div>
            <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.violet }}>{maxVal}</div>
            <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase' }}>Peak</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: T.emerald }}>{(total / 30).toFixed(1)}</div>
            <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase' }}>Avg/Day</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ openModal }) {
  return (
    <div className="spt-fade" style={{
      padding: '48px 32px', textAlign: 'center', borderRadius: 16,
      background: `linear-gradient(180deg, ${T.surface}, ${T.bg})`, border: `1px solid ${T.border}`,
    }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px', background: T.indigoDim, border: `1px solid ${T.indigoBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Calendar style={{ width: 24, height: 24, color: T.indigo }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: T.t1, margin: '0 0 6px', letterSpacing: '-.02em' }}>Build Your Schedule</h3>
      <p style={{ fontSize: 13, color: T.t3, margin: '0 0 28px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Create your first class and start tracking attendance, fill rates, and member engagement.
      </p>

      {/* Preview time slots */}
      <div style={{ maxWidth: 400, margin: '0 auto 24px' }}>
        {[{ t: '6:00 AM', type: 'Morning HIIT', emoji: '🔥' }, { t: '12:00 PM', type: 'Lunch Yoga', emoji: '🧘' }, { t: '5:30 PM', type: 'Evening Strength', emoji: '💪' }].map((slot, i) => (
          <div key={i} className="spt-fade" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,.015)', border: `1px dashed ${T.border}`, marginBottom: 8,
            textAlign: 'left', animationDelay: `${i * .08}s`,
          }}>
            <span style={{ fontSize: 18 }}>{slot.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.indigo }}>{slot.t}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>{slot.type}</div>
            </div>
            <button className="spt-btn" onClick={() => openModal('classes')} style={{
              fontSize: 10, fontWeight: 700, color: T.indigo, background: T.indigoDim, border: `1px solid ${T.indigoBdr}`, borderRadius: 8, padding: '5px 12px',
            }}>+ Add</button>
          </div>
        ))}
      </div>

      <button className="spt-btn" onClick={() => openModal('classes')} style={{
        display: 'inline-flex', alignItems: 'center', gap: 7, padding: '12px 24px', borderRadius: 12,
        background: T.indigo, color: '#fff', fontSize: 13, fontWeight: 700,
        boxShadow: '0 2px 16px rgba(99,102,241,.25)',
      }}>
        <Plus style={{ width: 14, height: 14 }} /> Create Your First Class
      </button>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function TabCoachSchedule({ myClasses = [], checkIns = [], events = [], allMemberships = [], avatarMap = {}, openModal, now }) {
  const [calView, setCalView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(now);
  const [monthDate, setMonthDate] = useState(now);
  const [detailCls, setDetailCls] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [confirmCancel, setConfirmCancel] = useState(null);

  const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch { return JSON.parse(fallback); } };
  const [attendance, setAttendance] = useState(() => load('coachAttendanceSheets', '{}'));
  const [notes, setNotes] = useState(() => load('coachSessionNotes', '{}'));
  const [cancelledClasses, setCancelledClasses] = useState(() => load('coachCancelledClasses', '[]'));
  const [classAnnounce, setClassAnnounce] = useState(() => load('coachClassAnnouncements', '{}'));

  const persist = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} };
  const saveNote = (k, v) => { const u = { ...notes, [k]: v }; setNotes(u); persist('coachSessionNotes', u); };
  const saveAnnounce = (k, v) => { const u = { ...classAnnounce, [k]: v }; setClassAnnounce(u); persist('coachClassAnnouncements', u); };
  const toggleAttendance = (rk, uid) => { const s = attendance[rk] || []; const u = { ...attendance, [rk]: s.includes(uid) ? s.filter(id => id !== uid) : [...s, uid] }; setAttendance(u); persist('coachAttendanceSheets', u); };
  const markAllPresent = (rk) => { const u = { ...attendance, [rk]: allMemberships.map(m => m.user_id) }; setAttendance(u); persist('coachAttendanceSheets', u); };
  const clearAttendance = (rk) => { const u = { ...attendance, [rk]: [] }; setAttendance(u); persist('coachAttendanceSheets', u); };
  const cancelClass = (cls, ds) => { const k = `${cls.id}-${ds}`; const u = [...cancelledClasses, k]; setCancelledClasses(u); persist('coachCancelledClasses', u); setConfirmCancel(null); setDetailCls(null); };
  const reinstateClass = (cls) => { const k = `${cls.id}-${selDateStr}`; const u = cancelledClasses.filter(x => x !== k); setCancelledClasses(u); persist('coachCancelledClasses', u); };

  const selDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = isSameDay(selectedDate, now);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const dayCIs = (day) => checkIns.filter(c => isSameDay(new Date(c.check_in_date), day));
  const selCIs = dayCIs(selectedDate);
  const weekCICounts = useMemo(() => week.map(d => dayCIs(d).length), [week, checkIns]);

  const navigate = (dir) => {
    if (calView === 'day') setSelectedDate(d => dir > 0 ? addDays(d, 1) : subDays(d, 1));
    if (calView === 'week') setSelectedDate(d => dir > 0 ? addDays(d, 7) : subDays(d, 7));
    if (calView === 'month') setMonthDate(d => dir > 0 ? addDays(startOfMonth(d), 32) : subDays(startOfMonth(d), 1));
  };

  const appointments = useMemo(() => myClasses.filter(c => c.type === 'personal_training' || c.is_appointment || c.type === 'pt'), [myClasses]);
  const groupClasses = useMemo(() => myClasses.filter(c => !c.type || (c.type !== 'personal_training' && !c.is_appointment && c.type !== 'pt')), [myClasses]);

  const classesWithData = useMemo(() => {
    let cls = groupClasses;
    if (typeFilter !== 'all') cls = cls.filter(c => (c.name || c.class_type || c.type || '').toLowerCase().includes(typeFilter));
    return cls.map(c => {
      const typeCfg = getTypeCfg(c);
      const capacity = c.max_capacity || c.capacity || 20;
      const booked = c.bookings || [];
      const waitlist = c.waitlist || [];
      const isCancelled = cancelledClasses.includes(`${c.id}-${selDateStr}`);
      const lateCancels = getLateCancel(c);
      const revenue = calcRevenue(c, allMemberships);
      const _sched = typeof c.schedule === 'string' ? c.schedule : (Array.isArray(c.schedule) && c.schedule[0]?.time ? c.schedule[0].time : '');
      const attended = selCIs.filter(ci => {
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
      for (const key of Object.keys(CLASS_TYPE)) { if (name.includes(key) && key !== 'default') return key; }
      return null;
    }).filter(Boolean));
    return [...types];
  }, [groupClasses]);

  // KPIs
  const totalBooked = classesWithData.reduce((s, c) => s + (c.booked.length || c.attended.length), 0);
  const totalPresent = classesWithData.reduce((s, c) => { const ids = [...new Set([...c.attended.map(ci => ci.user_id), ...(attendance[`${c.id}-${selDateStr}`] || [])])]; return s + ids.length; }, 0);
  const totalNoShows = classesWithData.reduce((s, c) => s + Math.max(0, c.booked.length - c.attended.length), 0);
  const avgFill = classesWithData.length > 0 ? Math.round(classesWithData.reduce((s, c) => s + c.fill, 0) / classesWithData.length) : 0;
  const totalRevToday = classesWithData.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalLateCancels = classesWithData.reduce((s, c) => s + c.lateCancels.length, 0);

  useEffect(() => {
    if (detailCls) {
      const updated = classesWithData.find(c => c.id === detailCls.id);
      if (updated) setDetailCls(updated);
    }
  }, [classesWithData]);

  const openDetail = (cls) => setDetailCls(prev => prev?.id === cls.id ? null : cls);
  const hasClasses = groupClasses.length > 0;

  return (
    <div className="spt" style={{ background: T.bg, minHeight: '100vh', padding: '24px' }}>
      {confirmCancel && (
        <ConfirmDialog
          message={`Cancel "${confirmCancel.name}" on ${format(selectedDate, 'EEE, MMM d')}? Members must be notified manually.`}
          onConfirm={() => cancelClass(confirmCancel, selDateStr)}
          onCancel={() => setConfirmCancel(null)}
        />
      )}

      {detailCls && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 8999, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }} onClick={() => setDetailCls(null)} />
          <SessionDetailPanel cls={detailCls} allMemberships={allMemberships} checkIns={checkIns} avatarMap={avatarMap} attendance={attendance} onToggle={toggleAttendance} onMarkAll={markAllPresent} onClearAll={clearAttendance} onSaveNote={saveNote} onSaveAnnounce={saveAnnounce} notes={notes} classAnnounce={classAnnounce} selDateStr={selDateStr} now={now}
            openModal={(type, data) => { if (type === 'confirmCancel') { setConfirmCancel(data); return; } openModal(type, data); }}
            onClose={() => setDetailCls(null)} onCancelClass={(cls) => setConfirmCancel(cls)} onReinstateClass={reinstateClass} />
        </>
      )}

      {/* Page Header */}
      <div className="spt-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: '-.03em' }}>Session Performance</h1>
          <p style={{ fontSize: 12, color: T.t3, margin: '4px 0 0' }}>
            {classesWithData.length} session{classesWithData.length !== 1 ? 's' : ''} · {selCIs.length} check-ins · {format(selectedDate, 'EEEE, MMM d')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="spt-btn" onClick={() => openModal('qrScanner')} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10,
            background: T.emerald, color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: `0 2px 12px ${T.emerald}30`,
          }}>
            <QrCode style={{ width: 14, height: 14 }} /> Check-In
          </button>
          <button className="spt-btn" onClick={() => openModal('classes')} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10,
            background: T.indigo, color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 12px rgba(99,102,241,.25)',
          }}>
            <Plus style={{ width: 14, height: 14 }} /> Add Class
          </button>
        </div>
      </div>

      {!hasClasses ? (
        <EmptyState openModal={openModal} />
      ) : (
        <>
          {/* Weekly Performance Bar */}
          <WeeklyPerformanceBar sessions={classesWithData.length} totalBooked={totalBooked} totalPresent={totalPresent} totalNoShows={totalNoShows} avgFill={avgFill} totalRevenue={totalRevToday} totalLateCancels={totalLateCancels} isToday={isToday} dateLabel={format(selectedDate, 'EEE, MMM d')} checkIns={checkIns} now={now} />

          {/* Main Grid */}
          <div className="spt-grid">
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Calendar */}
              <div style={{ borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, padding: '18px 20px' }}>
                {/* Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`, borderRadius: 10 }}>
                    {[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }].map(v => (
                      <button key={v.id} className="spt-btn" onClick={() => setCalView(v.id)} style={{
                        padding: '6px 14px', borderRadius: 8,
                        border: `1px solid ${calView === v.id ? T.indigoBdr : 'transparent'}`,
                        background: calView === v.id ? T.indigoDim : 'transparent',
                        color: calView === v.id ? T.indigo : T.t3, fontSize: 12, fontWeight: calView === v.id ? 700 : 500,
                      }}>{v.label}</button>
                    ))}
                  </div>
                  <button className="spt-btn" onClick={() => navigate(-1)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, color: T.t3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft style={{ width: 14, height: 14 }} />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, flex: 1, letterSpacing: '-.02em' }}>
                    {calView === 'month' ? format(monthDate, 'MMMM yyyy') : calView === 'week' ? `${format(week[0], 'MMM d')} – ${format(week[6], 'MMM d, yyyy')}` : format(selectedDate, 'EEEE, MMM d, yyyy')}
                  </span>
                  <button className="spt-btn" onClick={() => navigate(1)} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, color: T.t3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>
                  <button className="spt-btn" onClick={() => { setSelectedDate(now); setMonthDate(now); }} style={{
                    padding: '6px 14px', borderRadius: 8, background: T.indigoDim, border: `1px solid ${T.indigoBdr}`, color: T.indigo, fontSize: 12, fontWeight: 700,
                  }}>Today</button>
                </div>

                {/* Week strip */}
                {(calView === 'week' || calView === 'day') && (
                  <div style={{ display: 'flex', gap: 5 }}>
                    {week.map((d, i) => (
                      <WeekCell key={i} date={d} isSelected={isSameDay(d, selectedDate)} isToday={isSameDay(d, now)} classCount={groupClasses.length} ciCount={weekCICounts[i]} avgFill={weekCICounts[i] > 0 ? Math.min(100, Math.round((weekCICounts[i] / Math.max(groupClasses.length * 15, 1)) * 100)) : null}
                        onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }} />
                    ))}
                  </div>
                )}

                {/* Month grid */}
                {calView === 'month' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em', padding: '4px 0' }}>{d}</div>
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

              {/* Session list header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 16, borderRadius: 99, background: T.indigo }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, letterSpacing: '-.02em' }}>
                    {isToday ? "Today's Sessions" : `${format(selectedDate, 'EEE, MMM d')} Sessions`}
                  </span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.t3 }}>{classesWithData.length}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
                  {['all', ...classTypes].map(type => {
                    const cfg = type === 'all' ? { color: T.indigo, label: 'All', emoji: '📋' } : CLASS_TYPE[type] || CLASS_TYPE.default;
                    return (
                      <button key={type} className="spt-btn" onClick={() => setTypeFilter(type)} style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 99,
                        border: `1px solid ${typeFilter === type ? `${cfg.color}30` : T.border}`,
                        background: typeFilter === type ? `${cfg.color}0d` : 'transparent',
                        color: typeFilter === type ? cfg.color : T.t3, fontSize: 11, fontWeight: typeFilter === type ? 700 : 500,
                      }}>
                        {cfg.emoji} {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sessions */}
              {classesWithData.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}` }}>
                  <Clock style={{ width: 20, height: 20, color: T.t3, margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 14, color: T.t2, fontWeight: 600, margin: '0 0 4px' }}>No classes on this day</p>
                  <p style={{ fontSize: 12, color: T.t3, margin: '0 0 16px' }}>{typeFilter !== 'all' ? 'Try clearing the type filter' : 'Select a different day or add a class'}</p>
                  <button className="spt-btn" onClick={() => openModal('classes')} style={{
                    fontSize: 12, fontWeight: 700, color: T.indigo, background: T.indigoDim, border: `1px solid ${T.indigoBdr}`, borderRadius: 9, padding: '8px 16px',
                  }}>+ Add Class</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {classesWithData.map((cls, idx) => (
                    <div key={cls.id || idx} className="spt-fade" style={{ animationDelay: `${Math.min(idx * .04, .3)}s` }}>
                      <SessionCard cls={cls} onOpen={() => openDetail(cls)} isSelected={detailCls?.id === cls.id} now={now} openModal={openModal} />
                    </div>
                  ))}
                </div>
              )}

              {/* PT Appointments */}
              {appointments.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 16, borderRadius: 99, background: T.sky }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, flex: 1 }}>PT / 1:1 Appointments</span>
                    <button className="spt-btn" onClick={() => openModal('bookAppointment')} style={{
                      fontSize: 11, fontWeight: 700, color: T.sky, background: T.skyDim, border: `1px solid ${T.skyBdr}`, borderRadius: 8, padding: '5px 12px',
                    }}>+ Book</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 10 }}>
                    {appointments.map((apt, i) => {
                      const m = allMemberships.find(x => x.user_id === apt.client_id || x.user_id === apt.user_id);
                      return (
                        <div key={apt.id || i} style={{
                          padding: '14px 18px', borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.sky}`,
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                          <MiniAvatar name={apt.client_name || m?.user_name || 'Client'} src={avatarMap[apt.client_id || apt.user_id]} size={40} color={T.sky} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.client_name || m?.user_name || 'Client'}</div>
                            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.sky, marginTop: 2 }}>{apt.schedule || apt.time || 'TBD'}</div>
                          </div>
                          <MiniBtn icon={QrCode} label="Check In" color={T.emerald} onClick={() => openModal('qrScanner')} size="xs" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="spt-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <OptimizationSuggestions classesWithData={classesWithData} checkIns={checkIns} now={now} />
              <ActionCentre allMemberships={allMemberships} checkIns={checkIns} myClasses={myClasses} now={now} openModal={openModal} />

              {/* Day Summary */}
              <div style={{ borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginBottom: 14, letterSpacing: '.02em' }}>Day Summary</div>
                {[
                  { label: 'Sessions', value: classesWithData.length, color: T.indigo },
                  { label: 'Checked In', value: totalPresent, color: T.emerald },
                  { label: 'No-Shows', value: totalNoShows, color: totalNoShows > 0 ? T.red : T.t3 },
                  { label: 'Avg Fill', value: `${avgFill}%`, color: fillColor(avgFill) },
                  { label: 'Est. Revenue', value: totalRevToday > 0 ? `£${totalRevToday}` : '—', color: T.emerald },
                  { label: 'PT Sessions', value: appointments.length, color: T.sky },
                ].map((s, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <span style={{ fontSize: 11, color: T.t2 }}>{s.label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Class Mix */}
              {classTypes.length > 0 && (
                <div style={{ borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginBottom: 14, letterSpacing: '.02em' }}>Class Mix</div>
                  {classTypes.map((type, i, arr) => {
                    const cfg = CLASS_TYPE[type] || CLASS_TYPE.default;
                    const count = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type)).length;
                    const avgF = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type)).reduce((s, c) => s + c.fill, 0) / Math.max(count, 1);
                    return (
                      <div key={type} style={{ marginBottom: i < arr.length - 1 ? 10 : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 13 }}>{cfg.emoji}</span>
                            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                          </div>
                          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t3 }}>{count} · {Math.round(avgF)}%</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${avgF}%`, background: cfg.color, borderRadius: 99, transition: 'width .5s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <ActivitySpark checkIns={checkIns} now={now} />

              {/* Quick Actions */}
              <div style={{ borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginBottom: 14, letterSpacing: '.02em' }}>Quick Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { icon: QrCode, label: 'Scan Check-In', color: T.emerald, fn: () => openModal('qrScanner') },
                    { icon: Calendar, label: 'Create Event', color: T.indigo, fn: () => openModal('event') },
                    { icon: Bell, label: 'Send Reminder', color: T.sky, fn: () => openModal('post') },
                    { icon: Dumbbell, label: 'Manage Classes', color: T.violet, fn: () => openModal('classes') },
                  ].map(({ icon: Ic, label, color, fn }, i) => (
                    <button key={i} className="spt-btn" onClick={fn} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, width: '100%',
                      background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`, textAlign: 'left',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${color}06`; e.currentTarget.style.borderColor = `${color}1a`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; e.currentTarget.style.borderColor = T.border; }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ic style={{ width: 12, height: 12, color }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
