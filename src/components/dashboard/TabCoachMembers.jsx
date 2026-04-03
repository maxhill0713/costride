import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Search, X, Phone, Calendar, Dumbbell, TrendingUp, TrendingDown,
  Minus, Activity, AlertTriangle, Zap, Star, CreditCard,
  Clock, MessageCircle, User, UserPlus, ChevronRight, Bell,
  Edit3, Send, CheckCircle, Plus, Trash2, ShieldAlert, ChevronDown,
  ArrowUpRight, ArrowDownRight, Eye, BarChart3, Users, Target,
  Flame, Shield, Upload, BookOpen, Sparkles, Info, MoreHorizontal,
  Mail, Lightbulb, Heart, XCircle,
} from 'lucide-react';
import AddClientModal from '../coach/AddClientModal';
import ClientPerformancePanel from './ClientPerformancePanel';

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('cis-css')) {
  const s = document.createElement('style');
  s.id = 'cis-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .cis {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }

    @keyframes cisFadeUp  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
    @keyframes cisSlideIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:none } }
    @keyframes cisPulse   { 0%,100% { opacity:.5 } 50% { opacity:1 } }
    @keyframes cisGlow    { 0%,100% { box-shadow:0 0 0 0 rgba(248,113,113,0) } 50% { box-shadow:0 0 0 6px rgba(248,113,113,.07) } }
    @keyframes cisOrb     { 0%,100% { transform:translate(0,0) scale(1) } 33% { transform:translate(12px,-8px) scale(1.04) } 66% { transform:translate(-8px,6px) scale(.97) } }
    @keyframes cisSlideDown { from { opacity:0; transform:translateY(-6px); max-height:0 } to { opacity:1; transform:none; max-height:800px } }

    .c-fu  { animation: cisFadeUp .5s cubic-bezier(.16,1,.3,1) both; }
    .c-si  { animation: cisSlideIn .35s cubic-bezier(.16,1,.3,1) both; }
    .c-sd  { animation: cisSlideDown .3s cubic-bezier(.16,1,.3,1) both; }

    .c-d1{animation-delay:.05s} .c-d2{animation-delay:.10s} .c-d3{animation-delay:.15s}
    .c-d4{animation-delay:.20s} .c-d5{animation-delay:.25s} .c-d6{animation-delay:.30s}

    .cis-btn {
      font-family: 'DM Sans', sans-serif; cursor: pointer; outline: none;
      transition: all .2s cubic-bezier(.16,1,.3,1); border: none;
      display: inline-flex; align-items: center; gap: 6px;
      position: relative; overflow: hidden;
    }
    .cis-btn:hover { transform: translateY(-1px); }
    .cis-btn:active { transform: translateY(0) scale(.98); }
    .cis-btn::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,.06) 0%, transparent 50%);
      opacity: 0; transition: opacity .2s;
    }
    .cis-btn:hover::after { opacity: 1; }

    .cis-card {
      background: #0a0f1e;
      border: 1px solid rgba(255,255,255,.04);
      border-radius: 16px;
      overflow: hidden;
      transition: border-color .2s, box-shadow .3s;
      position: relative;
    }
    .cis-card::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(180deg, rgba(255,255,255,.012) 0%, transparent 40%);
      pointer-events: none; border-radius: inherit;
    }
    .cis-card:hover { border-color: rgba(255,255,255,.07); box-shadow: 0 4px 24px rgba(0,0,0,.15); }

    .cis-row {
      transition: all .18s cubic-bezier(.16,1,.3,1); cursor: pointer; position: relative;
    }
    .cis-row:hover { background: rgba(255,255,255,.018) !important; }
    .cis-row:hover .cis-row-actions { opacity: 1; pointer-events: auto; }
    .cis-row-actions { opacity: 0; pointer-events: none; transition: opacity .18s; }

    .cis-input {
      width: 100%; background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.05);
      color: #eef2ff; font-size: 13px; font-family: 'DM Sans', sans-serif;
      outline: none; border-radius: 10px; padding: 11px 15px;
      transition: all .2s;
    }
    .cis-input:focus {
      border-color: rgba(129,140,248,.35); background: rgba(255,255,255,.035);
      box-shadow: 0 0 0 3px rgba(129,140,248,.06);
    }
    .cis-input::placeholder { color: rgba(139,149,179,.35); }

    .cis-select {
      background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.05);
      color: #eef2ff; font-size: 12px; font-family: 'DM Sans', sans-serif;
      outline: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;
      appearance: none;
    }

    .cis-scr::-webkit-scrollbar { width: 3px; }
    .cis-scr::-webkit-scrollbar-track { background: transparent; }
    .cis-scr::-webkit-scrollbar-thumb { background: rgba(255,255,255,.06); border-radius: 3px; }

    .cis-tooltip { position: relative; }
    .cis-tooltip::after {
      content: attr(data-tip); position: absolute; bottom: calc(100% + 8px);
      left: 50%; transform: translateX(-50%); background: #151b30; color: #eef2ff;
      font-size: 11px; font-weight: 500; padding: 6px 11px; border-radius: 8px;
      white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .18s;
      z-index: 50; border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 8px 24px rgba(0,0,0,.4);
    }
    .cis-tooltip:hover::after { opacity: 1; }

    .cis-stat-card {
      transition: all .2s cubic-bezier(.16,1,.3,1);
    }
    .cis-stat-card:hover {
      border-color: rgba(255,255,255,.08) !important;
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(0,0,0,.2);
    }

    .cis-tab-btn {
      font-family: 'DM Sans', sans-serif; cursor: pointer; outline: none;
      transition: all .2s; border: none; position: relative;
    }
    .cis-tab-btn::after {
      content: ''; position: absolute; bottom: -1px; left: 20%; right: 20%;
      height: 2px; border-radius: 2px 2px 0 0;
      background: transparent; transition: all .2s;
    }

    @media (max-width: 1100px) {
      .cis-grid { grid-template-columns: 1fr !important; }
      .cis-sidebar { display: none !important; }
    }
    @media (max-width: 768px) {
      .cis-health-grid { grid-template-columns: 1fr 1fr !important; }
      .cis-controls { flex-direction: column !important; }
      .cis-root-pad { padding: 16px 14px !important; }
    }
    @media (max-width: 480px) {
      .cis-health-grid { grid-template-columns: 1fr !important; }
    }
  `;
  document.head.appendChild(s);
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:        '#050810',
  bgSub:     '#080c16',
  surface:   '#0a0f1e',
  surfaceUp: '#0d1225',
  card:      '#0b1020',
  glass:     'rgba(12,17,35,.72)',

  border:    'rgba(255,255,255,.04)',
  borderH:   'rgba(255,255,255,.07)',
  borderA:   'rgba(255,255,255,.10)',
  borderF:   'rgba(255,255,255,.14)',

  t1: '#eef2ff',
  t2: '#8b95b3',
  t3: '#4b5578',
  t4: '#252d45',
  t5: '#181e32',

  emerald:    '#34d399',
  emeraldDim: 'rgba(52,211,153,.06)',
  emeraldBdr: 'rgba(52,211,153,.14)',

  indigo:    '#818cf8',
  indigoDim: 'rgba(129,140,248,.06)',
  indigoBdr: 'rgba(129,140,248,.14)',

  amber:     '#fbbf24',
  amberDim:  'rgba(251,191,36,.05)',
  amberBdr:  'rgba(251,191,36,.12)',

  red:       '#f87171',
  redDim:    'rgba(248,113,113,.05)',
  redBdr:    'rgba(248,113,113,.12)',

  sky:       '#38bdf8',
  skyDim:    'rgba(56,189,248,.06)',
  skyBdr:    'rgba(56,189,248,.14)',

  violet:    '#a78bfa',
  violetDim: 'rgba(167,139,250,.06)',
  violetBdr: 'rgba(167,139,250,.14)',

  mono: "'IBM Plex Mono', 'SF Mono', monospace",
  display: "'DM Sans', -apple-system, sans-serif",
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Avatar({ name = '?', size = 36, src = null, status }) {
  const [imgFail, setImgFail] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const statusColors = { active: T.emerald, at_risk: T.red, paused: T.amber };
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: size * .3, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(129,140,248,.14), rgba(129,140,248,.04))',
        border: '1px solid rgba(129,140,248,.18)',
        fontSize: size * .3, fontWeight: 700, color: T.indigo, letterSpacing: '-.02em',
      }}>
        {src && !imgFail
          ? <img src={src} alt={name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgFail(true)} />
          : initials}
      </div>
      {status && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 10, height: 10, borderRadius: '50%',
          background: statusColors[status] || T.t3,
          border: `2px solid ${T.bg}`,
          boxShadow: `0 0 6px ${(statusColors[status] || T.t3)}40`,
        }} />
      )}
    </div>
  );
}

function Pill({ children, color = T.t3, bg, border, glow, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 600, color,
      background: bg || `${color}0a`, border: `1px solid ${border || `${color}18`}`,
      borderRadius: 6, padding: '2.5px 8px', letterSpacing: '.03em',
      textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: '16px',
      boxShadow: glow ? `0 0 12px ${color}12` : 'none',
      ...style,
    }}>{children}</span>
  );
}

function Mono({ children, style }) {
  return (
    <span style={{ fontFamily: T.mono, fontWeight: 500, letterSpacing: '-.03em', ...style }}>
      {children}
    </span>
  );
}

function Label({ children, style }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: T.t3,
      textTransform: 'uppercase', letterSpacing: '.08em', lineHeight: 1, ...style,
    }}>{children}</div>
  );
}

function GlowBar({ color, position = 'top' }) {
  const s = position === 'top'
    ? { top: 0, left: 0, right: 0, height: 1 }
    : { top: 0, bottom: 0, left: 0, width: 2 };
  return (
    <div style={{
      position: 'absolute', ...s,
      background: `linear-gradient(${position === 'top' ? '90deg' : '180deg'}, transparent 0%, ${color} 50%, transparent 100%)`,
      opacity: .5,
    }} />
  );
}

function CardHead({ label, sub, right, noBorder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '16px 20px',
      ...(noBorder ? {} : { borderBottom: `1px solid ${T.border}` }),
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, letterSpacing: '-.02em', lineHeight: 1 }}>{label}</div>
        {sub && <div style={{ fontSize: 10.5, color: T.t3, marginTop: 5, lineHeight: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── HEALTH BAR ───────────────────────────────────────────────────────────────
function HealthBar({ segments, height = 5 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 2, height, borderRadius: 99, overflow: 'hidden' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{
          flex: seg.value / total,
          background: `linear-gradient(90deg, ${seg.color}90, ${seg.color})`,
          borderRadius: 99, minWidth: seg.value > 0 ? 4 : 0,
          transition: 'flex .5s cubic-bezier(.16,1,.3,1)',
          boxShadow: seg.value > 0 ? `0 0 8px ${seg.color}25` : 'none',
        }} />
      ))}
    </div>
  );
}

// ─── TREND LINE ───────────────────────────────────────────────────────────────
function TrendLine({ data = [], color = T.indigo, w = 80, h = 28 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    4 + (1 - (v - min) / rng) * (h - 8),
  ]);

  // Smooth curve
  const smooth = (points) => {
    if (points.length < 2) return '';
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
    }
    return d;
  };

  const line = smooth(pts);
  const [lx, ly] = pts[pts.length - 1];
  const areaPath = `${line} L ${w},${h} L 0,${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
      style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`tg-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#tg-${color.replace(/[^a-z0-9]/gi,'')})`} />
      <path d={line} stroke={color} strokeWidth="1.6"
        fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      <circle cx={lx} cy={ly} r="2.5" fill={T.bg} stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '-8%', right: '-6%', width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(129,140,248,.035) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)',
        animation: 'cisOrb 22s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', bottom: '5%', left: '-8%', width: 420, height: 420,
        background: 'radial-gradient(circle, rgba(52,211,153,.025) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)',
        animation: 'cisOrb 28s ease-in-out infinite reverse',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
        backgroundSize: '64px 64px', opacity: .25,
        maskImage: 'radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 100%)',
      }}/>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function scoreColor(s) {
  if (s >= 80) return T.emerald;
  if (s >= 60) return T.t2;
  if (s >= 40) return T.amber;
  return T.red;
}
function scoreTier(s) {
  if (s >= 80) return { label: 'Healthy', color: T.emerald, bg: T.emeraldDim, bdr: T.emeraldBdr };
  if (s >= 60) return { label: 'Stable',  color: T.t2,      bg: 'rgba(139,149,179,.05)', bdr: 'rgba(139,149,179,.10)' };
  if (s >= 40) return { label: 'Caution', color: T.amber,   bg: T.amberDim,  bdr: T.amberBdr };
  return              { label: 'At Risk', color: T.red,     bg: T.redDim,    bdr: T.redBdr };
}
function trendOf(hist) {
  if (!hist || hist.length < 4) return { dir: 'flat', delta: 0 };
  const d = hist[hist.length - 1] - hist[hist.length - 4];
  if (d > 4)  return { dir: 'up',   delta: d };
  if (d < -4) return { dir: 'down', delta: d };
  return            { dir: 'flat', delta: 0 };
}
function riskReason(client) {
  const reasons = [];
  if (client.lastVisit >= 21) reasons.push('No visit in 3+ weeks');
  else if (client.lastVisit >= 14) reasons.push('No visit in 2+ weeks');
  if (client.sessionsThisMonth === 0 && client.sessionsLastMonth === 0) reasons.push('Zero sessions in 2 months');
  else if (client.sessionsThisMonth < client.sessionsLastMonth) reasons.push('Session frequency declining');
  if (client.consecutiveMissed >= 2) reasons.push(`${client.consecutiveMissed} no-shows`);
  if (reasons.length === 0 && client.retentionScore < 40) reasons.push('Low engagement pattern');
  return reasons;
}
function suggestedAction(client) {
  if (client.lastVisit >= 21) return { label: 'Call them', icon: Phone, color: T.red };
  if (client.lastVisit >= 14) return { label: 'Send message', icon: MessageCircle, color: T.amber };
  if (client.sessionsThisMonth < client.sessionsLastMonth) return { label: 'Book session', icon: Calendar, color: T.indigo };
  if (client.consecutiveMissed >= 2) return { label: 'Check in', icon: Heart, color: T.amber };
  return { label: 'Message', icon: MessageCircle, color: T.indigo };
}
const SEV = {
  Active:  { color: T.red,     dim: T.redDim,     bdr: T.redBdr },
  Monitor: { color: T.amber,   dim: T.amberDim,   bdr: T.amberBdr },
  Mild:    { color: T.indigo,  dim: T.indigoDim,  bdr: T.indigoBdr },
  Cleared: { color: T.emerald, dim: T.emeraldDim, bdr: T.emeraldBdr },
};

