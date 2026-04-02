/**
 * TabCoachSchedule — Session Performance Tool
 * £500M SaaS-grade redesign
 *
 * Typography: Plus Jakarta Sans (UI) + JetBrains Mono (data)
 * Aesthetic: Ultra-refined luxury dark SaaS — think Vercel × Linear × Stripe
 *
 * Visual upgrades:
 *   - Gradient mesh + grain texture background
 *   - Glass-morphism card system with gradient borders
 *   - SVG circular progress ring for fill rate
 *   - Avatar cluster stacks on session cards
 *   - Animated capacity bars with gradient fills
 *   - Premium KPI strip with trend deltas
 *   - Timeline session cards with color accent rails
 *   - Refined sidebar with numbered optimization list
 *   - Polished typography hierarchy throughout
 *   - Directional shadows and depth system
 *   - Hover states with subtle lifts and glow
 *   - Live pulse indicator for today
 *   - Revenue sparkline in activity panel
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  Megaphone, Play, Layers, Radio,
} from 'lucide-react';

// ─── CSS INJECTION ────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('spt-css-v2')) {
  const s = document.createElement('style');
  s.id = 'spt-css-v2';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .spt {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Animations */
    @keyframes sptFadeUp   { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
    @keyframes sptFadeIn   { from { opacity:0 } to { opacity:1 } }
    @keyframes sptSlideR   { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:none } }
    @keyframes sptPulse    { 0%,100% { opacity:.5; transform:scale(1) } 50% { opacity:1; transform:scale(1.15) } }
    @keyframes sptRing     { 0%,100% { box-shadow:0 0 0 0 rgba(99,102,241,.0) } 50% { box-shadow:0 0 0 6px rgba(99,102,241,.08) } }
    @keyframes sptGreenRing { 0%,100% { box-shadow:0 0 0 0 rgba(16,217,160,.0) } 50% { box-shadow:0 0 0 5px rgba(16,217,160,.1) } }
    @keyframes sptBarFill  { from { width:0 } to { width:var(--w) } }
    @keyframes sptShimmer  { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
    @keyframes sptFloat    { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-3px) } }

    .spt-fade  { animation: sptFadeUp .4s cubic-bezier(.16,1,.3,1) both; }
    .spt-fadein { animation: sptFadeIn .3s ease both; }
    .spt-slide { animation: sptSlideR .3s cubic-bezier(.16,1,.3,1) both; }

    /* Buttons */
    .spt-btn {
      font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer; outline: none;
      transition: all .15s cubic-bezier(.4,0,.2,1);
      border: none; display: inline-flex; align-items: center; justify-content: center;
    }
    .spt-btn:active { transform: scale(.96); }

    /* Cards */
    .spt-card {
      transition: transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s, border-color .2s;
    }
    .spt-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0,0,0,.4), 0 0 0 1px rgba(255,255,255,.06) !important;
    }
    .spt-card:hover .spt-reveal { opacity:1; pointer-events:auto; transform:none; }

    .spt-reveal {
      opacity:0; pointer-events:none;
      transform: translateY(4px);
      transition: all .18s cubic-bezier(.16,1,.3,1);
    }

    /* Inputs */
    .spt-input {
      width: 100%;
      background: rgba(255,255,255,.025);
      border: 1px solid rgba(255,255,255,.07);
      color: #e2e8f0;
      font-size: 13px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      outline: none; border-radius: 10px; padding: 10px 14px;
      transition: all .15s;
    }
    .spt-input:focus {
      border-color: rgba(99,102,241,.45);
      background: rgba(255,255,255,.035);
      box-shadow: 0 0 0 3px rgba(99,102,241,.1), inset 0 1px 0 rgba(255,255,255,.03);
    }
    .spt-input::placeholder { color: rgba(148,163,184,.35); }

    /* Layout */
    .spt-grid { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 20px; align-items: start; }
    .spt-kpi-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 12px; }

    @media (max-width: 1200px) { .spt-kpi-grid { grid-template-columns: repeat(3,1fr); } }
    @media (max-width: 1024px) {
      .spt-grid { grid-template-columns: 1fr !important; }
      .spt-sidebar-col { display: none !important; }
      .spt-kpi-grid { grid-template-columns: repeat(2,1fr); }
    }
    @media (max-width: 540px) { .spt-kpi-grid { grid-template-columns: 1fr; } }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.14); }

    /* Gradient border trick */
    .spt-grad-border {
      position: relative;
      border: none !important;
    }
    .spt-grad-border::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(135deg, rgba(99,102,241,.25), rgba(255,255,255,.06), rgba(16,217,160,.12));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }

    /* Live dot */
    .spt-live { animation: sptPulse 2s ease infinite; }

    /* Capacity bar fill animation */
    .spt-bar-fill {
      animation: sptBarFill .8s cubic-bezier(.16,1,.3,1) both;
      animation-delay: .2s;
    }

    /* Ring animation */
    .spt-ring-glow { animation: sptGreenRing 3s ease infinite; }
    .spt-ring-glow-indigo { animation: sptRing 3s ease infinite; }
  `;
  document.head.appendChild(s);
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  // Backgrounds
  bg:      '#030609',
  bgMesh:  `linear-gradient(135deg, #030609 0%, #04060e 100%)`,
  surface: '#080d1a',
  card:    '#0b1120',
  cardH:   '#0e1528',
  glass:   'rgba(255,255,255,.028)',

  // Borders
  border:  'rgba(255,255,255,.065)',
  borderH: 'rgba(255,255,255,.1)',
  borderA: 'rgba(255,255,255,.14)',

  // Text
  t1: '#f1f5f9', t2: '#94a3b8', t3: '#475569', t4: '#1e293b',

  // Accents
  indigo:    '#6366f1',
  indigoBr:  '#818cf8',
  indigoDim: 'rgba(99,102,241,.08)',
  indigoBdr: 'rgba(99,102,241,.2)',
  indigoGlow:'rgba(99,102,241,.15)',

  emerald:    '#10d9a0',
  emeraldDim: 'rgba(16,217,160,.08)',
  emeraldBdr: 'rgba(16,217,160,.18)',

  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,.08)',
  amberBdr: 'rgba(245,158,11,.2)',

  red:    '#f43f5e',
  redDim: 'rgba(244,63,94,.08)',
  redBdr: 'rgba(244,63,94,.2)',

  sky:    '#38bdf8',
  skyDim: 'rgba(56,189,248,.08)',
  skyBdr: 'rgba(56,189,248,.18)',

  violet:    '#a78bfa',
  violetDim: 'rgba(167,139,250,.08)',
  violetBdr: 'rgba(167,139,250,.18)',

  // Typography
  mono: "'JetBrains Mono', monospace",
  sans: "'Plus Jakarta Sans', sans-serif",

  // Shadows
  shadow:   '0 4px 24px rgba(0,0,0,.35)',
  shadowLg: '0 12px 48px rgba(0,0,0,.5)',
  shadowXl: '0 24px 64px rgba(0,0,0,.65)',
};

// ─── CLASS TYPE REGISTRY ──────────────────────────────────────────────────────
const CLASS_TYPE = {
  hiit:       { color: '#f87171', grad: 'linear-gradient(135deg,#f87171,#fb923c)', label: 'HIIT',       emoji: '🔥' },
  yoga:       { color: '#34d399', grad: 'linear-gradient(135deg,#34d399,#6ee7b7)', label: 'Yoga',       emoji: '🧘' },
  spin:       { color: '#38bdf8', grad: 'linear-gradient(135deg,#38bdf8,#818cf8)', label: 'Spin',       emoji: '🚴' },
  strength:   { color: '#fb923c', grad: 'linear-gradient(135deg,#fb923c,#f59e0b)', label: 'Strength',   emoji: '💪' },
  pilates:    { color: '#e879f9', grad: 'linear-gradient(135deg,#e879f9,#a78bfa)', label: 'Pilates',    emoji: '🌸' },
  boxing:     { color: '#fbbf24', grad: 'linear-gradient(135deg,#fbbf24,#f97316)', label: 'Boxing',     emoji: '🥊' },
  crossfit:   { color: '#f97316', grad: 'linear-gradient(135deg,#f97316,#ef4444)', label: 'CrossFit',   emoji: '⚡' },
  cardio:     { color: '#f472b6', grad: 'linear-gradient(135deg,#f472b6,#f87171)', label: 'Cardio',     emoji: '❤️' },
  functional: { color: '#a78bfa', grad: 'linear-gradient(135deg,#a78bfa,#6366f1)', label: 'Functional', emoji: '🎯' },
  personal_training: { color: '#38bdf8', grad: 'linear-gradient(135deg,#38bdf8,#6366f1)', label: 'PT', emoji: '👤' },
  default:    { color: '#a78bfa', grad: 'linear-gradient(135deg,#a78bfa,#6366f1)', label: 'Class',      emoji: '🏋️' },
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
  if (pct >= 80) return T.emerald;
  if (pct >= 50) return T.indigo;
  if (pct >= 30) return T.amber;
  return T.red;
}

