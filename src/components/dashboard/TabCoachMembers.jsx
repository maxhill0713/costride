import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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

// ─── INJECT CSS ───────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('cis-css')) {
  const s = document.createElement('style');
  s.id = 'cis-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .cis { font-family: 'Instrument Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }

    @keyframes cisFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
    @keyframes cisSlideIn { from { opacity:0; transform:translateX(-6px) } to { opacity:1; transform:none } }
    @keyframes cisPulse { 0%,100% { opacity:.6 } 50% { opacity:1 } }
    @keyframes cisShimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } }
    @keyframes cisGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0) } 50% { box-shadow: 0 0 0 4px rgba(239,68,68,.08) } }

    .cis-fade { animation: cisFadeUp .3s cubic-bezier(.4,0,.2,1) both; }
    .cis-slide { animation: cisSlideIn .25s cubic-bezier(.4,0,.2,1) both; }
    .cis-pulse { animation: cisPulse 2s ease infinite; }
    .cis-glow { animation: cisGlow 2.5s ease infinite; }

    .cis-btn { font-family: 'Instrument Sans', sans-serif; cursor: pointer; outline: none;
               transition: all .15s cubic-bezier(.4,0,.2,1); border: none; }
    .cis-btn:active { transform: scale(.97); }

    .cis-row { transition: all .15s cubic-bezier(.4,0,.2,1); cursor: pointer; position: relative; }
    .cis-row:hover { background: rgba(255,255,255,.018) !important; }
    .cis-row:hover .cis-row-actions { opacity: 1; pointer-events: auto; }
    .cis-row-actions { opacity: 0; pointer-events: none; transition: opacity .15s; }

    .cis-input { width: 100%; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
                 color: #e2e8f0; font-size: 13px; font-family: 'Instrument Sans', sans-serif;
                 outline: none; border-radius: 10px; padding: 10px 14px;
                 transition: all .15s; }
    .cis-input:focus { border-color: rgba(99,102,241,.4); background: rgba(255,255,255,.04);
                       box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
    .cis-input::placeholder { color: rgba(148,163,184,.4); }

    .cis-select { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06);
                  color: #e2e8f0; font-size: 12px; font-family: 'Instrument Sans', sans-serif;
                  outline: none; border-radius: 8px; padding: 8px 12px; cursor: pointer;
                  appearance: none; }

    .cis-scrollbar::-webkit-scrollbar { width: 4px; }
    .cis-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .cis-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 99px; }

    .cis-tooltip { position: relative; }
    .cis-tooltip::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 6px);
      left: 50%; transform: translateX(-50%); background: #1e293b; color: #e2e8f0;
      font-size: 11px; padding: 5px 10px; border-radius: 6px; white-space: nowrap;
      opacity: 0; pointer-events: none; transition: opacity .15s; z-index: 50;
      border: 1px solid rgba(255,255,255,.08); }
    .cis-tooltip:hover::after { opacity: 1; }

    @media (max-width: 1024px) {
      .cis-grid { grid-template-columns: 1fr !important; }
      .cis-sidebar { display: none !important; }
      .cis-health-grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
    @media (max-width: 640px) {
      .cis-health-grid { grid-template-columns: 1fr !important; }
      .cis-controls { flex-direction: column !important; }
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

  t1: '#f1f5f9',
  t2: '#94a3b8',
  t3: '#475569',
  t4: '#1e293b',

  // Semantic
  emerald:    '#10b981',
  emeraldDim: 'rgba(16,185,129,.08)',
  emeraldBdr: 'rgba(16,185,129,.18)',

  indigo:    '#6366f1',
  indigoDim: 'rgba(99,102,241,.08)',
  indigoBdr: 'rgba(99,102,241,.18)',

  amber:    '#f59e0b',
  amberDim: 'rgba(245,158,11,.07)',
  amberBdr: 'rgba(245,158,11,.16)',

  red:      '#ef4444',
  redDim:   'rgba(239,68,68,.07)',
  redBdr:   'rgba(239,68,68,.16)',

  sky:      '#38bdf8',
  skyDim:   'rgba(56,189,248,.07)',
  skyBdr:   'rgba(56,189,248,.16)',

  mono: "'JetBrains Mono', monospace",
};

// ─── PRIMITIVES ───────────────────────────────────────────────────────────────
function Avatar({ name = '?', size = 36, src = null, status }) {
  const [imgFail, setImgFail] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const statusColors = { active: T.emerald, at_risk: T.red, paused: T.amber };
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 12, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(99,102,241,.12), rgba(99,102,241,.04))',
        border: '1px solid rgba(99,102,241,.15)',
        fontSize: size * .32, fontWeight: 700, color: T.indigo, letterSpacing: '-.02em',
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
        }} />
      )}
    </div>
  );
}

function Pill({ children, color = T.t3, bg, border, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color,
      background: bg || `${color}0d`, border: `1px solid ${border || `${color}22`}`,
      borderRadius: 6, padding: '2px 8px', letterSpacing: '.02em',
      textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: '16px',
      ...style,
    }}>{children}</span>
  );
}

function Mono({ children, style }) {
  return (
    <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 500, letterSpacing: '-.02em', ...style }}>
      {children}
    </span>
  );
}

// ─── HEALTH BAR VIZ ───────────────────────────────────────────────────────────
function HealthBar({ segments, height = 6 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div style={{ display: 'flex', gap: 2, height, borderRadius: 99, overflow: 'hidden' }}>
      {segments.map((seg, i) => (
        <div key={i} style={{
          flex: seg.value / total,
          background: seg.color,
          borderRadius: 99,
          minWidth: seg.value > 0 ? 4 : 0,
          transition: 'flex .4s cubic-bezier(.4,0,.2,1)',
        }} />
      ))}
    </div>
  );
}