// ─── BUILD CLIENT FROM BOOKINGS ──────────────────────────────────────────────
function buildClientFromBookings(userId, clientName, clientBookings, checkIns, now) {
  const now_ = now ? now.getTime() : Date.now();
  const msDay = 86400000;
  const msMonth = 30 * msDay;
  const attended = clientBookings.filter(b => b.status === 'attended');
  const noShows  = clientBookings.filter(b => b.status === 'no_show');
  const confirmed = clientBookings.filter(b => b.status === 'confirmed');
  const sessionsThisMonth  = clientBookings.filter(b => b.session_date && (now_ - new Date(b.session_date)) < msMonth).length;
  const sessionsLastMonth  = clientBookings.filter(b => { const d = b.session_date ? now_ - new Date(b.session_date) : null; return d !== null && d >= msMonth && d < 2 * msMonth; }).length;
  const userCI = checkIns.filter(c => c.user_id === userId).sort((a,b) => new Date(b.check_in_date) - new Date(a.check_in_date));
  const lastCIDate = userCI[0] ? new Date(userCI[0].check_in_date) : null;
  const lastVisitDays = lastCIDate ? Math.floor((now_ - lastCIDate.getTime()) / msDay) : 999;
  let streak = 0;
  for (let i = 0; i < userCI.length; i++) {
    const daysDiff = Math.floor((now_ - new Date(userCI[i].check_in_date).getTime()) / msDay);
    if (daysDiff <= streak + 2) streak = daysDiff + 1;
    else break;
  }
  let score = 70;
  if (lastVisitDays === 999) score -= 40;
  else if (lastVisitDays > 21) score -= 30;
  else if (lastVisitDays > 14) score -= 20;
  else if (lastVisitDays > 7)  score -= 10;
  if (sessionsThisMonth === 0 && sessionsLastMonth === 0) score -= 20;
  else if (sessionsThisMonth > sessionsLastMonth) score += 10;
  else if (sessionsThisMonth < sessionsLastMonth) score -= 10;
  score = Math.max(5, Math.min(98, score));
  const retentionHistory = Array.from({length: 8}, (_, i) => {
    const weekStart = now_ - (7-i) * 7 * msDay;
    const weekEnd   = weekStart + 7 * msDay;
    const cnt = userCI.filter(c => { const t = new Date(c.check_in_date).getTime(); return t >= weekStart && t < weekEnd; }).length;
    return Math.min(100, 40 + cnt * 15);
  });
  const status = score >= 65 ? 'active' : score >= 35 ? 'paused' : 'at_risk';
  const nextBooking = confirmed.filter(b => b.session_date && new Date(b.session_date) > now).sort((a,b) => new Date(a.session_date) - new Date(b.session_date))[0];
  const firstBooking = [...clientBookings].sort((a,b) => new Date(a.session_date || a.created_date) - new Date(b.session_date || b.created_date))[0];
  const joinDateRaw = firstBooking ? new Date(firstBooking.session_date || firstBooking.created_date) : null;
  const isNew = joinDateRaw && (now_ - joinDateRaw.getTime()) < msMonth;
  return {
    id: userId, name: clientName || 'Client', email: '', phone: '',
    tier: 'Standard', status, goal: 'General Fitness',
    retentionScore: score, retentionHistory,
    sessionsThisMonth, sessionsLastMonth,
    lastVisit: lastVisitDays === 999 ? 999 : lastVisitDays,
    streak, consecutiveMissed: noShows.length,
    joinDate: firstBooking ? new Date(firstBooking.session_date || firstBooking.created_date).toLocaleDateString('en-GB', {month:'short', year:'numeric'}) : '—',
    membership: 'Class Booking', monthlySpend: 0, tags: [], notes: '', isNew,
    nextSession: nextBooking ? new Date(nextBooking.session_date).toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'}) : null,
    upcomingClasses: confirmed.filter(b => b.session_date && new Date(b.session_date) > now).slice(0,3).map(b => b.session_name || 'Class'),
    injuries: [],
  };
}