function fillLabel(pct) {
  if (pct >= 90) return { label: 'At Capacity', color: T.emerald };
  if (pct >= 70) return { label: 'Strong',       color: T.emerald };
  if (pct >= 40) return { label: 'Moderate',     color: T.indigo  };
  return                 { label: 'Underbooked',  color: T.red     };
}

// ─── SVG CIRCULAR RING ────────────────────────────────────────────────────────
function FillRing({ value = 0, size = 72, stroke = 5, color = T.emerald, bg = 'rgba(255,255,255,.04)' }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)', filter: `drop-shadow(0 0 4px ${color}60)` }}
      />
    </svg>
  );
}

// ─── AVATAR CLUSTER ───────────────────────────────────────────────────────────
function AvatarCluster({ members = [], avatarMap = {}, max = 4, size = 24 }) {
  const shown = members.slice(0, max);
  const extra = members.length - max;
  const colors = [T.indigo, T.violet, T.emerald, T.sky, T.amber];
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((m, i) => {
        const initials = (m.user_name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
        const color = colors[i % colors.length];
        return (
          <div key={m.user_id || i} title={m.user_name} style={{
            width: size, height: size, borderRadius: '50%',
            border: `2px solid ${T.card}`,
            marginLeft: i === 0 ? 0 : -size * 0.38,
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.32, fontWeight: 700, color, zIndex: shown.length - i, position: 'relative',
            flexShrink: 0,
            boxShadow: `0 0 0 1px ${color}20`,
          }}>
            {avatarMap[m.user_id]
              ? <img src={avatarMap[m.user_id]} alt={m.user_name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : initials}
          </div>
        );
      })}
      {extra > 0 && (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          border: `2px solid ${T.card}`,
          marginLeft: -size * 0.38,
          background: 'rgba(255,255,255,.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.3, fontWeight: 700, color: T.t3,
          zIndex: 0, flexShrink: 0,
        }}>+{extra}</div>
      )}
    </div>
  );
}

// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────
function Chip({ children, color = T.t3, bg, border, dot, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 700, color,
      background: bg || `${color}0d`,
      border: `1px solid ${border || `${color}20`}`,
      borderRadius: 6, padding: '3px 8px',
      letterSpacing: '.04em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', lineHeight: '16px', ...style,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />}
      {children}
    </span>
  );
}

function StatChip({ icon: Ic, label, count, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, color,
      background: `${color}0c`, border: `1px solid ${color}1c`,
      borderRadius: 7, padding: '4px 9px',
    }}>
      {Ic && <Ic style={{ width: 9, height: 9 }} />}
      <span style={{ fontFamily: T.mono, fontWeight: 700 }}>{count}</span>
      <span style={{ color: `${color}99`, fontWeight: 500, fontSize: 10 }}>{label}</span>
    </span>
  );
}

function MiniBtn({ icon: Ic, label, color, onClick, size = 'sm' }) {
  return (
    <button className="spt-btn" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: size === 'xs' ? '4px 8px' : '7px 13px', borderRadius: 8,
      background: `${color}0a`, border: `1px solid ${color}1c`,
      color, fontSize: size === 'xs' ? 10 : 11, fontWeight: 700,
      whiteSpace: 'nowrap', transition: 'all .15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.borderColor = `${color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}0a`; e.currentTarget.style.borderColor = `${color}1c`; }}>
      {Ic && <Ic style={{ width: size === 'xs' ? 10 : 11, height: size === 'xs' ? 10 : 11 }} />}
      {label}
    </button>
  );
}

function SectionLabel({ icon: Ic, color = T.indigo, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}0d`, border: `1px solid ${color}1c`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Ic && <Ic style={{ width: 12, height: 12, color }} />}
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.t1, letterSpacing: '-.01em' }}>{children}</span>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Cancel Class', color = T.red }) {
  return (
    <div className="spt-fadein" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)' }}>
      <div className="spt-fade" style={{
        background: `linear-gradient(135deg, ${T.card}, ${T.surface})`,
        border: `1px solid ${color}25`, borderRadius: 20, padding: 32,
        maxWidth: 380, width: '90%', boxShadow: `${T.shadowXl}, 0 0 0 1px rgba(255,255,255,.04)`,
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: `${color}0d`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          <AlertCircle style={{ width: 22, height: 22, color }} />
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: T.t1, textAlign: 'center', margin: '0 0 22px', lineHeight: 1.65 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="spt-btn" onClick={onCancel} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'rgba(255,255,255,.04)', border: `1px solid ${T.border}`, color: T.t2, fontSize: 12, fontWeight: 700 }}>Go Back</button>
          <button className="spt-btn" onClick={onConfirm} style={{ flex: 1, padding: 11, borderRadius: 10, background: `${color}12`, border: `1px solid ${color}28`, color, fontSize: 12, fontWeight: 700 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, color = T.indigo, icon: Ic, accent, children, glowing, delay = 0 }) {
  return (
    <div className={`spt-fade ${glowing ? 'spt-ring-glow-indigo' : ''}`} style={{
      padding: '20px 22px', borderRadius: 16,
      background: `linear-gradient(145deg, ${T.card} 0%, ${T.surface} 100%)`,
      border: `1px solid ${T.border}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,.03), ${T.shadow}`,
      position: 'relative', overflow: 'hidden',
      animationDelay: `${delay}s`,
    }}>
      {/* Accent glow top-right */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`, pointerEvents: 'none' }} />
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 20, right: 20, height: 1, background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.t3, letterSpacing: '.07em', textTransform: 'uppercase' }}>{title}</span>
        {Ic && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}0d`, border: `1px solid ${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic style={{ width: 12, height: 12, color }} />
          </div>
        )}
      </div>

      {children || (
        <>
          <div style={{ fontFamily: T.mono, fontSize: 38, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-.05em', marginBottom: 8 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.4 }}>{sub}</div>}
        </>
      )}
      {accent && <div style={{ marginTop: 12 }}>{accent}</div>}
    </div>
  );
}