// ─── MINI TREND CHART ─────────────────────────────────────────────────────────
function TrendLine({ data = [], color = T.indigo, w = 80, h = 28 }) {
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), rng = (max - min) || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    4 + (1 - (v - min) / rng) * (h - 8),
  ]);
  const line = pts.map(p => p.join(',')).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
      style={{ display: 'block', overflow: 'visible', flexShrink: 0 }}>
      <polygon points={area} fill={`${color}08`} />
      <polyline points={line} stroke={color} strokeWidth="1.5"
        fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
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
  if (s >= 60) return { label: 'Stable',  color: T.t2,      bg: 'rgba(148,163,184,.06)', bdr: 'rgba(148,163,184,.12)' };
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

  // Determine if "new" (joined within last 30 days)
  const joinDateRaw = firstBooking ? new Date(firstBooking.session_date || firstBooking.created_date) : null;
  const isNew = joinDateRaw && (now_ - joinDateRaw.getTime()) < msMonth;

  return {
    id: userId,
    name: clientName || 'Client',
    email: '', phone: '',
    tier: 'Standard',
    status,
    goal: 'General Fitness',
    retentionScore: score,
    retentionHistory,
    sessionsThisMonth,
    sessionsLastMonth,
    lastVisit: lastVisitDays === 999 ? 999 : lastVisitDays,
    streak,
    consecutiveMissed: noShows.length,
    joinDate: firstBooking ? new Date(firstBooking.session_date || firstBooking.created_date).toLocaleDateString('en-GB', {month:'short', year:'numeric'}) : '—',
    membership: 'Class Booking',
    monthlySpend: 0,
    tags: [],
    notes: '',
    isNew,
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

// ─── HEALTH OVERVIEW SECTION ─────────────────────────────────────────────────
function HealthOverview({ clients }) {
  const healthy  = clients.filter(c => c.retentionScore >= 80).length;
  const stable   = clients.filter(c => c.retentionScore >= 60 && c.retentionScore < 80).length;
  const caution  = clients.filter(c => c.retentionScore >= 40 && c.retentionScore < 60).length;
  const atRisk   = clients.filter(c => c.retentionScore < 40).length;
  const total    = clients.length || 1;
  const avgScore = Math.round(clients.reduce((s,c) => s + c.retentionScore, 0) / total);

  // Trend: compare current avg to what it was ~4 weeks ago via histories
  const prevAvg = Math.round(clients.reduce((s,c) => {
    const h = c.retentionHistory;
    return s + (h && h.length >= 5 ? h[h.length - 5] : c.retentionScore);
  }, 0) / total);
  const trendDelta = avgScore - prevAvg;
  const trendDir = trendDelta > 2 ? 'up' : trendDelta < -2 ? 'down' : 'flat';

  const improving = clients.filter(c => { const t = trendOf(c.retentionHistory); return t.dir === 'up'; }).length;
  const declining = clients.filter(c => { const t = trendOf(c.retentionHistory); return t.dir === 'down'; }).length;

  return (
    <div className="cis-fade" style={{ marginBottom: 20 }}>
      <div className="cis-health-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
        {/* Overall Score */}
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: `linear-gradient(135deg, ${T.surface}, ${T.card})`,
          border: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120,
            background: `radial-gradient(circle at top right, ${scoreColor(avgScore)}06, transparent 70%)`,
          }} />
          <div style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em',
            textTransform: 'uppercase', marginBottom: 12 }}>Portfolio Health</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: T.mono, fontSize: 38, fontWeight: 700,
              color: scoreColor(avgScore), lineHeight: 1, letterSpacing: '-.04em' }}>
              {avgScore || '—'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {trendDir === 'up' && <ArrowUpRight style={{ width: 13, height: 13, color: T.emerald }} />}
              {trendDir === 'down' && <ArrowDownRight style={{ width: 13, height: 13, color: T.red }} />}
              {trendDir !== 'flat' && (
                <span style={{ fontSize: 12, fontWeight: 700,
                  color: trendDir === 'up' ? T.emerald : T.red }}>
                  {trendDelta > 0 ? '+' : ''}{trendDelta}
                </span>
              )}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <HealthBar height={5} segments={[
              { value: healthy, color: T.emerald },
              { value: stable,  color: T.t3 },
              { value: caution, color: T.amber },
              { value: atRisk,  color: T.red },
            ]} />
          </div>
        </div>

        {/* Healthy */}
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: T.surface, border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.emerald }} />
            <span style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em',
              textTransform: 'uppercase' }}>Healthy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700, color: T.t1,
              lineHeight: 1, letterSpacing: '-.03em' }}>{healthy}</span>
            <span style={{ fontSize: 12, color: T.t3 }}>/ {total}</span>
          </div>
          <div style={{ fontSize: 11, color: T.t3, marginTop: 6 }}>
            {Math.round((healthy / total) * 100)}% of clients
          </div>
        </div>

        {/* Needs Attention */}
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: atRisk > 0 ? T.redDim : T.surface,
          border: `1px solid ${atRisk > 0 ? T.redBdr : T.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.red }} />
            <span style={{ fontSize: 10, color: atRisk > 0 ? T.red : T.t3, fontWeight: 600,
              letterSpacing: '.06em', textTransform: 'uppercase' }}>Need Outreach</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: T.mono, fontSize: 32, fontWeight: 700,
              color: atRisk > 0 ? T.red : T.t1, lineHeight: 1, letterSpacing: '-.03em' }}>
              {atRisk}
            </span>
          </div>
          <div style={{ fontSize: 11, color: atRisk > 0 ? T.red : T.t3, marginTop: 6, fontWeight: atRisk > 0 ? 600 : 400 }}>
            {atRisk > 0 ? 'Action required this week' : 'No at-risk clients'}
          </div>
        </div>

        {/* Momentum */}
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: T.surface, border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 10, color: T.t3, fontWeight: 600, letterSpacing: '.06em',
            textTransform: 'uppercase', marginBottom: 12 }}>Momentum</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <ArrowUpRight style={{ width: 11, height: 11, color: T.emerald }} />
                <span style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.emerald }}>{improving}</span>
              </div>
              <span style={{ fontSize: 10, color: T.t3 }}>Improving</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <ArrowDownRight style={{ width: 11, height: 11, color: T.red }} />
                <span style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: T.red }}>{declining}</span>
              </div>
              <span style={{ fontSize: 10, color: T.t3 }}>Declining</span>
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
    <div className="cis-fade" style={{ marginBottom: 20, animationDelay: '.05s' }}>
      <div style={{
        borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${T.redBdr}`,
        background: `linear-gradient(135deg, ${T.redDim}, ${T.surface})`,
      }}>
        <div style={{
          padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${T.redBdr}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="cis-glow" style={{
              width: 8, height: 8, borderRadius: '50%', background: T.red, flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.t1 }}>Priority Outreach</span>
            <Pill color={T.red}>{priority.length} client{priority.length > 1 ? 's' : ''}</Pill>
          </div>
          <span style={{ fontSize: 10, color: T.t3 }}>Sorted by urgency</span>
        </div>

        <div style={{ padding: '6px' }}>
          {priority.map((client, i) => {
            const reasons = riskReason(client);
            const action = suggestedAction(client);
            const ActionIcon = action.icon;
            return (
              <div key={client.id}
                className="cis-row"
                onClick={() => onSelect(client)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 10,
                  animationDelay: `${i * .05}s`,
                }}>
                <Avatar name={client.name} src={client.avatar} size={36} status={client.status} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.t1, marginBottom: 3 }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: T.red, fontWeight: 500 }}>
                    {reasons[0] || 'Low engagement'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginRight: 8 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700,
                    color: scoreColor(client.retentionScore) }}>{client.retentionScore}</span>
                </div>
                <button className="cis-btn" onClick={e => { e.stopPropagation(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', borderRadius: 8,
                    background: `${action.color}12`, border: `1px solid ${action.color}25`,
                    color: action.color, fontSize: 11, fontWeight: 700, flexShrink: 0,
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

// ─── CLIENT INSIGHTS PANEL ───────────────────────────────────────────────────
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
      action: 'Review now',
    },
    avgSessions > 0 && {
      icon: BarChart3, color: T.indigo,
      text: `Average ${avgSessions} sessions/month across your roster`,
    },
    highStreaks > 0 && {
      icon: Flame, color: T.amber,
      text: `${highStreaks} client${highStreaks > 1 ? 's' : ''} on a 14+ day streak — celebrate them`,
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
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: T.surface, border: `1px solid ${T.border}`,
    }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 7 }}>
        <Sparkles style={{ width: 12, height: 12, color: T.indigo }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t1, letterSpacing: '.02em' }}>Insights</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        {insights.map((ins, i) => {
          const Ic = ins.icon;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 8px', borderRadius: 8,
              transition: 'background .12s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${ins.color}0d`, border: `1px solid ${ins.color}1a`,
              }}>
                <Ic style={{ width: 11, height: 11, color: ins.color }} />
              </div>
              <span style={{ fontSize: 12, color: T.t2, lineHeight: 1.5, flex: 1 }}>{ins.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RETENTION BREAKDOWN SIDEBAR ─────────────────────────────────────────────
function RetentionBreakdown({ clients }) {
  const tiers = [
    { label: 'Healthy',  range: '80–100', count: clients.filter(c => c.retentionScore >= 80).length, color: T.emerald },
    { label: 'Stable',   range: '60–79',  count: clients.filter(c => c.retentionScore >= 60 && c.retentionScore < 80).length, color: T.t2 },
    { label: 'Caution',  range: '40–59',  count: clients.filter(c => c.retentionScore >= 40 && c.retentionScore < 60).length, color: T.amber },
    { label: 'At Risk',  range: '< 40',   count: clients.filter(c => c.retentionScore < 40).length, color: T.red },
  ];
  const total = clients.length || 1;

  return (
    <div style={{
      borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`,
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.t1, marginBottom: 14, letterSpacing: '.02em' }}>
        Retention Breakdown
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tiers.map(tier => {
          const pct = Math.round((tier.count / total) * 100);
          return (
            <div key={tier.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: tier.color }} />
                  <span style={{ fontSize: 11, color: T.t2 }}>{tier.label}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 9, color: T.t3 }}>{tier.range}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: tier.color }}>
                    {tier.count}
                  </span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t3 }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.04)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99, background: tier.color,
                  width: `${pct}%`, transition: 'width .5s cubic-bezier(.4,0,.2,1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TOP PERFORMER SIDEBAR ────────────────────────────────────────────────────
function TopPerformers({ clients, onSelect }) {
  const top = [...clients].sort((a,b) => b.retentionScore - a.retentionScore).slice(0,3);
  if (top.length === 0) return null;

  return (
    <div style={{
      borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <Star style={{ width: 11, height: 11, color: T.amber }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.t1, letterSpacing: '.02em' }}>Top Performers</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {top.map((c, i) => (
          <div key={c.id} onClick={() => onSelect(c)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
            transition: 'background .12s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.025)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.t3, width: 14 }}>{i+1}.</span>
            <Avatar name={c.name} src={c.avatar} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.t1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: 10, color: T.t3 }}>{c.sessionsThisMonth} sessions/mo</div>
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 700,
              color: scoreColor(c.retentionScore) }}>{c.retentionScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DROP PANEL (DETAIL VIEW) ────────────────────────────────────────────────
const DROP_TABS = ['Overview','Notes','Injuries','Schedule','Actions'];

function DropPanel({ client, onClose }) {
  const [tab,      setTab]      = useState('Overview');
  const [noteVal,  setNoteVal]  = useState(client.notes);
  const [noteSaved,setNoteSaved]= useState(false);
  const [custom,   setCustom]   = useState('');
  const [preset,   setPreset]   = useState(null);
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [injuries, setInjuries] = useState(client.injuries || []);
  const [addInj,   setAddInj]   = useState(false);
  const [injForm,  setInjForm]  = useState({ area:'', severity:'Monitor', note:'' });

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

  return (
    <div className="cis-slide" onClick={e => e.stopPropagation()} style={{
      borderTop: `1px solid ${isRisk ? T.redBdr : T.border}`,
      background: T.card,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={client.name} src={client.avatar} size={28} status={client.status} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.t1 }}>{client.name}</span>
            <span style={{ fontSize: 10, color: T.t3, marginLeft: 8 }}>Since {client.joinDate}</span>
          </div>
          <Pill color={tier.color} bg={tier.bg} border={tier.bdr}>{tier.label}</Pill>
        </div>
        <button className="cis-btn" onClick={onClose} style={{
          width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(255,255,255,.03)',
          border: `1px solid ${T.border}`, color: T.t3,
        }}>
          <X style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, padding: '0 8px' }}>
        {DROP_TABS.map(t => {
          const isAct = tab === t;
          const accent = isRisk ? T.red : T.indigo;
          const badge = t === 'Injuries' ? activeInj.length : 0;
          return (
            <button key={t} className="cis-btn" onClick={() => setTab(t)} style={{
              padding: '10px 14px', fontSize: 11,
              background: 'none',
              borderBottom: `2px solid ${isAct ? accent : 'transparent'}`,
              color: isAct ? accent : T.t3,
              fontWeight: isAct ? 700 : 500,
              display: 'flex', alignItems: 'center', gap: 5,
              marginBottom: -1,
            }}>
              {t}
              {badge > 0 && <Pill color={hasActiveInj ? T.red : T.amber} style={{ fontSize: 8, padding: '0 5px' }}>{badge}</Pill>}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: '16px 20px' }}>

        {/* OVERVIEW */}
        {tab === 'Overview' && (
          <div>
            {/* Score + Trend */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '14px 16px', borderRadius: 12, marginBottom: 14,
              background: `${sc}06`, border: `1px solid ${sc}15`,
            }}>
              <div style={{ textAlign: 'center', minWidth: 56 }}>
                <div style={{ fontFamily: T.mono, fontSize: 40, fontWeight: 700, color: sc,
                  lineHeight: 1, letterSpacing: '-.04em' }}>{client.retentionScore}</div>
                <div style={{ fontSize: 9, color: sc, fontWeight: 700, marginTop: 4,
                  textTransform: 'uppercase', letterSpacing: '.06em' }}>{tier.label}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  {trend.dir === 'up' && <ArrowUpRight style={{ width: 12, height: 12, color: T.emerald }} />}
                  {trend.dir === 'down' && <ArrowDownRight style={{ width: 12, height: 12, color: T.red }} />}
                  {trend.dir === 'flat' && <Minus style={{ width: 12, height: 12, color: T.t3 }} />}
                  <span style={{ fontSize: 11, fontWeight: 700,
                    color: trend.dir === 'up' ? T.emerald : trend.dir === 'down' ? T.red : T.t3 }}>
                    {trend.dir === 'up' ? `+${trend.delta} pts — Improving`
                      : trend.dir === 'down' ? `${trend.delta} pts — Declining`
                      : 'Holding steady'}
                  </span>
                </div>
                <TrendLine data={client.retentionHistory} color={sc} w={200} h={32} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { l: 'Sessions / mo', v: client.sessionsThisMonth, c: delta > 0 ? T.emerald : delta < 0 ? T.red : T.t1 },
                { l: 'Monthly spend', v: `£${client.monthlySpend}`, c: T.t1 },
                { l: 'Streak', v: client.streak > 0 ? `${client.streak}d` : '—', c: client.streak >= 14 ? T.emerald : T.t1 },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: 10, textAlign: 'center',
                  background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontFamily: T.mono, fontSize: 18, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Contextual nudge */}
            {isRisk && (
              <div style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 6,
                background: T.redDim, border: `1px solid ${T.redBdr}`,
                borderLeft: `3px solid ${T.red}`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <AlertTriangle style={{ width: 13, height: 13, color: T.red, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 3 }}>High churn risk</div>
                  <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5 }}>
                    {reasons.join(' · ')}. A personal call beats any automated message.
                  </div>
                </div>
                <button className="cis-btn" onClick={() => setTab('Actions')} style={{
                  padding: '5px 12px', borderRadius: 7,
                  background: `${T.red}15`, border: `1px solid ${T.red}25`,
                  color: T.red, fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                }}>
                  Take action <ChevronRight style={{ width: 10, height: 10 }} />
                </button>
              </div>
            )}
            {client.streak >= 21 && (
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: T.emeraldDim, border: `1px solid ${T.emeraldBdr}`,
                borderLeft: `3px solid ${T.emerald}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Flame style={{ width: 13, height: 13, color: T.amber, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: T.t2, flex: 1 }}>
                  <strong style={{ color: T.emerald }}>{client.streak}-day streak!</strong> Recognition drives retention.
                </span>
              </div>
            )}
            {!isRisk && client.streak < 21 && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.emerald}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <CheckCircle style={{ width: 12, height: 12, color: T.emerald, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: T.t3 }}>On track — no action needed right now.</span>
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {tab === 'Notes' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase',
              letterSpacing: '.07em', marginBottom: 10 }}>Coach Notes — Private</div>
            <textarea className="cis-input" rows={5} value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              placeholder={`Add coaching notes for ${fn}…`}
              style={{ resize: 'vertical', lineHeight: 1.6 }} />
            <button className="cis-btn" onClick={saveNote} style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, background: noteSaved ? T.emeraldDim : T.indigoDim,
              border: `1px solid ${noteSaved ? T.emeraldBdr : T.indigoBdr}`,
              color: noteSaved ? T.emerald : T.indigo, fontSize: 12, fontWeight: 700,
            }}>
              {noteSaved ? <><CheckCircle style={{ width: 12, height: 12 }} /> Saved</> : <><Edit3 style={{ width: 12, height: 12 }} /> Save Notes</>}
            </button>
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase',
                letterSpacing: '.07em', marginBottom: 10 }}>Quick Reference</div>
              {[
                { l: 'Member since', v: client.joinDate },
                { l: 'Sessions / mo', v: client.sessionsThisMonth },
                { l: 'Last visit', v: client.lastVisit >= 999 ? 'Never' : client.lastVisit === 0 ? 'Today' : `${client.lastVisit}d ago` },
                { l: 'Streak', v: client.streak > 0 ? `${client.streak}d` : '—' },
              ].map((r, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                  borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <span style={{ fontSize: 11, color: T.t3 }}>{r.l}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.t1 }}>{r.v}</span>
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
                <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  Injury & Limitation Log
                </div>
                {activeInj.length > 0 && (
                  <div style={{ fontSize: 11, color: hasActiveInj ? T.red : T.amber, fontWeight: 600, marginTop: 3 }}>
                    {activeInj.length} active restriction{activeInj.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <button className="cis-btn" onClick={() => setAddInj(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 8, background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
                color: T.indigo, fontSize: 11, fontWeight: 700,
              }}>
                <Plus style={{ width: 11, height: 11 }} /> Log
              </button>
            </div>

            {addInj && (
              <div style={{
                padding: 14, borderRadius: 10, marginBottom: 14,
                background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.indigo}`,
              }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="cis-input" value={injForm.area}
                    onChange={e => setInjForm(f => ({ ...f, area: e.target.value }))}
                    placeholder="Body area (e.g. Left Knee)"
                    style={{ flex: 1, padding: '8px 12px' }} />
                  <select className="cis-select" value={injForm.severity}
                    onChange={e => setInjForm(f => ({ ...f, severity: e.target.value }))}>
                    {['Active','Monitor','Mild','Cleared'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <textarea className="cis-input" rows={2} value={injForm.note}
                  onChange={e => setInjForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Describe the limitation…" style={{ marginBottom: 10, lineHeight: 1.5 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="cis-btn" onClick={addInjury} style={{
                    flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    background: T.indigo, color: '#fff',
                  }}>Save</button>
                  <button className="cis-btn" onClick={() => setAddInj(false)} style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'rgba(255,255,255,.04)', border: `1px solid ${T.border}`, color: T.t3,
                  }}>Cancel</button>
                </div>
              </div>
            )}

            {injuries.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', borderRadius: 12,
                background: 'rgba(255,255,255,.015)', border: `1px solid ${T.border}` }}>
                <Shield style={{ width: 20, height: 20, color: T.t3, margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: T.t2, fontWeight: 600, margin: '0 0 4px' }}>No injuries logged</p>
                <p style={{ fontSize: 11, color: T.t3, margin: 0 }}>{fn} has no active restrictions on file.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {injuries.map(inj => {
                  const s = SEV[inj.severity] || SEV.Mild;
                  return (
                    <div key={inj.id} style={{
                      padding: '12px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                      borderLeft: `3px solid ${s.color}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.t1, flex: 1 }}>{inj.area}</span>
                        <Pill color={s.color} bg={s.dim} border={s.bdr}>{inj.severity}</Pill>
                        <button className="cis-btn" onClick={() => setInjuries(p => p.filter(i => i.id !== inj.id))}
                          style={{ width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', background: 'transparent', color: T.t3 }}
                          onMouseEnter={e => e.currentTarget.style.color = T.red}
                          onMouseLeave={e => e.currentTarget.style.color = T.t3}>
                          <Trash2 style={{ width: 11, height: 11 }} />
                        </button>
                      </div>
                      {inj.note && <p style={{ fontSize: 11, color: T.t2, margin: '0 0 4px', lineHeight: 1.55 }}>{inj.note}</p>}
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
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: 10, marginBottom: 12,
                background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
              }}>
                <Calendar style={{ width: 14, height: 14, color: T.indigo, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 10, color: T.t3, fontWeight: 600, marginBottom: 2 }}>Next session</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.t1 }}>{client.nextSession}</div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 12,
                background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
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
                    padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.indigo }} />
                    <span style={{ flex: 1, fontSize: 12, color: T.t1 }}>{cls}</span>
                    <span style={{ fontSize: 9, color: T.t3, fontWeight: 700, textTransform: 'uppercase' }}>Booked</span>
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
                  padding: '10px', borderRadius: 10, textAlign: 'center',
                  background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                }}>
                  <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <button className="cis-btn" style={{
              width: '100%', padding: '10px', borderRadius: 10,
              background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
              color: T.indigo, fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <Calendar style={{ width: 13, height: 13 }} /> Book into a Class
            </button>
          </div>
        )}

        {/* ACTIONS */}
        {tab === 'Actions' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { icon: Phone,    label: 'Call',    color: T.emerald },
                { icon: Calendar, label: 'Book',    color: T.indigo },
                { icon: Dumbbell, label: 'Workout', color: T.amber },
              ].map(({ icon: Ic, label, color }, i) => (
                <button key={i} className="cis-btn" style={{
                  flex: '1 1 auto', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6, padding: '10px 14px', borderRadius: 10,
                  background: `${color}0a`, border: `1px solid ${color}20`,
                  color, fontSize: 12, fontWeight: 700,
                }}>
                  <Ic style={{ width: 13, height: 13 }} /> {label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: T.t3, textTransform: 'uppercase',
              letterSpacing: '.07em', marginBottom: 10 }}>Send Message to {fn}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {PRESETS.map(p => (
                <button key={p.id} className="cis-btn" onClick={() => setPreset(v => v === p.id ? null : p.id)} style={{
                  padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                  background: preset === p.id ? T.indigoDim : 'rgba(255,255,255,.03)',
                  border: `1px solid ${preset === p.id ? T.indigoBdr : T.border}`,
                  color: preset === p.id ? T.indigo : T.t3,
                }}>{p.label}</button>
              ))}
            </div>

            {preset ? (
              <div style={{
                marginBottom: 12, padding: '12px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.indigo}`,
                fontSize: 12, color: T.t2, lineHeight: 1.6,
              }}>{message}</div>
            ) : (
              <textarea className="cis-input" rows={3} value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder={`Write a message to ${fn}…`}
                style={{ marginBottom: 12, lineHeight: 1.5 }} />
            )}

            <button className="cis-btn" onClick={handleSend}
              disabled={!message.trim() || sending || sent} style={{
                width: '100%', padding: '10px', borderRadius: 10,
                background: sent ? T.emeraldDim : !message.trim() ? 'rgba(255,255,255,.03)' : T.indigo,
                border: `1px solid ${sent ? T.emeraldBdr : !message.trim() ? T.border : T.indigoBdr}`,
                color: sent ? T.emerald : !message.trim() ? T.t3 : '#fff',
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
              {sent ? <><CheckCircle style={{ width: 13, height: 13 }} /> Sent</> :
                sending ? 'Sending…' :
                <><Send style={{ width: 13, height: 13 }} /> Send to {fn}</>}
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
  const tier     = scoreTier(client.retentionScore);
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
    : client.lastVisit > 14 ? T.red
    : client.lastVisit > 7 ? T.amber
    : T.t3;

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 14, overflow: 'hidden',
      borderLeft: isRisk && !isOpen ? `3px solid ${T.red}` : `3px solid transparent`,
      transition: 'border-color .2s',
    }}>
      <div className="cis-row" onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
      }}>
        <Avatar name={client.name} src={client.avatar} size={38} status={client.status} />

        {/* Name column */}
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: T.t1, letterSpacing: '-.02em' }}>
              {client.name}
            </span>
            {client.isNew && <Pill color={T.sky} bg={T.skyDim} border={T.skyBdr}>New</Pill>}
            {isRisk && <Pill color={T.red} bg={T.redDim} border={T.redBdr}>At Risk</Pill>}
            {isPaused && <Pill color={T.t3}>Paused</Pill>}
            {client.streak >= 14 && (
              <span style={{ fontSize: 10, color: T.amber, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Flame style={{ width: 10, height: 10 }} /> {client.streak}d
              </span>
            )}
            {activeInj > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700,
                color: hasActive ? T.red : T.amber,
                display: 'flex', alignItems: 'center', gap: 3 }}>
                <ShieldAlert style={{ width: 10, height: 10 }} /> {activeInj}
              </span>
            )}
          </div>
          {isRisk && reasons.length > 0 && (
            <div style={{ fontSize: 11, color: T.red, fontWeight: 500, opacity: .9 }}>
              {reasons[0]}
            </div>
          )}
          {!isRisk && (
            <div style={{ fontSize: 11, color: T.t3 }}>
              {client.goal}
            </div>
          )}
        </div>

        {/* Last Visit */}
        <div style={{ flex: '0 0 70px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: lastVisitColor }}>{lastVisitLabel}</div>
          <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>Last visit</div>
        </div>

        {/* Sessions */}
        <div style={{ flex: '0 0 65px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
            <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: T.t1 }}>
              {client.sessionsThisMonth}
            </span>
            {delta !== 0 && (
              <span style={{ fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                color: delta > 0 ? T.emerald : T.red }}>
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>
          <div style={{ fontSize: 9, color: T.t3, textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>Sessions</div>
        </div>

        {/* Trend + Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 130px', justifyContent: 'flex-end' }}>
          <TrendLine data={client.retentionHistory} color={sc} w={64} h={24} />
          <div style={{ textAlign: 'right', minWidth: 36 }}>
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: sc,
              lineHeight: 1, letterSpacing: '-.04em' }}>{client.retentionScore}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, marginTop: 3 }}>
              {trend.dir === 'up' && <ArrowUpRight style={{ width: 9, height: 9, color: T.emerald }} />}
              {trend.dir === 'down' && <ArrowDownRight style={{ width: 9, height: 9, color: T.red }} />}
              <span style={{ fontSize: 8, fontWeight: 700, color: T.t3, textTransform: 'uppercase' }}>
                {trend.dir}
              </span>
            </div>
          </div>
        </div>

        {/* Inline actions (visible on hover) */}
        <div className="cis-row-actions" style={{
          display: 'flex', gap: 4, flexShrink: 0,
        }}>
          {[
            { icon: MessageCircle, tip: 'Message', color: T.indigo },
            { icon: Calendar,      tip: 'Book',    color: T.emerald },
            { icon: Dumbbell,      tip: 'Workout', color: T.amber },
          ].map(({ icon: Ic, tip, color }, i) => (
            <button key={i} className="cis-btn cis-tooltip" data-tip={tip}
              onClick={e => e.stopPropagation()}
              style={{
                width: 30, height: 30, borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: `${color}0a`, border: `1px solid ${color}18`, color,
              }}>
              <Ic style={{ width: 13, height: 13 }} />
            </button>
          ))}
        </div>

        <ChevronDown style={{
          width: 14, height: 14, flexShrink: 0,
          color: isOpen ? T.indigo : T.t4,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform .2s ease, color .15s',
        }} />
      </div>

      {isOpen && <DropPanel client={client} onClose={onToggle} />}
    </div>
  );
}

// ─── PENDING CLIENT ROW ───────────────────────────────────────────────────────
function PendingClientRow({ invite, onCancel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ini = (n = '') => (n || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14,
      overflow: 'hidden', borderLeft: `3px solid ${T.indigo}`, opacity: 0.8,
      position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: T.indigo,
        }}>{ini(invite.member_name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.t1, marginBottom: 3 }}>{invite.member_name}</div>
          <div style={{ fontSize: 11, color: T.t3 }}>Invite sent · awaiting response</div>
        </div>
        <Pill color={T.indigo} bg={T.indigoDim} border={T.indigoBdr}>Pending</Pill>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button className="cis-btn" onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
            style={{
              width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'rgba(255,255,255,.03)',
              border: `1px solid ${T.border}`, color: T.t3,
            }}>
            <MoreHorizontal style={{ width: 13, height: 13 }} />
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100,
                background: T.card, border: `1px solid ${T.borderA}`,
                borderRadius: 10, overflow: 'hidden', minWidth: 140,
                boxShadow: '0 12px 32px rgba(0,0,0,.5)',
              }}>
                <button className="cis-btn" onClick={() => { setMenuOpen(false); onCancel(invite); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', background: 'transparent',
                    color: T.red, fontSize: 12, fontWeight: 700, textAlign: 'left',
                  }}>
                  <XCircle style={{ width: 13, height: 13 }} /> Cancel Invite
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
    { icon: UserPlus, label: 'Add your first client', desc: 'Invite clients to connect with your coaching profile', action: 'Add Client', onClick: onAddClient, color: T.indigo },
    { icon: Upload,   label: 'Import client list',    desc: 'Bulk import from a spreadsheet or CSV file',          action: 'Import',     color: T.sky },
    { icon: Calendar, label: 'Create first session',  desc: 'Set up a class or 1:1 session to get started',       action: 'Create',     color: T.emerald },
  ];

  return (
    <div className="cis-fade" style={{
      padding: '48px 32px', textAlign: 'center', borderRadius: 16,
      background: `linear-gradient(180deg, ${T.surface}, ${T.bg})`,
      border: `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, margin: '0 auto 20px',
        background: T.indigoDim, border: `1px solid ${T.indigoBdr}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Users style={{ width: 24, height: 24, color: T.indigo }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: T.t1, margin: '0 0 6px', letterSpacing: '-.02em' }}>
        Build Your Client Intelligence
      </h3>
      <p style={{ fontSize: 13, color: T.t3, margin: '0 0 32px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Clients appear here automatically when members book your classes, or you can add them directly.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 600, margin: '0 auto' }}>
        {steps.map((step, i) => {
          const Ic = step.icon;
          return (
            <div key={i} className="cis-fade" style={{
              flex: '1 1 170px', maxWidth: 200,
              padding: '20px 16px', borderRadius: 14, textAlign: 'center',
              background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
              animationDelay: `${i * .08}s`,
              cursor: 'pointer', transition: 'border-color .15s, background .15s',
            }}
              onClick={step.onClick}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${step.color}30`; e.currentTarget.style.background = `${step.color}06`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'rgba(255,255,255,.02)'; }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, margin: '0 auto 12px',
                background: `${step.color}0d`, border: `1px solid ${step.color}1a`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic style={{ width: 16, height: 16, color: step.color }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.t1, marginBottom: 4 }}>{step.label}</div>
              <div style={{ fontSize: 11, color: T.t3, lineHeight: 1.5 }}>{step.desc}</div>
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

  // Listen for external trigger to open add client modal (from coach top bar)
  useEffect(() => {
    const h = () => setShowAddModal(true);
    window.addEventListener('coachOpenAddClient', h);
    return () => window.removeEventListener('coachOpenAddClient', h);
  }, []);

  const { data: pendingInvites = [] } = useQuery({
    queryKey: ['coachInvitesForCoach', coachId, 'pending'],
    queryFn: () => base44.entities.CoachInvite.filter({ coach_id: coachId, status: 'pending' }, '-created_date', 50),
    enabled: !!coachId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const { data: acceptedInvites = [] } = useQuery({
    queryKey: ['coachInvitesForCoach', coachId, 'accepted'],
    queryFn: () => base44.entities.CoachInvite.filter({ coach_id: coachId, status: 'accepted' }, '-created_date', 100),
    enabled: !!coachId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const cancelInviteMutation = useMutation({
    mutationFn: (invite) => base44.entities.CoachInvite.delete(invite.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coachInvitesForCoach'] }),
  });

  const allClients = useMemo(() => {
    // Build from bookings
    const byClient = {};
    bookings.forEach(b => {
      if (!b.client_id) return;
      if (!byClient[b.client_id]) byClient[b.client_id] = { name: b.client_name || 'Client', bookings: [] };
      byClient[b.client_id].bookings.push(b);
    });

    // Also include accepted invite members who haven't booked yet
    acceptedInvites.forEach(invite => {
      if (!byClient[invite.member_id]) {
        byClient[invite.member_id] = { name: invite.member_name || 'Client', bookings: [] };
      }
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
    { id: 'all',       label: 'All Clients',  count: allClients.length + pendingInvites.length },
    { id: 'at_risk',   label: 'At Risk',       count: atRiskCount,     urgent: true },
    { id: 'high_value',label: 'High Value',    count: highValueCount },
    { id: 'inactive',  label: 'Inactive',      count: inactiveCount },
    { id: 'new',       label: 'New',           count: newCount },
  ];

  const visible = useMemo(() => {
    let list = [...allClients];
    if (filter === 'at_risk')    list = list.filter(c => c.status === 'at_risk');
    if (filter === 'high_value') list = list.filter(c => c.retentionScore >= 80);
    if (filter === 'inactive')   list = list.filter(c => c.lastVisit >= 14 || c.lastVisit >= 999);
    if (filter === 'new')        list = list.filter(c => c.isNew);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.goal.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
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
    <div className="cis" style={{ background: T.bg, minHeight: '100vh', padding: '24px' }}>
      <AddClientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        coach={coach}
        existingClientIds={acceptedMemberIds}
        pendingClientIds={pendingMemberIds}
      />

      {/* Page Header */}
      <div className="cis-fade" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: T.t1, margin: 0, letterSpacing: '-.03em' }}>
            Client Intelligence
          </h1>
          <p style={{ fontSize: 12, color: T.t3, margin: '4px 0 0' }}>
            {allClients.length} client{allClients.length !== 1 ? 's' : ''} · Last updated just now
          </p>
        </div>
        <button className="cis-btn" onClick={() => setShowAddModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10,
          background: T.indigo, color: '#fff', fontSize: 13, fontWeight: 700,
          boxShadow: '0 2px 12px rgba(99,102,241,.25)',
        }}>
          <UserPlus style={{ width: 14, height: 14 }} /> Add Client
        </button>
      </div>

      {!hasClients ? (
        <EmptyState onAddClient={() => setShowAddModal(true)} />
      ) : (
        <>
          {/* Health Overview */}
          <HealthOverview clients={allClients} />

          {/* Priority Outreach */}
          <PriorityClients clients={allClients} onSelect={openClient} />

          {/* Controls Row */}
          <div className="cis-controls cis-fade" style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
            flexWrap: 'wrap', animationDelay: '.1s',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <Search style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                width: 14, height: 14, color: T.t3, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, goal, or class…"
                className="cis-input"
                style={{ paddingLeft: 38, paddingRight: 36 }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.06)'} />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: T.t3,
                  display: 'flex', padding: 0,
                }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div style={{
              display: 'flex', gap: 2, padding: '3px',
              background: 'rgba(255,255,255,.02)', border: `1px solid ${T.border}`,
              borderRadius: 10,
            }}>
              {[
                { id: 'risk',      label: 'Priority' },
                { id: 'score',     label: 'Score' },
                { id: 'lastVisit', label: 'Last Seen' },
                { id: 'name',      label: 'Name' },
              ].map(s => (
                <button key={s.id} className="cis-btn" onClick={() => setSortBy(s.id)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 11,
                  fontWeight: sortBy === s.id ? 700 : 500,
                  background: sortBy === s.id ? T.indigoDim : 'transparent',
                  border: `1px solid ${sortBy === s.id ? T.indigoBdr : 'transparent'}`,
                  color: sortBy === s.id ? T.indigo : T.t3,
                  whiteSpace: 'nowrap',
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Filter Tabs */}
          <div style={{
            display: 'flex', gap: 2, marginBottom: 16,
            borderBottom: `1px solid ${T.border}`, paddingBottom: 0,
          }}>
            {FILTERS.map(f => {
              const isAct = filter === f.id;
              const isUrg = f.urgent && f.count > 0;
              const accent = isAct ? (isUrg ? T.red : T.indigo) : T.t3;
              return (
                <button key={f.id} className="cis-btn" onClick={() => setFilter(f.id)} style={{
                  padding: '10px 16px', fontSize: 12,
                  background: 'none',
                  borderBottom: `2px solid ${isAct ? accent : 'transparent'}`,
                  color: accent,
                  fontWeight: isAct ? 700 : 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: -1,
                  whiteSpace: 'nowrap',
                }}>
                  {f.label}
                  {f.count > 0 && (
                    <span style={{
                      fontFamily: T.mono, fontSize: 10, fontWeight: 700,
                      background: isAct ? (isUrg ? T.redDim : T.indigoDim) : 'rgba(255,255,255,.04)',
                      color: isAct ? accent : T.t3,
                      padding: '1px 7px', borderRadius: 99,
                    }}>{f.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Main Grid */}
          <div className="cis-grid" style={{
            display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 16,
          }}>
            {/* Client List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Column headers */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '0 18px 8px', fontSize: 9, fontWeight: 700,
                color: T.t3, textTransform: 'uppercase', letterSpacing: '.08em',
              }}>
                <span style={{ width: 38 }} />
                <span style={{ flex: '1 1 180px' }}>Client</span>
                <span style={{ flex: '0 0 70px', textAlign: 'center' }}>Last Visit</span>
                <span style={{ flex: '0 0 65px', textAlign: 'center' }}>Sessions</span>
                <span style={{ flex: '0 0 130px', textAlign: 'right' }}>Engagement</span>
                <span style={{ width: 106 }} />
                <span style={{ width: 14 }} />
              </div>

              {showPending && pendingInvites.map(invite => (
                <PendingClientRow key={invite.id} invite={invite} onCancel={cancelInviteMutation.mutate} />
              ))}

              {visible.length === 0 && (!showPending || pendingInvites.length === 0) ? (
                <div style={{
                  padding: 40, textAlign: 'center', borderRadius: 14,
                  background: T.surface, border: `1px solid ${T.border}`,
                }}>
                  <Search style={{ width: 20, height: 20, color: T.t3, margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 14, color: T.t2, fontWeight: 600, margin: '0 0 4px' }}>
                    {allClients.length === 0 ? 'No clients yet' : 'No clients match this filter'}
                  </p>
                  <p style={{ fontSize: 12, color: T.t3, margin: 0 }}>
                    {allClients.length === 0 ? 'Clients appear here when members book your classes' : 'Try adjusting your search or filter'}
                  </p>
                </div>
              ) : (
                <>
                  {visible.map((c, i) => (
                    <div key={c.id} id={`cr-${c.id}`} className="cis-fade" style={{ animationDelay: `${Math.min(i * .03, .3)}s` }}>
                      <ClientRow
                        client={c}
                        isOpen={openId === c.id}
                        onToggle={() => setOpenId(p => p === c.id ? null : c.id)}
                      />
                    </div>
                  ))}
                  <p style={{ textAlign: 'center', fontSize: 11, color: T.t3, margin: '10px 0 0', paddingBottom: 20 }}>
                    <span style={{ fontFamily: T.mono }}>{visible.length}</span> clients
                    {showPending && pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ''}
                  </p>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="cis-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InsightsPanel clients={allClients} />
              <RetentionBreakdown clients={visible.length > 0 ? visible : allClients} />
              <TopPerformers clients={allClients} onSelect={openClient} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}