// ─── PRESETS ──────────────────────────────────────────────────────────────────
const PRESETS = [
  { id:'checkin',  label:'Check-in',        text: fn=>`Hey ${fn} 👋 Just checking in — how are things going? Would love to see you back this week.` },
  { id:'missed',   label:'Missed sessions', text: fn=>`Hi ${fn}, we noticed you haven't been in for a bit. Just checking everything's okay.` },
  { id:'congrats', label:'Celebrate',       text: fn=>`${fn} — you've been absolutely crushing it lately! Your consistency is seriously impressive 💪` },
  { id:'upgrade',  label:'Upgrade offer',   text: fn=>`Hey ${fn}, given how consistent you've been, I think you'd get a lot from stepping up your plan. Want to chat options?` },
  { id:'welcome',  label:'Welcome back',    text: fn=>`Hi ${fn}, great to have you back! We've got some exciting sessions lined up — let's pick up right where you left off.` },
];

// ─── HEALTH OVERVIEW ─────────────────────────────────────────────────────────
function HealthOverview({ clients }) {
  const healthy  = clients.filter(c => c.retentionScore >= 80).length;
  const stable   = clients.filter(c => c.retentionScore >= 60 && c.retentionScore < 80).length;
  const caution  = clients.filter(c => c.retentionScore >= 40 && c.retentionScore < 60).length;
  const atRisk   = clients.filter(c => c.retentionScore < 40).length;
  const total    = clients.length || 1;
  const avgScore = Math.round(clients.reduce((s,c) => s + c.retentionScore, 0) / total);
  const prevAvg = Math.round(clients.reduce((s,c) => {
    const h = c.retentionHistory;
    return s + (h && h.length >= 5 ? h[h.length - 5] : c.retentionScore);
  }, 0) / total);
  const trendDelta = avgScore - prevAvg;
  const trendDir = trendDelta > 2 ? 'up' : trendDelta < -2 ? 'down' : 'flat';
  const improving = clients.filter(c => trendOf(c.retentionHistory).dir === 'up').length;
  const declining = clients.filter(c => trendOf(c.retentionHistory).dir === 'down').length;
  const sc = scoreColor(avgScore);

  return (
    <div className="c-fu c-d1" style={{ marginBottom: 22 }}>
      <div className="cis-health-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 10 }}>
        {/* Portfolio Health */}
        <div className="cis-stat-card" style={{
          padding: '20px 22px', borderRadius: 16,
          background: `linear-gradient(135deg, ${T.surface}, ${T.card})`,
          border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140,
            background: `radial-gradient(circle, ${sc}08, transparent 70%)`,
          }} />
          <Label style={{ marginBottom: 14 }}>Portfolio Health</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <Mono style={{ fontSize: 42, fontWeight: 700, color: sc, lineHeight: 1 }}>
              {avgScore || '—'}
            </Mono>
            {trendDir !== 'flat' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {trendDir === 'up' ? <ArrowUpRight style={{ width: 14, height: 14, color: T.emerald }} />
                  : <ArrowDownRight style={{ width: 14, height: 14, color: T.red }} />}
                <Mono style={{ fontSize: 13, fontWeight: 700, color: trendDir === 'up' ? T.emerald : T.red }}>
                  {trendDelta > 0 ? '+' : ''}{trendDelta}
                </Mono>
              </div>
            )}
          </div>
          <HealthBar height={4} segments={[
            { value: healthy, color: T.emerald },
            { value: stable,  color: T.t3 },
            { value: caution, color: T.amber },
            { value: atRisk,  color: T.red },
          ]} />
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            {[
              { c: T.emerald, l: 'Healthy', v: healthy },
              { c: T.t3,      l: 'Stable',  v: stable },
              { c: T.amber,   l: 'Caution', v: caution },
              { c: T.red,     l: 'Risk',    v: atRisk },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: s.c }} />
                <span style={{ fontSize: 9.5, color: T.t3 }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Healthy count */}
        <div className="cis-stat-card" style={{
          padding: '20px 22px', borderRadius: 16,
          background: T.surface, border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.emerald,
              boxShadow: `0 0 8px ${T.emerald}40` }} />
            <Label>Healthy</Label>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <Mono style={{ fontSize: 36, fontWeight: 700, color: T.t1, lineHeight: 1 }}>{healthy}</Mono>
            <Mono style={{ fontSize: 13, color: T.t3 }}>/ {total}</Mono>
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 8 }}>
            {Math.round((healthy / total) * 100)}% of portfolio
          </div>
        </div>

        {/* Need Outreach */}
        <div className="cis-stat-card" style={{
          padding: '20px 22px', borderRadius: 16, position: 'relative',
          background: atRisk > 0 ? `linear-gradient(135deg, ${T.redDim}, ${T.surface})` : T.surface,
          border: `1px solid ${atRisk > 0 ? T.redBdr : T.border}`,
        }}>
          {atRisk > 0 && <GlowBar color={T.red} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.red,
              boxShadow: atRisk > 0 ? `0 0 8px ${T.red}40` : 'none',
              animation: atRisk > 0 ? 'cisPulse 2s ease infinite' : 'none' }} />
            <Label style={atRisk > 0 ? { color: T.red } : {}}>Need Outreach</Label>
          </div>
          <Mono style={{ fontSize: 36, fontWeight: 700, color: atRisk > 0 ? T.red : T.t1, lineHeight: 1 }}>
            {atRisk}
          </Mono>
          <div style={{ fontSize: 11, color: atRisk > 0 ? T.red : T.t3, marginTop: 8,
            fontWeight: atRisk > 0 ? 600 : 400 }}>
            {atRisk > 0 ? 'Action needed this week' : 'No at-risk clients'}
          </div>
        </div>

        {/* Momentum */}
        <div className="cis-stat-card" style={{
          padding: '20px 22px', borderRadius: 16,
          background: T.surface, border: `1px solid ${T.border}`,
        }}>
          <Label style={{ marginBottom: 14 }}>Momentum</Label>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <ArrowUpRight style={{ width: 12, height: 12, color: T.emerald }} />
                <Mono style={{ fontSize: 24, fontWeight: 700, color: T.emerald }}>{improving}</Mono>
              </div>
              <span style={{ fontSize: 10.5, color: T.t3 }}>Improving</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <ArrowDownRight style={{ width: 12, height: 12, color: T.red }} />
                <Mono style={{ fontSize: 24, fontWeight: 700, color: T.red }}>{declining}</Mono>
              </div>
              <span style={{ fontSize: 10.5, color: T.t3 }}>Declining</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRIORITY CLIENTS ────────────────────────────────────────────────────────