// ─── WEEKLY PERFORMANCE BAR ───────────────────────────────────────────────────
function WeeklyPerformanceBar({ sessions, totalBooked, totalPresent, totalNoShows, avgFill, totalRevenue, totalLateCancels, isToday, dateLabel, checkIns, now, openModal }) {
  const thisWeekCI = checkIns.filter(c => (now - new Date(c.check_in_date)) < 7 * 864e5).length;
  const lastWeekCI = checkIns.filter(c => { const d = now - new Date(c.check_in_date); return d >= 7 * 864e5 && d < 14 * 864e5; }).length;
  const weekDelta = thisWeekCI - lastWeekCI;
  const weekTrend = weekDelta > 2 ? 'up' : weekDelta < -2 ? 'down' : 'flat';
  const fc = fillColor(avgFill);

  return (
    <div className="spt-kpi-grid" style={{ marginBottom: 24 }}>
      {/* Sessions Today */}
      <KpiCard
        title={isToday ? 'Today' : dateLabel}
        color={T.indigo}
        icon={Calendar}
        delay={0}
        glowing={isToday}
        accent={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isToday && (
              <>
                <span className="spt-live" style={{ width: 7, height: 7, borderRadius: '50%', background: T.emerald, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: T.emerald, fontWeight: 600 }}>Live</span>
              </>
            )}
            {!isToday && <span style={{ fontSize: 10, color: T.t3 }}>Scheduled</span>}
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontFamily: T.mono, fontSize: 42, fontWeight: 700, color: T.indigo, lineHeight: 1, letterSpacing: '-.05em' }}>{sessions}</span>
          <span style={{ fontSize: 13, color: T.t3, fontWeight: 500 }}>sessions</span>
        </div>
      </KpiCard>

      {/* Fill Rate */}
      <KpiCard title="Fill Rate" color={fc} icon={Activity} delay={.05}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <FillRing value={avgFill} size={68} stroke={5} color={fc} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: fc, lineHeight: 1 }}>{avgFill}</span>
              <span style={{ fontSize: 8, color: T.t3, fontWeight: 600 }}>%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: T.t2, fontWeight: 600, marginBottom: 4 }}>{fillLabel(avgFill).label}</div>
            <div style={{ fontSize: 10, color: T.t3 }}>avg fill rate</div>
          </div>
        </div>
      </KpiCard>

      {/* Checked In */}
      <KpiCard title="Checked In" color={T.emerald} icon={UserCheck} delay={.1}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: T.mono, fontSize: 42, fontWeight: 700, color: T.emerald, lineHeight: 1, letterSpacing: '-.05em' }}>{totalPresent}</span>
          <span style={{ fontSize: 14, color: T.t3, fontWeight: 500 }}>/ {totalBooked}</span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
          <div className="spt-bar-fill" style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${T.emerald}, ${T.sky})`, '--w': totalBooked > 0 ? `${(totalPresent / totalBooked) * 100}%` : '0%', width: totalBooked > 0 ? `${(totalPresent / totalBooked) * 100}%` : '0%' }} />
        </div>
      </KpiCard>

      {/* No-Shows */}
      <KpiCard
        title="No-Shows"
        color={totalNoShows > 0 ? T.red : T.t3}
        icon={UserX}
        delay={.15}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <span style={{ fontFamily: T.mono, fontSize: 42, fontWeight: 700, color: totalNoShows > 0 ? T.red : T.t3, lineHeight: 1, letterSpacing: '-.05em' }}>{totalNoShows}</span>
        </div>
        {totalLateCancels > 0
          ? <button className="spt-btn" onClick={() => openModal?.('post')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <AlertTriangle style={{ width: 9, height: 9, color: T.amber }} />
              <span style={{ fontSize: 10, color: T.amber, fontWeight: 600 }}>{totalLateCancels} late cancel{totalLateCancels > 1 ? 's' : ''}</span>
            </button>
          : totalNoShows > 0
          ? <button className="spt-btn" onClick={() => openModal?.('post')} style={{ fontSize: 11, color: T.red, fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Follow up →</button>
          : <span style={{ fontSize: 11, color: T.t3 }}>Perfect attendance</span>
        }
      </KpiCard>

      {/* vs Last Week */}
      <KpiCard title="vs Last Week" color={weekTrend === 'up' ? T.emerald : weekTrend === 'down' ? T.red : T.t3} icon={TrendingUp} delay={.2}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {weekTrend === 'up'   && <ArrowUpRight   style={{ width: 20, height: 20, color: T.emerald }} />}
          {weekTrend === 'down' && <ArrowDownRight style={{ width: 20, height: 20, color: T.red }} />}
          {weekTrend === 'flat' && <Minus          style={{ width: 20, height: 20, color: T.t3 }} />}
          <span style={{ fontFamily: T.mono, fontSize: 38, fontWeight: 700, lineHeight: 1, letterSpacing: '-.05em', color: weekTrend === 'up' ? T.emerald : weekTrend === 'down' ? T.red : T.t3 }}>
            {weekDelta > 0 ? '+' : ''}{weekDelta}
          </span>
        </div>
        <span style={{ fontSize: 11, color: T.t3 }}>check-ins this week</span>
      </KpiCard>
    </div>
  );
}

// ─── SESSION CARD ─────────────────────────────────────────────────────────────
function SessionCard({ cls, onOpen, isSelected, now, openModal, avatarMap = {} }) {
  const c = cls.typeCfg.color;
  const booked = cls.booked.length || cls.attended.length;
  const fc = fillColor(cls.fill);
  const fl = fillLabel(cls.fill);
  const noShows = Math.max(0, cls.booked.length - cls.attended.length);

  return (
    <div
      className="spt-card"
      onClick={onOpen}
      style={{
        borderRadius: 16, overflow: 'hidden',
        background: isSelected
          ? `linear-gradient(145deg, ${c}05, ${T.card})`
          : `linear-gradient(145deg, ${T.card}, ${T.surface})`,
        border: `1px solid ${isSelected ? `${c}22` : T.border}`,
        boxShadow: isSelected ? `0 0 0 1px ${c}10, ${T.shadow}` : T.shadow,
        opacity: cls.isCancelled ? .55 : 1,
        cursor: 'pointer',
      }}
    >
      {/* Color rail + gradient fade */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: 4, flexShrink: 0, background: cls.isCancelled ? T.red : cls.typeCfg.grad, borderRadius: '0 0 0 0', minHeight: '100%' }} />

        <div style={{ flex: 1, padding: '18px 20px 18px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {/* Icon */}
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `${c}0d`, border: `1px solid ${c}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: `inset 0 1px 0 ${c}10`,
            }}>
              {cls.typeCfg.emoji}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Row 1: name + chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: cls.isCancelled ? T.t3 : T.t1, letterSpacing: '-.025em' }}>
                  {cls.name}
                </span>
                <Chip color={c} dot>{cls.typeCfg.label}</Chip>
                {cls.isCancelled && <Chip color={T.red} dot>Cancelled</Chip>}
                <Chip color={fl.color} dot>{fl.label}</Chip>
              </div>

              {/* Row 2: time + meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                {cls.scheduleStr && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: `${c}0c`, border: `1px solid ${c}18` }}>
                    <Clock style={{ width: 10, height: 10, color: c }} />
                    <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: c }}>{cls.scheduleStr}</span>
                  </div>
                )}
                {cls.duration_minutes && (
                  <span style={{ fontSize: 12, color: T.t3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: T.t4, display: 'inline-block' }} />
                    {cls.duration_minutes} min
                  </span>
                )}
                {cls.room && (
                  <span style={{ fontSize: 12, color: T.t3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin style={{ width: 10, height: 10 }} />
                    {cls.room}
                  </span>
                )}
              </div>

              {/* Row 3: capacity bar */}
              {!cls.isCancelled && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AvatarCluster members={cls.booked} avatarMap={avatarMap} max={4} size={22} />
                      <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: fc }}>
                        {booked} <span style={{ color: T.t3, fontWeight: 400 }}>/ {cls.capacity}</span>
                      </span>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: fc }}>{cls.fill}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.05)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%', borderRadius: 99, width: `${cls.fill}%`,
                      background: cls.fill >= 80
                        ? `linear-gradient(90deg, ${T.emerald}, ${T.sky})`
                        : cls.fill >= 50
                        ? `linear-gradient(90deg, ${T.indigo}, ${T.violet})`
                        : cls.fill >= 30
                        ? `linear-gradient(90deg, ${T.amber}, #f97316)`
                        : `linear-gradient(90deg, ${T.red}, #f97316)`,
                      transition: 'width .8s cubic-bezier(.16,1,.3,1)',
                      boxShadow: `0 0 8px ${fc}40`,
                    }} />
                  </div>
                </div>
              )}

              {/* Row 4: stat chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cls.attended.length > 0 && <StatChip icon={Check} count={cls.attended.length} label="checked in" color={T.emerald} />}
                {noShows > 0 && <StatChip icon={UserX} count={noShows} label="no-show" color={T.red} />}
                {cls.waitlist.length > 0 && <StatChip icon={Clock} count={cls.waitlist.length} label="waitlist" color={T.amber} />}
                {cls.revenue > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: T.emerald, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, borderRadius: 7, padding: '4px 9px' }}>
                    <DollarSign style={{ width: 9, height: 9 }} />
                    <span style={{ fontFamily: T.mono }}>£{cls.revenue}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
              <button
                className="spt-btn"
                onClick={e => { e.stopPropagation(); onOpen(); }}
                style={{
                  padding: '9px 16px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${T.emerald}, #0ea572)`,
                  color: '#fff', fontSize: 11, fontWeight: 700, gap: 6,
                  boxShadow: `0 2px 12px ${T.emerald}30`,
                  whiteSpace: 'nowrap',
                }}
              >
                <QrCode style={{ width: 12, height: 12 }} /> Check-In
              </button>
              <div className="spt-reveal" style={{ display: 'flex', gap: 5 }}>
                <button className="spt-btn" onClick={e => { e.stopPropagation(); openModal('post', { classId: cls.id }); }} style={{
                  flex: 1, padding: '6px 8px', borderRadius: 8,
                  background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
                  color: T.indigo, fontSize: 9, fontWeight: 700, gap: 3,
                }}>
                  <Megaphone style={{ width: 9, height: 9 }} /> Promote
                </button>
                <button className="spt-btn" onClick={e => { e.stopPropagation(); openModal('post', { classId: cls.id }); }} style={{
                  flex: 1, padding: '6px 8px', borderRadius: 8,
                  background: T.skyDim, border: `1px solid ${T.skyBdr}`,
                  color: T.sky, fontSize: 9, fontWeight: 700, gap: 3,
                }}>
                  <MessageCircle style={{ width: 9, height: 9 }} /> Msg
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OPTIMIZATION PANEL ───────────────────────────────────────────────────────
function OptimizationSuggestions({ classesWithData, checkIns, now, openModal }) {
  const suggestions = useMemo(() => {
    const items = [];
    const underbooked = classesWithData.filter(c => c.fill < 40 && !c.isCancelled);
    if (underbooked.length > 0) items.push({ icon: AlertTriangle, color: T.red, text: `${underbooked.length} session${underbooked.length > 1 ? 's' : ''} underbooked — promote or reschedule`, action: () => openModal('post') });
    const full = classesWithData.filter(c => c.fill >= 90 && !c.isCancelled);
    if (full.length > 0) items.push({ icon: TrendingUp, color: T.sky, text: `${full.length} session${full.length > 1 ? 's' : ''} at capacity — add a second slot`, action: () => openModal('classes') });
    const withWaitlist = classesWithData.filter(c => c.waitlist.length > 0);
    if (withWaitlist.length > 0) {
      const total = withWaitlist.reduce((s, c) => s + c.waitlist.length, 0);
      items.push({ icon: Users, color: T.violet, text: `${total} member${total > 1 ? 's' : ''} on waitlists — demand exceeds supply`, action: () => openModal('promoteWaitlist') });
    }
    items.push({ icon: Lightbulb, color: T.amber, text: 'Consistent schedules retain 2.8× more members than sporadic ones' });
    items.push({ icon: Sparkles, color: T.indigo, text: 'Send pre-class reminders 2hr before to reduce no-shows by up to 40%', action: () => openModal('post') });
    return items.slice(0, 5);
  }, [classesWithData, checkIns, now]);

  return (
    <div style={{ borderRadius: 16, background: `linear-gradient(145deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
        <SectionLabel icon={Target} color={T.indigo}>Optimization</SectionLabel>
      </div>
      <div style={{ padding: '10px 14px 14px' }}>
        {suggestions.map((s, i) => {
          const Ic = s.icon;
          return (
            <div key={i} onClick={s.action} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 8px', borderRadius: 10,
              transition: 'background .12s',
              cursor: s.action ? 'pointer' : 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: `${s.color}0d`, border: `1px solid ${s.color}1a`, flexShrink: 0 }}>
                <Ic style={{ width: 10, height: 10, color: s.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: s.color, marginTop: 1, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ fontSize: 11, color: T.t2, lineHeight: 1.6 }}>{s.text}</span>
                </div>
              </div>
              {s.action && <ArrowRight style={{ width: 10, height: 10, color: T.t4, flexShrink: 0, marginTop: 4 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CALENDAR WEEK CELL ───────────────────────────────────────────────────────
function WeekCell({ date, isSelected, isToday, classCount, ciCount, avgFill, onClick }) {
  const fc = avgFill !== null ? fillColor(avgFill) : T.t4;
  return (
    <button className="spt-btn" onClick={onClick} style={{
      flex: 1, padding: '12px 6px 10px', borderRadius: 12, textAlign: 'center',
      background: isSelected
        ? `linear-gradient(135deg, ${T.indigoDim}, rgba(99,102,241,.12))`
        : isToday
        ? 'rgba(99,102,241,.04)'
        : 'transparent',
      border: isSelected
        ? `1px solid ${T.indigoBdr}`
        : isToday
        ? '1px solid rgba(99,102,241,.14)'
        : `1px solid ${T.border}`,
      transition: 'all .15s',
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(99,102,241,.04)' : 'transparent'; }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: isSelected ? T.indigo : T.t3, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>{format(date, 'EEE')}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: isSelected ? T.indigo : isToday ? T.t1 : T.t2, lineHeight: 1, marginBottom: 8, letterSpacing: '-.03em' }}>{format(date, 'd')}</div>
      {classCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 4 }}>
          {Array.from({ length: Math.min(classCount, 3) }, (_, j) => (
            <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? T.indigo : fc, boxShadow: isSelected ? `0 0 4px ${T.indigo}60` : 'none' }} />
          ))}
        </div>
      )}
      {ciCount > 0 && (
        <div style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 600, color: isSelected ? T.indigo : T.t3, background: isSelected ? `${T.indigo}10` : 'rgba(255,255,255,.04)', borderRadius: 4, padding: '1px 4px', display: 'inline-block' }}>
          {ciCount}
        </div>
      )}
      {isToday && !isSelected && (
        <div style={{ position: 'absolute', top: 8, right: 10, width: 5, height: 5, borderRadius: '50%', background: T.emerald, boxShadow: `0 0 6px ${T.emerald}80` }} />
      )}
    </button>
  );
}

// ─── MONTH CELL ───────────────────────────────────────────────────────────────
function MonthCell({ date, isCurrentMonth, isSelected, isToday, classCount, ciCount, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '7px 4px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
      background: isSelected ? T.indigoDim : isToday ? 'rgba(99,102,241,.05)' : 'transparent',
      border: isSelected ? `1px solid ${T.indigoBdr}` : isToday ? '1px solid rgba(99,102,241,.14)' : '1px solid transparent',
      opacity: isCurrentMonth ? 1 : .2, transition: 'all .12s',
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(99,102,241,.05)' : 'transparent'; }}>
      <div style={{ fontSize: 13, fontWeight: isToday || isSelected ? 800 : 500, color: isSelected ? T.indigo : isToday ? T.t1 : T.t2, lineHeight: 1, marginBottom: 4 }}>{format(date, 'd')}</div>
      {classCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
          {Array.from({ length: Math.min(classCount, 3) }, (_, j) => (
            <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? T.indigo : `${T.indigo}50` }} />
          ))}
        </div>
      )}
      {ciCount > 0 && (
        <div style={{ fontFamily: T.mono, fontSize: 8, fontWeight: 700, color: isSelected ? T.indigo : T.t3 }}>{ciCount}</div>
      )}
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
  const fl = fillLabel(cls.fill);
  const fc = fillColor(cls.fill);

  const tabs = [
    { id: 'attendees', label: `Roster`, count: cls.booked.length || cls.attended.length },
    { id: 'checkin', label: `Check-In`, count: totalPresent },
    { id: 'waitlist', label: `Waitlist`, count: cls.waitlist.length },
    { id: 'notes', label: 'Notes', count: null },
  ];

  return (
    <div className="spt-slide" onClick={e => e.stopPropagation()} style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 9000,
      background: `linear-gradient(180deg, ${T.card} 0%, ${T.bg} 100%)`,
      borderLeft: `1px solid ${T.borderA}`,
      display: 'flex', flexDirection: 'column',
      boxShadow: `-32px 0 80px rgba(0,0,0,.7), inset 1px 0 0 rgba(255,255,255,.04)`,
    }}>
      {/* Gradient top rail */}
      <div style={{ height: 3, background: cls.isCancelled ? `linear-gradient(90deg,${T.red},${T.red}44)` : cls.typeCfg.grad, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '20px 24px 18px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `${c}0d`, border: `1px solid ${c}1c`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: `inset 0 1px 0 ${c}10`, flexShrink: 0 }}>{cls.typeCfg.emoji}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.t1, letterSpacing: '-.03em' }}>{cls.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                {cls.scheduleStr && <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: c }}>{cls.scheduleStr}</span>}
                {cls.duration_minutes && <span style={{ fontSize: 11, color: T.t3 }}>· {cls.duration_minutes}min</span>}
                {cls.room && <span style={{ fontSize: 11, color: T.t3, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 9, height: 9 }} />{cls.room}</span>}
              </div>
            </div>
          </div>
          <button className="spt-btn" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.04)', border: `1px solid ${T.border}`, color: T.t3 }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* Capacity fill */}
        <div style={{ marginBottom: 14, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AvatarCluster members={cls.booked} avatarMap={avatarMap || {}} max={5} size={24} />
              <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: fc }}>
                {cls.booked.length || cls.attended.length} <span style={{ color: T.t3, fontWeight: 400 }}>/ {cls.capacity}</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Chip color={fl.color} dot style={{ fontSize: 9 }}>{fl.label}</Chip>
              <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: fc }}>{cls.fill}%</span>
            </div>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${cls.fill}%`, borderRadius: 99, background: `linear-gradient(90deg, ${fc}, ${fc}88)`, transition: 'width .6s' }} />
          </div>
        </div>

        {/* Status chips */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <StatChip icon={Check} count={totalPresent} label="present" color={T.emerald} />
          {noShowList.length > 0 && <StatChip icon={UserX} count={noShowList.length} label="no-show" color={T.red} />}
          {cls.waitlist.length > 0 && <StatChip icon={Clock} count={cls.waitlist.length} label="waiting" color={T.amber} />}
          {cls.lateCancels.length > 0 && <StatChip icon={AlertTriangle} count={cls.lateCancels.length} label="late cancel" color={T.amber} />}
          {cls.isCancelled && <Chip color={T.red} dot>Cancelled</Chip>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 16px', borderBottom: `1px solid ${T.border}`, flexShrink: 0, gap: 2 }}>
        {tabs.map(t => (
          <button key={t.id} className="spt-btn" onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '11px 4px', background: 'none',
            borderBottom: `2px solid ${tab === t.id ? c : 'transparent'}`,
            color: tab === t.id ? c : T.t3,
            fontSize: 11, fontWeight: tab === t.id ? 700 : 500, marginBottom: -1,
            gap: 5, transition: 'all .12s',
          }}>
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: tab === t.id ? c : T.t3, background: tab === t.id ? `${c}15` : 'rgba(255,255,255,.05)', borderRadius: 99, padding: '1px 5px' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Attendees */}
        {tab === 'attendees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {noShowList.length > 0 && (
              <div style={{ padding: '14px 16px', borderRadius: 14, background: T.redDim, border: `1px solid ${T.redBdr}`, borderLeft: `3px solid ${T.red}`, marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserX style={{ width: 11, height: 11 }} />
                  {noShowList.length} No-Show{noShowList.length !== 1 ? 's' : ''}
                </div>
                {noShowList.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < noShowList.length - 1 ? 8 : 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, background: `${T.red}15`, border: `1px solid ${T.red}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.red, flexShrink: 0 }}>
                      {(m.user_name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, color: T.t1, fontWeight: 600, flex: 1 }}>{m.user_name}</span>
                    <MiniBtn icon={MessageCircle} label="Message" color={T.indigo} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    <MiniBtn icon={Calendar} label="Rebook" color={T.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                  </div>
                ))}
              </div>
            )}

            {(cls.booked.length > 0 ? cls.booked : cls.regulars || []).map((m, j) => {
              const isIn = checkedIds.includes(m.user_id) || manualIds.includes(m.user_id);
              const isCxl = (cls.late_cancels || []).some(lc => lc.user_id === m.user_id);
              const rs = calcRS(m.user_id, checkIns, now);
              return (
                <div key={m.user_id || j} style={{
                  padding: '13px 16px', borderRadius: 14,
                  background: isIn ? T.emeraldDim : isCxl ? T.redDim : 'rgba(255,255,255,.02)',
                  border: `1px solid ${isIn ? T.emeraldBdr : isCxl ? T.redBdr : T.border}`,
                  transition: 'all .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: `${isIn ? T.emerald : T.indigo}12`, border: `1px solid ${isIn ? T.emerald : T.indigo}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: isIn ? T.emerald : T.indigo, flexShrink: 0 }}>
                      {(m.user_name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, letterSpacing: '-.01em' }}>{m.user_name || 'Member'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        {rs.daysAgo < 999 && (
                          <span style={{ fontSize: 10, color: rs.daysAgo > 14 ? T.red : rs.daysAgo > 7 ? T.amber : T.t3 }}>
                            Last: {rs.daysAgo === 0 ? 'Today' : `${rs.daysAgo}d ago`}
                          </span>
                        )}
                        <span style={{ fontSize: 9, fontWeight: 700, color: rs.trend === 'up' ? T.emerald : rs.trend === 'down' ? T.red : T.t3, display: 'flex', alignItems: 'center', gap: 2 }}>
                          {rs.trend === 'up' && <ArrowUpRight style={{ width: 9, height: 9 }} />}
                          {rs.trend === 'down' && <ArrowDownRight style={{ width: 9, height: 9 }} />}
                          {rs.trend === 'up' ? 'Improving' : rs.trend === 'down' ? 'Declining' : 'Stable'}
                        </span>
                      </div>
                    </div>
                    <Chip color={isIn ? T.emerald : isCxl ? T.red : T.t2} style={{ fontSize: 9 }}>
                      {isIn ? '✓ Present' : isCxl ? '✗ Cancelled' : 'Booked'}
                    </Chip>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
                    <MiniBtn icon={MessageCircle} label="Message" color={T.indigo} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                    {!isIn && !isCxl && <MiniBtn icon={Check} label="Mark Present" color={T.emerald} onClick={() => onToggle(key, m.user_id)} size="xs" />}
                    <MiniBtn icon={Calendar} label="Rebook" color={T.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                  </div>
                </div>
              );
            })}
            {cls.booked.length === 0 && (!cls.regulars || cls.regulars.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: T.t3, fontSize: 13 }}>
                <Users style={{ width: 24, height: 24, margin: '0 auto 10px', opacity: .3 }} />
                No bookings yet
              </div>
            )}
          </div>
        )}

        {/* Check-In */}
        {tab === 'checkin' && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: T.t3 }} />
                <input className="spt-input" value={rosterQ} onChange={e => setRosterQ(e.target.value)} placeholder="Search members…" style={{ paddingLeft: 32, fontSize: 12 }} />
              </div>
              <MiniBtn icon={CheckCircle} label="All" color={T.emerald} onClick={() => onMarkAll(key)} size="xs" />
              <MiniBtn icon={X} label="Clear" color={T.red} onClick={() => onClearAll(key)} size="xs" />
            </div>
            <div style={{ borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden', background: 'rgba(255,255,255,.01)' }}>
              {filteredRoster.map((m, mi) => {
                const isManual = manualIds.includes(m.user_id);
                const isQR = checkedIds.includes(m.user_id);
                const present = isManual || isQR;
                return (
                  <div key={m.user_id || mi} onClick={() => !isQR && onToggle(key, m.user_id)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                    borderBottom: mi < filteredRoster.length - 1 ? `1px solid ${T.border}` : 'none',
                    cursor: isQR ? 'default' : 'pointer',
                    background: present ? T.emeraldDim : 'transparent',
                    transition: 'background .1s',
                  }}
                    onMouseEnter={e => { if (!present) e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}
                    onMouseLeave={e => { if (!present) e.currentTarget.style.background = 'transparent'; }}>
                    <div style={{
                      width: 19, height: 19, borderRadius: 6, flexShrink: 0,
                      border: `1.5px solid ${present ? T.emerald : 'rgba(255,255,255,.1)'}`,
                      background: present ? T.emerald : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .1s', boxShadow: present ? `0 0 6px ${T.emerald}40` : 'none',
                    }}>
                      {present && <Check style={{ width: 10, height: 10, color: '#fff' }} />}
                    </div>
                    <div style={{ width: 30, height: 30, borderRadius: 10, background: `${present ? T.emerald : T.indigo}12`, border: `1px solid ${present ? T.emerald : T.indigo}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: present ? T.emerald : T.indigo, flexShrink: 0 }}>
                      {(m.user_name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: present ? T.t1 : T.t2 }}>{m.user_name || 'Member'}</span>
                    {isQR && <Chip color={T.emerald} style={{ fontSize: 8, padding: '1px 6px' }}>QR ✓</Chip>}
                    {isManual && !isQR && <Chip color={T.violet} style={{ fontSize: 8, padding: '1px 6px' }}>Manual</Chip>}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.t3, whiteSpace: 'nowrap' }}>{totalPresent} / {filteredRoster.length}</span>
              <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${filteredRoster.length > 0 ? (totalPresent / filteredRoster.length) * 100 : 0}%`, background: `linear-gradient(90deg,${T.emerald},${T.sky})`, borderRadius: 99, transition: 'width .4s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Waitlist */}
        {tab === 'waitlist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cls.waitlist.length === 0 ? (
              <div style={{ padding: '14px 16px', borderRadius: 12, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 13, height: 13, color: T.emerald }} />
                <span style={{ fontSize: 12, color: T.emerald, fontWeight: 600 }}>No one on the waitlist</span>
              </div>
            ) : cls.waitlist.map((w, j) => (
              <div key={w.user_id || j} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.amber}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: T.amberDim, border: `1px solid ${T.amberBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.amber, flexShrink: 0 }}>{j + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.t1 }}>{w.user_name || 'Member'}</div>
                    {w.wait_since && <div style={{ fontSize: 10, color: T.t3, marginTop: 2 }}>Since {format(new Date(w.wait_since), 'MMM d, h:mm a')}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <MiniBtn icon={ArrowUpRight} label="Promote" color={T.emerald} onClick={() => openModal('promoteWaitlist', w)} size="xs" />
                  <MiniBtn icon={Bell} label="Notify" color={T.indigo} onClick={() => openModal('post', { memberId: w.user_id })} size="xs" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Megaphone style={{ width: 10, height: 10, color: T.indigo }} /> Class Announcement
              </div>
              <textarea className="spt-input" value={classAnnounce[key] || ''} onChange={e => onSaveAnnounce(key, e.target.value)} placeholder="Visible to all members before this class…" style={{ minHeight: 80, resize: 'vertical', lineHeight: 1.65 }} />
              <button className="spt-btn" onClick={() => openModal('post', { classId: cls.id, announcement: classAnnounce[key] })} style={{
                marginTop: 8, padding: '9px 16px', borderRadius: 10, gap: 7,
                background: `linear-gradient(135deg, ${T.indigo}, #4f46e5)`,
                color: '#fff', fontSize: 12, fontWeight: 700,
                boxShadow: `0 2px 10px ${T.indigo}30`,
              }}>
                <Send style={{ width: 11, height: 11 }} /> Push to Members
              </button>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pencil style={{ width: 10, height: 10, color: T.violet }} /> Coach Notes (Private)
              </div>
              <textarea className="spt-input" value={notes[key] || ''} onChange={e => onSaveNote(key, e.target.value)} placeholder="Cues, modifications, energy notes, what worked…" style={{ minHeight: 80, resize: 'vertical', lineHeight: 1.65 }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 7, flexWrap: 'wrap', flexShrink: 0, background: `linear-gradient(0deg, ${T.bg}, transparent)` }}>
        <MiniBtn icon={QrCode} label="Scan QR" color={T.emerald} onClick={() => openModal('qrScanner', cls)} />
        <MiniBtn icon={Bell} label="Remind All" color={T.indigo} onClick={() => openModal('post', { classId: cls.id })} />
        <MiniBtn icon={Pencil} label="Edit" color={T.t2} onClick={() => openModal('editClass', cls)} />
        {cls.isCancelled
          ? <MiniBtn icon={RefreshCw} label="Reinstate" color={T.emerald} onClick={() => { onReinstateClass(cls); onClose(); }} />
          : <MiniBtn icon={XCircle} label="Cancel Class" color={T.red} onClick={() => openModal('confirmCancel', cls)} />
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
    return { ...m, rs, reason: rs.daysAgo > 21 ? `No visit in ${rs.daysAgo} days` : 'Low engagement' };
  }).filter(Boolean).sort((a, b) => a.rs.score - b.rs.score).slice(0, 5), [allMemberships, checkIns, now]);

  const tabs = [
    { id: 'issues', label: 'Issues', count: noShows.length, color: T.red },
    { id: 'fading', label: 'Fading', count: fading.length, color: T.amber },
  ];

  return (
    <div style={{ borderRadius: 16, background: `linear-gradient(145deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
      <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
        <SectionLabel icon={Zap} color={T.amber}>Action Centre</SectionLabel>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'rgba(255,255,255,.025)', borderRadius: 10, border: `1px solid ${T.border}` }}>
          {tabs.map(s => (
            <button key={s.id} className="spt-btn" onClick={() => setSection(s.id)} style={{
              flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, position: 'relative',
              background: section === s.id ? `${s.color}0f` : 'transparent',
              border: `1px solid ${section === s.id ? `${s.color}20` : 'transparent'}`,
              color: section === s.id ? s.color : T.t3,
              transition: 'all .12s', gap: 5,
            }}>
              {s.label}
              {s.count > 0 && (
                <span style={{ fontFamily: T.mono, fontSize: 9, fontWeight: 700, color: '#fff', background: s.color, borderRadius: 99, padding: '1px 5px', marginLeft: 4, boxShadow: `0 0 6px ${s.color}60` }}>{s.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 14px 14px', maxHeight: 300, overflowY: 'auto' }}>
        {section === 'issues' && (
          noShows.length === 0
            ? <div style={{ padding: '12px 14px', borderRadius: 12, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 13, height: 13, color: T.emerald }} />
                <span style={{ fontSize: 12, color: T.emerald, fontWeight: 600 }}>No issues today</span>
              </div>
            : noShows.map((m, i) => (
              <div key={i} style={{ padding: '11px 12px', borderRadius: 12, background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.red}`, marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 2 }}>{m.user_name || 'Client'}</div>
                <div style={{ fontSize: 10, color: T.t3, marginBottom: 8 }}>No-show — {m.className}</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <MiniBtn icon={MessageCircle} label="Message" color={T.indigo} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                  <MiniBtn icon={Calendar} label="Rebook" color={T.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                </div>
              </div>
            ))
        )}
        {section === 'fading' && (
          fading.length === 0
            ? <div style={{ padding: '12px 14px', borderRadius: 12, background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle style={{ width: 13, height: 13, color: T.emerald }} />
                <span style={{ fontSize: 12, color: T.emerald, fontWeight: 600 }}>All members healthy</span>
              </div>
            : fading.map((m, i) => (
              <div key={i} style={{ padding: '11px 12px', borderRadius: 12, background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`, borderLeft: `3px solid ${m.rs.color}`, marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>{m.user_name || 'Client'}</div>
                    <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{m.reason}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: T.mono, fontSize: 16, fontWeight: 700, color: m.rs.color, lineHeight: 1 }}>{m.rs.score}</div>
                    <div style={{ fontSize: 8, color: T.t3, textTransform: 'uppercase', letterSpacing: '.05em' }}>score</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <MiniBtn icon={MessageCircle} label="Message" color={T.indigo} onClick={() => openModal('post', { memberId: m.user_id })} size="xs" />
                  <MiniBtn icon={Calendar} label="Book Class" color={T.amber} onClick={() => openModal('bookIntoClass', { memberId: m.user_id })} size="xs" />
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ─── ACTIVITY SPARKLINE ───────────────────────────────────────────────────────
function ActivitySpark({ checkIns, now }) {
  const last30 = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    return { label: format(d, 'MMM d'), count: checkIns.filter(c => isSameDay(new Date(c.check_in_date), d)).length };
  }), [checkIns, now]);
  const maxVal = Math.max(...last30.map(d => d.count), 1);
  const total = last30.reduce((s, d) => s + d.count, 0);
  const avg = (total / 30).toFixed(1);
  const peak = Math.max(...last30.map(d => d.count));

  return (
    <div style={{ borderRadius: 16, background: `linear-gradient(145deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: T.shadow }}>
      <div style={{ padding: '14px 18px 0' }}>
        <SectionLabel icon={Activity} color={T.violet}>30-Day Activity</SectionLabel>
      </div>
      <div style={{ padding: '0 18px 18px' }}>
        {/* Sparkline bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 52, marginBottom: 8 }}>
          {last30.map((d, i) => {
            const isRecent = i >= 27;
            const h = d.count === 0 ? 2 : Math.max(4, (d.count / maxVal) * 48);
            return (
              <div key={i} title={`${d.label}: ${d.count} check-ins`} style={{
                flex: 1, height: h,
                borderRadius: '3px 3px 1px 1px',
                background: isRecent
                  ? `linear-gradient(0deg, ${T.indigo}, ${T.violet})`
                  : `rgba(99,102,241,.18)`,
                transition: 'height .4s cubic-bezier(.16,1,.3,1)',
                boxShadow: isRecent ? `0 0 6px ${T.indigo}40` : 'none',
                cursor: 'default',
              }} />
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: T.mono, fontSize: 8, color: T.t3 }}>{format(subDays(now, 29), 'MMM d')}</span>
          <span style={{ fontFamily: T.mono, fontSize: 8, color: T.indigo, fontWeight: 700 }}>Today</span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { label: 'Total', value: total, color: T.indigo },
            { label: 'Peak', value: peak, color: T.violet },
            { label: 'Avg/Day', value: avg, color: T.emerald },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 10, background: `${s.color}06`, border: `1px solid ${s.color}12` }}>
              <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ openModal }) {
  return (
    <div className="spt-fade" style={{
      padding: '64px 40px', textAlign: 'center', borderRadius: 20,
      background: `linear-gradient(145deg, ${T.card}, ${T.surface})`,
      border: `1px solid ${T.border}`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,.03)`,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, margin: '0 auto 24px',
        background: `linear-gradient(135deg, ${T.indigoDim}, rgba(99,102,241,.14))`,
        border: `1px solid ${T.indigoBdr}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 8px 32px ${T.indigo}15`,
      }}>
        <Calendar style={{ width: 26, height: 26, color: T.indigo }} />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: T.t1, margin: '0 0 8px', letterSpacing: '-.04em' }}>Build Your Schedule</h3>
      <p style={{ fontSize: 13, color: T.t3, margin: '0 auto 36px', maxWidth: 420, lineHeight: 1.7 }}>
        Create your first class and start tracking attendance, fill rates, revenue, and member engagement — all in one place.
      </p>

      {[
        { t: '6:00 AM', type: 'Morning HIIT', emoji: '🔥', color: '#f87171' },
        { t: '12:00 PM', type: 'Lunchtime Yoga', emoji: '🧘', color: '#34d399' },
        { t: '5:30 PM', type: 'Evening Strength', emoji: '💪', color: '#fb923c' },
      ].map((slot, i) => (
        <div key={i} className="spt-fade" style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
          borderRadius: 14, maxWidth: 440, margin: '0 auto 10px',
          background: 'rgba(255,255,255,.02)', border: `1px dashed ${T.border}`,
          textAlign: 'left', animationDelay: `${i * .1 + .2}s`,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${slot.color}10`, border: `1px solid ${slot.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{slot.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: slot.color }}>{slot.t}</div>
            <div style={{ fontSize: 12, color: T.t2, fontWeight: 500, marginTop: 2 }}>{slot.type}</div>
          </div>
          <button className="spt-btn" onClick={() => openModal('classes')} style={{
            fontSize: 11, fontWeight: 700, color: T.indigo,
            background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
            borderRadius: 9, padding: '6px 14px',
          }}>+ Add</button>
        </div>
      ))}

      <button className="spt-btn" onClick={() => openModal('classes')} style={{
        marginTop: 28, padding: '13px 28px', borderRadius: 12, gap: 8,
        background: `linear-gradient(135deg, ${T.indigo}, #4f46e5)`,
        color: '#fff', fontSize: 13, fontWeight: 700,
        boxShadow: `0 4px 20px ${T.indigo}30`,
      }}>
        <Plus style={{ width: 14, height: 14 }} /> Create Your First Class
      </button>
    </div>
  );
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function TabCoachSchedule({ myClasses = [], checkIns = [], events = [], allMemberships = [], avatarMap = {}, openModal, now, selectedGym, onRefresh }) {
  const [calView, setCalView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(now);
  const [monthDate, setMonthDate] = useState(now);
  const [detailCls, setDetailCls] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [confirmCancel, setConfirmCancel] = useState(null);

  const queryClient = useQueryClient();

  const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || fallback); } catch { return JSON.parse(fallback); } };
  const [attendance, setAttendance] = useState(() => load('coachAttendanceSheets', '{}'));
  const [notes, setNotes] = useState(() => load('coachSessionNotes', '{}'));
  const [cancelledClasses, setCancelledClasses] = useState(() => load('coachCancelledClasses', '[]'));
  const [classAnnounce, setClassAnnounce] = useState(() => load('coachClassAnnouncements', '{}'));

  const persist = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} };
  const saveNote = (k, v) => { const u = { ...notes, [k]: v }; setNotes(u); persist('coachSessionNotes', u); };
  const saveAnnounce = (k, v) => { const u = { ...classAnnounce, [k]: v }; setClassAnnounce(u); persist('coachClassAnnouncements', u); };

  const createCheckInM = useMutation({
    mutationFn: ({ uid, userName, classId, dateStr }) =>
      base44.entities.CheckIn.create({
        user_id: uid,
        user_name: userName,
        gym_id: selectedGym?.id,
        check_in_date: new Date(`${dateStr}T12:00:00`).toISOString(),
        class_id: classId,
        source: 'coach_attendance',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedGym?.id] });
      onRefresh?.();
    },
    onError: (_, { uid, rk }) => {
      setAttendance(prev => {
        const u = { ...prev, [rk]: (prev[rk] || []).filter(id => id !== uid) };
        persist('coachAttendanceSheets', u);
        return u;
      });
    },
  });

  const deleteCheckInM = useMutation({
    mutationFn: async ({ uid, classId, dateStr }) => {
      const records = await base44.entities.CheckIn.filter({
        user_id: uid, class_id: classId, source: 'coach_attendance',
      });
      const target = records.find(r => r.check_in_date?.startsWith(dateStr));
      if (target) await base44.entities.CheckIn.delete(target.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedGym?.id] });
      onRefresh?.();
    },
  });

  const toggleAttendance = (rk, uid) => {
    const s = attendance[rk] || [];
    const isPresent = s.includes(uid);
    const u = { ...attendance, [rk]: isPresent ? s.filter(id => id !== uid) : [...s, uid] };
    setAttendance(u);
    persist('coachAttendanceSheets', u);
    const dateStr = rk.slice(-10);
    const classId = rk.slice(0, rk.length - 11);
    if (!isPresent && selectedGym?.id) {
      const member = allMemberships.find(m => m.user_id === uid);
      createCheckInM.mutate({ uid, userName: member?.user_name || '', classId, dateStr, rk });
    } else if (isPresent && selectedGym?.id) {
      deleteCheckInM.mutate({ uid, classId, dateStr });
    }
  };
  const markAllPresent = (rk) => {
    const alreadyIn = attendance[rk] || [];
    const newIds = allMemberships.map(m => m.user_id);
    const u = { ...attendance, [rk]: newIds };
    setAttendance(u);
    persist('coachAttendanceSheets', u);
    if (selectedGym?.id) {
      const dateStr = rk.slice(-10);
      const classId = rk.slice(0, rk.length - 11);
      allMemberships
        .filter(m => !alreadyIn.includes(m.user_id))
        .forEach(m => createCheckInM.mutate({ uid: m.user_id, userName: m.user_name || '', classId, dateStr }));
    }
  };
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
    <div className="spt" style={{
      background: T.bgMesh, minHeight: '100vh', padding: '28px 24px',
      position: 'relative',
    }}>
      {/* Background gradient mesh */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.055) 0%, transparent 65%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, rgba(16,217,160,0.025) 0%, transparent 65%)', borderRadius: '50%' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {confirmCancel && (
          <ConfirmDialog
            message={`Cancel "${confirmCancel.name}" on ${format(selectedDate, 'EEEE, MMM d')}?\nAll booked members must be notified manually.`}
            onConfirm={() => cancelClass(confirmCancel, selDateStr)}
            onCancel={() => setConfirmCancel(null)}
          />
        )}

        {detailCls && (
          <>
            <div className="spt-fadein" style={{ position: 'fixed', inset: 0, zIndex: 8999, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }} onClick={() => setDetailCls(null)} />
            <SessionDetailPanel
              cls={detailCls} allMemberships={allMemberships} checkIns={checkIns} avatarMap={avatarMap}
              attendance={attendance} onToggle={toggleAttendance} onMarkAll={markAllPresent} onClearAll={clearAttendance}
              onSaveNote={saveNote} onSaveAnnounce={saveAnnounce} notes={notes} classAnnounce={classAnnounce}
              selDateStr={selDateStr} now={now}
              openModal={(type, data) => { if (type === 'confirmCancel') { setConfirmCancel(data); return; } openModal(type, data); }}
              onClose={() => setDetailCls(null)} onCancelClass={(cls) => setConfirmCancel(cls)} onReinstateClass={reinstateClass}
            />
          </>
        )}

        {/* ── PAGE HEADER ── */}
        <div className="spt-fade" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: T.t1, margin: 0, letterSpacing: '-.04em', lineHeight: 1 }}>Session Performance</h1>
              {isToday && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: `${T.emerald}0d`, border: `1px solid ${T.emeraldBdr}` }}>
                  <span className="spt-live" style={{ width: 6, height: 6, borderRadius: '50%', background: T.emerald, display: 'inline-block' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.emerald, letterSpacing: '.04em' }}>LIVE</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 12, color: T.t3, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.indigo }}>{classesWithData.length}</span>
              <span>sessions</span>
              <span style={{ color: T.t4 }}>·</span>
              <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.emerald }}>{selCIs.length}</span>
              <span>check-ins</span>
              <span style={{ color: T.t4 }}>·</span>
              <span style={{ color: T.t2, fontWeight: 500 }}>{format(selectedDate, 'EEEE, MMMM d')}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="spt-btn" onClick={() => openModal('qrScanner')} style={{
              padding: '10px 20px', borderRadius: 11, gap: 7,
              background: `linear-gradient(135deg, ${T.emerald}, #0ea572)`,
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: `0 4px 16px ${T.emerald}30`,
            }}>
              <QrCode style={{ width: 14, height: 14 }} /> Check-In
            </button>
            <button className="spt-btn" onClick={() => openModal('classes')} style={{
              padding: '10px 20px', borderRadius: 11, gap: 7,
              background: `linear-gradient(135deg, ${T.indigo}, #4f46e5)`,
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: `0 4px 16px ${T.indigo}28`,
            }}>
              <Plus style={{ width: 14, height: 14 }} /> Add Class
            </button>
          </div>
        </div>

        {!hasClasses ? (
          <EmptyState openModal={openModal} />
        ) : (
          <>
            {/* KPI Strip */}
            <WeeklyPerformanceBar
              sessions={classesWithData.length} totalBooked={totalBooked} totalPresent={totalPresent}
              totalNoShows={totalNoShows} avgFill={avgFill} totalRevenue={totalRevToday}
              totalLateCancels={totalLateCancels} isToday={isToday} dateLabel={format(selectedDate, 'EEE, MMM d')}
              checkIns={checkIns} now={now} openModal={openModal}
            />

            {/* Main two-column grid */}
            <div className="spt-grid">
              {/* ── LEFT COLUMN ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Calendar panel */}
                <div className="spt-fade" style={{
                  borderRadius: 18, background: `linear-gradient(145deg, ${T.card}, ${T.surface})`,
                  border: `1px solid ${T.border}`, padding: '20px 22px',
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,.03), ${T.shadow}`,
                  animationDelay: '.05s',
                }}>
                  {/* Nav bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    {/* View toggle */}
                    <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,.025)', border: `1px solid ${T.border}`, borderRadius: 11 }}>
                      {[{ id: 'day', label: 'Day' }, { id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }].map(v => (
                        <button key={v.id} className="spt-btn" onClick={() => setCalView(v.id)} style={{
                          padding: '6px 16px', borderRadius: 9, fontSize: 12,
                          border: `1px solid ${calView === v.id ? T.indigoBdr : 'transparent'}`,
                          background: calView === v.id ? `linear-gradient(135deg, ${T.indigoDim}, rgba(99,102,241,.14))` : 'transparent',
                          color: calView === v.id ? T.indigo : T.t3,
                          fontWeight: calView === v.id ? 700 : 500,
                        }}>{v.label}</button>
                      ))}
                    </div>

                    {/* Nav arrows */}
                    <button className="spt-btn" onClick={() => navigate(-1)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, color: T.t3 }}>
                      <ChevronLeft style={{ width: 14, height: 14 }} />
                    </button>

                    <span style={{ fontSize: 15, fontWeight: 800, color: T.t1, flex: 1, letterSpacing: '-.03em' }}>
                      {calView === 'month'
                        ? format(monthDate, 'MMMM yyyy')
                        : calView === 'week'
                        ? `${format(week[0], 'MMM d')} – ${format(week[6], 'MMM d, yyyy')}`
                        : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>

                    <button className="spt-btn" onClick={() => navigate(1)} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, color: T.t3 }}>
                      <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>

                    <button className="spt-btn" onClick={() => { setSelectedDate(now); setMonthDate(now); }} style={{
                      padding: '7px 16px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                      background: T.indigoDim, border: `1px solid ${T.indigoBdr}`, color: T.indigo,
                    }}>Today</button>
                  </div>

                  {/* Week strip */}
                  {(calView === 'week' || calView === 'day') && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {week.map((d, i) => (
                        <WeekCell
                          key={i} date={d}
                          isSelected={isSameDay(d, selectedDate)} isToday={isSameDay(d, now)}
                          classCount={groupClasses.length} ciCount={weekCICounts[i]}
                          avgFill={weekCICounts[i] > 0 ? Math.min(100, Math.round((weekCICounts[i] / Math.max(groupClasses.length * 15, 1)) * 100)) : null}
                          onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Month grid */}
                  {calView === 'month' && (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
                        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.07em', padding: '4px 0' }}>{d}</div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                        {monthDays.map((d, i) => (
                          <MonthCell
                            key={i} date={d}
                            isCurrentMonth={isSameMonth(d, monthDate)}
                            isSelected={isSameDay(d, selectedDate)} isToday={isSameDay(d, now)}
                            classCount={groupClasses.length} ciCount={dayCIs(d).length}
                            onClick={() => { setSelectedDate(d); setCalView('day'); setDetailCls(null); }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section header for sessions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 4, height: 18, borderRadius: 99, background: `linear-gradient(180deg, ${T.indigo}, ${T.violet})` }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: T.t1, letterSpacing: '-.03em' }}>
                      {isToday ? "Today's Sessions" : `${format(selectedDate, 'EEE, MMM d')} Sessions`}
                    </span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 700, color: T.indigo, background: T.indigoDim, border: `1px solid ${T.indigoBdr}`, borderRadius: 6, padding: '2px 7px' }}>{classesWithData.length}</span>
                  </div>

                  {/* Type filters */}
                  <div style={{ display: 'flex', gap: 5, overflowX: 'auto' }}>
                    {['all', ...classTypes].map(type => {
                      const cfg = type === 'all' ? { color: T.indigo, label: 'All', emoji: '📋' } : CLASS_TYPE[type] || CLASS_TYPE.default;
                      const active = typeFilter === type;
                      return (
                        <button key={type} className="spt-btn" onClick={() => setTypeFilter(type)} style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 12px', borderRadius: 99, fontSize: 11,
                          border: `1px solid ${active ? `${cfg.color}28` : T.border}`,
                          background: active ? `${cfg.color}0d` : 'transparent',
                          color: active ? cfg.color : T.t3,
                          fontWeight: active ? 700 : 500, transition: 'all .12s',
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{ fontSize: 12 }}>{cfg.emoji}</span> {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Session list */}
                {classesWithData.length === 0 ? (
                  <div style={{
                    padding: '48px 32px', textAlign: 'center', borderRadius: 18,
                    background: `linear-gradient(145deg, ${T.card}, ${T.surface})`,
                    border: `1px solid ${T.border}`,
                  }}>
                    <Calendar style={{ width: 22, height: 22, color: T.t3, margin: '0 auto 12px', opacity: .4 }} />
                    <p style={{ fontSize: 14, color: T.t2, fontWeight: 700, margin: '0 0 5px', letterSpacing: '-.02em' }}>No sessions on this day</p>
                    <p style={{ fontSize: 12, color: T.t3, margin: '0 0 20px' }}>{typeFilter !== 'all' ? 'Try clearing the type filter' : 'Select a different day or add a class'}</p>
                    <button className="spt-btn" onClick={() => openModal('classes')} style={{
                      fontSize: 12, fontWeight: 700, color: T.indigo,
                      background: T.indigoDim, border: `1px solid ${T.indigoBdr}`, borderRadius: 10, padding: '9px 20px', gap: 6,
                    }}>
                      <Plus style={{ width: 12, height: 12 }} /> Add Class
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {classesWithData.map((cls, idx) => (
                      <div key={cls.id || idx} className="spt-fade" style={{ animationDelay: `${Math.min(idx * .06, .4)}s` }}>
                        <SessionCard cls={cls} onOpen={() => openDetail(cls)} isSelected={detailCls?.id === cls.id} now={now} openModal={openModal} avatarMap={avatarMap} />
                      </div>
                    ))}
                  </div>
                )}

                {/* PT / 1:1 appointments */}
                {appointments.length > 0 && (
                  <div className="spt-fade" style={{ animationDelay: '.3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 4, height: 18, borderRadius: 99, background: `linear-gradient(180deg, ${T.sky}, ${T.indigo})` }} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: T.t1, flex: 1, letterSpacing: '-.03em' }}>PT / 1:1 Appointments</span>
                      <button className="spt-btn" onClick={() => openModal('bookAppointment')} style={{
                        fontSize: 11, fontWeight: 700, color: T.sky,
                        background: T.skyDim, border: `1px solid ${T.skyBdr}`, borderRadius: 9, padding: '6px 14px', gap: 5,
                      }}>
                        <Plus style={{ width: 11, height: 11 }} /> Book
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 10 }}>
                      {appointments.map((apt, i) => {
                        const m = allMemberships.find(x => x.user_id === apt.client_id || x.user_id === apt.user_id);
                        const name = apt.client_name || m?.user_name || 'Client';
                        const initials = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                        return (
                          <div key={apt.id || i} style={{
                            padding: '16px 18px', borderRadius: 16,
                            background: `linear-gradient(145deg, ${T.card}, ${T.surface})`,
                            border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.sky}`,
                            display: 'flex', alignItems: 'center', gap: 12, boxShadow: T.shadow,
                          }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: `${T.sky}12`, border: `1px solid ${T.sky}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: T.sky, flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, letterSpacing: '-.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.sky, marginTop: 3, fontWeight: 600 }}>{apt.schedule || apt.time || 'TBD'}</div>
                            </div>
                            <MiniBtn icon={QrCode} label="Check In" color={T.emerald} onClick={() => openModal('qrScanner')} size="xs" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT SIDEBAR ── */}
              <div className="spt-sidebar-col" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <OptimizationSuggestions classesWithData={classesWithData} checkIns={checkIns} now={now} openModal={openModal} />
                <ActionCentre allMemberships={allMemberships} checkIns={checkIns} myClasses={myClasses} now={now} openModal={openModal} />

                {/* Day Summary */}
                <div style={{ borderRadius: 16, background: `linear-gradient(145deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, padding: '16px 18px', boxShadow: T.shadow }}>
                  <SectionLabel icon={BarChart2} color={T.sky}>Day Summary</SectionLabel>
                  {[
                    { label: 'Sessions', value: classesWithData.length, color: T.indigo },
                    { label: 'Checked In', value: totalPresent, color: T.emerald },
                    { label: 'Expected', value: totalBooked, color: T.t2 },
                    { label: 'No-Shows', value: totalNoShows, color: totalNoShows > 0 ? T.red : T.t3 },
                    { label: 'Avg Fill Rate', value: `${avgFill}%`, color: fillColor(avgFill) },
                    { label: 'Est. Revenue', value: totalRevToday > 0 ? `£${totalRevToday}` : '—', color: T.emerald },
                    { label: 'PT Sessions', value: appointments.length, color: T.sky },
                  ].map((s, i, arr) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '9px 0',
                      borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                    }}>
                      <span style={{ fontSize: 11, color: T.t2, fontWeight: 500 }}>{s.label}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Class mix */}
                {classTypes.length > 0 && (
                  <div style={{ borderRadius: 16, background: `linear-gradient(145deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, padding: '16px 18px', boxShadow: T.shadow }}>
                    <SectionLabel icon={Layers} color={T.violet}>Class Mix</SectionLabel>
                    {classTypes.map((type, i, arr) => {
                      const cfg = CLASS_TYPE[type] || CLASS_TYPE.default;
                      const typeCls = classesWithData.filter(c => (c.name || '').toLowerCase().includes(type));
                      const count = typeCls.length;
                      const avgF = typeCls.length > 0 ? Math.round(typeCls.reduce((s, c) => s + c.fill, 0) / typeCls.length) : 0;
                      return (
                        <div key={type} style={{ marginBottom: i < arr.length - 1 ? 14 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ fontSize: 14 }}>{cfg.emoji}</span>
                              <span style={{ fontSize: 12, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t3 }}>{count} class{count !== 1 ? 'es' : ''}</span>
                              <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700, color: fillColor(avgF) }}>{avgF}%</span>
                            </div>
                          </div>
                          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${avgF}%`, background: cfg.grad, borderRadius: 99, transition: 'width .7s cubic-bezier(.16,1,.3,1)', boxShadow: `0 0 6px ${cfg.color}40` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <ActivitySpark checkIns={checkIns} now={now} />

                {/* Quick Actions */}
                <div style={{ borderRadius: 16, background: `linear-gradient(145deg, ${T.card}, ${T.surface})`, border: `1px solid ${T.border}`, padding: '16px 18px', boxShadow: T.shadow }}>
                  <SectionLabel icon={Zap} color={T.amber}>Quick Actions</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon: QrCode,    label: 'Scan Check-In',  sub: 'Open QR scanner',    color: T.emerald, fn: () => openModal('qrScanner') },
                      { icon: Calendar,  label: 'Create Event',   sub: 'Add to schedule',    color: T.indigo,  fn: () => openModal('event') },
                      { icon: Bell,      label: 'Send Reminder',  sub: 'Notify members',     color: T.sky,     fn: () => openModal('post') },
                      { icon: Dumbbell,  label: 'Manage Classes', sub: 'Edit class library', color: T.violet,  fn: () => openModal('classes') },
                    ].map(({ icon: Ic, label, sub, color, fn }, i) => (
                      <button key={i} className="spt-btn" onClick={fn} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px',
                        borderRadius: 12, width: '100%', background: 'rgba(255,255,255,.02)',
                        border: `1px solid ${T.border}`, textAlign: 'left', transition: 'all .15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${color}07`; e.currentTarget.style.borderColor = `${color}18`; e.currentTarget.style.transform = 'translateX(2px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.02)'; e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none'; }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}0d`, border: `1px solid ${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Ic style={{ width: 13, height: 13, color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, letterSpacing: '-.01em' }}>{label}</div>
                          <div style={{ fontSize: 10, color: T.t3, marginTop: 1 }}>{sub}</div>
                        </div>
                        <ArrowRight style={{ width: 12, height: 12, color: T.t4, flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