function PriorityClients({ clients, onSelect }) {
  const priority = clients
    .filter(c => c.status === 'at_risk' || (c.status === 'paused' && c.lastVisit > 14))
    .sort((a, b) => a.retentionScore - b.retentionScore)
    .slice(0, 4);
  if (priority.length === 0) return null;

  return (
    <div className="c-fu c-d2" style={{ marginBottom: 22 }}>
      <div className="cis-card" style={{
        border: `1px solid ${T.redBdr}`,
        background: `linear-gradient(135deg, ${T.redDim}, ${T.surface})`,
      }}>
        <GlowBar color={T.red} />
        <div style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${T.redBdr}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.red, flexShrink: 0,
              animation: 'cisGlow 2.5s ease infinite',
              boxShadow: `0 0 8px ${T.red}40` }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>Priority Outreach</span>
            <Pill color={T.red} bg={T.redDim} border={T.redBdr} glow>
              {priority.length} client{priority.length > 1 ? 's' : ''}
            </Pill>
          </div>
          <span style={{ fontSize: 10.5, color: T.t3 }}>Sorted by urgency</span>
        </div>

        <div style={{ padding: '6px 6px' }}>
          {priority.map((client, i) => {
            const reasons = riskReason(client);
            const action = suggestedAction(client);
            const ActionIcon = action.icon;
            return (
              <div key={client.id} className="cis-row" onClick={() => onSelect(client)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 14px', borderRadius: 12,
                }}>
                <Avatar name={client.name} src={client.avatar} size={38} status={client.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.t1, marginBottom: 3,
                    letterSpacing: '-.01em' }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: T.red, fontWeight: 500 }}>
                    {reasons[0] || 'Low engagement'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: 8 }}>
                  <TrendLine data={client.retentionHistory} color={scoreColor(client.retentionScore)} w={48} h={20} />
                  <Mono style={{ fontSize: 20, fontWeight: 700,
                    color: scoreColor(client.retentionScore) }}>{client.retentionScore}</Mono>
                </div>
                <button className="cis-btn" onClick={e => { e.stopPropagation(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 16px', borderRadius: 8,
                    background: `linear-gradient(135deg, ${action.color}10, transparent)`,
                    border: `1px solid ${action.color}20`,
                    color: action.color, fontSize: 11.5, fontWeight: 600, flexShrink: 0,
                  }}>
                  <ActionIcon style={{ width: 12, height: 12 }} />
                  {action.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── INSIGHTS PANEL ──────────────────────────────────────────────────────────
function InsightsPanel({ clients }) {
  const atRiskCount = clients.filter(c => c.status === 'at_risk').length;
  const avgSessions = clients.length > 0
    ? (clients.reduce((s,c) => s + c.sessionsThisMonth, 0) / clients.length).toFixed(1) : 0;
  const highStreaks = clients.filter(c => c.streak >= 14).length;
  const newClients = clients.filter(c => c.isNew).length;

  const insights = [
    atRiskCount > 0 && {
      icon: AlertTriangle, color: T.red,
      text: `${atRiskCount} client${atRiskCount > 1 ? 's' : ''} at risk of churning this week`,
    },
    avgSessions > 0 && {
      icon: BarChart3, color: T.indigo,
      text: `Average ${avgSessions} sessions/month across your roster`,
    },
    highStreaks > 0 && {
      icon: Flame, color: T.amber,
      text: `${highStreaks} client${highStreaks > 1 ? 's' : ''} on a 14+ day streak`,
    },
    newClients > 0 && {
      icon: Sparkles, color: T.sky,
      text: `${newClients} new client${newClients > 1 ? 's' : ''} joined this month`,
    },
    {
      icon: Lightbulb, color: T.emerald,
      text: 'Clients attending 2×/week retain 3× longer than 1×/week',
    },
  ].filter(Boolean).slice(0, 4);

  return (
    <div className="cis-card">
      <CardHead label="Insights" right={<Sparkles style={{ width: 12, height: 12, color: T.indigo }} />} />
      <div style={{ padding: '6px 8px' }}>
        {insights.map((ins, i) => {
          const Ic = ins.icon;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 10px', borderRadius: 10,
              transition: 'background .15s', cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.015)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${ins.color}10, transparent)`,
                border: `1px solid ${ins.color}16`,
              }}>
                <Ic style={{ width: 11, height: 11, color: ins.color }} />
              </div>
              <span style={{ fontSize: 12, color: T.t2, lineHeight: 1.55, flex: 1 }}>{ins.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RETENTION BREAKDOWN ─────────────────────────────────────────────────────
function RetentionBreakdown({ clients }) {
  const tiers = [
    { label: 'Healthy',  range: '80–100', count: clients.filter(c => c.retentionScore >= 80).length, color: T.emerald },
    { label: 'Stable',   range: '60–79',  count: clients.filter(c => c.retentionScore >= 60 && c.retentionScore < 80).length, color: T.t2 },
    { label: 'Caution',  range: '40–59',  count: clients.filter(c => c.retentionScore >= 40 && c.retentionScore < 60).length, color: T.amber },
    { label: 'At Risk',  range: '< 40',   count: clients.filter(c => c.retentionScore < 40).length, color: T.red },
  ];
  const total = clients.length || 1;

  return (
    <div className="cis-card" style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, marginBottom: 16, letterSpacing: '-.01em' }}>
        Retention Breakdown
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tiers.map(tier => {
          const pct = Math.round((tier.count / total) * 100);
          return (
            <div key={tier.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: tier.color,
                    boxShadow: `0 0 6px ${tier.color}30` }} />
                  <span style={{ fontSize: 11.5, color: T.t2, fontWeight: 500 }}>{tier.label}</span>
                  <Mono style={{ fontSize: 9, color: T.t4 }}>{tier.range}</Mono>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <Mono style={{ fontSize: 15, fontWeight: 700, color: tier.color }}>{tier.count}</Mono>
                  <Mono style={{ fontSize: 10, color: T.t4 }}>{pct}%</Mono>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: T.t5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: `linear-gradient(90deg, ${tier.color}80, ${tier.color})`,
                  width: `${pct}%`, transition: 'width .6s cubic-bezier(.16,1,.3,1)',
                  boxShadow: pct > 0 ? `0 0 8px ${tier.color}25` : 'none',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TOP PERFORMERS ──────────────────────────────────────────────────────────
function TopPerformers({ clients, onSelect }) {
  const top = [...clients].sort((a,b) => b.retentionScore - a.retentionScore).slice(0,3);
  if (top.length === 0) return null;

  return (
    <div className="cis-card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
        <Star style={{ width: 12, height: 12, color: T.amber }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: T.t1, letterSpacing: '-.01em' }}>Top Performers</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {top.map((c, i) => (
          <div key={c.id} onClick={() => onSelect(c)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
            transition: 'background .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Mono style={{ fontSize: 10, color: T.t4, width: 16 }}>{i+1}.</Mono>
            <Avatar name={c.name} src={c.avatar} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: 10, color: T.t3 }}>{c.sessionsThisMonth} sessions/mo</div>
            </div>
            <Mono style={{ fontSize: 16, fontWeight: 700, color: scoreColor(c.retentionScore) }}>
              {c.retentionScore}
            </Mono>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DROP PANEL ──────────────────────────────────────────────────────────────
const DROP_TABS = ['Overview','Performance','Notes','Injuries','Schedule','Actions'];

function DropPanel({ client, onClose }) {
  const [tab,setTab] = useState('Overview');
  const [noteVal,setNoteVal] = useState(client.notes);
  const [noteSaved,setNoteSaved] = useState(false);
  const [custom,setCustom] = useState('');
  const [preset,setPreset] = useState(null);
  const [sending,setSending] = useState(false);
  const [sent,setSent] = useState(false);
  const [injuries,setInjuries] = useState(client.injuries || []);
  const [addInj,setAddInj] = useState(false);
  const [injForm,setInjForm] = useState({ area:'', severity:'Monitor', note:'' });

  const fn = client.name.split(' ')[0];
  const isRisk = client.status === 'at_risk';
  const sc = scoreColor(client.retentionScore);
  const tier = scoreTier(client.retentionScore);
  const trend = trendOf(client.retentionHistory);
  const delta = client.sessionsThisMonth - client.sessionsLastMonth;
  const reasons = riskReason(client);
  const activeInj = injuries.filter(i => i.severity !== 'Cleared');
  const hasActiveInj = injuries.some(i => i.severity === 'Active');
  const message = preset ? (PRESETS.find(p => p.id === preset)?.text(fn) || '') : custom;

  useEffect(() => { setNoteVal(client.notes); setTab('Overview'); }, [client.id]);
  useEffect(() => { setAddInj(false); setPreset(null); }, [tab]);

  function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 900);
    setTimeout(() => { setSent(false); setCustom(''); setPreset(null); }, 2800);
  }
  function saveNote() { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2000); }
  function addInjury() {
    if (!injForm.area.trim()) return;
    const logged = new Date().toLocaleString('en-GB', { month:'short', year:'numeric' });
    setInjuries(p => [...p, { id: Date.now(), ...injForm, logged }]);
    setInjForm({ area:'', severity:'Monitor', note:'' });
    setAddInj(false);
  }

  const accent = isRisk ? T.red : T.indigo;

  return (
    <div className="c-sd" onClick={e => e.stopPropagation()} style={{
      borderTop: `1px solid ${isRisk ? T.redBdr : T.border}`,
      background: `linear-gradient(180deg, ${T.card}, ${T.surface})`,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={client.name} src={client.avatar} size={30} status={client.status} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.t1, letterSpacing: '-.01em' }}>{client.name}</span>
            <span style={{ fontSize: 10, color: T.t3, marginLeft: 8 }}>Since {client.joinDate}</span>
          </div>
          <Pill color={tier.color} bg={tier.bg} border={tier.bdr}>{tier.label}</Pill>
        </div>
        <button className="cis-btn" onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(255,255,255,.025)',
          border: `1px solid ${T.border}`, color: T.t3,
        }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, padding: '0 10px',
        background: 'rgba(255,255,255,.006)' }}>
        {DROP_TABS.map(t => {
          const isAct = tab === t;
          const badge = t === 'Injuries' ? activeInj.length : 0;
          return (
            <button key={t} className="cis-tab-btn" onClick={() => setTab(t)} style={{
              padding: '11px 15px', fontSize: 11.5,
              background: 'none',
              borderBottom: `2px solid ${isAct ? accent : 'transparent'}`,
              color: isAct ? accent : T.t3,
              fontWeight: isAct ? 700 : 500,
              display: 'flex', alignItems: 'center', gap: 5, marginBottom: -1,
            }}>
              {t}
              {badge > 0 && <Pill color={hasActiveInj ? T.red : T.amber} style={{ fontSize: 8, padding: '0 5px' }}>{badge}</Pill>}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '18px 22px' }}>
        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 22,
              padding: '16px 18px', borderRadius: 14, marginBottom: 16,
              background: `linear-gradient(135deg, ${sc}08, transparent)`,
              border: `1px solid ${sc}12`,
            }}>
              <div style={{ textAlign: 'center', minWidth: 60 }}>
                <Mono style={{ fontSize: 44, fontWeight: 700, color: sc, lineHeight: 1 }}>
                  {client.retentionScore}
                </Mono>
                <div style={{ fontSize: 9, color: sc, fontWeight: 700, marginTop: 5,
                  textTransform: 'uppercase', letterSpacing: '.06em' }}>{tier.label}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  {trend.dir === 'up' && <ArrowUpRight style={{ width: 13, height: 13, color: T.emerald }} />}
                  {trend.dir === 'down' && <ArrowDownRight style={{ width: 13, height: 13, color: T.red }} />}
                  {trend.dir === 'flat' && <Minus style={{ width: 13, height: 13, color: T.t3 }} />}
                  <span style={{ fontSize: 11.5, fontWeight: 700,
                    color: trend.dir === 'up' ? T.emerald : trend.dir === 'down' ? T.red : T.t3 }}>
                    {trend.dir === 'up' ? `+${trend.delta} pts — Improving`
                      : trend.dir === 'down' ? `${trend.delta} pts — Declining`
                      : 'Holding steady'}
                  </span>
                </div>
                <TrendLine data={client.retentionHistory} color={sc} w={220} h={34} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { l: 'Sessions / mo', v: client.sessionsThisMonth, c: delta > 0 ? T.emerald : delta < 0 ? T.red : T.t1 },
                { l: 'Monthly spend', v: `£${client.monthlySpend}`, c: T.t1 },
                { l: 'Streak', v: client.streak > 0 ? `${client.streak}d` : '—', c: client.streak >= 14 ? T.emerald : T.t1 },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: 12, textAlign: 'center',
                  background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
                }}>
                  <Mono style={{ fontSize: 20, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</Mono>
                  <Label style={{ marginTop: 6 }}>{s.l}</Label>
                </div>
              ))}
            </div>

            {isRisk && (
              <div style={{
                padding: '14px 16px', borderRadius: 12, marginBottom: 8,
                background: `linear-gradient(135deg, ${T.redDim}, transparent)`,
                border: `1px solid ${T.redBdr}`, borderLeft: `3px solid ${T.red}`,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <AlertTriangle style={{ width: 14, height: 14, color: T.red, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.red, marginBottom: 4 }}>High churn risk</div>
                  <div style={{ fontSize: 11.5, color: T.t3, lineHeight: 1.55 }}>
                    {reasons.join(' · ')}. A personal call beats any automated message.
                  </div>
                </div>
                <button className="cis-btn" onClick={() => setTab('Actions')} style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: `${T.red}10`, border: `1px solid ${T.red}20`,
                  color: T.red, fontSize: 10.5, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  Take action <ChevronRight style={{ width: 10, height: 10 }} />
                </button>
              </div>
            )}
            {client.streak >= 21 && (
              <div style={{
                padding: '13px 16px', borderRadius: 12,
                background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`,
                borderLeft: `3px solid ${T.emerald}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Flame style={{ width: 13, height: 13, color: T.amber, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: T.t2 }}>
                  <strong style={{ color: T.emerald }}>{client.streak}-day streak!</strong> Recognition drives retention.
                </span>
              </div>
            )}
            {!isRisk && client.streak < 21 && (
              <div style={{
                padding: '11px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.emerald}`,
                display: 'flex', alignItems: 'center', gap: 9,
              }}>
                <CheckCircle style={{ width: 12, height: 12, color: T.emerald, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, color: T.t3 }}>On track — no action needed right now.</span>
              </div>
            )}
          </div>
        )}

        {tab === 'Performance' && <ClientPerformancePanel clientId={client.id} clientName={client.name} />}

        {/* NOTES */}
        {tab === 'Notes' && (
          <div>
            <Label style={{ marginBottom: 10 }}>Coach Notes — Private</Label>
            <textarea className="cis-input" rows={5} value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              placeholder={`Add coaching notes for ${fn}…`}
              style={{ resize: 'vertical', lineHeight: 1.6 }} />
            <button className="cis-btn" onClick={saveNote} style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              borderRadius: 8, background: noteSaved ? T.emeraldDim : T.indigoDim,
              border: `1px solid ${noteSaved ? T.emeraldBdr : T.indigoBdr}`,
              color: noteSaved ? T.emerald : T.indigo, fontSize: 12, fontWeight: 600,
            }}>
              {noteSaved ? <><CheckCircle style={{ width: 12 }} /> Saved</> : <><Edit3 style={{ width: 12 }} /> Save Notes</>}
            </button>
            <div style={{ marginTop: 20 }}>
              <Label style={{ marginBottom: 10 }}>Quick Reference</Label>
              {[
                { l: 'Member since', v: client.joinDate },
                { l: 'Sessions / mo', v: client.sessionsThisMonth },
                { l: 'Last visit', v: client.lastVisit >= 999 ? 'Never' : client.lastVisit === 0 ? 'Today' : `${client.lastVisit}d ago` },
                { l: 'Streak', v: client.streak > 0 ? `${client.streak}d` : '—' },
              ].map((r, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '9px 0',
                  borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <span style={{ fontSize: 11.5, color: T.t3 }}>{r.l}</span>
                  <Mono style={{ fontSize: 11.5, fontWeight: 600, color: T.t1 }}>{r.v}</Mono>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INJURIES */}
        {tab === 'Injuries' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <Label>Injury & Limitation Log</Label>
                {activeInj.length > 0 && (
                  <div style={{ fontSize: 11, color: hasActiveInj ? T.red : T.amber, fontWeight: 600, marginTop: 4 }}>
                    {activeInj.length} active restriction{activeInj.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <button className="cis-btn" onClick={() => setAddInj(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
                borderRadius: 8, background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
                color: T.indigo, fontSize: 11.5, fontWeight: 600,
              }}>
                <Plus style={{ width: 11 }} /> Log
              </button>
            </div>

            {addInj && (
              <div style={{
                padding: 16, borderRadius: 12, marginBottom: 14,
                background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.indigo}`,
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input className="cis-input" value={injForm.area}
                    onChange={e => setInjForm(f => ({ ...f, area: e.target.value }))}
                    placeholder="Body area (e.g. Left Knee)"
                    style={{ flex: 1, padding: '9px 13px' }} />
                  <select className="cis-select" value={injForm.severity}
                    onChange={e => setInjForm(f => ({ ...f, severity: e.target.value }))}>
                    {['Active','Monitor','Mild','Cleared'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <textarea className="cis-input" rows={2} value={injForm.note}
                  onChange={e => setInjForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Describe the limitation…" style={{ marginBottom: 12, lineHeight: 1.5 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="cis-btn" onClick={addInjury} style={{
                    flex: 1, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: T.indigo, color: '#fff',
                  }}>Save</button>
                  <button className="cis-btn" onClick={() => setAddInj(false)} style={{
                    padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: 'rgba(255,255,255,.03)', border: `1px solid ${T.border}`, color: T.t3,
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {injuries.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', borderRadius: 14,
                background: 'rgba(255,255,255,.012)', border: `1px solid ${T.border}` }}>
                <Shield style={{ width: 20, height: 20, color: T.t3, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: T.t2, fontWeight: 600, margin: '0 0 4px' }}>No injuries logged</p>
                <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>{fn} has no active restrictions on file.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {injuries.map(inj => {
                  const s = SEV[inj.severity] || SEV.Mild;
                  return (
                    <div key={inj.id} style={{
                      padding: '13px 16px', borderRadius: 12,
                      background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
                      borderLeft: `3px solid ${s.color}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: T.t1, flex: 1 }}>{inj.area}</span>
                        <Pill color={s.color} bg={s.dim} border={s.bdr}>{inj.severity}</Pill>
                        <button className="cis-btn" onClick={() => setInjuries(p => p.filter(i => i.id !== inj.id))}
                          style={{ width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', background: 'transparent', color: T.t3 }}
                          onMouseEnter={e => e.currentTarget.style.color = T.red}
                          onMouseLeave={e => e.currentTarget.style.color = T.t3}>
                          <Trash2 style={{ width: 11 }} />
                        </button>
                      </div>
                      {inj.note && <p style={{ fontSize: 11.5, color: T.t2, margin: '0 0 5px', lineHeight: 1.55 }}>{inj.note}</p>}
                      <span style={{ fontSize: 10, color: T.t3 }}>Logged {inj.logged}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SCHEDULE */}
        {tab === 'Schedule' && (
          <div>
            {client.nextSession ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderRadius: 12, marginBottom: 14,
                background: `linear-gradient(135deg, ${T.indigoDim}, transparent)`,
                border: `1px solid ${T.indigoBdr}`,
              }}>
                <Calendar style={{ width: 15, height: 15, color: T.indigo, flexShrink: 0 }} />
                <div>
                  <Label style={{ marginBottom: 3 }}>Next session</Label>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.t1 }}>{client.nextSession}</div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '13px 16px', borderRadius: 12, marginBottom: 14,
                background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.t4}`,
              }}>
                <p style={{ fontSize: 12, color: T.t2, margin: 0, fontWeight: 600 }}>
                  No upcoming sessions booked.
                </p>
              </div>
            )}
            {client.upcomingClasses?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {client.upcomingClasses.map((cls, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.indigo }} />
                    <span style={{ flex: 1, fontSize: 12, color: T.t1 }}>{cls}</span>
                    <Label>Booked</Label>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { l: 'This Month', v: client.sessionsThisMonth, c: T.t1 },
                { l: 'Last Month', v: client.sessionsLastMonth, c: T.t2 },
                { l: 'Change', v: `${delta >= 0 ? '+' : ''}${delta}`, c: delta >= 0 ? T.emerald : T.red },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '12px', borderRadius: 12, textAlign: 'center',
                  background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
                }}>
                  <Mono style={{ fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</Mono>
                  <Label style={{ marginTop: 5 }}>{s.l}</Label>
                </div>
              ))}
            </div>
            <button className="cis-btn" style={{
              width: '100%', padding: '11px', borderRadius: 10,
              background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
              color: T.indigo, fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <Calendar style={{ width: 13 }} /> Book into a Class
            </button>
          </div>
        )}

        {/* ACTIONS */}
        {tab === 'Actions' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { icon: Phone,    label: 'Call',    color: T.emerald },
                { icon: Calendar, label: 'Book',    color: T.indigo },
                { icon: Dumbbell, label: 'Workout', color: T.amber },
              ].map(({ icon: Ic, label, color }, i) => (
                <button key={i} className="cis-btn" style={{
                  flex: '1 1 auto', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 7, padding: '11px 16px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${color}08, transparent)`,
                  border: `1px solid ${color}18`,
                  color, fontSize: 12, fontWeight: 600,
                }}>
                  <Ic style={{ width: 13 }} /> {label}
                </button>
              ))}
            </div>

            <Label style={{ marginBottom: 10 }}>Send Message to {fn}</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {PRESETS.map(p => (
                <button key={p.id} className="cis-btn" onClick={() => setPreset(v => v === p.id ? null : p.id)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  background: preset === p.id ? T.indigoDim : 'rgba(255,255,255,.025)',
                  border: `1px solid ${preset === p.id ? T.indigoBdr : T.border}`,
                  color: preset === p.id ? T.indigo : T.t3,
                }}>{p.label}</button>
              ))}
            </div>

            {preset ? (
              <div style={{
                marginBottom: 14, padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.indigo}`,
                fontSize: 12.5, color: T.t2, lineHeight: 1.6,
              }}>{message}</div>
            ) : (
              <textarea className="cis-input" rows={3} value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder={`Write a message to ${fn}…`}
                style={{ marginBottom: 14, lineHeight: 1.5 }} />
            )}

            <button className="cis-btn" onClick={handleSend}
              disabled={!message.trim() || sending || sent} style={{
                width: '100%', padding: '11px', borderRadius: 10,
                background: sent ? T.emeraldDim : !message.trim() ? 'rgba(255,255,255,.025)' : T.indigo,
                border: `1px solid ${sent ? T.emeraldBdr : !message.trim() ? T.border : T.indigoBdr}`,
                color: sent ? T.emerald : !message.trim() ? T.t3 : '#fff',
                fontSize: 12, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
              {sent ? <><CheckCircle style={{ width: 13 }} /> Sent</> :
                sending ? 'Sending…' :
                <><Send style={{ width: 13 }} /> Send to {fn}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CLIENT ROW ───────────────────────────────────────────────────────────────
function ClientRow({ client, isOpen, onToggle }) {
  const isRisk   = client.status === 'at_risk';
  const isPaused = client.status === 'paused';
  const sc       = scoreColor(client.retentionScore);
  const trend    = trendOf(client.retentionHistory);
  const delta    = client.sessionsThisMonth - client.sessionsLastMonth;
  const reasons  = riskReason(client);
  const activeInj = (client.injuries || []).filter(i => i.severity !== 'Cleared').length;
  const hasActive = (client.injuries || []).some(i => i.severity === 'Active');

  const lastVisitLabel = client.lastVisit === 0 ? 'Today'
    : client.lastVisit === 1 ? 'Yesterday'
    : client.lastVisit >= 999 ? 'Never'
    : `${client.lastVisit}d ago`;
  const lastVisitColor = client.lastVisit === 0 ? T.emerald
    : client.lastVisit > 14 ? T.red : client.lastVisit > 7 ? T.amber : T.t2;

  return (
    <div className="cis-card" style={{
      borderLeft: isRisk && !isOpen ? `2px solid ${T.red}` : `2px solid transparent`,
    }}>
      <div className="cis-row" onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px',
      }}>
        <Avatar name={client.name} src={client.avatar} size={40} status={client.status} />

        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, letterSpacing: '-.02em' }}>
              {client.name}
            </span>
            {client.isNew && <Pill color={T.sky} bg={T.skyDim} border={T.skyBdr}>New</Pill>}
            {isRisk && <Pill color={T.red} bg={T.redDim} border={T.redBdr} glow>At Risk</Pill>}
            {isPaused && <Pill color={T.t3}>Paused</Pill>}
            {client.streak >= 14 && (
              <span style={{ fontSize: 10, color: T.amber, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Flame style={{ width: 10, height: 10 }} /> {client.streak}d
              </span>
            )}
            {activeInj > 0 && (
              <span style={{ fontSize: 10, fontWeight: 600,
                color: hasActive ? T.red : T.amber, display: 'flex', alignItems: 'center', gap: 3 }}>
                <ShieldAlert style={{ width: 10, height: 10 }} /> {activeInj}
              </span>
            )}
          </div>
          {isRisk && reasons.length > 0 ? (
            <div style={{ fontSize: 11, color: T.red, fontWeight: 500 }}>{reasons[0]}</div>
          ) : (
            <div style={{ fontSize: 11, color: T.t3 }}>{client.goal}</div>
          )}
        </div>

        <div style={{ flex: '0 0 72px', textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: lastVisitColor }}>{lastVisitLabel}</div>
          <Label style={{ marginTop: 3 }}>Last visit</Label>
        </div>

        <div style={{ flex: '0 0 65px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
            <Mono style={{ fontSize: 15, fontWeight: 700, color: T.t1 }}>{client.sessionsThisMonth}</Mono>
            {delta !== 0 && (
              <Mono style={{ fontSize: 10, fontWeight: 700, color: delta > 0 ? T.emerald : T.red }}>
                {delta > 0 ? '+' : ''}{delta}
              </Mono>
            )}
          </div>
          <Label style={{ marginTop: 3 }}>Sessions</Label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '0 0 140px', justifyContent: 'flex-end' }}>
          <TrendLine data={client.retentionHistory} color={sc} w={68} h={26} />
          <div style={{ textAlign: 'right', minWidth: 38 }}>
            <Mono style={{ fontSize: 24, fontWeight: 700, color: sc, lineHeight: 1 }}>
              {client.retentionScore}
            </Mono>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 3 }}>
              {trend.dir === 'up' && <ArrowUpRight style={{ width: 9, height: 9, color: T.emerald }} />}
              {trend.dir === 'down' && <ArrowDownRight style={{ width: 9, height: 9, color: T.red }} />}
              <span style={{ fontSize: 8, fontWeight: 700, color: T.t4, textTransform: 'uppercase' }}>
                {trend.dir}
              </span>
            </div>
          </div>
        </div>

        <div className="cis-row-actions" style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {[
            { icon: MessageCircle, tip: 'Message', color: T.indigo },
            { icon: Calendar,      tip: 'Book',    color: T.emerald },
            { icon: Dumbbell,      tip: 'Workout', color: T.amber },
          ].map(({ icon: Ic, tip, color }, i) => (
            <button key={i} className="cis-btn cis-tooltip" data-tip={tip}
              onClick={e => e.stopPropagation()}
              style={{
                width: 32, height: 32, borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: `linear-gradient(135deg, ${color}08, transparent)`,
                border: `1px solid ${color}14`, color,
              }}>
              <Ic style={{ width: 13, height: 13 }} />
            </button>
          ))}
        </div>

        <ChevronDown style={{
          width: 14, height: 14, flexShrink: 0,
          color: isOpen ? T.indigo : T.t4,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform .25s cubic-bezier(.16,1,.3,1), color .15s',
        }} />
      </div>

      {isOpen && <DropPanel client={client} onClose={onToggle} />}
    </div>
  );
}

// ─── PENDING ROW ──────────────────────────────────────────────────────────────
function PendingClientRow({ invite, onCancel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="cis-card" style={{ borderLeft: `2px solid ${T.indigo}`, opacity: 0.75 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 20px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.indigoDim}, transparent)`,
          border: `1px solid ${T.indigoBdr}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: T.indigo,
        }}>{ini(invite.member_name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 3 }}>{invite.member_name}</div>
          <div style={{ fontSize: 11, color: T.t3 }}>Invite sent · awaiting response</div>
        </div>
        <Pill color={T.indigo} bg={T.indigoDim} border={T.indigoBdr}>Pending</Pill>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button className="cis-btn" onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{
              width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'rgba(255,255,255,.025)',
              border: `1px solid ${T.border}`, color: T.t3,
            }}>
            <MoreHorizontal style={{ width: 13 }} />
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 100,
                background: T.card, border: `1px solid ${T.borderA}`,
                borderRadius: 12, overflow: 'hidden', minWidth: 150,
                boxShadow: '0 12px 40px rgba(0,0,0,.5)',
              }}>
                <button className="cis-btn" onClick={() => { setMenuOpen(false); onCancel(invite); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 16px', background: 'transparent',
                    color: T.red, fontSize: 12, fontWeight: 600, textAlign: 'left',
                  }}>
                  <XCircle style={{ width: 13 }} /> Cancel Invite
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ onAddClient }) {
  const steps = [
    { icon: UserPlus, label: 'Add your first client', desc: 'Invite clients to connect with your coaching profile', onClick: onAddClient, color: T.indigo },
    { icon: Upload,   label: 'Import client list',    desc: 'Bulk import from a spreadsheet or CSV file', color: T.sky },
    { icon: Calendar, label: 'Create first session',  desc: 'Set up a class or 1:1 session to get started', color: T.emerald },
  ];

  return (
    <div className="c-fu" style={{
      padding: '56px 36px', textAlign: 'center', borderRadius: 20,
      background: `linear-gradient(180deg, ${T.surface}, ${T.bg})`,
      border: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 18, margin: '0 auto 22px',
        background: `linear-gradient(135deg, ${T.indigoDim}, transparent)`,
        border: `1px solid ${T.indigoBdr}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Users style={{ width: 26, height: 26, color: T.indigo }} />
      </div>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: T.t1, margin: '0 0 8px', letterSpacing: '-.03em' }}>
        Build Your Client Intelligence
      </h3>
      <p style={{ fontSize: 13.5, color: T.t3, margin: '0 0 36px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Clients appear here automatically when members book your classes, or you can add them directly.
      </p>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 640, margin: '0 auto' }}>
        {steps.map((step, i) => {
          const Ic = step.icon;
          return (
            <div key={i} className="c-fu" style={{
              flex: '1 1 180px', maxWidth: 200,
              padding: '22px 18px', borderRadius: 16, textAlign: 'center',
              background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`,
              animationDelay: `${i * .1}s`,
              cursor: 'pointer', transition: 'all .2s cubic-bezier(.16,1,.3,1)',
            }}
              onClick={step.onClick}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${step.color}25`; e.currentTarget.style.background = `${step.color}05`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'rgba(255,255,255,.015)'; e.currentTarget.style.transform = 'none'; }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12, margin: '0 auto 14px',
                background: `linear-gradient(135deg, ${step.color}10, transparent)`,
                border: `1px solid ${step.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic style={{ width: 16, height: 16, color: step.color }} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.t1, marginBottom: 5 }}>{step.label}</div>
              <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.55 }}>{step.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function TabCoachMembers({ openModal = () => {}, coach = null, bookings = [], checkIns = [], avatarMap = {}, now = new Date() }) {
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('risk');
  const [openId,       setOpenId]       = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const coachId = coach?.id || coach?.user_id;
  const queryClient = useQueryClient();

  useEffect(() => {
    const h = () => setShowAddModal(true);
    window.addEventListener('coachOpenAddClient', h);
    return () => window.removeEventListener('coachOpenAddClient', h);
  }, []);

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['coachInvitesForCoach', coachId, 'pending'],
    queryFn: () => base44.entities.CoachInvite.filter({ coach_id: coachId, status: 'pending' }, '-created_date', 50),
    enabled: !!coachId, staleTime: 30000, refetchInterval: 30000,
  });

  const { data: acceptedInvites = [] } = useQuery({
    queryKey: ['coachInvitesForCoach', coachId, 'accepted'],
    queryFn: () => base44.entities.CoachInvite.filter({ coach_id: coachId, status: 'accepted' }, '-created_date', 100),
    enabled: !!coachId, staleTime: 30000, refetchInterval: 30000,
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (invite) => base44.entities.CoachInvite.delete(invite.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coachInvitesForCoach'] }),
  });

  const allClients = useMemo(() => {
    const byClient = {};
    bookings.forEach(b => {
      if (!b.client_id) return;
      if (!byClient[b.client_id]) byClient[b.client_id] = { name: b.client_name || 'Client', bookings: [] };
      byClient[b.client_id].bookings.push(b);
    });
    acceptedInvites.forEach(invite => {
      if (!byClient[invite.member_id]) byClient[invite.member_id] = { name: invite.member_name || 'Client', bookings: [] };
    });
    return Object.entries(byClient).map(([userId, { name, bookings: clientBookings }]) => ({
      ...buildClientFromBookings(userId, name, clientBookings, checkIns, now),
      avatar: avatarMap?.[userId] || null,
    }));
  }, [bookings, acceptedInvites, checkIns, avatarMap, now]);

  const acceptedMemberIds = allClients.map(c => c.id);
  const pendingMemberIds  = pendingInvites.map(i => i.member_id);
  const atRiskCount = allClients.filter(c => c.status === 'at_risk').length;
  const newCount = allClients.filter(c => c.isNew).length;
  const inactiveCount = allClients.filter(c => c.lastVisit >= 14 || c.lastVisit >= 999).length;
  const highValueCount = allClients.filter(c => c.retentionScore >= 80).length;

  const FILTERS = [
    { id: 'all',        label: 'All Clients',  count: allClients.length + pendingInvites.length },
    { id: 'at_risk',    label: 'At Risk',       count: atRiskCount,     urgent: true },
    { id: 'high_value', label: 'High Value',    count: highValueCount },
    { id: 'inactive',   label: 'Inactive',      count: inactiveCount },
    { id: 'new',        label: 'New',           count: newCount },
  ];

  const visible = useMemo(() => {
    let list = [...allClients];
    if (filter === 'at_risk')    list = list.filter(c => c.status === 'at_risk');
    if (filter === 'high_value') list = list.filter(c => c.retentionScore >= 80);
    if (filter === 'inactive')   list = list.filter(c => c.lastVisit >= 14 || c.lastVisit >= 999);
    if (filter === 'new')        list = list.filter(c => c.isNew);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.goal.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q)));
    }
    if (sortBy === 'risk')      list.sort((a,b) => a.retentionScore - b.retentionScore);
    if (sortBy === 'score')     list.sort((a,b) => b.retentionScore - a.retentionScore);
    if (sortBy === 'lastVisit') list.sort((a,b) => b.lastVisit - a.lastVisit);
    if (sortBy === 'name')      list.sort((a,b) => a.name.localeCompare(b.name));
    return list;
  }, [allClients, filter, search, sortBy]);

  const showPending = filter === 'all';

  function openClient(c) {
    setOpenId(c.id);
    setTimeout(() => {
      document.getElementById(`cr-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 40);
  }

  const hasClients = allClients.length > 0 || pendingInvites.length > 0;

  return (
    <div className="cis" style={{ background: T.bg, minHeight: '100vh', position: 'relative' }}>
      <BackgroundOrbs />
      <AddClientModal
        open={showAddModal} onClose={() => setShowAddModal(false)}
        coach={coach} existingClientIds={acceptedMemberIds} pendingClientIds={pendingMemberIds}
      />

      <div className="cis-root-pad" style={{
        position: 'relative', zIndex: 1, maxWidth: 1360, margin: '0 auto',
        padding: '32px 32px 80px',
      }}>
        {/* Page Header */}
        <div className="c-fu" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${T.border}`,
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.t1, margin: 0, letterSpacing: '-.04em' }}>
              Client Intelligence
            </h1>
            <p style={{ fontSize: 13, color: T.t3, margin: '6px 0 0', fontWeight: 400 }}>
              {allClients.length} client{allClients.length !== 1 ? 's' : ''} · Last updated just now
            </p>
          </div>
          <button className="cis-btn" onClick={() => setShowAddModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 10,
            background: `linear-gradient(135deg, ${T.indigo}, #6366f1)`,
            color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: `0 2px 16px ${T.indigo}30, 0 0 40px ${T.indigo}10`,
          }}>
            <UserPlus style={{ width: 15, height: 15 }} /> Add Client
          </button>
        </div>

        {!hasClients ? (
          <EmptyState onAddClient={() => setShowAddModal(true)} />
        ) : (
          <>
            <HealthOverview clients={allClients} />
            <PriorityClients clients={allClients} onSelect={openClient} />

            {/* Controls Row */}
            <div className="cis-controls c-fu c-d3" style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap',
            }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  width: 14, height: 14, color: T.t3, pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, goal, or class…"
                  className="cis-input" style={{ paddingLeft: 40, paddingRight: 38 }} />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: T.t3, display: 'flex', padding: 0,
                  }}>
                    <X style={{ width: 14 }} />
                  </button>
                )}
              </div>
              <div style={{
                display: 'flex', gap: 2, padding: '3px',
                background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}`, borderRadius: 10,
              }}>
                {[
                  { id: 'risk', label: 'Priority' }, { id: 'score', label: 'Score' },
                  { id: 'lastVisit', label: 'Last Seen' }, { id: 'name', label: 'Name' },
                ].map(s => (
                  <button key={s.id} className="cis-btn" onClick={() => setSortBy(s.id)} style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 11.5,
                    fontWeight: sortBy === s.id ? 700 : 500,
                    background: sortBy === s.id ? T.indigoDim : 'transparent',
                    border: `1px solid ${sortBy === s.id ? T.indigoBdr : 'transparent'}`,
                    color: sortBy === s.id ? T.indigo : T.t3, whiteSpace: 'nowrap',
                  }}>{s.label}</button>
                ))}
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={{
              display: 'flex', gap: 2, marginBottom: 18,
              borderBottom: `1px solid ${T.border}`,
            }}>
              {FILTERS.map(f => {
                const isAct = filter === f.id;
                const isUrg = f.urgent && f.count > 0;
                const accent = isAct ? (isUrg ? T.red : T.indigo) : T.t3;
                return (
                  <button key={f.id} className="cis-tab-btn" onClick={() => setFilter(f.id)} style={{
                    padding: '11px 18px', fontSize: 12,
                    background: 'none',
                    borderBottom: `2px solid ${isAct ? accent : 'transparent'}`,
                    color: accent, fontWeight: isAct ? 700 : 500,
                    display: 'flex', alignItems: 'center', gap: 7, marginBottom: -1, whiteSpace: 'nowrap',
                  }}>
                    {f.label}
                    {f.count > 0 && (
                      <Mono style={{
                        fontSize: 10, fontWeight: 700,
                        background: isAct ? (isUrg ? T.redDim : T.indigoDim) : 'rgba(255,255,255,.03)',
                        color: isAct ? accent : T.t3,
                        padding: '2px 8px', borderRadius: 99,
                        border: `1px solid ${isAct ? (isUrg ? T.redBdr : T.indigoBdr) : 'transparent'}`,
                      }}>{f.count}</Mono>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Main Grid */}
            <div className="cis-grid" style={{
              display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 16,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Column headers */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '0 20px 6px', color: T.t4,
                }}>
                  <span style={{ width: 40 }} />
                  <Label style={{ flex: '1 1 180px' }}>Client</Label>
                  <Label style={{ flex: '0 0 72px', textAlign: 'center' }}>Last Visit</Label>
                  <Label style={{ flex: '0 0 65px', textAlign: 'center' }}>Sessions</Label>
                  <Label style={{ flex: '0 0 140px', textAlign: 'right' }}>Engagement</Label>
                  <span style={{ width: 112 }} />
                  <span style={{ width: 14 }} />
                </div>

                {showPending && pendingInvites.map(invite => (
                  <PendingClientRow key={invite.id} invite={invite} onCancel={cancelInviteMutation.mutate} />
                ))}

                {visible.length === 0 && (!showPending || pendingInvites.length === 0) ? (
                  <div style={{
                    padding: 44, textAlign: 'center', borderRadius: 16,
                    background: T.surface, border: `1px solid ${T.border}`,
                  }}>
                    <Search style={{ width: 22, height: 22, color: T.t3, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, color: T.t2, fontWeight: 600, margin: '0 0 5px' }}>
                      {allClients.length === 0 ? 'No clients yet' : 'No clients match this filter'}
                    </p>
                    <p style={{ fontSize: 12, color: T.t3, margin: 0 }}>
                      {allClients.length === 0 ? 'Clients appear here when members book your classes' : 'Try adjusting your search or filter'}
                    </p>
                  </div>
                ) : (
                  <>
                    {visible.map((c, i) => (
                      <div key={c.id} id={`cr-${c.id}`} className="c-fu" style={{ animationDelay: `${Math.min(i * .04, .3)}s` }}>
                        <ClientRow client={c} isOpen={openId === c.id}
                          onToggle={() => setOpenId(p => p === c.id ? null : c.id)} />
                      </div>
                    ))}
                    <p style={{ textAlign: 'center', fontSize: 11, color: T.t3, margin: '12px 0 0', paddingBottom: 24 }}>
                      <Mono style={{ fontSize: 11 }}>{visible.length}</Mono> clients
                      {showPending && pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''}
                    </p>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="cis-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>
                <InsightsPanel clients={allClients} />
                <RetentionBreakdown clients={visible.length > 0 ? visible : allClients} />
                <TopPerformers clients={allClients} onSelect={openClient} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}